'use client'

import React, { useEffect, useState } from 'react'
import {
  X,
  Clock,
  MapPin,
  Wifi,
  ShieldCheck,
  AlertTriangle,
  History,
  CheckCircle2,
  Calendar,
  User,
  Edit3,
  Trash2,
  Sparkles,
  Store,
  Info,
} from 'lucide-react'
import type { Employee } from '@/lib/mock-data'
import type { AttendanceSlot } from '@/app/attendance/page'
import { isShiftPast22PM, isTrashShift, validateHomiesShift } from '@/lib/scheduling/strict-shift-validator'

interface AttendanceQuickDrawerProps {
  isOpen: boolean
  onClose: () => void
  slot: AttendanceSlot | null
  employee: Employee | null
  dateStr: string
  dayLabel?: string
  onEdit?: () => void
  onDelete?: () => void
}

export default function AttendanceQuickDrawer({
  isOpen,
  onClose,
  slot,
  employee,
  dateStr,
  dayLabel,
  onEdit,
  onDelete,
}: AttendanceQuickDrawerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen || !slot || !employee) return null

  const formattedDate = dateStr.split('-').reverse().join('/')

  // Kiểm tra Strict Validator
  const checkIn = slot.actualIn || slot.scheduledIn || ''
  const checkOut = slot.actualOut || slot.scheduledOut || ''
  const isPast22 = isShiftPast22PM(checkIn, checkOut)
  const isTrash = isTrashShift(slot.shiftName || '', slot.scheduledIn || '', slot.scheduledOut || '')
  const shiftValidation = validateHomiesShift(slot.shiftName || '', slot.scheduledIn || '', slot.scheduledOut || '')

  const isInvalidOrRejected = isPast22 || isTrash || !shiftValidation.isValid

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-200">
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#1D3E61] to-[#2F6FA8] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
                {employee.full_name?.charAt(0) || 'NV'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {employee.full_name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/20 text-white/90">
                    {employee.employee_code || employee.id}
                  </span>
                </div>
                <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                  <Calendar size={13} className="opacity-80" />
                  <span>{dayLabel ? `${dayLabel}, ` : ''}{formattedDate}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/50">
            {/* Cảnh báo nghiêm ngặt nếu ca quá 22:00 hoặc ca rác */}
            {isInvalidOrRejected && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-xs animate-pulse">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-rose-900">
                      {isTrash
                        ? 'Ca rác không hợp lệ (Không thuộc 10 Khung ca chuẩn)'
                        : 'Ca vượt mốc 22:00 (Giờ đóng cửa quán)'}
                    </p>
                    <p className="leading-relaxed text-rose-700">
                      Homies đóng cửa lúc 22h, việc dọn dẹp đã nằm trọn trong Ca Tối (17:00 - 22:00).
                      Theo quy định F&B, ca này <strong className="underline">tự động bị loại khỏi tổng giờ công</strong> và không tính lương.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* KHỐI 1: GIỜ KẾ HOẠCH (Theo phân ca chuẩn) */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2F6FA8]" />
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    1. Giờ Kế Hoạch
                  </h3>
                </div>
                {shiftValidation.isStandard ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 size={12} /> Ca Chuẩn Homies
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertTriangle size={12} /> Ca Đặc Biệt
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block text-[11px]">Tên khung ca</span>
                  <span className="font-semibold text-gray-900">{slot.shiftName || 'Ca theo lịch'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Khung giờ chuẩn</span>
                  <span className="font-mono font-bold text-[#1D3E61]">
                    {slot.scheduledIn || '08:30'} - {slot.scheduledOut || '17:00'}
                  </span>
                </div>
              </div>
            </div>

            {/* KHỐI 2: GIỜ QUÉT VÂN TAY / WI-FI THỰC TẾ */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    2. Quét Thực Tế (Wi-Fi / Vân Tay)
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2F6FA8] border border-blue-200">
                  {slot.totalHours || 0} giờ công
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Check-in */}
                <div className="flex items-start justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <span className="text-gray-500 text-[11px] block">Check-in</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {slot.actualIn || slot.scheduledIn || '--:--'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                      <MapPin size={12} />
                      {slot.locationNoteIn || `Cách chi nhánh ${slot.distanceInMeters || 18}m`}
                    </span>
                    <span className="text-gray-400 text-[10px] block mt-0.5">
                      Wi-Fi: {slot.wifiName || 'Homies_MilkTea_Store'}
                    </span>
                  </div>
                </div>

                {/* Check-out */}
                <div className="flex items-start justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <span className="text-gray-500 text-[11px] block">Check-out</span>
                    <span className="font-mono font-bold text-[#2F6FA8] text-sm">
                      {slot.actualOut || slot.scheduledOut || 'Chưa check-out'}
                    </span>
                  </div>
                  <div className="text-right">
                    {slot.actualOut ? (
                      <>
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                          <MapPin size={12} />
                          {slot.locationNoteOut || `Cách chi nhánh ${slot.distanceOutMeters || 12}m`}
                        </span>
                        <span className="text-gray-400 text-[10px] block mt-0.5">
                          Wi-Fi: {slot.wifiName || 'Homies_MilkTea_Store'}
                        </span>
                      </>
                    ) : (
                      <span className="text-amber-600 font-medium text-[11px]">Đang trong ca làm việc</span>
                    )}
                  </div>
                </div>

                {/* Thiết bị & IP */}
                {slot.deviceInfo && (
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-1">
                    <Info size={12} className="text-gray-400" />
                    <span>Thiết bị: {slot.deviceInfo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* KHỐI 3: TRẠNG THÁI & LỊCH SỬ CHỈNH SỬA */}
            <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    3. Trạng Thái & Nhật Ký Ghi Nhận
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Trạng thái giờ giấc */}
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Trạng thái chấm công:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      slot.status === 'on_time'
                        ? 'text-emerald-700 bg-emerald-50'
                        : slot.status === 'missing_checkout'
                        ? 'text-rose-700 bg-rose-50'
                        : 'text-amber-700 bg-amber-50'
                    }`}
                  >
                    {slot.status === 'on_time'
                      ? '✓ Đúng giờ'
                      : slot.status === 'missing_checkout'
                      ? '⚠️ Quên chấm công'
                      : slot.status === 'late'
                      ? `Đi trễ (${slot.lateMinutes || 0}p)`
                      : slot.status === 'early'
                      ? `Về sớm (${slot.earlyMinutes || 0}p)`
                      : 'Đang làm việc'}
                  </span>
                </div>

                {/* Nguồn ghi nhận */}
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Phân loại dữ liệu:</span>
                  {slot.isEdited ? (
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
                      Đã chỉnh sửa thủ công
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                      Nguyên bản (Wi-Fi / Máy chấm công)
                    </span>
                  )}
                </div>

                {/* Nếu đã chỉnh sửa, hiển thị lý do và người sửa */}
                {slot.isEdited && (
                  <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-amber-900 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-amber-800">Người thực hiện:</span>
                      <span className="font-mono">{slot.editedBy || 'Quản lý cửa hàng'}</span>
                    </div>
                    {slot.editedAt && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-amber-800">Thời gian sửa:</span>
                        <span>{slot.editedAt}</span>
                      </div>
                    )}
                    <div className="text-[11px] pt-1 border-t border-amber-200/60">
                      <span className="font-semibold text-amber-800 block">Lý do điều chỉnh:</span>
                      <p className="italic mt-0.5 text-gray-700">{slot.editReason || 'Điều chỉnh giờ công thực tế'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
              >
                <Trash2 size={14} />
                Xóa công
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
              >
                Đóng
              </button>
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#2F6FA8] hover:bg-[#1D3E61] shadow-xs transition cursor-pointer"
                >
                  <Edit3 size={14} />
                  Sửa công
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
