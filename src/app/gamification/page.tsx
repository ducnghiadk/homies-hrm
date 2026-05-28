'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getEmployeeById } from '@/lib/mock-data'
import {
  mockLeaderboard, mockPointsHistory, mockBadges, mockEmployeeBadges,
  getPlayerLevel, getEmployeeBadges, LEVEL_THRESHOLDS
} from '@/lib/mock-data-p3'
import { getInitials } from '@/lib/utils'

export default function GamificationPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'overview'|'leaderboard'|'badges'|'shop'>('overview')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const myEntry = mockLeaderboard.find(l => l.employee_id === user.id)
  const myPoints = myEntry?.total_points || 0
  const myLevel = getPlayerLevel(myPoints)
  const myBadges = getEmployeeBadges(user.id)
  const myHistory = mockPointsHistory.filter(p => p.employee_id === user.id)
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.min > myPoints)

  return (
    <AppShell title="Gamification 🎮">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto animate-fade-in" style={{scrollbarWidth:'none'}}>
          {[
            {k:'overview' as const,l:'Tổng quan',icon:'🏠'},
            {k:'leaderboard' as const,l:'BXH',icon:'🏆'},
            {k:'badges' as const,l:'Huy hiệu',icon:'🏅'},
            {k:'shop' as const,l:'Đổi quà',icon:'🎁'},
          ].map(({k,l,icon})=>(
            <button key={k} className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: tab===k ? 'var(--primary)' : 'var(--gray-100)',
                color: tab===k ? 'white' : 'var(--text-secondary)',
              }}
              onClick={()=>setTab(k)}>{icon} {l}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            {/* Level Card */}
            <div className="card-elevated p-5 text-center animate-slide-up" style={{
              background: `linear-gradient(135deg, ${myLevel.color}15 0%, ${myLevel.color}05 100%)`,
              border: `1px solid ${myLevel.color}30`
            }}>
              <div className="text-4xl mb-1">{myLevel.icon}</div>
              <div className="text-lg font-black" style={{color:myLevel.color}}>{myLevel.name}</div>
              <div className="text-3xl font-black mt-1" style={{color:'var(--text-primary)'}}>{myPoints.toLocaleString()}</div>
              <div className="text-xs" style={{color:'var(--text-secondary)'}}>điểm tích lũy</div>
              {nextLevel && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1" style={{color:'var(--text-muted)'}}>
                    <span>{myLevel.name}</span><span>{nextLevel.name} ({nextLevel.min.toLocaleString()})</span>
                  </div>
                  <div className="h-2 rounded-full" style={{background:'var(--gray-200)'}}>
                    <div className="h-full rounded-full transition-all" style={{
                      width:`${Math.min(100, ((myPoints - (myLevel.min)) / (nextLevel.min - myLevel.min)) * 100)}%`,
                      background:`linear-gradient(90deg, ${myLevel.color}, ${nextLevel.color})`,
                    }}/>
                  </div>
                </div>
              )}
              <div className="flex justify-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold">#{myEntry?.rank || '?'}</div>
                  <div className="text-xs" style={{color:'var(--text-muted)'}}>Xếp hạng</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{myBadges.length}</div>
                  <div className="text-xs" style={{color:'var(--text-muted)'}}>Huy hiệu</div>
                </div>
              </div>
            </div>

            {/* My Badges */}
            <div className="card animate-slide-up" style={{animationDelay:'0.1s'}}>
              <h3 className="text-sm font-bold mb-2">🏅 Huy hiệu của tôi</h3>
              {myBadges.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
                  {myBadges.map(badge => (
                    <div key={badge.id} className="text-center flex-shrink-0" style={{width:64}}>
                      <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl"
                        style={{background:'var(--primary-50)'}}>
                        {badge.emoji}
                      </div>
                      <div className="text-[9px] font-medium mt-1 leading-tight">{badge.name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs py-3 text-center" style={{color:'var(--text-muted)'}}>Chưa có huy hiệu nào</p>
              )}
            </div>

            {/* Points History */}
            <div className="card animate-slide-up" style={{animationDelay:'0.15s'}}>
              <h3 className="text-sm font-bold mb-2">💰 Lịch sử điểm</h3>
              <div className="space-y-2">
                {myHistory.slice(0, 6).map(pt => (
                  <div key={pt.id} className="flex items-center justify-between py-1.5 border-t" style={{borderColor:'var(--gray-100)'}}>
                    <div>
                      <div className="text-xs font-medium">{pt.reason}</div>
                      <div className="text-xs" style={{color:'var(--text-muted)'}}>{pt.date}</div>
                    </div>
                    <span className="text-sm font-bold" style={{color: pt.type==='earn' ? 'var(--success)' : 'var(--error)'}}>
                      {pt.type==='earn' ? '+' : ''}{pt.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* LEADERBOARD */}
        {tab === 'leaderboard' && (
          <div className="space-y-3 animate-slide-up">
            {/* Top 3 Podium */}
            <div className="flex items-end justify-center gap-3 py-4">
              {[1,0,2].map(idx => {
                const entry = mockLeaderboard[idx]
                if (!entry) return null
                const emp = getEmployeeById(entry.employee_id)
                const level = getPlayerLevel(entry.total_points)
                const heights = [100, 130, 80]
                const sizes = [56, 64, 48]
                return (
                  <div key={idx} className="text-center" style={{width:80}}>
                    <div className="avatar mx-auto mb-1" style={{
                      width:sizes[idx], height:sizes[idx], fontSize: sizes[idx]/4,
                      border: `3px solid ${level.color}`,
                    }}>
                      {emp ? getInitials(emp.full_name) : '?'}
                    </div>
                    <div className="text-xs font-bold leading-tight">{emp?.full_name.split(' ').slice(-1)}</div>
                    <div className="text-xs font-bold" style={{color:level.color}}>{entry.total_points.toLocaleString()} pts</div>
                    <div className="rounded-t-lg mt-1 flex items-end justify-center" style={{
                      height: heights[idx],
                      background: idx===1 ? 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)' : idx===0 ? 'linear-gradient(180deg, #C0C0C0 0%, #A0A0A0 100%)' : 'linear-gradient(180deg, #CD7F32 0%, #A0522D 100%)',
                    }}>
                      <span className="text-2xl font-black text-white pb-2">#{entry.rank}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Full list */}
            {mockLeaderboard.slice(3).map(entry => {
              const emp = getEmployeeById(entry.employee_id)
              const level = getPlayerLevel(entry.total_points)
              const isMe = entry.employee_id === user.id
              return (
                <div key={entry.employee_id} className="card p-3 flex items-center gap-3" style={{
                  border: isMe ? '2px solid var(--primary)' : undefined,
                  background: isMe ? 'var(--primary-50)' : undefined,
                }}>
                  <span className="text-sm font-bold w-6 text-center" style={{color:'var(--text-muted)'}}>#{entry.rank}</span>
                  <div className="avatar" style={{width:36,height:36,fontSize:12}}>{emp ? getInitials(emp.full_name) : '?'}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{emp?.full_name} {isMe && '(Tôi)'}</div>
                    <div className="text-xs" style={{color:level.color}}>{level.icon} {level.name}</div>
                  </div>
                  <div className="text-sm font-bold">{entry.total_points.toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* BADGES */}
        {tab === 'badges' && (
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            {mockBadges.map(badge => {
              const earned = (mockEmployeeBadges[user.id] || []).includes(badge.id)
              return (
                <div key={badge.id} className="card p-4 text-center" style={{
                  opacity: earned ? 1 : 0.4,
                  border: earned ? '2px solid var(--primary)' : undefined,
                }}>
                  <div className="text-3xl mb-2">{badge.emoji}</div>
                  <div className="text-xs font-bold">{badge.name}</div>
                  <div className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>{badge.desc}</div>
                  {earned ? (
                    <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold" style={{background:'var(--success-light)', color:'var(--success)'}}>✅ Đã đạt</span>
                  ) : (
                    <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-[9px]" style={{background:'var(--gray-100)', color:'var(--text-muted)'}}>🔒 Chưa đạt</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* REWARDS SHOP */}
        {tab === 'shop' && (
          <div className="space-y-3 animate-slide-up">
            <div className="card-elevated p-4 text-center">
              <div className="text-xs" style={{color:'var(--text-secondary)'}}>Điểm khả dụng</div>
              <div className="text-2xl font-black" style={{color:'var(--primary)'}}>{myPoints.toLocaleString()} ⭐</div>
            </div>
            {[
              {name:'Voucher trà sữa size L', points: 100, emoji:'🧋', stock: 5},
              {name:'Ngày nghỉ phép thêm', points: 500, emoji:'🏖️', stock: 2},
              {name:'Voucher GrabFood 50K', points: 200, emoji:'🛵', stock: 10},
              {name:'Áo thun team', points: 300, emoji:'👕', stock: 3},
              {name:'Bonus lương 200K', points: 1000, emoji:'💵', stock: 1},
              {name:'Voucher Spotify 1 tháng', points: 150, emoji:'🎵', stock: 8},
            ].map((item, i) => (
              <div key={i} className="card p-3 flex items-center gap-3">
                <div className="text-2xl w-10 text-center">{item.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs" style={{color:'var(--text-secondary)'}}>Còn {item.stock} phần</div>
                </div>
                <button className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{
                  background: myPoints >= item.points ? 'var(--primary)' : 'var(--gray-200)',
                  color: myPoints >= item.points ? 'white' : 'var(--text-muted)',
                  cursor: myPoints >= item.points ? 'pointer' : 'not-allowed',
                }}>
                  {item.points} ⭐
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
