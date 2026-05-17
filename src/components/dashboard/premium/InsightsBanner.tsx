'use client';

import { useState } from 'react';

interface Insight { id: string; type: 'positive' | 'negative' | 'neutral' | 'tip'; icon: string; message: string; action?: { label: string; href: string }; }
interface Props { insights: Insight[]; }

export function InsightsBanner({ insights }: Props) {
  const [idx, setIdx] = useState(0);
  if (insights.length === 0) return null;

  const styles: Record<string, string> = {
    positive: 'from-emerald-50 to-teal-50 border-emerald-200',
    negative: 'from-red-50 to-rose-50 border-red-200',
    neutral: 'from-blue-50 to-indigo-50 border-blue-200',
    tip: 'from-amber-50 to-orange-50 border-amber-200',
  };
  const cur = insights[idx];

  return (
    <div className={`bg-gradient-to-r ${styles[cur.type]} rounded-2xl p-4 border relative overflow-hidden`}>
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/30 rounded-full blur-xl" />
      <div className="relative flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{cur.icon}</span>
        <div className="flex-1">
          <p className="text-sm text-gray-700 font-medium">{cur.message}</p>
          {cur.action && <a href={cur.action.href} className="inline-block mt-2 text-sm text-purple-600 font-medium hover:underline">{cur.action.label} →</a>}
        </div>
        {insights.length > 1 && (
          <div className="flex gap-1">
            {insights.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-purple-500 w-4' : 'bg-gray-300'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
