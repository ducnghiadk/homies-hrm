'use client'

import { Suspense } from 'react'
import { Settings, CalendarDays, TrendingUp } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'

import { useStaffingWorkspace, type TabKey } from '@/hooks/useStaffingWorkspace'
import StaffingDashboard from '@/components/staffing/StaffingDashboard'
import RetrospectiveTab from '@/components/retrospective/RetrospectiveTab'
import QuickEstimateFAB from '@/components/staffing/QuickEstimateFAB'
import SettingsOverviewTab from '@/components/staffing/SettingsOverviewTab'
import ScheduleOverviewTab from '@/components/staffing/ScheduleOverviewTab'
import AdminSettingsModal from '@/components/staffing/AdminSettingsModal'
import OptimizationTab from '@/components/staffing/OptimizationTab'
import WelcomeScreen from '@/components/staffing/WelcomeScreen'
import SmartScheduleGenerator from '@/components/scheduling/SmartScheduleGenerator'

function WorkspaceInner() {
  useAuthStore()
  
  const { state, actions } = useStaffingWorkspace()

  if (!state.isHydrated) return null

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'settings', label: 'Thiết lập & Nhu cầu', icon: <Settings size={14} /> },
    { key: 'schedule', label: 'Lịch tuần & Cảnh báo', icon: <CalendarDays size={14} /> },
    { key: 'retrospective', label: 'Phân tích & Bài học', icon: <TrendingUp size={14} /> },
  ]

  return (
    <AppShell title="Workspace staffing">
      <div className="pb-20">
        <header className="sticky top-12 z-30 mb-6 -mx-4 border-b bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex h-16 w-full items-center justify-between">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
              <h1 className="hidden whitespace-nowrap text-xl font-bold text-gray-900 md:block">
                Staffing workspace
              </h1>
              <div className="mx-2 hidden h-6 w-px bg-gray-200 md:block" />
              <div className="flex rounded-lg bg-primary-50 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => actions.setActiveTab(tab.key)}
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                      state.activeTab === tab.key
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
                onClick={() => actions.setShowAdminSettings(true)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-primary-50 hover:text-gray-600"
                title="Cài đặt tham số gốc"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {state.showAdminSettings && (
          <AdminSettingsModal
            settings={state.adminSettings}
            onSave={actions.handleSaveAdminSettings}
            onClose={() => actions.setShowAdminSettings(false)}
          />
        )}

        <main className="mx-auto w-full">
          {state.showWelcome && (
            <WelcomeScreen
              onSelectTab={actions.handleWelcomeSelect}
              onDismiss={(dontShowAgain) => {
                actions.setShowWelcome(false)
                state.onboarding.dismissWelcome(dontShowAgain)
              }}
            />
          )}

          {!state.isOptimizationOpen && !state.isScheduleWizardOpen && !state.showWelcome && (
            <StaffingDashboard 
              latestPublishedSchedule={state.latestPublishedSchedule}
              activeTab={state.activeTab}
              onTabChange={actions.setActiveTab}
            />
          )}

          {state.isOptimizationOpen && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <OptimizationTab
                initialState={state.optimizationPrefill ?? undefined}
                onPlanSelected={actions.handlePlanSelected}
              />
            </div>
          )}

          {state.isScheduleWizardOpen && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SmartScheduleGenerator onPublish={actions.handleSchedulePublished} />
            </div>
          )}

          {!state.isOptimizationOpen && !state.isScheduleWizardOpen && (
            <>
              {state.activeTab === 'settings' && (
                <SettingsOverviewTab
                  selectedStore={state.selectedStore}
                  onReqChange={actions.handleReqChange}
                  onStartOptimization={() => actions.setIsOptimizationOpen(true)}
                  lastOptimizationResult={state.lastOptResult}
                  onOpenCalculator={() => {}}
                  latestScheduleCost={state.latestPublishedSchedule?.stats.totalCost ?? 41300000}
                  warningCount={state.latestPublishedSchedule?.warnings?.filter(w => w.severity !== 'info').length ?? 0}
                />
              )}

              {state.activeTab === 'schedule' && (
                <ScheduleOverviewTab
                  onCreateSchedule={() => actions.setIsScheduleWizardOpen(true)}
                  latestSchedule={state.latestPublishedSchedule}
                />
              )}

              {state.activeTab === 'retrospective' && <RetrospectiveTab />}
            </>
          )}
        </main>

        <QuickEstimateFAB
          onApplyResult={actions.handleApplyQuickEstimate}
          onAnalyzeDetail={actions.handleAnalyzeDetail}
        />
      </div>
    </AppShell>
  )
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={null}>
      <WorkspaceInner />
    </Suspense>
  )
}
