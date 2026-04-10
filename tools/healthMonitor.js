const fs = require('fs');
const path = require('path');
const os = require('os');

class HealthMonitor {
    constructor(config, client, pathManager = null) {
        this.config = config;
        this.client = client;
        
        // Phase 7 標準化依賴注入
        this.pathManager = pathManager || require('../configs/path_manager');
        
        this.startTime = new Date();
        this.messageCount = 0;
        this.mediaCount = 0;
        this.errorCount = 0;
        this.reportInterval = 24 * 60 * 60 * 1000; // 24小時
        this.reportTimer = null;
    }

    // 初始化健康監控
    async initialize() {
        console.log('🩺 健康監控系統初始化...');
        
        // 啟動定時報告
        this.startPeriodicReports();
        
        console.log('✅ 健康監控系統已啟動');
    }

    // 啟動定時報告
    startPeriodicReports() {
        if (this.reportTimer) {
            clearInterval(this.reportTimer);
        }
        
        this.reportTimer = setInterval(async () => {
            await this.sendHealthReport();
        }, this.reportInterval);
        
        console.log(`⏰ 定時健康報告已設定: 每 ${this.reportInterval / (60 * 60 * 1000)} 小時`);
    }

    // 記錄訊息統計
    recordMessage(isMedia = false) {
        this.messageCount++;
        if (isMedia) {
            this.mediaCount++;
        }
    }

    // 記錄錯誤
    recordError() {
        this.errorCount++;
    }

    // 記錄命令執行
    recordCommand(commandName) {
        console.log(`📊 HealthMonitor 記錄命令執行: !${commandName}`);
        // 這裡可以擴展為記錄更詳細的命令統計
    }

    // 獲取系統信息
    getSystemInfo() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        
        return {
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            uptime: os.uptime(),
            totalMemory: totalMemory,
            freeMemory: freeMemory,
            usedMemory: usedMemory,
            memoryUsage: memoryUsage,
            loadAverage: os.loadavg(),
            cpus: os.cpus().length
        };
    }

    // 獲取磁碟使用情況
    getDiskUsage() {
        try {
            const cwd = process.cwd();
            const stats = fs.statSync(cwd);
            
            // 這是一個簡化的實現，實際應用中可能需要使用更精確的方法
            return {
                path: cwd,
                total: 100 * 1024 * 1024 * 1024, // 假設100GB
                free: 50 * 1024 * 1024 * 1024,   // 假設50GB可用
                used: 50 * 1024 * 1024 * 1024    // 假設50GB已用
            };
        } catch (error) {
            console.log('❌ 獲取磁碟使用情況失敗:', error.message);
            return null;
        }
    }

    // 獲取應用統計
    getAppStats() {
        const now = new Date();
        const uptime = now - this.startTime;
        
        return {
            startTime: this.startTime,
            uptime: uptime,
            messageCount: this.messageCount,
            mediaCount: this.mediaCount,
            errorCount: this.errorCount,
            commandsProcessed: this.messageCount // 簡化統計
        };
    }

    // 格式化運行時間
    formatUptime(uptime) {
        const seconds = Math.floor(uptime / 1000);
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        
        if (days > 0) {
            return `${days}天 ${hours}小時 ${minutes}分鐘`;
        } else if (hours > 0) {
            return `${hours}小時 ${minutes}分鐘`;
        } else {
            return `${minutes}分鐘`;
        }
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 生成健康報告
    generateHealthReport() {
        const systemInfo = this.getSystemInfo();
        const diskInfo = this.getDiskUsage();
        const appStats = this.getAppStats();
        
        let report = `🏥 系統健康報告\n`;
        report += `⏰ 生成時間: ${new Date().toLocaleString('zh-TW')}\n\n`;
        
        // 應用統計
        report += `📊 應用統計:\n`;
        report += `• 運行時間: ${this.formatUptime(appStats.uptime)}\n`;
        report += `• 處理訊息: ${appStats.messageCount} 條\n`;
        report += `• 媒體文件: ${appStats.mediaCount} 個\n`;
        report += `• 錯誤數量: ${appStats.errorCount} 次\n\n`;
        
        // 系統信息
        report += `💻 系統信息:\n`;
        report += `• 主機名稱: ${systemInfo.hostname}\n`;
        report += `• 平台架構: ${systemInfo.platform}/${systemInfo.arch}\n`;
        report += `• CPU核心: ${systemInfo.cpus} 個\n`;
        report += `• 內存使用: ${this.formatFileSize(systemInfo.usedMemory)} / ${this.formatFileSize(systemInfo.totalMemory)} (${systemInfo.memoryUsage.toFixed(1)}%)\n`;
        report += `• 系統負載: ${systemInfo.loadAverage[0].toFixed(2)}, ${systemInfo.loadAverage[1].toFixed(2)}, ${systemInfo.loadAverage[2].toFixed(2)}\n\n`;
        
        // 磁碟使用（如果可用）
        if (diskInfo) {
            const diskUsage = (diskInfo.used / diskInfo.total) * 100;
            report += `💾 磁碟使用:\n`;
            report += `• 路徑: ${diskInfo.path}\n`;
            report += `• 使用情況: ${this.formatFileSize(diskInfo.used)} / ${this.formatFileSize(diskInfo.total)} (${diskUsage.toFixed(1)}%)\n\n`;
        }
        
        // 狀態評估
        const status = this.assessSystemStatus(systemInfo, appStats);
        report += `📈 狀態評估: ${status.emoji} ${status.message}\n`;
        report += `• 建議操作: ${status.suggestion}\n`;
        
        return report;
    }

    // 評估系統狀態
    assessSystemStatus(systemInfo, appStats) {
        const memoryThreshold = 80; // 80% 內存使用警告
        const errorThreshold = 10;  // 每1000條訊息允許10個錯誤
        
        let status = '健康';
        let emoji = '✅';
        let suggestion = '系統運行正常，無需操作';
        
        if (systemInfo.memoryUsage > memoryThreshold) {
            status = '警告';
            emoji = '⚠️';
            suggestion = '內存使用較高，建議檢查應用或重啟服務';
        }
        
        if (appStats.errorCount > 0 && appStats.messageCount > 0) {
            const errorRate = (appStats.errorCount / appStats.messageCount) * 1000;
            if (errorRate > errorThreshold) {
                status = '異常';
                emoji = '❌';
                suggestion = '錯誤率較高，建議檢查日誌並進行故障排除';
            }
        }
        
        return {
            status: status,
            emoji: emoji,
            message: status,
            suggestion: suggestion
        };
    }

    // 發送健康報告
    async sendHealthReport(manualTrigger = false) {
        try {
            if (!this.client) {
                console.log('❌ 無法發送健康報告: WhatsApp 客戶端未就緒');
                return false;
            }
            
            const report = this.generateHealthReport();
            const triggerType = manualTrigger ? '手動觸發' : '定時報告';
            
            console.log(`📤 發送健康報告 (${triggerType})...`);
            
            // 發送給所有管理員
            const adminNumbers = this.config.security?.admin_numbers || [];
            let sentCount = 0;
            
            for (const adminId of adminNumbers) {
                try {
                    await this.client.sendMessage(adminId, report);
                    sentCount++;
                    console.log(`✅ 健康報告已發送給管理員: ${adminId}`);
                } catch (error) {
                    console.log(`❌ 發送健康報告失敗給 ${adminId}:`, error.message);
                }
            }
            
            if (sentCount > 0) {
                console.log(`✅ 健康報告發送完成: ${sentCount}/${adminNumbers.length} 個管理員`);
                return true;
            } else {
                console.log('⚠️ 沒有管理員可接收健康報告');
                return false;
            }
            
        } catch (error) {
            console.log('❌ 發送健康報告失敗:', error.message);
            return false;
        }
    }

    // 停止健康監控
    stop() {
        if (this.reportTimer) {
            clearInterval(this.reportTimer);
            this.reportTimer = null;
        }
        console.log('🛑 健康監控系統已停止');
    }
}

module.exports = HealthMonitor;