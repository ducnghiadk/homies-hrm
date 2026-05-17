'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  initCareerPathStores,
  getLevels, createLevel, updateLevel, toggleLevel, reorderLevels,
  getSkills, createSkill, updateSkill, deleteSkill,
  getPromotionConditions, getEmployeeTypes,
  getBuddyRewards, toggleBuddyReward,
  getTrialChecklist, getOnboardingSteps,
  getSettings, updateSettings, getChangeLogs,
  exportSettings, importSettings,
} from '@/lib/career-path-service';
import type {
  CareerLevel, Skill, PromotionCondition, EmployeeTypeConfig,
  BuddyRewardConfig, TrialChecklistItem, OnboardingStep,
  CareerPathSettings, SettingsChangeLog,
} from '@/lib/career-path-types';
import IconPicker from '@/components/career-path/IconPicker';

type TabId = 'levels' | 'skills' | 'conditions' | 'buddy' | 'onboarding' | 'general';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'levels', label: 'Cấp bậc', icon: '📊' },
  { id: 'skills', label: 'Kỹ năng', icon: '⚡' },
  { id: 'conditions', label: 'Điều kiện', icon: '📋' },
  { id: 'buddy', label: 'Buddy', icon: '🤝' },
  { id: 'onboarding', label: 'Onboarding', icon: '📋' },
  { id: 'general', label: 'Chung', icon: '⚙️' },
];

export default function CareerPathSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('levels');
  const [levels, setLevels] = useState<CareerLevel[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [conditions, setConditions] = useState<PromotionCondition[]>([]);
  const [empTypes, setEmpTypes] = useState<EmployeeTypeConfig[]>([]);
  const [rewards, setRewards] = useState<BuddyRewardConfig[]>([]);
  const [checklist, setChecklist] = useState<TrialChecklistItem[]>([]);
  const [onbSteps, setOnbSteps] = useState<OnboardingStep[]>([]);
  const [settings, setSettingsState] = useState<CareerPathSettings | null>(null);
  const [logs, setLogs] = useState<SettingsChangeLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const reload = () => {
    setLevels(getLevels()); setSkills(getSkills()); setConditions(getPromotionConditions());
    setEmpTypes(getEmployeeTypes()); setRewards(getBuddyRewards()); setChecklist(getTrialChecklist());
    setOnbSteps(getOnboardingSteps()); setSettingsState(getSettings()); setLogs(getChangeLogs());
  };

  useEffect(() => { initCareerPathStores(); reload(); }, []);

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
  const [editing, setEditing] = useState<string | null>(null);
  const sorted = [...levels].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Cấp bậc ({levels.length})</h2>
        <button onClick={() => { createLevel({ name: 'Cấp bậc mới' }); onReload(); }} style={{
          padding: '4px 10px', borderRadius: 6, border: 'none', background: '#667eea', color: '#fff', fontSize: 11, cursor: 'pointer',
        }}>+ Thêm</button>
      </div>
      {sorted.map((level, i) => (
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

function OnboardingTab({ steps, onReload }: { steps: OnboardingStep[]; onReload: () => void }) {
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
