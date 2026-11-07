import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = (match[2] || '').trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    env[match[1]] = value
  }
}

const token = env.IPOS_HRM_TOKEN
const headers = {
  'Authorization': `Bearer ${token}`,
  'Cookie': `token=${token}`,
  'Accept': 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'client-os': 'WEB',
  'Accept-Language': 'vi',
}

async function showRealData() {
  // 1. Lấy danh sách nhân viên
  const resEmp = await fetch('https://hrm.ipos.vn/api/v2/employee/list', { headers })
  const jsonEmp = await resEmp.json()
  const allEmployees = jsonEmp.data || []

  // Phân loại nhân viên đang làm việc vs đã nghỉ
  const activeEmployees = allEmployees.filter((e) => e.status === 'WORKING')
  const resignedEmployees = allEmployees.filter((e) => e.status !== 'WORKING')

  // 2. Lấy danh mục ca làm việc (Shifts)
  const resShift = await fetch('https://hrm.ipos.vn/api/v2/shift/list', { headers })
  const jsonShift = await resShift.json()
  const shiftList = jsonShift.data || []

  console.log('================================================================')
  console.log(`📋 TỔNG HỢP NHÂN SỰ TỪ MÁY CHỦ IPOS HRM (Tổng hồ sơ: ${allEmployees.length})`)
  console.log('================================================================')
  console.log(`🟢 Đang làm việc thực tế (WORKING): ${activeEmployees.length} nhân sự`)
  console.log(`⚪ Đã nghỉ việc trong lịch sử:      ${resignedEmployees.length} nhân sự`)

  console.log('\n================================================================')
  console.log(`🟢 DANH SÁCH ${activeEmployees.length} NHÂN VIÊN ĐANG HOẠT ĐỘNG THỰC TẾ:`)
  console.log('================================================================')
  activeEmployees.forEach((e, idx) => {
    const code = e.code && e.code !== '-' ? e.code : '(Chưa cấp mã)'
    const name = e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim()
    const phone = e.phone || '-'
    const email = e.email || '-'
    const join = e.join_date || '-'
    console.log(`${idx + 1}. [${code}] ${name} | SĐT: ${phone} | Ngày vào: ${join} | Email: ${email}`)
  })

  console.log('\n================================================================')
  console.log(`⏰ DANH SÁCH CA LÀM VIỆC CẤU HÌNH TRÊN IPOS HRM (${shiftList.length} ca):`)
  console.log('================================================================')
  shiftList.slice(0, 15).forEach((s, idx) => {
    const name = s.name || 'Không tên'
    const start = s.time_start || '--:--'
    const end = s.time_end || '--:--'
    console.log(`${idx + 1}. ${name} (${start} - ${end})`)
  })
}

showRealData()
