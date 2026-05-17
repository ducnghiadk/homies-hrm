'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  initCareerPathStores, getActiveLevels, checkPromotionEligibility,
  getPromotionRequests, createPromotionRequest,
} from '@/lib/career-path-service';
import type { CareerLevel, PromotionConditionProgress, PromotionRequest } from '@/lib/career-path-types';
import ProgressRing from '@/components/career-path/ProgressRing';
import ProgressBar from '@/components/career-path/ProgressBar';
import ConditionChip from '@/components/career-path/ConditionChip';

export default function PromotionPage() {
  const [levels, setLevels] = useState<CareerLevel[]>([]);
  const [conditions, setConditions] = useState<PromotionConditionProgress[]>([]);
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const currentLevelId = 'level-staff';
  const empId = 'emp-001';

  useEffect(() => {
    initCareerPathStores();
    const lvls = getActiveLevels();
    setLevels(lvls);
    const curIdx = lvls.findIndex(l => l.id === currentLevelId);
    if (curIdx >= 0 && curIdx < lvls.length - 1) {
      setConditions(checkPromotionEligibility(empId, currentLevelId, lvls[curIdx + 1].id));
    }
    setRequests(getPromotionRequests());
  }, []);

  const currentLevel = levels.find(l => l.id === currentLevelId);
  const curIdx = levels.findIndex(l => l.id === currentLevelId);
  const nextLevel = curIdx >= 0 && curIdx < levels.length - 1 ? levels[curIdx + 1] : null;
  const allMet = conditions.length > 0 && conditions.every(c => c.is_met);
  const overallProgress = conditions.length > 0 ? Math.round(conditions.reduce((s, c) => s + c.progress_percent, 0) / conditions.length) : 0;
  const hasPending = requests.some(r => r.employee_id === empId && r.status === 'pending');

  const handleSubmit = () => {
    if (nextLevel && !hasPending) {
      createPromotionRequest(empId, currentLevelId, nextLevel.id, conditions);
      setRequests(getPromotionRequests());
      setSubmitted(true);
    }
  };

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Thăng tiến</h1>
      </div>

      {/* Level Progress */}
      <div style={{
        padding: 20, borderRadius: 16, marginBottom: 16,
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: '#fff', textAlign: 'center',
      }}>
        <ProgressRing value={overallProgress} size={100} strokeWidth={7} color="#fff" bgColor="rgba(255,255,255,0.25)" />
        <div style={{ marginTop: 12, fontSize: 20, fontWeight: 700 }}>
          {currentLevel?.icon} {currentLevel?.name} → {nextLevel?.icon} {nextLevel?.name}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          {allMet ? '🎉 Bạn đủ điều kiện thăng tiến!' : `${overallProgress}% hoàn thành điều kiện`}
        </div>
      </div>

      {/* Career Ladder */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>📊 Lộ trình cấp bậc</h2>
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 8 }}>
          {levels.map((level, i) => {
            const isCurrent = level.id === currentLevelId;
            const isPast = level.order < (currentLevel?.order || 0);
            return (
              <div key={level.id} style={{
                padding: '10px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
                background: isCurrent ? '#667eea' + '15' : isPast ? '#e8f5e9' : '#f9f9f9',
                border: `2px solid ${isCurrent ? '#667eea' : isPast ? '#4caf50' : '#e0e0e0'}`,
              }}>
                <span style={{ fontSize: 22 }}>{level.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isCurrent ? '#667eea' : '#333' }}>{level.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{level.description}</div>
                </div>
                {isCurrent && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#667eea', color: '#fff' }}>Hiện tại</span>}
                {isPast && <span style={{ color: '#4caf50' }}>✅</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Conditions Detail */}
      {nextLevel && conditions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>
            📋 Điều kiện lên {nextLevel.icon} {nextLevel.name}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conditions.map((c, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 12, background: '#fff', border: '1px solid #e8ecff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {c.is_met ? '✅' : '⬜'} {c.condition.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.is_met ? '#4caf50' : '#667eea' }}>
                    {c.current_value}/{c.condition.value}
                  </span>
                </div>
                <ProgressBar value={c.progress_percent} height={6} color={c.is_met ? '#4caf50' : '#667eea'} showValue={false} />
                {c.condition.description && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{c.condition.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      {nextLevel && (
        <button
          onClick={handleSubmit}
          disabled={!allMet || hasPending || submitted}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            background: allMet && !hasPending && !submitted ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e0e0e0',
            color: allMet && !hasPending && !submitted ? '#fff' : '#999',
            fontSize: 14, fontWeight: 700, cursor: allMet && !hasPending ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s', marginBottom: 16,
          }}
        >
          {submitted || hasPending ? '📨 Đã gửi yêu cầu — Chờ duyệt' : allMet ? '🚀 Gửi yêu cầu thăng tiến' : '🔒 Chưa đủ điều kiện'}
        </button>
      )}

      {/* Request History */}
      {requests.filter(r => r.employee_id === empId).length > 0 && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>📜 Lịch sử yêu cầu</h2>
          {requests.filter(r => r.employee_id === empId).map(r => (
            <div key={r.id} style={{ padding: 12, borderRadius: 10, background: '#f9f9f9', marginBottom: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>
                  {levels.find(l => l.id === r.from_level_id)?.name} → {levels.find(l => l.id === r.to_level_id)?.name}
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: 8,
                  background: r.status === 'approved' ? '#e8f5e9' : r.status === 'rejected' ? '#ffebee' : '#fff3e0',
                  color: r.status === 'approved' ? '#4caf50' : r.status === 'rejected' ? '#f44336' : '#e65100',
                }}>
                  {r.status === 'approved' ? 'Đã duyệt' : r.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                </span>
              </div>
              <div style={{ color: '#888', marginTop: 4 }}>Ngày gửi: {r.submitted_at}</div>
              {r.review_note && <div style={{ color: '#555', marginTop: 2 }}>Ghi chú: {r.review_note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
