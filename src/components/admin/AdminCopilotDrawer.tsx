'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bot,
  Send,
  X,
  Minus,
  Sparkles,
  Settings,
  Copy,
  Check,
  FileSpreadsheet,
  Calendar,
  Clock,
  Package,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { HermesConfigService } from '@/lib/hermes/hermes-config-service';
import { payrollAdapter } from '@/lib/adapters';
import { HermesAction } from '@/lib/hermes/hermes-action-types';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  action?: HermesAction | null;
}

export function AdminCopilotDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [activeSource, setActiveSource] = useState<'ai_gateway' | 'local' | 'unknown'>('unknown');
  const [hasActiveScreenError, setHasActiveScreenError] = useState(false);
  const [actionStatuses, setActionStatuses] = useState<Record<string, 'pending' | 'executing' | 'executed' | 'cancelled'>>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Xin chào! Tôi là Trợ lý Hermes. Tôi có thể hỗ trợ bạn kiểm tra logic tính lương, soát phân ca, kiểm kho BTP, điều hướng màn hình hoặc nhập liệu phiếu thưởng/phạt theo yêu cầu.',
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
    const handleOpen = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('open-hermes-copilot', handleOpen);
    return () => window.removeEventListener('open-hermes-copilot', handleOpen);
  }, []);

  useEffect(() => {
    const checkActiveError = () => {
      try {
        const raw = sessionStorage.getItem('hermes_last_active_error');
        setHasActiveScreenError(Boolean(raw));
      } catch {}
    };
    checkActiveError();
    window.addEventListener('hermes-active-error', checkActiveError);
    return () => window.removeEventListener('hermes-active-error', checkActiveError);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleExecuteAction = async (action: HermesAction) => {
    if (!action || !action.id) return;
    setActionStatuses((prev) => ({ ...prev, [action.id]: 'executing' }));

    try {
      if (action.type === 'create_deduction' || action.type === 'create_bonus') {
        const d = action.data as Record<string, unknown>;
        const success = await payrollAdapter.saveTicketTransaction({
          employee_id: d.employee_id,
          employee_name: d.employee_name,
          amount: Number(d.amount) || 0,
          converted_amount: Number(d.amount) || 0,
          type: d.ticket_type || (action.type === 'create_deduction' ? 'Phiếu phạt' : 'Phiếu thưởng'),
          scope: 'date',
          date: d.date || new Date().toLocaleDateString('vi-VN'),
          period_id: d.period_id || '2026-02',
          calc_type: 'amount',
          note: d.note || '',
        });

        if (success) {
          setActionStatuses((prev) => ({ ...prev, [action.id]: 'executed' }));
          window.dispatchEvent(
            new CustomEvent('homies-data-changed', {
              detail: { type: action.type, data: action.data },
            })
          );
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              text: `✅ Đã lưu thành công **${action.title}** cho nhân viên **${d.employee_name}** (${Number(d.amount).toLocaleString('vi-VN')} đ) vào bảng lương!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          throw new Error('Lỗi khi lưu phiếu vào cơ sở dữ liệu');
        }
      } else if (action.type === 'navigate') {
        const d = action.data as Record<string, unknown>;
        if (d.url && typeof d.url === 'string') {
          router.push(d.url);
          setIsMinimized(true);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi thực thi thao tác';
      setActionStatuses((prev) => ({ ...prev, [action.id]: 'pending' }));
      alert(msg);
    }
  };

  const handleCancelAction = (actionId: string) => {
    setActionStatuses((prev) => ({ ...prev, [actionId]: 'cancelled' }));
  };

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
      let activeError = null;
      try {
        const rawErr = sessionStorage.getItem('hermes_last_active_error');
        if (rawErr) {
          activeError = JSON.parse(rawErr);
        }
      } catch {}

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
          current_path: pathname,
          active_error: activeError,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi xử lý yêu cầu');
      }
      if (data.source === 'ai_gateway') {
        setActiveSource('ai_gateway');
      } else {
        setActiveSource('local');
      }

      if (data.action && data.action.id) {
        setActionStatuses((prev) => ({ ...prev, [data.action.id]: 'pending' }));
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'Không có phản hồi từ trợ lý.',
          action: data.action || null,
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
      {/* NÚT TRỢ LÝ HERMES (Góc dưới phải) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 text-xs font-bold border border-white/20"
          title="Mở khung trò chuyện Trợ lý Hermes"
        >
          <Bot className="w-4 h-4 text-amber-200" />
          <span>Trợ lý Hermes</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* CHẾ ĐỘ THU NHỎ MINI: Thanh nổi gọn nhẹ ở góc dưới */}
      {isOpen && isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-full shadow-xl transition-all duration-200 cursor-pointer text-xs font-bold border border-white/20 animate-in fade-in"
          title="Bấm để mở lại khung chat"
        >
          <Bot className="w-4 h-4 text-amber-200" />
          <span>Trợ lý Hermes (Đang mở)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="ml-1 p-1 hover:bg-white/20 rounded-full transition"
            title="Đóng hẳn chat"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* KHUNG Ô CHAT HERMES DẠNG HỘP NỔI COMPACT (KHI KHÔNG THU NHỎ) */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] h-[540px] max-h-[82vh] bg-white text-gray-900 shadow-2xl border border-gray-200/90 rounded-2xl flex flex-col font-sans animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">
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
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeSource === 'ai_gateway'
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-[#2F6FA8]'
                    }`}
                  />
                  <span>
                    {activeSource === 'ai_gateway'
                      ? 'Não AI Trực Tuyến (9Router)'
                      : 'Trực tuyến • Soát lỗi & Vận hành'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition"
                title="Thu nhỏ cửa sổ chat"
              >
                <Minus className="w-4 h-4" />
              </button>
              <Link
                href="/settings/hermes"
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-[#2F6FA8] hover:bg-gray-50 rounded-xl transition"
                title="Cài đặt kết nối Bot"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
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

                    {/* Action Card: Thẻ tương tác điều khiển / nhập liệu */}
                    {m.action && (
                      <div className="mt-3 p-3 rounded-xl bg-gradient-to-b from-white to-gray-50/90 border border-gray-200/90 shadow-xs text-xs space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              m.action.type === 'create_deduction'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : m.action.type === 'create_bonus'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {m.action.type === 'create_deduction'
                              ? '🔴 Phiếu giảm trừ / Phạt'
                              : m.action.type === 'create_bonus'
                              ? '🟢 Phiếu thưởng / Cộng lương'
                              : '🚀 Điều hướng trang'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">Xác nhận an toàn</span>
                        </div>

                        {m.action.type === 'navigate' ? (
                          <div className="flex items-center justify-between pt-1 gap-2">
                            <div>
                              <p className="font-bold text-gray-900 leading-tight">
                                {String((m.action.data as Record<string, unknown>).label || (m.action.data as Record<string, unknown>).url)}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono">
                                {String((m.action.data as Record<string, unknown>).url)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleExecuteAction(m.action!)}
                              className="px-3 py-1.5 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white font-bold rounded-lg transition shadow-xs text-xs shrink-0 cursor-pointer"
                            >
                              👉 Đi ngay
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1.5 text-gray-700 bg-white p-2.5 rounded-lg border border-gray-100">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Nhân sự:</span>
                                <span className="font-bold text-gray-900">
                                  {String((m.action.data as Record<string, unknown>).employee_name || 'Nhân viên')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Số tiền:</span>
                                <span
                                  className={`font-bold ${
                                    m.action.type === 'create_deduction' ? 'text-rose-600' : 'text-emerald-600'
                                  }`}
                                >
                                  {Number((m.action.data as Record<string, unknown>).amount || 0).toLocaleString('vi-VN')} đ
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Lý do:</span>
                                <span className="font-medium text-gray-800 text-right max-w-[180px] truncate">
                                  {String((m.action.data as Record<string, unknown>).note || 'Quy định nội bộ')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Thời gian:</span>
                                <span className="text-gray-500 font-mono text-[11px]">
                                  {String((m.action.data as Record<string, unknown>).date || 'Hôm nay')}
                                </span>
                              </div>
                            </div>

                            {/* Buttons based on action status */}
                            {actionStatuses[m.action.id] === 'executed' ? (
                              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-center font-bold text-[11px] flex items-center justify-center gap-1.5 border border-emerald-200">
                                <Check size={14} className="text-emerald-600" />
                                <span>Đã lưu vào bảng lương thành công!</span>
                              </div>
                            ) : actionStatuses[m.action.id] === 'cancelled' ? (
                              <div className="p-2 bg-gray-100 text-gray-500 rounded-lg text-center text-[11px]">
                                <span>Đã hủy thao tác</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleExecuteAction(m.action!)}
                                  disabled={actionStatuses[m.action.id] === 'executing'}
                                  className="flex-1 py-2 px-3 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-xs"
                                >
                                  {actionStatuses[m.action.id] === 'executing' ? (
                                    <Sparkles size={12} className="animate-spin" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                  <span>Xác nhận lưu</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelAction(m.action!.id)}
                                  disabled={actionStatuses[m.action.id] === 'executing'}
                                  className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition text-xs cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            )}
                          </>
                        )}
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
          <div className="px-3 py-1.5 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-[11px]">
            {hasActiveScreenError && (
              <button
                onClick={() => handleSendPrompt('Chẩn đoán và phân tích chi tiết sự cố vừa xảy ra trên màn hình')}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-300 transition flex items-center gap-1 shrink-0 animate-pulse disabled:opacity-50"
                title="Phân tích lỗi crash vừa ghi nhận từ giao diện"
              >
                <AlertCircle size={11} className="text-rose-600" />
                <span>🚨 Chẩn đoán lỗi vừa xảy ra</span>
              </button>
            )}
            <button
              onClick={() => handleSendPrompt(`Soát logic màn hình hiện tại (${pathname})`)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-[#2F6FA8] font-medium border border-blue-200 transition flex items-center gap-1 shrink-0 disabled:opacity-50"
              title="Soát code màn hình đang xem cùng các service/engine liên quan"
            >
              <Sparkles size={11} className="text-[#2F6FA8]" />
              <span>Soát trang này</span>
            </button>
            <button
              onClick={() => handleSendPrompt('Phạt bạn Kiều Linh 50k do đi trễ 15 phút')}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium border border-rose-200 transition flex items-center gap-1 shrink-0 disabled:opacity-50"
              title="Thử nghiệm nhập phiếu phạt bằng câu lệnh chat"
            >
              <span>⚡ Phạt Kiều Linh 50k</span>
            </button>
            <button
              onClick={() => handleSendPrompt('Thưởng 100k cho bạn Kiều Linh vì hỗ trợ tăng ca')}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium border border-emerald-200 transition flex items-center gap-1 shrink-0 disabled:opacity-50"
              title="Thử nghiệm nhập phiếu thưởng bằng câu lệnh chat"
            >
              <span>🎁 Thưởng Kiều Linh 100k</span>
            </button>
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
              onClick={() => handleSendPrompt('Kiểm tra logic chấm công')}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-[#2F6FA8] border border-gray-200 transition flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              <Clock size={11} className="text-[#2F6FA8]" />
              <span>Soát Chấm công</span>
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
