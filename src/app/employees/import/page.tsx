'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { EmployeeService } from '@/lib/services/employee-service'
import {
  EMPLOYEE_EXCEL_HEADERS,
  EMPLOYEE_IMPORT_PRESETS,
  buildEmployeeImportPreview,
  parseEmployeeSpreadsheet,
  type EmployeeImportPreviewRow,
} from '@/lib/services/employee-excel-service'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, RefreshCcw, Settings2, Upload } from 'lucide-react'

const EMPTY_PREVIEW: EmployeeImportPreviewRow[] = []

export default function EmployeeImportPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [previewRows, setPreviewRows] = useState<EmployeeImportPreviewRow[]>(EMPTY_PREVIEW)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>(EMPLOYEE_IMPORT_PRESETS[0]?.id || 'hrm_standard')
  const [importMode, setImportMode] = useState<'safe' | 'flex'>('safe')
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/employees/import')
    }
  }, [hasHydrated, isAuthenticated, router])

  const stats = useMemo(() => ({
    valid: previewRows.filter((row) => row.status === 'valid').length,
    warning: previewRows.filter((row) => row.status === 'warning').length,
    error: previewRows.filter((row) => row.status === 'error').length,
    total: previewRows.length,
  }), [previewRows])

  const importableRows = useMemo(
    () => previewRows.filter((row) => importMode === 'safe' ? row.status === 'valid' : row.status === 'valid' || row.status === 'warning'),
    [importMode, previewRows],
  )

  if (!hasHydrated || !user) {
    return (
      <AppShell title="Nhập nhân sự">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  const canManage = ['ceo', 'hr_admin'].includes(user.role)
  if (!canManage) {
    return (
      <AppShell title="Nhập nhân sự">
        <div className="py-20 text-center text-gray-500">Bạn không có quyền vào màn nhập nhân sự.</div>
      </AppShell>
    )
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const rows = await parseEmployeeSpreadsheet(file)
      const preview = buildEmployeeImportPreview(
        rows,
        (value) => EmployeeService.isPhoneDuplicate(value),
        (value) => EmployeeService.isEmailDuplicate(value),
      )

      setPreviewRows(preview)
      setSelectedFileName(file.name)
      setMessage(preview.length > 0 ? `Đã đọc file ${file.name}.` : 'File không có dữ liệu để nhập.')
    } catch (error) {
      console.error('Import file parse failed', error)
      setMessage('Không đọc được file. Vui lòng dùng đúng mẫu Excel nhân sự.')
      setPreviewRows([])
      setSelectedFileName(file.name)
    } finally {
      event.currentTarget.value = ''
    }
  }

  const handleImport = async () => {
    if (importableRows.length === 0) {
      setMessage('Không có dòng hợp lệ để nhập.')
      return
    }

    setImporting(true)
    let imported = 0
    let skipped = 0

    for (const row of importableRows) {
      const phone = row.payload.phone || ''
      const email = row.payload.email || ''
      if ((phone && EmployeeService.isPhoneDuplicate(phone)) || (email && EmployeeService.isEmailDuplicate(email))) {
        skipped += 1
        continue
      }

      EmployeeService.createEmployee({
        ...row.payload,
        role: row.payload.role || 'employee',
        status: row.payload.status || 'active',
        account_status: row.payload.account_status || 'dang_hoat_dong',
      }, user, 'import')
      imported += 1
    }

    setImporting(false)
    setMessage(`Đã nhập ${imported} nhân sự vào danh sách.${skipped > 0 ? ` Bỏ qua ${skipped} dòng trùng dữ liệu.` : ''}`)
    setPreviewRows([])
    setSelectedFileName('')
  }

  return (
    <AppShell title="Nhập nhân sự">
      <div className="space-y-4 pb-20">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Nhân sự</p>
                <h1 className="mt-1 text-2xl font-bold text-dark-700 font-['Poppins']">Nhập nhân sự từ Excel</h1>
                <p className="mt-1 max-w-3xl text-sm text-gray-500">
                  Chọn preset map cột, xem trước từng dòng và quyết định nhập an toàn hay nhập linh hoạt trước khi đưa vào danh sách.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">File đang chọn</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{selectedFileName || 'Chưa chọn file'}</p>
                  <p className="mt-1 text-sm text-slate-600">Đổi file bất kỳ lúc nào trước khi nhập.</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Hợp lệ</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stats.valid}</p>
                  <p className="mt-1 text-sm text-slate-600">Các dòng có thể nhập ngay không cần sửa.</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Cần xem lại</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stats.warning}</p>
                  <p className="mt-1 text-sm text-slate-600">Có thể nhập nếu dùng chế độ linh hoạt.</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Lỗi</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stats.error}</p>
                  <p className="mt-1 text-sm text-slate-600">Cần sửa trước khi hệ thống nhận vào.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Trọng tâm lần nhập này</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stats.total > 0
                      ? `Đang xem trước ${stats.total} dòng, dự kiến nhận ${importableRows.length} dòng theo chế độ hiện tại.`
                      : 'Chưa có dữ liệu xem trước, hãy chọn file Excel để bắt đầu.'}
                  </p>
                </div>

                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600">
                  <Upload size={16} />
                  Chọn file Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Preset đang chọn: <span className="font-semibold text-slate-900">{EMPLOYEE_IMPORT_PRESETS.find((item) => item.id === selectedPreset)?.label}</span></p>
                <p>Chế độ nhập: <span className="font-semibold text-slate-900">{importMode === 'safe' ? 'Nhập an toàn' : 'Nhập linh hoạt'}</span></p>
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            {message}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Bộ cột và preset map</h2>
                  <p className="text-xs text-gray-500">Preset giúp nhìn nhanh bộ cột đang được ưu tiên khi import.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRows([])
                    setSelectedFileName('')
                    setMessage(null)
                  }}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <RefreshCcw size={16} />
                  Làm mới
                </button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {EMPLOYEE_IMPORT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
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

              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                {EMPLOYEE_EXCEL_HEADERS.map((header) => (
                  <div key={header} className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {header}
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-primary-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Xem trước dữ liệu</p>
                    <p className="text-xs text-gray-500">{stats.total} dòng • sẽ nhập {importableRows.length} dòng</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || stats.total === 0}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  {importing ? 'Đang nhập...' : 'Nhập vào danh sách nhân sự'}
                </button>
              </div>

              {stats.total === 0 ? (
                <div className="px-6 py-16 text-center text-sm text-gray-400">Chọn file Excel để xem trước dữ liệu trước khi nhập.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {previewRows.map((row) => (
                    <div key={`${row.row}-${row.employeeName}`} className="grid gap-3 px-4 py-4 xl:grid-cols-[88px_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Dòng {row.row}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{row.employeeName}</p>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <p>SĐT: {row.payload.phone || '—'} • Email: {row.payload.email || '—'}</p>
                        <p>
                          Chi nhánh: {row.mappedFields.find((field) => field.label === 'Chi nhánh')?.value || '—'}
                          {' • '}
                          Chức vụ: {row.mappedFields.find((field) => field.label === 'Chức vụ')?.value || '—'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {row.mappedFields.map((field) => (
                          <span key={`${row.row}-${field.label}`} className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                            {field.label}: {field.value}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.status === 'valid'
                            ? 'bg-green-100 text-green-700'
                            : row.status === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {row.status === 'valid' ? 'Hợp lệ' : row.status === 'warning' ? 'Cần xem lại' : 'Lỗi'}
                        </span>
                        {row.errors.length > 0 ? <p className="text-xs text-red-600">{row.errors.join(' • ')}</p> : null}
                        {row.warnings.length > 0 ? <p className="text-xs text-amber-700">{row.warnings.join(' • ')}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-primary-600" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Chế độ nhập</h2>
                  <p className="text-xs text-gray-500">Chọn cách xử lý dòng warning trước khi nhập</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setImportMode('safe')}
                  className={`w-full rounded-2xl border px-4 py-4 text-left ${
                    importMode === 'safe' ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-gray-900">Nhập an toàn</p>
                  <p className="mt-1 text-sm text-gray-500">Chỉ lấy dòng hợp lệ, sạch lỗi và sạch cảnh báo.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('flex')}
                  className={`w-full rounded-2xl border px-4 py-4 text-left ${
                    importMode === 'flex' ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-gray-900">Nhập linh hoạt</p>
                  <p className="mt-1 text-sm text-gray-500">Lấy cả dòng warning để HR xử lý bổ sung sau.</p>
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Checklist trước khi nhập</h2>
                  <p className="text-xs text-gray-500">Giúp tự kiểm tra nhanh file đầu vào</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p>Preset đang chọn: <span className="font-semibold text-gray-900">{EMPLOYEE_IMPORT_PRESETS.find((item) => item.id === selectedPreset)?.label}</span></p>
                <p>Dòng sẽ nhập: <span className="font-semibold text-gray-900">{importableRows.length}</span></p>
                <p>Dòng cần sửa trước: <span className="font-semibold text-red-600">{stats.error}</span></p>
                <p>Dòng cần cảnh báo: <span className="font-semibold text-amber-600">{stats.warning}</span></p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AppShell>
  )
}
