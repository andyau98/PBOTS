const fs = require('fs');
const path = require('path');

const tgFolder = `V:\\POR\\01 POR ISAAC\\（欠）POR1822 HGRH-AFB0101-FAC6554 铝板加工图 (For AFB) 送工地_(华顶铝板厂)\\F6554 HGRH-AFB0101-FAC6554 铝板加工图 (For AFB) 送工地_(华顶铝板厂)`;

console.log('Folder:', tgFolder);
console.log('Exists:', fs.existsSync(tgFolder));

if (fs.existsSync(tgFolder)) {
  const files = fs.readdirSync(tgFolder);
  console.log('\n檔案清單:');
  for (const f of files) {
    const fullPath = path.join(tgFolder, f);
    const stat = fs.statSync(fullPath);
    const sizeKB = (stat.size / 1024).toFixed(1);
    const ext = path.extname(f).toLowerCase();
    console.log(`  ${ext === '.dwg' ? '📐' : ext === '.dxf' ? '📄' : '📄'} ${f} (${sizeKB} KB)`);
  }

  // 列出所有 CAD 副檔名
  const cadFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ext === '.dwg' || ext === '.dxf';
  });
  console.log(`\nCAD 檔案: ${cadFiles.length} 個`);
  cadFiles.forEach(f => console.log(`  ${f}`));
}
