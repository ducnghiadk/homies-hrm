'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { format } from 'date-fns'
import {
  ChevronLeft, Save, RotateCcw, Heart, Clock, Bell,
  ToggleLeft, ToggleRight, Calendar, AlertTriangle,
  CheckCircle, Info,
} from 'lucide-react'

// Mock preferences settings
interface PreferenceSettings {
  enabled: boolean
  deadlineDays: number  // Số ngày trước thứ 2 để đăng ký
  reminderEnabled: boolean
  reminderDaysBefore: number
  requireReason: boolean  // Bắt buộc nhập lý do khi nghỉ
  autoMatchEnabled: boolean  // Tự động ưu tiên preference khi xếp ca
  minMatchRate: number  // Tỷ lệ match tối thiểu để chấp nhận lịch (0-100)
}

const DEFAULT_SETTINGS: PreferenceSettings = {
  enabled: true,
  deadlineDays: 3,
  reminderEnabled: true,
  reminderDaysBefore: 1,
  requireReason: true,
  autoMatchEnabled: true,
  minMatchRate: 50,
}

// Mock saved settings (persisted in memory)
let savedSettings: PreferenceSettings = { ...DEFAULT_SETTINGS }

export default function PreferenceSettingsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)
  const [settings, setSettings] = useState<PreferenceSettings>(savedSettings)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user) return null

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const updateSetting = <K extends keyof PreferenceSettings>(key: K, value: PreferenceSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    savedSettings = { ...settings }
    showToast('✅ Đã lưu cài đặt thành công!')
  }

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS })
    showToast('🔄 Đã khôi phục cài đặt mặc định')
  }

  // Calculate next deadline (next Monday - deadlineDays)
  const getNextDeadline = () => {
    const now = new Date()
    const nextMonday = new Date(now)
    const dayOfWeek = now.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7
    nextMonday.setDate(now.getDate() + daysUntilMonday)
    nextMonday.setDate(nextMonday.getDate() - settings.deadlineDays)
    return nextMonday
  }

  return (
    <AppShell showNav>
      <div className="space-y-5 animate-fade-in font-['Inter'] pb-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-dark-700">Đăng ký ca mong muốn</h1>
            <p className="text-xs text-gray-400">Cấu hình tính năng cho nhân viên đăng ký ca làm việc</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-error-50 to-error-100 border border-pink-100 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Heart size={24} className="text-pink-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-pink-700">Tính năng Preference</p>
              <p className="text-xs text-pink-600 mt-0.5">
                Nhân viên đăng ký ca mong muốn → Hệ thống ưu tiên khi xếp lịch
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Deadline tiếp theo</p>
              <p className="text-sm font-bold text-dark-700">
                {format(getNextDeadline(), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          
          {/* 1. Enable/Disable */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                  <ToggleRight size={20} className="text-success-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-dark-700">Bật tính năng</p>
                  <p className="text-xs text-gray-400">Cho phép nhân viên đăng ký ca mong muốn</p>
                </div>
              </div>
              <button 
                onClick={() => updateSetting('enabled', !settings.enabled)}
                className="relative"
              >
                {settings.enabled
                  ? <ToggleRight size={36} className="text-success-500" />
                  : <ToggleLeft size={36} className="text-gray-300" />
                }
              </button>
            </div>
          </div>

          {/* 2. Deadline */}
          {settings.enabled && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Calendar size={20} className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-dark-700">Hạn đăng ký</p>
                    <p className="text-xs text-gray-400">Số ngày trước thứ 2 để nhân viên đăng ký</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 5, 7].map(days => (
                    <button
                      key={days}
                      onClick={() => updateSetting('deadlineDays', days)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                        settings.deadlineDays === days
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-200'
                      }`}
                    >
                      {days} ngày
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                  <Clock size={14} />
                  <span>Deadline tiếp theo: <strong className="text-dark-700">{format(getNextDeadline(), 'dd/MM/yyyy')}</strong></span>
                </div>
              </div>

              {/* 3. Reminder */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                      <Bell size={20} className="text-warning-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-700">Nhắc nhở tự động</p>
                      <p className="text-xs text-gray-400">Gửi thông báo khi chưa đăng ký</p>
                    </div>
                  </div>
                  <button onClick={() => updateSetting('reminderEnabled', !settings.reminderEnabled)}>
                    {settings.reminderEnabled
                      ? <ToggleRight size={36} className="text-success-500" />
                      : <ToggleLeft size={36} className="text-gray-300" />
                    }
                  </button>
                </div>

                {settings.reminderEnabled && (
                  <div className="pl-14">
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">
                      Nhắc trước khi hết hạn
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(days => (
                        <button
                          key={days}
                          onClick={() => updateSetting('reminderDaysBefore', days)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                            settings.reminderDaysBefore === days
                              ? 'bg-warning-500 text-white border-warning-500'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {days} ngày
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Require Reason */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-700">Bắt buộc lý do nghỉ</p>
                      <p className="text-xs text-gray-400">Khi đăng ký &quot;Không thể làm&quot; cần nhập lý do</p>
                    </div>
                  </div>
                  <button onClick={() => updateSetting('requireReason', !settings.requireReason)}>
                    {settings.requireReason
                      ? <ToggleRight size={36} className="text-success-500" />
                      : <ToggleLeft size={36} className="text-gray-300" />
                    }
                  </button>
                </div>
              </div>

              {/* 5. Auto Match */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                      <CheckCircle size={20} className="text-success-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-700">Tự động ưu tiên preference</p>
                      <p className="text-xs text-gray-400">Khi xếp lịch, ưu tiên ca theo đăng ký của nhân viên</p>
                    </div>
                  </div>
                  <button onClick={() => updateSetting('autoMatchEnabled', !settings.autoMatchEnabled)}>
                    {settings.autoMatchEnabled
                      ? <ToggleRight size={36} className="text-success-500" />
                      : <ToggleLeft size={36} className="text-gray-300" />
                    }
                  </button>
                </div>

                {settings.autoMatchEnabled && (
                  <div className="pl-14 space-y-2">
                    <label className="text-xs text-gray-500 font-medium block">
                      Tỷ lệ phù hợp tối thiểu để chấp nhận lịch
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={settings.minMatchRate}
                        onChange={e => updateSetting('minMatchRate', Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                      <span className="w-12 text-center font-bold text-dark-700">
                        {settings.minMatchRate}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Nếu dưới ngưỡng này, hệ thống sẽ cảnh báo Manager trước khi xuất bản
                    </p>
                  </div>
                )}
              </div>

              {/* 6. Stats Preview */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={16} className="text-gray-400" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thống kê</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-primary-600">85%</p>
                    <p className="text-xs text-gray-500">Đã đăng ký tuần này</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-success-600">92%</p>
                    <p className="text-xs text-gray-500">Tỷ lệ match trung bình</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-warning-600">3</p>
                    <p className="text-xs text-gray-500">Vi phạm tuần này</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Save / Reset */}
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-primary-500 text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-sm"
          >
            <Save size={16} /> Lưu thay đổi
          </button>
          <button 
            onClick={handleReset}
            className="py-3 px-5 rounded-2xl bg-gray-100 text-gray-500 text-sm font-medium flex items-center gap-2 active:scale-[0.97] transition-transform"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
