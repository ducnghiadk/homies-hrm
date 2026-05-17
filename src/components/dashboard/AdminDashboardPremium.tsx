'use client';

import { GradientHeader } from './premium/GradientHeader';
import { StatCard } from './premium/StatCard';
import { ActionList } from './premium/ActionList';
import { InsightsBanner } from './premium/InsightsBanner';
import { QuickActions } from './premium/QuickActions';
import { GlassCard } from './premium/GlassCard';
import {
  getActionItems, getBranchComparison, getAdminInsights, getAdminOverview,
} from '@/lib/services/dashboard-service';

interface Props { user: { id: string; name: string; avatar?: string; companyName: string }; }

export function AdminDashboardPremium({ user }: Props) {
  const overview = getAdminOverview();
  const actions = getActionItems(user.id, 'admin');
  const branches = getBranchComparison();
  const insights = getAdminInsights();

  const quickActions = [
    { id: 'report', icon: '📊', label: 'Báo cáo', href: '/kpi/reports' },
    { id: 'payroll', icon: '💰', label: 'Bảng lương', href: '/payroll' },
    { id: 'settings', icon: '⚙️', label: 'Cài đặt', href: '/settings' },
    { id: 'export', icon: '📤', label: 'Xuất Excel', href: '/kpi/reports' },
  ];

  const starRating = (n: number) => '⭐'.repeat(n);

  return (
    <div className="min-h-screen bg-gray-50">
      <GradientHeader
        user={{ name: user.name, avatar: user.avatar, role: 'ceo', subtitle: user.companyName }}
        gradient="from-gray-900 via-purple-900 to-gray-900"
        rightContent={
          <div className="flex items-center gap-2">
            <a href="/settings" className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">⚙️</a>
            <div className="relative">
              <button className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">🔔</button>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
            </div>
          </div>
        }
      />

      <div className="px-4 py-6 space-y-6 -mt-4">
        {/* Business Overview */}
        <div className="animate-slideUp">
          <GlassCard>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><span>📊</span><span>Business Overview</span></h3>

            {/* Hero stat */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 mb-4 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <p className="text-sm text-white/80 mb-1">💰 Tổng chi phí nhân sự</p>
              <p className="text-3xl font-bold">{overview.totalCost}</p>
              <p className="text-sm text-white/80 mt-1">
                {overview.costTrend < 0 ? '▼' : '▲'} {Math.abs(overview.costTrend)}% vs tháng trước
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard value={overview.totalEmployees} label="Nhân sự" icon={<span>👥</span>} trend={{ direction: 'up', value: `+${overview.newEmployees} mới` }} size="sm" />
              <StatCard value={overview.totalBranches} label="Chi nhánh" icon={<span>🏪</span>} size="sm" />
              <StatCard value={`${overview.avgKpi}%`} label="KPI TB" icon={<span>📈</span>} trend={{ direction: 'up', value: `+${overview.kpiTrend}%` }} size="sm" />
            </div>
          </GlassCard>
        </div>

        {/* Approval Items */}
        <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <ActionList items={actions} maxVisible={5} viewAllHref="/notifications" />
        </div>

        {/* Branch Comparison */}
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <GlassCard>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><span>🏪</span><span>So sánh chi nhánh</span></span>
              <a href="/branches" className="text-sm text-purple-600 font-medium">Xem →</a>
            </h3>

            {/* Comparison table */}
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-500"></th>
                    {branches.map(b => <th key={b.id} className="text-center p-3 font-semibold text-gray-900">{b.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className="p-3 text-gray-500">KPI</td>
                    {branches.map(b => (
                      <td key={b.id} className="text-center p-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${b.kpi}%` }} />
                          </div>
                          <span className="font-semibold text-gray-900">{b.kpi}%</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="p-3 text-gray-500">NV</td>
                    {branches.map(b => <td key={b.id} className="text-center p-3 font-medium text-gray-900">{b.employees}</td>)}
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="p-3 text-gray-500">Cost</td>
                    {branches.map(b => <td key={b.id} className="text-center p-3 font-medium text-gray-900">{b.cost}</td>)}
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="p-3 text-gray-500">Rate</td>
                    {branches.map(b => <td key={b.id} className="text-center p-3">{starRating(b.rating)}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Winner */}
            <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 text-center">
              <p className="text-sm text-amber-700 font-medium">🏆 {branches.sort((a, b) => b.kpi - a.kpi)[0].name} đang dẫn đầu!</p>
            </div>
          </GlassCard>
        </div>

        {/* AI Insights */}
        <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><span>💡</span><span>AI Insights</span></h3>
          <InsightsBanner insights={insights} />
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
