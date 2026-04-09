const fs = require('fs');
const path = require('path');

class CleanupManager {
    constructor(config) {
        this.config = config;
        this.logsPath = config.paths?.logs || './logs';
        this.dataPath = config.paths?.data || './data';
        this.backupsPath = config.paths?.backups || './backups';
        this.retentionDays = 30; // 保留30天
    }

    // 檢查文件是否超過保留期限
    isFileExpired(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const now = new Date();
            const fileAge = now - stats.mtime;
            const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;
            
            return fileAge > retentionMs;
        } catch (error) {
            console.log(`❌ 無法檢查文件期限: ${filePath}`, error.message);
            return false;
        }
    }

    // 遞歸掃描目錄中的文件
    scanDirectoryForOldFiles(dirPath) {
        const oldFiles = [];
        
        try {
            if (!fs.existsSync(dirPath)) {
                return oldFiles;
            }

            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    // 遞歸掃描子目錄
                    const subDirFiles = this.scanDirectoryForOldFiles(itemPath);
                    oldFiles.push(...subDirFiles);
                } else if (stats.isFile()) {
                    // 檢查文件是否超過保留期限
                    if (this.isFileExpired(itemPath)) {
                        oldFiles.push({
                            path: itemPath,
                            name: item,
                            size: stats.size,
                            modified: stats.mtime,
                            relativePath: path.relative(process.cwd(), itemPath)
                        });
                    }
                }
            }
        } catch (error) {
            console.log(`❌ 掃描目錄失敗: ${dirPath}`, error.message);
        }
        
        return oldFiles;
    }

    // 確保備份目錄存在
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupsPath)) {
            fs.mkdirSync(this.backupsPath, { recursive: true });
        }
        
        // 創建按日期歸檔的子目錄
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        const backupSubDir = path.join(this.backupsPath, `archive_${dateString}`);
        
        if (!fs.existsSync(backupSubDir)) {
            fs.mkdirSync(backupSubDir, { recursive: true });
        }
        
        return backupSubDir;
    }

    // 移動文件到備份目錄
    moveFileToBackup(fileInfo, backupDir) {
        try {
            const fileName = path.basename(fileInfo.path);
            const backupPath = path.join(backupDir, fileName);
            
            // 如果備份目錄中已存在同名文件，添加後綴
            let finalBackupPath = backupPath;
            let counter = 1;
            
            while (fs.existsSync(finalBackupPath)) {
                const ext = path.extname(fileName);
                const baseName = path.basename(fileName, ext);
                finalBackupPath = path.join(backupDir, `${baseName}_${counter}${ext}`);
                counter++;
            }
            
            // 移動文件
            fs.renameSync(fileInfo.path, finalBackupPath);
            
            return {
                originalPath: fileInfo.path,
                backupPath: finalBackupPath,
                success: true
            };
        } catch (error) {
            console.log(`❌ 移動文件失敗: ${fileInfo.path}`, error.message);
            return {
                originalPath: fileInfo.path,
                error: error.message,
                success: false
            };
        }
    }

    // 執行清理操作
    async performCleanup() {
        console.log('🧹 開始系統清理操作...');
        console.log(`📅 保留期限: ${this.retentionDays} 天`);
        
        const scanResults = {
            logs: this.scanDirectoryForOldFiles(this.logsPath),
            data: this.scanDirectoryForOldFiles(path.join(this.dataPath, 'chats'))
        };
        
        const totalOldFiles = scanResults.logs.length + scanResults.data.length;
        
        if (totalOldFiles === 0) {
            console.log('✅ 沒有找到需要清理的舊文件');
            return {
                success: true,
                message: '沒有找到超過30天的舊文件，無需清理。',
                filesCleaned: 0,
                spaceFreed: 0
            };
        }
        
        console.log(`📊 找到需要清理的文件:`);
        console.log(`   • 日誌文件: ${scanResults.logs.length} 個`);
        console.log(`   • 聊天記錄: ${scanResults.data.length} 個`);
        console.log(`   • 總文件數: ${totalOldFiles} 個`);
        
        // 準備備份目錄
        const backupDir = this.ensureBackupDirectory();
        console.log(`📁 備份目錄: ${backupDir}`);
        
        // 移動文件到備份目錄
        const moveResults = [];
        let totalSpaceFreed = 0;
        let successCount = 0;
        
        // 移動日誌文件
        for (const file of scanResults.logs) {
            const result = this.moveFileToBackup(file, backupDir);
            if (result.success) {
                totalSpaceFreed += file.size;
                successCount++;
            }
            moveResults.push(result);
        }
        
        // 移動聊天記錄文件
        for (const file of scanResults.data) {
            const result = this.moveFileToBackup(file, backupDir);
            if (result.success) {
                totalSpaceFreed += file.size;
                successCount++;
            }
            moveResults.push(result);
        }
        
        // 生成統計信息
        const stats = {
            success: successCount === totalOldFiles,
            message: `清理完成: ${successCount}/${totalOldFiles} 個文件已成功歸檔`,
            filesCleaned: successCount,
            spaceFreed: totalSpaceFreed,
            backupDirectory: backupDir,
            details: moveResults
        };
        
        console.log(`✅ 清理操作完成:`);
        console.log(`   • 成功歸檔: ${stats.filesCleaned} 個文件`);
        console.log(`   • 釋放空間: ${this.formatFileSize(stats.spaceFreed)}`);
        console.log(`   • 備份位置: ${stats.backupDirectory}`);
        
        return stats;
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 格式化清理統計信息
    formatCleanupStats(stats) {
        if (!stats) return '❌ 清理操作失敗';

        return `🧹 系統清理完成！\n` +
               `• 清理文件數量: ${stats.filesCleaned} 個\n` +
               `• 釋放存儲空間: ${this.formatFileSize(stats.spaceFreed)}\n` +
               `• 備份目錄: ${stats.backupDirectory}\n` +
               `• 操作狀態: ${stats.success ? '✅ 成功' : '⚠️ 部分失敗'}`;
    }

    // 命令行支持：獨立運行清理任務
    async runCleanup() {
        try {
            const stats = await this.performCleanup();
            console.log('\n' + this.formatCleanupStats(stats));
            return stats;
        } catch (error) {
            console.log('❌ 清理操作失敗:', error.message);
            return {
                success: false,
                message: `清理失敗: ${error.message}`
            };
        }
    }
}

// 命令行支持
if (require.main === module) {
    const config = {
        paths: {
            logs: './logs',
            data: './data',
            backups: './backups'
        }
    };
    
    const cleanupManager = new CleanupManager(config);
    cleanupManager.runCleanup();
}

module.exports = CleanupManager;