const fs = require('fs');
const PathManager = require('../configs/path_manager');

class ProfileHandler {
    constructor(config, securityManager = null, pathManager = null, contextStandardizer = null) {
        this.config = config;
        
        // Phase 7 標準化依賴注入
        this.pathManager = pathManager || require('../configs/path_manager');
        this.securityManager = securityManager;
        this.contextStandardizer = contextStandardizer;
    }

    /**
     * 標準 execute 方法 - PBOTS 架構規範
     * 1. 權限檢查
     * 2. 跨頻道處理
     * 3. 執行個人資料邏輯
     * @param {Object} context - 標準化上下文
     * @param {string} command - 指令名稱
     * @returns {Promise<Object>} 執行結果
     */
    async execute(context, command) {
        try {
            // 1. 權限檢查 - 第一步必須檢查
            if (!this.securityManager || !this.securityManager.isWhiteListed(context.userId)) {
                throw new Error('🚫 權限不足，無法查看個人資料');
            }
            
            // 2. 跨頻道處理 - 記錄交互
            if (this.contextStandardizer) {
                await this.contextStandardizer.recordInteraction(context, command);
            }
            
            // 3. 執行個人資料邏輯
            return await this.handleProfileCommand(context);
            
        } catch (error) {
            console.error('❌ ProfileHandler execute 錯誤:', error.message);
            throw error;
        }
    }

    /**
     * 處理個人資料命令
     * @param {Object} context - 標準化上下文
     * @returns {Promise<Object>} 處理結果
     */
    async handleProfileCommand(context) {
        try {
            const { userId, pushname } = context;
            
            // 檢查白名單狀態
            let whitelistStatus = '待驗證';
            let permissionLevel = '普通用戶';
            
            if (this.securityManager && this.securityManager.isWhiteListed(userId)) {
                whitelistStatus = '已認證';
                permissionLevel = '管理員';
            }
            
            const profileMessage = `👤 ${pushname} 的個人資料\n\n` +
                `• 用戶ID: ${userId.substring(0, 20)}...\n` +
                `• 註冊時間: ${new Date().toLocaleString()}\n` +
                `• 白名單狀態: ${whitelistStatus}\n` +
                `• 權限等級: ${permissionLevel}`;
            
            return {
                success: true,
                message: profileMessage,
                data: {
                    userId: userId,
                    pushname: pushname,
                    whitelistStatus: whitelistStatus,
                    permissionLevel: permissionLevel,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ 處理個人資料命令失敗:', error.message);
            return {
                success: false,
                message: '❌ 無法獲取個人資料，請稍後重試'
            };
        }
    }

    /**
     * 獲取詳細的用戶統計數據
     * @param {string} userId - 用戶 ID
     * @returns {Promise<Object>} 統計數據
     */
    async getUserStats(userId) {
        try {
            // 這裡可以添加更多統計功能，如訊息數量、活躍時間等
            const stats = {
                userId: userId,
                messageCount: 0,
                lastActive: new Date().toISOString(),
                joinedDate: new Date().toISOString(),
                isAdmin: this.securityManager ? this.securityManager.isWhiteListed(userId) : false
            };
            
            return stats;
            
        } catch (error) {
            console.error('❌ 獲取用戶統計失敗:', error.message);
            return null;
        }
    }
}

module.exports = ProfileHandler;