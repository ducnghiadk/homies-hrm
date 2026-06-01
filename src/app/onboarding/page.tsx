'use client'

import { useEffect, useMemo, useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  OnboardingChecklistItemCard,
  type OnboardingChecklistProgressView,
} from '@/components/onboarding-employee/OnboardingChecklistItemCard'
import { OnboardingEvaluationTimelineCard } from '@/components/onboarding-employee/OnboardingEvaluationTimelineCard'
import { OnboardingChecklistStagePanel } from '@/components/onboarding-employee/OnboardingChecklistStagePanel'
import {
  OnboardingHeroCard,
  type OnboardingStageItemView,
} from '@/components/onboarding-employee/OnboardingHeroCard'
import { OnboardingPolicyPanel } from '@/components/onboarding-employee/OnboardingPolicyPanel'
import { OnboardingProgressStages } from '@/components/onboarding-employee/OnboardingProgressStages'
import { OnboardingMiniQuizCard } from '@/components/onboarding-employee/OnboardingMiniQuizCard'
import { OnboardingSelfReviewCard } from '@/components/onboarding-employee/OnboardingSelfReviewCard'
import { OnboardingStageGateStatusCard } from '@/components/onboarding-employee/OnboardingStageGateStatusCard'
import { OnboardingSupportPanel } from '@/components/onboarding-employee/OnboardingSupportPanel'
import { OnboardingTodayFocus } from '@/components/onboarding-employee/OnboardingTodayFocus'
import AppShell from '@/components/layout/AppShell'
import {
  getEmployeeOnboardingChecklistBundleForEmployee,
  getOnboardingMiniQuizView,
  getOnboardingStageEvaluationTimelineView,
  getOnboardingStageGateView,
  getOnboardingSelfReviewStageView,
  initCareerPathStores,
  submitOnboardingMiniQuizAttempt,
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

  const fallbackPositionLabel = mockPositions.find((position) => position.id === user.position_id)?.name || user.job_level || '-'
  const positionLabel = checklistBundle?.plan.role_label_snapshot || fallbackPositionLabel
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
  const miniQuizView = checklistBundle && selectedStage
    ? getOnboardingMiniQuizView(user.id, checklistBundle.plan.id, selectedStage.code)
    : null
  const gateView = checklistBundle && selectedStage
    ? getOnboardingStageGateView(user.id, checklistBundle.plan.id, selectedStage.code)
    : null
  const evaluationTimelineView = checklistBundle && selectedStage
    ? getOnboardingStageEvaluationTimelineView(user.id, checklistBundle.plan.id, selectedStage.code)
    : null
  const gateRetryItems = phaseTasks
    .filter((task) => (gateView?.retry_item_ids ?? []).includes(task.id))
    .map((task) => ({ id: task.id, title: task.title }))

  const heroHeadline = policySnapshot.needsEmployeeAction
    ? 'Hôm nay bạn cần phản hồi nội quy nhận việc'
    : checklistBundle?.summary.current_stage_code === 'day_2_3'
      ? 'Bạn đang ở chặng 3 ngày đầu'
      : checklistBundle?.summary.current_stage_code === 'day_1'
        ? 'Hôm nay là ngày đầu của bạn'
        : checklistBundle
          ? `B?n ?ang ? ch?ng ${currentStage?.label || 'onboarding'}`
          : 'HR chưa gán checklist cho tài khoản này.'

  const todayPrimaryTask = (checklistBundle?.items ?? [])
    .filter((item) => item.stage_id === currentStage?.id)
    .find((item) => item.progress.status !== 'passed')?.title
    || 'Hôm nay chưa có mục mới, bạn chỉ cần hoàn tất việc đang dở'

  const todayWaitingLabel = policySnapshot.needsEmployeeAction
    ? 'Đang chờ bạn xác nhận nội quy'
    : policySnapshot.summarySent && !policySnapshot.fullSent
      ? 'Đang chờ HR gửi nội quy đầy đủ'
      : 'Không có chờ xử lý gấp'

  const supportLabel = checklistBundle?.plan.assigned_buddy_name
    ? `Buddy: ${checklistBundle.plan.assigned_buddy_name}`
    : 'Chưa có buddy được gán'

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

  const handleSubmitMiniQuiz = (answers: Record<string, string>) => {
    if (!checklistBundle || !selectedStage) return

    submitOnboardingMiniQuizAttempt({
      employeeId: user.id,
      onboardingPlanId: checklistBundle.plan.id,
      stageCode: selectedStage.code,
      answers,
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
    <AppShell title="Onboarding của tôi" navMode="compact">
      <div className="space-y-4">
        <OnboardingHeroCard
          employeeName={user.full_name}
          positionLabel={positionLabel}
          storeLabel={storeLabel}
          headline={heroHeadline}
          startDateLabel={formatDateLabel(checklistBundle?.plan.start_date || user.hire_date)}
          buddyName={checklistBundle?.plan.assigned_buddy_name || 'Chờ gán'}
          currentStageLabel={currentStage?.label || 'Chưa có'}
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
            <div className="text-sm font-bold">{'Checklist onboarding'}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {'HR chưa gán checklist cho tài khoản này, hoặc chức danh này chưa được map role onboarding trong settings.'}
            </div>
          </div>
        ) : (
          <>
            <OnboardingChecklistStagePanel
              stageLabel={selectedStage?.label || 'Chưa có chặng'}
              stageGoalSummary={selectedStage?.goal_summary || 'HR chưa cấu hình mục tiêu cho chặng này.'}
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
                          note: task.progress.note ?? undefined,
                        } satisfies OnboardingChecklistProgressView}
                      />
                    ))}
                  </>
                ) : (
                  <div className="rounded-[24px] bg-white p-4 text-sm text-[#6B7280] shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
                    {'Chặng này chưa có mục cần làm thêm. Bạn có thể chọn chặng khác để xem toàn bộ lộ trình.'}
                  </div>
                )
              }
            />

            <OnboardingSupportPanel
              buddyName={checklistBundle.plan.assigned_buddy_name || 'Chờ gán buddy'}
              managerName={checklistBundle.plan.assigned_manager_name || 'Chưa gán'}
              overallNote={checklistBundle.plan.overall_note ?? undefined}
            />

            {miniQuizView ? (
              <OnboardingMiniQuizCard
                key={miniQuizView.template.id}
                stageLabel={selectedStage?.label || 'Chặng hiện tại'}
                quizView={miniQuizView}
                onSubmit={handleSubmitMiniQuiz}
              />
            ) : null}

            <OnboardingSelfReviewCard
              stageLabel={selectedStage?.label || 'Chặng hiện tại'}
              history={selfReviewStageView?.history ?? []}
              onSubmit={handleSubmitSelfReview}
            />

            {evaluationTimelineView ? (
              <OnboardingEvaluationTimelineCard
                key={`${selectedStage?.code || 'stage'}-timeline`}
                stageLabel={selectedStage?.label || 'Chặng hiện tại'}
                timelineView={evaluationTimelineView}
              />
            ) : null}

            <OnboardingStageGateStatusCard
              stageLabel={selectedStage?.label || 'Chặng hiện tại'}
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
