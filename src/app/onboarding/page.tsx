'use client'

import { useEffect, useMemo, useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  OnboardingChecklistItemCard,
  type OnboardingChecklistProgressView,
} from '@/components/onboarding-employee/OnboardingChecklistItemCard'
import { OnboardingChecklistStagePanel } from '@/components/onboarding-employee/OnboardingChecklistStagePanel'
import {
  OnboardingHeroCard,
  type OnboardingStageItemView,
} from '@/components/onboarding-employee/OnboardingHeroCard'
import { OnboardingPolicyPanel } from '@/components/onboarding-employee/OnboardingPolicyPanel'
import { OnboardingProgressStages } from '@/components/onboarding-employee/OnboardingProgressStages'
import { OnboardingSelfReviewCard } from '@/components/onboarding-employee/OnboardingSelfReviewCard'
import { OnboardingStageGateStatusCard } from '@/components/onboarding-employee/OnboardingStageGateStatusCard'
import { OnboardingSupportPanel } from '@/components/onboarding-employee/OnboardingSupportPanel'
import { OnboardingTodayFocus } from '@/components/onboarding-employee/OnboardingTodayFocus'
import AppShell from '@/components/layout/AppShell'
import {
  getEmployeeOnboardingChecklistBundleForEmployee,
  getOnboardingStageGateView,
  getOnboardingSelfReviewStageView,
  initCareerPathStores,
  submitOnboardingSelfReview,
} from '@/lib/career-path-service'
import type { OnboardingSelfReviewAnswers } from '@/lib/career-path-types'
import { mockPositions, mockStores } from '@/lib/mock-data'
import {
  OnboardingPolicyService,
  type EmployeeOnboardingPolicyRecord,
} from '@/lib/services/onboarding-policy-service'
import { useAuthStore } from '@/store/auth-store'

type EmployeeChecklistBundle = NonNullable<ReturnType<typeof getEmployeeOnboardingChecklistBundleForEmployee>>

type OnboardingPageState = {
  checklistBundle: EmployeeChecklistBundle | null
  policyRecord: EmployeeOnboardingPolicyRecord | null
}

type OnboardingPageAction =
  | {
    type: 'sync_from_services'
    payload: OnboardingPageState
  }
  | {
    type: 'policy_updated'
    payload: EmployeeOnboardingPolicyRecord
  }

function onboardingPageReducer(state: OnboardingPageState, action: OnboardingPageAction): OnboardingPageState {
  if (action.type === 'sync_from_services') {
    return action.payload
  }

  if (action.type === 'policy_updated') {
    return {
      ...state,
      policyRecord: action.payload,
    }
  }

  return state
}

function formatDateLabel(value?: string) {
  if (!value) return '-'

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('vi-VN')
}

function mapStageItems(bundle: EmployeeChecklistBundle | null): OnboardingStageItemView[] {
  return (bundle?.stages ?? []).map((stage) => ({
    id: stage.id,
    code: stage.code,
    label: stage.label,
    done_items: stage.done_items,
    total_items: stage.total_items,
    status: stage.status === 'completed' || stage.status === 'current' ? stage.status : 'upcoming',
  }))
}

export default function OnboardingPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [selectedStageCode, setSelectedStageCode] = useState<string>('pre_start')
  const [state, dispatch] = useReducer(onboardingPageReducer, {
    checklistBundle: null,
    policyRecord: null,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user) return

    initCareerPathStores()
    dispatch({
      type: 'sync_from_services',
      payload: {
        checklistBundle: getEmployeeOnboardingChecklistBundleForEmployee(user),
        policyRecord: { ...OnboardingPolicyService.ensureRecordFromEmployee(user) },
      },
    })
  }, [user])

  const { checklistBundle, policyRecord } = state

  const policySnapshot = useMemo(
    () => OnboardingPolicyService.getDayOneChecklistSnapshot(policyRecord),
    [policyRecord],
  )

  const stageItems = useMemo(() => mapStageItems(checklistBundle), [checklistBundle])

  if (!user) return null

  const positionLabel = mockPositions.find((position) => position.id === user.position_id)?.name || user.job_level || '-'
  const storeLabel = mockStores.find((store) => store.id === user.store_id)?.name || user.store_id || '-'
  const totalTasks = checklistBundle?.summary.total_items ?? 0
  const doneTasks = checklistBundle?.summary.done_items ?? 0
  const progress = checklistBundle?.summary.overall_progress ?? 0
  const currentStageCode = checklistBundle?.summary.current_stage_code ?? 'pre_start'
  const resolvedSelectedStageCode = checklistBundle?.stages.some((stage) => stage.code === selectedStageCode)
    ? selectedStageCode
    : currentStageCode
  const currentStage = checklistBundle?.stages.find((stage) => stage.code === currentStageCode) ?? checklistBundle?.stages[0]
  const selectedStage = checklistBundle?.stages.find((stage) => stage.code === resolvedSelectedStageCode) ?? currentStage
  const phaseTasks = checklistBundle?.items.filter((item) => item.stage_id === selectedStage?.id) ?? []
  const selfReviewStageView = checklistBundle && selectedStage
    ? getOnboardingSelfReviewStageView(user.id, checklistBundle.plan.id, selectedStage.code)
    : null
  const gateView = checklistBundle && selectedStage
    ? getOnboardingStageGateView(user.id, checklistBundle.plan.id, selectedStage.code)
    : null
  const gateRetryItems = phaseTasks
    .filter((task) => (gateView?.retry_item_ids ?? []).includes(task.id))
    .map((task) => ({ id: task.id, title: task.title }))

  const heroHeadline = policySnapshot.needsEmployeeAction
    ? '\u0048\u00f4\u006d \u006e\u0061\u0079 \u0062\u1ea1\u006e \u0063\u1ea7\u006e \u0070\u0068\u1ea3\u006e \u0068\u1ed3\u0069 \u006e\u1ed9\u0069 \u0071\u0075\u0079 \u006e\u0068\u1ead\u006e \u0076\u0069\u1ec7\u0063'
    : checklistBundle?.summary.current_stage_code === 'day_2_3'
      ? '\u0042\u1ea1\u006e \u0111\u0061\u006e\u0067 \u1edf \u0063\u0068\u1eb7\u006e\u0067 \u0033 \u006e\u0067\u00e0\u0079 \u0111\u1ea7\u0075'
      : checklistBundle?.summary.current_stage_code === 'day_1'
        ? '\u0048\u00f4\u006d \u006e\u0061\u0079 \u006c\u00e0 \u006e\u0067\u00e0\u0079 \u0111\u1ea7\u0075 \u0063\u1ee7\u0061 \u0062\u1ea1\u006e'
        : checklistBundle
          ? `\u0042\u1ea1\u006e \u0111\u0061\u006e\u0067 \u1edf \u0063\u0068\u1eb7\u006e\u0067 ${currentStage?.label || 'onboarding'}`
          : '\u0048\u0052 \u0063\u0068\u01b0\u0061 \u0067\u00e1\u006e \u0063\u0068\u0065\u0063\u006b\u006c\u0069\u0073\u0074 \u0063\u0068\u006f \u0074\u00e0\u0069 \u006b\u0068\u006f\u1ea3\u006e \u006e\u00e0\u0079\u002e'

  const todayPrimaryTask = (checklistBundle?.items ?? [])
    .filter((item) => item.stage_id === currentStage?.id)
    .find((item) => item.progress.status !== 'passed')?.title
    || '\u0048\u00f4\u006d \u006e\u0061\u0079 \u0063\u0068\u01b0\u0061 \u0063\u00f3 \u006d\u1ee5\u0063 \u006d\u1edb\u0069\u002c \u0062\u1ea1\u006e \u0063\u0068\u1ec9 \u0063\u1ea7\u006e \u0068\u006f\u00e0\u006e \u0074\u1ea5\u0074 \u0076\u0069\u1ec7\u0063 \u0111\u0061\u006e\u0067 \u0064\u1edf'

  const todayWaitingLabel = policySnapshot.needsEmployeeAction
    ? '\u0110\u0061\u006e\u0067 \u0063\u0068\u1edd \u0062\u1ea1\u006e \u0078\u00e1\u0063 \u006e\u0068\u1ead\u006e \u006e\u1ed9\u0069 \u0071\u0075\u0079'
    : policySnapshot.summarySent && !policySnapshot.fullSent
      ? '\u0110\u0061\u006e\u0067 \u0063\u0068\u1edd \u0048\u0052 \u0067\u1eedi \u006e\u1ed9\u0069 \u0071\u0075\u0079 \u0111\u1ea7\u0079 \u0111\u1ee7'
      : '\u004b\u0068\u00f4\u006e\u0067 \u0063\u00f3 \u0063\u0068\u1edd \u0078\u1eed \u006c\u00fd \u0067\u1ea5\u0070'

  const supportLabel = checklistBundle?.plan.assigned_buddy_name
    ? `Buddy: ${checklistBundle.plan.assigned_buddy_name}`
    : '\u0043\u0068\u01b0\u0061 \u0063\u00f3 \u0062\u0075\u0064\u0064\u0079 \u0111\u01b0\u1ee3\u0063 \u0067\u00e1\u006e'

  const handleAcknowledgePolicy = () => {
    const updatedRecord = OnboardingPolicyService.acknowledge(user.id, user)
    if (updatedRecord) {
      dispatch({ type: 'policy_updated', payload: { ...updatedRecord } })
    }
  }

  const handleRequestClarification = () => {
    const updatedRecord = OnboardingPolicyService.requestClarification(user.id, user)
    if (updatedRecord) {
      dispatch({ type: 'policy_updated', payload: { ...updatedRecord } })
    }
  }

  const handleSubmitSelfReview = (answers: OnboardingSelfReviewAnswers) => {
    if (!checklistBundle || !selectedStage) return

    submitOnboardingSelfReview({
      employeeId: user.id,
      onboardingPlanId: checklistBundle.plan.id,
      stageCode: selectedStage.code,
      answers,
      submittedBy: user.id,
    })

    dispatch({
      type: 'sync_from_services',
      payload: {
        checklistBundle: getEmployeeOnboardingChecklistBundleForEmployee(user),
        policyRecord: { ...OnboardingPolicyService.ensureRecordFromEmployee(user) },
      },
    })
  }

  return (
    <AppShell title="Onboarding">
      <div className="space-y-4">
        <OnboardingHeroCard
          employeeName={user.full_name}
          positionLabel={positionLabel}
          storeLabel={storeLabel}
          headline={heroHeadline}
          startDateLabel={formatDateLabel(checklistBundle?.plan.start_date || user.hire_date)}
          buddyName={checklistBundle?.plan.assigned_buddy_name || '\u0043\u0068\u1edd \u0067\u00e1\u006e'}
          currentStageLabel={currentStage?.label || '\u0043\u0068\u01b0\u0061 \u0063\u00f3'}
        />

        <OnboardingTodayFocus
          primaryTask={todayPrimaryTask}
          waitingLabel={todayWaitingLabel}
          supportLabel={supportLabel}
        />

        <OnboardingProgressStages
          progress={progress}
          doneTasks={doneTasks}
          totalTasks={totalTasks}
          stages={stageItems}
          currentStageCode={currentStageCode}
          selectedStageCode={resolvedSelectedStageCode}
          onStageSelect={setSelectedStageCode}
        />

        {!checklistBundle ? (
          <div className="card p-4 animate-slide-up" style={{ background: 'var(--gray-50)' }}>
            <div className="text-sm font-bold">{'\u0043\u0068\u0065\u0063\u006b\u006c\u0069\u0073\u0074 \u006f\u006e\u0062\u006f\u0061\u0072\u0064\u0069\u006e\u0067'}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {'\u0048\u0052 \u0063\u0068\u01b0\u0061 \u0067\u00e1\u006e \u0063\u0068\u0065\u0063\u006b\u006c\u0069\u0073\u0074 \u0063\u0068\u006f \u0074\u00e0\u0069 \u006b\u0068\u006f\u1ea3\u006e \u006e\u00e0\u0079\u002c \u0068\u006f\u1eb7\u0063 \u006e\u0068\u00e2\u006e \u0073\u1ef1 \u006e\u00e0\u0079 \u006b\u0068\u00f4\u006e\u0067 \u0063\u00f2\u006e \u0074\u0072\u006f\u006e\u0067 \u0067\u0069\u0061\u0069 \u0111\u006f\u1ea1\u006e \u006f\u006e\u0062\u006f\u0061\u0072\u0064\u0069\u006e\u0067\u002e'}
            </div>
          </div>
        ) : (
          <>
            <OnboardingChecklistStagePanel
              stageLabel={selectedStage?.label || '\u0043\u0068\u01b0\u0061 \u0063\u00f3 \u0063\u0068\u1eb7\u006e\u0067'}
              stageGoalSummary={selectedStage?.goal_summary || '\u0048\u0052 \u0063\u0068\u01b0\u0061 \u0063\u1ea5\u0075 \u0068\u00ec\u006e\u0068 \u006d\u1ee5\u0063 \u0074\u0069\u00ea\u0075 \u0063\u0068\u006f \u0063\u0068\u1eb7\u006e\u0067 \u006e\u00e0\u0079\u002e'}
              items={
                phaseTasks.length > 0 ? (
                  <>
                    {phaseTasks.map((task) => (
                      <OnboardingChecklistItemCard
                        key={task.id}
                        title={task.title}
                        instructionText={task.instruction_text}
                        successCriteria={task.success_criteria}
                        progress={{
                          status: task.progress.status,
                          note: task.progress.note,
                        } satisfies OnboardingChecklistProgressView}
                      />
                    ))}
                  </>
                ) : (
                  <div className="rounded-[24px] bg-white p-4 text-sm text-[#6B7280] shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
                    {'\u0043\u0068\u1eb7\u006e\u0067 \u006e\u00e0\u0079 \u0063\u0068\u01b0\u0061 \u0063\u00f3 \u006d\u1ee5\u0063 \u0063\u1ea7\u006e \u006c\u00e0\u006d \u0074\u0068\u00ea\u006d\u002e \u0042\u1ea1\u006e \u0063\u00f3 \u0074\u0068\u1ec3 \u0063\u0068\u1ecdn \u0063\u0068\u1eb7\u006e\u0067 \u006b\u0068\u00e1\u0063 \u0111\u1ec3 \u0078\u0065\u006d \u0074\u006f\u00e0\u006e \u0062\u1ed9 \u006c\u1ed9 \u0074\u0072\u00ec\u006e\u0068\u002e'}
                  </div>
                )
              }
            />

            <OnboardingSupportPanel
              buddyName={checklistBundle.plan.assigned_buddy_name || '\u0043\u0068\u1edd \u0067\u00e1\u006e \u0062\u0075\u0064\u0064\u0079'}
              managerName={checklistBundle.plan.assigned_manager_name || '\u0043\u0068\u01b0\u0061 \u0067\u00e1\u006e'}
              overallNote={checklistBundle.plan.overall_note}
            />

            <OnboardingSelfReviewCard
              stageLabel={selectedStage?.label || '\u0043\u0068\u1eb7\u006e\u0067 \u0068\u0069\u1ec7\u006e \u0074\u1ea1\u0069'}
              history={selfReviewStageView?.history ?? []}
              onSubmit={handleSubmitSelfReview}
            />

            <OnboardingStageGateStatusCard
              stageLabel={selectedStage?.label || '\u0043\u0068\u1eb7\u006e\u0067 \u0068\u0069\u1ec7\u006e \u0074\u1ea1\u0069'}
              gateView={gateView}
              retryItems={gateRetryItems}
            />
          </>
        )}

        <OnboardingPolicyPanel
          policyRecord={policyRecord}
          policySnapshot={policySnapshot}
          onAcknowledge={handleAcknowledgePolicy}
          onRequestClarification={handleRequestClarification}
        />
      </div>
    </AppShell>
  )
}
