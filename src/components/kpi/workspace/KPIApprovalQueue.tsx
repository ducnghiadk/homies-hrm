'use client'

import { AlertTriangle, BadgeCheck, ChevronRight, FileWarning, ShieldAlert, Sparkles } from 'lucide-react'

export interface KPIApprovalQueueItem {
  evaluation_id: string
  employee_label: string
  total_score?: number
  status: string
  queue_group: 'clean' | 'large_adjustment' | 'missing_evidence' | 'serious_incident' | 'missing_source'
  notes: string[]
}

interface KPIApprovalQueueProps {
  items: KPIApprovalQueueItem[]
  onApproveCleanBatch: () => void
  onReturnEvaluation: (evaluationId: string) => void
}

export default function KPIApprovalQueue({
  items,
  onApproveCleanBatch,
  onReturnEvaluation,
}: KPIApprovalQueueProps) {
  const groups = {
    clean: items.filter((item) => item.queue_group === 'clean'),
    large_adjustment: items.filter((item) => item.queue_group === 'large_adjustment'),
    missing_evidence: items.filter((item) => item.queue_group === 'missing_evidence'),
    serious_incident: items.filter((item) => item.queue_group === 'serious_incident'),
    missing_source: items.filter((item) => item.queue_group === 'missing_source'),
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#2F6FA8]" />
              <h3 className="text-sm font-bold text-[#001D3D]">Hang doi CEO preapproval</h3>
            </div>
            <p className="mt-1 text-xs text-gray-500">Batch approve chi ap dung cho ho so sach. Ho so ngoai le can CEO xem tung dong.</p>
          </div>

          <button
            type="button"
            onClick={onApproveCleanBatch}
            disabled={groups.clean.length === 0}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BadgeCheck size={14} />
            <span>Duyet ho so sach ({groups.clean.length})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
        <QueueGroupCard
          title="Ho so sach"
          tone="emerald"
          icon={<BadgeCheck size={15} />}
          items={groups.clean}
          emptyLabel="Chua co ho so sach de batch approve"
        />
        <QueueGroupCard
          title="Dieu chinh lon"
          tone="amber"
          icon={<AlertTriangle size={15} />}
          items={groups.large_adjustment}
          emptyLabel="Khong co ho so sua diem manh"
          actionLabel="Tra lai leader"
          onAction={onReturnEvaluation}
        />
        <QueueGroupCard
          title="Thieu bang chung"
          tone="amber"
          icon={<FileWarning size={15} />}
          items={groups.missing_evidence}
          emptyLabel="Khong co ho so thieu bang chung"
          actionLabel="Tra lai leader"
          onAction={onReturnEvaluation}
        />
        <QueueGroupCard
          title="Vi pham nang"
          tone="rose"
          icon={<ShieldAlert size={15} />}
          items={groups.serious_incident}
          emptyLabel="Khong co vi pham nang can CEO canh"
          actionLabel="Tra lai leader"
          onAction={onReturnEvaluation}
        />
        <div className="xl:col-span-2">
          <QueueGroupCard
            title="Du lieu thieu"
            tone="rose"
            icon={<AlertTriangle size={15} />}
            items={groups.missing_source}
            emptyLabel="Khong co ho so thieu nguon du lieu"
            actionLabel="Tra lai leader"
            onAction={onReturnEvaluation}
          />
        </div>
      </div>
    </div>
  )
}

function QueueGroupCard({
  title,
  tone,
  icon,
  items,
  emptyLabel,
  actionLabel,
  onAction,
}: {
  title: string
  tone: 'emerald' | 'amber' | 'rose'
  icon: React.ReactNode
  items: KPIApprovalQueueItem[]
  emptyLabel: string
  actionLabel?: string
  onAction?: (evaluationId: string) => void
}) {
  const toneMap = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-800',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
  } as const

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`rounded-xl border p-2 ${toneMap[tone]}`}>{icon}</div>
          <div>
            <div className="text-xs font-bold text-[#001D3D]">{title}</div>
            <div className="text-[11px] text-gray-500">{items.length} ho so</div>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-3 py-5 text-center text-[11px] text-gray-500">
            {emptyLabel}
          </div>
        ) : (
          items.map((item) => (
            <div key={item.evaluation_id} className="rounded-2xl border border-gray-100 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-gray-900">{item.employee_label}</div>
                  <div className="mt-1 text-[11px] text-gray-500">Trang thai: {item.status}</div>
                </div>
                <div className="font-mono text-sm font-bold tabular-nums text-[#001D3D]">
                  {item.total_score ?? '--'}
                </div>
              </div>

              <div className="mt-2 space-y-1">
                {item.notes.map((note) => (
                  <div key={note} className="text-[11px] text-gray-600">
                    • {note}
                  </div>
                ))}
              </div>

              {actionLabel && onAction ? (
                <button
                  type="button"
                  onClick={() => onAction(item.evaluation_id)}
                  className="mt-3 inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50"
                >
                  <span>{actionLabel}</span>
                  <ChevronRight size={12} />
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
