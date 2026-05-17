'use client'

import { useState } from 'react'
import {
  format, parseISO, addDays
} from 'date-fns'
import {
  AlertTriangle, CheckCircle, Clock, DollarSign,
  BarChart3, Calendar, RotateCcw, Share, LayoutGrid, List, Pencil, Lightbulb
} from 'lucide-react'

import {
  type ScheduleResult
} from '@/lib/mock-data-smart-schedule'

interface Props {
  result: ScheduleResult
  weekLabel: string
  onBack: () => void
  onRegenerate: () => void
  onEdit?: (result: ScheduleResult) => void
  onPublish?: (result: ScheduleResult) => void
}

export default function ScheduleResultView({ result, weekLabel, onBack, onRegenerate, onEdit, onPublish }: Props) {
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('grid')
  const [showPublishModal, setShowPublishModal] = useState(false)
  
  const stats = result.stats
  const warnings = result.warnings

  // --- Helpers ---
  const getEmployeeShifts = (empId: string) => result.shifts.filter(s => s.employeeId === empId)
  const uniqueEmployees = Array.from(new Set(result.shifts.map(s => s.employeeId)))
    .map(id => {
        const s = result.shifts.find(s => s.employeeId === id)
        return { id, name: s?.employeeName || 'Unknown' }
    })

  // --- Render Components ---

  const renderStats = () => (
    <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Tổng giờ</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}h</div>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Clock size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Chi phí lương</div>
                <div className="text-2xl font-bold text-gray-900">{(stats.totalCost / 1000000).toFixed(1)}M</div>
            </div>
            <div className="bg-green-50 p-2 rounded-lg text-green-600"><DollarSign size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Số ca xếp</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalShifts}</div>
            </div>
            <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Calendar size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Cảnh báo</div>
                <div className={`text-2xl font-bold ${warnings.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{warnings.length}</div>
            </div>
            <div className={`p-2 rounded-lg ${warnings.length > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}><AlertTriangle size={20} /></div>
        </div>
    </div>
  )

  const renderWarnings = () => {
    if (warnings.length === 0) return null
    return (
        <div className="mb-6 space-y-2">
            {warnings.map(w => (
                <div key={w.id} className="bg-red-50 border border-red-100 p-3 rounded-lg flex gap-3 text-sm animate-in slide-in-from-top-2">
                    <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="font-semibold text-red-800">{w.message}</div>
                        {w.suggestion && <div className="text-red-600 mt-1 text-xs flex items-center gap-1"><Lightbulb size={11} /> Gợi ý: {w.suggestion}</div>}
                    </div>
                    <button className="text-xs font-bold text-red-700 hover:underline px-2 py-1 bg-white/50 rounded border border-red-200 h-fit">
                        Sửa nhanh
                    </button>
                </div>
            ))}
        </div>
    )
  }

  const renderGridView = () => (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                        <th className="px-4 py-3 font-medium w-40 sticky left-0 bg-gray-50 z-10">Nhân viên</th>
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                            <th key={d} className="px-4 py-3 font-medium text-center min-w-[100px] border-l">{d}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {uniqueEmployees.map(emp => (
                        <tr key={emp.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                {emp.name}
                            </td>
                            {Array.from({ length: 7 }, (_, i) => {
                                const dayDate = addDays(parseISO(result.weekStart), i)
                                const dateStr = format(dayDate, 'yyyy-MM-dd')
                                const shifts = getEmployeeShifts(emp.id).filter(s => s.date === dateStr)
                                
                                return (
                                    <td key={i} className="px-2 py-2 border-l h-16 relative group">
                                        {shifts.map(s => (
                                            <div key={s.id} className="text-xs bg-blue-100/50 text-blue-700 px-1.5 py-1 rounded mb-1 border border-blue-200/50 truncate hover:bg-blue-200 cursor-pointer transition-colors" title={`${s.startTime} - ${s.endTime} (${s.position})`}>
                                                <span className="font-bold">{s.startTime}-{s.endTime}</span>
                                                <div className="text-xs opacity-70">{s.position === 'barista' ? 'PC' : (s.position === 'cashier' ? 'TN' : 'PV')}</div>
                                            </div>
                                        ))}
                                        {shifts.length === 0 && <div className="text-center text-gray-300 text-xs">-</div>}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  )

  const renderTimelineView = () => (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm p-4 text-center text-gray-500 py-20">
        <BarChart3 size={48} className="mx-auto mb-4 text-gray-200" />
        <h3 className="text-lg font-medium text-gray-900">Timeline View (Phase 2)</h3>
        <p className="text-sm max-w-md mx-auto mt-2">Tính năng kéo thả và xem timeline chi tiết sẽ được cập nhật trong phiên bản tiếp theo.</p>
        <button onClick={() => setViewMode('grid')} className="mt-4 text-primary hover:underline text-sm font-medium">
            Quay lại Grid View
        </button>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <button onClick={onBack} className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-1">
                    ← Quay lại Wizard
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Kết quả xếp ca {weekLabel}</h2>
            </div>
            <div className="flex gap-2">
                <button onClick={onRegenerate} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors">
                    <RotateCcw size={16} /> Xếp lại
                </button>
                {onEdit && (
                    <button
                        onClick={() => onEdit(result)}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                        <Pencil size={16} /> Điều chỉnh
                    </button>
                )}
                <button 
                    onClick={() => setShowPublishModal(true)}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all">
                    <Share size={16} /> Xuất bản
                </button>
            </div>
        </div>

        {renderStats()}
        {renderWarnings()}

        {/* View Toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 w-fit rounded-lg mb-4">
            <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <LayoutGrid size={16} /> Grid View
            </button>
            <button 
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'timeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <List size={16} /> Timeline
            </button>
        </div>

        {viewMode === 'grid' ? renderGridView() : renderTimelineView()}

        {showPublishModal && (
            <PublishModal 
                weekLabel={weekLabel} 
                uniqueEmployees={uniqueEmployees} 
                stats={stats} 
                warnings={warnings} 
                onClose={() => setShowPublishModal(false)}
                onPublish={(r: any) => { setShowPublishModal(false); onPublish?.(r) }}
                result={result}
            />
        )}
    </div>
  )
}

interface PublishModalProps {
  weekLabel: string
  uniqueEmployees: { id: string; name: string }[]
  stats: { totalCost: number; totalHours: number }
  warnings: { length: number }
  onClose: () => void
  onPublish: (result: ScheduleResult) => void
  result: ScheduleResult
}

function PublishModal({ weekLabel, uniqueEmployees, stats, warnings, onClose, onPublish, result }: PublishModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    <CheckCircle size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Sẵn sàng xuất bản?</h3>
                <p className="text-sm text-gray-500 mt-1">Lịch tuần {weekLabel} sẽ được gửi cho {uniqueEmployees.length} nhân viên.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6 border border-gray-100">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng chi phí:</span>
                    <span className="font-bold text-gray-900">{(stats.totalCost / 1000000).toFixed(1)} triệu</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng giờ làm:</span>
                    <span className="font-bold text-gray-900">{stats.totalHours} giờ</span>
                </div>
                {warnings.length > 0 && (
                    <div className="flex justify-between text-sm text-red-600 bg-red-50 p-2 rounded -mx-2">
                        <span className="flex items-center gap-1"><AlertTriangle size={14}/> Cảnh báo chưa xử lý:</span>
                        <span className="font-bold">{warnings.length}</span>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded" />
                    <span className="text-sm font-medium">Gửi thông báo Push App</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded" />
                    <span className="text-sm font-medium">Gửi Email tổng hợp</span>
                </label>
            </div>

            <div className="flex gap-3 mt-8">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Hủy
                </button>
                <button onClick={() => onPublish?.(result)} className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
                    Xuất bản ngay
                </button>
            </div>
        </div>
    </div>
  )
}
