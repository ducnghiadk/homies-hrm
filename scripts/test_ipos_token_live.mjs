import fs from 'node:fs'
import path from 'node:path'

// Đọc file .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('❌ Không tìm thấy file .env.local')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = (match[2] || '').trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }
    env[match[1]] = value
  }
}

const token = env.IPOS_HRM_TOKEN
const baseUrl = env.IPOS_HRM_BASE_URL || 'https://hrm.ipos.vn/api/v2'
const storeId429 = env.STORE_ID_429 || '42313004-3253-4216-bda0-dcce62a6091b'
const storeIdHbp = env.STORE_ID_HBP || '077c43a6-eb3d-4dd1-aab9-a9b390b331a5'

if (!token) {
  console.error('❌ Không tìm thấy biến IPOS_HRM_TOKEN trong .env.local')
  process.exit(1)
}

console.log('================================================================')
console.log('🔍 KIỂM TRA THÔNG TIN TOKEN IPOS HRM TỪ FILE .ENV.LOCAL')
console.log('================================================================')
console.log(`📌 Base URL: ${baseUrl}`)
console.log(`🔑 Token: ${token.slice(0, 15)}...${token.slice(-10)} (Độ dài: ${token.length})`)

// Giải mã payload JWT
try {
  const payloadBase64 = token.split('.')[1]
  const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8')
  const payload = JSON.parse(payloadJson)
  console.log('👤 Tài khoản trong token:', payload.email)
  console.log('🏢 ID Công ty (company_id):', payload.company_id)
  console.log('🆔 ID Nhân viên (employee_id):', payload.employee_id)
  const expDate = new Date(payload.exp * 1000)
  console.log(`⏳ Hạn dùng token: ${expDate.toLocaleString('vi-VN')} (${expDate > new Date() ? '✅ Còn hiệu lực' : '❌ Đã hết hạn'})`)
} catch (e) {
  console.log('⚠️ Không thể giải mã JWT payload:', e.message)
}

const headers = {
  'Authorization': `Bearer ${token}`,
  'Cookie': `token=${token}`,
  'Accept': 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'client-os': 'WEB',
  'Accept-Language': 'vi',
}

async function testEndpoint(name, url) {
  console.log(`\n----------------------------------------------------------------`)
  console.log(`📡 Đang gọi: [${name}] -> ${url}`)
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })
    console.log(`👉 Trạng thái HTTP: ${res.status} ${res.statusText}`)
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = text.slice(0, 300)
    }
    return { ok: res.ok, status: res.status, data }
  } catch (err) {
    console.error(`❌ Lỗi kết nối tới ${name}:`, err.message)
    return { ok: false, error: err.message }
  }
}

async function run() {
  // Danh sách các endpoint kiểm tra
  const endpoints = [
    { name: 'Profile / Account Info', url: `https://hrm.ipos.vn/api/v2/account/profile` },
    { name: 'Employee List (API v2)', url: `https://hrm.ipos.vn/api/v2/employee/list` },
    { name: 'Shift List (API v2)', url: `https://hrm.ipos.vn/api/v2/shift/list` },
    { name: 'Work Schedule (HBP)', url: `https://hrm.ipos.vn/api/v2/work-schedule/list?store_id=${storeIdHbp}&from_date=2026-10-01&to_date=2026-10-31` },
    { name: 'Work Schedule (429)', url: `https://hrm.ipos.vn/api/v2/work-schedule/list?store_id=${storeId429}&from_date=2026-10-01&to_date=2026-10-31` },
  ]

  const results = {}
  for (const ep of endpoints) {
    results[ep.name] = await testEndpoint(ep.name, ep.url)
  }

  console.log('\n================================================================')
  console.log('📊 TỔNG KẾT KẾT QUẢ GỌI API THỰC TẾ')
  console.log('================================================================')
  for (const [name, res] of Object.entries(results)) {
    console.log(`\n▶️ [${name}]: Status ${res.status}`)
    if (res.data) {
      if (typeof res.data === 'object') {
        const preview = JSON.stringify(res.data, null, 2)
        console.log(preview.slice(0, 800) + (preview.length > 800 ? '\n... (đã rút gọn)' : ''))
      } else {
        console.log(res.data)
      }
    }
  }
}

run()
