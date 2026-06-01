export function OnboardingOpsStickyGuide({
  activeStepTitle,
  nextActionLabel,
}: {
  activeStepTitle: string
  nextActionLabel: string
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 12,
        zIndex: 2,
        borderRadius: 20,
        background: '#FFFDF9',
        border: '1px solid rgba(0, 29, 61, 0.08)',
        padding: 14,
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D' }}>Màn này dùng để làm gì</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>
        Xử lý từng nhân sự mới theo đúng thứ tự, tránh sót bước trước ngày đầu và sau ca đầu.
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D', marginTop: 12 }}>Bạn đang ở bước nào</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6 }}>{activeStepTitle}</div>

      <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D', marginTop: 12 }}>Làm như thế nào</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.5 }}>1. Nhìn việc kế tiếp</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', lineHeight: 1.5 }}>2. Bấm ngay trong card bên dưới</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', lineHeight: 1.5 }}>3. Xong bước nào, hệ thống tự đẩy sang bước tiếp</div>

      <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D', marginTop: 12 }}>Card bên dưới nghĩa là gì</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.5 }}>Mỗi card = 1 việc vận hành</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', lineHeight: 1.5 }}>Nhãn góc phải = mức ưu tiên</div>
      <div style={{ fontSize: 12, color: '#5F6B7A', lineHeight: 1.5 }}>Nút trong card = hành động cần bấm</div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#001D3D', marginTop: 10 }}>{nextActionLabel}</div>
    </div>
  )
}