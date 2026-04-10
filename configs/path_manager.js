const path = require('path');
const fs = require('fs');

// 中央路徑總管 - 全專案路徑唯一來源
const ROOT = process.cwd();

const PathManager = {
    // 根目錄
    ROOT: ROOT,
    
    // 主要資料夾
    DATA: path.join(ROOT, 'data'),
    TOOLS: path.join(ROOT, 'tools'),
    CONFIGS: path.join(ROOT, 'configs'),
    BACKUPS: path.join(ROOT, 'backups'),
    MARKDOWN: path.join(ROOT, 'MarkDown'),
    LOGS: path.join(ROOT, 'logs'),
    SRC: path.join(ROOT, 'src'),
    TEMPLATES: path.join(ROOT, 'Templates'),
    EXPORTS: path.join(ROOT, 'Exports'),
    
    // 資料檔案
    WHITELIST: path.join(ROOT, 'data', 'whitelist.json'),
    CONTEXTS: path.join(ROOT, 'data', 'contexts.json'),
    SETTINGS: path.join(ROOT, 'configs', 'settings.json'),
    
    // 子資料夾
    CHATS: path.join(ROOT, 'data', 'chats'),
    IMAGES: path.join(ROOT, 'data', 'images'),
    PDFS: path.join(ROOT, 'data', 'pdfs'),
    
    // 日誌檔案
    SECURITY_LOG: path.join(ROOT, 'logs', 'security.log'),
    PM2_COMBINED_LOG: path.join(ROOT, 'logs', 'pm2-combined.log'),
    PM2_OUT_LOG: path.join(ROOT, 'logs', 'pm2-out.log'),
    PM2_ERROR_LOG: path.join(ROOT, 'logs', 'pm2-error.log'),
    
    // 工具方法
    ensureDirectoryExists: (dirPath) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return dirPath;
    },
    
    // 初始化所有必要資料夾
    initializeDirectories: () => {
        const directories = [
            PathManager.DATA,
            PathManager.TOOLS,
            PathManager.CONFIGS,
            PathManager.BACKUPS,
            PathManager.MARKDOWN,
            PathManager.LOGS,
            PathManager.SRC,
            PathManager.TEMPLATES,
            PathManager.EXPORTS,
            PathManager.CHATS,
            PathManager.IMAGES,
            PathManager.PDFS
        ];
        
        directories.forEach(dir => {
            PathManager.ensureDirectoryExists(dir);
        });
        
        console.log('✅ 所有必要資料夾已初始化完成');
    },
    
    // 檢查路徑是否存在
    pathExists: (filePath) => {
        return fs.existsSync(filePath);
    },
    
    // 標準化路徑（跨平台兼容）
    normalizePath: (inputPath) => {
        if (typeof inputPath !== 'string') return inputPath;
        
        // 移除首尾空格
        let normalized = inputPath.trim();
        
        // 將反斜線轉為正斜線
        normalized = normalized.replace(/\\/g, '/');
        
        // 移除重複斜線
        normalized = normalized.replace(/\/+/g, '/');
        
        return normalized;
    },
    
    // 獲取相對路徑（相對於專案根目錄）
    getRelativePath: (absolutePath) => {
        return path.relative(ROOT, absolutePath);
    },
    
    // 驗證路徑是否在專案範圍內（安全性檢查）
    isPathWithinProject: (filePath) => {
        const relative = PathManager.getRelativePath(filePath);
        return !relative.startsWith('..') && !path.isAbsolute(relative);
    }
};

// 自動初始化資料夾
PathManager.initializeDirectories();

module.exports = PathManager;