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
const activeEmployees = (json.data || []).filter(e => e.status === 'WORKING')

console.log('--- 17 NHÂN SỰ ĐANG LÀM VIỆC (WORKING) CHI TIẾT ---')
activeEmployees.forEach((e, idx) => {
  console.log(`${idx + 1}. ${e.full_name} (${e.code}):`, {
    store_id: e.store_id,
    store_working_id: e.store_working_id,
    dept_id: e.dept_id,
    type_id: e.type_id,
    level_id: e.level_id,
    role_id: e.role_id,
    salary: e.salary,
    tax_no: e.tax_no,
  })
})
