import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useOnboarding } from '@/hooks/useOnboarding'
import { publishSmartSchedule } from '@/lib/mock-data'
import { saveSchedule, type ScheduleResult } from '@/lib/mock-data-smart-schedule'
import { staffingAdapter } from '@/lib/adapters'
import { updateRequirement } from '@/lib/mock-data-staffing'
import type {
  AdminSettings,
  OptimizationPlan,
  OptimizationState,
  QuickEstimateResult,
  QuickEstimateState,
} from '@/lib/staffing/types'

export type TabKey = 'settings' | 'schedule' | 'retrospective'

export function useStaffingWorkspace() {
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
  const [isQuickEstimateOpen, setIsQuickEstimateOpen] = useState(false)
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
    let isMounted = true
    void (async () => {
      const [schedule, settings] = await Promise.all([
        staffingAdapter.getLatestPublishedSchedule(),
        staffingAdapter.getAdminSettings(),
      ])
      if (isMounted) {
        if (schedule) setLatestPublishedSchedule(schedule)
        if (settings) setAdminSettings(settings)
      }
    })()
    return () => { isMounted = false }
  }, [])

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab)
    router.push(`/staffing/workspace?tab=${tab}`, { scroll: false })
  }, [router])

  const handleApplyQuickEstimate = useCallback((result: QuickEstimateResult) => {
    onboarding.markFlowCompleted('quickEstimate')
    setLastOptResult({
      planName: 'Tính nhanh tại workspace',
      fulltime: result.fulltime,
      parttime: result.parttime.max,
      totalCost: result.costRange.max,
      date: new Date().toLocaleDateString('vi-VN'),
    })
    toast.success('Đã cập nhật đề xuất nhân sự vào workspace staffing')
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
    toast(`${plan.name} đã được đưa vào workspace`, {
      description: 'Bạn có thể chuyển qua tab lịch tuần để tạo lịch tiếp.',
      action: {
        label: 'Mở lịch tuần',
        onClick: () => handleTabChange('schedule'),
      },
    })
  }, [handleTabChange])

  const handleSaveAdminSettings = useCallback((settings: AdminSettings) => {
    setAdminSettings(settings)
    void staffingAdapter.saveAdminSettings(settings)
    setShowAdminSettings(false)
    toast.success('Đã lưu bộ tham số staffing (Đã đồng bộ cơ sở dữ liệu)')
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
    void staffingAdapter.savePublishedSchedule(publishedResult)

    setIsScheduleWizardOpen(false)
    handleTabChange('schedule')
    toast.success('Đã xuất bản lịch mới và lưu lên CSDL Supabase Cloud')
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

  return {
    state: {
      activeTab,
      showWelcome,
      showAdminSettings,
      adminSettings,
      isOptimizationOpen,
      optimizationPrefill,
      isScheduleWizardOpen,
      isQuickEstimateOpen,
      lastOptResult,
      latestPublishedSchedule,
      selectedStore,
      isHydrated,
      onboarding,
    },
    actions: {
      setActiveTab: handleTabChange,
      setShowWelcome,
      setShowAdminSettings,
      setAdminSettings,
      setIsOptimizationOpen,
      setOptimizationPrefill,
      setIsScheduleWizardOpen,
      setIsQuickEstimateOpen,
      handleApplyQuickEstimate,
      handleAnalyzeDetail,
      handlePlanSelected,
      handleSaveAdminSettings,
      handleReqChange,
      handleSchedulePublished,
      handleWelcomeSelect,
    }
  }
}
