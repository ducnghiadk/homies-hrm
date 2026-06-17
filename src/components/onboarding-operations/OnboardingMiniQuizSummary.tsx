import type { OnboardingMiniQuizView } from '@/lib/career-path-types'

type OnboardingMiniQuizSummaryProps = {
  quizView: OnboardingMiniQuizView | null
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

export function OnboardingMiniQuizSummary({
  quizView,
}: OnboardingMiniQuizSummaryProps) {
  const questionMap = new Map(quizView?.template.questions.map((question) => [question.id, question.prompt]) ?? [])

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
        Kết quả mini test
      </div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>
        Tín hiệu để xem nhân viên nắm phần nền đến đâu. Không dùng làm gate bắt buộc.
      </div>

      {!quizView?.latest ? (
        <div
          style={{
            marginTop: 12,
            borderRadius: 16,
            padding: 12,
            background: '#FFFFFF',
            fontSize: 13,
            color: '#64748B',
          }}
        >
          Nhân viên chưa làm mini test chặng này.
        </div>
      ) : (
        <div
          style={{
            marginTop: 12,
            borderRadius: 16,
            padding: 12,
            background: '#FFFFFF',
            border: '1px solid rgba(0, 29, 61, 0.08)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2F6FA8' }}>{formatTimestamp(quizView.latest.submitted_at)}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#001D3D', marginTop: 8 }}>
            {quizView.template.title} • {quizView.latest.score}% • {quizView.status_label}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
            {quizView.latest_wrong_question_ids.length === 0
              ? 'Lần mới nhất không có câu sai.'
              : `Câu sai: ${quizView.latest_wrong_question_ids.map((id) => questionMap.get(id) ?? id).join(' | ')}`}
          </div>
        </div>
      )}

      {quizView && quizView.history.length > 1 ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#001D3D', marginBottom: 8 }}>Lịch sử gần nhất</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quizView.history.slice(1, 4).map((attempt) => (
              <div
                key={attempt.id}
                style={{
                  borderRadius: 14,
                  padding: 10,
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 29, 61, 0.08)',
                  fontSize: 12,
                  color: '#475569',
                }}
              >
                <div style={{ fontWeight: 700, color: '#2F6FA8' }}>{formatTimestamp(attempt.submitted_at)}</div>
                <div style={{ marginTop: 6 }}>Điểm: {attempt.score}%</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
