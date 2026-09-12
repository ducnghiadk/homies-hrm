'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Send, ShieldAlert, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const ALLOWED_ADMIN_ROLES = ['hr_admin', 'ceo', 'store_manager', 'area_manager'];

export function AdminCopilotDrawer() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Xin chào Quản trị viên! Tôi là Hermes Copilot. Bạn có thể hỏi tôi về tình trạng lỗi hệ thống, kiểm tra log hoặc phân tích vận hành.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated || !user || !ALLOWED_ADMIN_ROLES.includes(user.role)) {
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const updatedMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/hermes/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: updatedMessages.slice(-6),
          user_id: user.id,
          user_role: user.role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply || 'Không có phản hồi' }]);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Lỗi kết nối tới Hermes Copilot API.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ ${errorText}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Admin Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 backdrop-blur text-amber-400 border border-amber-500/40 rounded-full shadow-lg hover:bg-zinc-800 transition text-xs font-semibold"
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Hermes Copilot</span>
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-zinc-900 text-zinc-100 shadow-2xl border-l border-zinc-800 flex flex-col font-sans animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-sm">Hermes Admin Copilot</h3>
                <p className="text-[10px] text-zinc-400">Trợ lý Chẩn đoán Hệ thống</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-amber-600 text-white ml-6'
                    : 'bg-zinc-800 text-zinc-200 mr-6 border border-zinc-700/50 whitespace-pre-wrap'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-xl bg-zinc-800 text-zinc-400 text-xs italic mr-6">
                Hermes đang rà soát dữ liệu...
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-950 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về lỗi, hệ thống hoặc công thức..."
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg font-bold transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
