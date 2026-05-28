'use client'

import { useState } from 'react'
import {
  format, parseISO, addDays
} from 'date-fns'
import {
  AlertTriangle, CheckCircle, Clock, DollarSign,
  BarChart3, RotateCcw, Share, LayoutGrid, List, Pencil, Lightbulb,
  History, Trash2, Sparkles
} from 'lucide-react'

import {
  type ScheduleResult,
  compareWithPreviousWeek
} from '@/lib/mock-data-smart-schedule'
import {
  getScheduleGenerations,
  compareGenerations,
  deleteScheduleGeneration
} from '@/lib/scheduling/generation-history'
import {
  calculatePreferenceStats,
  getWeekPreferences
} from '@/lib/scheduling/preference-aware-scheduler'
import PreferenceAnalysisPanel from './PreferenceAnalysisPanel'

interface Props {
  result: ScheduleResult
  weekLabel: string
  weekStartDate?: Date
  onBack: () => void
  onRegenerate: () => void
  onEdit?: (result: ScheduleResult) => void
  onPublish?: (result: ScheduleResult) => void
  onSelectVersion?: (result: ScheduleResult) => void
}

export default function ScheduleResultView({
  result,
  weekLabel,
  weekStartDate,
  onBack,
  onRegenerate,
  onEdit,
  onPublish,
  onSelectVersion
}: Props) {
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('grid')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [compareWithId, setCompareWithId] = useState<string>('')

  const stats = result.stats
  const warnings = result.warnings

  // 1. Calculate Real Diff with Previous Week
  const comparison = compareWithPreviousWeek(result)

  // 2. Fetch and Analyze Staff Preferences for Active Schedule
  const weekStart = weekStartDate || parseISO(result.weekStart)
  const prefMap = getWeekPreferences(weekStart)
  const { stats: prefStats, matches: prefMatches } = calculatePreferenceStats(result.shifts, prefMap)

  // 3. Fetch History Generations
  const generations = getScheduleGenerations(result.weekStart)

  // --- Helpers ---
  const getEmployeeShifts = (empId: string) => result.shifts.filter(s => s.employeeId === empId)
  const uniqueEmployees = Array.from(new Set(result.shifts.map(s => s.employeeId)))
    .map(id => {
        const s = result.shifts.find(s => s.employeeId === id)
        return { id, name: s?.employeeName || 'Unknown' }
    })

  // --- Render Components ---

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Tổng giờ</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}h</div>
                {comparison.hasPrevious && (
                  <div className={`text-[11px] flex items-center gap-0.5 mt-1 font-medium ${
                    comparison.hourDiff < 0 ? 'text-success-600' : comparison.hourDiff > 0 ? 'text-warning-600' : 'text-gray-500'
                  }`}>
                    {comparison.hourDiff < 0 ? '↓' : comparison.hourDiff > 0 ? '↑' : ''}
                    {Math.abs(comparison.hourDiff).toFixed(1)}h so với tuần trước
                  </div>
                )}
            </div>
            <div className="bg-primary-50 p-2 rounded-lg text-primary-600"><Clock size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Chi phí lương</div>
                <div className="text-2xl font-bold text-gray-900">{(stats.totalCost / 1000000).toFixed(1)}M</div>
                {comparison.hasPrevious && (
                  <div className="mt-0.5">
                    <div className={`text-[11px] flex items-center gap-0.5 font-medium ${
                      comparison.costDiff < 0 ? 'text-success-600' : comparison.costDiff > 0 ? 'text-error-600' : 'text-gray-500'
                    }`}>
                      {comparison.costDiff < 0 ? '↓' : comparison.costDiff > 0 ? '↑' : ''}
                      {Math.abs(comparison.costDiff / 1000000).toFixed(2)}M so với tuần trước
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Hiệu suất: <span className={comparison.efficiencyChange >= 0 ? 'text-success-600 font-bold' : 'text-error-500'}>
                        {comparison.efficiencyChange >= 0 ? '+' : ''}{comparison.efficiencyChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
            </div>
            <div className="bg-success-50 p-2 rounded-lg text-success-600"><DollarSign size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Độ phủ ca</div>
                <div className="text-2xl font-bold text-gray-900">{stats.coveragePercent}%</div>
                {comparison.hasPrevious && (
                  <div className={`text-[11px] flex items-center gap-0.5 mt-1 font-medium ${
                    comparison.coverageDiff > 0 ? 'text-success-600' : comparison.coverageDiff < 0 ? 'text-error-600' : 'text-gray-500'
                  }`}>
                    {comparison.coverageDiff > 0 ? '↑' : comparison.coverageDiff < 0 ? '↓' : ''}
                    {Math.abs(comparison.coverageDiff).toFixed(1)}% so với tuần trước
                  </div>
                )}
            </div>
            <div className="bg-primary-50 p-2 rounded-lg text-primary-600"><BarChart3 size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Cảnh báo</div>
                <div className={`text-2xl font-bold ${warnings.length > 0 ? 'text-error-600' : 'text-gray-900'}`}>{warnings.length}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {warnings.filter(w => w.severity === 'error').length} lỗi nghiêm trọng
                </div>
            </div>
            <div className={`p-2 rounded-lg ${warnings.length > 0 ? 'bg-error-50 text-error-600' : 'bg-gray-50 text-gray-400'}`}><AlertTriangle size={20} /></div>
        </div>
    </div>
  )

  const renderWarnings = () => {
    if (warnings.length === 0) return null
    return (
        <div className="space-y-2">
            {warnings.map(w => (
                <div key={w.id} className="bg-error-50 border border-error-100 p-3 rounded-lg flex gap-3 text-sm animate-in slide-in-from-top-2">
                    <AlertTriangle size={18} className="text-error-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="font-semibold text-error-800">{w.message}</div>
                        {w.suggestion && <div className="text-error-600 mt-1 text-xs flex items-center gap-1"><Lightbulb size={11} /> Gợi ý: {w.suggestion}</div>}
                    </div>
                    <button className="text-xs font-bold text-error-700 hover:underline px-2 py-1 bg-white/50 rounded border border-error-200 h-fit">
                        Sửa nhanh
                    </button>
                </div>
            ))}
        </div>
    )
  }

  const renderHistoryPanel = () => {
    const otherGenerations = generations.filter(g => g.id !== result.id)

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <History size={18} className="text-primary" /> Lịch sử bản thảo
          </h3>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-medium flex-shrink-0">
            {generations.length} phiên bản
          </span>
        </div>

        {/* History List */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {generations.map(gen => {
            const isActive = gen.id === result.id
            return (
              <div 
                key={gen.id} 
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                  isActive 
                    ? 'bg-primary/5 border-primary/30 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-gray-300'
                }`}
              >
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (onSelectVersion && !isActive) {
                      onSelectVersion(gen)
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-xs ${isActive ? 'text-primary' : 'text-gray-700'} truncate`}>
                      {gen.versionLabel || `Bản thảo v${gen.version}`}
                    </span>
                    {isActive && (
                      <span className="text-[9px] bg-primary text-white font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0">
                        Hiện tại
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {gen.stats.totalHours.toFixed(1)}h • {(gen.stats.totalCost / 1000000).toFixed(2)}M • {gen.warnings.length} cảnh báo
                  </div>
                </div>

                {!isActive && (
                  <button 
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn xóa bản thảo này?')) {
                        deleteScheduleGeneration(gen.id)
                        if (generations.length > 1) {
                          const remaining = generations.filter(g => g.id !== gen.id)
                          if (remaining.length > 0 && onSelectVersion) {
                            onSelectVersion(remaining[0])
                          }
                        }
                      }
                    }}
                    className="p-1 hover:bg-error-50 text-gray-400 hover:text-error-500 rounded transition-colors"
                    title="Xóa lịch sử"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Compare Sub-panel */}
        {generations.length >= 2 && (
          <div className="pt-3 border-t border-gray-100 space-y-3 bg-gray-50/50 p-3 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">So sánh bản này với:</span>
              <select 
                value={compareWithId}
                onChange={(e) => setCompareWithId(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:border-primary max-w-[150px]"
              >
                <option value="">-- Chọn bản thảo --</option>
                {otherGenerations.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.versionLabel || `v${g.version}`}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const compareTarget = generations.find(g => g.id === compareWithId)
              if (!compareTarget) return null
              
              const genComp = compareGenerations(compareTarget, result)

              return (
                <div className="bg-white border border-gray-100 rounded-lg p-3 space-y-2 text-xs">
                  <div className="text-[10px] font-bold text-primary uppercase flex items-center gap-1 mb-1">
                    <Sparkles size={11} /> Kết quả so sánh
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500">Chi phí:</span>
                    <span className={`font-bold ${genComp.costDiff < 0 ? 'text-success-600' : genComp.costDiff > 0 ? 'text-error-600' : 'text-gray-500'}`}>
                      {genComp.costDiff > 0 ? '+' : ''}{(genComp.costDiff / 1000000).toFixed(3)}M
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500">Tổng giờ:</span>
                    <span className={`font-bold ${genComp.hourDiff < 0 ? 'text-success-600' : genComp.hourDiff > 0 ? 'text-warning-600' : 'text-gray-500'}`}>
                      {genComp.hourDiff > 0 ? '+' : ''}{genComp.hourDiff.toFixed(1)}h
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500">Độ phủ ca:</span>
                    <span className={`font-bold ${genComp.coverageDiff > 0 ? 'text-success-600' : genComp.coverageDiff < 0 ? 'text-error-600' : 'text-gray-500'}`}>
                      {genComp.coverageDiff > 0 ? '+' : ''}{genComp.coverageDiff.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500">Số cảnh báo:</span>
                    <span className={`font-bold ${genComp.warningCountDiff < 0 ? 'text-success-600' : genComp.warningCountDiff > 0 ? 'text-error-600' : 'text-gray-500'}`}>
                      {genComp.warningCountDiff > 0 ? '+' : ''}{genComp.warningCountDiff}
                    </span>
                  </div>

                  {genComp.preferenceMatchRateDiff !== undefined && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Khớp mong muốn:</span>
                      <span className={`font-bold ${genComp.preferenceMatchRateDiff > 0 ? 'text-success-600' : genComp.preferenceMatchRateDiff < 0 ? 'text-error-600' : 'text-gray-500'}`}>
                        {genComp.preferenceMatchRateDiff > 0 ? '+' : ''}{genComp.preferenceMatchRateDiff}%
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
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
                                            <div key={s.id} className="text-xs bg-primary-100/50 text-primary-700 px-1.5 py-1 rounded mb-1 border border-primary-200/50 truncate hover:bg-primary-200 cursor-pointer transition-colors" title={`${s.startTime} - ${s.endTime} (${s.position})${s.assignmentReason ? ` — ${s.assignmentReason}` : ''}`}>
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
                        className="flex items-center gap-2 px-4 py-2 border border-primary-200 bg-primary-50 rounded-lg text-sm font-bold text-primary-700 hover:bg-primary-100 transition-colors"
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

        {/* 3-Column Layout: Left (Preference analysis + warnings), Right (History) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {renderWarnings()}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <PreferenceAnalysisPanel stats={prefStats} matches={prefMatches} />
            </div>
          </div>
          <div className="space-y-6">
            {renderHistoryPanel()}
          </div>
        </div>

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
                onPublish={(publishedResult: ScheduleResult) => { setShowPublishModal(false); onPublish?.(publishedResult) }}
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
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4 text-success-600">
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
                    <div className="flex justify-between text-sm text-error-600 bg-error-50 p-2 rounded -mx-2">
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
