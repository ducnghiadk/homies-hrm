'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, XCircle } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import { calculatePayrollBatchAsync } from '@/lib/payroll-engine'

type Status = 'dat' | 'lech' | 'chu_y'

type ChamCongRow = {
  id: string
  nhan_vien_id: string
  ngay: string
  thoi_gian_check_in: string | null
  thoi_gian_check_out: string | null
  so_gio_thuc_te: number | string | null
  so_gio_tang_ca: number | string | null
  trang_thai: string | null
  phut_di_muon: number | string | null
  phut_ve_som: number | string | null
  cua_hang_id: string | null
  lich_phan_ca_id: string | null
  ghi_chu: string | null
}

type NhanVienRow = {
  id: string
  ho_ten: string | null
  ma_nhan_vien: string | null
  trang_thai: string | null
  auth_id: string | null
}

type StoreRow = {
  id: string
  ten: string | null
  vi_do: number | string | null
  kinh_do: number | string | null
  ban_kinh_met: number | string | null
}

type HourDiffRow = {
  employeeId: string
  name: string
  sourceHours: number
  appHours: number
  diff: number
  isMismatch: boolean
}

type ChecksState = {
  loading: boolean
  error: string | null
  periodStart: string
  periodEnd: string
  hourRows: HourDiffRow[]
  sourceTotal: number
  appTotal: number
  missingPayrollEmployees: string[]
  payrollEmployeeCount: number
  pendingCount: number
  pendingHours: number
  openInPeriodCount: number
  activeEmployees: number
  activeEmployeesWithAuth: number
  employeesWithFutureShifts: number
  openAttendanceCount: number
  storesMissingLocation: StoreRow[]
}

const CHECKABLE_STATUSES = new Set(['dung_gio', 'di_muon', 've_som'])
const ACTIVE_EMPLOYEE_STATUSES = new Set(['hoat_dong', 'thu_viec'])

function toNumber(value: number | string | null | undefined): number {
  if (value == null || value === '') return 0
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100
}

function getPreviousMonthValue() {
  const now = new Date()
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`
}

function getMonthRange(monthValue: string) {
  const [yearText, monthText] = monthValue.split('-')
  const year = Number(yearText)
  const monthNumber = Number(monthText)
  const safeYear = Number.isFinite(year) ? year : new Date().getFullYear()
  const safeMonth = Number.isFinite(monthNumber) && monthNumber >= 1 && monthNumber <= 12 ? monthNumber : new Date().getMonth() + 1
  const start = `${safeYear}-${String(safeMonth).padStart(2, '0')}-01`
  const lastDay = new Date(safeYear, safeMonth, 0).getDate()
  const end = `${safeYear}-${String(safeMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

function getToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

async function readTable<T>(query: PromiseLike<{ data: T[] | null; error: { message?: string } | null }>, label: string): Promise<T[]> {
  const { data, error } = await query
  if (error) throw new Error(`${label}: ${error.message || 'không đọc được dữ liệu'}`)
  return data || []
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'dat') return <CheckCircle2 className="h-6 w-6" />
  if (status === 'lech') return <XCircle className="h-6 w-6" />
  return <AlertTriangle className="h-6 w-6" />
}

function CheckCard({
  title,
  status,
  description,
  children,
}: {
  title: string
  status: Status
  description: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const styles = {
    dat: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    lech: 'border-red-200 bg-red-50 text-red-800',
    chu_y: 'border-amber-200 bg-amber-50 text-amber-800',
  }[status]
  const labels = {
    dat: 'ĐẠT',
    lech: 'LỆCH',
    chu_y: 'CẦN CHÚ Ý',
  }[status]

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${styles}`}>
            <StatusIcon status={status} />
            {labels}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Chi tiết
        </button>
      </div>
      {open && <div className="border-t border-slate-200 p-5">{children}</div>}
    </section>
  )
}

export default function KiemTraPage() {
  const [selectedMonth, setSelectedMonth] = useState(getPreviousMonthValue)
  const { start, end } = useMemo(() => getMonthRange(selectedMonth), [selectedMonth])
  const [state, setState] = useState<ChecksState>({
    loading: true,
    error: null,
    periodStart: start,
    periodEnd: end,
    hourRows: [],
    sourceTotal: 0,
    appTotal: 0,
    missingPayrollEmployees: [],
    payrollEmployeeCount: 0,
    pendingCount: 0,
    pendingHours: 0,
    openInPeriodCount: 0,
    activeEmployees: 0,
    activeEmployeesWithAuth: 0,
    employeesWithFutureShifts: 0,
    openAttendanceCount: 0,
    storesMissingLocation: [],
  })

  const runChecks = useCallback(async () => {
    setState(previous => ({ ...previous, loading: true, error: null }))

    try {
      const today = getToday()
      const [attendanceRows, employeeRows, futureShiftRows, openAttendanceRows, storeRows, payrollRows] = await Promise.all([
        readTable<ChamCongRow>(
          supabase
            .from('cham_cong')
            .select('id, nhan_vien_id, ngay, thoi_gian_check_in, thoi_gian_check_out, so_gio_thuc_te, so_gio_tang_ca, trang_thai, phut_di_muon, phut_ve_som, cua_hang_id, lich_phan_ca_id, ghi_chu')
            .gte('ngay', start)
            .lte('ngay', end),
          'Bảng chấm công tháng này',
        ),
        readTable<NhanVienRow>(
          supabase
            .from('nhan_vien')
            .select('id, ho_ten, ma_nhan_vien, trang_thai, auth_id'),
          'Danh sách nhân viên',
        ),
        readTable<{ nhan_vien_id: string | null }>(
          supabase
            .from('lich_phan_ca')
            .select('nhan_vien_id')
            .gte('ngay', today),
          'Lịch phân ca sắp tới',
        ),
        readTable<Pick<ChamCongRow, 'id'>>(
          supabase
            .from('cham_cong')
            .select('id')
            .is('thoi_gian_check_out', null),
          'Ca chưa check-out',
        ),
        readTable<StoreRow>(
          supabase
            .from('cua_hang')
            .select('id, ten, vi_do, kinh_do, ban_kinh_met'),
          'Danh sách cửa hàng',
        ),
        calculatePayrollBatchAsync(start, end),
      ])

      const employeeNames = new Map<string, string>()
      employeeRows.forEach(employee => {
        const id = employee.id.trim()
        const name = [employee.ma_nhan_vien, employee.ho_ten].filter(Boolean).join(' - ')
        employeeNames.set(id, name || id)
      })

      const sourceHours = new Map<string, number>()
      let pendingCount = 0
      let pendingHours = 0
      let openInPeriodCount = 0

      attendanceRows.forEach(record => {
        const employeeId = record.nhan_vien_id.trim()
        const hours = toNumber(record.so_gio_thuc_te)
        const hasCheckOut = Boolean(record.thoi_gian_check_out)

        if (record.trang_thai === 'cho_duyet') {
          pendingCount += 1
          pendingHours += hours
        }

        if (!hasCheckOut) openInPeriodCount += 1

        if (CHECKABLE_STATUSES.has(record.trang_thai || '') && hasCheckOut) {
          sourceHours.set(employeeId, (sourceHours.get(employeeId) || 0) + hours)
        }
      })

      const appHours = new Map<string, number>()
      payrollRows.forEach(row => {
        const employeeId = row.employee_id.trim()
        const payrollName = [row.employee_code, row.employee_name].filter(Boolean).join(' - ')
        appHours.set(employeeId, toNumber(row.total_hours))
        if (!employeeNames.has(employeeId)) {
          employeeNames.set(employeeId, payrollName || employeeId)
        }
      })

      const activeEmployees = employeeRows.filter(employee => ACTIVE_EMPLOYEE_STATUSES.has(employee.trang_thai || ''))
      const activeEmployeeIds = activeEmployees.map(employee => employee.id.trim())
      const missingPayrollEmployees = activeEmployeeIds
        .filter(employeeId => !appHours.has(employeeId))
        .map(employeeId => employeeNames.get(employeeId) || employeeId)
        .sort((left, right) => left.localeCompare(right, 'vi'))

      const allEmployeeIds = Array.from(new Set([...activeEmployeeIds, ...sourceHours.keys(), ...appHours.keys()])).sort((left, right) => {
        return (employeeNames.get(left) || left).localeCompare(employeeNames.get(right) || right, 'vi')
      })

      const hourRows = allEmployeeIds.map(employeeId => {
        const source = roundHours(sourceHours.get(employeeId) || 0)
        const app = roundHours(appHours.get(employeeId) || 0)
        const diff = roundHours(app - source)
        return {
          employeeId,
          name: employeeNames.get(employeeId) || employeeId,
          sourceHours: source,
          appHours: app,
          diff,
          isMismatch: Math.abs(diff) > 0.01,
        }
      })

      const employeesWithFutureShifts = new Set(
        futureShiftRows
          .map(row => row.nhan_vien_id ? row.nhan_vien_id.trim() : '')
          .filter(Boolean),
      ).size

      const storesMissingLocation = storeRows.filter(store =>
        store.vi_do == null ||
        store.kinh_do == null ||
        store.ban_kinh_met == null ||
        toNumber(store.ban_kinh_met) <= 0,
      )

      setState({
        loading: false,
        error: null,
        periodStart: start,
        periodEnd: end,
        hourRows,
        sourceTotal: roundHours(Array.from(sourceHours.values()).reduce((sum, hours) => sum + hours, 0)),
        appTotal: roundHours(Array.from(appHours.values()).reduce((sum, hours) => sum + hours, 0)),
        missingPayrollEmployees,
        payrollEmployeeCount: appHours.size,
        pendingCount,
        pendingHours: roundHours(pendingHours),
        openInPeriodCount,
        activeEmployees: activeEmployees.length,
        activeEmployeesWithAuth: activeEmployees.filter(employee => Boolean(employee.auth_id)).length,
        employeesWithFutureShifts,
        openAttendanceCount: openAttendanceRows.length,
        storesMissingLocation,
      })
    } catch (error) {
      setState(previous => ({
        ...previous,
        loading: false,
        error: error instanceof Error ? error.message : 'Không chạy được trang tự kiểm tra',
      }))
    }
  }, [end, start])

  useEffect(() => {
    void runChecks()
  }, [runChecks])

  const hourStatus: Status = useMemo(() => {
    if (state.error) return 'lech'
    return state.hourRows.some(row => row.isMismatch) ? 'lech' : 'dat'
  }, [state.error, state.hourRows])

  const pendingStatus: Status = useMemo(() => {
    if (state.error) return 'lech'
    const appMatchesSource = Math.abs(state.appTotal - state.sourceTotal) <= 0.01
    if (!appMatchesSource) return 'lech'
    return state.pendingCount > 0 ? 'chu_y' : 'dat'
  }, [state.appTotal, state.error, state.pendingCount, state.sourceTotal])

  const healthStatus: Status = useMemo(() => {
    if (state.error) return 'lech'
    if (
      state.activeEmployeesWithAuth < state.activeEmployees ||
      state.openAttendanceCount > 0 ||
      state.storesMissingLocation.length > 0
    ) {
      return 'chu_y'
    }
    return 'dat'
  }, [state.activeEmployees, state.activeEmployeesWithAuth, state.error, state.openAttendanceCount, state.storesMissingLocation.length])

  const mismatches = state.hourRows.filter(row => row.isMismatch)
  const totalDiff = roundHours(state.appTotal - state.sourceTotal)
  const showPayrollCoverageWarning = !state.error && state.payrollEmployeeCount < state.activeEmployees

  return (
    <AppShell title="Tự kiểm tra dữ liệu">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Tự kiểm tra payroll và chấm công</h1>
            <p className="mt-2 text-sm text-slate-600">
              Kỳ đang kiểm tra: {state.periodStart} đến {state.periodEnd}. Trang này chỉ đọc dữ liệu và không ghi gì vào hệ thống.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="text-sm font-medium text-slate-700">
              Tháng kiểm tra
              <input
                type="month"
                value={selectedMonth}
                onChange={event => setSelectedMonth(event.target.value)}
                className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <Link
              href="/payroll"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Về bảng lương
            </Link>
            <button
              type="button"
              onClick={runChecks}
              disabled={state.loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
              {state.loading ? 'Đang kiểm tra' : 'Chạy lại'}
            </button>
          </div>
        </div>

        {state.error && (
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
            <div className="flex items-center gap-2 font-bold">
              <XCircle className="h-5 w-5" />
              LỆCH
            </div>
            <p className="mt-2 text-sm">Trang tự kiểm tra chưa đọc được dữ liệu: {state.error}</p>
          </section>
        )}

        {!state.error && state.loading && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Đang đọc dữ liệu thật và tính lại lương, vui lòng chờ một chút.
          </section>
        )}

        {showPayrollCoverageWarning && (
          <CheckCard
            title="Cảnh báo: Bảng lương thiếu nhân viên"
            status="chu_y"
            description={`Bảng lương chỉ có ${state.payrollEmployeeCount} người trong khi có ${state.activeEmployees} nhân viên hoạt động.`}
          >
            <div className="text-sm text-slate-700">
              <p>Những người sau chưa có trong kết quả bảng lương của app:</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {state.missingPayrollEmployees.map(employee => (
                  <li key={employee} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                    {employee}
                  </li>
                ))}
              </ul>
            </div>
          </CheckCard>
        )}

        <CheckCard
          title="Phép kiểm 1: Giờ công theo tháng đã chọn"
          status={hourStatus}
          description={
            hourStatus === 'dat'
              ? 'Tổng giờ trong app đang khớp với dữ liệu chấm công thật đã check-out và đã hợp lệ.'
              : 'Có nhân viên bị lệch giờ giữa dữ liệu gốc và số app đang dùng để tính lương.'
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Nhân viên</th>
                  <th className="py-2 pr-4 font-semibold">Số gốc</th>
                  <th className="py-2 pr-4 font-semibold">Số app</th>
                  <th className="py-2 pr-4 font-semibold">Chênh lệch</th>
                  <th className="py-2 font-semibold">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.hourRows.map(row => (
                  <tr key={row.employeeId}>
                    <td className="py-2 pr-4 text-slate-900">{row.name}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.sourceHours.toFixed(2)} giờ</td>
                    <td className="py-2 pr-4 text-slate-700">{row.appHours.toFixed(2)} giờ</td>
                    <td className={row.isMismatch ? 'py-2 pr-4 font-semibold text-red-700' : 'py-2 pr-4 text-slate-700'}>
                      {row.diff.toFixed(2)} giờ
                    </td>
                    <td className={row.isMismatch ? 'py-2 font-semibold text-red-700' : 'py-2 text-emerald-700'}>
                      {row.isMismatch ? 'LỆCH' : 'ĐẠT'}
                    </td>
                  </tr>
                ))}
                {state.hourRows.length > 0 && (
                  <tr className="border-t border-slate-300 bg-slate-50 font-semibold">
                    <td className="py-2 pr-4 text-slate-900">Tổng cộng</td>
                    <td className="py-2 pr-4 text-slate-900">{state.sourceTotal.toFixed(2)} giờ</td>
                    <td className="py-2 pr-4 text-slate-900">{state.appTotal.toFixed(2)} giờ</td>
                    <td className={Math.abs(totalDiff) > 0.01 ? 'py-2 pr-4 text-red-700' : 'py-2 pr-4 text-slate-900'}>
                      {totalDiff.toFixed(2)} giờ
                    </td>
                    <td className={Math.abs(totalDiff) > 0.01 ? 'py-2 text-red-700' : 'py-2 text-emerald-700'}>
                      {Math.abs(totalDiff) > 0.01 ? 'LỆCH' : 'ĐẠT'}
                    </td>
                  </tr>
                )}
                {state.hourRows.length === 0 && (
                  <tr>
                    <td className="py-3 text-slate-500" colSpan={5}>Chưa có dữ liệu trong kỳ này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {mismatches.length > 0 && (
            <p className="mt-3 text-sm font-medium text-red-700">
              Có {mismatches.length} nhân viên lệch quá 0.01 giờ.
            </p>
          )}
        </CheckCard>

        <CheckCard
          title="Phép kiểm 2: Ca chờ duyệt không được tính lương"
          status={pendingStatus}
          description={
            pendingStatus === 'lech'
              ? 'Tổng giờ app không khớp với phần giờ hợp lệ, cần kiểm tra trước khi trả lương.'
              : state.pendingCount > 0
                ? `Có ${state.pendingCount} ca chờ duyệt, các ca này đang không nằm trong giờ lương.`
                : 'Không có ca chờ duyệt trong kỳ, giờ lương chỉ lấy từ ca hợp lệ.'
          }
        >
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Ca chờ duyệt</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{state.pendingCount}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Giờ chờ duyệt</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{state.pendingHours.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Giờ hợp lệ gốc</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{state.sourceTotal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Giờ app</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{state.appTotal.toFixed(2)}</div>
            </div>
          </div>
        </CheckCard>

        <CheckCard
          title="Phép kiểm 3: Sức khoẻ dữ liệu"
          status={healthStatus}
          description={
            healthStatus === 'dat'
              ? 'Dữ liệu nền đủ điều kiện cơ bản để vận hành.'
              : 'Có dữ liệu cần xem lại để tránh nhân viên không đăng nhập được, thiếu lịch hoặc thiếu vị trí cửa hàng.'
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-500">Nhân viên hoạt động</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{state.activeEmployees}</div>
              <div className="mt-1 text-sm text-slate-600">{state.activeEmployeesWithAuth} người có tài khoản đăng nhập</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-500">Có lịch từ hôm nay</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{state.employeesWithFutureShifts}</div>
              <div className="mt-1 text-sm text-slate-600">Tính theo số nhân viên khác nhau</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-500">Ca đang mở</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{state.openAttendanceCount}</div>
              <div className="mt-1 text-sm text-slate-600">{state.openInPeriodCount} ca nằm trong tháng này</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-500">Cửa hàng thiếu vị trí</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{state.storesMissingLocation.length}</div>
              <div className="mt-1 text-sm text-slate-600">Thiếu toạ độ hoặc bán kính</div>
            </div>
          </div>
          {state.storesMissingLocation.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-semibold">Cửa hàng</th>
                    <th className="py-2 pr-4 font-semibold">Vĩ độ</th>
                    <th className="py-2 pr-4 font-semibold">Kinh độ</th>
                    <th className="py-2 font-semibold">Bán kính</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.storesMissingLocation.map(store => (
                    <tr key={store.id}>
                      <td className="py-2 pr-4 text-slate-900">{store.ten || store.id}</td>
                      <td className="py-2 pr-4 text-slate-700">{store.vi_do ?? 'Thiếu'}</td>
                      <td className="py-2 pr-4 text-slate-700">{store.kinh_do ?? 'Thiếu'}</td>
                      <td className="py-2 text-slate-700">{store.ban_kinh_met ?? 'Thiếu'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CheckCard>
      </div>
    </AppShell>
  )
}
