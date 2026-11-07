'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Settings,
  Users,
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  Zap,
  Star,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  UserPlus,
} from 'lucide-react';
import { GradientHeader } from './premium/GradientHeader';
import { StatCard } from './premium/StatCard';
import { ActionList } from './premium/ActionList';
import { TeamOverview } from './premium/TeamOverview';
import { QuickActions } from './premium/QuickActions';
import { GlassCard } from './premium/GlassCard';
import {
  getActionItems, getTeamShifts, getTeamTopPerformers, getTeamWarnings,
} from '@/lib/services/dashboard-service';

interface Props { user: { id: string; name: string; avatar?: string; storeId: string; storeName: string }; }

interface ServerShiftItem {
  id: string;
  employee_id: string;
  employee_name?: string;
  store_id: string;
  date: string;
  shift_id: string;
  shift_name?: string;
  status: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  status: 'checked_in' | 'upcoming' | 'off';
}

interface TeamShift {
  id: string;
  name: string;
  time: string;
  icon: string;
  members: TeamMember[];
  required: number;
}

export function ManagerDashboardPremium({ user }: Props) {
  const [shifts, setShifts] = useState<TeamShift[]>(() => getTeamShifts(user.storeId) as TeamShift[]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const rawActions = getActionItems(user.id, 'manager');
  const top = getTeamTopPerformers(user.storeId);
  const warns = getTeamWarnings(user.storeId);

  // Tải danh sách ca trực thật và số lượng đơn chờ duyệt từ máy chủ
  useEffect(() => {
    let isMounted = true;
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Tải ca trực hôm nay từ GET /api/shifts
    fetch(`/api/shifts?store_id=${encodeURIComponent(user.storeId)}`)
      .then(res => res.json())
      .then(json => {
        if (!isMounted || !json?.success || !Array.isArray(json.data)) return;
        const list: ServerShiftItem[] = json.data;
        
        // Ưu tiên lấy ca ngày hôm nay, nếu hôm nay chưa có ca thì lấy ngày gần nhất có ca
        let targetShifts = list.filter(s => s.date === todayStr);
        if (targetShifts.length === 0 && list.length > 0) {
          const sortedDates = [...new Set(list.map(s => s.date))].sort().reverse();
          if (sortedDates[0]) {
            targetShifts = list.filter(s => s.date === sortedDates[0]);
          }
        }

        if (targetShifts.length > 0) {
          const morningMembers: TeamMember[] = [];
          const afternoonMembers: TeamMember[] = [];

          targetShifts.forEach((s, idx) => {
            const shiftNameLower = (s.shift_name || '').toLowerCase();
            const isMorning = s.shift_id === 'shift-001' || shiftNameLower.includes('sáng');
            const empName = s.employee_name || 'Nhân sự';
            const empId = s.employee_id || `emp-${idx}`;
            const memberObj = {
              id: empId,
              name: empName,
              status: isMorning ? ('checked_in' as const) : ('upcoming' as const),
            };

            const targetList = isMorning ? morningMembers : afternoonMembers;
            if (!targetList.some(m => m.id === empId)) {
              targetList.push(memberObj);
            }
          });

          setShifts([
            {
              id: 'ts-morning',
              name: 'Ca Sáng',
              time: '06:00 - 14:00',
              icon: '🌅',
              required: morningMembers.length || 3,
              members: morningMembers,
            },
            {
              id: 'ts-afternoon',
              name: 'Ca Chiều',
              time: '14:00 - 22:00',
              icon: '☀️',
              required: afternoonMembers.length || 3,
              members: afternoonMembers,
            },
          ]);
        }
      })
      .catch(err => {
        console.warn('[ManagerDashboard] Failed to fetch shifts:', err);
      });

    // 2. Tải số đơn chờ duyệt thật từ GET /api/requests?status=pending
    fetch('/api/requests?status=pending')
      .then(res => res.json())
      .then(json => {
        if (!isMounted || !json?.success) return;
        const requests = Array.isArray(json.data) ? json.data : [];
        // Lọc đơn của cửa hàng hiện tại nếu có thông tin store_id
        const storeRequests = requests.filter((r: { store_id?: string }) => !r.store_id || r.store_id === user.storeId);
        setPendingCount(storeRequests.length);
      })
      .catch(err => {
        console.warn('[ManagerDashboard] Failed to fetch pending requests:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [user.storeId]);

  const totalOnline = shifts.reduce((s, sh) => s + sh.members.length, 0);
  const morningFull = shifts[0] ? shifts[0].members.length >= shifts[0].required : true;

  // Cập nhật Action Items với số đơn chờ duyệt thật
  const actions = rawActions.map(act => {
    if (act.id === 'a2') {
      return {
        ...act,
        title: `${pendingCount > 0 ? pendingCount : 'Không có'} đơn cần phê duyệt`,
        description: pendingCount > 0 ? `${pendingCount} yêu cầu đang chờ quản lý phê duyệt` : 'Tất cả đơn đã được xử lý',
        badge: pendingCount > 0 ? pendingCount : undefined,
      };
    }
    return act;
  });

  const quickActions = [
    { id: 'schedule', icon: <Calendar size={22} />, label: 'Quản lý lịch', href: '/schedule' },
    { id: 'admin-registration', icon: <Clock size={22} />, label: 'Mở đợt xếp ca', href: '/schedule' },
    { id: 'admin-review', icon: <Zap size={22} />, label: 'Phân ca tự động', href: '/schedule' },
    { id: 'leave', icon: <ClipboardCheck size={22} />, label: 'Duyệt phép', href: '/leave/approval', badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'violations', icon: <FileText size={22} />, label: 'Ghi lỗi', href: '/kpi/violations' },
    { id: 'addEmp', icon: <UserPlus size={22} />, label: 'Thêm NV', href: '/employees/new' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      <GradientHeader
        user={{ name: user.name, avatar: user.avatar, role: 'manager', subtitle: user.storeName }}
        gradient="from-[#2F6FA8] to-[#001D3D]"
        rightContent={
          <div className="flex items-center gap-2">
            <a href="/settings" className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition">
              <Settings size={18} />
            </a>
            <div className="relative">
              <a href="/leave/approval" className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition">
                <Bell size={18} />
              </a>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                  {pendingCount}
                </span>
              )}
            </div>
          </div>
        }
      />

      <div className="px-4 py-6 -mt-4">
        {/* Mobile: 1 cột / Desktop: 2 cột (Cột chính 2/3, Cột phụ 1/3) */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          
          {/* Cột chính (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Items */}
            <div className="animate-slideUp">
              <ActionList items={actions} maxVisible={5} viewAllHref="/notifications" />
            </div>

            {/* Team Today */}
            <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <h3 className="font-semibold text-[#001D3D] mb-3 flex items-center gap-2">
                <Users size={18} className="text-[#2F6FA8]" />
                <span>Tình hình ca trực hôm nay</span>
              </h3>
              <TeamOverview shifts={shifts} onFindReplacement={(id) => console.log('Find for', id)} />
            </div>
          </div>

          {/* Cột phụ (1/3) */}
          <div className="mt-6 lg:mt-0 space-y-6">
            {/* Overview Stats */}
            <div className="animate-slideUp" style={{ animationDelay: '0.15s' }}>
              <GlassCard>
                <h3 className="font-semibold text-[#001D3D] mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#2F6FA8]" />
                  <span>Tổng quan hôm nay</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard value={totalOnline} label="NV online" icon={<Users size={16} className="text-primary-600" />} size="sm" />
                  <StatCard value={morningFull ? '3/3' : '2/3'} label="Ca sáng" icon={<Clock size={16} className="text-primary-600" />} size="sm" />
                  <StatCard value="85%" label="KPI TB" icon={<TrendingUp size={16} className="text-emerald-600" />} size="sm" />
                  <StatCard value={0} label="Sự cố" icon={<AlertTriangle size={16} className="text-amber-500" />} size="sm" />
                </div>
              </GlassCard>
            </div>

            {/* Top Performers */}
            <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <GlassCard>
                <h3 className="font-semibold text-[#001D3D] mb-4 flex items-center gap-2">
                  <Star size={18} className="text-amber-500" />
                  <span>Top Nhân Viên Xuất Sắc</span>
                </h3>
                <div className="space-y-3">
                  {top.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-vanilla-50 hover:bg-primary-50 transition-colors">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white font-bold text-xs text-[#2F6FA8] border border-gray-100 shadow-2xs">
                        #{i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.kpi}% KPI • {p.skills} kỹ năng</p>
                      </div>
                      <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-600 to-primary-500 rounded-full" style={{ width: `${p.kpi}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {warns.length > 0 && (
                  <div className="mt-4 p-3 bg-warning-50 rounded-xl border border-warning-200">
                    {warns.map(w => (
                      <p key={w.id} className="text-sm text-warning-700 flex items-center gap-2">
                        <AlertTriangle size={15} />
                        <span>Cần chú ý: {w.name} ({w.kpi}% KPI)</span>
                      </p>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Quick Actions */}
            <div className="animate-slideUp" style={{ animationDelay: '0.25s' }}>
              <h3 className="font-semibold text-[#001D3D] mb-3 flex items-center gap-2">
                <Zap size={18} className="text-[#2F6FA8]" />
                <span>Thao tác nhanh</span>
              </h3>
              <QuickActions actions={quickActions} />
            </div>
          </div>

        </div>
      </div>
      <div className="h-24" />
    </div>
  );
}
