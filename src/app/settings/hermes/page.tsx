'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/auth-store';
import {
  Bot,
  ChevronRight,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  ShieldCheck,
  BellRing,
  ExternalLink,
  Cpu,
  Package,
  Users,
  Wrench,
  Info,
} from 'lucide-react';
import {
  HermesConfigService,
  HermesSystemConfig,
  DEFAULT_HERMES_CONFIG,
} from '@/lib/hermes/hermes-config-service';

export default function HermesSettingsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();

  const [config, setConfig] = useState<HermesSystemConfig>(DEFAULT_HERMES_CONFIG);
  const [activeTab, setActiveTab] = useState<'mode' | 'connection' | 'alerting' | 'bots'>('mode');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/settings/hermes');
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    const saved = HermesConfigService.getConfig();
    setConfig(saved);
  }, []);

  if (!hasHydrated || !isAuthenticated || !user) {
    return (
      <AppShell title="Cài đặt Hermes AI">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2F6FA8] border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  const handleSave = () => {
    HermesConfigService.saveConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc muốn khôi phục cấu hình Hermes về mặc định (chế độ nội bộ)?')) {
      const reset = HermesConfigService.resetToDefault();
      setConfig(reset);
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await HermesConfigService.testConnection(config);
      setTestResult(res);
      const updatedConfig = {
        ...config,
        lastTestedAt: new Date().toISOString(),
        lastTestStatus: res.success ? ('success' as const) : ('error' as const),
      };
      setConfig(updatedConfig);
      HermesConfigService.saveConfig(updatedConfig);
    } catch {
      setTestResult({
        success: false,
        message: 'Lỗi không xác định khi kiểm tra kết nối.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <AppShell title="Cấu hình Hermes AI">
      <div className="space-y-6 pb-24 w-full max-w-none">
        {/* TẦNG 1: EXECUTIVE COMMAND HEADER */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs w-full sticky top-0 z-30 rounded-2xl">
          <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Trái: Breadcrumb + Tiêu đề + Trạng thái */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <span>HRM Homies</span>
                <ChevronRight size={12} className="text-gray-400" />
                <Link href="/settings" className="hover:text-[#2F6FA8] transition">
                  Cài đặt
                </Link>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="text-[#2F6FA8] font-bold">Hermes Copilot & Bot</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#2F6FA8]" />
                  Cấu hình Trợ lý AI & Bot Hermes
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    config.mode === 'local'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : config.lastTestStatus === 'success'
                      ? 'bg-blue-50 text-[#2F6FA8] border-blue-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {config.mode === 'local'
                    ? '● Não bộ Nội bộ (Sẵn sàng)'
                    : config.lastTestStatus === 'success'
                    ? '● Đã kết nối Gateway Ngoài'
                    : '● Cổng ngoài (Chưa test)'}
                </span>
              </div>
            </div>

            {/* Phải: Cụm nút hành động */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-100 transition"
              >
                <RotateCcw size={14} />
                <span>Khôi phục mặc định</span>
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3.5 py-1.5 min-h-[36px] rounded-xl border border-[#2F6FA8]/30 bg-blue-50 text-[#2F6FA8] hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Radio size={14} className={testing ? 'animate-pulse' : ''} />
                <span>{testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 min-h-[36px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <Save size={14} />
                <span>Lưu cấu hình</span>
              </button>
            </div>
          </div>
        </div>

        {/* Thông báo lưu thành công */}
        {saveSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Đã lưu thành công cấu hình Hermes! Các cửa sổ chat và trợ lý đã được cập nhật ngay lập tức.</span>
          </div>
        )}

        {/* Kết quả Test Connection */}
        {testResult && (
          <div
            className={`p-4 border rounded-2xl flex items-start gap-3 text-xs leading-relaxed animate-in fade-in ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm mb-0.5">
                {testResult.success ? 'Kết nối thành công!' : 'Kết nối không thành công'}
              </p>
              <p>{testResult.message}</p>
            </div>
          </div>
        )}

        {/* TẦNG 2: BỘ TAB ĐIỀU KHIỂN */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-200/70 shadow-2xs overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('mode')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'mode'
                ? 'bg-[#2F6FA8] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Cpu size={15} />
            <span>1. Chế độ hoạt động</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'connection'
                ? 'bg-[#2F6FA8] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Sliders size={15} />
            <span>2. Cổng kết nối Webhook / API</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alerting')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'alerting'
                ? 'bg-[#2F6FA8] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BellRing size={15} />
            <span>3. Bắn cảnh báo Zalo / Telegram</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bots')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'bots'
                ? 'bg-[#2F6FA8] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users size={15} />
            <span>4. Đội ngũ Bot Chuyên gia</span>
          </button>
        </div>

        {/* TẦNG 3: NỘI DUNG TỪNG TAB */}
        {activeTab === 'mode' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chế độ 1: Local Brain */}
            <div
              onClick={() => setConfig({ ...config, mode: 'local' })}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer relative bg-white ${
                config.mode === 'local'
                  ? 'border-[#2F6FA8] shadow-sm ring-2 ring-[#2F6FA8]/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <input
                  type="radio"
                  checked={config.mode === 'local'}
                  onChange={() => setConfig({ ...config, mode: 'local' })}
                  className="w-4 h-4 text-[#2F6FA8] focus:ring-[#2F6FA8]"
                />
              </div>
              <h3 className="text-sm font-bold text-[#001D3D] mb-1">
                Chế độ 1: Não bộ F&B Nội bộ (Local Brain)
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Chạy hoàn toàn bằng tri thức vận hành F&B chuẩn của Homies Milk Tea được lập trình sẵn.
                Tự động chẩn đoán lỗi Telemetry, rà soát kho BTP và quy chế đi ca.
              </p>
              <div className="space-y-1.5 text-[11px] text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Hoàn toàn miễn phí, không tốn token/API bên ngoài</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Bảo mật tuyệt đối 100%, không gửi dữ liệu ra internet</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Tự động đọc 5 lỗi hệ thống gần nhất để tư vấn sự cố</span>
                </div>
              </div>
            </div>

            {/* Chế độ 2: External Gateway / Webhook */}
            <div
              onClick={() => setConfig({ ...config, mode: 'external' })}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer relative bg-white ${
                config.mode === 'external'
                  ? 'border-[#2F6FA8] shadow-sm ring-2 ring-[#2F6FA8]/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center">
                  <Bot size={22} />
                </div>
                <input
                  type="radio"
                  checked={config.mode === 'external'}
                  onChange={() => setConfig({ ...config, mode: 'external' })}
                  className="w-4 h-4 text-[#2F6FA8] focus:ring-[#2F6FA8]"
                />
              </div>
              <h3 className="text-sm font-bold text-[#001D3D] mb-1">
                Chế độ 2: Cắm Hermes Gateway / Webhook Ngoài
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Chuyển tiếp câu hỏi sang server Bot Hermes riêng của bạn (FastGPT, Dify, n8n, OpenAI,
                Claude hoặc server AI tự host chạy mô hình Hermes 3 / vLLM).
              </p>
              <div className="space-y-1.5 text-[11px] text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FA8]" />
                  <span>Hỗ trợ Webhook chuẩn JSON hoặc OpenAI-compatible API</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FA8]" />
                  <span>Tự động đính kèm bối cảnh Telemetry & lỗi vào câu hỏi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FA8]" />
                  <span>Tùy chỉnh model thông minh, suy luận sâu rộng hơn</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'connection' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-2xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-[#001D3D] mb-1">
                Cổng Kết Nối Hermes Webhook / API
              </h2>
              <p className="text-xs text-gray-500">
                Cấu hình thông số để hệ thống gọi tới máy chủ Bot của bạn khi người dùng trò chuyện.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Loại giao thức */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Loại giao thức kết nối
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 bg-white focus:outline-none focus:border-[#2F6FA8]"
                >
                  <option value="custom_webhook">Custom Webhook (JSON POST request)</option>
                  <option value="openai_compatible">OpenAI-compatible (/v1/chat/completions)</option>
                  <option value="dify">Dify App API (/v1/chat-messages)</option>
                  <option value="fastgpt">FastGPT OpenAPI (/api/v1/chat/completions)</option>
                </select>
              </div>

              {/* Tên Model với Dropdown gợi ý cho 9router / OpenAI / Gemini */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700">
                    Tên Mô hình (Model Name)
                  </label>
                  <span className="text-[11px] text-gray-400">Hỗ trợ 9router • Gemini • GPT</span>
                </div>

                {/* Dropdown chọn nhanh */}
                <select
                  value={
                    [
                      'google/gemini-2.5-flash',
                      'google/gemini-1.5-pro',
                      'gemini-2.0-flash',
                      'gemini-1.5-flash',
                      'openai/gpt-4o-mini',
                      'openai/gpt-4o',
                      'gpt-4o-mini',
                      'gpt-4o',
                      'nousresearch/hermes-3-llama-3.1-8b',
                      'nousresearch/hermes-3-llama-3.1-70b',
                      'anthropic/claude-3-5-sonnet',
                    ].includes(config.model)
                      ? config.model
                      : 'custom'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setConfig({ ...config, model: e.target.value });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 bg-white focus:outline-none focus:border-[#2F6FA8]"
                >
                  <optgroup label="✨ Google Gemini (9router)">
                    <option value="google/gemini-2.5-flash">google/gemini-2.5-flash (Gemini 2.5 Flash - Nhanh &amp; Rẻ)</option>
                    <option value="google/gemini-1.5-pro">google/gemini-1.5-pro (Gemini 1.5 Pro - Suy luận sâu)</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash (Gemini 2.0 Flash)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Gemini 1.5 Flash)</option>
                  </optgroup>
                  <optgroup label="⚡ OpenAI GPT (9router)">
                    <option value="openai/gpt-4o-mini">openai/gpt-4o-mini (GPT-4o Mini - Khuyên dùng)</option>
                    <option value="openai/gpt-4o">openai/gpt-4o (GPT-4o Đỉnh cao)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini (Chuẩn OpenAI)</option>
                    <option value="gpt-4o">gpt-4o (Chuẩn OpenAI)</option>
                  </optgroup>
                  <optgroup label="🤖 Hermes 3 (Nous Research)">
                    <option value="nousresearch/hermes-3-llama-3.1-8b">nousresearch/hermes-3-llama-3.1-8b (Hermes 3)</option>
                    <option value="nousresearch/hermes-3-llama-3.1-70b">nousresearch/hermes-3-llama-3.1-70b (Hermes 3 70B)</option>
                  </optgroup>
                  <optgroup label="🎭 Anthropic Claude">
                    <option value="anthropic/claude-3-5-sonnet">anthropic/claude-3-5-sonnet (Claude 3.5 Sonnet)</option>
                  </optgroup>
                  <optgroup label="✏️ Tùy chỉnh khác">
                    <option value="custom">Tự gõ mô hình khác...</option>
                  </optgroup>
                </select>

                {/* Ô input tự gõ hoặc tinh chỉnh */}
                <div className="relative">
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    placeholder="Nhập mã mô hình, ví dụ: google/gemini-2.5-flash hoặc openai/gpt-4o-mini"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-800 focus:outline-none focus:border-[#2F6FA8]"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-gray-400 pointer-events-none">
                    Mã gửi đi
                  </span>
                </div>
              </div>

              {/* Webhook / Base URL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Endpoint URL / Webhook URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.endpoint}
                  onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                  placeholder="https://api.your-hermes-bot.com/v1/chat hoặc http://localhost:8000/webhook"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#2F6FA8] font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Nếu bạn dùng Dify hoặc FastGPT, hãy dán đúng đường dẫn API endpoint của bot vào đây.
                </p>
              </div>

              {/* API Key / Token */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  API Key / Bearer Secret Token
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-hermes-..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#2F6FA8] font-mono"
                />
              </div>

              {/* Tùy chọn chèn telemetry context */}
              <div className="md:col-span-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Tự động chèn dữ liệu Lỗi & Telemetry vào câu hỏi
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Giúp Bot Hermes ngoài đọc được danh sách lỗi hệ thống gần nhất để chẩn đoán chính xác.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableTelemetryContext}
                  onChange={(e) =>
                    setConfig({ ...config, enableTelemetryContext: e.target.checked })
                  }
                  className="w-4 h-4 text-[#2F6FA8] rounded focus:ring-[#2F6FA8]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerting' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-2xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-[#001D3D] mb-1">
                Kênh Bắn Cảnh Báo Sự Cố Ra Ngoài
              </h2>
              <p className="text-xs text-gray-500">
                Khi nhân viên bấm "Báo sự cố cho Hermes" tại quầy hoặc có lỗi 500 nghiêm trọng,
                Hermes sẽ tự động gửi bản tin qua Webhook này.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Webhook URL nhận tin (Telegram Bot / Zalo ZNS / Discord / n8n)
                </label>
                <input
                  type="text"
                  value={config.alertWebhookUrl}
                  onChange={(e) => setConfig({ ...config, alertWebhookUrl: e.target.value })}
                  placeholder="https://api.telegram.org/bot<TOKEN>/sendMessage hoặc webhook URL n8n"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#2F6FA8] font-mono"
                />
              </div>

              <div className="p-4 bg-[#FFF8E8] border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
                <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Quy cách gói tin gửi qua Webhook:</p>
                  <p className="font-mono text-[11px] text-amber-800">
                    {`{ "event": "user_bug_report", "user": "Nguyễn Văn A (Thu ngân)", "route": "/checkin", "issue": "Không bấm được checkin ca tối", "timestamp": "2026-09-13T..." }`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xs font-bold text-gray-800">Bật gửi cảnh báo tự động</p>
                  <p className="text-[11px] text-gray-500">Chỉ gửi khi có sự cố được nhân viên báo cáo.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableAlertOnBugReport}
                  onChange={(e) =>
                    setConfig({ ...config, enableAlertOnBugReport: e.target.checked })
                  }
                  className="w-4 h-4 text-[#2F6FA8] rounded focus:ring-[#2F6FA8]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bots' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200/70 shadow-2xs">
              <h2 className="text-sm font-bold text-[#001D3D] mb-1">
                Phân Luồng 4 Bot Chuyên Gia (Multi-Bot Specialist)
              </h2>
              <p className="text-xs text-gray-500">
                Bật hoặc tắt từng chuyên gia theo nhu cầu vận hành của bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bot 1: Router */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">Hermes Router</h3>
                    <p className="text-[11px] text-gray-500">Điều phối tổng hợp & tự nhận diện ý định</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Mặc định
                </span>
              </div>

              {/* Bot 2: Tech Doctor */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Wrench size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">Bác sĩ Kỹ thuật (Tech Doctor)</h3>
                    <p className="text-[11px] text-gray-500">Chuyên tra cứu lỗi, telemetry và mạng</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.specialists.tech.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      specialists: {
                        ...config.specialists,
                        tech: { ...config.specialists.tech, enabled: e.target.checked },
                      },
                    })
                  }
                  className="w-4 h-4 text-[#2F6FA8] rounded focus:ring-[#2F6FA8]"
                />
              </div>

              {/* Bot 3: Inventory & BTP */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Package size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">Chuyên gia Kho & BTP</h3>
                    <p className="text-[11px] text-gray-500">Kiểm kê, công thức hao hụt nguyên vật liệu</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.specialists.inventory.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      specialists: {
                        ...config.specialists,
                        inventory: { ...config.specialists.inventory, enabled: e.target.checked },
                      },
                    })
                  }
                  className="w-4 h-4 text-[#2F6FA8] rounded focus:ring-[#2F6FA8]"
                />
              </div>

              {/* Bot 4: HR & Payroll */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">Trợ lý Nhân sự & KPI</h3>
                    <p className="text-[11px] text-gray-500">Giải đáp quy chế ca, bảng lương, thưởng phạt</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.specialists.hr.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      specialists: {
                        ...config.specialists,
                        hr: { ...config.specialists.hr, enabled: e.target.checked },
                      },
                    })
                  }
                  className="w-4 h-4 text-[#2F6FA8] rounded focus:ring-[#2F6FA8]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
