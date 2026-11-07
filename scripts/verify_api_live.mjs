async function test() {
  try {
    console.log('Sending request to http://localhost:3535/api/employees?status=active ...')
    const t0 = Date.now()
    const res = await fetch('http://localhost:3535/api/employees?status=active', {
      signal: AbortSignal.timeout(15000)
    })
    console.log(`HTTP Status: ${res.status} (${Date.now() - t0}ms)`)
    const json = await res.json()
    console.log('Source:', json.source)
    console.log('Total active count:', json.count)
    console.log('Employees sample:')
    json.data.slice(0, 5).forEach((e, i) => {
      console.log(`${i+1}. [${e.employee_code}] ${e.full_name} (${e.role}) - Lương: ${e.base_salary || e.hourly_rate} - Store: ${e.store_id}`);
    })

    console.log('\nSending request to http://localhost:3535/api/shifts?month=2026-10 ...')
    const resShifts = await fetch('http://localhost:3535/api/shifts?month=2026-10', {
      signal: AbortSignal.timeout(15000)
    })
    const jsonShifts = await resShifts.json()
    console.log('Shifts status:', resShifts.status, 'Total October shifts:', jsonShifts.count || jsonShifts.data?.length)
    if (jsonShifts.data?.length > 0) {
      console.log('Sample shift:', {
        name: jsonShifts.data[0].shift_name,
        emp: jsonShifts.data[0].employee_name,
        date: jsonShifts.data[0].date,
        hours: `${jsonShifts.data[0].start_time} - ${jsonShifts.data[0].end_time}`
      })
    }
  } catch (err) {
    console.log('Error testing API:', err.message)
  }
}
test()
