'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { format, startOfWeek, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ChevronLeft, Bell, Filter,
} from 'lucide-react'

// Import preference data
import {
  getAllPreferencesForWeek,
  getShiftPreferenceAvailability,
  type ShiftPreference,
} from '@/lib/mock-data-preferences'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { mockEmployees } from '@/lib/mock-data'

type PreferenceFilter = 'all' | 'submitted' | 'draft' | 'not_started'

export default function PreferenceOverviewPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [filter, setFilter] = useState<PreferenceFilter>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user) return null

  // Calculate week
  const now = new Date()
  const baseWeek = startOfWeek(now, { weekStartsOn: 1 })
  const targetWeek = addDays(baseWeek, weekOffset * 7)
  const weekStartStr = format(targetWeek, 'yyyy-MM-dd')
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(targetWeek, i))

  // Get all employees (mock - in real app filter by store)
  const employees = mockEmployees.filter(e => e.role === 'employee').slice(0, 10)
  
  // Get preferences for this week
  const weekPreferences = getAllPreferencesForWeek(weekStartStr)

  // Build employee preference map
  const employeePrefMap = new Map<string, {
    status: 'submitted' | 'draft' | 'not_started'
    prefs: ShiftPreference[]
    submittedCount: number
    totalDays: number
  }>()

  employees.forEach(emp => {
    const empPrefs = weekPreferences.filter(p => p.user_id === emp.id)
    const hasAny = empPrefs.length > 0
    const status = hasAny ? (empPrefs[0].status === 'submitted' ? 'submitted' : 'draft') : 'not_started'
    
    employeePrefMap.set(emp.id, {
      status,
      prefs: empPrefs,
      submittedCount: empPrefs.filter(p => p.status === 'submitted').length,
      totalDays: 7,
    })
  })

  // Calculate stats
  const stats = {
    total: employees.length,
    submitted: Array.from(employeePrefMap.values()).filter(e => e.status === 'submitted').length,
    draft: Array.from(employeePrefMap.values()).filter(e => e.status === 'draft').length,
    notStarted: Array.from(employeePrefMap.values()).filter(e => e.status === 'not_started').length,
  }

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const empData = employeePrefMap.get(emp.id)
    if (!empData) return filter === 'all' || filter === 'not_started'
    
    switch (filter) {
      case 'submitted': return empData.status === 'submitted'
      case 'draft': return empData.status === 'draft'
      case 'not_started': return empData.status === 'not_started'
      default: return true
    }
  })

  // Handle reminder
  const handleRemind = (empId: string, empName: string) => {
    // In real app, send push notification
    alert(`Đã gửi nhắc nhở đến ${empName}`)
    setRefreshKey(k => k + 1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200' }
      case 'draft': return { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200' }
      default: return { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200' }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return 'Đã gửi'
      case 'draft': return 'Nháp'
      default: return 'Chưa đăng ký'
    }
  }

  return (
    <AppShell showNav>
      <div className="space-y-5 animate-fade-in font-['Inter'] pb-6" key={refreshKey}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-dark-700">Tổng quan đăng ký ca</h1>
            <p className="text-xs text-gray-400">
              Tuần {format(targetWeek, 'dd/MM')} - {format(addDays(targetWeek, 6), 'dd/MM/yyyy')}
            </p>
          </div>
          <button 
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200"
          >
            ←
          </button>
          <button 
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200"
          >
            →
          </button>
        </div>

        {/* Week Selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-center gap-2">
          <button 
            onClick={() => setWeekOffset(w => w - 1)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            ← Tuần trước
          </button>
          <div className="text-center px-4">
            <div className="text-sm font-bold text-dark-700">
              Tuần {format(targetWeek, 'dd/MM')} - {format(addDays(targetWeek, 6), 'dd/MM')}
            </div>
          </div>
          <button 
            onClick={() => setWeekOffset(w => w + 1)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            Tuần sau →
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-black text-gray-700">{stats.total}</p>
            <p className="text-xs text-gray-400">Tổng NV</p>
          </div>
          <div className="bg-success-50 rounded-2xl border border-success-200 p-4 text-center">
            <p className="text-2xl font-black text-success-600">{stats.submitted}</p>
            <p className="text-xs text-success-500">Đã đăng ký</p>
          </div>
          <div className="bg-warning-50 rounded-2xl border border-warning-200 p-4 text-center">
            <p className="text-2xl font-black text-warning-600">{stats.draft}</p>
            <p className="text-xs text-warning-500">Nháp</p>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-gray-400">{stats.notStarted}</p>
            <p className="text-xs text-gray-400">Chưa đăng ký</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([
            { key: 'all' as const, label: 'Tất cả', count: stats.total },
            { key: 'submitted' as const, label: 'Đã gửi', count: stats.submitted },
            { key: 'draft' as const, label: 'Nháp', count: stats.draft },
            { key: 'not_started' as const, label: 'Chưa đăng ký', count: stats.notStarted },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                filter === f.key 
                  ? 'bg-white text-dark-700 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === f.key ? 'bg-gray-100' : 'bg-gray-200'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Employee List */}
        <div className="space-y-2">
          {filteredEmployees.map(emp => {
            const empData = employeePrefMap.get(emp.id)
            const status = empData?.status || 'not_started'
            const colors = getStatusColor(status)
            
            return (
              <div 
                key={emp.id} 
                className={`bg-white rounded-2xl border ${colors.border} p-4 transition-all`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${colors.bg.replace('-50', '-100').replace('bg-', 'bg-')}`}>
                      {emp.full_name.split(' ').pop()?.[0] || emp.full_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-700">{emp.full_name}</p>
                      <p className="text-xs text-gray-400">{emp.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${colors.bg} ${colors.text}`}>
                      {getStatusLabel(status)}
                    </span>
                    {status === 'not_started' && (
                      <button 
                        onClick={() => handleRemind(emp.id, emp.full_name)}
                        className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors"
                        title="Nhắc nhở"
                      >
                        <Bell size={14} className="text-primary-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Day Status */}
                <div className="flex gap-1">
                  {weekDates.map((date, idx) => {
                    const dateStr = format(date, 'yyyy-MM-dd')
                    const pref = empData?.prefs.find(p => p.date === dateStr)
                    
                    const activeTemplates = pref && !pref.not_available
                      ? ShiftTemplateService.getActiveForStore(emp.store_id).filter(template => getShiftPreferenceAvailability(pref, template.id))
                      : []
                    let dayStatus: 'available' | 'off' | 'none' = 'none'
                    if (pref?.not_available) {
                      dayStatus = 'off'
                    } else if (activeTemplates.length > 0) {
                      dayStatus = 'available'
                    }
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex-1 py-1.5 rounded-lg text-center text-xs font-medium transition-colors ${
                          dayStatus === 'off' 
                            ? 'bg-error-100 text-error-600' 
                            : dayStatus === 'available'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-50 text-gray-400'
                        }`}
                        title={format(date, 'EEE dd/MM', { locale: vi })}
                      >
                        {activeTemplates.length > 0
                          ? activeTemplates.slice(0, 2).map(template => template.code?.[0] || template.name?.[0] || 'C').join('')
                          : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][idx]}
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <div className="w-2 h-2 rounded bg-primary-400" /> Sáng
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <div className="w-2 h-2 rounded bg-warning-400" /> Chiều
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <div className="w-2 h-2 rounded bg-primary-400" /> Tối
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <div className="w-2 h-2 rounded bg-error-400" /> Nghỉ
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <div className="w-2 h-2 rounded bg-gray-200" /> Chưa
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Filter size={24} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Không có nhân viên phù hợp</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
