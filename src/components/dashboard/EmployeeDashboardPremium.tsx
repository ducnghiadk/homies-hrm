'use client';

import {
  Bell,
  Clock,
  Calendar,
  Zap,
  BarChart3,
  Trophy,
  TrendingUp,
  Plane,
  RefreshCw,
  CheckCircle2,
  Compass,
  CreditCard,
  User,
  MoreHorizontal,
} from 'lucide-react';
import { GradientHeader } from './premium/GradientHeader';
import { ShiftTimeline } from './premium/ShiftTimeline';
import { ActionList } from './premium/ActionList';
import { StatCard } from './premium/StatCard';
import { ProgressRing } from './premium/ProgressRing';
import { WeekCalendar } from './premium/WeekCalendar';
import { QuickActions } from './premium/QuickActions';
import { AchievementBadges } from './premium/AchievementBadges';
import { GlassCard } from './premium/GlassCard';
import {
  getCurrentShift,
  getActionItems,
  getMonthlyStats,
  getWeekSchedule,
  getAchievements,
} from '@/lib/services/dashboard-service';

interface Props {
  user: { id: string; name: string; avatar?: string; level: string };
}

export function EmployeeDashboardPremium({ user }: Props) {
  const shift = getCurrentShift(user.id);
  const actions = getActionItems(user.id, 'employee');
  const stats = getMonthlyStats(user.id);
  const week = getWeekSchedule(user.id);
  const achievements = getAchievements(user.id);

  const quickActions = [
    { id: 'schedule', icon: <Calendar size={22} />, label: 'Lịch của tôi', href: '/my-schedule' },
    { id: 'leave', icon: <Plane size={22} />, label: 'Xin nghỉ phép', href: '/leave/request' },
    { id: 'swap', icon: <RefreshCw size={22} />, label: 'Đổi ca', href: '/schedule/swap' },
    { id: 'checkin', icon: <CheckCircle2 size={22} />, label: 'Chấm công', href: '/checkin' },
    { id: 'onboarding', icon: <Compass size={22} />, label: 'Onboarding', href: '/onboarding' },
    { id: 'payroll', icon: <CreditCard size={22} />, label: 'Bảng lương', href: '/payroll/salary-slip' },
    { id: 'kpi', icon: <TrendingUp size={22} />, label: 'Kết quả KPI', href: '/kpi' },
    { id: 'profile', icon: <User size={22} />, label: 'Hồ sơ', href: '/profile' },
    { id: 'more', icon: <MoreHorizontal size={22} />, label: 'Thêm', href: '/more' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      <GradientHeader
        user={{ name: user.name, avatar: user.avatar, role: user.level, subtitle: 'Nhân viên' }}
        gradient="from-[#2F6FA8] to-[#001D3D]"
        rightContent={
          <a href="/notifications" className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition">
            <Bell size={18} />
          </a>
        }
      />

      <div className="px-4 py-6 -mt-4">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="animate-slideUp">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Clock size={18} className="text-[#2F6FA8]" />
                <span>Ca làm hôm nay</span>
              </h3>
              <ShiftTimeline shift={shift} />
            </div>

            <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-[#2F6FA8]" />
                <span>Lịch tuần này</span>
              </h3>
              <WeekCalendar days={week} />
            </div>

            <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <ActionList items={actions} maxVisible={4} viewAllHref="/notifications" />
            </div>

            <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Zap size={18} className="text-[#2F6FA8]" />
                <span>Thao tác nhanh</span>
              </h3>
              <QuickActions actions={quickActions} />
            </div>
          </div>

          <div className="mt-5 lg:mt-0 space-y-5">
            <div className="animate-slideUp" style={{ animationDelay: '0.15s' }}>
              <GlassCard>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#2F6FA8]" />
                  <span>KPI tháng này</span>
                </h3>
                <div className="flex justify-center mb-4">
                  <ProgressRing value={stats.kpi} size="sm" label="KPI" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    value={`${stats.workDays}/${stats.totalDays}`}
                    label="Ngày làm"
                    icon={<Calendar size={16} className="text-primary-600" />}
                    size="sm"
                  />
                  <StatCard
                    value={`${stats.onTimeRate}%`}
                    label="Đúng giờ"
                    icon={<Clock size={16} className="text-primary-600" />}
                    size="sm"
                    trend={{ direction: 'up', value: '+2%' }}
                  />
                </div>
              </GlassCard>
            </div>

            <div className="animate-slideUp" style={{ animationDelay: '0.25s' }}>
              <GlassCard>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <span>Thành tích</span>
                </h3>
                <AchievementBadges badges={achievements.badges} newAchievement={achievements.newAchievement} />
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
}
