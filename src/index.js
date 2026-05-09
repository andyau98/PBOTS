const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// 載入工具模組
const MessageLogger = require('../tools/messageLogger');
const MediaDownloader = require('../tools/mediaDownloader');
const SecurityManager = require('../tools/securityManager');
const ImageToPdf = require('../tools/imageToPdf');
const CleanupManager = require('../tools/cleanup');
const WhitelistManager = require('../tools/whitelistManager');
const HealthMonitor = require('../tools/healthMonitor');
const ErrorRecovery = require('../tools/errorRecovery');
const PrivateMessageManager = require('../tools/privateMessageManager');
const WhitelistCleanup = require('../tools/whitelistCleanup');
const WeatherReporter = require('../tools/weatherReporter');
const NewsReporter = require('../tools/newsReporter');

// 載入配置
const configPath = path.join(__dirname, '../configs/settings.json');
let config = {};

try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (error) {
    console.error('❌ 載入配置檔案失敗:', error.message);
    config = {
        bot: { prefix: '!' },
        logging: { level: 'info' },
        features: { reply_in_group: true },
        message_logging: { enabled: true },
    };
}

// 初始化工具模組
const messageLogger = new MessageLogger(config.message_logging);
const mediaDownloader = new MediaDownloader(config.media_download);
const securityManager = new SecurityManager(config.security);
const imageToPdf = new ImageToPdf(config.media_download);
const cleanupManager = new CleanupManager(config);
const whitelistManager = new WhitelistManager(config.security);
const healthMonitor = new HealthMonitor(config);
const errorRecovery = new ErrorRecovery(config);
const privateMessageManager = new PrivateMessageManager(config);
const whitelistCleanup = new WhitelistCleanup(config);
const weatherReporter = new WeatherReporter(config);
const newsReporter = new NewsReporter(config);

// 初始化客戶端
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'pbots-client',
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

// QR Code 生成
client.on('qr', async (qr) => {
    console.log('🔐 QR Code 生成成功，請掃描登入:');
    qrcodeTerminal.generate(qr, { small: true });

    // 保存 QR Code 為圖片文件，方便在 VSCode 中直接查看
    try {
        const qrDir = path.join(__dirname, '../data');
        if (!fs.existsSync(qrDir)) {
            fs.mkdirSync(qrDir, { recursive: true });
        }
        const qrPath = path.join(qrDir, 'qr-code.png');
        await QRCode.toFile(qrPath, qr, { width: 400 });
        console.log(`📱 QR Code 圖片已保存: ${qrPath}`);
        console.log('💡 在 VSCode 中點擊該文件即可查看並掃描');
    } catch (err) {
        console.error('❌ 保存 QR Code 圖片失敗:', err.message);
    }
});

// 客戶端準備就緒
client.on('ready', async () => {
    console.log('✅ PBOTS 機器人已準備就緒！');
    console.log(`🤖 機器人名稱: ${config.bot?.name || 'PBOTS'}`);
    console.log(`🔧 命令前綴: ${config.bot?.prefix || '!'}`);
    console.log(
        `🔔 群組回覆: ${config.features?.reply_in_group ? '✅ 已啟用' : '❌ 已禁用'}`
    );
    console.log(
        `📝 訊息日誌: ${config.message_logging?.enabled ? '✅ 已啟用' : '❌ 已禁用'}`
    );
    console.log(
        `📥 媒體下載: ${config.media_download?.enabled ? '✅ 已啟用' : '❌ 已禁用'}`
    );
    console.log(
        `🔐 白名單模式: ${config.security?.whitelist_enabled ? '✅ 已啟用' : '❌ 已禁用'}`
    );
    console.log(
        `📄 圖片轉PDF: ${config.media_download?.enabled ? '✅ 已啟用' : '❌ 已禁用'}`
    );
    console.log('🧹 自動清理: ✅ 已啟用');
    console.log('🏥 健康監控: ✅ 已啟用');
    console.log('🛡️ 錯誤恢復: ✅ 已啟用');
    console.log(`👑 管理員數量: ${securityManager.adminNumbers.size}`);
    console.log(`👥 授權群組: ${securityManager.authorizedGroups.size}`);

    // 啟動健康監控系統
    try {
        await healthMonitor.initialize();
        console.log('✅ 健康監控系統已啟動');
    } catch (error) {
        console.error('❌ 健康監控系統啟動失敗:', error.message);
    }

    console.log('📱 開始監聽訊息...');
});

/**
 * 處理私信回覆
 */
async function handlePrivateReply(message, context) {
    try {
        console.log(
            `🔐 處理私信回覆來自 ${context.userId}: ${context.messageBody}`
        );

        const result = await privateMessageManager.handlePrivateReply(
            context.userId,
            message,
            client
        );

        if (result.success) {
            console.log(`✅ 私信回覆處理成功: ${context.userId}`);

            // 如果認證成功，更新安全管理器
            if (result.userId) {
                securityManager.addAdmin(result.userId);
                whitelistManager.addAdmin(result.userId);
                console.log(`👑 已添加管理員: ${result.userId}`);
            }
        } else {
            console.log(`❌ 私信回覆處理失敗: ${result.message}`);
        }
    } catch (error) {
        console.error('❌ 處理私信回覆時發生錯誤:', error);
    }
}

/**
 * 獲取群組信息
 */
async function getGroupInfo(message) {
    try {
        if (message.from.endsWith('@g.us')) {
            const chat = await message.getChat();
            return {
                groupName: chat.name || 'Unknown Group',
                participants: chat.participants?.length || 0,
            };
        }
    } catch (error) {
        console.error('❌ 獲取群組信息失敗:', error.message);
    }
    return { groupName: null, participants: 0 };
}

/**
 * 獲取發送者信息
 */
async function getSenderInfo(message) {
    try {
        const contact = await message.getContact();

        // 提取純數字電話號碼（移除 @c.us 等後綴）
        let phoneNumber = contact.number || message.from;
        if (phoneNumber.includes('@')) {
            phoneNumber = phoneNumber.split('@')[0];
        }

        return {
            pushname: contact.pushname || contact.name || 'Unknown',
            number: phoneNumber,
        };
    } catch (error) {
        console.error('❌ 獲取發送者信息失敗:', error.message);
    }

    // 錯誤處理：從 message.from 提取純數字
    let phoneNumber = message.from;
    if (phoneNumber.includes('@')) {
        phoneNumber = phoneNumber.split('@')[0];
    }

    return { pushname: 'Unknown', number: phoneNumber };
}

/**
 * 格式化來源標識
 */
function formatSourcePrefix(isGroup, groupName) {
    return isGroup ? `[GROUP - ${groupName}]` : '[PRIVATE]';
}

/**
 * 處理命令
 */
async function handleCommand(command, message, context) {
    const prefix = config.bot?.prefix || '!';

    // 統一權限檢查（使用標準化 Context）
    const userPermission = whitelistManager.checkUserPermission(context.userId);

    // 完全開放命令，不受白名單攔截
    const openCommands = [
        'whitelist',
        'help',
        'ping',
        'status',
        'stats',
        'weather',
        '天氣',
        'news',
        '新聞',
        'construction',
        '地盤',
        'monitor',
        '監控',
        'accident',
        '意外',
        'topdf',
        'done',
        'cancel',
    ];
    if (!openCommands.includes(command)) {
        if (!userPermission.hasFullAccess) {
            await message.reply(
                '🚫 權限不足！您無法使用此命令。\n使用 !whitelist 獲取管理員權限。'
            );
            console.log(`🚫 權限拒絕: ${command} 來自 ${context.userId}`);
            return;
        }
    }

    switch (command) {
    case 'ping':
        await message.reply('pong');
        console.log(`✅ 已回覆 pong 給 ${context.userId}`);
        break;

    case 'help':
        const helpText = whitelistManager.generateHelpMessage(
            context.userId
        );

        await message.reply(helpText);
        console.log(`✅ 已回覆 help 給 ${context.userId}`);
        break;

    case 'stats':
        const stats = messageLogger.getTodayStats();
        const statsText = messageLogger.formatStats(stats);

        await message.reply(statsText);
        console.log(`✅ 已回覆 stats 給 ${context.userId}`);
        break;

    case 'mediastats':
        const mediaStats = mediaDownloader.getMediaStats();
        const mediaStatsText = mediaDownloader.formatMediaStats(mediaStats);

        await message.reply(mediaStatsText);
        console.log(`✅ 已回覆 mediastats 給 ${context.userId}`);
        break;

    case 'security':
        const securityStatus = securityManager.getSecurityStatus();
        const securityText =
                securityManager.formatSecurityStatus(securityStatus);

        await message.reply(securityText);
        console.log(`✅ 已回覆 security 給 ${context.userId}`);
        break;

    case 'cleanup':
        // 執行系統清理
        await message.reply('🔄 正在執行系統清理，請稍候...');

        try {
            const cleanupResults = await cleanupManager.performCleanup(30);
            const cleanupText =
                    cleanupManager.formatCleanupResults(cleanupResults);

            await message.reply(cleanupText);
            console.log(`✅ 已執行 cleanup 給 ${context.userId}`);
        } catch (error) {
            await message.reply(`❌ 清理失敗: ${error.message}`);
            console.error(`❌ 清理失敗: ${error.message}`);
        }
        break;

    case 'topdf':
        // 圖片轉PDF互動式收集
        try {
            const pdfTitle = message.body.replace(/#TOPDF/i, '').trim();
            if (!pdfTitle) {
                // 沒有標題 → 提問標題
                const result = imageToPdf.requestTitle(context.userId);
                await message.reply(result.message);
            } else {
                // 有標題 → 直接開始收集
                const result = imageToPdf.setTitle(
                    context.userId,
                    pdfTitle
                );
                if (result) {
                    await message.reply(result.message);
                } else {
                    await message.reply('❌ 啟動PDF收集失敗，請稍後再試。');
                }
            }
            console.log(`📸 PDF會話處理完成 給 ${context.userId}`);
        } catch (error) {
            await message.reply(`❌ 啟動PDF收集失敗: ${error.message}`);
            console.error(`❌ 啟動PDF收集失敗: ${error.message}`);
        }
        break;

    case 'done':
        // 完成PDF收集
        if (!imageToPdf.hasSession(context.userId)) {
            await message.reply(
                '❌ 您沒有進行中的 PDF 收集會話。請先用 #TOPDF [標題] 開始。'
            );
            return;
        }
        try {
            await message.reply('🔄 正在生成 PDF，請稍候...');
            const result = await imageToPdf.finalizePdf(context.userId);
            await message.reply(imageToPdf.formatResult(result));
            // 發送 PDF 文件給用戶
            try {
                const pdfMedia = MessageMedia.fromFilePath(result.pdfPath);
                await client.sendMessage(context.originId, pdfMedia, {
                    caption: `📄 ${result.title}`,
                });
                console.log(
                    `✅ PDF已發送: ${result.fileName} (${result.imageCount}張)`
                );
            } catch (sendError) {
                console.error(`❌ PDF發送失敗: ${sendError.message}`);
                await message.reply(
                    `⚠️ PDF已生成但發送失敗: ${sendError.message}\n文件路徑: ${result.pdfPath}`
                );
            }
        } catch (error) {
            await message.reply(`❌ PDF生成失敗: ${error.message}`);
            console.error(`❌ PDF生成失敗: ${error.message}`);
        }
        break;

    case 'cancel':
        // 取消PDF收集
        if (!imageToPdf.hasSession(context.userId)) {
            await message.reply('❌ 您沒有進行中的 PDF 收集會話。');
            return;
        }
        {
            const cancelResult = imageToPdf.cancelSession(context.userId);
            await message.reply(cancelResult.message);
            console.log(`❌ PDF會話已取消 來自 ${context.userId}`);
        }
        break;

    case 'whitelist':
        // 私信問答認證系統（Phase 7機制）
        console.log(
            `🔐 !whitelist 指令啟動私信問答，來自 ${context.userId}`
        );

        try {
            // 檢查是否已有活躍會話
            if (privateMessageManager.hasActiveSession(context.userId)) {
                const sessionStatus =
                        privateMessageManager.getSessionStatus(context.userId);
                await message.reply(
                    `⏰ 您已有一個活躍的認證會話，請檢查私訊。\n剩餘時間: ${sessionStatus.remainingMinutes} 分鐘`
                );
                return;
            }

            // 啟動私信問答會話
            const result = await privateMessageManager.startPrivateSession(
                context.userId,
                context.originId,
                client
            );

            if (result.success) {
                await message.reply(result.message);
                console.log(`✅ 已啟動私信認證會話給 ${context.userId}`);
            } else {
                await message.reply(result.message);
                console.log(`❌ 啟動私信認證會話失敗: ${result.message}`);
            }
        } catch (error) {
            await message.reply(`❌ 啟動認證會話失敗: ${error.message}`);
            console.error(`❌ 啟動認證會話失敗: ${error.message}`);
        }
        break;

    case 'status':
        const statusText =
                '🤖 *PBOTS 狀態*\n\n' +
                `• 運行時間: ${new Date().toLocaleString()}\n` +
                `• 群組回覆: ${config.features?.reply_in_group ? '✅ 已啟用' : '❌ 已禁用'}\n` +
                `• 訊息日誌: ${config.message_logging?.enabled ? '✅ 已啟用' : '❌ 已禁用'}\n` +
                `• 媒體下載: ${config.media_download?.enabled ? '✅ 已啟用' : '❌ 已禁用'}\n` +
                `• 白名單模式: ${config.security?.whitelist_enabled ? '✅ 已啟用' : '❌ 已禁用'}\n` +
                `• 管理員數量: ${securityManager.adminNumbers.size}\n` +
                `• 授權群組: ${securityManager.authorizedGroups.size}\n` +
                `• 版本: ${config.project?.version || '1.0.0'}`;

        await message.reply(statusText);
        console.log(`✅ 已回覆 status 給 ${context.userId}`);
        break;

    case 'cleanupwhitelist':
        // 清理白名單註冊數據
        console.log(`🧹 清理白名單註冊數據，來自 ${context.userId}`);

        try {
            const result = await whitelistCleanup.cleanupAllWhitelistData();

            if (result.success) {
                const cleanupText =
                        '🧹 *白名單清理完成*\n\n' +
                        '✅ 所有白名單註冊數據已清理\n' +
                        '• 管理員列表: 已清空\n' +
                        '• 授權群組: 已清空\n' +
                        '• 配置文件: 已更新\n' +
                        '• 私信會話: 將在重啟後清理\n\n' +
                        '💡 系統已重置為初始狀態，所有用戶需要重新認證。';

                await message.reply(cleanupText);
                console.log(`✅ 已清理白名單數據給 ${context.userId}`);
            } else {
                await message.reply(`❌ 清理失敗: ${result.message}`);
                console.log(`❌ 清理白名單失敗: ${result.message}`);
            }
        } catch (error) {
            await message.reply(`❌ 清理白名單失敗: ${error.message}`);
            console.error(`❌ 清理白名單失敗: ${error.message}`);
        }
        break;

    case 'weather':
    case '天氣':
        // 香港天氣報告
        console.log(`🌤️ 獲取香港天氣，來自 ${context.userId}`);

        try {
            await message.reply('🌤️ 正在獲取香港天氣資訊，請稍候...');

            const weatherResult =
                    await weatherReporter.getCompleteWeatherReport();

            if (weatherResult.success) {
                await message.reply(weatherResult.report);
                console.log(`✅ 已發送天氣報告給 ${context.userId}`);
            } else {
                await message.reply('❌ 獲取天氣資訊失敗，請稍後再試。');
                console.log(`❌ 天氣報告失敗: ${weatherResult.message}`);
            }
        } catch (error) {
            await message.reply(`❌ 天氣報告失敗: ${error.message}`);
            console.error(`❌ 天氣報告失敗: ${error.message}`);
        }
        break;

    case 'news':
    case '新聞':
    case 'construction':
    case '地盤':
    case 'monitor':
    case '監控':
    case 'accident':
    case '意外':
        // 香港地盤意外新聞（Google News 即時新聞）
        console.log(`📰 獲取香港地盤意外新聞，來自 ${context.userId}`);

        try {
            await message.reply('📰 正在獲取香港地盤意外新聞，請稍候...');

            const newsReport =
                    await newsReporter.getConstructionAccidentNews();

            await message.reply(newsReport);
            console.log(`✅ 已發送地盤意外新聞給 ${context.userId}`);
        } catch (error) {
            await message.reply(`❌ 新聞報告失敗: ${error.message}`);
            console.error(`❌ 新聞報告失敗: ${error.message}`);
        }
        break;

    default:
        await message.reply(
            `❌ 未知命令: ${command}\n使用 ${prefix}help 查看可用命令。`
        );
        console.log(`❌ 未知命令: ${command} 來自 ${context.userId}`);
    }
}

// 消息處理
client.on('message', async (message) => {
    try {
        // 忽略自己的消息
        if (message.fromMe) return;

        const messageBody = message.body.trim();
        const prefix = config.bot?.prefix || '!';

        // 獲取上下文信息（標準化 Context 物件）
        const isGroup = message.from.endsWith('@g.us');
        const groupInfo = await getGroupInfo(message);
        const senderInfo = await getSenderInfo(message);
        const sourcePrefix = formatSourcePrefix(isGroup, groupInfo.groupName);

        // 標準化 Context 物件（Phase 6 標準化）
        const context = {
            // 身份識別
            userId: senderInfo.number, // 永遠指向發言人的個人 ID
            originId: message.from, // 永遠指向訊息的來源 ID
            isGroup: isGroup, // 是否為群組訊息
            pushname: senderInfo.pushname, // 用戶的 WhatsApp 顯示名稱

            // 訊息內容
            messageBody: messageBody,
            message: message, // 原始訊息物件

            // 群組資訊（僅群組時有效）
            groupName: groupInfo.groupName,
            groupId: isGroup ? message.from : null,
        };

        await messageLogger.logMessage(message, context);

        // === PDF 收集會話：攔截照片 ===
        if (
            message.hasMedia &&
            message.type === 'image' &&
            imageToPdf.hasSession(context.userId)
        ) {
            try {
                const media = await message.downloadMedia();
                if (media) {
                    const buffer = Buffer.from(media.data, 'base64');
                    const caption = message.body || '';
                    const fileName =
                        message.filename || `photo_${Date.now()}.jpg`;
                    const count = await imageToPdf.addPhoto(
                        context.userId,
                        buffer,
                        fileName,
                        caption
                    );
                    await message.reply(
                        `✅ 已收到第 ${count} 張照片` +
                            (caption ? `\n📝 說明: ${caption}` : '') +
                            '\n\n繼續發送照片，或發送 *#done* 生成 PDF。'
                    );
                    console.log(
                        `📸 PDF照片 #${count} 來自 ${context.userId}: ${caption}`
                    );
                }
            } catch (error) {
                console.error('❌ 捕獲PDF照片失敗:', error.message);
            }
            return;
        }

        // === PDF 收集會話：等待標題 ===
        if (imageToPdf.isWaitingForTitle(context.userId)) {
            const result = imageToPdf.setTitle(context.userId, messageBody);
            if (result) {
                await message.reply(result.message);
            }
            return;
        }

        // 檢查並下載媒體文件
        if (message.hasMedia) {
            const mediaResult = await mediaDownloader.downloadMedia(
                message,
                senderInfo.pushname
            );
            if (mediaResult) {
                // 更新日誌記錄的媒體路徑
                const mediaContext = {
                    ...context,
                    mediaPath: mediaResult.filePath,
                    mediaType: mediaResult.mediaType,
                    fileSize: mediaResult.fileSize,
                };
                await messageLogger.logMessage(message, mediaContext);
            }
        }

        // 記錄訊息到健康監控
        healthMonitor.recordMessage();

        // 顯示接收到的訊息（包含媒體標識）
        const mediaIcon = message.hasMedia ? '📎 ' : '';
        console.log(
            `📩 ${sourcePrefix} ${senderInfo.pushname}: ${mediaIcon}${messageBody}`
        );

        // 檢查是否為私信回覆（處理私信問答）
        if (
            !isGroup &&
            privateMessageManager.hasActiveSession(context.userId)
        ) {
            await handlePrivateReply(message, context);
            return;
        }

        // 檢查是否是命令
        let command = null;

        if (messageBody.startsWith(prefix)) {
            // 標準前綴命令
            command = messageBody
                .slice(prefix.length)
                .toLowerCase()
                .split(' ')[0];
        } else if (messageBody.toLowerCase().startsWith('#topdf')) {
            // 特殊命令 #TOPDF
            command = 'topdf';
        } else if (messageBody.toLowerCase().trim() === '#done') {
            command = 'done';
        } else if (messageBody.toLowerCase().trim() === '#cancel') {
            command = 'cancel';
        } else {
            // 非命令訊息，記錄但不處理
            return;
        }

        // 檢查群組回覆設置（!whitelist 命令完全開放，不受此限制）
        if (
            isGroup &&
            !config.features?.reply_in_group &&
            command !== 'whitelist'
        ) {
            console.log(`⏸️ 群組回覆已禁用，忽略命令: ${command}`);
            return;
        }

        console.log(
            `🔄 處理 ${command} 命令來自 ${sourcePrefix} ${senderInfo.pushname}`
        );

        // 處理命令（傳遞完整的標準化 Context 物件）
        await handleCommand(command, message, context);
    } catch (error) {
        // 記錄錯誤到恢復系統
        errorRecovery.recordError(error, {
            action: 'handleMessage',
            userId: context?.userId || 'unknown',
            messageBody:
                typeof messageBody !== 'undefined' ? messageBody : 'undefined',
        });

        console.error('❌ 處理消息時發生錯誤:', error);
        try {
            await message.reply('❌ 處理命令時發生錯誤，請稍後再試。');
        } catch (replyError) {
            console.error('❌ 回覆錯誤消息失敗:', replyError);
        }
    }
});

// 錯誤處理（集成錯誤恢復系統）
client.on('auth_failure', async () => {
    const error = new Error('WhatsApp 認證失敗');
    errorRecovery.recordError(error, { action: 'auth_failure' });

    console.error('❌ 認證失敗，請重新掃描 QR Code');

    // 處理認證錯誤
    await errorRecovery.handleAuthError(error);
});

client.on('disconnected', async (reason) => {
    const error = new Error(`連接中斷: ${reason}`);
    errorRecovery.recordError(error, {
        action: 'disconnected',
        reason: reason,
    });

    console.log(`🔌 連接中斷: ${reason}`);
    console.log('🔄 嘗試重新連接...');

    // 處理連接錯誤
    await errorRecovery.handleConnectionError(error, client);
});

client.on('change_state', (state) => {
    console.log(`🔍 狀態變更: ${state}`);

    // 更新心跳
    errorRecovery.updateHeartbeat();
});

// 啟動客戶端
console.log('🚀 啟動 PBOTS 機器人...');
console.log('📁 項目路徑:', __dirname);
console.log('🔧 配置載入:', configPath);

client.initialize().catch((error) => {
    console.error('❌ 啟動失敗:', error);
    process.exit(1);
});

// 優雅關閉
process.on('SIGINT', async () => {
    console.log('\n🛑 收到關閉信號，正在關閉機器人...');

    // 停止健康監控
    healthMonitor.stop();

    // 清理舊資源
    messageLogger.cleanupOldLogs(30);
    securityManager.cleanupOldRecords(30);
    mediaDownloader.cleanupOldMedia(30);
    healthMonitor.cleanupOldErrors(30);
    errorRecovery.cleanupOldErrors(30);

    await client.destroy();
    console.log('👋 PBOTS 機器人已關閉');
    process.exit(0);
});

module.exports = {
    client,
    messageLogger,
};
