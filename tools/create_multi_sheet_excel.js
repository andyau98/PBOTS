const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function createMultiSheetExcel() {
    console.log('📊 正在創建多分頁 Excel 邏輯地圖...');
    
    const workbook = new ExcelJS.Workbook();
    
    // 工作表 1: 工地巡查
    const siteInspectionSheet = workbook.addWorksheet('工地巡查');
    siteInspectionSheet.addRow(['ID', 'Question', 'InputType', 'Options', 'NextID_OK', 'NextID_No', 'TargetCell']);
    siteInspectionSheet.addRow([1, '請問今日去邊個工地？', 'Option', '啟德,屯門,元朗', 2, 3, 'B2']);
    siteInspectionSheet.addRow([2, '請問今日天氣如何？', 'Option', '晴天,陰天,雨天', 4, 5, 'B3']);
    siteInspectionSheet.addRow([3, '是否跳過天氣問題？', 'Option', '是,否', 4, 6, 'B3']);
    siteInspectionSheet.addRow([4, '請上傳工地照片', 'Photo', '', 5, 6, 'C2']);
    siteInspectionSheet.addRow([5, '請描述今日工作內容', 'Text', '', 6, 6, 'D2']);
    siteInspectionSheet.addRow([6, '完成填表，是否確認提交？', 'Option', '確認,取消', 7, 1, 'E2']);
    siteInspectionSheet.addRow([7, '表格已提交，感謝您的填寫！', 'Text', '', '', '', 'F2']);
    
    // 工作表 2: 報銷入數
    const expenseSheet = workbook.addWorksheet('報銷入數');
    expenseSheet.addRow(['ID', 'Question', 'InputType', 'Options', 'NextID_OK', 'NextID_No', 'TargetCell']);
    expenseSheet.addRow([1, '請問報銷項目是什麼？', 'Option', '交通費,餐費,材料費,其他', 2, 3, 'B2']);
    expenseSheet.addRow([2, '請問報銷金額是多少？', 'Text', '', 3, 4, 'B3']);
    expenseSheet.addRow([3, '請上傳收據照片', 'Photo', '', 4, 5, 'C2']);
    expenseSheet.addRow([4, '請問付款方式？', 'Option', '現金,信用卡,轉賬', 5, 6, 'B4']);
    expenseSheet.addRow([5, '請描述報銷用途', 'Text', '', 6, 6, 'D2']);
    expenseSheet.addRow([6, '完成報銷申請，是否確認提交？', 'Option', '確認,取消', 7, 1, 'E2']);
    expenseSheet.addRow([7, '報銷申請已提交，感謝您的填寫！', 'Text', '', '', '', 'F2']);
    
    // 設置列寬
    const columnWidths = [
        { key: 'ID', width: 8 },
        { key: 'Question', width: 30 },
        { key: 'InputType', width: 12 },
        { key: 'Options', width: 20 },
        { key: 'NextID_OK', width: 10 },
        { key: 'NextID_No', width: 10 },
        { key: 'TargetCell', width: 12 }
    ];
    
    siteInspectionSheet.columns = columnWidths;
    expenseSheet.columns = columnWidths;
    
    // 保存檔案
    const filePath = path.join(__dirname, 'robot_map.xlsx');
    await workbook.xlsx.writeFile(filePath);
    
    console.log(`✅ 多分頁 Excel 邏輯地圖已創建: ${filePath}`);
    console.log(`📋 包含工作表: 工地巡查, 報銷入數`);
}

createMultiSheetExcel().catch(console.error);