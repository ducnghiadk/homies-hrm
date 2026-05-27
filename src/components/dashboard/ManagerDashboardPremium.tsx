'use client';

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
    { id: 'schedule', icon: '📅', label: 'Quản lý lịch', href: '/schedules' },
    { id: 'admin-registration', icon: '⏳', label: 'Mở đợt xếp ca', href: '/schedules', color: 'from-primary-50 to-primary-100' },
    { id: 'admin-review', icon: '⚡', label: 'Phân ca tự động', href: '/schedules', color: 'from-warning-50 to-warning-100' },
    { id: 'leave', icon: '📋', label: 'Duyệt phép', href: '/leave/approvals', badge: 3 },
    { id: 'violations', icon: '📝', label: 'Ghi lỗi', href: '/violations', badge: 2 },
    { id: 'addEmp', icon: '👤', label: 'Thêm NV', href: '/employees/new' },
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
          </div>
        }
      />

      <div className="px-4 py-6 space-y-6 -mt-4">
        {/* Overview Stats */}
        <div className="animate-slideUp">
          <GlassCard>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><span>📊</span><span>Tổng quan hôm nay</span></h3>
            <div className="grid grid-cols-4 gap-3">
              <StatCard value={totalOnline} label="NV online" icon={<span>👥</span>} size="sm" />
              <StatCard value={morningFull ? '3/3' : '2/3'} label="Ca sáng" icon={<span>{morningFull ? '✅' : '⚠️'}</span>} size="sm" />
              <StatCard value="85%" label="KPI TB" icon={<span>📈</span>} size="sm" />
              <StatCard value={0} label="Sự cố" icon={<span>⚠️</span>} size="sm" />
            </div>
          </GlassCard>
        </div>

        {/* Action Items */}
        <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <ActionList items={actions} maxVisible={5} viewAllHref="/notifications" />
        </div>

        {/* Team Today */}
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><span>👥</span><span>Team hôm nay</span></h3>
          <TeamOverview shifts={shifts} onFindReplacement={(id) => console.log('Find for', id)} />
        </div>

        {/* Top Performers */}
        <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <GlassCard>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><span>🌟</span><span>Top Performers</span></h3>
            <div className="space-y-3">
              {top.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-xl">{medals[i] || ''}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.kpi}% KPI • {p.skills} skills</p>
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
                    <span>⚠️</span><span>Cần chú ý: {w.name} ({w.kpi}% KPI)</span>
                  </p>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><span>⚡</span><span>Thao tác nhanh</span></h3>
          <QuickActions actions={quickActions} />
        </div>
      </div>
      <div className="h-24" />
    </div>
  );
}
