'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import { mockPositions, mockStores } from '@/lib/mock-data'
import { storeAdapter, shiftAdapter } from '@/lib/adapters'
import { ShiftTemplateService, type ShiftTemplate, type ShiftTemplateScope } from '@/lib/services/shift-template-service'
import { ArrowLeft, Calendar, Clock, Copy, Plus, Power, Shield, Settings, Store, Users2, Zap } from 'lucide-react'

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
  is_flexible: boolean
  allowed_position_ids: string[]
  min_headcount: number
  max_headcount: number
}

const DEFAULT_FORM: FormState = {
  name: '',
  code: '',
  start_time: '08:30',
  end_time: '12:00',
  color: '#D97706',
  store_scope: 'global',
  store_id: undefined,
  is_active: true,
  is_flexible: false,
  allowed_position_ids: ['pos-001', 'pos-002'],
  min_headcount: 1,
  max_headcount: 2,
}

function toFormState(template: ShiftTemplate): FormState {
  const isFlex = template.is_flexible ?? (template.code === 'FLEX' || template.name.toLowerCase().includes('linh hoạt') || template.name.toLowerCase().includes('phát sinh'))
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
    is_flexible: isFlex,
    allowed_position_ids: template.allowed_position_ids || ['pos-001', 'pos-002'],
    min_headcount: template.min_headcount || 1,
    max_headcount: template.max_headcount || 2,
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
  const [stores, setStores] = useState(mockStores)
  const [shiftList, setShiftList] = useState<ShiftTemplate[]>([])

  useEffect(() => {
    storeAdapter.getStores().then(res => setStores(res))
  }, [])

  useEffect(() => {
    let isMounted = true
    shiftAdapter.getShiftTemplates().then(list => {
      if (isMounted) {
        setShiftList(list)
        if (list.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(list[0].id)
          setEditing(toFormState(list[0]))
        }
      }
    })
    return () => {
      isMounted = false
    }
  }, [refreshKey])

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
    const source = shiftList.length > 0 ? shiftList : (
      user?.role === 'store_manager'
        ? ShiftTemplateService.getAllForStore(user.store_id)
        : ShiftTemplateService.getAll()
    )

    const filtered = selectedStoreId === 'all'
      ? source
      : source.filter(template => template.store_scope === 'global' || template.store_id === selectedStoreId)

    return filtered.sort((left, right) => left.start_time.localeCompare(right.start_time))
  }, [shiftList, selectedStoreId, user])

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

  const handleSave = async () => {
    if (!editing || !editing.name.trim() || !editing.code.trim()) return

    const fullPayload: Partial<ShiftTemplate> & { name: string } = {
      id: editing.id,
      name: editing.name.trim(),
      code: editing.code.trim().toUpperCase(),
      start_time: editing.start_time,
      end_time: editing.end_time,
      color: editing.color,
      store_scope: editing.store_scope,
      store_id: editing.store_scope === 'store_specific' ? (editing.store_id || user.store_id) : undefined,
      is_active: editing.is_active,
      is_flexible: editing.is_flexible,
      allowed_position_ids: editing.allowed_position_ids,
      min_headcount: editing.min_headcount,
      max_headcount: editing.max_headcount,
    }

    const saved = await shiftAdapter.upsertShiftTemplate(fullPayload)
    ShiftTemplateService.upsert(saved)
    setSelectedTemplateId(saved.id)
    setEditing(toFormState(saved))
    setToast('Đã lưu mẫu ca vào CSDL thành công!')
    setRefreshKey(v => v + 1)
  }

  const handleCloneToStore = async (storeId: string) => {
    if (!selectedTemplate) return
    const storeObj = stores.find(store => store.id === storeId)
    const storeShortName = storeObj ? storeObj.name.replace('Homies Milk Tea - ', '') : storeId
    const created = await shiftAdapter.upsertShiftTemplate({
      name: `${selectedTemplate.name} - ${storeShortName}`,
      code: `${selectedTemplate.code}-${storeId.slice(-3).toUpperCase()}`,
      start_time: selectedTemplate.start_time,
      end_time: selectedTemplate.end_time,
      color: selectedTemplate.color,
      store_scope: 'store_specific',
      store_id: storeId,
      is_active: true,
      is_flexible: selectedTemplate.is_flexible,
      allowed_position_ids: selectedTemplate.allowed_position_ids || ['pos-001', 'pos-002'],
      min_headcount: selectedTemplate.min_headcount,
      max_headcount: selectedTemplate.max_headcount,
    })
    ShiftTemplateService.upsert(created)
    setSelectedTemplateId(created.id)
    setEditing(toFormState(created))
    setRefreshKey(value => value + 1)
    setToast('Đã clone mẫu ca cho chi nhánh vào CSDL.')
  }

  return (
    <AppShell showNav>
      <div className="space-y-5 pb-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings/schedule-rules')}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mẫu Ca Làm Việc</h1>
              <p className="mt-1 text-sm text-gray-500">Quản lý các ca làm việc cố định và ca linh hoạt áp dụng cho toàn hệ thống hoặc theo chi nhánh.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(user.role === 'ceo' || user.role === 'hr_admin') && (
              <select
                value={selectedStoreId}
                onChange={event => setSelectedStoreId(event.target.value)}
                className="h-11 rounded-2xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800"
              >
                <option value="all">Tất cả chi nhánh</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleCreate}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary-600 px-5 text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Tạo ca mới
            </button>
          </div>
        </div>

        {/* Top Module Sub-Navigation (4 Unified Tabs) */}
        <div className="bg-gray-100/90 p-1.5 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-1.5 text-sm font-bold border border-gray-200/50">
          <button
            onClick={() => {}}
            className="py-3 px-4 rounded-xl bg-white text-primary-700 font-bold shadow-xs flex items-center justify-center gap-2 border border-gray-200/60 cursor-pointer"
          >
            <Clock size={16} className="text-primary-600 shrink-0" />
            <span className="truncate">Mẫu Ca Làm Việc</span>
          </button>
          
          <button
            onClick={() => router.push('/settings/schedule-rules?tab=rules')}
            className="py-3 px-4 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield size={16} className="text-gray-500 shrink-0" />
            <span className="truncate">Quy Tắc Vi Phạm</span>
          </button>

          <button
            onClick={() => router.push('/settings/schedule-rules?tab=registration')}
            className="py-3 px-4 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar size={16} className="text-gray-500 shrink-0" />
            <span className="truncate">Đăng Ký & Hạn Chốt</span>
          </button>

          <button
            onClick={() => router.push('/settings/schedule-rules?tab=overrides')}
            className="py-3 px-4 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Settings size={16} className="text-gray-500 shrink-0" />
            <span className="truncate">Ngoại Lệ Vị Trí</span>
          </button>
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
                      isSelected ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-vanilla-50 hover:border-gray-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: template.color }} />
                          <span className="text-sm font-bold text-gray-800">{template.name}</span>
                          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-gray-600">{template.code}</span>
                        </div>
                        {template.is_flexible || template.code === 'FLEX' || template.name.toLowerCase().includes('linh hoạt') ? (
                          <div className="mt-2 text-xs font-bold text-[#2F6FA8] bg-blue-50/70 rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5 border border-blue-200/50">
                            <Zap size={13} /> Ca linh hoạt · Tùy chỉnh giờ khi xếp
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-gray-600">{template.name} · {template.start_time} - {template.end_time}</div>
                        )}
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
                    <p className="mt-1 text-xs text-gray-400">
                      Preview: {editing.name || 'Tên ca'} {editing.is_flexible ? '· Linh hoạt (Tùy chỉnh giờ khi xếp)' : `· ${editing.start_time} - ${editing.end_time}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">Vị trí: {editing.allowed_position_ids.map(id => mockPositions.find(position => position.id === id)?.name || id).join(', ') || 'Chưa chọn'}</p>
                    <p className="mt-1 text-xs text-gray-400">Mặc định: {editing.min_headcount}-{editing.max_headcount} người</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editing.id && (
                      <button
                        onClick={async () => {
                          const existing = shiftList.find(s => s.id === editing.id) || ShiftTemplateService.getById(editing.id!)
                          if (!existing) return
                          const updated = await shiftAdapter.upsertShiftTemplate({
                            ...existing,
                            is_active: !existing.is_active,
                          })
                          ShiftTemplateService.upsert(updated)
                          setEditing(toFormState(updated))
                          setRefreshKey(value => value + 1)
                          setToast(updated.is_active ? 'Đã bật ca.' : 'Đã tắt ca.')
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-vanilla-50"
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

                {/* Switch loại ca */}
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50/80 p-3.5">
                  <div>
                    <div className="text-xs font-bold text-gray-900">Loại ca phát sinh / Linh hoạt (Không cố định giờ)</div>
                    <div className="text-[11px] text-gray-500">Bật tùy chọn này nếu ca không có khung giờ cố định và được tùy chỉnh lúc xếp lịch</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, is_flexible: !editing.is_flexible })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      editing.is_flexible ? 'bg-[#2F6FA8]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        editing.is_flexible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} placeholder="Tên ca" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  <input value={editing.code} onChange={event => setEditing({ ...editing, code: event.target.value.toUpperCase() })} placeholder="Mã ca (VD: SANG, CHIEU, FLEX)" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />

                  {editing.is_flexible ? (
                    <div className="md:col-span-2 rounded-2xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-[#2F6FA8]">
                      <div className="font-bold flex items-center gap-2 mb-1">
                        <Zap size={14} /> Ca linh hoạt không cố định giờ
                      </div>
                      Thời gian (Giờ bắt đầu - Giờ kết thúc) sẽ do Quản lý thiết lập linh hoạt theo từng ca thực tế khi bấm (+) trên Bảng phân ca.
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Giờ bắt đầu</label>
                        <input type="time" value={editing.start_time} onChange={event => setEditing({ ...editing, start_time: event.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Giờ kết thúc</label>
                        <input type="time" value={editing.end_time} onChange={event => setEditing({ ...editing, end_time: event.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                      </div>
                    </>
                  )}

                  <input type="number" min={0} value={editing.min_headcount} onChange={event => setEditing({ ...editing, min_headcount: Number(event.target.value) })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder="Số người tối thiểu" />
                  <input type="number" min={1} value={editing.max_headcount} onChange={event => setEditing({ ...editing, max_headcount: Number(event.target.value) })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder="Số người tối đa" />
                  <input type="color" value={editing.color} onChange={event => setEditing({ ...editing, color: event.target.value })} className="h-11 w-full rounded-xl border border-gray-200 px-2 py-1" />
                  <select value={editing.store_scope} onChange={event => setEditing({ ...editing, store_scope: event.target.value as ShiftTemplateScope })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                    <option value="global">Dùng chung toàn hệ thống</option>
                    <option value="store_specific">Theo chi nhánh</option>
                  </select>
                  {editing.store_scope === 'store_specific' && (
                    <select value={editing.store_id || user.store_id} onChange={event => setEditing({ ...editing, store_id: event.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2">
                      {stores.map(store => (
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
                  <div className="mt-5 rounded-2xl border border-gray-100 bg-vanilla-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                      <Store size={15} className="text-primary-600" />
                      Clone ca mẫu cho chi nhánh
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stores
                        .filter(store => store.id !== editing.store_id)
                        .map(store => (
                          <button
                            key={store.id}
                            onClick={() => handleCloneToStore(store.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-vanilla-50"
                          >
                            <Copy size={13} /> {store.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-vanilla-50 text-sm text-gray-500">
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
