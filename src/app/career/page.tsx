'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockCareerLevels, getCareerProgressByEmployee } from '@/lib/mock-data-p2'
import { CheckCircle, Circle, Lock, TrendingUp, Zap } from 'lucide-react'

export default function CareerPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const progress = getCareerProgressByEmployee(user.id)
  const currentLevel = progress?.current_level ?? 0
  const targetLevel = progress?.target_level ?? 1

  return (
    <AppShell title="Lộ trình thăng tiến">
      <div className="space-y-4">
        {/* Level Timeline */}
        <div className="card-elevated p-5 animate-fade-in">
          <h3 className="text-sm font-bold mb-4">📈 Career Path</h3>
          <div className="relative">
            {mockCareerLevels.map((level, i) => {
              const isComplete = i < currentLevel
              const isCurrent = i === currentLevel
              const isTarget = i === targetLevel
              const isLocked = i > targetLevel

              return (
                <div key={i} className="flex items-start gap-3 mb-4 relative">
                  {/* Vertical line */}
                  {i < mockCareerLevels.length - 1 && (
                    <div className="absolute top-6 left-[11px] w-0.5 h-full" style={{
                      background: isComplete ? 'var(--success)' : 'var(--gray-200)'
                    }}/>
                  )}
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    {isComplete ? (
                      <CheckCircle size={24} style={{color:'var(--success)'}}/>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center animate-pulse-glow" 
                        style={{background:'var(--primary)', color:'white'}}>
                        <Zap size={12}/>
                      </div>
                    ) : isTarget ? (
                      <Circle size={24} style={{color:'var(--primary)'}} strokeWidth={2}/>
                    ) : (
                      <Lock size={24} style={{color:'var(--gray-300)'}}/>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-2" style={{opacity: isLocked ? 0.5 : 1}}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isCurrent ? 'text-gradient' : ''}`}
                        style={{color: isCurrent ? undefined : isComplete ? 'var(--success)' : 'var(--text-primary)'}}>
                        Level {level.level}: {level.name}
                      </span>
                      {isCurrent && <span className="badge badge-primary text-[9px]">Hiện tại</span>}
                      {isTarget && <span className="badge badge-warning text-[9px]">Mục tiêu</span>}
                    </div>
                    <div className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>
                      Yêu cầu: {level.min_months} tháng • KPI ≥{level.min_kpi}% • 360° ≥{level.min_eval} • {level.required_courses} khóa
                    </div>
                    <div className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>
                      Lương: {level.salary_range}đ
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress Details */}
        {progress && (
          <div className="card animate-slide-up" style={{animationDelay:'0.1s'}}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">🎯 Tiến độ thăng tiến</h3>
              <span className="text-lg font-black" style={{color:'var(--primary)'}}>{progress.overall_percent}%</span>
            </div>

            {/* Overall progress bar */}
            <div className="h-3 rounded-full mb-4" style={{background:'var(--gray-100)'}}>
              <div className="h-full rounded-full transition-all relative" style={{
                width:`${progress.overall_percent}%`,
                background: progress.overall_percent >= 100
                  ? 'linear-gradient(135deg, var(--success) 0%, #059669 100%)'
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              }}>
                {progress.overall_percent >= 100 && (
                  <span className="absolute right-1 top-0 text-[9px] text-white font-bold">🎉</span>
                )}
              </div>
            </div>

            {/* Individual requirements */}
            <div className="space-y-3">
              {[
                { label: 'Thâm niên', value: `${progress.progress.months_worked}/${progress.progress.months_required} tháng`, met: progress.progress.months_met, pct: Math.min(100, (progress.progress.months_worked/progress.progress.months_required)*100) },
                { label: 'KPI trung bình', value: `${progress.progress.avg_kpi}% (cần ≥${progress.progress.kpi_required}%)`, met: progress.progress.kpi_met, pct: Math.min(100, (progress.progress.avg_kpi/progress.progress.kpi_required)*100) },
                { label: 'Đánh giá 360°', value: `${progress.progress.avg_eval}/5.0 (cần ≥${progress.progress.eval_required})`, met: progress.progress.eval_met, pct: Math.min(100, (progress.progress.avg_eval/progress.progress.eval_required)*100) },
                { label: 'Khóa học', value: `${progress.progress.courses_done}/${progress.progress.courses_required} khóa`, met: progress.progress.courses_met, pct: Math.min(100, (progress.progress.courses_done/progress.progress.courses_required)*100) },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium flex items-center gap-1.5">
                      {item.met ? <CheckCircle size={12} style={{color:'var(--success)'}}/> : <Circle size={12} style={{color:'var(--gray-400)'}}/>}
                      {item.label}
                    </span>
                    <span className="text-xs" style={{color: item.met ? 'var(--success)' : 'var(--text-secondary)'}}>
                      {item.value}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{background:'var(--gray-100)'}}>
                    <div className="h-full rounded-full transition-all" style={{
                      width:`${item.pct}%`,
                      background: item.met ? 'var(--success)' : 'var(--primary)',
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestion */}
        {progress && (
          <div className="card animate-slide-up p-4" style={{
            animationDelay:'0.15s',
            background: progress.overall_percent >= 100 ? 'var(--success-light)' : 'var(--primary-50)',
            border: `1px solid ${progress.overall_percent >= 100 ? 'var(--success)' : 'var(--primary)'}20`
          }}>
            <div className="flex items-start gap-3">
              <TrendingUp size={20} style={{color: progress.overall_percent >= 100 ? 'var(--success)' : 'var(--primary)', flexShrink:0, marginTop:2}}/>
              <div>
                <h4 className="text-sm font-bold" style={{color: progress.overall_percent >= 100 ? 'var(--success)' : 'var(--primary)'}}>
                  {progress.overall_percent >= 100 ? '🎉 Sẵn sàng thăng tiến!' : '💪 Gợi ý cải thiện'}
                </h4>
                <p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>{progress.suggestion}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
