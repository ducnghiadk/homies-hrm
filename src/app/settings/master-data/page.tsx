'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { VisualOrgChart } from '@/components/settings/VisualOrgChart'
import { MasterDataAdapter, buildLegacyPositionMapping, getEmployeesUsingPosition, getPositionPresentation, linkPositionsToDepartments, type DepartmentItem, type PositionItem, type LeaveTypeItem, type WorkflowItem } from '@/lib/adapters/master-data-adapter'
import ApprovalWorkflowManager from '@/components/settings/ApprovalWorkflowManager'
import { storeAdapter, employeeAdapter } from '@/lib/adapters'
import { mockStores, type Store } from '@/lib/mock-data'
import type { AuthUser } from '@/store/auth-store'
import { Plus, Edit2, Trash2, Building2, Briefcase, Calendar, GitBranch, X, Check, Users, MapPin, UserCheck, DollarSign, List, Network, RefreshCcw, UserMinus, ArrowRight } from 'lucide-react'

export default function SettingsMasterDataPage() {
  const [viewMode, setViewMode] = useState<'list' | 'orgchart'>('list')
  const [activeTab, setActiveTab] = useState<'departments' | 'positions' | 'leaveTypes' | 'workflows'>(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab')
      if (urlTab === 'workflows' || urlTab === 'positions' || urlTab === 'leaveTypes' || urlTab === 'departments') {
        return urlTab
      }
    }
    return 'departments'
  })
  const [isLoading, setIsLoading] = useState(true)

  // Relational state
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [positions, setPositions] = useState<PositionItem[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([])
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [stores, setStores] = useState<Store[]>(mockStores)
  const [employees, setEmployees] = useState<AuthUser[]>([])
  const linkedPositions = useMemo(() => linkPositionsToDepartments(positions, departments), [positions, departments])
  const legacyPositionMappings = useMemo(() => buildLegacyPositionMapping(linkedPositions, employees), [linkedPositions, employees])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form Fields State
  const [deptCode, setDeptCode] = useState('')
  const [deptName, setDeptName] = useState('')
  const [deptStoreId, setDeptStoreId] = useState('all')
  const [deptManagerId, setDeptManagerId] = useState('')
  const [deptDesc, setDeptDesc] = useState('')

  const [posName, setPosName] = useState('')
  const [posDeptId, setPosDeptId] = useState('dept-001')
  const [posLevel, setPosLevel] = useState(1)
  const [posSalary, setPosSalary] = useState(5000000)
  const [posPayType, setPosPayType] = useState<'monthly' | 'hourly'>('hourly')

  const [leaveName, setLeaveName] = useState('')
  const [leaveCode, setLeaveCode] = useState('')
  const [leaveDays, setLeaveDays] = useState(12)
  const [leavePaid, setLeavePaid] = useState(true)
  const [leaveDoc, setLeaveDoc] = useState(false)

  const [assignmentPanelPositionId, setAssignmentPanelPositionId] = useState<string | null>(null)
  const [selectedAssignmentEmployeeIds, setSelectedAssignmentEmployeeIds] = useState<string[]>([])
  const [assignmentTargetPositionId, setAssignmentTargetPositionId] = useState('')
  const assignmentPanelPosition = useMemo(
    () => linkedPositions.find(position => position.id === assignmentPanelPositionId) || null,
    [linkedPositions, assignmentPanelPositionId]
  )
  const assignmentPanelEmployees = useMemo(
    () => assignmentPanelPositionId ? getEmployeesUsingPosition(employees, assignmentPanelPositionId) : [],
    [employees, assignmentPanelPositionId]
  )
  const assignmentTargetOptions = useMemo(
    () => linkedPositions.filter(position => position.id !== assignmentPanelPositionId && !getPositionPresentation(position).legacy),
    [linkedPositions, assignmentPanelPositionId]
  )

  // Load Data on Mount using MasterDataAdapter (Level 2 Persistence Sync)
  useEffect(() => {
    let isMounted = true

    async function loadMasterData() {
      setIsLoading(true)
      const [fetchedDepts, fetchedPositions, fetchedLeaves, fetchedWfs, fetchedStores, fetchedEmps] = await Promise.all([
        MasterDataAdapter.getDepartments(),
        MasterDataAdapter.getPositions(),
        MasterDataAdapter.getLeaveTypes(),
        MasterDataAdapter.getWorkflows(),
        storeAdapter.getStores(),
        employeeAdapter.getAllEmployees(),
      ])

      if (isMounted) {
        setDepartments(fetchedDepts)
        setPositions(fetchedPositions)
        setLeaveTypes(fetchedLeaves)
        setWorkflows(fetchedWfs)
        if (fetchedStores && fetchedStores.length > 0) setStores(fetchedStores)
        if (fetchedEmps && fetchedEmps.length > 0) setEmployees(fetchedEmps)
        setIsLoading(false)
      }
    }

    void loadMasterData()
    return () => { isMounted = false }
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const normalizePositionRef = (value?: string) => /^pos-\d+$/i.test(value || '') ? (value || '').toLowerCase() : (value || '')

  const handleOpenAssignmentPanel = (positionId: string) => {
    const position = linkedPositions.find(item => item.id === positionId)
    const canonicalTargetId = position ? getPositionPresentation(position).canonical_position_id : ''
    const targetOptions = linkedPositions.filter(item => item.id !== positionId && !getPositionPresentation(item).legacy)
    const target = targetOptions.find(item => item.id === canonicalTargetId) || targetOptions[0]

    setAssignmentPanelPositionId(positionId)
    setAssignmentTargetPositionId(target?.id || '')
    setSelectedAssignmentEmployeeIds(getEmployeesUsingPosition(employees, positionId).map(employee => employee.id))
  }

  const toggleAssignmentEmployee = (employeeId: string) => {
    setSelectedAssignmentEmployeeIds(prev =>
      prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
    )
  }

  const handleReassignPositionEmployees = async () => {
    if (!assignmentPanelPositionId || !assignmentTargetPositionId || selectedAssignmentEmployeeIds.length === 0) return
    const sourceId = normalizePositionRef(assignmentPanelPositionId)
    const targetId = assignmentTargetPositionId
    const selectedIds = new Set(selectedAssignmentEmployeeIds)
    const nextEmployees = [...employees]

    for (const employee of employees.filter(item => selectedIds.has(item.id))) {
      const primaryMatches = normalizePositionRef(employee.position_id) === sourceId
      const secondary = (employee.secondary_position_ids || []).filter(positionId => {
        const normalized = normalizePositionRef(positionId)
        return normalized !== sourceId && normalized !== normalizePositionRef(targetId)
      })

      if (!primaryMatches && normalizePositionRef(employee.position_id) !== normalizePositionRef(targetId)) {
        secondary.push(targetId)
      }

      const patch: Partial<AuthUser> = {
        position_id: primaryMatches ? targetId : employee.position_id,
        secondary_position_ids: secondary,
      }

      await employeeAdapter.updateEmployee(employee.id, patch, undefined, 'Chuẩn hóa chức danh trùng trong Master Data')
      const index = nextEmployees.findIndex(item => item.id === employee.id)
      if (index >= 0) nextEmployees[index] = { ...nextEmployees[index], ...patch }
    }

    setEmployees(nextEmployees)
    const remaining = getEmployeesUsingPosition(nextEmployees, assignmentPanelPositionId)
    setSelectedAssignmentEmployeeIds(remaining.map(employee => employee.id))
    showToast(`Đã chuyển ${selectedIds.size} nhân sự sang chức danh chuẩn.`)
    if (remaining.length === 0) setAssignmentPanelPositionId(null)
  }

  const handleRemoveSecondaryPositionFromEmployees = async () => {
    if (!assignmentPanelPositionId || selectedAssignmentEmployeeIds.length === 0) return
    const sourceId = normalizePositionRef(assignmentPanelPositionId)
    const selectedIds = new Set(selectedAssignmentEmployeeIds)
    const nextEmployees = [...employees]
    let changedCount = 0

    for (const employee of employees.filter(item => selectedIds.has(item.id))) {
      if (normalizePositionRef(employee.position_id) === sourceId) continue
      const secondary = (employee.secondary_position_ids || []).filter(positionId => normalizePositionRef(positionId) !== sourceId)
      if (secondary.length === (employee.secondary_position_ids || []).length) continue

      const patch: Partial<AuthUser> = { secondary_position_ids: secondary }
      await employeeAdapter.updateEmployee(employee.id, patch, undefined, 'Gỡ chức danh phụ trùng trong Master Data')
      const index = nextEmployees.findIndex(item => item.id === employee.id)
      if (index >= 0) nextEmployees[index] = { ...nextEmployees[index], ...patch }
      changedCount += 1
    }

    setEmployees(nextEmployees)
    const remaining = getEmployeesUsingPosition(nextEmployees, assignmentPanelPositionId)
    setSelectedAssignmentEmployeeIds(remaining.map(employee => employee.id))
    showToast(changedCount > 0 ? `Đã gỡ chức danh phụ khỏi ${changedCount} nhân sự.` : 'Các nhân sự đã chọn đang dùng chức danh này làm mặc định, cần chuyển sang chức danh khác.')
    if (remaining.length === 0) setAssignmentPanelPositionId(null)
  }

  // Open Modal Helpers
  const handleOpenAddModal = () => {
    setEditingId(null)
    if (activeTab === 'departments') {
      setDeptCode(`DEPT-00${departments.length + 1}`)
      setDeptName('')
      setDeptStoreId('all')
      setDeptManagerId(employees[0]?.id || '')
      setDeptDesc('')
    } else if (activeTab === 'positions') {
      setPosName('')
      setPosDeptId(departments[0]?.id || 'dept-002')
      setPosLevel(1)
      setPosSalary(5000000)
      setPosPayType('hourly')
    } else if (activeTab === 'leaveTypes') {
      setLeaveName('')
      setLeaveCode('')
      setLeaveDays(12)
      setLeavePaid(true)
      setLeaveDoc(false)
    }
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (id: string) => {
    setEditingId(id)
    if (activeTab === 'departments') {
      const item = departments.find(d => d.id === id)
      if (item) {
        setDeptCode(item.code)
        setDeptName(item.name)
        setDeptStoreId(item.store_id)
        setDeptManagerId(item.manager_id || '')
        setDeptDesc(item.description || '')
      }
    } else if (activeTab === 'positions') {
      const item = linkedPositions.find(p => p.id === id) || positions.find(p => p.id === id)
      if (item) {
        setPosName(item.name)
        setPosDeptId(item.department_id || departments[0]?.id || 'dept-002')
        setPosLevel(item.level)
        setPosSalary(item.base_salary)
        setPosPayType(item.pay_type)
      }
    } else if (activeTab === 'leaveTypes') {
      const item = leaveTypes.find(l => l.id === id)
      if (item) {
        setLeaveName(item.name)
        setLeaveCode(item.code)
        setLeaveDays(item.default_days)
        setLeavePaid(item.is_paid)
        setLeaveDoc(item.require_doc)
      }
    }
    setIsModalOpen(true)
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${name}" không?`)) return

    if (activeTab === 'departments') {
      const updated = departments.filter(d => d.id !== id)
      setDepartments(updated)
      await MasterDataAdapter.saveDepartments(updated)
    } else if (activeTab === 'positions') {
      try {
        const localUsers = getEmployeesUsingPosition(employees, id)
        if (localUsers.length > 0) {
          showToast(`Không thể xóa "${name}": còn ${localUsers.length} nhân viên đang sử dụng chức danh này.`)
          handleOpenAssignmentPanel(id)
          return
        }

        const result = await MasterDataAdapter.deletePosition(id)
        if (!result.deleted) {
          showToast(`Không thể xóa "${name}": còn ${result.employee_count} nhân viên đang sử dụng chức danh này.`)
          handleOpenAssignmentPanel(id)
          return
        }

        const updated = positions.filter(p => p.id !== id)
        setPositions(updated)
        await MasterDataAdapter.savePositions(updated)
      } catch (error) {
        showToast(error instanceof Error ? error.message : `Không thể xóa "${name}" trên Supabase.`)
        return
      }
    } else if (activeTab === 'leaveTypes') {
      const updated = leaveTypes.filter(l => l.id !== id)
      setLeaveTypes(updated)
      await MasterDataAdapter.saveLeaveTypes(updated)
    } else {
      const updated = workflows.filter(w => w.id !== id)
      setWorkflows(updated)
      await MasterDataAdapter.saveWorkflows(updated)
    }
    showToast(`Đã xóa "${name}" thành công (Đã đồng bộ cơ sở dữ liệu)`)
  }

  const handleSaveModal = async () => {
    if (activeTab === 'departments') {
      if (!deptName.trim()) return
      let updatedDepts: DepartmentItem[] = []
      if (editingId) {
        updatedDepts = departments.map(d => d.id === editingId ? {
          ...d,
          code: deptCode.trim(),
          name: deptName.trim(),
          store_id: deptStoreId,
          manager_id: deptManagerId,
          description: deptDesc.trim(),
        } : d)
        showToast(`Đã cập nhật phòng ban "${deptName.trim()}" (Đã lưu cơ sở dữ liệu)`)
      } else {
        const newDept: DepartmentItem = {
          id: `dept-${Date.now()}`,
          code: deptCode.trim() || `DEPT-00${departments.length + 1}`,
          name: deptName.trim(),
          store_id: deptStoreId,
          manager_id: deptManagerId,
          head_count: 0,
          description: deptDesc.trim() || 'Phòng ban mới tạo',
        }
        updatedDepts = [newDept, ...departments]
        showToast(`Đã tạo phòng ban "${deptName.trim()}" (Đã lưu cơ sở dữ liệu)`)
      }
      setDepartments(updatedDepts)
      await MasterDataAdapter.saveDepartments(updatedDepts)
    } else if (activeTab === 'positions') {
      if (!posName.trim()) return
      let updatedPositions: PositionItem[] = []
      if (editingId) {
        updatedPositions = positions.map(p => (p.id === editingId || linkedPositions.find(lp => lp.id === editingId)?.name === p.name) ? {
          ...p,
          name: posName.trim(),
          department_id: posDeptId,
          level: posLevel,
          base_salary: posSalary,
          pay_type: posPayType,
        } : p)
        showToast(`Đã cập nhật vị trí "${posName.trim()}" (Đã lưu cơ sở dữ liệu)`)
      } else {
        const newPos: PositionItem = {
          id: `pos-${Date.now()}`,
          name: posName.trim(),
          department_id: posDeptId,
          level: posLevel,
          base_salary: posSalary,
          pay_type: posPayType,
        }
        updatedPositions = [newPos, ...positions]
        showToast(`Đã thêm vị trí "${posName.trim()}" (Đã lưu cơ sở dữ liệu)`)
      }
      setPositions(updatedPositions)
      await MasterDataAdapter.savePositions(updatedPositions)
    } else if (activeTab === 'leaveTypes') {
      if (!leaveName.trim()) return
      let updatedLeaves: LeaveTypeItem[] = []
      if (editingId) {
        updatedLeaves = leaveTypes.map(l => l.id === editingId ? {
          ...l,
          name: leaveName.trim(),
          code: leaveCode.trim() || l.code,
          default_days: leaveDays,
          is_paid: leavePaid,
          require_doc: leaveDoc,
        } : l)
        showToast(`Đã cập nhật loại nghỉ phép "${leaveName.trim()}"`)
      } else {
        const newLeave: LeaveTypeItem = {
          id: `lt-${Date.now()}`,
          name: leaveName.trim(),
          code: leaveCode.trim() || 'leave_custom',
          default_days: leaveDays,
          is_paid: leavePaid,
          require_doc: leaveDoc,
        }
        updatedLeaves = [newLeave, ...leaveTypes]
        showToast(`Đã thêm loại nghỉ phép "${leaveName.trim()}"`)
      }
      setLeaveTypes(updatedLeaves)
      await MasterDataAdapter.saveLeaveTypes(updatedLeaves)
    }
    setIsModalOpen(false)
  }

  const tabsConfig = [
    { key: 'departments' as const, icon: <Building2 size={15} />, label: 'Phòng ban & Khối', count: departments.length },
    { key: 'positions' as const, icon: <Briefcase size={15} />, label: 'Danh mục chức danh & Lộ trình năng lực', count: positions.length },
    { key: 'leaveTypes' as const, icon: <Calendar size={15} />, label: 'Loại nghỉ phép', count: leaveTypes.length },
    { key: 'workflows' as const, icon: <GitBranch size={15} />, label: 'Quy trình phê duyệt', count: workflows.length },
  ]

  return (
    <AppShell title="Cấu hình Danh mục Nhân sự" backHref="/settings">
      <div className="space-y-5 animate-fade-in pb-16">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 rounded-2xl bg-dark-700 px-4 py-3 text-xs font-bold text-white shadow-xl animate-fade-in flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            {toastMessage}
          </div>
        )}

        {/* Header Intro Banner */}
        <div className="rounded-3xl border border-primary-100 bg-gradient-to-r from-primary-50 to-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600">Cơ cấu tổ chức liên kết</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                  <Check size={10} /> Sync Database Active
                </span>
              </div>
              <h1 className="mt-1 text-xl font-bold text-dark-700">Danh mục Quản trị Nhân sự</h1>
              <p className="mt-1 text-xs text-gray-500 max-w-2xl">
                Đây là danh mục phòng ban và chức danh của Homies. HR tạo chức danh tại đây; hồ sơ nhân sự chỉ chọn các chức danh người đó có thể đảm nhiệm.
              </p>
            </div>

            {/* MODE SWITCHER BUTTONS */}
            <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-vanilla-50'
                }`}
              >
                <List size={14} /> Danh mục
              </button>
              <button
                onClick={() => setViewMode('orgchart')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  viewMode === 'orgchart'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-vanilla-50'
                }`}
              >
                <Network size={14} /> Sơ đồ Cây
              </button>
            </div>
          </div>
        </div>

        {/* VIEW MODE 1: VISUAL ORG CHART TREE */}
        {viewMode === 'orgchart' ? (
          <VisualOrgChart />
        ) : (
          <>
            {/* VIEW MODE 2: TABULAR LIST VIEW */}
            {/* Tab Selection */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {tabsConfig.map(tab => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                        : 'bg-white text-dark-700 border border-gray-100 hover:bg-primary-50 hover:text-primary-600'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-primary-50 text-gray-600'}`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-400 animate-pulse flex flex-col items-center gap-2">
                <RefreshCcw size={20} className="animate-spin text-primary-500" />
                <span>Đang đồng bộ dữ liệu từ Database...</span>
              </div>
            ) : (
              <>
                {/* ─── TAB 1: PHÒNG BAN & KHỐI ─── */}
                {activeTab === 'departments' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-dark-700">Danh sách Phòng ban & Khối Vận hành</h2>
                        <p className="text-xs text-gray-400">Liên kết tới chi nhánh, người phụ trách và danh mục chức danh</p>
                      </div>
                      <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary-600/20 hover:bg-primary-700 transition-all cursor-pointer"
                      >
                        <Plus size={16} />
                        Tạo phòng ban mới
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                      {departments.map(dept => {
                        const store = stores.find(s => s.id === dept.store_id)
                        const manager = employees.find(e => e.id === dept.manager_id)
                        const deptPositions = linkedPositions.filter(p => p.department_id === dept.id)
                        const deptPositionIds = new Set(deptPositions.map(position => position.id))
                        const deptEmployeeCount = employees.filter(employee => deptPositionIds.has(employee.position_id) || (employee.secondary_position_ids || []).some(positionId => deptPositionIds.has(positionId))).length

                        return (
                          <div key={dept.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 font-bold">
                                  <Building2 size={20} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-primary-50 text-gray-600">{dept.code}</span>
                                    <h3 className="text-base font-bold text-dark-700">{dept.name}</h3>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{dept.description}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button onClick={() => handleOpenEditModal(dept.id)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-vanilla-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="Chỉnh sửa">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteItem(dept.id, dept.name)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-error-50 text-error-600 hover:bg-error-100 transition-colors" title="Xóa">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-gray-50 py-3">
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <MapPin size={14} className="text-primary-500" />
                                <span className="truncate">{store ? store.name.replace('Homies Milk Tea - ', '') : 'Toàn hệ thống'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <UserCheck size={14} className="text-emerald-500" />
                                <span className="truncate">{manager ? manager.full_name : 'Chưa chỉ định'}</span>
                              </div>
                            </div>

                            {/* Danh sách vị trí trực thuộc */}
                            {deptPositions.length > 0 && (
                              <div className="space-y-1.5 border-b border-gray-50 pb-3">
                                <span className="text-[10px] font-extrabold uppercase text-gray-400">Vị trí có thể đảm nhiệm ({deptPositions.length})</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {deptPositions.map(pos => (
                                    <span key={pos.id} className="inline-flex items-center gap-1 rounded-lg bg-primary-50/70 border border-primary-100/60 px-2.5 py-1 text-[11px] font-semibold text-primary-800">
                                      <Briefcase size={11} className="text-primary-500" />
                                      {pos.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-500 flex items-center gap-1">
                                  <Users size={14} className="text-gray-400" /> {deptEmployeeCount} nhân sự
                                </span>
                                <span className="font-semibold text-gray-500 flex items-center gap-1">
                                  <Briefcase size={14} className="text-gray-400" /> {deptPositions.length} vị trí có thể đảm nhiệm
                                </span>
                              </div>
                              <Link href={`/employees?storeId=${dept.store_id}`} className="font-bold text-primary-600 hover:underline">
                                Xem nhân sự →
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: VỊ TRÍ & LỘ TRÌNH NĂNG LỰC ─── */}
                {activeTab === 'positions' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-dark-700">Danh mục chức danh & Lộ trình năng lực Homies</h2>
                        <p className="text-xs text-gray-400">Gắn chức danh với khung lương; lộ trình C1-PC, C1-TN, C2, C3, C4, C5 được quản lý tại KPI &amp; Phát triển.</p>
                        <p className="mt-1 text-xs font-medium text-primary-700">
                          C1-C5 năng lực được quản lý tại KPI &amp; Phát triển, không tạo thành chức danh Pha chế/Thu ngân riêng.
                        </p>
                        <p className="mt-1 text-xs font-medium text-amber-700">Đang tạm khóa để bảo vệ mã chức vụ. Liên hệ quản trị nếu cần thay đổi.</p>
                      </div>
                      <button disabled onClick={handleOpenAddModal} className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary-600/20 hover:bg-primary-700 transition-all cursor-pointer">
                        <Plus size={16} /> Tạo chức danh mới
                      </button>
                    </div>

                    {legacyPositionMappings.length > 0 && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <p className="font-bold">Phát hiện {legacyPositionMappings.length} chức danh dữ liệu cũ cần xem trước chuẩn hóa.</p>
                        <p className="mt-1 text-xs">Không có dữ liệu nào bị xóa hoặc tự đổi. Hãy đối chiếu nguồn, chức danh đích và số nhân sự trước khi xác nhận.</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                          {legacyPositionMappings.map(mapping => <span key={mapping.source_position_id} className="rounded-full border border-amber-300 bg-white px-3 py-1">{mapping.source_name} → {mapping.target_name} ({mapping.employee_count})</span>)}
                        </div>
                      </div>
                    )}

                    {assignmentPanelPosition && (
                      <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-sm font-bold text-dark-700">Nhân sự đang dùng chức danh “{assignmentPanelPosition.name}”</p>
                            <p className="mt-1 text-xs font-medium text-gray-500">
                              Chỉ chuyển hoặc gỡ liên kết chức danh, không xóa hồ sơ nhân viên. Chức danh mặc định cần được chuyển sang chức danh khác trước khi xóa.
                            </p>
                          </div>
                          <button onClick={() => setAssignmentPanelPositionId(null)} className="self-start rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50">
                            Đóng
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
                          <div className="rounded-2xl border border-gray-100">
                            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                              <span className="text-xs font-bold text-gray-600">{assignmentPanelEmployees.length} nhân sự đang liên kết</span>
                              <button
                                onClick={() => setSelectedAssignmentEmployeeIds(
                                  selectedAssignmentEmployeeIds.length === assignmentPanelEmployees.length ? [] : assignmentPanelEmployees.map(employee => employee.id)
                                )}
                                className="text-xs font-bold text-primary-600 hover:underline"
                              >
                                {selectedAssignmentEmployeeIds.length === assignmentPanelEmployees.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                              </button>
                            </div>
                            <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
                              {assignmentPanelEmployees.map(employee => {
                                const isPrimary = normalizePositionRef(employee.position_id) === normalizePositionRef(assignmentPanelPosition.id)
                                return (
                                  <label key={employee.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-primary-50/40">
                                    <input
                                      type="checkbox"
                                      checked={selectedAssignmentEmployeeIds.includes(employee.id)}
                                      onChange={() => toggleAssignmentEmployee(employee.id)}
                                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-sm font-bold text-dark-700">{employee.full_name}</span>
                                      <span className="block text-xs font-medium text-gray-500">{employee.employee_code || employee.email}</span>
                                    </span>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isPrimary ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                      {isPrimary ? 'Chức danh mặc định' : 'Có thể đảm nhiệm'}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>

                          <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-600">Chuyển sang chức danh chuẩn</label>
                              <select
                                value={assignmentTargetPositionId}
                                onChange={event => setAssignmentTargetPositionId(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-primary-600"
                              >
                                {assignmentTargetOptions.map(position => <option key={position.id} value={position.id}>{position.name}</option>)}
                              </select>
                            </div>
                            <button
                              onClick={handleReassignPositionEmployees}
                              disabled={!assignmentTargetPositionId || selectedAssignmentEmployeeIds.length === 0}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                              <ArrowRight size={14} /> Chuyển nhân sự đã chọn
                            </button>
                            <button
                              onClick={handleRemoveSecondaryPositionFromEmployees}
                              disabled={selectedAssignmentEmployeeIds.length === 0}
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                            >
                              <UserMinus size={14} /> Gỡ khỏi vị trí có thể đảm nhiệm
                            </button>
                            <p className="text-[11px] font-medium leading-relaxed text-gray-500">
                              Sau khi danh sách còn 0 nhân sự, anh có thể bấm xóa chức danh trùng.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(['store_operations', 'management'] as const).map(group => (
                    <div key={group} className="space-y-3">
                      <h3 className="px-1 text-sm font-extrabold text-dark-700">{group === 'store_operations' ? 'Vận hành cửa hàng' : 'Khối quản lý'}</h3>
                      {linkedPositions.filter(pos => getPositionPresentation(pos).group === group).map(pos => {
                        const dept = departments.find(d => d.id === pos.department_id)
                        const presentation = getPositionPresentation(pos)
                        const positionEmployees = getEmployeesUsingPosition(employees, pos.id)

                        return (
                          <div key={pos.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-gray-100 bg-white p-4.5 shadow-sm hover:border-primary-200 hover:shadow-md transition-all gap-4">
                            <div className="flex items-center gap-3.5">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 font-black text-[10px] text-primary-700 shadow-sm">
                                {presentation.badge === 'Khối quản lý' ? 'QL' : 'C'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base font-bold text-dark-700">{pos.name}</h3>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-0.5 text-xs font-bold text-primary-700">
                                    <Building2 size={12} />
                                    {dept ? dept.name : 'Chưa phân phòng'}
                                  </span>
                                  <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-bold ${presentation.legacy ? 'bg-amber-100 text-amber-800' : presentation.badge === 'Khối quản lý' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'}`}>{presentation.legacy ? 'Dữ liệu cũ - xem preview' : presentation.badge}</span>
                                  {!presentation.legacy && presentation.career_path.length > 0 && <span className="text-xs font-bold text-emerald-700">{presentation.career_path.map(code => code.toUpperCase().replace('_', '-')).join(' → ')}</span>}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                  <DollarSign size={13} className="text-emerald-600 stroke-[2.5]" />
                                  Lương cơ sở: <span className="font-bold text-dark-700">{pos.base_salary.toLocaleString('vi-VN')}₫</span>
                                  <span className="text-gray-400">({pos.pay_type === 'monthly' ? 'Lương tháng' : 'Lương giờ'})</span>
                                  <span className="text-gray-300">•</span>
                                  <Users size={13} className="text-primary-500 stroke-[2.5]" />
                                  <button onClick={() => handleOpenAssignmentPanel(pos.id)} className="font-bold text-primary-700 hover:underline">
                                    {positionEmployees.length} nhân sự đang gắn
                                  </button>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
                              <span className="text-xs font-semibold text-gray-400">
                                {presentation.badge === 'Khối quản lý' ? '🔑 Quyền quản lý' : pos.name === 'Trưởng ca' ? '🔑 Quyền trưởng ca' : '👤 Nhân viên vận hành'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {positionEmployees.length > 0 && (
                                  <button onClick={() => handleOpenAssignmentPanel(pos.id)} className="flex h-9 items-center gap-1.5 rounded-xl bg-primary-50 px-3 text-xs font-bold text-primary-700 hover:bg-primary-100 transition-colors" title="Xử lý nhân sự đang dùng chức danh">
                                    <Users size={14} /> Xử lý nhân sự
                                  </button>
                                )}
                                <button disabled onClick={() => handleOpenEditModal(pos.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-vanilla-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="Chỉnh sửa">
                                  <Edit2 size={15} />
                                </button>
                                <button disabled onClick={() => handleDeleteItem(pos.id, pos.name)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-error-50 text-error-600 hover:bg-error-100 transition-colors" title="Xóa">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    ))}
                  </div>
                )}

                {/* ─── TAB 3: LOẠI NGHỈ PHÉP ─── */}
                {activeTab === 'leaveTypes' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-dark-700">Danh mục Loại nghỉ phép & Hạn mức</h2>
                        <p className="text-xs text-gray-400">Tự động trừ vào quỹ phép năm và phiếu lương</p>
                      </div>
                      <button onClick={handleOpenAddModal} className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary-600/20 hover:bg-primary-700 transition-all cursor-pointer">
                        <Plus size={16} /> Thêm loại phép
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {leaveTypes.map(leave => (
                        <div key={leave.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-primary-600">{leave.code}</span>
                              <h3 className="text-sm font-bold text-dark-700">{leave.name}</h3>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleOpenEditModal(leave.id)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-vanilla-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteItem(leave.id, leave.name)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-error-50 text-error-600 hover:bg-error-100 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-2.5">
                            <span className="font-bold text-dark-700">{leave.default_days} ngày / năm</span>
                            <div className="flex gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${leave.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-primary-50 text-gray-600'}`}>
                                {leave.is_paid ? 'Hưởng 100% lương' : 'Không lương'}
                              </span>
                              {leave.require_doc && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                                  Cần minh chứng
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── TAB 4: QUY TRÌNH PHÊ DUYỆT ─── */}
                {activeTab === 'workflows' && (
                  <div className="space-y-4 animate-slide-up">
                    <ApprovalWorkflowManager
                      workflows={workflows}
                      positions={positions}
                      employees={employees}
                      onWorkflowsChange={setWorkflows}
                      showToast={showToast}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ─── ENHANCED MODAL FORM ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-primary-600">Cấu hình liên kết</span>
                <h3 className="text-base font-bold text-dark-700">
                  {editingId ? `Chỉnh sửa ${activeTab === 'departments' ? 'Phòng ban' : activeTab === 'positions' ? 'Vị trí' : activeTab === 'leaveTypes' ? 'Loại nghỉ phép' : 'Quy trình'}` : `Tạo mới ${activeTab === 'departments' ? 'Phòng ban' : activeTab === 'positions' ? 'Vị trí' : activeTab === 'leaveTypes' ? 'Loại nghỉ phép' : 'Quy trình'}`}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-gray-500 hover:bg-gray-200">
                <X size={16} />
              </button>
            </div>

            {/* FORM FOR DEPARTMENTS */}
            {activeTab === 'departments' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mã phòng ban *</label>
                    <input type="text" value={deptCode} onChange={e => setDeptCode(e.target.value)} placeholder="DEPT-001" className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tên phòng ban *</label>
                    <input type="text" value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="VD: Pha chế & Barista" className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary-600" autoFocus />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Thuộc chi nhánh</label>
                    <select value={deptStoreId} onChange={e => setDeptStoreId(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary-600">
                      <option value="all">🌐 Toàn hệ thống</option>
                      {stores.map(s => <option key={s.id} value={s.id}>📍 {s.name.replace('Homies Milk Tea - ', '')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Trưởng bộ phận</label>
                    <select value={deptManagerId} onChange={e => setDeptManagerId(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary-600">
                      <option value="">-- Chọn nhân sự --</option>
                      {employees.map(e => <option key={e.id} value={e.id}>👤 {e.full_name} ({e.role})</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mô tả nhiệm vụ & Chức năng</label>
                  <textarea value={deptDesc} onChange={e => setDeptDesc(e.target.value)} placeholder="Mô tả công việc chính của bộ phận..." rows={2} className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary-600" />
                </div>
              </div>
            )}

            {/* FORM FOR POSITIONS */}
            {activeTab === 'positions' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tên vị trí chức danh *</label>
                  <input type="text" value={posName} onChange={e => setPosName(e.target.value)} placeholder="VD: Nhân viên cửa hàng" className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary-600" autoFocus />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Trực thuộc phòng ban</label>
                    <select value={posDeptId} onChange={e => setPosDeptId(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary-600">
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Cấp trách nhiệm của chức danh</label>
                    <select value={posLevel} onChange={e => setPosLevel(Number(e.target.value))} className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary-600">
                      <option value={1}>Level 1 (Nhân viên vận hành)</option>
                      <option value={2}>Level 2 (Chuyên viên / Trưởng ca)</option>
                      <option value={3}>Level 3 (Quản lý cửa hàng)</option>
                      <option value={4}>Level 4 (Giám đốc / CEO)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Lương cơ sở (VND)</label>
                    <input type="number" value={posSalary} onChange={e => setPosSalary(Number(e.target.value))} className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Hình thức trả lương</label>
                    <select value={posPayType} onChange={e => setPosPayType(e.target.value as 'monthly' | 'hourly')} className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary-600">
                      <option value="hourly">Lương theo giờ (Hourly)</option>
                      <option value="monthly">Lương cố định (Monthly)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* FORM FOR LEAVE TYPES */}
            {activeTab === 'leaveTypes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tên loại nghỉ phép *</label>
                    <input type="text" value={leaveName} onChange={e => setLeaveName(e.target.value)} placeholder="VD: Phép cưới hỏi" className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary-600" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mã loại phép</label>
                    <input type="text" value={leaveCode} onChange={e => setLeaveCode(e.target.value)} placeholder="wedding" className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Hạn mức định mức (Ngày / Năm)</label>
                  <input type="number" value={leaveDays} onChange={e => setLeaveDays(Number(e.target.value))} className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary-600" />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={leavePaid} onChange={e => setLeavePaid(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                    Tính 100% lương
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={leaveDoc} onChange={e => setLeaveDoc(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                    Bắt buộc nộp minh chứng
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 text-xs font-bold text-gray-600 hover:bg-vanilla-50">
                Hủy bỏ
              </button>
              <button type="button" onClick={handleSaveModal} className="flex-1 rounded-2xl bg-primary-600 py-3 text-xs font-bold text-white hover:bg-primary-700 shadow-md shadow-primary-600/20">
                {editingId ? 'Lưu thay đổi' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
