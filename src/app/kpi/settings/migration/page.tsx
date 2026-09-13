'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileCheck2, Filter, ShieldBan } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { HOMIES_CAREER_GRADES } from '@/lib/kpi/career-grade-catalog'
import {
  buildCareerGradeMigrationPreview,
  type CareerGradeMigrationStatus,
  type LegacyEmployeeInput,
} from '@/lib/kpi/career-grade-migration-service'
import type { CareerGradeCode } from '@/lib/kpi/career-grade-types'
import { useAuthStore } from '@/store/auth-store'

const SAMPLE_EMPLOYEES: LegacyEmployeeInput[] = [
  { id: 'emp-001', name: 'Nguyễn Minh Anh', chuyen_mon: 'pha_che', position_name: 'Nhân viên cửa hàng' },
  { id: 'emp-002', name: 'Trần Gia Hân', chuyen_mon: 'thu_ngan', position_name: 'Nhân viên cửa hàng' },
  { id: 'emp-003', name: 'Lê Hoàng Nam', current_level_code: 'pt2', position_name: 'Nhân viên cửa hàng' },
  { id: 'emp-004', name: 'Phạm Mỹ Linh', position_name: 'Trưởng ca' },
  { id: 'emp-005', name: 'Võ Quốc Bảo', position_name: 'Nhân viên cửa hàng' },
]

const STATUS_LABELS: Record<CareerGradeMigrationStatus, string> = {
  auto_convertible: 'Đủ bằng chứng',
  needs_confirmation: 'Cần HR xác nhận',
  excluded: 'Tạm loại trừ',
}

const STATUS_STYLES: Record<CareerGradeMigrationStatus, string> = {
  auto_convertible: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  needs_confirmation: 'bg-amber-50 text-amber-700 ring-amber-200',
  excluded: 'bg-rose-50 text-rose-700 ring-rose-200',
}

type StatusFilter = 'all' | CareerGradeMigrationStatus

export default function KPIMigrationPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [employees] = useState<LegacyEmployeeInput[]>(SAMPLE_EMPLOYEES)
  const [decisions, setDecisions] = useState<Partial<Record<string, CareerGradeCode>>>({})
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  const preview = useMemo(
    () => buildCareerGradeMigrationPreview({
      employees,
      certifications: [],
      decisions: Object.entries(decisions).map(([employee_id, grade_code]) => ({
        id: `manual-${employee_id}`,
        employee_id,
        grade_code: grade_code!,
      })),
    }),
    [decisions, employees]
  )

  const visibleItems = useMemo(
    () => preview.items.filter((item) => statusFilter === 'all' || item.status === statusFilter),
    [preview.items, statusFilter]
  )

  if (!user || user.role === 'employee') return null

  function handleConfirmChecksum() {
    if (preview.summary.needs_confirmation > 0) {
      toast.warning(`Còn ${preview.summary.needs_confirmation} nhân viên cần HR xác nhận.`)
      return
    }
    toast.success(`Đã chốt checksum ${preview.checksum}. Đây vẫn là dry-run, chưa ghi dữ liệu thật.`)
  }

  return (
    <AppShell showNav className="min-h-screen w-full max-w-none bg-[#FFF8E8]">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#E7D9BA] bg-white px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#8A5A16]">Xếp cấp bậc nhân viên</p>
              <h1 className="mt-2 text-2xl font-bold text-[#001D3D] sm:text-3xl">Kiểm tra dữ liệu cũ trước khi áp dụng lộ trình Homies</h1>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                Hệ thống chỉ tự xếp khi có bằng chứng rõ ràng. Hồ sơ mơ hồ được giữ lại để HR chọn, không tự gán Pha chế hoặc tự tăng bậc.
              </p>
            </div>
            <Button type="button" onClick={handleConfirmChecksum}>
              <FileCheck2 className="mr-2 h-4 w-4" />
              Xác nhận bản xem trước
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="Đủ bằng chứng" value={preview.summary.auto_convertible} tone="emerald" />
          <SummaryCard icon={<AlertTriangle className="h-4 w-4" />} label="Cần HR xác nhận" value={preview.summary.needs_confirmation} tone="amber" />
          <SummaryCard icon={<ShieldBan className="h-4 w-4" />} label="Tạm loại trừ" value={preview.summary.excluded} tone="rose" />
          <SummaryCard icon={<FileCheck2 className="h-4 w-4" />} label="Checksum" value={preview.checksum} tone="sky" mono />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#E7D9BA] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#F2E7CF] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#001D3D]">Danh sách cần rà soát</h2>
              <p className="mt-1 text-xs text-[#6B7280]">Chọn cấp bậc cho hồ sơ mơ hồ; thay đổi sẽ tạo checksum mới.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-[#374151]">
              <Filter className="h-4 w-4 text-[#2F6FA8]" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-10 rounded-xl border border-[#E5D7B8] bg-white px-3 text-sm outline-none focus:border-[#2F6FA8]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="auto_convertible">Đủ bằng chứng</option>
                <option value="needs_confirmation">Cần HR xác nhận</option>
                <option value="excluded">Tạm loại trừ</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#F2E7CF] text-sm">
              <thead className="bg-[#FFFCF5] text-left text-xs font-bold uppercase tracking-[0.06em] text-[#8A5A16]">
                <tr>
                  <th className="px-5 py-3">Nhân viên</th>
                  <th className="px-5 py-3">Gợi ý</th>
                  <th className="px-5 py-3">Bằng chứng</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">HR xác nhận cấp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7EEDB]">
                {visibleItems.map((item) => (
                  <tr key={item.employee_id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#111827]">{item.employee_name}</p>
                      <p className="mt-1 font-mono text-xs text-[#6B7280]">{item.employee_id}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#001D3D]">
                      {labelForGrade(item.suggested_grade_code)}
                    </td>
                    <td className="max-w-[360px] px-5 py-4 text-xs leading-5 text-[#6B7280]">
                      {item.reason}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ${STATUS_STYLES[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {item.status === 'needs_confirmation' ? (
                        <select
                          aria-label={`Chọn cấp bậc cho ${item.employee_name}`}
                          value={decisions[item.employee_id] || ''}
                          onChange={(event) => setDecisions((current) => ({
                            ...current,
                            [item.employee_id]: event.target.value as CareerGradeCode,
                          }))}
                          className="h-10 min-w-[220px] rounded-xl border border-[#E5D7B8] bg-white px-3 text-sm outline-none focus:border-[#2F6FA8]"
                        >
                          <option value="">Chọn sau khi kiểm tra</option>
                          {HOMIES_CAREER_GRADES.map((grade) => (
                            <option key={grade.code} value={grade.code}>{grade.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700">Không cần chọn lại</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function labelForGrade(gradeCode: CareerGradeCode | null): string {
  return HOMIES_CAREER_GRADES.find((grade) => grade.code === gradeCode)?.label || 'Chưa xác định'
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
  mono = false,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  tone: 'emerald' | 'amber' | 'rose' | 'sky'
  mono?: boolean
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
  }
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em]">{icon}{label}</div>
      <p className={`mt-3 text-2xl font-bold text-[#001D3D] ${mono ? 'font-mono text-lg' : 'font-mono'}`}>{value}</p>
    </div>
  )
}
