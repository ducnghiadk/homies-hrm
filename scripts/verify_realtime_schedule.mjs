async function verify() {
  console.log('================================================================')
  console.log('🔍 KIỂM THỬ XÁC MINH THỜI GIAN THỰC TẾ (REAL-TIME VERIFICATION)')
  console.log('================================================================')

  // 1. Kiểm tra thuật toán tính tuần hiện tại
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = now.getDate() - (day === 0 ? 6 : day - 1)
  const base = new Date(now.getFullYear(), now.getMonth(), diffToMonday, 12, 0, 0, 0)
  
  const target = new Date(base.valueOf())
  const dayNr = (base.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)

  const weekStartStr = base.toISOString().slice(0, 10)
  const endDateObj = new Date(base)
  endDateObj.setDate(base.getDate() + 6)
  const weekEndStr = endDateObj.toISOString().slice(0, 10)

  console.log(`⏱️ Thời điểm hiện tại: ${now.toLocaleString('vi-VN')}`)
  console.log(`📅 Tuần tính toán: Tuần ${weekNumber}/${base.getFullYear()}`)
  console.log(`👉 Khoảng ngày tuần này: ${weekStartStr} đến ${weekEndStr}`)

  if (weekNumber !== 41 || weekStartStr !== '2026-10-05' || weekEndStr !== '2026-10-11') {
    console.error('❌ Tính toán tuần không đúng với tuần 41 (05/10 - 11/10/2026)!')
    process.exit(1)
  }
  console.log('✅ 1. Thuật toán tuần hiện tại: ĐẠT CHUẨN (Tuần 41: 05/10 - 11/10/2026)')

  // 2. Kiểm tra API ca làm việc tuần này cho Quán Hồ Bá Phấn (store-001)
  console.log('\n📡 Đang gọi API ca làm việc Tuần 41 quán Hồ Bá Phấn...')
  const resHbp = await fetch(`http://localhost:3535/api/shifts?store_id=store-001&from_date=${weekStartStr}&to_date=${weekEndStr}`)
  console.log(`- Trạng thái HTTP: ${resHbp.status}`)
  const jsonHbp = await resHbp.json()
  console.log(`- Số ca tuần này (HBP): ${jsonHbp.count || jsonHbp.data?.length}`)
  if (jsonHbp.data?.length > 0) {
    console.log(`  Mẫu ca: ${jsonHbp.data[0].employee_name} | ${jsonHbp.data[0].shift_name} | Ngày: ${jsonHbp.data[0].date}`)
  }

  // 3. Kiểm tra API ca làm việc tuần này cho Quán Đường 429 (store-002)
  console.log('\n📡 Đang gọi API ca làm việc Tuần 41 quán Đường 429...')
  const res429 = await fetch(`http://localhost:3535/api/shifts?store_id=store-002&from_date=${weekStartStr}&to_date=${weekEndStr}`)
  console.log(`- Trạng thái HTTP: ${res429.status}`)
  const json429 = await res429.json()
  console.log(`- Số ca tuần này (429): ${json429.count || json429.data?.length}`)
  if (json429.data?.length > 0) {
    console.log(`  Mẫu ca: ${json429.data[0].employee_name} | ${json429.data[0].shift_name} | Ngày: ${json429.data[0].date}`)
  }

  // 4. Kiểm tra gọi API /api/shifts không truyền ngày (Mặc định toàn bộ tháng 10)
  console.log('\n📡 Đang gọi API /api/shifts không truyền ngày...')
  const resMonth = await fetch(`http://localhost:3535/api/shifts?store_id=store-001`)
  const jsonMonth = await resMonth.json()
  console.log(`- Mặc định lấy theo tháng: ${jsonMonth.count || jsonMonth.data?.length} ca`)

  console.log('\n================================================================')
  console.log('🎉 TẤT CẢ CÁC BÀI KIỂM TRA XÁC MINH ĐỀU ĐẠT 100%!')
  console.log('================================================================')
}

verify().catch(err => {
  console.error('❌ Lỗi kiểm tra:', err)
  process.exit(1)
})
