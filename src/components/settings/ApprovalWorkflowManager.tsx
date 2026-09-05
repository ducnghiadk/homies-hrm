'use client'

import React, { useState, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  RotateCcw,
  X,
  Check,
  MoveVertical,
  PlusCircle,
  Filter,
} from 'lucide-react'
import {
  MasterDataAdapter,
  type WorkflowItem,
  type WorkflowStep,
  type PositionItem,
} from '@/lib/adapters/master-data-adapter'
import type { AuthUser } from '@/store/auth-store'

interface ApprovalWorkflowManagerProps {
  workflows: WorkflowItem[]
  positions: PositionItem[]
  employees: AuthUser[]
  onWorkflowsChange: (updated: WorkflowItem[]) => void
  showToast: (msg: string) => void
}

const DEFAULT_REQUEST_TYPES = [
  'Xin nghỉ ngày',
  'Duyệt chấm công',
  'Đổi thiết bị chấm công',
  'Cập nhật hồ sơ',
  'Xin ra ngoài trong ca',
  'Xoay ca',
  'Ủy quyền cấu hình WiFi',
  'Xin nghỉ ca',
  'Nhờ làm thay',
  'Đổi ca',
  'Thay đổi lương, loại nhân viên',
  'Thay đổi chức vụ',
  'Ứng lương',
  'Xin đi muộn',
  'Xin về sớm',
]

const DEFAULT_APPROVER_ROLES = [
  'Quản lý bộ phận',
  'Quản lý điểm bán hàng',
  'Quản lý nhân sự - Ngưng hoạt động',
  'Quản lý nhân sự',
  'Chủ thương hiệu',
  'Quản lý vùng',
  'Trưởng ca',
  'Nhân viên nhận ca làm thay',
  'Nhân viên cùng đổi ca',
  'Kế toán / HR Admin',
]

export default function ApprovalWorkflowManager({
  workflows,
  positions,
  employees,
  onWorkflowsChange,
  showToast,
}: ApprovalWorkflowManagerProps) {
  // Filter state
  const [filterType, setFilterType] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WorkflowItem | null>(null)

  // Modal Form Fields
  const [requestType, setRequestType] = useState('Xin nghỉ ngày')
  const [submitterRole, setSubmitterRole] = useState('Tất cả chức vụ')
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [notifyRoles, setNotifyRoles] = useState<string[]>([])
  const [excludeEmployeeIds, setExcludeEmployeeIds] = useState<string[]>([])
  const [requireAdvanceNotice, setRequireAdvanceNotice] = useState(false)
  const [requirePhotoAttachment, setRequirePhotoAttachment] = useState(false)

  // Step Role Editor Sub-modal
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
  const [tempStepRoles, setTempStepRoles] = useState<string[]>([])

  // Notify Role Selector Sub-modal
  const [isNotifyPickerOpen, setIsNotifyPickerOpen] = useState(false)

  // Available request types for dropdown
  const allRequestTypes = useMemo(() => {
    const set = new Set([...DEFAULT_REQUEST_TYPES, ...workflows.map(w => w.request_type)])
    return Array.from(set)
  }, [workflows])

  // Available positions for roles
  const allPositionNames = useMemo(() => {
    const set = new Set([
      ...DEFAULT_APPROVER_ROLES,
      ...positions.map(p => p.name),
    ])
    return Array.from(set)
  }, [positions])

  // Filtered workflows list
  const filteredWorkflows = useMemo(() => {
    if (activeFilter === 'all') return workflows
    return workflows.filter(w => w.request_type === activeFilter)
  }, [workflows, activeFilter])

  // Handlers
  const handleApplyFilter = () => {
    setActiveFilter(filterType)
  }

  const handleResetFilter = () => {
    setFilterType('all')
    setActiveFilter('all')
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setRequestType('Xin nghỉ ngày')
    setSubmitterRole('Tất cả chức vụ')
    setSteps([
      {
        level: 1,
        approver_roles: ['Quản lý bộ phận', 'Quản lý điểm bán hàng', 'Chủ thương hiệu'],
      },
    ])
    setNotifyRoles([])
    setExcludeEmployeeIds([])
    setRequireAdvanceNotice(false)
    setRequirePhotoAttachment(false)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: WorkflowItem) => {
    setEditingItem(item)
    setRequestType(item.request_type)
    setSubmitterRole(item.submitter_role || 'Tất cả chức vụ')
    setSteps(
      item.steps && item.steps.length > 0
        ? JSON.parse(JSON.stringify(item.steps))
        : [
            {
              level: 1,
              approver_roles: ['Quản lý điểm bán hàng', 'Chủ thương hiệu'],
            },
          ]
    )
    setNotifyRoles(item.notify_roles || [])
    setExcludeEmployeeIds(item.exclude_employee_ids || [])
    setRequireAdvanceNotice(!!item.require_advance_notice)
    setRequirePhotoAttachment(!!item.require_photo_attachment)
    setIsModalOpen(true)
  }

  const handleDuplicate = async (item: WorkflowItem) => {
    const duplicated: WorkflowItem = {
      ...item,
      id: `wf-${Date.now()}`,
      request_type: `${item.request_type} (Bản sao)`,
      name: `${item.request_type} (Bản sao)`,
    }
    const updated = [...workflows, duplicated]
    onWorkflowsChange(updated)
    await MasterDataAdapter.saveWorkflows(updated)
    showToast(`Đã nhân bản quy trình "${item.request_type}" thành công!`)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa quy trình "${name}" không?`)) return
    const updated = workflows.filter(w => w.id !== id)
    onWorkflowsChange(updated)
    await MasterDataAdapter.saveWorkflows(updated)
    showToast(`Đã xóa quy trình "${name}" thành công!`)
  }

  // Step Management inside Modal
  const handleAddStep = () => {
    const newLevel = steps.length + 1
    setSteps([
      ...steps,
      {
        level: newLevel,
        approver_roles: ['Quản lý nhân sự', 'Chủ thương hiệu'],
      },
    ])
  }

  const handleDeleteStep = (index: number) => {
    if (steps.length <= 1) {
      alert('Quy trình phê duyệt phải có ít nhất 1 cấp duyệt!')
      return
    }
    const nextSteps = steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({
        ...step,
        level: i + 1,
      }))
    setSteps(nextSteps)
  }

  const handleOpenEditStepRoles = (index: number) => {
    setEditingStepIndex(index)
    setTempStepRoles([...steps[index].approver_roles])
  }

  const handleSaveStepRoles = () => {
    if (editingStepIndex === null) return
    if (tempStepRoles.length === 0) {
      alert('Vui lòng chọn ít nhất 1 chức vụ phê duyệt cho cấp này!')
      return
    }
    const nextSteps = [...steps]
    nextSteps[editingStepIndex] = {
      ...nextSteps[editingStepIndex],
      approver_roles: [...tempStepRoles],
    }
    setSteps(nextSteps)
    setEditingStepIndex(null)
  }

  const toggleTempStepRole = (role: string) => {
    if (tempStepRoles.includes(role)) {
      setTempStepRoles(tempStepRoles.filter(r => r !== role))
    } else {
      setTempStepRoles([...tempStepRoles, role])
    }
  }

  const toggleNotifyRole = (role: string) => {
    if (notifyRoles.includes(role)) {
      setNotifyRoles(notifyRoles.filter(r => r !== role))
    } else {
      setNotifyRoles([...notifyRoles, role])
    }
  }

  const toggleExcludeEmployee = (empId: string) => {
    if (excludeEmployeeIds.includes(empId)) {
      setExcludeEmployeeIds(excludeEmployeeIds.filter(id => id !== empId))
    } else {
      setExcludeEmployeeIds([...excludeEmployeeIds, empId])
    }
  }

  // Save Modal Form
  const handleSaveWorkflow = async () => {
    if (!requestType.trim()) {
      alert('Vui lòng chọn hoặc nhập loại yêu cầu!')
      return
    }
    if (steps.length === 0) {
      alert('Vui lòng thêm ít nhất 1 cấp phê duyệt!')
      return
    }

    const payload: WorkflowItem = {
      id: editingItem ? editingItem.id : `wf-${Date.now()}`,
      request_type: requestType.trim(),
      name: requestType.trim(),
      submitter_role: submitterRole,
      levels_count: steps.length,
      steps: steps.map((s, idx) => ({ ...s, level: idx + 1 })),
      notify_roles: notifyRoles,
      exclude_employee_ids: excludeEmployeeIds,
      require_advance_notice: requireAdvanceNotice,
      require_photo_attachment: requirePhotoAttachment,
    }

    let updated: WorkflowItem[] = []
    if (editingItem) {
      updated = workflows.map(w => (w.id === editingItem.id ? payload : w))
      showToast(`Đã cập nhật quy trình "${payload.request_type}" thành công!`)
    } else {
      updated = [...workflows, payload]
      showToast(`Đã thêm quy trình "${payload.request_type}" thành công!`)
    }

    onWorkflowsChange(updated)
    await MasterDataAdapter.saveWorkflows(updated)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-4 font-['Inter']">
      {/* ── TOP ACTION & FILTER BAR (Matching Image 3) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Dropdown Lọc loại yêu cầu */}
          <div className="relative min-w-[220px]">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full h-10 px-3.5 pr-8 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-[#2F6FA8] focus:bg-white transition cursor-pointer appearance-none"
            >
              <option value="all">Tất cả loại yêu cầu</option>
              {allRequestTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </div>
          </div>

          {/* Nút Lọc */}
          <button
            type="button"
            onClick={handleApplyFilter}
            className="h-10 px-4 rounded-xl bg-[#2F6FA8] hover:bg-[#235887] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Filter size={14} />
            Lọc
          </button>

          {/* Nút Reset */}
          <button
            type="button"
            onClick={handleResetFilter}
            title="Đặt lại bộ lọc"
            className="h-10 w-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 flex items-center justify-center transition cursor-pointer"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Nút + Thêm mới */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-10 px-4 rounded-xl bg-[#2F6FA8] hover:bg-[#235887] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          Thêm mới
        </button>
      </div>

      {/* ── TABLE VIEW (Matching Image 3) ── */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                <th className="py-3 px-3.5 text-center w-12">#</th>
                <th className="py-3 px-4 min-w-[200px]">Loại yêu cầu</th>
                <th className="py-3 px-4 min-w-[160px]">Chức vụ gửi yêu cầu</th>
                <th className="py-3 px-4 text-center min-w-[130px]">Các cấp phê duyệt</th>
                <th className="py-3 px-4 min-w-[240px]">Chức vụ nhận thông báo khi yêu cầu hoàn tất</th>
                <th className="py-3 px-4 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Không tìm thấy quy trình phê duyệt nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map((item, index) => {
                  const levelCount = item.steps?.length || item.levels_count || 1
                  const notifyText =
                    item.notify_roles && item.notify_roles.length > 0
                      ? item.notify_roles.join(', ')
                      : '-'

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* # */}
                      <td className="py-3 px-3.5 text-center font-mono text-gray-500 font-semibold">
                        {index + 1}
                      </td>

                      {/* Loại yêu cầu */}
                      <td className="py-3 px-4 font-bold text-[#001D3D]">
                        {item.request_type}
                      </td>

                      {/* Chức vụ gửi yêu cầu */}
                      <td className="py-3 px-4 text-gray-600 font-medium">
                        {item.submitter_role || 'Tất cả chức vụ'}
                      </td>

                      {/* Các cấp phê duyệt */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            levelCount > 1
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-[#2F6FA8] border border-blue-200'
                          }`}
                        >
                          {levelCount} cấp
                        </span>
                      </td>

                      {/* Chức vụ nhận thông báo */}
                      <td className="py-3 px-4 text-gray-600 font-medium text-[11px] leading-relaxed">
                        {notifyText}
                      </td>

                      {/* Thao tác (3 icon: Sửa, Nhân bản, Xóa) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Sửa */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-[#2F6FA8] transition cursor-pointer"
                            title="Chỉnh sửa quy trình"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Nhân bản / Sao chép */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(item)}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                            title="Nhân bản quy trình"
                          >
                            <Copy size={14} />
                          </button>

                          {/* Xóa */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.request_type)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            title="Xóa quy trình"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL THÊM / CẬP NHẬT QUY TRÌNH (Matching Image 1 & 2) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-['Inter'] animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <h3 className="text-base font-bold text-[#001D3D]">
                {editingItem ? 'Cập nhật quy trình phê duyệt' : 'Thêm quy trình phê duyệt'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200/60 flex items-center justify-center text-gray-500 hover:text-gray-900 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* 1. Loại yêu cầu * */}
              <div className="space-y-1.5">
                <label className="block font-bold text-gray-800 text-xs">
                  Loại yêu cầu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={requestType}
                    onChange={e => setRequestType(e.target.value)}
                    className="w-full h-10 px-3.5 pr-8 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-[#2F6FA8] focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer"
                  >
                    {allRequestTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* 2. Chức vụ gửi yêu cầu * */}
              <div className="space-y-1.5">
                <label className="block font-bold text-gray-800 text-xs">
                  Chức vụ gửi yêu cầu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={submitterRole}
                    onChange={e => setSubmitterRole(e.target.value)}
                    className="w-full h-10 px-3.5 pr-8 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-[#2F6FA8] focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer"
                  >
                    <option value="Tất cả chức vụ">Tất cả chức vụ</option>
                    {allPositionNames.map(pos => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* 3. Các cấp phê duyệt (Card Cấp 1, Cấp 2...) */}
              <div className="space-y-2">
                <label className="block font-bold text-gray-800 text-xs">
                  Các cấp phê duyệt
                </label>

                <div className="space-y-2.5 p-3 rounded-2xl bg-blue-50/30 border border-blue-100">
                  {steps.map((step, idx) => (
                    <div
                      key={step.level || idx}
                      className="p-3.5 rounded-xl bg-white border border-gray-200/90 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#001D3D] text-xs">
                          Cấp {idx + 1}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Nút Sửa vai trò duyệt */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditStepRoles(idx)}
                            className="p-1 text-gray-500 hover:text-[#2F6FA8] hover:bg-gray-100 rounded transition cursor-pointer"
                            title="Chọn chức vụ duyệt cho cấp này"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Nút Hoán đổi thứ tự */}
                          <button
                            type="button"
                            onClick={() => {
                              if (steps.length <= 1) return
                              const nextSteps = [...steps]
                              const targetIdx = idx === 0 ? 1 : 0
                              const temp = nextSteps[idx]
                              nextSteps[idx] = nextSteps[targetIdx]
                              nextSteps[targetIdx] = temp
                              setSteps(nextSteps.map((s, i) => ({ ...s, level: i + 1 })))
                            }}
                            className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition cursor-pointer"
                            title="Đổi thứ tự cấp duyệt"
                          >
                            <MoveVertical size={13} />
                          </button>

                          {/* Nút Xóa cấp */}
                          <button
                            type="button"
                            onClick={() => handleDeleteStep(idx)}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Xóa cấp duyệt này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                        {step.approver_roles && step.approver_roles.length > 0
                          ? step.approver_roles.join(', ')
                          : 'Chưa chọn chức vụ duyệt'}
                      </p>
                    </div>
                  ))}

                  {/* Nút + Thêm cấp duyệt */}
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[#2F6FA8]/40 hover:border-[#2F6FA8] bg-white text-[#2F6FA8] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <PlusCircle size={15} />
                    <span>Thêm cấp duyệt</span>
                  </button>
                </div>
              </div>

              {/* 4. Chức vụ nhận thông báo khi yêu cầu hoàn tất */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-blue-50/40 border border-blue-100">
                <h4 className="font-bold text-gray-800 text-xs">
                  Chức vụ nhận thông báo khi yêu cầu hoàn tất
                </h4>

                {/* Chọn chức vụ */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-600">
                    Chọn chức vụ
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsNotifyPickerOpen(!isNotifyPickerOpen)}
                      className="w-full min-h-[38px] p-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800 text-left flex items-center justify-between flex-wrap gap-1"
                    >
                      {notifyRoles.length === 0 ? (
                        <span className="text-gray-400">Chọn chức vụ nhận thông báo</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {notifyRoles.map(r => (
                            <span
                              key={r}
                              className="px-2 py-0.5 rounded bg-blue-100 text-[#2F6FA8] text-[10px] font-bold"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-gray-400 text-xs">▼</span>
                    </button>

                    {isNotifyPickerOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20 max-h-48 overflow-y-auto space-y-1">
                        {allPositionNames.map(pos => {
                          const isChecked = notifyRoles.includes(pos)
                          return (
                            <label
                              key={pos}
                              className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer text-xs text-gray-700"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleNotifyRole(pos)}
                                className="rounded text-[#2F6FA8]"
                              />
                              <span>{pos}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Loại trừ nhân viên */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-600">
                    Loại trừ nhân viên
                  </label>
                  <select
                    value=""
                    onChange={e => {
                      if (e.target.value) toggleExcludeEmployee(e.target.value)
                    }}
                    className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="">Chọn nhân viên loại trừ</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_code || emp.id})
                      </option>
                    ))}
                  </select>
                  {excludeEmployeeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {excludeEmployeeIds.map(id => {
                        const emp = employees.find(e => e.id === id)
                        return (
                          <span
                            key={id}
                            className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1"
                          >
                            {emp?.full_name || id}
                            <button
                              type="button"
                              onClick={() => toggleExcludeEmployee(id)}
                              className="hover:text-rose-900"
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Tùy chọn nâng cao (Toggles / Switches - Matching Image 2) */}
              <div className="space-y-3 pt-1">
                {/* Switch: Chỉ được phép gửi yêu cầu trước ngày nghỉ */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                    Chỉ được phép gửi yêu cầu trước ngày nghỉ
                  </span>
                  <div
                    onClick={() => setRequireAdvanceNotice(!requireAdvanceNotice)}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                      requireAdvanceNotice ? 'bg-[#2F6FA8]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        requireAdvanceNotice ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </label>

                {/* Switch: Yêu cầu upload hình ảnh khi xin phép */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                    Yêu cầu upload hình ảnh khi xin phép
                  </span>
                  <div
                    onClick={() => setRequirePhotoAttachment(!requirePhotoAttachment)}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                      requirePhotoAttachment ? 'bg-[#2F6FA8]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        requirePhotoAttachment ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold transition cursor-pointer"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                onClick={handleSaveWorkflow}
                className="px-6 py-2.5 rounded-xl bg-[#2F6FA8] hover:bg-[#235887] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-MODAL CHỌN CHỨC VỤ CHO TỪNG CẤP DUYỆT ── */}
      {editingStepIndex !== null && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-['Inter'] animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h4 className="text-sm font-bold text-[#001D3D]">
                Chọn chức vụ duyệt cho Cấp {editingStepIndex + 1}
              </h4>
              <button
                type="button"
                onClick={() => setEditingStepIndex(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2 text-xs max-h-80">
              <p className="text-[11px] text-gray-500 font-medium pb-1">
                Tất cả các chức vụ được chọn dưới đây sẽ có quyền phê duyệt ở Cấp {editingStepIndex + 1}:
              </p>
              {allPositionNames.map(pos => {
                const isSelected = tempStepRoles.includes(pos)
                return (
                  <div
                    key={pos}
                    onClick={() => toggleTempStepRole(pos)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-[#2F6FA8] text-[#2F6FA8] font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <span>{pos}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#2F6FA8] border-[#2F6FA8]'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {isSelected && <Check size={10} color="#fff" />}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingStepIndex(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-bold hover:bg-gray-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveStepRoles}
                className="px-5 py-2 rounded-xl bg-[#2F6FA8] text-white text-xs font-bold hover:bg-[#235887]"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
