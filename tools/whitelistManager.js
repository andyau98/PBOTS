const fs = require('fs');
const path = require('path');

class WhitelistManager {
    constructor(config = {}) {
        this.config = config;
        this.adminNumbers = new Set(config.admin_numbers || []);
        this.authorizedGroups = new Set(config.authorized_groups || []);
        this.whitelistEnabled = config.whitelist_enabled !== false;
        
        // 配置文件路径
        this.configPath = path.join(__dirname, '../configs/settings.json');
    }

    /**
     * 统一权限检查 - 全局权限系统
     */
    checkUserPermission(userId) {
        return {
            isAdmin: this.isAdmin(userId),
            whitelistEnabled: this.whitelistEnabled,
            hasFullAccess: this.hasFullAccess(userId)
        };
    }

    /**
     * 检查是否为管理员
     */
    isAdmin(userId) {
        return this.adminNumbers.has(userId);
    }

    /**
     * 添加管理员
     */
    addAdmin(userId) {
        this.adminNumbers.add(userId);
        console.log(`✅ 已添加管理員: ${userId}`);
    }

    /**
     * 移除管理员
     */
    removeAdmin(userId) {
        this.adminNumbers.delete(userId);
        console.log(`✅ 已移除管理員: ${userId}`);
    }

    /**
     * 检查是否拥有完整访问权限
     */
    hasFullAccess(userId) {
        // 如果白名单未启用，所有用户都有权限
        if (!this.whitelistEnabled) {
            return true;
        }
        
        // 管理员拥有完整权限
        return this.isAdmin(userId);
    }

    /**
     * 处理白名单认证
     */
    async processWhitelistAuth(message, context) {
        try {
            const userId = context.userId;
            
            // 添加用户到管理员列表
            this.adminNumbers.add(userId);
            
            // 更新配置文件
            await this.updateConfigFile();
            
            console.log(`✅ 已添加管理員: ${userId}`);
            
            // 发送认证成功消息
            const successMessage = `✅ *認證成功！*\n\n` +
                `👑 您已成為系統管理員\n` +
                `🔓 擁有完整系統權限\n` +
                `📱 用戶ID: ${userId}\n` +
                `⏰ 生效時間: ${new Date().toLocaleString()}\n\n` +
                `💡 現在您可以使用所有管理員指令，包括:\n` +
                `• !security - 查看安全狀態\n` +
                `• !cleanup - 系統清理\n` +
                `• #TOPDF - 圖片轉PDF\n` +
                `• !whitelist - 幫助其他用戶認證`;
            
            await message.reply(successMessage);
            
            return { 
                success: true, 
                message: successMessage,
                userId: userId 
            };
            
        } catch (error) {
            console.error('❌ 白名单认证失败:', error.message);
            await message.reply(`❌ 認證失敗: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * 显示认证指引
     */
    async showAuthInstructions(message, context) {
        const instructions = `🔐 *白名單認證指引*\n\n` +
            `📱 您的用戶ID: ${context.userId}\n\n` +
            `*認證步驟:*\n` +
            `1. 使用 !whitelist 命令\n` +
            `2. 系統將向您發送私信\n` +
            `3. 在私信中輸入認證密碼\n` +
            `4. 完成後獲得管理員權限\n\n` +
            `💡 認證成功後，您將可以:\n` +
            `• 使用所有管理員指令\n` +
            `• 查看系統安全狀態\n` +
            `• 執行系統清理操作`;
        
        await message.reply(instructions);
        
        return { 
            success: true, 
            message: '顯示認證指引',
            isInstruction: true 
        };
    }

    /**
     * 更新配置文件
     */
    async updateConfigFile() {
        try {
            // 读取当前配置
            const configData = fs.readFileSync(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            
            // 更新管理员列表
            config.security.admin_numbers = Array.from(this.adminNumbers);
            
            // 写回配置文件
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
            
            console.log('✅ 配置文件已更新');
            
        } catch (error) {
            console.error('❌ 更新配置文件失败:', error.message);
            throw error;
        }
    }

    /**
     * 生成动态帮助消息
     */
    generateHelpMessage(userId) {
        const userPermission = this.checkUserPermission(userId);
        const prefix = this.config.bot?.prefix || '!';
        
        let helpText = `🤖 *PBOTS 幫助*\n\n`;
        
        // 基础命令（所有人都可用）
        helpText += `*基礎命令:*\n`;
        helpText += `• ${prefix}ping - 測試機器人響應\n`;
        helpText += `• ${prefix}help - 顯示幫助訊息\n`;
        helpText += `• ${prefix}status - 顯示機器人狀態\n`;
        helpText += `• ${prefix}stats - 查看今日統計數據\n`;
        helpText += `• ${prefix}weather - 香港天氣報告\n`;
        helpText += `• ${prefix}news / 新聞 / 地盤 / 意外 - 香港地盤意外新聞（Google News 即時）\n`;
        
        if (userPermission.hasFullAccess) {
            // 管理员命令
            helpText += `\n*管理員命令:*\n`;
            helpText += `• ${prefix}security - 查看安全狀態\n`;
            helpText += `• ${prefix}cleanup - 系統清理\n`;
            helpText += `• ${prefix}mediastats - 查看媒體統計\n`;
            helpText += `• #TOPDF [標題] - 開始收集照片生成PDF\n` +
                          `  (發送照片 → #done 完成 / #cancel 取消)\n`;
            helpText += `• ${prefix}whitelist - 白名單認證\n`;
            
            helpText += `\n*系統狀態:*\n`;
            helpText += `👑 您擁有完整管理員權限\n`;
            
        } else {
            // 非管理员显示认证指引
            helpText += `\n*進階功能:*\n`;
            helpText += `• ${prefix}whitelist - 獲取管理員權限\n`;
            
            helpText += `\n*認證指引:*\n`;
            helpText += `🔓 使用 ${prefix}whitelist 命令獲取完整權限\n`;
            helpText += `💡 認證後可使用所有管理員功能`;
        }
        
        helpText += `\n*系統狀態:*\n`;
        helpText += `白名單模式: ${this.whitelistEnabled ? '✅ 已啟用' : '❌ 已禁用'}`;
        
        return helpText;
    }

    /**
     * 获取白名单状态
     */
    getWhitelistStatus() {
        return {
            enabled: this.whitelistEnabled,
            adminCount: this.adminNumbers.size,
            authorizedGroupCount: this.authorizedGroups.size,
            adminList: Array.from(this.adminNumbers),
            authorizedGroups: Array.from(this.authorizedGroups)
        };
    }

    /**
     * 格式化白名单状态
     */
    formatWhitelistStatus(status) {
        let text = `🔐 *白名單狀態*\n\n`;
        text += `📅 報告時間: ${new Date().toLocaleString()}\n`;
        text += `🔧 白名單模式: ${status.enabled ? '✅ 已啟用' : '❌ 已禁用'}\n`;
        text += `👑 管理員數量: ${status.adminCount}\n`;
        text += `👥 授權群組: ${status.authorizedGroupCount}\n\n`;
        
        if (status.adminCount > 0) {
            text += `*管理員列表:*\n`;
            status.adminList.forEach(admin => {
                text += `• ${admin}\n`;
            });
            text += `\n`;
        }
        
        if (status.authorizedGroupCount > 0) {
            text += `*授權群組列表:*\n`;
            status.authorizedGroups.forEach(group => {
                text += `• ${group}\n`;
            });
        }
        
        return text;
    }
}

module.exports = WhitelistManager;