'use client';

interface DayShift { date: Date; shift: { name: string; icon: string; time: string } | null; isToday: boolean; }
interface Props { days: DayShift[]; totalHours?: number; }

const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function WeekCalendar({ days, totalHours }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex justify-between gap-1">
        {days.map((day, i) => (
          <div key={i} className={`flex-1 text-center py-3 px-1 rounded-xl transition-all ${day.isToday ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30' : day.shift ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-50/50'}`}>
            <p className={`text-xs font-medium ${day.isToday ? 'text-white/80' : 'text-gray-500'}`}>{dayNames[i]}</p>
            <div className="my-2">
              {day.shift ? (
                <><span className="text-2xl">{day.shift.icon}</span><p className={`text-[10px] mt-1 ${day.isToday ? 'text-white/80' : 'text-gray-500'}`}>{day.shift.time}</p></>
              ) : (
                <span className={`text-lg ${day.isToday ? 'text-white/60' : 'text-gray-300'}`}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {totalHours !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Tổng giờ tuần này</span>
          <span className="font-semibold text-gray-900">{totalHours}h {totalHours >= 40 && <span className="text-emerald-500 ml-2">✅ Đủ giờ</span>}</span>
        </div>
      )}
    </div>
  );
}
