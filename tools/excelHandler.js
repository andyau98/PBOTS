const fs = require('fs');
const PathManager = require('../configs/path_manager');

class ExcelHandler {
    constructor(config, logicEngine = null, pathManager = null, securityManager = null, contextStandardizer = null) {
        this.config = config;
        
        // Phase 7 標準化依賴注入
        this.pathManager = pathManager || require('../configs/path_manager');
        this.logicEngine = logicEngine;
        this.securityManager = securityManager;
        this.contextStandardizer = contextStandardizer;
    }

    /**
     * 標準 execute 方法 - PBOTS 架構規範
     * 1. 權限檢查
     * 2. 跨頻道處理
     * 3. 執行 Excel 邏輯
     * @param {Object} context - 標準化上下文
     * @param {string} command - 指令名稱
     * @returns {Promise<Object>} 執行結果
     */
    async execute(context, command) {
        try {
            // 1. 權限檢查 - 第一步必須檢查
            if (!this.securityManager || !this.securityManager.isWhiteListed(context.userId)) {
                throw new Error('🚫 權限不足，無法使用 Excel 功能');
            }
            
            // 2. 跨頻道處理 - 記錄交互
            if (this.contextStandardizer) {
                await this.contextStandardizer.recordInteraction(context, command);
            }
            
            // 3. 執行 Excel 邏輯
            return await this.handleExcelCommand(context);
            
        } catch (error) {
            console.error('❌ ExcelHandler execute 錯誤:', error.message);
            throw error;
        }
    }

    /**
     * 處理 Excel 命令
     * @param {Object} context - 標準化上下文
     * @returns {Promise<Object>} 處理結果
     */
    async handleExcelCommand(context) {
        try {
            const { messageBody, pushname } = context;
            
            // 檢查是否為 Excel 表單命令
            if (messageBody.startsWith('!trial') || messageBody.startsWith('!excel')) {
                return await this.handleExcelFormCommand(context);
            }
            
            // 默認回覆
            const excelMessage = '📊 Excel 功能開發中，敬請期待！\n💡 未來將支援: 數據匯出、報表生成、自動化處理';
            
            return {
                success: true,
                message: excelMessage,
                data: {
                    command: 'excel',
                    user: pushname,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ 處理 Excel 命令失敗:', error.message);
            return {
                success: false,
                message: '❌ Excel 功能暫時不可用，請稍後重試'
            };
        }
    }

    /**
     * 處理 Excel 表單命令
     * @param {Object} context - 標準化上下文
     * @returns {Promise<Object>} 處理結果
     */
    async handleExcelFormCommand(context) {
        try {
            const { messageBody, userId, originId, pushname, isGroup } = context;
            
            if (!this.logicEngine) {
                return {
                    success: false,
                    message: '❌ LogicEngine 未初始化，無法處理 Excel 表單'
                };
            }
            
            const command = messageBody.split(' ')[0].replace('!', '');
            
            // 優先級調整：如果用戶在 LogicEngine 會話中，優先處理
            if (this.logicEngine.isUserInSession(userId, originId)) {
                // 檢查群組鎖定（如果是群組訊息）
                if (isGroup) {
                    if (this.logicEngine.isGroupSessionLocked(originId, userId)) {
                        // 群組已鎖定給其他用戶，忽略此訊息
                        console.log(`⛔ 群組 ${originId} 已鎖定，忽略用戶 ${pushname} 的訊息`);
                        return { 
                            success: true, 
                            message: '', 
                            handled: true,
                            isExcelCommand: true 
                        };
                    }
                }
                
                console.log(`📝 用戶 ${pushname} 在 LogicEngine 會話中回答: ${messageBody}`);
                
                const result = await this.logicEngine.getNextQuestion(context);
                
                return this.processLogicEngineResult(result, context);
            }
            
            // 檢查是否為可用工作表名稱
            const availableSheets = this.logicEngine.getAvailableSheets();
            const isSheetCommand = availableSheets.includes(command);
            
            if (isSheetCommand) {
                console.log(`📊 用戶 ${pushname} 啟動 Excel 填表流程: ${command}`);
                
                const result = await this.logicEngine.execute(context, command);
                return this.processLogicEngineResult(result, context);
            }
            
            return {
                success: false,
                message: `❌ 未知的 Excel 命令: !${command}`,
                handled: false
            };
            
        } catch (error) {
            console.error('❌ 處理 Excel 表單命令失敗:', error.message);
            return {
                success: false,
                message: '❌ Excel 表單處理失敗，請稍後重試'
            };
        }
    }

    /**
     * 處理 LogicEngine 結果
     * @param {Object} result - LogicEngine 結果
     * @param {Object} context - 上下文
     * @returns {Object} 格式化結果
     */
    processLogicEngineResult(result, context) {
        if (!result) {
            return {
                success: false,
                message: '❌ LogicEngine 返回空結果'
            };
        }
        
        return {
            success: true,
            message: result.message || '',
            confirmation: result.confirmation || null,
            resultFile: result.resultFile || null,
            handled: true,
            isExcelCommand: true,
            type: result.type || 'unknown'
        };
    }

    /**
     * 獲取可用的 Excel 工作表列表
     * @returns {Array<string>} 工作表名稱列表
     */
    getAvailableSheets() {
        if (!this.logicEngine) {
            return [];
        }
        return this.logicEngine.getAvailableSheets();
    }
}

module.exports = ExcelHandler;