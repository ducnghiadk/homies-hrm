'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockPositions } from '@/lib/mock-data'
import {
  scheduleRules, ruleOverrides, scheduleSeasons,
  updateRule, addOverride, removeOverride, addSeason, removeSeason,
  type WarningLevel, type RuleKey,
} from '@/lib/mock-data-schedule-rules'
import { format } from 'date-fns'
import {
  ChevronLeft, Save, RotateCcw, Shield,
  Plus, Trash2, Calendar, Zap, ToggleLeft, ToggleRight,
  Settings,
} from 'lucide-react'

const LEVEL_OPTIONS: { value: WarningLevel; label: string; color: string }[] = [
  { value: 'info', label: 'Chỉ thông báo', color: 'text-blue-600' },
  { value: 'warning', label: 'Cần xác nhận', color: 'text-amber-600' },
  { value: 'block', label: 'Chặn hoàn toàn', color: 'text-red-600' },
]

export default function ScheduleRulesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'rules' | 'overrides' | 'seasons'>('rules')

  // New override form
  const [newOvRule, setNewOvRule] = useState<RuleKey>('max_weekly_hours_warn')
  const [newOvPos, setNewOvPos] = useState(mockPositions[0]?.id || '')
  const [newOvWarn, setNewOvWarn] = useState(40)
  const [newOvBlock, setNewOvBlock] = useState(48)

  // New season form
  const [newSeasonName, setNewSeasonName] = useState('')
  const [newSeasonStart, setNewSeasonStart] = useState('')
  const [newSeasonEnd, setNewSeasonEnd] = useState('')

  const [showNewOverride, setShowNewOverride] = useState(false)
  const [showNewSeason, setShowNewSeason] = useState(false)

  useEffect(() => { setIsHydrated(true) }, [])

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.push('/login')
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated || !user) return null

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleToggle = (ruleKey: RuleKey, active: boolean) => {
    updateRule(ruleKey, { is_active: active })
    setRefreshKey(k => k + 1)
  }

  const handleLevelChange = (ruleKey: RuleKey, level: WarningLevel) => {
    updateRule(ruleKey, { warning_level: level })
    setRefreshKey(k => k + 1)
  }

  const handleValueChange = (ruleKey: RuleKey, field: 'warning' | 'block', value: number) => {
    updateRule(ruleKey, field === 'warning' ? { warning_value: value } : { block_value: value })
    setRefreshKey(k => k + 1)
  }

  const handleAddOverride = () => {
    addOverride(newOvRule, newOvPos, newOvWarn, newOvBlock)
    setShowNewOverride(false)
    setRefreshKey(k => k + 1)
    showToast('✅ Đã thêm ngoại lệ')
  }

  const handleAddSeason = () => {
    if (!newSeasonName || !newSeasonStart || !newSeasonEnd) return
    addSeason(newSeasonName, newSeasonStart, newSeasonEnd)
    setShowNewSeason(false)
    setNewSeasonName(''); setNewSeasonStart(''); setNewSeasonEnd('')
    setRefreshKey(k => k + 1)
    showToast('✅ Đã thêm mùa cao điểm')
  }

  const tabs = [
    { id: 'rules' as const, label: 'Quy tắc', icon: Shield },
    { id: 'overrides' as const, label: 'Ngoại lệ', icon: Settings },
    { id: 'seasons' as const, label: 'Mùa cao điểm', icon: Calendar },
  ]

  return (
    <AppShell showNav>
      <div className="space-y-4 animate-fade-in font-['Inter'] pb-6" key={refreshKey}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-dark-700">Quy tắc xếp ca</h1>
            <p className="text-xs text-gray-400">Cấu hình cảnh báo và chặn khi xếp ca</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === tab.id ? 'bg-white text-dark-700 shadow-sm' : 'text-gray-400'}`}>
                <Icon size={13} /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* TAB: Rules */}
        {activeTab === 'rules' && (
          <div className="space-y-3">
            {scheduleRules.map(rule => (
              <div key={rule.rule_key} className={`rounded-2xl border p-4 space-y-3 transition-opacity ${rule.is_active ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                {/* Rule header */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-dark-700">{rule.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{rule.description}</p>
                  </div>
                  <button onClick={() => handleToggle(rule.rule_key, !rule.is_active)}
                    className="ml-3 shrink-0">
                    {rule.is_active
                      ? <ToggleRight size={28} className="text-green-500" />
                      : <ToggleLeft size={28} className="text-gray-300" />
                    }
                  </button>
                </div>

                {rule.is_active && (
                  <>
                    {/* Warning level */}
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1.5">Mức độ</p>
                      <div className="flex gap-1.5">
                        {LEVEL_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => handleLevelChange(rule.rule_key, opt.value)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${rule.warning_level === opt.value
                              ? opt.value === 'block' ? 'bg-red-500 text-white border-red-500'
                              : opt.value === 'warning' ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-400 border-gray-200'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Threshold values */}
                    {rule.rule_key !== 'night_shift_restriction' && (
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-gray-400 font-medium block mb-1">Ngưỡng cảnh báo</label>
                          <input type="number" value={rule.warning_value}
                            onChange={e => handleValueChange(rule.rule_key, 'warning', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-dark-700 focus:outline-none focus:border-primary-400" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-400 font-medium block mb-1">Ngưỡng chặn</label>
                          <input type="number" value={rule.block_value}
                            onChange={e => handleValueChange(rule.rule_key, 'block', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-dark-700 focus:outline-none focus:border-primary-400" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Save / Reset */}
            <div className="flex gap-2 pt-2">
              <button onClick={() => showToast('✅ Đã lưu thay đổi')}
                className="flex-1 py-3 rounded-2xl bg-primary-500 text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-sm">
                <Save size={14} /> Lưu thay đổi
              </button>
              <button onClick={() => { setRefreshKey(k => k + 1); showToast('🔄 Đã khôi phục mặc định') }}
                className="py-3 px-4 rounded-2xl bg-gray-100 text-gray-500 text-xs font-medium flex items-center gap-2 active:scale-[0.97] transition-transform">
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        )}

        {/* TAB: Position Overrides */}
        {activeTab === 'overrides' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">Ghi đè quy tắc cho vị trí cụ thể (Quản lý, Phó quản lý...)</p>

            {ruleOverrides.map(ov => {
              const rule = scheduleRules.find(r => r.rule_key === ov.rule_key)
              const pos = mockPositions.find(p => p.id === ov.position_id)
              return (
                <div key={ov.id} className="bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-dark-700">{pos?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{rule?.label}: {ov.override_warning} → {ov.override_block}</p>
                  </div>
                  <button onClick={() => { removeOverride(ov.id); setRefreshKey(k => k + 1); showToast('🗑️ Đã xóa') }}
                    className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              )
            })}

            {!showNewOverride ? (
              <button onClick={() => setShowNewOverride(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-xs font-medium flex items-center justify-center gap-2 hover:border-primary-300 transition-colors">
                <Plus size={14} /> Thêm ngoại lệ
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-primary-200 p-4 space-y-3">
                <p className="text-xs font-bold text-dark-700">Thêm ngoại lệ mới</p>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Quy tắc</label>
                  <select value={newOvRule} onChange={e => setNewOvRule(e.target.value as RuleKey)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                    {scheduleRules.filter(r => r.rule_key !== 'night_shift_restriction').map(r => (
                      <option key={r.rule_key} value={r.rule_key}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Vị trí</label>
                  <select value={newOvPos} onChange={e => setNewOvPos(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                    {mockPositions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 font-medium block mb-1">Giá trị cảnh báo</label>
                    <input type="number" value={newOvWarn} onChange={e => setNewOvWarn(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 font-medium block mb-1">Giá trị chặn</label>
                    <input type="number" value={newOvBlock} onChange={e => setNewOvBlock(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowNewOverride(false)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-medium">Hủy</button>
                  <button onClick={handleAddOverride}
                    className="flex-1 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold">Thêm</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Seasons */}
        {activeTab === 'seasons' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">Mùa cao điểm có quy tắc riêng (giờ tối đa cao hơn...)</p>

            {scheduleSeasons.map(s => {
              const isActive = new Date() >= new Date(s.start_date) && new Date() <= new Date(s.end_date)
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Calendar size={18} className={isActive ? 'text-green-600' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-dark-700">{s.name}</p>
                      {isActive && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-bold flex items-center gap-1">
                          <Zap size={8} /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {format(new Date(s.start_date), 'dd/MM/yyyy')} – {format(new Date(s.end_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <button onClick={() => { removeSeason(s.id); setRefreshKey(k => k + 1); showToast('🗑️ Đã xóa') }}
                    className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              )
            })}

            {!showNewSeason ? (
              <button onClick={() => setShowNewSeason(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-xs font-medium flex items-center justify-center gap-2 hover:border-primary-300 transition-colors">
                <Plus size={14} /> Thêm mùa cao điểm
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-primary-200 p-4 space-y-3">
                <p className="text-xs font-bold text-dark-700">Thêm mùa cao điểm</p>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Tên</label>
                  <input type="text" value={newSeasonName} onChange={e => setNewSeasonName(e.target.value)}
                    placeholder="VD: Tết 2026"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 font-medium block mb-1">Từ ngày</label>
                    <input type="date" value={newSeasonStart} onChange={e => setNewSeasonStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 font-medium block mb-1">Đến ngày</label>
                    <input type="date" value={newSeasonEnd} onChange={e => setNewSeasonEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowNewSeason(false)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-medium">Hủy</button>
                  <button onClick={handleAddSeason}
                    className="flex-1 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold">Thêm</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
