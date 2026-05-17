'use client';

interface Props {
  value: number; max?: number; size?: 'sm' | 'md' | 'lg';
  label?: string; sublabel?: string; color?: 'purple' | 'emerald' | 'amber' | 'red';
}

export function ProgressRing({ value, max = 100, size = 'md', label, sublabel, color = 'purple' }: Props) {
  const pct = Math.min(100, (value / max) * 100);
  const sizes = { sm: { r: 80, s: 6, t: 'text-lg', l: 'text-xs' }, md: { r: 120, s: 8, t: 'text-2xl', l: 'text-sm' }, lg: { r: 160, s: 10, t: 'text-3xl', l: 'text-base' } };
  const cols: Record<string, string> = { purple: '#8B5CF6', emerald: '#10B981', amber: '#F59E0B', red: '#EF4444' };
  const { r, s, t, l } = sizes[size];
  const radius = (r - s) / 2;
  const circ = radius * 2 * Math.PI;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: r, height: r }}>
        <svg width={r} height={r} className="transform -rotate-90">
          <circle cx={r / 2} cy={r / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={s} />
          <circle cx={r / 2} cy={r / 2} r={radius} fill="none" stroke={cols[color]} strokeWidth={s} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${t} text-gray-900`}>{value}</span>
          {max !== 100 && <span className="text-xs text-gray-400">/ {max}</span>}
        </div>
      </div>
      {label && <p className={`mt-2 font-medium text-gray-700 ${l}`}>{label}</p>}
      {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
    </div>
  );
}
