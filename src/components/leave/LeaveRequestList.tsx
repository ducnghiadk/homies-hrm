'use client'

import { useState, useMemo } from 'react'
import { LEAVE_TYPES, STATUS_CONFIG } from '@/lib/mock-data-leave'
import type { LeaveRequest, LeaveStatus, LeaveType, LeaveFilter } from '@/lib/mock-data-leave'
import LeaveRequestCard from './LeaveRequestCard'
import { EmptyState, SkeletonCard } from '@/components/ui'
import { Search, SlidersHorizontal, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaveRequestListProps {
  requests: LeaveRequest[]
  viewMode?: 'employee' | 'manager' | 'readonly'
  isLoading?: boolean
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onCancel?: (id: string) => void
  onRequestInfo?: (id: string) => void
  emptyMessage?: string
  emptyAction?: { label: string; onClick: () => void }
}

const STATUS_TABS: { key: LeaveStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
]

export default function LeaveRequestList({
  requests,
  viewMode = 'employee',
  isLoading,
  onApprove,
  onReject,
  onCancel,
  onRequestInfo,
  emptyMessage = 'Chưa có đơn nghỉ nào',
  emptyAction,
}: LeaveRequestListProps) {
  const [filter, setFilter] = useState<LeaveFilter>({})
  const [statusTab, setStatusTab] = useState<LeaveStatus | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedType, setSelectedType] = useState<LeaveType | 'all'>('all')

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...requests]

    if (statusTab !== 'all') {
      result = result.filter(r => r.status === statusTab)
    }

    if (selectedType !== 'all') {
      result = result.filter(r => r.leave_type === selectedType)
    }

    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase()
      result = result.filter(r =>
        r.employee_name.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.leave_type_label.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    }

    // Sort: pending first, then by date descending
    result.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [requests, statusTab, selectedType, filter.searchQuery])

  // Counts per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: requests.length }
    for (const r of requests) {
      counts[r.status] = (counts[r.status] || 0) + 1
    }
    return counts
  }, [requests])

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <SkeletonCard key={i} variant="card" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* ── Status tabs (pill style matching dashboard) ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_TABS.map(tab => {
          const count = statusCounts[tab.key] || 0
          const isActive = statusTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={cn(
                'flex-shrink-0 text-xs px-3 py-2 rounded-full font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-vanilla-50 text-gray-500 hover:bg-primary-50',
              )}
            >
              {tab.label}
              <span className={cn(
                'ml-1 font-numeric',
                isActive ? 'text-white/80' : 'text-gray-400',
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search + filter toggle ── */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, lý do..."
            value={filter.searchQuery || ''}
            onChange={e => setFilter(f => ({ ...f, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-primary-50 text-sm
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500
              transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(p => !p)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
            showFilters || selectedType !== 'all'
              ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-200'
              : 'bg-primary-50 text-gray-500 hover:bg-gray-200',
          )}
        >
          <SlidersHorizontal size={14} />
          Lọc
        </button>
      </div>

      {/* ── Type filter chips ── */}
      {showFilters && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide animate-fade-in">
          <button
            onClick={() => setSelectedType('all')}
            className={cn(
              'flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all',
              selectedType === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-vanilla-50 text-gray-500 hover:bg-primary-50',
            )}
          >
            Tất cả loại
          </button>
          {LEAVE_TYPES.filter(t => t.type !== 'maternity').map(t => (
            <button
              key={t.type}
              onClick={() => setSelectedType(t.type)}
              className={cn(
                'flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all',
                selectedType === t.type
                  ? 'text-white shadow-sm'
                  : 'bg-vanilla-50 text-gray-500 hover:bg-primary-50',
              )}
              style={selectedType === t.type ? { background: t.colorHex } : undefined}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Request cards ── */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(r => (
            <LeaveRequestCard
              key={r.id}
              request={r}
              viewMode={viewMode}
              onApprove={onApprove}
              onReject={onReject}
              onCancel={onCancel}
              onRequestInfo={onRequestInfo}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          variant={filter.searchQuery ? 'no-results' : 'no-data'}
          icon={CalendarDays}
          title={filter.searchQuery ? 'Không tìm thấy' : emptyMessage}
          description={
            filter.searchQuery
              ? `Không có đơn nào khớp với "${filter.searchQuery}"`
              : statusTab !== 'all'
                ? `Không có đơn "${STATUS_CONFIG[statusTab].label}" nào`
                : 'Hãy tạo đơn đầu tiên!'
          }
          action={emptyAction}
        />
      )}
    </div>
  )
}
