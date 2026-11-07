// scripts/test-qa-final.mjs
// Automated verification for the 4 final Master QA audit items

const BASE_URL = 'http://localhost:3535'

async function runTests() {
  console.log('=== STARTING FINAL QA VERIFICATION ===\n')
  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`)
      passed++
    } else {
      console.error(`  FAIL: ${message}`)
      failed++
    }
  }

  // TEST 1: Redirect mappings
  console.log('[1] Checking 4 URL Redirect Mappings (No 404):')
  const redirectChecks = [
    { from: '/branches', to: '/stores' },
    { from: '/leave/approvals', to: '/leave/approval' },
    { from: '/tasks', to: '/tasks/daily' },
    { from: '/career-path/promotions', to: '/career-path' },
  ]

  for (const item of redirectChecks) {
    try {
      const res = await fetch(`${BASE_URL}${item.from}`, {
        redirect: 'manual',
      })
      const isRedirect = res.status === 307 || res.status === 308 || res.status === 302
      const location = res.headers.get('location')
      const targetMatches = location ? location.endsWith(item.to) : false
      assert(isRedirect && targetMatches, `${item.from} redirects (${res.status}) to ${item.to}`)
    } catch (err) {
      assert(false, `${item.from} check failed: ${err.message}`)
    }
  }

  // TEST 2: Real shifts & requests count
  console.log('\n[2] Checking Real Shifts for HBP & 429:')
  try {
    const resHbp = await fetch(`${BASE_URL}/api/shifts?store_id=store-001`)
    const jsonHbp = await resHbp.json()
    assert(jsonHbp.success && jsonHbp.count > 0, `HBP (store-001) shifts returned count = ${jsonHbp.count}`)

    const res429 = await fetch(`${BASE_URL}/api/shifts?store_id=store-002`)
    const json429 = await res429.json()
    assert(json429.success && json429.count > 0, `429 (store-002) shifts returned count = ${json429.count}`)
  } catch (err) {
    assert(false, `Shifts API failed: ${err.message}`)
  }

  console.log('\n[3] Checking Pending Requests Badge Count:')
  try {
    const resReq = await fetch(`${BASE_URL}/api/requests?status=pending`)
    const jsonReq = await resReq.json()
    assert(jsonReq.success && typeof jsonReq.count === 'number', `Pending requests returned real count = ${jsonReq.count}`)
  } catch (err) {
    assert(false, `Pending requests API failed: ${err.message}`)
  }

  // TEST 3: Shift swap via POST /api/requests
  console.log('\n[4] Testing Shift Swap creation via POST /api/requests (type: shift_swap):')
  try {
    const swapPayload = {
      employee_id: 'emp-nv0013',
      employee_name: 'Nguyễn Thị Tú Trinh',
      store_id: 'store-001',
      type: 'shift_swap',
      title: 'Đổi ca ngày 2026-09-20 với Quách Thị Kim Chi',
      reason: 'Bận việc gia đình đột xuất',
      date: '2026-09-20',
      status: 'PENDING',
      notes: JSON.stringify({
        targetUserId: 'emp-nv0030',
        targetUserName: 'Quách Thị Kim Chi',
        swapType: 'swap',
      }),
    }
    const resSwap = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapPayload),
    })
    const jsonSwap = await resSwap.json()
    assert(jsonSwap.success && jsonSwap.data?.type === 'shift_swap' && jsonSwap.data?.status === 'PENDING', `Shift swap successfully created with ID: ${jsonSwap.data?.id}`)
  } catch (err) {
    assert(false, `Shift swap creation failed: ${err.message}`)
  }

  // TEST 4: Check-out via POST /api/attendance
  console.log('\n[5] Testing Check-out submission via POST /api/attendance (status: check_out):')
  try {
    // 1. Check in first
    const checkinPayload = {
      employee_id: 'emp-nv0024',
      employee_name: 'Tấn Hiếu',
      store_id: 'store-001',
      date: '2026-09-16',
      shift_id: 'shift-001',
      check_in_time: '2026-09-16T06:00:00.000Z',
      check_in_lat: 10.822435,
      check_in_lng: 106.762649,
      check_in_distance_meters: 10,
    }
    await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkinPayload),
    })

    // 2. Check out
    const checkoutPayload = {
      employee_id: 'emp-nv0024',
      employee_name: 'Tấn Hiếu',
      store_id: 'store-001',
      date: '2026-09-16',
      status: 'check_out',
      action: 'check_out',
      check_out_time: '2026-09-16T14:05:00.000Z',
      check_out_lat: 10.822435,
      check_out_lng: 106.762649,
      shift_id: 'shift-001',
    }
    const resOut = await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload),
    })
    const jsonOut = await resOut.json()
    assert(jsonOut.success && jsonOut.data?.status === 'check_out' && jsonOut.data?.total_hours > 0, `Check-out recorded on server with hours = ${jsonOut.data?.total_hours}`)
  } catch (err) {
    assert(false, `Check-out failed: ${err.message}`)
  }

  console.log(`\n=== FINAL QA SUMMARY: ${passed} PASSED / ${failed} FAILED ===\n`)
  if (failed > 0) process.exit(1)
}

runTests()
