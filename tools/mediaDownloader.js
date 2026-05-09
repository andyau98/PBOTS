const fs = require('fs');
const path = require('path');

class MediaDownloader {
    constructor(config = {}) {
        this.config = config;
        this.enabled = config.enabled !== false;
        this.autoDownload = config.auto_download !== false;
        this.imagePath = config.image_path || './data/images';
        this.pdfPath = config.pdf_path || './data/pdfs';
        this.namingConvention = config.naming_convention || '[YYYYMMDD]_[SenderName]_[OriginalFileName]';
        
        // 文件鎖管理
        this.fileLocks = new Map();
        
        // 確保目錄存在
        this.ensureDirectoryExists(this.imagePath);
        this.ensureDirectoryExists(this.pdfPath);
    }

    /**
     * 確保目錄存在
     */
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * 申請文件鎖
     */
    acquireLock(filePath) {
        const lockKey = path.resolve(filePath);
        if (this.fileLocks.has(lockKey)) {
            return false; // 文件已被鎖定
        }
        this.fileLocks.set(lockKey, true);
        return true;
    }

    /**
     * 釋放文件鎖
     */
    releaseLock(filePath) {
        const lockKey = path.resolve(filePath);
        this.fileLocks.delete(lockKey);
    }

    /**
     * 格式化文件名
     */
    async formatFileName(mediaType, senderName, originalName = '') {
        const now = new Date();
        // 精確到毫秒的時間戳: YYYYMMDD_HHmmss_SSS
        const timestamp = now.toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .replace(/\./g, '_')
            .slice(0, 21);
        
        // 添加4位隨機數防止衝突
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        
        // 清理發送者名稱中的特殊字符
        const cleanSenderName = senderName.replace(/[^\w\u4e00-\u9fff]/g, '_');
        
        // 獲取原始文件名（如果有的話）
        let originalFileName = '';
        if (originalName) {
            originalFileName = path.basename(originalName);
        } else {
            // 根據媒體類型生成默認文件名
            const ext = this.getFileExtension(mediaType);
            originalFileName = `media_${Date.now()}.${ext}`;
        }
        
        // 獲取文件擴展名
        const fileExtension = path.extname(originalFileName) || '.' + this.getFileExtension(mediaType);
        
        // 生成基礎文件名（不含擴展名）
        const baseFileName = `${timestamp}_${randomSuffix}_${cleanSenderName}_${path.basename(originalFileName, fileExtension)}`;
        
        // 檢查文件是否存在，如果存在則添加後綴
        let fileName = baseFileName + fileExtension;
        let counter = 1;
        
        // 遞歸檢查文件是否存在，直到找到不存在的文件名
        const savePath = this.getSavePath(mediaType);
        let finalFilePath = path.join(savePath, fileName);
        
        while (await this.fileExists(finalFilePath)) {
            fileName = `${baseFileName}_copy${counter}${fileExtension}`;
            finalFilePath = path.join(savePath, fileName);
            counter++;
            
            // 防止無限循環，最多嘗試100次
            if (counter > 100) {
                throw new Error('無法生成唯一文件名，嘗試次數過多');
            }
        }
        
        return fileName;
    }

    /**
     * 檢查文件是否存在
     */
    async fileExists(filePath) {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 獲取文件擴展名
     */
    getFileExtension(mediaType) {
        const extensions = {
            'image': 'jpg',
            'video': 'mp4',
            'audio': 'mp3',
            'document': 'pdf',
            'sticker': 'webp'
        };
        return extensions[mediaType] || 'bin';
    }

    /**
     * 獲取保存路徑
     */
    getSavePath(mediaType) {
        switch (mediaType) {
            case 'image':
            case 'video':
            case 'audio':
            case 'sticker':
                return this.imagePath;
            case 'document':
                return this.pdfPath;
            default:
                return this.imagePath; // 默認保存到圖片目錄
        }
    }

    /**
     * 下載媒體文件
     */
    async downloadMedia(message, senderName = 'Unknown') {
        if (!this.enabled || !this.autoDownload) {
            return null;
        }

        if (!message.hasMedia) {
            return null;
        }

        try {
            const mediaType = message.type;
            const savePath = this.getSavePath(mediaType);
            
            // 獲取媒體數據
            const media = await message.downloadMedia();
            if (!media) {
                console.error('❌ 無法下載媒體文件');
                return null;
            }

            // 格式化文件名（使用新的唯一性保證邏輯）
            const fileName = await this.formatFileName(mediaType, senderName, message.filename);
            const filePath = path.join(savePath, fileName);

            // 申請文件鎖
            if (!this.acquireLock(filePath)) {
                console.log(`🔒 文件 ${fileName} 正在被其他進程處理，跳過下載`);
                return null;
            }

            try {
                // 保存文件
                const buffer = Buffer.from(media.data, 'base64');
                fs.writeFileSync(filePath, buffer);
                
                // 獲取文件大小
                const stats = fs.statSync(filePath);
                const fileSize = stats.size;
                
                console.log(`📥 正在下載 [${mediaType.toUpperCase()}] 來自 ${senderName} -> ${filePath} (${this.formatFileSize(fileSize)})`);
                
                return {
                    filePath: filePath,
                    fileName: fileName,
                    mediaType: mediaType,
                    fileSize: fileSize,
                    mimeType: media.mimetype
                };
            } finally {
                // 確保釋放文件鎖
                this.releaseLock(filePath);
            }
        } catch (error) {
            console.error('❌ 下載媒體文件失敗:', error.message);
            return null;
        }
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 獲取媒體統計數據
     */
    getMediaStats() {
        try {
            const stats = {
                totalFiles: 0,
                totalSize: 0,
                byType: {},
                byDate: {},
                recentFiles: []
            };

            // 統計圖片目錄
            this.scanDirectory(this.imagePath, stats);
            
            // 統計PDF目錄
            this.scanDirectory(this.pdfPath, stats);

            return stats;
        } catch (error) {
            console.error('❌ 獲取媒體統計失敗:', error.message);
            return null;
        }
    }

    /**
     * 掃描目錄並統計文件
     */
    scanDirectory(dirPath, stats) {
        if (!fs.existsSync(dirPath)) {
            return;
        }

        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isFile()) {
                // 獲取文件類型
                const ext = path.extname(file).toLowerCase().slice(1);
                const fileType = this.getFileTypeByExtension(ext);
                
                // 獲取日期（從文件名或修改時間）
                const fileDate = this.extractDateFromFileName(file) || 
                               stat.mtime.toISOString().split('T')[0];
                
                // 更新統計數據
                stats.totalFiles++;
                stats.totalSize += stat.size;
                
                // 按類型統計
                stats.byType[fileType] = stats.byType[fileType] || { count: 0, size: 0 };
                stats.byType[fileType].count++;
                stats.byType[fileType].size += stat.size;
                
                // 按日期統計
                stats.byDate[fileDate] = stats.byDate[fileDate] || { count: 0, size: 0 };
                stats.byDate[fileDate].count++;
                stats.byDate[fileDate].size += stat.size;
                
                // 記錄最近文件
                stats.recentFiles.push({
                    name: file,
                    path: filePath,
                    type: fileType,
                    size: stat.size,
                    date: fileDate,
                    mtime: stat.mtime
                });
            }
        });

        // 按修改時間排序最近文件
        stats.recentFiles.sort((a, b) => b.mtime - a.mtime);
        stats.recentFiles = stats.recentFiles.slice(0, 10); // 只保留最近10個文件
    }

    /**
     * 根據擴展名獲取文件類型
     */
    getFileTypeByExtension(ext) {
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        const videoExts = ['mp4', 'avi', 'mov', 'wmv'];
        const audioExts = ['mp3', 'wav', 'ogg'];
        const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
        
        if (imageExts.includes(ext)) return 'image';
        if (videoExts.includes(ext)) return 'video';
        if (audioExts.includes(ext)) return 'audio';
        if (docExts.includes(ext)) return 'document';
        return 'other';
    }

    /**
     * 從文件名提取日期
     */
    extractDateFromFileName(fileName) {
        // 匹配 YYYYMMDD 格式
        const dateMatch = fileName.match(/(\d{8})/);
        if (dateMatch) {
            const dateStr = dateMatch[1];
            return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }
        return null;
    }

    /**
     * 格式化媒體統計數據為可讀文本
     */
    formatMediaStats(stats) {
        if (!stats) return '❌ 無法獲取媒體統計數據';

        let result = `📊 *媒體統計報告*\n`;
        result += `📅 統計時間: ${new Date().toLocaleString()}\n\n`;
        
        result += `📈 *總體統計*\n`;
        result += `• 總文件數: ${stats.totalFiles}\n`;
        result += `• 總文件大小: ${this.formatFileSize(stats.totalSize)}\n\n`;
        
        if (Object.keys(stats.byType).length > 0) {
            result += `📋 *按類型統計*\n`;
            Object.entries(stats.byType).forEach(([type, data]) => {
                result += `• ${type}: ${data.count} 個文件 (${this.formatFileSize(data.size)})\n`;
            });
            result += `\n`;
        }
        
        if (Object.keys(stats.byDate).length > 0) {
            result += `📅 *按日期統計* (最近7天)\n`;
            const recentDates = Object.keys(stats.byDate)
                .sort((a, b) => b.localeCompare(a))
                .slice(0, 7);
            
            recentDates.forEach(date => {
                const data = stats.byDate[date];
                result += `• ${date}: ${data.count} 個文件 (${this.formatFileSize(data.size)})\n`;
            });
            result += `\n`;
        }
        
        if (stats.recentFiles.length > 0) {
            result += `🆕 *最近文件* (前5個)\n`;
            stats.recentFiles.slice(0, 5).forEach((file, index) => {
                result += `${index + 1}. ${file.name} (${this.formatFileSize(file.size)})\n`;
            });
        }

        return result;
    }

    /**
     * 清理舊媒體文件
     */
    cleanupOldMedia(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            // 清理圖片目錄
            this.cleanupDirectory(this.imagePath, cutoffDate);
            
            // 清理PDF目錄
            this.cleanupDirectory(this.pdfPath, cutoffDate);
            
            console.log(`🗑️ 已清理 ${daysToKeep} 天前的舊媒體文件`);
        } catch (error) {
            console.error('❌ 清理舊媒體文件失敗:', error.message);
        }
    }

    /**
     * 清理目錄中的舊文件
     */
    cleanupDirectory(dirPath, cutoffDate) {
        if (!fs.existsSync(dirPath)) {
            return;
        }

        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isFile() && stat.mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ 已刪除舊媒體文件: ${file}`);
            }
        });
    }
}

module.exports = MediaDownloader;