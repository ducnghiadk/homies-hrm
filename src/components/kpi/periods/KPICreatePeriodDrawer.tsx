'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, HelpCircle, Layers3, Users } from 'lucide-react'
import EditDrawer from '@/components/ui/EditDrawer'
import type { KPIPeriodRow } from './KPIPeriodTable'
import type { KpiActor, KpiSetVersion } from '@/lib/kpi/types'

export interface PeriodEmployeeOption {
  id: string
  label: string
  subtitle: string
}

interface KPICreatePeriodDrawerProps {
  isOpen: boolean
  mode: 'create' | 'detail'
  actor: KpiActor
  period?: KPIPeriodRow | null
  storeOptions: Array<{ id: string; label: string }>
  versionOptions: KpiSetVersion[]
  employeeOptions: PeriodEmployeeOption[]
  initialMonth: string
  isSaving?: boolean
  errorMessage?: string | null
  onClose: () => void
  onCreatePeriod: (payload: {
    month: string
    store_id: string
    version_id: string
    employee_ids: string[]
  }) => void
}

export default function KPICreatePeriodDrawer({
  isOpen,
  mode,
  actor,
  period,
  storeOptions,
  versionOptions,
  employeeOptions,
  initialMonth,
  isSaving = false,
  errorMessage,
  onClose,
  onCreatePeriod,
}: KPICreatePeriodDrawerProps) {
  const [month, setMonth] = useState(initialMonth)
  const [storeId, setStoreId] = useState(storeOptions[0]?.id ?? '')
  const [versionId, setVersionId] = useState(versionOptions[0]?.id ?? '')
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen || mode !== 'create') return

    const timer = window.setTimeout(() => {
      setMonth(initialMonth)
      setStoreId(storeOptions[0]?.id ?? '')
      setVersionId(versionOptions[0]?.id ?? '')
      setSelectedEmployeeIds(employeeOptions.map((employee) => employee.id))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [employeeOptions, initialMonth, isOpen, mode, storeOptions, versionOptions])

  const activeVersion = useMemo(
    () => versionOptions.find((version) => version.id === versionId),
    [versionId, versionOptions]
  )

  const selectedCount = selectedEmployeeIds.length

  const footerContent = mode === 'detail'
    ? (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          Dong
        </button>
      </div>
    ) : undefined

  return (
    <EditDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'detail' ? 'Chi tiet ky KPI' : 'Mo ky KPI moi'}
      size="lg"
      showFooter
      onSave={mode === 'create' ? () => onCreatePeriod({
        month,
        store_id: storeId,
        version_id: versionId,
        employee_ids: selectedEmployeeIds,
      }) : undefined}
      isSaving={isSaving}
      footerContent={footerContent}
    >
      {mode === 'detail' ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-[#F4F8FC] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#2F6FA8]">Ky dang chon</div>
                <h3 className="mt-1 text-lg font-bold text-[#001D3D]">
                  Thang {period?.month.slice(5)}/{period?.month.slice(0, 4)}
                </h3>
                <p className="mt-1 text-xs text-gray-500">{period?.store_name}</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2F6FA8]">
                {period?.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailCard label="Phien ban KPI" value={period?.version_name ?? '-'} />
            <DetailCard label="Nhan su trong ky" value={String(period?.employee_count ?? 0)} mono />
            <DetailCard label="Thieu du lieu" value={String(period?.missing_source_count ?? 0)} mono danger={(period?.missing_source_count ?? 0) > 0} />
            <DetailCard
              label="Tien do cham"
              value={`${period?.completed_reviews ?? 0}/${period?.total_reviews ?? 0}`}
              mono
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-2">
              <HelpCircle size={14} className="text-[#2F6FA8]" />
              <h4 className="text-sm font-bold text-[#001D3D]">Quyen thao tac</h4>
            </div>
            <div className="mt-3 space-y-2 text-xs text-gray-600">
              <p>Vai tro hien tai: <span className="font-bold text-gray-900">{actor.role}</span></p>
              <p>HR Admin/Area Manager chuan bi ky, CEO khoa va mo lai sau khi chot xong.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-2 text-[#2F6FA8]">
                <Layers3 size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-[#001D3D]">Mo ky theo phien ban da cong bo</div>
                <p className="mt-1 text-xs text-gray-600">Ky moi chi duoc tao khi phien ban KPI con hieu luc va chua bi trung thang/cua hang.</p>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldBlock label="Thang danh gia">
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-[#2F6FA8]"
              />
            </FieldBlock>

            <FieldBlock label="Cua hang">
              <select
                value={storeId}
                onChange={(event) => setStoreId(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#2F6FA8]"
              >
                {storeOptions.map((store) => (
                  <option key={store.id} value={store.id}>{store.label}</option>
                ))}
              </select>
            </FieldBlock>
          </div>

          <FieldBlock label="Phien ban KPI da cong bo">
            <select
              value={versionId}
              onChange={(event) => setVersionId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#2F6FA8]"
            >
              {versionOptions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name} • v{version.version}
                </option>
              ))}
            </select>
            {activeVersion ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                  Hieu luc {activeVersion.effective_from} - {activeVersion.effective_to ?? 'mo'}
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                  Ap dung {Array.isArray(activeVersion.store_ids) ? activeVersion.store_ids.length : 'tat ca'} cua hang
                </span>
              </div>
            ) : null}
          </FieldBlock>

          <FieldBlock
            label="Nhan su trong ky"
            helper={`Dang chon ${selectedCount}/${employeeOptions.length} nguoi`}
          >
            <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                <Users size={14} className="text-[#2F6FA8]" />
                <span>Danh sach nhan su duoc dua vao ky</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedEmployeeIds.length === employeeOptions.length) {
                    setSelectedEmployeeIds([])
                    return
                  }

                  setSelectedEmployeeIds(employeeOptions.map((employee) => employee.id))
                }}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50"
              >
                {selectedEmployeeIds.length === employeeOptions.length ? 'Bo chon tat ca' : 'Chon tat ca'}
              </button>
            </div>

            <div className="max-h-[280px] space-y-2 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-2">
              {employeeOptions.map((employee) => {
                const checked = selectedEmployeeIds.includes(employee.id)

                return (
                  <label
                    key={employee.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition ${checked ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedEmployeeIds((current) => (
                          current.includes(employee.id)
                            ? current.filter((id) => id !== employee.id)
                            : [...current, employee.id]
                        ))
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8]"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900">{employee.label}</div>
                      <div className="mt-1 text-[11px] text-gray-500">{employee.subtitle}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </FieldBlock>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 text-amber-700" />
              <p className="text-[11px] font-medium text-amber-800">
                Khi mo ky moi, he thong se chup lai phien ban KPI dang chon. Sau do sua draft se khong lam doi ky da mo.
              </p>
            </div>
          </div>
        </div>
      )}
    </EditDrawer>
  )
}

function FieldBlock({
  label,
  helper,
  children,
}: {
  label: string
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-gray-700">{label}</label>
        {helper ? <span className="text-[11px] font-medium text-gray-500">{helper}</span> : null}
      </div>
      {children}
    </div>
  )
}

function DetailCard({
  label,
  value,
  mono = false,
  danger = false,
}: {
  label: string
  value: string
  mono?: boolean
  danger?: boolean
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`mt-2 text-lg font-bold ${mono ? 'font-mono tabular-nums' : ''} ${danger ? 'text-rose-700' : 'text-[#001D3D]'}`}>
        {value}
      </div>
      <div className="mt-2">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${danger ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {danger ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
          {danger ? 'Can xu ly' : 'On dinh'}
        </span>
      </div>
    </div>
  )
}
