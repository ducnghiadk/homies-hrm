import fs from 'fs'
import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ncxwnldazjtlgipdsuws.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeHdubGRhemp0bGdpcGRzdXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjE0MzEsImV4cCI6MjA5NTg5NzQzMX0.l60xIsxuczlkrdC4uIk-tM25khgJ5-AtdcWP1eQPo4I'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const STORE_MAP = {
  'store-001': 'c0000000-0000-0000-0000-000000000001',
  'store-002': 'c0000000-0000-0000-0000-000000000002',
  '077c43a6-eb3d-4dd1-aab9-a9b390b331a5': 'c0000000-0000-0000-0000-000000000001',
  '42313004-3253-4216-bda0-dcce62a6091b': 'c0000000-0000-0000-0000-000000000002',
}

const SHIFT_MAP = {
  'shift-001': 'd0000000-0000-0000-0000-000000000001',
  'shift-002': 'd0000000-0000-0000-0000-000000000002',
  'shift-003': 'd0000000-0000-0000-0000-000000000003',
  'shift-004': 'd0000000-0000-0000-0000-000000000004',
}

function resolveShiftUuid(shiftId, shiftName) {
  if (shiftId && SHIFT_MAP[shiftId]) return SHIFT_MAP[shiftId]
  const name = (shiftName || '').toLowerCase()
  if (name.includes('sáng') || name.includes('mở')) return SHIFT_MAP['shift-001']
  if (name.includes('chiều') || name.includes('trưa')) return SHIFT_MAP['shift-002']
  if (name.includes('tối') || name.includes('đóng') || name.includes('đêm')) return SHIFT_MAP['shift-003']
  return SHIFT_MAP['shift-004']
}

function resolveStoreUuid(storeId) {
  if (storeId && STORE_MAP[storeId]) return STORE_MAP[storeId]
  return STORE_MAP['store-001']
}

function normalizeName(str) {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, c => c === 'đ' ? 'd' : 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

async function sync() {
  console.log('🚀 Đang đồng bộ Lịch làm việc Tháng 10/2026 từ CSDL vào Supabase lich_phan_ca...')

  // 1. Lấy danh sách nhân viên từ Supabase
  const { data: dbEmps, error: empErr } = await supabase.from('nhan_vien').select('id, ho_ten, ma_nhan_vien')
  if (empErr) {
    console.error('Lỗi đọc nhan_vien:', empErr.message)
    return
  }

  const empMap = new Map()
  dbEmps.forEach(e => {
    if (e.ho_ten) empMap.set(normalizeName(e.ho_ten), e.id)
    if (e.ma_nhan_vien) empMap.set(e.ma_nhan_vien.trim().toLowerCase(), e.id)
  })

  // 2. Đọc ca làm việc từ data/server-db.json
  const rawDb = JSON.parse(fs.readFileSync('data/server-db.json', 'utf8'))
  const octShifts = (rawDb.shifts || []).filter(s => s.date && s.date.startsWith('2026-10'))
  console.log(`Tìm thấy ${octShifts.length} ca làm việc Tháng 10 trong data/server-db.json`)

  // 3. Kiểm tra xem có nhân viên nào chưa có trong Supabase không, tạo bổ sung
  const missingEmps = new Map()
  octShifts.forEach(s => {
    const normName = normalizeName(s.employee_name)
    const code = (s.employee_code || '').trim().toLowerCase()
    if (!empMap.has(normName) && !empMap.has(code)) {
      if (!missingEmps.has(normName)) {
        missingEmps.set(normName, {
          id: randomUUID(),
          ho_ten: s.employee_name || 'Nhân viên',
          ma_nhan_vien: s.employee_code || `NV-${Math.floor(Math.random() * 9000 + 1000)}`,
          cua_hang_id: resolveStoreUuid(s.store_id),
          chuc_vu_id: 'b0000000-0000-0000-0000-000000000001',
          to_chuc_id: 'a0000000-0000-0000-0000-000000000001',
          trang_thai: 'hoat_dong'
        })
      }
    }
  })

  if (missingEmps.size > 0) {
    console.log(`Bổ sung ${missingEmps.size} nhân viên mới vào Supabase nhan_vien...`)
    const newEmpList = Array.from(missingEmps.values())
    const { error: insEmpErr } = await supabase.from('nhan_vien').insert(newEmpList)
    if (insEmpErr) {
      console.warn('Lỗi chèn nhan_vien mới:', insEmpErr.message)
    } else {
      newEmpList.forEach(e => {
        empMap.set(normalizeName(e.ho_ten), e.id)
        empMap.set(e.ma_nhan_vien.trim().toLowerCase(), e.id)
      })
    }
  }

  // 4. Chuẩn bị bản ghi insert vào lich_phan_ca
  const rowsToInsert = []
  for (const s of octShifts) {
    const normName = normalizeName(s.employee_name)
    const code = (s.employee_code || '').trim().toLowerCase()
    const empUuid = empMap.get(code) || empMap.get(normName)
    if (!empUuid) continue

    const cuaHangUuid = resolveStoreUuid(s.store_id)
    const caLamUuid = resolveShiftUuid(s.shift_id, s.shift_name)

    rowsToInsert.push({
      nhan_vien_id: empUuid,
      cua_hang_id: cuaHangUuid,
      ca_lam_id: caLamUuid,
      ngay: s.date,
      trang_thai: 'da_xep',
      ghi_chu: s.notes || s.shift_name || null,
    })
  }

  console.log(`Chuẩn bị nạp ${rowsToInsert.length} bản ghi hợp lệ vào Supabase lich_phan_ca...`)

  // Xóa ca cũ tháng 10 để tránh trùng lặp
  await supabase.from('lich_phan_ca').delete().gte('ngay', '2026-10-01').lte('ngay', '2026-10-31')

  // Insert theo batch 50 bản ghi
  for (let i = 0; i < rowsToInsert.length; i += 50) {
    const chunk = rowsToInsert.slice(i, i + 50)
    const { error: insErr } = await supabase.from('lich_phan_ca').insert(chunk)
    if (insErr) {
      console.warn('Lỗi chèn batch:', insErr.message)
    }
  }

  // Kiểm tra lại Tuần 41 (05/10 - 11/10)
  const { data: finalData } = await supabase
    .from('lich_phan_ca')
    .select('*')
    .gte('ngay', '2026-10-05')
    .lte('ngay', '2026-10-11')

  console.log(`✅ KẾT QUẢ: Đã nạp thành công vào Supabase lich_phan_ca Tuần 41 (05/10 - 11/10): ${finalData?.length} ca!`)
}

sync().catch(e => console.error(e))
