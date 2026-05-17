'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getEmployeeById } from '@/lib/mock-data'
import { mockChatRooms, mockMessages } from '@/lib/mock-data-p3'
import { getInitials } from '@/lib/utils'
import { Send, ArrowLeft, Hash, Megaphone, MessageCircle } from 'lucide-react'

export default function ChatPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activeRoom, setActiveRoom] = useState<string|null>(null)
  const [newMsg, setNewMsg] = useState('')
  const [messages, setMessages] = useState(mockMessages)
  const msgEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const room = mockChatRooms.find(r => r.id === activeRoom)
  const roomMessages = messages.filter(m => m.room_id === activeRoom)

  const handleSend = () => {
    if (!newMsg.trim() || !activeRoom) return
    const msg = {
      id: `msg-new-${Date.now()}`, room_id: activeRoom, sender_id: user.id,
      content: newMsg, time: new Date().toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'}), type: 'text'
    }
    setMessages(prev => [...prev, msg])
    setNewMsg('')
    setTimeout(() => msgEndRef.current?.scrollIntoView({behavior:'smooth'}), 100)
  }

  // Room list view
  if (!activeRoom) {
    return (
      <AppShell title="Tin nhắn 💬">
        <div className="space-y-2 animate-slide-up">
          {mockChatRooms.map(rm => (
            <button key={rm.id} className="card p-3 w-full text-left flex items-center gap-3"
              onClick={()=>setActiveRoom(rm.id)}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{background: rm.type==='announcement' ? 'var(--accent-light)' : 'var(--primary-50)'}}>
                {rm.type === 'announcement' ? <Megaphone size={18} style={{color:'var(--accent)'}}/> : <Hash size={18} style={{color:'var(--primary)'}}/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{rm.name}</span>
                  <span className="text-xs ml-auto flex-shrink-0" style={{color:'var(--text-muted)'}}>{rm.last_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs truncate flex-1" style={{color:'var(--text-secondary)'}}>{rm.last_message}</span>
                  {rm.unread > 0 && (
                    <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                      style={{background:'var(--primary)', color:'white'}}>{rm.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* Coming soon */}
          <div className="text-center py-6" style={{color:'var(--text-muted)'}}>
            <MessageCircle size={32} className="mx-auto mb-2" style={{color:'var(--gray-300)'}}/>
            <p className="text-xs">Direct Message sắp ra mắt!</p>
          </div>
        </div>
      </AppShell>
    )
  }

  // Chat view
  return (
    <div className="h-screen flex flex-col" style={{background:'var(--background)'}}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b" style={{borderColor:'var(--gray-200)', background:'var(--surface)'}}>
        <button onClick={()=>setActiveRoom(null)} style={{color:'var(--primary)'}}>
          <ArrowLeft size={20}/>
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{background:'var(--primary-50)'}}>
          {room?.type === 'announcement' ? <Megaphone size={14} style={{color:'var(--accent)'}}/> : <Hash size={14} style={{color:'var(--primary)'}}/>}
        </div>
        <div>
          <div className="text-sm font-bold">{room?.name}</div>
          <div className="text-xs" style={{color:'var(--text-muted)'}}>{room?.members} thành viên</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {roomMessages.map(msg => {
          const sender = getEmployeeById(msg.sender_id)
          const isMe = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && (
                <div className="avatar flex-shrink-0" style={{width:28,height:28,fontSize:9}}>
                  {sender ? getInitials(sender.full_name) : '?'}
                </div>
              )}
              <div style={{maxWidth:'75%'}}>
                {!isMe && <div className="text-xs font-semibold mb-0.5" style={{color:'var(--primary)'}}>{sender?.full_name.split(' ').pop()}</div>}
                <div className="rounded-2xl px-3 py-2 text-sm" style={{
                  background: isMe ? 'var(--primary)' : 'var(--gray-100)',
                  color: isMe ? 'white' : 'var(--text-primary)',
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                }}>
                  {msg.content}
                </div>
                <div className={`text-[9px] mt-0.5 ${isMe ? 'text-right' : ''}`} style={{color:'var(--text-muted)'}}>{msg.time}</div>
              </div>
            </div>
          )
        })}
        <div ref={msgEndRef}/>
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2" style={{borderColor:'var(--gray-200)', background:'var(--surface)'}}>
        <input className="input flex-1 text-sm" placeholder="Nhập tin nhắn..."
          value={newMsg} onChange={e=>setNewMsg(e.target.value)}
          onKeyDown={e=>e.key==='Enter' && handleSend()}/>
        <button className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{background: newMsg.trim() ? 'var(--primary)' : 'var(--gray-200)', color: newMsg.trim() ? 'white' : 'var(--text-muted)'}}
          onClick={handleSend}
          disabled={!newMsg.trim()}>
          <Send size={16}/>
        </button>
      </div>
    </div>
  )
}
