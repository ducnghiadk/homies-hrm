'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  initCareerPathStores,
  getPromotionRequests, reviewPromotionRequest,
  getTypeChangeRequests, reviewTypeChangeRequest,
  getActiveLevels,
} from '@/lib/career-path-service';
import type { PromotionRequest, TypeChangeRequest, CareerLevel } from '@/lib/career-path-types';
import ProgressBar from '@/components/career-path/ProgressBar';

type RequestTab = 'promotions' | 'type_changes';

export default function CareerPathRequestsPage() {
  initCareerPathStores();
  const [tab, setTab] = useState<RequestTab>('promotions');
  const [promoRequests, setPromoRequests] = useState<PromotionRequest[]>(() => getPromotionRequests());
  const [typeRequests, setTypeRequests] = useState<TypeChangeRequest[]>(() => getTypeChangeRequests());
  const [levels, setLevels] = useState<CareerLevel[]>(() => getActiveLevels());

  // Mock employee names
  const empNames: Record<string, string> = { 'emp-001': 'Minh', 'emp-002': 'Hùng', 'emp-003': 'Lan', 'emp-004': 'Nam', 'emp-005': 'Linh', 'emp-006': 'Tuấn' };

  const reload = () => {
    setPromoRequests(getPromotionRequests());
    setTypeRequests(getTypeChangeRequests());
    setLevels(getActiveLevels());
  };

  const handleReviewPromo = (id: string, status: 'approved' | 'rejected') => {
    const note = status === 'rejected' ? window.prompt('Lý do từ chối:') : null;
    reviewPromotionRequest(id, status, 'emp-002', note || undefined);
    reload();
  };

  const handleReviewType = (id: string, status: 'approved' | 'rejected') => {
    const note = status === 'rejected' ? window.prompt('Lý do từ chối:') : null;
    reviewTypeChangeRequest(id, status, 'emp-002', note || undefined);
    reload();
  };

  const pending = tab === 'promotions' ? promoRequests.filter(r => r.status === 'pending') : typeRequests.filter(r => r.status === 'pending');
  const processed = tab === 'promotions' ? promoRequests.filter(r => r.status !== 'pending') : typeRequests.filter(r => r.status !== 'pending');

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/career-path/settings" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📨 Yêu cầu</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {([
          { id: 'promotions' as RequestTab, label: '🚀 Thăng tiến', count: promoRequests.filter(r => r.status === 'pending').length },
          { id: 'type_changes' as RequestTab, label: '🔄 Đổi loại NV', count: typeRequests.filter(r => r.status === 'pending').length },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600,
            background: tab === t.id ? '#667eea' : '#f0f0f0', color: tab === t.id ? '#fff' : '#555', cursor: 'pointer',
          }}>
            {t.label} {t.count > 0 && `(${t.count})`}
          </button>
        ))}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>⏳ Chờ duyệt</h2>
          {tab === 'promotions' && (promoRequests.filter(r => r.status === 'pending').map(r => (
            <div key={r.id} style={{ padding: 14, borderRadius: 12, marginBottom: 8, background: '#fff', border: '1px solid #e8ecff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{empNames[r.employee_id] || r.employee_id}</span>
                <span style={{ fontSize: 11, color: '#888' }}>{r.submitted_at}</span>
              </div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
                {levels.find(l => l.id === r.from_level_id)?.icon} {levels.find(l => l.id === r.from_level_id)?.name}
                {' → '}
                {levels.find(l => l.id === r.to_level_id)?.icon} {levels.find(l => l.id === r.to_level_id)?.name}
              </div>
              {r.conditions_snapshot.map((c, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <ProgressBar value={c.progress_percent} height={5} label={c.condition.label}
                    color={c.is_met ? '#4caf50' : '#ff9800'} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => handleReviewPromo(r.id, 'approved')} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#4caf50',
                  color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>✅ Duyệt</button>
                <button onClick={() => handleReviewPromo(r.id, 'rejected')} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #f44336', background: '#fff',
                  color: '#f44336', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>❌ Từ chối</button>
              </div>
            </div>
          )))}
          {tab === 'type_changes' && (typeRequests.filter(r => r.status === 'pending').map(r => (
            <div key={r.id} style={{ padding: 14, borderRadius: 12, marginBottom: 8, background: '#fff', border: '1px solid #e8ecff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{empNames[r.employee_id] || r.employee_id}</span>
                <span style={{ fontSize: 11, color: '#888' }}>{r.submitted_at}</span>
              </div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
                {r.from_type === 'full_time' ? 'Toàn thời gian' : 'Bán thời gian'} → {r.to_type === 'full_time' ? 'Toàn thời gian' : 'Bán thời gian'}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8, padding: 8, borderRadius: 6, background: '#f8f9ff' }}>
                Lý do: {r.reason}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleReviewType(r.id, 'approved')} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#4caf50',
                  color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>✅ Duyệt</button>
                <button onClick={() => handleReviewType(r.id, 'rejected')} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #f44336', background: '#fff',
                  color: '#f44336', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>❌ Từ chối</button>
              </div>
            </div>
          )))}
        </div>
      )}

      {/* Empty state */}
      {pending.length === 0 && (
        <div style={{ textAlign: 'center', padding: 30, color: '#888' }}>
          <div style={{ fontSize: 32 }}>📭</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Không có yêu cầu nào chờ duyệt</div>
        </div>
      )}

      {/* Processed */}
      {processed.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>📋 Đã xử lý</h2>
          {(tab === 'promotions' ? promoRequests : typeRequests).filter(r => r.status !== 'pending').map(r => (
            <div key={r.id} style={{ padding: 10, borderRadius: 8, marginBottom: 4, background: '#f9f9f9', fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>{empNames[r.employee_id] || r.employee_id}</span>
              <span style={{
                marginLeft: 8, padding: '1px 6px', borderRadius: 6,
                background: r.status === 'approved' ? '#e8f5e9' : '#ffebee',
                color: r.status === 'approved' ? '#4caf50' : '#f44336', fontSize: 10,
              }}>
                {r.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
