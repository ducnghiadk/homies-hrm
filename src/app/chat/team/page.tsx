'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockChatGroups, mockChatMessages, mockDMThreads } from '@/lib/mock-data-communication'
import { Users, Send } from 'lucide-react'

export default function TeamChatPage() {
  const [tab, setTab] = useState<'groups' | 'dm'>('groups')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const group = mockChatGroups.find(g => g.id === activeGroup)
  const groupMessages = mockChatMessages.filter(m => m.group_id === activeGroup)

  if (group) {
    return (
      <AppShell title={group.name}>
        <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex-1 overflow-y-auto space-y-2 pb-4">
            {groupMessages.map(m => (
              <div key={m.id} className={`flex ${m.sender_id === 'emp-005' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] rounded-2xl px-3 py-2"
                  style={{
                    background: m.sender_id === 'emp-005' ? 'var(--primary)' : 'var(--gray-100)',
                    color: m.sender_id === 'emp-005' ? '#fff' : 'var(--text-primary)',
                  }}>
                  {m.sender_id !== 'emp-005' && (
                    <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--primary)' }}>{m.sender_name}</div>
                  )}
                  <div className="text-xs">{m.content}</div>
                  <div className="text-[9px] mt-0.5 text-right" style={{ opacity: 0.6 }}>
                    {new Date(m.created_at).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}
                    {m.is_pinned && ' 📌'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--gray-100)' }}>
            <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Nhắn tin..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', color: 'var(--text-primary)' }} />
            <button className="btn btn-primary p-2.5 rounded-xl"><Send size={18} /></button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Chat nhóm">
      <div className="space-y-4">
        <div className="flex gap-2 animate-fade-in">
          {(['groups', 'dm'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: tab === t ? 'var(--primary)' : 'var(--gray-100)', color: tab === t ? '#fff' : 'var(--text-secondary)' }}>
              {t === 'groups' ? '👥 Nhóm' : '💬 Tin nhắn'}
            </button>
          ))}
        </div>

        {tab === 'groups' ? (
          <div className="space-y-2 animate-slide-up">
            {mockChatGroups.map(g => (
              <button key={g.id} onClick={() => setActiveGroup(g.id)} className="card w-full text-left flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'var(--primary-50)' }}>🏪</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{g.name}</span>
                    {g.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: '#D9381E' }}>
                        {g.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{g.last_message || 'Chưa có tin nhắn'}</div>
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}><Users size={8} className="inline" /> {g.member_count}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2 animate-slide-up">
            {mockDMThreads.map(d => (
              <div key={d.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: 'var(--primary-50)' }}>👤</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.participant_name}</span>
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(d.last_message_at).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{d.last_message}</div>
                </div>
                {d.unread_count > 0 && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: '#D9381E' }}>{d.unread_count}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
