const fs = require('fs');
const path = require('path');

class WhitelistCleanup {
    constructor(config = {}) {
        this.config = config;
        this.configPath = path.join(__dirname, '../configs/settings.json');

        console.log('🧹 白名單清理工具已初始化');
    }

    /**
     * 清理所有白名单注册数据
     */
    async cleanupAllWhitelistData() {
        try {
            console.log('🧹 開始清理白名單註冊數據...');

            // 清理安全管理器的數據
            await this.cleanupSecurityManager();

            // 清理白名單管理器的數據
            await this.cleanupWhitelistManager();

            // 清理配置文件
            await this.cleanupConfigFile();

            // 清理私信問答會話
            await this.cleanupPrivateSessions();

            console.log('✅ 白名單註冊數據清理完成');

            return {
                success: true,
                message: '白名單註冊數據已成功清理',
                details: {
                    securityManagerCleaned: true,
                    whitelistManagerCleaned: true,
                    configFileCleaned: true,
                    privateSessionsCleaned: true,
                },
            };
        } catch (error) {
            console.error('❌ 清理白名單數據失敗:', error);
            return {
                success: false,
                message: `清理失敗: ${error.message}`,
            };
        }
    }

    /**
     * 清理安全管理器數據
     */
    async cleanupSecurityManager() {
        try {
            // 安全管理器的數據存儲在配置文件中
            // 我們需要更新配置文件中的admin_numbers和authorized_groups
            const config = await this.loadConfig();

            if (config.security) {
                const originalAdminCount =
                    config.security.admin_numbers?.length || 0;
                const originalGroupCount =
                    config.security.authorized_groups?.length || 0;

                // 清空管理員列表和授權群組
                config.security.admin_numbers = [];
                config.security.authorized_groups = [];

                await this.saveConfig(config);

                console.log(
                    `🗑️ 安全管理器清理完成: 移除 ${originalAdminCount} 個管理員, ${originalGroupCount} 個授權群組`
                );
            }

            return true;
        } catch (error) {
            console.error('❌ 清理安全管理器失敗:', error);
            throw error;
        }
    }

    /**
     * 清理白名單管理器數據
     * 注：白名單管理器數據存儲在配置文件中，已在 cleanupConfigFile 中處理
     */
    async cleanupWhitelistManager() {
        return true;
    }

    /**
     * 清理配置文件
     */
    async cleanupConfigFile() {
        try {
            const config = await this.loadConfig();

            // 確保安全配置存在
            if (!config.security) {
                config.security = {};
            }

            // 重置所有安全相關的設置
            config.security.admin_numbers = [];
            config.security.authorized_groups = [];
            config.security.whitelist_enabled = true; // 保持白名單啟用

            // 重置bot相關設置
            if (config.bot) {
                config.bot.adminUsers = [];
            }

            await this.saveConfig(config);

            console.log('🗑️ 配置文件清理完成');
            return true;
        } catch (error) {
            console.error('❌ 清理配置文件失敗:', error);
            throw error;
        }
    }

    /**
     * 清理私信問答會話
     * 注：私信會話是運行時內存數據，重啟後自動清除
     */
    async cleanupPrivateSessions() {
        return true;
    }

    /**
     * 加載配置文件
     */
    async loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(configData);
            }
            return {};
        } catch (error) {
            console.error('❌ 加載配置文件失敗:', error);
            throw error;
        }
    }

    /**
     * 保存配置文件
     */
    async saveConfig(config) {
        try {
            const configData = JSON.stringify(config, null, 2);
            fs.writeFileSync(this.configPath, configData, 'utf8');

            console.log('💾 配置文件已更新');
            return true;
        } catch (error) {
            console.error('❌ 保存配置文件失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取當前白名單狀態
     */
    async getWhitelistStatus() {
        try {
            const config = await this.loadConfig();

            return {
                adminCount: config.security?.admin_numbers?.length || 0,
                groupCount: config.security?.authorized_groups?.length || 0,
                whitelistEnabled: config.security?.whitelist_enabled !== false,
                configPath: this.configPath,
            };
        } catch (error) {
            console.error('❌ 獲取白名單狀態失敗:', error);
            throw error;
        }
    }

    /**
     * 重置為初始狀態
     */
    async resetToInitialState() {
        try {
            console.log('🔄 重置白名單為初始狀態...');

            // 清理所有數據
            await this.cleanupAllWhitelistData();

            // 確保白名單模式啟用
            const config = await this.loadConfig();
            if (config.security) {
                config.security.whitelist_enabled = true;
                await this.saveConfig(config);
            }

            console.log('✅ 白名單已重置為初始狀態');

            return {
                success: true,
                message: '白名單已成功重置為初始狀態',
                whitelistEnabled: true,
                adminCount: 0,
                groupCount: 0,
            };
        } catch (error) {
            console.error('❌ 重置白名單失敗:', error);
            return {
                success: false,
                message: `重置失敗: ${error.message}`,
            };
        }
    }
}

module.exports = WhitelistCleanup;
