import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getDesktopSidebarEntries } from './sidebar-config.ts'

function getEntry(role: 'ceo' | 'store_manager', id: string) {
  return getDesktopSidebarEntries(role).find((entry) => entry.id === id)
}

describe('desktop sidebar KPI information architecture', () => {
  it('keeps the CEO KPI hub focused on the five approved destinations', () => {
    const kpiEntry = getEntry('ceo', 'kpi')

    assert.deepEqual(
      kpiEntry?.items?.map(({ href, label }) => ({ href, label })),
      [
        { href: '/kpi', label: 'Tổng quan KPI' },
        { href: '/kpi/review', label: 'Việc cần đánh giá' },
        { href: '/kpi/result', label: 'Kết quả & cải thiện' },
        { href: '/kpi/promotion', label: 'Sẵn sàng tăng bậc' },
        { href: '/kpi/settings', label: 'Chương trình đánh giá' },
      ]
    )
  })

  it('places BSC bonus and incidents in their operational hubs', () => {
    const payrollEntry = getEntry('store_manager', 'payroll')
    const operationsEntry = getEntry('store_manager', 'operations')

    assert.equal(payrollEntry?.label, 'Lương, thưởng & tạm ứng')
    assert.ok(payrollEntry?.items?.some((item) => item.href === '/bsc-bonus'))
    assert.ok(operationsEntry?.items?.some((item) => item.href === '/kpi/violations'))
  })

  it('keeps technical KPI subflows out of the desktop sidebar', () => {
    const hrefs = getDesktopSidebarEntries('ceo').flatMap((entry) =>
      entry.items?.map((item) => item.href) ?? (entry.href ? [entry.href] : [])
    )

    assert.equal(hrefs.filter((href) => href === '/kpi/reports').length, 1)
    assert.ok(!hrefs.includes('/kpi/periods'))
    assert.ok(!hrefs.includes('/kpi/violations/appeals'))
  })
})
