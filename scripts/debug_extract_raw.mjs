import readXlsxFile from 'read-excel-file/node'
import path from 'path'

const DOWNLOADS_DIR = 'C:\\Users\\Admin\\Downloads'
const HBP_FILE = '-HBP---TRA-SUA-PHO-MAI-TUOI-HOMIES-2026-08-01-2026-08-31-1786026308196.xlsx'
const FILE_429 = 'Bang-Cham-Cong--429---TRA-SUA-PHO-MAI-TUOI-HOMIES-1787144086588.xlsx'

async function run() {
  console.log('===============================================================')
  console.log('PHASE 1: TRÍCH XUẤT TOÀN BỘ SỐ LIỆU TỪ 2 FILE EXCEL GỐC IPOS')
  console.log('===============================================================')

  // 1. Đọc HBP
  const hbpSheets = await readXlsxFile(path.join(DOWNLOADS_DIR, HBP_FILE), { getSheets: true })
  console.log('\n>>> HBP SHEETS:', hbpSheets.map(s => s.name || s.sheet))

  for (const sheet of hbpSheets) {
    const sName = sheet.name || sheet.sheet
    console.log(`\n--- HBP Sheet: [${sName}] (${sheet.data.length} rows) ---`)
    // In 10 dòng đầu
    for (let i = 0; i < Math.min(10, sheet.data.length); i++) {
      console.log(`Row ${i}:`, JSON.stringify(sheet.data[i]))
    }
  }

  // 2. Đọc 429
  const f429Sheets = await readXlsxFile(path.join(DOWNLOADS_DIR, FILE_429), { getSheets: true })
  console.log('\n>>> 429 SHEETS:', f429Sheets.map(s => s.name || s.sheet))

  for (const sheet of f429Sheets) {
    const sName = sheet.name || sheet.sheet
    console.log(`\n--- 429 Sheet: [${sName}] (${sheet.data.length} rows) ---`)
    for (let i = 0; i < Math.min(10, sheet.data.length); i++) {
      console.log(`Row ${i}:`, JSON.stringify(sheet.data[i]))
    }
  }
}

run().catch(err => console.error(err))
