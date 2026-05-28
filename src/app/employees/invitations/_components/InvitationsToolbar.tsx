'use client'

import { RotateCcw, Search, UserPlus } from 'lucide-react'
import { mockStores } from '@/lib/mock-data'
import type { EmployeeInvitation } from '@/lib/mock-data-employee-ext'
import { getTabCount } from './invitations-helpers'
import { INVITATIONS_COPY, INVITATION_TABS } from './invitations-copy'
import type { InvitationTab } from './invitations-types'

interface InvitationsToolbarProps {
  invitations: EmployeeInvitation[]
  userRole: string
  searchTerm: string
  selectedStore: string
  activeTab: InvitationTab
  selectedSendFilter: string
  selectedFocusFilter: string
  sortBy: string
  onSearchChange: (value: string) => void
  onStoreChange: (value: string) => void
  onTabChange: (value: InvitationTab) => void
  onSendFilterChange: (value: string) => void
  onFocusFilterChange: (value: string) => void
  onSortChange: (value: string) => void
  onReset: () => void
  onCreate: () => void
}

export function InvitationsToolbar({
  invitations,
  userRole,
  searchTerm,
  selectedStore,
  activeTab,
  selectedSendFilter,
  selectedFocusFilter,
  sortBy,
  onSearchChange,
  onStoreChange,
  onTabChange,
  onSendFilterChange,
  onFocusFilterChange,
  onSortChange,
  onReset,
  onCreate,
}: InvitationsToolbarProps) {
  const activeFilterCount = [
    searchTerm.trim(),
    selectedStore,
    activeTab !== 'all' ? activeTab : '',
    selectedSendFilter !== 'all' ? selectedSendFilter : '',
    selectedFocusFilter !== 'all' ? selectedFocusFilter : '',
    sortBy !== 'newest' ? sortBy : '',
  ].filter(Boolean).length

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-gray-100 bg-slate-50 p-3 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Bộ lọc</p>
            <p className="mt-1 text-sm text-slate-600">Chốt đúng nhóm cần xem rồi mới đi sâu vào bảng bên dưới.</p>
          </div>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
          >
            <UserPlus size={16} />
            Tạo thêm lời mời
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[180px_180px_180px_200px_minmax(240px,1fr)_auto]">
          <select
            value={selectedStore}
            onChange={(event) => onStoreChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            disabled={!['ceo', 'hr_admin'].includes(userRole)}
          >
            <option value="">{INVITATIONS_COPY.allStoresLabel}</option>
            {mockStores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name.replace('Homies Milk Tea - ', '')}
              </option>
            ))}
          </select>

          <select
            value={selectedSendFilter}
            onChange={(event) => onSendFilterChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">Tất cả email</option>
            <option value="not_sent">Chưa gửi</option>
            <option value="sent_success">Gửi thành công</option>
            <option value="sent_failed">Gửi lỗi</option>
          </select>

          <select
            value={selectedFocusFilter}
            onChange={(event) => onFocusFilterChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">Tất cả ưu tiên</option>
            <option value="needs_approval">Cần duyệt</option>
            <option value="missing_info">Thiếu thông tin</option>
            <option value="resend_failed">Cần gửi lại</option>
            <option value="scheduled_soon">Sắp vào làm</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="newest">Mới tạo gần đây</option>
            <option value="hire_date">Sắp vào làm</option>
            <option value="approval_queue">Chờ duyệt lâu nhất</option>
            <option value="send_failure">Ưu tiên gửi lại</option>
            <option value="completion">Độ đầy đủ hồ sơ</option>
          </select>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={INVITATIONS_COPY.searchPlaceholder}
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            Đặt lại
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-error-500 px-1.5 text-xs font-bold text-white">{activeFilterCount}</span>
            ) : null}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white px-2 shadow-sm">
        <div className="flex min-w-max gap-1 py-2">
          {INVITATION_TABS.map((tab) => {
            const count = getTabCount(invitations, tab.id)

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === tab.id
                      ? 'bg-white text-primary-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
