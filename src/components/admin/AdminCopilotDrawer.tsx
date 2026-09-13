'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Wrench,
  Package,
  Users,
  Settings,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { HERMES_BOT_REGISTRY, HermesBotId } from '@/lib/hermes/bot-registry';
import { HermesConfigService } from '@/lib/hermes/hermes-config-service';
import { getRecentNetworkBreadcrumbs } from '@/lib/hermes/telemetry-core';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  bot_id?: string;
}

export function AdminCopilotDrawer() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mainTab, setMainTab] = useState<'chat' | 'bug_report'>('chat');
  const [activeBotId, setActiveBotId] = useState<HermesBotId>('auto');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: HERMES_BOT_REGISTRY.auto.greeting,
      bot_id: 'auto',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Bug Report Tab State
  const [bugDescription, setBugDescription] = useState('');
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugReply, setBugReply] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to open event from Header or other triggers
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-hermes-copilot', handleOpen);
    return () => window.removeEventListener('open-hermes-copilot', handleOpen);
  }, []);

  if (!mounted || !isAuthenticated || !user) {
    return null;
  }

  const currentBot = HERMES_BOT_REGISTRY[activeBotId];
  const config = HermesConfigService.getConfig();

  const handleSelectBot = (botId: HermesBotId) => {
    setActiveBotId(botId);
    const selectedBot = HERMES_BOT_REGISTRY[botId];
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: `Đã kết nối với chuyên gia **${selectedBot.name}** (${selectedBot.badge}):\n${selectedBot.greeting}`,
        bot_id: botId,
      },
    ]);
  };

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const userMsg = promptText.trim();
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
          bot_id: activeBotId,
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
          text: data.reply || 'Không có phản hồi từ trợ lý.',
          bot_id: data.answeredBy || activeBotId,
        },
      ]);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Lỗi kết nối tới Hermes Copilot API.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ ${errorText}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugDescription.trim() || bugSubmitting) return;

    setBugSubmitting(true);
    const breadcrumbs = getRecentNetworkBreadcrumbs();

    try {
      const res = await fetch('/api/telemetry/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_description: bugDescription.trim(),
          route: typeof window !== 'undefined' ? window.location.pathname : '/',
          network_breadcrumbs: breadcrumbs,
          user_role: user.role || 'employee',
          user_id: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBugReply(data.error || 'Có lỗi khi gửi phản ánh.');
      } else {
        setBugReply(data.reply || 'Đã ghi nhận sự cố! Hermes đã lưu log và thông báo tới kỹ thuật viên.');
      }
    } catch {
      setBugReply('Đã gửi phản ánh! Hermes sẽ tự động đối chiếu log hệ thống.');
    } finally {
      setBugSubmitting(false);
    }
  };

  const handleCopyTicket = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      {/* NÚT DUY NHẤT TRÊN MÀN HÌNH (Góc dưới phải - Cực kỳ dễ nhìn & thanh lịch) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-full shadow-xl hover:shadow-2xl border-2 border-white/80 transition-all duration-200 hover:scale-105 active:scale-95 text-xs sm:text-sm font-bold"
          title="Mở Trợ lý Hermes (Soát lỗi & Cố vấn vận hành)"
        >
          <Bot className="w-5 h-5 text-amber-200" />
          <span>Trợ lý Hermes</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-300/40" />
        </button>
      )}

      {/* CỬA SỔ TRỢ LÝ HERMES ALL-IN-ONE */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-84 sm:w-[460px] bg-white text-gray-800 shadow-2xl border-l border-gray-200/80 flex flex-col font-sans animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-gray-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#2F6FA8] flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-[#001D3D] flex items-center gap-1.5">
                  Trợ lý Hermes
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2F6FA8] border border-blue-200">
                    {currentBot.badge}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 truncate max-w-[220px]">
                  Thanh tra logic & Cố vấn F&B
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/settings/hermes"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-[#2F6FA8] hover:bg-gray-100 rounded-lg transition"
                title="Cài đặt cắm Bot Hermes"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2 Phân Hệ Cốt Lõi: Cố Vấn / Báo Sự Cố */}
          <div className="flex items-center bg-gray-100/70 p-1 border-b border-gray-200/60 text-xs font-bold">
            <button
              onClick={() => setMainTab('chat')}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                mainTab === 'chat'
                  ? 'bg-white text-[#2F6FA8] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles size={14} />
              <span>Cố vấn & Soát lỗi Logic</span>
            </button>
            <button
              onClick={() => setMainTab('bug_report')}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                mainTab === 'bug_report'
                  ? 'bg-white text-[#2F6FA8] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertCircle size={14} />
              <span>Báo sự cố quầy</span>
            </button>
          </div>

          {/* NỘI DUNG TAB 1: CỐ VẤN & SOÁT LỖI LOGIC */}
          {mainTab === 'chat' && (
            <>
              {/* Dải Tabs chọn Chuyên Gia */}
              <div className="p-2 border-b border-gray-100 bg-gray-50/80 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
                {(Object.keys(HERMES_BOT_REGISTRY) as HermesBotId[]).map((id) => {
                  const b = HERMES_BOT_REGISTRY[id];
                  const isActive = activeBotId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleSelectBot(id)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#2F6FA8] text-white shadow-xs font-bold'
                          : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-100'
                      }`}
                    >
                      {id === 'auto' && <Sparkles className="w-3.5 h-3.5" />}
                      {id === 'tech' && <Wrench className="w-3.5 h-3.5" />}
                      {id === 'inventory' && <Package className="w-3.5 h-3.5" />}
                      {id === 'hr' && <Users className="w-3.5 h-3.5" />}
                      <span>{b.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* BỘ NÚT 1 CHẠM: THANH TRA LOGIC NGHIỆP VỤ */}
              <div className="p-2.5 bg-blue-50/50 border-b border-blue-100/60">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Layers size={11} className="text-[#2F6FA8]" />
                  <span>Công cụ Thanh tra Logic (Xuất ticket Antigravity):</span>
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() =>
                      handleSendPrompt(
                        'Kiểm tra logic tính lương: rà soát công thức tính OT, phụ cấp cơm F&B và trừ phạt KPI xem có điểm nào bất hợp lý hoặc lỗi không'
                      )
                    }
                    disabled={loading}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-[#2F6FA8] border border-blue-200/80 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs whitespace-nowrap transition disabled:opacity-50"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Soát Bảng lương</span>
                  </button>
                  <button
                    onClick={() =>
                      handleSendPrompt(
                        'Kiểm tra logic phân ca: rà soát quy tắc xếp ca, giới hạn giờ làm/tuần và khoảng nghỉ giữa 2 ca có xung đột không'
                      )
                    }
                    disabled={loading}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-[#2F6FA8] border border-blue-200/80 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs whitespace-nowrap transition disabled:opacity-50"
                  >
                    <Calendar size={13} />
                    <span>Soát Phân ca</span>
                  </button>
                  <button
                    onClick={() =>
                      handleSendPrompt(
                        'Kiểm tra logic kiểm kho BTP: rà soát cơ chế tính hao hụt và công thức định mức nguyên vật liệu'
                      )
                    }
                    disabled={loading}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-[#2F6FA8] border border-blue-200/80 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs whitespace-nowrap transition disabled:opacity-50"
                  >
                    <Package size={13} />
                    <span>Soát Kho BTP</span>
                  </button>
                </div>
              </div>

              {/* Danh sách tin nhắn đối thoại */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-[#FFF8E8]/30">
                {messages.map((m, idx) => {
                  const hasTicket = m.text.includes('[ANTIGRAVITY TASK TICKET]') || m.text.includes('ANTIGRAVITY');
                  return (
                    <div key={idx} className="space-y-1">
                      <div
                        className={`p-3.5 rounded-2xl leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-[#2F6FA8] text-white ml-8 rounded-tr-xs shadow-xs font-medium'
                            : 'bg-white text-[#001D3D] mr-4 rounded-tl-xs border border-amber-200/70 shadow-2xs whitespace-pre-wrap'
                        }`}
                      >
                        {m.role === 'assistant' && (
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#2F6FA8] mb-1.5 pb-1 border-b border-gray-100">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-[#2F6FA8]" />
                              <span>{currentBot.name}</span>
                              {config.mode === 'external' && (
                                <span className="text-[9px] text-gray-400 font-normal">
                                  • Gateway Ngoài
                                </span>
                              )}
                            </div>
                            {hasTicket && (
                              <button
                                onClick={() => handleCopyTicket(m.text, idx)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#2F6FA8] hover:bg-blue-100 transition text-[10px]"
                                title="Copy phiếu ticket gửi cho Antigravity code"
                              >
                                {copiedIndex === idx ? <Check size={11} /> : <Copy size={11} />}
                                <span>{copiedIndex === idx ? 'Đã copy' : 'Copy Ticket'}</span>
                              </button>
                            )}
                          </div>
                        )}
                        {m.text}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="p-3.5 rounded-2xl bg-white border border-gray-200 text-gray-600 text-xs italic mr-6 flex items-center gap-2 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-[#2F6FA8]" />
                    <span>{currentBot.name} đang phân tích logic hệ thống...</span>
                  </div>
                )}
              </div>

              {/* Khung nhập & Gửi */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendPrompt(input);
                }}
                className="p-3 border-t border-gray-100 bg-white flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Hỏi hoặc yêu cầu ${currentBot.name} kiểm tra...`}
                  className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#2F6FA8] rounded-xl text-xs text-gray-900 focus:outline-none transition"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-xl font-bold transition disabled:opacity-40 flex items-center justify-center shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}

          {/* NỘI DUNG TAB 2: BÁO SỰ CỐ QUẦY (Tích hợp SmartBugReporter) */}
          {mainTab === 'bug_report' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs bg-gray-50/50">
              <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-[#001D3D] font-bold text-sm">
                  <AlertCircle size={17} className="text-[#2F6FA8]" />
                  <span>Báo cáo sự cố thao tác tại quầy</span>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Khi gặp lỗi giao diện, không lưu được dữ liệu, hoặc mạng chập chờn, hãy gửi mô tả ngắn
                  gọn. Hermes sẽ tự động đính kèm URL trang và thông số mạng để xử lý ngay.
                </p>
              </div>

              {bugReply ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Phản hồi từ Hermes:</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-xs">{bugReply}</p>
                  <button
                    onClick={() => {
                      setBugReply(null);
                      setBugDescription('');
                    }}
                    className="w-full py-2 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-xl font-bold transition shadow-xs"
                  >
                    Gửi phản ánh khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBugSubmit} className="space-y-4 bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5 text-xs">
                      Mô tả sự cố bạn đang gặp:
                    </label>
                    <textarea
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      placeholder="Ví dụ: Em bấm chốt bảng công mà nút lưu quay tròn không phản hồi..."
                      rows={4}
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:bg-white focus:outline-none focus:border-[#2F6FA8] text-xs resize-none transition"
                    />
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-gray-600 space-y-1">
                    <p className="font-bold text-[#2F6FA8]">Dữ liệu tự động thu thập:</p>
                    <p>• Đường dẫn trang: <span className="font-mono text-gray-800">{typeof window !== 'undefined' ? window.location.pathname : '/'}</span></p>
                    <p>• Người gửi: <span className="font-bold text-gray-800">{user.full_name} ({user.role})</span></p>
                  </div>

                  <button
                    type="submit"
                    disabled={bugSubmitting || !bugDescription.trim()}
                    className="w-full py-2.5 bg-[#2F6FA8] hover:bg-[#1D3E61] text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    <span>{bugSubmitting ? 'Đang gửi phản ánh...' : 'Gửi phản ánh cho Hermes'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
