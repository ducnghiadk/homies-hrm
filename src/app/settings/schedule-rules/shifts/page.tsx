'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { ShiftTemplateService, type ShiftTemplate, type ShiftTemplateScope } from '@/lib/services/shift-template-service'
import { ArrowLeft, Copy, Plus, Power, Store, Users2 } from 'lucide-react'

type FormState = {
  id?: string
  name: string
  code: string
  start_time: string
  end_time: string
  color: string
  store_scope: ShiftTemplateScope
  store_id?: string
  is_active: boolean
  allowed_position_ids: string[]
  min_headcount: number
  max_headcount: number
}

const DEFAULT_FORM: FormState = {
  name: '',
  code: '',
  start_time: '07:00',
  end_time: '14:00',
  color: '#2F6FA8',
  store_scope: 'global',
  store_id: undefined,
  is_active: true,
  allowed_position_ids: [],
  min_headcount: 1,
  max_headcount: 4,
}

function toFormState(template: ShiftTemplate): FormState {
  return {
    id: template.id,
    name: template.name,
    code: template.code,
    start_time: template.start_time,
    end_time: template.end_time,
    color: template.color,
    store_scope: template.store_scope,
    store_id: template.store_id,
    is_active: template.is_active,
    allowed_position_ids: template.allowed_position_ids || [],
    min_headcount: template.min_headcount || 1,
    max_headcount: template.max_headcount || 1,
  }
}

export default function ScheduleRuleShiftsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedStoreId, setSelectedStoreId] = useState('all')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [editing, setEditing] = useState<FormState | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const canManage = ['ceo', 'hr_admin', 'store_manager'].includes(user?.role || '')
  const templates = useMemo(() => {
    void refreshKey
    const source = user?.role === 'store_manager'
      ? ShiftTemplateService.getAllForStore(user.store_id)
      : ShiftTemplateService.getAll()

    const filtered = selectedStoreId === 'all'
      ? source
      : source.filter(template => template.store_scope === 'global' || template.store_id === selectedStoreId)

    return filtered.sort((left, right) => left.start_time.localeCompare(right.start_time))
  }, [refreshKey, selectedStoreId, user])

  const selectedTemplate = useMemo(() => {
    if (!templates.length) return null
    return templates.find(template => template.id === selectedTemplateId) || templates[0]
  }, [selectedTemplateId, templates])

  const activeTemplateId = editing?.id || selectedTemplateId || templates[0]?.id || null

  if (!user) return null

  if (!canManage) {
    return (
      <AppShell title="Setting Ca">
        <div className="py-20 text-center text-sm text-gray-500">Bạn không có quyền quản lý mẫu ca.</div>
      </AppShell>
    )
  }

  const handleCreate = () => {
    const scope: ShiftTemplateScope = user.role === 'store_manager' ? 'store_specific' : 'global'
    setSelectedTemplateId(null)
    setEditing({
      ...DEFAULT_FORM,
      store_scope: scope,
      store_id: scope === 'store_specific' ? user.store_id : undefined,
    })
  }

  const handleSave = () => {
    if (!editing || !editing.name.trim() || !editing.code.trim()) return

    if (editing.id) {
      const existing = ShiftTemplateService.getById(editing.id)
      if (!existing) return
      ShiftTemplateService.upsert({
        ...existing,
        ...editing,
        code: editing.code.trim().toUpperCase(),
        name: editing.name.trim(),
        store_id: editing.store_scope === 'store_specific' ? (editing.store_id || user.store_id) : undefined,
      })
      setToast('Đã cập nhật ca.')
      setSelectedTemplateId(editing.id)
    } else {
      const created = ShiftTemplateService.createForStore(editing.store_id || user.store_id, {
        name: editing.name.trim(),
        code: editing.code.trim().toUpperCase(),
        start_time: editing.start_time,
        end_time: editing.end_time,
        color: editing.color,
        store_scope: editing.store_scope,
        allowed_position_ids: editing.allowed_position_ids,
        min_headcount: editing.min_headcount,
        max_headcount: editing.max_headcount,
      })
      setToast('Đã tạo ca mới.')
      setSelectedTemplateId(created.id)
    }

    setRefreshKey(value => value + 1)
  }

  const handleCloneToStore = (storeId: string) => {
    if (!selectedTemplate) return
    ShiftTemplateService.createForStore(storeId, {
      name: `${selectedTemplate.name} - ${mockStores.find(store => store.id === storeId)?.name || storeId}`,
      code: `${selectedTemplate.code}-${storeId.slice(-3).toUpperCase()}`,
      start_time: selectedTemplate.start_time,
      end_time: selectedTemplate.end_time,
      color: selectedTemplate.color,
      store_scope: 'store_specific',
      allowed_position_ids: selectedTemplate.allowed_position_ids || [],
      min_headcount: selectedTemplate.min_headcount,
      max_headcount: selectedTemplate.max_headcount,
    })
    setRefreshKey(value => value + 1)
    setToast('Đã clone mẫu ca cho chi nhánh.')
  }

  return (
    <AppShell showNav>
      <div className="space-y-5 pb-20">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push('/settings/schedule-rules')}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-800">Setting Ca</h1>
              <p className="mt-1 text-xs text-gray-400">Quản lý mẫu ca dùng chung hoặc theo chi nhánh để phục vụ lập nhu cầu tuần và gán người.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(user.role === 'ceo' || user.role === 'hr_admin') && (
              <select
                value={selectedStoreId}
                onChange={event => setSelectedStoreId(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                <option value="all">Tất cả chi nhánh</option>
                {mockStores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              <Plus size={14} /> Tạo ca mới
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-gray-800">Danh sách ca</h2>
              <p className="text-xs text-gray-400">{templates.length} mẫu ca hiện có</p>
            </div>

            <div className="space-y-3">
              {templates.map(template => {
                const isSelected = template.id === activeTemplateId
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplateId(template.id)
                      setEditing(toFormState(template))
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isSelected ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: template.color }} />
                          <span className="text-sm font-bold text-gray-800">{template.name}</span>
                          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-gray-600">{template.code}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">{template.name} · {template.start_time} - {template.end_time}</div>
                        <div className="mt-1 text-xs text-gray-500">Vị trí: {ShiftTemplateService.getPositionLabels(template).join(', ') || 'Chưa giới hạn'}</div>
                        <div className="mt-1 text-xs text-gray-500">Mặc định: {template.min_headcount || 0}-{template.max_headcount || 0} người</div>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${template.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                        {template.is_active ? 'active' : 'inactive'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            {editing ? (
              <>
                <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{editing.id ? 'Chi tiết ca' : 'Tạo ca mới'}</h2>
                    <p className="mt-1 text-xs text-gray-400">Preview: {editing.name || 'Tên ca'} · {editing.start_time} - {editing.end_time}</p>
                    <p className="mt-1 text-xs text-gray-400">Vị trí: {editing.allowed_position_ids.map(id => mockPositions.find(position => position.id === id)?.name || id).join(', ') || 'Chưa chọn'}</p>
                    <p className="mt-1 text-xs text-gray-400">Mặc định: {editing.min_headcount}-{editing.max_headcount} người</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editing.id && (
                      <button
                        onClick={() => {
                          ShiftTemplateService.toggleActive(editing.id!)
                          setRefreshKey(value => value + 1)
                          setToast('Đã đổi trạng thái ca.')
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                      >
                        <Power size={14} /> Bật/tắt ca
                      </button>
                    )}
                    <button
                      onClick={handleSave}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                    >
                      Lưu ca
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} placeholder="Tên ca" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  <input value={editing.code} onChange={event => setEditing({ ...editing, code: event.target.value.toUpperCase() })} placeholder="Mã ca" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  <input type="time" value={editing.start_time} onChange={event => setEditing({ ...editing, start_time: event.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  <input type="time" value={editing.end_time} onChange={event => setEditing({ ...editing, end_time: event.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  <input type="number" min={0} value={editing.min_headcount} onChange={event => setEditing({ ...editing, min_headcount: Number(event.target.value) })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  <input type="number" min={1} value={editing.max_headcount} onChange={event => setEditing({ ...editing, max_headcount: Number(event.target.value) })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  <input type="color" value={editing.color} onChange={event => setEditing({ ...editing, color: event.target.value })} className="h-11 w-full rounded-xl border border-gray-200 px-2 py-1" />
                  <select value={editing.store_scope} onChange={event => setEditing({ ...editing, store_scope: event.target.value as ShiftTemplateScope })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                    <option value="global">Dùng chung toàn hệ thống</option>
                    <option value="store_specific">Theo chi nhánh</option>
                  </select>
                  {editing.store_scope === 'store_specific' && (
                    <select value={editing.store_id || user.store_id} onChange={event => setEditing({ ...editing, store_id: event.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2">
                      {mockStores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
                    <Users2 size={15} className="text-primary-600" />
                    Vị trí được phép trong ca
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {mockPositions.map(position => {
                      const checked = editing.allowed_position_ids.includes(position.id)
                      return (
                        <label key={position.id} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={event => setEditing({
                              ...editing,
                              allowed_position_ids: event.target.checked
                                ? [...editing.allowed_position_ids, position.id]
                                : editing.allowed_position_ids.filter(id => id !== position.id),
                            })}
                          />
                          {position.name}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {editing.id && user.role !== 'store_manager' && (
                  <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                      <Store size={15} className="text-primary-600" />
                      Clone ca mẫu cho chi nhánh
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {mockStores
                        .filter(store => store.id !== editing.store_id)
                        .map(store => (
                          <button
                            key={store.id}
                            onClick={() => handleCloneToStore(store.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                          >
                            <Copy size={13} /> {store.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                Chọn một mẫu ca bên trái hoặc tạo ca mới để bắt đầu.
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
