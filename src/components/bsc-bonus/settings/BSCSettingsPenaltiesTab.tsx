'use client'

import React from 'react'
import { Shield, Settings, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  bscOperationErrorGroups,
  bscPersonalErrorGroups,
  bscDeductionPolicy,
  updateBSCDeductionPolicy,
  bscSafetySettings,
  updateBSCSafetySettings,
  updateBSCOperationErrorGroup,
  updateBSCPersonalErrorGroup,
} from '@/lib/mock-data-bsc'

interface BSCSettingsPenaltiesTabProps {
  opErrorGroups: typeof bscOperationErrorGroups
  setOpErrorGroups: (grps: typeof bscOperationErrorGroups) => void
  personalErrorGroups: typeof bscPersonalErrorGroups
  setPersonalErrorGroups: (grps: typeof bscPersonalErrorGroups) => void
  isCEOOrHR: boolean
  onAddOpGroup: () => void
  onDeleteOpGroup: (key: string) => void
  onAddPersonalGroup: () => void
  onDeletePersonalGroup: (key: string) => void
  onNotify: (msg: string) => void
}

export default function BSCSettingsPenaltiesTab({
  opErrorGroups,
  setOpErrorGroups,
  personalErrorGroups,
  setPersonalErrorGroups,
  isCEOOrHR,
  onAddOpGroup,
  onDeleteOpGroup,
  onAddPersonalGroup,
  onDeletePersonalGroup,
  onNotify,
}: BSCSettingsPenaltiesTabProps) {
  return (
    <div className="space-y-6 animate-fade-in text-sm font-['Inter']">
      {/* BANNER LỐI TẮT MỞ TRANG SIDEBAR CHUYÊN BIỆT */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#001D3D] text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#001D3D]">
              Trung Tâm Cài Đặt Khung Lỗi &amp; Kỷ Luật
            </h4>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Quản lý danh mục 6 nhóm lỗi vận hành &amp; kỷ luật cá nhân phục vụ tính điểm thưởng BSC
            </p>
          </div>
        </div>
        <Link
          href="/kpi/violations/settings"
          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 no-underline"
        >
          <span>Mở Cài Đặt Chi Tiết</span>
          <ArrowLeft size={14} className="rotate-180" />
        </Link>
      </div>

      {/* MA TRẬN ĐIỂM PHẠT VI PHẠM CHUẨN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lỗi Vận Hành */}
        <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Settings size={20} className="text-[#2F6FA8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">
                Điểm Phạt Lỗi Vận Hành ({opErrorGroups.length} Nhóm)
              </h3>
            </div>
            {isCEOOrHR && (
              <button
                type="button"
                onClick={onAddOpGroup}
                className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#2F6FA8] text-white text-xs font-bold hover:bg-[#1D3E61] transition flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus size={14} /> Thêm Nhóm Lỗi
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs" style={{ scrollbarWidth: 'thin' }}>
            {opErrorGroups.map((grp) => (
              <div key={grp.key} className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/70 flex items-center justify-between gap-3 relative group">
                <div className="space-y-0.5 flex-1 pr-4">
                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <span>{grp.name}</span>
                    {grp.is_critical && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded border border-rose-200">
                        KHÓA 0đ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{grp.examples[0]}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-700 font-semibold">Trừ:</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    disabled={!isCEOOrHR}
                    value={grp.points}
                    onChange={e => {
                      updateBSCOperationErrorGroup(grp.key, { points: Number(e.target.value) })
                      setOpErrorGroups([...bscOperationErrorGroups])
                      onNotify('Đã cập nhật khung điểm phạt!')
                    }}
                    className="w-14 px-2 py-1.5 text-center font-black rounded-lg border border-amber-300 bg-white text-amber-900 outline-none focus:border-[#2F6FA8] disabled:opacity-60 text-xs font-mono tabular-nums"
                  />
                  <span className="text-xs text-gray-700 font-semibold">đ/lỗi</span>

                  {isCEOOrHR && (
                    <button
                      type="button"
                      onClick={() => onDeleteOpGroup(grp.key)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Xóa nhóm lỗi này"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lỗi Cá Nhân */}
        <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Shield size={20} className="text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">
                Điểm Phạt Lỗi Cá Nhân ({personalErrorGroups.length} Nhóm)
              </h3>
            </div>
            {isCEOOrHR && (
              <button
                type="button"
                onClick={onAddPersonalGroup}
                className="px-3.5 py-2 min-h-[40px] rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus size={14} /> Thêm Nhóm Lỗi
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs" style={{ scrollbarWidth: 'thin' }}>
            {personalErrorGroups.map((grp) => (
              <div key={grp.key} className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/70 flex items-center justify-between gap-3 relative group">
                <div className="space-y-0.5 flex-1 pr-4">
                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <span>{grp.name}</span>
                    {grp.is_serious && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded border border-rose-200">
                        KHÓA 0đ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{grp.examples[0]}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-700 font-semibold">Trừ:</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    disabled={!isCEOOrHR}
                    value={grp.points}
                    onChange={e => {
                      updateBSCPersonalErrorGroup(grp.key, { points: Number(e.target.value) })
                      setPersonalErrorGroups([...bscPersonalErrorGroups])
                      onNotify('Đã cập nhật khung điểm phạt!')
                    }}
                    className="w-14 px-2 py-1.5 text-center font-black rounded-lg border border-rose-300 bg-white text-rose-900 outline-none focus:border-[#2F6FA8] disabled:opacity-60 text-xs font-mono tabular-nums"
                  />
                  <span className="text-xs text-gray-700 font-semibold">điểm</span>

                  {isCEOOrHR && (
                    <button
                      type="button"
                      onClick={() => onDeletePersonalGroup(grp.key)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Xóa nhóm lỗi này"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <Settings size={20} className="text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-[#001D3D]">
                Chính Sách Trừ Điểm Lỗi Cá Nhân &amp; Xử Lý Tiền Thưởng Dư
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Cấu hình mức phạt % tiền thưởng cho mỗi điểm lỗi và chính sách tiền dư</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            Kiểm Soát Quỹ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-4 rounded-2xl border border-gray-200/80 bg-gray-50/70 space-y-2">
            <label className="font-bold text-gray-900 text-xs block">Tỷ Lệ Giảm Thưởng Cho Mỗi Điểm Lỗi Cá Nhân (%)</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={50}
                disabled={!isCEOOrHR}
                value={bscDeductionPolicy.penalty_pct_per_error_point}
                onChange={e => {
                  updateBSCDeductionPolicy({ penalty_pct_per_error_point: Number(e.target.value) })
                  onNotify('Đã cập nhật tỷ lệ phạt điểm lỗi!')
                }}
                className="w-full pl-3 pr-8 py-2 min-h-[44px] rounded-xl border border-amber-300 bg-amber-50/40 font-black text-amber-900 text-sm outline-none font-mono tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-amber-700 text-xs">%/điểm</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">Ví dụ: 5%/lỗi → Vi phạm 2 điểm lỗi sẽ giảm 10% tiền thưởng</span>
          </div>

          <div className="p-4 rounded-2xl border border-gray-200/80 bg-gray-50/70 space-y-2">
            <label className="font-bold text-gray-900 text-xs block">Chế Độ Xử Lý Phần Tiền Thưởng Dư (Do Trừ Phạt)</label>
            <select
              disabled={!isCEOOrHR}
              value={bscDeductionPolicy.unallocated_pool_mode}
              onChange={e => {
                updateBSCDeductionPolicy({ unallocated_pool_mode: e.target.value as 'retain_company' | 'redistribute_top_performers' })
                onNotify('Đã cập nhật chế độ xử lý tiền dư!')
              }}
              className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-gray-200 bg-white font-bold text-gray-900 text-xs outline-none cursor-pointer"
            >
              <option value="retain_company">Giữ lại sung Quỹ Doanh Nghiệp (Mặc định)</option>
              <option value="redistribute_top_performers">Tái phân phối cho Nhân viên Xuất Sắc trong tháng</option>
            </select>
            <span className="text-xs text-gray-500 font-medium">Cho phép CEO chọn giữ lại tiền thưởng thừa hay thưởng thêm cho TOP nhân viên</span>
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Shield size={20} className="text-rose-600" />
            <div>
              <h3 className="text-sm font-bold text-[#001D3D]">
                Cài Đặt Khóa An Toàn &amp; Quy Tắc Bảo Vệ Dòng Tiền Công Ty
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Tự động khóa 0 điểm khi vi phạm lỗi đặc biệt hoặc doanh thu dưới mốc hòa vốn</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            Khóa An Toàn Dòng Tiền
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Rule 1 */}
          <div className="p-4 rounded-2xl border border-rose-200/80 bg-rose-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-950 text-xs">Khóa 0đ Doanh Thu Khi Thấp Hơn Hòa Vốn</span>
              <input
                type="checkbox"
                disabled={!isCEOOrHR}
                checked={bscSafetySettings.lock_bonus_if_below_profit_threshold}
                onChange={e => {
                  updateBSCSafetySettings({ lock_bonus_if_below_profit_threshold: e.target.checked })
                  onNotify('Đã cập nhật quy tắc khóa mốc hòa vốn!')
                }}
                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-rose-900 font-medium">Nếu Doanh Thu Thực Tế &lt; Mốc Hòa Vốn (6.5tr/ngày) → Tiêu chí Doanh Thu = 0đ &amp; Khóa Quỹ Thưởng = 0đ.</p>
          </div>

          {/* Rule 2 */}
          <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 text-xs">Khóa 0đ Vận Hành Khi Có Lỗi Nghiêm Trọng</span>
              <input
                type="checkbox"
                disabled={!isCEOOrHR}
                checked={bscSafetySettings.zero_score_on_critical_op_error}
                onChange={e => {
                  updateBSCSafetySettings({ zero_score_on_critical_op_error: e.target.checked })
                  onNotify('Đã cập nhật quy tắc lỗi nghiêm trọng!')
                }}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-amber-900 font-medium">Nếu phát sinh 01 Lỗi Đặc Biệt Nghiêm Trọng (Ngộ độc, Cháy nổ, Đình chỉ) → Tiêu chí Vận Hành Ca tự động = 0 điểm.</p>
          </div>

          {/* Rule 3 */}
          <div className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 text-xs">Bảo Vệ Điểm Khách Hàng (100% QR)</span>
              <input
                type="checkbox"
                disabled={!isCEOOrHR}
                checked={bscSafetySettings.fallback_qr_only_if_no_review}
                onChange={e => {
                  updateBSCSafetySettings({ fallback_qr_only_if_no_review: e.target.checked })
                  onNotify('Đã cập nhật quy tắc bảo vệ điểm Khách hàng!')
                }}
                className="w-4 h-4 text-[#2F6FA8] rounded focus:ring-[#2F6FA8] cursor-pointer"
              />
            </div>
            <p className="text-xs text-blue-900 font-medium">Nếu tháng đó không có bài đánh giá phản ánh trực tiếp → Tự lấy 100% điểm QR Feedback, không bị chia đôi trừ điểm oan.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
