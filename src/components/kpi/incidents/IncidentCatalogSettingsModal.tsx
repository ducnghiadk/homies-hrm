'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Plus,
  RotateCcw,
  Printer,
  Search,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Sparkles,
  Shield,
  Layers,
  Check,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  incidentCatalogService,
  type UnifiedErrorCategory,
  type ErrorScope,
  type ErrorGroup,
  DEFAULT_FNB_ERROR_CATEGORIES,
} from '@/lib/services/incident-catalog-service'

interface IncidentCatalogSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

const GROUPS: ErrorGroup[] = [
  'Đơn Hàng & Khách Hàng (App / Tại Quán)',
  'Pha Chế & SOP Chất Lượng',
  'Vệ Sinh & An Toàn Thực Phẩm',
  'Giờ Công & Kỷ Luật',
  'Khác / Bổ Sung',
]

export default function IncidentCatalogSettingsModal({
  isOpen,
  onClose,
  onUpdate,
}: IncidentCatalogSettingsModalProps) {
  const [catalog, setCatalog] = useState<UnifiedErrorCategory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')

  // Edit / Add modal state
  const [editingItem, setEditingItem] = useState<UnifiedErrorCategory | null>(null)
  const [isAddMode, setIsAddMode] = useState(false)

  // Form fields
  const [formData, setFormData] = useState<Partial<UnifiedErrorCategory>>({})

  // Load catalog on open
  useEffect(() => {
    if (isOpen) {
      setCatalog(incidentCatalogService.getCatalog())
    }
  }, [isOpen])

  // Subscribe to updates
  useEffect(() => {
    const unsub = incidentCatalogService.subscribeToUpdates((list) => {
      setCatalog(list)
      if (onUpdate) onUpdate()
    })
    return () => unsub()
  }, [onUpdate])

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.explanation.toLowerCase().includes(searchTerm.toLowerCase())

      const matchGroup = selectedGroup === 'all' || item.group === selectedGroup
      return matchSearch && matchGroup
    })
  }, [catalog, searchTerm, selectedGroup])

  if (!isOpen) return null

  // Mở form sửa
  const handleOpenEdit = (item: UnifiedErrorCategory) => {
    setIsAddMode(false)
    setEditingItem(item)
    setFormData({ ...item })
  }

  // Mở form thêm mới
  const handleOpenAdd = () => {
    setIsAddMode(true)
    const newCode = `CUSTOM-${Date.now().toString().slice(-4)}`
    const blank: UnifiedErrorCategory = {
      code: newCode,
      name: '',
      group: 'Khác / Bổ Sung',
      scope: 'individual',
      defaultEmployeePoints: 2,
      defaultStorePoints: 0,
      impactCSAT: false,
      isLockBonus: false,
      hasOrderCode: false,
      isActive: true,
      isCustom: true,
      severity: 'medium',
      explanation: '',
    }
    setEditingItem(blank)
    setFormData(blank)
  }

  // Bật / Tắt On-Off
  const handleToggleActive = (code: string) => {
    const updated = incidentCatalogService.toggleCategoryActive(code)
    setCatalog(updated)
    const current = updated.find(c => c.code === code)
    toast.success(
      current?.isActive !== false
        ? `Đã BẬT áp dụng mã lỗi [${code}]`
        : `Đã TẮT (ẩn khỏi biểu mẫu) mã lỗi [${code}]`
    )
  }

  // Xóa lỗi tùy chỉnh
  const handleDelete = (code: string) => {
    if (confirm(`Anh có chắc chắn muốn xóa mã lỗi [${code}] này khỏi danh mục không?`)) {
      const updated = incidentCatalogService.deleteCategory(code)
      setCatalog(updated)
      toast.success(`Đã xóa thành công mã lỗi [${code}]!`)
    }
  }

  // Khôi phục mặc định
  const handleReset = () => {
    if (confirm('Anh có chắc muốn khôi phục về danh mục 17 mã lỗi chuẩn Homies ban đầu không? Các chỉnh sửa trước đó sẽ được đặt lại.')) {
      const res = incidentCatalogService.resetCatalog()
      setCatalog(res)
      toast.success('Đã khôi phục thành công danh mục chuẩn Homies!')
    }
  }

  // Lưu form Sửa / Thêm
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name?.trim()) {
      toast.error('Vui lòng nhập tên sự cố vi phạm!')
      return
    }

    if (!formData.code?.trim()) {
      toast.error('Vui lòng nhập mã lỗi!')
      return
    }

    const payload: UnifiedErrorCategory = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      group: (formData.group as ErrorGroup) || 'Khác / Bổ Sung',
      scope: (formData.scope as ErrorScope) || 'individual',
      defaultEmployeePoints: Number(formData.defaultEmployeePoints) || 0,
      defaultStorePoints: Number(formData.defaultStorePoints) || 0,
      impactCSAT: Boolean(formData.impactCSAT),
      isLockBonus: Boolean(formData.isLockBonus),
      hasOrderCode: Boolean(formData.hasOrderCode),
      isActive: formData.isActive !== false,
      isCustom: Boolean(isAddMode || editingItem?.isCustom),
      severity: formData.isLockBonus ? 'critical' : (formData.defaultEmployeePoints || 0) >= 3 ? 'major' : 'medium',
      explanation: formData.explanation?.trim() || `${formData.name.trim()} (${formData.scope})`,
    }

    if (isAddMode) {
      const next = incidentCatalogService.addCategory(payload)
      setCatalog(next)
      toast.success(`Đã tạo mới mã lỗi [${payload.code}] thành công!`)
    } else {
      const next = incidentCatalogService.updateCategory(payload)
      setCatalog(next)
      toast.success(`Đã cập nhật mã lỗi [${payload.code}] thành công!`)
    }

    setEditingItem(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in font-['Inter']">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* ── HEADER CHÍNH ── */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#001D3D] text-white flex items-center justify-center shadow-xs">
              <Sliders size={20} className="text-[#FF6B35]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#001D3D]">
                  Cài Đặt Danh Mục Lỗi &amp; Điểm Phạt F&amp;B
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#001D3D] text-[10px] font-bold">
                  {catalog.filter(c => c.isActive !== false).length}/{catalog.length} Đang Áp Dụng
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Quản lý mức điểm phạt BSC/KPI, chế tài khóa thưởng và điều kiện đơn hàng cho chuỗi Homies
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── THANH CÔNG CỤ & TÁC VỤ ── */}
        <div className="p-4 bg-gray-50/80 border-b border-gray-200/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tìm kiếm & Lọc */}
          <div className="flex flex-1 items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm mã lỗi hoặc tên sự cố..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2F6FA8]"
              />
            </div>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#2F6FA8]"
            >
              <option value="all">Tất Cả Nhóm ({catalog.length})</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Cụm Buttons Hành Động */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-2 min-h-[38px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Thêm Lỗi Mới</span>
            </button>

            <a
              href="/docs/QUY_DINH_DANH_MUC_LOI_HOMIES.html"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 min-h-[38px] rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs no-underline cursor-pointer"
              title="Mở tài liệu in ấn khổ A4"
            >
              <Printer size={14} className="text-[#2F6FA8]" />
              <span>In / Xem Bản A4</span>
            </a>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-300 text-gray-600 hover:text-rose-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Đặt lại về danh mục 17 lỗi mặc định ban đầu"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Khôi Phục Gốc</span>
            </button>
          </div>
        </div>

        {/* ── BẢNG MA TRẬN DỮ LIỆU CHÍNH ── */}
        <div className="flex-1 overflow-auto p-4 sm:p-5">
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/80 text-gray-700 text-xs font-black uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-3 w-20 text-center">Mã Lỗi</th>
                  <th className="py-3 px-3 min-w-[220px]">Tên Sự Cố &amp; Hành Vi Vi Phạm</th>
                  <th className="py-3 px-3 w-32 text-center">Phân Loại</th>
                  <th className="py-3 px-3 w-24 text-center">Phạt Cá Nhân</th>
                  <th className="py-3 px-3 w-28 text-center">Phạt Quán</th>
                  <th className="py-3 px-3 w-36">Chế Tài &amp; Quy Định</th>
                  <th className="py-3 px-3 w-24 text-center">Trạng Thái</th>
                  <th className="py-3 px-3 w-20 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredCatalog.map((item) => {
                  const isOff = item.isActive === false
                  return (
                    <tr
                      key={item.code}
                      className={`hover:bg-amber-50/30 transition ${isOff ? 'opacity-50 bg-gray-50/60' : ''}`}
                    >
                      {/* Mã Lỗi */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                          {item.code}
                        </span>
                      </td>

                      {/* Tên & Mô tả */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900 leading-snug">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                          {item.explanation}
                        </div>
                      </td>

                      {/* Phân Loại */}
                      <td className="py-3 px-3 text-center">
                        {item.scope === 'dual_impact' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            ⚡ Tác Động Kép
                          </span>
                        ) : item.scope === 'store_operation' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                            🏪 Vận Hành Quán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                            👤 Cá Nhân
                          </span>
                        )}
                      </td>

                      {/* Phạt Cá Nhân */}
                      <td className="py-3 px-3 text-center">
                        {item.defaultEmployeePoints > 0 ? (
                          <span className="font-mono font-black text-rose-700 text-xs">
                            -{item.defaultEmployeePoints}đ
                          </span>
                        ) : (
                          <span className="text-gray-400 font-mono">0đ</span>
                        )}
                      </td>

                      {/* Phạt Quán */}
                      <td className="py-3 px-3 text-center">
                        {item.defaultStorePoints > 0 ? (
                          <span className="font-mono font-black text-[#2F6FA8] text-xs">
                            -{item.defaultStorePoints}đ {item.impactCSAT ? '(CSAT)' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-mono">0đ</span>
                        )}
                      </td>

                      {/* Chế Tài & Quy Định */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {item.isLockBonus && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 font-bold text-[10px] border border-rose-200">
                              🔒 Khóa Thưởng 0đ
                            </span>
                          )}
                          {item.hasOrderCode ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
                              📦 Cần Mã Đơn
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 text-[10px] border border-gray-200">
                              🚫 Không Mã Đơn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Công tắc Bật/Tắt (Toggle) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.code)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            !isOff ? 'bg-[#2F6FA8]' : 'bg-gray-300'
                          }`}
                          title={!isOff ? 'Đang bật - Bấm để tắt' : 'Đang tắt - Bấm để bật'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              !isOff ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Thao Tác (Sửa / Xóa) */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#2F6FA8] text-gray-600 hover:text-white transition cursor-pointer"
                            title="Chỉnh sửa mã lỗi này"
                          >
                            <Pencil size={13} />
                          </button>
                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item.code)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-600 text-gray-600 hover:text-white transition cursor-pointer"
                              title="Xóa mã lỗi tùy chỉnh này"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FOOTER MODAL ── */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div>
            Đang hiển thị <strong>{filteredCatalog.length}</strong> / {catalog.length} mã sự cố
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 min-h-[38px] rounded-xl bg-gray-800 hover:bg-black text-white font-bold transition cursor-pointer shadow-xs"
          >
            Đóng Bảng Cài Đặt
          </button>
        </div>
      </div>

      {/* ── SUB-MODAL CHỈNH SỬA / THÊM MỚI ── */}
      {editingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-scale-up">
            <form onSubmit={handleSaveForm}>
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <Pencil size={18} className="text-[#2F6FA8]" />
                  <h4 className="text-base font-bold text-[#001D3D]">
                    {isAddMode ? 'Thêm Mã Lỗi Mới' : `Chỉnh Sửa Mã Lỗi [${editingItem.code}]`}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                {/* Mã Lỗi */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Mã Định Danh (Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isAddMode}
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-800 disabled:bg-gray-100 uppercase focus:outline-none focus:border-[#2F6FA8]"
                    placeholder="VD: ORD-05, ATT-07..."
                  />
                </div>

                {/* Tên Sự Cố */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Tên Sự Cố / Hành Vi Vi Phạm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
                    placeholder="Nhập tên sự cố rõ ràng..."
                  />
                </div>

                {/* Nhóm Nghiệp Vụ */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Nhóm Nghiệp Vụ F&amp;B
                  </label>
                  <select
                    value={formData.group || GROUPS[0]}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value as ErrorGroup })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
                  >
                    {GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phân Loại Tác Động */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Phân Loại Xử Lý
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'individual', label: 'Cá Nhân' },
                      { id: 'store_operation', label: 'Vận Hành Quán' },
                      { id: 'dual_impact', label: 'Tác Động Kép' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, scope: s.id as ErrorScope })}
                        className={`py-2 px-2 rounded-xl text-center font-bold text-xs border transition ${
                          formData.scope === s.id
                            ? 'bg-[#2F6FA8] text-white border-[#2F6FA8] shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mức Điểm Phạt */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Phạt Cá Nhân (đ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={formData.defaultEmployeePoints ?? 0}
                      onChange={(e) => setFormData({ ...formData, defaultEmployeePoints: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-rose-700 text-center focus:outline-none focus:border-[#2F6FA8]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Phạt Cửa Hàng (đ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={formData.defaultStorePoints ?? 0}
                      onChange={(e) => setFormData({ ...formData, defaultStorePoints: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#2F6FA8] text-center focus:outline-none focus:border-[#2F6FA8]"
                    />
                  </div>
                </div>

                {/* Checkboxes chế tài */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.hasOrderCode)}
                      onChange={(e) => setFormData({ ...formData, hasOrderCode: e.target.checked })}
                      className="w-4 h-4 text-[#2F6FA8] rounded border-gray-300 focus:ring-[#2F6FA8]"
                    />
                    <span className="font-semibold text-gray-800">
                      Yêu cầu nhập Mã đơn hàng (Grab/Shopee/Bill POS)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-rose-50/50">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.isLockBonus)}
                      onChange={(e) => setFormData({ ...formData, isLockBonus: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                    />
                    <span className="font-bold text-rose-900">
                      Khóa thưởng tháng về 0đ (Lỗi kỷ luật đặc biệt nghiêm trọng)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-blue-50/50">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.impactCSAT)}
                      onChange={(e) => setFormData({ ...formData, impactCSAT: e.target.checked })}
                      className="w-4 h-4 text-[#2F6FA8] rounded border-gray-300 focus:ring-[#2F6FA8]"
                    />
                    <span className="font-semibold text-gray-800">
                      Trừ trực tiếp vào điểm Dịch Vụ Khách Hàng (CSAT) của quán
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 size={16} />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
