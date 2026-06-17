'use client'

import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { OnboardingOperationsService } from '@/lib/services/onboarding-operations-service'
import { useAuthStore } from '@/store/auth-store'

const taskCardTone: Record<string, string> = {
  'Có lỗi cấu hình': 'border-[#D9381E]/20 bg-[#FFF7F5]',
  'Cần rà soát': 'border-[#F0C96A]/30 bg-[#FFFBEF]',
  'Ổn định': 'border-[#1E9E57]/20 bg-[#F6FFF9]',
}

export default function OnboardingOverviewPage() {
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)

  if (!hasHydrated) {
    return (
      <AppShell navMode="full">
        <div className="rounded-[28px] border border-[rgba(0,29,61,0.08)] bg-white p-6 text-sm font-semibold text-[#001D3D] shadow-sm">
          Đang tải tổng quan thử việc...
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell navMode="full">
        <div className="rounded-[28px] border border-[rgba(0,29,61,0.08)] bg-white p-6 text-sm text-[#5F6B7A] shadow-sm">
          Cần đăng nhập để xem tổng quan thử việc.
        </div>
      </AppShell>
    )
  }

  const overview = OnboardingOperationsService.getWorkspaceOverview(user, 'all')
  const taskCards = [
    {
      title: 'Bảng nhân sự thử việc',
      value: overview.allRows.length,
      detail: 'Quét toàn bộ nhân sự mới và mở đúng hồ sơ cần xử lý tiếp.',
      href: '/career-path/onboarding?filter=all',
      cta: 'Mở theo dõi thử việc',
    },
    {
      title: 'Cần xử lý ngay',
      value: overview.allRows.filter((row) => row.statusKey === 'urgent').length,
      detail: 'Ưu tiên các trường hợp đang thiếu bước nền tảng hoặc chậm mốc quan trọng.',
      href: '/career-path/onboarding?filter=urgent',
      cta: 'Mở danh sách cần xử lý ngay',
    },
    {
      title: 'Nhân sự chưa khớp nhóm áp dụng',
      value: overview.configSummary.unmatchedEmployeeCount,
      detail: 'Các nhân sự này cần rà lại chức danh và nhóm áp dụng trước khi giao quy trình thử việc.',
      href: '/career-path/onboarding/setup',
      cta: 'Mở thiết lập quy trình thử việc',
    },
    {
      title: 'Quy trình còn thiếu bước sẵn sàng',
      value: overview.configSummary.missingTemplateCount + overview.configSummary.duplicateMappingCount,
      detail: `${overview.configSummary.missingTemplateCount} nhóm thiếu danh sách việc • ${overview.configSummary.duplicateMappingCount} mapping xung đột`,
      href: '/career-path/onboarding/setup',
      cta: 'Rà lại trước khi dùng',
    },
  ]

  return (
    <AppShell navMode="full">
      <div className="space-y-5">
        <section className="rounded-[32px] border border-[rgba(0,29,61,0.08)] bg-[linear-gradient(135deg,#FFF8E8_0%,#FFFFFF_100%)] p-6 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A6B53]">Nhân sự mới</div>
          <h1 className="mt-2 text-[28px] font-extrabold text-[#001D3D]">Tổng quan thử việc</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5F6B7A]">
            Theo dõi nhân sự mới, lỗi cấu hình, và các việc cần xử lý ngay trước ngày vào làm.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/career-path/onboarding?filter=all" className="rounded-full bg-[#2F6FA8] px-4 py-2 text-sm font-semibold text-white no-underline">
              Mở theo dõi thử việc
            </Link>
            <Link href="/career-path/onboarding/setup" className="rounded-full border border-[rgba(47,111,168,0.18)] bg-white px-4 py-2 text-sm font-semibold text-[#2F6FA8] no-underline">
              Mở thiết lập quy trình thử việc
            </Link>
          </div>
        </section>

        <section className={`rounded-[28px] border p-5 shadow-sm ${taskCardTone[overview.systemStatus.label] ?? 'border-[rgba(0,29,61,0.08)] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7A6B53]">Trạng thái hệ thống</div>
          <div className="mt-2 text-[26px] font-extrabold text-[#001D3D]">{overview.systemStatus.label}</div>
          <div className="mt-2 text-sm leading-6 text-[#5F6B7A]">{overview.systemStatus.reason}</div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {taskCards.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-[24px] border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-sm no-underline">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7A6B53]">{item.title}</div>
              <div className="mt-3 text-[32px] font-extrabold text-[#001D3D]">{item.value}</div>
              <div className="mt-3 text-sm leading-6 text-[#5F6B7A]">{item.detail}</div>
              <div className="mt-4 text-sm font-semibold text-[#2F6FA8]">{item.cta}</div>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  )
}