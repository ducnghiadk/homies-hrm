import readXlsxFile from 'read-excel-file/node'

const hbpPath = 'C:\\Users\\Admin\\Downloads\\-HBP---TRA-SUA-PHO-MAI-TUOI-HOMIES-2026-08-01-2026-08-31-1786026308196.xlsx'
const f429Path = 'C:\\Users\\Admin\\Downloads\\Bang-Cham-Cong--429---TRA-SUA-PHO-MAI-TUOI-HOMIES-1787144086588.xlsx'

async function parseAll() {
  console.log('=====================================================')
  console.log('--- 1. HBP: BẢNG LƯƠNG THEO CHU KỲ ---')
  console.log('=====================================================')
  const hbpRows = await readXlsxFile(hbpPath, { sheet: 'Lương theo chu kỳ' })
  for (let i = 0; i < hbpRows.length; i++) {
    const r = Array.from(hbpRows[i] || [])
    console.log(`[HBP Row ${i}] length=${r.length}:`, JSON.stringify(r))
  }

  console.log('\n=====================================================')
  console.log('--- 2. 429: BẢNG CHẤM CÔNG THEO GIỜ ---')
  console.log('=====================================================')
  const f429HourRows = await readXlsxFile(f429Path, { sheet: 'Bảng chấm công theo giờ' })
  for (let i = 0; i < f429HourRows.length; i++) {
    const r = Array.from(f429HourRows[i] || [])
    console.log(`[429 Hour Row ${i}] length=${r.length}:`, JSON.stringify(r.slice(0, 10)))
  }

  console.log('\n=====================================================')
  console.log('--- 3. 429: BẢNG CHẤM CÔNG (CÔNG/CA) ---')
  console.log('=====================================================')
  const f429CCRows = await readXlsxFile(f429Path, { sheet: 'Bảng Chấm Công' })
  for (let i = 0; i < f429CCRows.length; i++) {
    const r = Array.from(f429CCRows[i] || [])
    console.log(`[429 CC Row ${i}] length=${r.length}:`, JSON.stringify(r.slice(0, 10)))
  }
}

parseAll().catch(err => console.error(err))
