'use client'

import { Suspense, useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  CalendarDays,
  Calculator,
  ChevronRight,
  Clock3,
  Settings,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import AppShell from '@/components/layout/AppShell'
import RetrospectiveTab from '@/components/retrospective/RetrospectiveTab'
import QuickEstimateFAB from '@/components/staffing/QuickEstimateFAB'
import SettingsOverviewTab from '@/components/staffing/SettingsOverviewTab'
import ScheduleOverviewTab from '@/components/staffing/ScheduleOverviewTab'
import AdminSettingsModal from '@/components/staffing/AdminSettingsModal'
import OptimizationTab from '@/components/staffing/OptimizationTab'
import WelcomeScreen from '@/components/staffing/WelcomeScreen'
import SmartScheduleGenerator from '@/components/scheduling/SmartScheduleGenerator'
import { useOnboarding } from '@/hooks/useOnboarding'
import { publishSmartSchedule } from '@/lib/mock-data'
import { saveSchedule, type ScheduleResult } from '@/lib/mock-data-smart-schedule'
import { updateRequirement } from '@/lib/mock-data-staffing'
import type {
  AdminSettings,
  OptimizationPlan,
  OptimizationState,
  QuickEstimateResult,
  QuickEstimateState,
} from '@/lib/staffing/types'
import { useAuthStore } from '@/store/auth-store'

type TabKey = 'settings' | 'schedule' | 'retrospective'

type WorkspaceMetric = {
  label: string
  value: string
  note: string
  tone: 'neutral' | 'good' | 'warn'
  icon: React.ReactNode
}

function StaffingPageInner() {
  useAuthStore()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const tab = searchParams.get('tab')
    return tab === 'schedule' ? 'schedule' : tab === 'retrospective' ? 'retrospective' : 'settings'
  })

  const onboarding = useOnboarding()
  const [showWelcome, setShowWelcome] = useState(() => onboarding.shouldShowWelcome())
  const [showAdminSettings, setShowAdminSettings] = useState(false)
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    productivity: 25,
    appOrderTimeBuffer: 30,
    defaultSalaryFT: 7000000,
    defaultSalaryPT: 25000,
    bhxhRatio: 30,
    costWarningThreshold: 20,
  })
  const [isOptimizationOpen, setIsOptimizationOpen] = useState(false)
  const [optimizationPrefill, setOptimizationPrefill] = useState<Partial<OptimizationState> | undefined>()
  const [isScheduleWizardOpen, setIsScheduleWizardOpen] = useState(false)
  const [, setIsQuickEstimateOpen] = useState(false)
  const [lastOptResult, setLastOptResult] = useState<{
    planName: string
    fulltime: number
    parttime: number
    totalCost: number
    date: string
  } | undefined>(undefined)
  const [latestPublishedSchedule, setLatestPublishedSchedule] = useState<ScheduleResult | undefined>(undefined)
  const [selectedStore] = useState('store-001')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = localStorage.getItem('homies_latest_published_schedule')
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      setTimeout(() => {
        setLatestPublishedSchedule(parsed)
      }, 0)
    } catch (error) {
      console.error('Failed to parse saved latest schedule', error)
    }
  }, [])

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab)
    router.push(`/settings/staffing?tab=${tab}`, { scroll: false })
  }, [router])

  const handleApplyQuickEstimate = useCallback((result: QuickEstimateResult) => {
    onboarding.markFlowCompleted('quickEstimate')
    setLastOptResult({
      planName: 'Tinh nhanh tai workspace',
      fulltime: result.fulltime,
      parttime: result.parttime.max,
      totalCost: result.costRange.max,
      date: new Date().toLocaleDateString('vi-VN'),
    })
    toast.success('Da cap nhat de xuat nhan su vao workspace staffing')
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
    toast(`${plan.name} da duoc dua vao workspace`, {
      description: 'Ban co the chuyen qua tab lich tuan de tao lich tiep.',
      action: {
        label: 'Mo lich tuan',
        onClick: () => handleTabChange('schedule'),
      },
    })
  }, [handleTabChange])

  const handleSaveAdminSettings = useCallback((settings: AdminSettings) => {
    setAdminSettings(settings)
    setShowAdminSettings(false)
    toast.success('Da luu bo tham so staffing')
  }, [])

  const handleReqChange = useCallback((shiftId: string, posId: string, value: number) => {
    updateRequirement(selectedStore, shiftId, posId, Math.max(0, value))
  }, [selectedStore])

  const handleSchedulePublished = useCallback((result: ScheduleResult) => {
    const publishedResult: ScheduleResult = {
      ...result,
      status: 'published',
    }

    publishSmartSchedule({
      ...publishedResult,
      storeId: selectedStore,
    })

    saveSchedule(publishedResult)
    setLatestPublishedSchedule(publishedResult)

    if (typeof window !== 'undefined') {
      localStorage.setItem('homies_latest_published_schedule', JSON.stringify(publishedResult))
    }

    setIsScheduleWizardOpen(false)
    handleTabChange('schedule')
    toast.success('Da xuat ban lich moi va dua vao workspace staffing')
  }, [handleTabChange, selectedStore])

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

  const activeWarnings = latestPublishedSchedule?.warnings ?? []
  const seriousWarnings = activeWarnings.filter((warning) => warning.severity === 'error').length
  const warningCount = activeWarnings.filter((warning) => warning.severity !== 'info').length
  const latestScheduleCost = latestPublishedSchedule?.stats.totalCost ?? 41_300_000

  const staffingMetrics: WorkspaceMetric[] = [
    {
      label: 'Muc uu tien hom nay',
      value: seriousWarnings > 0 ? 'Can xu ly gap' : latestPublishedSchedule ? 'San sang chot tuan' : 'Can tao lich moi',
      note: seriousWarnings > 0
        ? `${seriousWarnings} loi nang dang chan ap dung`
        : latestPublishedSchedule
          ? `Co ${warningCount} canh bao dang can theo doi`
          : 'Chua co lich cho tuan tiep theo',
      tone: seriousWarnings > 0 ? 'warn' : latestPublishedSchedule ? 'good' : 'neutral',
      icon: <AlertTriangle size={16} />,
    },
    {
      label: 'Chi phi luong tuan tiep',
      value: `${(latestScheduleCost / 1000000).toFixed(1)} tr`,
      note: seriousWarnings > 0 ? 'Nen ra soat truoc khi chot' : 'Dung de so sanh voi cac phuong an khac',
      tone: seriousWarnings > 0 ? 'warn' : 'neutral',
      icon: <Calculator size={16} />,
    },
    {
      label: 'Tinh trang dieu hanh',
      value: latestPublishedSchedule ? 'Da co ban nhap' : 'Chua khoi dong',
      note: latestPublishedSchedule
        ? `Tuan ${latestPublishedSchedule.weekStart} - ${latestPublishedSchedule.weekEnd}`
        : 'Nen bat dau bang tinh nhanh hoac tao lich tu dong',
      tone: latestPublishedSchedule ? 'good' : 'neutral',
      icon: <Clock3 size={16} />,
    },
    {
      label: 'Do tin cay de xuat',
      value: 'Mock + quy tac noi bo',
      note: 'Nen doi chieu them doanh thu, don app va du lieu cham cong that',
      tone: 'neutral',
      icon: <Sparkles size={16} />,
    },
  ]

  const workflowSteps = [
    {
      key: 'setup',
      title: '1. Thiet lap van hanh',
      description: 'Chot dinh bien, gio cao diem, mua vu va nguong chi phi.',
      action: () => handleTabChange('settings'),
      active: activeTab === 'settings',
    },
    {
      key: 'staffing',
      title: '2. Hieu nhu cau nhan su',
      description: 'Xem vi sao he thong de xuat so nguoi theo tung khung gio.',
      action: () => handleTabChange('settings'),
      active: activeTab === 'settings',
    },
    {
      key: 'schedule',
      title: '3. Tao lich tuan',
      description: 'Tao lich, soat canh bao va chot ap dung cho tuan toi.',
      action: () => handleTabChange('schedule'),
      active: activeTab === 'schedule',
    },
    {
      key: 'review',
      title: '4. Nhin lai va toi uu',
      description: 'So chi phi, rui ro va bai hoc de chinh cho lan sau.',
      action: () => handleTabChange('retrospective'),
      active: activeTab === 'retrospective',
    },
  ]

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'settings', label: 'Thiet lap va nhu cau', icon: <Settings size={14} /> },
    { key: 'schedule', label: 'Lich tuan va canh bao', icon: <CalendarDays size={14} /> },
    { key: 'retrospective', label: 'Phan tich va bai hoc', icon: <TrendingUp size={14} /> },
  ]

  return (
    <AppShell title="Workspace staffing">
      <div className="pb-20">
        <header className="sticky top-12 z-30 mb-6 -mx-4 border-b bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
              <h1 className="hidden whitespace-nowrap text-xl font-bold text-gray-900 md:block">
                Staffing workspace
              </h1>
              <div className="mx-2 hidden h-6 w-px bg-gray-200 md:block" />
              <div className="flex rounded-lg bg-gray-100 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdminSettings(true)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Cai dat tham so"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {showAdminSettings && (
          <AdminSettingsModal
            settings={adminSettings}
            onSave={handleSaveAdminSettings}
            onClose={() => setShowAdminSettings(false)}
          />
        )}

        <main className="mx-auto max-w-7xl">
          {showWelcome && (
            <WelcomeScreen
              onSelectTab={handleWelcomeSelect}
              onDismiss={(dontShowAgain) => {
                setShowWelcome(false)
                onboarding.dismissWelcome(dontShowAgain)
              }}
            />
          )}

          {!isOptimizationOpen && !isScheduleWizardOpen && !showWelcome && (
            <section className="mb-6 space-y-4">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,#0f172a,#1e293b_55%,#334155)] p-5 text-white shadow-lg">
                <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100">
                      Trung tam staffing
                    </div>
                    <div className="space-y-2">
                      <h2 className="max-w-3xl text-2xl font-bold md:text-3xl">
                        Mot man hinh de setup nhan su, doc canh bao va chot lich tuan.
                      </h2>
                      <p className="max-w-3xl text-sm text-slate-200 md:text-base">
                        O day minh gom cac viec quan ly can lam theo dung thu tu: thiet lap van hanh,
                        hieu nhu cau nhan su, tao lich tuan va nhin lai chi phi truoc khi ap dung.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {staffingMetrics.map((metric) => (
                        <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                            <span className="rounded-full bg-white/10 p-1.5 text-slate-100">{metric.icon}</span>
                            {metric.label}
                          </div>
                          <div className="mt-3 text-lg font-bold text-white">{metric.value}</div>
                          <p className={`mt-1 text-xs ${
                            metric.tone === 'warn'
                              ? 'text-amber-200'
                              : metric.tone === 'good'
                                ? 'text-emerald-200'
                                : 'text-slate-300'
                          }`}>
                            {metric.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                          Lo trinh thao tac
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-white">Bat dau tu dau?</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push('/settings/staffing/calculator')}
                        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                      >
                        Mo may tinh nhanh
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {workflowSteps.map((step) => (
                        <button
                          key={step.key}
                          type="button"
                          onClick={step.action}
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            step.active
                              ? 'border-primary-300 bg-white/18 shadow-lg shadow-black/10'
                              : 'border-white/10 bg-black/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-bold text-white">{step.title}</div>
                              <p className="mt-1 text-sm text-slate-300">{step.description}</p>
                            </div>
                            <span className={`mt-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                              step.active ? 'bg-white text-slate-900' : 'bg-white/10 text-slate-200'
                            }`}>
                              {step.active ? 'Dang mo' : 'Mo nhanh'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {isOptimizationOpen && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <OptimizationTab
                initialState={optimizationPrefill as OptimizationState | undefined}
                onPlanSelected={handlePlanSelected}
              />
            </div>
          )}

          {isScheduleWizardOpen && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SmartScheduleGenerator onPublish={handleSchedulePublished} />
            </div>
          )}

          {!isOptimizationOpen && !isScheduleWizardOpen && (
            <>
              {activeTab === 'settings' && (
                <SettingsOverviewTab
                  selectedStore={selectedStore}
                  onReqChange={handleReqChange}
                  onStartOptimization={() => setIsOptimizationOpen(true)}
                  lastOptimizationResult={lastOptResult}
                  onOpenCalculator={() => router.push('/settings/staffing/calculator')}
                  latestScheduleCost={latestScheduleCost}
                  warningCount={warningCount}
                />
              )}

              {activeTab === 'schedule' && (
                <ScheduleOverviewTab
                  onCreateSchedule={() => setIsScheduleWizardOpen(true)}
                  latestSchedule={latestPublishedSchedule}
                />
              )}

              {activeTab === 'retrospective' && <RetrospectiveTab />}
            </>
          )}
        </main>

        <QuickEstimateFAB
          onApplyResult={handleApplyQuickEstimate}
          onAnalyzeDetail={handleAnalyzeDetail}
        />
      </div>
    </AppShell>
  )
}

export default function StaffingSettingsPage() {
  return (
    <Suspense fallback={null}>
      <StaffingPageInner />
    </Suspense>
  )
}
