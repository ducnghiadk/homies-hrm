/**
 * TEST IPOS SCHEMA DETECTOR & GAP AUTO-RECOMMENDATIONS VIA API
 * =============================================================
 * Kiểm thử tự động bộ ghi nhận schema iPOS thực tế và đề xuất trường thiếu
 * thông qua API máy chủ đang chạy trên cổng 3535
 */

async function run() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ: BỘ GHI NHẬN LUỒNG IPOS & ĐỀ XUẤT BỔ SUNG')
  console.log('------------------------------------------------------------')

  const BASE_URL = 'http://localhost:3535/api/ipos/cloud-worker'

  // 1. GET thông tin cấu hình và schema_status
  console.log('>>> [Bước 1] Gửi GET /api/ipos/cloud-worker để kiểm tra schema_status ban đầu...')
  const getRes = await fetch(BASE_URL)
  if (!getRes.ok) {
    throw new Error(`GET thất bại với HTTP status: ${getRes.status}`)
  }
  const getJson = await getRes.json()
  console.log(`✅ Kết nối API thành công: server_status = "${getJson.server_status}"`)
  console.log(`✅ Schema Status ban đầu: ${getJson.schema_status ? 'ĐÃ KHỞI TẠO' : 'CHƯA CÓ'}`)

  // 2. Kích hoạt trigger_sync để đẩy luồng dữ liệu thực tế kèm các trường đặc thù
  console.log('\n>>> [Bước 2] Kích hoạt trigger_sync (Đồng bộ luồng dữ liệu iPOS có trường mới)...')
  const syncRes = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'trigger_sync',
      mode: 'archived_excel',
      trigger_type: 'manual',
    }),
  })

  if (!syncRes.ok) {
    throw new Error(`Sync thất bại với HTTP status: ${syncRes.status}`)
  }
  const syncJson = await syncRes.json()
  console.log(`✅ Đồng bộ thành công: ${syncJson.count} bản ghi`)
  console.log(`✅ Message: ${syncJson.message}`)

  const schemaStatus = syncJson.schema_status
  if (!schemaStatus) {
    throw new Error('trigger_sync không trả về schema_status!')
  }

  console.log(`✅ [Đối soát] Tổng trường iPOS ghi nhận: ${schemaStatus.fields.length} trường`)
  console.log(`✅ [Đối soát] Số trường đã khớp với Homies: ${schemaStatus.mappedCount} trường`)
  console.log(`✅ [Đối soát] Số đề xuất trường thiếu cần bổ sung: ${schemaStatus.pendingRecommendationsCount} đề xuất`)

  // Kiểm tra danh sách đề xuất
  const pendingRecs = schemaStatus.recommendations.filter((r) => r.status === 'pending')
  console.log('\n>>> [Bước 3] Chi tiết các đề xuất thông minh phát hiện được:')
  pendingRecs.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. [${rec.importance.toUpperCase()}] ${rec.field_title} (${rec.field_key})`)
    console.log(`     Lý do: ${rec.reason}`)
    console.log(`     Hành động: ${rec.suggested_action}`)
  })

  if (pendingRecs.length === 0) {
    console.log('ℹ️ Không có đề xuất mới ở trạng thái pending (có thể đã được áp dụng trước đó).')
  } else {
    // 3. Thử nghiệm áp dụng 1 đề xuất (1-click recommendation)
    const targetRec = pendingRecs[0]
    console.log(`\n>>> [Bước 4] Giả lập người dùng bấm "Áp dụng vào Homies": [${targetRec.field_title}]...`)
    const applyRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'apply_recommendation',
        recommendation_id: targetRec.id,
      }),
    })
    const applyJson = await applyRes.json()
    console.log(`✅ Kết quả áp dụng: ${applyJson.message}`)

    const updatedRec = applyJson.schema_status.recommendations.find((r) => r.id === targetRec.id)
    if (updatedRec && updatedRec.status === 'applied') {
      console.log(`✅ Trạng thái đề xuất đã chuyển thành: "${updatedRec.status}"`)
    } else {
      throw new Error('Trạng thái đề xuất chưa cập nhật thành applied!')
    }
  }

  console.log('\n============================================================')
  console.log('🎉 TẤT CẢ KIỂM THỬ CHO BỘ SCHEMA DETECTOR & ĐỀ XUẤT ĐỀU HOÀN HẢO!')
  console.log('============================================================')
}

run().catch((err) => {
  console.error('❌ Lỗi kiểm thử:', err)
  process.exit(1)
})
