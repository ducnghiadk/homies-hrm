import assert from 'assert'

async function run() {
  console.log('===============================================================')
  console.log('🛡️ KIỂM THỬ XÁC THỰC THẬT & CHẶN MOCK iPOS HRM CLOUD WORKER (PORT 3535)')
  console.log('===============================================================')

  // RESET: Đưa trạng thái về chưa xác thực để bài test luôn chạy độc lập, nhất quán
  await fetch('http://localhost:3535/api/ipos/cloud-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_config',
      config: {
        is_authenticated: false,
        last_sync_status: 'unauthenticated',
        username: '',
        token_or_password: '',
      }
    })
  })

  // TEST 1: GET Cấu hình Worker & Trạng thái kết nối khi chưa đăng nhập thật
  console.log('\n--- BƯỚC 1: Kiểm tra GET /api/ipos/cloud-worker (Trạng thái trung thực) ---')
  const resGet = await fetch('http://localhost:3535/api/ipos/cloud-worker')
  assert.strictEqual(resGet.status, 200, `GET expected 200 but got ${resGet.status}`)
  const getJson = await resGet.json()
  assert.strictEqual(getJson.success, true)
  assert.strictEqual(getJson.server_status, 'unauthenticated')
  assert.strictEqual(getJson.active_worker, false)
  console.log(`✅ Trạng thái phản hồi trung thực: [${getJson.server_status.toUpperCase()}]`)
  console.log(`   Lịch chạy tự động: ${getJson.next_run}`)

  // TEST 2: POST action = 'test_connection' với tài khoản mẫu / rỗng -> Bị từ chối thẳng thắn
  console.log('\n--- BƯỚC 2: Kiểm tra từ chối tài khoản mẫu hoặc tài khoản trống ---')
  const resPingMock = await fetch('http://localhost:3535/api/ipos/cloud-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'test_connection',
      api_endpoint: 'https://hrm.ipos.vn',
      username: 'homies.quanly@bobahouse.vn',
      token_or_password: 'ipos_sec_homies_live_2026'
    })
  })
  assert.strictEqual(resPingMock.status, 400)
  const pingMockJson = await resPingMock.json()
  assert.strictEqual(pingMockJson.success, false)
  assert.strictEqual(pingMockJson.status, 'unauthenticated')
  console.log(`✅ Đã chặn tài khoản mẫu thành công: "${pingMockJson.message}"`)

  // TEST 3: POST action = 'test_connection' với tên miền không tồn tại -> Báo lỗi mạng thật
  console.log('\n--- BƯỚC 3: Kiểm tra kết nối tên miền ảo (api.hrm.ipos.vn) ---')
  const resPingFake = await fetch('http://localhost:3535/api/ipos/cloud-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'test_connection',
      api_endpoint: 'https://api.hrm.ipos.vn',
      username: 'real_manager_user',
      token_or_password: 'real_password_123'
    })
  })
  assert.strictEqual(resPingFake.status, 502)
  const pingFakeJson = await resPingFake.json()
  assert.strictEqual(pingFakeJson.success, false)
  console.log(`✅ Đã phát hiện đúng lỗi tên miền ảo: "${pingFakeJson.message}"`)

  // TEST 4: POST action = 'test_connection' với tài khoản không đúng -> Hệ thống BẮT BUỘC từ chối thẳng thắn 401
  console.log('\n--- BƯỚC 4: Kiểm tra gửi tài khoản không đúng tới máy chủ hrm.ipos.vn (Chống giả kết nối) ---')
  const resPingInvalid = await fetch('http://localhost:3535/api/ipos/cloud-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'test_connection',
      api_endpoint: 'https://hrm.ipos.vn',
      username: 'wrong_account_test@homies.vn',
      token_or_password: 'wrong_password_123456'
    })
  })
  assert.strictEqual(resPingInvalid.status, 401, `Expected HTTP 401 but got ${resPingInvalid.status}`)
  const pingInvalidJson = await resPingInvalid.json()
  assert.strictEqual(pingInvalidJson.success, false)
  assert.strictEqual(pingInvalidJson.status, 'auth_failed')
  assert.strictEqual(pingInvalidJson.message.includes('iPOS HRM báo lỗi') || pingInvalidJson.message.includes('thất bại'), true)
  console.log(`✅ Tuyệt đối không giả mạo kết nối! Máy chủ từ chối chính xác: "${pingInvalidJson.message}"`)

  // Kiểm tra trạng thái trong DB: Bắt buộc is_authenticated = false
  const verifyDb = await (await fetch('http://localhost:3535/api/ipos/cloud-worker')).json()
  assert.strictEqual(verifyDb.server_status !== 'connected', true)
  console.log(`✅ Trạng thái lưu trữ bảo mật: [${verifyDb.server_status}] - Không bị kích hoạt kết nối ảo.`)

  // TEST 5: POST action = 'trigger_sync' khi chưa đăng nhập thật -> Chặn tuyệt đối không sinh dữ liệu giả
  console.log('\n--- BƯỚC 5: Kiểm tra chặn đồng bộ ngầm khi chưa xác thực ---')
  // Reset trạng thái về unauthenticated để test
  await fetch('http://localhost:3535/api/ipos/cloud-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_config', config: { is_authenticated: false } })
  })
  const resSyncBlocked = await fetch('http://localhost:3535/api/ipos/cloud-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'trigger_sync',
      trigger_type: 'manual'
    })
  })
  assert.strictEqual(resSyncBlocked.status, 400)
  const syncBlockedJson = await resSyncBlocked.json()
  assert.strictEqual(syncBlockedJson.success, false)
  assert.strictEqual(syncBlockedJson.status, 'unauthenticated')
  console.log(`✅ Đã chặn quét dữ liệu giả thành công: "${syncBlockedJson.message}"`)

  // TEST 6: POST action = 'trigger_sync' với mode = 'archived_excel' -> Cho phép nạp dữ liệu lưu trữ T8/2026
  console.log('\n--- BƯỚC 6: Kiểm tra tính năng nạp dữ liệu thực tế lưu trữ T8/2026 ---')
  const resSyncArchive = await fetch('http://localhost:3535/api/ipos/cloud-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'trigger_sync',
      mode: 'archived_excel',
      trigger_type: 'manual'
    })
  })
  assert.strictEqual(resSyncArchive.status, 200)
  const syncArchiveJson = await resSyncArchive.json()
  assert.strictEqual(syncArchiveJson.success, true)
  assert.strictEqual(syncArchiveJson.count >= 4, true)
  console.log(`✅ Đã nạp thành công ${syncArchiveJson.count} bản ghi lưu trữ T8/2026`)

  // TEST 7: POST action = 'test_fabi_login' với tài khoản rỗng -> Bị từ chối
  console.log('\n--- BƯỚC 7: Kiểm tra test_fabi_login với tài khoản rỗng ---')
  const resFabiEmpty = await fetch('http://localhost:3535/api/ipos/cloud-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'test_fabi_login',
      username: '',
      password: ''
    })
  })
  assert.strictEqual(resFabiEmpty.status, 400)
  const fabiEmptyJson = await resFabiEmpty.json()
  assert.strictEqual(fabiEmptyJson.success, false)
  console.log(`✅ Đã chặn tài khoản FABi rỗng: "${fabiEmptyJson.message}"`)

  console.log('\n🎉 TOÀN BỘ 7 BƯỚC KIỂM THỬ iPOS + FABI (CHUẨN ZALOCRM) ĐẠT CHUẨN 100% THÀNH CÔNG!')
}

run().catch((err) => {
  console.error('\n❌ [FAIL]', err)
  process.exit(1)
})
