'use client'

import { AlertTriangle, BadgeCheck, Clock3, Database, FileWarning } from 'lucide-react'
import type { KpiSourceDatum } from '@/lib/kpi/source-service'

interface KPISourcePanelProps {
  sources: KpiSourceDatum[]
}

export default function KPISourcePanel({ sources }: KPISourcePanelProps) {
  const totals = {
    ready: sources.filter((source) => source.status === 'ready' || source.status === 'confirmed').length,
    waiting: sources.filter((source) => source.status === 'proposed').length,
    missing: sources.filter((source) => source.status === 'missing').length,
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Database size={15} className="text-[#2F6FA8]" />
          <h3 className="text-sm font-bold text-[#001D3D]">Nguon du lieu tham chieu</h3>
        </div>
        <p className="mt-1 text-xs text-gray-500">Leader doi chieu diem goi y voi POS, cham cong va van hanh truoc khi chot.</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <SmallMetric label="Hop le" value={String(totals.ready)} tone="emerald" />
          <SmallMetric label="Cho xac nhan" value={String(totals.waiting)} tone="amber" />
          <SmallMetric label="Con thieu" value={String(totals.missing)} tone="rose" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Danh sach nguon</div>
        </div>

        <div className="divide-y divide-gray-100">
          {sources.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2F6FA8]">
                <Database size={18} />
              </div>
              <div className="mt-3 text-sm font-bold text-[#001D3D]">Chua co nguon doi chieu</div>
              <div className="mt-1 text-xs text-gray-500">Can mo ky va gom du lieu truoc khi chuyen sang buoc cham.</div>
            </div>
          ) : (
            sources.map((source) => (
              <div key={source.key} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-xs font-bold text-gray-900">{source.source_label}</div>
                      <SourceStatusBadge status={source.status} />
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">{source.key}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm font-bold tabular-nums text-[#001D3D]">
                      {source.value ?? '--'}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      {new Date(source.captured_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  {source.captured_by ? (
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                      Nguoi nhap: {source.captured_by}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                    Bang chung: {source.evidence_refs.length}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <FileWarning size={14} className="mt-0.5 text-amber-700" />
          <p className="text-[11px] font-medium text-amber-800">
            POS nhap tay o trang thai &quot;Cho xac nhan&quot; chi dung de doi chieu, khong nen sua diem manh tay khi chua co bang chung di kem.
          </p>
        </div>
      </div>
    </div>
  )
}

function SmallMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'emerald' | 'amber' | 'rose'
}) {
  const toneMap = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-800',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
  } as const

  return (
    <div className={`rounded-2xl border p-3 ${toneMap[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider">{label}</div>
      <div className="mt-1 font-mono text-lg font-bold tabular-nums">{value}</div>
    </div>
  )
}

function SourceStatusBadge({ status }: { status: KpiSourceDatum['status'] }) {
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        <BadgeCheck size={11} />
        Hop le
      </span>
    )
  }

  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        <BadgeCheck size={11} />
        Da xac nhan
      </span>
    )
  }

  if (status === 'proposed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
        <Clock3 size={11} />
        Cho xac nhan
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
      <AlertTriangle size={11} />
      Thieu
    </span>
  )
}
