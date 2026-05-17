'use client'

import { useState, useCallback, Suspense, useSyncExternalStore } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Settings,
  CalendarDays,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore } from '@/store/auth-store'
import { useOnboarding } from '@/hooks/useOnboarding'

// New Phase 3 components
import SettingsOverviewTab from '@/components/staffing/SettingsOverviewTab'
import ScheduleOverviewTab from '@/components/staffing/ScheduleOverviewTab'
import QuickEstimateFAB from '@/components/staffing/QuickEstimateFAB'
import RetrospectiveTab from '@/components/retrospective/RetrospectiveTab'

// Kept from Phase 1/2
import OptimizationTab from '@/components/staffing/OptimizationTab'
import AdminSettingsModal from '@/components/staffing/AdminSettingsModal'
import SmartScheduleGenerator from '@/components/scheduling/SmartScheduleGenerator'
import WelcomeScreen from '@/components/staffing/WelcomeScreen'

import type {
  QuickEstimateState,
  QuickEstimateResult,
  OptimizationState,
  OptimizationPlan,
  AdminSettings,
} from '@/lib/staffing/types'

import {
  updateRequirement,
} from '@/lib/mock-data-staffing'

import AppShell from '@/components/layout/AppShell'

// ─── TYPES ───
type TabKey = 'settings' | 'schedule' | 'retrospective'

// ─── INNER COMPONENT (needs searchParams) ───
function StaffingPageInner() {
  useAuthStore()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Tab
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const tab = searchParams.get('tab')
    return tab === 'schedule' ? 'schedule' : tab === 'retrospective' ? 'retrospective' : 'settings'
  })

  // Onboarding
  const onboarding = useOnboarding()
  const [showWelcome, setShowWelcome] = useState(() => onboarding.shouldShowWelcome())

  // Admin settings
  const [showAdminSettings, setShowAdminSettings] = useState(false)
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    productivity: 25,
    appOrderTimeBuffer: 30,
    defaultSalaryFT: 7000000,
    defaultSalaryPT: 25000,
    bhxhRatio: 30,
    costWarningThreshold: 20,
  })

  // Wizard overlays
  const [isOptimizationOpen, setIsOptimizationOpen] = useState(false)
  const [optimizationPrefill, setOptimizationPrefill] = useState<Partial<OptimizationState> | undefined>()
  const [isScheduleWizardOpen, setIsScheduleWizardOpen] = useState(false)
  const [, setIsQuickEstimateOpen] = useState(false)

  // Last optimization result (mock)
  const [lastOptResult, setLastOptResult] = useState<{
    planName: string; fulltime: number; parttime: number; totalCost: number; date: string
  } | undefined>(undefined)

  // Legacy store for staffing table
  const [selectedStore] = useState('store-001')

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // ─── URL sync ───
  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab)
    router.push(`/settings/staffing?tab=${tab}`, { scroll: false })
  }, [router])

  // ─── Handlers ───
  const handleApplyQuickEstimate = useCallback((_result: QuickEstimateResult) => {
    void _result // consumed to suppress unused-var warning
    onboarding.markFlowCompleted('quickEstimate')
    toast.success('🎉 Đã cập nhật định biên nhân sự')
  }, [onboarding])

  const handleAnalyzeDetail = useCallback((input: QuickEstimateState) => {
    setOptimizationPrefill({
      basicInfo: {
        businessModel: input.businessModel,
        dailyCups: input.dailyCups,
        openTime: '07:00',
        closeTime: `${Math.min(7 + input.operatingHours, 23)}:00`,
        operatingDays: [1, 2, 3, 4, 5, 6, 0],
        appRatio: input.appRatio,
        avgCupsPerOrder: input.avgCupsPerOrder,
      },
    })
    handleTabChange('settings')
    setIsOptimizationOpen(true)
  }, [handleTabChange])

  const handlePlanSelected = useCallback((plan: OptimizationPlan) => {
    setLastOptResult({
      planName: plan.name,
      fulltime: plan.fulltime.length,
      parttime: plan.parttime.length,
      totalCost: plan.totalCost,
      date: new Date().toLocaleDateString('vi-VN'),
    })
    setIsOptimizationOpen(false)
    toast('✅ Đã chọn phương án: ' + plan.name, {
      description: 'Bạn muốn làm gì tiếp theo?',
      action: {
        label: '📅 Xếp ca ngay',
        onClick: () => handleTabChange('schedule'),
      }
    })
  }, [handleTabChange])

  const handleSaveAdminSettings = useCallback((s: AdminSettings) => {
    setAdminSettings(s)
    setShowAdminSettings(false)
    toast.success('✅ Đã lưu cài đặt')
  }, [])

  const handleReqChange = useCallback((shiftId: string, posId: string, val: number) => {
    updateRequirement(selectedStore, shiftId, posId, Math.max(0, val))
  }, [selectedStore])

  // ─── Welcome Screen routing ───
  const handleWelcomeSelect = useCallback((option: string) => {
    setShowWelcome(false)
    onboarding.dismissWelcome(false)

    switch (option) {
      case 'quick':
        setIsQuickEstimateOpen(true)
        break
      case 'optimize':
        handleTabChange('settings')
        setTimeout(() => setIsOptimizationOpen(true), 300)
        break
      case 'schedule':
        handleTabChange('schedule')
        setTimeout(() => setIsScheduleWizardOpen(true), 300)
        break
      default:
        handleTabChange('settings')
    }
  }, [onboarding, handleTabChange])

  if (!isHydrated) return null

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'settings', label: 'Cài đặt & Định biên', icon: <Settings size={14} /> },
    { key: 'schedule', label: 'Lịch làm việc', icon: <CalendarDays size={14} /> },
    { key: 'retrospective', label: 'Phân tích', icon: <TrendingUp size={14} /> },
  ]

  return (
    <AppShell title="Định biên nhân sự">
      <div className="pb-20">
        {/* ═══════════ HEADER ═══════════ */}
        <header className="bg-white border-b sticky top-12 z-30 mb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
              <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap hidden md:block">
                Định biên & Xếp ca
              </h1>
              <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block" />
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => handleTabChange(t.key)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                      transition-all whitespace-nowrap
                      ${activeTab === t.key
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdminSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Cài đặt tham số"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* ═══════════ ADMIN MODAL ═══════════ */}
        {showAdminSettings && (
          <AdminSettingsModal
            settings={adminSettings}
            onSave={handleSaveAdminSettings}
            onClose={() => setShowAdminSettings(false)}
          />
        )}

        {/* ═══════════ CONTENT ═══════════ */}
        <main className="max-w-7xl mx-auto">
          {/* Welcome */}
          {showWelcome && (
            <WelcomeScreen
              onSelectTab={handleWelcomeSelect}
              onDismiss={(dontShowAgain) => {
                setShowWelcome(false)
                onboarding.dismissWelcome(dontShowAgain)
              }}
            />
          )}

          {/* Optimization Wizard (full-screen overlay) */}
          {isOptimizationOpen && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <OptimizationTab
                initialState={optimizationPrefill as OptimizationState | undefined}
                onPlanSelected={handlePlanSelected}
              />
            </div>
          )}

          {/* Schedule Wizard (full-screen overlay) */}
          {isScheduleWizardOpen && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SmartScheduleGenerator />
            </div>
          )}

          {/* ─── TAB CONTENT (hidden when wizard open) ─── */}
          {!isOptimizationOpen && !isScheduleWizardOpen && (
            <>
              {activeTab === 'settings' && (
                <SettingsOverviewTab
                  selectedStore={selectedStore}
                  onReqChange={handleReqChange}
                  onStartOptimization={() => setIsOptimizationOpen(true)}
                  lastOptimizationResult={lastOptResult}
                />
              )}

              {activeTab === 'schedule' && (
                <ScheduleOverviewTab
                  onCreateSchedule={() => setIsScheduleWizardOpen(true)}
                />
              )}

              {activeTab === 'retrospective' && (
                <RetrospectiveTab />
              )}
            </>
          )}
        </main>

        {/* ═══════════ FLOATING ACTION BUTTON ═══════════ */}
        <QuickEstimateFAB
          onApplyResult={handleApplyQuickEstimate}
          onAnalyzeDetail={handleAnalyzeDetail}
        />
      </div>
    </AppShell>
  )
}

// ─── PAGE EXPORT (Suspense for useSearchParams) ───
export default function StaffingSettingsPage() {
  return (
    <Suspense fallback={null}>
      <StaffingPageInner />
    </Suspense>
  )
}
