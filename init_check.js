const fs = require('fs');
const path = require('path');
const PathManager = require('./configs/path_manager');

console.log('🔍 啟動 PBOTS 專案自癒驗證系統...\n');

class InitCheck {
    constructor() {
        this.checks = [];
        this.errors = [];
        this.warnings = [];
    }

    // 檢查目錄是否存在
    checkDirectory(dirPath, description) {
        const exists = fs.existsSync(dirPath);
        const status = exists ? '✅' : '❌';
        
        this.checks.push({
            type: 'directory',
            path: dirPath,
            description: description,
            exists: exists,
            status: status
        });

        if (!exists) {
            this.errors.push(`目錄不存在: ${description} (${dirPath})`);
        }

        return exists;
    }

    // 檢查檔案是否存在
    checkFile(filePath, description) {
        const exists = fs.existsSync(filePath);
        const status = exists ? '✅' : '⚠️';
        
        this.checks.push({
            type: 'file',
            path: filePath,
            description: description,
            exists: exists,
            status: status
        });

        if (!exists) {
            this.warnings.push(`檔案不存在: ${description} (${filePath})`);
        }

        return exists;
    }

    // 檢查配置檔案路徑
    checkConfigPaths() {
        console.log('📋 檢查配置檔案路徑...');
        
        try {
            const configData = fs.readFileSync(PathManager.SETTINGS, 'utf8');
            const config = JSON.parse(configData);
            
            // 檢查 paths 配置
            if (config.paths) {
                for (const [key, value] of Object.entries(config.paths)) {
                    const fullPath = path.join(PathManager.ROOT, value);
                    this.checkDirectory(fullPath, `配置路徑: ${key}`);
                }
            }
            
            // 檢查 message_logging 路徑
            if (config.message_logging?.save_path) {
                const fullPath = path.join(PathManager.ROOT, config.message_logging.save_path);
                this.checkDirectory(fullPath, '訊息記錄路徑');
            }
            
            // 檢查 security 路徑
            if (config.security?.whitelist_file) {
                const fullPath = path.join(PathManager.ROOT, config.security.whitelist_file);
                this.checkFile(fullPath, '白名單檔案');
            }
            
            // 檢查 media_download 路徑
            if (config.media_download?.image_path) {
                const fullPath = path.join(PathManager.ROOT, config.media_download.image_path);
                this.checkDirectory(fullPath, '圖片下載路徑');
            }
            
            if (config.media_download?.pdf_path) {
                const fullPath = path.join(PathManager.ROOT, config.media_download.pdf_path);
                this.checkDirectory(fullPath, 'PDF 儲存路徑');
            }
            
        } catch (error) {
            this.errors.push(`配置檔案讀取失敗: ${error.message}`);
        }
    }

    // 檢查工具模組
    checkToolModules() {
        console.log('🔧 檢查工具模組...');
        
        const toolFiles = [
            'messageLogger.js',
            'securityManager.js', 
            'mediaDownloader.js',
            'imageToPdf.js',
            'cleanup.js',
            'contextManager.js',
            'contextStandardizer.js',
            'healthMonitor.js'
        ];

        toolFiles.forEach(toolFile => {
            const toolPath = path.join(PathManager.TOOLS, toolFile);
            this.checkFile(toolPath, `工具模組: ${toolFile}`);
        });
    }

    // 檢查 PathManager 完整性
    checkPathManager() {
        console.log('🗂️ 檢查 PathManager 完整性...');
        
        const requiredPaths = [
            { path: PathManager.DATA, desc: '資料目錄' },
            { path: PathManager.TOOLS, desc: '工具目錄' },
            { path: PathManager.CONFIGS, desc: '配置目錄' },
            { path: PathManager.BACKUPS, desc: '備份目錄' },
            { path: PathManager.MARKDOWN, desc: '文檔目錄' },
            { path: PathManager.LOGS, desc: '日誌目錄' },
            { path: PathManager.SRC, desc: '原始碼目錄' },
            { path: PathManager.TEMPLATES, desc: '模板目錄' },
            { path: PathManager.EXPORTS, desc: '匯出目錄' },
            { path: PathManager.CHATS, desc: '聊天記錄目錄' },
            { path: PathManager.IMAGES, desc: '圖片目錄' },
            { path: PathManager.PDFS, desc: 'PDF 目錄' }
        ];

        requiredPaths.forEach(({ path: dirPath, desc }) => {
            this.checkDirectory(dirPath, desc);
        });

        // 檢查重要檔案
        this.checkFile(PathManager.SETTINGS, '主配置檔案');
        this.checkFile(PathManager.WHITELIST, '白名單檔案');
        this.checkFile(PathManager.CONTEXTS, '上下文檔案');
    }

    // 自動修復缺失的目錄
    autoFixMissingDirectories() {
        console.log('🔧 自動修復缺失的目錄...');
        
        this.checks.forEach(check => {
            if (check.type === 'directory' && !check.exists) {
                try {
                    fs.mkdirSync(check.path, { recursive: true });
                    console.log(`   ✅ 已建立目錄: ${check.description}`);
                    check.exists = true;
                    check.status = '✅';
                } catch (error) {
                    console.log(`   ❌ 建立目錄失敗: ${check.description} - ${error.message}`);
                }
            }
        });
    }

    // 生成報告
    generateReport() {
        console.log('\n📊 驗證報告:');
        console.log('='.repeat(50));
        
        // 顯示檢查結果
        this.checks.forEach(check => {
            console.log(`${check.status} ${check.description}`);
        });

        // 顯示錯誤
        if (this.errors.length > 0) {
            console.log('\n❌ 錯誤:');
            this.errors.forEach(error => {
                console.log(`   ${error}`);
            });
        }

        // 顯示警告
        if (this.warnings.length > 0) {
            console.log('\n⚠️ 警告:');
            this.warnings.forEach(warning => {
                console.log(`   ${warning}`);
            });
        }

        // 統計
        const totalChecks = this.checks.length;
        const passedChecks = this.checks.filter(c => c.exists).length;
        const failedChecks = totalChecks - passedChecks;

        console.log('\n📈 統計:');
        console.log(`   總檢查項目: ${totalChecks}`);
        console.log(`   通過項目: ${passedChecks}`);
        console.log(`   失敗項目: ${failedChecks}`);
        console.log(`   成功率: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);

        return {
            total: totalChecks,
            passed: passedChecks,
            failed: failedChecks,
            errors: this.errors,
            warnings: this.warnings,
            success: this.errors.length === 0
        };
    }

    // 執行完整檢查
    async runFullCheck() {
        console.log('🚀 開始執行完整環境檢查...\n');
        
        this.checkPathManager();
        this.checkConfigPaths();
        this.checkToolModules();
        
        // 自動修復
        this.autoFixMissingDirectories();
        
        // 生成報告
        const report = this.generateReport();
        
        console.log('\n' + '='.repeat(50));
        if (report.success) {
            console.log('🎉 環境檢查完成！專案已準備就緒。');
        } else {
            console.log('⚠️ 環境檢查完成，但發現一些問題需要手動處理。');
        }
        
        return report;
    }
}

// 如果直接執行此檔案，則執行檢查
if (require.main === module) {
    const initCheck = new InitCheck();
    initCheck.runFullCheck().catch(error => {
        console.error('❌ 檢查過程中發生錯誤:', error);
        process.exit(1);
    });
}

module.exports = InitCheck;