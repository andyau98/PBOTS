const fs = require('fs');
const path = require('path');
const { ensureDir } = require('./common/utils');

class MessageLogger {
    constructor(config = {}) {
        this.config = config;
        this.enabled = config.enabled !== false;
        this.savePath = config.save_path || './data/chats';

        // 確保日誌目錄存在
        ensureDir(this.savePath);
    }

    /**
     * 獲取訊息類型
     */
    getMessageType(message) {
        if (message.hasMedia) {
            if (message.type === 'image') return 'image';
            if (message.type === 'video') return 'video';
            if (message.type === 'audio') return 'audio';
            if (message.type === 'document') return 'document';
            return 'media';
        }
        const body = message.body || '';
        if (body.startsWith('!')) return 'command';
        return 'chat';
    }

    /**
     * 格式化訊息數據
     */
    formatMessageData(message, context = {}) {
        const isGroup = message.from.endsWith('@g.us');
        const now = new Date();

        return {
            timestamp: now.toISOString(),
            isGroup: isGroup,
            sender: message.from,
            groupName: isGroup
                ? message.chat?.name || context.groupName || 'Unknown Group'
                : null,
            senderName:
                context.senderName ||
                message.author ||
                message._data?.notifyName ||
                'Unknown',
            content: message.body || '',
            type: this.getMessageType(message),
            messageId: message.id._serialized || message.id.id,
            hasMedia: message.hasMedia || false,
            mediaType: message.type || null,
            context: {
                pushname: context.pushname,
                isGroup: context.isGroup,
            },
        };
    }

    /**
     * 獲取日誌檔案名稱（JSONL 格式）
     */
    getLogFilename() {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
        return path.join(this.savePath, `${dateString}.jsonl`);
    }

    /**
     * 讀取 JSONL 日誌（逐行解析）
     */
    readExistingLogs(filename) {
        try {
            if (!fs.existsSync(filename)) return [];
            const content = fs.readFileSync(filename, 'utf8');
            const lines = content.trim().split('\n').filter(Boolean);
            return lines
                .map((line) => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean);
        } catch (error) {
            console.error('❌ 讀取日誌檔案失敗:', error.message);
        }
        return [];
    }

    /**
     * 保存訊息到 JSONL 日誌（append-only，O(1) 寫入）
     */
    async logMessage(message, context = {}) {
        if (!this.enabled) return;

        try {
            const messageData = this.formatMessageData(message, context);
            const filename = this.getLogFilename();

            // JSONL：每行一條 JSON 記錄，直接附加寫入
            fs.appendFileSync(
                filename,
                JSON.stringify(messageData) + '\n',
                'utf8'
            );

            console.log(`📝 訊息已記錄到: ${filename}`);
            return messageData;
        } catch (error) {
            console.error('❌ 記錄訊息失敗:', error.message);
        }
    }

    /**
     * 獲取今日統計數據
     */
    getTodayStats() {
        try {
            const filename = this.getLogFilename();
            const logs = this.readExistingLogs(filename);

            const stats = {
                totalMessages: logs.length,
                groupMessages: logs.filter((log) => log.isGroup).length,
                privateMessages: logs.filter((log) => !log.isGroup).length,
                commands: logs.filter((log) => log.type === 'command').length,
                mediaMessages: logs.filter((log) => log.hasMedia).length,
                messageTypes: {},
                groups: {},
                senders: {},
            };

            logs.forEach((log) => {
                stats.messageTypes[log.type] =
                    (stats.messageTypes[log.type] || 0) + 1;

                const senderKey = log.senderName || log.sender;
                stats.senders[senderKey] = (stats.senders[senderKey] || 0) + 1;

                if (log.isGroup && log.groupName) {
                    stats.groups[log.groupName] =
                        (stats.groups[log.groupName] || 0) + 1;
                }
            });

            return stats;
        } catch (error) {
            console.error('❌ 獲取統計數據失敗:', error.message);
            return null;
        }
    }

    /**
     * 格式化統計數據為可讀文本
     */
    formatStats(stats) {
        if (!stats) return '❌ 無法獲取統計數據';

        let result = '📊 *今日統計報告*\n';
        result += `📅 日期: ${new Date().toLocaleDateString()}\n\n`;

        result += '📈 *訊息統計*\n';
        result += `• 總訊息數: ${stats.totalMessages}\n`;
        result += `• 群組訊息: ${stats.groupMessages}\n`;
        result += `• 私聊訊息: ${stats.privateMessages}\n`;
        result += `• 命令數量: ${stats.commands}\n`;
        result += `• 媒體訊息: ${stats.mediaMessages}\n\n`;

        if (Object.keys(stats.messageTypes).length > 0) {
            result += '📋 *訊息類型*\n';
            Object.entries(stats.messageTypes).forEach(([type, count]) => {
                result += `• ${type}: ${count}\n`;
            });
            result += '\n';
        }

        if (Object.keys(stats.groups).length > 0) {
            result += '👥 *群組活動*\n';
            Object.entries(stats.groups).forEach(([group, count]) => {
                result += `• ${group}: ${count} 條訊息\n`;
            });
            result += '\n';
        }

        if (Object.keys(stats.senders).length > 0) {
            result += '👤 *活躍用戶* (前5名)\n';
            const topSenders = Object.entries(stats.senders)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            topSenders.forEach(([sender, count], index) => {
                result += `${index + 1}. ${sender}: ${count} 條訊息\n`;
            });
        }

        return result;
    }

    /**
     * 清理舊日誌檔案
     */
    cleanupOldLogs(daysToKeep = 30) {
        try {
            const files = fs.readdirSync(this.savePath);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            files.forEach((file) => {
                const filePath = path.join(this.savePath, file);
                const stat = fs.statSync(filePath);

                if (stat.isFile() && file.endsWith('.jsonl')) {
                    const fileDate = new Date(stat.mtime);
                    if (fileDate < cutoffDate) {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ 已刪除舊日誌檔案: ${file}`);
                    }
                }
            });
        } catch (error) {
            console.error('❌ 清理舊日誌失敗:', error.message);
        }
    }
}

module.exports = MessageLogger;
