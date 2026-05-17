'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  initCareerPathStores, getSkills, getEmployeeSkills, getSkillLevels,
  getEmployeeSkillLevel, checkSkillUnlockEligibility, getSkillEndorsements,
} from '@/lib/career-path-service';
import type { Skill, EmployeeSkill, SkillEndorsement } from '@/lib/career-path-types';
import SkillHexagon from '@/components/career-path/SkillHexagon';
import ProgressBar from '@/components/career-path/ProgressBar';
import ConditionChip from '@/components/career-path/ConditionChip';

type ViewMode = 'grid' | 'list';
type FilterCategory = 'all' | 'basic' | 'advanced' | 'management';

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [empSkills, setEmpSkills] = useState<EmployeeSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [skillLevel, setSkillLevel] = useState(1);

  useEffect(() => {
    initCareerPathStores();
    setSkills(getSkills().filter(s => s.is_active));
    setEmpSkills(getEmployeeSkills('emp-001'));
    setSkillLevel(getEmployeeSkillLevel('emp-001'));
  }, []);

  const filtered = filter === 'all' ? skills : skills.filter(s => s.category === filter);
  const getStatus = (sid: string) => empSkills.find(es => es.skill_id === sid)?.status || 'locked';
  const getEmpSkill = (sid: string) => empSkills.find(es => es.skill_id === sid);
  const unlocked = empSkills.filter(es => es.status === 'unlocked').length;
  const categories: { key: FilterCategory; label: string; icon: string }[] = [
    { key: 'all', label: 'Tất cả', icon: '📋' },
    { key: 'basic', label: 'Cơ bản', icon: '🟢' },
    { key: 'advanced', label: 'Nâng cao', icon: '🟠' },
    { key: 'management', label: 'Quản lý', icon: '🟣' },
  ];
  const skillLevels = getSkillLevels();

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Kỹ năng</h1>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Skill Level {skillLevel} • {unlocked}/{skills.length} đã mở</p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['grid', 'list'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: '4px 8px', border: 'none', borderRadius: 6, fontSize: 14,
              background: viewMode === m ? '#667eea' : '#f0f0f0',
              color: viewMode === m ? '#fff' : '#888', cursor: 'pointer',
            }}>
              {m === 'grid' ? '⬡' : '☰'}
            </button>
          ))}
        </div>
      </div>

      {/* Skill Level Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {skillLevels.map(sl => (
          <div key={sl.level} style={{
            flex: 1, padding: '6px 8px', borderRadius: 8, textAlign: 'center', fontSize: 11,
            background: skillLevel >= sl.level ? sl.color + '20' : '#f5f5f5',
            border: `1px solid ${skillLevel >= sl.level ? sl.color : '#e0e0e0'}`,
            fontWeight: skillLevel >= sl.level ? 600 : 400,
            color: skillLevel >= sl.level ? sl.color : '#aaa',
          }}>
            {sl.icon} {sl.label}
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
        {categories.map(c => (
          <button key={c.key} onClick={() => setFilter(c.key)} style={{
            padding: '6px 12px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 500,
            background: filter === c.key ? '#667eea' : '#f0f0f0',
            color: filter === c.key ? '#fff' : '#555', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Skills View */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          {filtered.map(skill => (
            <SkillHexagon
              key={skill.id} icon={skill.icon} name={skill.name}
              status={getStatus(skill.id)} category={skill.category}
              size={70} onClick={() => setSelectedSkill(skill)}
              endorsementCount={getEmpSkill(skill.id)?.endorsement_count}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(skill => {
            const es = getEmpSkill(skill.id);
            const status = es?.status || 'locked';
            return (
              <div key={skill.id} onClick={() => setSelectedSkill(skill)} style={{
                padding: '12px', borderRadius: 12, background: '#fff',
                border: `1px solid ${status === 'unlocked' ? '#c8e6c9' : '#e0e0e0'}`,
                display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
              }}>
                <span style={{ fontSize: 24, opacity: status === 'locked' ? 0.4 : 1 }}>
                  {status === 'locked' ? '🔒' : skill.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{skill.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{skill.description}</div>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 12,
                  background: status === 'unlocked' ? '#e8f5e9' : status === 'in_progress' ? '#fff3e0' : '#f5f5f5',
                  color: status === 'unlocked' ? '#4caf50' : status === 'in_progress' ? '#e65100' : '#999',
                }}>
                  {status === 'unlocked' ? 'Đã mở' : status === 'in_progress' ? 'Đang học' : 'Khóa'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} onClick={() => setSelectedSkill(null)} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
            background: '#fff', borderRadius: '20px 20px 0 0', padding: 20,
            maxHeight: '70vh', overflowY: 'auto',
          }}>
            {(() => {
              const es = getEmpSkill(selectedSkill.id);
              const status = es?.status || 'locked';
              const elig = checkSkillUnlockEligibility('emp-001', selectedSkill.id);
              const endorsements = getSkillEndorsements('emp-001', selectedSkill.id);
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 36 }}>{selectedSkill.icon}</span>
                      <div>
                        <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{selectedSkill.name}</h3>
                        <div style={{ fontSize: 12, color: '#888', textTransform: 'capitalize' }}>{selectedSkill.category}</div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedSkill(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
                  </div>
                  <p style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>{selectedSkill.description}</p>

                  {/* Status */}
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                    background: status === 'unlocked' ? '#e8f5e9' : status === 'in_progress' ? '#fff3e0' : '#f5f5f5',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {status === 'unlocked' ? `✅ Đã mở — ${es?.unlocked_at}` : status === 'in_progress' ? '🔶 Đang học' : '🔒 Chưa mở'}
                    </div>
                    {es && es.endorsement_count > 0 && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        ⭐ {es.avg_endorsement_rating.toFixed(1)} ({es.endorsement_count} đánh giá)
                      </div>
                    )}
                  </div>

                  {/* Unlock Conditions */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Điều kiện mở khóa</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {elig.conditions.map((c, i) => (
                        <ConditionChip key={i} label={c.label} met={c.met} progress={c.progress} />
                      ))}
                    </div>
                  </div>

                  {/* Endorsements */}
                  {endorsements.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Đánh giá từ quản lý</div>
                      {endorsements.map(e => (
                        <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
                          <span>{'⭐'.repeat(e.rating)} — {e.endorsed_at}</span>
                          {e.comment && <div style={{ color: '#666', marginTop: 2 }}>"{e.comment}"</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
