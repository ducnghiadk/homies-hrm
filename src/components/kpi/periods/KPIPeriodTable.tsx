'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpDown, CheckCircle2, Clock3, Search, ShieldAlert } from 'lucide-react'

export interface KPIPeriodRow {
  id: string
  store_id: string
  store_name: string
  month: string
  status: string
  version_name: string
  employee_count: number
  missing_source_count: number
  completed_reviews: number
  total_reviews: number
  appeal_count: number
}

interface KPIPeriodTableProps {
  rows: KPIPeriodRow[]
  selectedPeriodId?: string | null
  onSelectPeriod: (periodId: string) => void
}

type StatusFilter = 'all' | 'draft' | 'collecting' | 'leader_scoring' | 'ceo_preapproval' | 'published' | 'appeal_window' | 'locked'

export default function KPIPeriodTable({
  rows,
  selectedPeriodId,
  onSelectPeriod,
}: KPIPeriodTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<'month_desc' | 'store_name' | 'missing_desc'>('month_desc')

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        const matchSearch =
          row.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.version_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.month.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchSearch) return false
        if (statusFilter !== 'all' && row.status !== statusFilter) return false

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'store_name') return a.store_name.localeCompare(b.store_name)
        if (sortBy === 'missing_desc') return b.missing_source_count - a.missing_source_count
        return b.month.localeCompare(a.month)
      })
  }, [rows, searchTerm, statusFilter, sortBy])

  const totalEmployees = rows.reduce((sum, row) => sum + row.employee_count, 0)
  const totalMissing = rows.reduce((sum, row) => sum + row.missing_source_count, 0)
  const completedPeriods = rows.filter((row) => row.status === 'locked' || row.status === 'published').length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden w-full">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#001D3D]">Bang quan ly ky KPI</h2>
            <p className="text-xs text-gray-500 mt-1">Theo doi mo ky, tien do cham, du lieu thieu va vong khiếu nai.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tim cua hang, thang, phien ban"
                className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400 sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none"
            >
              <option value="all">Tat ca trang thai</option>
              <option value="draft">Ban nhap</option>
              <option value="collecting">Dang gom du lieu</option>
              <option value="leader_scoring">Leader cham</option>
              <option value="ceo_preapproval">CEO duyet so bo</option>
              <option value="published">Da cong bo</option>
              <option value="appeal_window">Dang khiếu nai</option>
              <option value="locked">Da khoa</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSortBy((current) => {
                  if (current === 'month_desc') return 'store_name'
                  if (current === 'store_name') return 'missing_desc'
                  return 'month_desc'
                })
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <ArrowUpDown size={14} className="text-[#2F6FA8]" />
              <span>
                {sortBy === 'month_desc' ? 'Moi nhat' : sortBy === 'store_name' ? 'Theo cua hang' : 'Thieu du lieu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2F6FA8]">
            <Clock3 size={22} />
          </div>
          <h3 className="mt-4 text-sm font-bold text-[#001D3D]">Chua co ky KPI phu hop</h3>
          <p className="mt-1 text-xs text-gray-500">Thu doi bo loc hoac mo ky moi cho thang can quan ly.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/90 text-gray-600 font-bold border-b border-gray-100">
                <th className="px-4 py-3 text-[#001D3D]">Ky KPI</th>
                <th className="px-3 py-3 text-[#001D3D]">Cua hang</th>
                <th className="px-3 py-3 text-center">Nhan su</th>
                <th className="px-3 py-3 text-center">Thieu du lieu</th>
                <th className="px-3 py-3 text-center">Tien do cham</th>
                <th className="px-3 py-3 text-center">Khieu nai</th>
                <th className="px-4 py-3 text-center">Trang thai</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredRows.map((row) => {
                const progressLabel = `${row.completed_reviews}/${row.total_reviews || row.employee_count}`
                const progressPct = row.total_reviews > 0
                  ? Math.round((row.completed_reviews / row.total_reviews) * 100)
                  : 0
                const selected = row.id === selectedPeriodId
                const statusMeta = getStatusMeta(row.status)

                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectPeriod(row.id)}
                    className={`cursor-pointer transition hover:bg-blue-50/40 ${selected ? 'bg-blue-50/60' : ''}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900">
                          Thang {row.month.slice(5)}/{row.month.slice(0, 4)}
                        </div>
                        <div className="text-[11px] text-gray-500">{row.version_name}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 font-semibold text-gray-700">{row.store_name}</td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="font-mono tabular-nums font-bold text-[#001D3D]">{row.employee_count}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${row.missing_source_count > 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {row.missing_source_count > 0 ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        {row.missing_source_count}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="mx-auto flex max-w-[140px] items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-[#2F6FA8]"
                            style={{ width: `${Math.max(progressPct, row.total_reviews > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums font-bold text-gray-700">{progressLabel}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="font-mono tabular-nums font-bold text-gray-700">{row.appeal_count}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusMeta.className}`}>
                        {statusMeta.icon}
                        {statusMeta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-3 text-[11px] font-medium text-gray-500">
        Doi ngu: <span className="font-mono tabular-nums font-bold text-[#001D3D]">{totalEmployees}</span>
        {' '}nguoi • Da hoan tat: <span className="font-mono tabular-nums font-bold text-[#001D3D]">{completedPeriods}</span>
        {' '}ky • Thieu du lieu: <span className="font-mono tabular-nums font-bold text-rose-700">{totalMissing}</span>
      </div>
    </div>
  )
}

function getStatusMeta(status: string) {
  switch (status) {
    case 'collecting':
      return {
        label: 'Dang gom',
        className: 'border-blue-200 bg-blue-50 text-[#2F6FA8]',
        icon: <Clock3 size={12} />,
      }
    case 'leader_scoring':
      return {
        label: 'Leader cham',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
        icon: <ShieldAlert size={12} />,
      }
    case 'ceo_preapproval':
      return {
        label: 'CEO so bo',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
        icon: <AlertTriangle size={12} />,
      }
    case 'published':
      return {
        label: 'Da cong bo',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: <CheckCircle2 size={12} />,
      }
    case 'appeal_window':
      return {
        label: 'Khieu nai',
        className: 'border-violet-200 bg-violet-50 text-violet-700',
        icon: <Clock3 size={12} />,
      }
    case 'locked':
      return {
        label: 'Da khoa',
        className: 'border-gray-200 bg-gray-100 text-gray-700',
        icon: <CheckCircle2 size={12} />,
      }
    default:
      return {
        label: 'Ban nhap',
        className: 'border-gray-200 bg-gray-100 text-gray-700',
        icon: <Clock3 size={12} />,
      }
  }
}
