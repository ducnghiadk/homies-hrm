'use client'

import React from 'react'
import type { KpiPeerReviewerTaskDto } from '@/lib/kpi'
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  Sparkles,
  Users,
} from 'lucide-react'

export interface KPIReviewTaskListProps {
  tasks: KpiPeerReviewerTaskDto[]
  onSelectTask(task: KpiPeerReviewerTaskDto): void
  activeTaskId?: string
}

export function KPIReviewTaskList({
  tasks,
  onSelectTask,
  activeTaskId,
}: KPIReviewTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="mt-3 text-sm font-bold text-[#001D3D]">
          Không có phiếu đánh giá cần thực hiện
        </h3>
        <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
          Bạn đã hoàn thành tất cả các phiếu góp ý đồng nghiệp hoặc hiện chưa có phân công mới trong tháng này.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#001D3D] uppercase tracking-wider flex items-center gap-1.5">
          <Users size={14} className="text-[#2F6FA8]" />
          <span>Phiếu góp ý đồng nghiệp được giao ({tasks.length})</span>
        </h3>
        <span className="text-[11px] text-gray-500 font-medium">
          Hoàn thành trước hạn để bảo đảm tiến độ tháng
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tasks.map((task) => {
          const isSubmitted = task.status === 'submitted'
          const isSelected = activeTaskId === task.assignment_id

          return (
            <div
              key={task.assignment_id}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition-all shadow-xs ${
                isSelected
                  ? 'border-[#2F6FA8] bg-white ring-2 ring-[#2F6FA8]/15'
                  : isSubmitted
                  ? 'border-gray-100 bg-gray-50/70'
                  : 'border-gray-100 bg-white hover:border-gray-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-md bg-[#2F6FA8]/10 px-2 py-0.5 text-[10px] font-bold text-[#2F6FA8]">
                      {task.subject.position_name}
                    </span>
                    <h4 className="mt-1 text-sm font-bold text-[#001D3D]">
                      {task.subject.name}
                    </h4>
                  </div>

                  {isSubmitted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      <CheckCircle2 size={12} />
                      Đã gửi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                      <Clock size={12} />
                      Chưa làm
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Làm chung: <strong>{task.shared_shift_count} ca</strong></span>
                  </div>
                  {task.deadline_at && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Calendar size={12} />
                      <span>Hạn: {new Date(task.deadline_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onSelectTask(task)}
                  disabled={isSubmitted}
                  className={`flex min-h-[36px] items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isSubmitted
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#001D3D] text-white'
                      : 'bg-[#2F6FA8] text-white hover:bg-[#1D3E61]'
                  }`}
                >
                  <FileEdit size={14} />
                  <span>{isSubmitted ? 'Đã hoàn thành' : isSelected ? 'Đang thực hiện' : 'Làm phiếu góp ý'}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
