// ============================================================
// CAREER PATH MODULE — Types & Interfaces
// Genesis v3 | T1.1.1 | 30+ interfaces
// ============================================================

// ─── Base ────────────────────────────────────────────────────

export type EmployeeType = 'full_time' | 'part_time';
export type SkillCategory = 'basic' | 'advanced' | 'management';
export type SkillStatus = 'locked' | 'in_progress' | 'unlocked';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type TrialResult = 'pass' | 'extend' | 'fail';
export type GoalType = 'skill' | 'level' | 'custom';
export type GoalStatus = 'active' | 'achieved' | 'cancelled';
export type NotificationChannel = 'app' | 'email' | 'zalo';
export type OnboardingStepType = 'video' | 'document' | 'quiz' | 'task' | 'checkin';
export type OnboardingStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type SkillRefreshStatus = 'valid' | 'expiring_soon' | 'expired';
export type LeaderboardCategory = 'top_mentor' | 'streak' | 'skill_unlock' | 'drinks_made';
export type OnboardingRoleCode = 'counter_staff' | 'barista' | 'shift_leader';
export type OnboardingTemplateStatus = 'draft' | 'active' | 'archived';
export type OnboardingStageCode = 'pre_start' | 'day_1' | 'day_2_3' | 'week_1' | 'week_2';
export type OnboardingTrainingMethod = 'read' | 'watch_demo' | 'shadow' | 'hands_on' | 'observation' | 'quiz';
export type OnboardingEvidenceType = 'none' | 'buddy_check' | 'manager_check' | 'quiz_score' | 'photo';
export type EmployeeOnboardingChecklistPlanStatus = 'assigned' | 'in_progress' | 'completed' | 'extended' | 'cancelled';
export type EmployeeOnboardingChecklistItemStatus = 'not_started' | 'in_progress' | 'passed' | 'need_more_coaching';

// ─── 1. Career Level ─────────────────────────────────────────

export interface CareerLevel {
  id: string;
  name: string;
  icon: string;
  order: number;
  description: string;
  color: string;
  is_active: boolean;
  min_skills_required: number;
  min_months: number;
  benefits: string[];
  created_at: string;
  updated_at: string;
}

// ─── 2. Skill ────────────────────────────────────────────────

export interface Skill {
  id: string;
  name: string;
  icon: string;
  category: SkillCategory;
  description: string;
  unlock_conditions: SkillUnlockCondition[];
  is_active: boolean;
  requires_approval: boolean;
  refresh_months?: number; // cần refresh sau X tháng (nullable = không cần)
  order: number;
  created_at: string;
  updated_at: string;
}

export interface SkillUnlockCondition {
  type: 'months_worked' | 'kpi_min' | 'skills_required' | 'level_required' | 'approval';
  value: number | string | string[];
  label: string;
}

// ─── 3. Employee Skill ───────────────────────────────────────

export interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_id: string;
  status: SkillStatus;
  unlocked_at: string | null;
  unlocked_by: string | null; // 'system' | 'manual' | manager_id
  unlock_reason?: string;
  endorsement_count: number;
  avg_endorsement_rating: number;
}

// ─── 4. Employee Type Config ─────────────────────────────────

export interface EmployeeTypeConfig {
  id: string;
  type: EmployeeType;
  label: string;
  max_skill_level: number;
  max_career_level_order: number;
  can_be_buddy: boolean;
  description: string;
  restrictions: string[];
}

// ─── 5. Skill Level Config ───────────────────────────────────

export interface SkillLevelConfig {
  level: number;
  label: string;
  icon: string;
  min_advanced_skills: number;
  color: string;
  description: string;
}

// ─── 6. Promotion Condition ──────────────────────────────────

export interface PromotionCondition {
  id: string;
  from_level_id: string;
  to_level_id: string;
  conditions: PromotionConditionItem[];
  is_active: boolean;
  created_at: string;
}

export interface PromotionConditionItem {
  type: 'months_at_level' | 'kpi_avg' | 'skills_count' | 'buddy_count' | 'custom';
  operator: '>=' | '>' | '=' | '<=' | '<';
  value: number;
  label: string;
  description?: string;
}

// ─── 7. Promotion Request ────────────────────────────────────

export interface PromotionRequest {
  id: string;
  employee_id: string;
  from_level_id: string;
  to_level_id: string;
  status: RequestStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  conditions_snapshot: PromotionConditionProgress[];
}

export interface PromotionConditionProgress {
  condition: PromotionConditionItem;
  current_value: number;
  is_met: boolean;
  progress_percent: number;
}

// ─── 8. Type Change Request ──────────────────────────────────

export interface TypeChangeRequest {
  id: string;
  employee_id: string;
  from_type: EmployeeType;
  to_type: EmployeeType;
  reason: string;
  status: RequestStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
}

// ─── 9. Buddy System ────────────────────────────────────────

export interface BuddyAssignment {
  id: string;
  mentor_id: string;
  mentee_id: string;
  store_id: string;
  started_at: string;
  completed_at: string | null;
  status: 'active' | 'completed' | 'cancelled';
  mentee_trial_result: TrialResult | null;
  mentor_rewards_given: string[];
  notes: string;
}

export interface BuddyRewardConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
  trigger: 'mentee_pass' | 'mentee_3_skills' | 'mentee_promoted' | 'mentor_streak';
  reward_type: 'badge' | 'title' | 'skill_point' | 'priority_shift' | 'bonus_day';
}

// ─── 10. Trial Evaluation ────────────────────────────────────

export interface TrialEvaluation {
  id: string;
  employee_id: string;
  evaluator_id: string;
  buddy_id: string | null;
  started_at: string;
  evaluated_at: string;
  result: TrialResult;
  checklist_scores: TrialChecklistScore[];
  overall_score: number;
  notes: string;
  extend_days?: number;
}

export interface TrialChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  weight: number;
  order: number;
  is_active: boolean;
}

export interface TrialChecklistScore {
  item_id: string;
  score: number; // 0-5
  note: string;
}

// ─── 11. Onboarding ─────────────────────────────────────────

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: OnboardingStepType;
  content_url?: string;
  required: boolean;
  estimated_minutes: number;
  order: number;
  pass_score?: number; // for quiz type (0-100)
  status: 'active' | 'inactive';
}

export interface EmployeeOnboarding {
  id: string;
  employee_id: string;
  started_at: string;
  completed_at: string | null;
  steps_progress: OnboardingStepProgress[];
  overall_progress: number; // 0-100
}

export interface OnboardingStepProgress {
  step_id: string;
  status: OnboardingStepStatus;
  started_at: string | null;
  completed_at: string | null;
  score?: number; // for quiz
}

export interface OnboardingCompetencyGroup {
  id: string;
  code: 'shift_discipline' | 'hygiene_safety' | 'customer_service' | 'station_operation' | 'shift_coordination';
  label: string;
  description?: string;
  active: boolean;
  sort_order: number;
}

export interface OnboardingChecklistTemplate {
  id: string;
  role_code: OnboardingRoleCode;
  role_label: string;
  version: number;
  status: OnboardingTemplateStatus;
  effective_from?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface OnboardingChecklistStage {
  id: string;
  template_id: string;
  code: OnboardingStageCode;
  label: string;
  sort_order: number;
  goal_summary: string;
  required_to_pass: boolean;
}

export interface OnboardingChecklistItemTemplate {
  id: string;
  template_id: string;
  stage_id: string;
  competency_group_id: string;
  code: string;
  title: string;
  instruction_text: string;
  success_criteria: string;
  training_method: OnboardingTrainingMethod;
  evidence_type: OnboardingEvidenceType;
  is_required: boolean;
  requires_buddy_confirmation: boolean;
  requires_manager_confirmation: boolean;
  requires_quiz: boolean;
  quiz_template_id?: string;
  estimated_minutes?: number;
  sort_order: number;
  active: boolean;
}

export interface EmployeeOnboardingChecklistPlan {
  id: string;
  employee_id: string;
  template_id: string;
  role_code: OnboardingRoleCode;
  assigned_store_id: string;
  assigned_buddy_id?: string | null;
  assigned_buddy_name?: string | null;
  assigned_manager_id?: string | null;
  assigned_manager_name?: string | null;
  start_date: string;
  current_stage_code: OnboardingStageCode;
  status: EmployeeOnboardingChecklistPlanStatus;
  overall_progress: number;
  overall_note?: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeOnboardingChecklistProgressItem {
  id: string;
  onboarding_plan_id: string;
  checklist_item_id: string;
  status: EmployeeOnboardingChecklistItemStatus;
  note?: string;
  started_at: string | null;
  completed_at: string | null;
  buddy_confirmed_by?: string | null;
  buddy_confirmed_at?: string | null;
  manager_confirmed_by?: string | null;
  manager_confirmed_at?: string | null;
  quiz_score?: number | null;
}

export type OnboardingThreeViewItemStatus =
  | 'not_started'
  | 'learning'
  | 'pending_review'
  | 'passed'
  | 'needs_coaching'
  | 'not_applicable';

export type OnboardingThreeViewActionOwner = 'employee' | 'buddy' | 'manager' | 'none';
export type OnboardingThreeViewBlockerType = 'item' | 'owner' | 'stage_rule';
export type OnboardingThreeViewBlockerSeverity = 'attention' | 'slow' | 'risk';
export type OnboardingThreeViewStageStatus = 'locked' | 'current' | 'passed';

export interface OnboardingThreeViewChecklistItem {
  id: string;
  stage_id: string;
  stage_code: OnboardingStageCode;
  title: string;
  code?: string;
  required: boolean;
  employee_action: string;
  buddy_action: string;
  manager_check: string;
  passing_standard: string;
  pass_standard_supported?: string;
  pass_standard_independent?: string;
  self_check_prompt?: string;
  status: OnboardingThreeViewItemStatus;
  quality_result?: OnboardingOutputQualityResult;
  workflow_status?: OnboardingOutputWorkflowStatus;
  red_flags?: OnboardingOutputRedFlag[];
  action_owner: OnboardingThreeViewActionOwner;
  note?: string;
}

export interface OnboardingThreeViewBlocker {
  id: string;
  employee_id: string;
  stage_id: string;
  stage_code: OnboardingStageCode;
  item_id?: string;
  item_title?: string;
  type: OnboardingThreeViewBlockerType;
  severity: OnboardingThreeViewBlockerSeverity;
  action_owner: OnboardingThreeViewActionOwner;
  label: string;
  detail: string;
}

export interface OnboardingThreeViewStageSummary {
  id: string;
  code: OnboardingStageCode;
  label: string;
  goal_summary: string;
  status: OnboardingThreeViewStageStatus;
  total_items: number;
  passed_items: number;
  required_items: number;
  required_items_remaining: number;
}

export interface OnboardingThreeViewSnapshot {
  employee_id: string;
  employee_name: string;
  role_code: OnboardingRoleCode;
  primary_track?: OnboardingOutputTrack;
  assigned_store_id: string;
  assigned_buddy_id?: string | null;
  assigned_buddy_name?: string | null;
  assigned_manager_id?: string | null;
  assigned_manager_name?: string | null;
  current_stage_code: OnboardingStageCode;
  current_stage_label: string;
  next_stage_code: OnboardingStageCode | null;
  next_stage_label: string | null;
  can_open_next_stage: boolean;
  readiness_label?: OnboardingOutputReadinessLabel;
  gate_status?: OnboardingOutputGateStatus;
  top_risk_label?: string | null;
  open_red_flags?: OnboardingOutputSnapshotRedFlag[];
  blockers: OnboardingThreeViewBlocker[];
  items: OnboardingThreeViewChecklistItem[];
  current_stage_items: OnboardingThreeViewChecklistItem[];
  stages: OnboardingThreeViewStageSummary[];
}

export type OnboardingOutputTrack = 'cashier_service' | 'barista' | 'shift_leader';
export type OnboardingOutputQualityResult = 'not_met' | 'met_with_support' | 'met_independently' | 'needs_retrain';
export type OnboardingOutputWorkflowStatus =
  | 'not_started'
  | 'learning'
  | 'pending_buddy_review'
  | 'pending_manager_gate'
  | 'completed'
  | 'not_applicable';
export type OnboardingOutputReadinessLabel = 'can_kem_sat' | 'can_kem_nhe' | 'tu_lam';
export type OnboardingOutputGateStatus = 'blocked' | 'supported_ready' | 'independent_ready';

export interface OnboardingOutputRedFlag {
  code: string;
  label: string;
  detail: string;
}

export interface OnboardingOutputSnapshotRedFlag extends OnboardingOutputRedFlag {
  item_id: string;
  item_title: string;
}

export interface OnboardingOutputItemDefinition {
  code: string;
  track: OnboardingOutputTrack;
  self_check_prompt: string;
  pass_standard_supported: string;
  pass_standard_independent: string;
  red_flags: OnboardingOutputRedFlag[];
}

// ─── 12. Career Goal ─────────────────────────────────────────

export interface CareerGoal {
  id: string;
  employee_id: string;
  type: GoalType;
  target_skill_id?: string;
  target_level_id?: string;
  custom_description?: string;
  title: string;
  target_date: string;
  status: GoalStatus;
  progress: number; // 0-100
  created_at: string;
  achieved_at?: string;
}

// ─── 13. Skill Endorsement ───────────────────────────────────

export interface SkillEndorsement {
  id: string;
  employee_id: string;
  skill_id: string;
  endorsed_by: string;
  endorsed_at: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

// ─── 14. Skill Refresh ──────────────────────────────────────

export interface SkillRefreshConfig {
  skill_id: string;
  refresh_months: number;
  reminder_days_before: number;
  requires_reassessment: boolean;
}

export interface SkillRefreshRecord {
  id: string;
  employee_id: string;
  skill_id: string;
  original_unlock_date: string;
  last_refresh_date: string;
  next_refresh_due: string;
  status: SkillRefreshStatus;
}

// ─── 15. Cross-Training ─────────────────────────────────────

export interface CrossTrainingRecord {
  id: string;
  employee_id: string;
  from_store_id: string;
  to_store_id: string;
  skills_learned: string[];
  started_at: string;
  completed_at: string | null;
  trainer_id: string;
  notes: string;
  status: 'active' | 'completed' | 'cancelled';
}

// ─── 16. Notification Prefs ──────────────────────────────────

export interface CareerNotificationPrefs {
  employee_id: string;
  channels: NotificationChannel[];
  preferences: {
    skill_unlock_available: boolean;
    promotion_eligible: boolean;
    goal_reminder: boolean;
    buddy_updates: boolean;
    leaderboard_updates: boolean;
    skill_expiring: boolean;
    trial_reminder: boolean;
  };
}

export type CareerNotificationType =
  | 'skill_unlock_available'
  | 'promotion_eligible'
  | 'goal_reminder'
  | 'buddy_update'
  | 'skill_expiring'
  | 'trial_reminder'
  | 'endorsement_received'
  | 'goal_achieved'
  | 'promotion_approved'
  | 'promotion_rejected';

export interface CareerNotification {
  id: string;
  employee_id: string;
  type: CareerNotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// ─── 17. Analytics ───────────────────────────────────────────

export interface CareerAnalytics {
  store_id: string;
  period: string;
  avg_time_to_promotion: number; // days
  skill_unlock_rate: number; // skills/month
  buddy_success_rate: number; // %
  retention_by_level: { level_id: string; retention_rate: number }[];
  top_skills_unlocked: { skill_id: string; count: number }[];
  promotion_funnel: { level_id: string; eligible: number; promoted: number }[];
}

// ─── 18. Settings Change Log ─────────────────────────────────

export interface SettingsChangeLog {
  id: string;
  entity_type: 'level' | 'skill' | 'condition' | 'employee_type' | 'buddy_reward' | 'trial_checklist' | 'onboarding_step' | 'settings';
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'toggle' | 'reorder';
  changed_by: string;
  changed_at: string;
  before_snapshot: string; // JSON
  after_snapshot: string;  // JSON
  description: string;
}

// ─── 19. Template ────────────────────────────────────────────

export interface CareerPathTemplate {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  data: {
    levels: CareerLevel[];
    skills: Skill[];
    conditions: PromotionCondition[];
    employee_types: EmployeeTypeConfig[];
    buddy_rewards: BuddyRewardConfig[];
    trial_checklist: TrialChecklistItem[];
    onboarding_steps: OnboardingStep[];
    onboarding_competency_groups?: OnboardingCompetencyGroup[];
    onboarding_checklist_templates?: OnboardingChecklistTemplate[];
    onboarding_checklist_stages?: OnboardingChecklistStage[];
    onboarding_checklist_items?: OnboardingChecklistItemTemplate[];
    onboarding_employee_plans?: EmployeeOnboardingChecklistPlan[];
    onboarding_employee_progress_items?: EmployeeOnboardingChecklistProgressItem[];
  };
}

// ─── 20. Settings ────────────────────────────────────────────

export type OnboardingOpsChecklistKey =
  | 'first_shift'
  | 'buddy'
  | 'uniform_attendance_policy'
  | 'tools_and_group'
  | 'first_shift_result';

export type OnboardingOpsSeverity = 'block' | 'attention';

export interface OnboardingOpsRuleItem {
  key: OnboardingOpsChecklistKey;
  label: string;
  severity: OnboardingOpsSeverity;
  store_override_allowed: boolean;
}

export interface OnboardingOpsStoreOverride {
  store_id: string;
  block_keys: OnboardingOpsChecklistKey[];
  reminder_days_before_start: number;
  alert_roles: Array<'hr_admin' | 'store_manager'>;
}

export interface OnboardingOpsSettings {
  enabled: boolean;
  lookahead_days: number;
  rules: OnboardingOpsRuleItem[];
  store_overrides: OnboardingOpsStoreOverride[];
}

export interface CareerPathSettings {
  buddy_system_enabled: boolean;
  leaderboard_enabled: boolean;
  goals_enabled: boolean;
  endorsements_enabled: boolean;
  notifications_enabled: boolean;
  onboarding_enabled: boolean;
  onboarding_policy_enabled: boolean;
  onboarding_policy_summary_trigger: 'approval_confirm' | 'contract_send';
  onboarding_policy_full_trigger: 'contract_countersign' | 'days_before_start';
  onboarding_policy_full_days_before_start: number;
  onboarding_policy_require_ack: boolean;
  onboarding_policy_max_reminders: number;
  onboarding_policy_template_id: 'default-policy-v1';
  onboarding_policy_alert_scope: 'hr_only' | 'hr_and_store_manager';
  onboarding_operations?: OnboardingOpsSettings;
  skill_refresh_enabled: boolean;
  cross_training_enabled: boolean;
  trial_duration_days: number;
  max_active_goals: number;
  leaderboard_reset_period: 'monthly' | 'quarterly';
}

// ─── 21. Leaderboard ─────────────────────────────────────────

export interface LeaderboardEntry {
  employee_id: string;
  employee_name: string;
  avatar?: string;
  store_id: string;
  category: LeaderboardCategory;
  score: number;
  rank: number;
  period: string;
  trend: 'up' | 'down' | 'same';
  highlight?: string;
}

// ─── 22. Career Progress (computed) ──────────────────────────

export interface EmployeeCareerProgress {
  employee_id: string;
  current_level: CareerLevel;
  current_skill_level: number;
  skills_unlocked: number;
  skills_total: number;
  skills_progress_percent: number;
  next_level: CareerLevel | null;
  promotion_progress_percent: number;
  promotion_conditions: PromotionConditionProgress[];
  estimated_promotion_date: string | null;
  months_at_current_level: number;
  active_goals: CareerGoal[];
  buddy_status: BuddyAssignment | null;
  onboarding_status: EmployeeOnboarding | null;
  recent_achievements: Achievement[];
  smart_suggestions: SmartSuggestion[];
}

export interface Achievement {
  id: string;
  type: 'badge' | 'milestone' | 'streak';
  title: string;
  icon: string;
  description: string;
  earned_at: string;
}

export interface SmartSuggestion {
  id: string;
  type: 'skill_unlock' | 'goal' | 'buddy' | 'promotion' | 'training' | 'tip';
  title: string;
  description: string;
  action_label?: string;
  action_link?: string;
  priority: 'high' | 'medium' | 'low';
}

// ─── 23. Report ──────────────────────────────────────────────

export interface CareerPathReport {
  store_id: string;
  period: string;
  generated_at: string;
  summary: {
    total_employees: number;
    by_level: { level_id: string; level_name: string; count: number }[];
    by_type: { type: EmployeeType; count: number }[];
    pending_promotions: number;
    pending_type_changes: number;
    active_trials: number;
    avg_skill_level: number;
  };
  upcoming_promotions: {
    employee_id: string;
    employee_name: string;
    to_level: string;
    progress_percent: number;
    estimated_date: string | null;
  }[];
  warnings: CareerWarning[];
  analytics: CareerAnalytics;
}

export interface CareerWarning {
  type: 'trial_expiring' | 'no_progress' | 'skill_expiring' | 'overdue_evaluation';
  employee_id: string;
  employee_name: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  action_link?: string;
}
