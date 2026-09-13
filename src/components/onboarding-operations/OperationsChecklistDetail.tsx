import type { CSSProperties } from 'react'
import { useState } from 'react'
import type {
  OnboardingOpsBuddyCandidate,
  OnboardingOpsChecklistItem,
  OnboardingOpsEmployeeDetail,
  OnboardingOpsFirstShiftResult,
  OnboardingOpsFollowUpLevel,
  OnboardingOpsShiftOption,
} from '@/lib/services/onboarding-operations-service'
import { OnboardingSelfReviewSummary } from '@/components/onboarding-operations/OnboardingSelfReviewSummary'
import { OnboardingStageGatePanel } from '@/components/onboarding-operations/OnboardingStageGatePanel'

const toneStyles: Record<OnboardingOpsEmployeeDetail['tone'], { background: string; color: string }> = {
  block: {
    background: 'rgba(217, 56, 30, 0.12)',
    color: '#D9381E',
  },
  attention: {
    background: 'rgba(246, 200, 95, 0.22)',
    color: '#8A5A00',
  },
  ready: {
    background: 'rgba(30, 158, 87, 0.14)',
    color: '#1E9E57',
  },
}

const shiftToneStyles: Record<OnboardingOpsShiftOption['tone'], { background: string; color: string; border: string }> = {
  morning: {
    background: 'rgba(246, 200, 95, 0.18)',
    color: '#8A5A00',
    border: 'rgba(246, 200, 95, 0.42)',
  },
  midday: {
    background: 'rgba(30, 158, 87, 0.10)',
    color: '#1E9E57',
    border: 'rgba(30, 158, 87, 0.24)',
  },
  evening: {
    background: 'rgba(47, 111, 168, 0.10)',
    color: '#2F6FA8',
    border: 'rgba(47, 111, 168, 0.22)',
  },
}

export function OperationsChecklistDetail({
  detail,
  onMarkFirstShift,
  onAssignBuddy,
  onConfirmStorePolicy,
  onToggleTools,
  onSetFirstShiftResult,
  onSaveFirstShiftNote,
  onSetFollowUp,
  onProposeGate,
  onApproveGate,
  onRejectGate,
  viewerRole,
}: {
  detail: OnboardingOpsEmployeeDetail | null
  onMarkFirstShift: (employeeId: string, shiftId: string) => void
  onAssignBuddy: (employeeId: string, buddyId: string) => void
  onConfirmStorePolicy: (employeeId: string) => void
  onToggleTools: (employeeId: string, field: 'chatGroupJoined' | 'toolAccountReady', value: boolean) => void
  onSetFirstShiftResult: (employeeId: string, result: OnboardingOpsFirstShiftResult) => void
  onSaveFirstShiftNote: (employeeId: string, firstShiftNote: string) => void
  onSetFollowUp: (employeeId: string, followUpLevel: OnboardingOpsFollowUpLevel) => void
  onProposeGate: (employeeId: string, note: string) => void
  onApproveGate: (employeeId: string, managerNote: string) => void
  onRejectGate: (employeeId: string, managerNote: string, retryItemIds: string[]) => void
  viewerRole: string
}) {
  if (!detail) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0, 29, 61, 0.08)',
          borderRadius: 28,
          boxShadow: '0 10px 30px rgba(0, 29, 61, 0.06)',
          padding: 24,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: '#001D3D' }}>Chọn 1 người để xem checklist</div>
        <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 8 }}>
          Bấm từ danh sách bên trái để xem tình trạng sẵn sàng và xử lý từng bước.
        </div>
      </div>
    )
  }

  const beforeShift = detail.checklist.filter((item) => item.phase === 'before_first_shift')
  const afterShift = detail.checklist.filter((item) => item.phase === 'after_first_shift')
  const tone = toneStyles[detail.tone]

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 29, 61, 0.08)',
        borderRadius: 28,
        boxShadow: '0 10px 30px rgba(0, 29, 61, 0.06)',
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
            Chi tiết checklist
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#001D3D', marginTop: 4 }}>{detail.employeeName}</div>
          <div style={{ fontSize: 13, color: '#4A5A6A', marginTop: 4, lineHeight: 1.5 }}>
            {detail.roleLabel} • {detail.storeLabel} • Vào làm {detail.hireDate}
          </div>
        </div>
        <span
          style={{
            borderRadius: 999,
            padding: '8px 12px',
            fontSize: 11,
            fontWeight: 800,
            background: tone.background,
            color: tone.color,
            whiteSpace: 'nowrap',
          }}
        >
          {detail.toneLabel}
        </span>
      </div>

      <div
        style={{
          borderRadius: 22,
          padding: 14,
          background: '#FFF8E8',
          border: '1px solid rgba(246, 200, 95, 0.35)',
          fontSize: 13,
          color: '#5A4A2F',
          marginBottom: 18,
          lineHeight: 1.5,
        }}
      >
        {detail.summaryLabel}
      </div>

      <div
        style={{
          borderRadius: 18,
          padding: 12,
          background: '#FFFDF9',
          border: '1px solid rgba(0, 29, 61, 0.08)',
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 800, color: '#7A6B53', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Ghi chú nhanh ngoài list
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#001D3D', marginTop: 6 }}>{detail.quickNote}</div>
      </div>

      <ChecklistSection
        title="Trước ngày đầu"
        items={beforeShift}
        detail={detail}
        onMarkFirstShift={onMarkFirstShift}
        onAssignBuddy={onAssignBuddy}
        onConfirmStorePolicy={onConfirmStorePolicy}
        onToggleTools={onToggleTools}
      />

      <div style={{ height: 14 }} />

      <ChecklistSection
        title="Sau ca đầu"
        items={afterShift}
        detail={detail}
        onSetFirstShiftResult={onSetFirstShiftResult}
        onSaveFirstShiftNote={onSaveFirstShiftNote}
        onSetFollowUp={onSetFollowUp}
      />

      <OnboardingSelfReviewSummary latest={detail.selfReviewLatest} history={detail.selfReviewHistory} />

      <OnboardingStageGatePanel
        detail={detail}
        viewerRole={viewerRole}
        onProposeGate={onProposeGate}
        onApproveGate={onApproveGate}
        onRejectGate={onRejectGate}
      />

      <HistoryPanel history={detail.history} />
    </div>
  )
}

function ChecklistSection({
  title,
  items,
  detail,
  onMarkFirstShift,
  onAssignBuddy,
  onConfirmStorePolicy,
  onToggleTools,
  onSetFirstShiftResult,
  onSaveFirstShiftNote,
  onSetFollowUp,
}: {
  title: string
  items: OnboardingOpsChecklistItem[]
  detail: OnboardingOpsEmployeeDetail
  onMarkFirstShift?: (employeeId: string, shiftId: string) => void
  onAssignBuddy?: (employeeId: string, buddyId: string) => void
  onConfirmStorePolicy?: (employeeId: string) => void
  onToggleTools?: (employeeId: string, field: 'chatGroupJoined' | 'toolAccountReady', value: boolean) => void
  onSetFirstShiftResult?: (employeeId: string, result: OnboardingOpsFirstShiftResult) => void
  onSaveFirstShiftNote?: (employeeId: string, firstShiftNote: string) => void
  onSetFollowUp?: (employeeId: string, followUpLevel: OnboardingOpsFollowUpLevel) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#001D3D', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => {
          const severityColor = item.severity === 'block' ? '#D9381E' : '#B7791F'

          return (
            <div
              key={item.key}
              style={{
                border: '1px solid rgba(0, 29, 61, 0.08)',
                borderRadius: 20,
                padding: 14,
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#001D3D' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>{item.summary}</div>
                </div>
                <span
                  style={{
                    borderRadius: 999,
                    padding: '6px 10px',
                    fontSize: 10,
                    fontWeight: 800,
                    background: item.done ? 'rgba(30, 158, 87, 0.12)' : 'rgba(246, 200, 95, 0.16)',
                    color: item.done ? '#1E9E57' : severityColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.done ? 'Đã xong' : item.severity === 'block' ? 'Block' : 'Cần làm'}
                </span>
              </div>

              {item.key === 'first_shift' ? (
                <ShiftOptionList
                  employeeId={detail.employeeId}
                  options={detail.firstShiftOptions}
                  selectedShiftId={detail.selectedFirstShiftKey}
                  onMarkFirstShift={onMarkFirstShift}
                />
              ) : null}

              {item.key === 'buddy' ? (
                <BuddyOptionList
                  employeeId={detail.employeeId}
                  selectedBuddyId={detail.selectedBuddyId}
                  candidates={detail.buddyCandidates}
                  onAssignBuddy={onAssignBuddy}
                />
              ) : null}

              {item.key === 'uniform_attendance_policy' && !item.done ? (
                <div style={{ marginTop: 12 }}>
                  <button type="button" onClick={() => onConfirmStorePolicy?.(detail.employeeId)} style={actionButtonStyle}>
                    Xác nhận tại quán
                  </button>
                </div>
              ) : null}

              {item.key === 'tools_and_group' ? (
                <ToolsAccessPanel
                  employeeId={detail.employeeId}
                  chatGroupJoined={detail.toolsAccess.chatGroupJoined}
                  toolAccountReady={detail.toolsAccess.toolAccountReady}
                  onToggleTools={onToggleTools}
                />
              ) : null}

              {!item.done && item.key === 'first_shift_result' ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <button type="button" onClick={() => onSetFirstShiftResult?.(detail.employeeId, 'pass')} style={actionButtonStyle}>
                    Ổn
                  </button>
                  <button type="button" onClick={() => onSetFirstShiftResult?.(detail.employeeId, 'follow_up')} style={secondaryActionButtonStyle}>
                    Theo sát thêm
                  </button>
                  <button type="button" onClick={() => onSetFirstShiftResult?.(detail.employeeId, 'issue')} style={warningActionButtonStyle}>
                    Có vấn đề
                  </button>
                </div>
              ) : null}

              {item.key === 'first_shift_result' ? (
                <FirstShiftFollowUpPanel
                  key={detail.employeeId}
                  employeeId={detail.employeeId}
                  firstShiftNote={detail.firstShiftNote}
                  followUpLevel={detail.followUpLevel}
                  followUpLabel={detail.followUpLabel}
                  followUpSuggestedLabel={detail.followUpSuggestedLabel}
                  onSaveFirstShiftNote={onSaveFirstShiftNote}
                  onSetFollowUp={onSetFollowUp}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ShiftOptionList({
  employeeId,
  options,
  selectedShiftId,
  onMarkFirstShift,
}: {
  employeeId: string
  options: OnboardingOpsShiftOption[]
  selectedShiftId: string | null
  onMarkFirstShift?: (employeeId: string, shiftId: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
      {options.map((option) => {
        const tone = shiftToneStyles[option.tone]
        const isSelected = option.id === selectedShiftId

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onMarkFirstShift?.(employeeId, option.id)}
            style={{
              minHeight: 44,
              borderRadius: 16,
              padding: '10px 12px',
              border: isSelected ? '1.5px solid #2F6FA8' : `1px solid ${tone.border}`,
              background: isSelected ? 'rgba(47, 111, 168, 0.10)' : tone.background,
              color: isSelected ? '#001D3D' : tone.color,
              cursor: 'pointer',
              textAlign: 'left',
              flex: '1 1 180px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800 }}>{option.windowLabel}</div>
            <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>{option.label}</div>
          </button>
        )
      })}
    </div>
  )
}

function BuddyOptionList({
  employeeId,
  selectedBuddyId,
  candidates,
  onAssignBuddy,
}: {
  employeeId: string
  selectedBuddyId: string | null
  candidates: OnboardingOpsBuddyCandidate[]
  onAssignBuddy?: (employeeId: string, buddyId: string) => void
}) {
  if (candidates.length === 0) {
    return (
      <div style={{ marginTop: 12, fontSize: 12, color: '#5F6B7A' }}>
        Chưa có người kèm cùng quán để gán nhanh.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
      {candidates.slice(0, 4).map((candidate) => {
        const isSelected = candidate.employeeId === selectedBuddyId

        return (
          <button
            key={candidate.employeeId}
            type="button"
            onClick={() => onAssignBuddy?.(employeeId, candidate.employeeId)}
            style={{
              minHeight: 48,
              borderRadius: 18,
              border: isSelected ? '1.5px solid #2F6FA8' : '1px solid rgba(0, 29, 61, 0.08)',
              background: isSelected ? 'rgba(47, 111, 168, 0.08)' : '#FFFDF9',
              padding: '10px 12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#001D3D' }}>{candidate.employeeName}</div>
                <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 3 }}>
                  {candidate.roleLabel} • đang kèm {candidate.activeBuddyCount} người
                </div>
              </div>
              {candidate.isRecommended ? (
                <span
                  style={{
                    borderRadius: 999,
                    padding: '5px 9px',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#2F6FA8',
                    background: 'rgba(47, 111, 168, 0.10)',
                  }}
                >
                  Ưu tiên
                </span>
              ) : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ToolsAccessPanel({
  employeeId,
  chatGroupJoined,
  toolAccountReady,
  onToggleTools,
}: {
  employeeId: string
  chatGroupJoined: boolean
  toolAccountReady: boolean
  onToggleTools?: (employeeId: string, field: 'chatGroupJoined' | 'toolAccountReady', value: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
      <button
        type="button"
        onClick={() => onToggleTools?.(employeeId, 'chatGroupJoined', !chatGroupJoined)}
        style={buildToggleButtonStyle(chatGroupJoined)}
      >
        {chatGroupJoined ? 'Đã vào nhóm chat' : 'Chưa vào nhóm chat'}
      </button>
      <button
        type="button"
        onClick={() => onToggleTools?.(employeeId, 'toolAccountReady', !toolAccountReady)}
        style={buildToggleButtonStyle(toolAccountReady)}
      >
        {toolAccountReady ? 'Đủ tool làm việc' : 'Thiếu tool làm việc'}
      </button>
    </div>
  )
}

function FirstShiftFollowUpPanel({
  employeeId,
  firstShiftNote,
  followUpLevel,
  followUpLabel,
  followUpSuggestedLabel,
  onSaveFirstShiftNote,
  onSetFollowUp,
}: {
  employeeId: string
  firstShiftNote: string
  followUpLevel: OnboardingOpsFollowUpLevel | null
  followUpLabel: string
  followUpSuggestedLabel: string
  onSaveFirstShiftNote?: (employeeId: string, firstShiftNote: string) => void
  onSetFollowUp?: (employeeId: string, followUpLevel: OnboardingOpsFollowUpLevel) => void
}) {
  const [draftNote, setDraftNote] = useState(firstShiftNote)
  const needsAttention = followUpLevel === 'same_day' || followUpLevel === 'next_day'

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 18,
        background: needsAttention ? '#FFF8E8' : '#FFFDF9',
        border: needsAttention ? '1px solid rgba(246, 200, 95, 0.38)' : '1px solid rgba(0, 29, 61, 0.08)',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: '#001D3D' }}>Ghi chú ca đầu</div>
      <textarea
        value={draftNote}
        onChange={(event) => setDraftNote(event.target.value)}
        placeholder="Ví dụ: còn chậm khâu chào khách, cần xem lại quy trình mở ca"
        style={{
          width: '100%',
          minHeight: 88,
          marginTop: 8,
          borderRadius: 16,
          border: '1px solid rgba(0, 29, 61, 0.12)',
          padding: '10px 12px',
          fontSize: 12,
          lineHeight: 1.5,
          color: '#001D3D',
          background: '#FFFFFF',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button
          type="button"
          onClick={() => onSaveFirstShiftNote?.(employeeId, draftNote.trim())}
          style={secondaryActionButtonStyle}
        >
          Lưu ghi chú
        </button>
        {firstShiftNote ? (
          <span style={{ fontSize: 11, color: '#5F6B7A', alignSelf: 'center' }}>
            Đã lưu ghi chú ca đầu
          </span>
        ) : null}
      </div>

      <div style={{ fontSize: 12, fontWeight: 800, color: '#001D3D', marginTop: 14 }}>Nhắc follow-up</div>
      <div style={{ fontSize: 11, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>
        {followUpSuggestedLabel}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button
          type="button"
          onClick={() => onSetFollowUp?.(employeeId, 'same_day')}
          style={buildSelectButtonStyle(followUpLevel === 'same_day', 'warning')}
        >
          Gọi lại trong ngày
        </button>
        <button
          type="button"
          onClick={() => onSetFollowUp?.(employeeId, 'next_day')}
          style={buildSelectButtonStyle(followUpLevel === 'next_day', 'info')}
        >
          Check lại ngày mai
        </button>
        <button
          type="button"
          onClick={() => onSetFollowUp?.(employeeId, 'not_needed')}
          style={buildSelectButtonStyle(followUpLevel === 'not_needed', 'success')}
        >
          Không cần
        </button>
      </div>

      <div style={{ fontSize: 12, color: needsAttention ? '#8A5A00' : '#5F6B7A', marginTop: 10, lineHeight: 1.45 }}>
        {followUpLabel}
      </div>
    </div>
  )
}

function HistoryPanel({
  history,
}: {
  history: OnboardingOpsEmployeeDetail['history']
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#001D3D', marginBottom: 10 }}>Lịch sử xử lý</div>
      <div
        style={{
          border: '1px solid rgba(0, 29, 61, 0.08)',
          borderRadius: 20,
          background: '#FFFDF9',
          padding: 14,
        }}
      >
        {history.length === 0 ? (
          <div style={{ fontSize: 12, color: '#5F6B7A', lineHeight: 1.5 }}>
            Chưa có lịch sử xử lý cho người này.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((entry) => (
              <div
                key={entry.id}
                style={{
                  borderRadius: 14,
                  padding: 10,
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 29, 61, 0.08)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#001D3D', lineHeight: 1.45 }}>{entry.message}</div>
                <div style={{ fontSize: 11, color: '#5F6B7A', marginTop: 4 }}>{formatHistoryTime(entry.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatHistoryTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const actionButtonStyle: CSSProperties = {
  minHeight: 44,
  border: 'none',
  borderRadius: 999,
  background: '#2F6FA8',
  color: '#FFFFFF',
  padding: '10px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryActionButtonStyle: CSSProperties = {
  minHeight: 44,
  border: '1px solid rgba(47, 111, 168, 0.22)',
  borderRadius: 999,
  background: '#FFFFFF',
  color: '#2F6FA8',
  padding: '10px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const warningActionButtonStyle: CSSProperties = {
  minHeight: 44,
  border: '1px solid rgba(217, 56, 30, 0.2)',
  borderRadius: 999,
  background: 'rgba(217, 56, 30, 0.08)',
  color: '#D9381E',
  padding: '10px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

function buildToggleButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: 44,
    borderRadius: 999,
    border: active ? '1px solid rgba(30, 158, 87, 0.2)' : '1px solid rgba(0, 29, 61, 0.08)',
    background: active ? 'rgba(30, 158, 87, 0.10)' : '#FFFFFF',
    color: active ? '#1E9E57' : '#4A5A6A',
    padding: '10px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  }
}

function buildSelectButtonStyle(
  active: boolean,
  tone: 'warning' | 'info' | 'success',
): CSSProperties {
  const palette = tone === 'warning'
    ? { border: 'rgba(246, 200, 95, 0.42)', background: 'rgba(246, 200, 95, 0.18)', color: '#8A5A00' }
    : tone === 'success'
      ? { border: 'rgba(30, 158, 87, 0.24)', background: 'rgba(30, 158, 87, 0.10)', color: '#1E9E57' }
      : { border: 'rgba(47, 111, 168, 0.22)', background: 'rgba(47, 111, 168, 0.10)', color: '#2F6FA8' }

  return {
    minHeight: 44,
    borderRadius: 999,
    border: active ? '1.5px solid #001D3D' : `1px solid ${palette.border}`,
    background: active ? palette.background : '#FFFFFF',
    color: active ? '#001D3D' : palette.color,
    padding: '10px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  }
}
