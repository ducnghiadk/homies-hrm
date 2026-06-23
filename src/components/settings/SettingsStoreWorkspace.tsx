import type { ReactNode } from 'react'
import type { MasterDataEntityKey } from '@/lib/services/master-data-repository'
import { SettingsWorkspaceCard } from '@/components/settings/SettingsWorkspaceCard'

function WorkspaceList({
  items,
  onEdit,
  onDelete,
}: {
  items: Array<{ id: string; title: string; subtitle: string }>
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900">{item.title}</div>
            <div className="mt-1 text-xs text-gray-500">{item.subtitle}</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onEdit(item.id)} className="rounded-lg bg-white px-2.5 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-100">Sua</button>
            <button type="button" onClick={() => onDelete(item.id)} className="rounded-lg bg-error-50 px-2.5 py-2 text-xs font-medium text-error-600 transition hover:bg-error-100">Xoa</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SettingsStoreWorkspace({
  storeItems,
  departmentItems,
  storeImportPanel,
  onAdd,
  onEdit,
  onDelete,
}: {
  storeItems: Array<{ id: string; title: string; subtitle: string }>
  departmentItems: Array<{ id: string; title: string; subtitle: string }>
  storeImportPanel: ReactNode
  onAdd: (key: MasterDataEntityKey) => void
  onEdit: (key: MasterDataEntityKey, itemId: string) => void
  onDelete: (key: MasterDataEntityKey, itemId: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <SettingsWorkspaceCard
        title="Mang luoi cua hang"
        description="Danh sach cua hang dang hoat dong va thong tin van hanh chinh"
        action={<button type="button" onClick={() => onAdd('stores')} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white">Them chi nhanh</button>}
      >
        <WorkspaceList items={storeItems} onEdit={(id) => onEdit('stores', id)} onDelete={(id) => onDelete('stores', id)} />
      </SettingsWorkspaceCard>

      <SettingsWorkspaceCard
        title="Bo phan & diem lam viec"
        description="Bo phan theo tung cua hang de dieu phoi van hanh"
        action={<button type="button" onClick={() => onAdd('departments')} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white">Them bo phan</button>}
      >
        <WorkspaceList items={departmentItems} onEdit={(id) => onEdit('departments', id)} onDelete={(id) => onDelete('departments', id)} />
      </SettingsWorkspaceCard>

      <SettingsWorkspaceCard
        title="Dong bo tu file nhan su"
        description="Upload, preview va ap dung thay doi chi nhanh trong cung mot vung lam viec"
        className="xl:col-span-2"
      >
        {storeImportPanel}
      </SettingsWorkspaceCard>
    </div>
  )
}