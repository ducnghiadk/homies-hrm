'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Send, ShieldAlert, X, Sparkles, Wrench, Package, Users } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { HERMES_BOT_REGISTRY, HermesBotId } from '@/lib/hermes/bot-registry';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  bot_id?: string;
}

const ALLOWED_ADMIN_ROLES = ['hr_admin', 'ceo', 'store_manager', 'area_manager'];

export function AdminCopilotDrawer() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeBotId, setActiveBotId] = useState<HermesBotId>('auto');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: HERMES_BOT_REGISTRY.auto.greeting,
      bot_id: 'auto'
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated || !user || !ALLOWED_ADMIN_ROLES.includes(user.role)) {
    return null;
  }

  const currentBot = HERMES_BOT_REGISTRY[activeBotId];

  const handleSelectBot = (botId: HermesBotId) => {
    setActiveBotId(botId);
    const selectedBot = HERMES_BOT_REGISTRY[botId];
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: `Đã chuyển sang **${selectedBot.name}** (${selectedBot.badge}):\n${selectedBot.greeting}`,
        bot_id: botId
      }
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
      const res = await fetch('/api/hermes/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: updatedMessages.slice(-6),
          user_id: user.id,
          user_role: user.role,
          bot_id: activeBotId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply || 'Không có phản hồi', bot_id: data.answeredBy || activeBotId }
      ]);
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

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input);
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
        <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-[420px] bg-zinc-900 text-zinc-100 shadow-2xl border-l border-zinc-800 flex flex-col font-sans animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  Hermes Multi-Bot Copilot
                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {currentBot.badge}
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400 truncate max-w-[240px]">{currentBot.roleDescription}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white p-1 rounded-md">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Specialist Switcher Pills */}
          <div className="p-2 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            {(Object.keys(HERMES_BOT_REGISTRY) as HermesBotId[]).map((id) => {
              const b = HERMES_BOT_REGISTRY[id];
              const isActive = activeBotId === id;
              return (
                <button
                  key={id}
                  onClick={() => handleSelectBot(id)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition flex items-center gap-1 ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 shadow font-bold'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80'
                  }`}
                >
                  {id === 'auto' && <Sparkles className="w-3 h-3" />}
                  {id === 'tech' && <Wrench className="w-3 h-3" />}
                  {id === 'inventory' && <Package className="w-3 h-3" />}
                  {id === 'hr' && <Users className="w-3 h-3" />}
                  <span>{b.name}</span>
                </button>
              );
            })}
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-amber-600 text-white ml-6 shadow-sm'
                    : 'bg-zinc-800 text-zinc-200 mr-6 border border-zinc-700/50 whitespace-pre-wrap'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-xl bg-zinc-800 text-zinc-400 text-xs italic mr-6 flex items-center gap-2 border border-zinc-700/40">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                {currentBot.name} đang phân tích dữ liệu...
              </div>
            )}
          </div>

          {/* Prompt Suggestions */}
          <div className="px-3 py-2 border-t border-zinc-800/60 bg-zinc-950/40 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <span className="text-zinc-500 font-medium whitespace-nowrap">Gợi ý:</span>
            {currentBot.promptSuggestions.map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSendPrompt(prompt)}
                disabled={loading}
                className="px-2 py-1 rounded bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-700/60 whitespace-nowrap transition disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmitForm} className="p-3 border-t border-zinc-800 bg-zinc-950 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Hỏi ${currentBot.name}...`}
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg font-bold transition disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
