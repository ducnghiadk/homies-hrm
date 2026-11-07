import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getEffectiveHourlyRate, calculateHourlyEarnings } from './payroll-calculator.ts'

describe('Payroll Calculator Module', () => {
  it('prioritizes personal hourly_rate for part-time employee', () => {
    const employee = {
      id: 'emp-01',
      hourly_rate: 25000,
      official_salary: 5000000,
      contract_type: 'ban_thoi_gian',
    }
    const position = {
      id: 'pos-01',
      base_salary: 6000000,
    }

    const rate = getEffectiveHourlyRate(employee, position)
    assert.equal(rate, 25000)
  })

  it('falls back to converted official_salary if hourly_rate is undefined', () => {
    const employee = {
      id: 'emp-02',
      official_salary: 6240000, // 6,240,000 / 26 / 8 = 30,000
    }

    const rate = getEffectiveHourlyRate(employee, null)
    assert.equal(rate, 30000)
  })

  it('falls back to default minimum F&B rate (22000) when no rate or salary specified', () => {
    const employee = { id: 'emp-03' }
    const rate = getEffectiveHourlyRate(employee, null)
    assert.equal(rate, 22000)
  })

  it('calculates hourly earnings correctly including overtime', () => {
    const result = calculateHourlyEarnings({
      totalHours: 50,
      hourlyRate: 20000,
      overtimeHours: 10,
      overtimeMultiplier: 1.5,
    })

    assert.equal(result.normalHours, 40)
    assert.equal(result.baseEarned, 800000)
    assert.equal(result.overtimeAmount, 300000) // 10 * 20000 * 1.5
    assert.equal(result.totalEarned, 1100000)
  })
})
