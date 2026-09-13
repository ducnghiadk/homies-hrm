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
  Minimize2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { HermesConfigService } from '@/lib/hermes/hermes-config-service';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export function AdminCopilotDrawer() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Xin chào! Em là Trợ lý Hermes của chuỗi Homies Milk Tea. Anh có thể hỏi em bất kỳ điều gì về vận hành, hoặc nhờ em rà soát lỗi logic bảng lương, phân ca, hay báo sự cố nhé!',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lắng nghe sự kiện mở từ Header
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-hermes-copilot', handleOpen);
    return () => window.removeEventListener('open-hermes-copilot', handleOpen);
  }, []);

  // Tự cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  if (!mounted || !isAuthenticated || !user) {
    return null;
  }

  const handleSend = async (textToSend?: string) => {
    const userMsg = (textToSend || input).trim();
    if (!userMsg || loading) return;

    setInput('');
    const updatedMessages = [...messages, { role: 'user' as const, text: userMsg }];
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
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'Dạ em đã nhận thông tin.',
        },
      ]);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Không thể kết nối tới máy chủ Hermes.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ ${errorText}` },
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
      {/* NÚT BẬT Ô CHAT (Góc dưới bên phải - Thanh lịch chuẩn Apple F&B) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-full shadow-lg hover:shadow-xl border-2 border-white/90 transition-all duration-200 hover:scale-105 active:scale-95 text-xs sm:text-sm font-bold"
          title="Mở ô chat Trợ lý Hermes"
        >
          <Bot className="w-5 h-5 text-amber-200" />
          <span>Trợ lý Hermes</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-300/40" />
        </button>
      )}

      {/* Ô CHAT NỔI (CHAT POPUP - Đúng nghĩa ô chat, thẩm mỹ và gọn nhẹ) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-80px)] bg-white rounded-3xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
          {/* Header ô chat */}
          <div className="px-4 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center shadow-2xs border border-blue-100/60">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#001D3D] leading-tight flex items-center gap-1.5">
                  Trợ lý Hermes
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-gray-500 font-medium">
                    Sẵn sàng hỗ trợ vận hành
                  </span>
                </div>
              </div>
            </div>

            {/* Cụm nút: Cài đặt cắm bot & Thu nhỏ ô chat */}
            <div className="flex items-center gap-1">
              <Link
                href="/settings/hermes"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-[#2F6FA8] hover:bg-gray-100 rounded-xl transition"
                title="Cài đặt kết nối Bot Hermes"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                title="Thu nhỏ ô chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Khung nội dung đối thoại (Feed tin nhắn chuẩn Chat) */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-[#FAF8F5]">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              const hasTicket = m.text.includes('[ANTIGRAVITY TASK TICKET]') || m.text.includes('ANTIGRAVITY');

              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs ${
                      isUser
                        ? 'bg-[#2F6FA8] text-white rounded-br-xs shadow-xs font-medium'
                        : 'bg-white text-[#001D3D] rounded-bl-xs border border-gray-200/70 shadow-2xs whitespace-pre-wrap'
                    }`}
                  >
                    {!isUser && hasTicket && (
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100">
                        <span className="text-[10px] font-bold text-[#2F6FA8] flex items-center gap-1">
                          <Sparkles size={12} />
                          Phiếu Task cho Antigravity
                        </span>
                        <button
                          onClick={() => handleCopyTicket(m.text, idx)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#2F6FA8] hover:bg-blue-100 transition text-[10px] font-bold"
                          title="Sao chép nội dung ticket"
                        >
                          {copiedIndex === idx ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedIndex === idx ? 'Đã copy' : 'Copy Ticket'}</span>
                        </button>
                      </div>
                    )}
                    {m.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200/70 text-gray-500 rounded-2xl rounded-bl-xs px-3.5 py-2 text-xs flex items-center gap-2 shadow-2xs italic">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-[#2F6FA8]" />
                  <span>Hermes đang soạn câu trả lời...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Dải gợi ý nhanh dạng Chip mỏng (Gọn gàng, không choán diện tích) */}
          <div className="px-3 py-1.5 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <button
              onClick={() =>
                handleSend(
                  'Kiểm tra logic tính lương: rà soát công thức tính OT, phụ cấp cơm F&B và trừ phạt KPI xem có điểm nào bất hợp lý hoặc lỗi không'
                )
              }
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-blue-50 hover:text-[#2F6FA8] border border-gray-200 text-gray-700 whitespace-nowrap transition text-[11px] font-medium flex items-center gap-1 shrink-0"
            >
              <FileSpreadsheet size={12} className="text-[#2F6FA8]" />
              <span>Soát Bảng lương</span>
            </button>
            <button
              onClick={() =>
                handleSend(
                  'Kiểm tra logic phân ca: rà soát quy tắc xếp ca, giới hạn giờ làm/tuần và khoảng nghỉ giữa 2 ca có xung đột không'
                )
              }
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-blue-50 hover:text-[#2F6FA8] border border-gray-200 text-gray-700 whitespace-nowrap transition text-[11px] font-medium flex items-center gap-1 shrink-0"
            >
              <Calendar size={12} className="text-[#2F6FA8]" />
              <span>Soát Phân ca</span>
            </button>
            <button
              onClick={() =>
                handleSend(
                  'Kiểm tra logic kiểm kho BTP: rà soát cơ chế tính hao hụt và công thức định mức nguyên vật liệu'
                )
              }
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-blue-50 hover:text-[#2F6FA8] border border-gray-200 text-gray-700 whitespace-nowrap transition text-[11px] font-medium flex items-center gap-1 shrink-0"
            >
              <Package size={12} className="text-[#2F6FA8]" />
              <span>Soát Kho BTP</span>
            </button>
            <button
              onClick={() =>
                handleSend(
                  'Báo sự cố: Giao diện thao tác đang gặp lỗi hoặc không lưu được dữ liệu, nhờ Hermes kiểm tra log telemetry gần nhất'
                )
              }
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-rose-50 hover:text-rose-700 border border-gray-200 text-gray-700 whitespace-nowrap transition text-[11px] font-medium flex items-center gap-1 shrink-0"
            >
              <AlertCircle size={12} className="text-rose-500" />
              <span>Báo sự cố</span>
            </button>
          </div>

          {/* Ô nhập chat & Phím gửi hình tròn thanh lịch */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi hoặc yêu cầu Hermes..."
              className="flex-1 px-4 py-2 bg-gray-100/80 focus:bg-white border border-transparent focus:border-[#2F6FA8] rounded-full text-xs text-gray-900 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-full bg-[#2F6FA8] hover:bg-[#1D3E61] text-white flex items-center justify-center transition disabled:opacity-30 shadow-xs shrink-0"
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
