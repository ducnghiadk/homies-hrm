'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockStores } from '@/lib/mock-data'
import {
  laborCostSettings, laborBudgets,
  updateCostSetting, updateStoreBudget, fmtFull,
} from '@/lib/mock-data-labor-cost'
import { Save, DollarSign, Bell, Eye, Store, CalendarDays } from 'lucide-react'

export default function LaborCostSettingsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState<'rates' | 'warnings' | 'display' | 'budgets' | 'seasons'>('rates')
  const [toast, setToast] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { setIsHydrated(true) }, [])
  useEffect(() => { if (isHydrated && !isAuthenticated) router.push('/login') }, [isHydrated, isAuthenticated, router])
  if (!isHydrated || !user) return null

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  const tabs = [
    { key: 'rates' as const, label: 'Công thức', icon: <DollarSign size={14} /> },
    { key: 'warnings' as const, label: 'Cảnh báo', icon: <Bell size={14} /> },
    { key: 'display' as const, label: 'Hiển thị', icon: <Eye size={14} /> },
    { key: 'budgets' as const, label: 'Ngân sách', icon: <Store size={14} /> },
    { key: 'seasons' as const, label: 'Mùa', icon: <CalendarDays size={14} /> },
  ]

  const RateRow = ({ label, desc, value, onChange }: { label: string; desc: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--gray-100)' }}>
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <input type="number" step={0.1} min={0}
        className="w-16 text-center p-1.5 rounded-lg border text-sm font-medium"
        style={{ borderColor: 'var(--gray-200)' }}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)} />
    </div>
  )

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--gray-100)' }}>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="w-10 h-5 rounded-full relative cursor-pointer"
        style={{ background: value ? 'var(--primary)' : 'var(--gray-300)' }}
        onClick={() => onChange(!value)}>
        <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all"
          style={{ left: value ? '22px' : '2px' }} />
      </div>
    </div>
  )

  return (
    <AppShell title="Chi phí lương">
      <div className="space-y-4" key={refreshKey}>
        {/* Tabs - scrollable */}
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--gray-100)' }}>
          {tabs.map(t => (
            <button key={t.key}
              className="flex items-center gap-1 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={{
                background: activeTab === t.key ? '#fff' : 'transparent',
                color: activeTab === t.key ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => setActiveTab(t.key)}
            >{t.icon} {t.label}</button>
          ))}
        </div>

        {/* ─── TAB: Công thức ─── */}
        {activeTab === 'rates' && (
          <div className="card space-y-1">
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>📐 Hệ số tính lương</h3>
            <RateRow label="Giờ chuẩn/tháng" desc="Để tính lương/giờ" value={laborCostSettings.standard_hours_per_month}
              onChange={v => { updateCostSetting('standard_hours_per_month', v); setRefreshKey(k => k + 1) }} />
            <RateRow label="Hệ số ca đêm" desc="22:00-06:00 (Luật VN: ×1.3)" value={laborCostSettings.night_rate}
              onChange={v => { updateCostSetting('night_rate', v); setRefreshKey(k => k + 1) }} />
            <RateRow label="Hệ số OT (41-48h)" desc="Giờ thứ 41-48/tuần" value={laborCostSettings.ot_rate_1}
              onChange={v => { updateCostSetting('ot_rate_1', v); setRefreshKey(k => k + 1) }} />
            <RateRow label="Hệ số OT (49h+)" desc="Giờ thứ 49+/tuần" value={laborCostSettings.ot_rate_2}
              onChange={v => { updateCostSetting('ot_rate_2', v); setRefreshKey(k => k + 1) }} />
            <RateRow label="Hệ số cuối tuần" desc="Thứ 7, Chủ nhật" value={laborCostSettings.weekend_rate}
              onChange={v => { updateCostSetting('weekend_rate', v); setRefreshKey(k => k + 1) }} />
            <RateRow label="Hệ số ngày lễ" desc="Theo lịch lễ VN" value={laborCostSettings.holiday_rate}
              onChange={v => { updateCostSetting('holiday_rate', v); setRefreshKey(k => k + 1) }} />
            <button className="btn btn-primary w-full text-xs gap-1 mt-3" onClick={() => showToast('Đã lưu')}>
              <Save size={14} /> Lưu
            </button>
          </div>
        )}

        {/* ─── TAB: Cảnh báo ─── */}
        {activeTab === 'warnings' && (
          <div className="card space-y-3">
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>🔔 Ngưỡng cảnh báo</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Cảnh báo vàng (%)</label>
                <input type="number" min={50} max={100}
                  className="w-full p-2 rounded-lg border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                  value={Math.round(laborCostSettings.warning_threshold * 100)}
                  onChange={e => { updateCostSetting('warning_threshold', (parseInt(e.target.value) || 80) / 100); setRefreshKey(k => k + 1) }} />
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Khi đạt mức này, hiện cảnh báo vàng</div>
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Cảnh báo đỏ (%)</label>
                <input type="number" min={80} max={150}
                  className="w-full p-2 rounded-lg border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                  value={Math.round(laborCostSettings.block_threshold * 100)}
                  onChange={e => { updateCostSetting('block_threshold', (parseInt(e.target.value) || 100) / 100); setRefreshKey(k => k + 1) }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Hành động khi vượt</label>
                <select className="w-full p-2 rounded-lg border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                  value={laborCostSettings.over_budget_action}
                  onChange={e => { updateCostSetting('over_budget_action', e.target.value as 'warning' | 'block'); setRefreshKey(k => k + 1) }}>
                  <option value="warning">⚠️ Cảnh báo (cho phép tiếp tục)</option>
                  <option value="block">🚫 Chặn (không cho xếp thêm)</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary w-full text-xs gap-1 mt-2" onClick={() => showToast('Đã lưu')}>
              <Save size={14} /> Lưu
            </button>
          </div>
        )}

        {/* ─── TAB: Hiển thị ─── */}
        {activeTab === 'display' && (
          <div className="card space-y-1">
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>👁️ Tùy chọn hiển thị</h3>
            <Toggle label="Hiện chi phí trên bảng xếp ca" value={laborCostSettings.show_cost_on_schedule}
              onChange={v => { updateCostSetting('show_cost_on_schedule', v); setRefreshKey(k => k + 1) }} />
            <Toggle label="Hiện lương/giờ của NV" value={laborCostSettings.show_hourly_rate}
              onChange={v => { updateCostSetting('show_hourly_rate', v); setRefreshKey(k => k + 1) }} />
            <Toggle label="Hiện tổng thu nhập NV" value={laborCostSettings.show_employee_income}
              onChange={v => { updateCostSetting('show_employee_income', v); setRefreshKey(k => k + 1) }} />
            <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: 'var(--gray-50)', color: 'var(--text-muted)' }}>
              💡 Lương/giờ và thu nhập NV mặc định tắt để bảo mật. Chỉ CEO/HR Admin thấy khi bật.
            </div>
          </div>
        )}

        {/* ─── TAB: Ngân sách ─── */}
        {activeTab === 'budgets' && (
          <div className="space-y-3">
            {mockStores.filter(s => s.is_active).map(store => {
              const budget = laborBudgets.find(b => b.store_id === store.id)
              return (
                <div key={store.id} className="card">
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    🏪 {store.name}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Budget tuần (đ)</label>
                      <input type="number" step={1000000}
                        className="w-full p-2 rounded-lg border text-sm mt-1" style={{ borderColor: 'var(--gray-200)' }}
                        value={budget?.weekly_budget || 0}
                        onChange={e => { updateStoreBudget(store.id, parseInt(e.target.value) || 0); setRefreshKey(k => k + 1) }} />
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>Budget tháng:</span>
                      <span className="font-medium">{fmtFull((budget?.weekly_budget || 0) * 4)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            <button className="btn btn-primary w-full text-xs gap-1" onClick={() => showToast('Đã lưu ngân sách')}>
              <Save size={14} /> Lưu tất cả
            </button>
          </div>
        )}

        {/* ─── TAB: Mùa ─── */}
        {activeTab === 'seasons' && (
          <div className="card">
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              🎄 Hệ số budget mùa cao điểm
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { name: 'Tết 2026', range: '25/01-10/02', mult: 1.5 },
                { name: 'Hè 2026', range: '01/06-31/08', mult: 1.2 },
                { name: 'Noel 2026', range: '20/12-26/12', mult: 1.3 },
              ].map(s => (
                <div key={s.name} className="flex justify-between items-center py-2"
                  style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{s.range}</div>
                  </div>
                  <span className="px-2 py-1 rounded-full font-bold"
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    ×{s.mult}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: 'var(--gray-50)', color: 'var(--text-muted)' }}>
              Trong mùa cao điểm, budget được nhân với hệ số tương ứng.
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
            <div className="p-3 rounded-xl text-xs font-medium text-center text-white"
              style={{ background: '#10b981' }}>
              {toast}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
