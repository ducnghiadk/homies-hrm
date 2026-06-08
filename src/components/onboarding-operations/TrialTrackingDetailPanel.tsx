'use client'

import Link from 'next/link'
import { useState } from 'react'
import { OnboardingSelfReviewSummary } from '@/components/onboarding-operations/OnboardingSelfReviewSummary'
import { OnboardingStageGatePanel } from '@/components/onboarding-operations/OnboardingStageGatePanel'
import { TrialTrackingStageTabs } from '@/components/onboarding-operations/TrialTrackingStageTabs'
import { TrialTrackingStageTaskTable } from '@/components/onboarding-operations/TrialTrackingStageTaskTable'
import type { AuthUser } from '@/store/auth-store'
import type {
  OnboardingOpsEmployeeDetail,
  OnboardingOpsFirstShiftResult,
  OnboardingOpsFollowUpLevel,
  OnboardingOpsShiftOption,
  OnboardingOpsStageKey,
} from '@/lib/services/onboarding-operations-service'

const STAGE_LABELS = {
  offer_confirmed: 'Chốt nhận việc và chuẩn bị vào làm',
  day_one: 'Ngày đầu nhận việc',
  early_ramp: 'Làm quen và kèm cặp',
  final_review: 'Đánh giá và chốt kết quả',
} as const

export function TrialTrackingDetailPanel({
  detail,
  viewerRole,
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
}: {
  detail: OnboardingOpsEmployeeDetail | null
  viewerRole: AuthUser['role']
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
}) {
  const [selectedStageByEmployee, setSelectedStageByEmployee] = useState<Record<string, OnboardingOpsStageKey>>({})

  if (!detail) {
    return (
      <section style={panelStyle}>
        <div style={titleStyle}>Chọn 1 nhân sự để xem hành trình onboarding</div>
        <div style={mutedStyle}>Khung này chỉ mở cho 1 người đang cần xử lý.</div>
      </section>
    )
  }

  const activeStageKey = selectedStageByEmployee[detail.employeeId] ?? detail.currentStageKey ?? detail.stages[0]?.key ?? 'offer_confirmed'
  const stages = detail.stages.map((stage) => ({ ...stage, label: STAGE_LABELS[stage.key] }))
  const activeStage = stages.find((stage) => stage.key === activeStageKey) ?? stages[0]

  return (
    <section style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={titleStyle}>{detail.employeeName}</div>
          <div style={mutedStyle}>{`${detail.storeLabel} • ${detail.roleLabel}`}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip label={detail.currentStageLabel} tone="blue" />
          <Chip label={detail.statusLabel} tone={detail.statusKey === 'urgent' ? 'red' : detail.statusKey === 'due_soon' ? 'amber' : detail.statusKey === 'completed' ? 'green' : 'gray'} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: 14 }}>
        <MiniCard label="Chặng hiện tại" value={detail.currentStageLabel} />
        <MiniCard label="Mốc cần làm tiếp" value={detail.nextMilestoneLabel} />
        <MiniCard label="Thiếu chính" value={detail.primaryMissingLabel ?? detail.quickNote} />
      </div>

      <div style={{ marginTop: 16 }}>
        <TrialTrackingStageTabs
          stages={stages}
          activeStageKey={activeStage.key}
          onSelect={(stageKey) => setSelectedStageByEmployee((current) => ({ ...current, [detail.employeeId]: stageKey }))}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <TrialTrackingStageTaskTable rows={activeStage.taskRows} />
      </div>

      <div style={{ marginTop: 16 }}>
        <StageActionBlock
          key={`${detail.employeeId}-${activeStage.key}`}
          detail={detail}
          activeStageKey={activeStage.key}
          onMarkFirstShift={onMarkFirstShift}
          onAssignBuddy={onAssignBuddy}
          onConfirmStorePolicy={onConfirmStorePolicy}
          onToggleTools={onToggleTools}
          onSetFirstShiftResult={onSetFirstShiftResult}
          onSaveFirstShiftNote={onSaveFirstShiftNote}
          onSetFollowUp={onSetFollowUp}
        />
      </div>

      <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.6, color: '#4A5A6A' }}>
        <div><strong>Đang vướng:</strong> {activeStage.blockers[0] ?? 'Không có vướng mắc chính'}</div>
        <div><strong>Ghi chú gần nhất:</strong> {activeStage.latestNote ?? detail.quickNote}</div>
      </div>

      {activeStage.key === 'early_ramp' ? (
        <div style={{ marginTop: 16 }}>
          <OnboardingSelfReviewSummary latest={detail.selfReviewLatest} history={detail.selfReviewHistory} />
        </div>
      ) : null}

      {activeStage.key === 'final_review' ? (
        <div style={{ marginTop: 16 }}>
          <OnboardingStageGatePanel
            detail={detail}
            viewerRole={viewerRole}
            onProposeGate={onProposeGate}
            onApproveGate={onApproveGate}
            onRejectGate={onRejectGate}
          />
        </div>
      ) : null}

      <HistoryPanel history={detail.history} />
    </section>
  )
}

function StageActionBlock({
  detail,
  activeStageKey,
  onMarkFirstShift,
  onAssignBuddy,
  onConfirmStorePolicy,
  onToggleTools,
  onSetFirstShiftResult,
  onSaveFirstShiftNote,
  onSetFollowUp,
}: {
  detail: OnboardingOpsEmployeeDetail
  activeStageKey: OnboardingOpsStageKey
  onMarkFirstShift: (employeeId: string, shiftId: string) => void
  onAssignBuddy: (employeeId: string, buddyId: string) => void
  onConfirmStorePolicy: (employeeId: string) => void
  onToggleTools: (employeeId: string, field: 'chatGroupJoined' | 'toolAccountReady', value: boolean) => void
  onSetFirstShiftResult: (employeeId: string, result: OnboardingOpsFirstShiftResult) => void
  onSaveFirstShiftNote: (employeeId: string, firstShiftNote: string) => void
  onSetFollowUp: (employeeId: string, followUpLevel: OnboardingOpsFollowUpLevel) => void
}) {
  const [noteDraft, setNoteDraft] = useState(detail.firstShiftNote)

  if (detail.isUnmatched) {
    return (
      <div style={blockStyle}>
        <div style={blockTitle}>Chưa gắn đúng quy trình</div>
        <div style={mutedStyle}>{detail.unmatchedReason}</div>
        <div style={{ marginTop: 10 }}>
          <Link href="/career-path/onboarding/setup" style={primaryLink}>Đi tới thiết lập quy trình thử việc</Link>
        </div>
      </div>
    )
  }

  if (activeStageKey === 'offer_confirmed') {
    return (
      <div style={blockStyle}>
        <div style={blockTitle}>Thao tác chặng 1</div>
        <div style={mutedStyle}>Chốt nền tảng trước ngày vào làm.</div>
        <div style={{ marginTop: 10 }}>
          <div style={subTitle}>Ca đầu</div>
          <ShiftOptions options={detail.firstShiftOptions} selectedShiftId={detail.selectedFirstShiftKey} onPick={(shiftId) => onMarkFirstShift(detail.employeeId, shiftId)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={subTitle}>Người kèm</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {detail.buddyCandidates.slice(0, 4).map((candidate) => {
              const active = candidate.employeeId === detail.selectedBuddyId
              return (
                <button key={candidate.employeeId} type="button" onClick={() => onAssignBuddy(detail.employeeId, candidate.employeeId)} style={buildSelectButton(active)}>
                  {candidate.employeeName} • {candidate.roleLabel}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button type="button" onClick={() => onConfirmStorePolicy(detail.employeeId)} style={primaryButton}>Đã nhắc nội quy tại quán</button>
          <button type="button" onClick={() => onToggleTools(detail.employeeId, 'chatGroupJoined', !detail.toolsAccess.chatGroupJoined)} style={ghostButton}>{detail.toolsAccess.chatGroupJoined ? 'Đã vào nhóm chat' : 'Chưa vào nhóm chat'}</button>
          <button type="button" onClick={() => onToggleTools(detail.employeeId, 'toolAccountReady', !detail.toolsAccess.toolAccountReady)} style={ghostButton}>{detail.toolsAccess.toolAccountReady ? 'Đã cấp đủ công cụ' : 'Chưa cấp đủ công cụ'}</button>
        </div>
      </div>
    )
  }

  if (activeStageKey === 'day_one') {
    return (
      <div style={blockStyle}>
        <div style={blockTitle}>Thao tác chặng 2</div>
        <div style={mutedStyle}>Chốt kết quả ngày đầu và nhắc follow-up nếu cần.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" onClick={() => onSetFirstShiftResult(detail.employeeId, 'pass')} style={primaryButton}>Ổn, không cần theo sát</button>
          <button type="button" onClick={() => onSetFirstShiftResult(detail.employeeId, 'follow_up')} style={ghostButton}>Tạm ổn, cần theo sát thêm</button>
          <button type="button" onClick={() => onSetFirstShiftResult(detail.employeeId, 'issue')} style={warnButton}>Có vấn đề, cần xử lý</button>
        </div>
        <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Ghi chú ngắn sau ca đầu" style={{ width: '100%', minHeight: 88, marginTop: 10, borderRadius: 16, border: '1px solid rgba(0, 29, 61, 0.12)', padding: '10px 12px', fontSize: 12 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" onClick={() => onSaveFirstShiftNote(detail.employeeId, noteDraft.trim())} style={ghostButton}>Lưu ghi chú</button>
          <button type="button" onClick={() => onSetFollowUp(detail.employeeId, 'same_day')} style={warnButton}>Gọi lại trong ngày</button>
          <button type="button" onClick={() => onSetFollowUp(detail.employeeId, 'next_day')} style={ghostButton}>Kiểm tra lại ngày mai</button>
          <button type="button" onClick={() => onSetFollowUp(detail.employeeId, 'not_needed')} style={primaryButton}>Không cần</button>
        </div>
      </div>
    )
  }

  return (
    <div style={blockStyle}>
      <div style={blockTitle}>Gợi ý xử lý</div>
      <div style={mutedStyle}>Dùng bảng việc phía trên để bám từng đầu việc trong chặng này.</div>
    </div>
  )
}

function ShiftOptions({ options, selectedShiftId, onPick }: { options: OnboardingOpsShiftOption[]; selectedShiftId: string | null; onPick: (shiftId: string) => void }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {options.map((option) => {
        const active = option.id === selectedShiftId
        return (
          <button key={option.id} type="button" onClick={() => onPick(option.id)} style={buildSelectButton(active)}>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function HistoryPanel({ history }: { history: OnboardingOpsEmployeeDetail['history'] }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={blockTitle}>Lịch sử xử lý</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        {(history.length === 0 ? [{ id: 'empty', message: 'Chưa có lịch sử xử lý.', createdAt: '' }] : history.slice(0, 4)).map((item) => (
          <div key={item.id} style={{ borderRadius: 16, border: '1px solid rgba(0, 29, 61, 0.08)', background: '#FFFDF9', padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#001D3D' }}>{item.message}</div>
            {item.createdAt ? <div style={{ marginTop: 4, fontSize: 11, color: '#5F6B7A' }}>{formatHistoryTime(item.createdAt)}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: 18, border: '1px solid rgba(0, 29, 61, 0.08)', background: '#FFFDF9', padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A6B53' }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, color: '#001D3D' }}>{value}</div>
    </div>
  )
}

function Chip({ label, tone }: { label: string; tone: 'blue' | 'red' | 'amber' | 'green' | 'gray' }) {
  const palette = tone === 'red'
    ? ['#FFF7F5', '#D9381E']
    : tone === 'amber'
      ? ['#FFF8E8', '#8A5A00']
      : tone === 'green'
        ? ['#F6FFF9', '#1E9E57']
        : tone === 'gray'
          ? ['#F8FAFC', '#4A5A6A']
          : ['#F8FBFF', '#2F6FA8']

  return <span style={{ borderRadius: 999, background: palette[0], color: palette[1], padding: '8px 12px', fontSize: 11, fontWeight: 800 }}>{label}</span>
}

function buildSelectButton(active: boolean) {
  return {
    textAlign: 'left',
    borderRadius: 16,
    border: active ? '1.5px solid #2F6FA8' : '1px solid rgba(0, 29, 61, 0.08)',
    background: active ? '#F8FBFF' : '#FFFFFF',
    padding: '10px 12px',
    cursor: 'pointer',
  } as const
}

function formatHistoryTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

const panelStyle = { borderRadius: 28, border: '1px solid rgba(0, 29, 61, 0.08)', background: '#FFFFFF', padding: 20, boxShadow: '0 10px 30px rgba(0, 29, 61, 0.06)' } as const
const blockStyle = { borderRadius: 20, border: '1px solid rgba(0, 29, 61, 0.08)', background: '#FFFDF9', padding: 14 } as const
const titleStyle = { fontSize: 22, fontWeight: 800, color: '#001D3D' } as const
const blockTitle = { fontSize: 14, fontWeight: 800, color: '#001D3D' } as const
const subTitle = { fontSize: 12, fontWeight: 800, color: '#001D3D', marginBottom: 8 } as const
const mutedStyle = { marginTop: 6, fontSize: 13, lineHeight: 1.6, color: '#5F6B7A' } as const
const primaryButton = { borderRadius: 999, border: 'none', background: '#2F6FA8', color: '#FFFFFF', padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' } as const
const ghostButton = { borderRadius: 999, border: '1px solid rgba(47, 111, 168, 0.18)', background: '#FFFFFF', color: '#2F6FA8', padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' } as const
const warnButton = { borderRadius: 999, border: '1px solid rgba(217, 56, 30, 0.18)', background: '#FFF7F5', color: '#D9381E', padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' } as const
const primaryLink = { display: 'inline-flex', borderRadius: 999, background: '#2F6FA8', color: '#FFFFFF', textDecoration: 'none', padding: '10px 14px', fontSize: 12, fontWeight: 700 } as const