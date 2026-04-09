const fs = require('fs');
const path = require('path');

class SecurityManager {
    constructor(config) {
        this.config = config;
        this.securityConfig = config.security || {};
        this.adminNumbers = this.securityConfig.admin_numbers || [];
        this.authorizedGroups = this.securityConfig.authorized_groups || [];
        this.whitelistEnabled = this.securityConfig.whitelist_enabled !== false;
    }

    // 檢查用戶權限
    checkPermission(userId, groupId = null, commandPermission = 'basic') {
        // 如果白名單未啟用，所有用戶都有權限
        if (!this.whitelistEnabled) {
            return true;
        }

        // 檢查管理員權限
        if (this.adminNumbers.includes(userId)) {
            return true;
        }

        // 檢查授權群組權限
        if (groupId && this.authorizedGroups.includes(groupId)) {
            return true;
        }

        // 檢查命令權限級別
        switch (commandPermission) {
            case 'basic':
                return true; // 基礎命令對所有用戶開放
            case 'authorized':
                return false; // 需要授權
            case 'admin':
                return false; // 僅管理員
            default:
                return false;
        }
    }

    // 檢查是否為管理員
    isAdmin(userId) {
        return this.adminNumbers.includes(userId);
    }

    // 檢查是否在授權群組中
    isInAuthorizedGroup(groupId) {
        return this.authorizedGroups.includes(groupId);
    }

    // 處理白名單認證命令 (完全開放，不受白名單限制)
    async handleWhitelistCommand(message, commandText, userId) {
        console.log(`🔓 !whitelist 指令完全開放，處理來自 ${userId} 的認證請求`);
        
        try {
            // 獲取用戶的 WhatsApp ID
            const userWhatsAppId = userId;
            
            // 檢查是否已經是管理員
            if (this.isAdmin(userWhatsAppId)) {
                return {
                    success: true,
                    message: `✅ 您已經是管理員，無需再次認證。您的 ID: ${userWhatsAppId}`
                };
            }
            
            // 添加用戶到管理員列表
            const added = this.addAdmin(userWhatsAppId);
            
            if (added) {
                return {
                    success: true,
                    message: `✅ 認證成功！您已被添加為管理員。您的 ID: ${userWhatsAppId}\n\n現在您可以訪問所有管理員功能。`
                };
            } else {
                return {
                    success: false,
                    message: `❌ 認證失敗，請聯繫系統管理員。`
                };
            }
            
        } catch (error) {
            console.log('❌ 白名單認證處理失敗:', error.message);
            return {
                success: false,
                message: `❌ 認證過程發生錯誤: ${error.message}`
            };
        }
    }

    // 生成動態幫助訊息（根據用戶權限）
    generateHelpMessage(userId) {
        const isAdmin = this.isAdmin(userId);
        const whitelistEnabled = this.whitelistEnabled;
        
        let helpMessage = `🤖 可用命令:\n`;
        
        // 基礎命令（所有用戶）
        helpMessage += `\n📋 基礎命令:\n`;
        helpMessage += `• !ping - 測試機器人響應\n`;
        helpMessage += `• !help - 顯示幫助訊息\n`;
        
        if (whitelistEnabled && !isAdmin) {
            helpMessage += `• !whitelist - 申請管理員權限\n`;
        }
        
        // 授權命令
        if (isAdmin || !whitelistEnabled) {
            helpMessage += `\n🔧 授權命令:\n`;
            helpMessage += `• !stats - 查看今日統計數據\n`;
            helpMessage += `• !mediastats - 查看媒體統計數據\n`;
        }
        
        // 管理員命令
        if (isAdmin) {
            helpMessage += `\n🛡️ 管理員命令:\n`;
            helpMessage += `• !security - 查看安全狀態\n`;
            helpMessage += `• #TOPDF - 將最近圖片轉換為PDF\n`;
            helpMessage += `• !cleanup - 清理舊文件\n`;
        }
        
        if (whitelistEnabled && !isAdmin) {
            helpMessage += `\n💡 提示：使用 !whitelist 命令申請管理員權限`;
        }
        
        return helpMessage;
    }

    // 記錄未授權訪問
    logUnauthorizedAccess(command, sender, type, reason, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `
🚫 Unauthorized Access Attempt - ${timestamp}
   Command: ${command}
   Sender: ${sender}
   Type: ${type}
   Reason: ${reason}
   Message: ${message}
───────────────────────────────────────────────────
`;
        
        console.log(logEntry);
        
        // 記錄到文件
        this.logToFile(logEntry);
    }

    // 記錄到安全日誌文件
    logToFile(logEntry) {
        try {
            const logPath = path.join(__dirname, '../logs/security.log');
            const logDir = path.dirname(logPath);
            
            // 確保日誌目錄存在
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            
            // 追加日誌
            fs.appendFileSync(logPath, logEntry, 'utf8');
        } catch (error) {
            console.log('❌ 安全日誌記錄失敗:', error.message);
        }
    }

    // 生成安全狀態報告
    getSecurityStatus() {
        return {
            whitelist_enabled: this.whitelistEnabled,
            admin_count: this.adminNumbers.length,
            authorized_groups_count: this.authorizedGroups.length,
            admin_numbers: this.adminNumbers,
            authorized_groups: this.authorizedGroups
        };
    }

    // 格式化安全狀態報告
    formatSecurityStatus() {
        const status = this.getSecurityStatus();
        
        let statusMessage = `🛡️ 安全狀態報告\n`;
        statusMessage += `• 白名單系統: ${status.whitelist_enabled ? '啟用' : '停用'}\n`;
        statusMessage += `• 管理員數量: ${status.admin_count}\n`;
        statusMessage += `• 授權群組數量: ${status.authorized_groups_count}\n`;
        
        if (status.admin_count > 0) {
            statusMessage += `• 管理員列表: ${status.admin_numbers.join(', ')}\n`;
        }
        
        if (status.authorized_groups_count > 0) {
            statusMessage += `• 授權群組: ${status.authorized_groups.join(', ')}\n`;
        }
        
        return statusMessage;
    }

    // 添加管理員
    addAdmin(userId) {
        if (!this.adminNumbers.includes(userId)) {
            this.adminNumbers.push(userId);
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 移除管理員
    removeAdmin(userId) {
        const index = this.adminNumbers.indexOf(userId);
        if (index > -1) {
            this.adminNumbers.splice(index, 1);
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 保存配置
    saveConfig() {
        try {
            const configPath = path.join(__dirname, '../configs/settings.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            // 更新安全配置
            config.security = {
                admin_numbers: this.adminNumbers,
                authorized_groups: this.authorizedGroups,
                whitelist_enabled: this.whitelistEnabled
            };
            
            // 寫回文件
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            
            // 重新加載配置
            this.config.security = config.security;
            
            return true;
        } catch (error) {
            console.log('❌ 配置保存失敗:', error.message);
            return false;
        }
    }
}

module.exports = SecurityManager;