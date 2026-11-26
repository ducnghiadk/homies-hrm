// Tìm đường dẫn màn hình cần mở khi bấm vào một thông báo (hàm thuần, có test).

/** Chỉ chấp nhận đường dẫn nội bộ của ứng dụng (bắt đầu bằng "/" và không phải "//"). */
function isInternalPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
}

/**
 * Đọc đường dẫn từ metadata của thông báo.
 * - Ưu tiên `action_url`, sau đó `link` (thông báo máy chủ của lộ trình thăng tiến dùng `link`).
 * - Nếu có `proposal_id` và đường dẫn là trang duyệt nâng bậc, gắn `?proposal=` để mở đúng đề xuất.
 * - Thông báo lộ trình thăng tiến không có đường dẫn thì mở "Lộ trình của tôi".
 */
export function resolveMetadataActionUrl(type: string, metadata?: Record<string, unknown>): string | null {
  const raw = isInternalPath(metadata?.action_url) ? metadata?.action_url : isInternalPath(metadata?.link) ? metadata?.link : null
  const proposalId = typeof metadata?.proposal_id === 'string' ? metadata.proposal_id : ''
  if (raw) {
    const url = String(raw)
    if (proposalId && url.startsWith('/career-path/review') && !url.includes('proposal=')) {
      return `${url}${url.includes('?') ? '&' : '?'}proposal=${encodeURIComponent(proposalId)}`
    }
    return url
  }
  if (type === 'career_path') return '/career-path/me'
  return null
}
