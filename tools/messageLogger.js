const fs = require('fs');
const path = require('path');
const PathManager = require('../configs/path_manager');

class MessageLogger {
    constructor(config, pathManager = null) {
        this.config = config;
        
        // Phase 7 標準化依賴注入
        this.pathManager = pathManager || require('../configs/path_manager');
        this.savePath = config.message_logging?.save_path || this.pathManager.CHATS;
        this.enabled = config.message_logging?.enabled !== false;
        
        // 確保保存目錄存在
        this.pathManager.ensureDirectoryExists(this.savePath);
    }

    // 獲取訊息類型
    getMessageType(message) {
        if (message.hasMedia) {
            if (message.type === 'image') return 'image';
            if (message.type === 'document') return 'document';
            if (message.type === 'audio') return 'audio';
            if (message.type === 'video') return 'video';
            return 'media';
        }
        return 'chat';
    }

    // 記錄訊息到 JSON 文件
    async logMessage(message, senderInfo, groupName = null) {
        if (!this.enabled) return;

        try {
            const now = new Date();
            // 使用香港時間 (UTC+8)
            const hongKongTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
            const dateString = hongKongTime.toISOString().split('T')[0];
            const filename = `${dateString}.json`;
            const filePath = path.join(this.savePath, filename);

            const isGroup = message.from.includes('@g.us');
            
            // 格式化訊息數據（使用香港時間）
            const messageData = {
                timestamp: hongKongTime.toISOString(),
                isGroup: isGroup,
                sender: message.from,
                senderName: senderInfo,
                groupName: isGroup ? groupName : null,
                content: message.body || '',
                type: this.getMessageType(message),
                messageId: message.id._serialized,
                hasMedia: message.hasMedia,
                mediaType: message.hasMedia ? message.type : null
            };

            // 讀取現有數據或創建新數組
            let existingData = [];
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                existingData = JSON.parse(fileContent);
            }

            // 添加新訊息
            existingData.push(messageData);

            // 寫入文件
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
            
            return true;
        } catch (error) {
            console.log('❌ 訊息記錄失敗:', error.message);
            return false;
        }
    }

    // 獲取今日統計數據
    getTodayStats() {
        try {
            const now = new Date();
            // 使用香港時間 (UTC+8)
            const hongKongTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
            const dateString = hongKongTime.toISOString().split('T')[0];
            const filename = `${dateString}.json`;
            const filePath = path.join(this.savePath, filename);

            if (!fs.existsSync(filePath)) {
                return {
                    totalMessages: 0,
                    groupMessages: 0,
                    privateMessages: 0,
                    mediaMessages: 0,
                    commands: 0
                };
            }

            const fileContent = fs.readFileSync(filePath, 'utf8');
            const messages = JSON.parse(fileContent);

            const stats = {
                totalMessages: messages.length,
                groupMessages: messages.filter(m => m.isGroup).length,
                privateMessages: messages.filter(m => !m.isGroup).length,
                mediaMessages: messages.filter(m => m.hasMedia).length,
                commands: messages.filter(m => m.content.startsWith('!')).length
            };

            return stats;
        } catch (error) {
            console.log('❌ 統計數據獲取失敗:', error.message);
            return null;
        }
    }

    // 格式化統計數據為可讀文本
    formatStats(stats) {
        if (!stats) return '❌ 無法獲取統計數據';

        return `📊 今日統計數據:
• 總訊息數: ${stats.totalMessages}
• 群組訊息: ${stats.groupMessages}
• 私聊訊息: ${stats.privateMessages}
• 媒體文件: ${stats.mediaMessages}
• 命令使用: ${stats.commands}`;
    }
}

module.exports = MessageLogger;