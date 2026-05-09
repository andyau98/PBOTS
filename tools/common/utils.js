/**
 * PBOTS 共用工具函數
 * 所有模組共用的格式化、檔案系統操作集中在這裡，避免重複代碼
 */

const fs = require('fs');
const path = require('path');

/**
 * 確保目錄存在，若不存在則遞迴建立
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * 格式化檔案大小為可讀字串 (B/KB/MB/GB)
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 計算目錄下所有檔案的總大小（遞迴）
 */
function calculateDirSize(dirPath) {
    let totalSize = 0;
    if (!fs.existsSync(dirPath)) return totalSize;

    const walk = (currentPath) => {
        const items = fs.readdirSync(currentPath);
        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
                walk(itemPath);
            } else if (stat.isFile()) {
                totalSize += stat.size;
            }
        }
    };
    walk(dirPath);
    return totalSize;
}

module.exports = { ensureDir, formatFileSize, calculateDirSize };
