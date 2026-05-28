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
import { OnboardingSupportPanel } from '@/components/onboarding-employee/OnboardingSupportPanel'
import { OnboardingTodayFocus } from '@/components/onboarding-employee/OnboardingTodayFocus'
import AppShell from '@/components/layout/AppShell'
import { initCareerPathStores } from '@/lib/career-path-service'
import type { OnboardingThreeViewActionOwner, OnboardingThreeViewSnapshot } from '@/lib/career-path-types'
import { mockPositions, mockStores } from '@/lib/mock-data'
import {
  canOpenNextOnboardingStage,
  getCurrentStageActionOwner,
  getOnboardingThreeViewSnapshot,
  startOnboardingStageItem,
  submitOnboardingStageItemForReview,
} from '@/lib/services/onboarding-stage-service'
import {
  OnboardingPolicyService,
  type EmployeeOnboardingPolicyRecord,
} from '@/lib/services/onboarding-policy-service'
import { useAuthStore } from '@/store/auth-store'

type OnboardingPageState = {
  snapshot: OnboardingThreeViewSnapshot | null
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

function getActionOwnerLabel(actionOwner: OnboardingThreeViewActionOwner) {
  if (actionOwner === 'employee') return 'Dang cho ban xu ly'
  if (actionOwner === 'buddy') return 'Dang cho buddy xu ly'
  if (actionOwner === 'manager') return 'Dang cho quan ly xu ly'
  return 'Khong con ai dang giu buoc nay'
}

function mapStageItems(snapshot: OnboardingThreeViewSnapshot | null): OnboardingStageItemView[] {
  return (snapshot?.stages ?? []).map((stage) => ({
    id: stage.id,
    code: stage.code,
    label: stage.label,
    passed_items: stage.passed_items,
    total_items: stage.total_items,
    status: stage.status,
  }))
}

export default function OnboardingPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [selectedStageCode, setSelectedStageCode] = useState<string>('pre_start')
  const [state, dispatch] = useReducer(onboardingPageReducer, {
    snapshot: null,
    policyRecord: null,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const refreshSnapshot = () => {
    if (!user) return

    dispatch({
      type: 'sync_from_services',
      payload: {
        snapshot: getOnboardingThreeViewSnapshot(user.id),
        policyRecord: { ...OnboardingPolicyService.ensureRecordFromEmployee(user) },
      },
    })
  }

  useEffect(() => {
    if (!user) return
    initCareerPathStores()
    dispatch({
      type: 'sync_from_services',
      payload: {
        snapshot: getOnboardingThreeViewSnapshot(user.id),
        policyRecord: { ...OnboardingPolicyService.ensureRecordFromEmployee(user) },
      },
    })
  }, [user])

  const { snapshot, policyRecord } = state

  const policySnapshot = useMemo(
    () => OnboardingPolicyService.getDayOneChecklistSnapshot(policyRecord),
    [policyRecord],
  )

  const stageItems = useMemo(() => mapStageItems(snapshot), [snapshot])

  if (!user) return null

  const positionLabel = mockPositions.find((position) => position.id === user.position_id)?.name || user.job_level || '-'
  const storeLabel = mockStores.find((store) => store.id === user.store_id)?.name || user.store_id || '-'
  const totalTasks = snapshot?.items.length ?? 0
  const doneTasks = snapshot?.items.filter((item) => item.status === 'passed').length ?? 0
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const currentStageCode = snapshot?.current_stage_code ?? 'pre_start'
  const resolvedSelectedStageCode = snapshot?.stages.some((stage) => stage.code === selectedStageCode)
    ? selectedStageCode
    : currentStageCode
  const currentStage = snapshot?.stages.find((stage) => stage.code === currentStageCode) ?? snapshot?.stages[0]
  const selectedStage = snapshot?.stages.find((stage) => stage.code === resolvedSelectedStageCode) ?? currentStage
  const phaseTasks = snapshot?.items.filter((item) => item.stage_code === selectedStage?.code) ?? []
  const currentActionOwner = snapshot ? getCurrentStageActionOwner(snapshot.employee_id) : 'none'
  const primaryBlocker = snapshot?.blockers[0] ?? null

  const heroHeadline = policySnapshot.needsEmployeeAction
    ? 'Hom nay ban can phan hoi noi quy nhan viec'
    : primaryBlocker?.item_title
      ? `Hom nay uu tien go item ${primaryBlocker.item_title}`
      : snapshot
        ? `Ban dang o chang ${currentStage?.label || 'onboarding'}`
        : 'HR chua gan checklist onboarding cho tai khoan nay.'

  const todayPrimaryTask = phaseTasks.find((item) => item.status !== 'passed')?.title
    || 'Hom nay chua co muc moi, ban chi can hoan tat viec dang do.'

  const todayWaitingLabel = policySnapshot.needsEmployeeAction
    ? 'Dang cho ban xac nhan noi quy'
    : primaryBlocker?.detail
      ? primaryBlocker.detail
      : 'Khong co cho xu ly gap'

  const gateLabel = snapshot?.blockers.length
    ? `Con ${snapshot.blockers.length} blocker truoc khi qua chang tiep`
    : canOpenNextOnboardingStage(user.id)
      ? 'Da du dieu kien mo chang tiep'
      : 'Khong con blocker bat buoc'

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

  return (
    <AppShell title="Onboarding">
      <div className="space-y-4">
        <OnboardingHeroCard
          employeeName={user.full_name}
          positionLabel={positionLabel}
          storeLabel={storeLabel}
          headline={heroHeadline}
          startDateLabel={formatDateLabel(user.hire_date)}
          buddyName={snapshot?.assigned_buddy_name || 'Chua gan'}
          currentStageLabel={currentStage?.label || 'Chua co'}
          nextStageLabel={snapshot?.next_stage_label ? `Sap mo: ${snapshot.next_stage_label}` : 'Chua co chang sau'}
          stageStatusLabel={primaryBlocker ? primaryBlocker.label : 'Ban dang di dung huong'}
        />

        <OnboardingTodayFocus
          primaryTask={todayPrimaryTask}
          waitingLabel={todayWaitingLabel}
          gateLabel={gateLabel}
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

        {!snapshot ? (
          <div className="card p-4 animate-slide-up" style={{ background: 'var(--gray-50)' }}>
            <div className="text-sm font-bold">{'Checklist onboarding'}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {'HR chua gan checklist cho tai khoan nay, hoac nhan su nay khong con trong giai doan onboarding.'}
            </div>
          </div>
        ) : (
          <>
            <OnboardingChecklistStagePanel
              stageLabel={selectedStage?.label || 'Chua co chang'}
              stageGoalSummary={selectedStage?.goal_summary || 'HR chua cau hinh muc tieu cho chang nay.'}
              stageHint={selectedStage?.required_items_remaining ? `Con ${selectedStage.required_items_remaining} item bat buoc chua dat.` : 'Khong con item bat buoc nao dang chan chang.'}
              items={
                phaseTasks.length > 0 ? (
                  <>
                    {phaseTasks.map((task) => (
                      <OnboardingChecklistItemCard
                        key={task.id}
                        title={task.title}
                        employeeAction={task.employee_action}
                        buddyAction={task.buddy_action}
                        managerCheck={task.manager_check}
                        successCriteria={task.passing_standard}
                        actionOwnerLabel={getActionOwnerLabel(task.action_owner)}
                        required={task.required}
                        progress={{
                          status: task.status,
                          note: task.note,
                        } satisfies OnboardingChecklistProgressView}
                        onStart={task.action_owner === 'employee' && (task.status === 'not_started' || task.status === 'needs_coaching') ? () => {
                          startOnboardingStageItem(user.id, task.id)
                          refreshSnapshot()
                        } : undefined}
                        onRequestReview={task.action_owner === 'employee' && (task.status === 'learning' || task.status === 'needs_coaching') ? () => {
                          submitOnboardingStageItemForReview(user.id, task.id)
                          refreshSnapshot()
                        } : undefined}
                      />
                    ))}
                  </>
                ) : (
                  <div className="rounded-[24px] bg-white p-4 text-sm text-[#6B7280] shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
                    {'Chang nay chua co muc can lam them. Ban co the chon chang khac de xem toan bo lo trinh.'}
                  </div>
                )
              }
            />

            <OnboardingSupportPanel
              buddyName={snapshot.assigned_buddy_name || 'Chua gan buddy'}
              managerName={snapshot.assigned_manager_name || 'Chua gan'}
              actionOwnerLabel={getActionOwnerLabel(currentActionOwner)}
              blockerSummary={primaryBlocker?.detail || 'Khong con blocker bat buoc nao.'}
              overallNote={primaryBlocker?.label}
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
