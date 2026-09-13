export type HermesOperationMode = 'local' | 'external';
export type HermesProviderType = 'custom_webhook' | 'openai_compatible' | 'dify' | 'fastgpt';

export interface HermesBotSpecialistConfig {
  enabled: boolean;
  customPrompt?: string;
  customEndpoint?: string;
}

export interface HermesSystemConfig {
  mode: HermesOperationMode;
  provider: HermesProviderType;
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  alertWebhookUrl: string;
  enableTelemetryContext: boolean;
  enableAlertOnBugReport: boolean;
  specialists: {
    auto: HermesBotSpecialistConfig;
    tech: HermesBotSpecialistConfig;
    inventory: HermesBotSpecialistConfig;
    hr: HermesBotSpecialistConfig;
  };
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'error';
}

export const DEFAULT_HERMES_CONFIG: HermesSystemConfig = {
  mode: 'local',
  provider: 'custom_webhook',
  endpoint: '',
  apiKey: '',
  model: 'nousresearch/hermes-3-llama-3.1-8b',
  temperature: 0.7,
  alertWebhookUrl: '',
  enableTelemetryContext: true,
  enableAlertOnBugReport: false,
  specialists: {
    auto: { enabled: true },
    tech: { enabled: true },
    inventory: { enabled: true },
    hr: { enabled: true },
  },
};

const STORAGE_KEY = 'homies_hermes_config_v1';

export const HermesConfigService = {
  getConfig(): HermesSystemConfig {
    if (typeof window === 'undefined') return DEFAULT_HERMES_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_HERMES_CONFIG;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_HERMES_CONFIG,
        ...parsed,
        specialists: {
          ...DEFAULT_HERMES_CONFIG.specialists,
          ...(parsed?.specialists || {}),
        },
      };
    } catch {
      return DEFAULT_HERMES_CONFIG;
    }
  },

  saveConfig(config: HermesSystemConfig): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent('homies-hermes-config-changed', { detail: config }));
    } catch (err) {
      console.error('[HermesConfig] Failed to save config to localStorage:', err);
    }
  },

  resetToDefault(): HermesSystemConfig {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('homies-hermes-config-changed', { detail: DEFAULT_HERMES_CONFIG }));
    }
    return DEFAULT_HERMES_CONFIG;
  },

  async testConnection(config: HermesSystemConfig): Promise<{ success: boolean; message: string }> {
    if (config.mode === 'local') {
      return {
        success: true,
        message: 'Não bộ F&B nội bộ (Local Brain) đang sẵn sàng 100%, không cần kết nối ngoài.',
      };
    }

    if (!config.endpoint || !config.endpoint.trim()) {
      return {
        success: false,
        message: 'Vui lòng nhập Webhook URL hoặc API Endpoint trước khi kiểm tra.',
      };
    }

    try {
      const res = await fetch('/api/hermes/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'PING_TEST',
          user_role: 'ceo',
          user_id: 'test-ping-connection',
          bot_id: 'auto',
          test_config: config,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.error || 'Kiểm tra thất bại. Endpoint không phản hồi đúng chuẩn.',
        };
      }

      return {
        success: true,
        message: data.reply || 'Kết nối thành công tới máy chủ Hermes ngoài!',
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Không thể kết nối đến Endpoint';
      return {
        success: false,
        message: `Lỗi kết nối: ${errMsg}`,
      };
    }
  },
};
