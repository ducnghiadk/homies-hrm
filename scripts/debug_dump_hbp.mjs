import readXlsxFile from 'read-excel-file/node'
import path from 'path'

const DOWNLOADS_DIR = 'C:\\Users\\Admin\\Downloads'
const HBP_FILE = '-HBP---TRA-SUA-PHO-MAI-TUOI-HOMIES-2026-08-01-2026-08-31-1786026308196.xlsx'

async function dumpHBPFull() {
  const filePath = path.join(DOWNLOADS_DIR, HBP_FILE)
  const sheets = await readXlsxFile(filePath, { getSheets: true })
  
  const chuKy = sheets.find(s => (s.name || s.sheet) === 'Lương theo chu kỳ')
  if (chuKy) {
    console.log('===================================================================')
    console.log('--- SHEET: LƯƠNG THEO CHU KỲ (HBP THÁNG 8/2026) ---')
    console.log('===================================================================')
    chuKy.data.forEach((row, i) => {
      console.log(`Row ${i}:`, JSON.stringify(row))
    })
  }

  const theoCa = sheets.find(s => (s.name || s.sheet) === 'Lương theo ca')
  if (theoCa) {
    console.log('\n===================================================================')
    console.log(`--- SHEET: LƯƠNG THEO CA (HBP THÁNG 8/2026) (${theoCa.data.length} rows) ---`)
    console.log('===================================================================')
    // Tổng hợp số giờ và số ca theo từng nhân viên trong sheet này
    const empHours = {}
    const empShifts = {}
    for (let i = 1; i < theoCa.data.length; i++) {
      const r = theoCa.data[i]
      const ngay = r[0]
      const tenNV = r[2]
      const maNV = r[3]
      const ca = r[11]
      const gioLam = parseFloat(r[13]) || 0 // kiểm tra cột giờ làm
      const key = `${tenNV} (${maNV})`
      if (!empHours[key]) {
        empHours[key] = { totalHours: 0, totalShifts: 0, rows: [] }
      }
      empHours[key].totalHours += gioLam
      empHours[key].totalShifts += 1
      empHours[key].rows.push({ ngay, ca, gioLam, row: r })
    }
    
    console.log('\nTỔNG HỢP TỪ SHEET "LƯƠNG THEO CA":')
    for (const [emp, data] of Object.entries(empHours)) {
      console.log(`- ${emp}: ${data.totalShifts} ca | ${data.totalHours} giờ`)
    }
  }
}

dumpHBPFull().catch(err => console.error(err))
