'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import {
  initCareerPathStores,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from '@/lib/career-path-service';
import type { CareerNotification } from '@/lib/career-path-types';
import {
  ChevronRight,
  ArrowLeft,
  Bell,
  CheckCheck,
  CheckCircle2,
  Sparkles,
  Award,
  Target,
  Users,
  Clock,
  ArrowRight,
  Inbox,
  AlertCircle,
} from 'lucide-react';

initCareerPathStores();

function getNotificationIcon(type: string) {
  switch (type) {
    case 'skill_unlock_available':
      return <Sparkles size={18} className="text-amber-600" />;
    case 'promotion_eligible':
    case 'promotion_approved':
      return <Award size={18} className="text-emerald-600" />;
    case 'promotion_rejected':
      return <AlertCircle size={18} className="text-rose-600" />;
    case 'goal_reminder':
    case 'goal_achieved':
      return <Target size={18} className="text-blue-600" />;
    case 'buddy_update':
      return <Users size={18} className="text-purple-600" />;
    case 'endorsement_received':
      return <Sparkles size={18} className="text-amber-500" />;
    default:
      return <Bell size={18} className="text-[#2F6FA8]" />;
  }
}

export default function NotificationsPage() {
  const empId = 'emp-001';
  const [notifications, setNotifications] = useState<CareerNotification[]>(() => getNotifications(empId));
  const [unread, setUnread] = useState(() => getUnreadCount(empId));
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const reload = () => {
    setNotifications(getNotifications(empId));
    setUnread(getUnreadCount(empId));
  };

  const handleRead = (id: string) => {
    markNotificationRead(id);
    reload();
  };

  const handleReadAll = () => {
    markAllNotificationsRead(empId);
    reload();
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <AppShell title="Thông Báo Lộ Trình">
      <div className="space-y-6 pb-12">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TẦNG 1: EXECUTIVE COMMAND HEADER                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Link href="/career-path" className="hover:text-[#2F6FA8] transition">
                  Lộ Trình Sự Nghiệp
                </Link>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="text-[#2F6FA8] font-bold">Thông Báo</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/career-path"
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                  title="Quay lại lộ trình"
                >
                  <ArrowLeft size={18} />
                </Link>
                <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight">
                  Thông Báo Lộ Trình &amp; Phát Triển
                </h1>
                {unread > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {unread} Chưa đọc
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleReadAll}
                  className="px-3.5 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 transition shadow-2xs"
                >
                  <CheckCheck size={15} className="text-[#2F6FA8]" />
                  <span>Đánh Dấu Đã Đọc Tất Cả</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-[#2F6FA8] text-white shadow-2xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'unread'
                  ? 'bg-[#2F6FA8] text-white shadow-2xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Chưa đọc ({unread})
            </button>
          </div>

          <span className="text-xs text-gray-500 font-medium">
            Lưu trữ trong 30 ngày gần nhất
          </span>
        </div>

        {/* Notifications List */}
        {filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center mx-auto">
              <Inbox size={24} />
            </div>
            <h3 className="text-base font-bold text-[#001D3D]">
              {filter === 'unread' ? 'Không có thông báo chưa đọc nào' : 'Chưa có thông báo nào'}
            </h3>
            <p className="text-xs text-gray-500">
              Các thông báo về kỹ năng, mục tiêu và thăng tiến sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleRead(notif.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  !notif.is_read
                    ? 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-500/10'
                    : 'bg-white/80 border-gray-100 text-gray-600 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                      !notif.is_read
                        ? 'bg-blue-50/80 border-blue-100'
                        : 'bg-gray-50 border-gray-200/60'
                    }`}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-xs sm:text-sm font-bold ${
                          !notif.is_read ? 'text-[#001D3D]' : 'text-gray-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                      )}
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {notif.created_at}
                      </span>
                      {notif.link && (
                        <Link
                          href={notif.link}
                          className="text-[#2F6FA8] font-sans font-bold hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Xem chi tiết</span>
                          <ArrowRight size={11} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRead(notif.id);
                    }}
                    className="text-[11px] font-semibold text-gray-400 hover:text-[#2F6FA8] flex-shrink-0"
                    title="Đánh dấu đã đọc"
                  >
                    Đã đọc
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
