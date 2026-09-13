'use client'

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  Sliders,
  CheckCircle2,
  Info,
  ArrowLeft,
  Sparkles,
  Building2,
  Users,
  Target,
  FileSpreadsheet,
  Trophy,
  Shield,
  Rocket,
} from 'lucide-react'
import {
  mockBSCRevenueTargets,
  bscOperationErrorGroups,
  bscPersonalErrorGroups,
  bscCriteriaCatalog,
  updateBSCCriteria,
  addBSCCriteria,
  deleteBSCCriteria,
  addBSCOperationErrorGroup,
  deleteBSCOperationErrorGroup,
  addBSCPersonalErrorGroup,
  deleteBSCPersonalErrorGroup,
} from '@/lib/mock-data-bsc'
import type { BSCCriteriaInfo, BSCSubCriteriaInfo, BSCRevenueTarget } from '@/lib/bsc-types'

// Tab Components
import BSCSettingsCriteriaTab from '@/components/bsc-bonus/settings/BSCSettingsCriteriaTab'
import BSCSettingsThresholdsTab from '@/components/bsc-bonus/settings/BSCSettingsThresholdsTab'
import BSCSettingsTiersTab from '@/components/bsc-bonus/settings/BSCSettingsTiersTab'
import BSCSettingsTargetsTab from '@/components/bsc-bonus/settings/BSCSettingsTargetsTab'
import BSCSettingsPenaltiesTab from '@/components/bsc-bonus/settings/BSCSettingsPenaltiesTab'
import BSCSettingsRolesTab from '@/components/bsc-bonus/settings/BSCSettingsRolesTab'
import BSCSettingsRoadmapTab from '@/components/bsc-bonus/settings/BSCSettingsRoadmapTab'
import BSCStrategyMap from '@/components/bsc-bonus/BSCStrategyMap'
import BSCAddCriteriaModal from '@/components/bsc-bonus/BSCAddCriteriaModal'
import BSCAddErrorGroupModal from '@/components/bsc-bonus/BSCAddErrorGroupModal'

type BSCSettingTab = 'criteria' | 'thresholds' | 'tiers' | 'store_targets' | 'penalties' | 'roles' | 'roadmap' | 'strategy_map'

export default function BSCSettingsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<BSCSettingTab>('criteria')
  const [selectedStoreId, setSelectedStoreId] = useState('store-001')
  const [selectedPeriod, setSelectedPeriod] = useState('2026-07')
  const [savedToast, setSavedToast] = useState('')

  // Modals
  const [isAddCriteriaModalOpen, setIsAddCriteriaModalOpen] = useState(false)
  const [isAddErrorGroupModalOpen, setIsAddErrorGroupModalOpen] = useState(false)

  // State quản lý tiêu chí động
  const [criteriaList, setCriteriaList] = useState<BSCCriteriaInfo[]>([...bscCriteriaCatalog])

  // State quản lý nhóm lỗi động
  const [opErrorGroups, setOpErrorGroups] = useState([...bscOperationErrorGroups])
  const [personalErrorGroups, setPersonalErrorGroups] = useState([...bscPersonalErrorGroups])

  const notify = (msg: string) => {
    setSavedToast(msg)
    setTimeout(() => setSavedToast(''), 3000)
  }

  // Load target config of selected store
  const currentTarget: BSCRevenueTarget = mockBSCRevenueTargets.find(
    t => t.store_id === selectedStoreId && t.period === selectedPeriod
  ) || {
    store_id: selectedStoreId,
    store_name: selectedStoreId === 'store-001' ? 'Homies Hồ Bá Phấn' : 'Homies Chi Nhánh 429',
    period: selectedPeriod,
    profit_threshold_daily: 6500000,
    target_mode: 'auto_3_6_months',
    avg_3_6_months_daily: 7000000,
    manual_target_daily: 8050000,
    days_in_month: 31,
    actual_revenue_monthly: 0,
    actual_revenue_daily: 0,
    is_unlocked: false,
    target_monthly: 248000000,
    target_daily: 8000000,
    min_hours_threshold: 110,
  }

  const [profitThresholdDaily, setProfitThresholdDaily] = useState(currentTarget.profit_threshold_daily)
  const [targetMode, setTargetMode] = useState<'auto_3_6_months' | 'manual'>(currentTarget.target_mode || 'auto_3_6_months')
  const [avg36MonthsDaily, setAvg36MonthsDaily] = useState(currentTarget.avg_3_6_months_daily || 7000000)
  const [manualTargetDaily, setManualTargetDaily] = useState(currentTarget.manual_target_daily || currentTarget.target_daily || 8050000)
  const [minHoursThreshold, setMinHoursThreshold] = useState(currentTarget.min_hours_threshold || 110)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/settings/bsc')
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated) {
    return (
      <AppShell title="Cài Đặt Hệ Thống BSC">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  const isCEOOrHR = ['ceo', 'area_manager', 'hr_manager', 'hr_admin'].includes(user.role)

  const handleOpenAddGroupModal = () => {
    setIsAddErrorGroupModalOpen(true)
  }

  const handleSaveErrorGroup = (newGroup: {
    key: string
    kind: 'operation' | 'personal'
    name: string
    points: number
    examples: string[]
    detection_mode: 'auto_attendance' | 'manual_manager' | 'qa_audit'
    is_critical: boolean
  }) => {
    if (newGroup.kind === 'operation') {
      addBSCOperationErrorGroup({
        key: newGroup.key,
        name: newGroup.name,
        points: newGroup.points,
        examples: newGroup.examples,
      })
      setOpErrorGroups([...bscOperationErrorGroups])
      notify(`Đã thêm thành công nhóm Lỗi Vận Hành "${newGroup.name}"!`)
    } else {
      addBSCPersonalErrorGroup({
        key: newGroup.key,
        name: newGroup.name,
        points: newGroup.points,
        examples: newGroup.examples,
      })
      setPersonalErrorGroups([...bscPersonalErrorGroups])
      notify(`Đã thêm thành công nhóm Lỗi Cá Nhân "${newGroup.name}"!`)
    }
  }

  const handleDeleteOpGroup = (key: string) => {
    if (opErrorGroups.length <= 1) {
      notify('Phải giữ lại ít nhất 1 nhóm Lỗi Vận Hành!')
      return
    }
    deleteBSCOperationErrorGroup(key)
    setOpErrorGroups([...bscOperationErrorGroups])
    notify('Đã xóa nhóm lỗi vận hành!')
  }

  const handleDeletePersonalGroup = (key: string) => {
    if (personalErrorGroups.length <= 1) {
      notify('Phải giữ lại ít nhất 1 nhóm Lỗi Cá Nhân!')
      return
    }
    deleteBSCPersonalErrorGroup(key)
    setPersonalErrorGroups([...bscPersonalErrorGroups])
    notify('Đã xóa nhóm lỗi cá nhân!')
  }

  // Tính tổng % trọng số hiện tại
  const totalWeightPct = criteriaList.reduce((sum, cat) => sum + Math.round(cat.weight * 100), 0)
  const isWeightValid = totalWeightPct === 100

  // Thay đổi thông tin tiêu chí
  const handleUpdateCriteriaField = (
    key: string,
    field: keyof BSCCriteriaInfo,
    value: string | number | BSCSubCriteriaInfo[] | undefined
  ) => {
    setCriteriaList(prev =>
      prev.map(cat => {
        if (cat.key === key) {
          const updated = { ...cat, [field]: value }
          if (field === 'weight') {
            const numWeight = Number(value) / 100
            updated.weight = numWeight
            updated.weight_percent_label = `${value}%`
          }
          updateBSCCriteria(key, updated)
          return updated
        }
        return cat
      })
    )
  }

  const handleSaveModalCriteria = (newCat: BSCCriteriaInfo) => {
    addBSCCriteria(newCat)
    setCriteriaList([...bscCriteriaCatalog])
    notify(`Đã thêm thành công tiêu chí BSC "${newCat.name}"!`)
  }

  const handleDeleteCriteria = (key: string) => {
    if (criteriaList.length <= 1) {
      notify('Phải giữ lại ít nhất 1 tiêu chí BSC!')
      return
    }
    deleteBSCCriteria(key)
    setCriteriaList([...bscCriteriaCatalog])
    notify('Đã xóa tiêu chí BSC khỏi hệ thống!')
  }

  const handleSaveCriteriaConfig = () => {
    if (!isWeightValid) {
      notify(`Tổng % trọng số hiện tại là ${totalWeightPct}%. Tổng trọng số của tất cả tiêu chí bắt buộc phải đúng bằng 100%!`)
      return
    }
    notify('Đã lưu thành công khung tiêu chí & trọng số % BSC toàn hệ thống!')
  }

  return (
    <AppShell title="Cài Đặt Hệ Thống BSC">
      <div className="space-y-6 w-full pb-16 animate-fade-in text-sm font-['Inter']">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/bsc-bonus')}
              className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition cursor-pointer flex items-center justify-center"
              title="Quay lại trang Vận hành BSC"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Sliders size={20} className="text-[#2F6FA8]" />
                <h1 className="text-lg font-bold text-[#001D3D]">
                  Trung Tâm Cài Đặt Hệ Thống BSC SaaS
                </h1>
              </div>
              <p className="text-xs text-gray-600 font-medium mt-0.5">
                Cấu hình tập trung dành riêng cho CEO &amp; Ban Giám Đốc/HR Admin — 7 Phân khu độc lập &amp; minh bạch 100%.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/bsc-bonus')}
            className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#2F6FA8] text-white text-xs font-bold hover:bg-[#1D3E61] transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>Quay Về Màn Vận Hành BSC</span>
            <ArrowLeft size={16} className="rotate-180" />
          </button>
        </div>

        {/* Toast Alert */}
        {savedToast && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-3 shadow-xs animate-fade-in">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}

        {!isCEOOrHR && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2 shadow-xs">
            <Info size={20} className="text-amber-600 flex-shrink-0" />
            <span>Chú ý: Tài khoản của bạn chỉ có quyền xem cấu hình. Chỉ CEO và HR Admin mới có quyền chỉnh sửa trọng số &amp; khung điểm phạt.</span>
          </div>
        )}

        {/* SEGMENTED TABS HEADER (7 PHÂN KHU ĐỘC LẬP) */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 text-xs font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('criteria')}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'criteria'
                ? 'bg-[#2F6FA8] text-white shadow-xs font-black'
                : 'text-gray-700 hover:text-[#001D3D] hover:bg-gray-50'
            }`}
          >
            <Target size={16} /> 1. Tiêu Chí &amp; Trọng Số
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store_targets')}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'store_targets'
                ? 'bg-[#2F6FA8] text-white shadow-xs font-black'
                : 'text-gray-700 hover:text-[#001D3D] hover:bg-gray-50'
            }`}
          >
            <Building2 size={16} /> 2. Doanh Thu Chi Nhánh
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thresholds')}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'thresholds'
                ? 'bg-[#2F6FA8] text-white shadow-xs font-black'
                : 'text-gray-700 hover:text-[#001D3D] hover:bg-gray-50'
            }`}
          >
            <FileSpreadsheet size={16} /> 3. Mốc Quy Đổi Điểm
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tiers')}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tiers'
                ? 'bg-[#2F6FA8] text-white shadow-xs font-black'
                : 'text-gray-700 hover:text-[#001D3D] hover:bg-gray-50'
            }`}
          >
            <Trophy size={16} /> 4. Ma Trận 5 Tầng Thưởng
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-[#2F6FA8] text-white shadow-xs font-black'
                : 'text-gray-700 hover:text-[#001D3D] hover:bg-gray-50'
            }`}
          >
            <Users size={16} /> 5. Hệ Số Cấp Bậc
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('penalties')}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'penalties'
                ? 'bg-[#2F6FA8] text-white shadow-xs font-black'
                : 'text-gray-700 hover:text-[#001D3D] hover:bg-gray-50'
            }`}
          >
            <Shield size={16} /> 6. Khung Phạt &amp; Kỷ Luật
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'roadmap'
                ? 'bg-[#2F6FA8] text-white shadow-xs font-black'
                : 'text-gray-700 hover:text-[#001D3D] hover:bg-gray-50'
            }`}
          >
            <Rocket size={16} /> 7. Lộ Trình Từng Tháng 🚀
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('strategy_map')}
            className={`px-4 py-2.5 min-h-[44px] rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'strategy_map'
                ? 'bg-[#2F6FA8] text-white shadow-xs font-black'
                : 'text-gray-700 hover:text-[#001D3D] hover:bg-gray-50'
            }`}
          >
            <Sparkles size={16} /> 8. Bản Đồ Chiến Lược
          </button>
        </div>

        {/* TAB CONTENTS */}
        {activeTab === 'criteria' && (
          <BSCSettingsCriteriaTab
            criteriaList={criteriaList}
            totalWeightPct={totalWeightPct}
            isWeightValid={isWeightValid}
            isCEOOrHR={isCEOOrHR}
            onAddCriteria={() => setIsAddCriteriaModalOpen(true)}
            onDeleteCriteria={handleDeleteCriteria}
            onUpdateCriteriaField={handleUpdateCriteriaField}
            onSaveCriteriaConfig={handleSaveCriteriaConfig}
          />
        )}

        {activeTab === 'store_targets' && (
          <BSCSettingsTargetsTab
            selectedStoreId={selectedStoreId}
            setSelectedStoreId={setSelectedStoreId}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            profitThresholdDaily={profitThresholdDaily}
            setProfitThresholdDaily={setProfitThresholdDaily}
            targetMode={targetMode}
            setTargetMode={setTargetMode}
            avg36MonthsDaily={avg36MonthsDaily}
            setAvg36MonthsDaily={setAvg36MonthsDaily}
            manualTargetDaily={manualTargetDaily}
            setManualTargetDaily={setManualTargetDaily}
            minHoursThreshold={minHoursThreshold}
            setMinHoursThreshold={setMinHoursThreshold}
            isCEOOrHR={isCEOOrHR}
            onNotify={notify}
          />
        )}

        {activeTab === 'thresholds' && (
          <BSCSettingsThresholdsTab
            criteriaList={criteriaList}
            onUpdateCriteriaField={handleUpdateCriteriaField}
            isCEOOrHR={isCEOOrHR}
            onNotify={notify}
            onNavigateToTab={(tab) => setActiveTab(tab as BSCSettingTab)}
          />
        )}

        {activeTab === 'tiers' && (
          <BSCSettingsTiersTab
            isCEOOrHR={isCEOOrHR}
            onNotify={notify}
          />
        )}

        {activeTab === 'roles' && (
          <BSCSettingsRolesTab
            isCEOOrHR={isCEOOrHR}
            onNotify={notify}
          />
        )}

        {activeTab === 'penalties' && (
          <BSCSettingsPenaltiesTab
            opErrorGroups={opErrorGroups}
            setOpErrorGroups={setOpErrorGroups}
            personalErrorGroups={personalErrorGroups}
            setPersonalErrorGroups={setPersonalErrorGroups}
            isCEOOrHR={isCEOOrHR}
            onAddOpGroup={handleOpenAddGroupModal}
            onDeleteOpGroup={handleDeleteOpGroup}
            onAddPersonalGroup={handleOpenAddGroupModal}
            onDeletePersonalGroup={handleDeletePersonalGroup}
            onNotify={notify}
          />
        )}

        {activeTab === 'roadmap' && (
          <BSCSettingsRoadmapTab
            onNotify={notify}
          />
        )}

        {activeTab === 'strategy_map' && (
          <BSCStrategyMap storeId={selectedStoreId} period={selectedPeriod} />
        )}
      </div>

      {/* MODAL THÊM TIÊU CHÍ BSC */}
      <BSCAddCriteriaModal
        isOpen={isAddCriteriaModalOpen}
        onClose={() => setIsAddCriteriaModalOpen(false)}
        onSave={handleSaveModalCriteria}
      />

      {/* MODAL THÊM NHÓM LỖI CHUYÊN NGHIỆP */}
      <BSCAddErrorGroupModal
        isOpen={isAddErrorGroupModalOpen}
        onClose={() => setIsAddErrorGroupModalOpen(false)}
        onSave={handleSaveErrorGroup}
      />
    </AppShell>
  )
}
