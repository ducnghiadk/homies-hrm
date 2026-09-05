'use client'

import React from 'react'
import {
  PieChart,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import {
  type ApprovalItem,
  APPROVAL_CATEGORIES,
  type ApprovalCategory,
} from '@/lib/mock-data/approvals'
import { getEmployeeById } from '@/lib/mock-data'

interface ApprovalSidebarWidgetsProps {
  items: ApprovalItem[]
  onSelectUrgentItem: (item: ApprovalItem) => void
  onFilterCategory: (cat: string) => void
}

export default function ApprovalSidebarWidgets({
  items,
  onSelectUrgentItem,
  onFilterCategory,
}: ApprovalSidebarWidgetsProps) {
  const pendingItems = items.filter(i => i.status === 'pending')
  const urgentItems = pendingItems.filter(i => i.priority === 'high')
  const recentProcessedItems = items
    .filter(i => i.status !== 'pending' && i.reviewed_at)
    .slice(0, 4)

  // Tính tỷ lệ % theo từng danh mục
  const totalPending = pendingItems.length || 1
  const categoryStats = (Object.keys(APPROVAL_CATEGORIES) as ApprovalCategory[]).map(key => {
    const count = pendingItems.filter(i => i.category === key).length
    const pct = Math.round((count / totalPending) * 100)
    return {
      key,
      ...APPROVAL_CATEGORIES[key],
      count,
      pct,
    }
  }).filter(c => c.count > 0)

  return (
    <div className="space-y-5 font-['Inter']">
      {/* WIDGET 1: CẢNH BÁO ĐƠN GẤP SLA */}
      <div className="card p-5 rounded-2xl border border-rose-200/80 bg-rose-50/40 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-rose-200/60 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={17} className="text-rose-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950">
              Đơn Cần Xử Lý Gấp ({urgentItems.length})
            </h3>
          </div>
          <span className="text-[10px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
            SLA Trong Ca
          </span>
        </div>

        {urgentItems.length === 0 ? (
          <p className="text-xs text-rose-700 font-medium py-2 text-center">
            Tuyệt vời! Không có đơn nào bị quá hạn xử lý.
          </p>
        ) : (
          <div className="space-y-2.5">
            {urgentItems.map(item => {
              const emp = getEmployeeById(item.employee_id)
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectUrgentItem(item)}
                  className="p-3 bg-white rounded-xl border border-rose-200 hover:border-rose-400 hover:shadow-2xs transition cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-bold text-gray-900 truncate">
                        {emp?.full_name || 'Nhân viên'}
                      </strong>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        GẤP
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate font-medium">{item.title}</p>
                  </div>
                  <ArrowRight size={14} className="text-rose-500 flex-shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* WIDGET 2: CƠ CẤU PHÂN BỔ LOẠI ĐƠN */}
      <div className="card p-5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <PieChart size={17} className="text-[#2F6FA8]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">
              Cơ Cấu Đơn Từ Chờ Duyệt
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-gray-500">
            {pendingItems.length} đơn
          </span>
        </div>

        <div className="space-y-3">
          {categoryStats.map(stat => (
            <div
              key={stat.key}
              onClick={() => onFilterCategory(stat.key)}
              className="space-y-1.5 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 group-hover:text-[#2F6FA8] transition">
                  {stat.label}
                </span>
                <div className="flex items-center gap-2 font-mono font-bold text-gray-800">
                  <span>{stat.count} đơn</span>
                  <span className="text-[10px] text-gray-400 font-normal">({stat.pct}%)</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${stat.pct}%`, backgroundColor: stat.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WIDGET 3: NHẬT KÝ DUYỆT GẦN ĐÂY */}
      <div className="card p-5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <History size={17} className="text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">
              Lịch Sử Xử Lý Gần Đây
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Audit Feed
          </span>
        </div>

        {recentProcessedItems.length === 0 ? (
          <p className="text-xs text-gray-400 py-2 text-center">Chưa có lịch sử thao tác gần đây.</p>
        ) : (
          <div className="space-y-3">
            {recentProcessedItems.map(item => {
              const emp = getEmployeeById(item.employee_id)
              const isApproved = item.status === 'approved'
              return (
                <div key={item.id} className="flex items-start gap-2.5 text-xs">
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {isApproved ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong className="text-gray-900 font-bold">{emp?.full_name || 'Nhân viên'}</strong>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {isApproved ? 'Đã duyệt' : 'Từ chối'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px] truncate">{item.title}</p>
                    {item.review_notes && (
                      <p className="text-[10px] text-gray-600 italic bg-gray-50 px-2 py-1 rounded border border-gray-100 mt-1">
                        &ldquo;{item.review_notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
