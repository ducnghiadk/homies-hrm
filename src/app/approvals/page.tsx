'use client'

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import AppShell from '@/components/layout/AppShell'
import {
  mockApprovalItems,
  APPROVAL_CATEGORIES,
  type ApprovalCategory,
  type ApprovalItem,
  type ApprovalStatus,
} from '@/lib/mock-data/approvals'
import {
  getEmployeeById,
  getStoreById,
  getPositionById,
  isStoreMatch,
} from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import {
  Check,
  X,
  Filter,
  Clock,
  ChevronDown,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowLeftRight,
  FileEdit,
  Wallet,
  Target,
  UserPlus,
  Layers,
  Sparkles,
  AlertCircle,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react'

// Sub-components chuẩn Homies Design Rule
import ApprovalExecutiveHeader from '@/components/approvals/ApprovalExecutiveHeader'
import ApprovalMacroCards from '@/components/approvals/ApprovalMacroCards'
import ApprovalDetailModal from '@/components/approvals/ApprovalDetailModal'
import ApprovalSidebarWidgets from '@/components/approvals/ApprovalSidebarWidgets'

function CategoryIcon({ iconKey, size = 14, className = '' }: { iconKey: string; size?: number; className?: string }) {
  switch (iconKey) {
    case 'Calendar': return <Calendar size={size} className={className} />
    case 'Clock': return <Clock size={size} className={className} />
    case 'ArrowLeftRight': return <ArrowLeftRight size={size} className={className} />
    case 'FileEdit': return <FileEdit size={size} className={className} />
    case 'Wallet': return <Wallet size={size} className={className} />
    case 'Target': return <Target size={size} className={className} />
    case 'UserPlus': return <UserPlus size={size} className={className} />
    default: return <Layers size={size} className={className} />
  }
}

type TabFilter = 'all' | ApprovalCategory
type StatusFilter = 'pending' | 'all' | 'approved' | 'rejected'
type ViewMode = 'table' | 'cards'

// ── Helper: Format time ago ──
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Vừa gửi'
  if (hours < 24) return `${hours}h trước`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hôm qua'
  return `${days} ngày trước`
}

const emptySubscribe = () => () => {}

export default function ApprovalsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  // Danh sách items động có thể cập nhật trạng thái (nạp từ localStorage nếu có)
  const [approvalList, setApprovalList] = useState<ApprovalItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('homies_approvals_data')
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ApprovalItem[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        } catch {
          // fallback to mock
        }
      }
    }
    return [...mockApprovalItems]
  })

  // Filters & View Mode (Mặc định là 'table' để tinh gọn, hạn chế cuộn chuột)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [activeCategory, setActiveCategory] = useState<TabFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal chi tiết & Feedback
  const [selectedDetailItem, setSelectedDetailItem] = useState<ApprovalItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null)
  const [toastBanner, setToastBanner] = useState('')

  useEffect(() => {
    if (mounted && hasHydrated && !isAuthenticated && !user) {
      router.push('/login?redirect=/approvals')
    }
  }, [mounted, hasHydrated, isAuthenticated, user, router])

  // ── Danh sách chi nhánh duy nhất ──
  const stores = useMemo(() => {
    const ids = Array.from(new Set(mockApprovalItems.map(i => i.store_id)))
    return ids.map(id => getStoreById(id)).filter(Boolean)
  }, [])

  // ── Thống kê số lượng đơn chờ theo từng danh mục ──
  const categoryKeys = Object.keys(APPROVAL_CATEGORIES) as ApprovalCategory[]
  const pendingCounts = useMemo(() => {
    const counts = {} as Record<ApprovalCategory, number>
    for (const key of categoryKeys) {
      counts[key] = approvalList.filter(
        item => item.category === key && item.status === 'pending'
      ).length
    }
    return counts
  }, [approvalList])

  const totalPendingCount = useMemo(
    () => (Object.values(pendingCounts) as number[]).reduce((a, b) => a + b, 0),
    [pendingCounts]
  )

  // ── Filtered items ──
  const filteredItems = useMemo(() => {
    let items = [...approvalList]

    // Tab filter
    if (activeCategory !== 'all') {
      items = items.filter(i => i.category === activeCategory)
    }

    // Status filter
    if (statusFilter !== 'all') {
      items = items.filter(i => i.status === statusFilter)
    }

    // Store filter
    if (selectedStoreId !== 'all') {
      items = items.filter(i => isStoreMatch(i.store_id, selectedStoreId))
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(i => {
        const emp = getEmployeeById(i.employee_id)
        return (
          emp?.full_name.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.reason.toLowerCase().includes(q)
        )
      })
    }

    // Sắp xếp: Gấp lên trước, sau đó theo thời gian mới nhất
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    items.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (pDiff !== 0) return pDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return items
  }, [approvalList, activeCategory, statusFilter, selectedStoreId, searchQuery])

  // Helper lưu dữ liệu vào localStorage
  const persistApprovals = (items: ApprovalItem[]) => {
    setApprovalList(items)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('homies_approvals_data', JSON.stringify(items))
      } catch {
        // ignore
      }
    }
  }

  // ── Handlers Phê duyệt & Từ chối ──
  const handleApprove = (id: string, notes?: string) => {
    const updated = approvalList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'approved' as const,
          reviewed_by: user?.full_name || 'CEO',
          reviewed_at: new Date().toISOString(),
          review_notes: notes || 'Đã duyệt qua hệ thống HRM',
        }
      }
      return item
    })
    persistApprovals(updated)

    setActionFeedback({ id, action: 'approved' })
    setToastBanner('Đã phê duyệt yêu cầu thành công!')
    setTimeout(() => setActionFeedback(null), 1500)
    setTimeout(() => setToastBanner(''), 3000)
  }

  const handleReject = (id: string, notes?: string) => {
    const updated = approvalList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'rejected' as const,
          reviewed_by: user?.full_name || 'CEO',
          reviewed_at: new Date().toISOString(),
          review_notes: notes || 'Không đồng ý yêu cầu này',
        }
      }
      return item
    })
    persistApprovals(updated)

    setActionFeedback({ id, action: 'rejected' })
    setToastBanner('Đã từ chối yêu cầu.')
    setTimeout(() => setActionFeedback(null), 1500)
    setTimeout(() => setToastBanner(''), 3000)
  }

  const handleBulkApprove = () => {
    if (selectedIds.size === 0) return
    const count = selectedIds.size

    const updated = approvalList.map(item => {
      if (selectedIds.has(item.id)) {
        return {
          ...item,
          status: 'approved' as const,
          reviewed_by: user?.full_name || 'CEO',
          reviewed_at: new Date().toISOString(),
          review_notes: 'Duyệt hàng loạt',
        }
      }
      return item
    })
    persistApprovals(updated)

    setSelectedIds(new Set())
    setToastBanner(`Đã phê duyệt thành công ${count} yêu cầu!`)
    setTimeout(() => setToastBanner(''), 3000)
  }

  const handleExportExcel = () => {
    setToastBanner('Đang tạo và xuất báo cáo phê duyệt Excel...')
    setTimeout(() => setToastBanner('Đã xuất báo cáo phê duyệt thành công!'), 1500)
    setTimeout(() => setToastBanner(''), 3500)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const pendingInList = filteredItems.filter(i => i.status === 'pending')
    if (selectedIds.size === pendingInList.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingInList.map(i => i.id)))
    }
  }

  // ── Điều hướng modal chi tiết ──
  const currentModalIndex = useMemo(() => {
    if (!selectedDetailItem) return -1
    return filteredItems.findIndex(i => i.id === selectedDetailItem.id)
  }, [filteredItems, selectedDetailItem])

  const handleNavigatePrev = () => {
    if (currentModalIndex > 0) {
      setSelectedDetailItem(filteredItems[currentModalIndex - 1])
    }
  }

  const handleNavigateNext = () => {
    if (currentModalIndex < filteredItems.length - 1) {
      setSelectedDetailItem(filteredItems[currentModalIndex + 1])
    }
  }

  const openDetailModal = (item: ApprovalItem) => {
    setSelectedDetailItem(item)
    setIsDetailModalOpen(true)
  }

  if (!mounted || !hasHydrated || !user || !isAuthenticated) {
    return (
      <AppShell title="Trung tâm Duyệt">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2F6FA8] border-t-transparent" />
          <p className="text-xs text-gray-500 font-semibold">Đang chuẩn bị dữ liệu phê duyệt...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Trung tâm Duyệt">
      <div className="bg-[#FFF8E8] min-h-screen w-full font-['Inter'] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TẦNG 1: EXECUTIVE COMMAND HEADER */}
        <ApprovalExecutiveHeader
          totalPendingCount={totalPendingCount}
          selectedStoreId={selectedStoreId}
          setSelectedStoreId={setSelectedStoreId}
          stores={stores}
          selectedCount={selectedIds.size}
          onBulkApprove={handleBulkApprove}
          onExportExcel={handleExportExcel}
        />

        {/* TOAST BANNER */}
        {toastBanner && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-xs animate-fade-in">
            <CheckCircle2 size={17} className="text-emerald-600 flex-shrink-0" />
            <span>{toastBanner}</span>
          </div>
        )}

        {/* TẦNG 2: DẢI 4 THẺ CHỈ SỐ VĨ MÔ */}
        <ApprovalMacroCards
          items={approvalList}
          onSelectCategoryFilter={(key) => setActiveCategory(key as TabFilter)}
          activeCategory={activeCategory}
        />

        {/* TẦNG 3: BỘ TAB & TỶ LỆ VÀNG (2/3 + 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CỘT CHÍNH (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* THANH TAB 8 DANH MỤC */}
            <div className="card p-2 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3.5 py-2 min-h-[36px] rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-[#2F6FA8] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#001D3D] hover:bg-gray-50'
                }`}
              >
                <span>Tất Cả</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeCategory === 'all' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  {totalPendingCount}
                </span>
              </button>

              {categoryKeys.map(key => {
                const cat = APPROVAL_CATEGORIES[key]
                const count = pendingCounts[key]
                const isActive = activeCategory === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(key)}
                    className={`px-3 py-2 min-h-[36px] rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#2F6FA8] text-white shadow-xs'
                        : 'text-gray-600 hover:text-[#001D3D] hover:bg-gray-50'
                    }`}
                  >
                    <CategoryIcon iconKey={cat.iconKey} size={14} />
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* THANH TÌM KIẾM, BỘ LỌC TRẠNG THÁI & CHUYỂN ĐỔI BẢNG/THẺ */}
            <div className="card p-3 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên nhân sự, mã NV, lý do..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 min-h-[36px] rounded-xl border border-gray-200 text-xs font-medium text-gray-900 outline-none focus:border-[#2F6FA8] focus:bg-white bg-gray-50/60 transition shadow-2xs"
                />
              </div>

              {/* Lọc trạng thái */}
              <div className="flex rounded-xl p-0.5 bg-gray-100 border border-gray-200">
                {([
                  { key: 'pending', label: 'Chờ duyệt' },
                  { key: 'approved', label: 'Đã duyệt' },
                  { key: 'rejected', label: 'Từ chối' },
                  { key: 'all', label: 'Tất cả' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      statusFilter === key
                        ? 'bg-white text-[#001D3D] shadow-2xs'
                        : 'text-gray-600 hover:text-[#001D3D]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Nút chuyển đổi View Mode (Bảng data vs Thẻ) */}
              <div className="flex items-center rounded-xl p-0.5 bg-gray-100 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-[#2F6FA8] shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Dạng Bảng Dữ Liệu Tinh Gọn (Hạn chế cuộn chuột)"
                >
                  <TableIcon size={14} />
                  <span className="hidden sm:inline">Bảng Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-[#2F6FA8] shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Dạng Thẻ Đơn Từ Chi Tiết"
                >
                  <LayoutGrid size={14} />
                  <span className="hidden sm:inline">Dạng Thẻ</span>
                </button>
              </div>
            </div>

            {/* DANH SÁCH DỮ LIỆU (BẢNG HOẶC THẺ GỌN) */}
            {filteredItems.length === 0 ? (
              <div className="card p-12 rounded-2xl border border-gray-100 bg-white shadow-xs text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-base font-bold text-[#001D3D]">
                  Không có đơn nào cần xử lý
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
                  Tất cả các yêu cầu theo tiêu chí lọc này đã được hoàn tất hoặc không tìm thấy kết quả.
                </p>
              </div>
            ) : viewMode === 'table' ? (
              /* ══════════════════════════════════════════════════════ */
              /* DẠNG BẢNG DỮ LIỆU DATA TABLE (TINH GỌN, ÍT CUỘN CHUỘT) */
              /* ══════════════════════════════════════════════════════ */
              <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/90 text-gray-600 font-bold border-b border-gray-100 select-none">
                        {statusFilter === 'pending' && (
                          <th className="py-3 px-3 text-center w-10">
                            <div
                              onClick={toggleSelectAll}
                              className={`w-4 h-4 rounded border flex items-center justify-center mx-auto transition cursor-pointer ${
                                selectedIds.size > 0 ? 'bg-[#2F6FA8] border-[#2F6FA8]' : 'bg-white border-gray-300'
                              }`}
                            >
                              {selectedIds.size > 0 && <Check size={11} color="#fff" />}
                            </div>
                          </th>
                        )}
                        <th className="py-3 px-3 text-[#001D3D]">Nhân Sự</th>
                        <th className="py-3 px-2">Cơ Sở &amp; Vị Trí</th>
                        <th className="py-3 px-2 text-center">Danh Mục</th>
                        <th className="py-3 px-3">Nội Dung &amp; Lý Do</th>
                        <th className="py-3 px-2 text-center">Thời Gian / Ca</th>
                        <th className="py-3 px-2 text-center">Mức Độ</th>
                        <th className="py-3 px-2 text-center">Trạng Thái</th>
                        <th className="py-3 px-3 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredItems.map(item => {
                        const emp = getEmployeeById(item.employee_id)
                        const store = getStoreById(item.store_id)
                        const position = emp ? getPositionById(emp.position_id) : null
                        const cat = APPROVAL_CATEGORIES[item.category]
                        const isUrgent = item.priority === 'high'
                        const isSelected = selectedIds.has(item.id)

                        return (
                          <tr
                            key={item.id}
                            onClick={() => openDetailModal(item)}
                            className={`transition-colors cursor-pointer group ${
                              isSelected
                                ? 'bg-blue-50/50'
                                : 'hover:bg-blue-50/30'
                            }`}
                          >
                            {/* Checkbox */}
                            {statusFilter === 'pending' && (
                              <td
                                className="py-2.5 px-3 text-center"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleSelect(item.id)
                                }}
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center mx-auto transition cursor-pointer ${
                                    isSelected ? 'bg-[#2F6FA8] border-[#2F6FA8]' : 'bg-white border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {isSelected && <Check size={10} color="#fff" />}
                                </div>
                              </td>
                            )}

                            {/* Nhân viên */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#2F6FA8] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                                  {emp?.full_name?.charAt(0) || 'N'}
                                </div>
                                <div className="min-w-0">
                                  <strong className="text-gray-900 font-bold block truncate group-hover:text-[#2F6FA8] transition">
                                    {emp?.full_name || 'Nhân viên'}
                                  </strong>
                                  <span className="text-[10px] font-mono text-gray-400 block font-bold">
                                    {emp?.employee_code || item.employee_id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Cơ sở & Vị trí */}
                            <td className="py-2.5 px-2 text-gray-600 font-medium">
                              <div className="space-y-0.5">
                                <span className="block truncate font-bold text-gray-800">
                                  {store?.name.replace('Homies Milk Tea - ', '') || 'Chi nhánh'}
                                </span>
                                <span className="text-[10px] text-gray-500 block truncate">
                                  {position?.name || 'Nhân sự'}
                                </span>
                              </div>
                            </td>

                            {/* Danh mục */}
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block whitespace-nowrap"
                                style={{ backgroundColor: `${cat?.color || '#2F6FA8'}18`, color: cat?.color || '#2F6FA8' }}
                              >
                                {cat?.label}
                              </span>
                            </td>

                            {/* Nội dung & Lý do */}
                            <td className="py-2.5 px-3 max-w-[220px]">
                              <div className="space-y-0.5">
                                <strong className="text-gray-800 block truncate font-bold" title={item.title}>
                                  {item.title}
                                </strong>
                                <p className="text-[11px] text-gray-500 truncate italic" title={item.reason}>
                                  &ldquo;{item.reason}&rdquo;
                                </p>
                              </div>
                            </td>

                            {/* Thời gian / Ca */}
                            <td className="py-2.5 px-2 text-center whitespace-nowrap font-medium text-gray-700">
                              {item.target_date ? (
                                <div className="space-y-0.5">
                                  <span className="font-mono font-bold text-gray-900 block">{formatDate(item.target_date)}</span>
                                  {item.shift_name && (
                                    <span className="text-[10px] text-[#2F6FA8] font-bold block">{item.shift_name}</span>
                                  )}
                                </div>
                              ) : item.amount ? (
                                <span className="font-mono font-bold text-emerald-700 text-xs">
                                  {item.amount.toLocaleString('vi-VN')} đ
                                </span>
                              ) : (
                                <span className="text-gray-400 font-mono text-[11px]">{timeAgo(item.created_at)}</span>
                              )}
                            </td>

                            {/* Mức độ */}
                            <td className="py-2.5 px-2 text-center">
                              {isUrgent ? (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  GẤP
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-gray-400">
                                  Thường
                                </span>
                              )}
                            </td>

                            {/* Trạng thái */}
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              {item.status === 'approved' ? (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  Đã duyệt
                                </span>
                              ) : item.status === 'rejected' ? (
                                <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                  Từ chối
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  Chờ duyệt
                                </span>
                              )}
                            </td>

                            {/* Thao tác 1 chạm */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {item.status === 'pending' ? (
                                <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(item.id)}
                                    className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition cursor-pointer"
                                    title="Từ chối yêu cầu"
                                  >
                                    Từ chối
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(item.id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                                    title="Phê duyệt nhanh"
                                  >
                                    Duyệt
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openDetailModal(item)}
                                  className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold transition"
                                >
                                  Xem lại
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer tóm tắt bảng */}
                <div className="px-4 py-3 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-3">
                    <span>Tổng hiển thị: <strong className="text-gray-900 font-mono font-bold">{filteredItems.length}</strong> đơn</span>
                    <span>•</span>
                    <span>Đang chờ: <strong className="text-amber-800 font-mono font-bold">{filteredItems.filter(i => i.status === 'pending').length}</strong></span>
                    {selectedIds.size > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-[#2F6FA8] font-bold">Đã chọn: {selectedIds.size} đơn</span>
                      </>
                    )}
                  </div>

                  <span className="text-[11px] text-gray-400 italic hidden sm:inline">
                    💡 Click trực tiếp vào hàng để mở toàn văn chi tiết &amp; minh chứng
                  </span>
                </div>
              </div>
            ) : (
              /* ══════════════════════════════════════════════════════ */
              /* DẠNG THẺ THU GỌN (COMPACT CARD GRID)                  */
              /* ══════════════════════════════════════════════════════ */
              <div className="space-y-2.5">
                {filteredItems.map(item => (
                  <ApprovalItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onToggleSelect={toggleSelect}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onOpenDetail={openDetailModal}
                    feedback={actionFeedback?.id === item.id ? actionFeedback.action : null}
                    timeAgo={timeAgo}
                  />
                ))}
              </div>
            )}
          </div>

          {/* CỘT PHỤ (1/3) */}
          <div className="space-y-5">
            <ApprovalSidebarWidgets
              items={approvalList}
              onSelectUrgentItem={openDetailModal}
              onFilterCategory={(cat) => setActiveCategory(cat as TabFilter)}
            />
          </div>
        </div>
      </div>

      {/* MODAL BÓC TÁCH CHI TIẾT ĐƠN TỪ */}
      <ApprovalDetailModal
        item={selectedDetailItem}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        hasPrev={currentModalIndex > 0}
        hasNext={currentModalIndex < filteredItems.length - 1}
        currentIndex={currentModalIndex}
        totalCount={filteredItems.length}
      />
    </AppShell>
  )
}

// ════════════════════════════════════════════════════════
// COMPONENT THẺ ĐƠN TỪ THU GỌN (COMPACT CARD)
// ════════════════════════════════════════════════════════
function ApprovalItemCard({
  item,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onOpenDetail,
  feedback,
  timeAgo,
}: {
  item: ApprovalItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onOpenDetail: (item: ApprovalItem) => void
  feedback: 'approved' | 'rejected' | null
  timeAgo: (d: string) => string
}) {
  const emp = getEmployeeById(item.employee_id)
  const store = getStoreById(item.store_id)
  const position = emp ? getPositionById(emp.position_id) : null
  const cat = APPROVAL_CATEGORIES[item.category]
  const swapEmp = item.swap_with_employee_id ? getEmployeeById(item.swap_with_employee_id) : null

  const isUrgent = item.priority === 'high'
  const isApproved = item.status === 'approved'
  const isRejected = item.status === 'rejected'

  if (feedback) {
    return (
      <div className="card p-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center justify-center gap-2 font-bold text-xs shadow-xs animate-fade-in">
        {feedback === 'approved' ? (
          <>
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Đã duyệt yêu cầu của {emp?.full_name}!</span>
          </>
        ) : (
          <>
            <XCircle size={16} className="text-rose-600" />
            <span>Đã từ chối yêu cầu của {emp?.full_name}!</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className={`card p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs group ${
        isUrgent && item.status === 'pending'
          ? 'bg-white border-rose-200 hover:border-rose-300 hover:shadow-xs'
          : 'bg-white border-gray-100 hover:border-[#2F6FA8] hover:shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {item.status === 'pending' && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect(item.id)
            }}
            className="mt-0.5 flex-shrink-0 cursor-pointer"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                isSelected ? 'bg-[#2F6FA8] border-[#2F6FA8]' : 'bg-white border-gray-300 hover:border-gray-400'
              }`}
            >
              {isSelected && <Check size={10} color="#fff" />}
            </div>
          </div>
        )}

        {/* Category Icon */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs"
          style={{ backgroundColor: `${cat?.color || '#2F6FA8'}18`, color: cat?.color || '#2F6FA8' }}
        >
          <CategoryIcon iconKey={cat?.iconKey || 'Layers'} size={15} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <strong className="text-xs font-bold text-[#001D3D] group-hover:text-[#2F6FA8] transition">
                {emp?.full_name || 'Nhân viên'}
              </strong>
              {position && (
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                  {position.name}
                </span>
              )}
              {store && (
                <span className="text-[10px] text-gray-400 font-medium">
                  • {store.name.replace('Homies Milk Tea - ', '')}
                </span>
              )}
              {isUrgent && item.status === 'pending' && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                  GẤP
                </span>
              )}
            </div>

            {/* Trạng thái / Nút hành động */}
            {item.status === 'pending' ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onReject(item.id)}
                  className="px-2 py-0.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(item.id)}
                  className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs"
                >
                  Duyệt
                </button>
              </div>
            ) : isApproved ? (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Đã duyệt
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                Đã từ chối
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold px-1.5 py-0.2 rounded"
              style={{ backgroundColor: `${cat?.color || '#2F6FA8'}18`, color: cat?.color || '#2F6FA8' }}
            >
              {cat?.label}
            </span>
            <span className="text-xs font-bold text-gray-800 truncate">
              {item.title}
            </span>
          </div>

          <p className="text-[11px] text-gray-500 italic truncate font-medium">
            &ldquo;{item.reason}&rdquo;
          </p>
        </div>
      </div>
    </div>
  )
}
