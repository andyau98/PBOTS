const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const PathManager = require('../configs/path_manager');

class LogicEngine {
    constructor(config = null, securityManager = null) {
        this.mapFile = PathManager.TOOLS + '/robot_map.xlsx';
        this.workbook = null;
        this.availableSheets = [];
        this.userSessions = new Map(); // 用戶會話緩存
        this.groupSessions = new Map(); // 群組會話緩存 (chatId -> userId)
        this.config = config;
        this.securityManager = securityManager;
    }

    // 檢查用戶權限
    checkPermission(userId, chatId = null, permissionLevel = 'basic') {
        if (this.securityManager) {
            return this.securityManager.checkPermission(userId, chatId, permissionLevel);
        }
        // 如果沒有 SecurityManager，預設允許
        return true;
    }

    // 加載 Excel 工作簿
    async loadWorkbook() {
        try {
            console.log('📊 正在加載 Excel 邏輯地圖...');
            
            if (!fs.existsSync(this.mapFile)) {
                throw new Error(`邏輯地圖檔案不存在: ${this.mapFile}`);
            }

            this.workbook = new ExcelJS.Workbook();
            await this.workbook.xlsx.readFile(this.mapFile);
            
            // 獲取所有工作表名稱
            this.availableSheets = this.workbook.worksheets.map(ws => ws.name);
            
            console.log(`✅ Excel 邏輯地圖加載完成，可用工作表: ${this.availableSheets.join(', ')}`);
            return this.workbook;
            
        } catch (error) {
            console.log('❌ 加載 Excel 邏輯地圖失敗:', error.message);
            throw error;
        }
    }

    // 加載指定工作表
    async loadSheet(sheetName) {
        try {
            // 確保工作簿已加載
            if (!this.workbook) {
                await this.loadWorkbook();
            }

            // 檢查工作表是否存在
            const worksheet = this.workbook.getWorksheet(sheetName);
            if (!worksheet) {
                throw new Error(`工作表 "${sheetName}" 不存在`);
            }

            console.log(`📋 正在加載工作表: ${sheetName}`);
            
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

                // 確保 ID 存在
                if (questionData.ID) {
                    // 處理選項字串轉陣列
                    if (questionData.Options) {
                        questionData.Options = questionData.Options.split(',').map(opt => opt.trim());
                    }
                    
                    logicTree.set(questionData.ID.toString(), questionData);
                }
            });

            console.log(`✅ 工作表 "${sheetName}" 加載完成，共 ${logicTree.size} 個問題`);
            return logicTree;
            
        } catch (error) {
            console.log(`❌ 加載工作表 "${sheetName}" 失敗:`, error.message);
            throw error;
        }
    }

    // 獲取可用工作表列表
    getAvailableSheets() {
        return this.availableSheets;
    }

    // 開始新的填表流程（支援群組鎖定）
    async startForm(userId, sheetName, chatId = null) {
        try {
            // 加載指定工作表
            const logicTree = await this.loadSheet(sheetName);
            
            // 初始化用戶會話
            this.userSessions.set(userId, {
                sheetName: sheetName,
                logicTree: logicTree,
                answers: new Map(),
                currentQuestion: '1', // 從第一個問題開始
                startTime: new Date(),
                targetCells: new Map(), // 目標單元格映射
                chatId: chatId // 群組 ID（如果有的話）
            });

            // 如果是在群組中啟動，設置群組鎖定
            if (chatId) {
                this.groupSessions.set(chatId, userId);
                console.log(`🚀 群組 ${chatId} 鎖定用戶 ${userId} 開始填表流程: ${sheetName}`);
            } else {
                console.log(`🚀 用戶 ${userId} 開始填表流程: ${sheetName}`);
            }
            
            // 獲取第一個問題
            return await this.getNextQuestion(userId, null, null);
            
        } catch (error) {
            console.log(`❌ 啟動填表流程失敗:`, error.message);
            throw error;
        }
    }

    // 檢查群組會話鎖定
    isGroupSessionLocked(chatId, userId) {
        const lockedUserId = this.groupSessions.get(chatId);
        if (lockedUserId && lockedUserId !== userId) {
            console.log(`⛔ 群組 ${chatId} 已鎖定給用戶 ${lockedUserId}，忽略用戶 ${userId} 的訊息`);
            return true;
        }
        return false;
    }

    // 檢查用戶是否在會話中
    isUserInSession(userId, chatId = null) {
        // 檢查用戶會話
        if (this.userSessions.has(userId)) {
            const userSession = this.userSessions.get(userId);
            
            // 如果在群組中，檢查群組鎖定
            if (chatId && userSession.chatId !== chatId) {
                return false;
            }
            
            return true;
        }
        return false;
    }

    // 獲取下一個問題（支援群組回覆）
    async getNextQuestion(userId, currentID, userInput, pushname = null) {
        try {
            const userSession = this.userSessions.get(userId);
            if (!userSession) {
                throw new Error(`找不到用戶會話: ${userId}`);
            }

            const { logicTree, sheetName, chatId } = userSession;
            
            // 處理用戶輸入
            if (userInput && currentID) {
                const currentQuestion = logicTree.get(currentID.toString());
                if (!currentQuestion) {
                    throw new Error(`在工作表 "${sheetName}" 中找不到問題 ID: ${currentID}`);
                }

                // 保存用戶回答
                userSession.answers.set(currentID, {
                    question: currentQuestion.Question,
                    answer: userInput,
                    targetCell: currentQuestion.TargetCell,
                    timestamp: new Date()
                });

                // 保存目標單元格映射
                if (currentQuestion.TargetCell) {
                    userSession.targetCells.set(currentQuestion.TargetCell, userInput);
                }

                // 決定下一個問題 ID（修復死循環邏輯）
                let nextID = null;
                
                // 處理特殊指令
                if (userInput.toLowerCase() === '!cancel' || userInput.toLowerCase() === '取消') {
                    // 取消流程
                    this.userSessions.delete(userId);
                    if (chatId) {
                        this.groupSessions.delete(chatId);
                    }
                    return {
                        type: 'cancelled',
                        message: '❌ 填表流程已取消'
                    };
                } else if (userInput.toLowerCase() === 'ok' || userInput.toLowerCase() === '確認') {
                    nextID = currentQuestion.NextID_OK;
                } else if (userInput.toLowerCase() === 'no' || userInput.toLowerCase() === '跳過') {
                    nextID = currentQuestion.NextID_No;
                } else if (currentQuestion.InputType === 'Option' && currentQuestion.Options) {
                    // 檢查是否為有效選項
                    const normalizedInput = userInput.trim().toLowerCase();
                    const isValidOption = currentQuestion.Options.some(option => 
                        option.toLowerCase() === normalizedInput
                    );
                    
                    if (isValidOption) {
                        nextID = currentQuestion.NextID_OK;
                    } else {
                        nextID = currentQuestion.NextID_No;
                    }
                } else {
                    // 對於 Text 和 Photo 類型，直接跳轉到 OK
                    nextID = currentQuestion.NextID_OK;
                }

                userSession.currentQuestion = nextID ? nextID.toString() : null;
            }

            // 獲取當前問題
            const currentQuestionID = userSession.currentQuestion;
            if (!currentQuestionID) {
                // 會話結束
                const result = await this.generateResultExcel(userId);
                this.userSessions.delete(userId);
                if (chatId) {
                    this.groupSessions.delete(chatId);
                }
                return {
                    type: 'completed',
                    message: `表格填寫完成！感謝您完成「${sheetName}」填表。`,
                    resultFile: result.filePath,
                    answers: Array.from(userSession.answers.entries()),
                    targetCells: Array.from(userSession.targetCells.entries())
                };
            }

            const question = logicTree.get(currentQuestionID);
            if (!question) {
                throw new Error(`在工作表 "${sheetName}" 中找不到問題 ID: ${currentQuestionID}`);
            }

            // 構建問題訊息（支援群組 @ 回覆）
            let message = `📋 ${sheetName} - 問題 ${question.ID}: ${question.Question}`;
            
            if (question.InputType === 'Option' && question.Options && question.Options.length > 0) {
                message += `\n💡 選項: ${question.Options.join(', ')}`;
            }
            
            if (question.InputType === 'Photo') {
                message += `\n📷 請上傳照片`;
            }

            // 如果是群組會話，添加 @ 回覆
            if (chatId && pushname) {
                message = `@${pushname} ${message}`;
            }

            // 如果是回答後的確認回覆
            if (userInput && pushname) {
                const confirmationMessage = `@${pushname} 收到: ${userInput}`;
                return {
                    type: 'question_with_confirmation',
                    sheetName: sheetName,
                    questionId: question.ID,
                    message: message,
                    confirmation: confirmationMessage,
                    inputType: question.InputType,
                    options: question.Options || [],
                    targetCell: question.TargetCell
                };
            }

            return {
                type: 'question',
                sheetName: sheetName,
                questionId: question.ID,
                message: message,
                inputType: question.InputType,
                options: question.Options || [],
                targetCell: question.TargetCell
            };
            
        } catch (error) {
            console.log('❌ 獲取下一個問題失敗:', error.message);
            throw error;
        }
    }

    // 生成結果 Excel 檔案
    async generateResultExcel(userId) {
        try {
            const userSession = this.userSessions.get(userId);
            if (!userSession) {
                throw new Error(`找不到用戶會話: ${userId}`);
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(userSession.sheetName + '結果');

            // 添加標題行
            worksheet.addRow(['問題', '回答', '目標單元格', '時間']);

            // 添加數據行
            userSession.answers.forEach((answer, questionId) => {
                worksheet.addRow([
                    answer.question,
                    answer.answer,
                    answer.targetCell,
                    answer.timestamp.toLocaleString()
                ]);
            });

            // 確保輸出目錄存在
            const outputDir = PathManager.DATA + '/excel_results';
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // 生成檔案名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `${userSession.sheetName}_${userId.replace('@c.us', '')}_${timestamp}.xlsx`;
            const filePath = path.join(outputDir, fileName);

            // 保存檔案
            await workbook.xlsx.writeFile(filePath);
            
            console.log(`✅ 結果 Excel 檔案已生成: ${filePath}`);
            
            return {
                filePath: filePath,
                answers: Array.from(userSession.answers.entries()),
                targetCells: Array.from(userSession.targetCells.entries())
            };
            
        } catch (error) {
            console.log('❌ 生成結果 Excel 失敗:', error.message);
            throw error;
        }
    }

    // 獲取用戶會話狀態
    getUserSession(userId) {
        return this.userSessions.get(userId);
    }

    // 重置用戶會話
    resetUserSession(userId) {
        this.userSessions.delete(userId);
        console.log(`🔄 已重置用戶 ${userId} 的會話`);
    }

    // 檢查工作表是否存在
    async checkSheetExists(sheetName) {
        try {
            if (!this.workbook) {
                await this.loadWorkbook();
            }
            
            const worksheet = this.workbook.getWorksheet(sheetName);
            return !!worksheet;
        } catch (error) {
            return false;
        }
    }
}

module.exports = LogicEngine;