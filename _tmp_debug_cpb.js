const path = require('path');
const drawingSearch = require('./skills/drawingSearch');
const { dataStore } = require('./src/core/dataStore');

const tgFolder = 'V:/POR/01 POR ISAAC/POR2219 HGRH-CPB0101-FST6161 前装铁件加工图 (For CPB_5F~6F) 送工地/F6161 HGRH-CPB0101-FST6161 前装铁件加工图 (For CPB_5F~6F) 送工地';

drawingSearch.loadIndex();
const cache = dataStore.get('tg_content_cache', {});
const fs = require('fs');

// 檢查目錄存在
console.log('目錄存在:', fs.existsSync(tgFolder));

// 列出所有檔案
const allFiles = fs.readdirSync(tgFolder);
console.log('檔案總數:', allFiles.length);
const tgFiles = allFiles.filter(f => f.toUpperCase().includes('-TG-'));
console.log('TG 檔案:', tgFiles.join(', '));

// 檢查 TG PDF 快取
const tgPdf = tgFiles.find(f => f.toLowerCase().endsWith('.pdf'));
if (tgPdf) {
  const tgPath = path.join(tgFolder, tgPdf);
  const c = cache[tgPath];
  console.log('\nTG PDF 快取狀態:');
  if (c) {
    console.log('  drawingNumbers:', (c.drawingNumbers || []).length);
    console.log('  有 text:', (c.text || '').length > 0);
    console.log('  有 ocr:', (c.ocrText || '').length > 0);
    console.log('  含有 MSA5014:', c.drawingNumbers ? c.drawingNumbers.some(n => n.includes('MSA5014') || n.includes('MSA-5014')) : false);
    if (c.drawingNumbers && c.drawingNumbers.length > 0) {
      console.log('  MSA 開頭:', c.drawingNumbers.filter(n => n.startsWith('MSA')).join(', '));
      console.log('  全部 numbers (前20):', c.drawingNumbers.slice(0, 20).join(', '));
    }
  } else {
    console.log('  ❌ 無快取記錄');
  }

  // 測試掃描
  async function test() {
    const tgPaths = [tgPath];
    const nums = ['MSA5014'];
    console.log('\n=== scanTgFilesForDrawing ===');
    console.log('搜尋:', nums.join(', '));
    const results = await drawingSearch.scanTgFilesForDrawing(tgPaths, 'MSA5014', 'CPB', nums);
    console.log('結果數量:', results.length);
    for (const r of results) {
      console.log('  ' + r.relevance + ' | ' + r.name + ' | ' + (r.matchedNumbers || []).join(','));
    }

    // 試 extractTextFromPdf
    console.log('\n=== extractTextFromPdf ===');
    const extResult = await drawingSearch.extractTextFromPdf(tgPath);
    console.log('有文字:', (extResult.text || '').trim().length > 0);
    console.log('numbers:', (extResult.numbers || []).length);
    if (extResult.numbers.length > 0) {
      console.log('MSA numbers:', extResult.numbers.filter(n => n.startsWith('MSA')).join(', '));
    }
  }
  test();
}
