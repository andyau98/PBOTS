const fs = require('fs');
const path = require('path');
const PathManager = require('../configs/path_manager');

class CommandHandler {
    constructor(config, securityManager, healthMonitor = null, pathManager = null, contextStandardizer = null) {
        this.config = config;
        this.securityManager = securityManager;
        this.healthMonitor = healthMonitor;
        
        // Phase 7 標準化依賴注入
        this.pathManager = pathManager || require('../configs/path_manager');
        this.contextStandardizer = contextStandardizer;
        this.commands = new Map();
        
        // 註冊所有命令
        this.registerCommands();
    }

    /**
     * 標準 execute 方法 - PBOTS 架構規範
     * 1. 權限檢查
     * 2. 跨頻道處理
     * 3. 執行命令邏輯
     * @param {Object} context - 標準化上下文
     * @param {string} command - 指令名稱
     * @returns {Promise<Object>} 執行結果
     */
    async execute(context, command) {
        try {
            // 1. 權限檢查 - 第一步必須檢查
            if (!this.checkPermission(context, command)) {
                throw new Error('🚫 權限不足，無法執行此命令');
            }
            
            // 2. 跨頻道處理 - 記錄交互
            if (this.contextStandardizer) {
                await this.contextStandardizer.recordInteraction(context, command);
            }
            
            // 3. 執行命令邏輯
            return await this.handleCommandLogic(context, command);
            
        } catch (error) {
            console.error('❌ CommandHandler execute 錯誤:', error.message);
            throw error;
        }
    }

    /**
     * 檢查命令權限
     * @param {Object} context - 標準化上下文
     * @param {string} command - 指令名稱
     * @returns {boolean} 是否有權限
     */
    checkPermission(context, command) {
        const commandInfo = this.commands.get(command);
        if (!commandInfo) {
            return false;
        }
        
        const { permission } = commandInfo;
        
        // 公共命令：所有人都可以執行
        if (permission === 'public') {
            return true;
        }
        
        // 基本命令：需要基本權限
        if (permission === 'basic') {
            return true; // 暫時所有人都可以執行基本命令
        }
        
        // 授權命令：需要白名單權限
        if (permission === 'authorized') {
            return this.securityManager.isWhiteListed(context.userId);
        }
        
        // 管理員命令：需要管理員權限
        if (permission === 'admin') {
            return this.securityManager.isWhiteListed(context.userId);
        }
        
        return false;
    }

    /**
     * 處理命令邏輯 - 標準化實現
     * @param {Object} context - 標準化上下文
     * @param {string} command - 指令名稱
     * @returns {Promise<Object>} 處理結果
     */
    async handleCommandLogic(context, command) {
        const { userId, pushname, messageBody, isGroup } = context;
        
        try {
            const commandInfo = this.commands.get(command);
            if (!commandInfo) {
                throw new Error(`未知的命令: ${command}`);
            }
            
            // 執行命令處理器
            const result = await commandInfo.handler(context.message, messageBody, pushname, userId);
            
            return {
                success: true,
                message: result.message || '',
                data: result.data || {},
                command: command,
                user: pushname,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ 命令邏輯處理失敗: ${error.message}`);
            throw error;
        }
    }

    // 註冊所有可用命令
    registerCommands() {
        this.commands.set('help', {
            handler: this.handleHelp.bind(this),
            description: '顯示幫助訊息',
            permission: 'basic'
        });

        this.commands.set('ping', {
            handler: this.handlePing.bind(this),
            description: '測試機器人響應',
            permission: 'basic'
        });

        this.commands.set('stats', {
            handler: this.handleStats.bind(this),
            description: '查看今日統計數據',
            permission: 'basic'
        });

        this.commands.set('version', {
            handler: this.handleVersion.bind(this),
            description: '查看機器人版本',
            permission: 'basic'
        });

        this.commands.set('whitelist', {
            handler: this.handleWhitelist.bind(this),
            description: '申請管理員權限',
            permission: 'public'
        });

        this.commands.set('memo', {
            handler: this.handleMemo.bind(this),
            description: '建立備忘錄',
            permission: 'basic'
        });

        this.commands.set('profile', {
            handler: this.handleProfile.bind(this),
            description: '查看個人資料',
            permission: 'basic'
        });

        this.commands.set('excel', {
            handler: this.handleExcel.bind(this),
            description: 'Excel 功能（開發中）',
            permission: 'basic'
        });

        this.commands.set('pdf', {
            handler: this.handlePdf.bind(this),
            description: '將最近圖片轉換為PDF',
            permission: 'basic'
        });

        this.commands.set('trial', {
            handler: this.handleTrial.bind(this),
            description: '測試 Excel 邏輯引擎功能',
            permission: 'basic'
        });

        this.commands.set('hi', {
            handler: this.handleHi.bind(this),
            description: '打招呼並發送私訊',
            permission: 'public'
        });
    }

    // 處理命令
    async handleCommand(message, commandText, senderName, userId) {
        const command = commandText.split(' ')[0].replace('!', '');
        
        if (!this.commands.has(command)) {
            return {
                message: `❓ 未知命令 "!${command}"，請使用 !help 查看可用命令`,
                success: false
            };
        }

        try {
            const commandConfig = this.commands.get(command);
            
            // 檢查權限（使用 SecurityManager）
            const hasPermission = this.securityManager.checkPermission(userId, null, commandConfig.permission);
            
            if (!hasPermission) {
                return {
                    message: `⛔ 權限不足！您沒有執行 !${command} 的權限`,
                    success: false
                };
            }
            
            const result = await commandConfig.handler(message, commandText, senderName, userId);
            
            // 返回完整的結果，包括跨頻道相關屬性
            return {
                message: result.message || '命令執行完成',
                success: true,
                requiresPrivateMessage: result.requiresPrivateMessage || false,
                privateMessage: result.privateMessage || null,
                requiresGroupReport: result.requiresGroupReport || false,
                groupReportMessage: result.groupReportMessage || null
            };
        } catch (error) {
            console.log(`❌ 處理命令 !${command} 失敗:`, error.message);
            return {
                message: `❌ 命令執行失敗: ${error.message}`,
                success: false
            };
        }
    }

    // 處理 !help 命令
    async handleHelp(message, commandText, senderName, userId) {
        let helpMessage = `🤖 ${this.config.bot.name} 幫助\n\n📋 可用命令:\n`;
        
        // 生成命令列表
        for (const [cmd, config] of this.commands) {
            helpMessage += `!${cmd} - ${config.description}\n`;
        }
        
        helpMessage += `\n💡 使用方式:\n在私聊或群組中輸入命令即可\n\n🔧 功能狀態:\n`;
        helpMessage += `• QR登入: ${this.config.features.qr_login ? '✅ 啟用' : '❌ 停用'}\n`;
        helpMessage += `• 持久化會話: ${this.config.features.persistent_session ? '✅ 啟用' : '❌ 停用'}\n`;
        helpMessage += `• 群組回覆: ${this.config.features.reply_in_group ? '✅ 啟用' : '❌ 停用'}\n`;
        helpMessage += `• 白名單功能: ${this.config.security?.whitelist_enabled ? '✅ 啟用' : '❌ 停用'}\n`;
        helpMessage += `• 備忘錄功能: ✅ 基本功能`;
        
        return { message: helpMessage };
    }

    // 處理 !ping 命令
    async handlePing(message, commandText, senderName, userId) {
        return { message: '🏓 pong! Bot 運作正常' };
    }

    // 處理 !stats 命令
    async handleStats(message, commandText, senderName, userId) {
        const statsMessage = `📊 ${this.config.bot.name} 統計\n\n`;
        statsMessage += `• 啟動時間: ${new Date().toLocaleString()}\n`;
        statsMessage += `• 狀態: ✅ 正常運行\n`;
        statsMessage += `• 發送者: ${senderName}\n`;
        statsMessage += `• 訊息類型: ${message.hasMedia ? '媒體檔案' : '文字訊息'}\n`;
        statsMessage += `• 白名單狀態: 啟用中\n\n`;
        statsMessage += `💡 功能完整啟用`;
        
        return { message: statsMessage };
    }

    // 處理 !version 命令
    async handleVersion(message, commandText, senderName, userId) {
        const versionMessage = `🤖 ${this.config.bot.name}\n\n`;
        versionMessage += `版本: ${this.config.bot.version || '1.0.0'}\n`;
        versionMessage += `描述: ${this.config.bot.description || 'Engineering WhatsApp Bot'}\n`;
        versionMessage += `狀態: ✅ 在線運行\n`;
        versionMessage += `白名單: ✅ 完整功能`;
        
        return { message: versionMessage };
    }

    // 處理 !whitelist 命令
    async handleWhitelist(message, commandText, senderName, userId) {
        console.log(`🔓 處理白名單認證請求來自 ${senderName}`);
        const result = await this.securityManager.handleWhitelistCommand(message, commandText, userId);
        return { message: result.message };
    }

    // 處理 !memo 命令 - 使用 group-pm-group 流程
    async handleMemo(message, commandText, senderName, userId) {
        try {
            // 檢查是否為群組訊息
            const chat = await message.getChat();
            const isGroup = chat.isGroup;
            
            if (isGroup) {
                // 群組中觸發：要求用戶在私訊中輸入內容
                return {
                    message: `📝 請檢查私訊輸入備忘錄內容`,
                    success: true,
                    requiresPrivateMessage: true,
                    privateMessage: `📝 備忘錄功能\n\n請輸入您的備忘錄內容：\n\n💡 提示：輸入完成後，備忘錄將自動保存並在群組中回報結果`
                };
            } else {
                // 私訊中處理：保存備忘錄
                const memoContent = commandText.replace('!memo', '').trim();
                
                if (!memoContent) {
                    return { 
                        message: '📝 請提供備忘錄內容，格式: !memo [內容]',
                        success: true 
                    };
                }
                
                // 建立簡單的備忘錄功能
                const memoData = {
                    user: senderName,
                    userId: userId,
                    content: memoContent,
                    timestamp: new Date().toISOString(),
                    type: 'memo'
                };
                
                // 保存到本地檔案（使用依賴注入的 PathManager）
                const memoDir = this.pathManager.DATA + '/memos';
                this.pathManager.ensureDirectoryExists(memoDir);
                
                const memoFile = `${memoDir}/${userId}_${Date.now()}.json`;
                fs.writeFileSync(memoFile, JSON.stringify(memoData, null, 2));
                
                return { 
                    message: `✅ 備忘錄已保存！內容: ${memoContent}`,
                    success: true,
                    requiresGroupReport: true,
                    groupReportMessage: `📝 ${senderName} 的備忘錄已保存完成`
                };
            }
        } catch (error) {
            console.error('❌ 處理備忘錄命令失敗:', error.message);
            return {
                message: `❌ 備忘錄功能暫時不可用: ${error.message}`,
                success: false
            };
        }
    }

    // 處理 !profile 命令
    async handleProfile(message, commandText, senderName, userId) {
        const profileMessage = `👤 ${senderName} 的個人資料\n\n`;
        profileMessage += `• 用戶ID: ${userId.substring(0, 20)}...\n`;
        profileMessage += `• 註冊時間: ${new Date().toLocaleString()}\n`;
        profileMessage += `• 白名單狀態: 待驗證\n`;
        profileMessage += `• 權限等級: 普通用戶`;
        
        return { message: profileMessage };
    }

    // 處理 !excel 命令 - 啟動 Excel 填表流程
    async handleExcel(message, commandText, senderName, userId) {
        try {
            // 注意：LogicEngine 實例需要從外部傳入
            // 這裡先返回功能說明和啟動方法
            const excelMessage = `📊 Excel 填表功能已啟用\n\n`;
            excelMessage += `🎯 功能說明:\n`;
            excelMessage += `• 智能問答填表系統\n`;
            excelMessage += `• 支援文字、選項、照片輸入\n`;
            excelMessage += `• 自動生成 Excel 結果檔案\n`;
            excelMessage += `• 邏輯跳轉和條件分支\n\n`;
            excelMessage += `💡 使用方法:\n`;
            excelMessage += `• 輸入 !excel start 開始填表\n`;
            excelMessage += `• 按照機器人提示回答問題\n`;
            excelMessage += `• 完成後自動生成 Excel 檔案\n\n`;
            excelMessage += `🔧 功能已整合，請確保 LogicEngine 模組正確初始化`;
            
            return { message: excelMessage };
        } catch (error) {
            console.log('❌ 處理Excel命令失敗:', error.message);
            return { message: '❌ Excel 功能暫時不可用，請稍後重試' };
        }
    }

    // 處理 !pdf 命令
    async handlePdf(message, commandText, senderName, userId) {
        try {
            // 注意：ImageToPdf 實例需要從外部傳入
            // 這裡先返回基本功能說明
            const pdfMessage = `📄 PDF 功能說明\n\n`;
            pdfMessage += `• 功能: 將最近上傳的圖片轉換為PDF\n`;
            pdfMessage += `• 支援格式: JPG, PNG, GIF\n`;
            pdfMessage += `• 轉換數量: 最多3張圖片\n`;
            pdfMessage += `• 使用方法: 先上傳圖片，然後使用 !pdf\n\n`;
            pdfMessage += `💡 功能已整合，請確保 ImageToPdf 模組正確初始化`;
            
            return { message: pdfMessage };
        } catch (error) {
            console.log('❌ 處理PDF命令失敗:', error.message);
            return { message: '❌ PDF 功能暫時不可用，請稍後重試' };
        }
    }

    // 處理 !trial 命令
    async handleTrial(message, commandText, senderName, userId) {
        try {
            // 檢查是否為群組訊息
            const chat = await message.getChat();
            const isGroup = chat.isGroup;
            
            if (isGroup) {
                return {
                    message: `📝 試用功能已啟動，請在短訊中繼續操作。`,
                    success: true,
                    requiresPrivateMessage: true
                };
            } else {
                return {
                    message: `📝 試用功能：這是一個測試功能，用於驗證 Excel 邏輯引擎。`,
                    success: true
                };
            }
        } catch (error) {
            console.error('❌ 處理試用功能失敗:', error.message);
            return {
                message: `❌ 試用功能暫時不可用: ${error.message}`,
                success: false
            };
        }
    }

    /**
     * 處理打招呼命令
     * @param {Object} message - WhatsApp 訊息物件
     * @param {string} commandText - 完整命令文字
     * @param {string} senderName - 發送者名稱
     * @param {string} userId - 用戶 ID
     * @returns {Promise<Object>} 處理結果
     */
    async handleHi(message, commandText, senderName, userId) {
        try {
            // 檢查是否為群組訊息
            const chat = await message.getChat();
            const isGroup = chat.isGroup;
            
            if (isGroup) {
                return {
                    message: `👋 你好！我已經發送短訊給你打招呼了，請檢查短訊。`,
                    success: true,
                    requiresPrivateMessage: true,
                    privateMessage: `👋 你好 ${senderName}！\n\n很高興在短訊中與你對話！\n\n💡 你可以：\n• 發送普通訊息與我聊天\n• 使用 !help 查看可用命令\n• 使用 !whitelist 申請管理員權限`
                };
            } else {
                return {
                    message: `👋 你好 ${senderName}！\n\n很高興與你對話！\n\n💡 你可以：\n• 發送普通訊息與我聊天\n• 使用 !help 查看可用命令\n• 使用 !whitelist 申請管理員權限`,
                    success: true
                };
            }
        } catch (error) {
            console.error('❌ 處理打招呼命令失敗:', error.message);
            return {
                message: `❌ 打招呼功能暫時不可用: ${error.message}`,
                success: false
            };
        }
    }

    // 獲取所有命令列表（用於幫助訊息）
    getCommandList() {
        const commands = [];
        for (const [cmd, config] of this.commands) {
            commands.push({
                command: `!${cmd}`,
                description: config.description,
                permission: config.permission
            });
        }
        return commands;
    }
}

module.exports = CommandHandler;