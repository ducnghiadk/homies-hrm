export type SettingCategoryId = 'organization' | 'hr_master' | 'payroll' | 'scheduling' | 'system';

export type SetupStatus = 'not_started' | 'in_progress' | 'completed';

export interface SettingSubItem {
  title: string;
  href: string;
}

export interface SettingItem {
  id: string;
  category: SettingCategoryId;
  icon: string;
  iconBg: string;
  title: string;
  description: string;
  href: string;

  // Status
  status: SetupStatus;
  statusText: string;

  // Setup wizard
  isRequired: boolean;
  setupOrder: number;

  // Sub-items (optional)
  subItems?: SettingSubItem[];

  // Quick actions (optional)
  quickActions?: {
    label: string;
    action: 'toggle' | 'link' | 'modal';
    value?: boolean;
  }[];
}

export interface SettingCategory {
  id: SettingCategoryId;
  icon: string;
  label: string;
  description: string;
}

export interface SetupProgress {
  completed: number;
  total: number;
  percentage: number;
  nextStep: SettingItem | null;
}
