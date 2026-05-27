'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  initCareerPathStores,
  getLevels, createLevel, toggleLevel,
  getSkills, createSkill, deleteSkill,
  getPromotionConditions,
  getBuddyRewards, toggleBuddyReward,
  getTrialChecklist, getOnboardingSteps,
  getSettings, updateSettings, getChangeLogs, upsertOnboardingOperationsStoreOverride,
  exportSettings, importSettings,
} from '@/lib/career-path-service';
import type {
  CareerLevel, Skill, PromotionCondition,
  BuddyRewardConfig, TrialChecklistItem, OnboardingStep,
  CareerPathSettings, SettingsChangeLog, OnboardingOpsChecklistKey,
  OnboardingOpsSettings, OnboardingOpsStoreOverride, OnboardingOpsSeverity,
} from '@/lib/career-path-types';
import { mockStores } from '@/lib/mock-data';

type TabId = 'levels' | 'skills' | 'conditions' | 'buddy' | 'onboarding' | 'general';

const fallbackOnboardingOperationsSettings: OnboardingOpsSettings = {
  enabled: true,
  lookahead_days: 7,
  rules: [
    { key: 'first_shift', label: 'Ca dau va gio co mat', severity: 'attention', store_override_allowed: true },
    { key: 'buddy', label: 'Nguoi kem / nguoi huong dan', severity: 'block', store_override_allowed: true },
    { key: 'uniform_attendance_policy', label: 'Dong phuc, cham cong, noi quy tai quan', severity: 'attention', store_override_allowed: true },
    { key: 'tools_and_group', label: 'Tai khoan, nhom chat, cong cu', severity: 'attention', store_override_allowed: true },
    { key: 'first_shift_result', label: 'Xac nhan xong ca dau on', severity: 'attention', store_override_allowed: false },
  ],
  store_overrides: [],
};

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'levels', label: 'Cấp bậc', icon: '📊' },
  { id: 'skills', label: 'Kỹ năng', icon: '⚡' },
  { id: 'conditions', label: 'Điều kiện', icon: '📋' },
  { id: 'buddy', label: 'Buddy', icon: '🤝' },
  { id: 'onboarding', label: 'Onboarding', icon: '📋' },
  { id: 'general', label: 'Chung', icon: '⚙️' },
];

export default function CareerPathSettingsPage() {
  initCareerPathStores();
  const [activeTab, setActiveTab] = useState<TabId>('levels');
  const [levels, setLevels] = useState<CareerLevel[]>(() => getLevels());
  const [skills, setSkills] = useState<Skill[]>(() => getSkills());
  const [conditions, setConditions] = useState<PromotionCondition[]>(() => getPromotionConditions());
  const [rewards, setRewards] = useState<BuddyRewardConfig[]>(() => getBuddyRewards());
  const [checklist, setChecklist] = useState<TrialChecklistItem[]>(() => getTrialChecklist());
  const [onbSteps, setOnbSteps] = useState<OnboardingStep[]>(() => getOnboardingSteps());
  const [settings, setSettingsState] = useState<CareerPathSettings | null>(() => getSettings());
  const [logs, setLogs] = useState<SettingsChangeLog[]>(() => getChangeLogs());
  const [showLogs, setShowLogs] = useState(false);

  const reload = () => {
    setLevels(getLevels()); setSkills(getSkills()); setConditions(getPromotionConditions());
    setRewards(getBuddyRewards()); setChecklist(getTrialChecklist());
    setOnbSteps(getOnboardingSteps()); setSettingsState(getSettings()); setLogs(getChangeLogs());
  };

  const handleExport = () => {
    const data = exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'career-path-settings.json'; a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (importSettings(reader.result)) { reload(); alert('Import thành công!'); }
        else { alert('File không hợp lệ!'); }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/settings" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>⚙️ Career Path Settings</h1>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowLogs(!showLogs)} style={{
          padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: 11, cursor: 'pointer',
        }}>📜 Logs</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '7px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 500,
            background: activeTab === t.id ? '#667eea' : '#f0f0f0',
            color: activeTab === t.id ? '#fff' : '#555', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'levels' && (
        <LevelsTab levels={levels} onReload={reload} />
      )}
      {activeTab === 'skills' && (
        <SkillsTab skills={skills} onReload={reload} />
      )}
      {activeTab === 'conditions' && (
        <ConditionsTab conditions={conditions} levels={levels} />
      )}
      {activeTab === 'buddy' && (
        <BuddyTab rewards={rewards} checklist={checklist} onReload={reload} />
      )}
      {activeTab === 'onboarding' && (
        <OnboardingTab steps={onbSteps} onReload={reload} />
      )}
      {activeTab === 'general' && settings && (
        <GeneralTab settings={settings} onReload={reload} onExport={handleExport} onImport={handleImport} />
      )}

      {/* Change Logs Drawer */}
      {showLogs && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }} onClick={() => setShowLogs(false)} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
            background: '#fff', borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '50vh', overflowY: 'auto',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>📜 Lịch sử thay đổi</h3>
            {logs.slice(0, 20).map(l => (
              <div key={l.id} style={{ padding: 8, borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
                <div style={{ fontWeight: 600 }}>{l.description}</div>
                <div style={{ color: '#888', marginTop: 2 }}>{l.changed_at} • {l.action}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components for each tab ─────────────────────────────

function LevelsTab({ levels, onReload }: { levels: CareerLevel[]; onReload: () => void }) {
  const sorted = [...levels].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Cấp bậc ({levels.length})</h2>
        <button onClick={() => { createLevel({ name: 'Cấp bậc mới' }); onReload(); }} style={{
          padding: '4px 10px', borderRadius: 6, border: 'none', background: '#667eea', color: '#fff', fontSize: 11, cursor: 'pointer',
        }}>+ Thêm</button>
      </div>
      {sorted.map((level) => (
        <div key={level.id} style={{
          padding: 12, borderRadius: 10, marginBottom: 8,
          background: level.is_active ? '#fff' : '#f9f9f9',
          border: `1px solid ${level.is_active ? '#e0e0e0' : '#eee'}`,
          opacity: level.is_active ? 1 : 0.6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, cursor: 'grab' }}>⠿</span>
            <span style={{ fontSize: 20 }}>{level.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{level.name}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Order: {level.order} • Min skills: {level.min_skills_required} • Min months: {level.min_months}</div>
            </div>
            <button onClick={() => { toggleLevel(level.id); onReload(); }} style={{
              padding: '3px 8px', borderRadius: 6, border: '1px solid #ddd', background: level.is_active ? '#e8f5e9' : '#fff',
              fontSize: 10, cursor: 'pointer',
            }}>
              {level.is_active ? '✅ Bật' : '⬜ Tắt'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillsTab({ skills, onReload }: { skills: Skill[]; onReload: () => void }) {
  const categories = ['basic', 'advanced', 'management'] as const;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Kỹ năng ({skills.length})</h2>
        <button onClick={() => { createSkill({ name: 'Kỹ năng mới', category: 'basic' }); onReload(); }} style={{
          padding: '4px 10px', borderRadius: 6, border: 'none', background: '#667eea', color: '#fff', fontSize: 11, cursor: 'pointer',
        }}>+ Thêm</button>
      </div>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'capitalize', marginBottom: 6 }}>
            {cat === 'basic' ? '🟢 Cơ bản' : cat === 'advanced' ? '🟠 Nâng cao' : '🟣 Quản lý'}
          </div>
          {skills.filter(s => s.category === cat).map(skill => (
            <div key={skill.id} style={{
              padding: '8px 12px', borderRadius: 8, marginBottom: 4,
              background: skill.is_active ? '#fff' : '#f5f5f5',
              border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8,
              opacity: skill.is_active ? 1 : 0.5,
            }}>
              <span style={{ fontSize: 16 }}>{skill.icon}</span>
              <div style={{ flex: 1, fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{skill.name}</span>
                {skill.requires_approval && <span style={{ fontSize: 9, marginLeft: 6, color: '#ff9800' }}>Cần duyệt</span>}
              </div>
              <button onClick={() => { deleteSkill(skill.id); onReload(); }} style={{
                border: 'none', background: 'none', fontSize: 12, color: '#f44336', cursor: 'pointer',
              }}>🗑️</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ConditionsTab({ conditions, levels }: { conditions: PromotionCondition[]; levels: CareerLevel[] }) {
  const getLevelName = (id: string) => levels.find(l => l.id === id)?.name || id;
  return (
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>Điều kiện thăng tiến ({conditions.length})</h2>
      {conditions.map(c => (
        <div key={c.id} style={{ padding: 12, borderRadius: 10, marginBottom: 8, background: '#fff', border: '1px solid #eee' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            {getLevelName(c.from_level_id)} → {getLevelName(c.to_level_id)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {c.conditions.map((cond, i) => (
              <div key={i} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: '#f8f9ff' }}>
                {cond.label} ({cond.operator} {cond.value})
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BuddyTab({ rewards, checklist, onReload }: { rewards: BuddyRewardConfig[]; checklist: TrialChecklistItem[]; onReload: () => void }) {
  return (
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>🎁 Phần thưởng Buddy ({rewards.length})</h2>
      {rewards.map(r => (
        <div key={r.id} style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 6,
          background: r.is_active ? '#fff' : '#f5f5f5', border: '1px solid #eee',
          display: 'flex', alignItems: 'center', gap: 8, opacity: r.is_active ? 1 : 0.5,
        }}>
          <span style={{ fontSize: 18 }}>{r.icon}</span>
          <div style={{ flex: 1, fontSize: 12 }}>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div style={{ color: '#888', fontSize: 11 }}>{r.description}</div>
          </div>
          <button onClick={() => { toggleBuddyReward(r.id); onReload(); }} style={{
            padding: '3px 8px', borderRadius: 6, border: '1px solid #ddd',
            background: r.is_active ? '#e8f5e9' : '#fff', fontSize: 10, cursor: 'pointer',
          }}>
            {r.is_active ? '✅' : '⬜'}
          </button>
        </div>
      ))}

      <h2 style={{ fontSize: 14, fontWeight: 600, margin: '20px 0 10px' }}>📝 Checklist thử việc ({checklist.length})</h2>
      {checklist.map(item => (
        <div key={item.id} style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 4, background: '#fff', border: '1px solid #eee', fontSize: 12 }}>
          <div style={{ fontWeight: 600 }}>{item.title} <span style={{ color: '#888', fontWeight: 400 }}>({item.weight}%)</span></div>
          <div style={{ color: '#888', fontSize: 11 }}>{item.description}</div>
        </div>
      ))}
    </div>
  );
}

function OnboardingTab({ steps }: { steps: OnboardingStep[]; onReload: () => void }) {
  const typeIcons: Record<string, string> = { video: '🎬', document: '📄', quiz: '📝', task: '✋', checkin: '📍' };
  return (
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>📋 Bước Onboarding ({steps.length})</h2>
      {steps.map((step, i) => (
        <div key={step.id} style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 6, background: '#fff', border: '1px solid #eee',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#888' }}>{i + 1}</span>
          <span style={{ fontSize: 16 }}>{typeIcons[step.type] || '📌'}</span>
          <div style={{ flex: 1, fontSize: 12 }}>
            <div style={{ fontWeight: 600 }}>{step.title}</div>
            <div style={{ color: '#888', fontSize: 11 }}>{step.estimated_minutes} phút • {step.required ? 'Bắt buộc' : 'Tùy chọn'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GeneralTab({
  settings, onReload, onExport, onImport,
}: {
  settings: CareerPathSettings; onReload: () => void;
  onExport: () => void; onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const storeOptions = mockStores.filter((store) => store.is_active);
  const onboardingOps = settings.onboarding_operations ?? fallbackOnboardingOperationsSettings;
  const [opsDraft, setOpsDraft] = useState<OnboardingOpsSettings>(onboardingOps);
  const toggles: { key: keyof CareerPathSettings; label: string; icon: string }[] = [
    { key: 'buddy_system_enabled', label: 'Buddy System', icon: '🤝' },
    { key: 'leaderboard_enabled', label: 'Leaderboard', icon: '🏆' },
    { key: 'goals_enabled', label: 'Mục tiêu cá nhân', icon: '🎯' },
    { key: 'endorsements_enabled', label: 'Endorsements', icon: '⭐' },
    { key: 'notifications_enabled', label: 'Thông báo', icon: '🔔' },
    { key: 'onboarding_enabled', label: 'Onboarding', icon: '📋' },
    { key: 'skill_refresh_enabled', label: 'Skill Refresh', icon: '🔄' },
    { key: 'cross_training_enabled', label: 'Cross-training', icon: '🔀' },
  ];

  const handleToggle = (key: keyof CareerPathSettings) => {
    updateSettings({ [key]: !(settings[key] as boolean) });
    onReload();
  };

  const patchSettings = (data: Partial<CareerPathSettings>) => {
    updateSettings(data);
    onReload();
  };

  useEffect(() => {
    setOpsDraft(onboardingOps);
  }, [onboardingOps]);

  const upsertDraftOverride = (
    storeId: string,
    updater: (current: OnboardingOpsStoreOverride) => OnboardingOpsStoreOverride,
  ) => {
    setOpsDraft((current) => {
      const existing = current.store_overrides.find((item) => item.store_id === storeId);
      const nextOverride = updater(existing ?? {
        store_id: storeId,
        block_keys: [],
        reminder_days_before_start: 1,
        alert_roles: ['store_manager'],
      });
      const nextOverrides = existing
        ? current.store_overrides.map((item) => (item.store_id === storeId ? nextOverride : item))
        : [...current.store_overrides, nextOverride];

      return {
        ...current,
        store_overrides: nextOverrides,
      };
    });
  };

  const handleRuleSeverityChange = (ruleKey: OnboardingOpsChecklistKey, severity: OnboardingOpsSeverity) => {
    setOpsDraft((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.key === ruleKey ? { ...rule, severity } : rule)),
    }));
  };

  const toggleStoreBlockRule = (storeId: string, ruleKey: OnboardingOpsChecklistKey) => {
    upsertDraftOverride(storeId, (current) => {
      const hasRule = current.block_keys.includes(ruleKey);
      return {
        ...current,
        block_keys: hasRule
          ? current.block_keys.filter((key) => key !== ruleKey)
          : [...current.block_keys, ruleKey],
      };
    });
  };

  const saveOnboardingOperations = () => {
    updateSettings({
      onboarding_operations: {
        ...onboardingOps,
        ...opsDraft,
        store_overrides: opsDraft.store_overrides,
      },
    });
    opsDraft.store_overrides.forEach((override) => {
      upsertOnboardingOperationsStoreOverride(override);
    });
    onReload();
  };

  return (
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>⚙️ Cài đặt chung</h2>
      {toggles.map(t => (
        <div key={t.key} style={{
          padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: '#fff', border: '1px solid #eee',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13 }}>{t.icon} {t.label}</span>
          <button onClick={() => handleToggle(t.key)} style={{
            padding: '4px 12px', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            background: settings[t.key] ? '#4caf50' : '#e0e0e0',
            color: settings[t.key] ? '#fff' : '#888',
          }}>
            {settings[t.key] ? 'Bật' : 'Tắt'}
          </button>
        </div>
      ))}

      <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#fffaf0', border: '1px solid #f4d7a1' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📘 Nội quy nhận việc</div>

        <FieldRow
          label="Bật flow nội quy"
          control={(
            <button
              onClick={() => patchSettings({ onboarding_policy_enabled: !settings.onboarding_policy_enabled })}
              style={toggleButtonStyle(settings.onboarding_policy_enabled)}
            >
              {settings.onboarding_policy_enabled ? 'Bật' : 'Tắt'}
            </button>
          )}
        />

        <FieldRow
          label="Gửi tóm tắt"
          control={(
            <select
              value={settings.onboarding_policy_summary_trigger}
              onChange={(event) => patchSettings({ onboarding_policy_summary_trigger: event.target.value as 'approval_confirm' | 'contract_send' })}
              style={fieldControlStyle}
            >
              <option value="approval_confirm">Ngay sau duyet ho so</option>
              <option value="contract_send">Luc gui hop dong</option>
            </select>
          )}
        />

        <FieldRow
          label="Gửi đầy đủ"
          control={(
            <select
              value={settings.onboarding_policy_full_trigger}
              onChange={(event) => patchSettings({ onboarding_policy_full_trigger: event.target.value as 'contract_countersign' | 'days_before_start' })}
              style={fieldControlStyle}
            >
              <option value="contract_countersign">Sau HR countersign</option>
              <option value="days_before_start">Truoc ngay vao lam</option>
            </select>
          )}
        />

        <FieldRow
          label="Gửi trước ngày vào làm"
          control={(
            <input
              type="number"
              min={0}
              max={7}
              value={settings.onboarding_policy_full_days_before_start}
              onChange={(event) => patchSettings({ onboarding_policy_full_days_before_start: Number(event.target.value || 0) })}
              style={fieldControlStyle}
            />
          )}
        />

        <FieldRow
          label="Bắt xác nhận"
          control={(
            <button
              onClick={() => patchSettings({ onboarding_policy_require_ack: !settings.onboarding_policy_require_ack })}
              style={toggleButtonStyle(settings.onboarding_policy_require_ack)}
            >
              {settings.onboarding_policy_require_ack ? 'Co' : 'Khong'}
            </button>
          )}
        />

        <FieldRow
          label="Nhắc tối đa"
          control={(
            <input
              type="number"
              min={0}
              max={5}
              value={settings.onboarding_policy_max_reminders}
              onChange={(event) => patchSettings({ onboarding_policy_max_reminders: Number(event.target.value || 0) })}
              style={fieldControlStyle}
            />
          )}
        />

        <FieldRow
          label="Mẫu nội quy"
          control={(
            <select
              value={settings.onboarding_policy_template_id}
              onChange={(event) => patchSettings({ onboarding_policy_template_id: event.target.value as 'default-policy-v1' })}
              style={fieldControlStyle}
            >
              <option value="default-policy-v1">Mac dinh v1</option>
            </select>
          )}
        />

        <FieldRow
          label="Người nhận cảnh báo"
          control={(
            <select
              value={settings.onboarding_policy_alert_scope}
              onChange={(event) => patchSettings({ onboarding_policy_alert_scope: event.target.value as 'hr_only' | 'hr_and_store_manager' })}
              style={fieldControlStyle}
            >
              <option value="hr_only">Chi HR</option>
              <option value="hr_and_store_manager">HR va quan ly cua hang</option>
            </select>
          )}
        />
      </div>

      <div id="onboarding-operations" style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#f6f8ff', border: '1px solid #dce4ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Onboarding operations</div>
            <div style={{ fontSize: 11, color: '#667085', lineHeight: 1.5 }}>
              Chon muc nao can chan ngay dau toan he thong. Neu cua hang can chan them, bat override o ben duoi.
            </div>
          </div>
          <button
            onClick={saveOnboardingOperations}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: '#667eea',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Luu rule
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {opsDraft.rules.map((rule) => (
            <div
              key={rule.key}
              style={{
                padding: 12,
                borderRadius: 10,
                background: '#fff',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{rule.label}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    {rule.store_override_allowed ? 'Cho phep tung cua hang chan them.' : 'Chi dung rule mac dinh toan he thong.'}
                  </div>
                </div>
                <select
                  value={rule.severity}
                  onChange={(event) => handleRuleSeverityChange(rule.key, event.target.value as OnboardingOpsSeverity)}
                  style={fieldControlStyle}
                >
                  <option value="block">Block ngay dau</option>
                  <option value="attention">Can hoan tat som</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #dce4ff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 8 }}>Override theo cua hang</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {storeOptions.map((store) => {
              const override = opsDraft.store_overrides.find((item) => item.store_id === store.id) ?? {
                store_id: store.id,
                block_keys: [],
                reminder_days_before_start: 1,
                alert_roles: ['store_manager'],
              };

              return (
                <div
                  key={store.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{store.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {opsDraft.rules.filter((rule) => rule.store_override_allowed).map((rule) => (
                      <label
                        key={`${store.id}-${rule.key}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                          color: '#475467',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={override.block_keys.includes(rule.key)}
                          onChange={() => toggleStoreBlockRule(store.id, rule.key)}
                        />
                        <span>{rule.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#f8f9ff', border: '1px solid #e8ecff' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📥 Export / Import</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onExport} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #667eea',
            background: '#fff', color: '#667eea', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>📤 Export JSON</button>
          <label style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
            background: '#667eea', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            textAlign: 'center',
          }}>
            📥 Import
            <input type="file" accept=".json" onChange={onImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
    </div>
  );
}

const fieldControlStyle: React.CSSProperties = {
  minWidth: 160,
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #d6d6d6',
  background: '#fff',
  fontSize: 12,
}

function toggleButtonStyle(enabled: boolean): React.CSSProperties {
  return {
    padding: '5px 12px',
    borderRadius: 999,
    border: 'none',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    background: enabled ? '#4caf50' : '#e0e0e0',
    color: enabled ? '#fff' : '#666',
  }
}

function FieldRow({ label, control }: { label: string; control: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid #f2e6c7',
    }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: '#6b5d3a' }}>{label}</span>
      {control}
    </div>
  )
}
