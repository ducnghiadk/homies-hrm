export type TelemetryStatus = 'pending' | 'analyzing' | 'pr_created' | 'resolved' | 'ignored';
export type TelemetryEnvironment = 'development' | 'staging' | 'production';
export type BugReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface TelemetryErrorLog {
  id?: string;
  fingerprint: string;
  error_name: string;
  error_message: string;
  stack_trace?: string;
  route?: string;
  component_stack?: string;
  environment: TelemetryEnvironment;
  git_commit_sha?: string;
  occurrences: number;
  status: TelemetryStatus;
  hermes_report?: {
    root_cause?: string;
    proposed_fix?: string;
    pr_url?: string;
    pr_number?: number;
    analyzed_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface NetworkBreadcrumb {
  url: string;
  method: string;
  status?: number;
  duration_ms?: number;
  timestamp: string;
}

export interface UserBugReport {
  id?: string;
  user_id?: string;
  user_role?: string;
  user_description: string;
  route: string;
  network_breadcrumbs?: NetworkBreadcrumb[];
  screenshot_url?: string;
  telemetry_log_id?: string;
  hermes_instant_reply?: string;
  status: BugReportStatus;
  created_at?: string;
}

export interface CopilotChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface CopilotChatSession {
  id?: string;
  admin_id: string;
  messages: CopilotChatMessage[];
  created_at?: string;
  updated_at?: string;
}
