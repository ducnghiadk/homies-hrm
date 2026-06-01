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
          Đang tải tổng quan onboarding...
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell navMode="full">
        <div className="rounded-[28px] border border-[rgba(0,29,61,0.08)] bg-white p-6 text-sm text-[#5F6B7A] shadow-sm">
          Cần đăng nhập để xem tổng quan onboarding.
        </div>
      </AppShell>
    )
  }

  const overview = OnboardingOperationsService.getWorkspaceOverview(user, 'all')
  const upcomingCount = overview.stats.find((item) => item.key === 'upcoming')?.value ?? 0
  const taskCards = [
    {
      title: 'Nhân sự sắp vào làm',
      value: upcomingCount,
      detail: 'Danh sách nhân sự mới đang đi vào vùng nhìn trước.',
      href: '/career-path/onboarding?filter=all',
      cta: 'Mở vận hành onboarding',
    },
    {
      title: 'Block ngày đầu / cần follow-up',
      value: overview.allRows.filter((row) => row.priorityKey !== 'ready').length,
      detail: 'Ưu tiên case block ngày đầu trước, rồi theo dõi các case cần follow-up.',
      href: '/career-path/onboarding?filter=block_day_one',
      cta: 'Xử lý ngay',
    },
    {
      title: 'Nhân viên chưa khớp role',
      value: overview.configSummary.unmatchedEmployeeCount,
      detail: 'Các nhân sự này cần HR/CEO rà lại role onboarding trước khi tạo checklist.',
      href: '/career-path/settings#exceptions',
      cta: 'Xử lý unmatched',
    },
    {
      title: 'Cấu hình role và template',
      value: overview.configSummary.enabledRoleCount,
      detail: `${overview.configSummary.missingTemplateCount} role thiếu template • ${overview.configSummary.duplicateMappingCount} mapping xung đột`,
      href: '/career-path/settings#roles',
      cta: 'Rà soát role và template',
    },
  ]

  return (
    <AppShell navMode="full">
      <div className="space-y-5">
        <section className="rounded-[32px] border border-[rgba(0,29,61,0.08)] bg-[linear-gradient(135deg,#FFF8E8_0%,#FFFFFF_100%)] p-6 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A6B53]">Nhân sự mới</div>
          <h1 className="mt-2 text-[28px] font-extrabold text-[#001D3D]">Tổng quan onboarding</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5F6B7A]">
            Theo dõi nhân sự mới, lỗi cấu hình, và các việc cần xử lý ngay trước ngày vào làm.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/career-path/onboarding?filter=all"
              className="rounded-full bg-[#2F6FA8] px-4 py-2 text-sm font-semibold text-white no-underline"
            >
              Mở vận hành onboarding
            </Link>
            <Link
              href="/career-path/settings#exceptions"
              className="rounded-full border border-[rgba(47,111,168,0.18)] bg-white px-4 py-2 text-sm font-semibold text-[#2F6FA8] no-underline"
            >
              Mở cấu hình onboarding
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
            <Link
              key={item.title}
              href={item.href}
              className="rounded-[24px] border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-sm no-underline"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7A6B53]">{item.title}</div>
              <div className="mt-3 text-[32px] font-extrabold text-[#001D3D]">{item.value}</div>
              <div className="mt-3 text-sm leading-6 text-[#5F6B7A]">{item.detail}</div>
              <div className="mt-4 text-sm font-semibold text-[#2F6FA8]">{item.cta}</div>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-sm">
            <div className="text-lg font-bold text-[#001D3D]">Ưu tiên xử lý ngay</div>
            <div className="mt-4 space-y-3">
              {overview.urgentItems.map((item) => {
                const href = item.kind === 'employee'
                  ? `/career-path/onboarding?filter=${item.priorityKey}`
                  : '/career-path/settings#exceptions'

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="block rounded-[20px] border border-[rgba(0,29,61,0.08)] bg-[#FFFDF9] px-4 py-3 no-underline"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-[#001D3D]">{item.label}</div>
                        <div className="mt-1 text-xs text-[#5F6B7A]">{item.detail}</div>
                      </div>
                      <div className="rounded-full bg-[rgba(47,111,168,0.10)] px-3 py-1 text-[11px] font-semibold text-[#2F6FA8]">
                        {item.ctaLabel}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgba(0,29,61,0.08)] bg-white p-5 shadow-sm">
            <div className="text-lg font-bold text-[#001D3D]">Vào màn nào khi nào?</div>
            <div className="mt-4 space-y-4 text-sm leading-6 text-[#5F6B7A]">
              <div>
                <div className="font-semibold text-[#001D3D]">Tổng quan onboarding</div>
                <div>Xem toàn cảnh, mức ưu tiên, và CTA sang đúng tác vụ.</div>
              </div>
              <div>
                <div className="font-semibold text-[#001D3D]">Vận hành onboarding</div>
                <div>Gán buddy, chốt ca đầu, theo dõi follow-up từng nhân sự mới.</div>
              </div>
              <div>
                <div className="font-semibold text-[#001D3D]">Cấu hình onboarding</div>
                <div>Rà soát ngoại lệ, map role onboarding, và gắn template checklist.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
