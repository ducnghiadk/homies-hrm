'use client'

import {
  Heart, AlertTriangle, CheckCircle, Star,
  Clock, TrendingUp, Users
} from 'lucide-react'
import type { PreferenceStats, PreferenceMatch } from '@/lib/scheduling/preference-aware-scheduler'

interface Props {
  stats: PreferenceStats
  matches: PreferenceMatch[]
  onNavigateToWarnings?: () => void
}

export default function PreferenceAnalysisPanel({ stats, matches }: Props) {
  const { 
    totalShifts, 
    preferredCount, 
    acceptedCount, 
    notPreferredCount, 
    unavailableCount, 
    matchRate 
  } = stats

  // Get color based on match rate
  const getMatchRateColor = (rate: number) => {
    if (rate >= 80) return { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', icon: 'text-success-600' }
    if (rate >= 50) return { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700', icon: 'text-warning-600' }
    return { bg: 'bg-error-50', border: 'border-error-200', text: 'text-error-700', icon: 'text-error-600' }
  }

  const rateColors = getMatchRateColor(matchRate)

  // Group matches by preference type for pie chart data
  const pieData = [
    { label: 'Phù hợp', count: preferredCount, color: '#1E9E57', icon: Star },
    { label: 'Chấp nhận', count: acceptedCount, color: '#2F6FA8', icon: CheckCircle },
    { label: 'Không ưu tiên', count: notPreferredCount, color: '#F6C85F', icon: AlertTriangle },
    { label: 'Vi phạm', count: unavailableCount, color: '#D9381E', icon: AlertTriangle },
  ].filter(d => d.count > 0)

  // Get employees with violations
  const violationEmployees = Array.from(
    matches.filter(m => m.preference === 'unavailable' || m.preference === 'not_preferred')
      .reduce((acc, m) => {
        if (!acc.has(m.employeeId)) acc.set(m.employeeId, [])
        acc.get(m.employeeId)!.push(m)
        return acc
      }, new Map<string, PreferenceMatch[]>())
  ).map(([empId, empMatches]) => ({
    employeeId: empId,
    violations: empMatches.length,
    details: empMatches.slice(0, 3) // Show first 3
  }))

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className={`${rateColors.bg} border ${rateColors.border} rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart size={20} className={rateColors.icon} />
            <h3 className={`font-bold ${rateColors.text}`}>Phân tích đăng ký mong muốn</h3>
          </div>
          <div className={`text-3xl font-black ${rateColors.text}`}>
            {matchRate}%
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-3 bg-white rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${matchRate}%`,
              background: matchRate >= 80 ? 'linear-gradient(90deg, #1E9E57, #34D399)' : 
                        matchRate >= 50 ? 'linear-gradient(90deg, #F6C85F, #FBBF24)' :
                        'linear-gradient(90deg, #D9381E, #F87171)'
            }}
          />
        </div>
        
        <p className="text-xs mt-2 opacity-80">
          {preferredCount + acceptedCount} / {totalShifts} ca phù hợp với đăng ký của nhân viên
        </p>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-400" />
            Phân bổ ca theo mức độ phù hợp
          </h4>
          
          <div className="flex items-center gap-4">
            {/* Simple bar chart instead of pie */}
            <div className="flex-1 space-y-2">
              {pieData.map(item => {
                const percentage = totalShifts > 0 ? Math.round((item.count / totalShifts) * 100) : 0
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                      <Icon size={12} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-medium text-gray-700">{item.label}</span>
                        <span className="text-gray-500">{item.count} ca</span>
                      </div>
                      <div className="h-2 bg-primary-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: item.color 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Violations List */}
      {violationEmployees.length > 0 && (
        <div className="bg-error-50 border border-error-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-error-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} />
            Nhân viên có ca vi phạm đăng ký
          </h4>
          
          <div className="space-y-2">
            {violationEmployees.map(emp => (
              <div key={emp.employeeId} className="bg-white rounded-lg p-3 border border-error-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{emp.employeeId}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-error-100 text-error-600 font-medium">
                    {emp.violations} vi phạm
                  </span>
                </div>
                <div className="space-y-1">
                  {emp.details.map((detail, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                      <Clock size={10} className="text-gray-400" />
                      <span className="font-medium">{detail.date}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium" 
                        style={{ 
                          backgroundColor: detail.preference === 'unavailable' ? '#FEE2E2' : '#FFF8E8',
                          color: detail.preference === 'unavailable' ? '#DC2626' : '#D97706'
                        }}>
                        Ca {detail.shiftSlot === 'morning' ? 'sáng' : detail.shiftSlot === 'afternoon' ? 'chiều' : 'tối'}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span className="text-gray-500 italic">{detail.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success-500" />
          <span className="text-gray-600">Phù hợp (theo đăng ký)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary-500" />
          <span className="text-gray-600">Chấp nhận (chưa đăng ký)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning-500" />
          <span className="text-gray-600">Không ưu tiên</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-error-500" />
          <span className="text-gray-600">Vi phạm (xếp ca nghỉ)</span>
        </div>
      </div>
    </div>
  )
}

// Compact version for inline display
export function PreferenceStatsBadge({ stats }: { stats: PreferenceStats }) {
  const getColor = (rate: number) => {
    if (rate >= 80) return 'bg-success-100 text-success-700'
    if (rate >= 50) return 'bg-warning-100 text-warning-700'
    return 'bg-error-100 text-error-700'
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getColor(stats.matchRate)}`}>
      <Heart size={12} />
      {stats.matchRate}% phù hợp
    </div>
  )
}

// Missing preferences alert
export function MissingPreferencesAlert({ count, onRemind }: { count: number; onRemind?: () => void }) {
  return (
    <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <Users size={20} className="text-primary-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary-800">{count} nhân viên chưa đăng ký ca mong muốn</p>
          <p className="text-xs text-primary-600">Lịch có thể không tối ưu. Nhắc nhở họ đăng ký?</p>
        </div>
      </div>
      {onRemind && (
        <button 
          onClick={onRemind}
          className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-colors"
        >
          Gửi nhắc nhở
        </button>
      )}
    </div>
  )
}
