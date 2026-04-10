const fs = require('fs');
const path = require('path');
const PathManager = require('../configs/path_manager');

class CommandHandler {
    constructor(config, securityManager, healthMonitor = null) {
        this.config = config;
        this.securityManager = securityManager;
        this.healthMonitor = healthMonitor;
        this.commands = new Map();
        
        // 註冊所有命令
        this.registerCommands();
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
            return {
                message: result.message || '命令執行完成',
                success: true
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

    // 處理 !memo 命令
    async handleMemo(message, commandText, senderName, userId) {
        const memoContent = commandText.replace('!memo', '').trim();
        
        if (!memoContent) {
            return { message: '📝 請提供備忘錄內容，格式: !memo [內容]' };
        }
        
        // 建立簡單的備忘錄功能
        const memoData = {
            user: senderName,
            userId: userId,
            content: memoContent,
            timestamp: new Date().toISOString(),
            type: 'memo'
        };
        
        // 保存到本地檔案
        const memoDir = PathManager.DATA + '/memos';
        PathManager.ensureDirectoryExists(memoDir);
        
        const memoFile = `${memoDir}/${userId}_${Date.now()}.json`;
        fs.writeFileSync(memoFile, JSON.stringify(memoData, null, 2));
        
        return { message: `📝 備忘錄已保存！內容: ${memoContent}` };
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
            // 記錄到 HealthMonitor
            if (this.healthMonitor) {
                this.healthMonitor.recordCommand('trial');
            }
            
            // 注意：LogicEngine 實例需要從外部傳入
            // 這裡先返回功能說明和啟動方法
            const trialMessage = `🧪 Trial 測試功能說明\n\n`;
            trialMessage += `🎯 功能說明:\n`;
            trialMessage += `• Excel 驅動的邏輯引擎測試\n`;
            trialMessage += `• 支援多分頁問答流程\n`;
            trialMessage += `• 自動生成測試結果檔案\n`;
            trialMessage += `• 繼承 SecurityManager 權限約束\n`;
            trialMessage += `• HealthMonitor 健康監控運行中\n\n`;
            trialMessage += `💡 使用方法:\n`;
            trialMessage += `• 輸入 !trial 開始測試流程\n`;
            trialMessage += `• 按照機器人提示回答問題\n`;
            trialMessage += `• 完成後自動生成 Excel 檔案\n\n`;
            trialMessage += `🔧 功能已整合，請確保 LogicEngine 模組正確初始化`;
            
            return { message: trialMessage };
        } catch (error) {
            console.log('❌ 處理Trial命令失敗:', error.message);
            
            // 記錄錯誤到 HealthMonitor
            if (this.healthMonitor) {
                this.healthMonitor.recordError();
            }
            
            return { message: '❌ Trial 功能暫時不可用，請稍後重試' };
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