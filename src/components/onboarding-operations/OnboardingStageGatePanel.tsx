import { useState } from 'react'
import type { OnboardingStageGateStatus } from '@/lib/career-path-types'
import type { OnboardingOpsEmployeeDetail } from '@/lib/services/onboarding-operations-service'

type OnboardingStageGatePanelProps = {
  detail: OnboardingOpsEmployeeDetail
  viewerRole: string
  onProposeGate: (employeeId: string, note: string) => void
  onApproveGate: (employeeId: string, managerNote: string) => void
  onRejectGate: (employeeId: string, managerNote: string, retryItemIds: string[]) => void
}

export function OnboardingStageGatePanel({
  detail,
  viewerRole,
  onProposeGate,
  onApproveGate,
  onRejectGate,
}: OnboardingStageGatePanelProps) {
  const [buddyNote, setBuddyNote] = useState('')
  const [managerNote, setManagerNote] = useState('')
  const [selectedRetryItems, setSelectedRetryItems] = useState<string[]>([])

  if (!detail.gateView) return null

  const isManager = viewerRole === 'store_manager' || viewerRole === 'hr_admin' || viewerRole === 'ceo'
  const canPropose = !isManager
    && detail.gateView.status === 'chua_de_xuat'
    && detail.gateView.has_self_review
    && detail.gateView.blocked_item_ids.length === 0
  const canApprove = isManager && detail.gateView.status === 'cho_quan_ly_duyet'
  const canReject = isManager && detail.gateView.status === 'cho_quan_ly_duyet'

  const handleToggleRetryItem = (itemId: string) => {
    setSelectedRetryItems((current) => {
      if (current.includes(itemId)) return current.filter((entry) => entry !== itemId)
      if (current.length >= 3) return current
      return [...current, itemId]
    })
  }

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 12,
        background: '#F8FAFC',
        border: '1px solid rgba(0, 29, 61, 0.08)',
        marginBottom: 18,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: '#7A6B53', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Gate tổng kết chặng
      </div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>
        Tự đánh giá là điều kiện vào gate. Buddy đề xuất, quản lý chốt bước cuối.
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
        <div>Trạng thái: <strong>{getStatusLabel(detail.gateView.status)}</strong></div>
        <div>Đã có tự đánh giá: <strong>{detail.gateView.has_self_review ? 'Có' : 'Chưa'}</strong></div>
        <div>Còn item bắt buộc đang vướng: <strong>{detail.gateView.blocked_item_ids.length}</strong></div>
      </div>

      {detail.gateView.buddy_note ? (
        <div style={{ marginTop: 10, fontSize: 13, color: '#334155' }}>
          <strong>Ghi chú buddy:</strong> {detail.gateView.buddy_note}
        </div>
      ) : null}

      {detail.gateView.manager_note ? (
        <div style={{ marginTop: 8, fontSize: 13, color: '#334155' }}>
          <strong>Ghi chú quản lý:</strong> {detail.gateView.manager_note}
        </div>
      ) : null}

      {canPropose ? (
        <div style={{ marginTop: 12 }}>
          <textarea
            value={buddyNote}
            onChange={(event) => setBuddyNote(event.target.value)}
            rows={3}
            maxLength={280}
            placeholder="Ghi ngắn vì sao buddy đề xuất qua gate."
            style={{
              width: '100%',
              borderRadius: 14,
              border: '1px solid rgba(148, 163, 184, 0.5)',
              padding: 10,
              fontSize: 13,
            }}
          />
          <button
            type="button"
            onClick={() => {
              onProposeGate(detail.employeeId, buddyNote)
              setBuddyNote('')
            }}
            style={actionButtonStyle('#001D3D')}
          >
            Đề xuất qua gate
          </button>
        </div>
      ) : null}

      {canApprove || canReject ? (
        <div style={{ marginTop: 12 }}>
          <textarea
            value={managerNote}
            onChange={(event) => setManagerNote(event.target.value)}
            rows={3}
            maxLength={280}
            placeholder="Kết luận ngắn của quản lý."
            style={{
              width: '100%',
              borderRadius: 14,
              border: '1px solid rgba(148, 163, 184, 0.5)',
              padding: 10,
              fontSize: 13,
            }}
          />

          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#001D3D' }}>
            Chọn tối đa 3 mục cần làm lại nếu chưa duyệt
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {detail.gateRetryItems.map((item) => (
              <label key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={selectedRetryItems.includes(item.id)}
                  onChange={() => handleToggleRetryItem(item.id)}
                />
                <span>{item.title}</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              type="button"
              onClick={() => {
                onApproveGate(detail.employeeId, managerNote)
                setManagerNote('')
                setSelectedRetryItems([])
              }}
              disabled={!managerNote.trim()}
              style={actionButtonStyle('#1E9E57', !managerNote.trim())}
            >
              Duyệt gate
            </button>
            <button
              type="button"
              onClick={() => {
                onRejectGate(detail.employeeId, managerNote, selectedRetryItems)
                setManagerNote('')
                setSelectedRetryItems([])
              }}
              disabled={!managerNote.trim() || selectedRetryItems.length === 0}
              style={actionButtonStyle('#D9381E', !managerNote.trim() || selectedRetryItems.length === 0)}
            >
              Chưa duyệt
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function getStatusLabel(status: OnboardingStageGateStatus) {
  if (status === 'cho_quan_ly_duyet') return 'Chờ quản lý duyệt'
  if (status === 'da_qua_gate') return 'Đã qua gate'
  if (status === 'chua_qua_gate') return 'Chưa qua gate'
  return 'Chưa đề xuất'
}

function actionButtonStyle(color: string, disabled = false) {
  return {
    borderRadius: 999,
    border: 'none',
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 700,
    background: disabled ? '#CBD5E1' : color,
    color: '#FFFFFF',
    cursor: disabled ? 'not-allowed' : 'pointer',
  } as const
}
