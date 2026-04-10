const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function createExcelMap() {
    console.log('📊 正在創建 Excel 邏輯地圖...');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('邏輯地圖');
    
    // 添加標題行
    worksheet.addRow(['ID', 'Question', 'InputType', 'Options', 'NextID_OK', 'NextID_No', 'TargetCell']);
    
    // 添加數據行
    worksheet.addRow([1, '請問今日去邊個工地？', 'Option', '啟德,屯門,元朗', 2, 3, 'B2']);
    worksheet.addRow([2, '請問今日天氣如何？', 'Option', '晴天,陰天,雨天', 4, 5, 'B3']);
    worksheet.addRow([3, '是否跳過天氣問題？', 'Option', '是,否', 4, 6, 'B3']);
    worksheet.addRow([4, '請上傳工地照片', 'Photo', '', 5, 6, 'C2']);
    worksheet.addRow([5, '請描述今日工作內容', 'Text', '', 6, 6, 'D2']);
    worksheet.addRow([6, '完成填表，是否確認提交？', 'Option', '確認,取消', 7, 1, 'E2']);
    worksheet.addRow([7, '表格已提交，感謝您的填寫！', 'Text', '', '', '', 'F2']);
    
    // 設置列寬
    worksheet.columns = [
        { key: 'ID', width: 8 },
        { key: 'Question', width: 30 },
        { key: 'InputType', width: 12 },
        { key: 'Options', width: 20 },
        { key: 'NextID_OK', width: 10 },
        { key: 'NextID_No', width: 10 },
        { key: 'TargetCell', width: 12 }
    ];
    
    // 保存檔案
    const filePath = path.join(__dirname, 'robot_map.xlsx');
    await workbook.xlsx.writeFile(filePath);
    
    console.log(`✅ Excel 邏輯地圖已創建: ${filePath}`);
}

createExcelMap().catch(console.error);