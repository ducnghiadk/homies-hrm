'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockOffboardingChecklists } from '@/lib/mock-data-employee-ext'
import { UserMinus, CheckCircle2, Circle } from 'lucide-react'

export default function OffboardingPage() {
  const ob = mockOffboardingChecklists[0]
  const [steps, setSteps] = useState(ob.steps)

  const toggle = (stepId: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, is_done: !s.is_done, done_at: !s.is_done ? new Date().toISOString().slice(0, 10) : undefined } : s))
  }

  const doneCount = steps.filter(s => s.is_done).length
  const progress = Math.round(doneCount / steps.length * 100)

  return (
    <AppShell title="Offboarding">
      <div className="space-y-4">
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff' }}>
          <div className="flex items-center gap-2">
            <UserMinus size={20} />
            <div>
              <div className="text-xs opacity-80">Quy trình nghỉ việc — {ob.employee_name}</div>
              <div className="text-lg font-bold">{progress}% hoàn thành</div>
            </div>
          </div>
          <div className="w-full h-2 rounded-full mt-3" style={{ background: 'rgba(255,255,255,0.3)' }}>
            <div className="h-2 rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs opacity-80 mt-1">
            <span>{doneCount}/{steps.length} mục</span>
            <span>Ngày cuối: {ob.last_day}</span>
          </div>
        </div>

        <div className="card animate-slide-up">
          <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            <strong>{ob.employee_name}</strong> — {ob.position} • Khởi tạo bởi {ob.initiated_by}
          </div>
          <div className="space-y-1.5">
            {steps.map(step => (
              <button key={step.id} onClick={() => toggle(step.id)}
                className="w-full flex items-start gap-2 text-left p-2 rounded-lg"
                style={{ background: step.is_done ? '#10b98108' : 'var(--gray-50)' }}>
                {step.is_done ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} style={{ color: 'var(--gray-300)' }} />}
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-primary)', textDecoration: step.is_done ? 'line-through' : 'none' }}>{step.label}</div>
                  <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{step.description}</div>
                  {step.done_by && <div className="text-[9px] text-emerald-500">✓ {step.done_by} — {step.done_at}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
