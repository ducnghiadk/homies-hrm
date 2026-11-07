import { bscAdapter } from '../src/lib/adapters/bsc-adapter.ts'
import { calculateBSCTeamBonus } from '../src/lib/bsc-engine.ts'

async function testBSC() {
  console.log('====================================================')
  console.log('--- TEST BSC CALCULATION CHO HỒ BÁ PHẤN (STORE-001) ---')
  console.log('====================================================')
  const targets1 = await bscAdapter.getRevenueTargets('store-001', '2026-08')
  const team1 = await bscAdapter.getEmployeePersonalData('store-001', '2026-08')
  const criteria = await bscAdapter.getCriteriaCatalog()
  
  const res1 = calculateBSCTeamBonus('store-001', '2026-08', targets1, team1, undefined, criteria)
  console.log('Store Result HBP:', res1.store_result.store_name)
  console.log('Total BSC Score HBP:', res1.store_result.total_bsc_score)
  console.log('Store Bonus Pool HBP:', (res1.store_result.store_bonus_pool || 0).toLocaleString('vi-VN'), 'đ')
  console.log('Team Bonus Allocations HBP:')
  res1.individual_results.forEach(a => {
    console.log(`- ${a.employee_name}: ${a.work_hours}h | Role: ${a.role} (K_role=${a.rank_coefficient}) | K_err=${a.personal_coefficient} | % Chia: ${a.share_percentage}% | Thưởng BSC: ${a.bonus_amount.toLocaleString('vi-VN')} đ | Trạng thái: ${!a.lock_reason ? 'Đủ điều kiện' : a.lock_reason}`)
  })

  console.log('\n====================================================')
  console.log('--- TEST BSC CALCULATION CHO ĐƯỜNG 429 (STORE-002) ---')
  console.log('====================================================')
  const targets2 = await bscAdapter.getRevenueTargets('store-002', '2026-08')
  const team2 = await bscAdapter.getEmployeePersonalData('store-002', '2026-08')
  const res2 = calculateBSCTeamBonus('store-002', '2026-08', targets2, team2, undefined, criteria)
  console.log('Store Result 429:', res2.store_result.store_name)
  console.log('Total BSC Score 429:', res2.store_result.total_bsc_score)
  console.log('Store Bonus Pool 429:', (res2.store_result.store_bonus_pool || 0).toLocaleString('vi-VN'), 'đ')
  console.log('Team Bonus Allocations 429:')
  res2.individual_results.forEach(a => {
    console.log(`- ${a.employee_name}: ${a.work_hours}h | Role: ${a.role} (K_role=${a.rank_coefficient}) | K_err=${a.personal_coefficient} | % Chia: ${a.share_percentage}% | Thưởng BSC: ${a.bonus_amount.toLocaleString('vi-VN')} đ | Trạng thái: ${!a.lock_reason ? 'Đủ điều kiện' : a.lock_reason}`)
  })
}

testBSC().catch(err => console.error(err))
