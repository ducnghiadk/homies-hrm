'use client'

import React from 'react'
import {
  Calendar,
  Smile,
  Zap,
  AlertTriangle,
  FileText,
  Edit3,
  Trash2,
  CheckCircle2,
  Plus,
  HelpCircle,
  Clock,
  User,
  Users,
  ShieldAlert,
} from 'lucide-react'
import type { KPICategory, EvaluatorRole } from '@/lib/kpi-types'

interface KPICategoryTableProps {
  categories: KPICategory[]
  totalWeight: number
  isWeightValid: boolean
  onEdit: (category: KPICategory) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
  onAddNew: () => void
}

const evaluatorLabels: Record<EvaluatorRole, string> = {
  self: 'Tự đánh giá',
  mentor: 'Người hướng dẫn',
  senior: 'Senior',
  leader: 'Ca trưởng',
  manager: 'Quản lý cửa hàng',
  ceo: 'CEO / Ban Giám Đốc',
  peer: 'Đồng nghiệp',
}

export default function KPICategoryTable({
  categories,
  totalWeight,
  isWeightValid,
  onEdit,
  onDelete,
  onToggle,
  onAddNew,
}: KPICategoryTableProps) {
  const getCategoryIcon = (name: string, type: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('chuyên cần') || lower.includes('đi làm')) return <Calendar size={16} className="text-[#2F6FA8]" />
    if (lower.includes('thái độ') || lower.includes('tác phong')) return <Smile size={16} className="text-emerald-600" />
    if (lower.includes('năng lực') || lower.includes('chuyên môn')) return <Zap size={16} className="text-amber-600" />
    if (lower.includes('lỗi') || lower.includes('vi phạm') || type === 'deduction') return <ShieldAlert size={16} className="text-rose-600" />
    if (lower.includes('quản lý') || lower.includes('team')) return <Users size={16} className="text-indigo-600" />
    return <FileText size={16} className="text-gray-600" />
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'auto':
        return {
          label: 'Tự động tính (Hệ thống)',
          class: 'bg-blue-50 text-[#2F6FA8] border-blue-200',
        }
      case 'manual':
        return {
          label: 'Thủ công (Chấm điểm)',
          class: 'bg-amber-50 text-amber-800 border-amber-200',
        }
      case 'deduction':
        return {
          label: 'Khấu trừ (Trừ điểm)',
          class: 'bg-rose-50 text-rose-700 border-rose-200',
        }
      default:
        return {
          label: 'Mặc định',
          class: 'bg-gray-50 text-gray-700 border-gray-200',
        }
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col w-full">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50/50">
        <div>
          <h3 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
            <span>Danh Sách Khía Cạnh Đánh Giá</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2F6FA8] border border-blue-200 font-mono">
              {categories.length} mục
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Cấu hình tỷ trọng % và phương thức thu thập điểm số cho từng nhóm nhân sự.
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="px-3.5 py-1.5 min-h-[36px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition shrink-0"
        >
          <Plus size={14} />
          <span>Thêm Khía Cạnh Mới</span>
        </button>
      </div>

      {/* Structured Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-100">
              <th className="py-3 px-3 text-center w-12 text-gray-400">#</th>
              <th className="py-3 px-4 text-[#001D3D]">Khía Cạnh Đánh Giá</th>
              <th className="py-3 px-3">Phương Thức Thu Thập</th>
              <th className="py-3 px-3 text-center">Trọng Số (%)</th>
              <th className="py-3 px-4">Đối Tượng Chấm Điểm</th>
              <th className="py-3 px-3 text-center">Kích Hoạt</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">
                  Chưa có khía cạnh đánh giá nào trong Option này.
                </td>
              </tr>
            ) : (
              categories.map((cat, idx) => {
                const typeInfo = getTypeBadge(cat.type)

                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-blue-50/20 transition-all group"
                  >
                    {/* Cột 1: STT */}
                    <td className="py-3 px-3 text-center font-mono text-gray-400 font-bold">
                      {idx + 1}
                    </td>

                    {/* Cột 2: Tên khía cạnh */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `${cat.color || '#2F6FA8'}10`,
                            borderColor: `${cat.color || '#2F6FA8'}30`,
                          }}
                        >
                          {getCategoryIcon(cat.name, cat.type)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-[#2F6FA8] transition">
                            {cat.name}
                          </div>
                          {cat.name_en && (
                            <div className="text-[11px] text-gray-400 font-medium">
                              {cat.name_en}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cột 3: Loại đánh giá */}
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${typeInfo.class}`}>
                        {typeInfo.label}
                      </span>
                    </td>

                    {/* Cột 4: Trọng số % */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold tabular-nums text-sm text-[#001D3D] bg-gray-50 px-2.5 py-0.5 rounded-lg border border-gray-200">
                        {cat.weight}%
                      </span>
                    </td>

                    {/* Cột 5: Người đánh giá */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {cat.evaluators.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-semibold border border-gray-200/60"
                          >
                            {evaluatorLabels[role] || role}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Cột 6: Toggle Kích hoạt */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggle(cat.id, !cat.is_active)}
                        className={`w-9 h-5 rounded-full transition-colors relative inline-block cursor-pointer ${
                          cat.is_active ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                            cat.is_active ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Cột 7: Thao tác */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(cat)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#2F6FA8] hover:text-white text-gray-700 font-bold text-[11px] transition flex items-center gap-1"
                        >
                          <Edit3 size={11} />
                          <span>Sửa</span>
                        </button>
                        <button
                          onClick={() => onDelete(cat.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-[11px] border border-rose-100 transition flex items-center gap-1"
                        >
                          <Trash2 size={11} />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Weight Validation */}
      <div className="p-3.5 border-t border-gray-100 bg-gray-50/70 text-xs text-gray-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-700">Tổng trọng số cấu hình:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full font-mono font-bold tabular-nums text-xs border flex items-center gap-1.5 ${
              isWeightValid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isWeightValid ? <CheckCircle2 size={13} className="text-emerald-600" /> : <AlertTriangle size={13} className="text-rose-600" />}
            {totalWeight}% {isWeightValid ? '(Hợp lệ = 100%)' : '(Chưa hợp lệ: bắt buộc = 100%)'}
          </span>
        </div>

        <div className="text-[11px] text-gray-400 font-medium">
          Mỗi Option phải có tổng trọng số các khía cạnh đúng 100% để công thức tính điểm chính xác.
        </div>
      </div>
    </div>
  )
}
