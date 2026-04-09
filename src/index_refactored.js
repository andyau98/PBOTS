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
const ContextStandardizer = require('../tools/contextStandardizer');

let messageLogger;
let securityManager;
let mediaDownloader;
let imageToPdf;
let cleanupManager;
let contextStandardizer;

// 載入配置
try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    console.log('✅ 配置檔案載入成功');
} catch (error) {
    console.log('❌ 配置檔案載入失敗:', error.message);
    process.exit(1);
}

console.log('🚀 啟動 Engineering WhatsApp Bot...');
console.log('📋 載入配置...');
console.log(`🤖 機器人名稱: ${config.bot_name || 'EngineeringBot'}`);
console.log(`🔧 功能狀態: QR登入(${config.features.qr_login ? '啟用' : '停用'}), 持久化會話(${config.features.persistent_session ? '啟用' : '停用'}), 群組回覆(${config.features.reply_in_group ? '啟用' : '停用'})`);
console.log(`📊 訊息記錄: ${config.features.message_logging ? '啟用' : '停用'}`);

// 初始化工具模組
messageLogger = new MessageLogger(config);
securityManager = new SecurityManager(config);
mediaDownloader = new MediaDownloader(config);
imageToPdf = new ImageToPdf(config);
cleanupManager = new CleanupManager(config);
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
    console.log('✅ 認證成功，會話已保存');
    console.log('✅ WhatsApp 客戶端準備就緒');
    console.log(`🤖 ${config.bot_name || 'EngineeringBot'} 已啟動`);
    console.log('📱 機器人現在可以接收訊息');
});

// 訊息接收事件 - 使用標準化 Context 架構
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

// 命令處理函數 - 使用標準化 Context
async function handleCommand(context) {
    const command = context.messageBody.split(' ')[0].toLowerCase().trim();
    const sourcePrefix = context.isGroup ? `[GROUP - ${context.groupName}]` : '[PRIVATE]';
    
    console.log(`🔄 處理命令: ${command} 來自 ${sourcePrefix} ${context.pushname}`);
    
    try {
        // 檢查群組回覆設置
        if (context.isGroup && !config.features.reply_in_group) {
            console.log(`⏸️ 群組回覆已停用，忽略命令: ${command}`);
            return;
        }
        
        // 檢查命令權限
        const commandConfig = config.commands[command.substring(1)];
        if (!commandConfig || !commandConfig.enabled) {
            console.log(`❓ 未知或停用命令: ${command}`);
            await context.message.reply('❓ 未知命令，請使用 !help 查看可用命令');
            return;
        }
        
        // 檢查用戶權限（公開命令完全跳過權限檢查）
        const isPublicCommand = securityManager.isPublicCommand(commandConfig.permission);
        if (!isPublicCommand) {
            const hasPermission = securityManager.checkPermission(context.userId, context.groupId, commandConfig.permission);
            if (!hasPermission) {
                console.log(`🚫 權限不足: ${command} 來自 ${sourcePrefix} ${context.pushname}`);
                securityManager.logUnauthorizedAccess(
                    command,
                    context.userId,
                    context.isGroup ? 'Group' : 'Private',
                    `Unauthorized access attempt for ${commandConfig.permission} command`,
                    context.messageBody
                );
                await context.message.reply('🚫 權限不足，無法執行此命令');
                return;
            }
        } else {
            // 公開命令完全跳過權限檢查，直接進入處理流程
            console.log(`🔓 公開命令 ${command} 跳過權限檢查，直接處理`);
        }
        
        // 處理具體命令
        switch (command) {
            case '!ping':
                console.log(`🏓 回應 PING 請求來自 ${sourcePrefix} ${context.pushname}`);
                await context.message.reply('🏓 PONG! 機器人運作正常');
                break;
                
            case '!whitelist':
                console.log(`🔓 處理白名單認證請求來自 ${sourcePrefix} ${context.pushname}`);
                const whitelistResult = await securityManager.handleWhitelistCommand(context.message, context.messageBody, context.userId);
                await context.message.reply(whitelistResult.message);
                
                if (whitelistResult.requiresPassword) {
                    // 記錄跨頻道交互上下文
                    if (context.isGroup && context.groupId) {
                        contextStandardizer.recordInteraction(context, command);
                    }
                    
                    // 發送私訊
                    try {
                        if (context.isGroup) {
                            // 使用安全發送方法
                            await contextStandardizer.safeSendMessage(
                                client, 
                                context.userId, 
                                "請輸入管理員密碼以獲取權限。", 
                                context
                            );
                            console.log(`✅ 已成功私訊用戶 ${context.pushname} 要求密碼驗證`);
                        } else {
                            // 如果是私訊，直接回覆
                            await context.message.reply("請輸入管理員密碼以獲取權限。");
                            console.log(`🔐 已在私訊中要求用戶 ${context.pushname} 進行密碼驗證`);
                        }
                    } catch (error) {
                        console.log(`❌ 發送私訊失敗: ${error.message}`);
                    }
                } else if (whitelistResult.alreadyAdmin) {
                    console.log(`✅ 用戶 ${context.pushname} 已經是管理員`);
                } else {
                    console.log(`✅ 白名單認證完成: ${whitelistResult.success ? '成功' : '失敗'}`);
                }
                break;
                
            case '!help':
                const helpMessage = securityManager.generateHelpMessage(context.userId);
                await context.message.reply(helpMessage);
                console.log(`✅ 已發送動態幫助訊息給 ${sourcePrefix} ${context.pushname}`);
                break;
                
            case '!security':
                console.log(`🔐 處理安全狀態查詢來自 ${sourcePrefix} ${context.pushname}`);
                const securityStatus = securityManager.getSecurityStatus(context.userId);
                await context.message.reply(securityStatus);
                break;
                
            case '#topdf':
                console.log(`📄 處理 PDF 轉換請求來自 ${sourcePrefix} ${context.pushname}`);
                const pdfResult = await imageToPdf.convertRecentImages(context.message, context.userId);
                await context.message.reply(pdfResult.message);
                break;
                
            case '!cleanup':
                console.log(`🧹 開始系統清理操作為 ${sourcePrefix} ${context.pushname}`);
                const cleanupResult = await cleanupManager.performCleanup();
                const cleanupMessage = cleanupManager.formatCleanupStats(cleanupResult);
                await context.message.reply(cleanupMessage);
                console.log(`✅ 系統清理完成: ${cleanupResult.success ? '成功' : '失敗'}`);
                break;
                
            default:
                console.log(`❓ 未知命令: ${command} 來自 ${sourcePrefix} ${context.pushname}`);
                await context.message.reply('❓ 未知命令，請使用 !help 查看可用命令');
                break;
        }
    } catch (error) {
        console.log(`❌ 命令處理錯誤: ${error.message}`);
        await context.message.reply('❌ 命令處理發生錯誤，請稍後再試');
    }
}

// 處理密碼驗證 - 使用標準化 Context
async function handlePasswordVerification(context) {
    try {
        // 防錯處理：確保所有必要參數都存在
        if (!context.message || !context.messageBody || !context.userId || !context.pushname) {
            console.log(`❌ 密碼驗證參數錯誤`);
            await context.message.reply('❌ 密碼驗證參數錯誤，請重新嘗試');
            return;
        }
        
        console.log(`🔐 處理密碼驗證請求來自 ${context.pushname} (ID: ${context.userId})`);
        
        // 檢查是否有跨頻道交互記錄
        const pendingInteraction = contextStandardizer.getActiveInteraction(context.userId);
        console.log(`📋 檢查跨頻道交互記錄: 用戶 ${context.userId} ${pendingInteraction ? '有記錄' : '無記錄'}`);
        
        // 使用 securityManager 處理密碼驗證
        const passwordResult = await securityManager.handlePasswordVerification(
            context.message, 
            context.messageBody, 
            context.userId, 
            false, // 私訊不是群組
            null   // 沒有群組名稱
        );
        
        if (passwordResult.success) {
            // 私訊回覆用戶
            await context.message.reply("✅ 認證成功。");
            console.log(`✅ 密碼驗證成功: 用戶 ${context.pushname} 已成為管理員`);
            
            // 檢查是否有跨頻道交互記錄（從群組觸發）
            if (pendingInteraction && pendingInteraction.originId) {
                try {
                    // 獲取原始群組聊天
                    const groupChat = await client.getChatById(pendingInteraction.originId);
                    const groupNotification = `✅ @${pendingInteraction.userDisplayName || context.pushname} 認證成功，已獲取管理員權限。`;
                    
                    await contextStandardizer.safeSendMessage(
                        client,
                        pendingInteraction.originId,
                        groupNotification,
                        context
                    );
                    
                    console.log(`📢 已發送群組通知到 ${pendingInteraction.originGroupName || pendingInteraction.originId}`);
                    
                    // 清理交互記錄
                    contextStandardizer.completeInteraction(context.userId);
                    
                } catch (error) {
                    console.log(`❌ 發送群組通知失敗: ${error.message}`);
                }
            }
        } else {
            await context.message.reply(passwordResult.message);
            console.log(`❌ 密碼驗證失敗: 用戶 ${context.pushname}`);
        }
        
    } catch (error) {
        console.log(`❌ 密碼驗證處理錯誤: ${error.message}`);
        await context.message.reply('❌ 密碼驗證過程發生錯誤，請稍後再試');
    }
}

// 錯誤處理
client.on('error', (error) => {
    console.log('❌ 客戶端錯誤:', error);
});

// 斷線重連處理
client.on('disconnected', (reason) => {
    console.log('🔌 客戶端已斷線:', reason);
    console.log('🔄 嘗試重新連接...');
    client.initialize();
});

// 啟動客戶端
client.initialize();

module.exports = client;