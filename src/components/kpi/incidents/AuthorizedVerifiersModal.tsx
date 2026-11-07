'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  KeyRound,
  Store,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { mockStores, mockEmployees } from '@/lib/mock-data'
import {
  violationPermissionService,
  type AuthorizedVerifier,
} from '@/lib/services/violation-permission-service'

interface AuthorizedVerifiersModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthorizedVerifiersModal({
  isOpen,
  onClose,
}: AuthorizedVerifiersModalProps) {
  const [selectedStoreId, setSelectedStoreId] = useState('store-001')
  const [verifiers, setVerifiers] = useState<AuthorizedVerifier[]>([])
  const [storePins, setStorePins] = useState<Record<string, string>>({})
  const [editingPin, setEditingPin] = useState('')
  const [isPinDirty, setIsPinDirty] = useState(false)

  // Add new verifier form
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [customTitle, setCustomTitle] = useState('Tổ trưởng ca')

  const loadData = () => {
    const list = violationPermissionService.getVerifiers(selectedStoreId)
    setVerifiers(list)
    const pins = violationPermissionService.getStorePins()
    setStorePins(pins)
    setEditingPin(pins[selectedStoreId] || '3535')
    setIsPinDirty(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, selectedStoreId])

  if (!isOpen) return null

  const handleToggle = (empId: string, currentStatus: boolean) => {
    violationPermissionService.toggleVerifier(empId, !currentStatus)
    loadData()
    toast.success(
      !currentStatus
        ? 'Đã cấp quyền ghi nhận sự cố'
        : 'Đã tạm khóa quyền ghi nhận sự cố'
    )
  }

  const handleRemove = (empId: string) => {
    violationPermissionService.removeVerifier(empId)
    loadData()
    toast.success('Đã xóa khỏi danh sách người ghi nhận')
  }

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPin.trim() || editingPin.length < 4) {
      toast.error('Mã PIN phải có ít nhất 4 ký tự!')
      return
    }
    violationPermissionService.setStorePin(selectedStoreId, editingPin.trim())
    setIsPinDirty(false)
    toast.success(`Đã cập nhật mã PIN chi nhánh thành công: ${editingPin.trim()}`)
  }

  const handleAddVerifier = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmpId) {
      toast.error('Vui lòng chọn nhân viên!')
      return
    }

    const emp = mockEmployees.find((e) => e.id === selectedEmpId)
    if (!emp) return

    violationPermissionService.addVerifier({
      employee_id: emp.id,
      employee_code: emp.employee_code,
      full_name: emp.full_name,
      role: emp.role || 'shift_leader',
      role_title: customTitle.trim() || 'Tổ trưởng ca',
      store_id: selectedStoreId,
      is_enabled: true,
    })

    setShowAddForm(false)
    setSelectedEmpId('')
    loadData()
    toast.success(`Đã thêm ${emp.full_name} vào danh sách người ghi nhận!`)
  }

  const storeObj = mockStores.find((s) => s.id === selectedStoreId)
  const storeCandidates = mockEmployees.filter(
    (e) =>
      e.status !== 'inactive' &&
      (e.store_id === selectedStoreId || selectedStoreId === 'all')
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Cài Đặt Người Ghi Nhận Sự Cố &amp; Mã PIN
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Admin chỉ định Quản lý / Trưởng ca được quyền lập biên bản vi phạm tại quầy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Store Selector Tab */}
        <div className="px-6 pt-4 pb-2 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <Store size={16} className="text-[#2F6FA8]" />
            <span className="text-xs font-bold text-gray-700">Chi nhánh quản lý:</span>
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setSelectedStoreId('store-001')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedStoreId === 'store-001'
                    ? 'bg-[#2F6FA8] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hồ Bá Phấn (HBP)
              </button>
              <button
                type="button"
                onClick={() => setSelectedStoreId('store-002')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedStoreId === 'store-002'
                    ? 'bg-[#2F6FA8] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Chi nhánh 429
              </button>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Section 1: Mã PIN của chi nhánh */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-amber-700" />
                <strong className="text-xs font-bold text-amber-900">
                  Mã PIN Bảo Mật Của {storeObj?.name || 'Chi Nhánh'}
                </strong>
              </div>
              <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                Dùng mở khóa Form trên điện thoại
              </span>
            </div>
            <form onSubmit={handleSavePin} className="flex items-center gap-3">
              <input
                type="text"
                value={editingPin}
                onChange={(e) => {
                  setEditingPin(e.target.value)
                  setIsPinDirty(true)
                }}
                maxLength={8}
                placeholder="VD: 3535"
                className="w-36 px-3 py-1.5 text-base tracking-widest font-black text-center text-gray-900 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={!isPinDirty}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isPinDirty
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Lưu Mã PIN Mới
              </button>
              <span className="text-xs text-gray-500">
                (Master PIN toàn chuỗi: <strong className="text-gray-800">8888</strong>)
              </span>
            </form>
          </div>

          {/* Section 2: Danh sách Người ghi nhận được ủy quyền */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-600" />
                  Danh Sách Quản Lý / Trưởng Ca Được Quyền Lập Lỗi
                </h3>
                <p className="text-xs text-gray-500">
                  Những người này sẽ xuất hiện trong menu chọn người ghi nhận trên Form Mobile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={15} />
                Thêm Người Ghi Nhận
              </button>
            </div>

            {/* Form thêm mới */}
            {showAddForm && (
              <form
                onSubmit={handleAddVerifier}
                className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3 animate-fade-in"
              >
                <strong className="text-xs font-bold text-emerald-900 block">
                  Ủy quyền thêm nhân sự cho chi nhánh:
                </strong>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      Chọn nhân viên:
                    </label>
                    <select
                      value={selectedEmpId}
                      onChange={(e) => setSelectedEmpId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">-- Chọn nhân sự quán --</option>
                      {storeCandidates.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.employee_code || emp.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      Chức danh hiển thị:
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="VD: Quản lý ca / Tổ trưởng pha chế"
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
                  >
                    Xác Nhận Thêm
                  </button>
                </div>
              </form>
            )}

            {/* Danh sách thẻ nhân sự */}
            <div className="space-y-2">
              {verifiers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  Chưa có người ghi nhận nào được ủy quyền. Bấm "Thêm Người Ghi Nhận" ở trên.
                </div>
              ) : (
                verifiers.map((item) => (
                  <div
                    key={item.employee_id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                      item.is_enabled
                        ? 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                        : 'bg-gray-50/80 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          item.is_enabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {item.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-gray-900 font-bold text-xs">
                            {item.full_name}
                          </strong>
                          {item.employee_code && (
                            <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-semibold">
                              {item.employee_code}
                            </span>
                          )}
                          {item.store_id === 'all' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">
                              Toàn chuỗi
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {item.role_title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(item.employee_id, item.is_enabled)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                          item.is_enabled
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {item.is_enabled ? (
                          <>
                            <CheckCircle2 size={13} />
                            Đang Bật
                          </>
                        ) : (
                          <>
                            <UserX size={13} />
                            Đã Tắt
                          </>
                        )}
                      </button>

                      {item.role !== 'ceo' && (
                        <button
                          type="button"
                          onClick={() => handleRemove(item.employee_id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Xóa người này"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
          >
            Đóng Cài Đặt
          </button>
        </div>
      </div>
    </div>
  )
}
