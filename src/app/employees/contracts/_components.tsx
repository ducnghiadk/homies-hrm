import type { ReactNode } from 'react'
import type { ContractPlaceholderStatus } from '@/lib/services/contract-template-placeholder'

const fmt = (value: number) => value.toLocaleString('vi-VN')

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-400">{hint}</span> : null}
    </label>
  )
}

export function StatChip({
  icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: ReactNode
  label: string
  value: number
  tone?: 'slate' | 'amber' | 'indigo' | 'emerald' | 'rose'
}) {
  const toneMap = {
    slate: 'border-slate-100 bg-slate-50 text-slate-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    indigo: 'border-indigo-100 bg-indigo-50 text-indigo-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
  }[tone]

  return (
    <div className={`inline-flex min-h-11 items-center gap-3 rounded-2xl border px-3.5 py-2 text-xs font-bold ${toneMap}`}>
      <span className="shrink-0">{icon}</span>
      <span className="flex items-center gap-1.5">
        <span className="text-slate-500">{label}</span>
        <span>{fmt(value)}</span>
      </span>
    </div>
  )
}

export function Tag({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'primary' | 'amber' | 'rose' }) {
  const toneMap = {
    slate: 'bg-slate-100 text-slate-600',
    primary: 'bg-primary-50 text-primary-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone]

  return <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-xs font-bold ${toneMap}`}>{children}</span>
}

export function ChecklistChip({
  label,
  value,
  tone = 'slate',
}: {
  label: string
  value: number
  tone?: 'slate' | 'amber' | 'emerald' | 'rose'
}) {
  const toneMap = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  }[tone]

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneMap}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-1 text-2xl font-black">{fmt(value)}</p>
    </div>
  )
}

export function FieldStatusTag({ status }: { status: ContractPlaceholderStatus }) {
  const statusMap = {
    hop_le: { label: 'Hop le', className: 'bg-emerald-50 text-emerald-700' },
    thieu_du_lieu: { label: 'Thieu du lieu', className: 'bg-amber-50 text-amber-700' },
    field_la: { label: 'Field la', className: 'bg-rose-50 text-rose-700' },
    trung_lap: { label: 'Trung lap', className: 'bg-slate-100 text-slate-700' },
  }[status]

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusMap.className}`}>{statusMap.label}</span>
}

export function FieldHighlight({ status, children }: { status: ContractPlaceholderStatus; children: ReactNode }) {
  const toneMap = {
    hop_le: 'bg-emerald-100 text-emerald-900',
    thieu_du_lieu: 'bg-amber-100 text-amber-900',
    field_la: 'bg-rose-100 text-rose-900',
    trung_lap: 'bg-slate-200 text-slate-900',
  }[status]

  return <mark className={`rounded px-1 ${toneMap}`}>{children}</mark>
}

export function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 border-b border-slate-100 pb-4">
        <h3 className="text-base font-black text-slate-900 md:text-lg">{title}</h3>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
