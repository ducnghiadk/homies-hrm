import { mockPositions } from '@/lib/mock-data'
import type {
  OnboardingChecklistItemTemplate,
  OnboardingChecklistStage,
  OnboardingChecklistTemplate,
  OnboardingPublishValidationReport,
  OnboardingRoleSettings,
  OnboardingRoleSettingsValidationIssue,
  TrialWorkflowReadinessIssue,
} from '@/lib/career-path-types'
import type { TrialWorkflowMissingItem } from './TrialWorkflowMissingItemsTable'
import type { TrialWorkflowTabItem, TrialWorkflowTabKey } from './TrialWorkflowTabBar'

export type TrialWorkflowMetric = {
  label: string
  value: number
  tone: 'neutral' | 'warning' | 'danger'
}

export type TrialWorkflowSetupState = {
  label: 'Lần đầu thiết lập' | 'Đang làm dở' | 'Gần hoàn tất' | 'Sẵn sàng đưa vào áp dụng'
  helper: string
  actionLabel: string
  targetTab: TrialWorkflowTabKey
}

export type TrialWorkflowGeneralInfoRow = {
  id: string
  label: string
  value: string
  status: 'Đã có' | 'Còn thiếu'
  actionLabel: string
  targetTab: TrialWorkflowTabKey
}

export type TrialWorkflowStageRow = {
  id: string
  stageName: string
  goalLabel: string
  ownerLabel: string
  timelineLabel: string
  completionLabel: string
  status: 'Đã có' | 'Còn thiếu'
  actionLabel: string
  targetTab: TrialWorkflowTabKey
}

export type TrialWorkflowTaskRow = {
  id: string
  taskLabel: string
  ownerLabel: string
  outcomeLabel: string
  requiredLabel: string
  dueLabel: string
  statusLabel: string
  actionLabel: string
  targetTab: TrialWorkflowTabKey
}

export type TrialWorkflowGateRow = {
  id: string
  conditionLabel: string
  currentResultLabel: string
  requirementLevelLabel: string
  approverLabel: string
  actionLabel: string
  targetTab: TrialWorkflowTabKey
}

export type TrialWorkflowAssignmentRow = {
  id: string
  groupLabel: string
  storeLabel: string
  positionLabel: string
  startDateLabel: string
  statusLabel: string
  actionLabel: string
  targetTab: TrialWorkflowTabKey
}

const defaultStageRows: Array<Pick<TrialWorkflowStageRow, 'stageName' | 'ownerLabel' | 'timelineLabel'>> = [
  {
    stageName: 'Chốt nhận việc và chuẩn bị vào làm',
    ownerLabel: 'HR',
    timelineLabel: 'Trước ngày bắt đầu',
  },
  {
    stageName: 'Ngày đầu nhận việc',
    ownerLabel: 'Quản lý cửa hàng',
    timelineLabel: 'Ngày đầu nhận việc',
  },
  {
    stageName: 'Làm quen và kèm cặp trong thời gian đầu',
    ownerLabel: 'Buddy / Quản lý ca',
    timelineLabel: 'Trong tuần đầu',
  },
  {
    stageName: 'Đánh giá và chốt kết quả thử việc',
    ownerLabel: 'HR / Quản lý cửa hàng',
    timelineLabel: 'Cuối kỳ thử việc',
  },
]

const stageMetaByCode: Record<OnboardingChecklistStage['code'], { ownerLabel: string; timelineLabel: string }> = {
  pre_start: {
    ownerLabel: 'HR',
    timelineLabel: 'Trước ngày bắt đầu',
  },
  day_1: {
    ownerLabel: 'Quản lý cửa hàng',
    timelineLabel: 'Ngày đầu nhận việc',
  },
  day_2_3: {
    ownerLabel: 'Buddy / Quản lý ca',
    timelineLabel: 'Ngày 2 đến ngày 3',
  },
  day_4_7: {
    ownerLabel: 'Buddy / Quản lý ca',
    timelineLabel: 'Ngày 4 đến ngày 7',
  },
  week_2: {
    ownerLabel: 'HR / Quản lý cửa hàng',
    timelineLabel: 'Tuần 2 trở đi',
  },
}

const confirmerRoleLabelMap: Record<OnboardingChecklistItemTemplate['confirmer_role'], string> = {
  employee: 'Nhân sự mới',
  buddy: 'Buddy',
  shift_leader: 'Quản lý ca',
  store_manager: 'Quản lý cửa hàng',
  hr_admin: 'HR',
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return 'Chưa có'
  return value.split('T')[0] || value
}

function buildGeneralRows(selectedTemplate: OnboardingChecklistTemplate | null): TrialWorkflowGeneralInfoRow[] {
  const trialLengthValue = selectedTemplate ? `${selectedTemplate.journey_length_days} ngày` : 'Chưa có'

  return [
    {
      id: 'trial-length',
      label: 'Thời gian thử việc',
      value: trialLengthValue,
      status: selectedTemplate ? 'Đã có' : 'Còn thiếu',
      actionLabel: selectedTemplate ? 'Sửa' : 'Thiết lập ngay',
      targetTab: 'general',
    },
    {
      id: 'trial-start-anchor',
      label: 'Mốc bắt đầu tính thử việc',
      value: 'Chưa có',
      status: 'Còn thiếu',
      actionLabel: 'Thiết lập ngay',
      targetTab: 'general',
    },
    {
      id: 'primary-owner',
      label: 'Người theo dõi chính',
      value: 'Chưa có',
      status: 'Còn thiếu',
      actionLabel: 'Thiết lập ngay',
      targetTab: 'general',
    },
    {
      id: 'contributors',
      label: 'Người phối hợp',
      value: 'Chưa có',
      status: 'Còn thiếu',
      actionLabel: 'Thiết lập ngay',
      targetTab: 'general',
    },
    {
      id: 'closing-rule',
      label: 'Nguyên tắc chốt cuối kỳ',
      value: 'Chưa có',
      status: 'Còn thiếu',
      actionLabel: 'Thiết lập ngay',
      targetTab: 'gates',
    },
    {
      id: 'closing-note-location',
      label: 'Nơi lưu ghi nhận cuối kỳ',
      value: 'Chưa có',
      status: 'Còn thiếu',
      actionLabel: 'Thiết lập ngay',
      targetTab: 'general',
    },
  ]
}

function buildStageRows(stages: OnboardingChecklistStage[]): TrialWorkflowStageRow[] {
  if (stages.length === 0) {
    return defaultStageRows.map((stage, index) => ({
      id: `default-stage-${index + 1}`,
      stageName: stage.stageName,
      goalLabel: 'Chưa có',
      ownerLabel: stage.ownerLabel,
      timelineLabel: stage.timelineLabel,
      completionLabel: 'Chưa chốt',
      status: 'Còn thiếu',
      actionLabel: 'Thiết lập ngay',
      targetTab: 'stages',
    }))
  }

  return stages.map((stage) => {
    const meta = stageMetaByCode[stage.code]
    const hasGoal = stage.goal_summary.trim().length > 0

    return {
      id: stage.id,
      stageName: stage.label,
      goalLabel: hasGoal ? stage.goal_summary : 'Chưa có',
      ownerLabel: meta.ownerLabel,
      timelineLabel: meta.timelineLabel,
      completionLabel: stage.required_to_pass ? 'Bắt buộc hoàn tất' : 'Hỗ trợ rà soát',
      status: hasGoal ? 'Đã có' : 'Còn thiếu',
      actionLabel: hasGoal ? 'Sửa' : 'Thiết lập ngay',
      targetTab: 'stages',
    }
  })
}

function buildTaskRows(selectedStageLabel: string, items: OnboardingChecklistItemTemplate[]): TrialWorkflowTaskRow[] {
  if (items.length === 0) {
    return [
      {
        id: 'task-empty',
        taskLabel: 'Chưa có',
        ownerLabel: 'Chưa có',
        outcomeLabel: 'Chưa có',
        requiredLabel: 'Chưa có',
        dueLabel: 'Chưa có',
        statusLabel: 'Còn thiếu',
        actionLabel: 'Thiết lập ngay',
        targetTab: 'tasks',
      },
    ]
  }

  return items.map((item) => {
    const hasEnoughData = item.title.trim().length > 0 && item.success_criteria.trim().length > 0

    return {
      id: item.id,
      taskLabel: item.title.trim().length > 0 ? item.title : 'Chưa có',
      ownerLabel: confirmerRoleLabelMap[item.confirmer_role],
      outcomeLabel: item.success_criteria.trim().length > 0 ? item.success_criteria : 'Chưa có',
      requiredLabel: item.is_required ? 'Bắt buộc' : 'Không bắt buộc',
      dueLabel: `Trong ${selectedStageLabel}`,
      statusLabel: item.active ? 'Đang dùng' : 'Đang ẩn',
      actionLabel: hasEnoughData ? 'Sửa' : 'Thiết lập ngay',
      targetTab: 'tasks',
    }
  })
}

function buildGateRows(
  report: OnboardingPublishValidationReport | null,
  issues: OnboardingRoleSettingsValidationIssue[],
): TrialWorkflowGateRow[] {
  const rows: TrialWorkflowGateRow[] = []

  report?.blocking_issues.forEach((issue, index) => {
    rows.push({
      id: `gate-blocking-${index}`,
      conditionLabel: issue.message,
      currentResultLabel: 'Còn thiếu',
      requirementLevelLabel: 'Bắt buộc',
      approverLabel: 'Chưa có',
      actionLabel: 'Thiết lập ngay',
      targetTab: 'gates',
    })
  })

  report?.warning_issues.forEach((issue, index) => {
    rows.push({
      id: `gate-warning-${index}`,
      conditionLabel: issue.message,
      currentResultLabel: 'Cần rà lại',
      requirementLevelLabel: 'Hỗ trợ',
      approverLabel: 'Quản lý cửa hàng',
      actionLabel: 'Sửa',
      targetTab: 'gates',
    })
  })

  issues
    .filter((issue) => issue.code !== 'duplicate_position')
    .forEach((issue, index) => {
      rows.push({
        id: `gate-setting-${index}`,
        conditionLabel: issue.message,
        currentResultLabel: 'Còn thiếu',
        requirementLevelLabel: 'Bắt buộc',
        approverLabel: 'HR',
        actionLabel: 'Thiết lập ngay',
        targetTab: 'gates',
      })
    })

  if (rows.length === 0) {
    rows.push(
      {
        id: 'gate-ready-check',
        conditionLabel: 'Đủ việc bắt buộc trước khi qua chặng',
        currentResultLabel: report ? 'Đã rà soát' : 'Chưa có',
        requirementLevelLabel: 'Bắt buộc',
        approverLabel: 'Quản lý cửa hàng',
        actionLabel: report ? 'Sửa' : 'Thiết lập ngay',
        targetTab: 'gates',
      },
      {
        id: 'gate-approver',
        conditionLabel: 'Người duyệt qua chặng đã được chốt',
        currentResultLabel: 'Chưa có',
        requirementLevelLabel: 'Hỗ trợ',
        approverLabel: 'Chưa có',
        actionLabel: 'Thiết lập ngay',
        targetTab: 'gates',
      },
    )
  }

  return rows
}

function buildAssignmentRows(
  draft: OnboardingRoleSettings,
  templateById: Map<string, OnboardingChecklistTemplate>,
): TrialWorkflowAssignmentRow[] {
  const enabledRoles = draft.roles.filter((role) => role.enabled)

  if (enabledRoles.length === 0) {
    return [
      {
        id: 'assignment-empty',
        groupLabel: 'Chưa có',
        storeLabel: 'Chưa có',
        positionLabel: 'Chưa có',
        startDateLabel: 'Chưa có',
        statusLabel: 'Còn thiếu',
        actionLabel: 'Thiết lập ngay',
        targetTab: 'assignments',
      },
    ]
  }

  return enabledRoles.map((role) => {
    const template = role.template_id ? templateById.get(role.template_id) ?? null : null
    const positionNames = role.position_ids
      .map((positionId) => mockPositions.find((position) => position.id === positionId)?.name)
      .filter((value): value is string => Boolean(value))

    const hasEnoughData = role.position_ids.length > 0 && Boolean(role.template_id)

    return {
      id: role.role_code,
      groupLabel: role.label || role.role_code,
      storeLabel: 'Tất cả cửa hàng',
      positionLabel: positionNames.length > 0 ? positionNames.join(', ') : 'Chưa có',
      startDateLabel: formatDateLabel(template?.effective_from ?? template?.published_at ?? null),
      statusLabel: hasEnoughData ? 'Đang áp dụng' : 'Còn thiếu',
      actionLabel: hasEnoughData ? 'Sửa' : 'Thiết lập ngay',
      targetTab: 'assignments',
    }
  })
}

export function buildTrialWorkflowSetupViewModel(input: {
  draft: OnboardingRoleSettings
  issues: OnboardingRoleSettingsValidationIssue[]
  readinessIssues: TrialWorkflowReadinessIssue[]
  selectedTemplate: OnboardingChecklistTemplate | null
  selectedTemplateStages: OnboardingChecklistStage[]
  selectedStageLabel: string
  selectedStageItems: OnboardingChecklistItemTemplate[]
  publishReport: OnboardingPublishValidationReport | null
}) {
  const generalRows = buildGeneralRows(input.selectedTemplate)
  const stageRows = buildStageRows(input.selectedTemplateStages)
  const taskRows = buildTaskRows(input.selectedStageLabel, input.selectedStageItems)
  const gateRows = buildGateRows(input.publishReport, input.issues)
  const templateById = new Map(input.selectedTemplate ? [[input.selectedTemplate.id, input.selectedTemplate]] : [])
  const assignmentRows = buildAssignmentRows(input.draft, templateById)

  const missingItems: TrialWorkflowMissingItem[] = []

  generalRows
    .filter((row) => row.status === 'Còn thiếu')
    .forEach((row) => {
      missingItems.push({
        id: `general-${row.id}`,
        label: `${row.label} chưa được chốt.`,
        tabKey: 'general',
        tabLabel: 'Thông tin chung',
        actionLabel: row.actionLabel,
      })
    })

  stageRows
    .filter((row) => row.status === 'Còn thiếu')
    .forEach((row) => {
      missingItems.push({
        id: `stage-${row.id}`,
        label: `${row.stageName} chưa có mục tiêu chặng rõ ràng.`,
        tabKey: 'stages',
        tabLabel: 'Bốn chặng thử việc',
        actionLabel: row.actionLabel,
      })
    })

  if (taskRows.some((row) => row.actionLabel === 'Thiết lập ngay')) {
    missingItems.push({
      id: 'task-missing',
      label: `Chặng ${input.selectedStageLabel} còn việc cần làm chưa được chốt đủ kết quả cần có.`,
      tabKey: 'tasks',
      tabLabel: 'Việc cần làm',
      actionLabel: 'Thiết lập ngay',
    })
  }

  gateRows
    .filter((row) => row.actionLabel === 'Thiết lập ngay')
    .forEach((row) => {
      missingItems.push({
        id: `gate-${row.id}`,
        label: row.conditionLabel,
        tabKey: 'gates',
        tabLabel: 'Điều kiện qua chặng',
        actionLabel: row.actionLabel,
      })
    })

  assignmentRows
    .filter((row) => row.actionLabel === 'Thiết lập ngay')
    .forEach((row) => {
      missingItems.push({
        id: `assignment-${row.id}`,
        label: `${row.groupLabel} chưa đủ phạm vi áp dụng hoặc ngày bắt đầu dùng.`,
        tabKey: 'assignments',
        tabLabel: 'Áp dụng quy trình',
        actionLabel: row.actionLabel,
      })
    })

  if (input.readinessIssues.some((issue) => issue.code === 'missing_assignment_group')) {
    missingItems.push({
      id: 'assignment-scope-gap',
      label: 'Chưa chọn nhóm áp dụng cho quy trình này.',
      tabKey: 'assignments',
      tabLabel: 'Áp dụng quy trình',
      actionLabel: 'Thiết lập ngay',
    })
  }

  const tabs: TrialWorkflowTabItem[] = [
    {
      key: 'general',
      label: 'Thông tin chung',
      missingCount: missingItems.filter((item) => item.tabKey === 'general').length,
    },
    {
      key: 'stages',
      label: 'Bốn chặng thử việc',
      missingCount: missingItems.filter((item) => item.tabKey === 'stages').length,
    },
    {
      key: 'tasks',
      label: 'Việc cần làm',
      missingCount: missingItems.filter((item) => item.tabKey === 'tasks').length,
    },
    {
      key: 'gates',
      label: 'Điều kiện qua chặng',
      missingCount: missingItems.filter((item) => item.tabKey === 'gates').length,
    },
    {
      key: 'assignments',
      label: 'Áp dụng quy trình',
      missingCount: missingItems.filter((item) => item.tabKey === 'assignments').length,
    },
  ]

  const completedTabCount = tabs.filter((tab) => tab.missingCount === 0).length
  const totalMissingCount = tabs.reduce((sum, tab) => sum + tab.missingCount, 0)

  let setupState: TrialWorkflowSetupState

  if (totalMissingCount === 0) {
    setupState = {
      label: 'Sẵn sàng đưa vào áp dụng',
      helper: 'HR chỉ cần rà lần cuối rồi có thể đưa quy trình vào áp dụng cho cửa hàng và vị trí đã chọn.',
      actionLabel: 'Rà tab áp dụng quy trình',
      targetTab: 'assignments',
    }
  } else if (totalMissingCount >= 10) {
    setupState = {
      label: 'Lần đầu thiết lập',
      helper: 'Nên bắt đầu từ Thông tin chung, rồi chốt Bốn chặng thử việc trước khi soạn việc chi tiết và điều kiện qua chặng.',
      actionLabel: 'Bắt đầu từ Thông tin chung',
      targetTab: 'general',
    }
  } else if (totalMissingCount >= 4) {
    setupState = {
      label: 'Đang làm dở',
      helper: 'Khung chính đã có một phần. Đi tới Bốn chặng thử việc hoặc các thẻ còn thiếu để hoàn thiện dần từng bảng.',
      actionLabel: 'Đi tới Bốn chặng thử việc',
      targetTab: 'stages',
    }
  } else {
    setupState = {
      label: 'Gần hoàn tất',
      helper: 'Chỉ còn ít điểm thiếu. Rà nốt điều kiện qua chặng và nơi áp dụng trước khi đưa vào áp dụng.',
      actionLabel: 'Rà nốt chỗ còn thiếu',
      targetTab: tabs.find((tab) => tab.missingCount > 0)?.key ?? 'assignments',
    }
  }

  const topMetrics: TrialWorkflowMetric[] = [
    {
      label: 'Phần đã xong',
      value: completedTabCount,
      tone: completedTabCount === tabs.length ? 'neutral' : 'warning',
    },
    {
      label: 'Chỗ còn thiếu',
      value: totalMissingCount,
      tone: totalMissingCount > 0 ? 'danger' : 'neutral',
    },
    {
      label: 'Sẵn sàng dùng',
      value: totalMissingCount === 0 ? 1 : 0,
      tone: totalMissingCount === 0 ? 'neutral' : 'warning',
    },
  ]

  return {
    tabs,
    topMetrics,
    setupState,
    generalRows,
    stageRows,
    taskRows,
    gateRows,
    assignmentRows,
    missingItems,
  }
}
