'use client'

interface StreakEntry {
  employee_id: string
  name: string
  streak_months: number
  type: 'top_performer' | 'consistent'
}

interface StreaksCardProps {
  streaks: StreakEntry[]
}

export default function StreaksCard({ streaks }: StreaksCardProps) {
  if (!streaks.length) return null

  const topPerf = streaks.filter(s => s.type === 'top_performer')
  const consistent = streaks.filter(s => s.type === 'consistent')

  return (
    <div className="card p-4 space-y-3 animate-fade-in">
      <h3 className="text-xs font-bold flex items-center gap-1">🏆 Thành tích nổi bật</h3>

      {topPerf.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase mb-1.5" style={{ color: '#dc2626' }}>
            🔥 Chuỗi Top Performer
          </div>
          <div className="flex flex-wrap gap-2">
            {topPerf.map(s => (
              <div key={s.employee_id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: '#fef2f2', color: '#991b1b' }}>
                {s.name.split(' ').slice(-1)[0]} — {s.streak_months} tháng
              </div>
            ))}
          </div>
        </div>
      )}

      {consistent.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase mb-1.5" style={{ color: '#059669' }}>
            ⭐ KPI ≥ 85 liên tục
          </div>
          <div className="flex flex-wrap gap-2">
            {consistent.map(s => (
              <div key={s.employee_id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: '#ecfdf5', color: '#065f46' }}>
                {s.name.split(' ').slice(-1)[0]} — {s.streak_months} tháng
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
