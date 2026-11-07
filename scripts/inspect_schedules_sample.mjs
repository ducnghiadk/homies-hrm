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
const resHbp = await fetch(`https://hrm.ipos.vn/api/v2/work-schedule/list?store_id=${env.STORE_ID_HBP}&from_date=2026-10-01&to_date=2026-10-05`, {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Cookie': 'token=' + token,
    'client-os': 'WEB',
    'Accept': 'application/json'
  }
})
const jsonHbp = await resHbp.json()
console.log('HBP Schedule count (1-5 Oct):', jsonHbp.data?.length)
if (jsonHbp.data?.length > 0) {
  console.log('Sample HBP item:', JSON.stringify(jsonHbp.data[0], null, 2))
}

const res429 = await fetch(`https://hrm.ipos.vn/api/v2/work-schedule/list?store_id=${env.STORE_ID_429}&from_date=2026-10-01&to_date=2026-10-05`, {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Cookie': 'token=' + token,
    'client-os': 'WEB',
    'Accept': 'application/json'
  }
})
const json429 = await res429.json()
console.log('429 Schedule count (1-5 Oct):', json429.data?.length)
if (json429.data?.length > 0) {
  console.log('Sample 429 item:', JSON.stringify(json429.data[0], null, 2))
}
