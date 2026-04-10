const fs = require('fs');
const PathManager = require('../configs/path_manager');

class PrivateMessageHandler {
    constructor(config, securityManager, contextStandardizer, pathManager = null) {
        this.config = config;
        
        // Phase 7 標準化依賴注入
        this.pathManager = pathManager || require('../configs/path_manager');
        this.securityManager = securityManager;
        this.contextStandardizer = contextStandardizer;
    }

    /**
     * 標準 execute 方法 - PBOTS 架構規範
     * PrivateMessageHandler 作為私訊處理核心，必須全面開放
     * @param {Object} context - 標準化上下文
     * @param {string} command - 指令名稱
     * @returns {Promise<Object>} 執行結果
     */
    async execute(context, command) {
        try {
            // PrivateMessageHandler 全面開放，不進行權限檢查
            
            // 跨頻道處理 - 記錄交互
            if (this.contextStandardizer) {
                await this.contextStandardizer.recordInteraction(context, command);
            }
            
            // 執行私訊處理邏輯
            return await this.handlePrivateMessageLogic(context, command);
            
        } catch (error) {
            console.error('❌ PrivateMessageHandler execute 錯誤:', error.message);
            throw error;
        }
    }

    /**
     * 處理私訊邏輯 - 全面開放實現
     * @param {Object} context - 標準化上下文
     * @param {string} command - 指令名稱
     * @returns {Promise<Object>} 處理結果
     */
    async handlePrivateMessageLogic(context, command) {
        const { userId, pushname, messageBody } = context;
        
        try {
            // 檢查是否有跨頻道交互記錄（白名單驗證等）
            const pendingInteraction = this.contextStandardizer.getActiveInteraction(userId);
            
            if (pendingInteraction && pendingInteraction.command === 'whitelist') {
                console.log(`🔐 處理密碼驗證請求來自 ${pushname}`);
                
                // 使用 SecurityManager 處理密碼驗證
                const passwordResult = await this.securityManager.handlePasswordVerification(
                    context.message, 
                    messageBody, 
                    userId, 
                    false, // 私訊不是群組
                    null   // 沒有群組名稱
                );
                
                if (passwordResult.success) {
                    // 私訊回覆用戶
                    const privateReply = "✅ 認證成功。";
                    console.log(`✅ 密碼驗證成功: 用戶 ${pushname} 已成為管理員`);
                    
                    return {
                        success: true,
                        message: privateReply,
                        userAuthenticated: true,
                        interactionCompleted: true
                    };
                } else {
                    return {
                        success: false,
                        message: passwordResult.message,
                        userAuthenticated: false,
                        interactionCompleted: false
                    };
                }
            }
            
            // 🔓 全面開放：處理用戶主動發送的私訊
            return await this.handleUserPrivateMessage(context);
            
        } catch (error) {
            console.error('❌ 私訊邏輯處理失敗:', error.message);
            throw error;
        }
    }

    /**
     * 處理用戶主動發送的私訊 - 全面開放
     * @param {Object} context - 標準化上下文
     * @returns {Promise<Object>} 處理結果
     */
    async handleUserPrivateMessage(context) {
        const { userId, pushname, messageBody } = context;
        
        console.log(`📩 收到用戶 ${pushname} 的主動私訊: ${messageBody}`);
        
        // 檢查是否為命令（以 ! 開頭）
        if (messageBody.startsWith('!')) {
            const command = messageBody.split(' ')[0].replace('!', '');
            
            switch (command) {
                case 'help':
                    return {
                        success: true,
                        message: `🔓 私訊幫助

📋 可用命令：
• !help - 顯示此幫助訊息
• !whitelist - 申請管理員權限
• !profile - 查看個人資料
• !memo [內容] - 建立備忘錄

💡 提示：您也可以直接發送訊息與我對話`
                    };
                    
                case 'whitelist':
                    // 在私訊中直接處理白名單申請
                    const whitelistResult = await this.handlePrivateWhitelist(context);
                    return whitelistResult;
                    
                case 'profile':
                    return {
                        success: true,
                        message: `👤 個人資料

📛 姓名: ${pushname}
🆔 用戶ID: ${userId}
🔐 權限狀態: ${this.securityManager.isWhiteListed(userId) ? '管理員' : '普通用戶'}`
                    };
                    
                default:
                    return {
                        success: true,
                        message: `❓ 未知命令: !${command}
💡 使用 !help 查看可用命令`
                    };
            }
        }
        
        // 非命令訊息 - 提供友好回應
        return {
            success: true,
            message: `👋 你好 ${pushname}！

📩 我收到了你的訊息："${messageBody}"

💡 你可以：
• 使用 !help 查看可用命令
• 使用 !whitelist 申請管理員權限
• 直接與我對話`
        };
    }

    /**
     * 處理私訊中的白名單申請
     * @param {Object} context - 標準化上下文
     * @returns {Promise<Object>} 處理結果
     */
    async handlePrivateWhitelist(context) {
        const { userId, pushname } = context;
        
        // 檢查是否已在白名單中
        if (this.securityManager.isWhiteListed(userId)) {
            return {
                success: true,
                message: `✅ ${pushname} 您已經是管理員，無需再次認證。`
            };
        }
        
        // 在私訊中直接要求密碼
        return {
            success: true,
            message: `🔐 管理員認證申請

請輸入管理員密碼以獲取權限。

💡 請直接在此對話框輸入正確的密碼。`,
            requiresPassword: true
        };
    }

    /**
     * 處理私訊回覆（階段6跨頻道核心功能）
     * @param {Object} client - WhatsApp 客戶端
     * @param {Object} context - 標準化上下文
     * @returns {Promise<Object>} 處理結果
     */
    async handlePrivateMessageReply(client, context) {
        try {
            const { userId, pushname, messageBody } = context;
            
            // 檢查是否有跨頻道交互記錄
            const pendingInteraction = this.contextStandardizer.getActiveInteraction(userId);
            
            if (pendingInteraction && pendingInteraction.command === 'whitelist') {
                console.log(`🔐 處理密碼驗證請求來自 ${pushname}`);
                
                // 使用 securityManager 處理密碼驗證
                const passwordResult = await this.securityManager.handlePasswordVerification(
                    context.message, 
                    messageBody, 
                    userId, 
                    false, // 私訊不是群組
                    null   // 沒有群組名稱
                );
                
                if (passwordResult.success) {
                    // 私訊回覆用戶
                    const privateReply = "✅ 認證成功。";
                    console.log(`✅ 密碼驗證成功: 用戶 ${pushname} 已成為管理員`);
                    
                    // 檢查是否有跨頻道交互記錄（從群組觸發）
                    let groupNotificationSent = false;
                    if (pendingInteraction.originId) {
                        groupNotificationSent = await this.sendGroupNotification(client, pendingInteraction, pushname, context);
                    }
                    
                    return {
                        success: true,
                        message: privateReply,
                        groupNotificationSent: groupNotificationSent,
                        userAuthenticated: true,
                        interactionCompleted: true
                    };
                } else {
                    return {
                        success: false,
                        message: passwordResult.message,
                        userAuthenticated: false,
                        interactionCompleted: false
                    };
                }
            }
            
            // 沒有待處理的交互
            return {
                success: true,
                message: '',
                handled: false,
                noPendingInteraction: true
            };
            
        } catch (error) {
            console.error('❌ 處理私訊回覆失敗:', error.message);
            return {
                success: false,
                message: '❌ 私訊處理失敗，請稍後重試',
                error: error.message
            };
        }
    }

    /**
     * 發送群組通知
     * @param {Object} client - WhatsApp 客戶端
     * @param {Object} pendingInteraction - 待處理的交互
     * @param {string} pushname - 用戶名稱
     * @param {Object} context - 上下文
     * @returns {Promise<boolean>} 是否成功發送
     */
    async sendGroupNotification(client, pendingInteraction, pushname, context) {
        try {
            const groupNotification = `✅ @${pendingInteraction.userDisplayName || pushname} 認證成功，已獲取管理員權限。`;
            
            await this.contextStandardizer.safeSendMessage(
                client,
                pendingInteraction.originId,
                groupNotification,
                context
            );
            
            console.log(`📢 已發送群組通知到 ${pendingInteraction.originGroupName || pendingInteraction.originId}`);
            
            // 清理交互記錄
            this.contextStandardizer.completeInteraction(context.userId);
            
            return true;
            
        } catch (error) {
            console.log(`❌ 發送群組通知失敗: ${error.message}`);
            return false;
        }
    }

    /**
     * 檢查是否需要處理私訊
     * @param {Object} context - 標準化上下文
     * @returns {boolean} 是否需要處理
     */
    shouldHandlePrivateMessage(context) {
        const { messageBody, isGroup } = context;
        
        // 只處理私訊（非群組）且不是命令
        return !isGroup && 
               !messageBody.startsWith('!') && 
               messageBody.trim().length > 0;
    }

    /**
     * 處理所有私訊
     * @param {Object} client - WhatsApp 客戶端
     * @param {Object} context - 標準化上下文
     * @returns {Promise<Object>} 處理結果
     */
    async handleAllPrivateMessages(client, context) {
        try {
            // 檢查是否需要處理
            if (!this.shouldHandlePrivateMessage(context)) {
                return {
                    success: true,
                    handled: false,
                    reason: '不是私訊或是指令'
                };
            }
            
            // 處理私訊回覆
            return await this.handlePrivateMessageReply(client, context);
            
        } catch (error) {
            console.error('❌ 處理私訊失敗:', error.message);
            return {
                success: false,
                message: '❌ 私訊處理失敗',
                error: error.message
            };
        }
    }
}

module.exports = PrivateMessageHandler;