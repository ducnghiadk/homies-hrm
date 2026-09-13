'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { Avatar } from '@/components/ui/Avatar'
import { getPositionById, getStoreById, mockStores, isStoreMatch } from '@/lib/mock-data'
import { storeAdapter, employeeAdapter } from '@/lib/adapters'
import { EmployeeService, getDepartmentName, getDefaultSecondaryPositions } from '@/lib/services/employee-service'
import { useAuthStore, type AuthUser } from '@/store/auth-store'
import EmployeeImportModal from '@/components/employee/EmployeeImportModal'

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

const LayoutGridIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </InlineIcon>
)

const TablePropertiesIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <path d="M15 3v18M9 3v18M4 9h16M4 15h16" />
    <rect width="18" height="18" x="3" y="3" rx="2" />
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

const SlidersIcon = ({ size, className }: InlineIconProps) => (
  <InlineIcon size={size} className={className}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
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
      return { label: 'Đã nghỉ', className: 'bg-primary-50 text-gray-600' }
    default:
      return { label: status, className: 'bg-primary-50 text-gray-600' }
  }
}

const getAccountStatusMeta = (status?: string) => {
  switch (status) {
    case 'dang_hoat_dong':
      return { label: 'Hoạt động', className: 'bg-success-50 text-success-700' }
    case 'bi_khoa':
      return { label: 'Bị khóa', className: 'bg-error-50 text-error-700' }
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

const getDepartmentLabel = (positionId?: string, role?: AuthUser['role']) => {
  return getDepartmentName(positionId, role)
}

const getStoreLabel = (storeId?: string) => {
  const storeName = getStoreById(storeId || '')?.name
  return storeName ? storeName.replace('Homies Milk Tea - ', '') : 'Chưa phân bổ'
}

export type ColumnKey =
  | 'code'
  | 'name'
  | 'phone'
  | 'email'
  | 'store'
  | 'position'
  | 'department'
  | 'hire_date'
  | 'role'
  | 'status'
  | 'account_status'
  | 'dob'
  | 'cccd'
  | 'address'

export interface ColumnConfig {
  id: ColumnKey
  label: string
  width: string
  visible: boolean
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'code', label: 'Mã NV', width: '80px', visible: true },
  { id: 'name', label: 'Họ và tên', width: 'minmax(180px, 1.2fr)', visible: true },
  { id: 'phone', label: 'Số điện thoại', width: '125px', visible: true },
  { id: 'email', label: 'Email nhân sự', width: 'minmax(180px, 1.2fr)', visible: true },
  { id: 'store', label: 'Chi nhánh', width: 'minmax(130px, 1fr)', visible: true },
  { id: 'position', label: 'Chức danh', width: 'minmax(130px, 1fr)', visible: true },
  { id: 'department', label: 'Bộ phận', width: 'minmax(130px, 1fr)', visible: false },
  { id: 'hire_date', label: 'Ngày vào làm', width: '105px', visible: true },
  { id: 'role', label: 'Vai trò', width: '115px', visible: true },
  { id: 'status', label: 'Trạng thái làm việc', width: '125px', visible: true },
  { id: 'account_status', label: 'Trạng thái tài khoản', width: '125px', visible: false },
  { id: 'dob', label: 'Ngày sinh', width: '105px', visible: false },
  { id: 'cccd', label: 'Số CCCD', width: '125px', visible: false },
  { id: 'address', label: 'Địa chỉ', width: 'minmax(180px, 1.2fr)', visible: false },
]

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
  const [stores, setStores] = useState(mockStores)
  const actionMenuRef = useRef<HTMLDivElement | null>(null)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<AuthUser | null>(null)
  const [customNewPassword, setCustomNewPassword] = useState('')
  const [resetResult, setResetResult] = useState<{ password?: string; message?: string } | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false)
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const [viewMode, setViewMode] = useState<'lean' | 'detail'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('HOMIES_EMPLOYEE_VIEW_MODE') as 'lean' | 'detail') || 'lean'
    }
    return 'lean'
  })

  const changeViewMode = (mode: 'lean' | 'detail') => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('HOMIES_EMPLOYEE_VIEW_MODE', mode)
    }
  }

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('HOMIES_EMPLOYEE_COLUMNS_V4')
        if (saved) {
          const parsed = JSON.parse(saved) as ColumnConfig[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        }
      } catch {}
    }
    return DEFAULT_COLUMNS
  })

  const saveColumns = (newCols: ColumnConfig[]) => {
    setColumns(newCols)
    if (typeof window !== 'undefined') {
      localStorage.setItem('HOMIES_EMPLOYEE_COLUMNS_V4', JSON.stringify(newCols))
    }
  }

  const toggleColumnVisibility = (colId: ColumnKey) => {
    const next = columns.map(c => c.id === colId ? { ...c, visible: !c.visible } : c)
    saveColumns(next)
  }

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= columns.length) return
    const next = [...columns]
    const temp = next[index]
    next[index] = next[targetIndex]
    next[targetIndex] = temp
    saveColumns(next)
  }

  const resetColumnsToDefault = () => {
    saveColumns(DEFAULT_COLUMNS)
  }

  const activeColumns = useMemo(() => columns.filter(c => c.visible), [columns])

  const leanGridTemplate = '40px 32px 76px minmax(260px,1.2fr) minmax(200px,1fr) 135px 125px 120px'

  const dynamicGridTemplate = useMemo(() => {
    if (viewMode === 'lean') {
      return leanGridTemplate
    }
    const middleWidths = activeColumns.map(c => c.width).join(' ')
    return `40px 32px ${middleWidths} 120px`
  }, [activeColumns, viewMode])

  useEffect(() => {
    storeAdapter.getStores().then(res => setStores(res))
  }, [])

  const handleResetPasswordSubmit = () => {
    if (!resetPasswordTarget || !canManageEmployees || !viewer) return
    const result = EmployeeService.resetEmployeePassword(resetPasswordTarget.id, customNewPassword, viewer)
    if (result.success) {
      setResetResult(result)
      refreshList()
    }
  }

  const handleCopyResetInfo = () => {
    if (!resetPasswordTarget || !resetResult?.password) return
    const text = `Thông tin tài khoản Homies HRM:\nEmail: ${resetPasswordTarget.email}\nMật khẩu mới: ${resetResult.password}`
    navigator.clipboard.writeText(text)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2500)
  }

  const viewer = useMemo(() => EmployeeService.resolveSessionUser(user) || (isAuthenticated && user ? user : null), [user, isAuthenticated])

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/employees')
    }
  }, [hasHydrated, isAuthenticated, router])

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



  const [employeesList, setEmployeesList] = useState<AuthUser[]>([])

  useEffect(() => {
    if (!viewer) return
    let isMounted = true
    employeeAdapter.getAllEmployees(viewer).then((data) => {
      if (isMounted) {
        setEmployeesList(data)
      }
    })
    return () => {
      isMounted = false
    }
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

      const matchesStore = !selectedStore ||
        isStoreMatch(employee.store_id, selectedStore) ||
        Boolean(employee.secondary_store_ids && employee.secondary_store_ids.some(sId => isStoreMatch(sId, selectedStore)))
      const matchesStatus = !selectedStatus || employee.status === selectedStatus
      const matchesAccountStatus = !selectedAccountStatus || employee.account_status === selectedAccountStatus

      return matchesSearch && matchesStore && matchesStatus && matchesAccountStatus
    })
  }, [employeesList, searchTerm, selectedStore, selectedStatus, selectedAccountStatus])

  if (!hasHydrated || !isAuthenticated || !viewer) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

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

  const runBulkAction = async (action: 'lock' | 'unlock' | 'resign' | 'restore' | 'set_dual_role') => {
    if (!canManageEmployees || !viewer || selectedEmployees.length === 0) return

    const targetEmployees = selectedEmployees.filter((employee) => {
      if (action === 'unlock') return employee.status !== 'resigned' && employee.account_status !== 'dang_hoat_dong'
      if (action === 'lock') return employee.account_status !== 'bi_khoa'
      if (action === 'resign') return employee.status !== 'resigned'
      if (action === 'restore') return employee.status === 'resigned'
      if (action === 'set_dual_role') return employee.status !== 'resigned'
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
          : action === 'set_dual_role'
            ? 'gán vị trí kiêm nhiệm (Pha chế & Thu ngân)'
            : 'khôi phục làm việc'
    const confirmed = confirm(
      skippedCount > 0
        ? `Xác nhận ${actionLabel} cho ${targetEmployees.length} nhân sự? Có ${skippedCount} người sẽ được bỏ qua vì không phù hợp.`
        : `Xác nhận ${actionLabel} cho ${targetEmployees.length} nhân sự đã chọn?`
    )
    if (!confirmed) return

    for (const employee of targetEmployees) {
      if (action === 'lock') {
        await employeeAdapter.updateEmployee(
          employee.id,
          { account_status: 'bi_khoa' },
          viewer,
          'Khóa tài khoản hàng loạt từ bảng nhân sự',
        )
        continue
      }

      if (action === 'unlock') {
        await employeeAdapter.updateEmployee(
          employee.id,
          { account_status: 'dang_hoat_dong' },
          viewer,
          'Mở khóa tài khoản hàng loạt từ bảng nhân sự',
        )
        continue
      }

      if (action === 'set_dual_role') {
        const dualRoles = employee.position_id === 'pos-001'
          ? ['pos-002']
          : employee.position_id === 'pos-002'
            ? ['pos-001']
            : ['pos-001', 'pos-002']

        await employeeAdapter.updateEmployee(
          employee.id,
          { secondary_position_ids: dualRoles },
          viewer,
          'Gán vị trí kiêm nhiệm (Pha chế & Thu ngân) hàng loạt',
        )
        continue
      }

      if (action === 'resign') {
        await employeeAdapter.updateEmployee(
          employee.id,
          { status: 'resigned', account_status: 'bi_khoa' },
          viewer,
          'Đánh dấu nghỉ việc hàng loạt từ bảng nhân sự',
        )
        continue
      }

      await employeeAdapter.updateEmployee(
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
    const reloaded = await employeeAdapter.getAllEmployees(viewer)
    setEmployeesList(reloaded)
    refreshList()
  }

  const handleToggleAccountStatus = async (employeeId: string) => {
    if (!canManageEmployees || !viewer) return
    const employee = employeesList.find((e) => e.id === employeeId) || EmployeeService.getEmployeeById(employeeId, viewer)
    if (!employee) return

    const nextStatus = employee.account_status === 'bi_khoa' ? 'dang_hoat_dong' : 'bi_khoa'
    const confirmed = confirm(
      nextStatus === 'bi_khoa'
        ? `Khóa tài khoản của ${employee.full_name}?`
        : `Mở khóa tài khoản của ${employee.full_name}?`
    )
    if (!confirmed) return

    await employeeAdapter.updateEmployee(
      employee.id,
      { account_status: nextStatus },
      viewer,
      nextStatus === 'bi_khoa' ? 'Khóa tài khoản từ bảng nhân sự' : 'Mở khóa tài khoản từ bảng nhân sự',
    )
    refreshList()
  }

  const handleToggleWorkStatus = async (employeeId: string) => {
    if (!canManageEmployees || !viewer) return
    const employee = employeesList.find((e) => e.id === employeeId) || EmployeeService.getEmployeeById(employeeId, viewer)
    if (!employee) return

    const nextStatus = employee.status === 'resigned' ? 'active' : 'resigned'
    const confirmed = confirm(
      nextStatus === 'resigned'
        ? `Đánh dấu ${employee.full_name} đã nghỉ việc?`
        : `Khôi phục trạng thái làm việc cho ${employee.full_name}?`
    )
    if (!confirmed) return

    await employeeAdapter.updateEmployee(
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
        {/* COMPACT TOP BAR */}
        <section className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 font-['Poppins']">Trung tâm nhân sự</h1>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-primary-700 border border-primary-100">
                  {filteredEmployees.length} nhân sự
                </span>
                <span className="rounded-full bg-success-50 px-2.5 py-1 text-success-700 border border-success-100">
                  {activeCount} Đang làm
                </span>
                <span className="rounded-full bg-warning-50 px-2.5 py-1 text-warning-700 border border-warning-100">
                  {probationCount} Thử việc
                </span>
                {inactiveCount > 0 ? (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 border border-blue-100">
                    {inactiveCount} Sắp nhận
                  </span>
                ) : null}
              </div>
            </div>
            <p className="text-xs text-gray-500">Quản lý toàn bộ đội ngũ nhân sự, theo dõi trạng thái tài khoản và hợp đồng lao động.</p>
          </div>

          {canManageEmployees ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAddDropdownOpen(prev => !prev)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
                >
                  <UserPlusIcon size={15} />
                  <span>+ Thêm nhân sự</span>
                </button>
                {isAddDropdownOpen && (
                  <div className="absolute right-0 top-12 z-30 w-52 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl shadow-gray-200/80">
                    <button
                      type="button"
                      onClick={() => { setIsAddDropdownOpen(false); router.push('/employees/new'); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
                    >
                      <UserPlusIcon size={15} className="text-primary-600" />
                      <span>Thêm trực tiếp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddDropdownOpen(false); router.push('/employees/invitations'); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
                    >
                      <MailIcon size={15} className="text-primary-600" />
                      <span>Gửi lời mời nhận việc</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddDropdownOpen(false); setIsImportModalOpen(true); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-vanilla-50 cursor-pointer"
                    >
                      <FileSpreadsheetIcon size={15} className="text-primary-600" />
                      <span>Nhập từ Excel</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => router.push('/employees/contracts')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
              >
                <BriefcaseIcon size={15} />
                <span>Hợp đồng</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/employees/offboarding')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
              >
                <UserXIcon size={15} />
                <span>Offboarding</span>
              </button>
              <button
                type="button"
                onClick={handleExportFiltered}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
              >
                <DownloadIcon size={15} />
                <span>Xuất Excel</span>
              </button>
            </div>
          ) : null}
        </section>

        {/* INTEGRATED FILTER TOOLBAR & SMART BULK ACTION BAR */}
        <section className="rounded-3xl border border-gray-100 bg-white p-3.5 shadow-sm">
          {hasAnySelection && canManageEmployees ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-3.5 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
              <div className="flex flex-wrap items-center gap-2 text-xs text-primary-800">
                <span className="rounded-full bg-white px-3 py-1 font-bold shadow-xs">
                  Đã chọn {selectedEmployeeIds.length} người
                </span>
                <button type="button" onClick={toggleSelectAllFiltered} className="font-semibold text-primary-700 hover:underline">
                  {allFilteredSelected ? 'Bỏ chọn trang' : 'Chọn tất cả bộ lọc'}
                </button>
                <span>·</span>
                <button type="button" onClick={clearSelection} className="font-semibold text-gray-600 hover:underline">
                  Bỏ chọn
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => runBulkAction('lock')} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-vanilla-50">
                  <LockIcon size={13} /> Khóa
                </button>
                <button type="button" onClick={() => runBulkAction('unlock')} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-vanilla-50">
                  <UnlockIcon size={13} /> Mở khóa
                </button>
                <button type="button" onClick={() => runBulkAction('resign')} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-vanilla-50">
                  <UserXIcon size={13} /> Nghỉ việc
                </button>
                <button type="button" onClick={() => runBulkAction('restore')} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-vanilla-50">
                  <RotateCcwIcon size={13} /> Khôi phục
                </button>
                <button type="button" onClick={() => runBulkAction('set_dual_role')} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 px-3 text-xs font-semibold text-primary-700 hover:bg-primary-100">
                  <BriefcaseIcon size={13} /> Gán kiêm nhiệm
                </button>
                <button type="button" onClick={handleExportFiltered} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-primary-500 px-3 text-xs font-semibold text-white shadow-xs hover:bg-primary-600">
                  <DownloadIcon size={13} /> Xuất file đã chọn
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:flex sm:items-center sm:flex-wrap lg:grid lg:grid-cols-[minmax(180px,1fr)_150px_150px_150px_auto_auto_auto]">
              <div className="relative min-w-0">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="text"
                  placeholder="Tìm theo tên, mã, email, số điện thoại..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-10 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <select value={selectedStore} onChange={(event) => { setSelectedStore(event.target.value); setRawSelectedEmployeeIds([]); }} className="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100" disabled={!canManageEmployees}>
                <option value="">Tất cả chi nhánh</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name.replace('Homies Milk Tea - ', '')}</option>
                ))}
              </select>

              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100">
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang làm việc</option>
                <option value="probation">Thử việc</option>
                <option value="inactive">Sắp nhận việc</option>
                <option value="resigned">Đã nghỉ</option>
              </select>

              <select value={selectedAccountStatus} onChange={(event) => setSelectedAccountStatus(event.target.value)} className="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100" disabled={!canManageEmployees}>
                <option value="">Tất cả tài khoản</option>
                <option value="chua_kich_hoat">Chưa kích hoạt</option>
                <option value="dang_hoat_dong">Đang hoạt động</option>
                <option value="bi_khoa">Bị khóa</option>
              </select>

              <button type="button" onClick={resetFilters} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-vanilla-50">
                <RotateCcwIcon size={15} />
                <span>Làm mới</span>
                {activeFilterCount > 0 ? <span className="rounded-full bg-error-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterCount}</span> : null}
              </button>

              <div className="inline-flex h-10 items-center rounded-2xl border border-gray-200 bg-gray-100/80 p-1">
                <button
                  type="button"
                  onClick={() => changeViewMode('lean')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${viewMode === 'lean' ? 'bg-white text-primary-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                  title="Chế độ Gọn (Chuẩn Notion / SaaS - Nhìn 100% không cuộn ngang)"
                >
                  <LayoutGridIcon size={13} />
                  <span>Gọn</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeViewMode('detail')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${viewMode === 'detail' ? 'bg-white text-primary-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                  title="Chế độ Chi tiết 14 cột (Cho phép tùy chỉnh từng thuộc tính riêng)"
                >
                  <TablePropertiesIcon size={13} />
                  <span>14 cột</span>
                </button>
              </div>

              {viewMode === 'detail' && (
                <button type="button" onClick={() => setIsColumnModalOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-vanilla-50 animate-fade-in" title="Tùy chỉnh ẩn/hiện & thứ tự cột">
                  <SlidersIcon size={15} />
                  <span>Tùy chỉnh cột</span>
                </button>
              )}
            </div>
          )}
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <div className="min-w-[1060px]">
              <div className="grid items-center gap-2 border-b border-gray-100 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600" style={{ gridTemplateColumns: dynamicGridTemplate }}>
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
                {viewMode === 'lean' ? (
                  <>
                    <div>Mã</div>
                    <div>Nhân sự & Liên hệ</div>
                    <div>Chi nhánh & Vị trí</div>
                    <div>Ngày vào & Vai trò</div>
                    <div>Trạng thái</div>
                  </>
                ) : (
                  activeColumns.map(col => (
                    <div key={col.id}>{col.label}</div>
                  ))
                )}
                <div className="text-right pr-2">Thao tác</div>
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
                  <div key={employee.id} className="grid min-h-[64px] items-center gap-2 border-b border-gray-100 px-4 py-2.5 text-sm transition-colors hover:bg-primary-50/30" style={{ gridTemplateColumns: dynamicGridTemplate }}>
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
                    <div className="font-medium text-gray-400 text-xs">{index + 1}</div>

                    {viewMode === 'lean' ? (
                      <>
                        <div className="font-mono text-xs font-bold text-gray-700">{employee.employee_code || '-'}</div>
                        <button type="button" onClick={() => router.push(`/employees/${employee.id}`)} className="flex min-w-0 items-center gap-3 text-left group">
                          <Avatar name={fullName} size="md" />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{fullName}</span>
                            <span className="block truncate text-xs text-gray-500">{employee.phone || 'Chưa SĐT'} · {employee.email || 'Chưa email'}</span>
                          </span>
                        </button>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-800">{storeLabel}</p>
                          {employee.secondary_store_ids && employee.secondary_store_ids.length > 0 && (
                            <div className="mt-0.5 inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                              <span>Tăng ca: {employee.secondary_store_ids.map(id => getStoreById(id)?.name.replace('Homies Milk Tea - ', '').trim()).filter(Boolean).join(', ')}</span>
                            </div>
                          )}
                          <p className="truncate text-xs text-gray-500">{position?.name || employee.department_name || 'Chưa phân bổ'}</p>
                          {employee.secondary_position_ids && employee.secondary_position_ids.length > 0 && (
                            <div className="mt-0.5 inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-700">
                              <span>Kiêm: {employee.secondary_position_ids.map(id => getPositionById(id)?.name).filter(Boolean).join(', ')}</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-gray-700">{employee.hire_date}</p>
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 mt-0.5">{getRoleLabel(employee.role)}</span>
                        </div>
                        <div className="flex flex-col gap-1 items-start min-w-0">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${workStatus.className}`}>{workStatus.label}</span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${accountStatus.className}`}>{accountStatus.label}</span>
                        </div>
                      </>
                    ) : (
                      activeColumns.map(col => {
                        switch (col.id) {
                          case 'code':
                            return <div key="code" className="font-mono text-xs font-bold text-gray-700">{employee.employee_code || '-'}</div>
                          case 'name':
                            return (
                              <button key="name" type="button" onClick={() => router.push(`/employees/${employee.id}`)} className="flex min-w-0 items-center gap-2.5 text-left group">
                                <Avatar name={fullName} size="sm" />
                                <span className="truncate font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{fullName}</span>
                              </button>
                            )
                          case 'phone':
                            return <div key="phone" className="text-xs font-medium text-gray-700">{employee.phone || '-'}</div>
                          case 'email':
                            return <div key="email" className="truncate text-xs text-gray-600" title={employee.email}>{employee.email || '-'}</div>
                          case 'store':
                            return <div key="store" className="truncate text-xs font-semibold text-gray-800">{storeLabel}</div>
                          case 'position': {
                            const secNames = (employee.secondary_position_ids || [])
                              .map(id => getPositionById(id)?.name)
                              .filter(Boolean)
                            return (
                              <div key="position" className="truncate text-xs text-gray-600">
                                <div className="font-medium text-gray-800">{position?.name || 'Chưa phân bổ'}</div>
                                {secNames.length > 0 && (
                                  <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.2 text-[10px] font-extrabold text-blue-700 mt-0.5">
                                    Kiêm: {secNames.join(', ')}
                                  </span>
                                )}
                              </div>
                            )
                          }
                          case 'department':
                            return <div key="department" className="truncate text-xs text-gray-600">{employee.department_name || getDepartmentLabel(employee.position_id, employee.role)}</div>
                          case 'hire_date':
                            return <div key="hire_date" className="text-xs text-gray-600">{employee.hire_date}</div>
                          case 'role':
                            return (
                              <div key="role" className="min-w-0">
                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{getRoleLabel(employee.role)}</span>
                              </div>
                            )
                          case 'status':
                            return (
                              <div key="status" className="min-w-0">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${workStatus.className}`}>{workStatus.label}</span>
                              </div>
                            )
                          case 'account_status':
                            return (
                              <div key="account_status" className="min-w-0">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${accountStatus.className}`}>{accountStatus.label}</span>
                              </div>
                            )
                          case 'dob':
                            return <div key="dob" className="text-xs text-gray-600">{employee.date_of_birth || '-'}</div>
                          case 'cccd':
                            return <div key="cccd" className="font-mono text-xs text-gray-700">{employee.cccd || '-'}</div>
                          case 'address':
                            return <div key="address" className="truncate text-xs text-gray-600" title={employee.address}>{employee.address || '-'}</div>
                          default:
                            return null
                        }
                      })
                    )}
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap pr-1">
                      <button
                        type="button"
                        onClick={() => router.push(`/employees/${employee.id}`)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 px-2.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                        title="Mở hồ sơ"
                      >
                        <ChevronRightIcon size={14} />
                        <span>Xem</span>
                      </button>
                      {canManageEmployees ? (
                        <div ref={openActionMenuId === employee.id ? actionMenuRef : null} className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenActionMenuId(currentId => currentId === employee.id ? null : employee.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-vanilla-50"
                            title="Thao tác khác"
                          >
                            <MoreHorizontalIcon size={16} />
                          </button>
                          {openActionMenuId === employee.id ? (
                            <div className="absolute right-0 top-10 z-30 w-52 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl shadow-gray-200/80">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  router.push(`/employees/contracts?employeeId=${employee.id}`)
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
                              >
                                <BriefcaseIcon size={14} className="text-primary-600" />
                                <span>Hợp đồng lao động</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  router.push(`/employees/${employee.id}?mode=edit`)
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
                              >
                                <PencilIcon size={14} className="text-primary-600" />
                                <span>Sửa hồ sơ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  setResetPasswordTarget(employee)
                                  setCustomNewPassword(`Homies@${Math.floor(1000 + Math.random() * 9000)}`)
                                  setResetResult(null)
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
                              >
                                <LockIcon size={14} className="text-primary-600" />
                                <span>Đặt lại mật khẩu</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  router.push(`/employees/offboarding?employeeId=${employee.id}`)
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
                              >
                                <UserXIcon size={14} className="text-gray-500" />
                                <span>Trung tâm Offboarding</span>
                              </button>
                              <div className="my-1 border-t border-gray-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  handleToggleAccountStatus(employee.id)
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
                              >
                                {employee.account_status === 'bi_khoa' ? <UnlockIcon size={14} className="text-green-600" /> : <LockIcon size={14} className="text-amber-600" />}
                                <span>{employee.account_status === 'bi_khoa' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  handleToggleWorkStatus(employee.id)
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-vanilla-50"
                              >
                                <UserXIcon size={14} className="text-error-500" />
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
                      <button type="button" onClick={() => router.push(`/employees/contracts?employeeId=${employee.id}`)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-vanilla-50" title="Mở hợp đồng đang theo dõi">
                        <BriefcaseIcon size={16} />
                      </button>
                      {canManageEmployees ? (
                        <button type="button" onClick={() => router.push(`/employees/offboarding?employeeId=${employee.id}`)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-vanilla-50" title="Mở trung tâm nghỉ việc">
                          <UserXIcon size={16} />
                        </button>
                      ) : null}
                      {canManageEmployees ? (
                        <>
                          <button type="button" onClick={() => router.push(`/employees/${employee.id}?mode=edit`)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-vanilla-50" title="Sửa hồ sơ">
                            <PencilIcon size={16} />
                          </button>
                          <button type="button" onClick={() => handleToggleAccountStatus(employee.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-vanilla-50" title={employee.account_status === 'bi_khoa' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}>
                            {employee.account_status === 'bi_khoa' ? <UnlockIcon size={16} /> : <LockIcon size={16} />}
                          </button>
                          <button type="button" onClick={() => handleToggleWorkStatus(employee.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-vanilla-50" title={employee.status === 'resigned' ? 'Khôi phục làm việc' : 'Đánh dấu nghỉ việc'}>
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

        {/* MODAL ĐẶT LẠI MẬT KHẨU NHÂN SỰ */}
        {resetPasswordTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Đặt lại mật khẩu nhân sự</h3>
                  <p className="mt-1 text-xs text-gray-500">Cấp mật khẩu mới cho {resetPasswordTarget.full_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setResetPasswordTarget(null); setResetResult(null); }}
                  className="rounded-full p-2 text-gray-400 hover:bg-vanilla-100 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {!resetResult ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-100 bg-vanilla-50 p-4 space-y-1 text-xs text-gray-600">
                    <p className="font-semibold text-gray-900">{resetPasswordTarget.full_name} ({resetPasswordTarget.employee_code || 'Mã chưa cập nhật'})</p>
                    <p>Email: <span className="font-medium text-gray-800">{resetPasswordTarget.email}</span></p>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-gray-800">Mật khẩu mới</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customNewPassword}
                        onChange={e => setCustomNewPassword(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-mono font-bold text-primary-700 outline-none focus:border-primary-500"
                        placeholder="Nhập mật khẩu mới..."
                      />
                      <button
                        type="button"
                        onClick={() => setCustomNewPassword(`Homies@${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="shrink-0 rounded-2xl border border-primary-200 bg-primary-50 px-3 py-2.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                      >
                        Sinh tự động
                      </button>
                    </div>
                  </label>

                  <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setResetPasswordTarget(null)}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-vanilla-50"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPasswordSubmit}
                      className="rounded-xl bg-primary-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-600"
                    >
                      Xác nhận đặt lại
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 space-y-2 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-green-700">Đã đặt lại mật khẩu thành công!</p>
                    <div className="rounded-xl bg-white border border-green-200 p-3">
                      <p className="text-xs text-gray-500">Mật khẩu mới của {resetPasswordTarget.full_name}:</p>
                      <p className="text-lg font-mono font-bold text-gray-900 mt-1 select-all">{resetResult.password}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleCopyResetInfo}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-500 text-xs font-semibold text-white shadow-sm hover:bg-primary-600 transition-colors"
                    >
                      {copiedPassword ? '✓ Đã sao chép vào bộ nhớ tạm' : '📋 Sao chép thông tin tài khoản gửi nhân viên'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setResetPasswordTarget(null); setResetResult(null); }}
                      className="h-9 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-vanilla-50"
                    >
                      Đóng lại
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* MODAL CẤU HÌNH CỘT HIỂN THỊ */}
        {isColumnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-12 lg:pt-16 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Cấu hình cột hiển thị Bảng nhân sự</h3>
                  <p className="mt-1 text-xs text-gray-500">Tích chọn 14+ cột thông tin chi tiết hoặc dùng mũi tên để tùy chỉnh vị trí thứ tự cột</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsColumnModalOpen(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-vanilla-100 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {columns.map((col, index) => (
                  <div key={col.id} className={`flex items-center justify-between gap-2.5 rounded-2xl border p-3 transition-colors ${col.visible ? 'border-primary-100 bg-primary-50/20' : 'border-gray-100 bg-gray-50/50'}`}>
                    <label className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumnVisibility(col.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className={`text-xs font-semibold truncate ${col.visible ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                        {col.label}
                      </span>
                    </label>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveColumn(index, 'up')}
                        disabled={index === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed text-[10px]"
                        title="Di chuyển lên trước"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColumn(index, 'down')}
                        disabled={index === columns.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed text-[10px]"
                        title="Di chuyển xuống sau"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetColumnsToDefault}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-vanilla-50 transition-colors"
                >
                  Đặt lại mặc định
                </button>
                <button
                  type="button"
                  onClick={() => setIsColumnModalOpen(false)}
                  className="rounded-xl bg-primary-500 px-6 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-600 transition-colors"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>
        )}

        <EmployeeImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => refreshList()}
        />
      </div>
    </AppShell>
  )
}
