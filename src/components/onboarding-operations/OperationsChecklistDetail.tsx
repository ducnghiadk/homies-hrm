import type { CSSProperties } from 'react'
import { useState } from 'react'
import { OnboardingEvaluationTimelineSummary } from '@/components/onboarding-operations/OnboardingEvaluationTimelineSummary'
import { OnboardingOpsStickyGuide } from '@/components/onboarding-operations/OnboardingOpsStickyGuide'
import type {
  OnboardingOpsBuddyCandidate,
  OnboardingOpsChecklistItem,
  OnboardingOpsEmployeeDetail,
  OnboardingOpsFirstShiftResult,
  OnboardingOpsFollowUpLevel,
  OnboardingOpsShiftOption,
} from '@/lib/services/onboarding-operations-service'

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

function getActivePhase(detail: OnboardingOpsEmployeeDetail) {
  const hasPendingBeforeShift = detail.checklist.some((item) => item.phase === 'before_first_shift' && !item.done)
  return hasPendingBeforeShift ? 'before_first_shift' : 'after_first_shift'
}

function getActiveStepTitle(detail: OnboardingOpsEmployeeDetail) {
  return getActivePhase(detail) === 'before_first_shift'
    ? 'Bước 3: Chuẩn bị trước ngày đầu'
    : 'Bước 4: Theo dõi sau ca đầu'
}

function getNextChecklistItem(detail: OnboardingOpsEmployeeDetail) {
  const activePhase = getActivePhase(detail)
  return detail.checklist.find((item) => item.phase === activePhase && !item.done) ?? null
}

function getPurposeCopy(key: OnboardingOpsChecklistItem['key']) {
  switch (key) {
    case 'first_shift':
      return 'Dùng để chốt ca đầu nhân sự sẽ vào và giờ cần có mặt.'
    case 'buddy':
      return 'Dùng để chỉ định ai chịu trách nhiệm kèm nhân sự này trong ngày đầu.'
    case 'uniform_attendance_policy':
      return 'Dùng để xác nhận nhân sự đã được nhắc lại nội quy thực tế tại quán.'
    case 'tools_and_group':
      return 'Dùng để kiểm tra nhân sự đã có đủ kênh liên lạc và công cụ làm việc.'
    case 'first_shift_result':
      return 'Dùng để chốt kết quả ca đầu và quyết định có cần theo sát thêm hay không.'
    default:
      return 'Dùng để hoàn tất bước vận hành hiện tại.'
  }
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
}: {
  detail: OnboardingOpsEmployeeDetail | null
  onMarkFirstShift: (employeeId: string, shiftId: string) => void
  onAssignBuddy: (employeeId: string, buddyId: string) => void
  onConfirmStorePolicy: (employeeId: string) => void
  onToggleTools: (employeeId: string, field: 'chatGroupJoined' | 'toolAccountReady', value: boolean) => void
  onSetFirstShiftResult: (employeeId: string, result: OnboardingOpsFirstShiftResult) => void
  onSaveFirstShiftNote: (employeeId: string, firstShiftNote: string) => void
  onSetFollowUp: (employeeId: string, followUpLevel: OnboardingOpsFollowUpLevel) => void
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
        <div style={{ fontSize: 16, fontWeight: 700, color: '#001D3D' }}>Chọn 1 người để bắt đầu</div>
        <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 8 }}>
          Bắt đầu từ cột trái. Hệ thống sẽ chỉ ra bước đang chờ và việc cần bấm tiếp theo.
        </div>
      </div>
    )
  }

  if (detail.isUnmatched) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(217, 56, 30, 0.18)',
          borderRadius: 28,
          boxShadow: '0 10px 30px rgba(0, 29, 61, 0.06)',
          padding: 20,
        }}
      >
        <OnboardingOpsStickyGuide
          activeStepTitle="Bước 3: Chuẩn bị trước ngày đầu"
          nextActionLabel="Việc kế tiếp: Rà lại role onboarding"
        />
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
          Bước 3
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#001D3D', marginTop: 4 }}>Chuẩn bị trước ngày đầu</div>
        <div style={{ fontSize: 13, color: '#4A5A6A', marginTop: 6, lineHeight: 1.5 }}>
          Hiện đang chờ: Rà lại role onboarding
        </div>
        <div
          style={{
            marginTop: 14,
            borderRadius: 18,
            padding: 14,
            background: '#FFF8E8',
            border: '1px solid rgba(246, 200, 95, 0.35)',
            fontSize: 13,
            color: '#5A4A2F',
            lineHeight: 1.5,
          }}
        >
          {detail.unmatchedReason}
        </div>
      </div>
    )
  }

  const activePhase = getActivePhase(detail)
  const nextItem = getNextChecklistItem(detail)
  const beforeShift = detail.checklist.filter((item) => item.phase === 'before_first_shift')
  const afterShift = detail.checklist.filter((item) => item.phase === 'after_first_shift')
  const tone = toneStyles[detail.tone]
  const nextActionLabel = nextItem ? `Việc kế tiếp: ${nextItem.label}` : 'Việc kế tiếp: Kiểm tra kết quả sau ca đầu'

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
      <OnboardingOpsStickyGuide
        activeStepTitle={getActiveStepTitle(detail)}
        nextActionLabel={nextActionLabel}
      />

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
            {activePhase === 'before_first_shift' ? 'Bước 3' : 'Bước 4'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#001D3D', marginTop: 4 }}>{getActiveStepTitle(detail)}</div>
          <div style={{ fontSize: 13, color: '#4A5A6A', marginTop: 6, lineHeight: 1.5 }}>
            Hiện đang chờ: {nextItem?.label ?? 'Chốt kết quả sau ca đầu'}
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

      <ChecklistSection
        title="Chuẩn bị trước ngày đầu"
        items={beforeShift}
        detail={detail}
        activePhase={activePhase}
        nextItemKey={nextItem?.key ?? null}
        onMarkFirstShift={onMarkFirstShift}
        onAssignBuddy={onAssignBuddy}
        onConfirmStorePolicy={onConfirmStorePolicy}
        onToggleTools={onToggleTools}
      />

      <div style={{ height: 14 }} />

      <ChecklistSection
        title="Theo dõi sau ca đầu"
        items={afterShift}
        detail={detail}
        activePhase={activePhase}
        nextItemKey={nextItem?.key ?? null}
        onSetFirstShiftResult={onSetFirstShiftResult}
        onSaveFirstShiftNote={onSaveFirstShiftNote}
        onSetFollowUp={onSetFollowUp}
      />

      <OnboardingEvaluationTimelineSummary timelineView={detail.evaluationTimelineView} />

      <HistoryPanel history={detail.history} />
    </div>
  )
}

function ChecklistSection({
  title,
  items,
  detail,
  activePhase,
  nextItemKey,
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
  activePhase: 'before_first_shift' | 'after_first_shift'
  nextItemKey: OnboardingOpsChecklistItem['key'] | null
  onMarkFirstShift?: (employeeId: string, shiftId: string) => void
  onAssignBuddy?: (employeeId: string, buddyId: string) => void
  onConfirmStorePolicy?: (employeeId: string) => void
  onToggleTools?: (employeeId: string, field: 'chatGroupJoined' | 'toolAccountReady', value: boolean) => void
  onSetFirstShiftResult?: (employeeId: string, result: OnboardingOpsFirstShiftResult) => void
  onSaveFirstShiftNote?: (employeeId: string, firstShiftNote: string) => void
  onSetFollowUp?: (employeeId: string, followUpLevel: OnboardingOpsFollowUpLevel) => void
}) {
  const orderedItems = [...items].sort((left, right) => {
    const leftIsNext = left.key === nextItemKey
    const rightIsNext = right.key === nextItemKey
    if (leftIsNext !== rightIsNext) return leftIsNext ? -1 : 1
    if (left.done !== right.done) return left.done ? 1 : -1
    if (left.severity !== right.severity) return left.severity === 'block' ? -1 : 1
    return 0
  })

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#001D3D', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orderedItems.map((item) => {
          const severityColor = item.severity === 'block' ? '#D9381E' : '#B7791F'
          const isNext = item.key === nextItemKey && item.phase === activePhase

          return (
            <div
              key={item.key}
              style={{
                border: isNext ? '1.5px solid #2F6FA8' : '1px solid rgba(0, 29, 61, 0.08)',
                borderRadius: 20,
                padding: 14,
                background: isNext ? '#F8FBFF' : '#FFFFFF',
                boxShadow: isNext ? '0 12px 28px rgba(47, 111, 168, 0.12)' : 'none',
                opacity: item.phase === activePhase ? 1 : 0.92,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#001D3D' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>{getPurposeCopy(item.key)}</div>
                  <div style={{ fontSize: 12, color: '#4A5A6A', marginTop: 6, lineHeight: 1.45 }}>{item.summary}</div>
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
                  {item.done ? 'Đã xong' : item.severity === 'block' ? 'Làm ngay' : 'Cần chuẩn bị'}
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
                    Đã nhắc và xác nhận tại quán
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
                    Ổn, không cần theo sát
                  </button>
                  <button type="button" onClick={() => onSetFirstShiftResult?.(detail.employeeId, 'follow_up')} style={secondaryActionButtonStyle}>
                    Tạm ổn, cần theo sát thêm
                  </button>
                  <button type="button" onClick={() => onSetFirstShiftResult?.(detail.employeeId, 'issue')} style={warningActionButtonStyle}>
                    Có vấn đề, cần xử lý
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
    return <div style={{ marginTop: 12, fontSize: 12, color: '#5F6B7A' }}>Chưa có người kèm cùng quán để gán nhanh.</div>
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
        {toolAccountReady ? 'Đã cấp đủ tool' : 'Chưa cấp đủ tool'}
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
        <button type="button" onClick={() => onSaveFirstShiftNote?.(employeeId, draftNote.trim())} style={secondaryActionButtonStyle}>
          Lưu ghi chú
        </button>
        {firstShiftNote ? <span style={{ fontSize: 11, color: '#5F6B7A', alignSelf: 'center' }}>Đã lưu ghi chú ca đầu</span> : null}
      </div>

      <div style={{ fontSize: 12, fontWeight: 800, color: '#001D3D', marginTop: 14 }}>Nhắc follow-up</div>
      <div style={{ fontSize: 11, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>{followUpSuggestedLabel}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" onClick={() => onSetFollowUp?.(employeeId, 'same_day')} style={buildSelectButtonStyle(followUpLevel === 'same_day', 'warning')}>
          Gọi lại trong ngày
        </button>
        <button type="button" onClick={() => onSetFollowUp?.(employeeId, 'next_day')} style={buildSelectButtonStyle(followUpLevel === 'next_day', 'info')}>
          Check lại ngày mai
        </button>
        <button type="button" onClick={() => onSetFollowUp?.(employeeId, 'not_needed')} style={buildSelectButtonStyle(followUpLevel === 'not_needed', 'success')}>
          Không cần
        </button>
      </div>

      <div style={{ fontSize: 12, color: needsAttention ? '#8A5A00' : '#5F6B7A', marginTop: 10, lineHeight: 1.45 }}>{followUpLabel}</div>
    </div>
  )
}

function HistoryPanel({ history }: { history: OnboardingOpsEmployeeDetail['history'] }) {
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
          <div style={{ fontSize: 12, color: '#5F6B7A', lineHeight: 1.5 }}>Chưa có lịch sử xử lý cho người này.</div>
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

function buildSelectButtonStyle(active: boolean, tone: 'warning' | 'info' | 'success'): CSSProperties {
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