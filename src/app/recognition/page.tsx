'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getEmployeeById, mockEmployees } from '@/lib/mock-data'
import { mockKudos, mockWallOfFame, KUDOS_TYPES, getKudosForEmployee } from '@/lib/mock-data-p3'
import { getInitials } from '@/lib/utils'
import { Send } from 'lucide-react'

export default function RecognitionPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'feed'|'send'|'fame'>('feed')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedTo, setSelectedTo] = useState('')
  const [kudosMsg, setKudosMsg] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const myKudos = getKudosForEmployee(user.id)

  const handleSend = () => {
    if (!selectedType || !selectedTo || !kudosMsg) return
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setSelectedType('')
      setSelectedTo('')
      setKudosMsg('')
      setTab('feed')
    }, 2000)
  }

  return (
    <AppShell title="Vinh danh & Kudos 🌟">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 animate-fade-in">
          {[
            {k:'feed' as const,l:'Feed',icon:'📢'},
            {k:'send' as const,l:'Gửi Kudos',icon:'💝'},
            {k:'fame' as const,l:'Wall of Fame',icon:'🏆'},
          ].map(({k,l,icon})=>(
            <button key={k} className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: tab===k ? 'var(--primary)' : 'var(--gray-100)',
                color: tab===k ? 'white' : 'var(--text-secondary)',
              }}
              onClick={()=>setTab(k)}>{icon} {l}</button>
          ))}
        </div>

        {/* FEED */}
        {tab === 'feed' && (
          <div className="space-y-3 animate-slide-up">
            {/* Kudos I Received */}
            {myKudos.length > 0 && (
              <div className="card-elevated p-4" style={{background:'var(--primary-50)', border:'1px solid var(--primary)20'}}>
                <h3 className="text-sm font-bold mb-2">💝 Kudos dành cho tôi ({myKudos.length})</h3>
                {myKudos.map(k => {
                  const from = getEmployeeById(k.from_id)
                  const type = KUDOS_TYPES.find(t => t.type === k.type)
                  return (
                    <div key={k.id} className="flex items-start gap-2 py-2 border-t" style={{borderColor:'var(--primary)15'}}>
                      <span className="text-lg">{type?.emoji}</span>
                      <div className="flex-1">
                        <div className="text-xs"><b>{from?.full_name}</b> · <span style={{color:type?.color}}>{type?.label}</span></div>
                        <p className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>{k.message}</p>
                        <span className="text-[9px]" style={{color:'var(--text-muted)'}}>{k.date}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* All Kudos Feed */}
            <h3 className="text-sm font-bold">📢 Tất cả Kudos</h3>
            {mockKudos.map(k => {
              const from = getEmployeeById(k.from_id)
              const to = getEmployeeById(k.to_id)
              const type = KUDOS_TYPES.find(t => t.type === k.type)
              return (
                <div key={k.id} className="card p-3" style={{
                  borderLeft: `3px solid ${type?.color || 'var(--gray-200)'}`,
                  background: (k as { is_shoutout?: boolean }).is_shoutout ? 'var(--accent-light)' : undefined,
                }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="avatar" style={{width:28,height:28,fontSize:10}}>{from ? getInitials(from.full_name) : '?'}</div>
                    <div className="text-xs">
                      <b>{from?.full_name}</b>
                      <span style={{color:'var(--text-muted)'}}> → </span>
                      <b>{to?.full_name}</b>
                    </div>
                    <span className="ml-auto text-lg">{type?.emoji}</span>
                  </div>
                  <p className="text-xs" style={{color:'var(--text-secondary)'}}>{k.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-full" style={{background:`${type?.color}15`, color:type?.color}}>{type?.label}</span>
                    <span className="text-[9px] ml-auto" style={{color:'var(--text-muted)'}}>{k.date} · +{k.points} pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SEND KUDOS */}
        {tab === 'send' && (
          <div className="animate-slide-up">
            {sent ? (
              <div className="card-elevated p-8 text-center">
                <div className="text-5xl mb-3 animate-bounce">💝</div>
                <h3 className="text-lg font-bold" style={{color:'var(--success)'}}>Đã gửi Kudos!</h3>
                <p className="text-sm mt-1" style={{color:'var(--text-secondary)'}}>+5 điểm cho bạn và người nhận</p>
              </div>
            ) : (
              <div className="card p-4 space-y-4">
                <h3 className="text-sm font-bold">💝 Gửi Kudos cho đồng nghiệp</h3>

                {/* Type Selection */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{color:'var(--text-secondary)'}}>Loại kudos</label>
                  <div className="flex gap-2 flex-wrap">
                    {KUDOS_TYPES.map(t => (
                      <button key={t.type} className="px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
                        style={{
                          background: selectedType===t.type ? `${t.color}15` : 'var(--gray-100)',
                          color: selectedType===t.type ? t.color : 'var(--text-secondary)',
                          border: selectedType===t.type ? `1.5px solid ${t.color}` : '1.5px solid transparent',
                        }}
                        onClick={()=>setSelectedType(t.type)}>
                        {t.emoji} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Employee Picker */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{color:'var(--text-secondary)'}}>Gửi cho</label>
                  <select className="input text-sm" value={selectedTo} onChange={e=>setSelectedTo(e.target.value)}>
                    <option value="">Chọn đồng nghiệp...</option>
                    {mockEmployees.filter(e=>e.id!==user.id).map(e=>(
                      <option key={e.id} value={e.id}>{e.full_name}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{color:'var(--text-secondary)'}}>Lời nhắn</label>
                  <textarea className="input text-sm" rows={3} placeholder="Viết lời cảm ơn, khen ngợi..."
                    value={kudosMsg} onChange={e=>setKudosMsg(e.target.value)}/>
                </div>

                <button className="btn btn-primary btn-block" onClick={handleSend}
                  disabled={!selectedType || !selectedTo || !kudosMsg}
                  style={{opacity: (!selectedType || !selectedTo || !kudosMsg) ? 0.5 : 1}}>
                  <Send size={16}/> Gửi Kudos (+5 pts)
                </button>
              </div>
            )}
          </div>
        )}

        {/* WALL OF FAME */}
        {tab === 'fame' && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🏆</div>
              <h2 className="text-lg font-black" style={{color:'var(--accent)'}}>Wall of Fame</h2>
              <p className="text-xs" style={{color:'var(--text-secondary)'}}>Những ngôi sao sáng nhất</p>
            </div>
            {mockWallOfFame.map(wof => {
              const emp = getEmployeeById(wof.employee_id)
              return (
                <div key={wof.employee_id+wof.month} className="card-elevated p-5 text-center" style={{
                  background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)',
                  border: '1px solid #FDE68A',
                }}>
                  <div className="avatar mx-auto mb-2" style={{width:56,height:56,fontSize:18,border:'3px solid #FFD700'}}>
                    {emp ? getInitials(emp.full_name) : '?'}
                  </div>
                  <div className="text-sm font-bold">{emp?.full_name}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{color:'var(--accent)'}}> {wof.title}</div>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'#FFF8E8',color:'#D97706'}}>{wof.month}</span>
                    <span className="text-xs" style={{color:'var(--text-muted)'}}>💝 {wof.total_kudos} kudos</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
