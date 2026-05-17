'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  getKPICategoriesByOption, getKPICriteriaByCategory,
  getViolationTypes, getKPIGrades, getEvaluationTimeline,
  getKPISettings, mockKPICategories, mockLevelConfigs,
} from '@/lib/mock-data-kpi'
import {
  updateCategory, createCategory, deleteCategory,
  updateCriteria, createCriteria, deleteCriteria,
  updateViolationType, createViolationType, deleteViolationType,
  updateGrade, updateLevelConfig, updateKPISettings,
  validateCategoryWeights,
} from '@/lib/kpi-settings-service'
import type {
  KPIOptionType, KPICategory, KPICriteria, ViolationType,
  KPIGrade, LevelConfig, KPISettings, ViolationSeverity,
  CategoryType, CriteriaInputType, EvaluatorRole, EmployeeLevel,
} from '@/lib/kpi-types'
import CategoryCard from '@/components/kpi/CategoryCard'
import CriteriaRow from '@/components/kpi/CriteriaRow'
import ViolationRow from '@/components/kpi/ViolationRow'
import GradeRow from '@/components/kpi/GradeRow'
import LevelRow from '@/components/kpi/LevelRow'
import KPISettingsForm from '@/components/kpi/KPISettingsForm'
import { toast } from 'sonner'
import { Settings, ChevronLeft, Plus, AlertTriangle, CheckCircle } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import Link from 'next/link'

type TabKey = 'categories' | 'criteria' | 'violations' | 'grades' | 'levels' | 'settings'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'categories', label: 'Khía cạnh', icon: '📊' },
  { key: 'criteria',   label: 'Tiêu chí',  icon: '🎯' },
  { key: 'violations', label: 'Loại lỗi',  icon: '⚠️' },
  { key: 'grades',     label: 'Xếp loại',  icon: '🏆' },
  { key: 'levels',     label: 'Cấp bậc',   icon: '📈' },
  { key: 'settings',   label: 'Cài đặt',   icon: '⚙️' },
]

const OPTION_LABELS: Record<KPIOptionType, string> = { A: 'Option A (L0-L1)', B: 'Option B (L2-L3)', C: 'Option C (L4-L5)' }

export default function KPISettingsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('categories')
  const [tick, setTick] = useState(0)                      // force re-render
  const refresh = useCallback(() => setTick(t => t + 1), [])

  // ── Filters ──
  const [optionFilter, setOptionFilter] = useState<KPIOptionType>('A')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<ViolationSeverity | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | 'staff' | 'manager'>('all')

  // ── Modals ──
  const [editingCategory, setEditingCategory] = useState<KPICategory | null>(null)
  const [showCatDialog, setShowCatDialog] = useState(false)
  const [editingCriteria, setEditingCriteria] = useState<KPICriteria | null>(null)
  const [showCriDialog, setShowCriDialog] = useState(false)
  const [editingViolation, setEditingViolation] = useState<ViolationType | null>(null)
  const [showVioDialog, setShowVioDialog] = useState(false)
  const [editingGrade, setEditingGrade] = useState<KPIGrade | null>(null)
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [editingLevel, setEditingLevel] = useState<LevelConfig | null>(null)
  const [showLevelDialog, setShowLevelDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user || user.role === 'employee') return null

  // ══════════════════════════════════
  // DATA (refreshed by tick)
  // ══════════════════════════════════
  void tick // used for reactivity
  const categories = getKPICategoriesByOption(optionFilter)
  const allCategories = mockKPICategories.filter(c => c.is_active)
  const selectedCatId = categoryFilter || allCategories[0]?.id || ''
  const criteria = getKPICriteriaByCategory(selectedCatId)
  const weightValidation = validateCategoryWeights(optionFilter)

  const filteredViolations = (() => {
    let vios = getViolationTypes()
    if (severityFilter !== 'all') vios = vios.filter(v => v.severity === severityFilter)
    if (levelFilter === 'staff') vios = vios.filter(v => v.applicable_levels.some(l => ['L0','L1','L2','L3'].includes(l)))
    if (levelFilter === 'manager') vios = vios.filter(v => v.applicable_levels.some(l => ['L4','L5'].includes(l)) && !v.applicable_levels.includes('L0'))
    return vios
  })()

  const grades = getKPIGrades()
  const levels = [...mockLevelConfigs]
  const settings = getKPISettings()

  // ══════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    let ok = false
    if (deleteTarget.type === 'category') ok = deleteCategory(deleteTarget.id)
    if (deleteTarget.type === 'criteria') ok = deleteCriteria(deleteTarget.id)
    if (deleteTarget.type === 'violation') ok = deleteViolationType(deleteTarget.id)
    if (ok) { toast.success('✅ Đã xóa thành công'); refresh() }
    else toast.error('❌ Không tìm thấy mục cần xóa')
    setDeleteTarget(null)
  }

  const handleSaveCategory = () => {
    if (!editingCategory) return
    if (editingCategory.id.startsWith('cat-NEW')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...rest } = editingCategory
      createCategory(rest)
      toast.success('✅ Đã thêm khía cạnh')
    } else {
      updateCategory(editingCategory.id, editingCategory)
      toast.success('✅ Đã cập nhật khía cạnh')
    }
    setShowCatDialog(false); setEditingCategory(null); refresh()
  }

  const handleSaveCriteria = () => {
    if (!editingCriteria) return
    if (editingCriteria.id.startsWith('cri-NEW')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...rest } = editingCriteria
      createCriteria(rest)
      toast.success('✅ Đã thêm tiêu chí')
    } else {
      updateCriteria(editingCriteria.id, editingCriteria)
      toast.success('✅ Đã cập nhật tiêu chí')
    }
    setShowCriDialog(false); setEditingCriteria(null); refresh()
  }

  const handleSaveViolation = () => {
    if (!editingViolation) return
    if (editingViolation.id.startsWith('vio-NEW')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...rest } = editingViolation
      createViolationType(rest)
      toast.success('✅ Đã thêm loại lỗi')
    } else {
      updateViolationType(editingViolation.id, editingViolation)
      toast.success('✅ Đã cập nhật loại lỗi')
    }
    setShowVioDialog(false); setEditingViolation(null); refresh()
  }

  const handleSaveGrade = () => {
    if (!editingGrade) return
    updateGrade(editingGrade.id, editingGrade)
    toast.success('✅ Đã cập nhật xếp loại')
    setShowGradeDialog(false); setEditingGrade(null); refresh()
  }

  const handleSaveLevel = () => {
    if (!editingLevel) return
    updateLevelConfig(editingLevel.id, editingLevel)
    toast.success('✅ Đã cập nhật cấp bậc')
    setShowLevelDialog(false); setEditingLevel(null); refresh()
  }

  // ══════════════════════════════════
  // CREATE NEW HELPERS
  // ══════════════════════════════════

  const newCategory = (): KPICategory => ({
    id: 'cat-NEW', name: '', name_en: '', type: 'manual', weight: 0,
    option_type: optionFilter, evaluators: ['self', 'manager'],
    icon: '📋', color: '#6b7280', sort_order: categories.length + 1, is_active: true,
  })

  const newCriteria = (): KPICriteria => ({
    id: 'cri-NEW', category_id: selectedCatId, name: '', name_en: '',
    description: '', input_type: 'star', max_value: 5, target_value: 3,
    target_operator: '>=', sort_order: criteria.length + 1, is_active: true,
  })

  const newViolation = (): ViolationType => ({
    id: 'vio-NEW', code: '', name: '', name_en: '', description: '',
    severity: 'minor', penalty_points: 5,
    applicable_levels: ['L0', 'L1', 'L2', 'L3'] as EmployeeLevel[],
    requires_evidence: false, requires_acknowledgment: false,
    notify_admin: false, sort_order: filteredViolations.length + 1, is_active: true,
  })

  // ══════════════════════════════════
  // RENDER
  // ══════════════════════════════════

  return (
    <AppShell title="⚙️ Cài đặt KPI" backHref="/kpi">
      <div className="space-y-4">
        {/* Back link */}
        <Link href="/kpi" className="inline-flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--primary)' }}>
          <ChevronLeft size={16} /> Quay lại KPI
        </Link>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: activeTab === tab.key ? 'var(--primary)' : 'var(--gray-100)',
                color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB 1: Categories ═══ */}
        {activeTab === 'categories' && (
          <div className="space-y-3 animate-fade-in">
            {/* Option filter */}
            <div className="flex gap-2">
              {(['A', 'B', 'C'] as KPIOptionType[]).map(opt => (
                <button
                  key={opt}
                  onClick={() => setOptionFilter(opt)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: optionFilter === opt ? 'var(--primary)' : 'var(--gray-100)',
                    color: optionFilter === opt ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {OPTION_LABELS[opt]}
                </button>
              ))}
            </div>

            {/* Weight validation */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{
              background: weightValidation.valid ? '#dcfce7' : '#fef3c7',
              color: weightValidation.valid ? '#166534' : '#92400e',
            }}>
              {weightValidation.valid ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              Tổng trọng số: {weightValidation.total}%
              {!weightValidation.valid && ' (phải = 100%)'}
            </div>

            {/* Category list */}
            <div className="space-y-2">
              {categories.map(cat => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onEdit={c => { setEditingCategory({ ...c }); setShowCatDialog(true) }}
                  onDelete={id => setDeleteTarget({ type: 'category', id })}
                  onToggle={(id, active) => { updateCategory(id, { is_active: active }); refresh() }}
                />
              ))}
            </div>

            <button
              onClick={() => { setEditingCategory(newCategory()); setShowCatDialog(true) }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ border: '2px dashed var(--gray-300)', color: 'var(--text-secondary)' }}
            >
              <Plus size={16} /> Thêm khía cạnh
            </button>
          </div>
        )}

        {/* ═══ TAB 2: Criteria ═══ */}
        {activeTab === 'criteria' && (
          <div className="space-y-3 animate-fade-in">
            {/* Category filter */}
            <select
              value={selectedCatId}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm font-semibold outline-none"
              style={{ border: '1px solid var(--gray-200)', color: 'var(--text-primary)' }}
            >
              {allCategories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name} ({c.option_type === 'A' ? 'L0-L1' : c.option_type === 'B' ? 'L2-L3' : 'L4-L5'})
                </option>
              ))}
            </select>

            {criteria.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                {allCategories.find(c => c.id === selectedCatId)?.type === 'deduction'
                  ? '⚠️ Khía cạnh "Lỗi" sử dụng log vi phạm, không cần tiêu chí'
                  : 'Chưa có tiêu chí nào'}
              </div>
            ) : (
              <div className="card divide-y" style={{ borderColor: 'var(--gray-100)' }}>
                {criteria.map(cri => (
                  <CriteriaRow
                    key={cri.id}
                    criteria={cri}
                    onEdit={c => { setEditingCriteria({ ...c }); setShowCriDialog(true) }}
                    onDelete={id => setDeleteTarget({ type: 'criteria', id })}
                    onToggle={(id, active) => { updateCriteria(id, { is_active: active }); refresh() }}
                  />
                ))}
              </div>
            )}

            {allCategories.find(c => c.id === selectedCatId)?.type !== 'deduction' && (
              <button
                onClick={() => { setEditingCriteria(newCriteria()); setShowCriDialog(true) }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ border: '2px dashed var(--gray-300)', color: 'var(--text-secondary)' }}
              >
                <Plus size={16} /> Thêm tiêu chí
              </button>
            )}
          </div>
        )}

        {/* ═══ TAB 3: Violations ═══ */}
        {activeTab === 'violations' && (
          <div className="space-y-3 animate-fade-in">
            {/* Severity filter */}
            <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {[
                { key: 'all' as const, label: 'Tất cả' },
                { key: 'minor' as const, label: 'Nhẹ' },
                { key: 'medium' as const, label: 'TB' },
                { key: 'major' as const, label: 'Nặng' },
                { key: 'critical' as const, label: 'Nghiêm trọng' },
              ].map(s => (
                <button key={s.key} onClick={() => setSeverityFilter(s.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: severityFilter === s.key ? 'var(--primary)' : 'var(--gray-100)',
                    color: severityFilter === s.key ? '#fff' : 'var(--text-secondary)',
                  }}
                >{s.label}</button>
              ))}
            </div>

            {/* Level filter */}
            <div className="flex gap-2">
              {[
                { key: 'all' as const, label: 'Tất cả' },
                { key: 'staff' as const, label: 'Nhân viên' },
                { key: 'manager' as const, label: 'Quản lý' },
              ].map(l => (
                <button key={l.key} onClick={() => setLevelFilter(l.key)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: levelFilter === l.key ? 'var(--gray-700)' : 'var(--gray-100)',
                    color: levelFilter === l.key ? '#fff' : 'var(--text-secondary)',
                  }}
                >{l.label}</button>
              ))}
            </div>

            <div className="card divide-y" style={{ borderColor: 'var(--gray-100)' }}>
              {filteredViolations.map(v => (
                <ViolationRow
                  key={v.id}
                  violation={v}
                  onEdit={vio => { setEditingViolation({ ...vio }); setShowVioDialog(true) }}
                  onDelete={id => setDeleteTarget({ type: 'violation', id })}
                  onToggle={(id, active) => { updateViolationType(id, { is_active: active }); refresh() }}
                />
              ))}
            </div>

            <button
              onClick={() => { setEditingViolation(newViolation()); setShowVioDialog(true) }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ border: '2px dashed var(--gray-300)', color: 'var(--text-secondary)' }}
            >
              <Plus size={16} /> Thêm loại lỗi
            </button>
          </div>
        )}

        {/* ═══ TAB 4: Grades ═══ */}
        {activeTab === 'grades' && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Hệ thống có 5 mức xếp loại cố định. Bạn chỉ có thể chỉnh sửa tên và khoảng điểm.
            </p>
            <div className="card divide-y" style={{ borderColor: 'var(--gray-100)' }}>
              {grades.map(g => (
                <GradeRow key={g.id} grade={g} onEdit={gr => { setEditingGrade({ ...gr }); setShowGradeDialog(true) }} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB 5: Levels ═══ */}
        {activeTab === 'levels' && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              6 cấp bậc từ L0 (Thử việc) đến L5 (Quản lý). Chỉnh sửa yêu cầu thăng tiến cho từng cấp.
            </p>
            <div className="card divide-y" style={{ borderColor: 'var(--gray-100)' }}>
              {levels.map(lv => (
                <LevelRow key={lv.id} config={lv} onEdit={l => { setEditingLevel({ ...l }); setShowLevelDialog(true) }} />
              ))}
            </div>

            {/* Timeline preview */}
            <div className="card p-3">
              <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>📅 Lịch đánh giá hàng tháng</h4>
              <div className="space-y-1.5">
                {getEvaluationTimeline().map(phase => (
                  <div key={phase.id} className="flex items-center gap-2 text-xs">
                    <span className="w-16 font-mono font-bold" style={{ color: 'var(--primary)' }}>
                      {phase.start_day}–{phase.end_day}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{phase.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 6: Settings ═══ */}
        {activeTab === 'settings' && (
          <div className="card p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="text-sm font-bold">Cài đặt chung</h3>
            </div>
            <KPISettingsForm settings={settings} onSave={data => { updateKPISettings(data); refresh() }} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════ */}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        description="Bạn có chắc muốn xóa mục này? Hành động không thể hoàn tác."
        confirmLabel="Xóa"
        variant="danger"
      />

      {/* ── Category Dialog ── */}
      {showCatDialog && editingCategory && (
        <DialogOverlay onClose={() => { setShowCatDialog(false); setEditingCategory(null) }}>
          <h3 className="text-sm font-bold mb-3">
            {editingCategory.id.startsWith('cat-NEW') ? '➕ Thêm khía cạnh' : '✏️ Sửa khía cạnh'}
          </h3>
          <div className="space-y-3">
            <FormField label="Tên" value={editingCategory.name} onChange={v => setEditingCategory(ec => ec ? { ...ec, name: v } : null)} />
            <FormField label="Tên EN" value={editingCategory.name_en} onChange={v => setEditingCategory(ec => ec ? { ...ec, name_en: v } : null)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Trọng số (%)</label>
                <input type="number" min={0} max={100} value={editingCategory.weight}
                  onChange={e => setEditingCategory(ec => ec ? { ...ec, weight: parseInt(e.target.value) || 0 } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Loại</label>
                <select value={editingCategory.type}
                  onChange={e => setEditingCategory(ec => ec ? { ...ec, type: e.target.value as CategoryType } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }}>
                  <option value="auto">Tự động</option>
                  <option value="manual">Thủ công</option>
                  <option value="deduction">Trừ điểm</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Icon" value={editingCategory.icon} onChange={v => setEditingCategory(ec => ec ? { ...ec, icon: v } : null)} />
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Màu</label>
                <input type="color" value={editingCategory.color}
                  onChange={e => setEditingCategory(ec => ec ? { ...ec, color: e.target.value } : null)}
                  className="w-full h-8 rounded-lg cursor-pointer" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Người đánh giá</label>
              <div className="flex flex-wrap gap-1.5">
                {(['self','mentor','senior','leader','manager','ceo','peer'] as EvaluatorRole[]).map(role => (
                  <button key={role} onClick={() => setEditingCategory(ec => {
                    if (!ec) return null
                    const has = ec.evaluators.includes(role)
                    return { ...ec, evaluators: has ? ec.evaluators.filter(r => r !== role) : [...ec.evaluators, role] }
                  })}
                    className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: editingCategory.evaluators.includes(role) ? 'var(--primary)' : 'var(--gray-100)',
                      color: editingCategory.evaluators.includes(role) ? '#fff' : 'var(--text-secondary)',
                    }}
                  >{role}</button>
                ))}
              </div>
            </div>
            <button onClick={handleSaveCategory} className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: 'var(--primary)' }}>
              💾 Lưu
            </button>
          </div>
        </DialogOverlay>
      )}

      {/* ── Criteria Dialog ── */}
      {showCriDialog && editingCriteria && (
        <DialogOverlay onClose={() => { setShowCriDialog(false); setEditingCriteria(null) }}>
          <h3 className="text-sm font-bold mb-3">
            {editingCriteria.id.startsWith('cri-NEW') ? '➕ Thêm tiêu chí' : '✏️ Sửa tiêu chí'}
          </h3>
          <div className="space-y-3">
            <FormField label="Tên" value={editingCriteria.name} onChange={v => setEditingCriteria(ec => ec ? { ...ec, name: v } : null)} />
            <FormField label="Mô tả" value={editingCriteria.description} onChange={v => setEditingCriteria(ec => ec ? { ...ec, description: v } : null)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Loại input</label>
                <select value={editingCriteria.input_type}
                  onChange={e => setEditingCriteria(ec => ec ? { ...ec, input_type: e.target.value as CriteriaInputType } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }}>
                  <option value="star">⭐ Sao (1-5)</option>
                  <option value="percent">📊 Phần trăm</option>
                  <option value="number">🔢 Số</option>
                  <option value="boolean">✅ Có/Không</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Giá trị max</label>
                <input type="number" value={editingCriteria.max_value}
                  onChange={e => setEditingCriteria(ec => ec ? { ...ec, max_value: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Mục tiêu</label>
                <input type="number" value={editingCriteria.target_value}
                  onChange={e => setEditingCriteria(ec => ec ? { ...ec, target_value: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Operator</label>
                <select value={editingCriteria.target_operator}
                  onChange={e => setEditingCriteria(ec => ec ? { ...ec, target_operator: e.target.value as '>=' | '<=' | '=' } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }}>
                  <option value=">=">≥ (lớn hơn bằng)</option>
                  <option value="<=">≤ (nhỏ hơn bằng)</option>
                  <option value="=">=  (bằng)</option>
                </select>
              </div>
            </div>
            <FormField label="Hướng dẫn chấm" value={editingCriteria.rating_guide || ''} onChange={v => setEditingCriteria(ec => ec ? { ...ec, rating_guide: v || undefined } : null)} />
            <button onClick={handleSaveCriteria} className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: 'var(--primary)' }}>
              💾 Lưu
            </button>
          </div>
        </DialogOverlay>
      )}

      {/* ── Violation Dialog ── */}
      {showVioDialog && editingViolation && (
        <DialogOverlay onClose={() => { setShowVioDialog(false); setEditingViolation(null) }}>
          <h3 className="text-sm font-bold mb-3">
            {editingViolation.id.startsWith('vio-NEW') ? '➕ Thêm loại lỗi' : '✏️ Sửa loại lỗi'}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <FormField label="Mã" value={editingViolation.code} onChange={v => setEditingViolation(ev => ev ? { ...ev, code: v } : null)} />
              <div className="col-span-2">
                <FormField label="Tên" value={editingViolation.name} onChange={v => setEditingViolation(ev => ev ? { ...ev, name: v } : null)} />
              </div>
            </div>
            <FormField label="Mô tả" value={editingViolation.description} onChange={v => setEditingViolation(ev => ev ? { ...ev, description: v } : null)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Mức độ</label>
                <select value={editingViolation.severity}
                  onChange={e => setEditingViolation(ev => ev ? { ...ev, severity: e.target.value as ViolationSeverity } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }}>
                  <option value="minor">Nhẹ</option>
                  <option value="medium">Trung bình</option>
                  <option value="major">Nặng</option>
                  <option value="critical">Nghiêm trọng</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Điểm trừ</label>
                <input type="number" min={1} max={100} value={editingViolation.penalty_points}
                  onChange={e => setEditingViolation(ev => ev ? { ...ev, penalty_points: parseInt(e.target.value) || 5 } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Áp dụng cho</label>
              <div className="flex flex-wrap gap-1.5">
                {(['L0','L1','L2','L3','L4','L5'] as EmployeeLevel[]).map(lv => (
                  <button key={lv} onClick={() => setEditingViolation(ev => {
                    if (!ev) return null
                    const has = ev.applicable_levels.includes(lv)
                    return { ...ev, applicable_levels: has ? ev.applicable_levels.filter(l => l !== lv) : [...ev.applicable_levels, lv] }
                  })}
                    className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: editingViolation.applicable_levels.includes(lv) ? 'var(--primary)' : 'var(--gray-100)',
                      color: editingViolation.applicable_levels.includes(lv) ? '#fff' : 'var(--text-secondary)',
                    }}
                  >{lv}</button>
                ))}
              </div>
            </div>
            <button onClick={handleSaveViolation} className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: 'var(--primary)' }}>
              💾 Lưu
            </button>
          </div>
        </DialogOverlay>
      )}

      {/* ── Grade Dialog ── */}
      {showGradeDialog && editingGrade && (
        <DialogOverlay onClose={() => { setShowGradeDialog(false); setEditingGrade(null) }}>
          <h3 className="text-sm font-bold mb-3">✏️ Sửa xếp loại</h3>
          <div className="space-y-3">
            <FormField label="Tên" value={editingGrade.name} onChange={v => setEditingGrade(eg => eg ? { ...eg, name: v } : null)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Điểm min</label>
                <input type="number" min={0} max={100} value={editingGrade.min_score}
                  onChange={e => setEditingGrade(eg => eg ? { ...eg, min_score: parseInt(e.target.value) || 0 } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Điểm max</label>
                <input type="number" min={0} max={100} value={editingGrade.max_score}
                  onChange={e => setEditingGrade(eg => eg ? { ...eg, max_score: parseInt(e.target.value) || 100 } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Màu</label>
              <input type="color" value={editingGrade.color}
                onChange={e => setEditingGrade(eg => eg ? { ...eg, color: e.target.value } : null)}
                className="w-full h-8 rounded-lg cursor-pointer" />
            </div>
            <button onClick={handleSaveGrade} className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: 'var(--primary)' }}>
              💾 Lưu
            </button>
          </div>
        </DialogOverlay>
      )}

      {/* ── Level Dialog ── */}
      {showLevelDialog && editingLevel && (
        <DialogOverlay onClose={() => { setShowLevelDialog(false); setEditingLevel(null) }}>
          <h3 className="text-sm font-bold mb-3">✏️ Sửa cấp bậc {editingLevel.level}</h3>
          <div className="space-y-3">
            <FormField label="Tên" value={editingLevel.name} onChange={v => setEditingLevel(el => el ? { ...el, name: v } : null)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Option</label>
                <select value={editingLevel.option_type}
                  onChange={e => setEditingLevel(el => el ? { ...el, option_type: e.target.value as KPIOptionType } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }}>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>KPI yêu cầu</label>
                <input type="number" min={0} max={100} value={editingLevel.required_kpi_average}
                  onChange={e => setEditingLevel(el => el ? { ...el, required_kpi_average: parseInt(e.target.value) || 0 } : null)}
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Tháng thăng tiến</label>
              <input type="number" min={1} max={60} value={editingLevel.min_months_to_promote}
                onChange={e => setEditingLevel(el => el ? { ...el, min_months_to_promote: parseInt(e.target.value) || 1 } : null)}
                className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={{ border: '1px solid var(--gray-200)' }} />
            </div>
            <div className="space-y-2">
              <ToggleField label="Cho phép tự đánh giá" value={editingLevel.allow_self_evaluation}
                onChange={v => setEditingLevel(el => el ? { ...el, allow_self_evaluation: v } : null)} />
              <ToggleField label="CEO duyệt thăng tiến" value={editingLevel.promotion_requires_ceo_approval}
                onChange={v => setEditingLevel(el => el ? { ...el, promotion_requires_ceo_approval: v } : null)} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Người đánh giá</label>
              <div className="flex flex-wrap gap-1.5">
                {(['self','mentor','senior','leader','manager','ceo','peer'] as EvaluatorRole[]).map(role => (
                  <button key={role} onClick={() => setEditingLevel(el => {
                    if (!el) return null
                    const has = el.evaluators.includes(role)
                    return { ...el, evaluators: has ? el.evaluators.filter(r => r !== role) : [...el.evaluators, role] }
                  })}
                    className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: editingLevel.evaluators.includes(role) ? 'var(--primary)' : 'var(--gray-100)',
                      color: editingLevel.evaluators.includes(role) ? '#fff' : 'var(--text-secondary)',
                    }}
                  >{role}</button>
                ))}
              </div>
            </div>
            <button onClick={handleSaveLevel} className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: 'var(--primary)' }}>
              💾 Lưu
            </button>
          </div>
        </DialogOverlay>
      )}
    </AppShell>
  )
}

// ═══════════════════════════════════
// REUSABLE SUB-COMPONENTS
// ═══════════════════════════════════

function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto animate-slide-up"
        style={{ background: 'var(--bg-primary)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: 'var(--gray-300)' }} />
        {children}
      </div>
    </div>
  )
}

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
        style={{ border: '1px solid var(--gray-200)' }}
      />
    </div>
  )
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-9 h-5 rounded-full transition-colors relative flex-shrink-0"
        style={{ background: value ? 'var(--success)' : 'var(--gray-300)' }}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}
