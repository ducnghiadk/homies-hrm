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
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
  'client-os': 'WEB',
  'Accept-Language': 'vi',
}

async function run() {
  const resShift = await fetch('https://hrm.ipos.vn/api/v2/shift/list', { headers })
  const jsonShift = await resShift.json()
  const shiftList = jsonShift.data || []
  console.log(`TOTAL SHIFTS: ${shiftList.length}`)
  shiftList.forEach((s, idx) => {
    console.log(`${idx + 1}. [${s.name}] | ${s.time_start} - ${s.time_end} | type: ${s.type} | is_active: ${s.is_active}`)
  })
}

run()
