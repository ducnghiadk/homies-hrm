'use client';

import Link from 'next/link';
import { getSetupProgress } from '@/lib/mock-data/settings';

export function SetupWizardBanner() {
  const progress = getSetupProgress();

  if (progress.percentage === 100) return null;

  return (
    <div className="rounded-2xl p-4 border" style={{
      background: 'linear-gradient(135deg, #f8f4e8 0%, #fff7d7 100%)',
      borderColor: '#f8d36b',
    }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary, #111)' }}>Thiết lập hệ thống</h3>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress.percentage}%`, background: 'linear-gradient(90deg, #17362f, #113b32)' }}
              />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#6b7280' }}>
              {progress.completed}/{progress.total}
            </span>
          </div>

          {progress.nextStep && (
            <p className="text-xs" style={{ color: '#6b7280' }}>
              Tiếp theo: <span className="font-semibold">{progress.nextStep.icon} {progress.nextStep.title}</span>
            </p>
          )}
        </div>

        {progress.nextStep && (
          <Link
            href={progress.nextStep.href}
            className="px-4 py-2 text-white text-xs font-semibold rounded-lg whitespace-nowrap shadow-sm"
            style={{ background: '#17362f', transition: 'opacity 0.2s' }}
          >
            Thiết lập ngay →
          </Link>
        )}
      </div>
    </div>
  );
}
