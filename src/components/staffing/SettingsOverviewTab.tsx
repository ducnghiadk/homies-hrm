'use client'

import { useState } from 'react'
import { AlertTriangle, Calculator, Clock3, Settings, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import EditDrawer from '@/components/ui/EditDrawer'
import { OptimizationSection } from './settings-sections/OptimizationSection'
import { PeakHoursSectionEdit, PeakHoursSectionView } from './settings-sections/PeakHoursSection'
import { SeasonalSectionEdit, SeasonalSectionView } from './settings-sections/SeasonalSection'
import { StaffingSectionEdit, StaffingSectionView } from './settings-sections/StaffingSection'

type SectionKey = 'staffing' | 'peakHours' | 'seasonal' | null

interface SettingsOverviewTabProps {
  selectedStore: string
  onReqChange: (shiftId: string, posId: string, val: number) => void
  onStartOptimization: () => void
  onOpenCalculator: () => void
  latestScheduleCost: number
  warningCount: number
  lastOptimizationResult?: {
    planName: string
    fulltime: number
    parttime: number
    totalCost: number
    date: string
  }
}

const sectionMeta: Record<Exclude<SectionKey, null>, { title: string; size: 'sm' | 'md' | 'lg' }> = {
  staffing: { title: 'Sua dinh bien co ban', size: 'lg' },
  peakHours: { title: 'Sua gio cao diem', size: 'md' },
  seasonal: { title: 'Sua dieu chinh mua vu', size: 'md' },
}

export default function SettingsOverviewTab({
  selectedStore,
  onReqChange,
  onStartOptimization,
  onOpenCalculator,
  latestScheduleCost,
  warningCount,
  lastOptimizationResult,
}: SettingsOverviewTabProps) {
  const [editingSection, setEditingSection] = useState<SectionKey>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsSaving(false)

    const currentSection = editingSection
    setEditingSection(null)

    const titles: Record<string, string> = {
      staffing: 'dinh bien',
      peakHours: 'gio cao diem',
      seasonal: 'mua vu',
    }

    toast.success(`Da luu cai dat ${titles[currentSection || 'staffing']}`)
  }

  const actionCards = [
    {
      title: 'Can lam truoc khi xep lich',
      value: warningCount > 0 ? `${warningCount} muc can ra soat` : 'Da san sang',
      note: warningCount > 0
        ? 'Nen xu ly cac diem vuot nguong truoc khi tao lich tuan.'
        : 'Khong co canh bao lon tu workspace hien tai.',
      tone: warningCount > 0 ? 'warn' : 'good',
      icon: <AlertTriangle size={18} />,
    },
    {
      title: 'Chi phi muc tieu',
      value: `${(latestScheduleCost / 1000000).toFixed(1)} tr/tuan`,
      note: 'Dung con so nay de so sanh khi tang giam nguoi theo gio cao diem.',
      tone: 'neutral',
      icon: <Calculator size={18} />,
    },
    {
      title: 'Buoc tiep theo de xuat',
      value: lastOptimizationResult ? 'Ra soat phuong an da chon' : 'Mo phan tich chi tiet',
      note: lastOptimizationResult
        ? `${lastOptimizationResult.planName} la phuong an gan nhat ban da chot.`
        : 'He thong chua co phuong an duoc chot cho quyen chi nhanh nay.',
      tone: 'neutral',
      icon: <Sparkles size={18} />,
    },
  ] as const

  const explanationRows = [
    {
      title: 'Dinh bien co ban',
      detail: 'Muc nay tra loi cau hoi moi ca can toi thieu bao nhieu nguoi va vai tro nao bat buoc phai co.',
    },
    {
      title: 'Gio cao diem',
      detail: 'Muc nay cho biet khi khung trua, toi hoac don app tang manh thi nen cong them bao nhieu nguoi.',
    },
    {
      title: 'Mua vu va chien dich',
      detail: 'Muc nay de phong truoc cac dot he, tet, khai truong, uu dai va cac ngay doanh thu bat thuong.',
    },
    {
      title: 'Phuong an toi uu',
      detail: 'Phan tich giup so sanh chi phi, do on dinh va rui ro de chon cach bo tri phu hop.',
    },
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <Settings size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900">Thiet lap van hanh va nhu cau nhan su</h2>
              <p className="mt-1 text-sm text-gray-500">
                Day la noi de chot quy tac cho chi nhanh: ca can bao nhieu nguoi, gio nao can tang nguoi,
                mua nao can phong them, va phuong an nao hop ly nhat truoc khi xep lich.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {actionCards.map((card) => (
              <div
                key={card.title}
                className={`rounded-2xl border p-4 ${
                  card.tone === 'warn'
                    ? 'border-amber-200 bg-amber-50'
                    : card.tone === 'good'
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <span className="rounded-full bg-white/80 p-1.5 text-gray-700">{card.icon}</span>
                  {card.title}
                </div>
                <div className="mt-3 text-lg font-bold text-gray-900">{card.value}</div>
                <p className="mt-1 text-xs text-gray-600">{card.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Giai thich nhanh</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">Vi sao he thong de xuat nhu vay?</h3>
            </div>
            <button
              type="button"
              onClick={onOpenCalculator}
              className="rounded-full border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
            >
              Mo may tinh nhanh
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {explanationRows.map((row, index) => (
              <div key={row.title} className="flex gap-3 rounded-2xl border border-gray-100 bg-vanilla-50 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary-600 shadow-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{row.title}</div>
                  <p className="mt-1 text-sm text-gray-500">{row.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
              <Clock3 size={16} />
              Cach dung de nhanh va dung thu tu
            </div>
            <p className="mt-2 text-sm text-primary-700/90">
              1. Chot dinh bien. 2. Cong them nguoi o gio cao diem. 3. Nhan he so mua vu. 4. Chay phan tich.
              5. Chuyen sang tab lich tuan de chot ap dung.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <StaffingSectionView selectedStore={selectedStore} onEdit={() => setEditingSection('staffing')} />
        <PeakHoursSectionView onEdit={() => setEditingSection('peakHours')} />
        <SeasonalSectionView onEdit={() => setEditingSection('seasonal')} />
        <OptimizationSection
          lastResult={lastOptimizationResult}
          onStartOptimization={onStartOptimization}
          onViewDetail={onStartOptimization}
        />
      </section>

      {editingSection && (
        <EditDrawer
          isOpen={Boolean(editingSection)}
          onClose={() => setEditingSection(null)}
          title={sectionMeta[editingSection]?.title || ''}
          size={sectionMeta[editingSection]?.size || 'md'}
          onSave={handleSave}
          isSaving={isSaving}
        >
          {editingSection === 'staffing' && (
            <StaffingSectionEdit selectedStore={selectedStore} onReqChange={onReqChange} />
          )}
          {editingSection === 'peakHours' && <PeakHoursSectionEdit />}
          {editingSection === 'seasonal' && <SeasonalSectionEdit />}
        </EditDrawer>
      )}
    </div>
  )
}
