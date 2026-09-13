'use client'

import React, { useState, useRef, useMemo } from 'react'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Check,
  Building2,
  Briefcase,
} from 'lucide-react'
import {
  parseEmployeeSpreadsheet,
  buildEmployeeImportPreview,
  exportEmployeeTemplateSpreadsheet,
  type EmployeeExcelHeader,
  type EmployeeImportPreviewRow,
  type EmployeeSpreadsheetParseMeta,
} from '@/lib/services/employee-excel-service'
import { employeeAdapter } from '@/lib/adapters'
import { EmployeeService } from '@/lib/services/employee-service'
import { useAuthStore, type AuthUser } from '@/store/auth-store'

interface EmployeeImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const IMPORTANT_COLUMN_MESSAGES: Partial<Record<EmployeeExcelHeader, string>> = {
  'Mức lương': 'Lương sẽ để trống, bảng lương sẽ ra 0 đồng.',
  'Mã nhân viên': 'Hệ thống tự sinh mã, sẽ KHÔNG khớp được với bảng chấm công xuất từ iPOS.',
  'Chi nhánh': 'Tất cả sẽ bị gán vào Hồ Bá Phấn.',
  'Chức vụ': 'Tất cả sẽ bị gán thành Nhân viên, lương 5.000.000.',
  'Loại nhân viên': 'Hệ thống tự chọn mặc định, ảnh hưởng cách tính lương giữa toàn thời gian và bán thời gian.',
}

export default function EmployeeImportModal({ isOpen, onClose, onSuccess }: EmployeeImportModalProps) {
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<EmployeeImportPreviewRow[]>([])
  const [parseMeta, setParseMeta] = useState<EmployeeSpreadsheetParseMeta | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const validRows = useMemo(
    () => previewRows.filter((r) => r.status !== 'error'),
    [previewRows]
  )

  const stats = useMemo(
    () => ({
      total: previewRows.length,
      valid: validRows.length,
      error: previewRows.filter((r) => r.status === 'error').length,
      warning: previewRows.filter((r) => r.status === 'warning').length,
    }),
    [previewRows, validRows]
  )

  if (!isOpen) return null

  const handleProcessFile = async (file: File) => {
    if (!file) return
    setErrorMsg(null)
    setIsParsing(true)
    setSelectedFile(file)

    try {
      const rows = await parseEmployeeSpreadsheet(file)
      if (!rows || rows.length === 0) {
        setErrorMsg('File Excel không có dữ liệu nhân sự.')
        setPreviewRows([])
        setIsParsing(false)
        return
      }

      const preview = buildEmployeeImportPreview(
        rows,
        (value) => EmployeeService.isPhoneDuplicate(value),
        (value) => EmployeeService.isEmailDuplicate(value),
      )

      setPreviewRows(preview)
      setParseMeta(rows.meta || null)
    } catch (err) {
      console.error('Failed to parse Excel:', err)
      setErrorMsg('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file chuẩn (.xlsx).')
      setPreviewRows([])
      setParseMeta(null)
    } finally {
      setIsParsing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void handleProcessFile(file)
    }
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      void handleProcessFile(file)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewRows([])
    setParseMeta(null)
    setErrorMsg(null)
    setSuccessCount(null)
  }

  const handleConfirmImport = async () => {
    if (validRows.length === 0) return
    setIsImporting(true)
    setErrorMsg(null)

    try {
      const toImport: Partial<AuthUser>[] = validRows.map((r) => ({
        ...r.payload,
        role: r.payload.role || 'employee',
        status: r.payload.status || 'active',
        account_status: r.payload.account_status || 'dang_hoat_dong',
      }))

      await employeeAdapter.batchCreateEmployees(toImport, user || undefined)
      setSuccessCount(toImport.length)

      // Notify parent to refresh and close after short delay
      setTimeout(() => {
        onSuccess()
        handleReset()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Import failed:', err)
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu vào hệ thống. Vui lòng thử lại.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    void exportEmployeeTemplateSpreadsheet()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4.5 bg-[#FFF8E8]/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold shadow-xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#001D3D] tracking-tight">Nhập nhân sự từ Excel</h2>
              <p className="text-xs text-gray-500">Đồng bộ danh sách nhân sự trực tiếp vào hệ thống</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-[#FFF8E8] hover:text-[#001D3D] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4.5">
          {successCount !== null ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Nhập dữ liệu thành công!</h3>
              <p className="text-sm text-gray-600">
                Đã nạp và lưu thành công <span className="font-bold text-emerald-700">{successCount} nhân sự</span> vào cơ sở dữ liệu.
              </p>
              <p className="text-xs text-gray-400">Đang cập nhật danh sách nhân sự...</p>
            </div>
          ) : !selectedFile ? (
            /* DROPZONE STATE */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50/50 scale-[0.99]'
                    : 'border-gray-200 bg-slate-50/60 hover:border-primary-400 hover:bg-white'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 text-primary-600 mb-3">
                  <UploadCloud size={28} />
                </div>
                <p className="text-sm font-bold text-gray-900">Kéo thả file Excel vào đây hoặc <span className="text-primary-600 underline">chọn file</span></p>
                <p className="mt-1 text-xs text-gray-500">Hỗ trợ các định dạng: .xlsx, .xls, .csv (Tối đa 10MB)</p>
              </div>

              {/* TEMPLATE DOWNLOAD HELPER */}
              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-vanilla-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-gray-600 border border-gray-100">
                    <Download size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Chưa có file mẫu chuẩn?</p>
                    <p className="text-[11px] text-gray-500">Tải file mẫu Excel với đầy đủ các cột chuẩn của Homies</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex h-8.5 items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-vanilla-100 transition-colors shadow-2xs"
                >
                  <Download size={13} />
                  <span>Tải file mẫu</span>
                </button>
              </div>
            </div>
          ) : (
            /* PREVIEW STATE */
            <div className="space-y-4">
              {/* FILE BAR */}
              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-100 text-emerald-600 font-bold">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 truncate max-w-[280px] sm:max-w-md">{selectedFile.name}</p>
                    <p className="text-[11px] text-gray-500">
                      Tổng số: <span className="font-semibold text-gray-900">{stats.total} nhân sự</span> • Sẵn sàng nhập: <span className="font-semibold text-emerald-700">{stats.valid}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw size={12} />
                  <span>Chọn file khác</span>
                </button>
              </div>

              {/* SUMMARY STATS CHIPS */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 font-semibold text-emerald-700">
                  <CheckCircle2 size={14} />
                  {stats.valid} nhân sự hợp lệ
                </span>
                {stats.warning > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1 font-semibold text-amber-700" title="Sẽ cập nhật đè thông tin nếu nhân sự đã có">
                    <AlertTriangle size={14} />
                    {stats.warning} đã có (sẽ cập nhật)
                  </span>
                )}
                {stats.error > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 py-1 font-semibold text-red-700">
                    <AlertTriangle size={14} />
                    {stats.error} dòng lỗi (bỏ qua)
                  </span>
                )}
              </div>

              {/* COMPACT PREVIEW TABLE */}
              {parseMeta ? (
                <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-3.5 text-xs shadow-2xs">
                  <p className={parseMeta.headerRowNumber === 1 ? 'text-slate-600' : 'font-semibold text-amber-700'}>
                    Hệ thống đọc tên cột ở dòng thứ {parseMeta.headerRowNumber} của file.
                  </p>
                  {parseMeta.missingImportantColumns.length > 0 ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                      <p className="font-bold">Cột quan trọng bị thiếu</p>
                      <ul className="mt-1 space-y-1">
                        {parseMeta.missingImportantColumns.map((column) => (
                          <li key={column}>{column}: {IMPORTANT_COLUMN_MESSAGES[column]}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {parseMeta.unknownColumns.length > 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                      <p className="font-bold">Cột lạ hệ thống không hiểu: {parseMeta.unknownColumns.join(', ')}</p>
                      <p>Các cột này sẽ bị bỏ qua, dữ liệu trong đó không được lưu.</p>
                      {parseMeta.missingImportantColumns.length > 0 ? (
                        <p>Có thể tên cột trong file khác với tên hệ thống hiểu. Hãy đổi tên cột trong file Excel cho khớp rồi tải lại.</p>
                      ) : null}
                    </div>
                  ) : null}
                  {parseMeta.missingImportantColumns.length === 0 && parseMeta.unknownColumns.length === 0 ? (
                    <p className="font-semibold text-emerald-700">Đã nhận diện đủ các cột quan trọng.</p>
                  ) : null}
                </div>
              ) : null}
              <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-3.5 py-2.5">#</th>
                      <th className="px-3.5 py-2.5">Họ và tên</th>
                      <th className="px-3.5 py-2.5">SĐT & Email</th>
                      <th className="px-3.5 py-2.5">Chi nhánh</th>
                      <th className="px-3.5 py-2.5">Chức vụ</th>
                      <th className="px-3.5 py-2.5 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3.5 py-2 font-mono text-gray-400">{idx + 1}</td>
                        <td className="px-3.5 py-2">
                          <div className="font-semibold text-gray-900">{row.employeeName}</div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {row.mappedFields.map((field) => (
                              <span key={`${idx}-${field.label}`} className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-gray-600">
                                {field.label}: {field.value}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3.5 py-2">
                          <div className="font-mono text-gray-800">{row.payload.phone || '-'}</div>
                          {row.payload.email ? <div className="text-[10px] text-gray-400">{row.payload.email}</div> : null}
                        </td>
                        <td className="px-3.5 py-2 text-gray-600">
                          {row.mappedFields.find((field) => field.label === 'Chi nhánh' || field.label === 'Chi nhanh')?.value || '-'}
                        </td>
                        <td className="px-3.5 py-2 text-gray-600">
                          {row.mappedFields.find((field) => field.label === 'Chức vụ' || field.label === 'Chuc vu')?.value || '-'}
                        </td>
                        <td className="px-3.5 py-2 text-right">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              row.status === 'valid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : row.status === 'warning'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                            }`}
                          >
                            {row.status === 'valid' ? 'Hợp lệ' : row.status === 'warning' ? 'Cần xem lại' : 'Lỗi chặn'}
                          </span>
                          {row.errors.length > 0 ? <div className="mt-1 text-left text-[10px] text-red-600">{row.errors.join(' • ')}</div> : null}
                          {row.warnings.length > 0 ? <div className="mt-1 text-left text-[10px] text-amber-700">{row.warnings.join(' • ')}</div> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 animate-fade-in flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-[#FFF8E8]/40 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-[#FFF8E8] transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {selectedFile && successCount === null && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isImporting || isParsing || validRows.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2F6FA8] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#1D3E61] transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Đang lưu vào Supabase...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Xác nhận nhập ({validRows.length} nhân sự)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
