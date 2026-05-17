'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockDailyTasks } from '@/lib/mock-data-tasks'
import type { DailyTask } from '@/lib/mock-data-tasks'
import { CheckCircle2, Circle, Camera, Clock } from 'lucide-react'

export default function DailyTasksPage() {
  const [tasks, setTasks] = useState<DailyTask[]>(mockDailyTasks)
  const [selectedTask, setSelectedTask] = useState<string | null>(tasks[0]?.id || null)

  const activeTask = tasks.find(t => t.id === selectedTask)

  const toggleItem = (taskId: string, itemId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const items = t.items.map(i => i.task_item_id === itemId ? { ...i, is_done: !i.is_done, completed_at: !i.is_done ? new Date().toISOString() : undefined } : i)
      const done = items.filter(i => i.is_done).length
      return { ...t, items, progress: Math.round(done / items.length * 100), status: done === items.length ? 'completed' as const : 'in_progress' as const }
    }))
  }

  return (
    <AppShell title="Tác vụ hôm nay">
      <div className="space-y-4">
        {/* Task Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in">
          {tasks.map(t => (
            <button key={t.id} onClick={() => setSelectedTask(t.id)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: selectedTask === t.id ? 'var(--primary)' : 'var(--gray-100)',
                color: selectedTask === t.id ? '#fff' : 'var(--text-secondary)',
              }}>
              {t.shift} • {t.progress}%
            </button>
          ))}
        </div>

        {activeTask && (
          <>
            {/* Progress */}
            <div className="card animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{activeTask.employee_name}</span>
                <span className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{
                    background: activeTask.status === 'completed' ? '#10b98120' : '#f59e0b20',
                    color: activeTask.status === 'completed' ? '#10b981' : '#f59e0b',
                  }}>
                  {activeTask.status === 'completed' ? '✅ Hoàn thành' : `🔄 ${activeTask.progress}%`}
                </span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'var(--gray-100)' }}>
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${activeTask.progress}%`, background: activeTask.progress === 100 ? '#10b981' : 'var(--primary)' }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{activeTask.items.filter(i => i.is_done).length}/{activeTask.items.length} mục</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{activeTask.date} • {activeTask.shift}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {activeTask.items.map((item, i) => (
                <div key={item.task_item_id} className="card flex items-start gap-3"
                  style={{ opacity: item.is_done ? 0.7 : 1 }}>
                  <button onClick={() => toggleItem(activeTask.id, item.task_item_id)} className="mt-0.5">
                    {item.is_done ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : (
                      <Circle size={20} style={{ color: 'var(--gray-300)' }} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm" style={{
                      color: 'var(--text-primary)',
                      textDecoration: item.is_done ? 'line-through' : 'none',
                    }}>
                      {item.description}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {item.is_required && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: '#ef444415', color: '#ef4444' }}>Bắt buộc</span>
                      )}
                      {item.requires_photo && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ background: '#3b82f615', color: '#3b82f6' }}>
                          <Camera size={8} /> {item.photo_url ? '✓ Đã chụp' : 'Cần ảnh'}
                        </span>
                      )}
                      {item.completed_at && (
                        <span className="text-[9px] flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                          <Clock size={8} /> {new Date(item.completed_at).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
