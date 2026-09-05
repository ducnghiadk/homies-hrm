'use client'

import React from 'react'
import type { ViolationRecord } from '@/lib/kpi-types'
import { mockViolationTypes } from '@/lib/mock-data-kpi'
import { canAppeal, getAppealDeadline } from '@/lib/violation-service'
import {
  Clock,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

interface Props {
  record: ViolationRecord
  showActions?: boolean
  onAcknowledge?: (id: string) => void
  onAppeal?: (id: string) => void
  expanded?: boolean
  onToggleExpand?: () => void
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:          { label: 'Chờ xác nhận',  bg: 'bg-amber-50', color: 'text-amber-800', border: 'border-amber-200' },
  acknowledged:     { label: 'Đã xác nhận',   bg: 'bg-blue-50', color: 'text-blue-800', border: 'border-blue-200' },
  appealed:         { label: 'Đang khiếu nại', bg: 'bg-purple-50', color: 'text-purple-800', border: 'border-purple-200' },
  appeal_approved:  { label: 'Chấp nhận KN (Hoàn điểm)',  bg: 'bg-emerald-50', color: 'text-emerald-800', border: 'border-emerald-200' },
  appeal_rejected:  { label: 'Từ chối KN',    bg: 'bg-rose-50', color: 'text-rose-800', border: 'border-rose-200' },
  finalized:        { label: 'Hoàn tất',      bg: 'bg-gray-100', color: 'text-gray-700', border: 'border-gray-200' },
}

const SEV_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  minor:    { label: 'Nhẹ',           bg: 'bg-blue-50', color: 'text-blue-800', border: 'border-blue-200' },
  medium:   { label: 'Trung bình',    bg: 'bg-amber-50', color: 'text-amber-800', border: 'border-amber-200' },
  major:    { label: 'Nặng',          bg: 'bg-orange-50', color: 'text-orange-800', border: 'border-orange-200' },
  critical: { label: 'Nghiêm trọng (Khóa thưởng)',  bg: 'bg-rose-50', color: 'text-rose-800', border: 'border-rose-200' },
}

export default function ViolationCard({
  record,
  showActions = false,
  onAcknowledge,
  onAppeal,
  expanded = false,
  onToggleExpand,
}: Props) {
  const vType = mockViolationTypes.find(v => v.id === record.violation_type_id)
  const sev = vType ? SEV_CONFIG[vType.severity] : SEV_CONFIG.minor
  const sts = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending
  const appealable = canAppeal(record)
  const deadline = getAppealDeadline(record)
  const hoursLeft = Math.max(0, Math.round((deadline.getTime() - new Date().getTime()) / 3600000))

  // Calculate BSC Bonus impact percentage
  const bscBonusImpactPct = record.penalty_points >= 20 ? 15 : record.penalty_points >= 10 ? 10 : 5

  return (
    <div className="card p-4 rounded-2xl border border-gray-200/80 bg-white shadow-2xs space-y-3 font-['Inter'] hover:border-[#2F6FA8]/40 transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
              {vType?.code || 'ERR'}
            </span>
            <span className="text-xs font-bold text-[#001D3D] truncate">{vType?.name || 'Lỗi quy trình'}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.bg} ${sev.color} ${sev.border}`}>
              {sev.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sts.bg} ${sts.color} ${sts.border}`}>
              {sts.label}
            </span>
            <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
              <Clock size={11} className="text-gray-400" />
              {new Date(record.occurred_at).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>

        {/* Dual Impact Badge (KPI + BSC Bonus) */}
        <div className="text-right flex-shrink-0 space-y-0.5">
          <div className="text-sm font-black text-rose-600 font-mono">
            -{record.penalty_points}đ KPI
          </div>
          <div className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            -{bscBonusImpactPct}% Thưởng BSC
          </div>
        </div>
      </div>

      {/* Description Preview */}
      <div className="text-xs text-gray-700 font-medium line-clamp-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
        <span className="font-bold text-gray-900">Mô tả hành vi:</span> {record.description}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs animate-fade-in">
          {record.evidence_url && (
            <div className="flex items-center gap-1.5 text-xs text-[#2F6FA8] font-bold bg-blue-50/50 p-2 rounded-xl border border-blue-100">
              <Paperclip size={14} />
              <span>Có biên bản / hình ảnh bằng chứng đính kèm</span>
            </div>
          )}

          {record.employee_response && (
            <div className="p-2.5 rounded-xl bg-blue-50/40 border border-blue-100 text-xs text-blue-950">
              <span className="font-bold text-blue-900">Phản hồi của nhân viên:</span> {record.employee_response}
            </div>
          )}

          {record.appeal_reason && (
            <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs text-purple-950">
              <div className="flex items-center gap-1.5 font-bold text-purple-900 mb-1">
                <MessageSquare size={13} />
                <span>Nội dung khiếu nại của nhân viên:</span>
              </div>
              <p className="font-medium text-purple-900">{record.appeal_reason}</p>
            </div>
          )}

          {record.appeal_decision && (
            <div className={`p-2.5 rounded-xl border text-xs ${
              record.status === 'appeal_approved'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {record.status === 'appeal_approved' ? <Sparkles size={13} className="text-emerald-700" /> : <AlertCircle size={13} className="text-rose-700" />}
                <span>Quyết định xét duyệt của CEO/Quản lý:</span>
              </div>
              <p className="font-medium">{record.appeal_decision}</p>
            </div>
          )}

          {appealable && hoursLeft > 0 && (
            <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <Clock size={13} className="text-amber-700" />
              <span>Thời hạn còn lại để gửi khiếu nại: <strong>{hoursLeft} giờ</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Actions for Employee */}
      {showActions && (record.status === 'pending' || record.status === 'acknowledged') && (
        <div className="flex gap-2 pt-1 border-t border-gray-100">
          {record.status === 'pending' && (
            <button
              type="button"
              onClick={() => onAcknowledge?.(record.id)}
              className="flex-1 py-2 min-h-[36px] rounded-xl text-xs font-bold text-white bg-[#2F6FA8] hover:bg-[#1D3E61] transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>Xác Nhận Nhận Lỗi</span>
            </button>
          )}

          {appealable && (
            <button
              type="button"
              onClick={() => onAppeal?.(record.id)}
              className="flex-1 py-2 min-h-[36px] rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Gửi Khiếu Nại</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
