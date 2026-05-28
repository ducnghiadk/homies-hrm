'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { Avatar } from '@/components/ui/Avatar'
import { getPositionById, getStoreById, mockStores } from '@/lib/mock-data'
import { EmployeeService } from '@/lib/services/employee-service'
import { useAuthStore } from '@/store/auth-store'

type InlineIconProps = {
  size?: number
  className?: string
}

function InlineIcon({ size = 16, className = '', children }: React.PropsWithChildren<InlineIconProps>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const BriefcaseIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </InlineIcon>
)

const Building2Icon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    <path d="M4 21h16" />
    <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
  </InlineIcon>
)

const ChevronRightIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <path d="m9 18 6-6-6-6" />
  </InlineIcon>
)

const DownloadIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </InlineIcon>
)

const FileSpreadsheetIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M8 13h8M8 17h8M10 9v10M14 9v10" />
  </InlineIcon>
)

const MailIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </InlineIcon>
)

const PhoneIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72l.34 2.74a2 2 0 0 1-.57 1.72l-1.2 1.2a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 1.72-.57l2.74.34A2 2 0 0 1 22 16.92z" />
  </InlineIcon>
)

const RotateCcwIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 3v6h6" />
  </InlineIcon>
)

const SearchIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </InlineIcon>
)

const MoreHorizontalIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </InlineIcon>
)

const UserPlusIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="4" />
    <path d="M19 8v6M16 11h6" />
  </InlineIcon>
)

const PencilIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
  </InlineIcon>
)

const LockIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
  </InlineIcon>
)

const UnlockIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 7-2.5" />
  </InlineIcon>
)

const UserXIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="4" />
    <path d="m17 8 5 5M22 8l-5 5" />
  </InlineIcon>
)

const getWorkStatusMeta = (status: string) => {
  switch (status) {
    case 'active':
      return { label: 'Đang làm việc', className: 'bg-success-100 text-success-700' }
    case 'probation':
      return { label: 'Thử việc', className: 'bg-warning-100 text-warning-700' }
    case 'inactive':
      return { label: 'Sắp nhận việc', className: 'bg-primary-50 text-primary-700' }
    case 'resigned':
      return { label: 'Đã nghỉ', className: 'bg-gray-100 text-gray-600' }
    default:
      return { label: status, className: 'bg-gray-100 text-gray-600' }
  }
}

const getAccountStatusMeta = (status?: string) => {
  switch (status) {
    case 'dang_hoat_dong':
      return { label: 'Tài khoản hoạt động', className: 'bg-success-50 text-success-700' }
    case 'bi_khoa':
      return { label: 'Tài khoản khóa', className: 'bg-error-50 text-error-700' }
    default:
      return { label: 'Chưa kích hoạt', className: 'bg-warning-50 text-warning-700' }
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'ceo':
      return 'CEO'
    case 'hr_admin':
      return 'Quản trị nhân sự'
    case 'store_manager':
      return 'Quản lý cửa hàng'
    case 'shift_leader':
      return 'Trưởng ca'
    default:
      return 'Nhân viên'
  }
}

const getDepartmentLabel = (positionName?: string) => {
  if (!positionName) return 'Vận hành cửa hàng'
  if (positionName.toLowerCase().includes('quản lý')) return 'Quản lý cửa hàng'
  return 'Vận hành cửa hàng'
}

const getStoreLabel = (storeId?: string) => {
  const storeName = getStoreById(storeId || '')?.name
  return storeName ? storeName.replace('Homies Milk Tea - ', '') : 'Chưa phân bổ'
}

const employeeTableGridTemplate = '44px 36px 76px minmax(204px,1.35fr) 100px 92px minmax(124px,0.9fr) 84px minmax(120px,0.9fr) 104px 152px'

export default function EmployeesPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedAccountStatus, setSelectedAccountStatus] = useState('')
  const [rawSelectedEmployeeIds, setRawSelectedEmployeeIds] = useState<string[]>([])
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const actionMenuRef = useRef<HTMLDivElement | null>(null)

  const viewer = useMemo(() => EmployeeService.resolveSessionUser(user) || null, [user])

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !viewer)) {
      router.push('/login?redirect=/employees')
    }
  }, [hasHydrated, isAuthenticated, viewer, router])

  useEffect(() => {
    if (!openActionMenuId) return

    const handlePointerDown = (event: MouseEvent) => {
      if (actionMenuRef.current?.contains(event.target as Node)) return
      setOpenActionMenuId(null)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionMenuId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [openActionMenuId])

  const employeesList = useMemo(() => {
    void refreshKey
    if (!viewer) return []
    return EmployeeService.getEmployees(viewer)
  }, [viewer, refreshKey])

  const filteredEmployees = useMemo(() => {
    return employeesList.filter((employee) => {
      const term = searchTerm.trim().toLowerCase()
      const position = getPositionById(employee.position_id)
      const storeLabel = getStoreLabel(employee.store_id)
      const fullName = employee.full_name || ''

      const matchesSearch = !term || (
        fullName.toLowerCase().includes(term) ||
        (employee.employee_code || '').toLowerCase().includes(term) ||
        (employee.email || '').toLowerCase().includes(term) ||
        (employee.phone || '').includes(term) ||
        (position?.name || '').toLowerCase().includes(term) ||
        storeLabel.toLowerCase().includes(term) ||
        (employee.department_name || '').toLowerCase().includes(term) ||
        (employee.job_level || '').toLowerCase().includes(term)
      )

      const matchesStore = !selectedStore || employee.store_id === selectedStore
      const matchesStatus = !selectedStatus || employee.status === selectedStatus
      const matchesAccountStatus = !selectedAccountStatus || employee.account_status === selectedAccountStatus

      return matchesSearch && matchesStore && matchesStatus && matchesAccountStatus
    })
  }, [employeesList, searchTerm, selectedStore, selectedStatus, selectedAccountStatus])

  if (!hasHydrated || !viewer || !isAuthenticated) return null

  const canManageEmployees = ['hr_admin', 'ceo'].includes(viewer.role)
  const activeCount = employeesList.filter(employee => employee.status === 'active').length
  const probationCount = employeesList.filter(employee => employee.status === 'probation').length
  const inactiveCount = employeesList.filter(employee => employee.status === 'inactive').length
  const activeFilterCount = [searchTerm.trim(), selectedStore, selectedStatus, selectedAccountStatus].filter(Boolean).length
  const selectedEmployeeIds = rawSelectedEmployeeIds.filter((id) => employeesList.some((employee) => employee.id === id))
  const filteredEmployeeIds = filteredEmployees.map((employee) => employee.id)
  const selectedEmployees = employeesList.filter((employee) => selectedEmployeeIds.includes(employee.id))
  const visibleSelectedCount = filteredEmployeeIds.filter((id) => selectedEmployeeIds.includes(id)).length
  const allFilteredSelected = filteredEmployeeIds.length > 0 && filteredEmployeeIds.every((id) => selectedEmployeeIds.includes(id))
  const hasAnySelection = selectedEmployeeIds.length > 0
  const quickActionCount = canManageEmployees ? 4 : 0

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedStore('')
    setSelectedStatus('')
    setSelectedAccountStatus('')
  }

  const refreshList = () => setRefreshKey((current) => current + 1)

  const toggleEmployeeSelection = (employeeId: string) => {
    if (!canManageEmployees) return
    setRawSelectedEmployeeIds((current) => (
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    ))
  }

  const toggleSelectAllFiltered = () => {
    if (!canManageEmployees) return
    if (allFilteredSelected) {
      setRawSelectedEmployeeIds((current) => current.filter((id) => !filteredEmployeeIds.includes(id)))
      return
    }

    setRawSelectedEmployeeIds((current) => Array.from(new Set([...current, ...filteredEmployeeIds])))
  }

  const clearSelection = () => setRawSelectedEmployeeIds([])

  const buildExportHref = () => {
    const query = new URLSearchParams()

    if (searchTerm.trim()) query.set('search', searchTerm.trim())
    if (selectedStore) query.set('store', selectedStore)
    if (selectedStatus) query.set('status', selectedStatus)
    if (selectedAccountStatus) query.set('accountStatus', selectedAccountStatus)
    if (selectedEmployeeIds.length > 0) query.set('selectedIds', selectedEmployeeIds.join(','))

    const queryString = query.toString()
    return queryString ? `/employees/export?${queryString}` : '/employees/export'
  }

  const handleExportFiltered = () => {
    router.push(buildExportHref())
  }

  const runBulkAction = (action: 'lock' | 'unlock' | 'resign' | 'restore') => {
    if (!canManageEmployees || !viewer || selectedEmployees.length === 0) return

    const targetEmployees = selectedEmployees.filter((employee) => {
      if (action === 'unlock') return employee.status !== 'resigned' && employee.account_status !== 'dang_hoat_dong'
      if (action === 'lock') return employee.account_status !== 'bi_khoa'
      if (action === 'resign') return employee.status !== 'resigned'
      if (action === 'restore') return employee.status === 'resigned'
      return false
    })

    if (targetEmployees.length === 0) {
      alert('Không có nhân sự phù hợp với thao tác hàng loạt này.')
      return
    }

    const skippedCount = selectedEmployees.length - targetEmployees.length
    const actionLabel = action === 'lock'
      ? 'khóa tài khoản'
      : action === 'unlock'
        ? 'mở khóa tài khoản'
        : action === 'resign'
          ? 'đánh dấu nghỉ việc'
          : 'khôi phục làm việc'
    const confirmed = confirm(
      skippedCount > 0
        ? `Xác nhận ${actionLabel} cho ${targetEmployees.length} nhân sự? Có ${skippedCount} người sẽ được bỏ qua vì không phù hợp.`
        : `Xác nhận ${actionLabel} cho ${targetEmployees.length} nhân sự đã chọn?`
    )
    if (!confirmed) return

    for (const employee of targetEmployees) {
      if (action === 'lock') {
        EmployeeService.updateEmployee(
          employee.id,
          { account_status: 'bi_khoa' },
          viewer,
          'Khóa tài khoản hàng loạt từ bảng nhân sự',
        )
        continue
      }

      if (action === 'unlock') {
        EmployeeService.updateEmployee(
          employee.id,
          { account_status: 'dang_hoat_dong' },
          viewer,
          'Mở khóa tài khoản hàng loạt từ bảng nhân sự',
        )
        continue
      }

      if (action === 'resign') {
        EmployeeService.updateEmployee(
          employee.id,
          { status: 'resigned', account_status: 'bi_khoa' },
          viewer,
          'Đánh dấu nghỉ việc hàng loạt từ bảng nhân sự',
        )
        continue
      }

      EmployeeService.updateEmployee(
        employee.id,
        {
          status: 'active',
          account_status: employee.account_status === 'bi_khoa' ? 'dang_hoat_dong' : employee.account_status,
        },
        viewer,
        'Khôi phục làm việc hàng loạt từ bảng nhân sự',
      )
    }

    setRawSelectedEmployeeIds((current) => current.filter((id) => !targetEmployees.some((employee) => employee.id === id)))
    refreshList()
  }

  const handleToggleAccountStatus = (employeeId: string) => {
    if (!canManageEmployees || !viewer) return
    const employee = EmployeeService.getEmployeeById(employeeId, viewer)
    if (!employee) return

    const nextStatus = employee.account_status === 'bi_khoa' ? 'dang_hoat_dong' : 'bi_khoa'
    const confirmed = confirm(
      nextStatus === 'bi_khoa'
        ? `Khóa tài khoản của ${employee.full_name}?`
        : `Mở khóa tài khoản của ${employee.full_name}?`
    )
    if (!confirmed) return

    EmployeeService.updateEmployee(
      employee.id,
      { account_status: nextStatus },
      viewer,
      nextStatus === 'bi_khoa' ? 'Khóa tài khoản từ bảng nhân sự' : 'Mở khóa tài khoản từ bảng nhân sự',
    )
    refreshList()
  }

  const handleToggleWorkStatus = (employeeId: string) => {
    if (!canManageEmployees || !viewer) return
    const employee = EmployeeService.getEmployeeById(employeeId, viewer)
    if (!employee) return

    const nextStatus = employee.status === 'resigned' ? 'active' : 'resigned'
    const confirmed = confirm(
      nextStatus === 'resigned'
        ? `Đánh dấu ${employee.full_name} đã nghỉ việc?`
        : `Khôi phục trạng thái làm việc cho ${employee.full_name}?`
    )
    if (!confirmed) return

    EmployeeService.updateEmployee(
      employee.id,
      {
        status: nextStatus,
        account_status: nextStatus === 'resigned'
          ? 'bi_khoa'
          : employee.account_status === 'bi_khoa'
            ? 'dang_hoat_dong'
            : employee.account_status,
      },
      viewer,
      nextStatus === 'resigned' ? 'Đánh dấu nghỉ việc từ bảng nhân sự' : 'Khôi phục làm việc từ bảng nhân sự',
    )
    refreshList()
  }

  return (
    <AppShell showNav>
      <div className="animate-fade-in space-y-4 pb-20">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Nhân sự</p>
              <h1 className="mt-2 text-2xl font-bold text-dark-700 font-['Poppins']">Trung tâm nhân sự</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Màn này giúp HR nhìn nhanh đội ngũ đang ở trạng thái nào, rồi đi thẳng xuống bảng để lọc và thao tác.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-primary-100 bg-primary-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Ưu tiên hôm nay</p>
                <p className="mt-2 text-3xl font-black text-dark-700">{filteredEmployees.length}</p>
                <p className="mt-1 text-sm text-gray-600">Nhân sự đang nằm trong phạm vi xem hiện tại.</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Tổng quan nhanh</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-success-50 px-3 py-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-success-700">Đang làm</p>
                    <p className="mt-1 text-xl font-bold text-dark-700">{activeCount}</p>
                  </div>
                  <div className="rounded-2xl bg-warning-50 px-3 py-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-warning-700">Thử việc</p>
                    <p className="mt-1 text-xl font-bold text-dark-700">{probationCount}</p>
                  </div>
                  <div className="rounded-2xl bg-primary-50 px-3 py-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-700">Sắp nhận</p>
                    <p className="mt-1 text-xl font-bold text-dark-700">{inactiveCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {canManageEmployees ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary-100 bg-primary-50/70 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm text-primary-700">
                  <button type="button" onClick={() => router.push('/employees/invitations')} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-3 font-semibold transition-colors hover:bg-primary-50">
                    <MailIcon size={14} />
                    Mời nhân sự
                  </button>
                  <button type="button" onClick={() => router.push('/employees/new')} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary-500 px-3 font-semibold text-white shadow-sm transition-colors hover:bg-primary-600">
                    <UserPlusIcon size={14} />
                    Thêm trực tiếp
                  </button>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-700">
                    {quickActionCount} tác vụ nhanh
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-primary-700">
                  <button type="button" onClick={toggleSelectAllFiltered} className="inline-flex h-9 items-center justify-center rounded-xl border border-primary-200 bg-white px-3 font-semibold transition-colors hover:bg-primary-50">
                    {allFilteredSelected ? 'Bỏ chọn trang hiện tại' : 'Chọn tất cả theo bộ lọc'}
                  </button>
                  <button type="button" onClick={clearSelection} className="inline-flex h-9 items-center justify-center rounded-xl border border-primary-200 bg-white px-3 font-semibold transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={!hasAnySelection}>
                    Bỏ chọn
                  </button>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-primary-700">
                    Đã chọn {selectedEmployeeIds.length} người
                  </span>
                  <span className="text-xs text-primary-700/80">
                    Hiện trong bộ lọc: {visibleSelectedCount}/{filteredEmployees.length}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => runBulkAction('lock')} disabled={!hasAnySelection} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <LockIcon size={14} />
                  Khóa tài khoản
                </button>
                <button type="button" onClick={() => runBulkAction('unlock')} disabled={!hasAnySelection} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <UnlockIcon size={14} />
                  Mở khóa
                </button>
                <button type="button" onClick={() => runBulkAction('resign')} disabled={!hasAnySelection} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <UserXIcon size={14} />
                  Đánh dấu nghỉ việc
                </button>
                <button type="button" onClick={() => runBulkAction('restore')} disabled={!hasAnySelection} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <RotateCcwIcon size={14} />
                  Khôi phục
                </button>
                <button type="button" onClick={handleExportFiltered} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary-500 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600">
                  <DownloadIcon size={14} />
                  Xuất theo bộ lọc
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {canManageEmployees ? (
          <section className="grid gap-3 lg:grid-cols-5">
            <button type="button" onClick={() => router.push('/employees/new')} className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-primary-50">
              <div className="flex items-center gap-2 text-primary-600">
                <UserPlusIcon size={18} />
                <span className="text-sm font-bold">Thêm trực tiếp</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Tạo nhanh hồ sơ mới và thêm ngay vào danh sách.</p>
            </button>
            <button type="button" onClick={() => router.push('/employees/import')} className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-primary-50">
              <div className="flex items-center gap-2 text-primary-600">
                <FileSpreadsheetIcon size={18} />
                <span className="text-sm font-bold">Nhập từ Excel</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Đọc file mẫu thật, xem lỗi trước rồi nhập vào danh sách.</p>
            </button>
            <button type="button" onClick={handleExportFiltered} className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-primary-50">
              <div className="flex items-center gap-2 text-primary-600">
                <DownloadIcon size={18} />
                <span className="text-sm font-bold">Xuất biểu mẫu</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Xuất danh sách nhân viên theo mẫu Excel quản trị.</p>
            </button>
            <button type="button" onClick={() => router.push('/employees/contracts')} className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-primary-50">
              <div className="flex items-center gap-2 text-primary-600">
                <BriefcaseIcon size={18} />
                <span className="text-sm font-bold">Hợp đồng</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Quản lý hợp đồng, gửi ký và theo dõi trạng thái.</p>
            </button>
            <button type="button" onClick={() => router.push('/employees/offboarding')} className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-primary-50">
              <div className="flex items-center gap-2 text-primary-600">
                <UserXIcon size={18} />
                <span className="text-sm font-bold">Offboarding</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Đi thẳng vào trung tâm chốt nghỉ việc, tài khoản và bàn giao.</p>
            </button>
          </section>
        ) : null}

        <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Bộ lọc và tìm kiếm</p>
              <p className="mt-1 text-xs text-gray-500">Giữ phần này gọn để mắt đi thẳng xuống bảng nhân sự.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <span>Bộ lọc đang bật</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-slate-800">{activeFilterCount}</span>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_190px_190px_auto]">
            <div className="relative min-w-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm theo tên, mã, email, số điện thoại..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <select value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100" disabled={!canManageEmployees}>
              <option value="">Tất cả chi nhánh</option>
              {mockStores.map(store => (
                <option key={store.id} value={store.id}>{store.name.replace('Homies Milk Tea - ', '')}</option>
              ))}
            </select>

            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100">
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang làm việc</option>
              <option value="probation">Thử việc</option>
              <option value="inactive">Sắp nhận việc</option>
              <option value="resigned">Đã nghỉ</option>
            </select>

            <select value={selectedAccountStatus} onChange={(event) => setSelectedAccountStatus(event.target.value)} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100" disabled={!canManageEmployees}>
              <option value="">Tất cả tài khoản</option>
              <option value="chua_kich_hoat">Chưa kích hoạt</option>
              <option value="dang_hoat_dong">Đang hoạt động</option>
              <option value="bi_khoa">Bị khóa</option>
            </select>

            <button type="button" onClick={resetFilters} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50">
              <RotateCcwIcon size={16} />
              Làm mới
              {activeFilterCount > 0 ? <span className="rounded-full bg-error-500 px-1.5 text-xs font-bold text-white">{activeFilterCount}</span> : null}
            </button>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <div className="min-w-[1036px]">
              <div className="grid items-center gap-1.5 border-b border-gray-100 bg-primary-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-dark-700" style={{ gridTemplateColumns: employeeTableGridTemplate }}>
                <div>
                  {canManageEmployees ? (
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      aria-label="Chọn tất cả nhân sự theo bộ lọc"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  ) : null}
                </div>
                <div>#</div>
                <div>Mã</div>
                <div>Nhân sự</div>
                <div>Số điện thoại</div>
                <div>Chi nhánh</div>
                <div>Bộ phận</div>
                <div>Ngày vào</div>
                <div>Vai trò</div>
                <div>Trạng thái</div>
                <div className="text-right">Thao tác</div>
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="px-6 py-16 text-center text-sm text-gray-400">Không có nhân sự phù hợp với bộ lọc hiện tại.</div>
              ) : null}

              {filteredEmployees.map((employee, index) => {
                const fullName = employee.full_name || 'Chưa có tên'
                const workStatus = getWorkStatusMeta(employee.status)
                const accountStatus = getAccountStatusMeta(employee.account_status)
                const storeLabel = getStoreLabel(employee.store_id)
                const position = getPositionById(employee.position_id)

                return (
                  <div key={employee.id} className="grid min-h-[74px] items-center gap-1.5 border-b border-gray-50 px-4 py-3 text-sm transition-colors hover:bg-primary-50/40" style={{ gridTemplateColumns: employeeTableGridTemplate }}>
                    <div>
                      {canManageEmployees ? (
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.includes(employee.id)}
                          onChange={() => toggleEmployeeSelection(employee.id)}
                          aria-label={`Chọn ${fullName}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      ) : null}
                    </div>
                    <div className="font-medium text-gray-500">{index + 1}</div>
                    <div className="font-semibold text-dark-700">{employee.employee_code || '-'}</div>
                    <button type="button" onClick={() => router.push(`/employees/${employee.id}`)} className="flex min-w-0 items-center gap-3 text-left">
                      <Avatar name={fullName} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-dark-700">{fullName}</span>
                        <span className="block truncate text-xs text-gray-500">{employee.email || 'Chưa cập nhật email'}</span>
                      </span>
                    </button>
                    <div className="text-gray-700">{employee.phone || '-'}</div>
                    <div className="text-gray-700">{storeLabel}</div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-dark-700">{employee.department_name || getDepartmentLabel(position?.name)}</p>
                      <p className="truncate text-xs text-gray-500">{position?.name || 'Chưa phân bổ'}</p>
                    </div>
                    <div className="text-gray-700">{employee.hire_date}</div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-dark-700">{getRoleLabel(employee.role)}</p>
                      <p className="truncate text-xs text-gray-500">{position?.name || 'Chưa phân bổ'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className={`inline-flex max-w-full truncate rounded-full px-2 py-1 text-[11px] font-semibold ${workStatus.className}`}>{workStatus.label}</span>
                      <span className={`inline-flex max-w-full truncate rounded-full px-2 py-1 text-[11px] font-medium ${accountStatus.className}`}>{accountStatus.label}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/employees/${employee.id}`)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                        title="Mở hồ sơ"
                      >
                        <ChevronRightIcon size={16} />
                        <span>Xem</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/employees/contracts?employeeId=${employee.id}`)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                        title="Mở hợp đồng đang theo dõi"
                      >
                        <BriefcaseIcon size={16} />
                        <span>Hợp đồng</span>
                      </button>
                      {canManageEmployees ? (
                        <div ref={openActionMenuId === employee.id ? actionMenuRef : null} className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenActionMenuId(currentId => currentId === employee.id ? null : employee.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                            title="Thao tác khác"
                            aria-label={`Mở thêm thao tác cho ${fullName}`}
                            aria-expanded={openActionMenuId === employee.id}
                          >
                            <MoreHorizontalIcon size={16} />
                          </button>
                          {openActionMenuId === employee.id ? (
                            <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl shadow-gray-200/70">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  router.push(`/employees/${employee.id}?mode=edit`)
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                              >
                                <PencilIcon size={15} />
                                <span>Sửa hồ sơ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  router.push(`/employees/offboarding?employeeId=${employee.id}`)
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                              >
                                <UserXIcon size={15} />
                                <span>Offboarding</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  handleToggleAccountStatus(employee.id)
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                              >
                                {employee.account_status === 'bi_khoa' ? <UnlockIcon size={15} /> : <LockIcon size={15} />}
                                <span>{employee.account_status === 'bi_khoa' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  handleToggleWorkStatus(employee.id)
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                              >
                                <UserXIcon size={15} />
                                <span>{employee.status === 'resigned' ? 'Khôi phục làm việc' : 'Đánh dấu nghỉ việc'}</span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="hidden">
                      <button type="button" onClick={() => router.push(`/employees/${employee.id}`)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 text-primary-600 transition-colors hover:bg-primary-50" title="Mở hồ sơ">
                        <ChevronRightIcon size={16} />
                      </button>
                      <button type="button" onClick={() => router.push(`/employees/contracts?employeeId=${employee.id}`)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50" title="Mở hợp đồng đang theo dõi">
                        <BriefcaseIcon size={16} />
                      </button>
                      {canManageEmployees ? (
                        <button type="button" onClick={() => router.push(`/employees/offboarding?employeeId=${employee.id}`)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50" title="Mở trung tâm nghỉ việc">
                          <UserXIcon size={16} />
                        </button>
                      ) : null}
                      {canManageEmployees ? (
                        <>
                          <button type="button" onClick={() => router.push(`/employees/${employee.id}?mode=edit`)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50" title="Sửa hồ sơ">
                            <PencilIcon size={16} />
                          </button>
                          <button type="button" onClick={() => handleToggleAccountStatus(employee.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50" title={employee.account_status === 'bi_khoa' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}>
                            {employee.account_status === 'bi_khoa' ? <UnlockIcon size={16} /> : <LockIcon size={16} />}
                          </button>
                          <button type="button" onClick={() => handleToggleWorkStatus(employee.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50" title={employee.status === 'resigned' ? 'Khôi phục làm việc' : 'Đánh dấu nghỉ việc'}>
                            <UserXIcon size={16} />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 p-3 lg:hidden">
            {filteredEmployees.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">Không có nhân sự phù hợp với bộ lọc hiện tại.</div>
            ) : null}

            {filteredEmployees.map(employee => {
              const fullName = employee.full_name || 'Chưa có tên'
              const workStatus = getWorkStatusMeta(employee.status)
              const accountStatus = getAccountStatusMeta(employee.account_status)
              const storeLabel = getStoreLabel(employee.store_id)
              const position = getPositionById(employee.position_id)

              return (
                <div key={employee.id} className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-primary-50/40">
                  <div className="flex items-start gap-3">
                    {canManageEmployees ? (
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(employee.id)}
                        onChange={() => toggleEmployeeSelection(employee.id)}
                        aria-label={`Chọn ${fullName}`}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    ) : null}
                    <Avatar name={fullName} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-dark-700">{fullName}</p>
                          <p className="mt-0.5 truncate text-sm text-gray-500">{employee.employee_code || 'Chưa cấp mã'} · {position?.name || 'Chưa phân bổ'}</p>
                        </div>
                        <button type="button" onClick={() => router.push(`/employees/${employee.id}`)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-200 text-primary-600">
                          <ChevronRightIcon size={18} className="shrink-0" />
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2"><PhoneIcon size={14} className="text-gray-400" /><span>{employee.phone || '-'}</span></p>
                        <p className="flex items-center gap-2"><Building2Icon size={14} className="text-gray-400" /><span>{storeLabel}</span></p>
                        <p className="flex items-center gap-2"><BriefcaseIcon size={14} className="text-gray-400" /><span>{employee.department_name || getDepartmentLabel(position?.name)}</span></p>
                        <p className="text-xs text-gray-500">Vào làm: {employee.hire_date}</p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${workStatus.className}`}>{workStatus.label}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${accountStatus.className}`}>{accountStatus.label}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            router.push(`/employees/contracts?employeeId=${employee.id}`)
                          }}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700"
                        >
                          <BriefcaseIcon size={14} />
                          Hợp đồng
                        </button>
                        {canManageEmployees ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              router.push(`/employees/offboarding?employeeId=${employee.id}`)
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700"
                          >
                            <UserXIcon size={14} />
                            Offboarding
                          </button>
                        ) : null}
                      </div>
                      {canManageEmployees ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              router.push(`/employees/${employee.id}?mode=edit`)
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700"
                          >
                            <PencilIcon size={14} />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleToggleAccountStatus(employee.id)
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700"
                          >
                            {employee.account_status === 'bi_khoa' ? <UnlockIcon size={14} /> : <LockIcon size={14} />}
                            {employee.account_status === 'bi_khoa' ? 'Mở khóa' : 'Khóa'}
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleToggleWorkStatus(employee.id)
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700"
                          >
                            <UserXIcon size={14} />
                            {employee.status === 'resigned' ? 'Khôi phục' : 'Nghỉ việc'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
