'use client';

import Link from 'next/link';

interface ActionItem {
  id: string; icon: string; title: string; description?: string;
  href: string; priority: 'urgent' | 'high' | 'medium' | 'low';
  badge?: number; deadline?: string;
}

interface Props { items: ActionItem[]; maxVisible?: number; viewAllHref?: string; }

export function ActionList({ items, maxVisible = 5, viewAllHref }: Props) {
  if (items.length === 0) {
    return (
      <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-2xl p-6 text-center border border-emerald-200">
        <span className="text-4xl mb-3 block">✨</span>
        <p className="font-semibold text-emerald-700">Tuyệt vời!</p>
        <p className="text-sm text-emerald-600 mt-1">Không có việc cần xử lý</p>
      </div>
    );
  }

  const urgent = items.filter(i => i.priority === 'urgent');
  const visible = items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;
  const pStyles: Record<string, string> = {
    urgent: 'bg-error-50 border-error-200 hover:border-error-300',
    high: 'bg-warning-50 border-warning-200 hover:border-warning-300',
    medium: 'bg-primary-50 border-primary-200 hover:border-primary-300',
    low: 'bg-gray-50 border-gray-200 hover:border-gray-300',
  };

  return (
    <div className={`rounded-2xl p-4 border ${urgent.length > 0 ? 'bg-gradient-to-br from-error-50 to-error-100 border-error-200' : 'bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{urgent.length > 0 ? '🔴' : '📋'}</span>
          <h3 className={`font-semibold ${urgent.length > 0 ? 'text-error-700' : 'text-warning-700'}`}>Cần xử lý ({items.length})</h3>
        </div>
        {viewAllHref && hasMore && <Link href={viewAllHref} className="text-sm text-primary-600 font-medium hover:underline">Xem tất cả →</Link>}
      </div>
      <div className="space-y-2">
        {visible.map(item => (
          <Link key={item.id} href={item.href} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${pStyles[item.priority]}`}>
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.title}</p>
              {item.description && <p className="text-sm text-gray-500 truncate">{item.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {item.badge && item.badge > 0 && <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">{item.badge}</span>}
              <span className="text-gray-400">→</span>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && <p className="text-center text-sm text-gray-500 mt-3">+{items.length - maxVisible} mục khác</p>}
    </div>
  );
}
