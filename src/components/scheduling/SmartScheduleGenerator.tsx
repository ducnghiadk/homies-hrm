'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  format, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays
} from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  CalendarDays, Users, Flame, CheckCircle, ChevronLeft, ChevronRight,
  AlertTriangle, RotateCw, Settings, Wallet, BarChart3, Clock
} from 'lucide-react'

// Mock Data & Logic
import {
  type ScheduleJob, type ScheduleResult, type StaffAttribute,
  type SchedulingConstraint, type HourlyTrafficPattern,
  getMockStaffAttributes, MOCK_CONSTRAINTS, MOCK_TRAFFIC_PATTERN,
  getSmartSchedule
} from '@/lib/mock-data-smart-schedule'

// Result View
import ScheduleResultView from './ScheduleResultView'

// Drag-Drop Editor
import DragDropScheduleEditor from './DragDropScheduleEditor'

interface Props {
  prefilledConfig?: any
  onPublish?: (result: ScheduleResult) => void
}

const STEPS = [
  { id: 1, title: 'Chọn tuần', icon: CalendarDays },
  { id: 2, title: 'Nhân viên', icon: Users },
  { id: 3, title: 'Ràng buộc', icon: Settings },
  { id: 4, title: 'Traffic', icon: Flame },
]

export default function SmartScheduleGenerator({ prefilledConfig, onPublish }: Props) {
  // State
  const [currentStep, setCurrentStep] = useState(1)
  const [weekSeed, setWeekSeed] = useState(new Date()) // Default to current week
  const [staffList, setStaffList] = useState<StaffAttribute[]>([])
  const [constraints, setConstraints] = useState<SchedulingConstraint[]>(MOCK_CONSTRAINTS)
  const [trafficPattern, setTrafficPattern] = useState<HourlyTrafficPattern[]>(MOCK_TRAFFIC_PATTERN)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<ScheduleResult | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Init
  useEffect(() => {
    setStaffList(getMockStaffAttributes())
  }, [])

  // Derived State
  const weekStart = startOfWeek(weekSeed, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(weekSeed, { weekStartsOn: 1 })
  const weekLabel = `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM/yyyy')}`

  // Handlers
  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(c => c + 1)
    else handleGenerate()
  }

  const handleBack = () => {
    if (result) {
        if (confirm('Bạn muốn quay lại chỉnh sửa? Kết quả hiện tại sẽ mất.')) {
            setResult(null)
            setCurrentStep(4)
        }
    } else {
        if (currentStep > 1) setCurrentStep(c => c - 1)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Validate
    if (staffList.filter(s => !s.unavailableDates?.includes('ALL')).length === 0) {
        alert('Cần ít nhất 1 nhân viên khả dụng!')
        setIsGenerating(false)
        return
    }

    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500))

    const job: ScheduleJob = {
        weekStart,
        storeId: 'store-001',
        availableStaff: staffList,
        constraints,
        trafficPattern
    }
    
    try {
        const schedule = getSmartSchedule(job)
        setResult(schedule)
    } catch (e) {
        console.error(e)
        alert('Có lỗi xảy ra khi tạo lịch. Vui lòng thử lại.')
    } finally {
        setIsGenerating(false)
    }
  }

  // --- Render Steps ---

  const renderStep1_Week = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-2">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={32} className="text-primary" />
        </div>
        <h3 className="text-lg font-bold">Bạn muốn xếp lịch cho tuần nào?</h3>
        <p className="text-muted-foreground text-sm">Chọn tuần để bắt đầu. Hệ thống sẽ tự động tải các sự kiện và yêu cầu nghỉ phép.</p>
      </div>

      <div className="flex items-center justify-center gap-4 py-6 bg-gray-50 rounded-xl border border-gray-100">
        <button onClick={() => setWeekSeed(subWeeks(weekSeed, 1))} 
          className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center min-w-[200px]">
            <div className="text-xs font-semibold text-primary uppercase mb-1">Tuần {format(weekSeed, 'ww', { locale: vi })}</div>
            <div className="text-xl font-bold text-gray-900">{weekLabel}</div>
        </div>
        <button onClick={() => setWeekSeed(addWeeks(weekSeed, 1))}
          className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  )

  const renderStep2_Staff = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold flex items-center gap-2">
            <Users size={18} /> Danh sách nhân viên ({staffList.length})
        </h4>
        <button className="text-xs text-primary font-medium hover:underline">+ Thêm nhân viên</button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {staffList.map(staff => (
            <div key={staff.employeeId} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                    <input type="checkbox" 
                        checked={!staff.unavailableDates?.includes('ALL')}
                        onChange={(e) => {
                            const newUnavailable = e.target.checked 
                                ? (staff.unavailableDates?.filter(d => d !== 'ALL') || [])
                                : [...(staff.unavailableDates || []), 'ALL']
                            setStaffList(staffList.map(s => s.employeeId === staff.employeeId ? { ...s, unavailableDates: newUnavailable } : s))
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" 
                    />
                    <div>
                        <div className="font-bold text-sm text-gray-900">{staff.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded ${staff.type === 'fulltime' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                {staff.type === 'fulltime' ? 'Full-time' : 'Part-time'}
                            </span>
                            <span>•</span>
                            <span>{staff.position === 'store_manager' ? 'Quản lý' : (staff.position === 'barista' ? 'Pha chế' : (staff.position === 'cashier' ? 'Thu ngân' : 'Hỗ trợ'))}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-medium text-gray-500">Max {staff.maxHoursPerWeek}h/tuần</div>
                    {staff.unavailableDates && staff.unavailableDates.length > 0 && !staff.unavailableDates.includes('ALL') && (
                        <div className="text-xs text-red-500 mt-1">Nghỉ {staff.unavailableDates.length} ngày</div>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  )

  const renderStep3_Constraints = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
       <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-sm text-blue-800">
         <RotateCw size={18} className="shrink-0 mt-0.5" />
         <div>
            Ràng buộc giúp hệ thống tạo lịch hợp lý hơn. Bạn có thể bật/tắt hoặc chỉnh sửa giá trị.
         </div>
       </div>

       <div className="space-y-3">
         {constraints.map(c => (
            <div key={c.id} className={`p-4 rounded-xl border transition-all ${c.isActive ? 'bg-white border-primary/40 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                <div className="flex items-start gap-3">
                    <input type="checkbox"
                        checked={c.isActive}
                        onChange={(e) => setConstraints(constraints.map(i => i.id === c.id ? { ...i, isActive: e.target.checked } : i))}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                        <div className="font-semibold text-gray-900">{c.label}</div>
                        {c.value !== undefined && c.isActive && (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500">Giá trị: </span>
                                <input type="number" 
                                    value={c.value}
                                    onChange={(e) => setConstraints(constraints.map(i => i.id === c.id ? { ...i, value: Number(e.target.value) } : i))}
                                    className="w-16 p-1 text-sm border rounded text-center"
                                />
                            </div>
                        )}
                    </div>
                    {c.isActive && <div className="text-primary"><CheckCircle size={16} /></div>}
                </div>
            </div>
         ))}
       </div>
    </div>
  )

  const renderStep4_Traffic = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center mb-4">
            <h3 className="font-bold text-gray-900">Xác nhận nhu cầu nhân sự</h3>
            <p className="text-sm text-muted-foreground">Dựa trên dữ liệu bán hàng quá khứ (hoặc cấu hình Tối ưu)</p>
        </div>

        {/* Simple Heatmap Visualization Mock */}
        <div className="border rounded-xl overflow-hidden">
            <div className="flex text-xs font-bold bg-gray-100 border-b">
                <div className="w-12 p-2">Giờ</div>
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="flex-1 p-2 text-center border-l border-gray-200">{d}</div>
                ))}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
                {Array.from({ length: 16 }, (_, i) => i + 7).map(h => (
                    <div key={h} className="flex border-b last:border-0 text-xs">
                        <div className="w-12 p-1.5 font-medium text-gray-500 text-center border-r bg-gray-50">{h}h</div>
                        {Array.from({ length: 7 }, (_, d) => {
                            const demand = trafficPattern.find(p => p.dayOfWeek === d && p.hour === h)?.staffNeeded || 0
                            let bgClass = 'bg-white'
                            if (demand >= 4) bgClass = 'bg-red-100 text-red-700 font-bold'
                            else if (demand === 3) bgClass = 'bg-orange-50 text-orange-600'
                            
                            return (
                                <div key={d} className={`flex-1 p-1.5 text-center border-r last:border-0 ${bgClass}`}>
                                    {demand}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 flex gap-2">
            <AlertTriangle size={14} className="mt-0.5" />
            Lưu ý: Giờ cao điểm (màu đỏ) cần ít nhất 4 nhân viên. Hệ thống sẽ ưu tiên xếp Part-time vào các khung giờ này.
        </div>
    </div>
  )

  // --- Main Render ---

  if (result && isEditing) {
    return (
      <DragDropScheduleEditor
        schedule={result}
        staffList={staffList}
        trafficPattern={trafficPattern}
        constraints={constraints}
        onConfirm={(updatedResult) => {
          setResult(updatedResult)
          setIsEditing(false)
        }}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  if (result) {
    return (
        <ScheduleResultView 
            result={result} 
            weekLabel={weekLabel}
            onBack={handleBack}
            onRegenerate={handleGenerate}
            onEdit={() => setIsEditing(true)}
            onPublish={onPublish}
        />
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm transition-all duration-500`}>
                {currentStep}
            </div>
            <div>
                <h2 className="font-bold text-gray-900">{STEPS[currentStep-1].title}</h2>
                <div className="text-xs text-muted-foreground">Bước {currentStep} / {STEPS.length}</div>
            </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-1">
            {STEPS.map(s => (
                <div key={s.id} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${s.id <= currentStep ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 relative">
        {isGenerating ? (
            <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="text-center">
                    <h3 className="font-bold text-lg text-primary">Đang tạo lịch tối ưu...</h3>
                    <p className="text-sm text-gray-500">Đang phân tích {staffList.length} nhân viên và {constraints.filter(c => c.isActive).length} ràng buộc</p>
                </div>
            </div>
        ) : (
            <>
                {currentStep === 1 && renderStep1_Week()}
                {currentStep === 2 && renderStep2_Staff()}
                {currentStep === 3 && renderStep3_Constraints()}
                {currentStep === 4 && renderStep4_Traffic()}
            </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
        <button 
            onClick={handleBack}
            disabled={currentStep === 1 || isGenerating}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            Quay lại
        </button>
        
        <button
            onClick={handleNext}
            disabled={isGenerating}
            className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-70 transition-all shadow-sm shadow-primary/30 flex items-center gap-2"
        >
            {currentStep === 4 ? (
                <>
                    <RotateCw size={16} className={isGenerating ? "animate-spin" : ""} />
                    {isGenerating ? 'Đang xử lý...' : 'TẠO LỊCH TỰ ĐỘNG'}
                </>
            ) : (
                <>Tiếp tục <ChevronRight size={16} /></>
            )}
        </button> 
      </div>
    </div>
  )
}
