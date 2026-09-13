'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockPositions } from '@/lib/mock-data'
import { scheduleRulesAdapter } from '@/lib/adapters'
import {
  scheduleRules, ruleOverrides,
  type WarningLevel, type RuleKey,
} from '@/lib/mock-data-schedule-rules'
import {
  ChevronLeft, Save, RotateCcw, Shield,
  Plus, Trash2, Settings, Clock, AlertTriangle,
  CheckCircle2, AlertOctagon, Info, Sparkles,
  Calendar, Bell, LayoutList, LayoutGrid, Search,
  FileText, Check,
  type LucideIcon,
} from 'lucide-react'

const LEVEL_OPTIONS: { value: WarningLevel; label: string; icon: LucideIcon; activeClass: string }[] = [
  {
    value: 'info',
    label: 'Chỉ thông báo',
    icon: Info,
    activeClass: 'bg-white text-blue-700 font-bold shadow-xs border border-blue-200',
  },
  {
    value: 'warning',
    label: 'Cần xác nhận',
    icon: AlertTriangle,
    activeClass: 'bg-white text-amber-700 font-bold shadow-xs border border-amber-200',
  },
  {
    value: 'block',
    label: 'Chặn hoàn toàn',
    icon: AlertOctagon,
    activeClass: 'bg-white text-red-700 font-bold shadow-xs border border-red-200',
  },
]

const RULE_METADATA: Record<RuleKey, {
  label: string
  description: string
  warnUnit: string
  blockUnit: string
  hint: string
  category: 'overtime' | 'health' | 'shift'
}> = {
  min_rest_hours: {
    label: 'Thời gian nghỉ tối thiểu giữa 2 ca',
    description: 'Đảm bảo nhân viên nghỉ ngơi đủ số giờ tối thiểu trước khi bắt đầu ca làm việc mới.',
    warnUnit: 'giờ nghỉ tối thiểu',
    blockUnit: 'giờ nghỉ mức chặn',
    hint: 'Khuyến nghị khoảng nghỉ giữa 2 ca tối thiểu từ 11-12 tiếng.',
    category: 'health',
  },
  clopening: {
    label: 'Ca Đóng - Ca Mở (Hạn chế xoay ca gấp)',
    description: 'Cảnh báo khi nhân viên vừa làm ca tối đóng cửa (23h) lại phải làm ca sáng mở cửa (6h) hôm sau mà chưa đủ thời gian nghỉ ngơi.',
    warnUnit: 'tiếng nghỉ tối thiểu',
    blockUnit: 'tiếng nghỉ mức chặn',
    hint: 'Khoảng nghỉ tiêu chuẩn giữa 2 ca của chuỗi F&B tối thiểu từ 8 tiếng trở lên.',
    category: 'health',
  },
  max_weekly_hours_warn: {
    label: 'Cảnh báo tăng ca theo tuần',
    description: 'Phát cảnh báo cho Quản lý cửa hàng khi tổng giờ làm trong tuần của nhân viên vượt định mức hợp đồng.',
    warnUnit: 'giờ / tuần (cảnh báo)',
    blockUnit: 'giờ / tuần (chặn)',
    hint: 'Nhắc nhở Quản lý cân đối giờ làm nhân viên để tối ưu chi phí lương.',
    category: 'overtime',
  },
  max_weekly_hours_block: {
    label: 'Giới hạn làm việc tối đa / tuần',
    description: 'Chặn tuyệt đối không cho phép xếp quá số giờ làm việc tối đa trong một tuần để bảo vệ sức khỏe nhân viên.',
    warnUnit: 'giờ / tuần',
    blockUnit: 'giờ / tuần tối đa',
    hint: 'Ngưỡng OT tối đa của chuỗi (thông thường 48h/tuần).',
    category: 'overtime',
  },
  max_daily_hours: {
    label: 'Số giờ làm tối đa trong 1 ngày',
    description: 'Giới hạn số giờ nhân viên làm việc trong cùng 1 ngày (tránh xếp làm 2 ca liên tiếp quá dài).',
    warnUnit: 'giờ / ngày (cảnh báo)',
    blockUnit: 'giờ / ngày (chặn)',
    hint: 'Đảm bảo nhân viên không bị kiệt sức trong ca làm việc.',
    category: 'overtime',
  },
  max_consecutive_days: {
    label: 'Chuỗi ngày làm việc liên tục',
    description: 'Đảm bảo nhân viên cửa hàng có ít nhất 1 ngày nghỉ trọn vẹn sau chuỗi ngày làm ca liên tiếp.',
    warnUnit: 'ngày làm liên tục',
    blockUnit: 'ngày làm tối đa',
    hint: 'Môi trường cửa hàng khuyến nghị nghỉ 1 ngày sau 5 - 6 ngày làm liên tục.',
    category: 'health',
  },
  max_shifts_per_day: {
    label: 'Số ca tối đa trong 1 ngày',
    description: 'Giới hạn số lượng ca làm việc phân công cho 1 nhân viên trong cùng một ngày.',
    warnUnit: 'ca / ngày',
    blockUnit: 'ca tối đa / ngày',
    hint: 'Mặc định 1 - 2 ca/ngày.',
    category: 'shift',
  },
  night_shift_restriction: {
    label: 'Bảo vệ nhân viên dưới 18 tuổi (Ca đêm)',
    description: 'Tuân thủ Luật Lao động: Nhân viên chưa đủ 18 tuổi tuyệt đối không được phân công ca làm sau 22h00.',
    warnUnit: '',
    blockUnit: '',
    hint: 'Hệ thống tự động đối soát ngày sinh trong hồ sơ nhân viên để ngăn chặn vi phạm.',
    category: 'health',
  },
}

export interface PreferenceSettings {
  enabled: boolean
  deadlineDays: number
  reminderEnabled: boolean
  reminderDaysBefore: number
  requireReason: boolean
  autoMatchEnabled: boolean
  minMatchRate: number
}

const DEFAULT_PREFERENCES: PreferenceSettings = {
  enabled: true,
  deadlineDays: 3,
  reminderEnabled: true,
  reminderDaysBefore: 1,
  requireReason: true,
  autoMatchEnabled: true,
  minMatchRate: 50,
}

function loadPersistedPreferences(): PreferenceSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES }
  try {
    const raw = localStorage.getItem('homies_schedule_preferences')
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error(e)
  }
  return { ...DEFAULT_PREFERENCES }
}

function savePersistedPreferences(pref: PreferenceSettings) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('homies_schedule_preferences', JSON.stringify(pref))
  } catch (e) {
    console.error(e)
  }
}

function ScheduleRulesContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [ruleViewMode, setRuleViewMode] = useState<'table' | 'cards'>('table')
  const [ruleSearchQuery, setRuleSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  
  const tabParam = searchParams.get('tab') as 'rules' | 'registration' | 'overrides'
  const initialTab = (tabParam && ['rules', 'registration', 'overrides'].includes(tabParam)) ? tabParam : 'rules'
  const [activeTab, setActiveTab] = useState<'rules' | 'registration' | 'overrides'>(initialTab)

  // Registration preference state
  const [prefSettings, setPrefSettings] = useState<PreferenceSettings>(loadPersistedPreferences)

  // New override form state
  const [newOvRule, setNewOvRule] = useState<RuleKey>('max_weekly_hours_warn')
  const [newOvPos, setNewOvPos] = useState(mockPositions[0]?.id || '')
  const [newOvWarn, setNewOvWarn] = useState(40)
  const [newOvBlock, setNewOvBlock] = useState(48)
  const [showNewOverride, setShowNewOverride] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    scheduleRulesAdapter.getRules().then(() => setRefreshKey(k => k + 1))
    scheduleRulesAdapter.getOverrides().then(() => setRefreshKey(k => k + 1))
  }, [isAuthenticated, router])

  if (!user) return null

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleToggleRule = async (ruleKey: RuleKey, active: boolean) => {
    await scheduleRulesAdapter.updateRule(ruleKey, { is_active: active })
    setRefreshKey(k => k + 1)
  }

  const handleLevelChange = async (ruleKey: RuleKey, level: WarningLevel) => {
    await scheduleRulesAdapter.updateRule(ruleKey, { warning_level: level })
    setRefreshKey(k => k + 1)
  }

  const handleValueChange = async (ruleKey: RuleKey, field: 'warning' | 'block', value: number) => {
    await scheduleRulesAdapter.updateRule(ruleKey, field === 'warning' ? { warning_value: value } : { block_value: value })
    setRefreshKey(k => k + 1)
  }

  const handleSaveAllRules = async () => {
    await scheduleRulesAdapter.saveAllRules()
    savePersistedPreferences(prefSettings)
    showToast('Đã lưu cố định tất cả cài đặt thành công')
  }

  const handleResetDefaults = async () => {
    await scheduleRulesAdapter.resetToDefault()
    setPrefSettings({ ...DEFAULT_PREFERENCES })
    savePersistedPreferences(DEFAULT_PREFERENCES)
    setRefreshKey(k => k + 1)
    showToast('Đã khôi phục cài đặt mặc định thành công')
  }

  const handleAddOverride = async () => {
    await scheduleRulesAdapter.addOverride(newOvRule, newOvPos, newOvWarn, newOvBlock)
    setShowNewOverride(false)
    setRefreshKey(k => k + 1)
    showToast('Đã thêm ngoại lệ vị trí thành công')
  }

  const updatePref = <K extends keyof PreferenceSettings>(key: K, value: PreferenceSettings[K]) => {
    setPrefSettings(prev => {
      const updated = { ...prev, [key]: value }
      savePersistedPreferences(updated)
      return updated
    })
  }

  return (
    <AppShell showNav>
      <div className="w-full space-y-6 pb-24 font-['Inter'] animate-fade-in" key={refreshKey}>
        
        {/* Apple-style Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings')}
              className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-all shrink-0 cursor-pointer"
              title="Quay lại cài đặt"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quy Tắc & Cảnh Báo Phân Ca</h1>
                <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full border border-primary-200/60">
                  Chuỗi F&B
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Thiết lập tự động cảnh báo vi phạm giờ làm, khoảng nghỉ và quy trình đăng ký ca cho toàn bộ cửa hàng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleSaveAllRules}
              className="px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Save size={16} /> Lưu cài đặt
            </button>
            <button
              onClick={handleResetDefaults}
              className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all cursor-pointer"
              title="Khôi phục mặc định"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Apple-style Segmented Sub-Navigation (4 Unified Tabs) */}
        <div className="bg-gray-100/90 p-1.5 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-1.5 text-sm font-bold border border-gray-200/50">
          <button
            onClick={() => router.push('/settings/schedule-rules/shifts')}
            className="py-3 px-4 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Clock size={16} className="text-gray-500 shrink-0" />
            <span className="truncate">Mẫu Ca Làm Việc</span>
          </button>
          
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              activeTab === 'rules'
                ? 'bg-white text-primary-700 font-bold border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <Shield size={16} className={activeTab === 'rules' ? 'text-primary-600 shrink-0' : 'text-gray-500 shrink-0'} />
            <span className="truncate">Quy Tắc Vi Phạm</span>
          </button>

          <button
            onClick={() => setActiveTab('registration')}
            className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              activeTab === 'registration'
                ? 'bg-white text-primary-700 font-bold border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <Calendar size={16} className={activeTab === 'registration' ? 'text-primary-600 shrink-0' : 'text-gray-500 shrink-0'} />
            <span className="truncate">Đăng Ký & Hạn Chốt</span>
          </button>

          <button
            onClick={() => setActiveTab('overrides')}
            className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              activeTab === 'overrides'
                ? 'bg-white text-primary-700 font-bold border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <Settings size={16} className={activeTab === 'overrides' ? 'text-primary-600 shrink-0' : 'text-gray-500 shrink-0'} />
            <span className="truncate">Ngoại Lệ Vị Trí</span>
          </button>
        </div>

        {/* TAB 1: RULES CONFIGURATION */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            
            {/* Top Toolbar: Search, Filter, Stats & View Switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200/70 text-xs font-bold">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{scheduleRules.filter(r => r.is_active).length} / {scheduleRules.length} quy tắc đang bật</span>
                </div>

                {/* Filter Categories */}
                <div className="flex items-center bg-gray-100/90 p-1 rounded-xl gap-1 text-xs font-semibold border border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      selectedCategoryFilter === 'all' ? 'bg-white text-gray-900 font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('health')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      selectedCategoryFilter === 'health' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Khoảng nghỉ & Sức khỏe
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('overtime')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      selectedCategoryFilter === 'overtime' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Giờ làm & Tăng ca
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Search Box */}
                <div className="relative flex-1 sm:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={ruleSearchQuery}
                    onChange={e => setRuleSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm quy tắc..."
                    className="w-full h-9 pl-9 pr-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white focus:border-primary-500"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100/90 p-1 rounded-xl gap-1 text-xs font-bold border border-gray-200/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRuleViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      ruleViewMode === 'table' ? 'bg-white text-primary-700 font-bold shadow-xs border border-gray-200/60' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Dạng bảng danh sách"
                  >
                    <LayoutList size={14} /> Dạng bảng
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      ruleViewMode === 'cards' ? 'bg-white text-primary-700 font-bold shadow-xs border border-gray-200/60' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Dạng thẻ mở rộng"
                  >
                    <LayoutGrid size={14} /> Dạng thẻ
                  </button>
                </div>
              </div>
            </div>

            {/* DẠNG 1: BẢNG DANH SÁCH (TABLE LIST VIEW) - DEFAULT */}
            {ruleViewMode === 'table' && (
              <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50/90 border-b border-gray-200/80 text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <th className="py-3.5 px-5 min-w-[320px]">Quy tắc kiểm soát vi phạm</th>
                        <th className="py-3.5 px-4 text-center min-w-[110px]">Trạng thái</th>
                        <th className="py-3.5 px-4 min-w-[280px]">Mức độ xử lý</th>
                        <th className="py-3.5 px-4 min-w-[150px]">Ngưỡng Cảnh báo</th>
                        <th className="py-3.5 px-4 min-w-[150px]">Ngưỡng Chặn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {scheduleRules
                        .filter(rule => {
                          const meta = RULE_METADATA[rule.rule_key] || {
                            label: rule.label,
                            description: rule.description,
                            warnUnit: '',
                            blockUnit: '',
                            hint: '',
                            category: 'overtime',
                          }
                          if (selectedCategoryFilter !== 'all' && meta.category !== selectedCategoryFilter) return false
                          if (ruleSearchQuery.trim()) {
                            const q = ruleSearchQuery.toLowerCase()
                            return meta.label.toLowerCase().includes(q) || meta.description.toLowerCase().includes(q)
                          }
                          return true
                        })
                        .map(rule => {
                          const meta = RULE_METADATA[rule.rule_key] || {
                            label: rule.label,
                            description: rule.description,
                            warnUnit: 'ngưỡng cảnh báo',
                            blockUnit: 'ngưỡng chặn',
                            hint: '',
                            category: 'overtime',
                          }
                          const isNightShiftRule = rule.rule_key === 'night_shift_restriction'

                          return (
                            <tr
                              key={rule.rule_key}
                              className={`transition-colors ${
                                rule.is_active
                                  ? 'hover:bg-primary-50/20'
                                  : 'bg-gray-50/40 opacity-60 hover:opacity-80'
                              }`}
                            >
                              {/* Cột 1: Tên quy tắc & Mô tả */}
                              <td className="py-4 px-5">
                                <div className="flex items-start gap-3.5">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                    rule.is_active
                                      ? meta.category === 'health'
                                        ? 'bg-purple-50 text-purple-600'
                                        : 'bg-primary-50 text-primary-600'
                                      : 'bg-gray-200 text-gray-400'
                                  }`}>
                                    <Shield size={18} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-900 text-sm">{meta.label}</span>
                                      {meta.category === 'health' ? (
                                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                          Sức khỏe
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                          Giờ làm
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-lg leading-relaxed">
                                      {meta.description}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Cột 2: Toggle Bật / Tắt */}
                              <td className="py-4 px-4 text-center align-middle">
                                <div className="inline-flex flex-col items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRule(rule.rule_key, !rule.is_active)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      rule.is_active ? 'bg-primary-600' : 'bg-gray-300'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        rule.is_active ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                  <span className={`text-[10px] font-bold ${rule.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
                                    {rule.is_active ? 'Đang bật' : 'Đã tắt'}
                                  </span>
                                </div>
                              </td>

                              {/* Cột 3: Mức độ xử lý vi phạm */}
                              <td className="py-4 px-4 align-middle">
                                {rule.is_active ? (
                                  <div className="bg-gray-100/90 p-1 rounded-xl flex gap-1 border border-gray-200/50 max-w-[280px]">
                                    {LEVEL_OPTIONS.map(opt => {
                                      const Icon = opt.icon
                                      const isSelected = rule.warning_level === opt.value
                                      return (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => handleLevelChange(rule.rule_key, opt.value)}
                                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                            isSelected
                                              ? opt.activeClass
                                              : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                          }`}
                                          title={opt.label}
                                        >
                                          <Icon size={13} />
                                          <span className="truncate">{opt.label}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Đã tắt quy tắc</span>
                                )}
                              </td>

                              {/* Cột 4: Ngưỡng Cảnh báo */}
                              <td className="py-4 px-4 align-middle">
                                {rule.is_active && !isNightShiftRule ? (
                                  <div className="space-y-1">
                                    <div className="relative max-w-[130px]">
                                      <input
                                        type="number"
                                        min={0}
                                        value={rule.warning_value}
                                        onChange={e => handleValueChange(rule.rule_key, 'warning', Number(e.target.value))}
                                        className="w-full h-9 pl-3 pr-8 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                      />
                                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400 pointer-events-none">
                                        {meta.warnUnit.split(' ')[0] || ''}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 block truncate max-w-[130px]" title={meta.warnUnit}>
                                      {meta.warnUnit}
                                    </span>
                                  </div>
                                ) : isNightShiftRule && rule.is_active ? (
                                  <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1.5 font-bold">
                                    <AlertTriangle size={12} className="text-amber-600" /> Sau 22h00
                                  </span>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>

                              {/* Cột 5: Ngưỡng Chặn */}
                              <td className="py-4 px-4 align-middle">
                                {rule.is_active && !isNightShiftRule ? (
                                  <div className="space-y-1">
                                    <div className="relative max-w-[130px]">
                                      <input
                                        type="number"
                                        min={0}
                                        value={rule.block_value}
                                        onChange={e => handleValueChange(rule.rule_key, 'block', Number(e.target.value))}
                                        className="w-full h-9 pl-3 pr-8 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                      />
                                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400 pointer-events-none">
                                        {meta.blockUnit.split(' ')[0] || ''}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 block truncate max-w-[130px]" title={meta.blockUnit}>
                                      {meta.blockUnit}
                                    </span>
                                  </div>
                                ) : isNightShiftRule && rule.is_active ? (
                                  <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">Tuổi &lt; 18 tuổi</span>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DẠNG 2: BẢNG THẺ MỞ RỘNG (CARD VIEW) */}
            {ruleViewMode === 'cards' && (
              <div className="space-y-4">
                {scheduleRules
                  .filter(rule => {
                    const meta = RULE_METADATA[rule.rule_key] || {
                      label: rule.label,
                      description: rule.description,
                      warnUnit: '',
                      blockUnit: '',
                      hint: '',
                      category: 'overtime',
                    }
                    if (selectedCategoryFilter !== 'all' && meta.category !== selectedCategoryFilter) return false
                    if (ruleSearchQuery.trim()) {
                      const q = ruleSearchQuery.toLowerCase()
                      return meta.label.toLowerCase().includes(q) || meta.description.toLowerCase().includes(q)
                    }
                    return true
                  })
                  .map(rule => {
                    const meta = RULE_METADATA[rule.rule_key] || {
                      label: rule.label,
                      description: rule.description,
                      warnUnit: 'ngưỡng cảnh báo',
                      blockUnit: 'ngưỡng chặn',
                      hint: '',
                      category: 'overtime',
                    }
                    const isNightShiftRule = rule.rule_key === 'night_shift_restriction'

                    return (
                      <div
                        key={rule.rule_key}
                        className={`rounded-3xl border transition-all p-5 space-y-4 ${
                          rule.is_active
                            ? 'bg-white border-gray-200/80 shadow-xs hover:shadow-md'
                            : 'bg-gray-50/70 border-gray-200/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                              rule.is_active ? 'bg-primary-50 text-primary-600' : 'bg-gray-200 text-gray-400'
                            }`}>
                              <Shield size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5">
                                <h3 className="text-base font-bold text-gray-900">{meta.label}</h3>
                                {rule.is_active ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 size={12} /> Đang hoạt động
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-gray-500 bg-gray-200/70 px-2.5 py-0.5 rounded-full">
                                    Đã tắt
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{meta.description}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleRule(rule.rule_key, !rule.is_active)}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              rule.is_active ? 'bg-primary-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                rule.is_active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {rule.is_active && (
                          <div className="pt-4 border-t border-gray-100 grid gap-5 md:grid-cols-[1.1fr_1fr]">
                            {/* Mức độ xử lý vi phạm */}
                            <div>
                              <label className="text-xs font-semibold text-gray-700 block mb-2">
                                Mức độ xử lý vi phạm:
                              </label>
                              <div className="bg-gray-100/90 p-1 rounded-2xl flex gap-1 border border-gray-200/50">
                                {LEVEL_OPTIONS.map(opt => {
                                  const Icon = opt.icon
                                  const isSelected = rule.warning_level === opt.value
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => handleLevelChange(rule.rule_key, opt.value)}
                                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        isSelected
                                          ? opt.activeClass
                                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                      }`}
                                    >
                                      <Icon size={14} />
                                      <span>{opt.label}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Ngưỡng giá trị */}
                            {!isNightShiftRule ? (
                              <div className="grid grid-cols-2 gap-3.5 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/60">
                                <div>
                                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                                    Ngưỡng Cảnh báo
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min={0}
                                      value={rule.warning_value}
                                      onChange={e => handleValueChange(rule.rule_key, 'warning', Number(e.target.value))}
                                      className="w-full h-11 pl-3.5 pr-8 rounded-xl bg-white border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                      {meta.warnUnit.split(' ')[0] || ''}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 block mt-1.5 truncate">{meta.warnUnit}</span>
                                </div>

                                <div>
                                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                                    Ngưỡng Chặn
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min={0}
                                      value={rule.block_value}
                                      onChange={e => handleValueChange(rule.rule_key, 'block', Number(e.target.value))}
                                      className="w-full h-11 pl-3.5 pr-8 rounded-xl bg-white border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                      {meta.blockUnit.split(' ')[0] || ''}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 block mt-1.5 truncate">{meta.blockUnit}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl text-xs font-medium text-amber-900 flex items-center gap-2.5">
                                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                                <span className="leading-relaxed">{meta.hint}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGISTRATION & DEADLINE CONFIGURATION */}
        {activeTab === 'registration' && (
          <div className="space-y-4">
            
            {/* Header Overview Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200/70 text-xs font-bold">
                  <span className={`flex h-2 w-2 rounded-full ${prefSettings.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span>{prefSettings.enabled ? 'Đợt đăng ký ca đang mở' : 'Đợt đăng ký ca đã tạm đóng'}</span>
                </div>
                <span className="text-xs text-gray-400 hidden sm:inline">|</span>
                <span className="text-xs text-gray-500 hidden sm:inline">
                  Hạn chốt: Khóa trước {prefSettings.deadlineDays} ngày (23h59 {prefSettings.deadlineDays === 3 ? 'Thứ Sáu' : prefSettings.deadlineDays === 2 ? 'Thứ Bảy' : prefSettings.deadlineDays === 1 ? 'Chủ Nhật' : 'hàng tuần'})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">
                  {prefSettings.autoMatchEnabled ? '⚡ Auto Match: Bật' : 'Auto Match: Tắt'} • {prefSettings.requireReason ? '📝 Lý do: Bắt buộc' : 'Lý do: Tùy chọn'}
                </span>
              </div>
            </div>

            {/* BẢNG DANH SÁCH CẤU HÌNH ĐĂNG KÝ & HẠN CHỐT */}
            <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/90 border-b border-gray-200/80 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <th className="py-3.5 px-5 min-w-[320px]">Quy trình & Tính năng đăng ký</th>
                      <th className="py-3.5 px-4 text-center min-w-[110px]">Trạng thái</th>
                      <th className="py-3.5 px-4 min-w-[300px]">Cấu hình & Tùy chọn</th>
                      <th className="py-3.5 px-4 min-w-[240px]">Ghi chú & Ví dụ thực tế</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    
                    {/* DÒNG 1: Mở cổng đăng ký ca tuần */}
                    <tr className={`transition-colors ${prefSettings.enabled ? 'hover:bg-primary-50/20' : 'bg-gray-50/40 opacity-60'}`}>
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">Mở cổng đăng ký ca tuần</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Cốt lõi
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-lg leading-relaxed">
                              Cho phép nhân viên đăng ký ca muốn làm và báo ca không thể làm trực tiếp trên điện thoại.
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center align-middle">
                        <div className="inline-flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updatePref('enabled', !prefSettings.enabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              prefSettings.enabled ? 'bg-primary-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                prefSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-bold ${prefSettings.enabled ? 'text-emerald-700' : 'text-gray-400'}`}>
                            {prefSettings.enabled ? 'Đang mở' : 'Tạm khóa'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle">
                        {prefSettings.enabled ? (
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200/70 text-xs font-bold">
                            <Check size={13} className="text-emerald-600" />
                            <span>Mở định kỳ hàng tuần cho toàn chuỗi</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Đã tạm đóng cổng đăng ký</span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <span className="text-xs text-gray-500 leading-relaxed">
                          Nhân viên truy cập mục <strong>Đăng ký ca</strong> trên app để gửi nguyện vọng.
                        </span>
                      </td>
                    </tr>

                    {/* DÒNG 2: Hạn chốt đóng đăng ký tự động */}
                    <tr className={`transition-colors ${prefSettings.enabled ? 'hover:bg-primary-50/20' : 'bg-gray-50/40 opacity-60'}`}>
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Clock size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">Hạn chốt đóng đăng ký (Deadline)</span>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                Tự động
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-lg leading-relaxed">
                              Số ngày tự động khóa đợt đăng ký trước Thứ Hai tuần làm việc tiếp theo.
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center align-middle">
                        <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                          Khóa 23h59
                        </span>
                      </td>

                      <td className="py-4 px-4 align-middle">
                        {prefSettings.enabled ? (
                          <div className="flex flex-wrap gap-1.5">
                            {[1, 2, 3, 5, 7].map(days => (
                              <button
                                key={days}
                                type="button"
                                onClick={() => updatePref('deadlineDays', days)}
                                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  prefSettings.deadlineDays === days
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-white'
                                }`}
                              >
                                {days} ngày {days === 3 ? '★' : ''}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <span className="text-xs text-gray-600 bg-vanilla-50/80 p-2 rounded-xl border border-gray-200/60 block leading-relaxed">
                          Ví dụ: Chốt trước <strong>{prefSettings.deadlineDays} ngày</strong> ➔ Khóa lúc <strong>23h59 {prefSettings.deadlineDays === 3 ? 'Thứ Sáu' : prefSettings.deadlineDays === 2 ? 'Thứ Bảy' : prefSettings.deadlineDays === 1 ? 'Chủ Nhật' : 'hàng tuần'}</strong>.
                        </span>
                      </td>
                    </tr>

                    {/* DÒNG 3: Tự động gửi thông báo nhắc nhở */}
                    <tr className={`transition-colors ${prefSettings.enabled ? 'hover:bg-primary-50/20' : 'bg-gray-50/40 opacity-60'}`}>
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Bell size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">Tự động gửi thông báo nhắc nhở</span>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Push App
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-lg leading-relaxed">
                              Nhắc nhở nhân viên cửa hàng chưa hoàn tất đăng ký ca khi sắp đến hạn chốt.
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center align-middle">
                        <div className="inline-flex flex-col items-center gap-1">
                          <button
                            type="button"
                            disabled={!prefSettings.enabled}
                            onClick={() => updatePref('reminderEnabled', !prefSettings.reminderEnabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              prefSettings.reminderEnabled && prefSettings.enabled ? 'bg-primary-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                prefSettings.reminderEnabled && prefSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-bold ${prefSettings.reminderEnabled && prefSettings.enabled ? 'text-amber-700' : 'text-gray-400'}`}>
                            {prefSettings.reminderEnabled && prefSettings.enabled ? 'Đang bật' : 'Đã tắt'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle">
                        {prefSettings.enabled && prefSettings.reminderEnabled ? (
                          <div className="flex gap-1.5">
                            {[1, 2, 3].map(days => (
                              <button
                                key={days}
                                type="button"
                                onClick={() => updatePref('reminderDaysBefore', days)}
                                className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  prefSettings.reminderDaysBefore === days
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white'
                                }`}
                              >
                                Nhắc trước {days} ngày
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Không gửi thông báo nhắc</span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <span className="text-xs text-gray-500 leading-relaxed">
                          Tự động gửi thông báo đẩy (Push) đến app của nhân viên chưa nộp đăng ký.
                        </span>
                      </td>
                    </tr>

                    {/* DÒNG 4: Bắt buộc nhập lý do khi báo bận */}
                    <tr className={`transition-colors ${prefSettings.enabled ? 'hover:bg-primary-50/20' : 'bg-gray-50/40 opacity-60'}`}>
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">Bắt buộc lý do khi báo bận</span>
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                Kiểm soát
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-lg leading-relaxed">
                              Yêu cầu nhân viên nhập lý do cụ thể khi chọn Không thể làm ca.
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center align-middle">
                        <div className="inline-flex flex-col items-center gap-1">
                          <button
                            type="button"
                            disabled={!prefSettings.enabled}
                            onClick={() => updatePref('requireReason', !prefSettings.requireReason)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              prefSettings.requireReason && prefSettings.enabled ? 'bg-primary-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                prefSettings.requireReason && prefSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-bold ${prefSettings.requireReason && prefSettings.enabled ? 'text-teal-700' : 'text-gray-400'}`}>
                            {prefSettings.requireReason && prefSettings.enabled ? 'Bắt buộc' : 'Tùy chọn'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle">
                        {prefSettings.enabled ? (
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border inline-block ${
                            prefSettings.requireReason
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {prefSettings.requireReason ? '✓ Yêu cầu điền lý do chi tiết' : 'Cho phép để trống lý do'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <span className="text-xs text-gray-500 leading-relaxed">
                          Hạn chế báo bận tùy tiện, hỗ trợ Quản lý sắp xếp nhân sự thay thế thuận tiện.
                        </span>
                      </td>
                    </tr>

                    {/* DÒNG 5: Thuật toán Auto Match ưu tiên ca */}
                    <tr className={`transition-colors ${prefSettings.enabled ? 'hover:bg-primary-50/20' : 'bg-gray-50/40 opacity-60'}`}>
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">Thuật toán Auto Match ưu tiên ca</span>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                AI Thông minh
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-lg leading-relaxed">
                              Tự động ưu tiên phân công ca đúng theo nguyện vọng đăng ký của nhân viên.
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center align-middle">
                        <div className="inline-flex flex-col items-center gap-1">
                          <button
                            type="button"
                            disabled={!prefSettings.enabled}
                            onClick={() => updatePref('autoMatchEnabled', !prefSettings.autoMatchEnabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              prefSettings.autoMatchEnabled && prefSettings.enabled ? 'bg-primary-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                prefSettings.autoMatchEnabled && prefSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-bold ${prefSettings.autoMatchEnabled && prefSettings.enabled ? 'text-purple-700' : 'text-gray-400'}`}>
                            {prefSettings.autoMatchEnabled && prefSettings.enabled ? 'Đang bật' : 'Đã tắt'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle">
                        {prefSettings.enabled ? (
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border inline-block ${
                            prefSettings.autoMatchEnabled
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {prefSettings.autoMatchEnabled ? '⚡ Tối ưu hóa khớp ca nguyện vọng' : 'Phân ca ngẫu nhiên'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <span className="text-xs text-gray-500 leading-relaxed">
                          Tự động ưu tiên ca theo nguyện vọng nhân sự khi xếp lịch tự động, nâng cao sự hài lòng.
                        </span>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: POSITION OVERRIDES */}
        {activeTab === 'overrides' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Ngoại Lệ Quy Tắc Theo Chức Danh / Vị Trí</h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Cho phép các chức danh đặc thù (VD: Quản lý cửa hàng, Shift Leader) có định mức làm việc và OT riêng.
                  </p>
                </div>
                {!showNewOverride && (
                  <button
                    onClick={() => setShowNewOverride(true)}
                    className="px-4 py-2.5 rounded-2xl bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus size={15} /> Thêm ngoại lệ
                  </button>
                )}
              </div>

              {/* Overrides List */}
              <div className="space-y-3 pt-2">
                {ruleOverrides.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                    Chưa có ngoại lệ vị trí nào được thiết lập.
                  </div>
                ) : (
                  ruleOverrides.map(ov => {
                    const ruleMeta = RULE_METADATA[ov.rule_key]
                    const pos = mockPositions.find(p => p.id === ov.position_id)
                    return (
                      <div
                        key={ov.id}
                        className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-4 flex items-center justify-between gap-4 hover:border-gray-300 transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-2xs">
                            {pos?.name || 'Vị trí N/A'}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{ruleMeta?.label || ov.rule_key}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Ngưỡng ngoại lệ: Cảnh báo <strong className="text-gray-800">{ov.override_warning}</strong> → Chặn <strong className="text-red-600">{ov.override_block}</strong>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            await scheduleRulesAdapter.removeOverride(ov.id)
                            setRefreshKey(k => k + 1)
                            showToast('Đã xóa ngoại lệ thành công')
                          }}
                          className="w-9 h-9 rounded-xl bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                          title="Xóa ngoại lệ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Add New Override Form */}
              {showNewOverride && (
                <div className="bg-primary-50/40 rounded-3xl border border-primary-200/80 p-5 space-y-4 animate-fade-in mt-4">
                  <h3 className="text-sm font-bold text-primary-900 flex items-center gap-2">
                    <Plus size={16} className="text-primary-600" /> Thêm cấu hình ngoại lệ mới
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1.5">Quy tắc áp dụng</label>
                      <select
                        value={newOvRule}
                        onChange={e => setNewOvRule(e.target.value as RuleKey)}
                        className="w-full h-11 px-3.5 rounded-xl bg-white border border-gray-300 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        {scheduleRules.filter(r => r.rule_key !== 'night_shift_restriction').map(r => (
                          <option key={r.rule_key} value={r.rule_key}>{RULE_METADATA[r.rule_key]?.label || r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1.5">Vị trí áp dụng</label>
                      <select
                        value={newOvPos}
                        onChange={e => setNewOvPos(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-white border border-gray-300 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        {mockPositions.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1.5">Ngưỡng Cảnh báo mới</label>
                      <input
                        type="number"
                        value={newOvWarn}
                        onChange={e => setNewOvWarn(Number(e.target.value))}
                        className="w-full h-11 px-3.5 rounded-xl bg-white border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1.5">Ngưỡng Chặn mới</label>
                      <input
                        type="number"
                        value={newOvBlock}
                        onChange={e => setNewOvBlock(Number(e.target.value))}
                        className="w-full h-11 px-3.5 rounded-xl bg-white border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      onClick={() => setShowNewOverride(false)}
                      className="px-4 py-2.5 rounded-xl bg-white text-gray-600 border border-gray-200 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAddOverride}
                      className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 cursor-pointer shadow-xs"
                    >
                      Thêm ngoại lệ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] bg-gray-900/95 backdrop-blur-xs text-white px-6 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-fade-in flex items-center gap-2 border border-gray-700">
          {toast}
        </div>
      )}
    </AppShell>
  )
}

export default function ScheduleRulesPage() {
  return (
    <Suspense fallback={null}>
      <ScheduleRulesContent />
    </Suspense>
  )
}
