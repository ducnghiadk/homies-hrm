'use client'

import React from 'react'
import type { KpiManagerPeerProgressDto } from '@/lib/kpi'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  ShieldCheck,
  Users,
} from 'lucide-react'

export interface KPIReviewProgressPanelProps {
  progress: KpiManagerPeerProgressDto
  subjectName: string
  subjectPosition: string
}

export function KPIReviewProgressPanel({
  progress,
  subjectName,
  subjectPosition,
}: KPIReviewProgressPanelProps) {
  const {
    required_count,
    submitted_count,
    expired_count,
    replacement_active,
    enough_anonymous_sample,
  } = progress

  const isCompleted = submitted_count >= required_count

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
            <Users size={14} className="text-[#2F6FA8]" />
            <span>Tiến độ góp ý đồng nghiệp: {subjectName}</span>
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {subjectPosition} · Cố định {required_count} phiếu ẩn danh
          </p>
        </div>

        {isCompleted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 size={12} />
            Đủ 2/2 Phiếu
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
            <Clock size={12} />
            {submitted_count} / {required_count} Phiếu
          </span>
        )}
      </div>

      {/* THANH TIẾN ĐỘ */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-500 font-medium">
            Trạng thái: <strong>{isCompleted ? 'Đã hoàn tất thu thập' : 'Đang thu thập phiếu'}</strong>
          </span>
          <span className="font-mono font-bold text-[#2F6FA8]">
            {Math.round((submitted_count / required_count) * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? 'bg-emerald-600' : 'bg-[#2F6FA8]'
            }`}
            style={{ width: `${Math.min(100, (submitted_count / required_count) * 100)}%` }}
          />
        </div>
      </div>

      {/* CÁC THÔNG BÁO VẬN HÀNH */}
      {expired_count > 0 && !isCompleted && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0 text-rose-600" />
          <span>Có <strong>{expired_count} phiếu</strong> đã quá hạn nộp.</span>
        </div>
      )}

      {replacement_active && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-center gap-2">
          <Info size={14} className="shrink-0 text-amber-600" />
          <span>Đã kích hoạt đồng nghiệp dự phòng thay thế phiếu quá hạn.</span>
        </div>
      )}

      {!enough_anonymous_sample && submitted_count < required_count && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-xs text-blue-800 flex items-center gap-2">
          <ShieldCheck size={14} className="shrink-0 text-blue-600" />
          <span>Nếu không đủ 2 phiếu: 10% trọng số sẽ tự động chuyển cho Người chấm chính.</span>
        </div>
      )}
    </div>
  )
}
