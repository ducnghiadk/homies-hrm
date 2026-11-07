export type HermesActionType =
  | 'create_deduction'
  | 'create_bonus'
  | 'navigate'
  | 'fill_screen_form';

export interface DeductionActionData {
  employee_id: string;
  employee_name: string;
  amount: number;
  ticket_type: string;
  note: string;
  date: string;
  period_id: string;
  scope?: string;
}

export interface BonusActionData {
  employee_id: string;
  employee_name: string;
  amount: number;
  ticket_type: string;
  note: string;
  date: string;
  period_id: string;
  scope?: string;
}

export interface NavigateActionData {
  url: string;
  label?: string;
}

export interface HermesAction {
  id: string;
  type: HermesActionType;
  title: string;
  description?: string;
  data: DeductionActionData | BonusActionData | NavigateActionData | Record<string, unknown>;
  status?: 'pending' | 'executed' | 'cancelled';
  executed_at?: string;
}
