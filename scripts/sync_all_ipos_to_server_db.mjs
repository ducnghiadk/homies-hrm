import fs from 'fs'
import path from 'path'
import {
  fetchIposEmployees,
  fetchIposWorkSchedule,
  fetchIposTimesheet,
} from '../src/lib/services/ipos/ipos-cloud-client.ts'

const DB_PATH = path.resolve('data/server-db.json')

async function syncAll() {
  console.log('=================================================================')
  console.log('📦 BẮT ĐẦU ĐỒNG BỘ TOÀN BỘ DỮ LIỆU IPOS CLOUD VÀO CSDL NỘI BỘ')
  console.log('=================================================================')

  let db = { attendance: [], shifts: [], employees: [] }
  if (fs.existsSync(DB_PATH)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
    } catch {
      console.warn('Không thể đọc file db hiện tại, tạo mới.')
    }
  }
  if (!db.attendance) db.attendance = []
  if (!db.shifts) db.shifts = []
  if (!db.employees) db.employees = []

  // 1. ĐỒNG BỘ NHÂN VIÊN
  console.log('\n👥 1. Đang đồng bộ danh sách Nhân viên từ iPOS...')
  const empRes = await fetchIposEmployees()
  if (empRes.success && empRes.data.length > 0) {
    let empNewCount = 0
    empRes.data.forEach(item => {
      const idx = db.employees.findIndex(e => e.id === item.id || (item.employee_code && e.employee_code === item.employee_code))
      if (idx >= 0) {
        db.employees[idx] = { ...db.employees[idx], ...item }
      } else {
        db.employees.push(item)
        empNewCount++
      }
    })
    console.log(`✅ Đã đồng bộ ${empRes.data.length} nhân viên (Thêm mới: ${empNewCount}, Tổng trong DB: ${db.employees.length})`)
  }

  // 2. ĐỒNG BỘ LỊCH PHÂN CA (Tháng 8, 9, 10/2026)
  const months = [
    { name: 'Tháng 8/2026', from: '2026-08-01', to: '2026-08-31' },
    { name: 'Tháng 9/2026', from: '2026-09-01', to: '2026-09-30' },
    { name: 'Tháng 10/2026', from: '2026-10-01', to: '2026-10-31' },
  ]

  console.log('\n📅 2. Đang đồng bộ Lịch phân ca (Work Schedules)...')
  let totalShiftsSynced = 0
  for (const m of months) {
    const sRes = await fetchIposWorkSchedule({ fromDate: m.from, toDate: m.to })
    if (sRes.success && sRes.data.length > 0) {
      sRes.data.forEach(item => {
        const idx = db.shifts.findIndex(s => s.id === item.id || (s.employee_id === item.employee_id && s.date === item.date && s.shift_id === item.shift_id))
        if (idx >= 0) {
          db.shifts[idx] = { ...db.shifts[idx], ...item }
        } else {
          db.shifts.push(item)
        }
        totalShiftsSynced++
      })
      console.log(`  + ${m.name}: ${sRes.data.length} ca`)
    }
  }
  console.log(`✅ Tổng số ca phân công đã nạp vào DB: ${db.shifts.length}`)

  // 3. ĐỒNG BỘ CHẤM CÔNG THỰC TẾ (Tháng 9, Tháng 10/2026)
  console.log('\n⏰ 3. Đang đồng bộ Chấm công thực tế (Timesheet)...')
  let totalAttSynced = 0
  for (const m of [months[1], months[2]]) { // Tháng 9 & Tháng 10
    console.log(`  📡 Đang nạp ${m.name}...`)
    const aRes = await fetchIposTimesheet({ fromDate: m.from, toDate: m.to, forceRefresh: true })
    if (aRes.success && aRes.data.length > 0) {
      aRes.data.forEach(item => {
        const idx = db.attendance.findIndex(a => a.id === item.id || (a.employee_id === item.employee_id && a.date === item.date && a.shift_id === item.shift_id))
        const log = {
          id: item.id,
          employee_id: item.employee_id,
          employee_name: item.employee_name,
          employee_code: item.employee_code,
          store_id: item.store_id,
          store_name: item.store_name || '',
          shift_id: item.shift_id,
          check_in_time: item.check_in_time,
          check_out_time: item.check_out_time,
          time_in: item.time_in,
          time_out: item.time_out,
          check_in_lat: item.check_in_lat,
          check_in_lng: item.check_in_lng,
          check_in_distance_meters: item.check_in_distance_meters,
          status: item.status,
          is_late: item.is_late,
          late_minutes: item.late_minutes,
          total_hours: item.total_hours,
          date: item.date,
        }
        if (idx >= 0) {
          db.attendance[idx] = { ...db.attendance[idx], ...log }
        } else {
          db.attendance.push(log)
        }
        totalAttSynced++
      })
      console.log(`  + ${m.name}: Đã nạp ${aRes.data.length} lượt chấm công`)
    }
  }

  // Ghi file server-db.json
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
  console.log(`\n💾 ĐÃ LƯU THÀNH CÔNG VÀO ${DB_PATH}!`)
  console.log(`- Tổng nhân viên trong DB: ${db.employees.length}`)
  console.log(`- Tổng ca phân công trong DB: ${db.shifts.length}`)
  console.log(`- Tổng lượt chấm công trong DB: ${db.attendance.length}`)
}

syncAll().catch(err => {
  console.error('❌ Lỗi đồng bộ:', err)
  process.exit(1)
})
