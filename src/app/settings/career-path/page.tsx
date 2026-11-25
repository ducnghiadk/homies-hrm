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

type Tab = 'grades' | 'approval' | 'skills'
const TABS: { id: Tab; label: string }[] = [
  { id: 'grades', label: 'Bậc & lương' },
  { id: 'approval', label: 'Đánh giá & duyệt' },
  { id: 'skills', label: 'Kỹ năng' },
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

  const dirty = Boolean(draft && saved && JSON.stringify(draft) !== JSON.stringify(saved))
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

  return (
    <AppShell title="Cài đặt lộ trình thăng tiến">
      <div className="min-h-screen bg-[#FFF8E8] px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link href="/settings" className="text-xs font-semibold text-[#2F6FA8]">← Trung tâm cài đặt</Link>
              <h1 className="mt-1 text-xl font-bold text-[#001D3D]">Lộ trình thăng tiến</h1>
              <p className="text-sm text-gray-500">
                Bậc T0 → G1 → G2 → G3 → G4 theo vị trí chính (Thu ngân / Pha chế). Mọi mốc và mức tiền đều chỉnh được ở đây.
              </p>
              {saved && (
                <p className="mt-1 text-xs text-gray-400">
                  Phiên bản {saved.version}
                  {saved.updated_by ? ` · cập nhật bởi ${saved.updated_by}` : ''}
                  {saved.updated_at ? ` lúc ${new Date(saved.updated_at).toLocaleString('vi-VN')}` : ' · đang dùng cài đặt mặc định theo Playbook V7'}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link href="/career-path/placement" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#001D3D]">
                Xếp bậc nhân viên
              </Link>
              {canEdit && (
                <button
                  type="button"
                  disabled={!dirty || saving || errors.length > 0}
                  onClick={save}
                  className="rounded-lg bg-[#2F6FA8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>
              )}
            </div>
          </div>

          {message && (
            <div className={`rounded-xl border px-4 py-2.5 text-sm ${message.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}
          {errors.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              <div className="font-semibold">Cần sửa trước khi lưu:</div>
              <ul className="mt-1 list-disc pl-5">{errors.slice(0, 6).map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          )}

          <div className="flex gap-1.5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${tab === t.id ? 'bg-[#001D3D] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
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
        </div>
      </div>
    </AppShell>
  )
}
