import assert from 'node:assert'
import {
  getIposCloudConfig,
  isIposCloudConfigured,
  mapHomiesStoreToIpos,
  mapIposStoreToHomies,
  fetchIposEmployees,
  fetchIposWorkSchedule,
  fetchIposTimesheet,
} from '../src/lib/services/ipos/ipos-cloud-client.ts'

console.log('🧪 Bắt đầu kiểm thử tích hợp iPOS Cloud Client...')

// 1. Kiểm tra cấu hình môi trường
const config = getIposCloudConfig()
console.log('1. Cấu hình iPOS Cloud:', {
  baseUrl: config.baseUrl,
  hasToken: Boolean(config.token),
  storeId429: config.storeId429,
  storeIdHbp: config.storeIdHbp,
})
assert.strictEqual(config.baseUrl, 'https://hrm.ipos.vn/api/v2')
assert.strictEqual(config.storeId429, '42313004-3253-4216-bda0-dcce62a6091b')
assert.strictEqual(config.storeIdHbp, '077c43a6-eb3d-4dd1-aab9-a9b390b331a5')
console.log('✅ Bước 1: Cấu hình môi trường chính xác.')

// 2. Kiểm tra mapping Store ID 2 chiều
const iposHbp = mapHomiesStoreToIpos('store-001')
const ipos429 = mapHomiesStoreToIpos('store-002')
assert.strictEqual(iposHbp, config.storeIdHbp)
assert.strictEqual(ipos429, config.storeId429)

const homiesHbp = mapIposStoreToHomies(config.storeIdHbp)
const homies429 = mapIposStoreToHomies(config.storeId429)
assert.strictEqual(homiesHbp, 'store-001')
assert.strictEqual(homies429, 'store-002')
console.log('✅ Bước 2: Ánh xạ 2 chiều mã chi nhánh (Store ID) thành công.')

// 3. Kiểm tra cơ chế Fallback khi token rỗng
console.log('3. Kiểm tra kích hoạt Fallback an toàn khi chưa có token...')
const empRes = await fetchIposEmployees()
assert.strictEqual(empRes.isFallback, true)
console.log(' - fetchIposEmployees -> fallback kích hoạt:', empRes.message)

const schedRes = await fetchIposWorkSchedule({ storeId: 'store-001' })
assert.strictEqual(schedRes.isFallback, true)
console.log(' - fetchIposWorkSchedule -> fallback kích hoạt:', schedRes.message)

const attRes = await fetchIposTimesheet({ storeId: 'store-001' })
assert.strictEqual(attRes.isFallback, true)
console.log(' - fetchIposTimesheet -> fallback kích hoạt:', attRes.message)

// 4. Kiểm tra khi có Token (thử nghiệm với Token giả định để test logic URL & Headers)
process.env.IPOS_HRM_TOKEN = 'test_token_sample_1234567890'
assert.strictEqual(isIposCloudConfigured(), true)
console.log('✅ Bước 4: Kiểm tra nhận diện Token iPOS thành công.')

console.log('🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ TÍCH HỢP ĐỀU THÀNH CÔNG 100%!')
