import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

// ============================================================================
// 📝 HƯỚNG DẪN DÀNH CHO BẠN:
// Bạn có thể điền Email và Mật khẩu iPOS của bạn vào 2 dòng bên dưới:
// (Sau đó lưu lại file và chạy lệnh `node scripts/login_ipos_get_token.mjs`)
// Nếu để trống, script sẽ tự động hỏi bạn nhập trên màn hình khi chạy.
// ============================================================================
const IPOS_EMAIL = ''       // 👈 Điền Email/Tài khoản iPOS vào giữa dấu nháy (ví dụ: "quanly@homies.vn")
const IPOS_PASSWORD = ''    // 👈 Điền Mật khẩu iPOS vào giữa dấu nháy (ví dụ: "MatKhauCuaBan123")
// ============================================================================

const IPOS_BASE_URL = 'https://hrm.ipos.vn'

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close()
      resolve(ans.trim())
    })
  )
}

async function getCredentials() {
  // 1. Kiểm tra nếu có truyền qua tham số dòng lệnh: node scripts/login_ipos_get_token.mjs email pass
  const args = process.argv.slice(2)
  if (args.length >= 2 && args[0] && args[1]) {
    return { email: args[0].trim(), password: args[1].trim() }
  }

  // 2. Kiểm tra nếu đã điền trực tiếp ở đầu file này
  if (IPOS_EMAIL && IPOS_PASSWORD) {
    return { email: IPOS_EMAIL.trim(), password: IPOS_PASSWORD.trim() }
  }

  // 3. Hỏi trực tiếp trên giao diện dòng lệnh
  console.log('\n🔑 Vui lòng nhập thông tin tài khoản iPOS HRM của bạn:')
  let email = IPOS_EMAIL
  if (!email) {
    email = await askQuestion('👉 Nhập Email / Tên đăng nhập iPOS: ')
  }
  let password = IPOS_PASSWORD
  if (!password) {
    password = await askQuestion('👉 Nhập Mật khẩu iPOS: ')
  }

  return { email, password }
}

async function loginToIpos(email, password) {
  console.log(`\n⏳ Đang kết nối tới máy chủ ${IPOS_BASE_URL} để đăng nhập...`)

  const deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().toUpperCase()
    : 'HOMIES-HRM-TOKEN-FETCHER-2026'

  const bodyParams = new URLSearchParams()
  bodyParams.append('username', email)
  bodyParams.append('password', password)
  bodyParams.append('web_app_name', 'HRM_WEB')
  bodyParams.append('web_app_version', '1.0.0')
  bodyParams.append('os_name', 'Windows')
  bodyParams.append('os_version', '10')
  bodyParams.append('device_name', 'Chrome')
  bodyParams.append('device_model', '128.0.0.0')
  bodyParams.append('device_id', deviceId)
  bodyParams.append('device_push_id', '')

  const res = await fetch(`${IPOS_BASE_URL}/api/v2/account/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Origin': IPOS_BASE_URL,
      'Referer': `${IPOS_BASE_URL}/account/login`,
      'client-os': 'WEB',
      'Accept-Language': 'vi',
    },
    body: bodyParams.toString(),
    signal: AbortSignal.timeout(15000),
  })

  // Tìm token trong Cookie nếu có
  let cookieToken = null
  const setCookieHeaders = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean)

  for (const cookieStr of setCookieHeaders) {
    const match = cookieStr.match(/(?:^|;\s*)token=([^;]+)/)
    if (match) {
      cookieToken = decodeURIComponent(match[1])
      break
    }
  }

  const json = await res.json().catch(() => null)

  if (!json && !res.ok) {
    throw new Error(`Máy chủ iPOS phản hồi mã lỗi HTTP ${res.status}`)
  }

  if (json?.error?.message) {
    throw new Error(`iPOS HRM báo lỗi: ${json.error.message}`)
  }

  const token =
    json?.access_token ||
    json?.token ||
    json?.accessToken ||
    json?.data?.access_token ||
    json?.data?.accessToken ||
    json?.data?.token ||
    cookieToken

  if (!token) {
    throw new Error('Đăng nhập không thành công: Máy chủ iPOS không trả về mã Token.')
  }

  const accountInfo = json?.account_info || json?.data?.account_info || json?.user || json?.data?.user || {}
  const fullName =
    accountInfo.first_name && accountInfo.last_name
      ? `${accountInfo.first_name} ${accountInfo.last_name}`.trim()
      : accountInfo.fullName || accountInfo.name || email

  return {
    token,
    fullName,
    raw: json,
  }
}

function updateEnvLocalFile(token) {
  const envPath = path.resolve(process.cwd(), '.env.local')

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `IPOS_HRM_TOKEN="${token}"\n`, 'utf8')
    return
  }

  let content = fs.readFileSync(envPath, 'utf8')

  // Kiểm tra nếu đã có dòng IPOS_HRM_TOKEN
  const tokenRegex = /^IPOS_HRM_TOKEN=.*$/m
  if (tokenRegex.test(content)) {
    content = content.replace(tokenRegex, `IPOS_HRM_TOKEN="${token}"`)
  } else {
    content += `\nIPOS_HRM_TOKEN="${token}"\n`
  }

  fs.writeFileSync(envPath, content, 'utf8')
}

async function main() {
  console.log('======================================================================')
  console.log('🚀 TỰ ĐỘNG ĐĂNG NHẬP iPOS HRM CLOUD & CẬP NHẬT TOKEN VÀO .ENV.LOCAL')
  console.log('======================================================================')

  try {
    const { email, password } = await getCredentials()

    if (!email || !password) {
      console.log('❌ Lỗi: Tài khoản và mật khẩu không được để trống.')
      process.exitCode = 1
      return
    }

    const { token, fullName } = await loginToIpos(email, password)

    console.log(`\n🎉 ĐĂNG NHẬP THÀNH CÔNG!`)
    console.log(`👤 Xin chào: ${fullName}`)
    console.log(`🔑 Mã Token đã lấy được: ${token.slice(0, 15)}...${token.slice(-10)} (Độ dài: ${token.length} ký tự)`)

    // Ghi vào file .env.local
    updateEnvLocalFile(token)
    console.log(`💾 ĐÃ LƯU TOKEN VÀO FILE .env.local THÀNH CÔNG!`)

    console.log('\n======================================================================')
    console.log('✅ BƯỚC TIẾP THEO:')
    console.log('1. Khởi động lại ứng dụng bằng cách chạy: npm run restart')
    console.log('   (Hoặc click đúp file restart-hrm-dev.bat trên máy)')
    console.log('2. Mở trình duyệt vào app HRM, dữ liệu sẽ tự động đồng bộ từ iPOS Cloud!')
    console.log('======================================================================\n')
  } catch (error) {
    console.error(`\n❌ THẤT BẠI: ${error.message || error}`)
    console.log('💡 Gợi ý: Hãy kiểm tra lại chính xác Email và Mật khẩu bạn dùng khi đăng nhập trang https://hrm.ipos.vn\n')
    process.exitCode = 1
  }
}

main()
