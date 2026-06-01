'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { EmployeeService } from '@/lib/services/employee-service'
import {
  EMPLOYEE_EXCEL_HEADERS,
  buildEmployeeExportRows,
  downloadEmployeeWorkbook,
} from '@/lib/services/employee-excel-service'
import { Check, Download, FileSpreadsheet, Filter, LayoutTemplate, RefreshCcw } from 'lucide-react'

const EXPORT_PRESETS = [
  {
    id: 'full',
    label: 'HR tổng',
    description: 'Xuất đầy đủ bộ cột nhân sự để lưu trữ và đối soát tổng.',
    columns: [...EMPLOYEE_EXCEL_HEADERS],
  },
  {
    id: 'store_ops',
    label: 'Vận hành cửa hàng',
    description: 'Tập trung vào ca làm, chi nhánh, chức vụ và thông tin liên hệ.',
    columns: ['Mã nhân viên', 'Nhân viên', 'Số điện thoại', 'Email', 'Chi nhánh', 'Chức vụ', 'Bộ phận', 'Loại nhân viên', 'Ngày gia nhập công ty', 'Ngày nghỉ việc'],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    description: 'Tập trung vào lương, ngày vào làm, CCCD và dữ liệu đối soát.',
    columns: ['Mã nhân viên', 'Nhân viên', 'Số điện thoại', 'Email', 'Ngày gia nhập công ty', 'Chi nhánh', 'Chức vụ', 'Mức lương', 'Ngân hàng', 'Số tài khoản ngân hàng', 'Căn cước công dân', 'Mã số thuế'],
  },
] as const

function EmployeeExportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const initialPreset = useMemo(() => {
    const preset = searchParams.get('preset')
    return preset && EXPORT_PRESETS.some((item) => item.id === preset) ? preset : 'full'
  }, [searchParams])
  const [selectedPreset, setSelectedPreset] = useState<string>(initialPreset)
  const [selected, setSelected] = useState<string[]>(() => {
    const presetData = EXPORT_PRESETS.find((item) => item.id === initialPreset)
    return presetData
      ? presetData.columns.filter((column) => EMPLOYEE_EXCEL_HEADERS.includes(column as never))
      : [...EMPLOYEE_EXCEL_HEADERS]
  })
  const [selectedStore, setSelectedStore] = useState(() => searchParams.get('store') || 'all')
  const [selectedStatus, setSelectedStatus] = useState(() => searchParams.get('status') || 'all')
  const [selectedAccountStatus, setSelectedAccountStatus] = useState(() => searchParams.get('accountStatus') || 'all')
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const selectedIdsFromQuery = useMemo(() => {
    const raw = searchParams.get('selectedIds') || ''
    return raw.split(',').map((value) => value.trim()).filter(Boolean)
  }, [searchParams])

  const employees = useMemo(() => {
    if (!user) return []
    return EmployeeService.getEmployees(user)
  }, [user])

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const term = searchTerm.trim().toLowerCase()
      if (selectedStore !== 'all' && employee.store_id !== selectedStore) return false
      if (selectedStatus !== 'all' && employee.status !== selectedStatus) return false
      if (selectedAccountStatus !== 'all' && employee.account_status !== selectedAccountStatus) return false
      if (selectedIdsFromQuery.length > 0 && !selectedIdsFromQuery.includes(employee.id)) return false
      if (!term) return true

      return (
        (employee.full_name || '').toLowerCase().includes(term) ||
        (employee.employee_code || '').toLowerCase().includes(term) ||
        (employee.email || '').toLowerCase().includes(term) ||
        (employee.phone || '').includes(term)
      )
    })
  }, [employees, searchTerm, selectedAccountStatus, selectedIdsFromQuery, selectedStatus, selectedStore])

  const storeOptions = useMemo(() => {
    return Array.from(new Set(employees.map((employee) => employee.store_id).filter(Boolean)))
  }, [employees])

  if (!user) return null

  const canManage = ['ceo', 'hr_admin'].includes(user.role)
  if (!canManage) {
    return (
      <AppShell title="Xuất nhân sự">
        <div className="py-20 text-center text-gray-500">Bạn không có quyền xuất dữ liệu nhân sự.</div>
      </AppShell>
    )
  }

  const applyPreset = (presetId: string) => {
    const preset = EXPORT_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    setSelectedPreset(presetId)
    setSelected(preset.columns.filter((column) => EMPLOYEE_EXCEL_HEADERS.includes(column as never)))
    setMessage(null)
  }

  const toggle = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key])
    setMessage(null)
  }

  const handleExport = () => {
    if (selected.length === 0) {
      setMessage('Vui lòng chọn ít nhất 1 cột để xuất.')
      return
    }

    const rows = buildEmployeeExportRows(filteredEmployees).map((row) => {
      const next = {} as Record<string, string>
      for (const key of selected) {
        next[key] = row[key as keyof typeof row]
      }
      return next
    })

    downloadEmployeeWorkbook(rows as never, `Danh-Sach-Nhan-Vien-${Date.now()}.xlsx`)
    setMessage(`Đã xuất ${filteredEmployees.length} nhân sự với ${selected.length} cột theo preset ${EXPORT_PRESETS.find((item) => item.id === selectedPreset)?.label || 'tùy chỉnh'}.`)
  }

  return (
    <AppShell title="Xuất nhân sự">
      <div className="space-y-4 pb-20">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Nhân sự</p>
                <h1 className="mt-1 text-2xl font-bold text-dark-700 font-['Poppins']">Xuất danh sách nhân viên</h1>
                <p className="mt-1 max-w-3xl text-sm text-gray-500">
                  Chọn preset theo mục đích, khóa đúng danh sách cần xuất và giữ bộ cột quen thuộc để đối soát nhanh hơn.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Nhân sự sẽ xuất</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{filteredEmployees.length}</p>
                  <p className="mt-1 text-sm text-slate-600">Trên tổng {employees.length} nhân sự đang có trong hệ thống.</p>
                </div>
                <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Số cột đang chọn</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{selected.length}</p>
                  <p className="mt-1 text-sm text-slate-600">Trên tổng {EMPLOYEE_EXCEL_HEADERS.length} cột có thể xuất.</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Preset hiện tại</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{EXPORT_PRESETS.find((item) => item.id === selectedPreset)?.label}</p>
                  <p className="mt-1 text-sm text-slate-600">Giữ nhanh đúng cấu hình cho mục đích đang làm.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Trọng tâm lần xuất này</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedIdsFromQuery.length > 0
                      ? `Nhận sẵn ${selectedIdsFromQuery.length} người đã chọn từ trung tâm nhân sự.`
                      : 'Đang xuất từ toàn bộ danh sách sau khi áp bộ lọc hiện tại.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
                >
                  <Download size={16} />
                  Xuất file Excel
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Bộ lọc tìm nhanh: <span className="font-semibold text-slate-900">{searchTerm.trim() || 'Không có'}</span></p>
                <p>Lọc tài khoản: <span className="font-semibold text-slate-900">{selectedAccountStatus === 'all' ? 'Tất cả' : selectedAccountStatus}</span></p>
                <p>Trạng thái làm việc: <span className="font-semibold text-slate-900">{selectedStatus === 'all' ? 'Tất cả' : selectedStatus}</span></p>
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <LayoutTemplate size={18} className="text-primary-600" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Preset xuất</h2>
                  <p className="text-xs text-gray-500">Nhanh chọn bộ cột theo ngữ cảnh sử dụng</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {EXPORT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                      selectedPreset === preset.id
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{preset.label}</p>
                    <p className="mt-1 text-sm text-gray-500">{preset.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-primary-600" />
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Chọn cột xuất</h2>
                    <p className="text-xs text-gray-500">Có thể giữ nguyên theo preset hoặc bổ sung cắt bớt thủ công</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(selected.length === EMPLOYEE_EXCEL_HEADERS.length ? [] : [...EMPLOYEE_EXCEL_HEADERS])}
                  className="text-sm font-semibold text-primary-600"
                >
                  {selected.length === EMPLOYEE_EXCEL_HEADERS.length ? 'Bỏ hết' : 'Chọn tất cả'}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {EMPLOYEE_EXCEL_HEADERS.map((column) => {
                  const isChecked = selected.includes(column)
                  return (
                    <button
                      key={column}
                      type="button"
                      onClick={() => toggle(column)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                        isChecked ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-md ${
                        isChecked ? 'bg-primary-500 text-white' : 'bg-gray-200 text-transparent'
                      }`}>
                        <Check size={12} />
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{column}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-primary-600" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Lọc trước khi xuất</h2>
                  <p className="text-xs text-gray-500">Chỉ xuất đúng nhóm HR đang cần</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo tên, mã, email, số điện thoại"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
                />
                <select
                  value={selectedStore}
                  onChange={(event) => setSelectedStore(event.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
                >
                  <option value="all">Tất cả chi nhánh</option>
                  {storeOptions.map((storeId) => (
                    <option key={storeId} value={storeId}>{storeId}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang làm việc</option>
                  <option value="probation">Thử việc</option>
                  <option value="inactive">Sắp nhận việc / tạm nghỉ</option>
                  <option value="resigned">Đã nghỉ việc</option>
                </select>

                <select
                  value={selectedAccountStatus}
                  onChange={(event) => setSelectedAccountStatus(event.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
                >
                  <option value="all">Tất cả tài khoản</option>
                  <option value="chua_kich_hoat">Chưa kích hoạt</option>
                  <option value="dang_hoat_dong">Đang hoạt động</option>
                  <option value="bi_khoa">Bị khóa</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedStore('all')
                    setSelectedStatus('all')
                    setSelectedAccountStatus('all')
                    setMessage(null)
                  }}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <RefreshCcw size={16} />
                  Bỏ lọc
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Xem trước cấu hình xuất</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p>Preset đang chọn: <span className="font-semibold text-gray-900">{EXPORT_PRESETS.find((item) => item.id === selectedPreset)?.label}</span></p>
                <p>Số nhân sự sẽ xuất: <span className="font-semibold text-gray-900">{filteredEmployees.length}</span></p>
                <p>Số cột sẽ xuất: <span className="font-semibold text-gray-900">{selected.length}</span></p>
                <p>Bộ lọc tìm nhanh: <span className="font-semibold text-gray-900">{searchTerm.trim() || 'Không có'}</span></p>
                <p>Lọc tài khoản: <span className="font-semibold text-gray-900">{selectedAccountStatus === 'all' ? 'Tất cả' : selectedAccountStatus}</span></p>
                <p className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-xs text-gray-500">
                  File xuất sẽ giữ thứ tự cột theo danh sách đang chọn, phù hợp cho đối soát nhanh và gửi lại cho bộ phận liên quan.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

export default function EmployeeExportPage() {
  return (
    <Suspense fallback={<AppShell title="Xuất nhân sự"><div className="py-20 text-center text-gray-500">Đang tải bộ lọc xuất nhân sự...</div></AppShell>}>
      <EmployeeExportContent />
    </Suspense>
  )
}
