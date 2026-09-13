'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { MOOD_EMOJIS, mockFeedbackBox, getMoodHistory } from '@/lib/mock-data-p3'
import { Send, TrendingUp, AlertTriangle } from 'lucide-react'

export default function WellnessPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'mood'|'feedback'>('mood')
  const [selectedMood, setSelectedMood] = useState<number|null>(null)
  const [moodNote, setMoodNote] = useState('')
  const [moodSubmitted, setMoodSubmitted] = useState(false)
  const [fbCategory, setFbCategory] = useState('workplace')
  const [fbContent, setFbContent] = useState('')
  const [fbSent, setFbSent] = useState(false)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/wellness')
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated) {
    return (
      <AppShell title="Sức khỏe & Khảo sát 🌿">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  const myMoods = getMoodHistory(user.id)
  const avgMood = myMoods.length > 0 ? myMoods.reduce((s,m) => s + m.mood, 0) / myMoods.length : 0
  const todayChecked = myMoods.some(m => m.date === new Date().toISOString().split('T')[0])

  const handleMoodSubmit = () => {
    if (!selectedMood) return
    setMoodSubmitted(true)
    setTimeout(() => {
      setMoodSubmitted(false)
      setSelectedMood(null)
      setMoodNote('')
    }, 3000)
  }

  const handleFeedbackSubmit = () => {
    if (!fbContent.trim()) return
    setFbSent(true)
    setTimeout(() => {
      setFbSent(false)
      setFbContent('')
    }, 3000)
  }

  return (
    <AppShell title="Sức khỏe & Sắc thái 🧘">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 animate-fade-in">
          {[
            {k:'mood' as const,l:'Mood Check-in',icon:'😊'},
            {k:'feedback' as const,l:'Góp ý ẩn danh',icon:'💬'},
          ].map(({k,l,icon})=>(
            <button key={k} className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: tab===k ? 'var(--primary)' : 'var(--gray-100)',
                color: tab===k ? 'white' : 'var(--text-secondary)',
              }}
              onClick={()=>setTab(k)}>{icon} {l}</button>
          ))}
        </div>

        {/* MOOD CHECK-IN */}
        {tab === 'mood' && (
          <>
            {/* Today's Mood Picker */}
            {!todayChecked && !moodSubmitted ? (
              <div className="card-elevated p-5 text-center animate-slide-up">
                <h3 className="text-sm font-bold mb-1">Hôm nay bạn cảm thấy thế nào?</h3>
                <p className="text-xs mb-4" style={{color:'var(--text-secondary)'}}>Chọn emoji phù hợp nhất</p>
                <div className="flex justify-center gap-3 mb-4">
                  {Object.entries(MOOD_EMOJIS).map(([level, {emoji, label, color}]) => (
                    <button key={level} className="text-center transition-all" onClick={()=>setSelectedMood(Number(level))}
                      style={{
                        transform: selectedMood===Number(level) ? 'scale(1.3)' : 'scale(1)',
                        opacity: selectedMood && selectedMood!==Number(level) ? 0.4 : 1,
                      }}>
                      <div className="text-3xl mb-1">{emoji}</div>
                      <div className="text-[9px]" style={{color}}>{label}</div>
                    </button>
                  ))}
                </div>
                {selectedMood && (
                  <div className="animate-fade-in space-y-3">
                    <input className="input text-sm" placeholder="Ghi chú thêm (tùy chọn)..."
                      value={moodNote} onChange={e=>setMoodNote(e.target.value)}/>
                    <button className="btn btn-primary btn-block" onClick={handleMoodSubmit}>
                      Gửi mood check-in
                    </button>
                  </div>
                )}
              </div>
            ) : moodSubmitted ? (
              <div className="card-elevated p-8 text-center animate-scale-in">
                <div className="text-5xl mb-2">{MOOD_EMOJIS[selectedMood!]?.emoji}</div>
                <h3 className="text-lg font-bold" style={{color:'var(--success)'}}>Đã ghi nhận! ✅</h3>
                <p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>Cảm ơn bạn đã chia sẻ</p>
              </div>
            ) : (
              <div className="card p-4 text-center animate-slide-up" style={{background:'var(--success-light)'}}>
                <div className="text-2xl mb-1">✅</div>
                <p className="text-xs font-medium" style={{color:'var(--success)'}}>Bạn đã check-in mood hôm nay</p>
              </div>
            )}

            {/* Mood Summary */}
            <div className="card animate-slide-up" style={{animationDelay:'0.1s'}}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">📊 Mood 7 ngày qua</h3>
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} style={{color: avgMood >= 3.5 ? 'var(--success)' : 'var(--warning)'}}/>
                  <span className="text-sm font-bold" style={{color: avgMood >= 3.5 ? 'var(--success)' : 'var(--warning)'}}>
                    {avgMood.toFixed(1)}/5
                  </span>
                </div>
              </div>

              {/* Mini Mood Chart */}
              <div className="flex items-end gap-1.5 justify-between" style={{height:80}}>
                {myMoods.slice(0,7).reverse().map(m => {
                  const info = MOOD_EMOJIS[m.mood]
                  const height = (m.mood / 5) * 100
                  return (
                    <div key={m.id} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-sm">{info.emoji}</div>
                      <div className="w-full rounded-t-sm transition-all" style={{
                        height: `${height}%`, background: info.color, opacity: 0.7, minHeight: 8,
                      }}/>
                      <span className="text-[8px]" style={{color:'var(--text-muted)'}}>
                        {new Date(m.date).getDate()}/{new Date(m.date).getMonth()+1}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Burnout Risk */}
              {avgMood < 2.5 && (
                <div className="mt-3 p-3 rounded-lg flex items-center gap-2" style={{background:'var(--error-light)'}}>
                  <AlertTriangle size={16} style={{color:'var(--error)'}}/>
                  <div className="text-xs" style={{color:'var(--error)'}}>
                    <b>Cảnh báo:</b> Mood trung bình thấp. Hãy nói chuyện với quản lý hoặc đồng nghiệp nếu cần hỗ trợ.
                  </div>
                </div>
              )}
            </div>

            {/* Mood History */}
            <div className="card animate-slide-up" style={{animationDelay:'0.15s'}}>
              <h3 className="text-sm font-bold mb-2">📝 Lịch sử mood</h3>
              <div className="space-y-2">
                {myMoods.map(m => {
                  const info = MOOD_EMOJIS[m.mood]
                  return (
                    <div key={m.id} className="flex items-center gap-3 py-1.5 border-t" style={{borderColor:'var(--gray-100)'}}>
                      <span className="text-xl">{info.emoji}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium" style={{color:info.color}}>{info.label}</div>
                        {m.note && <div className="text-xs" style={{color:'var(--text-secondary)'}}>{m.note}</div>}
                      </div>
                      <span className="text-xs" style={{color:'var(--text-muted)'}}>{m.date}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ANONYMOUS FEEDBACK */}
        {tab === 'feedback' && (
          <>
            {/* Submit */}
            {!fbSent ? (
              <div className="card p-4 animate-slide-up">
                <h3 className="text-sm font-bold mb-3">💬 Gửi góp ý ẩn danh</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{color:'var(--text-secondary)'}}>Danh mục</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        {k:'workplace',l:'🏢 Nơi làm việc'},
                        {k:'schedule',l:'📅 Ca làm'},
                        {k:'culture',l:'🎯 Văn hóa'},
                        {k:'other',l:'💡 Khác'},
                      ].map(({k,l})=>(
                        <button key={k} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: fbCategory===k ? 'var(--primary-50)' : 'var(--gray-100)',
                            color: fbCategory===k ? 'var(--primary)' : 'var(--text-secondary)',
                            border: fbCategory===k ? '1px solid var(--primary)' : '1px solid transparent',
                          }}
                          onClick={()=>setFbCategory(k)}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{color:'var(--text-secondary)'}}>Nội dung</label>
                    <textarea className="input text-sm" rows={4} placeholder="Chia sẻ ý kiến, đề xuất cải tiến..."
                      value={fbContent} onChange={e=>setFbContent(e.target.value)}/>
                  </div>
                  <div className="p-2 rounded-lg text-xs flex items-center gap-1.5" style={{background:'var(--gray-100)',color:'var(--text-muted)'}}>
                    🔒 Hoàn toàn ẩn danh — Quản lý không thể biết ai gửi
                  </div>
                  <button className="btn btn-primary btn-block" onClick={handleFeedbackSubmit}
                    disabled={!fbContent.trim()} style={{opacity: !fbContent.trim() ? 0.5 : 1}}>
                    <Send size={14}/> Gửi góp ý
                  </button>
                </div>
              </div>
            ) : (
              <div className="card-elevated p-8 text-center animate-scale-in">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-lg font-bold" style={{color:'var(--success)'}}>Đã gửi thành công!</h3>
                <p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>Góp ý của bạn sẽ được xem xét</p>
              </div>
            )}

            {/* Recent Feedback (manager view) */}
            {user.role !== 'employee' && (
              <div className="card animate-slide-up" style={{animationDelay:'0.1s'}}>
                <h3 className="text-sm font-bold mb-2">📋 Góp ý gần đây</h3>
                {mockFeedbackBox.map(fb => (
                  <div key={fb.id} className="py-2.5 border-t" style={{borderColor:'var(--gray-100)'}}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: fb.category==='workplace' ? '#DBEAFE' : fb.category==='schedule' ? '#FCE7F3' : '#D1FAE5',
                        color: fb.category==='workplace' ? '#2563EB' : fb.category==='schedule' ? '#DB2777' : '#059669',
                      }}>
                        {fb.category==='workplace' ? '🏢' : fb.category==='schedule' ? '📅' : '🎯'} {fb.category}
                      </span>
                      <span className="text-xs ml-auto" style={{color:'var(--text-muted)'}}>{fb.date}</span>
                    </div>
                    <p className="text-xs mt-1" style={{color:'var(--text-primary)'}}>{fb.content}</p>
                    <span className="text-[9px] mt-0.5 inline-block px-2 py-0.5 rounded-full" style={{
                      background: fb.status==='resolved' ? 'var(--success-light)' : fb.status==='reviewed' ? 'var(--warning-light)' : 'var(--gray-100)',
                      color: fb.status==='resolved' ? 'var(--success)' : fb.status==='reviewed' ? 'var(--warning)' : 'var(--text-muted)',
                    }}>
                      {fb.status === 'resolved' ? '✅ Đã xử lý' : fb.status === 'reviewed' ? '👀 Đang xem xét' : '⏳ Chờ xem'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
