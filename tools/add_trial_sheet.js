const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function addTrialSheet() {
    console.log('📊 正在為 Excel 邏輯地圖添加 trial 分頁...');
    
    const filePath = path.join(__dirname, 'robot_map.xlsx');
    
    try {
        // 檢查檔案是否存在
        if (!fs.existsSync(filePath)) {
            throw new Error(`Excel 檔案不存在: ${filePath}`);
        }

        // 讀取現有工作簿
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        // 檢查是否已存在 trial 分頁
        if (workbook.getWorksheet('trial')) {
            console.log('⚠️ trial 分頁已存在，將重新創建');
            workbook.removeWorksheet('trial');
        }
        
        // 添加 trial 分頁
        const trialSheet = workbook.addWorksheet('trial');
        
        // 添加標題行
        trialSheet.addRow(['ID', 'Question', 'InputType', 'Options', 'NextID_OK', 'NextID_No', 'TargetCell']);
        
        // 添加測試數據
        trialSheet.addRow([1, '測試啟動。請問目前工地位置？', 'Text', '', 2, '', 'A2']);
        trialSheet.addRow([2, '現場天氣 OK 嗎？', 'Option', 'OK, 有雨', 3, 3, 'B2']);
        trialSheet.addRow([3, '測試完成，是否提交？', 'Option', '是, 取消', 'End', 'Stop', 'C2']);
        
        // 設置列寬
        trialSheet.columns = [
            { key: 'ID', width: 8 },
            { key: 'Question', width: 35 },
            { key: 'InputType', width: 12 },
            { key: 'Options', width: 15 },
            { key: 'NextID_OK', width: 10 },
            { key: 'NextID_No', width: 10 },
            { key: 'TargetCell', width: 12 }
        ];
        
        // 保存檔案
        await workbook.xlsx.writeFile(filePath);
        
        console.log(`✅ trial 分頁已成功添加到: ${filePath}`);
        console.log('📋 trial 分頁內容:');
        console.log('   ID 1: 測試啟動。請問目前工地位置？ (Text) -> A2');
        console.log('   ID 2: 現場天氣 OK 嗎？ (Option: OK, 有雨) -> B2');
        console.log('   ID 3: 測試完成，是否提交？ (Option: 是, 取消) -> C2');
        
    } catch (error) {
        console.log('❌ 添加 trial 分頁失敗:', error.message);
        throw error;
    }
}

addTrialSheet().catch(console.error);