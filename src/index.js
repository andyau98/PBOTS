const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// 載入配置和工具
const configPath = path.join(__dirname, '../configs/settings.json');
let config = {};

// 載入工具模組
const MessageLogger = require('../tools/messageLogger');
const SecurityManager = require('../tools/securityManager');
const MediaDownloader = require('../tools/mediaDownloader');
const ImageToPdf = require('../tools/imageToPdf');
const CleanupManager = require('../tools/cleanup');
const ContextManager = require('../tools/contextManager');
const ContextStandardizer = require('../tools/contextStandardizer');

let messageLogger;
let securityManager;
let mediaDownloader;
let imageToPdf;
let contextManager;
let contextStandardizer;
let cleanupManager;
let healthMonitor;
try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    console.log('✅ 配置檔案載入成功');
} catch (error) {
    console.log('⚠️ 配置檔案載入失敗，使用預設配置');
    config = {
        bot: { name: 'EngineeringBot' },
        logging: { enabled: true, level: 'info' },
        features: { 
            qr_login: true, 
            persistent_session: true, 
            basic_commands: true,
            reply_in_group: true 
        },
        message_logging: {
            enabled: true,
            format: 'json',
            save_path: './data/chats'
        },
        commands: {
            ping: { enabled: true, response: 'pong', permission: 'basic' },
            help: { 
                enabled: true, 
                message: '可用命令: !ping - 測試機器人響應, !help - 顯示幫助訊息, !stats - 查看今日統計數據, !mediastats - 查看媒體統計, !security - 查看安全狀態（僅管理員）',
                permission: 'basic'
            },
            stats: { enabled: true, description: '查看今日統計數據', permission: 'authorized' },
            mediastats: { enabled: true, description: '查看媒體統計數據', permission: 'authorized' },
            security: { enabled: true, description: '查看安全狀態', permission: 'admin' }
        },
        security: {
            admin_numbers: [],
            authorized_groups: [],
            whitelist_enabled: true
        },
        media_download: {
            enabled: true,
            auto_download: true,
            image_path: './data/images',
            pdf_path: './data/pdfs',
            naming_convention: '[YYYYMMDD]_[SenderName]_[OriginalFileName]'
        }
    };
}

// 初始化工具模組
    messageLogger = new MessageLogger(config);
    securityManager = new SecurityManager(config);
    mediaDownloader = new MediaDownloader(config);
    imageToPdf = new ImageToPdf(config);
    cleanupManager = new CleanupManager(config);
    contextManager = new ContextManager(config);
    contextStandardizer = new ContextStandardizer();

// 初始化 WhatsApp 客戶端
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'engineering-bot'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR Code 生成事件
client.on('qr', (qr) => {
    console.log('🔐 QR Code 已生成，請掃描以下 QR Code 登入:');
    qrcode.generate(qr, { small: true });
});

// 客戶端準備就緒事件
client.on('ready', () => {
    console.log('✅ WhatsApp 客戶端準備就緒');
    console.log(`🤖 ${config.bot.name} 已啟動`);
    console.log('📱 機器人現在可以接收訊息');
});

// 認證成功事件
client.on('authenticated', () => {
    console.log('✅ 認證成功，會話已保存');
});

// 認證失敗事件
client.on('auth_failure', (msg) => {
    console.log('❌ 認證失敗:', msg);
});

// 斷線重連事件
client.on('disconnected', (reason) => {
    console.log('🔌 客戶端已斷線:', reason);
    console.log('🔄 嘗試重新連接...');
});

// 訊息接收事件
client.on('message', async (message) => {
    try {
        // 第一步：標準化 Context 封裝
        const context = await contextStandardizer.standardizeContext(message);
        
        // 添加媒體標識符
        const mediaIndicator = message.hasMedia ? ' 📎' : '';
        const sourcePrefix = context.isGroup ? `[GROUP - ${context.groupName}]` : '[PRIVATE]';
        
        // 記錄接收到的訊息
        console.log(`📩 ${sourcePrefix} ${context.pushname}: ${context.messageBody}${mediaIndicator}`);
        
        // 記錄訊息到 JSON 文件
        await messageLogger.logMessage(message, context.pushname, context.groupName);
        
        // 自動下載媒體文件
        if (message.hasMedia && mediaDownloader.autoDownload) {
            await mediaDownloader.downloadMedia(message, context.pushname, context.groupName);
        }
        
        // 處理命令
        if (context.messageBody.startsWith('!') || context.messageBody.startsWith('#')) {
            await handleCommand(context);
        }
        
        // 處理密碼驗證（非命令開頭的訊息）
        else if (!context.isGroup && !context.messageBody.startsWith('!') && !context.messageBody.startsWith('#')) {
            await handlePasswordVerification(context);
        }
        
    } catch (error) {
        console.log(`❌ 訊息處理失敗: ${error.message}`);
    }
});

// 命令處理函數
async function handleCommand(context) {
    const command = context.messageBody.split(' ')[0].toLowerCase().trim();
    const sourcePrefix = context.isGroup ? `[GROUP - ${context.groupName}]` : '[PRIVATE]';
    
    console.log(`🔄 處理命令: ${command} 來自 ${sourcePrefix} ${context.pushname}`);
    
    try {
        // 檢查群組回覆設置
        if (isGroup && !config.features.reply_in_group) {
            console.log(`⏸️ 群組回覆已停用，忽略命令: ${command}`);
            return;
        }
        
        // 檢查命令權限
        const commandConfig = config.commands[command.substring(1)];
        if (!commandConfig || !commandConfig.enabled) {
            console.log(`❓ 未知或停用命令: ${command}`);
            await message.reply('❓ 未知命令，請使用 !help 查看可用命令');
            return;
        }
        
        // 檢查用戶權限（公開命令完全跳過權限檢查）
        const isPublicCommand = securityManager.isPublicCommand(commandConfig.permission);
        if (!isPublicCommand) {
            const hasPermission = securityManager.checkPermission(userId, groupId, commandConfig.permission);
            if (!hasPermission) {
                console.log(`🚫 權限不足: ${command} 來自 ${sourcePrefix} ${senderInfo}`);
                securityManager.logUnauthorizedAccess(
                    command,
                    userId,
                    isGroup ? 'Group' : 'Private',
                    `Unauthorized access attempt for ${commandConfig.permission} command`,
                    commandText
                );
                await message.reply('🚫 權限不足，無法執行此命令');
                return;
            }
        } else {
            // 公開命令完全跳過權限檢查，直接進入處理流程
            console.log(`🔓 公開命令 ${command} 跳過權限檢查，直接處理`);
        }
        
        // 處理命令
        switch (command) {
            case '!ping':
                await message.reply(config.commands.ping.response);
                console.log(`✅ 已回覆 ${config.commands.ping.response} 給 ${sourcePrefix} ${senderInfo}`);
                break;
                
            case '!help':
                const helpMessage = securityManager.generateHelpMessage(userId);
                await message.reply(helpMessage);
                console.log(`✅ 已發送動態幫助訊息給 ${sourcePrefix} ${senderInfo}`);
                break;
                
            case '!whitelist':
                console.log(`🔓 處理白名單認證請求來自 ${sourcePrefix} ${senderInfo}`);
                const whitelistResult = await securityManager.handleWhitelistCommand(message, commandText, userId);
                await message.reply(whitelistResult.message);
                
                if (whitelistResult.requiresPassword) {
                    // 記錄跨頻道交互上下文
                    if (isGroup && groupId) {
                        const contact = await message.getContact();
                        const userWhatsAppId = contact.id._serialized; // 正確的WhatsApp ID格式
                        
                        pendingInteractions.set(userWhatsAppId, {
                            originGroupId: message.from, // 原始群組ID
                            originGroupName: groupName,
                            command: command,
                            userDisplayName: senderInfo,
                            timestamp: Date.now()
                        });
                        console.log(`📝 記錄跨頻道交互: 用戶 ${senderInfo} (${userWhatsAppId}) 從群組 ${groupName} 發起 ${command}`);
                    }
                    
                    // 發送私訊
                    try {
                        const chat = await message.getChat();
                        if (chat.isGroup) {
                            // 如果是群組，獲取正確的用戶ID並發送私訊
                            const contact = await message.getContact();
                            const userWhatsAppId = contact.id._serialized; // 正確的WhatsApp ID格式
                            
                            console.log(`📱 嘗試發送私訊給用戶: ${userWhatsAppId} (${senderInfo})`);
                            
                            // 使用正確的私訊發送方式
                            await client.sendMessage(userWhatsAppId, "請輸入管理員密碼以獲取權限。");
                            console.log(`✅ 已成功私訊用戶 ${senderInfo} 要求密碼驗證`);
                        } else {
                            // 如果是私訊，直接回覆
                            await message.reply("請輸入管理員密碼以獲取權限。");
                            console.log(`🔐 已在私訊中要求用戶 ${senderInfo} 進行密碼驗證`);
                        }
                    } catch (error) {
                        console.log(`❌ 發送私訊失敗: ${error.message}`);
                        console.log(`❌ 詳細錯誤資訊:`, error);
                    }
                } else if (whitelistResult.alreadyAdmin) {
                    console.log(`✅ 用戶 ${senderInfo} 已經是管理員`);
                } else {
                    console.log(`✅ 白名單認證完成: ${whitelistResult.success ? '成功' : '失敗'}`);
                }
                break;
                
            case '!stats':
                const stats = messageLogger.getTodayStats();
                const statsMessage = messageLogger.formatStats(stats);
                await message.reply(statsMessage);
                console.log(`📊 已發送統計數據給 ${sourcePrefix} ${senderInfo}`);
                break;
                
            case '!mediastats':
                const mediaStats = mediaDownloader.getMediaStats();
                const mediaStatsMessage = mediaDownloader.formatMediaStats(mediaStats);
                await message.reply(mediaStatsMessage);
                console.log(`📊 已發送媒體統計數據給 ${sourcePrefix} ${senderInfo}`);
                break;
                
            case '!security':
                const securityStatus = securityManager.formatSecurityStatus();
                await message.reply(securityStatus);
                console.log(`🛡️ 已發送安全狀態給 ${sourcePrefix} ${senderInfo}`);
                break;
                
            case '#topdf':
                console.log(`🔄 開始圖片轉PDF轉換為 ${sourcePrefix} ${senderInfo}`);
                const conversionResult = await imageToPdf.convertUserImagesToPdf(userId);
                await message.reply(conversionResult.message);
                console.log(`✅ 圖片轉PDF完成: ${conversionResult.success ? '成功' : '失敗'}`);
                break;
                
            case '!cleanup':
                console.log(`🧹 開始系統清理操作為 ${sourcePrefix} ${senderInfo}`);
                const cleanupResult = await cleanupManager.performCleanup();
                const cleanupMessage = cleanupManager.formatCleanupStats(cleanupResult);
                await message.reply(cleanupMessage);
                console.log(`✅ 系統清理完成: ${cleanupResult.success ? '成功' : '失敗'}`);
                break;
                
            default:
                console.log(`❓ 未知命令: ${command} 來自 ${sourcePrefix} ${senderInfo}`);
                await message.reply('❓ 未知命令，請使用 !help 查看可用命令');
                break;
        }
    } catch (error) {
        console.log(`❌ 命令處理錯誤: ${error.message}`);
        await message.reply('❌ 命令處理發生錯誤，請稍後再試');
    }
}

// 處理密碼驗證
async function handlePasswordVerification(message, password, userId, senderInfo) {
    try {
        // 防錯處理：確保所有必要參數都存在
        if (!message || !password || !userId || !senderInfo) {
            console.log(`❌ 密碼驗證參數錯誤: message=${!!message}, password=${!!password}, userId=${!!userId}, senderInfo=${!!senderInfo}`);
            await message.reply('❌ 密碼驗證參數錯誤，請重新嘗試');
            return;
        }
        
        console.log(`🔐 處理密碼驗證請求來自 ${senderInfo} (ID: ${userId})`);
        
        // 獲取正確的用戶ID格式
        const contact = await message.getContact();
        const userWhatsAppId = contact.id._serialized;
        
        // 檢查是否有跨頻道交互記錄
        const pendingInteraction = pendingInteractions.get(userWhatsAppId);
        console.log(`📋 檢查跨頻道交互記錄: 用戶 ${userWhatsAppId} ${pendingInteraction ? '有記錄' : '無記錄'}`);
        if (pendingInteraction) {
            console.log(`📋 交互記錄詳情:`, {
                originGroupId: pendingInteraction.originGroupId,
                originGroupName: pendingInteraction.originGroupName,
                command: pendingInteraction.command,
                userDisplayName: pendingInteraction.userDisplayName,
                timestamp: new Date(pendingInteraction.timestamp).toISOString()
            });
        }
        
        // 使用 securityManager 處理密碼驗證
        const passwordResult = await securityManager.handlePasswordVerification(
            message, 
            password, 
            userId, 
            false, // 私訊不是群組
            null   // 沒有群組名稱
        );
        
        if (passwordResult.success) {
            // 私訊回覆用戶
            await message.reply("✅ 認證成功。");
            console.log(`✅ 密碼驗證成功: 用戶 ${senderInfo} 已成為管理員`);
            
            // 檢查是否有跨頻道交互記錄（從群組觸發）
            if (pendingInteraction && pendingInteraction.originGroupId) {
                try {
                    // 獲取原始群組聊天
                    const groupChat = await client.getChatById(pendingInteraction.originGroupId);
                    const groupNotification = `✅ @${pendingInteraction.userDisplayName || senderInfo} 認證成功，已獲取管理員權限。`;
                    
                    await groupChat.sendMessage(groupNotification);
                    console.log(`📢 已發送群組通知到 ${pendingInteraction.originGroupName || pendingInteraction.originGroupId}`);
                    
                    // 清理交互記錄
                    pendingInteractions.delete(userWhatsAppId);
                    
                } catch (error) {
                    console.log(`❌ 發送群組通知失敗: ${error.message}`);
                }
            }
        } else {
            await message.reply(passwordResult.message);
            console.log(`❌ 密碼驗證失敗: 用戶 ${senderInfo}`);
        }
        
    } catch (error) {
        console.log(`❌ 密碼驗證處理錯誤: ${error.message}`);
        await message.reply('❌ 密碼驗證過程發生錯誤，請稍後再試');
    }
}

// 錯誤處理
client.on('error', (error) => {
    console.log('❌ 客戶端錯誤:', error);
});

// 啟動機器人
console.log('🚀 啟動 Engineering WhatsApp Bot...');
console.log('📋 載入配置...');
console.log(`🤖 機器人名稱: ${config.bot.name}`);
console.log(`🔧 功能狀態: QR登入(${config.features.qr_login ? '啟用' : '停用'}), 持久化會話(${config.features.persistent_session ? '啟用' : '停用'}), 群組回覆(${config.features.reply_in_group ? '啟用' : '停用'})`);
console.log(`📊 訊息記錄: ${config.message_logging?.enabled ? '啟用' : '停用'}`);

// 初始化客戶端
client.initialize().catch(error => {
    console.log('❌ 客戶端初始化失敗:', error);
    process.exit(1);
});

// 優雅關閉處理
process.on('SIGINT', async () => {
    console.log('\n🛑 收到關閉信號，正在優雅關閉...');
    await client.destroy();
    console.log('👋 機器人已關閉');
    process.exit(0);
});