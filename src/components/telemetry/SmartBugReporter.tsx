'use client';

import React, { useState, useEffect } from 'react';
import { Send, X, Bot, CheckCircle, AlertCircle } from 'lucide-react';
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
          user_id: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReplyMessage(data.error || 'Có lỗi xảy ra khi gửi báo cáo.');
      } else if (data.reply) {
        setReplyMessage(data.reply);
      }
    } catch {
      setReplyMessage('Đã gửi phản ánh! Hermes sẽ rà soát và thông báo cho quản lý.');
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
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-full shadow-lg hover:shadow-xl transition-all text-xs font-bold border border-white/20"
        >
          <Bot className="w-4 h-4 text-amber-200" />
          <span>Báo sự cố cho Hermes</span>
        </button>
      )}

      {/* Modal / Dialog */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white border border-gray-200/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-[#2F6FA8] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm leading-tight">Trợ lý Hermes</h4>
                <p className="text-[10px] text-blue-100">Báo cáo lỗi & sự cố thao tác</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 text-xs">
            {replyMessage ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Phản hồi từ Hermes:
                </div>
                <p className="text-gray-700 text-xs leading-relaxed">{replyMessage}</p>
                <button
                  onClick={handleClose}
                  className="w-full mt-2 py-2 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-xl font-bold transition shadow-xs"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-gray-600 leading-relaxed">
                  Bạn đang gặp khó khăn gì? Hãy mô tả ngắn gọn, Hermes sẽ tự thu thập thông tin mạng và gửi đến bộ phận hỗ trợ:
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Em bấm Xác nhận kiểm kho chi nhánh A mà màn hình không lưu được..."
                  rows={3}
                  required
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:bg-white focus:outline-none focus:border-[#2F6FA8] text-xs resize-none transition"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3.5 py-1.5 text-gray-500 hover:text-gray-800 font-medium transition text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-xl font-bold shadow-xs disabled:opacity-50 transition text-xs"
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
