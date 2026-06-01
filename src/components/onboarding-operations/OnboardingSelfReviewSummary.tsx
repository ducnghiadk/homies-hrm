import type { OnboardingSelfReviewEntry } from '@/lib/career-path-types'

type OnboardingSelfReviewSummaryProps = {
  latest: OnboardingSelfReviewEntry | null
  history: OnboardingSelfReviewEntry[]
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function getTagLabel(value: string) {
  const map: Record<string, string> = {
    quy_trinh: 'Quy trình',
    thao_tac: 'Thao tác',
    giao_tiep_khach: 'Giao tiếp khách',
    toc_do: 'Tốc độ',
    ve_sinh: 'Vệ sinh',
    phoi_hop_ca: 'Phối hợp ca',
    nham_order: 'Nhầm order',
    cham_nhip: 'Chậm nhịp',
    sai_cong_thuc: 'Sai công thức',
    quen_quy_trinh: 'Quên quy trình',
    xu_ly_loi: 'Xử lý lỗi',
  }

  return map[value] || value
}

export function OnboardingSelfReviewSummary({
  latest,
  history,
}: OnboardingSelfReviewSummaryProps) {
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
        Tóm tắt tự đánh giá
      </div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>
        Dữ liệu để kèm đúng điểm, không tự chặn qua chặng.
      </div>

      {!latest ? (
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
          Nhân viên chưa tự đánh giá chặng này.
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
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2F6FA8' }}>{formatTimestamp(latest.submitted_at)}</div>
          <SummaryLine label="Tự tin nhất" tag={getTagLabel(latest.answers.confidence_tag)} note={latest.answers.confidence_note} />
          <SummaryLine label="Cần kèm sát" tag={getTagLabel(latest.answers.coaching_tag)} note={latest.answers.coaching_note} />
          <SummaryLine label="Sợ nhất" tag={getTagLabel(latest.answers.fear_tag)} note={latest.answers.fear_note} />
        </div>
      )}

      {history.length > 1 ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#001D3D', marginBottom: 8 }}>Lịch sử gần nhất</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(1, 4).map((entry) => (
              <div
                key={entry.id}
                style={{
                  borderRadius: 14,
                  padding: 10,
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 29, 61, 0.08)',
                  fontSize: 12,
                  color: '#475569',
                }}
              >
                <div style={{ fontWeight: 700, color: '#2F6FA8' }}>{formatTimestamp(entry.submitted_at)}</div>
                <div style={{ marginTop: 6 }}>Tự tin nhất: {getTagLabel(entry.answers.confidence_tag)}</div>
                <div>Cần kèm sát: {getTagLabel(entry.answers.coaching_tag)}</div>
                <div>Sợ nhất: {getTagLabel(entry.answers.fear_tag)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SummaryLine({
  label,
  tag,
  note,
}: {
  label: string
  tag: string
  note: string
}) {
  return (
    <div style={{ marginTop: 10, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
      <div>
        <span style={{ fontWeight: 700, color: '#001D3D' }}>{label}:</span> {tag}
      </div>
      {note ? <div style={{ marginTop: 2, color: '#64748B' }}>{note}</div> : null}
    </div>
  )
}
