'use client'

// Cài đặt cách chấm công theo từng chi nhánh: Wi-Fi quán, mã QR hoặc cả hai.
// Đọc: GET /api/stores/checkin-method. Lưu: POST /api/stores/checkin-method (quản lý chi nhánh, CEO, HR).

import { useEffect, useState } from 'react'
import { CHECKIN_METHOD_OPTIONS, type CheckinMethod } from '@/lib/attendance/checkin-method'

interface StoreRow {
  id: string
  name: string
  checkin_method: CheckinMethod
  wifi_public_ips: string[]
  require_gps: boolean
}

export default function StoreCheckinMethodPanel() {
  const [stores, setStores] = useState<StoreRow[]>([])
  const [currentIp, setCurrentIp] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [manualIp, setManualIp] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/stores/checkin-method', { cache: 'no-store' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Không tải được cài đặt chấm công.')
      setStores(json.data.stores)
      setCurrentIp(json.data.current_ip || '')
      setSelectedId((prev) => prev || json.data.stores[0]?.id || '')
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : 'Không tải được cài đặt chấm công.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => void load(), 0)
    return () => clearTimeout(t)
  }, [])

  const store = stores.find((s) => s.id === selectedId)

  const save = async (payload: Record<string, unknown>) => {
    if (!store) return
    setBusy(true)
    setNotice(null)
    try {
      const res = await fetch('/api/stores/checkin-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: store.id, ...payload }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Lưu không thành công.')
      setStores((list) => list.map((s) => (s.id === store.id ? { ...s, ...json.data } : s)))
      setNotice({ ok: true, text: json.message || 'Đã lưu.' })
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : 'Lưu không thành công.' })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">Đang tải cài đặt chấm công...</div>
  }

  if (!store) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
        {notice?.text || 'Bạn chưa được phân quyền quản lý chi nhánh nào.'}
      </div>
    )
  }

  const currentSaved = !!currentIp && store.wifi_public_ips.includes(currentIp)

  return (
    <div className="space-y-4">
      {stores.length > 1 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Chi nhánh</label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value)
              setNotice(null)
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {notice && (
        <div className={`rounded-xl px-4 py-3 text-sm ${notice.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {notice.text}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold text-gray-900">Cách chấm công</h2>
        <p className="mt-1 text-xs text-gray-500">Áp dụng cho cả lúc vào ca và tan ca tại {store.name}.</p>
        <div className="mt-4 space-y-2">
          {CHECKIN_METHOD_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                store.checkin_method === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="checkin_method"
                className="mt-1"
                checked={store.checkin_method === opt.value}
                disabled={busy}
                onChange={() => void save({ checkin_method: opt.value })}
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                <span className="block text-xs text-gray-500">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>

        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={store.require_gps}
            disabled={busy}
            onChange={(e) => void save({ require_gps: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-medium text-gray-900">Kiểm tra thêm vị trí GPS</span>
            <span className="block text-xs text-gray-500">
              Nhân viên phải bật định vị và ở trong bán kính của quán. Tắt nếu điện thoại trong quán hay báo sai vị trí.
            </span>
          </span>
        </label>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold text-gray-900">Wi-Fi của quán</h2>
        <p className="mt-1 text-xs text-gray-500">
          Cách lưu: đứng tại quán, kết nối Wi-Fi của quán (tắt 4G), rồi bấm &quot;Dùng mạng hiện tại&quot;.
          Nếu nhà mạng đổi địa chỉ (thường sau khi khởi động lại modem), bấm lại nút này để cập nhật.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 p-3">
          <div className="flex-1 text-sm text-gray-700">
            Mạng bạn đang dùng: <span className="font-mono font-medium">{currentIp || 'không xác định'}</span>
            {currentSaved && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Đã lưu</span>}
          </div>
          <button
            type="button"
            disabled={busy || !currentIp || currentSaved}
            onClick={() => void save({ action: 'add_current_ip' })}
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Dùng mạng hiện tại
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {store.wifi_public_ips.length === 0 && (
            <li className="text-sm text-gray-500">Chưa lưu mạng nào. Nhân viên sẽ chấm công bằng mã QR.</li>
          )}
          {store.wifi_public_ips.map((ip) => (
            <li key={ip} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
              <span className="font-mono text-sm">{ip}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save({ wifi_public_ips: store.wifi_public_ips.filter((x) => x !== ip) })}
                className="text-sm text-red-600 disabled:opacity-50"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <input
            value={manualIp}
            onChange={(e) => setManualIp(e.target.value)}
            placeholder="Hoặc nhập địa chỉ mạng (vd. 113.161.10.20)"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy || !manualIp.trim()}
            onClick={() => {
              void save({ wifi_public_ips: [...store.wifi_public_ips, manualIp.trim()] }).then(() => setManualIp(''))
            }}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            Thêm
          </button>
        </div>
      </section>
    </div>
  )
}
