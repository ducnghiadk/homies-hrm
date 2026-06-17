'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  exportSettings,
  getBuddyRewards,
  getChangeLogs,
  getLevels,
  getPromotionConditions,
  getSkills,
  importSettings,
  initCareerPathStores,
} from '@/lib/career-path-service'
import type {
  BuddyRewardConfig,
  CareerLevel,
  PromotionCondition,
  SettingsChangeLog,
  Skill,
} from '@/lib/career-path-types'

type TabId = 'levels' | 'skills' | 'conditions' | 'buddy' | 'general'

const tabs: { id: TabId; label: string }[] = [
  { id: 'levels', label: 'Cấp bậc' },
  { id: 'skills', label: 'Kỹ năng' },
  { id: 'conditions', label: 'Điều kiện' },
  { id: 'buddy', label: 'Người đồng hành' },
  { id: 'general', label: 'Chung' },
]

const buildTabButtonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '7px 12px',
  borderRadius: 8,
  border: 'none',
  fontSize: 12,
  fontWeight: 500,
  background: isActive ? '#667eea' : '#f0f0f0',
  color: isActive ? '#fff' : '#555',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
})

export default function CareerPathSettingsPage() {
  initCareerPathStores()
  const [activeTab, setActiveTab] = useState<TabId>('levels')
  const [levels, setLevels] = useState<CareerLevel[]>(() => getLevels())
  const [skills, setSkills] = useState<Skill[]>(() => getSkills())
  const [conditions, setConditions] = useState<PromotionCondition[]>(() => getPromotionConditions())
  const [rewards, setRewards] = useState<BuddyRewardConfig[]>(() => getBuddyRewards())
  const [logs, setLogs] = useState<SettingsChangeLog[]>(() => getChangeLogs())
  const [showLogs, setShowLogs] = useState(false)

  const reload = () => {
    setLevels(getLevels())
    setSkills(getSkills())
    setConditions(getPromotionConditions())
    setRewards(getBuddyRewards())
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
        <Link href="/settings" style={{ fontSize: 20, textDecoration: 'none', color: '#344054' }}>
          ←
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Cài đặt lộ trình nghề nghiệp</h1>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowLogs((current) => !current)} style={secondaryButtonStyle}>
          Lịch sử
        </button>
      </div>

      <TrialWorkflowShortcutCard />

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={buildTabButtonStyle(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'levels' ? <LevelsTab levels={levels} /> : null}
      {activeTab === 'skills' ? <SkillsTab skills={skills} /> : null}
      {activeTab === 'conditions' ? <ConditionsTab conditions={conditions} /> : null}
      {activeTab === 'buddy' ? <BuddyTab rewards={rewards} /> : null}
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

function TrialWorkflowShortcutCard() {
  return (
    <div style={shortcutCardStyle}>
      <div style={shortcutEyebrowStyle}>Thử việc</div>
      <div style={shortcutTitleStyle}>Thiết lập quy trình thử việc</div>
      <div style={shortcutDescriptionStyle}>
        Mọi cấu hình thử việc đã tách sang khu Nhân sự mới để không còn lẫn với phần cài đặt lộ trình nghề nghiệp chung.
      </div>
      <Link href="/career-path/onboarding/setup" style={shortcutLinkStyle}>
        Đi tới thiết lập quy trình thử việc
      </Link>
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
            meta={`Thứ tự ${level.order} • ${level.min_skills_required} kỹ năng tối thiểu • ${level.min_months} tháng`}
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
    <Panel title="Kỹ năng" subtitle="Nhóm kỹ năng đang được mở trong lộ trình nghề nghiệp.">
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

function BuddyTab({ rewards }: { rewards: BuddyRewardConfig[] }) {
  return (
    <Panel title="Người đồng hành" subtitle="Xem nhanh phần thưởng và trạng thái đang dùng cho người đồng hành.">
      <div style={{ display: 'grid', gap: 8 }}>
        {rewards.map((reward) => (
          <CardRow key={reward.id} title={reward.name} meta={reward.description} badge={reward.is_active ? 'Bật' : 'Tắt'} />
        ))}
      </div>
    </Panel>
  )
}

function GeneralTab({ onExport, onImport }: { onExport: () => void; onImport: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <Panel title="Chung" subtitle="Xuất và nhập thiết lập cục bộ.">
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onExport} style={secondaryButtonStyle}>Xuất JSON</button>
        <label style={{ ...primarySmallButtonStyle, display: 'inline-flex', alignItems: 'center' }}>
          Nhập JSON
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

const shortcutCardStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: 16,
  borderRadius: 16,
  border: '1px solid rgba(47, 111, 168, 0.18)',
  background: '#FFF8E8',
  display: 'grid',
  gap: 8,
}

const shortcutEyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#7A6B53',
}

const shortcutTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#111827',
}

const shortcutDescriptionStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.6,
  color: '#667085',
}

const shortcutLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  padding: '10px 14px',
  borderRadius: 999,
  background: '#2F6FA8',
  color: '#fff',
  fontSize: 12,
  fontWeight: 700,
  textDecoration: 'none',
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
