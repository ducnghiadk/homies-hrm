'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { initCareerPathStores, getLeaderboard } from '@/lib/career-path-service';
import type { LeaderboardEntry, LeaderboardCategory } from '@/lib/career-path-types';

const categories: { key: LeaderboardCategory; label: string; icon: string }[] = [
  { key: 'top_mentor', label: 'Top Mentor', icon: '🎓' },
  { key: 'skill_unlock', label: 'Skill Master', icon: '⚡' },
  { key: 'streak', label: 'Streak', icon: '🔥' },
  { key: 'drinks_made', label: 'Ly pha', icon: '🧋' },
];

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [cat, setCat] = useState<LeaderboardCategory>('top_mentor');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const period = '2026-02';

  useEffect(() => {
    initCareerPathStores();
  }, []);

  useEffect(() => {
    setEntries(getLeaderboard(cat, period));
  }, [cat]);

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🏆 Leaderboard</h1>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: '#888' }}>T2/2026</span>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)} style={{
            padding: '8px 14px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600,
            background: cat === c.key
              ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f0',
            color: cat === c.key ? '#fff' : '#555', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Podium */}
      {entries.length >= 3 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 10,
          marginBottom: 20, padding: '20px 0',
        }}>
          {/* 2nd place */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{medals[1]}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{entries[1].employee_name}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#667eea' }}>{entries[1].score}</div>
            <div style={{ height: 50, background: 'linear-gradient(180deg, #c0c0c0, #e0e0e0)', borderRadius: '8px 8px 0 0', marginTop: 8 }} />
          </div>
          {/* 1st place */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>{medals[0]}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{entries[0].employee_name}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#667eea' }}>{entries[0].score}</div>
            {entries[0].highlight && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{entries[0].highlight}</div>}
            <div style={{ height: 80, background: 'linear-gradient(180deg, #ffd700, #ffecb3)', borderRadius: '8px 8px 0 0', marginTop: 8 }} />
          </div>
          {/* 3rd place */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{medals[2]}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{entries.length > 2 ? entries[2].employee_name : '-'}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#667eea' }}>{entries.length > 2 ? entries[2].score : 0}</div>
            <div style={{ height: 30, background: 'linear-gradient(180deg, #cd7f32, #eddbb9)', borderRadius: '8px 8px 0 0', marginTop: 8 }} />
          </div>
        </div>
      )}

      {/* Full List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e, i) => (
          <div key={e.employee_id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            borderRadius: 12, background: i === 0 ? '#fffde7' : '#fff',
            border: `1px solid ${i === 0 ? '#fff9c4' : '#eee'}`,
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#888', width: 24, textAlign: 'center' }}>
              {i < 3 ? medals[i] : `${i + 1}`}
            </span>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#e8ecff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {e.employee_name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{e.employee_name}</div>
              {e.highlight && <div style={{ fontSize: 10, color: '#888' }}>{e.highlight}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#667eea' }}>{e.score}</div>
              <div style={{ fontSize: 10 }}>
                {e.trend === 'up' ? '📈' : e.trend === 'down' ? '📉' : '➡️'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          <div style={{ fontSize: 40 }}>🏆</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Chưa có dữ liệu</div>
        </div>
      )}
    </div>
  );
}
