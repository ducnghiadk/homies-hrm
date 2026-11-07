'use client'

import React, { useState, useEffect } from 'react'
import { Users, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { bscPositionMultipliersCatalog, updateBSCPositionMultiplier } from '@/lib/mock-data-bsc'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'

interface BSCSettingsRolesTabProps {
  isCEOOrHR: boolean
  onNotify: (msg: string) => void
}

export default function BSCSettingsRolesTab({
  isCEOOrHR,
  onNotify,
}: BSCSettingsRolesTabProps) {
  const [allowStoreManagerView, setAllowStoreManagerView] = useState(true)

  useEffect(() => {
    let isMounted = true
    bscAdapter.getSafetySettings().then(settings => {
      if (isMounted && typeof settings.allow_store_manager_view_bonus === 'boolean') {
        setAllowStoreManagerView(settings.allow_store_manager_view_bonus)
      }
    })
    return () => { isMounted = false }
  }, [])

  const handleToggleStoreManagerView = async (newValue: boolean) => {
    setAllowStoreManagerView(newValue)
    await bscAdapter.saveSafetySettings({ allow_store_manager_view_bonus: newValue })
    onNotify(newValue 
      ? 'Đã BẬT quyền cho Quản lý cửa hàng xem Bảng thưởng & Mã VietQR!' 
      : 'Đã TẮT quyền xem Bảng thưởng & Mã VietQR của Quản lý cửa hàng!'
    )
  }

  return (
    <div className="space-y-6 animate-fade-in text-sm">
      {/* ── CÀI ĐẶT PHÂN QUYỀN: XEM BẢNG THƯỞNG & MÃ VIETQR DÀNH CHO QUẢN LÝ ── */}
      <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0 border border-amber-200">
              <ShieldCheck size={20} className="text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001D3D] flex items-center gap-2">
                <span>Phân Quyền: Xem Bảng Thưởng &amp; Mã VietQR Cho Quản Lý Cửa Hàng</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Cài Đặt Admin
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Tùy theo mô hình kinh doanh, Admin có thể quyết định cho phép hay ẩn bảng thưởng và mã thanh toán đối với Quản lý cơ sở.
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          allowStoreManagerView 
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
            : 'bg-gray-50/80 border-gray-200 text-gray-700'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                {allowStoreManagerView ? (
                  <Eye size={18} className="text-emerald-700 flex-shrink-0" />
                ) : (
                  <EyeOff size={18} className="text-gray-500 flex-shrink-0" />
                )}
                <span className="font-bold text-sm text-[#001D3D]">
                  {allowStoreManagerView 
                    ? 'Đang BẬT: Quản lý được xem Bảng thưởng & Mã VietQR' 
                    : 'Đang TẮT: Quản lý KHÔNG xem được Bảng thưởng & Mã VietQR'}
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                {allowStoreManagerView
                  ? 'Quản lý cửa hàng có thể xem danh sách nhân viên quán mình, số tiền thưởng được chia và quét mã VietQR để kiểm tra thông tin đối soát trước khi gửi CEO duyệt.'
                  : 'Quản lý cửa hàng chỉ xem Thể lệ và Form nhập quyết toán. Toàn bộ bảng chia tiền thưởng và mã VietQR sẽ được ẩn tuyệt đối (chỉ CEO / HR Admin mới được xem).'}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isCEOOrHR}
                  checked={allowStoreManagerView}
                  onChange={e => handleToggleStoreManagerView(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border ${
                allowStoreManagerView
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-gray-200 text-gray-600 border-gray-300'
              }`}>
                {allowStoreManagerView ? 'BẬT' : 'TẮT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── HỆ SỐ THƯỞNG THEO CHỨC DANH ── */}
      <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center flex-shrink-0 border border-blue-100">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001D3D]">
                Hệ Số Nhận Thưởng Theo Chức Danh (Quản Lý / Trưởng Ca / Nhân Viên)
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Quyết định tỷ lệ nhân thưởng giữa Quản Lý, Trưởng Ca và Nhân Viên</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-50 text-[#2F6FA8] border border-blue-200">
            Phân Phối Quỹ Thưởng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bscPositionMultipliersCatalog.map(pos => (
            <div key={pos.role_key} className="p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-gray-50/70 space-y-3 shadow-2xs">
              <span className="font-bold text-[#001D3D] text-sm block">{pos.role_title}</span>
              <p className="text-xs text-gray-500 line-clamp-2 font-medium">{pos.description}</p>
              <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Hệ số thưởng:</span>
                <input
                  type="number"
                  step={0.1}
                  min={0.1}
                  max={5.0}
                  disabled={!isCEOOrHR}
                  value={pos.multiplier}
                  onChange={e => {
                    updateBSCPositionMultiplier(pos.role_key, Number(e.target.value))
                    onNotify('Đã cập nhật hệ số vị trí!')
                  }}
                  className="w-16 px-2.5 py-1.5 min-h-[38px] text-center font-black rounded-xl border border-blue-300 bg-white text-[#2F6FA8] text-sm outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
