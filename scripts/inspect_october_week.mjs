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
  'Authorization': 'Bearer ' + token,
  'Cookie': 'token=' + token,
  'client-os': 'WEB',
  'Accept': 'application/json'
}

async function run() {
  const resHbp = await fetch(`https://hrm.ipos.vn/api/v2/work-schedule/list?store_id=${env.STORE_ID_HBP}&from_date=2026-10-05&to_date=2026-10-07`, { headers })
  const jsonHbp = await resHbp.json()
  console.log('--- IPOS ACTUAL SCHEDULES HBP (05/10 - 07/10) ---')
  ;(jsonHbp.data || []).forEach(d => {
    const emp = d.employee_data || {}
    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
    const shift = d.shift_data || {}
    console.log(`[${d.date}] ${name} (${emp.code}) | Ca: ${shift.name} [${shift.time_start} - ${shift.time_end}]`)
  })
}

run()
