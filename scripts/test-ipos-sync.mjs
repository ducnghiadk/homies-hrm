import assert from 'assert'

async function run() {
  console.log('--- TEST 1: Health check GET /api/ipos/sync ---')
  const resHealth = await fetch('http://localhost:3535/api/ipos/sync')
  assert.strictEqual(resHealth.status, 200, `Health check expected 200 but got ${resHealth.status}`)
  const healthJson = await resHealth.json()
  assert.strictEqual(healthJson.status, 'ready')
  console.log('✅ GET /api/ipos/sync returned status: ready')

  console.log('\n--- TEST 2: Sync mock iPOS employees & payroll ---')
  const payload = {
    source: 'ipos_hrm',
    module: 'payroll',
    store_raw_code: 'HBP',
    period: '2026-08',
    raw_data: [
      {
        employeeCode: 'BH-9852',
        employeeName: 'Huỳnh Lê Kiều Linh',
        position: 'Quản lý cửa hàng',
        regularHours: 186.65,
        hourlyRate: 25000,
        netSalary: 3599500
      }
    ],
    timestamp: new Date().toISOString()
  }

  const resPost = await fetch('http://localhost:3535/api/ipos/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  assert.strictEqual(resPost.status, 200, `POST expected 200 but got ${resPost.status}`)
  const postJson = await resPost.json()
  assert.strictEqual(postJson.success, true, 'Response success should be true')
  assert.strictEqual(postJson.count >= 1, true, 'Count should be at least 1')
  console.log('✅ POST /api/ipos/sync processed payload successfully:', postJson)

  console.log('\n🎉 [PASS] All iPOS sync tests succeeded!')
}

run().catch((err) => {
  console.error('\n❌ [FAIL]', err.message)
  process.exit(1)
})
