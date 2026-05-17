'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockOnboardingTasks, mockOnboardingInfo, ONBOARDING_PHASES } from '@/lib/mock-data-p5'
import { CheckCircle, Circle, User, Calendar, MapPin } from 'lucide-react'

export default function OnboardingPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activePhase, setActivePhase] = useState<string>('week1')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const info = mockOnboardingInfo
  const totalTasks = mockOnboardingTasks.length
  const doneTasks = mockOnboardingTasks.filter(t => t.done).length
  const progress = Math.round((doneTasks / totalTasks) * 100)
  const phaseTasks = mockOnboardingTasks.filter(t => t.phase === activePhase)

  // Find current phase
  const currentPhaseIdx = ONBOARDING_PHASES.findIndex(p => {
    const tasks = mockOnboardingTasks.filter(t => t.phase === p.key)
    return tasks.some(t => !t.done)
  })

  return (
    <AppShell title="Onboarding 🎓">
      <div className="space-y-4">
        {/* Employee Info Card */}
        <div className="card-elevated p-4 animate-fade-in" style={{ background: 'linear-gradient(135deg, var(--primary)08, var(--accent)08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--primary)', color: 'white' }}>
              {info.employee_name.split(' ').pop()?.[0]}
            </div>
            <div>
              <div className="text-sm font-bold">{info.employee_name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{info.position} · {info.store}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><Calendar size={14} className="mx-auto mb-0.5" style={{ color: 'var(--primary)' }} /><div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Bắt đầu</div><div className="text-xs font-bold">{info.start_date}</div></div>
            <div><User size={14} className="mx-auto mb-0.5" style={{ color: 'var(--success)' }} /><div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Mentor</div><div className="text-xs font-bold">{info.mentor.name.split(' ').pop()}</div></div>
            <div><MapPin size={14} className="mx-auto mb-0.5" style={{ color: 'var(--warning)' }} /><div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Thử việc kết thúc</div><div className="text-xs font-bold">{info.probation_end}</div></div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="card p-4 animate-slide-up">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold">📋 Tiến độ tổng</span>
            <span className="text-sm font-bold" style={{ color: progress >= 80 ? 'var(--success)' : progress >= 50 ? 'var(--warning)' : 'var(--primary)' }}>{progress}%</span>
          </div>
          <div className="h-3 rounded-full" style={{ background: 'var(--gray-200)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progress >= 80 ? 'var(--success)' : progress >= 50 ? 'var(--warning)' : 'var(--primary)' }} />
          </div>
          <div className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{doneTasks}/{totalTasks} tasks</div>
        </div>

        {/* Phase Timeline */}
        <div className="flex gap-1 animate-slide-up">
          {ONBOARDING_PHASES.map((phase, i) => {
            const tasks = mockOnboardingTasks.filter(t => t.phase === phase.key)
            const done = tasks.filter(t => t.done).length
            const allDone = done === tasks.length
            const isCurrent = i === currentPhaseIdx
            return (
              <button key={phase.key} className="flex-1 p-2 rounded-xl text-center transition-all relative"
                style={{
                  background: activePhase === phase.key ? `${phase.color}15` : 'var(--gray-100)',
                  border: activePhase === phase.key ? `1.5px solid ${phase.color}` : '1.5px solid transparent',
                }}
                onClick={() => setActivePhase(phase.key)}>
                <div className="text-xs mb-0.5">{allDone ? '✅' : isCurrent ? '🔵' : '⬜'}</div>
                <div className="text-[9px] font-bold" style={{ color: activePhase === phase.key ? phase.color : 'var(--text-secondary)' }}>{phase.label}</div>
                <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{done}/{tasks.length}</div>
              </button>
            )
          })}
        </div>

        {/* Phase Tasks */}
        <div className="space-y-2 animate-slide-up">
          {phaseTasks.map(task => (
            <div key={task.id} className="card p-3 flex items-center gap-3" style={{ opacity: task.done ? 0.7 : 1 }}>
              {task.done ? (
                <CheckCircle size={20} style={{ color: 'var(--success)' }} />
              ) : (
                <Circle size={20} style={{ color: 'var(--gray-300)' }} />
              )}
              <span className="text-sm flex-1" style={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {task.title}
              </span>
            </div>
          ))}
        </div>

        {/* Mentor Card */}
        <div className="card p-4 animate-slide-up">
          <h3 className="text-sm font-bold mb-2">👨‍🏫 Mentor của bạn</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              {info.mentor.avatar}
            </div>
            <div>
              <div className="text-sm font-semibold">{info.mentor.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{info.mentor.role}</div>
            </div>
            <button className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--primary)', color: 'white' }}>
              💬 Chat
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
