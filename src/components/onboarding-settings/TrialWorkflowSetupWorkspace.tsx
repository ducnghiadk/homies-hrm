'use client'

import React, { useState } from 'react'
import {
  buildTrialWorkflowReadinessReport,
  getOnboardingChecklistItems,
  getOnboardingChecklistStages,
  getOnboardingChecklistTemplates,
  getOnboardingContentTopics,
  getOnboardingRoleSettings,
  publishOnboardingChecklistTemplate,
  updateOnboardingRoleSettings,
  validateOnboardingRoleSettings,
  validateOnboardingTemplateForPublishReport,
} from '@/lib/career-path-service'
import type {
  OnboardingChecklistTemplate,
  OnboardingRoleSetting,
  OnboardingRoleSettings,
  OnboardingRoleSettingsValidationIssue,
} from '@/lib/career-path-types'
import { mockPositions } from '@/lib/mock-data'
import { OnboardingRoleCard } from '@/components/onboarding-settings/OnboardingRoleCard'
import { OnboardingRoleFilters, type OnboardingRoleFilterKey } from '@/components/onboarding-settings/OnboardingRoleFilters'
import { OnboardingSettingsSummaryBar } from '@/components/onboarding-settings/OnboardingSettingsSummaryBar'
import { TrialWorkflowAssignmentsTab } from '@/components/onboarding-settings/TrialWorkflowAssignmentsTab'
import { TrialWorkflowGateConditionsTab } from '@/components/onboarding-settings/TrialWorkflowGateConditionsTab'
import { TrialWorkflowGeneralInfoTab } from '@/components/onboarding-settings/TrialWorkflowGeneralInfoTab'
import { TrialWorkflowStagesTab } from '@/components/onboarding-settings/TrialWorkflowStagesTab'
import { TrialWorkflowTabBar, type TrialWorkflowTabKey } from '@/components/onboarding-settings/TrialWorkflowTabBar'
import { TrialWorkflowTasksTab } from '@/components/onboarding-settings/TrialWorkflowTasksTab'
import { TrialWorkflowWorkspacePanel } from '@/components/onboarding-settings/TrialWorkflowWorkspacePanel'
import { buildTrialWorkflowSetupViewModel } from '@/components/onboarding-settings/buildTrialWorkflowSetupViewModel'

type SaveState = {
  tone: 'idle' | 'success' | 'error'
  message: string | null
}


const tabSections: Record<TrialWorkflowTabKey, { title: string; helper: string }> = {
  general: {
    title: 'Thông tin chung',
    helper: 'HR rà soát nền tảng quy trình, thời gian thử việc và trạng thái sẵn sàng trước khi đi sâu vào từng phần.',
  },
  stages: {
    title: 'Bốn chặng thử việc',
    helper: 'Chốt xương sống quy trình bằng bốn chặng rõ mục tiêu, người phụ trách và mốc thời gian hoàn tất.',
  },
  tasks: {
    title: 'Việc cần làm',
    helper: 'Dùng bảng trung tâm để soát mẫu đang mở, số nhóm nội dung và số việc phải có trong từng chặng.',
  },
  gates: {
    title: 'Điều kiện qua chặng',
    helper: 'Kiểm tra chỗ còn thiếu trước khi đưa mẫu vào dùng và chốt điều kiện duyệt cho từng chặng.',
  },
  assignments: {
    title: 'Áp dụng quy trình',
    helper: 'Thẻ đang mở luôn là phần HR đang rà soát. Mỗi lần chỉ mở một thẻ để bảng làm việc gọn và dễ kiểm tra.',
  },
}

function readRoleSettings(): OnboardingRoleSettings {
  return getOnboardingRoleSettings()
}

export function TrialWorkflowSetupWorkspace() {
  const [draft, setDraft] = useState<OnboardingRoleSettings>(() => readRoleSettings())
  const [templates, setTemplates] = useState<OnboardingChecklistTemplate[]>(() => getOnboardingChecklistTemplates())
  const [issues, setIssues] = useState<OnboardingRoleSettingsValidationIssue[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>({ tone: 'idle', message: null })
  const [roleFilter, setRoleFilter] = useState<OnboardingRoleFilterKey>('all')
  const [roleSearch, setRoleSearch] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(() => getOnboardingChecklistTemplates()[0]?.id ?? null)
  const [activeTab, setActiveTab] = useState<TrialWorkflowTabKey>('general')

  const refreshTemplates = (nextTemplateId?: string | null) => {
    const nextTemplates = getOnboardingChecklistTemplates()
    const nextSettings = readRoleSettings()
    const fallbackTemplateId = nextTemplates[0]?.id ?? null
    const resolvedTemplateId = typeof nextTemplateId !== 'undefined'
      ? nextTemplateId
      : selectedTemplateId && nextTemplates.some((template) => template.id === selectedTemplateId)
        ? selectedTemplateId
        : fallbackTemplateId

    setTemplates(nextTemplates)
    setSelectedTemplateId(resolvedTemplateId ?? null)
    setDraft(nextSettings)
    setIssues([])
    setIsDirty(false)
    setSaveState({ tone: 'idle', message: null })
  }

  const updateRole = (roleCode: string, updater: (role: OnboardingRoleSetting) => OnboardingRoleSetting) => {
    setDraft((current) => ({
      ...current,
      roles: current.roles.map((role) => (role.role_code === roleCode ? updater(role) : role)),
    }))
    setIsDirty(true)
    setIssues([])
    setSaveState({ tone: 'idle', message: null })
  }

  const togglePosition = (roleCode: string, positionId: string) => {
    updateRole(roleCode, (role) => {
      const hasPosition = role.position_ids.includes(positionId)
      return {
        ...role,
        position_ids: hasPosition ? role.position_ids.filter((id) => id !== positionId) : [...role.position_ids, positionId],
      }
    })
  }

  const handleSave = () => {
    const nextIssues = validateOnboardingRoleSettings(draft)
    if (nextIssues.length > 0) {
      setIssues(nextIssues)
      setSaveState({ tone: 'error', message: 'Thông tin nhóm áp dụng còn lỗi. Kiểm tra lại trước khi lưu.' })
      return
    }

    const result = updateOnboardingRoleSettings(draft)
    if (!result.success) {
      setDraft(result.settings)
      setIssues(result.issues)
      setSaveState({ tone: 'error', message: 'Hệ thống từ chối lưu vì dữ liệu chưa hợp lệ.' })
      return
    }

    setDraft(result.settings)
    setIssues([])
    setIsDirty(false)
    setSaveState({ tone: 'success', message: 'Đã lưu thay đổi quy trình thử việc.' })
  }

  const activeTemplates = templates.filter((template) => template.status === 'published' || template.status === 'draft')
  const selectedTemplate = activeTemplates.find((template) => template.id === selectedTemplateId) ?? activeTemplates[0] ?? null
  const selectedTemplateStages = selectedTemplate ? getOnboardingChecklistStages(selectedTemplate.id) : []
  const selectedStage = selectedTemplateStages[0] ?? null
  const selectedTemplateTopics = selectedTemplate ? getOnboardingContentTopics(selectedTemplate.id) : []
  const selectedTemplateItems = selectedTemplate ? getOnboardingChecklistItems(selectedTemplate.id) : []
  const selectedStageItems = selectedStage
    ? selectedTemplateItems.filter((item) => item.stage_id === selectedStage.id)
    : selectedTemplateItems
  const topicCountByTemplate = Object.fromEntries(activeTemplates.map((template) => [template.id, getOnboardingContentTopics(template.id).length]))
  const readinessIssues = buildTrialWorkflowReadinessReport(draft)
  const duplicateMappingIssues = issues.filter((issue) => issue.code === 'duplicate_position')
  const duplicatePositionIds = Array.from(new Set(duplicateMappingIssues.map((issue) => issue.position_id).filter((value): value is string => Boolean(value))))
  const rolesWithIssues = new Set(issues.map((issue) => issue.role_code).filter((value): value is string => Boolean(value)))
  const publishReport = selectedTemplate ? validateOnboardingTemplateForPublishReport(selectedTemplate.id) : null

  const viewModel = buildTrialWorkflowSetupViewModel({
    draft,
    issues,
    readinessIssues,
    selectedTemplate,
    selectedTemplateStages,
    selectedStageLabel: selectedStage?.label ?? 'Chưa có chặng nào',
    selectedStageItems,
    publishReport,
  })

  const filteredRoles = draft.roles.filter((role) => {
    const normalizedSearch = roleSearch.trim().toLowerCase()
    const relatedPositions = mockPositions.filter((position) => role.position_ids.includes(position.id))
    const matchesSearch = normalizedSearch.length === 0 || [role.label, role.role_code, ...relatedPositions.map((position) => `${position.name} ${position.id}`)]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch)

    if (!matchesSearch) return false
    if (roleFilter === 'enabled') return role.enabled
    if (roleFilter === 'issues') return rolesWithIssues.has(role.role_code)
    if (roleFilter === 'missing_template') return !role.template_id || issues.some((issue) => issue.role_code === role.role_code && issue.code === 'missing_template')
    return true
  })

  const saveStatusMessage = saveState.message
    ?? (isDirty
      ? 'Đã chỉnh sửa, chưa lưu.'
      : viewModel.missingItems.length > 0
        ? 'Còn điểm cần hoàn thiện trước khi đưa vào sử dụng.'
        : 'Quy trình đã sẵn sàng để đưa vào sử dụng.')

  const activeSection = tabSections[activeTab]
  const firstIncompleteTab = viewModel.tabs.find((tab) => tab.missingCount > 0)?.key ?? 'general'
  const gateMissingRows = viewModel.missingItems.filter((row) => row.tabKey === 'gates')
  const assignmentMissingRows = viewModel.missingItems.filter((row) => row.tabKey === 'assignments')
  const setupState = viewModel.setupState

  const handlePublishTemplate = () => {
    if (!selectedTemplate || selectedTemplate.status !== 'draft') {
      setSaveState({ tone: 'error', message: 'Chỉ bản nháp mới có thể đưa vào sử dụng.' })
      return
    }

    try {
      const published = publishOnboardingChecklistTemplate(selectedTemplate.id)
      refreshTemplates(published.id)
      setSaveState({ tone: 'success', message: 'Đã đưa mẫu thử việc vào sử dụng.' })
    } catch (error) {
      setSaveState({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Không thể đưa mẫu thử việc vào sử dụng.',
      })
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section id="trial-workflow-overview" style={overviewStyle}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={overviewTitleStyle}>Thiết lập cho HR</div>
          <div style={overviewHelperStyle}>{saveStatusMessage}</div>
          <div style={overviewMetaStyle}>Thẻ đang mở được hiển thị từng phần để HR soát nhanh và chỉ tập trung vào một khu vực tại một thời điểm.</div>
          <div style={setupStateCardStyle}>
            <div style={setupStateLabelStyle}>Trạng thái thiết lập</div>
            <div style={setupStateTitleStyle}>{setupState.label}</div>
            <div style={setupStateHelperStyle}>{setupState.helper}</div>
            <div style={setupStateActionNoteStyle}>Gợi ý nhanh: Bắt đầu từ Thông tin chung hoặc Đi tới Bốn chặng thử việc.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setActiveTab(firstIncompleteTab)} style={secondaryButtonStyle}>Xem chỗ còn thiếu</button>

          <button type="button" onClick={handleSave} style={primaryButtonStyle}>

            Lưu bản nháp
          </button>
          <button type={'button'} onClick={handlePublishTemplate} disabled={!selectedTemplate || selectedTemplate.status !== 'draft'} style={{ ...secondaryButtonStyle, opacity: !selectedTemplate || selectedTemplate.status !== 'draft' ? 0.6 : 1, cursor: !selectedTemplate || selectedTemplate.status !== 'draft' ? 'not-allowed' : 'pointer' }}>
            Đưa vào áp dụng
          </button>
        </div>
      </section>

      {saveState.tone === 'error' ? (
        <div style={errorBoxStyle}>{saveState.message}</div>
      ) : null}

      <OnboardingSettingsSummaryBar
        metrics={viewModel.topMetrics.map((metric) => ({
          label: metric.label,
          value: metric.value,
          href: '#trial-workflow-active-tab',
          tone: metric.tone,
        }))}
      />

      <TrialWorkflowTabBar items={viewModel.tabs} activeTab={activeTab} onSelect={setActiveTab} />

      <TrialWorkflowWorkspacePanel id="trial-workflow-active-tab" title={activeSection.title} helper={activeSection.helper}>
        {activeTab === 'general' ? (
          <TrialWorkflowGeneralInfoTab rows={viewModel.generalRows} onJump={setActiveTab} />
        ) : null}

        {activeTab === 'stages' ? (
          <TrialWorkflowStagesTab
            rows={viewModel.stageRows}
            templates={activeTemplates}
            topicCountByTemplate={topicCountByTemplate}
            selectedTemplateId={selectedTemplate?.id ?? null}
            onSelectTemplate={setSelectedTemplateId}
            onJump={setActiveTab}
          />
        ) : null}

        {activeTab === 'tasks' ? (
          <TrialWorkflowTasksTab
            rows={viewModel.taskRows}
            template={selectedTemplate}
            activeStageLabel={selectedStage?.label ?? 'Chưa có chặng nào'}
            onJump={setActiveTab}
          />
        ) : null}

        {activeTab === 'gates' ? (
          <TrialWorkflowGateConditionsTab
            report={publishReport}
            rows={viewModel.gateRows}
            missingRows={gateMissingRows}
            onSelect={setActiveTab}
            onRefresh={() => refreshTemplates(selectedTemplate?.id ?? null)}
            onPublish={handlePublishTemplate}
            publishDisabled={!selectedTemplate || selectedTemplate.status !== 'draft'}
          />
        ) : null}

        {activeTab === 'assignments' ? (
          <TrialWorkflowAssignmentsTab
            rows={viewModel.assignmentRows}
            roleFilter={roleFilter}
            roleSearch={roleSearch}
            onRoleFilterChange={setRoleFilter}
            onRoleSearchChange={setRoleSearch}
            missingRows={assignmentMissingRows}
            onSelectMissing={setActiveTab}
            roles={
              <div style={{ display: 'grid', gap: 10 }}>
                {filteredRoles.map((role) => (
                  <OnboardingRoleCard
                    key={role.role_code}
                    role={role}
                    templates={activeTemplates}
                    positions={mockPositions.map((position) => ({ id: position.id, name: position.name }))}
                    issues={issues.filter((issue) => issue.role_code === role.role_code)}
                    duplicatePositionIds={duplicatePositionIds}
                    onToggleEnabled={() => updateRole(role.role_code, (current) => ({ ...current, enabled: !current.enabled }))}
                    onLabelChange={(next) => updateRole(role.role_code, (current) => ({ ...current, label: next }))}
                    onTemplateChange={(next) => updateRole(role.role_code, (current) => ({ ...current, template_id: next || null }))}
                    onTogglePosition={(positionId) => togglePosition(role.role_code, positionId)}
                  />
                ))}
                {filteredRoles.length === 0 ? <div style={emptyTextStyle}>Không có nhóm áp dụng nào khớp bộ lọc hiện tại.</div> : null}
              </div>
            }
          />
        ) : null}
      </TrialWorkflowWorkspacePanel>
    </div>
  )
}

const overviewStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
  padding: 20,
  borderRadius: 24,
  border: '1px solid rgba(0, 29, 61, 0.08)',
  background: '#FFF8E8',
}

const overviewTitleStyle: React.CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A6B53' }
const overviewHelperStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#5F6B7A' }
const overviewMetaStyle: React.CSSProperties = { fontSize: 12, lineHeight: 1.6, color: '#667085' }
const setupStateCardStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 12, borderRadius: 14, border: '1px solid rgba(122, 107, 83, 0.18)', background: '#fffdf7' }
const setupStateLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#7A6B53', textTransform: 'uppercase', letterSpacing: '0.04em' }
const setupStateTitleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#111827' }
const setupStateHelperStyle: React.CSSProperties = { fontSize: 12, lineHeight: 1.6, color: '#475467' }
const setupStateActionNoteStyle: React.CSSProperties = { fontSize: 11, lineHeight: 1.6, color: '#667085' }
const primaryButtonStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontSize: 11, fontWeight: 600 }
const secondaryButtonStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', color: '#344054', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const errorBoxStyle: React.CSSProperties = { padding: 12, borderRadius: 10, background: '#fff3f2', border: '1px solid #f3c0bc', color: '#b42318', fontSize: 12, lineHeight: 1.6 }
const emptyTextStyle: React.CSSProperties = { fontSize: 12, color: '#667085' }
