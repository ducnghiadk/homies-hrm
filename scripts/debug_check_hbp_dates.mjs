import readXlsxFile from 'read-excel-file/node'
import path from 'path'

const DOWNLOADS_DIR = 'C:\\Users\\Admin\\Downloads'
const HBP_FILE = '-HBP---TRA-SUA-PHO-MAI-TUOI-HOMIES-2026-08-01-2026-08-31-1786026308196.xlsx'

async function checkHBPDates() {
  const filePath = path.join(DOWNLOADS_DIR, HBP_FILE)
  const sheets = await readXlsxFile(filePath, { getSheets: true })
  
  const theoCa = sheets.find(s => (s.name || s.sheet) === 'Lương theo ca')
  console.log('--- SHEET LƯƠNG THEO CA: DANH SÁCH TẤT CẢ CÁC CA ---')
  for (let i = 1; i < theoCa.data.length; i++) {
    const r = theoCa.data[i]
    console.log(`[${i}] Ngày: ${r[0]} | NV: ${r[2]} (${r[3]}) | Ca: ${r[11]} | Giờ: ${r[12]} | Số giờ: ${r[13]} | Tiền lương: ${r[18]}`)
  }
}

checkHBPDates().catch(err => console.error(err))
