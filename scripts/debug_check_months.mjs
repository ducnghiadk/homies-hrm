import readXlsxFile from 'read-excel-file/node'
import path from 'path'
import fs from 'fs'

const DOWNLOADS_DIR = 'C:\\Users\\Admin\\Downloads'

async function checkDateRanges() {
  const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.includes('TRA-SUA') && f.endsWith('.xlsx'))
  console.log('Found TRA-SUA files in Downloads:', files)

  for (const file of files) {
    const filePath = path.join(DOWNLOADS_DIR, file)
    console.log(`\n===============================================================`)
    console.log(`FILE: ${file}`)
    console.log(`===============================================================`)
    const sheets = await readXlsxFile(filePath, { getSheets: true })
    for (const sheet of sheets) {
      const sName = sheet.name || sheet.sheet
      const rows = sheet.data
      console.log(`\nSheet: [${sName}] (${rows.length} rows)`)
      // Tìm xem có cell nào chứa thông tin tiêu đề tháng, ngày bắt đầu - kết thúc
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const rowStr = rows[i].filter(c => c !== null).join(' | ')
        if (rowStr) console.log(`  Header Row ${i}: ${rowStr}`)
      }
      // Tìm các ngày xuất hiện trong cột ngày (thường là col 0)
      const dates = new Set()
      const months = new Set()
      for (let i = 1; i < rows.length; i++) {
        const val = rows[i]?.[0]
        if (val) {
          const s = String(val).trim()
          const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/) || s.match(/(\d{4})-(\d{2})-(\d{2})/)
          if (m) {
            dates.add(s)
            months.add(m[2] ? `${m[2]}/${m[3] || m[1]}` : s)
          }
        }
      }
      if (dates.size > 0) {
        console.log(`  -> Số dòng có ngày: ${dates.size} ngày khác nhau`)
        console.log(`  -> Các tháng có trong dữ liệu:`, Array.from(months))
      }
    }
  }
}

checkDateRanges().catch(err => console.error(err))
