const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function fixTrialSheet() {
    console.log('🔧 正在修復 trial 分頁的 NextID 問題...');
    
    const filePath = path.join(__dirname, 'robot_map.xlsx');
    
    try {
        // 讀取現有工作簿
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        // 獲取 trial 分頁
        const trialSheet = workbook.getWorksheet('trial');
        if (!trialSheet) {
            throw new Error('trial 分頁不存在');
        }
        
        // 修復 ID 3 的 NextID_OK 和 NextID_No
        // 將 "End" 改為空字串（表示結束流程）
        // 將 "Stop" 改為空字串
        
        // 找到 ID 3 的行
        let rowToFix = null;
        trialSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // 跳過標題行
                const idCell = row.getCell(1);
                if (idCell.value === 3) {
                    rowToFix = row;
                }
            }
        });
        
        if (rowToFix) {
            // 修復 NextID_OK (第5列)
            const nextIdOkCell = rowToFix.getCell(5);
            if (nextIdOkCell.value === 'End') {
                nextIdOkCell.value = '';
                console.log('✅ 修復 ID 3 的 NextID_OK: "End" -> ""');
            }
            
            // 修復 NextID_No (第6列)
            const nextIdNoCell = rowToFix.getCell(6);
            if (nextIdNoCell.value === 'Stop') {
                nextIdNoCell.value = '';
                console.log('✅ 修復 ID 3 的 NextID_No: "Stop" -> ""');
            }
        }
        
        // 保存檔案
        await workbook.xlsx.writeFile(filePath);
        
        console.log(`✅ trial 分頁修復完成: ${filePath}`);
        
    } catch (error) {
        console.log('❌ 修復 trial 分頁失敗:', error.message);
        throw error;
    }
}

fixTrialSheet().catch(console.error);