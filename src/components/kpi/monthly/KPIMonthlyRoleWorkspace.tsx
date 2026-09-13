'use client'

import React, { useState } from 'react'
import type {
  KpiActor,
  KpiEvaluation,
  KpiEvaluationIntegrityFlag,
  KpiMonthlyReview,
  KpiPeerManagerQueueDto,
  KpiPeerReviewerTaskDto,
  PeerResponseDraftInput,
} from '@/lib/kpi'
import { isManagerApprovalActionAvailable } from '@/lib/kpi/monthly-review-service'
import { KPIReviewTaskList } from './KPIReviewTaskList'
import { KPIPeerReviewForm } from './KPIPeerReviewForm'
import { KPIReviewerSelectionPanel } from './KPIReviewerSelectionPanel'
import { KPIReviewProgressPanel } from './KPIReviewProgressPanel'
import { KPIManagerApprovalDrawer } from './KPIManagerApprovalDrawer'
import { KPIHrIntegrityQueue } from './KPIHrIntegrityQueue'
import {
  CheckCircle2,
  FileCheck,
  Layers,
  ShieldAlert,
  Users,
} from 'lucide-react'

export interface KPIMonthlyRoleWorkspaceProps {
  actor: KpiActor
  month: string
  reviewerTasks: KpiPeerReviewerTaskDto[]
  managerQueue: KpiPeerManagerQueueDto[]
  monthlyReviews: KpiMonthlyReview[]
  evaluations: KpiEvaluation[]
  integrityFlags: KpiEvaluationIntegrityFlag[]
  employeeNames: Record<string, { name: string; position_name: string }>
  onSubmitPeer(assignmentId: string, draft: PeerResponseDraftInput): Promise<void>
  onSelectReviewers(monthlyReviewId: string, reviewerIds: string[], reason?: string): Promise<void>
  onApprove(reviewId: string): Promise<void>
  onReturn(reviewId: string, reason: string): Promise<void>
  onResolveFlag(flagId: string, status: 'dismissed' | 'confirmed', reason: string): Promise<void>
  onRevealIdentity(assignmentId: string, reason: string): Promise<{ reviewer_id: string }>
}

export function KPIMonthlyRoleWorkspace({
  actor,
  month,
  reviewerTasks,
  managerQueue,
  monthlyReviews,
  evaluations,
  integrityFlags,
  employeeNames,
  onSubmitPeer,
  onSelectReviewers,
  onApprove,
  onReturn,
  onResolveFlag,
  onRevealIdentity,
}: KPIMonthlyRoleWorkspaceProps) {
  const isEmployee = actor.role === 'employee'
  const isShiftLeader = actor.role === 'shift_leader'
  const isStoreManager = actor.role === 'store_manager'
  const isHrOrCeo = actor.role === 'hr_admin' || actor.role === 'ceo'

  // State
  const [activeTask, setActiveTask] = useState<KpiPeerReviewerTaskDto | null>(null)
  const [activeTab, setActiveTab] = useState<string>(
    isEmployee ? 'my_tasks' : isStoreManager ? 'manager_queue' : isHrOrCeo ? 'integrity_queue' : 'my_tasks'
  )
  const [approvalReview, setApprovalReview] = useState<KpiMonthlyReview | null>(null)

  return (
    <div className="space-y-6">
      {/* ROLE WORKSPACE HEADER */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6FA8] bg-[#2F6FA8]/10 px-2 py-0.5 rounded">
            Không Gian Vận Hành KPI Tháng {month}
          </span>
          <h2 className="text-base font-bold text-[#001D3D] mt-1 sm:text-lg">
            {isEmployee
              ? 'Nhiệm Vụ Góp Ý Đồng Nghiệp Ẩn Danh'
              : isShiftLeader
              ? 'Đánh Giá Ca Làm & Góp Ý Đồng Nghiệp'
              : isStoreManager
              ? 'Phân Công & Phê Duyệt KPI Cửa Hàng'
              : 'Kiểm Soát Liêm Chính & Tiến Độ Đánh Giá Toàn Chuỗi'}
          </h2>
          <p className="text-xs text-gray-500">
            Hệ thống tự động bảo vệ tính ẩn danh và bảo đảm tiêu chuẩn phân công công bằng.
          </p>
        </div>

        {/* TABS SELECTOR DÀNH CHO MANAGER / HR */}
        {!isEmployee && (
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/80 p-1">
            {(isShiftLeader || isStoreManager) && (
              <button
                type="button"
                onClick={() => setActiveTab('my_tasks')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'my_tasks'
                    ? 'bg-white text-[#001D3D] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users size={13} />
                <span>Phiếu Của Tôi ({reviewerTasks.length})</span>
              </button>
            )}

            {(isShiftLeader || isStoreManager) && (
              <button
                type="button"
                onClick={() => setActiveTab('manager_queue')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'manager_queue'
                    ? 'bg-white text-[#001D3D] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers size={13} />
                <span>Hàng Đợi Cửa Hàng ({managerQueue.length})</span>
              </button>
            )}

            {isHrOrCeo && (
              <button
                type="button"
                onClick={() => setActiveTab('integrity_queue')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'integrity_queue'
                    ? 'bg-white text-[#001D3D] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldAlert size={13} className="text-rose-600" />
                <span>Cờ Liêm Chính ({integrityFlags.filter((f) => f.status === 'open').length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* NỘI DUNG FORM CHẤM NẾU ĐANG CHỌN TASK */}
      {activeTask ? (
        <KPIPeerReviewForm
          task={activeTask}
          onSubmit={async (draft) => {
            await onSubmitPeer(activeTask.assignment_id, draft)
            setActiveTask(null)
          }}
          onCancel={() => setActiveTask(null)}
        />
      ) : (
        <>
          {/* TAB 1: PHIẾU CỦA TÔI */}
          {activeTab === 'my_tasks' && (
            <KPIReviewTaskList
              tasks={reviewerTasks}
              onSelectTask={(task) => setActiveTask(task)}
            />
          )}

          {/* TAB 2: HÀNG ĐỢI QUẢN LÝ CỬA HÀNG */}
          {activeTab === 'manager_queue' && (
            <div className="space-y-6">
              {managerQueue.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xs">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-[#001D3D]">
                    Hàng đợi đánh giá trống
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Hiện không có nhân viên nào cần duyệt chọn đồng nghiệp hoặc chờ duyệt kết quả.
                  </p>
                </div>
              ) : (
                managerQueue.map((item) => {
                  const review = monthlyReviews.find((r) => r.id === item.monthly_review_id)
                  const isAssignmentPending = review?.status === 'assignment_pending'
                  const isApprovalPending = review
                    ? isManagerApprovalActionAvailable(review)
                    : false

                  return (
                    <div key={item.monthly_review_id} className="space-y-3">
                      {/* TIẾN ĐỘ THU THẬP */}
                      <KPIReviewProgressPanel
                        progress={item.progress}
                        subjectName={item.subject.name}
                        subjectPosition={item.subject.position_name}
                      />

                      {/* CHỌN ĐỒNG NGHIỆP NẾU ĐANG CHỜ PHÂN CÔNG */}
                      {isAssignmentPending && (
                        <KPIReviewerSelectionPanel
                          subjectName={item.subject.name}
                          subjectPosition={item.subject.position_name}
                          candidates={item.candidates}
                          selectedReviewerIds={item.selected_reviewer_ids}
                          employeeNames={employeeNames}
                          onSaveSelection={async (reviewerIds, reason) => {
                            await onSelectReviewers(item.monthly_review_id, reviewerIds, reason)
                          }}
                        />
                      )}

                      {/* NÚT MỞ DRAWER DUYỆT NẾU ĐÃ CÓ ĐIỂM */}
                      {isApprovalPending && (
                        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-xs flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-[#001D3D]">
                              Đã hoàn tất thu thập phiếu cho {item.subject.name}
                            </h4>
                            <p className="text-[11px] text-gray-500">
                              Trưởng ca đã chấm xong, bạn có thể kiểm tra tổng thể và phê duyệt.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setApprovalReview(review || null)}
                            className="flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1D3E61] cursor-pointer"
                          >
                            <FileCheck size={14} />
                            <span>Duyệt Đánh Giá</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 3: HÀNG ĐỢI KIỂM SOÁT LIÊM CHÍNH (HR ADMIN & CEO) */}
          {activeTab === 'integrity_queue' && (
            <KPIHrIntegrityQueue
              flags={integrityFlags}
              onResolveFlag={onResolveFlag}
              onRevealIdentity={onRevealIdentity}
            />
          )}
        </>
      )}

      {/* APPROVAL DRAWER */}
      {approvalReview && (
        <KPIManagerApprovalDrawer
          isOpen={Boolean(approvalReview)}
          review={approvalReview}
          evaluation={evaluations.find((e) => e.id === approvalReview.evaluation_id) || null}
          subjectName={employeeNames[approvalReview.employee_id]?.name || approvalReview.employee_id}
          subjectPosition={employeeNames[approvalReview.employee_id]?.position_name || 'Nhân viên'}
          onClose={() => setApprovalReview(null)}
          onApprove={onApprove}
          onReturn={onReturn}
        />
      )}
    </div>
  )
}
