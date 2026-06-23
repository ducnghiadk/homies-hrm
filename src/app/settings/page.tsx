'use client'

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { BriefcaseBusiness, CalendarClock, Pencil, Plus, ShieldCheck, Store, Trash2, Upload } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import EditDrawer from '@/components/ui/EditDrawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SettingSearch } from '@/components/settings/SettingSearch'
import { SettingCard } from '@/components/settings/SettingCard'
import { SettingsStatusStrip } from '@/components/settings/SettingsStatusStrip'
import { SettingsWorkspaceCard } from '@/components/settings/SettingsWorkspaceCard'
import { SettingsWorkspaceTabs } from '@/components/settings/SettingsWorkspaceTabs'
import { SettingsStoreWorkspace } from '@/components/settings/SettingsStoreWorkspace'
import { SettingsWorkforceWorkspace } from '@/components/settings/SettingsWorkforceWorkspace'
import { SettingsPoliciesWorkspace } from '@/components/settings/SettingsPoliciesWorkspace'
import { SettingsSystemWorkspace } from '@/components/settings/SettingsSystemWorkspace'
import {
  getSettingsWorkspaceTab,
  settingItems,
  settingsWorkspaceTabs,
} from '@/lib/mock-data/settings'
import type { SettingCategoryId, SettingCategory, SettingsWorkspaceTabId } from '@/lib/types/settings'
import { MasterDataClientService } from '@/lib/services/master-data-client-service'
import {
  resolveMasterDataOrgId,
  type MasterDataEntityKey,
  type MasterDataState,
} from '@/lib/services/master-data-repository'
import {
  applyStoreImportPlan,
  buildStoreImportPlan,
  ensureStoreCode,
  type StoreImportPlan,
} from '@/lib/services/store-import-service'
import { parseEmployeeSpreadsheet } from '@/lib/services/employee-excel-service'

type FormValue = Record<string, string | boolean>

type FieldDef = {
  name: string
  label: string
  type?: 'text' | 'number' | 'time' | 'color' | 'checkbox' | 'select' | 'textarea'
  placeholder?: string
  required?: boolean
  options?: Array<{ label: string; value: string }>
}

type EditorState = {
  mode: 'create' | 'edit'
  key: MasterDataEntityKey
  itemId?: string
}

type DeleteState = {
  key: MasterDataEntityKey
  itemId: string
  itemLabel: string
}

const SECTION_IDS: Record<SettingCategoryId, string> = {
  organization: 'co-cau-cua-hang',
  hr: 'nhan-su-va-ca-lam',
  finance: 'chinh-sach-nhan-su',
  system: 'quan-tri-he-thong',
}

const MASTER_DATA_GROUPS: Record<SettingCategoryId, MasterDataEntityKey[]> = {
  organization: ['stores', 'departments'],
  hr: ['positions', 'shifts'],
  finance: ['leaveTypes', 'levels', 'workflows'],
  system: [],
}

const GROUP_ICONS: Record<SettingCategoryId, typeof Store> = {
  organization: Store,
  hr: CalendarClock,
  finance: BriefcaseBusiness,
  system: ShieldCheck,
}

function entityItems(state: MasterDataState, key: MasterDataEntityKey) {
  return state[key] as Array<Record<string, unknown>>
}

function buildConfigs(state: MasterDataState) {
  return {
    stores: {
      label: 'Cửa hàng',
      category: 'organization' as const,
      title: (item: Record<string, unknown>) => String(item.name),
      subtitle: (item: Record<string, unknown>) => `${String(item.code || 'Chưa có mã')} • ${String(item.address || 'Chưa có địa chỉ')}`,
      form: (item?: Record<string, unknown>): FormValue => ({
        name: String(item?.name || ''),
        code: String(item?.code || ''),
        address: String(item?.address || ''),
        phone: String(item?.phone || ''),
        checkin_radius_meters: String(item?.checkin_radius_meters || 100),
        is_active: item?.is_active !== false,
      }),
      fields: (): FieldDef[] => [
        { name: 'name', label: 'Tên chi nhánh', required: true },
        { name: 'code', label: 'Mã chi nhánh', required: true },
        { name: 'address', label: 'Địa chỉ', type: 'textarea', required: true },
        { name: 'phone', label: 'Số điện thoại' },
        { name: 'checkin_radius_meters', label: 'Bán kính check-in (m)', type: 'number', required: true },
        { name: 'is_active', label: 'Đang hoạt động', type: 'checkbox' },
      ],
      createPayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        code: String(form.code || '').trim().toUpperCase(),
        address: String(form.address || '').trim(),
        phone: String(form.phone || '').trim(),
        latitude: 0,
        longitude: 0,
        checkin_radius_meters: Number(form.checkin_radius_meters || 100),
        is_active: Boolean(form.is_active),
      }),
      updatePayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        code: String(form.code || '').trim().toUpperCase(),
        address: String(form.address || '').trim(),
        phone: String(form.phone || '').trim(),
        checkin_radius_meters: Number(form.checkin_radius_meters || 100),
        is_active: Boolean(form.is_active),
      }),
    },
    departments: {
      label: 'Bộ phận',
      category: 'organization' as const,
      title: (item: Record<string, unknown>) => String(item.name),
      subtitle: (item: Record<string, unknown>) => {
        const store = state.stores.find((store) => store.id === item.store_id)
        const storeName = store?.name || 'Chưa gán cửa hàng'
        return `${item.head_count} nhân sự • ${storeName}`
      },
      form: (item?: Record<string, unknown>): FormValue => ({
        name: String(item?.name || ''),
        store_id: String(item?.store_id || state.stores[0]?.id || ''),
        head_count: String(item?.head_count || 1),
      }),
      fields: (): FieldDef[] => [
        { name: 'name', label: 'Tên bộ phận', required: true },
        {
          name: 'store_id',
          label: 'Thuộc cửa hàng',
          type: 'select',
          required: true,
          options: state.stores.map((store) => ({ label: store.name, value: store.id })),
        },
        { name: 'head_count', label: 'Số nhân sự', type: 'number', required: true },
      ],
      createPayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        store_id: String(form.store_id || ''),
        head_count: Number(form.head_count || 0),
      }),
      updatePayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        store_id: String(form.store_id || ''),
        head_count: Number(form.head_count || 0),
      }),
    },
    positions: {
      label: 'Vị trí vận hành',
      category: 'hr' as const,
      title: (item: Record<string, unknown>) => String(item.name),
      subtitle: (item: Record<string, unknown>) => `Bậc ${item.level} • ${Number(item.base_salary || 0).toLocaleString('vi-VN')} VND`,
      form: (item?: Record<string, unknown>): FormValue => ({
        name: String(item?.name || ''),
        level: String(item?.level || 1),
        base_salary: String(item?.base_salary || 0),
      }),
      fields: (): FieldDef[] => [
        { name: 'name', label: 'Tên vị trí', required: true },
        { name: 'level', label: 'Bậc vị trí', type: 'number', required: true },
        { name: 'base_salary', label: 'Lương cơ bản', type: 'number', required: true },
      ],
      createPayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        level: Number(form.level || 1),
        base_salary: Number(form.base_salary || 0),
      }),
      updatePayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        level: Number(form.level || 1),
        base_salary: Number(form.base_salary || 0),
      }),
    },
    shifts: {
      label: 'Ca làm',
      category: 'hr' as const,
      title: (item: Record<string, unknown>) => String(item.name),
      subtitle: (item: Record<string, unknown>) => `${item.start_time} - ${item.end_time} • Nghỉ ${item.break_minutes} phút`,
      form: (item?: Record<string, unknown>): FormValue => ({
        name: String(item?.name || ''),
        start_time: String(item?.start_time || '07:00'),
        end_time: String(item?.end_time || '14:00'),
        break_minutes: String(item?.break_minutes || 30),
        color: String(item?.color || '#2F6FA8'),
        is_active: item?.is_active !== false,
      }),
      fields: (): FieldDef[] => [
        { name: 'name', label: 'Tên ca', required: true },
        { name: 'start_time', label: 'Giờ bắt đầu', type: 'time', required: true },
        { name: 'end_time', label: 'Giờ kết thúc', type: 'time', required: true },
        { name: 'break_minutes', label: 'Phút nghỉ', type: 'number', required: true },
        { name: 'color', label: 'Màu hiển thị', type: 'color', required: true },
        { name: 'is_active', label: 'Đang áp dụng', type: 'checkbox' },
      ],
      createPayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        start_time: String(form.start_time || '07:00'),
        end_time: String(form.end_time || '14:00'),
        break_minutes: Number(form.break_minutes || 30),
        color: String(form.color || '#2F6FA8'),
        is_active: Boolean(form.is_active),
      }),
      updatePayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        start_time: String(form.start_time || '07:00'),
        end_time: String(form.end_time || '14:00'),
        break_minutes: Number(form.break_minutes || 30),
        color: String(form.color || '#2F6FA8'),
        is_active: Boolean(form.is_active),
      }),
    },
    leaveTypes: {
      label: 'Loại nghỉ phép',
      category: 'finance' as const,
      title: (item: Record<string, unknown>) => String(item.name),
      subtitle: (item: Record<string, unknown>) => `${item.default_days} ngày • ${item.is_paid ? 'Có lương' : 'Không lương'}`,
      form: (item?: Record<string, unknown>): FormValue => ({
        name: String(item?.name || ''),
        code: String(item?.code || ''),
        default_days: String(item?.default_days || 0),
        is_paid: item?.is_paid !== false,
        require_doc: Boolean(item?.require_doc),
      }),
      fields: (): FieldDef[] => [
        { name: 'name', label: 'Tên loại nghỉ', required: true },
        { name: 'code', label: 'Mã loại nghỉ', required: true },
        { name: 'default_days', label: 'Số ngày mặc định', type: 'number', required: true },
        { name: 'is_paid', label: 'Tính lương', type: 'checkbox' },
        { name: 'require_doc', label: 'Yêu cầu chứng từ', type: 'checkbox' },
      ],
      createPayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        code: String(form.code || '').trim(),
        default_days: Number(form.default_days || 0),
        is_paid: Boolean(form.is_paid),
        require_doc: Boolean(form.require_doc),
      }),
      updatePayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        code: String(form.code || '').trim(),
        default_days: Number(form.default_days || 0),
        is_paid: Boolean(form.is_paid),
        require_doc: Boolean(form.require_doc),
      }),
    },
    levels: {
      label: 'Cấp bậc nhân viên',
      category: 'finance' as const,
      title: (item: Record<string, unknown>) => String(item.name),
      subtitle: (item: Record<string, unknown>) => `Bậc ${item.level} • Tối thiểu ${item.min_months} tháng • ${item.salary_range}`,
      form: (item?: Record<string, unknown>): FormValue => ({
        level: String(item?.level || 0),
        name: String(item?.name || ''),
        min_months: String(item?.min_months || 0),
        salary_range: String(item?.salary_range || ''),
      }),
      fields: (): FieldDef[] => [
        { name: 'level', label: 'Bậc', type: 'number', required: true },
        { name: 'name', label: 'Tên cấp bậc', required: true },
        { name: 'min_months', label: 'Số tháng tối thiểu', type: 'number', required: true },
        { name: 'salary_range', label: 'Khung lương', required: true },
      ],
      createPayload: (form: FormValue) => ({
        level: Number(form.level || 0),
        name: String(form.name || '').trim(),
        min_months: Number(form.min_months || 0),
        salary_range: String(form.salary_range || '').trim(),
      }),
      updatePayload: (form: FormValue) => ({
        level: Number(form.level || 0),
        name: String(form.name || '').trim(),
        min_months: Number(form.min_months || 0),
        salary_range: String(form.salary_range || '').trim(),
      }),
    },
    workflows: {
      label: 'Quy trình duyệt',
      category: 'finance' as const,
      title: (item: Record<string, unknown>) => String(item.name),
      subtitle: (item: Record<string, unknown>) => `${Array.isArray(item.steps) ? item.steps.join(' → ') : ''} • Tự duyệt sau ${item.auto_approve_days} ngày`,
      form: (item?: Record<string, unknown>): FormValue => ({
        name: String(item?.name || ''),
        steps: Array.isArray(item?.steps) ? item.steps.join('\n') : '',
        auto_approve_days: String(item?.auto_approve_days || 0),
        max_days_auto: String(item?.max_days_auto || 0),
      }),
      fields: (): FieldDef[] => [
        { name: 'name', label: 'Tên quy trình', required: true },
        { name: 'steps', label: 'Các bước duyệt', type: 'textarea', required: true },
        { name: 'auto_approve_days', label: 'Tự duyệt sau (ngày)', type: 'number', required: true },
        { name: 'max_days_auto', label: 'Số ngày tối đa', type: 'number', required: true },
      ],
      createPayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        steps: String(form.steps || '').split('\n').map((step) => step.trim()).filter(Boolean),
        auto_approve_days: Number(form.auto_approve_days || 0),
        max_days_auto: Number(form.max_days_auto || 0),
      }),
      updatePayload: (form: FormValue) => ({
        name: String(form.name || '').trim(),
        steps: String(form.steps || '').split('\n').map((step) => step.trim()).filter(Boolean),
        auto_approve_days: Number(form.auto_approve_days || 0),
        max_days_auto: Number(form.max_days_auto || 0),
      }),
    },
  }
}

function StoreImportPanel({
  plan,
  fileName,
  message,
  loading,
  applying,
  onFileChange,
  onApply,
  onReset,
}: {
  plan: StoreImportPlan | null
  fileName: string
  message: string | null
  loading: boolean
  applying: boolean
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onApply: () => void
  onReset: () => void
}) {
  const totalChanges = (plan?.toCreate.length || 0) + (plan?.toUpdate.length || 0) + (plan?.toDeactivate.length || 0)

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h5 className="text-sm font-semibold text-gray-900">Đồng bộ chi nhánh từ danh sách nhân sự</h5>
          <p className="mt-1 max-w-2xl text-xs text-gray-600">
            Đọc cột Chi nhánh từ file Excel nhân sự, tự sinh mã chi nhánh, mở lại chi nhánh có trong file và
            ngưng hoạt động chi nhánh không còn xuất hiện.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600">
            <Upload size={14} />
            {loading ? 'Đang đọc file...' : 'Chọn file nhân sự'}
            <input
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={onFileChange}
              disabled={loading || applying}
            />
          </label>
          <button
            type="button"
            onClick={onApply}
            disabled={!plan || totalChanges === 0 || loading || applying}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applying ? 'Đang đồng bộ...' : 'Áp dụng đồng bộ'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Làm mới
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-amber-50 px-3 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">File đang chọn</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">{fileName || 'Chưa chọn file'}</div>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Tạo mới</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{plan?.toCreate.length || 0}</div>
        </div>
        <div className="rounded-xl bg-sky-50 px-3 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">Cập nhật / mở lại</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{plan?.toUpdate.length || 0}</div>
        </div>
        <div className="rounded-xl bg-rose-50 px-3 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">Ngưng hoạt động</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{plan?.toDeactivate.length || 0}</div>
        </div>
      </div>

      {message ? <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">{message}</div> : null}

      {plan ? (
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
            <div className="text-xs font-semibold text-emerald-700">Chi nhánh tạo mới</div>
            <div className="mt-2 space-y-2 text-xs text-gray-700">
              {plan.toCreate.length === 0 ? <div>Không có chi nhánh mới.</div> : plan.toCreate.map((item) => (
                <div key={item.payload.name} className="rounded-lg bg-white px-2.5 py-2">
                  <div className="font-semibold text-gray-900">{item.payload.name}</div>
                  <div className="mt-1 text-gray-500">Mã chi nhánh: {item.payload.code || 'Sẽ tự sinh'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
            <div className="text-xs font-semibold text-sky-700">Chi nhánh cập nhật</div>
            <div className="mt-2 space-y-2 text-xs text-gray-700">
              {plan.toUpdate.length === 0 ? <div>Không có chi nhánh cần cập nhật.</div> : plan.toUpdate.map((item) => (
                <div key={item.id} className="rounded-lg bg-white px-2.5 py-2">
                  <div className="font-semibold text-gray-900">{item.payload.name || item.previousName}</div>
                  <div className="mt-1 text-gray-500">Mã chi nhánh: {item.payload.code || 'Chưa có'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
            <div className="text-xs font-semibold text-rose-700">Chi nhánh sẽ ngưng hoạt động</div>
            <div className="mt-2 space-y-2 text-xs text-gray-700">
              {plan.toDeactivate.length === 0 ? <div>Không có chi nhánh bị ngưng.</div> : plan.toDeactivate.map((item) => (
                <div key={item.id} className="rounded-lg bg-white px-2.5 py-2 font-semibold text-gray-900">
                  {item.previousName}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-gray-200 px-3 py-4 text-xs text-gray-500">
          Chọn file danh sách nhân sự để xem trước thay đổi chi nhánh ngay tại màn Cài đặt chung.
        </div>
      )}
    </div>
  )
}

function MasterDataGroupPanel({
  label,
  items,
  onAdd,
  onEdit,
  onDelete,
  renderTitle,
  renderSubtitle,
  children,
}: {
  label: string
  items: Array<Record<string, unknown>>
  onAdd: () => void
  onEdit: (item: Record<string, unknown>) => void
  onDelete: (item: Record<string, unknown>) => void
  renderTitle: (item: Record<string, unknown>) => string
  renderSubtitle: (item: Record<string, unknown>) => string
  children?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
          <p className="mt-1 text-xs text-gray-500">{items.length} mục đang dùng trong vận hành</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          <Plus size={14} /> Thêm
        </button>
      </div>

      {children}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={String(item.id)} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900">{renderTitle(item)}</div>
              <div className="mt-1 text-xs text-gray-500">{renderSubtitle(item)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
              >
                <Pencil size={12} /> Sửa
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="inline-flex items-center gap-1 rounded-lg bg-error-50 px-2.5 py-2 text-xs font-medium text-error-600 transition hover:bg-error-100"
              >
                <Trash2 size={12} /> Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MasterDataSection({
  category,
  state,
  onAdd,
  onEdit,
  onDelete,
  renderExtra,
}: {
  category: SettingCategory
  state: MasterDataState
  onAdd: (key: MasterDataEntityKey) => void
  onEdit: (key: MasterDataEntityKey, item: Record<string, unknown>) => void
  onDelete: (key: MasterDataEntityKey, item: Record<string, unknown>) => void
  renderExtra?: (key: MasterDataEntityKey) => ReactNode
}) {
  const keys = MASTER_DATA_GROUPS[category.id]
  if (keys.length === 0) return null

  const Icon = GROUP_ICONS[category.id]
  const configs = buildConfigs(state)

  return (
    <div className="mt-4 rounded-3xl border border-amber-100 bg-amber-50/60 p-4 md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-2xl bg-white p-2 text-amber-600 shadow-sm">
          <Icon size={18} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Danh mục vận hành cho {category.label.toLowerCase()}</h3>
          <p className="mt-1 text-xs text-gray-600">
            Thêm, sửa, xóa trực tiếp ngay tại màn cài đặt chung để không cần đi sang màn riêng.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {keys.map((key) => {
          const config = configs[key]
          const items = entityItems(state, key)

          return (
            <MasterDataGroupPanel
              key={key}
              label={config.label}
              items={items}
              onAdd={() => onAdd(key)}
              onEdit={(item) => onEdit(key, item)}
              onDelete={(item) => onDelete(key, item)}
              renderTitle={config.title}
              renderSubtitle={(item) => config.subtitle(item)}
            >
              {key === 'stores' ? renderExtra?.(key) : null}
            </MasterDataGroupPanel>
          )
        })}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<SettingsWorkspaceTabId>('stores')
  const [searchResults, setSearchResults] = useState<typeof settingItems | null>(null)
  const [masterData, setMasterData] = useState<MasterDataState | null>(null)
  const [editorState, setEditorState] = useState<EditorState | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null)
  const [formValues, setFormValues] = useState<FormValue>({})
  const [storeImportPlan, setStoreImportPlan] = useState<StoreImportPlan | null>(null)
  const [storeImportFileName, setStoreImportFileName] = useState('')
  const [storeImportMessage, setStoreImportMessage] = useState<string | null>(null)
  const [isStoreImportLoading, setIsStoreImportLoading] = useState(false)
  const [isStoreImportApplying, setIsStoreImportApplying] = useState(false)
  const orgId = useMemo(() => resolveMasterDataOrgId(user), [user])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user) return

    let active = true

    void (async () => {
      const nextState = await MasterDataClientService.getState(orgId)
      if (active) setMasterData(nextState)
    })()

    return () => {
      active = false
    }
  }, [orgId, user])

  if (!user || !masterData) return null

  const configs = buildConfigs(masterData)

  const openCreate = (key: MasterDataEntityKey) => {
    setEditorState({ mode: 'create', key })
    setFormValues(configs[key].form())
  }

  const openEdit = (key: MasterDataEntityKey, item: Record<string, unknown>) => {
    setEditorState({ mode: 'edit', key, itemId: String(item.id) })
    setFormValues(configs[key].form(item))
  }

  const handleSave = async () => {
    if (!editorState) return
    const config = configs[editorState.key]

    const normalizedFormValues = editorState.key === 'stores'
      ? {
          ...formValues,
          code: ensureStoreCode({
            requestedCode: String(formValues.code || ''),
            storeName: String(formValues.name || ''),
            existingStores: masterData.stores,
            currentStoreId: editorState.itemId,
          }),
        }
      : formValues

    const nextState = editorState.mode === 'create'
      ? await MasterDataClientService.createItem(orgId, editorState.key, config.createPayload(normalizedFormValues) as never)
      : editorState.itemId
        ? await MasterDataClientService.updateItem(orgId, editorState.key, editorState.itemId, config.updatePayload(normalizedFormValues) as never)
        : masterData

    setMasterData(nextState)
    setEditorState(null)
    setFormValues({})
  }

  const handleDelete = async () => {
    if (!deleteState) return
    const nextState = await MasterDataClientService.deleteItem(orgId, deleteState.key, deleteState.itemId)
    setMasterData(nextState)
    setDeleteState(null)
  }

  const handleStoreImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsStoreImportLoading(true)
      const rows = await parseEmployeeSpreadsheet(file)
      const plan = buildStoreImportPlan(rows, masterData.stores)
      setStoreImportPlan(plan)
      setStoreImportFileName(file.name)
      setStoreImportMessage(
        plan.sourceNames.length > 0
          ? `Đã đọc ${plan.sourceNames.length} chi nhánh từ file ${file.name}.`
          : 'Không tìm thấy dữ liệu ở cột Chi nhánh trong file đã chọn.',
      )
    } catch (error) {
      console.error('Store import parse failed', error)
      setStoreImportPlan(null)
      setStoreImportFileName(file.name)
      setStoreImportMessage('Không đọc được file danh sách nhân sự. Vui lòng kiểm tra lại mẫu Excel.')
    } finally {
      setIsStoreImportLoading(false)
      event.currentTarget.value = ''
    }
  }

  const handleStoreImportApply = async () => {
    if (!storeImportPlan) return

    try {
      setIsStoreImportApplying(true)
      const nextState = await applyStoreImportPlan(orgId, storeImportPlan)
      setMasterData(nextState)
      setStoreImportMessage(
        `Đã đồng bộ chi nhánh: tạo mới ${storeImportPlan.toCreate.length}, cập nhật ${storeImportPlan.toUpdate.length}, ngưng hoạt động ${storeImportPlan.toDeactivate.length}.`,
      )
      setStoreImportPlan(null)
      setStoreImportFileName('')
    } catch (error) {
      console.error('Store import apply failed', error)
      setStoreImportMessage('Đồng bộ chi nhánh chưa thành công. Vui lòng thử lại.')
    } finally {
      setIsStoreImportApplying(false)
    }
  }

  const resetStoreImport = () => {
    setStoreImportPlan(null)
    setStoreImportFileName('')
    setStoreImportMessage(null)
  }

  const activeTab = getSettingsWorkspaceTab(selectedTab)

  const storeItems = masterData.stores.map((store) => ({
    id: store.id,
    title: store.name,
    subtitle: configs.stores.subtitle(store as unknown as Record<string, unknown>),
  }))

  const departmentItems = masterData.departments.map((department) => ({
    id: department.id,
    title: department.name,
    subtitle: configs.departments.subtitle(department as unknown as Record<string, unknown>),
  }))

  const workforceCards = [
    {
      title: 'Vi tri van hanh',
      description: 'Vai tro dang dung trong van hanh cua hang',
      items: masterData.positions.map((item) => ({
        title: item.name,
        subtitle: configs.positions.subtitle(item as unknown as Record<string, unknown>),
      })),
    },
    {
      title: 'Ca lam',
      description: 'Khung gio va mau hien thi dang ap dung',
      items: masterData.shifts.map((item) => ({
        title: item.name,
        subtitle: configs.shifts.subtitle(item as unknown as Record<string, unknown>),
      })),
    },
    {
      title: 'Quy tac xep ca',
      description: 'Cac trang dieu phoi va rang buoc xep ca hien co',
      items: [
        { title: 'Quy tac xep ca', subtitle: 'Mo trang cau hinh rang buoc lich lam viec tai /settings/schedule-rules' },
        { title: 'Dang ky ca mong muon', subtitle: 'Duoc gom thanh block phu trong nhom xep ca thay vi card doc lap' },
      ],
      footer: 'Luong dang ky ca mong muon da duoc ha xuong block phu de tranh trung card.',
    },
    {
      title: 'Dinh bien nhan su',
      description: 'Diem vao cho nhu cau nhan su theo luu luong',
      items: [
        { title: 'Dinh bien nhan su', subtitle: 'Mo trang calculator va cau hinh staffing tai /settings/staffing' },
      ],
    },
  ]

  const policyCards = [
    {
      title: 'Loai nghi phep',
      description: 'Danh muc loai nghi va quota dang ap dung',
      items: masterData.leaveTypes.map((item) => ({
        title: item.name,
        subtitle: configs.leaveTypes.subtitle(item as unknown as Record<string, unknown>),
      })),
    },
    {
      title: 'Cap bac & khung ap dung',
      description: 'Cap bac nhan su va dieu kien ap dung hien hanh',
      items: masterData.levels.map((item) => ({
        title: item.name,
        subtitle: configs.levels.subtitle(item as unknown as Record<string, unknown>),
      })),
    },
    {
      title: 'Quy trinh duyet',
      description: 'Luong duyet cho cac yeu cau nhan su',
      items: masterData.workflows.map((item) => ({
        title: item.name,
        subtitle: configs.workflows.subtitle(item as unknown as Record<string, unknown>),
      })),
    },
  ]

  const systemCards = [
    {
      title: 'Phan quyen vai tro',
      description: 'Diem vao quan tri vai tro va pham vi truy cap',
      items: [
        { title: 'Phan quyen', subtitle: 'Mo trang /settings/permissions de ra soat vai tro quan ly' },
      ],
    },
    {
      title: 'Thiet lap he thong',
      description: 'Ngon ngu, theme va cau hinh van hanh chung',
      items: [
        { title: 'He thong', subtitle: 'Mo trang /settings/system de cap nhat cau hinh chung' },
      ],
    },
    {
      title: 'Tich hop / thiet bi / bao mat',
      description: 'WiFi, thiet bi va cac thiet lap lien quan',
      items: [
        { title: 'WiFi check-in', subtitle: 'Mo trang /settings/wifi de cap nhat thiet bi cham cong' },
      ],
    },
  ]

  const activeConfig = editorState ? configs[editorState.key] : null

  return (
    <AppShell title="Cài đặt chung">
      <div className="space-y-5 pb-24">
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Settings hub</div>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">Cai dat chung</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600">
                Mot noi duy nhat de quan ly cau hinh va danh muc van hanh cho HRM chuoi F&B, theo tung tab nghiep vu ro rang.
              </p>
            </div>
            <div className="rounded-2xl bg-white/90 px-4 py-3 text-sm text-gray-600 shadow-sm">
              Moi tab chi giu vai card thao tac chinh, giam lap va giam cuon dai.
            </div>
          </div>
        </div>

        <SettingSearch onSearch={setSearchResults} />

        {!searchResults && (
          <>
            <SettingsWorkspaceTabs selected={selectedTab} onSelect={setSelectedTab} />
            <SettingsStatusStrip
              statusLabel={activeTab.statusLabel}
              actionLabel={activeTab.actionLabel}
              helperText={activeTab.description}
            />
          </>
        )}

        {searchResults && (
          <div className="animate-fade-in">
            <p className="mb-3 text-xs" style={{ color: 'var(--text-muted, #9ca3af)' }}>
              Ket qua tim kiem: <strong style={{ color: 'var(--text-secondary, #6b7280)' }}>{searchResults.length}</strong> ket qua
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {searchResults.map((item) => (
                <SettingCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {!searchResults && selectedTab === 'stores' && (
          <SettingsStoreWorkspace
            storeItems={storeItems}
            departmentItems={departmentItems}
            onAdd={openCreate}
            onEdit={(key, itemId) => {
              const collection = masterData[key] as Array<{ id: string }>
              const item = collection.find((entry) => entry.id === itemId) as Record<string, unknown> | undefined
              if (item) openEdit(key, item)
            }}
            onDelete={(key, itemId) => {
              const collection = masterData[key] as Array<{ id: string }>
              const item = collection.find((entry) => entry.id === itemId) as Record<string, unknown> | undefined
              if (item) setDeleteState({ key, itemId, itemLabel: configs[key].title(item) })
            }}
            storeImportPanel={(
              <StoreImportPanel
                plan={storeImportPlan}
                fileName={storeImportFileName}
                message={storeImportMessage}
                loading={isStoreImportLoading}
                applying={isStoreImportApplying}
                onFileChange={handleStoreImportFileChange}
                onApply={handleStoreImportApply}
                onReset={resetStoreImport}
              />
            )}
          />
        )}

        {!searchResults && selectedTab === 'workforce' && (
          <SettingsWorkforceWorkspace cards={workforceCards} />
        )}

        {!searchResults && selectedTab === 'policies' && (
          <SettingsPoliciesWorkspace cards={policyCards} />
        )}

        {!searchResults && selectedTab === 'system_access' && (
          <SettingsSystemWorkspace cards={systemCards} />
        )}

        {!searchResults && !settingsWorkspaceTabs.some((tab) => tab.id === selectedTab) && (
          <SettingsWorkspaceCard title="Khong tim thay tab" description="Tab hien tai khong con hop le.">
            <div className="text-xs text-gray-500">Vui long chon lai mot tab cai dat.</div>
          </SettingsWorkspaceCard>
        )}
      </div>

      <EditDrawer
        isOpen={Boolean(editorState && activeConfig)}
        onClose={() => setEditorState(null)}
        title={editorState?.mode === 'create' ? `Thêm ${activeConfig?.label || ''}` : `Sửa ${activeConfig?.label || ''}`}
        onSave={handleSave}
      >
        <div className="space-y-4">
          {activeConfig?.fields().map((field) => (
            <label key={field.name} className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">{field.label}</span>
              {field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={Boolean(formValues[field.name])}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, [field.name]: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              ) : field.type === 'select' ? (
                <select
                  value={String(formValues[field.name] || '')}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={String(formValues[field.name] || '')}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={String(formValues[field.name] || '')}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  required={field.required}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              )}
            </label>
          ))}
        </div>
      </EditDrawer>

      <ConfirmDialog
        isOpen={Boolean(deleteState)}
        onClose={() => setDeleteState(null)}
        onConfirm={handleDelete}
        title="Xóa danh mục này?"
        description={deleteState ? `Mục ${deleteState.itemLabel} sẽ bị xóa khỏi danh mục vận hành.` : ''}
        confirmLabel="Xóa"
        variant="danger"
      />
    </AppShell>
  )
}

