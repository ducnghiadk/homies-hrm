import {
  fetchIposEmployees,
  fetchIposWorkSchedule,
  fetchIposTimesheet,
} from '../src/lib/services/ipos/ipos-cloud-client.ts'

async function runAudit() {
  console.log('=================================================================')
  console.log('🚀 BẮT ĐẦU KIỂM THỬ KÉO TOÀN BỘ DỮ LIỆU IPOS CLOUD VỀ HOMIES HRM')
  console.log('=================================================================')

  // 1. KÉO DANH SÁCH NHÂN VIÊN
  console.log('\n👥 1. Đang kéo danh sách Nhân viên từ iPOS Cloud...')
  const empRes = await fetchIposEmployees()
  console.log(`- Trạng thái: ${empRes.success ? 'Thành công' : 'Thất bại'} (Fallback: ${empRes.isFallback})`)
  console.log(`- Tổng số nhân viên kéo về: ${empRes.data.length}`)
  
  if (empRes.data.length > 0) {
    const activeEmps = empRes.data.filter(e => e.status === 'active')
    const resignedEmps = empRes.data.filter(e => e.status === 'resigned')
    console.log(`  + Đang làm việc: ${activeEmps.length}`)
    console.log(`  + Đã nghỉ việc: ${resignedEmps.length}`)
    console.log('  + Mẫu 3 nhân viên:')
    empRes.data.slice(0, 3).forEach(e => {
      console.log(`    • [${e.employee_code || 'Chưa có mã'}] ${e.full_name} | Quán: ${e.store_id} | Trạng thái: ${e.status}`)
    })
  }

  // 2. KÉO DỮ LIỆU CHẤM CÔNG CÁC THÁNG (Tháng 8, Tháng 9, Tháng 10/2026)
  const months = [
    { name: 'Tháng 8/2026', from: '2026-08-01', to: '2026-08-31' },
    { name: 'Tháng 9/2026', from: '2026-09-01', to: '2026-09-30' },
    { name: 'Tháng 10/2026', from: '2026-10-01', to: '2026-10-31' },
  ]

  console.log('\n⏰ 2. Đang kiểm tra dữ liệu Chấm công thực tế theo từng tháng...')
  const timesheetSummary = {}

  for (const m of months) {
    console.log(`\n  📡 Đang kéo Chấm công ${m.name} (${m.from} -> ${m.to})...`)
    const tStart = Date.now()
    const attRes = await fetchIposTimesheet({ fromDate: m.from, toDate: m.to })
    const duration = ((Date.now() - tStart) / 1000).toFixed(2)
    
    console.log(`  - Kết quả ${m.name}: ${attRes.data.length} bản ghi (Thời gian: ${duration}s)`)
    
    if (attRes.data.length > 0) {
      const hbpCount = attRes.data.filter(a => a.store_id === 'store-001').length
      const store429Count = attRes.data.filter(a => a.store_id === 'store-002').length
      const onTimeCount = attRes.data.filter(a => a.status === 'on_time').length
      const lateCount = attRes.data.filter(a => a.status === 'late').length
      const missingCheckoutCount = attRes.data.filter(a => a.status === 'missing_checkout').length
      const workingCount = attRes.data.filter(a => a.status === 'working').length

      timesheetSummary[m.name] = {
        total: attRes.data.length,
        hbp: hbpCount,
        store429: store429Count,
        onTime: onTimeCount,
        late: lateCount,
        missingCheckout: missingCheckoutCount,
        working: workingCount,
      }

      console.log(`    • Hồ Bá Phấn (HBP): ${hbpCount} lượt`)
      console.log(`    • Đường 429: ${store429Count} lượt`)
      console.log(`    • Đúng giờ: ${onTimeCount} | Đi trễ: ${lateCount}`)
      console.log(`    • Quên chấm công ra (QCO): ${missingCheckoutCount} | Đang làm việc: ${workingCount}`)
    } else {
      timesheetSummary[m.name] = { total: 0 }
      console.log(`    • (Chưa có bản ghi chấm công trên iPOS trong tháng này)`)
    }
  }

  // 3. KÉO DỮ LIỆU LỊCH PHÂN CA (Work Schedule)
  console.log('\n📅 3. Đang kiểm tra dữ liệu Lịch phân ca (Work Schedule)...')
  for (const m of months) {
    console.log(`\n  📡 Đang kéo Lịch phân ca ${m.name} (${m.from} -> ${m.to})...`)
    const tStart = Date.now()
    const schedRes = await fetchIposWorkSchedule({ fromDate: m.from, toDate: m.to })
    const duration = ((Date.now() - tStart) / 1000).toFixed(2)
    console.log(`  - Kết quả ${m.name}: ${schedRes.data.length} ca phân công (Thời gian: ${duration}s)`)
    if (schedRes.data.length > 0) {
      console.log(`    • Mẫu ca đầu tiên: ${schedRes.data[0].employee_name} | ${schedRes.data[0].shift_name} | Ngày: ${schedRes.data[0].date}`)
    }
  }

  console.log('\n=================================================================')
  console.log('🎯 TỔNG KẾT BÁO CÁO DỮ LIỆU KÉO VỀ TỪ IPOS')
  console.log('=================================================================')
  console.log(JSON.stringify({
    employees: empRes.data.length,
    timesheets: timesheetSummary,
  }, null, 2))
}

runAudit().catch(err => {
  console.error('❌ Lỗi kiểm thử:', err)
  process.exit(1)
})
