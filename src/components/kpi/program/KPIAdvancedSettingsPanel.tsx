'use client'

import React, { useEffect } from 'react'
import { X, SlidersHorizontal, Layers, Target, AlertCircle, Sparkles } from 'lucide-react'

export type KPIAdvancedSettingsPanelProps = {
  open: boolean
  activeSection: 'criteria' | 'targets' | 'overrides' | 'single_stage'
  onSectionChange(section: 'criteria' | 'targets' | 'overrides' | 'single_stage'): void
  onClose(): void
  children: React.ReactNode
}

const SECTIONS: Array<{
  key: 'criteria' | 'targets' | 'overrides' | 'single_stage'
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}> = [
  { key: 'criteria', label: '1. Tiêu Chí & Trọng Số', icon: Layers },
  { key: 'targets', label: '2. Mục Tiêu Nhóm Quán', icon: Target },
  { key: 'overrides', label: '3. Ngoại Lệ Riêng Từng Quán', icon: AlertCircle },
  { key: 'single_stage', label: '4. Ngoại Lệ Đơn Chặng', icon: SlidersHorizontal },
]

export function KPIAdvancedSettingsPanel({
  open,
  activeSection,
  onSectionChange,
  onClose,
  children,
}: KPIAdvancedSettingsPanelProps) {
  // Đóng khi nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="flex h-full w-full max-w-5xl flex-col bg-[#FFF8E8] shadow-2xl border-l border-gray-200 animate-in slide-in-from-right duration-300">
        {/* HEADER PANEL */}
        <div className="sticky top-0 z-10 flex flex-col justify-between border-b border-gray-100 bg-white px-6 py-4 shadow-xs gap-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-[#2F6FA8]">
                <SlidersHorizontal size={13} />
                <span>Cấu Hình Nâng Cao (Chuyên Sâu)</span>
              </div>
              <h2 className="text-base font-bold text-[#001D3D] sm:text-lg">
                Tùy chỉnh chi tiết tiêu chí, target và ngoại lệ
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
              title="Đóng bảng nâng cao"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" />
              <span>Phần này dành cho người cần chỉnh sâu. Bộ chuẩn Homies đã điền sẵn.</span>
            </p>

            {/* TABS CHUYỂN SECTION */}
            <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 text-xs font-bold">
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.key
                const Icon = sec.icon

                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => onSectionChange(sec.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2F6FA8] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{sec.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* NỘI DUNG PANEL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}
