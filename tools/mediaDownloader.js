const fs = require('fs');
const path = require('path');
const PathManager = require('../configs/path_manager');

class MediaDownloader {
    constructor(config, pathManager = null) {
        this.config = config;
        this.mediaConfig = config.media_download || {};
        this.enabled = this.mediaConfig.enabled !== false;
        this.autoDownload = this.mediaConfig.auto_download !== false;
        
        // Phase 7 標準化依賴注入
        this.pathManager = pathManager || require('../configs/path_manager');
        this.imagePath = this.mediaConfig.image_path || this.pathManager.IMAGES;
        this.pdfPath = this.mediaConfig.pdf_path || this.pathManager.PDFS;
        this.namingConvention = this.mediaConfig.naming_convention || '[YYYYMMDD]_[SenderName]_[OriginalFileName]';
        
        // 文件鎖管理
        this.fileLocks = new Map();
        
        // 確保目錄存在
        this.ensureDirectories();
    }

    // 確保目錄存在
    ensureDirectories() {
        this.pathManager.ensureDirectoryExists(this.imagePath);
        this.pathManager.ensureDirectoryExists(this.pdfPath);
    }

    // 生成文件名（修復覆蓋Bug）
    async generateFileName(message, senderName, originalFileName = '') {
        const now = new Date();
        // 使用香港時間 (UTC+8)
        const hongKongTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        // 精確到毫秒的時間戳（香港時間）
        const timestamp = hongKongTime.toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .replace(/\./g, '_')
            .slice(0, 21); // YYYYMMDD_HHmmss_SSS
        
        // 4位隨機數保護
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        
        const cleanSenderName = this.sanitizeFileName(senderName);
        const cleanFileName = this.sanitizeFileName(originalFileName || 'file');
        
        // 基礎文件名
        const baseFileName = `${timestamp}_${randomSuffix}_${cleanSenderName}_${cleanFileName}`;
        
        // 確定文件擴展名
        let fileExtension = '';
        if (message.type === 'image') {
            fileExtension = '.jpg';
        } else if (message.type === 'document') {
            fileExtension = path.extname(originalFileName) || '.pdf';
        }
        
        // 文件存在檢查和後綴添加
        let fileName = baseFileName + fileExtension;
        let counter = 1;
        
        // 使用 PathManager 提供的路徑進行文件存在檢查
        while (await this.fileExists(fileName, message.type)) {
            fileName = `${baseFileName}_copy${counter}${fileExtension}`;
            counter++;
        }
        
        return fileName;
    }
    
    // 檢查文件是否存在（基於 PathManager 路徑）
    async fileExists(fileName, messageType = 'image') {
        try {
            // 根據文件類型確定保存路徑
            let savePath;
            if (messageType === 'image') {
                savePath = this.imagePath;
            } else if (messageType === 'document') {
                savePath = this.pdfPath;
            } else {
                savePath = this.imagePath; // 默認路徑
            }
            
            const fullPath = path.join(savePath, fileName);
            await fs.promises.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    // 清理文件名中的非法字符
    sanitizeFileName(name) {
        return name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '_');
    }

    // 申請文件鎖
    acquireLock(filePath) {
        const lockKey = filePath;
        if (this.fileLocks.has(lockKey)) {
            return false;
        }
        this.fileLocks.set(lockKey, true);
        return true;
    }

    // 釋放文件鎖
    releaseLock(filePath) {
        const lockKey = filePath;
        this.fileLocks.delete(lockKey);
    }

    // 下載媒體文件
    async downloadMedia(message, senderName, groupName = null) {
        if (!this.enabled || !message.hasMedia) {
            return null;
        }

        try {
            const media = await message.downloadMedia();
            if (!media) {
                console.log('❌ 媒體下載失敗');
                return null;
            }

            // 確定保存路徑和文件名
            let savePath, fileName;
            
            if (message.type === 'image') {
                savePath = this.imagePath;
                fileName = await this.generateFileName(message, senderName);
            } else if (message.type === 'document') {
                savePath = this.pdfPath;
                const originalFileName = message.mediaFilename || '';
                fileName = await this.generateFileName(message, senderName, originalFileName);
            } else {
                console.log(`❓ 不支持的媒體類型: ${message.type}`);
                return null;
            }

            const fullPath = path.join(savePath, fileName);

            // 申請文件鎖
            if (!this.acquireLock(fullPath)) {
                console.log(`🔒 文件 ${fileName} 正在被其他進程處理，跳過下載`);
                return null;
            }

            try {
                // 保存文件
                const buffer = Buffer.from(media.data, 'base64');
                fs.writeFileSync(fullPath, buffer);
                
                // 記錄下載日誌
                const sourcePrefix = groupName ? `[GROUP - ${groupName}]` : '[PRIVATE]';
                console.log(`📥 已下載 [${message.type.toUpperCase()}] 來自 ${sourcePrefix} ${senderName} -> ${fullPath}`);
                
                return {
                    path: fullPath,
                    fileName: fileName,
                    type: message.type,
                    size: buffer.length
                };
            } finally {
                // 釋放文件鎖
                this.releaseLock(fullPath);
            }

        } catch (error) {
            console.log(`❌ 媒體下載錯誤: ${error.message}`);
            return null;
        }
    }

    // 獲取媒體統計數據
    getMediaStats() {
        try {
            const imageFiles = this.getFilesInDirectory(this.imagePath);
            const pdfFiles = this.getFilesInDirectory(this.pdfPath);
            
            const totalImages = imageFiles.length;
            const totalPdfs = pdfFiles.length;
            const totalSize = this.calculateTotalSize([...imageFiles, ...pdfFiles]);
            
            return {
                total_images: totalImages,
                total_pdfs: totalPdfs,
                total_files: totalImages + totalPdfs,
                total_size: totalSize,
                image_path: this.imagePath,
                pdf_path: this.pdfPath
            };
        } catch (error) {
            console.log('❌ 媒體統計獲取失敗:', error.message);
            return null;
        }
    }

    // 獲取目錄中的文件
    getFilesInDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            return [];
        }
        
        const files = fs.readdirSync(dirPath);
        return files.map(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                path: filePath,
                size: stats.size,
                modified: stats.mtime
            };
        });
    }

    // 計算總文件大小
    calculateTotalSize(files) {
        return files.reduce((total, file) => total + file.size, 0);
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 格式化媒體統計數據
    formatMediaStats(stats) {
        if (!stats) return '❌ 無法獲取媒體統計數據';

        return `📊 媒體統計數據:\n` +
               `• 圖片文件: ${stats.total_images} 個\n` +
               `• PDF文件: ${stats.total_pdfs} 個\n` +
               `• 總文件數: ${stats.total_files} 個\n` +
               `• 總大小: ${this.formatFileSize(stats.total_size)}\n` +
               `• 圖片路徑: ${stats.image_path}\n` +
               `• PDF路徑: ${stats.pdf_path}`;
    }
}

module.exports = MediaDownloader;