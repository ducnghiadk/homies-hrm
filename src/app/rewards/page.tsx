'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockRewards, mockRewardRules } from '@/lib/mock-data-p2'
import { getEmployeeById } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, Settings, Plus } from 'lucide-react'

export default function RewardsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'history'|'rules'>('history')
  const [filter, setFilter] = useState<'all'|'bonus'|'penalty'>('all')

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/rewards')
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated) {
    return (
      <AppShell title="Thưởng phạt 🏆">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  const rewards = (user.role === 'employee'
    ? mockRewards.filter(r => r.employee_id === user.id)
    : mockRewards
  ).filter(r => filter === 'all' || r.type === filter)
    .sort((a,b) => b.date.localeCompare(a.date))

  const totalBonus = mockRewards.filter(r => r.type === 'bonus').reduce((s,r) => s + r.amount, 0)
  const totalPenalty = mockRewards.filter(r => r.type === 'penalty').reduce((s,r) => s + Math.abs(r.amount), 0)

  return (
    <AppShell title="Thưởng / Phạt">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 animate-fade-in">
          {[{k:'history' as const,l:'Lịch sử'},{k:'rules' as const,l:'Quy tắc'}].map(({k,l})=>(
            <button key={k} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab===k ? 'var(--primary)' : 'var(--gray-100)',
                color: tab===k ? 'white' : 'var(--text-secondary)',
              }}
              onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === 'history' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 animate-slide-up">
              <div className="stat-card" style={{borderLeft:'3px solid var(--success)'}}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} style={{color:'var(--success)'}}/>
                  <span className="text-xs font-medium" style={{color:'var(--text-secondary)'}}>Tổng thưởng</span>
                </div>
                <div className="text-lg font-bold mt-1" style={{color:'var(--success)'}}>
                  +{(totalBonus/1000).toFixed(0)}K
                </div>
              </div>
              <div className="stat-card" style={{borderLeft:'3px solid var(--error)'}}>
                <div className="flex items-center gap-2">
                  <TrendingDown size={16} style={{color:'var(--error)'}}/>
                  <span className="text-xs font-medium" style={{color:'var(--text-secondary)'}}>Tổng phạt</span>
                </div>
                <div className="text-lg font-bold mt-1" style={{color:'var(--error)'}}>
                  -{(totalPenalty/1000).toFixed(0)}K
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {[{k:'all' as const,l:'Tất cả'},{k:'bonus' as const,l:'🎉 Thưởng'},{k:'penalty' as const,l:'⚠️ Phạt'}].map(({k,l})=>(
                <button key={k} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: filter===k ? 'var(--primary-50)' : 'var(--gray-100)',
                    color: filter===k ? 'var(--primary)' : 'var(--text-secondary)',
                    border: filter===k ? '1px solid var(--primary)' : '1px solid transparent',
                  }}
                  onClick={()=>setFilter(k)}>{l}</button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-2 animate-slide-up" style={{animationDelay:'0.1s'}}>
              {rewards.map(rw => {
                const emp = getEmployeeById(rw.employee_id)
                const isBonus = rw.type === 'bonus'
                return (
                  <div key={rw.id} className="card p-3" style={{
                    borderLeft: `3px solid ${isBonus ? 'var(--success)' : 'var(--error)'}`
                  }}>
                    <div className="flex items-start gap-3">
                      <div className="avatar" style={{width:36,height:36,fontSize:11,
                        background:isBonus?'var(--success-light)':'var(--error-light)',
                        color:isBonus?'var(--success)':'var(--error)'}}>
                        {isBonus ? '🎉' : '⚠️'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{emp?.full_name}</span>
                          <span className="text-lg font-bold" style={{color:isBonus?'var(--success)':'var(--error)'}}>
                            {isBonus ? '+' : ''}{(rw.amount/1000).toFixed(0)}K
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>{rw.reason}</p>
                        <span className="text-xs" style={{color:'var(--text-muted)'}}>{formatDate(rw.date)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* FAB for managers */}
            {user.role !== 'employee' && (
              <button className="fixed bottom-24 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
                style={{background:'var(--primary)', color:'white'}}
                type="button"
                aria-label="Thêm thưởng phạt">
                <Plus size={24}/>
              </button>
            )}
          </>
        )}

        {tab === 'rules' && (
          <div className="space-y-3 animate-slide-up">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Settings size={14}/> Quy tắc tự động
            </h3>
            {mockRewardRules.map(rule => (
              <div key={rule.id} className="card p-3" style={{
                opacity: rule.is_active ? 1 : 0.5,
                borderLeft: `3px solid ${rule.action==='bonus' ? 'var(--success)' : 'var(--error)'}`
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{rule.name}</div>
                    <div className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>
                      Điều kiện: <code className="px-1 py-0.5 rounded" style={{background:'var(--gray-100)',fontSize:'10px'}}>{rule.condition}</code>
                    </div>
                    <div className="text-xs mt-0.5 font-medium" style={{color:rule.action==='bonus'?'var(--success)':'var(--error)'}}>
                      {rule.action === 'bonus' ? '🎁' : '⚠️'} {rule.amount > 0 ? '+' : ''}{(rule.amount/1000).toFixed(0)}K
                    </div>
                  </div>
                  <div className="w-10 h-5 rounded-full relative cursor-pointer" style={{
                    background: rule.is_active ? 'var(--success)' : 'var(--gray-300)'
                  }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{
                      left: rule.is_active ? '22px' : '2px'
                    }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
