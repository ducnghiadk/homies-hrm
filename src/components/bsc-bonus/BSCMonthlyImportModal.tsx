'use client'

import React, { useState, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'
import type { BSCRevenueTarget } from '@/lib/bsc-types'

interface BSCMonthlyImportModalProps {
  isOpen: boolean
  onClose: () => void
  storeId: string
  storeName: string
  period: string
  onSuccess: () => void
}

interface ParsedMonthlyData {
  period: string
  actual_revenue_monthly: number
  cogs_budget?: number
  cogs_actual: number
  has_attp_foreign_body: boolean
  customer_qr_score?: number
  min_hours_threshold?: number
}

const formatVND = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + ' đ'

export default function BSCMonthlyImportModal({
  isOpen,
  onClose,
  storeId,
  storeName,
  period,
  onSuccess,
}: BSCMonthlyImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeMode, setActiveMode] = useState<'upload' | 'quick_form'>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsedData, setParsedData] = useState<ParsedMonthlyData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Quick form state
  const [quickRevenue, setQuickRevenue] = useState<number>(0)
  const [quickCogsBudget, setQuickCogsBudget] = useState<number>(0)
  const [quickCogsActual, setQuickCogsActual] = useState<number>(0)
  const [quickHasAttp, setQuickHasAttp] = useState<boolean>(false)
  const [quickQrScore, setQuickQrScore] = useState<number>(0)

  if (!isOpen) return null

  // Tải file CSV mẫu chuẩn F&B
  const handleDownloadTemplate = () => {
    const headers = [
      'Kỳ Tháng (YYYY-MM)',
      'Doanh Thu Thực Tế (VND)',
      'COGS Định Mức (VND)',
      'COGS Thực Tế (VND)',
      'Điểm Đánh Giá QR KH (0-100)',
      'Vi Phạm ATTP / Dị Vật (1=Có, 0=Không)',
    ]
    const sampleRow = [
      period,
      '255440000',
      '85000000',
      '87125000',
      '92',
      '0',
    ]

    const csvContent = '\uFEFF' + [
      headers.join(','),
      sampleRow.join(','),
      '# Ghi chú: File dùng để nạp số liệu quyết toán tháng tự động tính thưởng BSC',
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Mau_Nap_Quyet_Toan_BSC_${period}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Đọc nội dung file CSV / Text
  const processFile = (file: File) => {
    setErrorMsg('')
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        if (!text) {
          setErrorMsg('File rỗng hoặc không đọc được nội dung.')
          return
        }

        const lines = text.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'))
        if (lines.length < 2) {
          setErrorMsg('File cần có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu số liệu.')
          return
        }

        // Dòng dữ liệu đầu tiên sau tiêu đề
        const dataRow = lines[1].split(',').map(item => item.replace(/["']/g, '').trim())

        const rowPeriod = dataRow[0] || period
        const revenue = parseInt(dataRow[1]?.replace(/\D/g, '') || '0', 10)
        const cogsBudget = parseInt(dataRow[2]?.replace(/\D/g, '') || '0', 10)
        const cogsActual = parseInt(dataRow[3]?.replace(/\D/g, '') || '0', 10)
        const qrScore = parseInt(dataRow[4]?.replace(/\D/g, '') || '90', 10)
        const hasAttp = dataRow[5] === '1' || dataRow[5]?.toLowerCase() === 'có' || dataRow[5]?.toLowerCase() === 'true'

        if (revenue <= 0) {
          setErrorMsg('Không tìm thấy giá trị Doanh thu thực tế hợp lệ trong file.')
          return
        }

        setParsedData({
          period: rowPeriod,
          actual_revenue_monthly: revenue,
          cogs_budget: cogsBudget,
          cogs_actual: cogsActual,
          has_attp_foreign_body: hasAttp,
          customer_qr_score: qrScore,
        })
      } catch (err) {
        setErrorMsg('Không thể xử lý file. Vui lòng đảm bảo đúng định dạng CSV chuẩn UTF-8.')
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  // Lưu dữ liệu vào hệ thống BSC
  const handleConfirmSave = async () => {
    setIsSaving(true)
    setErrorMsg('')
    try {
      const dataToSave = activeMode === 'upload' && parsedData
        ? parsedData
        : {
            period,
            actual_revenue_monthly: quickRevenue,
            cogs_budget: quickCogsBudget,
            cogs_actual: quickCogsActual,
            has_attp_foreign_body: quickHasAttp,
            customer_qr_score: quickQrScore,
          }

      const daysInMonth = 31
      const actualDaily = Math.round(dataToSave.actual_revenue_monthly / daysInMonth)

      const payload: Partial<BSCRevenueTarget> = {
        actual_revenue_monthly: dataToSave.actual_revenue_monthly,
        actual_revenue_daily: actualDaily,
        cogs_budget: dataToSave.cogs_budget,
        cogs_actual: dataToSave.cogs_actual,
        has_attp_foreign_body: dataToSave.has_attp_foreign_body,
        is_unlocked: actualDaily >= 6500000,
        approval_status: 'draft',
      }

      await bscAdapter.saveRevenueTarget(storeId, dataToSave.period || period, payload)
      onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg('Đã có lỗi xảy ra khi lưu dữ liệu quyết toán. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FFFDF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
              <FileSpreadsheet size={20} className="text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001D3D] flex items-center gap-2">
                <span>Nạp Dữ Liệu Quyết Toán Tháng BSC</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#2F6FA8] font-bold border border-blue-200">
                  {period}
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {storeName} • Nhập doanh thu, chi phí NVL &amp; điểm vận hành
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switch mode */}
        <div className="px-6 pt-4 flex gap-2 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'upload'
                ? 'border-[#2F6FA8] text-[#2F6FA8]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Upload size={14} />
            <span>Nạp File Excel / CSV Mẫu</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('quick_form')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'quick_form'
                ? 'border-[#2F6FA8] text-[#2F6FA8]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles size={14} />
            <span>Nhập Nhanh Trực Tiếp</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeMode === 'upload' ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-[#2F6FA8] bg-blue-50/50'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-gray-200 flex items-center justify-center text-[#2F6FA8]">
                  <Upload size={22} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#001D3D]">
                    {fileName ? fileName : 'Kéo thả file vào đây hoặc nhấp để chọn file'}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Hỗ trợ định dạng CSV chuẩn UTF-8 (xuất từ Excel hoặc Google Sheets)
                  </div>
                </div>
              </div>

              {/* Template Download Guide */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-blue-900 font-medium">
                  Chưa có file mẫu? Tải bảng mẫu chuẩn Homies để điền số liệu.
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-[#2F6FA8] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Download size={13} />
                  <span>Tải File Mẫu (.csv)</span>
                </button>
              </div>

              {/* Preview Parsed Data */}
              {parsedData && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Đã nhận diện thành công số liệu từ file:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <div className="text-gray-500 text-[10px]">Doanh thu tháng</div>
                      <div className="font-bold text-emerald-900 mt-0.5">
                        {formatVND(parsedData.actual_revenue_monthly)}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <div className="text-gray-500 text-[10px]">COGS thực tế</div>
                      <div className="font-bold text-gray-800 mt-0.5">
                        {formatVND(parsedData.cogs_actual)}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <div className="text-gray-500 text-[10px]">Đánh giá QR KH</div>
                      <div className="font-bold text-[#2F6FA8] mt-0.5">
                        {parsedData.customer_qr_score || 90}/100 đ
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Doanh Thu Thực Tế Tháng (VND) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={quickRevenue}
                    onChange={(e) => setQuickRevenue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
                    placeholder="VD: 255000000"
                  />
                  <div className="text-[10px] text-gray-500 mt-1">
                    {formatVND(quickRevenue)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    COGS Định Mức (VND)
                  </label>
                  <input
                    type="number"
                    value={quickCogsBudget}
                    onChange={(e) => setQuickCogsBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
                  />
                  <div className="text-[10px] text-gray-500 mt-1">
                    {formatVND(quickCogsBudget)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    COGS Thực Tế Tiêu Hao (VND)
                  </label>
                  <input
                    type="number"
                    value={quickCogsActual}
                    onChange={(e) => setQuickCogsActual(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
                  />
                  <div className="text-[10px] text-gray-500 mt-1">
                    {formatVND(quickCogsActual)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Điểm Đánh Giá QR Khách Hàng (Thang 100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={quickQrScore}
                    onChange={(e) => setQuickQrScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-gray-800">
                    Sự Cố Dị Vật / ATTP Nghiêm Trọng Trong Tháng
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Nếu bật, tiêu chí Khách hàng &amp; Dịch vụ sẽ tự động bị ép về 1.0 điểm
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={quickHasAttp}
                  onChange={(e) => setQuickHasAttp(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={isSaving || (activeMode === 'upload' && !parsedData)}
            className="px-5 py-2 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span>Đang lưu...</span>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Lưu Quyết Toán Tháng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
