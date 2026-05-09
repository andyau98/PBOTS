const fs = require('fs');
const path = require('path');
const { formatFileSize, calculateDirSize } = require('./common/utils');

class HealthMonitor {
    constructor(config = {}) {
        this.config = config;
        this.startTime = new Date();
        this.messageCount = 0;
        this.errorCount = 0;
        this.lastReportTime = null;

        // 24小时报告间隔
        this.reportInterval = 24 * 60 * 60 * 1000; // 24小时
        this.reportTimer = null;

        // 错误缓冲区
        this.errorBuffer = [];
        this.maxErrorBuffer = 50;
    }

    /**
     * 初始化健康监控
     */
    async initialize() {
        console.log('🔍 健康監控系統初始化...');

        // 启动定时报告
        this.startPeriodicReports();

        console.log('✅ 健康監控系統已啟動');
    }

    /**
     * 启动定时报告
     */
    startPeriodicReports() {
        // 清除现有定时器
        if (this.reportTimer) {
            clearInterval(this.reportTimer);
        }

        // 设置24小时定时报告
        this.reportTimer = setInterval(() => {
            this.sendHealthReport().catch((error) => {
                console.error('❌ 定時健康報告失敗:', error.message);
            });
        }, this.reportInterval);

        console.log(
            `⏰ 定時健康報告已設定 (每 ${this.reportInterval / 3600000} 小時)`
        );
    }

    /**
     * 记录消息处理
     */
    recordMessage() {
        this.messageCount++;
    }

    /**
     * 记录错误
     */
    recordError(error, context = {}) {
        this.errorCount++;

        // 添加到错误缓冲区
        const errorRecord = {
            timestamp: new Date().toISOString(),
            error: error.message || error.toString(),
            stack: error.stack,
            context: context,
        };

        this.errorBuffer.push(errorRecord);

        // 限制缓冲区大小
        if (this.errorBuffer.length > this.maxErrorBuffer) {
            this.errorBuffer = this.errorBuffer.slice(-this.maxErrorBuffer);
        }

        console.error(`❌ 錯誤記錄: ${error.message}`);
    }

    /**
     * 获取系统运行时间
     */
    getUptime() {
        const now = new Date();
        const uptimeMs = now - this.startTime;

        const days = Math.floor(uptimeMs / (24 * 60 * 60 * 1000));
        const hours = Math.floor(
            (uptimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
        );
        const minutes = Math.floor((uptimeMs % (60 * 60 * 1000)) / (60 * 1000));

        return { days, hours, minutes, totalMs: uptimeMs };
    }

    /**
     * 获取磁盘使用统计
     */
    getDiskUsage() {
        const directories = [
            { path: './logs', name: '日誌' },
            { path: './data', name: '數據' },
            { path: './data/images', name: '圖片' },
            { path: './data/pdfs', name: 'PDF' },
            { path: './backups', name: '備份' },
        ];

        const usage = {
            totalSize: 0,
            directories: {},
        };

        directories.forEach((dir) => {
            if (fs.existsSync(dir.path)) {
                const size = calculateDirSize(dir.path);
                usage.directories[dir.name] = {
                    size: size,
                    formattedSize: formatFileSize(size),
                };
                usage.totalSize += size;
            }
        });

        usage.formattedTotalSize = formatFileSize(usage.totalSize);

        return usage;
    }

    /**
     * 获取系统状态
     */
    getSystemStatus() {
        const uptime = this.getUptime();
        const diskUsage = this.getDiskUsage();

        return {
            uptime: uptime,
            messageCount: this.messageCount,
            errorCount: this.errorCount,
            diskUsage: diskUsage,
            lastReportTime: this.lastReportTime,
            startTime: this.startTime,
            recentErrors: this.errorBuffer.slice(-5),
        };
    }

    /**
     * 格式化健康报告
     */
    formatHealthReport(status, isManual = false) {
        const reportType = isManual ? '手動觸發' : '定時報告';

        let report = '🏥 *PBOTS 健康報告*\n\n';
        report += `📅 報告類型: ${reportType}\n`;
        report += `⏰ 報告時間: ${new Date().toLocaleString()}\n\n`;

        report += '📊 *系統統計*\n';
        report += `• 運行時間: ${status.uptime.days}天 ${status.uptime.hours}小時 ${status.uptime.minutes}分鐘\n`;
        report += `• 處理訊息: ${status.messageCount} 條\n`;
        report += `• 錯誤數量: ${status.errorCount} 次\n`;
        report += `• 磁碟使用: ${status.diskUsage.formattedTotalSize}\n\n`;

        report += '💾 *磁碟使用詳情*\n';
        Object.entries(status.diskUsage.directories).forEach(([name, data]) => {
            report += `• ${name}: ${data.formattedSize}\n`;
        });
        report += '\n';

        if (status.recentErrors.length > 0) {
            report += '⚠️ *最近錯誤* (最近5次)\n';
            status.recentErrors.forEach((error, index) => {
                const time = new Date(error.timestamp).toLocaleTimeString();
                report += `${index + 1}. ${time} - ${error.error}\n`;
            });
            report += '\n';
        }

        report += '💡 *系統狀態*\n';
        if (status.errorCount === 0) {
            report += '✅ 系統運行正常，無錯誤記錄';
        } else if (status.errorCount < 10) {
            report += '⚠️ 系統運行穩定，有少量錯誤';
        } else {
            report += '❌ 系統存在較多錯誤，建議檢查';
        }

        return report;
    }

    /**
     * 发送健康报告
     */
    async sendHealthReport(isManual = false) {
        try {
            const status = this.getSystemStatus();
            const report = this.formatHealthReport(status, isManual);

            // 更新最后报告时间
            this.lastReportTime = new Date();

            console.log('📊 健康報告已生成');
            // 报告内容写入日志文件
            return {
                success: true,
                report: report,
                status: status,
            };
        } catch (error) {
            console.error('❌ 生成健康報告失敗:', error.message);
            this.recordError(error, { action: 'sendHealthReport' });

            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * 获取错误统计
     */
    getErrorStats() {
        const stats = {
            totalErrors: this.errorCount,
            byHour: {},
            byType: {},
            recentTrend: [],
        };

        // 按小时统计
        this.errorBuffer.forEach((error) => {
            const hour = new Date(error.timestamp).getHours();
            stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
        });

        // 按类型统计（简化版）
        this.errorBuffer.forEach((error) => {
            const errorType = this.classifyError(error.error);
            stats.byType[errorType] = (stats.byType[errorType] || 0) + 1;
        });

        // 最近趋势（最近7天）
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayErrors = this.errorBuffer.filter((error) =>
                error.timestamp.startsWith(dateStr)
            );

            stats.recentTrend.push({
                date: dateStr,
                errors: dayErrors.length,
            });
        }

        stats.recentTrend.reverse();

        return stats;
    }

    /**
     * 错误分类
     */
    classifyError(errorMessage) {
        if (errorMessage.includes('認證')) return '認證錯誤';
        if (errorMessage.includes('權限')) return '權限錯誤';
        if (errorMessage.includes('網絡')) return '網絡錯誤';
        if (errorMessage.includes('文件')) return '文件錯誤';
        if (errorMessage.includes('媒體')) return '媒體錯誤';
        return '其他錯誤';
    }

    /**
     * 清理旧错误记录
     */
    cleanupOldErrors(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const originalCount = this.errorBuffer.length;
        this.errorBuffer = this.errorBuffer.filter(
            (error) => new Date(error.timestamp) >= cutoffDate
        );

        const removedCount = originalCount - this.errorBuffer.length;
        if (removedCount > 0) {
            console.log(
                `🗑️ 已清理 ${removedCount} 條 ${daysToKeep} 天前的錯誤記錄`
            );
        }
    }

    /**
     * 停止健康监控
     */
    stop() {
        if (this.reportTimer) {
            clearInterval(this.reportTimer);
            this.reportTimer = null;
        }

        console.log('🛑 健康監控系統已停止');
    }
}

module.exports = HealthMonitor;
