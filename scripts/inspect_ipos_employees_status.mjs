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
const res = await fetch('https://hrm.ipos.vn/api/v2/employee/list', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Cookie': 'token=' + token,
    'client-os': 'WEB',
    'Accept': 'application/json'
  }
})

const json = await res.json()
const employees = json.data || []

const counts = {}
const workingList = []
const resignedList = []

employees.forEach((e) => {
  const st = e.status || 'UNKNOWN'
  counts[st] = (counts[st] || 0) + 1
  if (st === 'WORKING') {
    workingList.push(e)
  } else {
    resignedList.push(e)
  }
})

console.log('================================================================')
console.log(`📊 PHÂN LOẠI TRẠNG THÁI 119 NHÂN VIÊN TRÊN IPOS HRM:`)
console.log('================================================================')
for (const [st, count] of Object.entries(counts)) {
  let label = st
  if (st === 'WORKING') label = '🟢 Đang làm việc (WORKING)'
  if (st === 'SELF_RESIGNED') label = '🔴 Tự xin nghỉ việc (SELF_RESIGNED)'
  if (st === 'MANAGER_RESIGNED') label = '🟠 Quản lý cho thôi việc (MANAGER_RESIGNED)'
  console.log(`- ${label}: ${count} người`)
}

console.log(`\n=> TỔNG SỐ ĐANG LÀM VIỆC THỰC TẾ: ${workingList.length} người`)
console.log(`=> TỔNG SỐ ĐÃ NGHỈ VIỆC: ${resignedList.length} người\n`)

console.log('================================================================')
console.log(`🟢 CHI TIẾT ${workingList.length} NHÂN VIÊN ĐANG LÀM VIỆC THỰC TẾ (WORKING):`)
console.log('================================================================')
workingList.forEach((e, idx) => {
  const code = e.code && e.code !== '-' ? e.code : '(Chưa cấp mã)'
  const phone = e.phone || '-'
  const email = e.email || '-'
  const join = e.join_date || '-'
  console.log(`${idx + 1}. [${code}] ${e.full_name} | SĐT: ${phone} | Vào làm: ${join} | Email: ${email}`)
})

console.log('\n================================================================')
console.log(`🔴 MẪU MỘT SỐ NHÂN VIÊN ĐÃ NGHỈ VIỆC TRÊN IPOS HRM:`)
console.log('================================================================')
resignedList.slice(0, 10).forEach((e, idx) => {
  const code = e.code && e.code !== '-' ? e.code : '(Chưa cấp mã)'
  const reason = e.status === 'SELF_RESIGNED' ? 'Tự xin nghỉ' : 'Quản lý cho nghỉ'
  const leave = e.leave_date || 'Không ghi ngày'
  console.log(`${idx + 1}. [${code}] ${e.full_name} | Ngày nghỉ: ${leave} | Lý do: ${reason}`)
})
