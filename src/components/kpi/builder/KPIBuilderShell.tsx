'use client'

import { CheckCircle2, Database, FileStack, Layers3 } from 'lucide-react'

import { KPIBuilderSummary } from './KPIBuilderSummary'
import { KPISetList } from './KPISetList'
import type { KpiValidationIssue } from '@/lib/kpi/configuration-service'
import type { KpiSetVersion } from '@/lib/kpi/types'

export interface KPIBuilderShellProps {
  versions: KpiSetVersion[]
  selectedVersionId: string
  validationIssues: KpiValidationIssue[]
  onSelectVersion(id: string): void
  onCreateSet(): void
  onCloneVersion(): void
  onPublish(): void
}

export default function KPIBuilderShell({
  versions,
  selectedVersionId,
  validationIssues,
  onSelectVersion,
  onCreateSet,
  onCloneVersion,
  onPublish,
}: KPIBuilderShellProps) {
  const selectedVersion = versions.find((version) => version.id === selectedVersionId)

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-[#E7D9BA] bg-[#FFF9EC] px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8A5A16]">KPI Builder</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#111827]">Thiết lập phiên bản KPI theo kỳ áp dụng</h1>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              Quản lý nhóm tiêu chí, trọng số, phạm vi cửa hàng và trạng thái công bố theo mô hình KPI SaaS mới của Homies.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#E8D2A8] bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8A5A16]">
                <FileStack size={15} />
                Phiên bản
              </div>
              <p className="mt-3 text-2xl font-semibold text-[#111827]">{versions.length}</p>
            </div>
            <div className="rounded-lg border border-[#E8D2A8] bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8A5A16]">
                <Layers3 size={15} />
                Nhóm dùng
              </div>
              <p className="mt-3 text-2xl font-semibold text-[#111827]">{selectedVersion?.groups.length ?? 0}</p>
            </div>
            <div className="rounded-lg border border-[#E8D2A8] bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8A5A16]">
                <CheckCircle2 size={15} />
                Lỗi chặn
              </div>
              <p className="mt-3 text-2xl font-semibold text-[#111827]">{validationIssues.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <KPISetList
          versions={versions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={onSelectVersion}
          onCreateSet={onCreateSet}
          onCloneVersion={onCloneVersion}
        />

        <section className="rounded-lg border border-[#E7D9BA] bg-white">
          <div className="flex items-center justify-between border-b border-[#F2E7CF] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[#6B7280]">Cấu trúc bộ KPI</p>
              <h2 className="mt-1 text-lg font-semibold text-[#111827]">
                {selectedVersion ? selectedVersion.name : 'Chưa chọn phiên bản'}
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#FFF7E8] px-3 py-1.5 text-xs font-semibold text-[#8A5A16]">
              <Database size={14} />
              Snapshot-safe versioning
            </div>
          </div>

          {selectedVersion ? (
            <div className="space-y-4 px-5 py-5">
              {selectedVersion.groups.map((group) => (
                <section key={group.id} className="rounded-lg border border-[#EEE4D0] bg-[#FFFCF5] p-4">
                  <div className="flex flex-col gap-3 border-b border-[#EEE4D0] pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-[#111827]">{group.name}</h3>
                        {group.promotion_core ? (
                          <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Trọng yếu thăng tiến
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-[#6B7280]">Tag nghiệp vụ: {group.tag}</p>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-2 text-right ring-1 ring-[#EEE4D0]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A5A16]">Trọng số</p>
                      <p className="mt-1 text-lg font-semibold text-[#111827]">{group.weight}%</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {group.criteria.map((criterion) => (
                      <article key={criterion.id} className="rounded-lg bg-white px-4 py-4 ring-1 ring-[#EEE4D0]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-[#111827]">{criterion.name}</h4>
                            <p className="mt-2 text-sm leading-6 text-[#6B7280]">{criterion.description}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#FFF7E8] px-2.5 py-1 text-[11px] font-semibold text-[#8A5A16]">
                              {criterion.scoring_mode}
                            </span>
                            <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-[#4B5563]">
                              {criterion.weight}%
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg bg-[#FFFCF5] px-3 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A5A16]">Nguồn dữ liệu</p>
                            <p className="mt-2 text-sm text-[#111827]">{criterion.source_key ?? 'Leader nhập theo rubric'}</p>
                          </div>
                          <div className="rounded-lg bg-[#FFFCF5] px-3 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A5A16]">Ràng buộc</p>
                            <p className="mt-2 text-sm text-[#111827]">
                              {criterion.adjustment_reason_required ? 'Bắt buộc ghi lý do khi điều chỉnh' : 'Không bắt buộc ghi lý do'}
                            </p>
                            {criterion.evidence_required_below ? (
                              <p className="mt-1 text-sm text-[#6B7280]">Yêu cầu bằng chứng nếu dưới mức {criterion.evidence_required_below}</p>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center px-6 py-12 text-center">
              <div>
                <p className="text-base font-semibold text-[#111827]">Chưa chọn phiên bản</p>
                <p className="mt-2 text-sm text-[#6B7280]">Chọn một bộ KPI ở cột trái để xem cấu trúc nhóm và tiêu chí.</p>
              </div>
            </div>
          )}
        </section>

        <KPIBuilderSummary
          selectedVersion={selectedVersion}
          validationIssues={validationIssues}
          onCloneVersion={onCloneVersion}
          onPublish={onPublish}
        />
      </div>
    </section>
  )
}
