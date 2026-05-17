'use client'

import { AlertCircle } from 'lucide-react'
import { LEAVE_TYPE_MAP } from '@/lib/mock-data-leave'
import type { LeaveQuota, LeaveType, QuotaDetail
} from '@/lib/mock-data-leave'
import { cn } from '@/lib/utils'

interface LeaveQuotaCardProps {
  quota: LeaveQuota
  variant?: 'full' | 'compact'
  showPending?: boolean
  onQuickRequest?: (type: LeaveType) => void
}

const DISPLAY_TYPES: LeaveType[] = ['annual', 'sick', 'personal', 'unpaid', 'wedding']

export default function LeaveQuotaCard({
  quota,
  variant = 'full',
  showPending = true,
  onQuickRequest,
}: LeaveQuotaCardProps) {
  const types = DISPLAY_TYPES.filter(t => {
    const q = quota.quotas[t]
    return q.total > 0 || q.used > 0
  })

  if (variant === 'compact') {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {types.map(type => {
          const info = LEAVE_TYPE_MAP[type]
          const q = quota.quotas[type]
          return (
            <div
              key={type}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
              style={{ background: info.colorHex + '10' }}
            >
              <span className="text-sm">{info.icon}</span>
              <span className="text-xs font-bold font-numeric" style={{ color: info.colorHex }}>
                {q.remaining}
              </span>
              <span className="text-xs text-gray-400">{info.name}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800 tracking-tight">
          Quota nghỉ phép {quota.year}
        </h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {types.map(type => {
          const info = LEAVE_TYPE_MAP[type]
          const q = quota.quotas[type]
          return (
            <QuotaItem
              key={type}
              type={type}
              info={info}
              quota={q}
              showPending={showPending}
              onRequest={onQuickRequest ? () => onQuickRequest(type) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function QuotaItem({
  type,
  info,
  quota,
  showPending,
  onRequest,
}: {
  type: LeaveType
  info: (typeof LEAVE_TYPE_MAP)[LeaveType]
  quota: QuotaDetail
  showPending: boolean
  onRequest?: () => void
}) {
  const usedPct = quota.total > 0 ? Math.min((quota.used / quota.total) * 100, 100) : 0
  const pendingPct = quota.total > 0 ? Math.min((quota.pending / quota.total) * 100, 100) : 0
  const isLow = quota.remaining <= 2 && quota.total > 0
  const isMedium = quota.remaining > 2 && quota.remaining <= 5 && quota.total > 0
  const isUnlimited = quota.total === 0

  const now = Date.now() // eslint-disable-line react-compiler/react-compiler
  const isExpiringSoon = quota.expiryDate &&
    new Date(quota.expiryDate).getTime() - now < 30 * 24 * 60 * 60 * 1000

  return (
    <div
      className={cn(
        'flex-shrink-0 w-[150px] rounded-xl p-3 transition-all cursor-pointer',
        'hover:shadow-md active:scale-[0.98]',
        isLow && 'ring-1 ring-red-200',
      )}
      style={{ background: info.colorHex + '08', border: `1px solid ${info.colorHex}15` }}
      tabIndex={0}
      role="button"
      aria-label={`${info.name}: còn ${quota.remaining} ngày`}
      onKeyDown={e => { if (onRequest && (e.key === 'Enter' || e.key === ' ')) onRequest() }}
      onClick={onRequest}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-lg">{info.icon}</span>
        <span className="text-xs font-semibold text-gray-700 truncate">{info.name}</span>
      </div>

      {/* Progress bar — stacked segments */}
      {!isUnlimited && (
        <div className="w-full h-2.5 rounded-full bg-gray-100 mb-1.5 overflow-hidden flex">
          <div
            className="h-full rounded-l-full transition-all duration-700"
            style={{ width: `${usedPct}%`, background: info.colorHex }}
          />
          {quota.pending > 0 && (
            <div
              className="h-full transition-all duration-700 bg-amber-400"
              style={{ width: `${pendingPct}%` }}
            />
          )}
        </div>
      )}

      {/* Remaining badge */}
      <div className="text-center mt-1">
        <div className={cn(
          'inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold font-numeric',
          isLow ? 'bg-red-100 text-red-700'
          : isMedium ? 'bg-amber-100 text-amber-700'
          : isUnlimited ? 'bg-gray-100 text-gray-600'
          : 'bg-green-100 text-green-700'
        )}>
          {isUnlimited ? '∞' : `${quota.remaining}/${quota.total}`}
        </div>
      </div>

      {/* Detail text breakdown */}
      {!isUnlimited && (
        <div className="mt-2 space-y-0.5 text-[10px]">
          {quota.used > 0 && (
            <div className="text-gray-500">✅ Đã dùng: <span className="font-medium" style={{ color: info.colorHex }}>{quota.used}</span></div>
          )}
          {showPending && quota.pending > 0 && (
            <div className="text-amber-600 font-medium">⏳ Chờ duyệt: {quota.pending}</div>
          )}
          <div className={cn(
            'font-medium',
            isLow ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-gray-500'
          )}>
            📊 Còn lại: {quota.remaining}
          </div>
        </div>
      )}

      {/* Expiry warning */}
      {isExpiringSoon && (
        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-amber-600">
          <AlertCircle size={10} />
          HH: {new Date(quota.expiryDate!).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
        </div>
      )}
    </div>
  )
}
