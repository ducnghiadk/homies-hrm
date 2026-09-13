'use client';

interface Badge { id: string; icon: string; label: string; value: string | number; isNew?: boolean; }
interface Props { badges: Badge[]; newAchievement?: string; }

export function AchievementBadges({ badges, newAchievement }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      {newAchievement && (
        <div className="mb-4 p-3 bg-gradient-to-r from-warning-50 to-warning-100 rounded-xl border border-warning-200">
          <p className="text-sm text-warning-700 flex items-center gap-2">
            <span className="text-lg">🎉</span><span>Mới đạt: <strong>{newAchievement}</strong></span>
          </p>
        </div>
      )}
      <div className="flex justify-around">
        {badges.map(b => (
          <div key={b.id} className="text-center relative">
            {b.isNew && <div className="absolute -top-1 -right-1 w-3 h-3 bg-error-500 rounded-full animate-pulse" />}
            <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
              <span className="text-2xl">{b.icon}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{b.value}</p>
            <p className="text-xs text-gray-500">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
