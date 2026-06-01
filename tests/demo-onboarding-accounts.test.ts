import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const employeeServiceSource = readFileSync(resolve(process.cwd(), 'src/lib/services/employee-service.ts'), 'utf8')

test('demo onboarding accounts are seeded in employee service', () => {
  assert.match(employeeServiceSource, /thuy@bobahouse\.vn/)
  assert.match(employeeServiceSource, /Tran Minh Thuy/)
  assert.match(employeeServiceSource, /nam\.p@bobahouse\.vn/)
  assert.match(employeeServiceSource, /Le Phuong Nam/)
})
