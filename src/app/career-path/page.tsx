'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  initCareerPathStores, getEmployeeCareerProgress,
  getActiveLevels, getSkills, getNotifications, getUnreadCount,
} from '@/lib/career-path-service';
import type { EmployeeCareerProgress } from '@/lib/career-path-types';
import ProgressRing from '@/components/career-path/ProgressRing';
import ProgressBar from '@/components/career-path/ProgressBar';
import SkillHexagon from '@/components/career-path/SkillHexagon';

export default function CareerPathPage() {
  const [progress, setProgress] = useState<EmployeeCareerProgress | null>(null);
  const [unreadNotif, setUnreadNotif] = useState(0);

  useEffect(() => {
    initCareerPathStores();
    const p = getEmployeeCareerProgress('emp-001', 'level-staff');
    setProgress(p);
    setUnreadNotif(getUnreadCount('emp-001'));
  }, []);

  if (!progress) return <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>Đang tải...</div>;

  const levels = getActiveLevels();
  const skills = getSkills().filter(s => s.is_active);
  const unlockedSkillIds = new Set(
    (progress as EmployeeCareerProgress) ? 
      (() => { const es = require('@/lib/career-path-service'); return es.getEmployeeSkills('emp-001').filter((s: { status: string }) => s.status === 'unlocked').map((s: { skill_id: string }) => s.skill_id); })()
      : []
  );

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Lộ trình sự nghiệp</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '2px 0 0' }}>Xin chào, Minh! Chúc bạn ngày mới vui vẻ 🎉</p>
        </div>
        <Link href="/career-path/notifications" style={{ position: 'relative', fontSize: 22, textDecoration: 'none' }}>
          🔔
          {unreadNotif > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -6, width: 16, height: 16,
              background: '#f44336', color: '#fff', fontSize: 10, fontWeight: 700,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{unreadNotif}</span>
          )}
        </Link>
      </div>

      {/* Current Level Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16,
        boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Cấp bậc hiện tại</div>
            <div style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span>{progress.current_level.icon}</span>
              <span>{progress.current_level.name}</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Skill Level {progress.current_skill_level} • {progress.months_at_current_level} tháng
            </div>
          </div>
          <ProgressRing value={progress.skills_progress_percent} size={64} strokeWidth={5} color="#fff" bgColor="rgba(255,255,255,0.25)" />
        </div>
        {progress.next_level && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
              <span>→ {progress.next_level.icon} {progress.next_level.name}</span>
              <span>{progress.promotion_progress_percent}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)' }}>
              <div style={{ height: '100%', borderRadius: 3, background: '#fff', width: `${progress.promotion_progress_percent}%`, transition: 'width 0.5s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Kỹ năng', value: `${progress.skills_unlocked}/${progress.skills_total}`, icon: '⚡' },
          { label: 'Mục tiêu', value: `${progress.active_goals.length}`, icon: '🎯' },
          { label: 'Thành tích', value: `${progress.recent_achievements.length}`, icon: '🏆' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '12px 8px', borderRadius: 12, textAlign: 'center',
            background: '#f8f9ff', border: '1px solid #e8ecff',
          }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Skills Grid (top 6) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Kỹ năng của tôi</h2>
          <Link href="/career-path/skills" style={{ fontSize: 12, color: '#667eea', textDecoration: 'none' }}>Xem tất cả →</Link>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {skills.slice(0, 6).map(skill => {
            const empSkill = require('@/lib/career-path-service').getSkillStatus('emp-001', skill.id);
            return (
              <SkillHexagon
                key={skill.id}
                icon={skill.icon} name={skill.name}
                status={empSkill?.status || 'locked'}
                category={skill.category}
                size={64}
                endorsementCount={empSkill?.endorsement_count}
              />
            );
          })}
        </div>
      </div>

      {/* Promotion Conditions */}
      {progress.next_level && progress.promotion_conditions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>
            Điều kiện lên {progress.next_level.icon} {progress.next_level.name}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {progress.promotion_conditions.map((c, i) => (
              <div key={i} style={{
                padding: '10px 12px', borderRadius: 10, background: '#fff',
                border: `1px solid ${c.is_met ? '#c8e6c9' : '#e0e0e0'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{c.is_met ? '✅' : '⬜'} {c.condition.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.is_met ? '#4caf50' : '#888' }}>
                    {c.current_value}/{c.condition.value}
                  </span>
                </div>
                <ProgressBar value={c.progress_percent} height={5} color={c.is_met ? '#4caf50' : '#667eea'} showValue={false} />
              </div>
            ))}
          </div>
          <Link href="/career-path/promotion" style={{
            display: 'block', textAlign: 'center', marginTop: 10, padding: '10px 0',
            borderRadius: 10, background: '#667eea', color: '#fff', fontWeight: 600,
            fontSize: 13, textDecoration: 'none', transition: 'opacity 0.2s',
          }}>
            Xem chi tiết thăng tiến →
          </Link>
        </div>
      )}

      {/* Smart Suggestions */}
      {progress.smart_suggestions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>💡 Gợi ý cho bạn</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {progress.smart_suggestions.slice(0, 3).map(s => (
              <div key={s.id} style={{
                padding: '10px 12px', borderRadius: 10, background: '#fffde7',
                border: '1px solid #fff9c4', display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <span style={{ fontSize: 20 }}>
                  {s.type === 'skill_unlock' ? '⚡' : s.type === 'buddy' ? '🤝' : s.type === 'promotion' ? '🚀' : '💡'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{s.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nav Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { href: '/career-path/skills', icon: '⚡', label: 'Kỹ năng', desc: `${progress.skills_unlocked} đã mở` },
          { href: '/career-path/promotion', icon: '🚀', label: 'Thăng tiến', desc: `${progress.promotion_progress_percent}% hoàn thành` },
          { href: '/career-path/goals', icon: '🎯', label: 'Mục tiêu', desc: `${progress.active_goals.length} đang thực hiện` },
          { href: '/career-path/onboarding', icon: '📋', label: 'Onboarding', desc: progress.onboarding_status ? `${progress.onboarding_status.overall_progress}%` : 'Hoàn thành' },
        ].map(link => (
          <Link key={link.href} href={link.href} style={{
            padding: '14px 12px', borderRadius: 12, textDecoration: 'none',
            background: '#fff', border: '1px solid #e8ecff', display: 'flex', gap: 10, alignItems: 'center',
            transition: 'box-shadow 0.2s',
          }}>
            <span style={{ fontSize: 22 }}>{link.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{link.label}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{link.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
