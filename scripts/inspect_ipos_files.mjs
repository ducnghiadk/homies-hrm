import readXlsxFile from 'read-excel-file/node'
import fs from 'fs'
import path from 'path'

const downloadsDir = 'C:\\Users\\Admin\\Downloads'

async function inspectSchedules() {
  const files = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.xlsx') && (f.includes('Lich') || f.includes('Cham-Cong') || f.includes('HBP') || f.includes('429')))
  
  for (const f of files) {
    const fullPath = path.join(downloadsDir, f)
    console.log(`\n========================================`)
    console.log(`FILE: ${f}`)
    try {
      const sheets = await readXlsxFile(fullPath, { getSheets: true })
      for (const s of sheets) {
        const sheetName = s.name || s.sheet
        const rows = s.data || (await readXlsxFile(fullPath, { sheet: sheetName }))
        console.log(`Sheet "${sheetName}": ${rows.length} rows`)
        if (rows.length > 0) {
          console.log(`  Row 0:`, JSON.stringify(rows[0].slice(0, 8)))
        }
        if (rows.length > 1 && rows[1]) {
          console.log(`  Row 1 (first 3 cols):`, JSON.stringify(rows[1].slice(0, 3)))
        }
      }
    } catch (e) {
      console.log(`Error reading ${f}: ${e.message}`)
    }
  }
}

inspectSchedules().catch(console.error)




