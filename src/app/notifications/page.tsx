'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockNotifications } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { Bell, CheckCircle, AlertTriangle, Info, Megaphone, X } from 'lucide-react'

const iconMap: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  schedule: { icon: Bell, bg: 'var(--shift-morning)', color: 'white' },
  request: { icon: AlertTriangle, bg: 'var(--warning)', color: 'white' },
  system: { icon: Info, bg: 'var(--secondary)', color: 'white' },
  achievement: { icon: CheckCircle, bg: 'var(--success)', color: 'white' },
  announcement: { icon: Megaphone, bg: 'var(--primary)', color: 'white' },
}

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const notifications = mockNotifications.filter(n => !dismissed.has(n.id))
  const markRead = (id: string) => setReadIds(prev => new Set([...prev, id]))
  const dismiss = (id: string) => setDismissed(prev => new Set([...prev, id]))

  const unreadCount = notifications.filter(n => !n.is_read && !readIds.has(n.id)).length

  return (
    <AppShell title={`Thông báo ${unreadCount > 0 ? `(${unreadCount})` : ''}`}>
      <div className="space-y-2 animate-slide-up">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} style={{color:'var(--gray-300)', margin:'0 auto 16px'}}/>
            <p className="text-sm" style={{color:'var(--text-muted)'}}>Không có thông báo</p>
          </div>
        ) : (
          <>
            {unreadCount > 0 && (
              <button className="text-xs font-medium mb-2" style={{color:'var(--primary)'}}
                onClick={() => notifications.forEach(n => markRead(n.id))}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
            {notifications.map((notif, i) => {
              const isRead = notif.is_read || readIds.has(notif.id)
              const cfg = iconMap[notif.type] || iconMap['system']
              const Icon = cfg.icon
              return (
                <div key={notif.id} className="card p-3 relative transition-all"
                  onClick={() => markRead(notif.id)}
                  style={{
                    opacity: isRead ? 0.7 : 1,
                    borderLeft: isRead ? '3px solid transparent' : `3px solid ${cfg.bg}`,
                    cursor: 'pointer',
                    animationDelay: `${i * 0.05}s`
                  }}>
                  <button onClick={e => {e.stopPropagation(); dismiss(notif.id)}}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{background:'var(--gray-100)'}}>
                    <X size={10}/>
                  </button>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{background:cfg.bg + '20'}}>
                      <Icon size={14} style={{color:cfg.bg}}/>
                    </div>
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{notif.title}</h4>
                        {!isRead && <div className="w-2 h-2 rounded-full" style={{background:'var(--primary)'}}/>}
                      </div>
                      <p className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>{notif.body}</p>
                      <span className="text-xs mt-1 block" style={{color:'var(--text-muted)'}}>{formatDate(notif.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </AppShell>
  )
}
