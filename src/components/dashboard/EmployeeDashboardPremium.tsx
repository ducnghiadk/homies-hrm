'use client';

import { useRouter } from 'next/navigation';
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
  getCurrentShift, getActionItems, getMonthlyStats,
  getWeekSchedule, getCareerProgress, getAchievements,
} from '@/lib/services/dashboard-service';

interface Props { user: { id: string; name: string; avatar?: string; level: string }; }

export function EmployeeDashboardPremium({ user }: Props) {
  const router = useRouter();
  const shift = getCurrentShift(user.id);
  const actions = getActionItems(user.id, 'employee');
  const stats = getMonthlyStats(user.id);
  const week = getWeekSchedule(user.id);
  const career = getCareerProgress(user.id);
  const achs = getAchievements(user.id);

  const quickActions = [
    { id: 'schedule', icon: '📅', label: 'Lịch làm', href: '/schedule' },
    { id: 'leave', icon: '🏖️', label: 'Nghỉ phép', href: '/leave' },
    { id: 'kpi', icon: '📊', label: 'KPI', href: '/kpi' },
    { id: 'chat', icon: '💬', label: 'Chat', href: '/chat' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <GradientHeader
        user={{ name: user.name, avatar: user.avatar, role: 'employee', subtitle: shift ? `Ca ${shift.name}` : 'Hôm nay nghỉ' }}
        gradient="from-purple-600 via-purple-500 to-indigo-600"
      />

      <div className="px-4 py-6 space-y-6 -mt-4">
        {/* Shift */}
        <div className="animate-slideUp">
          <ShiftTimeline shift={shift} onCheckIn={() => router.push('/attendance/check-in')} />
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <ActionList items={actions} maxVisible={3} viewAllHref="/notifications" />
          </div>
        )}

        {/* Monthly Stats */}
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <GlassCard>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span><span>Tổng quan tháng {new Date().getMonth() + 1}</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-center">
                <ProgressRing value={stats.kpi} label="KPI Score" sublabel={stats.kpi >= 85 ? '⭐ Tốt' : stats.kpi >= 70 ? '📈 Khá' : '⚠️ Cần cải thiện'}
                  color={stats.kpi >= 85 ? 'emerald' : stats.kpi >= 70 ? 'amber' : 'red'} />
              </div>
              <div className="space-y-3">
                <StatCard value={`${stats.workDays}/${stats.totalDays}`} label="Ngày công" trend={{ direction: 'up', value: '+2' }} size="sm" />
                <StatCard value={`${stats.onTimeRate}%`} label="Đúng giờ" trend={{ direction: 'up', value: 'Xuất sắc!' }} size="sm" />
                <StatCard value={stats.violations} label="Vi phạm" trend={{ direction: 'up', value: 'Hoàn hảo!' }} size="sm" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Week Calendar */}
        <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2"><span>📅</span><span>Lịch tuần này</span></span>
            <a href="/schedule" className="text-sm text-purple-600 font-medium">Xem →</a>
          </h3>
          <WeekCalendar days={week} totalHours={40} />
        </div>

        {/* Career Progress */}
        <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <GlassCard href="/career-path" variant="gradient">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><span>🚀</span><span>Lộ trình thăng tiến</span></h3>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="flex items-center gap-1"><span>☕</span><span className="text-gray-600">{career.currentLevel}</span></span>
              <span className="text-gray-400">→</span>
              <span className="flex items-center gap-1"><span>⭐</span><span className="text-gray-600">{career.nextLevel}</span></span>
            </div>
            <div className="h-3 bg-white/60 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${career.percentage}%` }} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">✅ {career.skillsUnlocked}/{career.totalSkills} kỹ năng</span>
              <span className="text-gray-500">⏱️ ~{career.estimatedMonths} tháng nữa</span>
            </div>
            <div className="mt-3 p-2 bg-white/50 rounded-xl">
              <p className="text-xs text-gray-600 flex items-center gap-1"><span>💡</span><span>{career.tip}</span></p>
            </div>
          </GlassCard>
        </div>

        {/* Achievements */}
        <div className="animate-slideUp" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><span>🏆</span><span>Thành tích</span></h3>
          <AchievementBadges badges={achs.badges} newAchievement={achs.newAchievement} />
        </div>

        {/* Quick Actions */}
        <div className="animate-slideUp" style={{ animationDelay: '0.6s' }}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><span>⚡</span><span>Thao tác nhanh</span></h3>
          <QuickActions actions={quickActions} />
        </div>
      </div>
      <div className="h-24" />
    </div>
  );
}
