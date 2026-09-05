'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, ChevronRight, Clock3, MessageSquare, ShieldAlert } from 'lucide-react'
import type { KpiIncident } from '@/lib/kpi/types'

export interface KPIIncidentRow {
  incident: KpiIncident
  storeLabel: string
  employeeLabel: string
  primaryViolationLabel: string
  impactLabel: string
  severity: 'normal' | 'serious'
}

interface KPIIncidentTableProps {
  rows: KPIIncidentRow[]
  onSelect: (incident: KpiIncident) => void
}

export default function KPIIncidentTable({ rows, onSelect }: KPIIncidentTableProps) {
  const pendingConfirmation = rows.filter((row) => row.incident.status === 'proposed').length
  const appealedCount = rows.filter((row) => row.incident.status === 'appealed').length
  const severeCount = rows.filter((row) => row.severity === 'serious').length

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Su co</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Nhan su / cua hang</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Loi goc</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Tac dong</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Trang thai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                  Chua co ho so su co nao trong bo loc hien tai.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.incident.id}
                  className="cursor-pointer transition hover:bg-blue-50/40"
                  onClick={() => onSelect(row.incident)}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="text-sm font-bold text-[#001D3D]">{row.incident.id}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock3 size={12} />
                      <span>{new Date(row.incident.occurred_at).toLocaleString('vi-VN')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-sm font-bold text-gray-900">{row.employeeLabel}</div>
                    <div className="mt-1 text-xs text-gray-500">{row.storeLabel}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-sm font-bold text-gray-900">{row.primaryViolationLabel}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {row.incident.violations.length > 1 ? `${row.incident.violations.length - 1} loi phu doc lap` : 'Khong co loi phu'}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      row.severity === 'serious'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {row.impactLabel}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge status={row.incident.status} />
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-gray-50 px-4 py-4 md:grid-cols-4">
        <FooterMetric icon={<ShieldAlert size={14} className="text-[#2F6FA8]" />} label="Tong ho so" value={String(rows.length)} />
        <FooterMetric icon={<Clock3 size={14} className="text-amber-700" />} label="Cho xac nhan" value={String(pendingConfirmation)} />
        <FooterMetric icon={<MessageSquare size={14} className="text-purple-700" />} label="Dang khieu nai" value={String(appealedCount)} />
        <FooterMetric icon={<AlertTriangle size={14} className="text-rose-700" />} label="Loi nang / liet" value={String(severeCount)} />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: KpiIncident['status'] }) {
  const map: Record<KpiIncident['status'], string> = {
    proposed: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-blue-100 text-[#2F6FA8]',
    acknowledged: 'bg-emerald-100 text-emerald-700',
    appealed: 'bg-purple-100 text-purple-700',
    finalized: 'bg-gray-200 text-gray-700',
    cancelled: 'bg-rose-100 text-rose-700',
  }

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${map[status]}`}>
      {status}
    </span>
  )
}

function FooterMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-3 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-lg font-bold text-[#001D3D]">{value}</div>
    </div>
  )
}
