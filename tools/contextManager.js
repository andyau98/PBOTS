const fs = require('fs');
const path = require('path');

class ContextManager {
    constructor(config) {
        this.config = config;
        this.contextsFile = './data/contexts.json';
        this.contexts = {};
        this.initializeContextsFile();
    }

    // 初始化上下文檔案
    initializeContextsFile() {
        const dir = path.dirname(this.contextsFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (!fs.existsSync(this.contextsFile)) {
            fs.writeFileSync(this.contextsFile, JSON.stringify({}, null, 2));
        }
        
        this.loadContexts();
    }

    // 載入上下文
    loadContexts() {
        try {
            const data = fs.readFileSync(this.contextsFile, 'utf8');
            this.contexts = JSON.parse(data);
        } catch (error) {
            console.log('❌ 載入上下文失敗:', error.message);
            this.contexts = {};
        }
    }

    // 保存上下文
    saveContexts() {
        try {
            fs.writeFileSync(this.contextsFile, JSON.stringify(this.contexts, null, 2));
            return true;
        } catch (error) {
            console.log('❌ 保存上下文失敗:', error.message);
            return false;
        }
    }

    // 生成會話 ID
    generateSessionId(userId, command) {
        const timestamp = Date.now();
        return `${userId}_${command}_${timestamp}`;
    }

    // 創建新的上下文
    createContext(userId, command, originalMessage, isGroup = false, groupId = null, groupName = null) {
        const sessionId = this.generateSessionId(userId, command);
        
        const context = {
            sessionId,
            userId,
            command,
            originalMessage: originalMessage.body || originalMessage,
            isGroup,
            groupId,
            groupName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'pending', // pending, in_progress, completed, failed
            steps: [],
            currentStep: 0
        };

        this.contexts[sessionId] = context;
        this.saveContexts();
        
        console.log(`📝 創建新上下文: ${sessionId} (${isGroup ? '群組' : '私訊'})`);
        return sessionId;
    }

    // 獲取上下文
    getContext(sessionId) {
        return this.contexts[sessionId];
    }

    // 更新上下文
    updateContext(sessionId, updates) {
        if (this.contexts[sessionId]) {
            this.contexts[sessionId] = {
                ...this.contexts[sessionId],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveContexts();
            return true;
        }
        return false;
    }

    // 添加步驟記錄
    addStep(sessionId, stepName, data = {}) {
        if (this.contexts[sessionId]) {
            const step = {
                name: stepName,
                timestamp: new Date().toISOString(),
                data
            };
            
            this.contexts[sessionId].steps.push(step);
            this.contexts[sessionId].currentStep = this.contexts[sessionId].steps.length;
            this.saveContexts();
            
            console.log(`📋 添加步驟到上下文 ${sessionId}: ${stepName}`);
            return true;
        }
        return false;
    }

    // 完成上下文
    completeContext(sessionId, result = {}) {
        return this.updateContext(sessionId, {
            status: 'completed',
            result
        });
    }

    // 失敗上下文
    failContext(sessionId, error = {}) {
        return this.updateContext(sessionId, {
            status: 'failed',
            error
        });
    }

    // 清理過期上下文（24小時前）
    cleanupExpiredContexts() {
        const now = new Date();
        const expiredTime = 24 * 60 * 60 * 1000; // 24小時
        
        let cleanedCount = 0;
        
        Object.keys(this.contexts).forEach(sessionId => {
            const context = this.contexts[sessionId];
            const createdAt = new Date(context.createdAt);
            
            if (now - createdAt > expiredTime) {
                delete this.contexts[sessionId];
                cleanedCount++;
            }
        });
        
        if (cleanedCount > 0) {
            this.saveContexts();
            console.log(`🧹 清理了 ${cleanedCount} 個過期上下文`);
        }
        
        return cleanedCount;
    }

    // 根據用戶ID查找活躍上下文
    findActiveContextByUser(userId, command = null) {
        const now = new Date();
        const maxAge = 30 * 60 * 1000; // 30分鐘
        
        for (const sessionId in this.contexts) {
            const context = this.contexts[sessionId];
            const updatedAt = new Date(context.updatedAt);
            
            if (context.userId === userId && 
                context.status === 'in_progress' &&
                now - updatedAt <= maxAge) {
                
                if (!command || context.command === command) {
                    return context;
                }
            }
        }
        
        return null;
    }
}

module.exports = ContextManager;