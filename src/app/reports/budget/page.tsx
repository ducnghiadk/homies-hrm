'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockStores, mockEmployees, getSchedulesByStoreWeek, isStoreMatch } from '@/lib/mock-data'
import { storeAdapter, employeeAdapter } from '@/lib/adapters'
import { EmployeeService } from '@/lib/services/employees/employee-service'
import {
  calculateWeeklyCost, getEmployeeWeeklyCost, getCostByPosition,
  fmt, fmtFull,
} from '@/lib/mock-data-labor-cost'

// Generate week dates helper
function getWeekDates(weekOffset: number): string[] {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export default function LaborCostReportPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isHydrated] = useState(() => typeof window !== 'undefined')
  const [selectedStore, setSelectedStore] = useState('store-001')
  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'positions' | 'employees'>('overview')
  const [stores, setStores] = useState(mockStores)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    storeAdapter.getStores().then(res => setStores(res))
    employeeAdapter.getAllEmployees().then(res => {
      if (res && res.length) {
        EmployeeService.syncEmployeesFromAdapter(res)
        setRefreshTrigger(k => k + 1)
      }
    })
  }, [])

  useEffect(() => { if (isHydrated && !isAuthenticated) router.push('/login') }, [isHydrated, isAuthenticated, router])

  // Calculate 4-week data (before early return)
  const weeksData = useMemo(() => {
    return [-3, -2, -1, 0].map(offset => {
      const dates = getWeekDates(offset)
      const schedules = getSchedulesByStoreWeek(selectedStore, dates)
      const cost = calculateWeeklyCost(selectedStore, dates, schedules)
      return { offset, dates, cost, label: `Tuần ${offset === 0 ? 'này' : offset === -1 ? 'trước' : `${Math.abs(offset)} tuần trước`}` }
    })
  }, [selectedStore])

  // Position breakdown for current week
  const posBreakdown = useMemo(() => {
    const dates = getWeekDates(0)
    const schedules = getSchedulesByStoreWeek(selectedStore, dates)
    return getCostByPosition(selectedStore, dates, schedules)
  }, [selectedStore])

  // Employee breakdown
  const empBreakdown = useMemo(() => {
    const dates = getWeekDates(0)
    const schedules = getSchedulesByStoreWeek(selectedStore, dates)
    const allEmps = user ? EmployeeService.getEmployees(user) : []
    const storeEmps = allEmps.filter(
      e => isStoreMatch(e.store_id, selectedStore) && (e.role === 'employee' || e.role === 'shift_leader')
    )
    return storeEmps.map(emp => getEmployeeWeeklyCost(emp.id, dates, schedules)).filter(e => e.totalHours > 0).sort((a, b) => b.totalCost - a.totalCost)
  }, [selectedStore, user, refreshTrigger])

  // Store comparison
  const storesData = useMemo(() => {
    const dates = getWeekDates(0)
    return stores.filter(s => s.is_active).map(store => {
      const schedules = getSchedulesByStoreWeek(store.id, dates)
      const cost = calculateWeeklyCost(store.id, dates, schedules)
      return { store, cost }
    })
  }, [stores])

  if (!isHydrated || !user) return null

  const thisWeek = weeksData[3]
  const maxCost = Math.max(...weeksData.map(w => w.cost.totalCost), thisWeek.cost.budget)

  const pctColor = (pct: number) => pct > 100 ? '#D9381E' : pct > 80 ? '#F6C85F' : '#1E9E57'

  const tabs = [
    { key: 'overview' as const, label: 'Tổng quan' },
    { key: 'stores' as const, label: 'Cửa hàng' },
    { key: 'positions' as const, label: 'Vị trí' },
    { key: 'employees' as const, label: 'Nhân viên' },
  ]

  return (
    <AppShell title="Chi phí lương">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--gray-100)' }}>
          {tabs.map(t => (
            <button key={t.key}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activeTab === t.key ? '#fff' : 'transparent',
                color: activeTab === t.key ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => setActiveTab(t.key)}
            >{t.label}</button>
          ))}
        </div>

        {/* ─── TAB: Tổng quan ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Store selector */}
            <select className="w-full p-2 rounded-xl text-sm border" style={{ borderColor: 'var(--gray-200)', background: 'var(--gray-50)' }}
              value={selectedStore} onChange={e => setSelectedStore(e.target.value)}>
              {stores.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {/* Summary card */}
            <div className="card" style={{
              background: `linear-gradient(135deg, ${pctColor(thisWeek.cost.percent)}, ${thisWeek.cost.percent > 100 ? '#dc2626' : thisWeek.cost.percent > 80 ? '#d97706' : '#059669'})`,
              color: '#fff'
            }}>
              <div className="text-xs opacity-80">Tuần này</div>
              <div className="text-2xl font-bold mt-1">{thisWeek.cost.percent}%</div>
              <div className="w-full h-2 rounded-full mt-2" style={{ background: 'rgba(255,255,255,0.3)' }}>
                <div className="h-2 rounded-full bg-white transition-all" style={{ width: `${Math.min(thisWeek.cost.percent, 100)}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div><div className="text-xs opacity-70">Ngân sách</div><div className="text-sm font-bold">{fmt(thisWeek.cost.budget)}</div></div>
                <div><div className="text-xs opacity-70">Thực tế</div><div className="text-sm font-bold">{fmt(thisWeek.cost.totalCost)}</div></div>
                <div>
                  <div className="text-xs opacity-70">{thisWeek.cost.remaining >= 0 ? 'Còn lại' : 'Vượt'}</div>
                  <div className="text-sm font-bold">{fmt(Math.abs(thisWeek.cost.remaining))}</div>
                </div>
              </div>
            </div>

            {/* Weekly chart */}
            <div className="card">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📊 So sánh 4 tuần</h3>
              <div className="space-y-3">
                {weeksData.map(w => (
                  <div key={w.offset}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{w.label}</span>
                      <span className="font-medium" style={{ color: pctColor(w.cost.percent) }}>
                        {fmt(w.cost.totalCost)} / {fmt(w.cost.budget)} ({w.cost.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full relative" style={{ background: 'var(--gray-100)' }}>
                      {/* Budget marker */}
                      {maxCost > 0 && (
                        <div className="absolute top-0 h-3 border-r-2 border-dashed" style={{
                          left: `${(w.cost.budget / maxCost) * 100}%`,
                          borderColor: 'var(--text-muted)',
                        }} />
                      )}
                      <div className="h-3 rounded-full transition-all" style={{
                        width: `${maxCost > 0 ? (w.cost.totalCost / maxCost) * 100 : 0}%`,
                        background: pctColor(w.cost.percent),
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: Cửa hàng ─── */}
        {activeTab === 'stores' && (
          <div className="space-y-3">
            {storesData.map(({ store, cost }) => (
              <div key={store.id} className="card">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>🏪 {store.name}</div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: pctColor(cost.percent) + '20', color: pctColor(cost.percent) }}>
                    {cost.percent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full mb-2" style={{ background: 'var(--gray-100)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(cost.percent, 100)}%`, background: pctColor(cost.percent) }} />
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Budget: {fmt(cost.budget)}</span>
                  <span>Thực tế: {fmt(cost.totalCost)}</span>
                  <span style={{ color: cost.remaining >= 0 ? '#1E9E57' : '#D9381E' }}>
                    {cost.remaining >= 0 ? '-' : '+'}{fmt(Math.abs(cost.remaining))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── TAB: Vị trí ─── */}
        {activeTab === 'positions' && (
          <div className="space-y-3">
            <select className="w-full p-2 rounded-xl text-sm border" style={{ borderColor: 'var(--gray-200)', background: 'var(--gray-50)' }}
              value={selectedStore} onChange={e => setSelectedStore(e.target.value)}>
              {stores.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {posBreakdown.length === 0 ? (
              <div className="card text-center text-xs" style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>
            ) : (
              posBreakdown.map(p => (
                <div key={p.position_id} className="card">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.position_name}</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{p.percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full mb-2" style={{ background: 'var(--gray-100)' }}>
                    <div className="h-2 rounded-full" style={{ width: `${p.percent}%`, background: 'var(--primary)' }} />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{p.totalHours}h giờ công</span>
                    <span className="font-medium">{fmtFull(p.totalCost)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TAB: Nhân viên ─── */}
        {activeTab === 'employees' && (
          <div className="space-y-3">
            <select className="w-full p-2 rounded-xl text-sm border" style={{ borderColor: 'var(--gray-200)', background: 'var(--gray-50)' }}
              value={selectedStore} onChange={e => setSelectedStore(e.target.value)}>
              {stores.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {empBreakdown.length === 0 ? (
              <div className="card text-center text-xs" style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>
            ) : (
              <div className="card">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                      <th className="text-left py-2" style={{ color: 'var(--text-secondary)' }}>Nhân viên</th>
                      <th className="text-right py-2" style={{ color: 'var(--text-secondary)' }}>Giờ</th>
                      <th className="text-right py-2" style={{ color: 'var(--text-secondary)' }}>OT</th>
                      <th className="text-right py-2" style={{ color: 'var(--text-secondary)' }}>Chi phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empBreakdown.map(e => (
                      <tr key={e.employee_id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td className="py-2" style={{ color: 'var(--text-primary)' }}>{e.employee_name}</td>
                        <td className="text-right py-2" style={{ color: 'var(--text-muted)' }}>{e.totalHours}h</td>
                        <td className="text-right py-2" style={{ color: e.overtimeHours > 0 ? '#F6C85F' : 'var(--text-muted)' }}>
                          {e.overtimeHours > 0 ? `${e.overtimeHours}h` : '-'}
                        </td>
                        <td className="text-right py-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {fmtFull(e.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--gray-200)' }}>
                      <td className="py-2 font-bold" style={{ color: 'var(--text-primary)' }}>Tổng</td>
                      <td className="text-right py-2 font-bold" style={{ color: 'var(--text-primary)' }}>
                        {empBreakdown.reduce((s, e) => s + e.totalHours, 0)}h
                      </td>
                      <td className="text-right py-2 font-bold text-warning-500">
                        {empBreakdown.reduce((s, e) => s + e.overtimeHours, 0)}h
                      </td>
                      <td className="text-right py-2 font-bold" style={{ color: 'var(--primary)' }}>
                        {fmtFull(empBreakdown.reduce((s, e) => s + e.totalCost, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
