'use client';

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

export function ManagerDashboardPremium({ user }: Props) {
  const actions = getActionItems(user.id, 'manager');
  const shifts = getTeamShifts(user.storeId);
  const top = getTeamTopPerformers(user.storeId);
  const warns = getTeamWarnings(user.storeId);
  const totalOnline = shifts.reduce((s, sh) => s + sh.members.length, 0);
  const morningFull = shifts[0]?.members.length >= shifts[0]?.required;

  const quickActions = [
    { id: 'schedule', icon: <Calendar size={22} />, label: 'Quản lý lịch', href: '/schedules' },
    { id: 'admin-registration', icon: <Clock size={22} />, label: 'Mở đợt xếp ca', href: '/schedules' },
    { id: 'admin-review', icon: <Zap size={22} />, label: 'Phân ca tự động', href: '/schedules' },
    { id: 'leave', icon: <ClipboardCheck size={22} />, label: 'Duyệt phép', href: '/leave/approval', badge: 3 },
    { id: 'violations', icon: <FileText size={22} />, label: 'Ghi lỗi', href: '/kpi/violations', badge: 2 },
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
              <button className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition">
                <Bell size={18} />
              </button>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
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
