'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  initCareerPathStores,
  getLevels,
  getSkills,
  getPromotionConditions,
  getBuddyRewards,
  getTrialChecklist,
  getOnboardingSteps,
  getSettings,
  getChangeLogs,
  updateOnboardingRoleSettings,
  getOnboardingChecklistTemplates,
  validateOnboardingRoleSettings,
  getUnmatchedOnboardingRoleEmployees,
  exportSettings,
  importSettings,
} from '@/lib/career-path-service'
import type {
  CareerLevel,
  Skill,
  PromotionCondition,
  BuddyRewardConfig,
  TrialChecklistItem,
  OnboardingStep,
  CareerPathSettings,
  SettingsChangeLog,
  OnboardingChecklistTemplate,
  OnboardingRoleSetting,
  OnboardingRoleSettings,
  OnboardingRoleSettingsValidationIssue,
} from '@/lib/career-path-types'
import { mockPositions } from '@/lib/mock-data'
import { OnboardingSettingsSummaryBar, type OnboardingSettingsSummaryMetric } from '@/components/onboarding-settings/OnboardingSettingsSummaryBar'
import { OnboardingSettingsUrgentPanel, type OnboardingSettingsUrgentRow } from '@/components/onboarding-settings/OnboardingSettingsUrgentPanel'
import { OnboardingRoleFilters, type OnboardingRoleFilterKey } from '@/components/onboarding-settings/OnboardingRoleFilters'
import { OnboardingRoleCard } from '@/components/onboarding-settings/OnboardingRoleCard'
import { OnboardingSettingsAdminRail } from '@/components/onboarding-settings/OnboardingSettingsAdminRail'

type TabId = 'levels' | 'skills' | 'conditions' | 'buddy' | 'onboarding' | 'roles' | 'general'
type UnmatchedEmployee = ReturnType<typeof getUnmatchedOnboardingRoleEmployees>[number]

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'levels', label: 'Cấp bậc', icon: '📊' },
  { id: 'skills', label: 'Kỹ năng', icon: '⚡' },
  { id: 'conditions', label: 'Điều kiện', icon: '📋' },
  { id: 'buddy', label: 'Buddy', icon: '🤝' },
  { id: 'onboarding', label: 'Bước onboarding', icon: '📝' },
  { id: 'roles', label: 'Cấu hình onboarding', icon: '🧭' },
  { id: 'general', label: 'Chung', icon: '⚙️' },
]

export default function CareerPathSettingsPage() {
  initCareerPathStores()
  const [activeTab, setActiveTab] = useState<TabId>('roles')
  const [levels, setLevels] = useState<CareerLevel[]>(() => getLevels())
  const [skills, setSkills] = useState<Skill[]>(() => getSkills())
  const [conditions, setConditions] = useState<PromotionCondition[]>(() => getPromotionConditions())
  const [rewards, setRewards] = useState<BuddyRewardConfig[]>(() => getBuddyRewards())
  const [checklist, setChecklist] = useState<TrialChecklistItem[]>(() => getTrialChecklist())
  const [onbSteps, setOnbSteps] = useState<OnboardingStep[]>(() => getOnboardingSteps())
  const [settings, setSettingsState] = useState<CareerPathSettings | null>(() => getSettings())
  const [logs, setLogs] = useState<SettingsChangeLog[]>(() => getChangeLogs())
  const [showLogs, setShowLogs] = useState(false)

  const reload = () => {
    setLevels(getLevels())
    setSkills(getSkills())
    setConditions(getPromotionConditions())
    setRewards(getBuddyRewards())
    setChecklist(getTrialChecklist())
    setOnbSteps(getOnboardingSteps())
    setSettingsState(getSettings())
    setLogs(getChangeLogs())
  }

  const handleExport = () => {
    const data = exportSettings()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'career-path-settings.json'
    anchor.click()
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      if (importSettings(reader.result)) {
        reload()
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ padding: '20px 24px 96px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/settings" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Cài đặt Career Path</h1>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowLogs((current) => !current)} style={secondaryButtonStyle}>Logs</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: 500,
              background: activeTab === tab.id ? '#667eea' : '#f0f0f0',
              color: activeTab === tab.id ? '#fff' : '#555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'levels' ? <LevelsTab levels={levels} /> : null}
      {activeTab === 'skills' ? <SkillsTab skills={skills} /> : null}
      {activeTab === 'conditions' ? <ConditionsTab conditions={conditions} /> : null}
      {activeTab === 'buddy' ? <BuddyTab rewards={rewards} checklist={checklist} /> : null}
      {activeTab === 'onboarding' ? <OnboardingTab steps={onbSteps} checklist={checklist} /> : null}
      {activeTab === 'roles' && settings ? <OnboardingRolesTab onReload={reload} savedSettings={settings.onboarding_role_settings} /> : null}
      {activeTab === 'general' ? <GeneralTab onExport={handleExport} onImport={handleImport} /> : null}

      {showLogs ? (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Lịch sử thay đổi</div>
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} style={{ fontSize: 12, color: '#667085', padding: '6px 0', borderBottom: '1px solid #f2f4f7' }}>
              {log.description} • {log.changed_at}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function LevelsTab({ levels }: { levels: CareerLevel[] }) {
  const sorted = [...levels].sort((left, right) => left.order - right.order)
  return (
    <Panel title="Cấp bậc" subtitle="Đọc nhanh cấu trúc cấp bậc hiện tại.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((level) => (
          <CardRow
            key={level.id}
            title={level.name}
            meta={`Order ${level.order} • ${level.min_skills_required} kỹ năng tối thiểu • ${level.min_months} tháng`}
            badge={level.is_active ? 'Bật' : 'Tắt'}
          />
        ))}
      </div>
    </Panel>
  )
}

function SkillsTab({ skills }: { skills: Skill[] }) {
  const groups = [
    { key: 'basic', label: 'Cơ bản' },
    { key: 'advanced', label: 'Nâng cao' },
    { key: 'management', label: 'Quản lý' },
  ] as const

  return (
    <Panel title="Kỹ năng" subtitle="Nhóm kỹ năng đang được mở trong career path.">
      {groups.map((group) => (
        <div key={group.key} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#344054', marginBottom: 6 }}>{group.label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {skills.filter((skill) => skill.category === group.key).map((skill) => (
              <CardRow
                key={skill.id}
                title={skill.name}
                meta={`${skill.is_active ? 'Đang bật' : 'Đang tắt'}${skill.requires_approval ? ' • Cần duyệt' : ''}`}
              />
            ))}
          </div>
        </div>
      ))}
    </Panel>
  )
}

function ConditionsTab({ conditions }: { conditions: PromotionCondition[] }) {
  return (
    <Panel title="Điều kiện" subtitle="Điều kiện xét thăng tiến đang được áp dụng.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conditions.map((condition) => (
          <CardRow
            key={condition.id}
            title={`${condition.from_level_id} → ${condition.to_level_id}`}
            meta={condition.conditions.map((item) => `${item.label} ${item.operator} ${item.value}`).join(' • ')}
          />
        ))}
      </div>
    </Panel>
  )
}

function BuddyTab({ rewards, checklist }: { rewards: BuddyRewardConfig[]; checklist: TrialChecklistItem[] }) {
  return (
    <Panel title="Buddy" subtitle="Phần thưởng buddy và checklist thử việc liên quan.">
      <div style={{ display: 'grid', gap: 8 }}>
        {rewards.map((reward) => (
          <CardRow key={reward.id} title={reward.name} meta={reward.description} badge={reward.is_active ? 'Bật' : 'Tắt'} />
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#344054', margin: '14px 0 6px' }}>Checklist thử việc</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {checklist.map((item) => (
          <CardRow key={item.id} title={item.title} meta={`${item.weight}% • ${item.description}`} />
        ))}
      </div>
    </Panel>
  )
}

function OnboardingTab({ steps, checklist }: { steps: OnboardingStep[]; checklist: TrialChecklistItem[] }) {
  return (
    <Panel title="Bước onboarding" subtitle={`Có ${steps.length} bước onboarding và ${checklist.length} mục checklist thử việc.`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, index) => (
          <CardRow key={step.id} title={`${index + 1}. ${step.title}`} meta={`${step.estimated_minutes} phút • ${step.required ? 'Bắt buộc' : 'Tùy chọn'}`} />
        ))}
      </div>
    </Panel>
  )
}

function OnboardingRolesTab({ onReload, savedSettings }: { onReload: () => void; savedSettings: OnboardingRoleSettings }) {
  const [draft, setDraft] = useState<OnboardingRoleSettings>(() => savedSettings)
  const [templates, setTemplates] = useState<OnboardingChecklistTemplate[]>(() => getOnboardingChecklistTemplates())
  const [issues, setIssues] = useState<OnboardingRoleSettingsValidationIssue[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [lastSyncedKey, setLastSyncedKey] = useState(() => JSON.stringify(savedSettings))
  const [hasSourceConflict, setHasSourceConflict] = useState(false)
  const [unmatchedEmployees, setUnmatchedEmployees] = useState<UnmatchedEmployee[]>(() => getUnmatchedOnboardingRoleEmployees(savedSettings))
  const [saveState, setSaveState] = useState<{ tone: 'idle' | 'success' | 'error'; message: string | null }>({ tone: 'idle', message: null })
  const [roleFilter, setRoleFilter] = useState<OnboardingRoleFilterKey>('all')
  const [roleSearch, setRoleSearch] = useState('')

  useEffect(() => {
    setTemplates(getOnboardingChecklistTemplates())
    const nextSourceKey = JSON.stringify(savedSettings)

    if (nextSourceKey === lastSyncedKey) return
    if (isDirty) {
      setHasSourceConflict(true)
      setSaveState({ tone: 'error', message: 'Dữ liệu đã thay đổi ở nguồn khác. Tải lại trước khi tiếp tục.' })
      return
    }

    setDraft(savedSettings)
    setIssues([])
    setHasSourceConflict(false)
    setUnmatchedEmployees(getUnmatchedOnboardingRoleEmployees(savedSettings))
    setSaveState({ tone: 'idle', message: null })
    setLastSyncedKey(nextSourceKey)
  }, [isDirty, lastSyncedKey, savedSettings])

  useEffect(() => {
    setUnmatchedEmployees(getUnmatchedOnboardingRoleEmployees(draft))
  }, [draft])

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (!hash) return
      document.getElementById(hash)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }

    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [])

  const updateRole = (roleCode: string, updater: (role: OnboardingRoleSetting) => OnboardingRoleSetting) => {
    setDraft((current) => ({
      ...current,
      roles: current.roles.map((role) => (role.role_code === roleCode ? updater(role) : role)),
    }))
    setIsDirty(true)
    setIssues([])
    setSaveState(hasSourceConflict ? { tone: 'error', message: 'Dữ liệu đã thay đổi ở nguồn khác. Tải lại trước khi tiếp tục.' } : { tone: 'idle', message: null })
  }

  const reloadDraftFromSource = () => {
    const nextSourceKey = JSON.stringify(savedSettings)
    setDraft(savedSettings)
    setIssues([])
    setIsDirty(false)
    setHasSourceConflict(false)
    setUnmatchedEmployees(getUnmatchedOnboardingRoleEmployees(savedSettings))
    setSaveState({ tone: 'idle', message: null })
    setLastSyncedKey(nextSourceKey)
    onReload()
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
    if (hasSourceConflict) {
      setSaveState({ tone: 'error', message: 'Dữ liệu đã thay đổi ở nguồn khác. Tải lại trước khi tiếp tục.' })
      return
    }

    const nextIssues = validateOnboardingRoleSettings(draft)
    if (nextIssues.length > 0) {
      setIssues(nextIssues)
      setSaveState({ tone: 'error', message: 'Thông tin nhóm onboarding còn lỗi. Kiểm tra lại trước khi lưu.' })
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
    setHasSourceConflict(false)
    setUnmatchedEmployees(getUnmatchedOnboardingRoleEmployees(result.settings))
    setSaveState({ tone: 'success', message: 'Đã lưu thay đổi cấu hình onboarding.' })
    setLastSyncedKey(JSON.stringify(result.settings))
    onReload()
  }

  const globalIssues = issues.filter((issue) => !issue.role_code)
  const missingTemplateIssues = issues.filter((issue) => issue.code === 'missing_template')
  const duplicateMappingIssues = issues.filter((issue) => issue.code === 'duplicate_position')
  const activeTemplates = templates.filter((template) => template.status === 'active')
  const duplicatePositionIds = Array.from(new Set(duplicateMappingIssues.map((issue) => issue.position_id).filter((value): value is string => Boolean(value))))
  const rolesWithIssues = new Set(issues.map((issue) => issue.role_code).filter((value): value is string => Boolean(value)))

  const summaryMetrics: OnboardingSettingsSummaryMetric[] = [
    { label: 'Role đang dùng', value: draft.roles.filter((role) => role.enabled).length, href: '#roles', tone: 'neutral' },
    { label: 'Role thiếu checklist', value: missingTemplateIssues.length, href: '#urgent-issues', tone: missingTemplateIssues.length > 0 ? 'warning' : 'neutral' },
    { label: 'Chức danh bị gán trùng', value: duplicatePositionIds.length, href: '#urgent-issues', tone: duplicatePositionIds.length > 0 ? 'danger' : 'neutral' },
    { label: 'Nhân viên chưa khớp role', value: unmatchedEmployees.length, href: '#urgent-issues', tone: unmatchedEmployees.length > 0 ? 'warning' : 'neutral' },
  ]

  const urgentRows: OnboardingSettingsUrgentRow[] = [
    {
      title: 'Nhân viên chưa khớp role',
      description: `${unmatchedEmployees.length} nhân viên cần kiểm tra chức danh để gán đúng lộ trình onboarding.`,
      count: unmatchedEmployees.length,
      href: '#roles',
    },
    {
      title: 'Role đang bật nhưng chưa có checklist',
      description: `${missingTemplateIssues.length} role chưa thể dùng vì chưa gán checklist.`,
      count: missingTemplateIssues.length,
      href: '#roles',
    },
    {
      title: 'Chức danh bị gán trùng',
      description: `${duplicatePositionIds.length} chức danh đang nằm ở nhiều role onboarding.`,
      count: duplicatePositionIds.length,
      href: '#roles',
    },
  ]

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
    if (roleFilter === 'missing_template') return !role.template_id
    return true
  })

  const saveStatusMessage = saveState.message ?? (isDirty ? 'Đã chỉnh sửa, chưa lưu' : 'Chưa có thay đổi')
  const adminRailStats = [
    { label: 'Role đang dùng', value: String(draft.roles.filter((role) => role.enabled).length), tone: 'neutral' as const },
    { label: 'Role có lỗi', value: String(rolesWithIssues.size), tone: rolesWithIssues.size > 0 ? 'warning' as const : 'neutral' as const },
    { label: 'Nhân viên lệch role', value: String(unmatchedEmployees.length), tone: unmatchedEmployees.length > 0 ? 'warning' as const : 'neutral' as const },
    { label: 'Vị trí bị trùng', value: String(duplicatePositionIds.length), tone: duplicatePositionIds.length > 0 ? 'danger' as const : 'neutral' as const },
  ]
  const adminRailLinks = [
    { label: 'Tổng quan', href: '#summary' },
    { label: 'Cần xử lý ngay', href: '#urgent-issues' },
    { label: 'Bộ lọc role', href: '#role-filters' },
    { label: 'Thiết lập nhóm onboarding', href: '#roles' },
  ]

  return (
    <Panel title="Cấu hình onboarding cho nhân sự mới" subtitle="Thiết lập nhóm onboarding, checklist áp dụng và xử lý lỗi cấu hình trước ngày vào làm.">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap', position: 'sticky', top: 12, zIndex: 5, padding: '12px 14px', borderRadius: 12, border: '1px solid #e5e7eb', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)' }}>
        <div style={{ fontSize: 12, color: hasSourceConflict ? '#b42318' : saveState.tone === 'success' ? '#2f4acb' : '#667085' }}>
          {saveStatusMessage}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hasSourceConflict ? <button onClick={reloadDraftFromSource} style={{ ...primarySmallButtonStyle, background: '#f79009' }}>Tải lại nguồn</button> : null}
          <button onClick={handleSave} disabled={hasSourceConflict} style={{ ...primarySmallButtonStyle, opacity: hasSourceConflict ? 0.6 : 1, cursor: hasSourceConflict ? 'not-allowed' : 'pointer' }}>
            Lưu thay đổi
          </button>
        </div>
      </div>

      {(saveState.tone === 'error' || globalIssues.length > 0) ? (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: '#fff3f2', border: '1px solid #f3c0bc' }}>
          {saveState.tone === 'error' && saveState.message ? <div style={{ fontSize: 12, fontWeight: 600, color: '#b42318' }}>{saveState.message}</div> : null}
          {globalIssues.map((issue, index) => <div key={`${issue.code}-${index}`} style={inlineIssueStyle}>{issue.message}</div>)}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <section id="summary">
            <OnboardingSettingsSummaryBar metrics={summaryMetrics} />
          </section>

          <section id="urgent-issues" style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Cần xử lý ngay</div>
            <OnboardingSettingsUrgentPanel rows={urgentRows} />
          </section>

          <section id="role-filters" style={{ marginBottom: 0 }}>
            <OnboardingRoleFilters
              activeFilter={roleFilter}
              searchValue={roleSearch}
              onFilterChange={setRoleFilter}
              onSearchChange={setRoleSearch}
            />
          </section>

          <section id="roles">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Thiết lập nhóm onboarding</div>
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
              {filteredRoles.length === 0 ? <div style={{ fontSize: 12, color: '#667085' }}>Không có role nào khớp bộ lọc hiện tại.</div> : null}
            </div>
          </section>
        </div>

        <OnboardingSettingsAdminRail
          saveMessage={saveStatusMessage}
          saveTone={saveState.tone}
          stats={adminRailStats}
          links={adminRailLinks}
        />
      </div>
    </Panel>
  )
}

function GeneralTab({ onExport, onImport }: { onExport: () => void; onImport: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <Panel title="Chung" subtitle="Export và import setting cục bộ.">
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onExport} style={secondaryButtonStyle}>Export JSON</button>
        <label style={{ ...primarySmallButtonStyle, display: 'inline-flex', alignItems: 'center' }}>
          Import
          <input type="file" accept=".json" onChange={onImport} style={{ display: 'none' }} />
        </label>
      </div>
    </Panel>
  )
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 16, borderRadius: 16, border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.04)' }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
      {subtitle ? <div style={{ fontSize: 11, color: '#667085', marginTop: 4, marginBottom: 12 }}>{subtitle}</div> : null}
      {children}
    </div>
  )
}

function CardRow({ title, meta, badge }: { title: string; meta: string; badge?: string }) {
  return (
    <div style={{ padding: 10, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>{meta}</div>
      </div>
      {badge ? <div style={{ fontSize: 10, fontWeight: 700, color: '#2F6FA8' }}>{badge}</div> : null}
    </div>
  )
}

const primarySmallButtonStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: 'none',
  background: '#667eea',
  color: '#fff',
  fontSize: 11,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #d0d5dd',
  background: '#fff',
  color: '#344054',
  fontSize: 11,
  cursor: 'pointer',
}





const inlineIssueStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#b42318',
  lineHeight: 1.5,
}




