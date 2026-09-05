'use client'

import React, { useState } from 'react'
import {
  Rocket,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Save,
  Plus,
  Trash2,
  Edit2,
  Sliders,
  DollarSign,
} from 'lucide-react'
import type { BSCRoadmapMilestone } from '@/lib/bsc-types'
import {
  mockBSCRoadmapMilestones,
  updateBSCRoadmapMilestone,
  addBSCRoadmapMilestone,
  deleteBSCRoadmapMilestone,
} from '@/lib/mock-data-bsc'

interface BSCSettingsRoadmapTabProps {
  onNotify: (msg: string) => void
}

export default function BSCSettingsRoadmapTab({ onNotify }: BSCSettingsRoadmapTabProps) {
  const [milestones, setMilestones] = useState<BSCRoadmapMilestone[]>([...mockBSCRoadmapMilestones])
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)

  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<BSCRoadmapMilestone>>({})

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  const handleStartEdit = (m: BSCRoadmapMilestone) => {
    setEditingMilestoneId(m.id)
    setEditForm({ ...m })
  }

  const handleSaveEdit = () => {
    if (!editingMilestoneId) return
    const updated = milestones.map(m => (m.id === editingMilestoneId ? { ...m, ...editForm } as BSCRoadmapMilestone : m))
    setMilestones(updated)
    updateBSCRoadmapMilestone(editingMilestoneId, editForm)
    setEditingMilestoneId(null)
    onNotify('Đã cập nhật mốc lộ trình BSC thành công!')
  }

  const handleSetActive = (id: string) => {
    const updated = milestones.map(m => ({
      ...m,
      status: m.id === id ? ('active' as const) : m.phase_number < (milestones.find(x => x.id === id)?.phase_number || 0) ? ('completed' as const) : ('upcoming' as const),
    }))
    setMilestones(updated)
    updated.forEach(m => updateBSCRoadmapMilestone(m.id, { status: m.status }))
    onNotify('Đã kích hoạt giai đoạn lộ trình áp dụng!')
  }

  const handleAddNewMilestone = () => {
    const nextPhase = milestones.length + 1
    const newM: BSCRoadmapMilestone = {
      id: `mile-${Date.now()}`,
      phase_number: nextPhase,
      phase_name: `Giai đoạn ${nextPhase}: Mở Rộng & Nâng Cấp`,
      applied_month: `2026-1${nextPhase}`,
      month_label: `Tháng 1${nextPhase}/2026`,
      target_revenue_rate_pct: 100,
      profit_threshold_daily: 6500000,
      penalty_leniency_pct: 0,
      exempt_minor_errors: false,
      bonus_pool_boost_pct: 0,
      title_badge: `Giai đoạn ${nextPhase}`,
      staff_impact_summary: 'Duy trì hiệu suất cao và chuẩn hóa dịch vụ chuỗi.',
      description: 'Giai đoạn phát triển tiếp theo của hệ thống BSC.',
      status: 'upcoming',
    }
    const updated = [...milestones, newM]
    setMilestones(updated)
    addBSCRoadmapMilestone(newM)
    setEditingMilestoneId(newM.id)
    setEditForm(newM)
    onNotify('Đã thêm mốc lộ trình mới!')
  }

  const handleDelete = (id: string) => {
    if (milestones.length <= 1) {
      alert('Hệ thống cần ít nhất 1 mốc lộ trình!')
      return
    }
    const updated = milestones.filter(m => m.id !== id)
    setMilestones(updated)
    deleteBSCRoadmapMilestone(id)
    if (editingMilestoneId === id) setEditingMilestoneId(null)
    onNotify('Đã xóa mốc lộ trình!')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── HEADER GIỚI THIỆU LỘ TRÌNH ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-200/80 mt-0.5 sm:mt-0">
              <Rocket size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001D3D] flex items-center gap-2">
                <span>Cài Đặt Lộ Trình Triển Khai BSC Từng Tháng</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                  Phân Kỳ 3 Bước
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Thiết lập mức nới lỏng mốc hòa vốn, % target và chính sách giảm trừ điểm phạt theo từng tháng giúp nhân sự tuyến đầu dễ dàng thích nghi, tránh bị ngợp.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddNewMilestone}
            className="px-4 py-2 min-h-[38px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus size={14} />
            <span>+ Thêm Mốc Tháng Mới</span>
          </button>
        </div>

        {/* Thẻ gợi ý triết lý vận hành */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/80 via-blue-50/40 to-emerald-50/60 border border-amber-200/70 flex items-start gap-3">
          <Sparkles size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 leading-relaxed">
            <strong className="text-amber-950">Triết lý vận hành Homies:</strong> Trong 1–2 tháng đầu tiên áp dụng BSC, hãy nới lỏng mốc hòa vốn (6.0tr/ngày) và giảm 50% điểm trừ lỗi để nhân viên thấy được kết quả thưởng thực tế. Khi toàn đội đã quen với quy chế, tiến hành nâng chuẩn 100% để tối ưu lợi nhuận.
          </div>
        </div>
      </div>

      {/* ── TIMELINE ROADMAP CÁC GIAI ĐOẠN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {milestones.map(m => {
          const isActive = m.status === 'active'
          const isCompleted = m.status === 'completed'

          return (
            <div
              key={m.id}
              className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'border-[#2F6FA8] bg-white shadow-md ring-2 ring-[#2F6FA8]/15'
                  : isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Header Card */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                      isActive ? 'bg-[#2F6FA8] text-white' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {m.phase_number}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
                      {m.month_label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-100 text-[#2F6FA8] border border-blue-200 font-mono animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {isActive ? '● Đang Áp Dụng' : isCompleted ? '✓ Đã Hoàn Tất' : '○ Sắp Diễn Ra'}
                    </span>
                  </div>
                </div>

                {/* Tên giai đoạn */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#001D3D]">{m.phase_name}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">{m.description}</p>
                </div>

                {/* Dải 4 Thông Số Trọng Tâm Của Giai Đoạn */}
                <div className="space-y-2.5 pt-2">
                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald-600" />
                      <span>Mốc Hòa Vốn (Ngày):</span>
                    </span>
                    <strong className="text-gray-900 font-mono font-bold">
                      {formatVnd(m.profit_threshold_daily)}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-[#2F6FA8]" />
                      <span>Chỉ Tiêu Target Doanh Thu:</span>
                    </span>
                    <strong className="text-[#2F6FA8] font-mono font-bold">
                      {m.target_mode === 'fixed_daily'
                        ? `${formatVnd(m.target_revenue_daily_fixed || 7200000)}/ngày`
                        : `${m.target_revenue_rate_pct || 100}% Target`}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-amber-600" />
                      <span>Chính Sách Giảm Trừ Lỗi:</span>
                    </span>
                    <strong className="text-amber-800 font-mono font-bold">
                      {m.penalty_leniency_pct > 0 ? `Giảm ${m.penalty_leniency_pct}% điểm phạt` : 'Áp dụng 100% chuẩn'}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-indigo-600" />
                      <span>Miễn Trừ Lỗi Nhỏ Ca (&lt;15p):</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      m.exempt_minor_errors ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {m.exempt_minor_errors ? 'Có miễn trừ' : 'Không'}
                    </span>
                  </div>
                </div>

                {/* Thẻ Tóm Tắt Tác Động Lên Nhân Sự */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100/80 space-y-1">
                  <div className="text-[11px] font-bold text-[#001D3D] flex items-center gap-1">
                    <Sparkles size={12} className="text-[#2F6FA8]" />
                    <span>Tác động lên nhân sự:</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                    {m.staff_impact_summary}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50/60 border-t border-gray-100 rounded-b-2xl flex items-center justify-between gap-2">
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => handleSetActive(m.id)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-[#001D3D] text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    Kích Hoạt Giai Đoạn Này
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(m)}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                    title="Chỉnh sửa tham số giai đoạn"
                  >
                    <Edit2 size={13} className="text-[#2F6FA8]" />
                    <span>Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded-xl bg-white hover:bg-rose-50 border border-gray-200 text-gray-400 hover:text-rose-600 text-xs transition shadow-2xs cursor-pointer"
                    title="Xóa mốc"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── MODAL CHỈNH SỬA THAM SỐ GIAI ĐOẠN ── */}
      {editingMilestoneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#2F6FA8]" />
                <h4 className="text-sm font-bold text-[#001D3D]">
                  Chỉnh Sửa Tham Số: {editForm.phase_name || 'Giai đoạn'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingMilestoneId(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              {/* Tên & Tháng */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-700 font-bold">Tên Giai Đoạn</label>
                  <input
                    type="text"
                    value={editForm.phase_name || ''}
                    onChange={e => setEditForm({ ...editForm, phase_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2F6FA8] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 font-bold">Tháng Áp Dụng</label>
                  <input
                    type="text"
                    value={editForm.month_label || ''}
                    onChange={e => setEditForm({ ...editForm, month_label: e.target.value })}
                    placeholder="VD: Tháng 07/2026"
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2F6FA8] focus:outline-none"
                  />
                </div>
              </div>

              {/* Mốc hòa vốn */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-gray-700 font-bold">Mốc Hòa Vốn Mở Quỹ Thưởng (VNĐ/ngày)</label>
                  <span className="text-[11px] text-gray-500 font-mono">
                    ~{formatVnd((editForm.profit_threshold_daily || 6000000) * 31)}/tháng
                  </span>
                </div>
                <input
                  type="number"
                  step={100000}
                  value={editForm.profit_threshold_daily || 6000000}
                  onChange={e => setEditForm({ ...editForm, profit_threshold_daily: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2F6FA8] focus:outline-none font-mono font-bold"
                />
              </div>

              {/* PHÂN KHU TÙY CHỌN CHẾ ĐỘ TARGET: % TỶ LỆ HOẶC SỐ TIỀN CỐ ĐỊNH */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-gray-900 font-bold flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-[#2F6FA8]" />
                    <span>Chỉ Tiêu Target Áp Dụng</span>
                  </label>
                  <span className="text-[11px] text-gray-500">Chọn % hoặc Số tiền</span>
                </div>

                {/* 2 Nút Toggle Chế Độ */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-200/70 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, target_mode: 'percent' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                      (editForm.target_mode || 'percent') === 'percent'
                        ? 'bg-white text-[#2F6FA8] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    % Theo Tỷ Lệ Target
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, target_mode: 'fixed_daily' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                      editForm.target_mode === 'fixed_daily'
                        ? 'bg-white text-[#2F6FA8] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    💵 Số Tiền Cụ Thể (VNĐ)
                  </button>
                </div>

                {/* Dynamic Input tương ứng */}
                {(editForm.target_mode || 'percent') === 'percent' ? (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-600">
                      <span>Tỷ lệ % Target cơ bản áp dụng:</span>
                      <strong className="text-[#2F6FA8] font-mono">{editForm.target_revenue_rate_pct || 90}%</strong>
                    </div>
                    <input
                      type="number"
                      min={50}
                      max={150}
                      value={editForm.target_revenue_rate_pct || 90}
                      onChange={e => setEditForm({ ...editForm, target_revenue_rate_pct: Number(e.target.value) })}
                      placeholder="VD: 90"
                      className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#2F6FA8] focus:outline-none font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-600">
                      <span>Số tiền Target cố định mỗi ngày (VNĐ/ngày):</span>
                      <strong className="text-[#2F6FA8] font-mono">
                        ~{formatVnd((editForm.target_revenue_daily_fixed || 7200000) * 31)}/tháng
                      </strong>
                    </div>
                    <input
                      type="number"
                      step={100000}
                      value={editForm.target_revenue_daily_fixed || 7200000}
                      onChange={e => setEditForm({ ...editForm, target_revenue_daily_fixed: Number(e.target.value) })}
                      placeholder="VD: 7200000"
                      className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#2F6FA8] focus:outline-none font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Giảm trừ điểm lỗi & Miễn trừ lỗi nhỏ */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-700 font-bold">Nới Lỏng Điểm Lỗi (% giảm)</label>
                  <input
                    type="number"
                    value={editForm.penalty_leniency_pct || 0}
                    onChange={e => setEditForm({ ...editForm, penalty_leniency_pct: Number(e.target.value) })}
                    placeholder="VD: 50 (giảm 50% phạt)"
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2F6FA8] focus:outline-none font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 font-bold">Miễn Lỗi Nhỏ &lt;15p</label>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.exempt_minor_errors || false}
                        onChange={e => setEditForm({ ...editForm, exempt_minor_errors: e.target.checked })}
                        className="rounded text-[#2F6FA8] w-4 h-4"
                      />
                      <span className="text-gray-700 text-xs">Cho phép miễn trừ lỗi nhỏ</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Mô tả tác động nhân sự */}
              <div className="space-y-1">
                <label className="text-gray-700 font-bold">Tóm Tắt Tác Động Lên Nhân Sự</label>
                <textarea
                  rows={2}
                  value={editForm.staff_impact_summary || ''}
                  onChange={e => setEditForm({ ...editForm, staff_impact_summary: e.target.value })}
                  placeholder="Mô tả ngắn gọn chính sách hỗ trợ nhân sự trong tháng này..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2F6FA8] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingMilestoneId(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save size={14} />
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
