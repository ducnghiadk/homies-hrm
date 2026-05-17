'use client';

interface TeamMember { id: string; name: string; avatar?: string; status: 'checked_in' | 'upcoming' | 'off'; }
interface Shift { id: string; name: string; time: string; icon: string; members: TeamMember[]; required: number; }
interface Props { shifts: Shift[]; onFindReplacement?: (shiftId: string) => void; }

export function TeamOverview({ shifts, onFindReplacement }: Props) {
  return (
    <div className="space-y-4">
      {shifts.map(shift => {
        const full = shift.members.length >= shift.required;
        const checkedIn = shift.members.filter(m => m.status === 'checked_in').length;
        return (
          <div key={shift.id} className={`rounded-2xl p-4 border transition-all ${full ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{shift.icon}</span>
                <div><p className="font-semibold text-gray-900">{shift.name}</p><p className="text-xs text-gray-500">{shift.time}</p></div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${full ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {shift.members.length}/{shift.required} {full ? '✅' : '⚠️'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {shift.members.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">{m.avatar || '👤'}</div>
                    {m.status === 'checked_in' && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{m.name}</span>
                </div>
              ))}
              {!full && onFindReplacement && (
                <button onClick={() => onFindReplacement(shift.id)} className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200 hover:bg-amber-200 transition-colors text-sm font-medium">
                  <span>❓</span><span>Tìm người thay</span>
                </button>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200/50 text-xs text-gray-500">{checkedIn}/{shift.members.length} đã check-in</div>
          </div>
        );
      })}
    </div>
  );
}
