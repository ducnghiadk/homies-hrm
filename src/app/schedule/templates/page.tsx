'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { ShiftTemplateService, type ShiftTemplate, type ShiftTemplateScope } from '@/lib/services/shift-template-service'
import { Plus, Settings2, Store, Users } from 'lucide-react'

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

const defaultForm: FormState = {
  name: '',
  code: '',
  start_time: '08:00',
  end_time: '14:00',
  color: '#2F6FA8',
  store_scope: 'global',
  is_active: true,
  allowed_position_ids: [],
  min_headcount: 1,
  max_headcount: 4,
}

export default function ScheduleTemplatesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState<FormState | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState('all')

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  const isManager = user?.role === 'store_manager' || user?.role === 'hr_admin' || user?.role === 'ceo'

  const templates = useMemo(() => {
    void refreshKey
    const base = user?.role === 'store_manager'
      ? ShiftTemplateService.getAllForStore(user.store_id)
      : ShiftTemplateService.getAll()
    return selectedStoreId === 'all'
      ? base
      : base.filter(template => template.store_scope === 'global' || template.store_id === selectedStoreId)
  }, [refreshKey, selectedStoreId, user])

  if (!user) return null

  if (!isManager) {
    return (
      <AppShell title="Shift Template">
        <div className="py-20 text-center text-gray-500">Bạn không có quyền quản lý mẫu ca.</div>
      </AppShell>
    )
  }

  const openCreate = () => {
    setEditing({
      ...defaultForm,
      store_scope: user.role === 'store_manager' ? 'store_specific' : 'global',
      store_id: user.role === 'store_manager' ? user.store_id : undefined,
    })
  }

  const openEdit = (template: ShiftTemplate) => {
    setEditing({
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
    })
  }

  const saveTemplate = () => {
    if (!editing || !editing.name.trim() || !editing.code.trim()) return

    if (editing.id) {
      const existing = ShiftTemplateService.getById(editing.id)
      if (!existing) return
      ShiftTemplateService.upsert({
        ...existing,
        name: editing.name.trim(),
        code: editing.code.trim().toUpperCase(),
        start_time: editing.start_time,
        end_time: editing.end_time,
        color: editing.color,
        store_scope: editing.store_scope,
        store_id: editing.store_scope === 'store_specific' ? (editing.store_id || user.store_id) : undefined,
        is_active: editing.is_active,
        allowed_position_ids: editing.allowed_position_ids,
        min_headcount: editing.min_headcount,
        max_headcount: editing.max_headcount,
      })
    } else {
      ShiftTemplateService.createForStore(editing.store_id || user.store_id, {
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
    }

    setEditing(null)
    setRefreshKey(value => value + 1)
  }

  return (
    <AppShell showNav>
      <div className="space-y-5 pb-20">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">Shift templates</h1>
            <p className="mt-0.5 text-xs text-gray-400">Quản lý mẫu ca, ràng buộc vị trí và sức chứa tối đa cho từng ca.</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-700"
          >
            <Plus size={14} /> Tạo template
          </button>
        </div>

        {(user.role === 'ceo' || user.role === 'hr_admin') && (
          <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <select
              value={selectedStoreId}
              onChange={event => setSelectedStoreId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            >
              <option value="all">Tất cả chi nhánh</option>
              {mockStores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-3">
          {templates.map(template => (
            <div key={template.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: template.color }} />
                    <h2 className="text-base font-bold text-gray-800">{template.name}</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">{template.code}</span>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${template.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
                      {template.is_active ? 'Đang bật' : 'Tạm tắt'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{template.start_time} - {template.end_time}</div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1"><Store size={12} /> {template.store_scope === 'global' ? 'Toàn hệ thống' : mockStores.find(store => store.id === template.store_id)?.name || template.store_id}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1"><Users size={12} /> Min {template.min_headcount || 0} · Max {template.max_headcount || 0}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1"><Settings2 size={12} /> {ShiftTemplateService.getPositionLabels(template).join(', ') || 'Không khóa vị trí'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => ShiftTemplateService.toggleActive(template.id) && setRefreshKey(value => value + 1)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {template.is_active ? 'Tắt template' : 'Bật template'}
                  </button>
                  <button
                    onClick={() => openEdit(template)}
                    className="rounded-xl bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-100"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">{editing.id ? 'Cập nhật template' : 'Tạo shift template'}</h3>
                <button onClick={() => setEditing(null)} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500">Đóng</button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Tên ca" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                <input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="Mã ca" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                <input type="time" value={editing.start_time} onChange={e => setEditing({ ...editing, start_time: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                <input type="time" value={editing.end_time} onChange={e => setEditing({ ...editing, end_time: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                <input type="color" value={editing.color} onChange={e => setEditing({ ...editing, color: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 px-2 py-1" />
                <select value={editing.store_scope} onChange={e => setEditing({ ...editing, store_scope: e.target.value as ShiftTemplateScope })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                  <option value="global">Toàn hệ thống</option>
                  <option value="store_specific">Theo chi nhánh</option>
                </select>
                {editing.store_scope === 'store_specific' && (
                  <select value={editing.store_id || user.store_id} onChange={e => setEditing({ ...editing, store_id: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2">
                    {mockStores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                )}
                <input type="number" min={0} value={editing.min_headcount} onChange={e => setEditing({ ...editing, min_headcount: Number(e.target.value) })} placeholder="Min headcount" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                <input type="number" min={1} value={editing.max_headcount} onChange={e => setEditing({ ...editing, max_headcount: Number(e.target.value) })} placeholder="Max headcount" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              </div>

              <div className="mt-4">
                <div className="mb-2 text-sm font-bold text-gray-700">Vị trí được nhận ca</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {mockPositions.map(position => {
                    const checked = editing.allowed_position_ids.includes(position.id)
                    return (
                      <label key={position.id} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => setEditing({
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

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Hủy</button>
                <button onClick={saveTemplate} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white">Lưu template</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
