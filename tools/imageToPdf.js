const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const PathManager = require('../configs/path_manager');

class ImageToPdf {
    constructor(config, pathManager = null) {
        this.config = config;
        
        // Phase 7 標準化依賴注入
        this.pathManager = pathManager || require('../configs/path_manager');
        this.imagePath = config.media_download?.image_path || this.pathManager.IMAGES;
        this.pdfPath = config.media_download?.pdf_path || this.pathManager.PDFS;
    }

    // 獲取用戶最近上傳的圖片
    async getUserRecentImages(userId, limit = 3) {
        try {
            if (!fs.existsSync(this.imagePath)) {
                return [];
            }

            const files = fs.readdirSync(this.imagePath);
            const userFiles = [];

            // 過濾出該用戶的圖片文件
            for (const file of files) {
                if (file.includes(userId.replace('@c.us', ''))) {
                    const filePath = path.join(this.imagePath, file);
                    const stats = fs.statSync(filePath);
                    
                    userFiles.push({
                        name: file,
                        path: filePath,
                        modified: stats.mtime,
                        size: stats.size
                    });
                }
            }

            // 按修改時間排序（最新的在前）
            userFiles.sort((a, b) => b.modified - a.modified);
            
            // 返回指定數量的圖片
            return userFiles.slice(0, limit);
        } catch (error) {
            console.log('❌ 獲取用戶圖片失敗:', error.message);
            return [];
        }
    }

    // 生成PDF文件名
    generatePdfFileName(userId) {
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .replace(/\./g, '_')
            .slice(0, 17); // YYYYMMDD_HHmmss
        
        return `converted_${userId.replace('@c.us', '')}_${timestamp}.pdf`;
    }

    // 將圖片轉換為PDF
    async convertImagesToPdf(images, userId) {
        if (!images || images.length === 0) {
            throw new Error('沒有找到可轉換的圖片');
        }

        const pdfFileName = this.generatePdfFileName(userId);
        const pdfFilePath = path.join(this.pdfPath, pdfFileName);

        return new Promise((resolve, reject) => {
            try {
                // 創建PDF文檔
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 }
                });

                // 創建輸出流
                const stream = fs.createWriteStream(pdfFilePath);
                doc.pipe(stream);

                // 添加標題頁
                doc.fontSize(20).text('圖片轉PDF文檔', { align: 'center' });
                doc.fontSize(12).text(`生成時間: ${new Date().toLocaleString('zh-TW')}`, { align: 'center' });
                doc.fontSize(12).text(`用戶ID: ${userId}`, { align: 'center' });
                doc.fontSize(12).text(`圖片數量: ${images.length}`, { align: 'center' });
                doc.moveDown(2);

                // 添加每張圖片
                images.forEach((image, index) => {
                    if (index > 0) {
                        doc.addPage(); // 每張圖片新開一頁
                    }

                    // 添加圖片標題
                    doc.fontSize(14).text(`圖片 ${index + 1}: ${image.name}`, { align: 'center' });
                    doc.moveDown();

                    try {
                        // 添加圖片（居中顯示）
                        const imageWidth = 400; // 固定寬度
                        const x = (doc.page.width - imageWidth) / 2;
                        
                        doc.image(image.path, x, doc.y, { width: imageWidth });
                        doc.moveDown();
                        
                        // 添加圖片信息
                        doc.fontSize(10)
                           .text(`文件名: ${image.name}`, { align: 'center' })
                           .text(`大小: ${this.formatFileSize(image.size)}`, { align: 'center' })
                           .text(`修改時間: ${image.modified.toLocaleString('zh-TW')}`, { align: 'center' });
                        
                        doc.moveDown(2);
                    } catch (imageError) {
                        console.log(`❌ 添加圖片失敗: ${image.name}`, imageError.message);
                        doc.fontSize(12).text(`❌ 無法加載圖片: ${image.name}`, { align: 'center' });
                        doc.moveDown();
                    }
                });

                // 結束文檔
                doc.end();

                stream.on('finish', () => {
                    console.log(`✅ PDF生成完成: ${pdfFilePath}`);
                    resolve({
                        pdfPath: pdfFilePath,
                        pdfFileName: pdfFileName,
                        imageCount: images.length,
                        totalSize: images.reduce((sum, img) => sum + img.size, 0)
                    });
                });

                stream.on('error', (error) => {
                    console.log('❌ PDF生成失敗:', error.message);
                    reject(error);
                });

            } catch (error) {
                console.log('❌ PDF生成錯誤:', error.message);
                reject(error);
            }
        });
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 生成轉換統計信息
    formatConversionStats(stats) {
        if (!stats) return '❌ 轉換失敗，無法獲取統計信息';

        return `📊 圖片轉PDF轉換完成！\n` +
               `• 轉換圖片數量: ${stats.imageCount} 張\n` +
               `• 原始圖片大小: ${this.formatFileSize(stats.totalSize)}\n` +
               `• PDF文件名: ${stats.pdfFileName}\n` +
               `• 保存路徑: ${stats.pdfPath}\n` +
               `✅ 轉換成功完成！`;
    }

    // 主要轉換函數
    async convertUserImagesToPdf(userId) {
        try {
            console.log(`🔄 開始為用戶 ${userId} 轉換圖片到PDF`);
            
            // 獲取用戶最近上傳的圖片
            const images = await this.getUserRecentImages(userId, 3);
            
            if (images.length === 0) {
                return {
                    success: false,
                    message: '❌ 未找到該用戶上傳的圖片，請先上傳圖片再嘗試轉換。'
                };
            }

            console.log(`📸 找到 ${images.length} 張圖片，開始轉換...`);
            
            // 轉換為PDF
            const stats = await this.convertImagesToPdf(images, userId);
            
            return {
                success: true,
                message: this.formatConversionStats(stats),
                stats: stats
            };

        } catch (error) {
            console.log('❌ 圖片轉PDF轉換失敗:', error.message);
            return {
                success: false,
                message: `❌ 轉換失敗: ${error.message}`
            };
        }
    }
}

module.exports = ImageToPdf;