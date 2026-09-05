'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockCourses, mockMyEnrollments, mockCertificates, mockSkillMatrix, COURSE_CATEGORIES } from '@/lib/mock-data-p5'
import { Award, CheckCircle, Lock, Play } from 'lucide-react'

export default function LearningPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'courses'|'my'|'certs'|'skills'>('courses')
  const [filterCat, setFilterCat] = useState('all')

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/learning')
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated) {
    return (
      <AppShell title="Học tập & Phát triển 📚">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  const filtered = mockCourses.filter(c => filterCat === 'all' || c.category === filterCat)
  const myInProgress = mockMyEnrollments.filter(e => e.status === 'in_progress')
  const myCompleted = mockMyEnrollments.filter(e => e.status === 'completed')

  return (
    <AppShell title="Học tập & Phát triển 📚">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 animate-fade-in">
          <div className="card p-3 text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{myCompleted.length}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Hoàn thành</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--warning)' }}>{myInProgress.length}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Đang học</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--success)' }}>{mockCertificates.length}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Chứng chỉ</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 animate-fade-in">
          {[
            { k: 'courses' as const, l: '📚 Khóa học' },
            { k: 'my' as const, l: '📖 Của tôi' },
            { k: 'certs' as const, l: '🏅 Chứng chỉ' },
            { k: 'skills' as const, l: '⭐ Kỹ năng' },
          ].map(({ k, l }) => (
            <button key={k} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: tab === k ? 'var(--primary)' : 'var(--gray-100)', color: tab === k ? 'white' : 'var(--text-secondary)' }}
              onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* COURSES */}
        {tab === 'courses' && (
          <div className="space-y-3 animate-slide-up">
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                style={{ background: filterCat === 'all' ? 'var(--primary)' : 'var(--gray-100)', color: filterCat === 'all' ? 'white' : 'var(--text-secondary)' }}
                onClick={() => setFilterCat('all')}>Tất cả</button>
              {COURSE_CATEGORIES.map(c => (
                <button key={c.key} className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                  style={{ background: filterCat === c.key ? `${c.color}15` : 'var(--gray-100)', color: filterCat === c.key ? c.color : 'var(--text-secondary)', border: filterCat === c.key ? `1px solid ${c.color}` : '1px solid transparent' }}
                  onClick={() => setFilterCat(c.key)}>{c.label}</button>
              ))}
            </div>
            {filtered.map(course => {
              const enrollment = mockMyEnrollments.find(e => e.course_id === course.id)
              const cat = COURSE_CATEGORIES.find(c => c.key === course.category)
              return (
                <div key={course.id} className="card p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: `${cat?.color}15` }}>{course.thumbnail}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{course.title}</span>
                        {course.required && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>Bắt buộc</span>}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {course.modules} bài · {course.duration} phút · {cat?.label}
                      </div>
                      {enrollment && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span style={{ color: 'var(--text-muted)' }}>Tiến độ</span>
                            <span className="font-bold">{enrollment.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'var(--gray-200)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${enrollment.progress}%`, background: enrollment.progress === 100 ? 'var(--success)' : 'var(--primary)' }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: enrollment ? (enrollment.progress === 100 ? 'var(--success-light)' : 'var(--primary-light)') : 'var(--gray-100)' }}>
                      {enrollment?.progress === 100 ? <CheckCircle size={16} style={{ color: 'var(--success)' }} /> : enrollment ? <Play size={14} style={{ color: 'var(--primary)' }} /> : <Lock size={14} style={{ color: 'var(--text-muted)' }} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* MY LEARNING */}
        {tab === 'my' && (
          <div className="space-y-3 animate-slide-up">
            {myInProgress.length > 0 && <h3 className="text-sm font-bold">📖 Đang học</h3>}
            {myInProgress.map(e => {
              const course = mockCourses.find(c => c.id === e.course_id)!
              return (
                <div key={e.course_id} className="card p-4" style={{ borderLeft: '3px solid var(--primary)' }}>
                  <div className="text-sm font-semibold">{course.thumbnail} {course.title}</div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>{e.progress}% hoàn thành</span>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>Tiếp tục →</span>
                  </div>
                  <div className="h-2 rounded-full mt-1" style={{ background: 'var(--gray-200)' }}>
                    <div className="h-full rounded-full" style={{ width: `${e.progress}%`, background: 'var(--primary)' }} />
                  </div>
                </div>
              )
            })}
            {myCompleted.length > 0 && <h3 className="text-sm font-bold mt-4">✅ Đã hoàn thành</h3>}
            {myCompleted.map(e => {
              const course = mockCourses.find(c => c.id === e.course_id)!
              return (
                <div key={e.course_id} className="card p-3 flex items-center gap-3" style={{ borderLeft: '3px solid var(--success)' }}>
                  <div className="text-xl">{course.thumbnail}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{course.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Quiz: {e.quiz_score}% · {e.completed_at}</div>
                  </div>
                  <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                </div>
              )
            })}
          </div>
        )}

        {/* CERTIFICATES */}
        {tab === 'certs' && (
          <div className="space-y-3 animate-slide-up">
            {mockCertificates.map(cert => (
              <div key={cert.id} className="card-elevated p-4 text-center" style={{ background: 'linear-gradient(135deg, #FFD70010, #FFA50010)', border: '1px solid #FFD70040' }}>
                <div className="text-3xl mb-1">{cert.emoji}</div>
                <div className="text-sm font-bold">{cert.course_title}</div>
                <div className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{cert.number}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Cấp ngày: {cert.issued_at}</div>
                <Award size={20} className="mx-auto mt-2" style={{ color: '#FFD700' }} />
              </div>
            ))}
            {mockCertificates.length === 0 && (
              <div className="card p-8 text-center">
                <Award size={32} className="mx-auto mb-2" style={{ color: 'var(--gray-300)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chưa có chứng chỉ nào</p>
              </div>
            )}
          </div>
        )}

        {/* SKILL MATRIX */}
        {tab === 'skills' && (
          <div className="space-y-3 animate-slide-up">
            <div className="card p-4">
              <h3 className="text-sm font-bold mb-3">⭐ Ma trận kỹ năng</h3>
              {mockSkillMatrix.map((s, i) => (
                <div key={i} className="py-2.5 border-t" style={{ borderColor: 'var(--gray-100)' }}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium">{s.skill}</span>
                    <span className="text-xs font-bold">{s.level}/{s.max}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: s.max }, (_, j) => (
                      <div key={j} className="flex-1 h-2 rounded-full" style={{ background: j < s.level ? (s.level >= 4 ? 'var(--success)' : s.level >= 3 ? 'var(--primary)' : 'var(--warning)') : 'var(--gray-200)' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Radar-like summary */}
            <div className="card p-4 text-center">
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Điểm tổng kỹ năng</div>
              <div className="text-3xl font-black mt-1" style={{ color: 'var(--primary)' }}>
                {(mockSkillMatrix.reduce((s, sk) => s + sk.level, 0) / mockSkillMatrix.length).toFixed(1)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>trên thang 5.0</div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
