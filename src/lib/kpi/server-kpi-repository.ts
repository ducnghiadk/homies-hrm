import type { KpiDatabase, KpiRepository } from './repository.ts'
import type { KpiPeerReviewRepository } from './peer-review-repository.ts'

// Kho KPI phía trình duyệt nói chuyện với máy chủ (/api/kpi/database, /api/kpi/peer-reviews).
// Không còn lưu KPI / đánh giá đồng nghiệp trên trình duyệt.

async function readJson(res: Response) {
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Máy chủ KPI trả lỗi (${res.status}).`)
  }
  return json
}

export function createServerKpiRepository(): KpiRepository {
  return {
    async load() {
      const res = await fetch('/api/kpi/database', { cache: 'no-store', credentials: 'same-origin' })
      return (await readJson(res)).data as KpiDatabase
    },
    async save(next, expectedRevision) {
      const res = await fetch('/api/kpi/database', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: next, expected_revision: expectedRevision }),
      })
      return (await readJson(res)).data as KpiDatabase
    },
    async reset() {
      // Máy chủ không tự nạp dữ liệu mẫu: KPI để trống cho đến khi CEO/HR thiết lập.
    },
  }
}

async function callPeer(action: string, args: unknown[]) {
  const res = await fetch('/api/kpi/peer-reviews', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, args }),
  })
  return (await readJson(res)).data
}

/** Người thao tác luôn lấy từ phiên đăng nhập trên máy chủ, tham số actor ở trình duyệt bị bỏ qua. */
export function createServerPeerReviewRepository(): KpiPeerReviewRepository {
  return {
    listReviewerTasks: () => callPeer('listReviewerTasks', []),
    listManagerQueue: () => callPeer('listManagerQueue', []),
    submitResponse: async (_actor, assignmentId, draft) => { await callPeer('submitResponse', [assignmentId, draft]) },
    selectReviewers: async (_actor, monthlyReviewId, reviewerIds, reason) => {
      await callPeer('selectReviewers', [monthlyReviewId, reviewerIds, reason])
    },
    approveMonthlyReview: (_actor, monthlyReviewId) => callPeer('approveMonthlyReview', [monthlyReviewId]),
    returnMonthlyReview: (_actor, monthlyReviewId, reason) => callPeer('returnMonthlyReview', [monthlyReviewId, reason]),
    getEmployeeAggregate: (_actor, monthlyReviewId) => callPeer('getEmployeeAggregate', [monthlyReviewId]),
    revealReviewerIdentity: (_actor, assignmentId, reason) => callPeer('revealReviewerIdentity', [assignmentId, reason]),
    listIntegrityFlags: () => callPeer('listIntegrityFlags', []),
    resolveIntegrityFlag: (_actor, flagId, decision, reason) => callPeer('resolveIntegrityFlag', [flagId, decision, reason]),
  }
}

export interface KpiServerImportStatus {
  kpi: { server_empty: boolean; can_import: boolean }
  peer: { server_empty: boolean; can_import: boolean }
}

export async function getKpiServerImportStatus(): Promise<KpiServerImportStatus> {
  const [kpiRes, peerRes] = await Promise.all([
    fetch('/api/kpi/database', { cache: 'no-store', credentials: 'same-origin' }),
    fetch('/api/kpi/peer-reviews', { cache: 'no-store', credentials: 'same-origin' }),
  ])
  const kpi = await readJson(kpiRes)
  const peer = await readJson(peerRes)
  return {
    kpi: { server_empty: Boolean(kpi.server_empty), can_import: Boolean(kpi.can_import) },
    peer: { server_empty: Boolean(peer.server_empty), can_import: Boolean(peer.can_import) },
  }
}

export async function importKpiFromBrowser(database: unknown) {
  const res = await fetch('/api/kpi/database', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'import_from_browser', database }),
  })
  await readJson(res)
}

export async function importPeerReviewsFromBrowser(database: unknown) {
  const res = await fetch('/api/kpi/peer-reviews', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'import_from_browser', database }),
  })
  await readJson(res)
}
