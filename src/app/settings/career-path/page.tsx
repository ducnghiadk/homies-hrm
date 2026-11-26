'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { normalizeCareerPathSettings, validateCareerPathSettings, type CareerPathSettings } from '@/lib/career-path/settings'
import CareerGradesPanel from '@/components/career-path-v7/CareerGradesPanel'
import CareerApprovalPanel from '@/components/career-path-v7/CareerApprovalPanel'
import CareerSkillCatalogPanel from '@/components/career-path-v7/CareerSkillCatalogPanel'
import CareerRulesPanel from '@/components/career-path-v7/CareerRulesPanel'
import CareerKpiPanel from '@/components/career-path-v7/CareerKpiPanel'
import { applyPlaybookV7Suggestion } from '@/lib/career-path/settings-suggestion'

type Tab = 'grades' | 'approval' | 'skills' | 'kpi' | 'rules'
const TABS: { id: Tab; label: string }[] = [
  { id: 'grades', label: 'Bậc & lương' },
  { id: 'approval', label: 'Đánh giá & duyệt' },
  { id: 'skills', label: 'Kỹ năng' },
  { id: 'kpi', label: 'KPI & vận hành' },
  { id: 'rules', label: 'Quy tắc tính' },
]
const ADMIN = ['ceo', 'hr_admin']

export default function CareerPathSettingsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('grades')
  const [saved, setSaved] = useState<CareerPathSettings | null>(null)
  const [draft, setDraft] = useState<CareerPathSettings | null>(null)
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const canEdit = Boolean(user && ADMIN.includes(user.role))

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) router.replace('/login?redirect=/settings/career-path')
    else if (user && !ADMIN.includes(user.role)) router.replace('/settings')
  }, [hasHydrated, isAuthenticated, user, router])

  const fetchSettings = async (): Promise<CareerPathSettings> => {
    const res = await fetch('/api/career-path/settings', { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Không tải được cài đặt.')
    return normalizeCareerPathSettings(json.settings)
  }

  const applyLoaded = (s: CareerPathSettings) => {
    setLoadError('')
    setSaved(s)
    setDraft(s)
  }
  const applyLoadError = (e: unknown) => setLoadError(e instanceof Error ? e.message : 'Không tải được cài đặt.')

  const reload = () => {
    setLoadError('')
    fetchSettings().then(applyLoaded).catch(applyLoadError)
  }

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return
    let alive = true
    fetchSettings()
      .then((s) => { if (alive) applyLoaded(s) })
      .catch((e) => { if (alive) applyLoadError(e) })
    return () => { alive = false }
  }, [hasHydrated, isAuthenticated])

  // Chưa cài đặt lần nào thì vẫn cho lưu (kể cả chưa sửa gì) để bật lộ trình.
  const dirty = Boolean(draft && saved && (JSON.stringify(draft) !== JSON.stringify(saved) || !saved.configured))
  const fillSuggestion = () => {
    if (!draft) return
    setDraft(applyPlaybookV7Suggestion(draft))
    setMessage({ kind: 'ok', text: 'Đã điền số gợi ý theo Playbook V7 vào bản nháp. Kiểm tra, sửa nếu cần rồi bấm “Lưu cài đặt”.' })
  }
  const errors = draft ? validateCareerPathSettings(draft) : []

  const save = async () => {
    if (!draft || errors.length > 0) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/career-path/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: draft, version: saved?.version }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Không lưu được.')
      const s = normalizeCareerPathSettings(json.settings)
      setSaved(s)
      setDraft(s)
      setMessage({ kind: 'ok', text: `Đã lưu cài đặt (phiên bản ${s.version}).` })
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Không lưu được.' })
    } finally {
      setSaving(false)
    }
  }

  const changed = Boolean(draft && saved && JSON.stringify(draft) !== JSON.stringify(saved))

  return (
    <AppShell title="Cài đặt lộ trình thăng tiến">
      <div className="min-h-screen bg-[#FFF8E8] px-4 py-5 pb-28 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Link href="/settings" className="text-xs font-semibold text-[#2F6FA8]">← Trung tâm cài đặt</Link>
              <h1 className="mt-1 text-xl font-bold text-[#001D3D]">Lộ trình thăng tiến</h1>
              <p className="text-sm text-gray-500">T0 → G1 → G2 → G3 → G4. Mọi con số do CEO/HR nhập ở đây.</p>
            </div>
            {saved?.configured && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Đang áp dụng · phiên bản {saved.version}
                {saved.updated_at ? ` · ${new Date(saved.updated_at).toLocaleDateString('vi-VN')}` : ''}
              </span>
            )}
          </div>

          {saved && !saved.configured && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
              <div className="text-sm text-orange-800">
                <div className="font-semibold">Lộ trình chưa hoạt động</div>
                Nhập các con số rồi bấm Lưu. Trước khi lưu, hệ thống chưa xét bậc, chưa đề xuất và chưa cộng lương.
              </div>
              {canEdit && draft && (
                <button type="button" onClick={fillSuggestion} className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm font-semibold text-orange-800">
                  Điền gợi ý theo Playbook V7
                </button>
              )}
            </div>
          )}
          {message && (
            <div className={`rounded-xl border px-4 py-2.5 text-sm ${message.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-[#001D3D] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}{' '}
              <button type="button" onClick={reload} className="font-semibold underline">Thử lại</button>
            </div>
          )}
          {!draft && !loadError && <p className="py-10 text-center text-sm text-gray-500">Đang tải cài đặt...</p>}

          {draft && tab === 'grades' && <CareerGradesPanel settings={draft} readOnly={!canEdit} onChange={setDraft} />}
          {draft && tab === 'approval' && <CareerApprovalPanel settings={draft} readOnly={!canEdit} onChange={setDraft} />}
          {draft && tab === 'skills' && <CareerSkillCatalogPanel settings={draft} readOnly={!canEdit} onChange={setDraft} />}
          {draft && tab === 'kpi' && <CareerKpiPanel settings={draft} readOnly={!canEdit} onChange={setDraft} />}
          {draft && tab === 'rules' && <CareerRulesPanel settings={draft} readOnly={!canEdit} onChange={setDraft} />}

          {canEdit && saved?.configured && draft && (
            <p className="text-center text-xs text-gray-400">
              Muốn bắt đầu lại từ số mẫu?{' '}
              <button type="button" onClick={fillSuggestion} className="font-semibold text-[#2F6FA8] underline">Điền gợi ý theo Playbook V7</button>
            </p>
          )}
        </div>
      </div>

      {canEdit && dirty && draft && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:bottom-0">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              {errors.length > 0 ? (
                <span className="text-amber-700">
                  Cần sửa {errors.length} chỗ trước khi lưu: {errors[0]}{errors.length > 1 ? '…' : ''}
                </span>
              ) : (
                <span className="text-[#001D3D]">{changed ? 'Có thay đổi chưa lưu' : 'Bấm Lưu để bật lộ trình'}</span>
              )}
            </div>
            <div className="flex gap-2">
              {changed && saved && (
                <button type="button" onClick={() => { setDraft(saved); setMessage(null) }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600">
                  Bỏ thay đổi
                </button>
              )}
              <button type="button" disabled={saving || errors.length > 0} onClick={save} className="rounded-lg bg-[#2F6FA8] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
