const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * PBOTS Phase 7 - LogicEngine 群組對答優化版本
 * 嚴格遵守 PBOTS_Standard_Architecture.md 規範
 * 
 * 核心功能：
 * 1. 群組會話鎖：以 originId 鎖定，只接收發起人訊息
 * 2. 互動反饋：每次回答回覆 @pushname 收到: [內容]
 * 3. 中斷邏輯：支援 !cancel 立即終止會話
 * 4. 數據對接：從 data/robot_map.xlsx 讀取，存入 data/excel_results/
 */

class LogicEngine {
    /**
     * 標準構造函數注入 - 嚴格遵守 PBOTS 規範
     * @param {Object} dependencies - 依賴注入對象
     * @param {Object} dependencies.pathManager - 路徑管理器
     * @param {Object} dependencies.securityManager - 安全管理器
     * @param {Object} dependencies.contextStandardizer - 上下文標準化器
     */
    constructor({ pathManager, securityManager, contextStandardizer }) {
        // 依賴注入 - 必須使用 configs/path_manager.js
        this.pathManager = pathManager;
        this.securityManager = securityManager;
        this.contextStandardizer = contextStandardizer;
        
        // 路徑管理 - 嚴禁使用相對路徑字串
        this.mapFile = this.pathManager.DATA + '/robot_map.xlsx';
        this.resultsDir = this.pathManager.DATA + '/excel_results/';
        
        // 會話管理 - Phase 7 群組會話鎖
        this.userSessions = new Map(); // userId -> sessionData
        this.groupSessions = new Map(); // originId -> { initiatorId, currentStep, data }
        this.workbook = null;
        this.availableSheets = [];
        
        // 確保結果目錄存在
        this.pathManager.ensureDirectoryExists(this.resultsDir);
    }

    /**
     * 標準 execute 方法 - PBOTS 架構規範
     * 1. 權限檢查
     * 2. 跨頻道處理
     * 3. 會話鎖定
     * @param {Object} context - 標準化上下文
     * @param {string} command - 指令名稱
     * @returns {Promise<Object>} 執行結果
     */
    async execute(context, command) {
        try {
            // 1. 權限檢查 - 第一步必須檢查
            if (!this.securityManager.isWhiteListed(context.userId)) {
                throw new Error('🚫 權限不足，無法使用 LogicEngine');
            }
            
            // 2. 跨頻道處理 - 記錄交互
            await this.contextStandardizer.recordInteraction(context, command);
            
            // 3. 會話鎖定 - 群組環境下鎖定發起人
            if (context.isGroup) {
                this.lockSession(context.originId, context.userId);
            }
            
            // 4. 執行邏輯 - group-pm-group 流程
            const result = await this.startForm(context, command);
            
            // 如果是群組環境且需要私訊互動，返回特殊結果
            if (context.isGroup && result.requiresPrivateMessage) {
                return {
                    success: true,
                    message: result.message,
                    requiresPrivateMessage: true,
                    privateMessage: result.privateMessage,
                    confirmation: result.confirmation
                };
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ LogicEngine execute 錯誤:', error.message);
            throw error;
        }
    }

    /**
     * 群組會話鎖定 - Phase 7 核心功能
     * 建立 groupSessions Map，儲存 { initiatorId, currentStep, data }
     * @param {string} originId - 群組 ID
     * @param {string} initiatorId - 發起人 ID
     */
    lockSession(originId, initiatorId) {
        this.groupSessions.set(originId, {
            initiatorId: initiatorId,
            currentStep: 'start',
            data: new Map()
        });
        console.log(`🔒 群組 ${originId} 鎖定用戶 ${initiatorId}`);
    }

    /**
     * 檢查群組會話鎖定
     * 邏輯攔截：若該群組已有會話，非發起人的訊息一律無視
     * @param {string} originId - 群組 ID
     * @param {string} userId - 當前用戶 ID
     * @returns {boolean} 是否被鎖定
     */
    isGroupSessionLocked(originId, userId) {
        const session = this.groupSessions.get(originId);
        if (session && session.initiatorId !== userId) {
            console.log(`⛔ 群組 ${originId} 已鎖定給用戶 ${session.initiatorId}，忽略用戶 ${userId} 的訊息`);
            return true;
        }
        return false;
    }

    /**
     * 檢查用戶是否在會話中
     * @param {string} userId - 用戶 ID
     * @param {string} originId - 來源 ID (可選)
     * @returns {boolean} 是否在會話中
     */
    isUserInSession(userId, originId = null) {
        if (!this.userSessions.has(userId)) {
            return false;
        }
        
        const session = this.userSessions.get(userId);
        
        // 如果在群組中，檢查群組鎖定
        if (originId && session.originId !== originId) {
            return false;
        }
        
        return true;
    }

    /**
     * 開始新的填表流程
     * @param {Object} context - 標準化上下文
     * @param {string} sheetName - 工作表名稱
     * @returns {Promise<Object>} 第一個問題
     */
    async startForm(context, sheetName = 'trial') {
        try {
            const { userId, originId, pushname, isGroup } = context;
            
            // 加載 Excel 模板 - 從 data/robot_map.xlsx 讀取
            const logicTree = await this.loadTemplate(sheetName);
            
            // 初始化用戶會話
            this.userSessions.set(userId, {
                sheetName: sheetName,
                logicTree: logicTree,
                answers: new Map(),
                currentQuestion: 'Q1', // 從第一個問題開始
                startTime: new Date(),
                targetCells: new Map(),
                originId: originId,
                pushname: pushname,
                isGroup: isGroup
            });
            
            // 更新群組會話狀態
            if (isGroup) {
                const groupSession = this.groupSessions.get(originId);
                if (groupSession) {
                    groupSession.currentStep = 'question_1';
                    groupSession.data.set('sheetName', sheetName);
                }
            }
            
            console.log(`🚀 ${isGroup ? '群組' : '私訊'}會話啟動: ${userId} -> ${sheetName}`);
            
            // 獲取第一個問題
            return await this.getNextQuestion(context, null);
            
        } catch (error) {
            console.error('❌ 啟動填表流程失敗:', error.message);
            throw error;
        }
    }

    /**
     * 加載 Excel 模板
     * @param {string} sheetName - 工作表名稱
     * @returns {Promise<Map>} 邏輯樹
     */
    async loadTemplate(sheetName = 'trial') {
        try {
            console.log('📊 正在加載 Excel 邏輯地圖...');
            
            // 檢查文件是否存在，不存在則創建默認模板
            if (!fs.existsSync(this.mapFile)) {
                await this.createDefaultTemplate();
            }

            // 加載工作簿
            this.workbook = new ExcelJS.Workbook();
            await this.workbook.xlsx.readFile(this.mapFile);
            
            // 獲取所有工作表名稱
            this.availableSheets = this.workbook.worksheets.map(ws => ws.name);
            
            // 加載指定工作表
            const worksheet = this.workbook.getWorksheet(sheetName);
            if (!worksheet) {
                throw new Error(`工作表 "${sheetName}" 不存在`);
            }
            
            const logicTree = new Map();
            const headers = [];
            
            // 讀取標題行
            worksheet.getRow(1).eachCell((cell, colNumber) => {
                headers[colNumber] = cell.value;
            });

            // 讀取數據行
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // 跳過標題行
                
                const questionData = {};
                row.eachCell((cell, colNumber) => {
                    const header = headers[colNumber];
                    if (header) {
                        questionData[header] = cell.value;
                    }
                });

                // 確保 QuestionID 存在
                if (questionData.QuestionID) {
                    logicTree.set(questionData.QuestionID.toString(), questionData);
                }
            });

            console.log(`✅ Excel 模板加載完成: ${sheetName} (${logicTree.size} 個問題)`);
            return logicTree;
            
        } catch (error) {
            console.error('❌ 加載 Excel 模板失敗:', error.message);
            throw error;
        }
    }

    /**
     * 獲取下一個問題 - Phase 7 互動反饋
     * @param {Object} context - 標準化上下文
     * @param {string} userInput - 用戶輸入
     * @returns {Promise<Object>} 問題訊息
     */
    async getNextQuestion(context, userInput) {
        try {
            const { userId, originId, pushname, isGroup } = context;
            
            // 邏輯攔截：若該群組已有會話，非發起人的訊息一律無視
            if (isGroup && this.isGroupSessionLocked(originId, userId)) {
                return { type: 'ignored', message: '⛔ 此群組會話已鎖定給其他用戶' };
            }
            
            // 檢查會話是否存在
            if (!this.userSessions.has(userId)) {
                throw new Error(`找不到用戶會話: ${userId}`);
            }
            
            const session = this.userSessions.get(userId);
            const { logicTree, sheetName, currentQuestion } = session;
            
            // 處理用戶輸入
            if (userInput && currentQuestion) {
                await this.processUserInput(session, currentQuestion, userInput, context);
            }
            
            // 獲取當前問題
            const nextQuestionId = session.currentQuestion;
            if (!nextQuestionId || nextQuestionId === '!end') {
                // 會話結束
                return await this.completeSession(session, context);
            }
            
            const question = logicTree.get(nextQuestionId);
            if (!question) {
                throw new Error(`找不到問題 ID: ${nextQuestionId}`);
            }
            
            // 構建問題訊息
            let message = this.buildQuestionMessage(question, sheetName);
            
            // 互動反饋：每次收到回答回覆確認
            let confirmation = null;
            if (userInput && pushname) {
                confirmation = `收到: ${userInput}`;
            }
            
            // 更新群組會話狀態
            if (isGroup) {
                const groupSession = this.groupSessions.get(originId);
                if (groupSession) {
                    groupSession.currentStep = `question_${nextQuestionId}`;
                    groupSession.data.set('currentQuestion', nextQuestionId);
                }
            }
            
            // 如果是群組環境且需要私訊互動，返回特殊結果
            if (isGroup && !userInput) {
                return {
                    success: true,
                    message: message,
                    requiresPrivateMessage: true,
                    confirmation: confirmation
                };
            }
            
            return {
                type: userInput ? 'question_with_confirmation' : 'question',
                sheetName: sheetName,
                questionId: question.QuestionID,
                message: message,
                confirmation: confirmation,
                validationType: question.ValidationType,
                targetCell: question.TargetCell
            };
            
        } catch (error) {
            console.error('❌ 獲取問題失敗:', error.message);
            throw error;
        }
    }

    /**
     * 處理用戶輸入 - 使用 group-pm-group 流程
     * @param {Object} session - 用戶會話
     * @param {string} questionId - 問題 ID
     * @param {string} userInput - 用戶輸入
     * @param {Object} context - 上下文
     * @returns {Promise<Object>} 處理結果
     */
    async processUserInput(session, questionId, userInput, context) {
        try {
            const { logicTree, answers, targetCells, originId, isGroup, pushname } = session;
            
            const question = logicTree.get(questionId);
            if (!question) {
                throw new Error(`找不到問題: ${questionId}`);
            }
            
            // 中斷邏輯：偵測到 !cancel 必須立刻清理 Map 緩存
            if (userInput.toLowerCase() === '!cancel') {
                this.cancelSession(session);
                return {
                    success: true,
                    message: '❌ 填表流程已取消',
                    requiresGroupReport: isGroup,
                    groupReportMessage: `❌ ${pushname} 的填表流程已取消`
                };
            }
            
            // 保存用戶回答
            answers.set(questionId, {
                question: question.QuestionText,
                answer: userInput,
                targetCell: question.TargetCell,
                timestamp: new Date()
            });
            
            // 保存目標單元格
            if (question.TargetCell) {
                targetCells.set(question.TargetCell, userInput);
            }
            
            // 設置下一個問題
            session.currentQuestion = question.NextID || '!end';
            
            // 更新群組會話數據
            if (isGroup) {
                const groupSession = this.groupSessions.get(originId);
                if (groupSession) {
                    groupSession.data.set(`answer_${questionId}`, userInput);
                }
            }
            
            // 如果是群組環境，返回需要私訊互動的結果
            if (isGroup) {
                const nextQuestion = await this.getNextQuestion(context, userInput);
                return {
                    success: true,
                    message: nextQuestion.message,
                    requiresPrivateMessage: true,
                    confirmation: `收到: ${userInput}`
                };
            }
            
            return await this.getNextQuestion(context, userInput);
            
        } catch (error) {
            console.error('❌ 處理用戶輸入失敗:', error.message);
            throw error;
        }
    }

    /**
     * 構建問題訊息
     * @param {Object} question - 問題數據
     * @param {string} sheetName - 工作表名稱
     * @returns {string} 格式化訊息
     */
    buildQuestionMessage(question, sheetName) {
        let message = `📋 ${sheetName} - ${question.QuestionID}: ${question.QuestionText}`;
        
        if (question.ValidationType === 'Option' && question.Options) {
            message += `\n💡 選項: ${question.Options}`;
        } else if (question.ValidationType === 'Image') {
            message += `\n📷 請上傳照片`;
        }
        
        return message;
    }

    /**
     * 完成會話並生成結果 - 使用 group-pm-group 流程
     * @param {Object} session - 用戶會話
     * @param {Object} context - 上下文
     * @returns {Promise<Object>} 完成訊息
     */
    async completeSession(session, context) {
        const { userId, sheetName, answers, targetCells, originId, isGroup, pushname } = session;
        
        // 生成結果 Excel - 存入 data/excel_results/
        const resultFile = await this.generateResultExcel(session, context);
        
        // 清理會話 - 必須立刻清理 Map 緩存
        this.userSessions.delete(userId);
        if (isGroup) {
            this.groupSessions.delete(originId);
        }
        
        console.log(`✅ ${isGroup ? '群組' : '私訊'}會話完成: ${userId} -> ${sheetName}`);
        
        // 如果是群組環境，返回需要群組回報的結果
        if (isGroup) {
            return {
                type: 'completed',
                message: `✅ 表格填寫完成！感謝您完成「${sheetName}」填表。`,
                resultFile: resultFile,
                answers: Array.from(answers.entries()),
                targetCells: Array.from(targetCells.entries()),
                requiresGroupReport: true,
                groupReportMessage: `✅ ${pushname} 的 Excel 填表已完成！結果文件: ${path.basename(resultFile)}`
            };
        }
        
        return {
            type: 'completed',
            message: `✅ 表格填寫完成！感謝您完成「${sheetName}」填表。`,
            resultFile: resultFile,
            answers: Array.from(answers.entries()),
            targetCells: Array.from(targetCells.entries())
        };
    }

    /**
     * 取消會話 - 中斷邏輯實現
     * @param {Object} session - 用戶會話
     */
    cancelSession(session) {
        const { userId, originId, isGroup } = session;
        
        // 立刻清理 Map 緩存
        this.userSessions.delete(userId);
        if (isGroup) {
            this.groupSessions.delete(originId);
        }
        
        console.log(`❌ ${isGroup ? '群組' : '私訊'}會話取消: ${userId}`);
    }

    /**
     * 生成結果 Excel 文件 - 毫秒級時間戳命名
     * @param {Object} session - 用戶會話
     * @param {Object} context - 上下文
     * @returns {Promise<string>} 文件路徑
     */
    async generateResultExcel(session, context) {
        try {
            const { sheetName, targetCells, pushname } = session;
            const timestamp = Date.now();
            const fileName = `${sheetName}_${pushname || 'user'}_${timestamp}.xlsx`;
            const filePath = this.resultsDir + fileName;
            
            // 創建新的工作簿
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(sheetName);
            
            // 寫入標題行
            worksheet.addRow(['項目', '內容', '填寫時間']);
            
            // 寫入數據
            targetCells.forEach((value, cell) => {
                worksheet.addRow([cell, value, new Date().toLocaleString()]);
            });
            
            // 保存文件
            await workbook.xlsx.writeFile(filePath);
            
            console.log(`💾 結果文件已保存: ${filePath}`);
            return filePath;
            
        } catch (error) {
            console.error('❌ 生成結果 Excel 失敗:', error.message);
            throw error;
        }
    }

    /**
     * 創建默認 Excel 模板 - 自癒功能
     */
    async createDefaultTemplate() {
        try {
            console.log('🔄 創建默認 Excel 模板...');
            
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('trial');
            
            // 添加標題行
            worksheet.addRow([
                'QuestionID', 'QuestionText', 'ValidationType', 'NextID', 'TargetCell', 'Options'
            ]);
            
            // 添加示例數據
            worksheet.addRow(['Q1', '請輸入您的姓名：', 'Text', 'Q2', 'A2', '']);
            worksheet.addRow(['Q2', '請輸入您的電話號碼：', 'Number', 'Q3', 'B2', '']);
            worksheet.addRow(['Q3', '請輸入出生日期：', 'Date', 'Q4', 'C2', '']);
            worksheet.addRow(['Q4', '請上傳身份證照片：', 'Image', '!end', 'D2', '']);
            
            // 保存模板
            await workbook.xlsx.writeFile(this.mapFile);
            
            console.log('✅ 默認 Excel 模板創建完成');
            
        } catch (error) {
            console.error('❌ 創建默認模板失敗:', error.message);
            throw error;
        }
    }

    /**
     * 獲取可用工作表列表
     * @returns {Array<string>} 工作表名稱列表
     */
    getAvailableSheets() {
        return this.availableSheets;
    }
}

module.exports = LogicEngine;