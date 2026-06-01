'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  mockRevenueByStore, mockRevenueByMonth, mockLaborCost, mockTopProducts, formatVND
} from '@/lib/mock-data-p4'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default function ReportsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'revenue'|'labor'|'products'>('revenue')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const latestMonth = mockRevenueByMonth[mockRevenueByMonth.length - 1]
  const prevMonth = mockRevenueByMonth[mockRevenueByMonth.length - 2]
  const revenueChange = ((latestMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1)
  const profitChange = ((latestMonth.profit - prevMonth.profit) / prevMonth.profit * 100).toFixed(1)
  const maxRevenue = Math.max(...mockRevenueByMonth.map(m => m.revenue))

  return (
    <AppShell title="Báo cáo & Phân tích 📊">
      <div className="space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <div className="card-elevated p-3 text-center">
            <DollarSign size={18} className="mx-auto mb-1" style={{ color: 'var(--success)' }} />
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Doanh thu T2</div>
            <div className="text-sm font-black">{formatVND(latestMonth.revenue)}</div>
            <div className="text-xs font-bold" style={{ color: Number(revenueChange) >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {Number(revenueChange) >= 0 ? '↑' : '↓'} {revenueChange}%
            </div>
          </div>
          <div className="card-elevated p-3 text-center">
            <TrendingUp size={18} className="mx-auto mb-1" style={{ color: 'var(--primary)' }} />
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Lợi nhuận T2</div>
            <div className="text-sm font-black">{formatVND(latestMonth.profit)}</div>
            <div className="text-xs font-bold" style={{ color: Number(profitChange) >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {Number(profitChange) >= 0 ? '↑' : '↓'} {profitChange}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {[
            { k: 'revenue' as const, l: '💰 Doanh thu' },
            { k: 'labor' as const, l: '👥 Nhân sự' },
            { k: 'products' as const, l: '🧋 Sản phẩm' },
          ].map(({ k, l }) => (
            <button key={k} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: tab === k ? 'var(--primary)' : 'var(--gray-100)',
                color: tab === k ? 'white' : 'var(--text-secondary)',
              }} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* REVENUE */}
        {tab === 'revenue' && (
          <div className="space-y-4 animate-slide-up">
            {/* Revenue Chart */}
            <div className="card p-4">
              <h3 className="text-sm font-bold mb-3">📈 Doanh thu 6 tháng</h3>
              <div className="flex items-end gap-1.5 justify-between" style={{ height: 120 }}>
                {mockRevenueByMonth.map(m => {
                  const h = (m.revenue / maxRevenue) * 100
                  const profitH = (m.profit / maxRevenue) * 100
                  const label = m.month.split('-')[1]
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="text-[8px] font-bold">{formatVND(m.revenue).replace('đ', '')}</div>
                      <div className="w-full relative" style={{ height: `${h}%` }}>
                        <div className="absolute inset-0 rounded-t-sm" style={{ background: 'var(--primary)', opacity: 0.2 }} />
                        <div className="absolute bottom-0 left-0 right-0 rounded-t-sm" style={{ height: `${(profitH / h) * 100}%`, background: 'var(--success)', opacity: 0.7 }} />
                      </div>
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>T{label}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-3 justify-center">
                <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)', opacity: 0.3 }} /> Doanh thu</span>
                <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} /> Lợi nhuận</span>
              </div>
            </div>

            {/* Revenue by Store */}
            <div className="card p-4">
              <h3 className="text-sm font-bold mb-3">🏪 Doanh thu theo cửa hàng</h3>
              {mockRevenueByStore.map(store => {
                const maxRev = Math.max(...mockRevenueByStore.map(s => s.revenue))
                return (
                  <div key={store.store_id} className="py-2.5 border-t" style={{ borderColor: 'var(--gray-100)' }}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold">{store.name}</span>
                      <span className="text-xs font-bold">{formatVND(store.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--gray-200)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${(store.revenue / maxRev) * 100}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                      }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{store.orders.toLocaleString()} đơn</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>TB: {formatVND(store.avg_ticket)}/đơn</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* LABOR */}
        {tab === 'labor' && (
          <div className="space-y-4 animate-slide-up">
            <div className="card p-4">
              <h3 className="text-sm font-bold mb-3">👥 Chi phí nhân sự 6 tháng</h3>
              <div className="space-y-3">
                {mockLaborCost.map(m => {
                  const maxTotal = Math.max(...mockLaborCost.map(l => l.total))
                  const label = m.month.split('-')[1] + '/' + m.month.split('-')[0].slice(2)
                  return (
                    <div key={m.month}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium">T{label}</span>
                        <span className="text-xs font-bold">{formatVND(m.total)}</span>
                      </div>
                      <div className="flex h-2.5 rounded-full overflow-hidden">
                        <div style={{ width: `${(m.salary / maxTotal) * 100}%`, background: '#2F6FA8' }} />
                        <div style={{ width: `${(m.ot / maxTotal) * 100}%`, background: '#F6C85F' }} />
                        <div style={{ width: `${(m.bonus / maxTotal) * 100}%`, background: '#48C079' }} />
                      </div>
                      <div className="text-[9px] text-right mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Tỷ lệ/DT: <b>{m.ratio}%</b>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-3 mt-3 justify-center">
                <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: '#2F6FA8' }} /> Lương</span>
                <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: '#F6C85F' }} /> OT</span>
                <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: '#48C079' }} /> Thưởng</span>
              </div>
            </div>

            {/* Labor Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-3 text-center">
                <div className="text-lg font-bold">{formatVND(mockLaborCost[mockLaborCost.length - 1].total)}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Chi phí NS T2</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-lg font-bold">{mockLaborCost[mockLaborCost.length - 1].ratio}%</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Tỷ lệ / DT</div>
              </div>
            </div>

            {/* Additional Reports */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link href="/reports/salary-structure" className="card p-4 flex flex-col justify-between hover:border-primary-500 hover:shadow-md transition-all border border-gray-100/80 active:scale-[0.98]">
                <div>
                  <div className="text-xl">💰</div>
                  <div className="text-xs font-black mt-2 text-gray-800 tracking-tight">Cơ cấu Lương</div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-relaxed">Phân tích chi tiết cấu phần, phụ cấp, OT & BHXH</div>
                </div>
                <span className="text-xs text-primary-600 font-bold mt-4 flex items-center gap-0.5">Xem chi tiết →</span>
              </Link>
              <Link href="/reports/tasks" className="card p-4 flex flex-col justify-between hover:border-primary-500 hover:shadow-md transition-all border border-gray-100/80 active:scale-[0.98]">
                <div>
                  <div className="text-xl">📋</div>
                  <div className="text-xs font-black mt-2 text-gray-800 tracking-tight">Báo cáo Tác vụ</div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-relaxed">Checklist hoàn thành, sự cố & hiệu suất vận hành</div>
                </div>
                <span className="text-xs text-primary-600 font-bold mt-4 flex items-center gap-0.5">Xem chi tiết →</span>
              </Link>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === 'products' && (
          <div className="space-y-3 animate-slide-up">
            <h3 className="text-sm font-bold">🧋 Top sản phẩm bán chạy</h3>
            {mockTopProducts.map((p, i) => (
              <div key={i} className="card p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{
                  background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--gray-100)',
                  color: i < 3 ? 'white' : 'var(--text-muted)',
                }}>
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.sold.toLocaleString()} ly · {formatVND(p.revenue)}</div>
                </div>
                <div className="flex items-center gap-1">
                  {p.trend === 'up' ? <TrendingUp size={14} style={{ color: 'var(--success)' }} /> :
                    p.trend === 'down' ? <TrendingDown size={14} style={{ color: 'var(--error)' }} /> :
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                </div>
              </div>
            ))}

            {/* Product Mix Pie-like */}
            <div className="card p-4">
              <h3 className="text-sm font-bold mb-3">📊 Tỷ trọng doanh thu</h3>
              {(() => {
                const totalRev = mockTopProducts.reduce((s, p) => s + p.revenue, 0)
                const colors = ['#2F6FA8', '#48C079', '#F6C85F', '#D9381E', '#001D3D']
                return (
                  <>
                    <div className="flex rounded-full overflow-hidden h-4 mb-3">
                      {mockTopProducts.map((p, i) => (
                        <div key={i} style={{ width: `${(p.revenue / totalRev) * 100}%`, background: colors[i] }} />
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {mockTopProducts.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colors[i] }} />
                          <span className="flex-1">{p.name}</span>
                          <span className="font-bold">{((p.revenue / totalRev) * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
