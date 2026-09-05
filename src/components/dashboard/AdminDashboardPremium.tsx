'use client';

import {
  BarChart3,
  DollarSign,
  Store,
  Users,
  TrendingUp,
  Clock,
  Lightbulb,
  Zap,
  Trophy,
  Star,
  Settings,
  FileSpreadsheet,
  Wifi,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';
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
    { id: 'report', icon: <BarChart3 size={22} />, label: 'Báo cáo', href: '/kpi/reports' },
    { id: 'payroll', icon: <DollarSign size={22} />, label: 'Bảng lương', href: '/payroll' },
    { id: 'admin-registration', icon: <CalendarDays size={22} />, label: 'Mở đợt xếp ca', href: '/schedule' },
    { id: 'admin-review', icon: <Zap size={22} />, label: 'Phân ca tự động', href: '/schedule' },
    { id: 'settings', icon: <Settings size={22} />, label: 'Cài đặt', href: '/settings' },
    { id: 'export', icon: <FileSpreadsheet size={22} />, label: 'Xuất Excel', href: '/kpi/reports' },
    { id: 'offline', icon: <Wifi size={22} />, label: 'Offline Demo', href: '/offline-demo' },
    { id: 'rbac', icon: <ShieldCheck size={22} />, label: 'Phân quyền', href: '/rbac' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      <GradientHeader
        user={{ name: user.name, avatar: user.avatar, role: 'ceo', subtitle: user.companyName }}
        gradient="from-[#2F6FA8] to-[#001D3D]"
      />

      <div className="px-4 py-6 -mt-4">
        {/* Mobile: 1 cột / Desktop: 2 cột (Cột chính 2/3, Cột phụ 1/3) */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          
          {/* Cột chính (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Overview & Chart */}
            <div className="animate-slideUp">
              <GlassCard>
                <h3 className="font-semibold text-[#001D3D] mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#2F6FA8]" />
                  <span>Tổng quan tình hình kinh doanh</span>
                </h3>

                {/* Hero stat */}
                <div className="bg-gradient-to-br from-primary-700 to-primary-500 rounded-2xl p-5 mb-6 text-white relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  <p className="text-sm text-white/80 mb-1 flex items-center gap-1.5">
                    <DollarSign size={16} /> Tổng chi phí nhân sự toàn chuỗi
                  </p>
                  <p className="text-3xl font-bold">{overview.totalCost}</p>
                  <p className="text-sm text-white/80 mt-1">
                    {overview.costTrend < 0 ? '▼' : '▲'} {Math.abs(overview.costTrend)}% so với tháng trước
                  </p>
                </div>

                {/* Branch Comparison Table */}
                <h3 className="font-semibold text-[#001D3D] mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Store size={18} className="text-[#2F6FA8]" />
                    <span>So sánh hiệu quả chi nhánh</span>
                  </span>
                  <a href="/branches" className="text-sm text-primary-600 font-medium hover:underline">Chi tiết →</a>
                </h3>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-vanilla-50">
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
                                <div className="h-full bg-gradient-to-r from-primary-600 to-primary-50 rounded-full" style={{ width: `${b.kpi}%` }} />
                              </div>
                              <span className="font-semibold text-gray-900">{b.kpi}%</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-gray-100">
                        <td className="p-3 text-gray-500">Nhân sự</td>
                        {branches.map(b => <td key={b.id} className="text-center p-3 font-medium text-gray-900">{b.employees}</td>)}
                      </tr>
                      <tr className="border-t border-gray-100">
                        <td className="p-3 text-gray-500">Chi phí</td>
                        {branches.map(b => <td key={b.id} className="text-center p-3 font-medium text-gray-900">{b.cost}</td>)}
                      </tr>
                      <tr className="border-t border-gray-100">
                        <td className="p-3 text-gray-500">Đánh giá</td>
                        {branches.map(b => (
                          <td key={b.id} className="text-center p-3">
                            <div className="flex items-center justify-center gap-1 text-amber-500 font-semibold text-xs">
                              <Star size={14} className="fill-amber-400 text-amber-400" />
                              <span>{b.rating}/5</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Best Branch Alert */}
                <div className="mt-4 p-3 bg-gradient-to-r from-warning-50 to-warning-100 rounded-xl border border-warning-200 text-center">
                  <p className="text-sm text-warning-700 font-medium flex items-center justify-center gap-1.5">
                    <Trophy size={16} className="text-amber-600" />
                    <span>{[...branches].sort((a, b) => b.kpi - a.kpi)[0].name} đang dẫn đầu hiệu suất!</span>
                  </p>
                </div>
              </GlassCard>
            </div>

            {/* Approval Items */}
            <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <ActionList items={actions} maxVisible={5} viewAllHref="/notifications" />
            </div>
          </div>

          {/* Cột phụ (1/3) */}
          <div className="mt-6 lg:mt-0 space-y-6">
            {/* Stat Cards GlassCard */}
            <div className="animate-slideUp" style={{ animationDelay: '0.15s' }}>
              <GlassCard>
                <h3 className="font-semibold text-[#001D3D] mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#2F6FA8]" />
                  <span>Chỉ số vận hành</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard value={overview.totalEmployees} label="Tổng nhân sự" icon={<Users size={16} className="text-primary-600" />} trend={{ direction: 'up', value: `+${overview.newEmployees} mới` }} size="sm" />
                  <StatCard value={overview.totalBranches} label="Chi nhánh" icon={<Store size={16} className="text-primary-600" />} size="sm" />
                  <StatCard value={`${overview.avgKpi}%`} label="KPI Trung Bình" icon={<TrendingUp size={16} className="text-emerald-600" />} trend={{ direction: 'up', value: `+${overview.kpiTrend}%` }} size="sm" />
                  <StatCard value="98%" label="Đúng giờ" icon={<Clock size={16} className="text-primary-600" />} size="sm" />
                </div>
              </GlassCard>
            </div>

            {/* AI Insights */}
            <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-semibold text-[#001D3D] mb-3 flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" />
                <span>AI Insights & Đề xuất</span>
              </h3>
              <InsightsBanner insights={insights} />
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
