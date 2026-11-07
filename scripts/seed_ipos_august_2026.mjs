/**
 * SEED IPOS AUGUST 2026 → Supabase lich_phan_ca
 * ================================================
 * 1. Thêm 2 nhân viên mới: Tấn Hiếu + Nguyễn Mạnh Duy
 * 2. Parse HBP (Lương theo ca) + 429 (Danh sách theo lịch làm việc)
 * 3. Upsert records vào lich_phan_ca với trang_thai = 'da_xep'
 */

import readXlsxFile from 'read-excel-file/node'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { randomUUID } from 'crypto'
const uuidv4 = randomUUID

const SUPABASE_URL = 'https://ncxwnldazjtlgipdsuws.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeHdubGRhemp0bGdpcGRzdXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjE0MzEsImV4cCI6MjA5NTg5NzQzMX0.l60xIsxuczlkrdC4uIk-tM25khgJ5-AtdcWP1eQPo4I'

const DOWNLOADS_DIR = 'C:\\Users\\Admin\\Downloads'
const HBP_FILE = '-HBP---TRA-SUA-PHO-MAI-TUOI-HOMIES-2026-08-01-2026-08-31-1786026308196.xlsx'
const FILE_429 = 'Bang-Cham-Cong--429---TRA-SUA-PHO-MAI-TUOI-HOMIES-1787144086588.xlsx'

const STORE_HBP = 'c0000000-0000-0000-0000-000000000001'
const STORE_429 = 'c0000000-0000-0000-0000-000000000002'

const SHIFT_SANG = 'd0000000-0000-0000-0000-000000000001'
const SHIFT_CHIEU = 'd0000000-0000-0000-0000-000000000002'
const SHIFT_TOI = 'd0000000-0000-0000-0000-000000000004'

const MA_NV_MAP = {
  'NV0028': 'f747f06f-9e95-406e-a5b5-0f6571dbfaa4',
  'BH-9852': 'e04b5c70-97e2-4061-8bef-0fae5563a066',
  'NV0013': '39cb7ca9-83eb-4023-b45d-6d4e24219dc3',
  'NV0016': '10a4897f-9936-41a7-804f-8a4556eaaf0c',
  'NV0017': 'd8b8ecd5-1e74-415b-a739-2fa6bbd81284',
  'NV0020': '2f3acef5-118f-490b-8530-d86aa164b90a',
  'NV0030': 'c3c55940-87ce-4806-af07-2defcca16eea',
  'NV0033': 'af938b43-f835-4d45-8e60-785a76d9b599',
  'NV0027': '9392ab72-eacc-4211-a0b3-a183c0db75d5',
  'NV0008': 'c9ddc22c-de07-4573-9423-5da69ef200c0',
  'NV0031': 'be45b9a4-8ae6-460a-9834-744675904fc6',
  'NV0034': '90f9a3db-22e9-49c7-bf9f-42f3390a8e60',
  // NV0024 = Tấn Hiếu (sẽ được cập nhật sau addNewEmployees)
  'NV0024': '5a0a1a7e-3db3-4e1f-9124-f62b6da35c53',
  // NV0035 = cũng là Tấn Hiếu (mã mới tạo)
  'NV0035': '5a0a1a7e-3db3-4e1f-9124-f62b6da35c53',
  'NV0036': '833a6acb-3bcb-4294-af5e-25c988cd024c',
}

const NAME_MAP = {
  'pham nguyen dong duy': 'f747f06f-9e95-406e-a5b5-0f6571dbfaa4',
  'huynh le kieu linh': 'e04b5c70-97e2-4061-8bef-0fae5563a066',
  'nguyen thi tu trinh': '39cb7ca9-83eb-4023-b45d-6d4e24219dc3',
  'nguyen trinh': '39cb7ca9-83eb-4023-b45d-6d4e24219dc3',         // tên rút gọn trong file
  'nguyen thi kieu y': '10a4897f-9936-41a7-804f-8a4556eaaf0c',
  'nguyen thanh thien': 'd8b8ecd5-1e74-415b-a739-2fa6bbd81284',
  'le minh loc': '2f3acef5-118f-490b-8530-d86aa164b90a',
  'quach thi kim chi': 'c3c55940-87ce-4806-af07-2defcca16eea',
  'quach chi': 'c3c55940-87ce-4806-af07-2defcca16eea',             // tên rút gọn
  'nguyen hoai an': 'af938b43-f835-4d45-8e60-785a76d9b599',
  'tran cong huy': '9392ab72-eacc-4211-a0b3-a183c0db75d5',
  'nguyen thi phuong thao': 'c9ddc22c-de07-4573-9423-5da69ef200c0',
  'cao van thang': 'be45b9a4-8ae6-460a-9834-744675904fc6',
  'nguyen thi thu': '90f9a3db-22e9-49c7-bf9f-42f3390a8e60',
  // 2 NV mới (UUID sau khi addNewEmployees)
  'tan hieu': '5a0a1a7e-3db3-4e1f-9124-f62b6da35c53',
  'nguyen manh duy': '833a6acb-3bcb-4294-af5e-25c988cd024c',
}

function normalizeViName(str) {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, c => c === 'đ' ? 'd' : 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function getEmployeeId(name, maCode) {
  if (maCode && maCode !== '-' && MA_NV_MAP[maCode]) return MA_NV_MAP[maCode]
  const normalized = normalizeViName(name)
  return NAME_MAP[normalized] || null
}

function parseDate(val) {
  if (!val) return null
  const s = String(val).trim()
  const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`
  const d = new Date(val)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

function mapShift(tenCa) {
  if (!tenCa) return null
  const t = normalizeViName(tenCa)
  if (t.includes('sang') || t.includes('sang pha che')) return SHIFT_SANG
  if (t.includes('trua') || t.includes('chieu')) return SHIFT_CHIEU
  if (t.includes('toi') || t.includes('dem')) return SHIFT_TOI
  return null
}

function isAugust2026(dateStr) {
  return dateStr && dateStr.startsWith('2026-08')
}

async function addNewEmployees(supabase) {
  console.log('\n[STEP 1] Thêm 2 nhân viên mới...')
  const newEmployees = [
    { id: uuidv4(), ma_nhan_vien: 'NV0035', ho_ten: 'Tấn Hiếu', so_dien_thoai: '0932835952', cua_hang_id: STORE_HBP, vai_tro: 'nhan_vien', to_chuc_id: 'a0000000-0000-0000-0000-000000000001' },
    { id: uuidv4(), ma_nhan_vien: 'NV0036', ho_ten: 'Nguyễn Mạnh Duy', so_dien_thoai: '0377249775', cua_hang_id: STORE_HBP, vai_tro: 'nhan_vien', to_chuc_id: 'a0000000-0000-0000-0000-000000000001' },
  ]
  for (const emp of newEmployees) {
    const { data: existing } = await supabase.from('nhan_vien').select('id,ho_ten').eq('so_dien_thoai', emp.so_dien_thoai).maybeSingle()
    if (existing) {
      console.log(`  ✓ ${emp.ho_ten} đã có (${existing.id})`)
      NAME_MAP[normalizeViName(emp.ho_ten)] = existing.id
      MA_NV_MAP[emp.ma_nhan_vien] = existing.id
    } else {
      const { data, error } = await supabase.from('nhan_vien').insert(emp).select().single()
      if (error) {
        console.error(`  ✗ Lỗi ${emp.ho_ten}:`, error.message)
      } else {
        console.log(`  ✓ Thêm mới ${emp.ho_ten} (${data.id})`)
        NAME_MAP[normalizeViName(emp.ho_ten)] = data.id
        MA_NV_MAP[emp.ma_nhan_vien] = data.id
      }
    }
  }
}

async function parseHBP() {
  console.log('\n[STEP 2] Parse HBP - Lương theo ca (tháng 8)...')
  const sheets = await readXlsxFile(path.join(DOWNLOADS_DIR, HBP_FILE), { getSheets: true })
  const s = sheets.find(sh => (sh.name || sh.sheet) === 'Lương theo ca')
  if (!s?.data) { console.log('  ✗ Không tìm thấy sheet'); return [] }
  const rows = s.data
  // Col: 0=Ngày, 2=Nhân viên, 3=Mã NV, 11=Ca làm việc
  const records = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row?.[0]) continue
    const ngay = parseDate(row[0])
    if (!ngay || !isAugust2026(ngay)) continue
    const empId = getEmployeeId(row[2], row[3])
    if (!empId) { console.log(`  ⚠ Bỏ NV: "${row[2]}" (${row[3]}) ${ngay}`); continue }
    const caId = mapShift(row[11])
    if (!caId) continue
    records.push({ ngay, nhan_vien_id: empId, cua_hang_id: STORE_HBP, ca_lam_id: caId, ten_ca_ipos: row[11] })
  }
  console.log(`  → ${records.length} records HBP`)
  return records
}

async function parse429() {
  console.log('\n[STEP 3] Parse 429 - Danh sách theo lịch làm việc (tháng 8)...')
  const sheets = await readXlsxFile(path.join(DOWNLOADS_DIR, FILE_429), { getSheets: true })
  const s = sheets.find(sh => (sh.name || sh.sheet) === 'Danh sách theo lịch làm việc')
  if (!s?.data) { console.log('  ✗ Không tìm thấy sheet'); return [] }
  const rows = s.data
  // Col: 0=Ngày, 1=Nhân viên, 2=Mã NV, 6=Ca làm việc, 7=Loại ca
  const records = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row?.[0]) continue
    const ngay = parseDate(row[0])
    if (!ngay || !isAugust2026(ngay)) continue
    const loaiCa = String(row[7] || '')
    if (normalizeViName(loaiCa).includes('phat sinh')) continue
    const empId = getEmployeeId(row[1], row[2])
    if (!empId) { console.log(`  ⚠ Bỏ NV: "${row[1]}" (${row[2]}) ${ngay}`); continue }
    const caId = mapShift(row[6])
    if (!caId) continue
    records.push({ ngay, nhan_vien_id: empId, cua_hang_id: STORE_429, ca_lam_id: caId, ten_ca_ipos: row[6] })
  }
  console.log(`  → ${records.length} records 429`)
  return records
}

async function upsertAll(supabase, allRecords) {
  const seen = new Set()
  const deduped = []
  for (const r of allRecords) {
    const k = `${r.nhan_vien_id}|${r.ngay}|${r.ca_lam_id}`
    if (!seen.has(k)) { seen.add(k); deduped.push(r) }
  }
  console.log(`\n[STEP 4] Upsert ${deduped.length} records (sau deduplicate từ ${allRecords.length})...`)

  const payload = deduped.map(r => ({
    nhan_vien_id: r.nhan_vien_id,
    cua_hang_id: r.cua_hang_id,
    ca_lam_id: r.ca_lam_id,
    ngay: r.ngay,
    trang_thai: 'da_xep',
    ghi_chu: `[iPOS] ${r.ten_ca_ipos || ''}`.trim(),
    nguoi_tao_id: 'e0000000-0000-0000-0000-000000000001',
  }))

  let inserted = 0, errors = 0
  const BATCH = 50
  for (let i = 0; i < payload.length; i += BATCH) {
    const batch = payload.slice(i, i + BATCH)
    const { error } = await supabase.from('lich_phan_ca').upsert(batch, { onConflict: 'nhan_vien_id,ngay,ca_lam_id' })
    if (error) { console.error(`  ✗ Batch lỗi:`, error.message); errors += batch.length }
    else { inserted += batch.length; process.stdout.write(`  ✓ ${inserted}/${payload.length}\r`) }
  }
  console.log('')
  return { total: payload.length, inserted, errors }
}

/**
 * Parse file Lich-Lam-Viec dạng grid:
 * Row 0: [null, "Thứ 2 - 10/08/2026", "Thứ 3 - 11/08/2026", ...]
 * Row 1+: ["Tên NV\n\nX ca | Y giờ", "Ca Sáng [08:30-12:00]", ...]
 */
async function parseGridFile(filePath, storeId) {
  const sheets = await readXlsxFile(filePath, { getSheets: true })
  const sh = sheets.find(s => (s.name||s.sheet) === 'Lịch làm việc') || sheets[0]
  if (!sh?.data) return []
  const rows = sh.data

  // Row 0: extract dates from headers
  const headerRow = rows[0]
  const colDates = [] // colDates[colIdx] = 'yyyy-MM-dd' or null
  for (let c = 0; c < (headerRow?.length || 0); c++) {
    const h = headerRow[c]
    if (!h) { colDates.push(null); continue }
    // "Thứ 2 - 10/08/2026" or "Chủ Nhật - 02/08/2026"
    const m = String(h).match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (m) colDates.push(`${m[3]}-${m[2]}-${m[1]}`)
    else colDates.push(null)
  }

  const records = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row?.[0]) continue
    // Extract NV name from col 0 (format: "Tên NV\n\nX ca | Y giờ")
    const nameRaw = String(row[0]).split('\n')[0].trim()
    const empId = getEmployeeId(nameRaw, null)
    if (!empId) { console.log(`  ⚠ Grid: Không map NV "${nameRaw}"`); continue }

    for (let c = 1; c < row.length; c++) {
      const cellDate = colDates[c]
      if (!cellDate || !isAugust2026(cellDate)) continue
      const cell = row[c]
      if (!cell) continue
      // 1 cell có thể có nhiều ca (phân cách \n\n)
      const shifts = String(cell).split('\n\n').map(s => s.trim()).filter(Boolean)
      for (const shiftStr of shifts) {
        const caId = mapShift(shiftStr)
        if (!caId) continue
        records.push({ ngay: cellDate, nhan_vien_id: empId, cua_hang_id: storeId, ca_lam_id: caId, ten_ca_ipos: shiftStr })
      }
    }
  }
  return records
}

async function main() {
  console.log('==============================================')
  console.log('SEED iPOS T8/2026 → Supabase lich_phan_ca')
  console.log('==============================================')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  await addNewEmployees(supabase)
  const hbp = await parseHBP()
  const s429 = await parse429()

  // Parse grid files
  console.log('\n[STEP 3b] Parse Lich-Lam-Viec grid files...')
  const gridFiles429 = [
    'Lich-Lam-Viec-429---TRA-SUA-PHO-MAI-TUOI-HOMIES-1787074388078.xlsx', // 29/6 - 5/7 (no Aug)
    'Lich-Lam-Viec-429---TRA-SUA-PHO-MAI-TUOI-HOMIES-1787131109506.xlsx', // 27/7 - 2/8
    'Lich-Lam-Viec-429---TRA-SUA-PHO-MAI-TUOI-HOMIES-1787322488063.xlsx', // 6/7 - 12/7 (no Aug)
    'Lich-Lam-Viec-429---TRA-SUA-PHO-MAI-TUOI-HOMIES-1787322493804.xlsx', // 13/7 - 19/7 (no Aug)
    'Lich-Lam-Viec-429---TRA-SUA-PHO-MAI-TUOI-HOMIES-1787322499481.xlsx', // 20/7 - 26/7 (no Aug)
  ]
  const gridFilesHBP = [
    'Lich-Lam-Viec-HBP---TRA-SUA-PHO-MAI-TUOI-HOMIES-1786875028039.xlsx', // 10/8 - 16/8
  ]

  let gridRecords = []
  for (const f of gridFiles429) {
    const fp = path.join('C:\\Users\\Admin\\Downloads', f)
    const r = await parseGridFile(fp, STORE_429)
    console.log(`  → 429 grid "${f.slice(-30)}": ${r.length} records Aug`)
    gridRecords = [...gridRecords, ...r]
  }
  for (const f of gridFilesHBP) {
    const fp = path.join('C:\\Users\\Admin\\Downloads', f)
    const r = await parseGridFile(fp, STORE_HBP)
    console.log(`  → HBP grid "${f.slice(-30)}": ${r.length} records Aug`)
    gridRecords = [...gridRecords, ...r]
  }

  const all = [...hbp, ...s429, ...gridRecords]
  console.log(`\nTổng parse được: ${all.length} records`)
  console.log(`  HBP detail: ${hbp.length}, 429 detail: ${s429.length}, Grid: ${gridRecords.length}`)

  if (all.length === 0) { console.log('⚠ Không có data để upsert!'); return }

  const result = await upsertAll(supabase, all)

  const { count: aug } = await supabase.from('lich_phan_ca').select('*', { count: 'exact', head: true }).gte('ngay', '2026-08-01').lte('ngay', '2026-08-31')
  const { count: total } = await supabase.from('lich_phan_ca').select('*', { count: 'exact', head: true })

  console.log('\n==============================================')
  console.log('KẾT QUẢ CUỐI:')
  console.log(`  Records upsert thành công: ${result.inserted}`)
  console.log(`  Lỗi:                       ${result.errors}`)
  console.log(`  lich_phan_ca T8/2026:      ${aug}`)
  console.log(`  lich_phan_ca tổng cộng:   ${total}`)
  console.log('==============================================')
}

main().catch(console.error)
