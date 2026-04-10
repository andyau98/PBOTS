const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const PathManager = require('./configs/path_manager');

// 載入完整的工具模組
const SecurityManager = require(PathManager.TOOLS + '/securityManager');
const ContextStandardizer = require(PathManager.TOOLS + '/contextStandardizer');
const MessageLogger = require(PathManager.TOOLS + '/messageLogger');
const MediaDownloader = require(PathManager.TOOLS + '/mediaDownloader');
const ImageToPdf = require(PathManager.TOOLS + '/imageToPdf');
const CleanupManager = require(PathManager.TOOLS + '/cleanup');
const HealthMonitor = require(PathManager.TOOLS + '/healthMonitor');
const LogicEngine = require(PathManager.TOOLS + '/logicEngine');
const CommandHandler = require(PathManager.TOOLS + '/commandHandler');

console.log('🚀 啟動最終大一統 WhatsApp Bot (完整功能版本)...');

// 載入配置
const configPath = PathManager.SETTINGS;
let config = {};

try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    console.log('✅ 配置檔案載入成功');
} catch (error) {
    console.log('⚠️ 配置檔案載入失敗，使用預設配置');
    config = {
        bot: { name: 'EngineeringBot' },
        features: { 
            qr_login: true, 
            persistent_session: true, 
            basic_commands: true,
            reply_in_group: true,
            message_logging: true,
            auto_download_media: true
        },
        security: {
            admin_password: "288365",
            whitelist_enabled: true,
            whitelist_file: PathManager.WHITELIST
        }
    };
}

// 初始化所有工具模組
const securityManager = new SecurityManager(config);
const contextStandardizer = new ContextStandardizer();
const messageLogger = new MessageLogger(config);
const mediaDownloader = new MediaDownloader(config);
const imageToPdf = new ImageToPdf(config);
const cleanupManager = new CleanupManager(config);
const logicEngine = new LogicEngine(config, securityManager);

// HealthMonitor 和 CommandHandler 將在 client.on('ready') 中初始化
let healthMonitor = null;
let commandHandler = null;

// 視覺化回報 - 顯示已啟動的功能組件
console.log('\n📊 功能組件啟動狀態:');
console.log('✅ [OK] SecurityManager - 安全與權限管理');
console.log('✅ [OK] ContextStandardizer - 階段6私訊與跨頻道通訊');
console.log('✅ [OK] MessageLogger - 訊息記錄系統');
console.log('✅ [OK] MediaDownloader - 媒體文件下載');
console.log('✅ [OK] ImageToPdf - 圖片轉PDF工具');
console.log('✅ [OK] CleanupManager - 系統清理管理');
console.log('✅ [OK] PathManager - 路徑管理系統');
console.log('✅ [OK] LogicEngine - Excel 邏輯引擎');
console.log('🔄 CommandHandler - 將在 HealthMonitor 初始化後啟動');
console.log('\n🎯 已啟動完整功能，支援跨頻道私訊與自動化工具集\n');

// 使用最簡單的配置
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'unified-bot'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    }
});

// QR Code 生成事件
client.on('qr', (qr) => {
    console.log('🔐 QR Code 已生成，請掃描以下 QR Code 登入:');
    qrcode.generate(qr, { small: true });
});

// 客戶端準備就緒事件
client.on('ready', async () => {
    console.log('✅ WhatsApp 客戶端準備就緒');
    console.log(`🤖 ${config.bot.name} 已啟動`);
    console.log('📱 支援完整命令功能，包括跨頻道私訊、安全管理、自動化工具');
    console.log('🔧 模組化架構已啟用，所有工具位於 /tools 資料夾');
    
    // 初始化 HealthMonitor（需要 client 實例）
    healthMonitor = new HealthMonitor(config, client);
    await healthMonitor.initialize();
    
    // 初始化 CommandHandler（需要 healthMonitor 實例）
    commandHandler = new CommandHandler(config, securityManager, healthMonitor);
    
    // 初始化 LogicEngine
    try {
        await logicEngine.loadWorkbook();
        const availableSheets = logicEngine.getAvailableSheets();
        console.log(`✅ [OK] LogicEngine - Excel 邏輯引擎 (可用工作表: ${availableSheets.join(', ')})`);
    } catch (error) {
        console.log('⚠️ LogicEngine 初始化失敗:', error.message);
    }
    
    // 更新視覺化回報
    console.log('✅ [OK] HealthMonitor - 健康監控系統');
    console.log('✅ [OK] CommandHandler - 統一指令處理器（已整合 !trial 指令）');
});

// 訊息接收事件 - 使用階段6標準化 Context 架構
client.on('message', async (message) => {
    try {
        // 第一步：標準化 Context 封裝（階段6核心功能）
        const context = await contextStandardizer.standardizeContext(message);
        
        // 添加媒體標識符
        const mediaIndicator = message.hasMedia ? ' 📎' : '';
        const sourcePrefix = context.isGroup ? `[GROUP - ${context.groupName}]` : '[PRIVATE]';
        
        // 記錄接收到的訊息
        console.log(`📩 ${sourcePrefix} ${context.pushname}: ${context.messageBody}${mediaIndicator}`);
        
        // 記錄訊息到 JSON 文件（防錯加固）
        if (config.features.message_logging) {
            try {
                await messageLogger.logMessage(message, context.pushname, context.groupName);
                // 記錄到健康監控
                if (healthMonitor) {
                    healthMonitor.recordMessage(message.hasMedia);
                }
            } catch (error) {
                console.log('❌ 訊息記錄失敗:', error.message);
                // 記錄錯誤但不中斷流程
            }
        }
        
        // 自動下載媒體文件（防錯加固）
        if (message.hasMedia && config.features.auto_download_media) {
            try {
                await mediaDownloader.downloadMedia(message, context.pushname, context.groupName);
                console.log(`✅ 媒體文件已自動下載: ${context.pushname}`);
            } catch (error) {
                console.log('❌ 媒體下載失敗:', error.message);
                // 記錄錯誤但不中斷流程
            }
        }
        
        // 處理命令
        if (context.messageBody.startsWith('!')) {
            // 先檢查是否為 Excel 填表流程指令
            const excelResult = await handleExcelFormCommand(client, context, logicEngine);
            if (!excelResult.isExcelCommand) {
                // 如果不是 Excel 指令，則使用常規命令處理
                await handleCommand(client, context, contextStandardizer);
            }
        }
        
    } catch (error) {
        console.log('❌ 處理訊息失敗:', error.message);
    }
});

// Excel 填表流程指令處理
async function handleExcelFormCommand(client, context, logicEngine) {
    try {
        const command = context.messageBody.split(' ')[0].replace('!', '');
        
        // 優先級調整：如果用戶在 LogicEngine 會話中，優先處理
        if (logicEngine.isUserInSession(context.userId, context.originId)) {
            // 檢查群組鎖定（如果是群組訊息）
            if (context.isGroup) {
                if (logicEngine.isGroupSessionLocked(context.originId, context.userId)) {
                    // 群組已鎖定給其他用戶，忽略此訊息
                    console.log(`⛔ 群組 ${context.originId} 已鎖定，忽略用戶 ${context.pushname} 的訊息`);
                    return { isExcelCommand: true, handled: true };
                }
            }
            
            console.log(`📝 用戶 ${context.pushname} 在 LogicEngine 會話中回答: ${context.messageBody}`);
            
            const result = await logicEngine.getNextQuestion(context.userId, null, context.messageBody, context.pushname);
            
            // 處理不同類型的回覆
            if (result.type === 'question_with_confirmation') {
                // 先發送確認回覆，再發送下一個問題
                await context.message.reply(result.confirmation);
                await context.message.reply(result.message);
            } else if (result.type === 'question') {
                await context.message.reply(result.message);
            } else if (result.type === 'completed') {
                await context.message.reply(result.message);
                
                // 如果有結果檔案，提供下載資訊
                if (result.resultFile) {
                    await context.message.reply(`📁 填表結果已保存: ${result.resultFile}`);
                }
                
                console.log(`✅ LogicEngine 填表流程完成`);
            } else if (result.type === 'cancelled') {
                await context.message.reply(result.message);
                console.log(`❌ LogicEngine 填表流程已取消`);
            }
            
            return { isExcelCommand: true, handled: true };
        }
        
        // 檢查是否為可用工作表名稱
        const availableSheets = logicEngine.getAvailableSheets();
        const isSheetCommand = availableSheets.includes(command);
        
        if (isSheetCommand) {
            console.log(`📊 用戶 ${context.pushname} 啟動 Excel 填表流程: ${command}`);
            
            // 檢查用戶權限（使用 SecurityManager）
            const hasPermission = logicEngine.checkPermission(context.userId, context.originId, 'basic');
            if (!hasPermission) {
                await context.message.reply(`⛔ 權限不足！您沒有執行 !${command} 的權限`);
                return { isExcelCommand: true, handled: true };
            }
            
            // 檢查用戶是否已有進行中的會話
            const existingSession = logicEngine.getUserSession(context.userId);
            if (existingSession) {
                await context.message.reply(`⚠️ 您已有進行中的「${existingSession.sheetName}」填表流程，請先完成或取消該流程。`);
                return { isExcelCommand: true, handled: true };
            }
            
            // 啟動新的填表流程（支援群組鎖定）
            const chatId = context.isGroup ? context.originId : null;
            const result = await logicEngine.startForm(context.userId, command, chatId);
            
            if (result.type === 'question') {
                await context.message.reply(result.message);
                console.log(`✅ 已啟動 ${command} 填表流程`);
            }
            
            return { isExcelCommand: true, handled: true };
        }
        
        return { isExcelCommand: false, handled: false };

    } catch (error) {
        console.log('❌ 處理 Excel 填表指令失敗:', error.message);
        
        // 如果是工作表不存在的錯誤，回覆特定訊息
        if (error.message.includes('工作表') && error.message.includes('不存在')) {
            await context.message.reply('❓ 未定義此任務指令，請使用以下可用指令:\n' + 
                logicEngine.getAvailableSheets().map(sheet => `• !${sheet}`).join('\n'));
        } else {
            await context.message.reply('❌ Excel 填表功能暫時不可用，請稍後重試');
        }
        
        return { isExcelCommand: true, handled: true };
    }
}

// 統一的命令處理函數（整合階段6跨頻道邏輯）
async function handleCommand(client, context, contextStandardizer) {
    const command = context.messageBody.split(' ')[0].replace('!', '');
    
    switch (command) {
        case 'whitelist':
            await handleWhitelistCommand(client, context, contextStandardizer);
            break;
            
        case 'memo':
            await handleMemoCommand(context);
            break;
            
        case 'profile':
            await handleProfileCommand(context);
            break;
            
        case 'excel':
            await handleExcelCommand(context);
            break;
            
        case 'help':
        case 'ping':
        case 'stats':
        case 'version':
            // 使用 CommandHandler 處理基本命令
            const result = await commandHandler.handleCommand(context.message, context.messageBody, context.pushname, context.userId);
            if (result.success) {
                await context.message.reply(result.message);
            }
            break;
            
        default:
            await context.message.reply(`❓ 未知命令 "!${command}"，請使用 !help 查看可用命令`);
            console.log(`❓ 未知命令: ${context.messageBody}`);
            break;
    }
}

// 處理 !whitelist 命令（階段6跨頻道核心功能）
async function handleWhitelistCommand(client, context, contextStandardizer) {
    console.log(`🔓 處理白名單認證請求來自 ${context.pushname}`);
    
    const whitelistResult = await securityManager.handleWhitelistCommand(context.message, context.messageBody, context.userId);
    
    // 先回覆原始訊息
    await context.message.reply(whitelistResult.message);
    
    if (whitelistResult.requiresPassword) {
        // 階段6核心：記錄跨頻道交互上下文
        if (context.isGroup && context.groupId) {
            contextStandardizer.recordInteraction(context, 'whitelist');
        }
        
        // 發送私訊（階段6跨頻道功能）
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
}

// 處理 !memo 命令
async function handleMemoCommand(context) {
    try {
        const memoContent = context.messageBody.replace('!memo', '').trim();
        if (memoContent) {
            const memoData = {
                user: context.pushname,
                userId: context.userId,
                content: memoContent,
                timestamp: new Date().toISOString(),
                type: 'memo'
            };
            
            // 保存到本地檔案（使用 PathManager）
            const memoDir = PathManager.DATA + '/memos';
            PathManager.ensureDirectoryExists(memoDir);
            
            const memoFile = `${memoDir}/${context.userId}_${Date.now()}.json`;
            fs.writeFileSync(memoFile, JSON.stringify(memoData, null, 2));
            
            await context.message.reply(`📝 備忘錄已保存！內容: ${memoContent}`);
            console.log('✅ 已處理 !memo 命令');
        } else {
            await context.message.reply('📝 請提供備忘錄內容，格式: !memo [內容]');
        }
    } catch (error) {
        console.log('❌ 處理備忘錄命令失敗:', error.message);
        await context.message.reply('❌ 備忘錄保存失敗，請稍後重試');
    }
}

// 處理 !profile 命令
async function handleProfileCommand(context) {
    const profileMessage = `👤 ${context.pushname} 的個人資料\n\n`;
    profileMessage += `• 用戶ID: ${context.userId.substring(0, 20)}...\n`;
    profileMessage += `• 註冊時間: ${new Date().toLocaleString()}\n`;
    profileMessage += `• 白名單狀態: 待驗證\n`;
    profileMessage += `• 權限等級: 普通用戶`;
    
    await context.message.reply(profileMessage);
    console.log('✅ 已回覆 !profile 命令');
}

// 處理 !excel 命令
async function handleExcelCommand(context) {
    await context.message.reply('📊 Excel 功能開發中，敬請期待！\n💡 未來將支援: 數據匯出、報表生成、自動化處理');
    console.log('✅ 已回覆 !excel 命令');
}

// 處理私訊回覆（階段6跨頻道功能）
client.on('message_create', async (message) => {
    // 只處理私訊（非群組）
    if (message.from.includes('@g.us')) return;
    
    const context = await contextStandardizer.standardizeContext(message);
    
    // 檢查是否是密碼回覆
    if (!context.messageBody.startsWith('!') && context.messageBody.trim().length > 0) {
        await handlePrivateMessageReply(client, context, contextStandardizer);
    }
});

// 處理私訊回覆（階段6跨頻道核心功能）
async function handlePrivateMessageReply(client, context, contextStandardizer) {
    // 檢查是否有跨頻道交互記錄
    const pendingInteraction = contextStandardizer.getActiveInteraction(context.userId);
    
    if (pendingInteraction && pendingInteraction.command === 'whitelist') {
        console.log(`🔐 處理密碼驗證請求來自 ${context.pushname}`);
        
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
            if (pendingInteraction.originId) {
                try {
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
        }
    }
}

// 錯誤處理與健康監控
client.on('auth_failure', (msg) => {
    console.log('❌ 認證失敗:', msg);
    // 記錄錯誤到健康監控
    if (typeof healthMonitor !== 'undefined') {
        healthMonitor.recordError();
    }
});

client.on('disconnected', (reason) => {
    console.log('🔌 客戶端已斷線:', reason);
    // 記錄斷線事件
    if (typeof healthMonitor !== 'undefined') {
        healthMonitor.recordError();
    }
});

// 全局錯誤監聽 - 防禦式加固
process.on('uncaughtException', (error) => {
    console.log('🚨 未捕獲的異常:', error.message);
    console.log('🔧 堆棧追蹤:', error.stack);
    
    // 記錄到健康監控
    if (typeof healthMonitor !== 'undefined') {
        healthMonitor.recordError();
    }
    
    // 防止進程崩潰，但記錄錯誤
    console.log('🛡️ 防禦機制：繼續運行，但請檢查錯誤日誌');
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('🚨 未處理的 Promise 拒絕:', reason);
    
    // 記錄到健康監控
    if (typeof healthMonitor !== 'undefined') {
        healthMonitor.recordError();
    }
    
    console.log('🛡️ 防禦機制：繼續運行，但請檢查錯誤日誌');
});

// 啟動客戶端
try {
    client.initialize();
    console.log('📱 正在初始化 WhatsApp 客戶端...');
} catch (error) {
    console.log('❌ 客戶端初始化失敗:', error.message);
}

// 處理程序退出事件
process.on('SIGINT', () => {
    console.log('\n🛑 正在關閉 WhatsApp Bot...');
    client.destroy();
    process.exit(0);
});