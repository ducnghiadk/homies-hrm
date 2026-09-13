'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, Calculator, Clock3, Sparkles, ChevronRight } from 'lucide-react'
import type { ScheduleResult } from '@/lib/mock-data-smart-schedule'
import type { TabKey } from '@/hooks/useStaffingWorkspace'

interface StaffingDashboardProps {
  latestPublishedSchedule?: ScheduleResult
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

type WorkspaceMetric = {
  label: string
  value: string
  note: string
  tone: 'neutral' | 'good' | 'warn'
  icon: React.ReactNode
}

export default function StaffingDashboard({
  latestPublishedSchedule,
  activeTab,
  onTabChange,
}: StaffingDashboardProps) {
  const router = useRouter()

  const activeWarnings = latestPublishedSchedule?.warnings ?? []
  const seriousWarnings = activeWarnings.filter((warning) => warning.severity === 'error').length
  const warningCount = activeWarnings.filter((warning) => warning.severity !== 'info').length
  const latestScheduleCost = latestPublishedSchedule?.stats.totalCost ?? 41_300_000

  const staffingMetrics: WorkspaceMetric[] = [
    {
      label: 'Mức ưu tiên hôm nay',
      value: seriousWarnings > 0 ? 'Cần xử lý gấp' : latestPublishedSchedule ? 'Sẵn sàng chốt tuần' : 'Cần tạo lịch mới',
      note: seriousWarnings > 0
        ? `${seriousWarnings} lỗi nặng đang chặn áp dụng`
        : latestPublishedSchedule
          ? `Có ${warningCount} cảnh báo đang cần theo dõi`
          : 'Chưa có lịch cho tuần tiếp theo',
      tone: seriousWarnings > 0 ? 'warn' : latestPublishedSchedule ? 'good' : 'neutral',
      icon: <AlertTriangle size={16} />,
    },
    {
      label: 'Chi phí lương tuần tiếp',
      value: `${(latestScheduleCost / 1000000).toFixed(1)} tr`,
      note: seriousWarnings > 0 ? 'Nên rà soát trước khi chốt' : 'Dùng để so sánh với các phương án khác',
      tone: seriousWarnings > 0 ? 'warn' : 'neutral',
      icon: <Calculator size={16} />,
    },
    {
      label: 'Tình trạng điều hành',
      value: latestPublishedSchedule ? 'Đã có bản nháp' : 'Chưa khởi động',
      note: latestPublishedSchedule
        ? `Tuần ${latestPublishedSchedule.weekStart} - ${latestPublishedSchedule.weekEnd}`
        : 'Nên bắt đầu bằng tính nhanh hoặc tạo lịch tự động',
      tone: latestPublishedSchedule ? 'good' : 'neutral',
      icon: <Clock3 size={16} />,
    },
    {
      label: 'Độ tin cậy đề xuất',
      value: 'Mock + quy tắc nội bộ',
      note: 'Nên đối chiếu thêm doanh thu, đơn app và dữ liệu thực',
      tone: 'neutral',
      icon: <Sparkles size={16} />,
    },
  ]

  const workflowSteps = [
    {
      key: 'setup',
      title: '1. Thiết lập vận hành',
      description: 'Chốt định biên, giờ cao điểm, mùa vụ và ngưỡng chi phí.',
      action: () => onTabChange('settings'),
      active: activeTab === 'settings',
    },
    {
      key: 'staffing',
      title: '2. Hiểu nhu cầu nhân sự',
      description: 'Xem vì sao hệ thống đề xuất số người theo từng khung giờ.',
      action: () => onTabChange('settings'),
      active: activeTab === 'settings',
    },
    {
      key: 'schedule',
      title: '3. Tạo lịch tuần',
      description: 'Tạo lịch, soát cảnh báo và chốt áp dụng cho tuần tới.',
      action: () => onTabChange('schedule'),
      active: activeTab === 'schedule',
    },
    {
      key: 'review',
      title: '4. Nhìn lại và tối ưu',
      description: 'So chi phí, rủi ro và bài học để chỉnh cho lần sau.',
      action: () => onTabChange('retrospective'),
      active: activeTab === 'retrospective',
    },
  ]

  return (
    <section className="mb-6 space-y-4 animate-fade-in">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,#0f172a,#1e293b_55%,#334155)] p-5 text-white shadow-lg">
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100">
              Trung tâm staffing
            </div>
            <div className="space-y-2">
              <h2 className="max-w-3xl text-2xl font-bold md:text-3xl">
                Một màn hình để setup nhân sự, đọc cảnh báo và chốt lịch tuần.
              </h2>
              <p className="max-w-3xl text-sm text-slate-200 md:text-base">
                Ở đây mình gom các việc quản lý cần làm theo đúng thứ tự: thiết lập vận hành,
                hiểu nhu cầu nhân sự, tạo lịch tuần và nhìn lại chi phí trước khi áp dụng.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {staffingMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    <span className="rounded-full bg-white/10 p-1.5 text-slate-100">{metric.icon}</span>
                    {metric.label}
                  </div>
                  <div className="mt-3 text-lg font-bold text-white">{metric.value}</div>
                  <p className={`mt-1 text-xs ${
                    metric.tone === 'warn'
                      ? 'text-amber-200'
                      : metric.tone === 'good'
                        ? 'text-emerald-200'
                        : 'text-slate-300'
                  }`}>
                    {metric.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                  Lộ trình thao tác
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">Bắt đầu từ đâu?</h3>
              </div>
              <button
                type="button"
                onClick={() => router.push('/settings/staffing/calculator')}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                Mở máy tính nhanh
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {workflowSteps.map((step) => (
                <button
                  key={step.key}
                  type="button"
                  onClick={step.action}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    step.active
                      ? 'border-primary-300 bg-white/18 shadow-lg shadow-black/10'
                      : 'border-white/10 bg-black/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{step.title}</div>
                      <p className="mt-1 text-sm text-slate-300">{step.description}</p>
                    </div>
                    <span className={`mt-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                      step.active ? 'bg-white text-slate-900' : 'bg-white/10 text-slate-200'
                    }`}>
                      {step.active ? 'Đang mở' : 'Mở nhanh'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
