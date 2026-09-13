'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Settings,
  Copy,
  Check,
  FileSpreadsheet,
  Calendar,
  Package,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { HermesConfigService } from '@/lib/hermes/hermes-config-service';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
}

export function AdminCopilotDrawer() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Xin chào! Tôi là Trợ lý Hermes. Tôi có thể hỗ trợ bạn kiểm tra logic tính lương, soát phân ca, kiểm kho BTP hoặc giải đáp các thắc mắc vận hành.',
      timestamp: 'Vừa xong',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-hermes-copilot', handleOpen);
    return () => window.removeEventListener('open-hermes-copilot', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!mounted || !isAuthenticated || !user) {
    return null;
  }

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const userMsg = promptText.trim();
    setInput('');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedMessages = [
      ...messages,
      { role: 'user' as const, text: userMsg, timestamp: timeStr },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const activeConfig = HermesConfigService.getConfig();
      const res = await fetch('/api/hermes/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: updatedMessages.slice(-6),
          user_id: user.id,
          user_role: user.role,
          bot_id: 'auto',
          client_config: activeConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi xử lý yêu cầu');
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'Không có phản hồi từ trợ lý.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Lỗi kết nối tới Hermes.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ ${errorText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicket = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      {/* NÚT TRỢ LÝ HERMES DUY NHẤT TRÊN GIAO DIỆN (Góc dưới phải - Tinh tế chuẩn Apple) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 text-xs font-bold border border-white/20"
          title="Mở khung trò chuyện Trợ lý Hermes"
        >
          <Bot className="w-4 h-4 text-amber-200" />
          <span>Trợ lý Hermes</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* KHUNG Ô CHAT HERMES (CHUẨN MINIMALIST NHƯ CHATGPT / MESSAGES) */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white text-gray-900 shadow-2xl border-l border-gray-200 flex flex-col font-sans animate-in slide-in-from-right duration-200">
          {/* 1. Header Tối Giản */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-[#2F6FA8] flex items-center justify-center border border-blue-100">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#001D3D] leading-tight">Trợ lý Hermes</h3>
                <p className="text-[11px] text-gray-400">Trực tuyến • Soát lỗi & Vận hành</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/settings/hermes"
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-[#2F6FA8] hover:bg-gray-50 rounded-xl transition"
                title="Cài đặt kết nối Bot"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition"
                title="Đóng chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Thân Khung Chat (Cuộn tin nhắn mượt mà) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              const hasTicket = m.text.includes('[ANTIGRAVITY TASK TICKET]');

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#2F6FA8] text-white rounded-tr-xs shadow-xs font-medium'
                        : 'bg-white text-gray-800 rounded-tl-xs border border-gray-200/70 shadow-2xs'
                    }`}
                  >
                    {m.text}

                    {/* Nút Copy Ticket nếu có mã việc cho Antigravity */}
                    {hasTicket && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={() => handleCopyTicket(m.text, idx)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2F6FA8] text-[11px] font-bold transition"
                        >
                          {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedIndex === idx ? 'Đã sao chép' : 'Sao chép Ticket'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {m.timestamp && (
                    <span className="text-[10px] text-gray-400 px-1">{m.timestamp}</span>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-gray-200/70 text-xs text-gray-500 w-fit shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#2F6FA8]" />
                <span>Hermes đang soạn câu trả lời...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 3. Gợi Ý Soát Nhanh (Thanh lịch ngay trên ô nhập) */}
          <div className="px-3 py-1.5 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <button
              onClick={() => handleSendPrompt('Kiểm tra logic tính lương')}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-[#2F6FA8] border border-gray-200 transition flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              <FileSpreadsheet size={11} className="text-[#2F6FA8]" />
              <span>Soát Bảng lương</span>
            </button>
            <button
              onClick={() => handleSendPrompt('Kiểm tra logic phân ca')}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-[#2F6FA8] border border-gray-200 transition flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              <Calendar size={11} className="text-[#2F6FA8]" />
              <span>Soát Phân ca</span>
            </button>
            <button
              onClick={() => handleSendPrompt('Kiểm tra logic kiểm kho BTP')}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-[#2F6FA8] border border-gray-200 transition flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              <Package size={11} className="text-[#2F6FA8]" />
              <span>Soát Kho BTP</span>
            </button>
            <button
              onClick={() => handleSendPrompt('Tôi muốn báo một sự cố thao tác')}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 border border-gray-200 transition flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              <AlertCircle size={11} className="text-rose-500" />
              <span>Báo sự cố</span>
            </button>
          </div>

          {/* 4. Ô Nhập Tin Nhắn Dạng Capsule (Chuẩn iMessage / ChatGPT) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(input);
            }}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn cho Hermes..."
              className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 focus:bg-white text-xs text-gray-900 border border-transparent focus:border-[#2F6FA8] focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-[#2F6FA8] hover:bg-[#1D3E61] text-white flex items-center justify-center transition disabled:opacity-30 shrink-0 shadow-xs"
              title="Gửi tin nhắn"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
