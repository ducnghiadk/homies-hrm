'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockEngagementScores, mockHRMetrics, mockTurnoverData } from '@/lib/mock-data-p5'
import { TrendingUp, TrendingDown, Users, Heart, Smile, Target, Award } from 'lucide-react'

export default function AnalyticsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'overview'|'people'|'engagement'|'turnover'>('overview')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const m = mockHRMetrics
  const latest = mockEngagementScores[mockEngagementScores.length - 1]
  const prev = mockEngagementScores[mockEngagementScores.length - 2]
  const engChange = latest.score - prev.score

  const tabs = [
    { k: 'overview' as const, l: '📊 Tổng quan' },
    { k: 'people' as const, l: '👥 Nhân sự' },
    { k: 'engagement' as const, l: '💚 Engagement' },
    { k: 'turnover' as const, l: '🔄 Biến động' },
  ]

  return (
    <AppShell title="Analytics & Insights 📈">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 animate-fade-in">
          <div className="card-elevated p-3 text-center">
            <Users size={16} className="mx-auto mb-1" style={{color:'var(--primary)'}} />
            <div className="text-xs" style={{color:'var(--text-secondary)'}}>Nhân viên</div>
            <div className="text-xl font-black">{m.total_employees}</div>
            <div className="text-[9px]" style={{color:'var(--success)'}}>{m.active} active · {m.probation} thử việc</div>
          </div>
          <div className="card-elevated p-3 text-center">
            <Smile size={16} className="mx-auto mb-1" style={{color: latest.score>=80 ? 'var(--success)' : 'var(--warning)'}} />
            <div className="text-xs" style={{color:'var(--text-secondary)'}}>Engagement</div>
            <div className="text-xl font-black">{latest.score}</div>
            <div className="text-[9px]" style={{color: engChange>=0 ? 'var(--success)' : 'var(--error)'}}>
              {engChange>=0 ? '↑' : '↓'} {Math.abs(engChange)} vs trước
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          {tabs.map(({k,l}) => (
            <button key={k} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{background:tab===k?'var(--primary)':'var(--gray-100)',color:tab===k?'white':'var(--text-secondary)'}}
              onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-3 animate-slide-up">
            <div className="grid grid-cols-3 gap-2">
              {[
                {label:'KPI TB',value:`${m.avg_kpi}%`,icon:Target,color:m.avg_kpi>=80?'var(--success)':'var(--warning)'},
                {label:'360° TB',value:`${m.avg_360}/5`,icon:Award,color:m.avg_360>=4?'var(--success)':'var(--warning)'},
                {label:'Mood TB',value:`${m.avg_mood}/5`,icon:Heart,color:m.avg_mood>=4?'var(--success)':'var(--warning)'},
              ].map(({label,value,icon:Icon,color})=>(
                <div key={label} className="card p-3 text-center">
                  <Icon size={16} className="mx-auto mb-1" style={{color}} />
                  <div className="text-sm font-bold" style={{color}}>{value}</div>
                  <div className="text-[9px]" style={{color:'var(--text-muted)'}}>{label}</div>
                </div>
              ))}
            </div>
            <div className="card p-4" style={{background:'linear-gradient(135deg,#001D3D10,#2F6FA810)',border:'1px solid #001D3D30'}}>
              <h3 className="text-sm font-bold mb-2">🤖 AI Insights</h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2"><span>💡</span><span>Engagement tăng {engChange} điểm → gamification phát huy hiệu quả</span></li>
                <li className="flex items-start gap-2"><span>⚠️</span><span>Mood TB 3.6/5 — cửa hàng Q.3 có dấu hiệu stress cao</span></li>
                <li className="flex items-start gap-2"><span>📈</span><span>3 nhân viên đủ điều kiện thăng tiến</span></li>
              </ul>
            </div>
          </div>
        )}

        {tab === 'people' && (
          <div className="card p-4 animate-slide-up">
            <h3 className="text-sm font-bold mb-3">👥 Cơ cấu nhân sự</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Giới tính</span>
                  <span className="font-bold">Nam {m.gender_ratio.male} / Nữ {m.gender_ratio.female}</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div style={{width:`${(m.gender_ratio.male/(m.gender_ratio.male+m.gender_ratio.female))*100}%`,background:'#2F6FA8'}} />
                  <div style={{width:`${(m.gender_ratio.female/(m.gender_ratio.male+m.gender_ratio.female))*100}%`,background:'#ec4899'}} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{borderColor:'var(--gray-100)'}}>
                <div><span className="text-xs" style={{color:'var(--text-muted)'}}>Tuổi TB</span><div className="text-sm font-bold">{m.avg_age}</div></div>
                <div><span className="text-xs" style={{color:'var(--text-muted)'}}>Thâm niên TB</span><div className="text-sm font-bold">{m.avg_tenure_months} tháng</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{borderColor:'var(--gray-100)'}}>
                <div><span className="text-xs" style={{color:'var(--text-muted)'}}>Training</span><div className="text-sm font-bold">{m.training_completion}%</div></div>
                <div><span className="text-xs" style={{color:'var(--text-muted)'}}>Turnover YTD</span><div className="text-sm font-bold" style={{color:m.turnover_rate_ytd>20?'var(--error)':'inherit'}}>{m.turnover_rate_ytd}%</div></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'engagement' && (
          <div className="space-y-3 animate-slide-up">
            <div className="card p-4">
              <h3 className="text-sm font-bold mb-3">💚 Engagement 6 tháng</h3>
              <div className="flex items-end gap-2 justify-between" style={{height:100}}>
                {mockEngagementScores.map(e => {
                  const h = ((e.score-60)/30)*100
                  return (
                    <div key={e.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[9px] font-bold">{e.score}</div>
                      <div className="w-full rounded-t-md" style={{height:`${Math.max(5,h)}%`,background:e.score>=80?'var(--success)':e.score>=70?'var(--warning)':'var(--error)'}} />
                      <span className="text-[9px]" style={{color:'var(--text-muted)'}}>T{e.month.split('-')[1]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'turnover' && (
          <div className="card p-4 animate-slide-up">
            <h3 className="text-sm font-bold mb-3">🔄 Biến động 6 tháng</h3>
            <div className="space-y-2">
              {mockTurnoverData.map(t => (
                <div key={t.month} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-12">T{t.month.split('-')[1]}/{t.month.split('-')[0].slice(2)}</span>
                  <div className="flex-1 flex gap-1">
                    {t.hired>0 && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'var(--success-light)',color:'var(--success)'}}>
                      <TrendingUp size={10} className="inline" /> +{t.hired}
                    </span>}
                    {t.resigned>0 && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'var(--error-light)',color:'var(--error)'}}>
                      <TrendingDown size={10} className="inline" /> -{t.resigned}
                    </span>}
                    {t.hired===0&&t.resigned===0 && <span className="text-xs" style={{color:'var(--text-muted)'}}>—</span>}
                  </div>
                  <span className="text-xs" style={{color:'var(--text-muted)'}}>{t.total} NV</span>
                  <span className="text-xs font-bold w-8 text-right" style={{color:t.rate>10?'var(--error)':t.rate>0?'var(--warning)':'var(--success)'}}>{t.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
