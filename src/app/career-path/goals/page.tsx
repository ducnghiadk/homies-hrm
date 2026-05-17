'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  initCareerPathStores, getEmployeeGoals, getActiveGoals, createGoal,
  cancelGoal, getSuggestedGoals, getSkillById, getSettings,
} from '@/lib/career-path-service';
import type { CareerGoal } from '@/lib/career-path-types';
import ProgressBar from '@/components/career-path/ProgressBar';

export default function GoalsPage() {
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const empId = 'emp-001';

  const reload = () => {
    setGoals(getEmployeeGoals(empId));
  };

  useEffect(() => {
    initCareerPathStores();
    reload();
  }, []);

  const active = goals.filter(g => g.status === 'active');
  const achieved = goals.filter(g => g.status === 'achieved');
  const settings = typeof window !== 'undefined' ? getSettings() : { max_active_goals: 3 };
  const suggested = getSuggestedGoals(empId);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createGoal(empId, { type: 'custom', title: newTitle, target_date: newTarget || '2026-06-01', custom_description: newTitle });
    setNewTitle(''); setNewTarget(''); setShowAdd(false); reload();
  };

  const handleCancel = (id: string) => {
    if (window.confirm('Hủy mục tiêu này?')) { cancelGoal(id); reload(); }
  };

  const handleAddSuggested = (s: Partial<CareerGoal>) => {
    createGoal(empId, { ...s, target_date: '2026-06-01' });
    reload();
  };

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🎯 Mục tiêu</h1>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowAdd(!showAdd)} disabled={active.length >= settings.max_active_goals} style={{
          padding: '6px 12px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff',
          fontSize: 12, fontWeight: 600, cursor: active.length >= settings.max_active_goals ? 'not-allowed' : 'pointer',
          opacity: active.length >= settings.max_active_goals ? 0.5 : 1,
        }}>
          + Thêm
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
        {active.length}/{settings.max_active_goals} mục tiêu đang hoạt động
      </div>

      {/* Add Goal Form */}
      {showAdd && (
        <div style={{ padding: 14, borderRadius: 12, background: '#f8f9ff', border: '1px solid #e8ecff', marginBottom: 16 }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Tên mục tiêu..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 8, fontSize: 13, boxSizing: 'border-box' }} />
          <input type="date" value={newTarget} onChange={e => setNewTarget(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 10, fontSize: 13, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Tạo</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Hủy</button>
          </div>
        </div>
      )}

      {/* Active Goals */}
      {active.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>📌 Đang thực hiện</h2>
          {active.map(g => (
            <div key={g.id} style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e8ecff', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {g.type === 'skill' ? '⚡' : g.type === 'level' ? '🚀' : '🎯'} {g.title}
                </span>
                <button onClick={() => handleCancel(g.id)} style={{ border: 'none', background: 'none', color: '#f44336', fontSize: 14, cursor: 'pointer' }}>✕</button>
              </div>
              <ProgressBar value={g.progress} height={6} color="#667eea" />
              <div style={{ fontSize: 11, color: '#888', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Tạo: {g.created_at}</span>
                <span>Hạn: {g.target_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggested Goals */}
      {suggested.length > 0 && active.length < settings.max_active_goals && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>💡 Gợi ý mục tiêu</h2>
          {suggested.map((s, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 10, background: '#fffde7', border: '1px solid #fff9c4', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#888' }}>Tiến độ: {s.progress}%</div>
              </div>
              <button onClick={() => handleAddSuggested(s)} style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', background: '#667eea', color: '#fff',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>+ Thêm</button>
            </div>
          ))}
        </div>
      )}

      {/* Achieved Goals */}
      {achieved.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>✅ Đã hoàn thành</h2>
          {achieved.map(g => (
            <div key={g.id} style={{ padding: 10, borderRadius: 10, background: '#e8f5e9', marginBottom: 6, fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>🎉 {g.title}</span>
              <div style={{ color: '#666', marginTop: 2 }}>Hoàn thành: {g.achieved_at}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
