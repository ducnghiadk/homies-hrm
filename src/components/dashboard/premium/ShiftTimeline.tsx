'use client';

interface Shift {
  id: string; name: string; startTime: string; endTime: string;
  status: 'completed' | 'current' | 'upcoming' | 'off';
}

interface Props { shift: Shift | null; onCheckIn?: () => void; }

export function ShiftTimeline({ shift, onCheckIn }: Props) {
  if (!shift || shift.status === 'off') {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 text-center">
        <span className="text-4xl mb-3 block">😴</span>
        <p className="font-semibold text-gray-700">Hôm nay bạn nghỉ</p>
        <p className="text-sm text-gray-500 mt-1">Nghỉ ngơi và nạp năng lượng nhé!</p>
      </div>
    );
  }

  const cfg: Record<string, { gradient: string; icon: string; text: string; color: string }> = {
    completed: { gradient: 'from-gray-100 to-gray-200', icon: '✅', text: 'Đã hoàn thành ca', color: 'text-gray-700' },
    current: { gradient: 'from-success-50 to-success-100', icon: '🟢', text: 'Đang trong ca làm việc', color: 'text-emerald-700' },
    upcoming: { gradient: 'from-primary-50 to-primary-100', icon: '🕐', text: 'Sắp đến ca', color: 'text-primary-700' },
  };
  const c = cfg[shift.status];

  const [sH, sM] = shift.startTime.split(':').map(Number);
  const [eH, eM] = shift.endTime.split(':').map(Number);
  const now = new Date();
  const start = new Date(); start.setHours(sH, sM, 0);
  const end = new Date(); end.setHours(eH, eM, 0);
  const total = (end.getTime() - start.getTime()) / 60000;
  const elapsed = Math.max(0, (now.getTime() - start.getTime()) / 60000);
  const progress = Math.min(100, (elapsed / total) * 100);
  const remM = Math.max(0, total - elapsed);
  const remH = Math.floor(remM / 60);
  const remMin = Math.floor(remM % 60);

  return (
    <div className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-5 border border-white/50`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{c.icon}</span>
        <div>
          <p className={`font-semibold ${c.color}`}>{c.text}</p>
          <p className="text-sm text-gray-600">{shift.name}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{shift.startTime}</span><span>{shift.endTime}</span>
        </div>
        <div className="h-3 bg-white/60 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-600 to-primary-500 rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%` }}>
            {shift.status === 'current' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary-500" />}
          </div>
        </div>
      </div>

      {shift.status === 'current' && (
        <p className="text-center text-sm text-gray-600 mb-4">Còn <span className="font-semibold text-primary-600">{remH}h {remMin}m</span> nữa</p>
      )}

      <div className="flex gap-3">
        {shift.status === 'upcoming' && onCheckIn && (
          <button onClick={onCheckIn} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-600/30 transition-all flex items-center justify-center gap-2">
            <span>📍</span><span>Check-in</span>
          </button>
        )}
            <a href="/schedules" className="flex-1 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:border-primary-300 transition-all flex items-center justify-center gap-2">
          <span>📋</span><span>Xem lịch hôm nay</span>
        </a>
      </div>
    </div>
  );
}
