'use client'

import type { ViolationRecord } from '@/lib/kpi-types'
import { mockViolationTypes } from '@/lib/mock-data-kpi'
import { canAppeal, getAppealDeadline } from '@/lib/violation-service'

interface Props {
  record: ViolationRecord
  showActions?: boolean
  onAcknowledge?: (id: string) => void
  onAppeal?: (id: string) => void
  expanded?: boolean
  onToggleExpand?: () => void
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: 'Chờ xác nhận',  bg: '#fef3c7', color: '#92400e' },
  acknowledged:     { label: 'Đã xác nhận',   bg: '#dbeafe', color: '#1d4ed8' },
  appealed:         { label: 'Đang khiếu nại', bg: '#ede9fe', color: '#6d28d9' },
  appeal_approved:  { label: 'Chấp nhận KN',  bg: '#dcfce7', color: '#166534' },
  appeal_rejected:  { label: 'Từ chối KN',    bg: '#fee2e2', color: '#991b1b' },
  finalized:        { label: 'Hoàn tất',      bg: '#f3f4f6', color: '#374151' },
}

const SEV_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  minor:    { label: 'Nhẹ',           bg: '#dbeafe', color: '#1d4ed8' },
  medium:   { label: 'Trung bình',    bg: '#fef3c7', color: '#b45309' },
  major:    { label: 'Nặng',          bg: '#fed7aa', color: '#c2410c' },
  critical: { label: 'Nghiêm trọng',  bg: '#fee2e2', color: '#b91c1c' },
}

export default function ViolationCard({
  record, showActions = false, onAcknowledge, onAppeal,
  expanded = false, onToggleExpand,
}: Props) {
  const vType = mockViolationTypes.find(v => v.id === record.violation_type_id)
  const sev = vType ? SEV_CONFIG[vType.severity] : SEV_CONFIG.minor
  const sts = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending
  const appealable = canAppeal(record)
  const deadline = getAppealDeadline(record)
  const hoursLeft = Math.max(0, Math.round((deadline.getTime() - Date.now()) / 3600000))

  return (
    <div className="card p-3 space-y-2">
      {/* Header */}
      <div className="flex items-start gap-2 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-muted)' }}>{vType?.code}</span>
            <span className="text-sm font-bold">{vType?.name || 'Lỗi không xác định'}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: sev.bg, color: sev.color }}>
              {sev.label}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: sts.bg, color: sts.color }}>
              {sts.label}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{
              background: record.log_mode === 'realtime' ? '#dcfce7' : '#fef3c7',
              color: record.log_mode === 'realtime' ? '#166534' : '#92400e',
            }}>
              {record.log_mode === 'realtime' ? '⚡ Real-time' : '📅 Cuối tháng'}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-black text-red-600">-{record.penalty_points}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>điểm</div>
        </div>
      </div>

      {/* Date */}
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        🕐 {new Date(record.occurred_at).toLocaleDateString('vi-VN')} · Log: {new Date(record.logged_at).toLocaleDateString('vi-VN')}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-2 pt-1 animate-fade-in" style={{ borderTop: '1px solid var(--gray-100)' }}>
          <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
            <strong>Mô tả:</strong> {record.description}
          </div>
          {record.evidence_url && (
            <div className="text-xs" style={{ color: 'var(--primary)' }}>📎 Có bằng chứng đính kèm</div>
          )}
          {record.employee_response && (
            <div className="text-xs p-2 rounded-lg" style={{ background: 'var(--gray-50)' }}>
              <strong>Phản hồi NV:</strong> {record.employee_response}
            </div>
          )}
          {record.appeal_reason && (
            <div className="text-xs p-2 rounded-lg" style={{ background: '#ede9fe' }}>
              <strong>Lý do khiếu nại:</strong> {record.appeal_reason}
            </div>
          )}
          {record.appeal_decision && (
            <div className="text-xs p-2 rounded-lg" style={{ background: record.status === 'appeal_approved' ? '#dcfce7' : '#fee2e2' }}>
              <strong>Quyết định:</strong> {record.appeal_decision}
            </div>
          )}
          {appealable && hoursLeft > 0 && (
            <div className="text-[10px] font-semibold" style={{ color: '#b45309' }}>
              ⏳ Còn {hoursLeft}h để khiếu nại
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && record.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAcknowledge?.(record.id)}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            ✅ Xác nhận
          </button>
          {appealable && (
            <button
              onClick={() => onAppeal?.(record.id)}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ border: '1px solid #7c3aed', color: '#7c3aed' }}
            >
              🔔 Khiếu nại
            </button>
          )}
        </div>
      )}
    </div>
  )
}
