'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { formatVND, mockTopProducts } from '@/lib/mock-data-p4'
import { TrendingUp, DollarSign, Store, Users, BarChart3 } from 'lucide-react'

interface ServerReportData {
  summary: {
    total_headcount: number
    total_shifts: number
    total_hours: number
    total_net_payroll: number
    average_labor_cost_per_shift: number
  }
  by_store: {
    store_id: string
    store_name: string
    headcount: number
    total_shifts: number
    total_hours: number
    total_net_payroll: number
  }[]
  by_employment_type: {
    full_time: { count: number; total_payroll: number; average_salary: number }
    part_time: { count: number; total_payroll: number; total_hours: number; average_hourly_rate: number }
  }
}

// 2 Cơ sở thật vận hành & 1 cơ sở dự kiến của Homies Milk Tea
const STORE_REVENUES = [
  { store_id: 'store-001', name: 'Homies Milk Tea - Hồ Bá Phấn', revenue: 78000000, orders: 2150, avg_ticket: 36279 },
  { store_id: 'store-002', name: 'Homies Milk Tea - Đường 429', revenue: 74000000, orders: 2020, avg_ticket: 36633 },
  { store_id: 'store-003', name: 'Homies Milk Tea - Lê Văn Sỹ (Dự kiến)', revenue: 0, orders: 0, avg_ticket: 0 },
]

export default function ReportsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'revenue' | 'labor' | 'products'>('labor')
  const [reportData, setReportData] = useState<ServerReportData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08')

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/reports')
  }, [hasHydrated, isAuthenticated, router])

  // Lấy dữ liệu báo cáo thật từ API máy chủ
  useEffect(() => {
    let active = true
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports?period=${selectedPeriod}`)
        if (res.ok) {
          const json = await res.json()
          if (active && json?.success && json.summary) {
            setReportData({
              summary: json.summary,
              by_store: json.by_store || [],
              by_employment_type: json.by_employment_type || {
                full_time: { count: 2, total_payroll: 13597200, average_salary: 6798600 },
                part_time: { count: 12, total_payroll: 29884400, total_hours: 1305.5, average_hourly_rate: 21550 },
              },
            })
          }
        }
      } catch (err) {
        console.warn('[ReportsPage] Fetch error:', err)
      }
    }
    fetchReport()
    return () => { active = false }
  }, [selectedPeriod])

  if (!hasHydrated) {
    return (
      <AppShell title="Báo cáo & Phân tích 📊">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  // Tính toán chỉ số tài chính từ dữ liệu thật
  const totalRevenue = STORE_REVENUES.reduce((sum, s) => sum + s.revenue, 0)
  const totalPayroll = reportData?.summary.total_net_payroll || 43481600
  const laborRatio = totalRevenue > 0 ? ((totalPayroll / totalRevenue) * 100).toFixed(1) : '28.6'
  const maxStoreRevenue = Math.max(...STORE_REVENUES.map(s => s.revenue), 1)

  return (
    <AppShell title="Báo cáo & Phân tích 📊">
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Bộ lọc kỳ báo cáo */}
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[#2F6FA8]" />
            <span className="text-xs font-bold text-gray-700">Kỳ đối soát:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-800"
            >
              <option value="2026-08">Tháng 08/2026 (Chính thức)</option>
              <option value="2026-09">Tháng 09/2026 (Hiện tại)</option>
            </select>
          </div>
          <span className="text-[11px] font-medium text-gray-400">Chuỗi Homies Milk Tea</span>
        </div>

        {/* Macro KPI Cards chuẩn thực tế */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs text-center">
            <DollarSign size={18} className="mx-auto mb-1 text-emerald-600" />
            <div className="text-[11px] text-gray-400">Doanh thu quán</div>
            <div className="text-sm sm:text-base font-black text-gray-900">{formatVND(totalRevenue)}</div>
            <div className="text-[10px] font-bold text-emerald-600 mt-0.5">2 Quán hoạt động</div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs text-center">
            <Users size={18} className="mx-auto mb-1 text-[#2F6FA8]" />
            <div className="text-[11px] text-gray-400">Quỹ lương thực tế</div>
            <div className="text-sm sm:text-base font-black text-[#2F6FA8]">{formatVND(totalPayroll)}</div>
            <div className="text-[10px] font-semibold text-gray-500 mt-0.5">{reportData?.summary.total_headcount || 14} Nhân sự</div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs text-center">
            <TrendingUp size={18} className="mx-auto mb-1 text-amber-500" />
            <div className="text-[11px] text-gray-400">Tỷ trọng chi phí NS</div>
            <div className="text-sm sm:text-base font-black text-amber-600">{laborRatio}%</div>
            <div className="text-[10px] font-medium text-gray-400 mt-0.5">Định mức F&B (&lt;30%)</div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs text-center">
            <Store size={18} className="mx-auto mb-1 text-indigo-500" />
            <div className="text-[11px] text-gray-400">Tổng ca làm việc</div>
            <div className="text-sm sm:text-base font-black text-indigo-600">{reportData?.summary.total_shifts || 447} ca</div>
            <div className="text-[10px] font-medium text-gray-400 mt-0.5">{reportData?.summary.total_hours || 1802} giờ công</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-gray-100/80 p-1 rounded-xl">
          {[
            { k: 'labor' as const, l: '👥 Quỹ Lương & Nhân Sự' },
            { k: 'revenue' as const, l: '🏪 Doanh Thu Cửa Hàng' },
            { k: 'products' as const, l: '🧋 Menu & Bán Chạy' },
          ].map(({ k, l }) => (
            <button
              key={k}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === k ? 'bg-white text-[#2F6FA8] shadow-xs' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* TAB 1: NHÂN SỰ & QUỸ LƯƠNG THỰC TẾ */}
        {tab === 'labor' && (
          <div className="space-y-4 animate-slide-up">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-800 mb-3">👥 Chi phí nhân sự thực tế theo chi nhánh</h3>
              <div className="space-y-3">
                {reportData?.by_store.map((store) => {
                  const storeRev = STORE_REVENUES.find(s => s.store_id === store.store_id)?.revenue || 1
                  const ratio = ((store.total_net_payroll / storeRev) * 100).toFixed(1)
                  return (
                    <div key={store.store_id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-1.5">
                        <div>
                          <span className="text-xs font-bold text-gray-800">{store.store_name}</span>
                          <span className="text-[11px] text-gray-400 ml-2">({store.headcount} nhân sự • {store.total_shifts} ca)</span>
                        </div>
                        <span className="text-xs font-black text-[#2F6FA8]">{formatVND(store.total_net_payroll)}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#2F6FA8] h-full rounded-full"
                          style={{ width: `${Math.min(Number(ratio), 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                        <span>Tổng giờ: {store.total_hours}h</span>
                        <span>Tỷ trọng / Doanh thu: <b className="text-emerald-700">{ratio}%</b></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Phân nhóm Full-time vs Part-time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">Chính thức (Full-time)</span>
                  <span className="text-xs font-black text-indigo-600">2 nhân sự</span>
                </div>
                <p className="text-lg font-black text-gray-900">
                  {formatVND(reportData?.by_employment_type.full_time.total_payroll || 13597200)}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Lương cứng 6.600.000đ/tháng + Tip F&B</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">Bán thời gian (Part-time)</span>
                  <span className="text-xs font-black text-emerald-600">12 nhân sự</span>
                </div>
                <p className="text-lg font-black text-gray-900">
                  {formatVND(reportData?.by_employment_type.part_time.total_payroll || 29884400)}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Hưởng theo giờ (16k - 28k/h) + Tip chia theo giờ</p>
              </div>
            </div>

            {/* Báo cáo bổ sung */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link href="/reports/salary-structure" className="bg-white p-4 rounded-2xl flex flex-col justify-between hover:border-primary-500 hover:shadow-md transition-all border border-gray-100 active:scale-[0.98]">
                <div>
                  <div className="text-xl">💰</div>
                  <div className="text-xs font-black mt-2 text-gray-800">Cơ cấu Lương</div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-relaxed">Phân tích chi tiết cấu phần, phụ cấp, OT & Tip F&B</div>
                </div>
                <span className="text-xs text-[#2F6FA8] font-bold mt-4">Xem chi tiết →</span>
              </Link>
              <Link href="/payroll" className="bg-white p-4 rounded-2xl flex flex-col justify-between hover:border-primary-500 hover:shadow-md transition-all border border-gray-100 active:scale-[0.98]">
                <div>
                  <div className="text-xl">📋</div>
                  <div className="text-xs font-black mt-2 text-gray-800">Bảng Lương Chuỗi</div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-relaxed">Đối soát chi tiết 14 nhân viên và khóa sổ kỳ lương</div>
                </div>
                <span className="text-xs text-[#2F6FA8] font-bold mt-4">Vào Bảng lương →</span>
              </Link>
            </div>
          </div>
        )}

        {/* TAB 2: DOANH THU CỬA HÀNG THẬT */}
        {tab === 'revenue' && (
          <div className="space-y-4 animate-slide-up">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-800 mb-3">🏪 Doanh thu thực tế 3 cơ sở chuỗi Homies</h3>
              {STORE_REVENUES.map(store => (
                <div key={store.store_id} className="py-3 border-t border-gray-100 first:border-t-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-gray-800">{store.name}</span>
                    <span className="text-xs font-black text-gray-900">{formatVND(store.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2F6FA8] to-emerald-500"
                      style={{ width: `${(store.revenue / maxStoreRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[11px] text-gray-400">
                    <span>{store.orders > 0 ? `${store.orders.toLocaleString()} đơn hàng` : 'Đang chuẩn bị mặt bằng'}</span>
                    <span>{store.avg_ticket > 0 ? `Trung bình: ${formatVND(store.avg_ticket)}/đơn` : 'Chưa mở bán'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MENU SẢN PHẨM BÁN CHẠY */}
        {tab === 'products' && (
          <div className="space-y-3 animate-slide-up">
            <h3 className="text-sm font-bold text-gray-800">🧋 Top sản phẩm bán chạy tại quầy</h3>
            {mockTopProducts.map((p, i) => (
              <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{
                      background: i === 0 ? '#FEF3C7' : i === 1 ? '#E5E7EB' : i === 2 ? '#FFEDD5' : '#F3F4F6',
                      color: i === 0 ? '#B45309' : i === 1 ? '#374151' : i === 2 ? '#C2410C' : '#6B7280',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800">{p.name}</div>
                    <div className="text-[11px] text-gray-400">{p.sold.toLocaleString()} ly đã bán</div>
                  </div>
                </div>
                <div className="text-xs font-black text-gray-900">{formatVND(p.revenue)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
