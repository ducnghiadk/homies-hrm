'use client';

import React, { useState, useEffect } from 'react';
import { Send, X, Bot, CheckCircle } from 'lucide-react';
import { getRecentNetworkBreadcrumbs } from '@/lib/hermes/telemetry-core';
import { useAuthStore } from '@/store/auth-store';

export function SmartBugReporter() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyMessage, setReplyMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated || !user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const breadcrumbs = getRecentNetworkBreadcrumbs();

    try {
      const res = await fetch('/api/telemetry/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_description: description.trim(),
          route: typeof window !== 'undefined' ? window.location.pathname : '/',
          network_breadcrumbs: breadcrumbs,
          user_role: user.role || 'employee',
          user_id: user.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setReplyMessage(data.error || 'Có lỗi xảy ra khi gửi báo cáo.');
      } else if (data.reply) {
        setReplyMessage(data.reply);
      }
    } catch {
      setReplyMessage('Đã gửi phản ánh! Hermes sẽ rà soát và thông báo cho kỹ thuật viên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setDescription('');
    setReplyMessage(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-xs font-semibold"
        >
          <Bot className="w-4 h-4" />
          <span>Báo sự cố cho Hermes</span>
        </button>
      )}

      {/* Modal / Dialog */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h4 className="font-bold text-sm leading-tight">Trợ lý Hermes</h4>
                <p className="text-[10px] text-amber-100">Báo cáo lỗi & sự cố thao tác</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 text-xs">
            {replyMessage ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" /> Phản hồi từ Hermes:
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed">{replyMessage}</p>
                <button
                  onClick={handleClose}
                  className="w-full mt-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Bạn đang gặp khó khăn gì? Hãy mô tả ngắn gọn, Hermes sẽ thu thập bối cảnh trang để báo cho kỹ thuật:
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Em bấm Xác nhận kiểm kho chi nhánh A mà màn hình không lưu được..."
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3 py-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow disabled:opacity-50 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Đang gửi...' : 'Gửi phản ánh'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
