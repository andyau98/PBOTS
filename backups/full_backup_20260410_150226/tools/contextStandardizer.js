class ContextStandardizer {
    constructor() {
        this.activeInteractions = new Map();
    }

    /**
     * 標準化訊息上下文
     * @param {object} message - WhatsApp 訊息物件
     * @returns {Promise<object>} 標準化 context 物件
     */
    async standardizeContext(message) {
        try {
            const chat = await message.getChat();
            const contact = await message.getContact();
            
            // 獲取基本訊息資訊
            const messageBody = message.body || '';
            const isGroup = chat.isGroup;
            
            // 標準化身份識別
            const userId = contact.id._serialized; // 永遠指向發言人的個人 ID
            const originId = message.from; // 永遠指向訊息的來源 ID
            const pushname = contact.pushname || contact.name || 'Unknown User';
            
            // 構建標準化 context
            const context = {
                // 身份識別
                userId,
                originId,
                isGroup,
                pushname,
                
                // 訊息內容
                messageBody: messageBody.trim().toLowerCase(),
                message,
                
                // 群組資訊（僅群組時有效）
                groupName: isGroup ? chat.name : null,
                groupId: isGroup ? chat.id._serialized : null,
                
                // 時間戳
                timestamp: Date.now(),
                
                // 聊天物件
                chat
            };
            
            console.log(`🔧 標準化 Context: ${pushname} (${userId}) 在 ${isGroup ? '群組' : '私訊'} ${isGroup ? chat.name : ''}`);
            
            return context;
            
        } catch (error) {
            console.log(`❌ Context 標準化失敗:`, error.message);
            throw error;
        }
    }

    /**
     * 記錄跨頻道交互
     * @param {object} context - 標準化 context
     * @param {string} command - 觸發的命令
     */
    recordInteraction(context, command) {
        if (context.isGroup) {
            this.activeInteractions.set(context.userId, {
                originId: context.originId,
                originGroupName: context.groupName,
                command,
                userDisplayName: context.pushname,
                timestamp: Date.now()
            });
            
            console.log(`📝 記錄跨頻道交互: ${context.pushname} 從群組 ${context.groupName} 發起 ${command}`);
        }
    }

    /**
     * 獲取活躍的交互記錄
     * @param {string} userId - 用戶 ID
     * @returns {object|null} 交互記錄
     */
    getActiveInteraction(userId) {
        return this.activeInteractions.get(userId);
    }

    /**
     * 完成交互並清理記錄
     * @param {string} userId - 用戶 ID
     * @returns {boolean} 是否成功清理
     */
    completeInteraction(userId) {
        const existed = this.activeInteractions.has(userId);
        if (existed) {
            this.activeInteractions.delete(userId);
            console.log(`🧹 清理交互記錄: ${userId}`);
        }
        return existed;
    }

    /**
     * 清理過期的交互記錄（30分鐘）
     */
    cleanupExpiredInteractions() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30分鐘
        
        let cleanedCount = 0;
        for (const [userId, interaction] of this.activeInteractions.entries()) {
            if (now - interaction.timestamp > maxAge) {
                this.activeInteractions.delete(userId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 清理了 ${cleanedCount} 個過期的交互記錄`);
        }
    }

    /**
     * 安全發送訊息（確保發送到正確的目的地）
     * @param {object} client - WhatsApp 客戶端
     * @param {string} targetId - 目標 ID
     * @param {string} content - 訊息內容
     * @param {object} context - 用於日誌的 context
     * @returns {Promise<boolean>} 是否發送成功
     */
    async safeSendMessage(client, targetId, content, context) {
        try {
            // 防錯檢查
            if (!targetId || !content) {
                console.log(`❌ 發送訊息參數錯誤: targetId=${!!targetId}, content=${!!content}`);
                return false;
            }
            
            console.log(`📤 安全發送訊息到: ${targetId} (${context.pushname})`);
            await client.sendMessage(targetId, content);
            console.log(`✅ 訊息發送成功: ${targetId}`);
            return true;
            
        } catch (error) {
            console.log(`❌ 訊息發送失敗: ${error.message}`);
            return false;
        }
    }
}

module.exports = ContextStandardizer;