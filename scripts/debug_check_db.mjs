import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'server-db.json')
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))

console.log('--- EMPLOYEES ---')
db.employees.forEach(e => {
  console.log(`${e.id} | ${e.employee_code} | ${e.full_name} | store: ${e.store_id} | hourly: ${e.hourly_rate} | base: ${e.base_salary}`)
})

console.log('\n--- CURRENT SALARY SLIPS ---')
db.salary_slips.forEach(s => {
  console.log(`${s.store_id} | ${s.employee_name} (${s.employee_code}) | hours: ${s.total_hours} | base: ${s.base_salary} | bonus: ${s.bonus} | net: ${s.net_salary}`)
})

console.log('\n--- PAYROLL SUMMARIES ---')
console.log(db.payroll_summaries)
