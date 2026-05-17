'use client'

import AppShell from '@/components/layout/AppShell'
import { mockNews, mockAnnouncements } from '@/lib/mock-data-communication'
import { Pin, Eye } from 'lucide-react'

const priorityColor: Record<string, string> = { urgent: '#ef4444', high: '#f59e0b', normal: '#3b82f6', low: '#9ca3af' }

export default function NewsPage() {
  return (
    <AppShell title="Tin tức & Thông báo">
      <div className="space-y-4">
        {/* Announcements */}
        <div className="animate-fade-in">
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>📢 Thông báo quan trọng</h3>
          <div className="space-y-2">
            {mockAnnouncements.filter(a => a.is_active).map(a => {
              const color = priorityColor[a.priority] || '#3b82f6'
              return (
                <div key={a.id} className="card" style={{ borderLeft: `4px solid ${color}` }}>
                  <div className="flex items-start gap-2">
                    <Pin size={14} style={{ color, marginTop: 2 }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{a.title}</div>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{a.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: color + '20', color }}>
                          {a.priority === 'urgent' ? '🔥 Khẩn' : a.priority === 'important' ? '⚡ Cao' : 'ℹ️ Bình thường'}
                        </span>
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(a.created_at).toLocaleDateString('vi')}
                        </span>
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{a.target_audience}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* News Feed */}
        <div className="animate-slide-up">
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>📰 Tin tức nội bộ</h3>
          <div className="space-y-2">
            {mockNews.map((article, idx) => (
              <div key={article.id} className="card animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{ background: 'var(--primary-50)' }}>
                    {article.category === 'Sự kiện' ? '🎉' : article.category === 'Sản phẩm' ? '☕' : '📰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold line-clamp-2" style={{ color: 'var(--text-primary)' }}>{article.title}</div>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{article.excerpt}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>✍️ {article.author_name}</span>
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(article.published_at).toLocaleDateString('vi')}
                      </span>
                      <span className="text-[9px] flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                        ❤️ {article.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
