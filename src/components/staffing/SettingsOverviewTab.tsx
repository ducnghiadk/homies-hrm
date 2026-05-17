'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import EditDrawer from '@/components/ui/EditDrawer'
import { StaffingSectionView, StaffingSectionEdit } from './settings-sections/StaffingSection'
import { PeakHoursSectionView, PeakHoursSectionEdit } from './settings-sections/PeakHoursSection'
import { SeasonalSectionView, SeasonalSectionEdit } from './settings-sections/SeasonalSection'
import { OptimizationSection } from './settings-sections/OptimizationSection'
import { toast } from 'sonner'

type SectionKey = 'staffing' | 'peakHours' | 'seasonal' | null

interface SettingsOverviewTabProps {
  selectedStore: string
  onReqChange: (shiftId: string, posId: string, val: number) => void
  onStartOptimization: () => void
  lastOptimizationResult?: {
    planName: string
    fulltime: number
    parttime: number
    totalCost: number
    date: string
  }
}

const sectionMeta: Record<Exclude<SectionKey, null>, { title: string; size: 'sm' | 'md' | 'lg' }> = {
  staffing: { title: 'Sửa Định biên', size: 'lg' },
  peakHours: { title: 'Sửa Giờ cao điểm', size: 'md' },
  seasonal: { title: 'Sửa Điều chỉnh theo mùa', size: 'md' },
}

export default function SettingsOverviewTab({
  selectedStore,
  onReqChange,
  onStartOptimization,
  lastOptimizationResult,
}: SettingsOverviewTabProps) {
  const [editingSection, setEditingSection] = useState<SectionKey>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save
    await new Promise(r => setTimeout(r, 600))
    setIsSaving(false)
    setEditingSection(null)

    const titles: Record<string, string> = {
      staffing: 'Định biên',
      peakHours: 'Giờ cao điểm',
      seasonal: 'Mùa vụ',
    }
    toast.success(`✅ Đã lưu cài đặt ${titles[editingSection!] || ''}`)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Settings size={20} className="text-gray-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Cài đặt & Định biên</h2>
          <p className="text-sm text-gray-500">Thiết lập quy tắc nhân sự cho quán của bạn</p>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StaffingSectionView
          selectedStore={selectedStore}
          onEdit={() => setEditingSection('staffing')}
        />
        <PeakHoursSectionView
          onEdit={() => setEditingSection('peakHours')}
        />
        <SeasonalSectionView
          onEdit={() => setEditingSection('seasonal')}
        />
        <OptimizationSection
          lastResult={lastOptimizationResult}
          onStartOptimization={onStartOptimization}
        />
      </div>

      {/* Edit Drawer */}
      {editingSection && (
        <EditDrawer
          isOpen={!!editingSection}
          onClose={() => setEditingSection(null)}
          title={sectionMeta[editingSection]?.title || ''}
          size={sectionMeta[editingSection]?.size || 'md'}
          onSave={handleSave}
          isSaving={isSaving}
        >
          {editingSection === 'staffing' && (
            <StaffingSectionEdit
              selectedStore={selectedStore}
              onReqChange={onReqChange}
            />
          )}
          {editingSection === 'peakHours' && (
            <PeakHoursSectionEdit />
          )}
          {editingSection === 'seasonal' && (
            <SeasonalSectionEdit />
          )}
        </EditDrawer>
      )}
    </div>
  )
}
