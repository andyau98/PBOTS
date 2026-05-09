class SecurityManager {
    constructor(config = {}) {
        this.config = config;
        this.adminNumbers = new Set(config.admin_numbers || []);
        this.authorizedGroups = new Set(config.authorized_groups || []);
        this.whitelistEnabled = config.whitelist_enabled !== false;

        // 未授權訪問記錄
        this.unauthorizedAttempts = [];
        this.maxAttemptsLog = 1000; // 最大記錄數量
    }

    /**
     * 檢查用戶權限
     */
    checkPermission(userId, groupId = null, command = null) {
        // 如果白名單未啟用，所有用戶都有權限
        if (!this.whitelistEnabled) {
            return { allowed: true, reason: 'Whitelist disabled' };
        }

        // 檢查是否為管理員
        if (this.isAdmin(userId)) {
            return { allowed: true, reason: 'Admin user' };
        }

        // 檢查是否在授權群組中
        if (groupId && this.isAuthorizedGroup(groupId)) {
            return { allowed: true, reason: 'Authorized group member' };
        }

        // 檢查命令是否為基礎命令（所有人都可使用）
        if (this.isBasicCommand(command)) {
            return { allowed: true, reason: 'Basic command' };
        }

        // 記錄未授權訪問
        this.logUnauthorizedAccess(userId, groupId, command);

        return {
            allowed: false,
            reason: 'Unauthorized access attempt for restricted command',
        };
    }

    /**
     * 檢查是否為管理員
     */
    isAdmin(userId) {
        return this.adminNumbers.has(userId);
    }

    /**
     * 檢查是否為授權群組
     */
    isAuthorizedGroup(groupId) {
        return this.authorizedGroups.has(groupId);
    }

    /**
     * 檢查是否為基礎命令
     */
    isBasicCommand(command) {
        const basicCommands = new Set(['ping', 'help', 'status']);
        return basicCommands.has(command);
    }

    /**
     * 記錄未授權訪問
     */
    logUnauthorizedAccess(userId, groupId, command) {
        const attempt = {
            timestamp: new Date().toISOString(),
            userId: userId,
            groupId: groupId,
            command: command,
            type: groupId ? 'Group' : 'Private',
        };

        this.unauthorizedAttempts.push(attempt);

        // 限制記錄數量
        if (this.unauthorizedAttempts.length > this.maxAttemptsLog) {
            this.unauthorizedAttempts = this.unauthorizedAttempts.slice(
                -this.maxAttemptsLog
            );
        }

        // 輸出日誌
        this.logUnauthorizedAttempt(attempt);
    }

    /**
     * 輸出未授權訪問日誌
     */
    logUnauthorizedAttempt(attempt) {
        console.log(`🚫 Unauthorized Access Attempt - ${attempt.timestamp}`);
        console.log(`   Command: ${attempt.command || 'N/A'}`);
        console.log(`   Sender: ${attempt.userId}`);
        console.log(`   Type: ${attempt.type}`);
        console.log(
            '   Reason: Unauthorized access attempt for restricted command'
        );
        console.log(
            `   Message: ${attempt.command ? '!' + attempt.command : 'N/A'}`
        );
        console.log('─'.repeat(60));
    }

    /**
     * 添加管理員
     */
    addAdmin(userId) {
        this.adminNumbers.add(userId);
        console.log(`✅ 已添加管理員: ${userId}`);
    }

    /**
     * 移除管理員
     */
    removeAdmin(userId) {
        this.adminNumbers.delete(userId);
        console.log(`✅ 已移除管理員: ${userId}`);
    }

    /**
     * 添加授權群組
     */
    addAuthorizedGroup(groupId) {
        this.authorizedGroups.add(groupId);
        console.log(`✅ 已添加授權群組: ${groupId}`);
    }

    /**
     * 移除授權群組
     */
    removeAuthorizedGroup(groupId) {
        this.authorizedGroups.delete(groupId);
        console.log(`✅ 已移除授權群組: ${groupId}`);
    }

    /**
     * 獲取安全狀態
     */
    getSecurityStatus() {
        return {
            whitelistEnabled: this.whitelistEnabled,
            adminCount: this.adminNumbers.size,
            authorizedGroupCount: this.authorizedGroups.size,
            unauthorizedAttempts: this.unauthorizedAttempts.length,
            recentAttempts: this.unauthorizedAttempts.slice(-10), // 最近10次嘗試
        };
    }

    /**
     * 格式化安全狀態為可讀文本
     */
    formatSecurityStatus(status) {
        let result = '🔐 *安全狀態報告*\n';
        result += `📅 報告時間: ${new Date().toLocaleString()}\n\n`;

        result += '📊 *系統狀態*\n';
        result += `• 白名單模式: ${status.whitelistEnabled ? '✅ 已啟用' : '❌ 已禁用'}\n`;
        result += `• 管理員數量: ${status.adminCount}\n`;
        result += `• 授權群組: ${status.authorizedGroupCount}\n`;
        result += `• 未授權嘗試: ${status.unauthorizedAttempts} 次\n\n`;

        if (status.adminCount > 0) {
            result += '👑 *管理員列表*\n';
            this.adminNumbers.forEach((admin) => {
                result += `• ${admin}\n`;
            });
            result += '\n';
        }

        if (status.authorizedGroupCount > 0) {
            result += '👥 *授權群組列表*\n';
            this.authorizedGroups.forEach((group) => {
                result += `• ${group}\n`;
            });
            result += '\n';
        }

        if (status.recentAttempts.length > 0) {
            result += '🚫 *最近未授權嘗試* (最近5次)\n';
            status.recentAttempts.slice(-5).forEach((attempt, index) => {
                const time = new Date(attempt.timestamp).toLocaleTimeString();
                result += `${index + 1}. ${time} - ${attempt.command || 'N/A'} (${attempt.type})\n`;
            });
        }

        return result;
    }

    /**
     * 獲取未授權訪問統計
     */
    getUnauthorizedStats() {
        const stats = {
            totalAttempts: this.unauthorizedAttempts.length,
            byCommand: {},
            byType: {},
            byHour: {},
            recentTrend: [],
        };

        // 統計按命令和類型
        this.unauthorizedAttempts.forEach((attempt) => {
            // 按命令統計
            const command = attempt.command || 'unknown';
            stats.byCommand[command] = (stats.byCommand[command] || 0) + 1;

            // 按類型統計
            stats.byType[attempt.type] = (stats.byType[attempt.type] || 0) + 1;

            // 按小時統計
            const hour = new Date(attempt.timestamp).getHours();
            stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
        });

        // 生成最近趨勢（最近7天）
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayAttempts = this.unauthorizedAttempts.filter((attempt) =>
                attempt.timestamp.startsWith(dateStr)
            );

            stats.recentTrend.push({
                date: dateStr,
                attempts: dayAttempts.length,
            });
        }

        stats.recentTrend.reverse(); // 按時間順序排列

        return stats;
    }

    /**
     * 格式化未授權統計為可讀文本
     */
    formatUnauthorizedStats(stats) {
        let result = '🚫 *未授權訪問統計*\n';
        result += `📅 統計時間: ${new Date().toLocaleString()}\n\n`;

        result += '📈 *總體統計*\n';
        result += `• 總嘗試次數: ${stats.totalAttempts}\n\n`;

        if (Object.keys(stats.byCommand).length > 0) {
            result += '📋 *按命令統計*\n';
            Object.entries(stats.byCommand).forEach(([command, count]) => {
                result += `• !${command}: ${count} 次\n`;
            });
            result += '\n';
        }

        if (Object.keys(stats.byType).length > 0) {
            result += '👥 *按類型統計*\n';
            Object.entries(stats.byType).forEach(([type, count]) => {
                result += `• ${type}: ${count} 次\n`;
            });
            result += '\n';
        }

        if (stats.recentTrend.length > 0) {
            result += '📊 *最近7天趨勢*\n';
            stats.recentTrend.forEach((day) => {
                result += `• ${day.date}: ${day.attempts} 次嘗試\n`;
            });
        }

        return result;
    }

    /**
     * 清理舊記錄
     */
    cleanupOldRecords(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const originalCount = this.unauthorizedAttempts.length;
        this.unauthorizedAttempts = this.unauthorizedAttempts.filter(
            (attempt) => new Date(attempt.timestamp) >= cutoffDate
        );

        const removedCount = originalCount - this.unauthorizedAttempts.length;
        if (removedCount > 0) {
            console.log(
                `🗑️ 已清理 ${removedCount} 條 ${daysToKeep} 天前的未授權訪問記錄`
            );
        }
    }

    /**
     * 導出配置（用於保存到文件）
     */
    exportConfig() {
        return {
            admin_numbers: Array.from(this.adminNumbers),
            authorized_groups: Array.from(this.authorizedGroups),
            whitelist_enabled: this.whitelistEnabled,
        };
    }

    /**
     * 導入配置（用於從文件加載）
     */
    importConfig(config) {
        if (config.admin_numbers) {
            this.adminNumbers = new Set(config.admin_numbers);
        }
        if (config.authorized_groups) {
            this.authorizedGroups = new Set(config.authorized_groups);
        }
        if (config.whitelist_enabled !== undefined) {
            this.whitelistEnabled = config.whitelist_enabled;
        }
    }
}

module.exports = SecurityManager;
