'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  initCareerPathStores, getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount,
} from '@/lib/career-path-service';
import type { CareerNotification } from '@/lib/career-path-types';

const typeIcons: Record<string, string> = {
  skill_unlock_available: '⚡', promotion_eligible: '🚀', goal_reminder: '🎯',
  buddy_update: '🤝', skill_expiring: '⏰', trial_reminder: '📋',
  endorsement_received: '⭐', goal_achieved: '🎉', promotion_approved: '🎊', promotion_rejected: '❌',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<CareerNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const empId = 'emp-001';

  const reload = () => {
    setNotifications(getNotifications(empId));
    setUnread(getUnreadCount(empId));
  };

  useEffect(() => { initCareerPathStores(); reload(); }, []);

  const handleRead = (id: string) => { markNotificationRead(id); reload(); };
  const handleReadAll = () => { markAllNotificationsRead(empId); reload(); };

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🔔 Thông báo</h1>
        <div style={{ flex: 1 }} />
        {unread > 0 && (
          <button onClick={handleReadAll} style={{
            padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff',
            fontSize: 11, cursor: 'pointer', color: '#667eea',
          }}>
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {unread > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#e3f2fd', marginBottom: 12, fontSize: 12, color: '#1565c0' }}>
          📬 {unread} thông báo chưa đọc
        </div>
      )}

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔕</div>
          <div style={{ fontSize: 14 }}>Chưa có thông báo nào</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => (
            <div key={n.id} onClick={() => handleRead(n.id)} style={{
              padding: 12, borderRadius: 12, display: 'flex', gap: 10,
              background: n.is_read ? '#fafafa' : '#fff',
              border: `1px solid ${n.is_read ? '#f0f0f0' : '#e8ecff'}`,
              cursor: 'pointer', position: 'relative',
            }}>
              {!n.is_read && (
                <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#667eea' }} />
              )}
              <span style={{ fontSize: 22, flexShrink: 0 }}>{typeIcons[n.type] || '📌'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{n.created_at}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
