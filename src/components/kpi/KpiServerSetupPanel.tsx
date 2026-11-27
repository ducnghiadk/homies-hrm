'use client'

import { useEffect, useState } from 'react'
import { Database, PlusCircle, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { KPI_REPOSITORY_STORAGE_KEY } from '@/lib/kpi/repository'
import { KPI_PEER_REVIEW_DEMO_STORAGE_KEY } from '@/lib/kpi/local-peer-review-repository'
import {
  getKpiServerImportStatus,
  importKpiFromBrowser,
  importPeerReviewsFromBrowser,
  type KpiServerImportStatus,
} from '@/lib/kpi/server-kpi-repository'

interface Props {
  onStartBlank: () => Promise<void> | void
  onImported: () => void
}

function readBrowserJson(key: string): unknown | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Hiện khi máy chủ chưa có chương trình KPI nào (chỉ CEO/HR thấy trang này).
 * Cho chọn: chuyển dữ liệu KPI cũ đang lưu trên trình duyệt này lên máy chủ (một lần),
 * hoặc bắt đầu thiết lập từ bản nháp trống.
 */
export function KpiServerSetupPanel({ onStartBlank, onImported }: Props) {
  const [status, setStatus] = useState<KpiServerImportStatus | null>(null)
  const [browserKpi, setBrowserKpi] = useState<unknown | null>(null)
  const [browserPeer, setBrowserPeer] = useState<unknown | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getKpiServerImportStatus()
      .then((next) => {
        if (cancelled) return
        setStatus(next)
        setBrowserKpi(readBrowserJson(KPI_REPOSITORY_STORAGE_KEY))
        setBrowserPeer(readBrowserJson(KPI_PEER_REVIEW_DEMO_STORAGE_KEY))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const canImportKpi = Boolean(status?.kpi.can_import && browserKpi)
  const canImportPeer = Boolean(status?.peer.can_import && browserPeer)

  async function handleImport() {
    if (!window.confirm('Dữ liệu trên trình duyệt này có thể chỉ là dữ liệu mẫu. Bạn chắc chắn đây là dữ liệu thật và muốn chuyển lên máy chủ?')) return
    setBusy(true)
    try {
      if (canImportKpi) await importKpiFromBrowser(browserKpi)
      if (canImportPeer) {
        try {
          await importPeerReviewsFromBrowser(browserPeer)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Chưa chuyển được đánh giá đồng nghiệp.')
        }
      }
      toast.success('Đã chuyển dữ liệu lên máy chủ. Dữ liệu trên trình duyệt vẫn được giữ nguyên.')
      onImported()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Chưa chuyển được dữ liệu KPI.')
    } finally {
      setBusy(false)
    }
  }

  async function handleStart() {
    setBusy(true)
    try {
      await onStartBlank()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 shrink-0 text-[#2F6FA8]" size={22} />
          <div>
            <h2 className="text-base font-bold text-[#001D3D]">Chưa có chương trình đánh giá trên máy chủ</h2>
            <p className="mt-1 text-sm text-gray-600">
              Dữ liệu KPI và đánh giá đồng nghiệp nay lưu trên máy chủ để mọi máy, mọi người dùng thấy cùng một dữ liệu.
              Hãy bắt đầu thiết lập, hoặc chuyển dữ liệu cũ từ trình duyệt này lên.
            </p>
          </div>
        </div>

        {(canImportKpi || canImportPeer) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
            <p className="text-sm text-amber-900">
              Trình duyệt này đang có dữ liệu KPI cũ
              {canImportPeer ? ' và đánh giá đồng nghiệp' : ''}. Chỉ chuyển nếu đây là dữ liệu thật của quán,
              vì bản cũ có thể là dữ liệu mẫu. Việc chuyển chỉ làm được một lần khi máy chủ còn trống.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleImport()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <UploadCloud size={16} />
              Chuyển dữ liệu cũ lên máy chủ
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void handleStart()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2F6FA8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <PlusCircle size={16} />
          Bắt đầu thiết lập chương trình mới
        </button>
      </div>
    </div>
  )
}
