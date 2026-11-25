'use client'

// Cài đặt vận hành lưu trên máy chủ: hạn chót nộp lịch rảnh + cách tính giờ công / đi trễ.
// Đọc: GET /api/operation-settings. Lưu (chỉ CEO / HR Admin): POST /api/operation-settings.

import { useEffect, useState } from 'react'
import {
  DEFAULT_OPERATION_SETTINGS,
  ROUNDING_OPTIONS,
  normalizeOperationSettings,
  type OperationSettings,
} from '@/lib/attendance/operation-settings'

const WEEKDAY_BEFORE_MONDAY: Record<number, string> = {
  1: 'Chủ nhật',
  2: 'Thứ 7',
  3: 'Thứ 6',
  4: 'Thứ 5',
  5: 'Thứ 4',
  6: 'Thứ 3',
  7: 'Thứ 2 tuần trước',
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-pressed={checked}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {hint && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function OperationSettingsPanel({ canEdit }: { canEdit: boolean }) {
  const [settings, setSettings] = useState<OperationSettings>(DEFAULT_OPERATION_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/operation-settings', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.success) setSettings(normalizeOperationSettings(json.data))
      })
      .catch(() => {
        if (!cancelled) setMessage({ type: 'error', text: 'Không tải được cài đặt từ máy chủ. Đang hiển thị giá trị mặc định.' })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const dl = settings.availability_deadline
  const at = settings.attendance
  const disabled = !canEdit || loading || saving

  const setDeadline = (patch: Partial<OperationSettings['availability_deadline']>) =>
    setSettings((s) => ({ ...s, availability_deadline: { ...s.availability_deadline, ...patch } }))
  const setAttendance = (patch: Partial<OperationSettings['attendance']>) =>
    setSettings((s) => ({ ...s, attendance: { ...s.attendance, ...patch } }))

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/operation-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        setMessage({ type: 'error', text: json?.error || 'Lưu cài đặt thất bại.' })
      } else {
        setSettings(normalizeOperationSettings(json.data))
        setMessage({ type: 'ok', text: 'Đã lưu cài đặt. Áp dụng ngay cho lần chấm công và đăng ký lịch tiếp theo.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Không kết nối được máy chủ.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white shadow-xs p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">Cài đặt vận hành (áp dụng toàn chuỗi)</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {canEdit ? 'Thay đổi ở đây được lưu trên máy chủ và áp dụng cho mọi nhân viên.' : 'Chỉ CEO hoặc HR Admin được thay đổi phần này.'}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={save}
            disabled={disabled}
            className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        )}
      </div>

      {message && (
        <div className={`text-xs rounded-xl px-3 py-2 border ${message.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}

      <section>
        <h4 className="text-sm font-bold text-gray-800 mb-1">Hạn chót nộp lịch rảnh</h4>
        <Row title="Bật hạn chót" hint="Sau hạn chót, nhân viên không tự sửa lịch rảnh của tuần đó được nữa (quản lý vẫn sửa được).">
          <Toggle checked={dl.enabled} onChange={(v) => setDeadline({ enabled: v })} disabled={disabled} />
        </Row>
        {dl.enabled && (
          <>
            <Row title="Khóa trước Thứ 2 của tuần làm" hint={`Hạn chót rơi vào ${WEEKDAY_BEFORE_MONDAY[dl.days_before_week_start] || ''}.`}>
              <select
                value={dl.days_before_week_start}
                onChange={(e) => setDeadline({ days_before_week_start: Number(e.target.value) })}
                disabled={disabled}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {d} ngày ({WEEKDAY_BEFORE_MONDAY[d]})
                  </option>
                ))}
              </select>
            </Row>
            <Row title="Giờ khóa (giờ Việt Nam)">
              <input
                type="time"
                value={dl.time}
                onChange={(e) => setDeadline({ time: e.target.value })}
                disabled={disabled}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm"
              />
            </Row>
          </>
        )}
      </section>

      <section>
        <h4 className="text-sm font-bold text-gray-800 mb-1">Cách tính giờ công &amp; đi trễ</h4>
        <Row title="Cho phép trễ tối đa (phút)" hint="Đến muộn trong khoảng này không bị tính là đi trễ.">
          <input
            type="number"
            min={0}
            max={120}
            value={at.late_grace_minutes}
            onChange={(e) => setAttendance({ late_grace_minutes: Number(e.target.value) })}
            disabled={disabled}
            className="w-24 border border-gray-200 rounded-xl px-3 py-1.5 text-sm"
          />
        </Row>
        <Row title="Tính công khi đến sớm" hint="Tắt: giờ công chỉ bắt đầu từ giờ vào ca theo lịch.">
          <Toggle checked={at.count_early_arrival} onChange={(v) => setAttendance({ count_early_arrival: v })} disabled={disabled} />
        </Row>
        <Row title="Tính công khi ở lại muộn" hint="Tắt: giờ công dừng ở giờ kết thúc ca theo lịch.">
          <Toggle checked={at.count_late_stay} onChange={(v) => setAttendance({ count_late_stay: v })} disabled={disabled} />
        </Row>
        {at.count_late_stay && (
          <Row title="Ở lại muộn được tính tối đa (phút)">
            <input
              type="number"
              min={0}
              max={360}
              value={at.late_stay_max_minutes}
              onChange={(e) => setAttendance({ late_stay_max_minutes: Number(e.target.value) })}
              disabled={disabled}
              className="w-24 border border-gray-200 rounded-xl px-3 py-1.5 text-sm"
            />
          </Row>
        )}
        <Row title="Làm tròn xuống giờ công" hint="Ví dụ chọn 15 phút: làm 4 giờ 10 phút được tính 4 giờ.">
          <select
            value={at.rounding_minutes}
            onChange={(e) => setAttendance({ rounding_minutes: Number(e.target.value) })}
            disabled={disabled}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm"
          >
            {ROUNDING_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? 'Không làm tròn' : `${m} phút`}
              </option>
            ))}
          </select>
        </Row>
        <Row title="Cho chấm công khi không có ca trong lịch" hint="Bật: vẫn ghi nhận nhưng đánh dấu “ngoài lịch” để quản lý kiểm tra.">
          <Toggle checked={at.allow_off_schedule_checkin} onChange={(v) => setAttendance({ allow_off_schedule_checkin: v })} disabled={disabled} />
        </Row>
      </section>
    </div>
  )
}
