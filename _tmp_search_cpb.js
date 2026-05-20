const idx = JSON.parse(require('fs').readFileSync('./data/store/drawing_index.json', 'utf8'));

// 搜尋所有包含 MSA5014 嘅檔案
const matches = idx.files.filter(f => {
  const name = f.name.toUpperCase();
  return name.includes('MSA5014') || name.includes('MSA-5014');
});

console.log('=== CPB-MSA-5014 相關檔案: ' + matches.length + ' 個 ===');
for (const f of matches) {
  console.log('檔案: ' + f.name);
  console.log('  系統: ' + f.system);
  console.log('  物料: ' + (f.materials || []).join(', '));
  console.log('  POR: ' + f.por);
  console.log('  有TG: ' + f.hasTag);
  console.log('');
}

// 找出每檔案所在目錄嘅 TG
const path = require('path');
for (const f of matches) {
  const dir = path.dirname(f.path);
  console.log('目錄: ' + dir.slice(-80));
  const tgs = idx.files.filter(x => {
    const xd = path.dirname(x.path);
    return xd === dir && x.name.toUpperCase().includes('-TG-');
  });
  console.log('  TG 數量: ' + tgs.length);
  for (const tg of tgs) {
    console.log('  TG: ' + tg.name);
  }
  console.log('');
}
