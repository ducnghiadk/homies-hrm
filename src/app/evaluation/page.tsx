'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockEvalCycles, mockEvalResults } from '@/lib/mock-data-p2'
import { getEmployeeById } from '@/lib/mock-data'
import { getInitials } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

const EVAL_DIMS = [
  { key: 'work_quality', label: 'Chất lượng công việc', emoji: '⭐' },
  { key: 'teamwork', label: 'Làm việc nhóm', emoji: '🤝' },
  { key: 'initiative', label: 'Sáng kiến', emoji: '💡' },
  { key: 'communication', label: 'Giao tiếp', emoji: '💬' },
  { key: 'reliability', label: 'Đáng tin cậy', emoji: '🔒' },
]

function RadarChart({
  self,
  manager,
  peer,
}: {
  self: Record<string, number>
  manager: Record<string, number>
  peer: Record<string, number>
}) {
  const dims = EVAL_DIMS.map(d => d.key)
  const size = 130
  const center = size / 2
  const maxR = center - 15

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index / dims.length) - Math.PI / 2
    const r = (value / 5) * maxR
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  const makePath = (scores: Record<string, number>) =>
    dims.map((d, i) => {
      const p = getPoint(i, scores[d] || 0)
      return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    }).join(' ') + ' Z'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {[1, 2, 3, 4, 5].map(r => (
        <polygon key={r} points={dims.map((_, i) => {
          const p = getPoint(i, r)
          return `${p.x},${p.y}`
        }).join(' ')} fill="none" stroke="var(--gray-200)" strokeWidth="0.5" />
      ))}
      {dims.map((_, i) => {
        const p = getPoint(i, 5)
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="var(--gray-200)" strokeWidth="0.5" />
      })}
      {dims.map((_, i) => {
        const p = getPoint(i, 5.8)
        return <text key={i} x={p.x} y={p.y} fontSize="7" fill="var(--text-muted)" textAnchor="middle" dominantBaseline="central">{EVAL_DIMS[i].emoji}</text>
      })}
      <path d={makePath(peer)} fill="rgba(59,130,246,0.1)" stroke="#2F6FA8" strokeWidth="1.5" />
      <path d={makePath(manager)} fill="rgba(16,185,129,0.1)" stroke="#1E9E57" strokeWidth="1.5" />
      <path d={makePath(self)} fill="rgba(245,158,11,0.1)" stroke="#F6C85F" strokeWidth="1.5" />
    </svg>
  )
}

export default function EvaluationPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [selectedCycle, setSelectedCycle] = useState(mockEvalCycles[0]?.id)
  const [expandedEmp, setExpandedEmp] = useState<string|null>(null)

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const cycle = mockEvalCycles.find(c => c.id === selectedCycle)
  const cycleResults = mockEvalResults.filter(r => r.cycle_id === selectedCycle)
  const myResult = cycleResults.find(r => r.employee_id === user.id)

  const scoreColor = (s: number) => s >= 4 ? 'var(--success)' : s >= 3 ? 'var(--warning)' : 'var(--error)'

  return (
    <AppShell title="Đánh giá 360°">
      <div className="space-y-4">
        {/* Cycle Selector */}
        <div className="flex gap-2 overflow-x-auto animate-fade-in" style={{scrollbarWidth:'none'}}>
          {mockEvalCycles.map(c => (
            <button key={c.id} className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: selectedCycle===c.id ? 'var(--primary)' : 'var(--gray-100)',
                color: selectedCycle===c.id ? 'white' : 'var(--text-secondary)',
              }}
              onClick={()=>setSelectedCycle(c.id)}>
              {c.name}
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px]" style={{
                background: c.status==='active' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
              }}>
                {c.status==='active' ? '🟢 Active' : '✅ Done'}
              </span>
            </button>
          ))}
        </div>

        {/* Cycle Stats */}
        {cycle && (
          <div className="card p-4 animate-slide-up">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">{cycle.name}</h3>
                <p className="text-xs" style={{color:'var(--text-secondary)'}}>
                  {cycle.start_date} → {cycle.end_date}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{color:'var(--primary)'}}>
                  {cycle.completed_evaluations}/{cycle.total_evaluations}
                </div>
                <div className="text-xs" style={{color:'var(--text-muted)'}}>hoàn thành</div>
              </div>
            </div>
            <div className="h-2 rounded-full mt-3" style={{background:'var(--gray-100)'}}>
              <div className="h-full rounded-full" style={{
                width:`${(cycle.completed_evaluations/cycle.total_evaluations)*100}%`,
                background:'var(--primary)'
              }}/>
            </div>
          </div>
        )}

        {/* My Result */}
        {myResult && (
          <div className="card-elevated p-5 text-center animate-slide-up" style={{animationDelay:'0.1s'}}>
            <h3 className="text-sm font-bold mb-3">📊 Kết quả của tôi</h3>
            <RadarChart self={myResult.self_scores} manager={myResult.manager_scores} peer={myResult.peer_scores}/>
            <div className="flex gap-4 justify-center mt-2">
              {[{c:'#F6C85F',l:'Tự đánh giá'},{c:'#1E9E57',l:'Cấp trên'},{c:'#2F6FA8',l:'Đồng nghiệp'}].map(({c,l})=>(
                <div key={l} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{background:c}}/> {l}
                </div>
              ))}
            </div>
            <div className="mt-3 text-2xl font-black" style={{color:scoreColor(myResult.final_score)}}>
              {myResult.final_score.toFixed(1)}/5.0
            </div>
            <p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>{myResult.comments}</p>
          </div>
        )}

        {/* All Results (for managers) */}
        {user.role !== 'employee' && (
          <div className="space-y-2 animate-slide-up" style={{animationDelay:'0.15s'}}>
            <h3 className="text-sm font-bold">👥 Kết quả team</h3>
            {cycleResults.sort((a,b)=>b.final_score-a.final_score).map(result => {
              const emp = getEmployeeById(result.employee_id)
              const isExpanded = expandedEmp === result.id
              return (
                <div key={result.id} className="card p-3 cursor-pointer" onClick={()=>setExpandedEmp(isExpanded?null:result.id)}>
                  <div className="flex items-center gap-3">
                    <div className="avatar" style={{width:36,height:36,fontSize:12}}>{emp ? getInitials(emp.full_name) : '?'}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{emp?.full_name}</div>
                      <div className="text-xs" style={{color:'var(--text-secondary)'}}>{result.comments?.slice(0,40)}...</div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-lg font-bold" style={{color:scoreColor(result.final_score)}}>
                        {result.final_score.toFixed(1)}
                      </span>
                      {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t" style={{borderColor:'var(--gray-100)'}}>
                      <RadarChart self={result.self_scores} manager={result.manager_scores} peer={result.peer_scores}/>
                      <div className="grid grid-cols-5 gap-1 mt-2">
                        {EVAL_DIMS.map(dim => (
                          <div key={dim.key} className="text-center">
                            <div className="text-lg">{dim.emoji}</div>
                            <div className="text-xs font-bold" style={{color:scoreColor(
                              ((result.self_scores as Record<string,number>)[dim.key] + (result.manager_scores as Record<string,number>)[dim.key] + (result.peer_scores as Record<string,number>)[dim.key]) / 3
                            )}}>
                              {(((result.self_scores as Record<string,number>)[dim.key] + (result.manager_scores as Record<string,number>)[dim.key] + (result.peer_scores as Record<string,number>)[dim.key]) / 3).toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
