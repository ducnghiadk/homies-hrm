'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'

import type { KpiStoreGroup } from '@/lib/kpi/types'

export type KPIStoreGroupPanelProps = {
  stores: Array<{ id: string; name: string }>
  groups: KpiStoreGroup[]
  onChange(groups: KpiStoreGroup[]): void
}

const QUICK_GROUPS: KpiStoreGroup[] = [
  { id: 'group_a', name: 'Nhóm A - Cửa hàng doanh thu cao', store_ids: [], active: true },
  { id: 'group_b', name: 'Nhóm B - Cửa hàng tiêu chuẩn', store_ids: [], active: true },
  { id: 'group_c', name: 'Nhóm C - Cửa hàng mới/nhỏ', store_ids: [], active: true },
]

export function KPIStoreGroupPanel({ stores, groups, onChange }: KPIStoreGroupPanelProps) {
  const activeGroups = useMemo(() => groups.filter((group) => group.active), [groups])
  const storeGroupMap = useMemo(() => {
    const map = new Map<string, string>()
    activeGroups.forEach((group) => group.store_ids.forEach((storeId) => map.set(storeId, group.id)))
    return map
  }, [activeGroups])

  function updateGroup(groupId: string, patch: Partial<KpiStoreGroup>) {
    onChange(groups.map((group) => {
      if (group.id !== groupId) return group
      const nextGroup = { ...group, ...patch }
      return patch.active === false ? { ...nextGroup, store_ids: [] } : nextGroup
    }))
  }

  function assignStore(storeId: string, groupId: string) {
    onChange(groups.map((group) => ({
      ...group,
      store_ids: group.active && group.id === groupId
        ? [...new Set([...group.store_ids, storeId])]
        : group.store_ids.filter((id) => id !== storeId),
    })))
  }

  function addGroup() {
    let suffix = Date.now()
    let id = `group_custom_${suffix}`
    while (groups.some((group) => group.id === id)) {
      suffix += 1
      id = `group_custom_${suffix}`
    }
    onChange([...groups, { id, name: `Nhóm cửa hàng ${groups.length + 1}`, store_ids: [], active: true }])
  }

  function removeGroup(groupId: string) {
    onChange(groups.filter((group) => group.id !== groupId))
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Phân nhóm cửa hàng</p>
          <h2 className="mt-1 text-base font-bold text-[#001D3D]">Nhóm A / B / C cho mục tiêu KPI</h2>
          <p className="mt-1 text-xs text-gray-500">Mỗi cửa hàng chỉ thuộc một nhóm. Cửa hàng chưa chọn nhóm sẽ được báo thiếu khi tiếp tục.</p>
        </div>
        {groups.length === 0 ? (
          <button type="button" onClick={() => onChange(QUICK_GROUPS)} className="rounded-xl bg-[#2F6FA8] px-3 py-2 text-xs font-bold text-white hover:bg-[#1D3E61]">
            Tạo nhanh nhóm A/B/C
          </button>
        ) : (
          <button type="button" onClick={addGroup} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <Plus size={14} /> Thêm nhóm
          </button>
        )}
      </div>

      {groups.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {groups.map((group) => (
            <div key={group.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <div className="flex items-start gap-2">
                <input aria-label={`Tên ${group.name}`} value={group.name} onChange={(event) => updateGroup(group.id, { name: event.target.value })} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-[#001D3D] outline-none focus:border-[#2F6FA8]" />
                <button type="button" aria-label={`Xóa ${group.name}`} onClick={() => removeGroup(group.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
              <label className="mt-2 flex items-center gap-2 text-[11px] text-gray-600">
                <input type="checkbox" checked={group.active} onChange={(event) => updateGroup(group.id, { active: event.target.checked })} /> Đang hoạt động
              </label>
              <p className="mt-2 text-[11px] font-mono tabular-nums text-gray-500">{group.store_ids.length} cửa hàng</p>
            </div>
          ))}
        </div>
      )}

      {groups.length > 0 && stores.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500"><tr><th className="px-3 py-2 font-bold">Cửa hàng</th><th className="px-3 py-2 font-bold">Nhóm áp dụng</th></tr></thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {stores.map((store) => (
                <tr key={store.id}>
                  <td className="px-3 py-2.5 font-semibold text-[#001D3D]">{store.name}</td>
                  <td className="px-3 py-2.5"><select aria-label={`Nhóm của ${store.name}`} value={storeGroupMap.get(store.id) ?? ''} onChange={(event) => assignStore(store.id, event.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#2F6FA8]"><option value="">Chưa phân nhóm</option>{activeGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
