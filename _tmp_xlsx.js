const path = require('path');
const xlsxPath = `V:\\POR\\01 POR ISAAC\\（欠）POR1822 HGRH-AFB0101-FAC6554 铝板加工图 (For AFB) 送工地_(华顶铝板厂)\\F6554 HGRH-AFB0101-FAC6554 铝板加工图 (For AFB) 送工地_(华顶铝板厂)\\HGRH-AFB0101-FAC6554铝板加工图(FORAFB)送工地_(华顶铝板厂).xlsx`;

const fs = require('fs');
console.log('Excel exists:', fs.existsSync(xlsxPath));
if (!fs.existsSync(xlsxPath)) {
  // Try without the suffix
  const dir = `V:\\POR\\01 POR ISAAC\\（欠）POR1822 HGRH-AFB0101-FAC6554 铝板加工图 (For AFB) 送工地_(华顶铝板厂)\\F6554 HGRH-AFB0101-FAC6554 铝板加工图 (For AFB) 送工地_(华顶铝板厂)`;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
  console.log('XLSX files:', files);
  process.exit(0);
}

const ExcelJS = require('exceljs');
async function readXlsx() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  for (const ws of wb.worksheets) {
    console.log('\n=== Sheet:', ws.name, '===');
    let count = 0;
    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      const vals = row.values;
      const text = vals.filter(v => v !== undefined && v !== null).join(' | ');
      if (text.trim()) {
        console.log(`R${rowNum}: ${text}`);
        count++;
      }
    });
    console.log(`(共 ${count} 行)`);
  }
}
readXlsx();
