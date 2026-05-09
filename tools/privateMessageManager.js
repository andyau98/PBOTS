class PrivateMessageManager {
    constructor(config = {}) {
        this.config = config;

        // 活跃会话管理
        this.activeSessions = new Map(); // userId -> sessionData
        this.sessionTimeout = 5 * 60 * 1000; // 5分钟超时

        // 认证密码（可通过 configs/settings.json 中 security.auth_password 配置）
        this.authPassword = config.auth_password || '288365';

        console.log('🔐 私信問答管理器已初始化');
    }

    /**
     * 开始私信问答会话
     */
    async startPrivateSession(userId, originId, client) {
        try {
            // 检查是否已有活跃会话
            if (this.activeSessions.has(userId)) {
                const existingSession = this.activeSessions.get(userId);
                if (Date.now() - existingSession.startTime < this.sessionTimeout) {
                    return { 
                        success: false, 
                        message: '您已經有一個活躍的認證會話，請檢查私訊。' 
                    };
                } else {
                    // 清理过期会话
                    this.activeSessions.delete(userId);
                }
            }

            // 创建新会话
            const sessionData = {
                userId: userId,
                originId: originId, // 原始消息来源（群组或私信）
                startTime: Date.now(),
                step: 'ask_password',
                attempts: 0,
                maxAttempts: 3
            };

            this.activeSessions.set(userId, sessionData);

            // 发送私信询问密码
            const question = `🔐 *管理員認證*\n\n` +
                `請輸入認證密碼以獲取管理員權限：\n` +
                `💡 您有 ${sessionData.maxAttempts} 次嘗試機會\n` +
                `⏰ 會話將在 5 分鐘後自動過期`;

            await this.sendPrivateMessage(userId, question, client);

            console.log(`🔐 已向 ${userId} 發起私信認證會話`);

            return { 
                success: true, 
                message: '已向您發送私信，請檢查私訊並輸入認證密碼。' 
            };

        } catch (error) {
            console.error('❌ 開始私信會話失敗:', error.message);
            return { 
                success: false, 
                message: '無法發起私信認證，請稍後再試。' 
            };
        }
    }

    /**
     * 处理私信回复
     */
    async handlePrivateReply(userId, message, client) {
        try {
            // 检查是否有活跃会话
            if (!this.activeSessions.has(userId)) {
                await this.sendPrivateMessage(userId, '❌ 沒有活躍的認證會話，請重新發起認證。', client);
                return { success: false, message: '無活躍會話' };
            }

            const session = this.activeSessions.get(userId);
            
            // 检查会话是否超时
            if (Date.now() - session.startTime > this.sessionTimeout) {
                this.activeSessions.delete(userId);
                await this.sendPrivateMessage(userId, '❌ 認證會話已過期，請重新發起認證。', client);
                return { success: false, message: '會話超時' };
            }

            // 处理密码验证
            if (session.step === 'ask_password') {
                return await this.handlePasswordVerification(userId, message, session, client);
            }

            return { success: false, message: '未知的會話步驟' };

        } catch (error) {
            console.error('❌ 處理私信回覆失敗:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * 处理密码验证
     */
    async handlePasswordVerification(userId, message, session, client) {
        const userInput = message.body.trim();
        session.attempts++;

        if (userInput === this.authPassword) {
            // 认证成功
            this.activeSessions.delete(userId);
            
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

            await this.sendPrivateMessage(userId, successMessage, client);

            // 如果是从群组发起的，回群组发送成功通知
            if (session.originId.endsWith('@g.us')) {
                await this.sendGroupNotification(session.originId, userId, client);
            }

            console.log(`✅ ${userId} 認證成功`);

            return { 
                success: true, 
                message: '認證成功',
                userId: userId,
                originId: session.originId
            };

        } else {
            // 认证失败
            const remainingAttempts = session.maxAttempts - session.attempts;
            
            if (remainingAttempts > 0) {
                const retryMessage = `❌ *密碼錯誤*\n\n` +
                    `您還有 ${remainingAttempts} 次嘗試機會\n` +
                    `請重新輸入認證密碼：`;

                await this.sendPrivateMessage(userId, retryMessage, client);
                
                return { 
                    success: false, 
                    message: '密碼錯誤，請重試',
                    remainingAttempts: remainingAttempts
                };

            } else {
                // 达到最大尝试次数
                this.activeSessions.delete(userId);
                
                const failMessage = `❌ *認證失敗*\n\n` +
                    `您已達到最大嘗試次數\n` +
                    `認證會話已結束\n` +
                    `💡 如需再次認證，請重新發起 !whitelist 命令`;

                await this.sendPrivateMessage(userId, failMessage, client);

                console.log(`❌ ${userId} 認證失敗（達到最大嘗試次數）`);

                return { 
                    success: false, 
                    message: '認證失敗，達到最大嘗試次數'
                };
            }
        }
    }

    /**
     * 发送私信
     */
    async sendPrivateMessage(userId, message, client) {
        try {
            console.log(`🔍 嘗試向 ${userId} 發送私信: ${message.substring(0, 50)}...`);
            
            // 確保用戶ID格式正確（添加 @c.us 後綴）
            let targetUserId = userId;
            if (!targetUserId.includes('@')) {
                targetUserId = targetUserId + '@c.us';
            }
            
            console.log(`🔍 格式化後用戶ID: ${targetUserId}`);
            
            await client.sendMessage(targetUserId, message);
            console.log(`✅ 已向 ${targetUserId} 發送私信`);
            return true;
        } catch (error) {
            console.error(`❌ 發送私信失敗 (${userId}):`, error);
            console.error(`❌ 錯誤詳情:`, error.stack);
            throw error;
        }
    }

    /**
     * 发送群组通知
     */
    async sendGroupNotification(groupId, userId, client) {
        try {
            const notification = `✅ *認證成功通知*\n\n` +
                `用戶 ${userId} 已成功通過管理員認證\n` +
                `現已擁有完整系統權限`;

            await client.sendMessage(groupId, notification);
            console.log(`📢 已向群組 ${groupId} 發送認證成功通知`);
        } catch (error) {
            console.error(`❌ 發送群組通知失敗 (${groupId}):`, error.message);
        }
    }

    /**
     * 检查用户是否有活跃会话
     */
    hasActiveSession(userId) {
        if (!this.activeSessions.has(userId)) {
            return false;
        }

        const session = this.activeSessions.get(userId);
        
        // 检查会话是否超时
        if (Date.now() - session.startTime > this.sessionTimeout) {
            this.activeSessions.delete(userId);
            return false;
        }

        return true;
    }

    /**
     * 获取会话状态
     */
    getSessionStatus(userId) {
        if (!this.hasActiveSession(userId)) {
            return null;
        }

        const session = this.activeSessions.get(userId);
        const remainingTime = this.sessionTimeout - (Date.now() - session.startTime);
        const remainingMinutes = Math.ceil(remainingTime / 60000);

        return {
            userId: session.userId,
            originId: session.originId,
            step: session.step,
            attempts: session.attempts,
            maxAttempts: session.maxAttempts,
            remainingTime: remainingTime,
            remainingMinutes: remainingMinutes,
            startTime: session.startTime
        };
    }

    /**
     * 清理过期会话
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [userId, session] of this.activeSessions.entries()) {
            if (now - session.startTime > this.sessionTimeout) {
                this.activeSessions.delete(userId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🗑️ 已清理 ${cleanedCount} 個過期會話`);
        }

        return cleanedCount;
    }

    /**
     * 获取活跃会话统计
     */
    getSessionStats() {
        this.cleanupExpiredSessions();

        return {
            totalSessions: this.activeSessions.size,
            sessions: Array.from(this.activeSessions.values()).map(session => ({
                userId: session.userId,
                originId: session.originId,
                step: session.step,
                attempts: session.attempts,
                startTime: session.startTime
            }))
        };
    }
}

module.exports = PrivateMessageManager;