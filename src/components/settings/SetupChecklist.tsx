'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ChevronDown, ChevronRight, Circle } from 'lucide-react'
import type { SetupChecklist as Checklist } from '@/lib/settings/setup-checklist'

/** Khung "Việc cần cài đặt" cho CEO/HR, đọc dữ liệu thật từ /api/setup-status. */
export function SetupChecklist({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<Checklist | null>(null)
  const [failed, setFailed] = useState(false)
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/setup-status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active) return
        if (json?.success) setData(json.data)
        else setFailed(true)
      })
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [])

  if (failed) return null
  if (!data) {
    return (
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 text-sm text-gray-500 shadow-xs">
        Đang kiểm tra việc cần cài đặt…
      </div>
    )
  }

  const todo = data.steps.filter((s) => !s.done)
  const done = data.steps.filter((s) => s.done)
  const allRequiredDone = data.requiredDone === data.requiredCount
  if (compact && allRequiredDone) return null

  const percent = Math.round((data.requiredDone / Math.max(1, data.requiredCount)) * 100)

  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#001D3D]">Việc cần cài đặt</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {allRequiredDone
              ? 'Đã cài đủ để chạy chấm công, xếp lịch và tính lương.'
              : `Đã xong ${data.requiredDone}/${data.requiredCount} việc bắt buộc. Làm lần lượt từ trên xuống.`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#FFF8E8] px-3 py-1 text-sm font-semibold text-[#001D3D]">{percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-[#2F6FA8] transition-all" style={{ width: `${percent}%` }} />
      </div>

      {todo.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100">
          {(compact ? todo.slice(0, 3) : todo).map((s) => (
            <li key={s.id}>
              <Link href={s.href} className="flex items-start gap-3 py-3 hover:text-[#2F6FA8]">
                <Circle size={18} className="mt-0.5 shrink-0 text-gray-300" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-800">
                    {s.title}
                    {s.optional && <span className="ml-2 text-xs font-normal text-gray-400">(không bắt buộc)</span>}
                  </span>
                  <span className="block text-xs text-gray-500">{s.detail}</span>
                </span>
                <ChevronRight size={16} className="mt-1 shrink-0 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {compact && todo.length > 3 && (
        <Link href="/settings" className="mt-1 block text-sm font-medium text-[#2F6FA8]">
          Xem cả {todo.length} việc
        </Link>
      )}

      {!compact && done.length > 0 && (
        <div className="mt-2 border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#2F6FA8]"
          >
            <ChevronDown size={16} className={showDone ? 'rotate-180 transition' : 'transition'} />
            Đã xong ({done.length})
          </button>
          {showDone && (
            <ul className="mt-1 divide-y divide-gray-100">
              {done.map((s) => (
                <li key={s.id}>
                  <Link href={s.href} className="flex items-start gap-3 py-2.5">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-700">{s.title}</span>
                      <span className="block text-xs text-gray-500">{s.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
