'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { initCareerPathStores, getCareerPathReport } from '@/lib/career-path-service';
import type { CareerPathReport } from '@/lib/career-path-types';
import ProgressBar from '@/components/career-path/ProgressBar';

export default function CareerPathReportsPage() {
  const [report] = useState<CareerPathReport | null>(() => {
    initCareerPathStores();
    return getCareerPathReport('store-q1', '2026-02');
  });

  if (!report) return <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>Đang tải...</div>;

  const barColors = ['#667eea', '#f093fb', '#ffecd2', '#7FB3D8'];

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/career-path/settings" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📊 Báo cáo Career Path</h1>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Tổng NV', value: report.summary.total_employees, icon: '👥', color: '#667eea' },
          { label: 'Chờ thăng tiến', value: report.summary.pending_promotions, icon: '🚀', color: '#f093fb' },
          { label: 'Đang thử việc', value: report.summary.active_trials, icon: '🌱', color: '#ff9800' },
          { label: 'Avg Skill Level', value: report.summary.avg_skill_level.toFixed(1), icon: '⭐', color: '#4caf50' },
        ].map(s => (
          <div key={s.label} style={{
            padding: 14, borderRadius: 12, background: `${s.color}10`, border: `1px solid ${s.color}30`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* By Level */}
      <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #eee', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>Phân bổ theo cấp bậc</h2>
        {report.summary.by_level.map((l, i) => (
          <div key={l.level_id} style={{ marginBottom: 8 }}>
            <ProgressBar value={(l.count / report.summary.total_employees) * 100} height={8}
              label={`${l.level_name} (${l.count})`} color={barColors[i % barColors.length]} />
          </div>
        ))}
      </div>

      {/* Analytics */}
      <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #eee', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>📈 Analytics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Thời gian TB thăng tiến', value: `${report.analytics.avg_time_to_promotion}d`, icon: '📅' },
            { label: 'Skill unlock/tháng', value: report.analytics.skill_unlock_rate.toFixed(1), icon: '⚡' },
            { label: 'Buddy thành công', value: `${report.analytics.buddy_success_rate}%`, icon: '🤝' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: 10, borderRadius: 8, background: '#f8f9ff' }}>
              <div style={{ fontSize: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#888', lineHeight: 1.2, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention by Level */}
      <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #eee', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>🔒 Tỷ lệ giữ chân theo cấp bậc</h2>
        {report.analytics.retention_by_level.map(r => (
          <div key={r.level_id} style={{ marginBottom: 6 }}>
            <ProgressBar value={r.retention_rate} height={6} label={r.level_id.replace('level-', '')}
              color={r.retention_rate >= 90 ? '#4caf50' : r.retention_rate >= 70 ? '#ff9800' : '#f44336'} />
          </div>
        ))}
      </div>

      {/* Upcoming Promotions */}
      <div style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #eee', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>🚀 Sắp thăng tiến</h2>
        {report.upcoming_promotions.map(p => (
          <div key={p.employee_id} style={{ padding: 8, borderRadius: 8, marginBottom: 6, background: '#f8f9ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{p.employee_name} → {p.to_level}</span>
              <span style={{ color: '#888' }}>{p.estimated_date || 'TBD'}</span>
            </div>
            <ProgressBar value={p.progress_percent} height={5} color="#667eea" showValue />
          </div>
        ))}
      </div>

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <div style={{ padding: 14, borderRadius: 12, background: '#fff3e0', border: '1px solid #ffe0b2' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px', color: '#e65100' }}>⚠️ Cảnh báo</h2>
          {report.warnings.map((w, i) => (
            <div key={i} style={{
              padding: 8, borderRadius: 8, marginBottom: 6, fontSize: 12,
              background: w.severity === 'high' ? '#ffebee' : '#fffde7',
            }}>
              <span style={{ fontWeight: 600 }}>{w.employee_name}</span>: {w.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
