import type {
  OnboardingOpsChecklistItem,
  OnboardingOpsEmployeeDetail,
  OnboardingOpsFirstShiftResult,
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

export function OperationsChecklistDetail({
  detail,
  onMarkFirstShift,
  onAssignBuddy,
  onConfirmStorePolicy,
  onConfirmTools,
  onSetFirstShiftResult,
}: {
  detail: OnboardingOpsEmployeeDetail | null
  onMarkFirstShift: (employeeId: string) => void
  onAssignBuddy: (employeeId: string) => void
  onConfirmStorePolicy: (employeeId: string) => void
  onConfirmTools: (employeeId: string) => void
  onSetFirstShiftResult: (employeeId: string, result: OnboardingOpsFirstShiftResult) => void
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
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
            Chi tiết checklist
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#001D3D', marginTop: 4 }}>{detail.employeeName}</div>
          <div style={{ fontSize: 13, color: '#4A5A6A', marginTop: 4 }}>
            {detail.roleLabel} • {detail.storeLabel} • Vào làm {detail.hireDate}
          </div>
        </div>
        <span
          style={{
            borderRadius: 999,
            padding: '7px 12px',
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
        }}
      >
        {detail.summaryLabel}
      </div>

      <ChecklistSection
        title="Trước ngày đầu"
        items={beforeShift}
        employeeId={detail.employeeId}
        onMarkFirstShift={onMarkFirstShift}
        onAssignBuddy={onAssignBuddy}
        onConfirmStorePolicy={onConfirmStorePolicy}
        onConfirmTools={onConfirmTools}
      />

      <div style={{ height: 14 }} />

      <ChecklistSection
        title="Sau ca đầu"
        items={afterShift}
        employeeId={detail.employeeId}
        onSetFirstShiftResult={onSetFirstShiftResult}
      />
    </div>
  )
}

function ChecklistSection({
  title,
  items,
  employeeId,
  onMarkFirstShift,
  onAssignBuddy,
  onConfirmStorePolicy,
  onConfirmTools,
  onSetFirstShiftResult,
}: {
  title: string
  items: OnboardingOpsChecklistItem[]
  employeeId: string
  onMarkFirstShift?: (employeeId: string) => void
  onAssignBuddy?: (employeeId: string) => void
  onConfirmStorePolicy?: (employeeId: string) => void
  onConfirmTools?: (employeeId: string) => void
  onSetFirstShiftResult?: (employeeId: string, result: OnboardingOpsFirstShiftResult) => void
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
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#001D3D' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>{item.summary}</div>
                </div>
                <span
                  style={{
                    borderRadius: 999,
                    padding: '5px 9px',
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

              {!item.done && item.phase === 'before_first_shift' ? (
                <div style={{ marginTop: 10 }}>
                  {item.key === 'first_shift' ? (
                    <button type="button" onClick={() => onMarkFirstShift?.(employeeId)} style={actionButtonStyle}>
                      Chốt ca đầu
                    </button>
                  ) : item.key === 'buddy' ? (
                    <button type="button" onClick={() => onAssignBuddy?.(employeeId)} style={actionButtonStyle}>
                      Gán người kèm
                    </button>
                  ) : item.key === 'uniform_attendance_policy' ? (
                    <button type="button" onClick={() => onConfirmStorePolicy?.(employeeId)} style={actionButtonStyle}>
                      Xác nhận tại quán
                    </button>
                  ) : item.key === 'tools_and_group' ? (
                    <button type="button" onClick={() => onConfirmTools?.(employeeId)} style={actionButtonStyle}>
                      Đánh dấu đủ công cụ
                    </button>
                  ) : null}
                </div>
              ) : null}

              {!item.done && item.key === 'first_shift_result' ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <button type="button" onClick={() => onSetFirstShiftResult?.(employeeId, 'pass')} style={actionButtonStyle}>
                    Ổn
                  </button>
                  <button type="button" onClick={() => onSetFirstShiftResult?.(employeeId, 'follow_up')} style={secondaryActionButtonStyle}>
                    Theo sát thêm
                  </button>
                  <button type="button" onClick={() => onSetFirstShiftResult?.(employeeId, 'issue')} style={warningActionButtonStyle}>
                    Có vấn đề
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const actionButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 999,
  background: '#2F6FA8',
  color: '#FFFFFF',
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryActionButtonStyle: React.CSSProperties = {
  border: '1px solid rgba(47, 111, 168, 0.22)',
  borderRadius: 999,
  background: '#FFFFFF',
  color: '#2F6FA8',
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const warningActionButtonStyle: React.CSSProperties = {
  border: '1px solid rgba(217, 56, 30, 0.2)',
  borderRadius: 999,
  background: 'rgba(217, 56, 30, 0.08)',
  color: '#D9381E',
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}
