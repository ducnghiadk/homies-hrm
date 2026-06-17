// ============================================================
// CAREER PATH MODULE â€” Core Service
// Genesis v3 | T1.1.3 | 100+ functions | localStorage persistence
// ============================================================

import type {
  CareerLevel, Skill, EmployeeSkill, EmployeeTypeConfig, SkillLevelConfig,
  PromotionCondition, PromotionRequest, TypeChangeRequest,
  BuddyAssignment, BuddyRewardConfig, TrialEvaluation, TrialChecklistItem,
  OnboardingStep, EmployeeOnboarding, CareerGoal, SkillEndorsement,
  SkillRefreshRecord, CrossTrainingRecord, CareerNotification,
  SettingsChangeLog, CareerPathTemplate, CareerPathSettings,
  LeaderboardEntry, CareerAnalytics, EmployeeCareerProgress,
  CareerPathReport, CareerWarning, SmartSuggestion, Achievement,
  PromotionConditionProgress, OnboardingOpsSettings, OnboardingOpsStoreOverride,
  OnboardingCompetencyGroup, OnboardingChecklistTemplate,
  OnboardingChecklistStage, OnboardingChecklistItemTemplate, OnboardingRoleCode, OnboardingStageCode,
  EmployeeOnboardingChecklistPlan, EmployeeOnboardingChecklistProgressItem,
  EmployeeOnboardingChecklistPlanStatus,
  OnboardingSelfReviewAnswers, OnboardingSelfReviewEntry, OnboardingSelfReviewStageView,
  OnboardingMiniQuizAttempt, OnboardingMiniQuizTemplate, OnboardingMiniQuizView,
  OnboardingStageEvaluationTimelineEntry, OnboardingStageEvaluationTimelineView,
  OnboardingStageGateCode, OnboardingStageGateRecord, OnboardingStageGateView,
  OnboardingRoleSetting, OnboardingRoleSettings, OnboardingRoleSettingsValidationIssue,
  OnboardingContentTopic, OnboardingTemplateValidationIssue, OnboardingPublishValidationReport,
  TrialWorkflowReadinessIssue, OnboardingSettingsAuditEntry, OnboardingSettingsExportEnvelope,
} from './career-path-types';

import {
  defaultCareerLevels, defaultSkills, defaultSkillLevels, defaultEmployeeTypes,
  defaultPromotionConditions, defaultBuddyRewards, defaultTrialChecklist,
  defaultOnboardingSteps, defaultSettings, defaultOnboardingCompetencyGroups,
  defaultOnboardingRoleSettings,
  defaultOnboardingChecklistTemplates, defaultOnboardingContentTopics, defaultOnboardingChecklistStages,
  defaultOnboardingChecklistItems,
  onboardingMiniQuizTemplates,
  sampleEmployeeOnboardingChecklistPlans, sampleEmployeeOnboardingChecklistProgressItems,
  sampleEmployeeSkills, sampleBuddyAssignments, samplePromotionRequests,
  sampleTypeChangeRequests, sampleTrialEvaluations, sampleGoals,
  sampleEndorsements, sampleEmployeeOnboarding, sampleNotifications,
  sampleLeaderboard, sampleChangeLogs, sampleTemplate, sampleAnalytics,
  sampleAchievements, sampleRefreshRecords, sampleCrossTraining,
} from './mock-data-career-path';
import { mockEmployees, mockPositions } from './mock-data';

// â”€â”€â”€ Storage Keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const KEYS = {
  levels: 'cp_levels',
  skills: 'cp_skills',
  employeeSkills: 'cp_employee_skills',
  employeeTypes: 'cp_employee_types',
  skillLevels: 'cp_skill_levels',
  conditions: 'cp_conditions',
  buddyRewards: 'cp_buddy_rewards',
  trialChecklist: 'cp_trial_checklist',
  onboardingSteps: 'cp_onboarding_steps',
  onboardingCompetencyGroups: 'cp_onboarding_competency_groups',
  onboardingChecklistTemplates: 'cp_onboarding_checklist_templates',
  onboardingContentTopics: 'cp_onboarding_content_topics',
  onboardingChecklistStages: 'cp_onboarding_checklist_stages',
  onboardingChecklistItems: 'cp_onboarding_checklist_items',
  onboardingAuditEntries: 'cp_onboarding_audit_entries',
  onboardingEmployeePlans: 'cp_onboarding_employee_plans',
  onboardingEmployeeProgressItems: 'cp_onboarding_employee_progress_items',
  miniQuizTemplates: 'cp_onboarding_mini_quiz_templates',
  miniQuizAttempts: 'cp_onboarding_mini_quiz_attempts',
  selfReviewEntries: 'cp_onboarding_self_review_entries',
  stageGateRecords: 'cp_onboarding_stage_gate_records',
  settings: 'cp_settings',
  promotionRequests: 'cp_promo_requests',
  typeChangeRequests: 'cp_type_change_requests',
  buddyAssignments: 'cp_buddy_assignments',
  trialEvaluations: 'cp_trial_evaluations',
  goals: 'cp_goals',
  endorsements: 'cp_endorsements',
  onboardingProgress: 'cp_onboarding_progress',
  notifications: 'cp_notifications',
  leaderboard: 'cp_leaderboard',
  changeLogs: 'cp_change_logs',
  templates: 'cp_templates',
  analytics: 'cp_analytics',
  achievements: 'cp_achievements',
  refreshRecords: 'cp_refresh_records',
  crossTraining: 'cp_cross_training',
} as const;

// â”€â”€â”€ localStorage helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const defaultOnboardingOperationsSettings: OnboardingOpsSettings = {
  enabled: true,
  lookahead_days: 7,
  rules: [
    { key: 'first_shift', label: 'Ca Ä‘áº§u vÃ  giá» cÃ³ máº·t', severity: 'attention', store_override_allowed: true },
    { key: 'buddy', label: 'NgÆ°á»i kÃ¨m / ngÆ°á»i hÆ°á»›ng dáº«n', severity: 'block', store_override_allowed: true },
    { key: 'uniform_attendance_policy', label: 'Äá»“ng phá»¥c, cháº¥m cÃ´ng, ná»™i quy táº¡i quÃ¡n', severity: 'attention', store_override_allowed: true },
    { key: 'tools_and_group', label: 'TÃ i khoáº£n, nhÃ³m chat, cÃ´ng cá»¥', severity: 'attention', store_override_allowed: true },
    { key: 'first_shift_result', label: 'XÃ¡c nháº­n xong ca Ä‘áº§u á»•n', severity: 'attention', store_override_allowed: false },
  ],
  store_overrides: [],
};

type OnboardingRoleEditor = OnboardingRoleSettings['allowed_editor_roles'][number];

type RawOnboardingRoleSetting = Partial<OnboardingRoleSetting> & {
  id?: string;
  role_code?: string;
  position_id?: string | null;
};

type RawOnboardingRoleSettings = Partial<OnboardingRoleSettings> & {
  roles?: RawOnboardingRoleSetting[] | null;
};

export type UpdateOnboardingRoleSettingsResult = {
  success: boolean;
  settings: OnboardingRoleSettings;
  issues: OnboardingRoleSettingsValidationIssue[];
};

export type UnmatchedOnboardingRoleEmployee = {
  employee_id: string;
  employee_name: string;
  position_id: string;
  position_name: string;
  store_id: string;
  unmatched_reason: string;
};

export type ResolvedOnboardingRoleAssignmentSource = 'settings' | 'unmatched';

export type ResolvedOnboardingRoleAssignment = {
  source: ResolvedOnboardingRoleAssignmentSource;
  role_code: OnboardingRoleCode | null;
  role_label: string | null;
  template_id: string | null;
  template_label: string | null;
  role_setting: OnboardingRoleSetting | null;
  template: OnboardingChecklistTemplate | null;
  unmatched_reason: string | null;
};

const onboardingRoleEditors: OnboardingRoleEditor[] = ['hr_admin', 'store_manager', 'ceo'];
const onboardingRoleDisplayNameByCode: Record<string, string> = {
  counter_staff: 'Thu ngân',
  cashier: 'Thu ngân',
  barista: 'Pha chế',
  shift_leader: 'Trưởng ca',
}
const onboardingRoleDisplayNameByLabel: Record<string, string> = {
  'Thu ngan': 'Thu ngân',
  'Thu ngân': 'Thu ngân',
  'Pha che': 'Pha chế',
  'Pha chế': 'Pha chế',
  'Shift leader': 'Trưởng ca',
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeOnboardingRoleDisplayName(rawLabel?: string | null): string | null {
  if (!rawLabel) return null

  const trimmed = rawLabel.trim()
  if (!trimmed) return null

  return onboardingRoleDisplayNameByLabel[trimmed] ?? trimmed
}

export function getOnboardingRoleDisplayName(input: {
  roleCode?: string | null
  label?: string | null
  templateLabel?: string | null
}): string | null {
  const explicitLabel = normalizeOnboardingRoleDisplayName(input.label)
  if (explicitLabel) return explicitLabel

  const templateLabel = normalizeOnboardingRoleDisplayName(input.templateLabel)
  if (templateLabel) return templateLabel

  const roleCode = input.roleCode?.trim()
  if (!roleCode) return null

  return onboardingRoleDisplayNameByCode[roleCode] ?? roleCode
}

function isOnboardingRoleEditor(value: unknown): value is OnboardingRoleEditor {
  return typeof value === 'string' && onboardingRoleEditors.includes(value as OnboardingRoleEditor);
}

function getRawOnboardingRoleCode(role?: RawOnboardingRoleSetting | null): string | null {
  if (!role) return null;

  const code = typeof role.role_code === 'string'
    ? role.role_code
    : typeof role.id === 'string'
      ? role.id
      : null;

  const normalized = code?.trim();
  return normalized ? normalized : null;
}

function createFallbackOnboardingRoleSetting(roleCode: string, sortOrder: number): OnboardingRoleSetting {
  return {
    role_code: roleCode,
    label: roleCode,
    enabled: false,
    template_id: null,
    position_ids: [],
    sort_order: sortOrder,
  };
}

function normalizeOnboardingRoleSetting(
  savedRole: RawOnboardingRoleSetting | undefined,
  fallbackRole: OnboardingRoleSetting,
): OnboardingRoleSetting {
  const rawPositionIds = Array.isArray(savedRole?.position_ids)
    ? savedRole.position_ids
    : typeof savedRole?.position_id === 'string'
      ? [savedRole.position_id]
      : fallbackRole.position_ids;

  const positionIds = Array.from(
    new Set(
      rawPositionIds
        .filter((positionId): positionId is string => typeof positionId === 'string')
        .map(positionId => positionId.trim())
        .filter(Boolean),
    ),
  );

  const label = typeof savedRole?.label === 'string'
    ? savedRole.label.trim()
    : fallbackRole.label;

  const templateId = typeof savedRole?.template_id === 'string'
    ? savedRole.template_id.trim() || null
    : savedRole?.template_id === null
      ? null
      : fallbackRole.template_id;

  return {
    ...fallbackRole,
    role_code: getRawOnboardingRoleCode(savedRole) ?? fallbackRole.role_code,
    label,
    enabled: typeof savedRole?.enabled === 'boolean' ? savedRole.enabled : fallbackRole.enabled,
    template_id: templateId,
    position_ids: positionIds,
    sort_order: typeof savedRole?.sort_order === 'number' && Number.isFinite(savedRole.sort_order)
      ? savedRole.sort_order
      : fallbackRole.sort_order,
  };
}

function normalizeOnboardingRoleSettings(saved?: RawOnboardingRoleSettings | null): OnboardingRoleSettings {
  const rawRoles = Array.isArray(saved?.roles) ? saved.roles : [];
  const defaultRoles = defaultOnboardingRoleSettings.roles;
  const matchedRoleCodes = new Set<string>();

  const roles = [
    ...defaultRoles.map((defaultRole, index) => {
      const matchingRole = rawRoles.find((role) => getRawOnboardingRoleCode(role) === defaultRole.role_code);
      matchedRoleCodes.add(defaultRole.role_code);
      return normalizeOnboardingRoleSetting(matchingRole, {
        ...defaultRole,
        sort_order: defaultRole.sort_order || index + 1,
      });
    }),
    ...rawRoles.flatMap((role, index) => {
      const roleCode = getRawOnboardingRoleCode(role);
      if (!roleCode || matchedRoleCodes.has(roleCode)) {
        return [];
      }

      return [normalizeOnboardingRoleSetting(
        role,
        createFallbackOnboardingRoleSetting(roleCode, defaultRoles.length + index + 1),
      )];
    }),
  ]
    .sort((left, right) => left.sort_order - right.sort_order || left.role_code.localeCompare(right.role_code))
    .map((role, index) => ({ ...role, sort_order: index + 1 }));

  const allowedEditorRoles = Array.isArray(saved?.allowed_editor_roles)
    ? saved.allowed_editor_roles.filter(isOnboardingRoleEditor)
    : defaultOnboardingRoleSettings.allowed_editor_roles;

  return {
    roles,
    unmatched_behavior: saved?.unmatched_behavior === 'manual_required'
      ? saved.unmatched_behavior
      : defaultOnboardingRoleSettings.unmatched_behavior,
    allowed_editor_roles: allowedEditorRoles.length > 0
      ? allowedEditorRoles
      : defaultOnboardingRoleSettings.allowed_editor_roles,
    updated_at: typeof saved?.updated_at === 'string' ? saved.updated_at : defaultOnboardingRoleSettings.updated_at,
    updated_by: typeof saved?.updated_by === 'string' ? saved.updated_by : defaultOnboardingRoleSettings.updated_by,
  };
}

export function validateOnboardingRoleSettings(settings: OnboardingRoleSettings): OnboardingRoleSettingsValidationIssue[] {
  const issues: OnboardingRoleSettingsValidationIssue[] = [];
  const enabledRoles = settings.roles.filter(role => role.enabled);
  const enabledPositionAssignments = new Map<string, string>();

  if (enabledRoles.length === 0) {
    issues.push({
      code: 'all_roles_disabled',
      message: 'Pháº£i giá»¯ láº¡i Ã­t nháº¥t má»™t role onboarding Ä‘ang báº­t.',
    });
  }

  settings.roles.forEach((role) => {
    if (!role.label.trim()) {
      issues.push({
        code: 'blank_label',
        role_code: role.role_code,
        message: 'TÃªn hiá»ƒn thá»‹ cá»§a role khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.',
      });
    }

    if (role.enabled && !role.template_id) {
      issues.push({
        code: 'missing_template',
        role_code: role.role_code,
        message: 'Role onboarding Ä‘ang báº­t pháº£i chá»n checklist Ã¡p dá»¥ng.',
      });
    }

    if (role.enabled && role.template_id) {
      const template = getOnboardingChecklistTemplateById(role.template_id);

      if (!template) {
        issues.push({
          code: 'template_not_found',
          role_code: role.role_code,
          message: 'Checklist onboarding Ä‘Ã£ chá»n khÃ´ng cÃ²n tá»“n táº¡i hoáº·c Ä‘Ã£ lÆ°u trá»¯.',
        });
      } else if (template.role_code !== role.role_code) {
        issues.push({
          code: 'template_role_mismatch',
          role_code: role.role_code,
          message: 'Checklist onboarding Ä‘Ã£ chá»n thuá»™c role khÃ¡c.',
        });
      }
    }

    if (!role.enabled) {
      return;
    }

    role.position_ids.forEach((positionId) => {
      const existingRoleCode = enabledPositionAssignments.get(positionId);
      if (existingRoleCode && existingRoleCode !== role.role_code) {
        issues.push({
          code: 'duplicate_position',
          role_code: role.role_code,
          position_id: positionId,
          message: `Chá»©c danh "${positionId}" Ä‘ang Ä‘Æ°á»£c gÃ¡n cho nhiá»u role onboarding Ä‘ang báº­t.`,
        });
        return;
      }

      enabledPositionAssignments.set(positionId, role.role_code);
    });
  });

  return issues;
}

export function buildTrialWorkflowReadinessReport(settings: OnboardingRoleSettings): TrialWorkflowReadinessIssue[] {
  const issues: TrialWorkflowReadinessIssue[] = [];
  const enabledRoles = settings.roles.filter(role => role.enabled);

  if (enabledRoles.length === 0) {
    issues.push({ code: 'missing_stage', message: 'ChÆ°a cÃ³ giai Ä‘oáº¡n nÃ o' });
  }

  if (enabledRoles.some(role => !role.template_id)) {
    issues.push({ code: 'missing_task_list', message: 'CÃ³ giai Ä‘oáº¡n chÆ°a cÃ³ viá»‡c cáº§n lÃ m' });
  }

  if (enabledRoles.length > 0 && enabledRoles.every(role => role.position_ids.length === 0)) {
    issues.push({ code: 'missing_assignment_group', message: 'Chưa chọn nhóm áp dụng' });
  }

  return issues;
}

export function getUnmatchedOnboardingRoleEmployees(
  employeesOrSettings: OnboardingEmployeeSnapshot[] | OnboardingRoleSettings = getOnboardingRoleSettings(),
  settings: OnboardingRoleSettings = getOnboardingRoleSettings(),
): UnmatchedOnboardingRoleEmployee[] {
  if (Array.isArray(employeesOrSettings)) {
    return getUnmatchedOnboardingEmployees(employeesOrSettings, settings);
  }

  return getUnmatchedOnboardingEmployees(mockEmployees, employeesOrSettings);
}

export function getUnmatchedOnboardingEmployees(
  employees: OnboardingEmployeeSnapshot[] = mockEmployees,
  settings: OnboardingRoleSettings = getOnboardingRoleSettings(),
): UnmatchedOnboardingRoleEmployee[] {
  return employees
    .filter(employee => employee.status !== 'inactive')
    .filter(employee => shouldAutoAssignOnboarding(employee))
    .filter(employee => !getEmployeeOnboardingChecklistPlan(employee.id))
    .map((employee) => ({
      employee,
      resolution: resolveOnboardingRoleForEmployee(employee, { settings }),
    }))
    .filter(({ resolution }) => resolution.source === 'unmatched')
    .map(({ employee, resolution }) => ({
      employee_id: employee.id,
      employee_name: employee.full_name?.trim() || employee.id,
      position_id: employee.position_id ?? '',
      position_name: employee.position_name?.trim()
        || mockPositions.find((position) => position.id === employee.position_id)?.name
        || employee.position_id
        || 'Ch?a c? v? tr?',
      store_id: employee.store_id ?? '',
      unmatched_reason: resolution.unmatched_reason ?? 'Ch?a gh?p ch?c danh th? vi?c',
    }))
    .sort((left, right) => left.employee_name.localeCompare(right.employee_name));
}

export function getOnboardingPlanRoleLabel(plan?: EmployeeOnboardingChecklistPlan | null): string | null {
  if (!plan) return null;
  if (plan.role_label_snapshot?.trim()) {
    return getOnboardingRoleDisplayName({
      roleCode: plan.role_code,
      label: plan.role_label_snapshot,
    });
  }
  if (plan.template_label_snapshot?.trim()) {
    return getOnboardingRoleDisplayName({
      roleCode: plan.role_code,
      templateLabel: plan.template_label_snapshot,
    });
  }

  const roleSetting = getOnboardingRoleSettings().roles.find((role) => role.role_code === plan.role_code);
  if (roleSetting?.label.trim()) {
    return getOnboardingRoleDisplayName({
      roleCode: plan.role_code,
      label: roleSetting.label,
    });
  }

  return getOnboardingRoleDisplayName({
    roleCode: plan.role_code,
    templateLabel: getOnboardingChecklistTemplateById(plan.template_id)?.role_label ?? null,
  });
}

function normalizeSettings(saved?: Partial<CareerPathSettings> | null): CareerPathSettings {
  const nextSettings = saved ?? {};

  return {
    ...defaultSettings,
    ...nextSettings,
    onboarding_role_settings: normalizeOnboardingRoleSettings(nextSettings.onboarding_role_settings),
    onboarding_operations: {
      ...defaultOnboardingOperationsSettings,
      ...nextSettings.onboarding_operations,
      rules: nextSettings.onboarding_operations?.rules ?? defaultOnboardingOperationsSettings.rules,
      store_overrides: nextSettings.onboarding_operations?.store_overrides ?? defaultOnboardingOperationsSettings.store_overrides,
    },
  };
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function persistOnboardingSelfReviewEntries(): void {
  save(KEYS.selfReviewEntries, _onboardingSelfReviewEntries);
}

function persistOnboardingMiniQuizAttempts(): void {
  save(KEYS.miniQuizAttempts, _onboardingMiniQuizAttempts);
}

function sortMiniQuizAttempts(entries: OnboardingMiniQuizAttempt[]): OnboardingMiniQuizAttempt[] {
  return [...entries].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
}

function sortSelfReviewEntries(entries: OnboardingSelfReviewEntry[]): OnboardingSelfReviewEntry[] {
  return [...entries].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
}

function assertSelfReviewNote(note: string): string {
  return note.trim().slice(0, 280);
}

function persistOnboardingStageGateRecords(): void {
  save(KEYS.stageGateRecords, _onboardingStageGateRecords);
}

function getCurrentStageGateRecord(
  employeeId: string,
  onboardingPlanId: string,
  gateCode: OnboardingStageGateCode,
): OnboardingStageGateRecord | null {
  return [..._onboardingStageGateRecords]
    .filter((record) =>
      record.employee_id === employeeId
      && record.onboarding_plan_id === onboardingPlanId
      && record.gate_code === gateCode)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null;
}

function sortStageGateRecords(records: OnboardingStageGateRecord[]): OnboardingStageGateRecord[] {
  return [...records].sort((a, b) =>
    new Date(b.decided_at ?? b.created_at).getTime() - new Date(a.decided_at ?? a.created_at).getTime());
}

type OnboardingEmployeeSnapshot = {
  id: string;
  full_name?: string;
  role?: string;
  store_id?: string;
  position_id?: string;
  position_name?: string;
  hire_date?: string;
  job_level?: string;
  status?: string;
  is_probationary?: boolean;
};

function resolveEmployeeName(employeeId?: string | null): string | null {
  if (!employeeId) return null;
  return mockEmployees.find(employee => employee.id === employeeId)?.full_name ?? null;
}

function resolveStoreManager(storeId?: string): { id: string; full_name: string } | null {
  if (!storeId) return null;
  const manager = mockEmployees.find(employee => employee.store_id === storeId && employee.role === 'store_manager');
  return manager ? { id: manager.id, full_name: manager.full_name } : null;
}

function getConfiguredOnboardingRoleSettingForEmployee(
  employee: OnboardingEmployeeSnapshot,
  settings: OnboardingRoleSettings = getOnboardingRoleSettings(),
): OnboardingRoleSetting | null {
  const positionId = employee.position_id?.trim();
  if (!positionId) {
    return null;
  }

  return settings.roles.find((role) => role.enabled && role.position_ids.includes(positionId)) ?? null;
}

function getExplicitlyDisabledOnboardingRoleSettingForEmployee(
  employee: OnboardingEmployeeSnapshot,
  settings: OnboardingRoleSettings = getOnboardingRoleSettings(),
): OnboardingRoleSetting | null {
  const positionId = employee.position_id?.trim();
  if (!positionId) {
    return null;
  }

  return settings.roles.find((role) => !role.enabled && role.position_ids.includes(positionId)) ?? null;
}

export function getOnboardingChecklistTemplateById(templateId?: string | null): OnboardingChecklistTemplate | null {
  if (!templateId) {
    return null;
  }

  return _onboardingChecklistTemplates.find((template) => template.id === templateId && template.status !== 'archived') ?? null;
}

export function getOnboardingChecklistTemplateSnapshotById(templateId?: string | null): OnboardingChecklistTemplate | null {
  if (!templateId) {
    return null;
  }

  return _onboardingChecklistTemplates.find((template) => template.id === templateId) ?? null;
}

function createResolvedOnboardingRoleAssignment(input: {
  source: ResolvedOnboardingRoleAssignmentSource;
  role_setting?: OnboardingRoleSetting | null;
  role_code?: OnboardingRoleCode | null;
  template?: OnboardingChecklistTemplate | null;
  unmatched_reason?: string | null;
}): ResolvedOnboardingRoleAssignment {
  const roleSetting = input.role_setting ?? null;
  const template = input.template ?? null;
  const roleCode = input.role_code ?? roleSetting?.role_code ?? template?.role_code ?? null;

  return {
    source: input.source,
    role_code: roleCode,
    role_label: getOnboardingRoleDisplayName({
      roleCode,
      label: roleSetting?.label,
      templateLabel: template?.role_label,
    }),
    template_id: template?.id ?? roleSetting?.template_id ?? null,
    template_label: getOnboardingRoleDisplayName({
      roleCode,
      label: template?.role_label,
      templateLabel: roleSetting?.label,
    }),
    role_setting: roleSetting,
    template,
    unmatched_reason: input.unmatched_reason ?? null,
  };
}

export function resolveOnboardingRoleForEmployee(
  employee: OnboardingEmployeeSnapshot,
  options?: {
    settings?: OnboardingRoleSettings;
  },
): ResolvedOnboardingRoleAssignment {
  const settings = options?.settings ?? getOnboardingRoleSettings();
  const configuredRole = getConfiguredOnboardingRoleSettingForEmployee(employee, settings);

  if (configuredRole) {
    const template = getOnboardingChecklistTemplateById(configuredRole.template_id);
    if (!template) {
      return createResolvedOnboardingRoleAssignment({
        source: 'unmatched',
        role_setting: configuredRole,
        role_code: configuredRole.role_code,
        unmatched_reason: 'Role onboarding da match position nhung chua co checklist template hop le.',
      });
    }

    return createResolvedOnboardingRoleAssignment({
      source: 'settings',
      role_setting: configuredRole,
      template,
    });
  }

  const disabledRole = getExplicitlyDisabledOnboardingRoleSettingForEmployee(employee, settings);
  if (disabledRole) {
    return createResolvedOnboardingRoleAssignment({
      source: 'unmatched',
      role_setting: disabledRole,
      role_code: disabledRole.role_code,
      unmatched_reason: 'Quy trình thử việc cho chức danh này đang bị tắt trong thiết lập.',
    });
  }

  return createResolvedOnboardingRoleAssignment({
    source: 'unmatched',
    unmatched_reason: employee.position_id
      ? 'Ch?c danh n?y ch?a ???c gh?p v?o quy tr?nh th? vi?c trong thi?t l?p.'
      : 'Nh?n s? n?y ch?a c? v? tr? ?? gh?p quy tr?nh th? vi?c.',
  });
}

function shouldAutoAssignOnboarding(employee: OnboardingEmployeeSnapshot): boolean {
  if (employee.is_probationary || employee.status === 'probation') {
    return true;
  }

  if (!employee.hire_date) {
    return false;
  }

  const startDate = new Date(`${employee.hire_date}T00:00:00`);
  if (Number.isNaN(startDate.getTime())) {
    return false;
  }

  const diffDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 30;
}

function getChecklistItemFallbackProgress(planId: string, checklistItemId: string): EmployeeOnboardingChecklistProgressItem {
  return {
    id: `onb-progress-${planId}-${checklistItemId}`,
    onboarding_plan_id: planId,
    checklist_item_id: checklistItemId,
    status: 'not_started',
    note: '',
    started_at: null,
    completed_at: null,
    buddy_confirmed_by: null,
    buddy_confirmed_at: null,
    manager_confirmed_by: null,
    manager_confirmed_at: null,
    quiz_score: null,
  };
}

function getPlanStageAndProgress(
  plan: EmployeeOnboardingChecklistPlan,
  stages: OnboardingChecklistStage[],
  items: OnboardingChecklistItemTemplate[],
  progressItems: EmployeeOnboardingChecklistProgressItem[],
): {
  currentStageCode: OnboardingStageCode;
  overallProgress: number;
  planStatus: EmployeeOnboardingChecklistPlanStatus;
} {
  const requiredItems = items.filter(item => item.is_required);
  const passedRequiredCount = requiredItems.filter((item) =>
    progressItems.some((progressItem) => progressItem.checklist_item_id === item.id && progressItem.status === 'passed')
  ).length;
  const overallProgress = requiredItems.length === 0
    ? 0
    : Math.round((passedRequiredCount / requiredItems.length) * 100);

  const currentStage = stages.find((stage) => {
    const stageItems = items.filter(item => item.stage_id === stage.id && item.is_required);
    if (stageItems.length === 0) return false;

    return stageItems.some((item) => {
      const progressItem = progressItems.find(entry => entry.checklist_item_id === item.id);
      return !progressItem || progressItem.status !== 'passed';
    });
  }) ?? stages[stages.length - 1];

  const hasStarted = progressItems.some(item => item.status !== 'not_started');
  const planStatus: EmployeeOnboardingChecklistPlanStatus = overallProgress >= 100
    ? 'completed'
    : hasStarted || plan.status === 'in_progress'
      ? 'in_progress'
      : 'assigned';

  return {
    currentStageCode: currentStage?.code ?? plan.current_stage_code,
    overallProgress,
    planStatus,
  };
}

// â”€â”€â”€ Store Accessors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let _levels: CareerLevel[] = [];
let _skills: Skill[] = [];
let _employeeSkills: EmployeeSkill[] = [];
let _employeeTypes: EmployeeTypeConfig[] = [];
let _skillLevels: SkillLevelConfig[] = [];
let _conditions: PromotionCondition[] = [];
let _buddyRewards: BuddyRewardConfig[] = [];
let _trialChecklist: TrialChecklistItem[] = [];
let _onboardingSteps: OnboardingStep[] = [];
let _onboardingCompetencyGroups: OnboardingCompetencyGroup[] = [];
let _onboardingChecklistTemplates: OnboardingChecklistTemplate[] = [];
let _onboardingContentTopics: OnboardingContentTopic[] = [];
let _onboardingChecklistStages: OnboardingChecklistStage[] = [];
let _onboardingChecklistItems: OnboardingChecklistItemTemplate[] = [];
let _onboardingSettingsAuditEntries: OnboardingSettingsAuditEntry[] = [];
let _onboardingEmployeePlans: EmployeeOnboardingChecklistPlan[] = [];
let _onboardingEmployeeProgressItems: EmployeeOnboardingChecklistProgressItem[] = [];
let _onboardingMiniQuizTemplates: OnboardingMiniQuizTemplate[] = [];
let _onboardingMiniQuizAttempts: OnboardingMiniQuizAttempt[] = [];
let _onboardingSelfReviewEntries: OnboardingSelfReviewEntry[] = [];
let _onboardingStageGateRecords: OnboardingStageGateRecord[] = [];
let _settings: CareerPathSettings = normalizeSettings(defaultSettings);
let _promoRequests: PromotionRequest[] = [];
let _typeChangeRequests: TypeChangeRequest[] = [];
let _buddyAssignments: BuddyAssignment[] = [];
let _trialEvaluations: TrialEvaluation[] = [];
let _goals: CareerGoal[] = [];
let _endorsements: SkillEndorsement[] = [];
let _onboardingProgress: EmployeeOnboarding[] = [];
let _notifications: CareerNotification[] = [];
let _leaderboard: LeaderboardEntry[] = [];
let _changeLogs: SettingsChangeLog[] = [];
let _templates: CareerPathTemplate[] = [];
let _analytics: CareerAnalytics[] = [];
let _achievements: Achievement[] = [];
let _refreshRecords: SkillRefreshRecord[] = [];
let _crossTraining: CrossTrainingRecord[] = [];

// â”€â”€â”€ Init / Reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function initCareerPathStores(): void {
  _levels = load(KEYS.levels, defaultCareerLevels);
  _skills = load(KEYS.skills, defaultSkills);
  _employeeSkills = load(KEYS.employeeSkills, sampleEmployeeSkills);
  _employeeTypes = load(KEYS.employeeTypes, defaultEmployeeTypes);
  _skillLevels = load(KEYS.skillLevels, defaultSkillLevels);
  _conditions = load(KEYS.conditions, defaultPromotionConditions);
  _buddyRewards = load(KEYS.buddyRewards, defaultBuddyRewards);
  _trialChecklist = load(KEYS.trialChecklist, defaultTrialChecklist);
  _onboardingSteps = load(KEYS.onboardingSteps, defaultOnboardingSteps);
  _onboardingCompetencyGroups = load(KEYS.onboardingCompetencyGroups, defaultOnboardingCompetencyGroups);
  _onboardingChecklistTemplates = load(KEYS.onboardingChecklistTemplates, defaultOnboardingChecklistTemplates);
  _onboardingContentTopics = load(KEYS.onboardingContentTopics, defaultOnboardingContentTopics);
  _onboardingChecklistStages = load(KEYS.onboardingChecklistStages, defaultOnboardingChecklistStages);
  _onboardingChecklistItems = load(KEYS.onboardingChecklistItems, defaultOnboardingChecklistItems);
  _onboardingSettingsAuditEntries = load(KEYS.onboardingAuditEntries, []);
  _onboardingEmployeePlans = load(KEYS.onboardingEmployeePlans, sampleEmployeeOnboardingChecklistPlans);
  _onboardingEmployeeProgressItems = load(KEYS.onboardingEmployeeProgressItems, sampleEmployeeOnboardingChecklistProgressItems);
  _onboardingMiniQuizTemplates = load(KEYS.miniQuizTemplates, onboardingMiniQuizTemplates);
  _onboardingMiniQuizAttempts = load(KEYS.miniQuizAttempts, []);
  _onboardingSelfReviewEntries = load(KEYS.selfReviewEntries, []);
  _onboardingStageGateRecords = load(KEYS.stageGateRecords, []);
  _settings = normalizeSettings(load(KEYS.settings, defaultSettings));
  _promoRequests = load(KEYS.promotionRequests, samplePromotionRequests);
  _typeChangeRequests = load(KEYS.typeChangeRequests, sampleTypeChangeRequests);
  _buddyAssignments = load(KEYS.buddyAssignments, sampleBuddyAssignments);
  _trialEvaluations = load(KEYS.trialEvaluations, sampleTrialEvaluations);
  _goals = load(KEYS.goals, sampleGoals);
  _endorsements = load(KEYS.endorsements, sampleEndorsements);
  _onboardingProgress = load(KEYS.onboardingProgress, sampleEmployeeOnboarding);
  _notifications = load(KEYS.notifications, sampleNotifications);
  _leaderboard = load(KEYS.leaderboard, sampleLeaderboard);
  _changeLogs = load(KEYS.changeLogs, sampleChangeLogs);
  _templates = load(KEYS.templates, [sampleTemplate]);
  _analytics = load(KEYS.analytics, [sampleAnalytics]);
  _achievements = load(KEYS.achievements, sampleAchievements);
  _refreshRecords = load(KEYS.refreshRecords, sampleRefreshRecords);
  _crossTraining = load(KEYS.crossTraining, sampleCrossTraining);
}

export function resetCareerPathData(): void {
  Object.values(KEYS).forEach(k => { if (typeof window !== 'undefined') localStorage.removeItem(k); });
  initCareerPathStores();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LEVELS CRUD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getLevels(): CareerLevel[] { return _levels; }
export function getActiveLevels(): CareerLevel[] { return _levels.filter(l => l.is_active).sort((a, b) => a.order - b.order); }
export function getLevelById(id: string): CareerLevel | undefined { return _levels.find(l => l.id === id); }

export function createLevel(data: Partial<CareerLevel>): CareerLevel {
  const level: CareerLevel = {
    id: `level-${uid()}`, name: data.name || '', icon: data.icon || 'ðŸ“Œ', order: _levels.length,
    description: data.description || '', color: data.color || '#607D8B', is_active: true,
    min_skills_required: data.min_skills_required || 0, min_months: data.min_months || 0,
    benefits: data.benefits || [], created_at: today(), updated_at: today(),
  };
  _levels.push(level); save(KEYS.levels, _levels);
  logChange('level', level.id, 'create', '', JSON.stringify(level), `Táº¡o cáº¥p báº­c: ${level.name}`);
  return level;
}

export function updateLevel(id: string, data: Partial<CareerLevel>): CareerLevel | null {
  const idx = _levels.findIndex(l => l.id === id);
  if (idx === -1) return null;
  const before = JSON.stringify(_levels[idx]);
  _levels[idx] = { ..._levels[idx], ...data, updated_at: today() };
  save(KEYS.levels, _levels);
  logChange('level', id, 'update', before, JSON.stringify(_levels[idx]), `Cáº­p nháº­t cáº¥p báº­c: ${_levels[idx].name}`);
  return _levels[idx];
}

export function toggleLevel(id: string): CareerLevel | null {
  const level = _levels.find(l => l.id === id);
  if (!level) return null;
  const before = JSON.stringify({ is_active: level.is_active });
  level.is_active = !level.is_active;
  level.updated_at = today();
  save(KEYS.levels, _levels);
  logChange('level', id, 'toggle', before, JSON.stringify({ is_active: level.is_active }), `${level.is_active ? 'Báº­t' : 'Táº¯t'} cáº¥p báº­c: ${level.name}`);
  return level;
}

export function reorderLevels(ids: string[]): void {
  ids.forEach((id, i) => { const l = _levels.find(x => x.id === id); if (l) l.order = i; });
  save(KEYS.levels, _levels);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SKILLS CRUD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getSkills(): Skill[] { return _skills; }
export function getSkillsByCategory(cat: string): Skill[] { return _skills.filter(s => s.category === cat && s.is_active); }
export function getSkillById(id: string): Skill | undefined { return _skills.find(s => s.id === id); }

export function createSkill(data: Partial<Skill>): Skill {
  const skill: Skill = {
    id: `skill-${uid()}`, name: data.name || '', icon: data.icon || 'ðŸ“Œ', category: data.category || 'basic',
    description: data.description || '', unlock_conditions: data.unlock_conditions || [],
    is_active: true, requires_approval: data.requires_approval || false,
    order: _skills.length + 1, created_at: today(), updated_at: today(),
  };
  _skills.push(skill); save(KEYS.skills, _skills);
  logChange('skill', skill.id, 'create', '', JSON.stringify(skill), `Táº¡o ká»¹ nÄƒng: ${skill.name}`);
  return skill;
}

export function updateSkill(id: string, data: Partial<Skill>): Skill | null {
  const idx = _skills.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const before = JSON.stringify(_skills[idx]);
  _skills[idx] = { ..._skills[idx], ...data, updated_at: today() };
  save(KEYS.skills, _skills);
  logChange('skill', id, 'update', before, JSON.stringify(_skills[idx]), `Cáº­p nháº­t ká»¹ nÄƒng: ${_skills[idx].name}`);
  return _skills[idx];
}

export function deleteSkill(id: string): boolean {
  const idx = _skills.findIndex(s => s.id === id);
  if (idx === -1) return false;
  const before = JSON.stringify(_skills[idx]);
  _skills.splice(idx, 1);
  save(KEYS.skills, _skills);
  logChange('skill', id, 'delete', before, '', `XÃ³a ká»¹ nÄƒng`);
  return true;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EMPLOYEE SKILLS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getEmployeeSkills(empId: string): EmployeeSkill[] { return _employeeSkills.filter(es => es.employee_id === empId); }
export function getSkillStatus(empId: string, skillId: string): EmployeeSkill | undefined { return _employeeSkills.find(es => es.employee_id === empId && es.skill_id === skillId); }
export function countUnlockedSkills(empId: string): number { return _employeeSkills.filter(es => es.employee_id === empId && es.status === 'unlocked').length; }
export function countAdvancedSkills(empId: string): number {
  const unlocked = _employeeSkills.filter(es => es.employee_id === empId && es.status === 'unlocked');
  return unlocked.filter(es => { const s = getSkillById(es.skill_id); return s?.category === 'advanced'; }).length;
}

export function getEmployeeSkillLevel(empId: string): number {
  const adv = countAdvancedSkills(empId);
  const sorted = [..._skillLevels].sort((a, b) => b.level - a.level);
  for (const sl of sorted) { if (adv >= sl.min_advanced_skills) return sl.level; }
  return 1;
}

export function unlockSkill(empId: string, skillId: string, unlockedBy: string = 'system', reason?: string): EmployeeSkill {
  let es = _employeeSkills.find(x => x.employee_id === empId && x.skill_id === skillId);
  if (es) {
    es.status = 'unlocked'; es.unlocked_at = today(); es.unlocked_by = unlockedBy; if (reason) es.unlock_reason = reason;
  } else {
    es = { id: `es-${uid()}`, employee_id: empId, skill_id: skillId, status: 'unlocked', unlocked_at: today(), unlocked_by: unlockedBy, unlock_reason: reason, endorsement_count: 0, avg_endorsement_rating: 0 };
    _employeeSkills.push(es);
  }
  save(KEYS.employeeSkills, _employeeSkills);
  updateGoalProgressForEmployee(empId);
  return es;
}

export function checkSkillUnlockEligibility(empId: string, skillId: string): { eligible: boolean; conditions: { label: string; met: boolean; progress: number }[] } {
  const skill = getSkillById(skillId);
  if (!skill) return { eligible: false, conditions: [] };
  const results = skill.unlock_conditions.map(c => {
    let met = false; let progress = 0;
    switch (c.type) {
      case 'months_worked': { const months = 4; /* mock */ met = months >= (c.value as number); progress = Math.min(100, (months / (c.value as number)) * 100); break; }
      case 'kpi_min': { const kpi = 85; /* mock */ met = kpi >= (c.value as number); progress = Math.min(100, (kpi / (c.value as number)) * 100); break; }
      case 'skills_required': { const req = c.value as string[]; const have = req.filter(sid => getSkillStatus(empId, sid)?.status === 'unlocked').length; met = have >= req.length; progress = (have / req.length) * 100; break; }
      case 'level_required': { met = false; progress = 0; break; } // simplified
      case 'approval': { met = false; progress = 0; break; }
    }
    return { label: c.label, met, progress };
  });
  return { eligible: results.every(r => r.met), conditions: results };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EMPLOYEE TYPE CONFIG
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getEmployeeTypes(): EmployeeTypeConfig[] { return _employeeTypes; }
export function getEmployeeTypeConfig(type: string): EmployeeTypeConfig | undefined { return _employeeTypes.find(et => et.type === type); }
export function updateEmployeeTypeConfig(id: string, data: Partial<EmployeeTypeConfig>): EmployeeTypeConfig | null {
  const idx = _employeeTypes.findIndex(et => et.id === id);
  if (idx === -1) return null;
  const before = JSON.stringify(_employeeTypes[idx]);
  _employeeTypes[idx] = { ..._employeeTypes[idx], ...data };
  save(KEYS.employeeTypes, _employeeTypes);
  logChange('employee_type', id, 'update', before, JSON.stringify(_employeeTypes[idx]), 'Cáº­p nháº­t loáº¡i NV');
  return _employeeTypes[idx];
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SKILL LEVELS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getSkillLevels(): SkillLevelConfig[] { return _skillLevels; }

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PROMOTION CONDITIONS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getPromotionConditions(): PromotionCondition[] { return _conditions; }
export function getConditionsForTransition(fromId: string, toId: string): PromotionCondition | undefined { return _conditions.find(c => c.from_level_id === fromId && c.to_level_id === toId); }

export function createPromotionCondition(data: Partial<PromotionCondition>): PromotionCondition {
  const cond: PromotionCondition = {
    id: `promo-${uid()}`, from_level_id: data.from_level_id || '', to_level_id: data.to_level_id || '',
    conditions: data.conditions || [], is_active: true, created_at: today(),
  };
  _conditions.push(cond); save(KEYS.conditions, _conditions);
  logChange('condition', cond.id, 'create', '', JSON.stringify(cond), 'Táº¡o Ä‘iá»u kiá»‡n thÄƒng tiáº¿n');
  return cond;
}

export function updatePromotionCondition(id: string, data: Partial<PromotionCondition>): PromotionCondition | null {
  const idx = _conditions.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const before = JSON.stringify(_conditions[idx]);
  _conditions[idx] = { ..._conditions[idx], ...data };
  save(KEYS.conditions, _conditions);
  logChange('condition', id, 'update', before, JSON.stringify(_conditions[idx]), 'Cáº­p nháº­t Ä‘iá»u kiá»‡n');
  return _conditions[idx];
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PROMOTION REQUESTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getPromotionRequests(status?: string): PromotionRequest[] {
  return status ? _promoRequests.filter(r => r.status === status) : _promoRequests;
}

export function createPromotionRequest(empId: string, fromLevelId: string, toLevelId: string, conditions: PromotionConditionProgress[]): PromotionRequest {
  const req: PromotionRequest = {
    id: `preq-${uid()}`, employee_id: empId, from_level_id: fromLevelId, to_level_id: toLevelId,
    status: 'pending', submitted_at: today(), reviewed_at: null, reviewed_by: null, review_note: null,
    conditions_snapshot: conditions,
  };
  _promoRequests.push(req); save(KEYS.promotionRequests, _promoRequests);
  return req;
}

export function reviewPromotionRequest(id: string, status: 'approved' | 'rejected', reviewerId: string, note?: string): PromotionRequest | null {
  const req = _promoRequests.find(r => r.id === id);
  if (!req) return null;
  req.status = status; req.reviewed_at = today(); req.reviewed_by = reviewerId; req.review_note = note || null;
  save(KEYS.promotionRequests, _promoRequests);
  if (status === 'approved') {
    addNotification(req.employee_id, 'promotion_approved', 'ChÃºc má»«ng thÄƒng tiáº¿n!', `YÃªu cáº§u thÄƒng tiáº¿n Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t.`, '/career-path');
  } else {
    addNotification(req.employee_id, 'promotion_rejected', 'YÃªu cáº§u bá»‹ tá»« chá»‘i', note || 'YÃªu cáº§u thÄƒng tiáº¿n chÆ°a Ä‘Æ°á»£c duyá»‡t.', '/career-path/promotion');
  }
  return req;
}

export function checkPromotionEligibility(empId: string, fromLevelId: string, toLevelId: string): PromotionConditionProgress[] {
  const cond = getConditionsForTransition(fromLevelId, toLevelId);
  if (!cond) return [];
  return cond.conditions.map(c => {
    let current = 0;
    switch (c.type) {
      case 'months_at_level': current = 4; break; // mock
      case 'kpi_avg': current = 85; break; // mock
      case 'skills_count': current = countUnlockedSkills(empId); break;
      case 'buddy_count': current = _buddyAssignments.filter(b => b.mentor_id === empId && b.status === 'completed' && b.mentee_trial_result === 'pass').length; break;
      case 'custom': current = 0; break;
    }
    const met = (() => { switch (c.operator) { case '>=': return current >= c.value; case '>': return current > c.value; case '=': return current === c.value; case '<=': return current <= c.value; case '<': return current < c.value; default: return false; } })();
    const progress = c.value > 0 ? Math.min(100, (current / c.value) * 100) : (met ? 100 : 0);
    return { condition: c, current_value: current, is_met: met, progress_percent: progress };
  });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TYPE CHANGE REQUESTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getTypeChangeRequests(status?: string): TypeChangeRequest[] {
  return status ? _typeChangeRequests.filter(r => r.status === status) : _typeChangeRequests;
}

export function createTypeChangeRequest(empId: string, fromType: 'full_time' | 'part_time', toType: 'full_time' | 'part_time', reason: string): TypeChangeRequest {
  const req: TypeChangeRequest = {
    id: `tcreq-${uid()}`, employee_id: empId, from_type: fromType, to_type: toType, reason,
    status: 'pending', submitted_at: today(), reviewed_at: null, reviewed_by: null, review_note: null,
  };
  _typeChangeRequests.push(req); save(KEYS.typeChangeRequests, _typeChangeRequests);
  return req;
}

export function reviewTypeChangeRequest(id: string, status: 'approved' | 'rejected', reviewerId: string, note?: string): TypeChangeRequest | null {
  const req = _typeChangeRequests.find(r => r.id === id);
  if (!req) return null;
  req.status = status; req.reviewed_at = today(); req.reviewed_by = reviewerId; req.review_note = note || null;
  save(KEYS.typeChangeRequests, _typeChangeRequests);
  return req;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BUDDY SYSTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getBuddyAssignments(storeId?: string): BuddyAssignment[] {
  return storeId ? _buddyAssignments.filter(b => b.store_id === storeId) : _buddyAssignments;
}

export function getActiveBuddyForMentee(menteeId: string): BuddyAssignment | undefined {
  return _buddyAssignments.find(b => b.mentee_id === menteeId && b.status === 'active');
}

export function getActiveBuddiesForMentor(mentorId: string): BuddyAssignment[] {
  return _buddyAssignments.filter(b => b.mentor_id === mentorId && b.status === 'active');
}

export function createBuddyAssignment(mentorId: string, menteeId: string, storeId: string): BuddyAssignment {
  const buddy: BuddyAssignment = {
    id: `buddy-${uid()}`, mentor_id: mentorId, mentee_id: menteeId, store_id: storeId,
    started_at: today(), completed_at: null, status: 'active',
    mentee_trial_result: null, mentor_rewards_given: [], notes: '',
  };
  _buddyAssignments.push(buddy); save(KEYS.buddyAssignments, _buddyAssignments);
  return buddy;
}

export function completeBuddyAssignment(id: string, result: 'pass' | 'extend' | 'fail'): BuddyAssignment | null {
  const buddy = _buddyAssignments.find(b => b.id === id);
  if (!buddy) return null;
  buddy.status = 'completed'; buddy.completed_at = today(); buddy.mentee_trial_result = result;
  if (result === 'pass') {
    const rewards = _buddyRewards.filter(r => r.is_active && r.trigger === 'mentee_pass');
    buddy.mentor_rewards_given = rewards.map(r => r.id);
  }
  save(KEYS.buddyAssignments, _buddyAssignments);
  return buddy;
}

export function getBuddyRewards(): BuddyRewardConfig[] { return _buddyRewards; }
export function toggleBuddyReward(id: string): BuddyRewardConfig | null {
  const r = _buddyRewards.find(x => x.id === id);
  if (!r) return null;
  r.is_active = !r.is_active;
  save(KEYS.buddyRewards, _buddyRewards);
  return r;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TRIAL EVALUATION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getTrialChecklist(): TrialChecklistItem[] { return _trialChecklist; }
export function getTrialEvaluations(): TrialEvaluation[] { return _trialEvaluations; }

export function createTrialEvaluation(data: Partial<TrialEvaluation>): TrialEvaluation {
  const eval_: TrialEvaluation = {
    id: `trial-eval-${uid()}`, employee_id: data.employee_id || '', evaluator_id: data.evaluator_id || '',
    buddy_id: data.buddy_id || null, started_at: data.started_at || today(),
    evaluated_at: today(), result: data.result || 'pass',
    checklist_scores: data.checklist_scores || [], overall_score: data.overall_score || 0,
    notes: data.notes || '', extend_days: data.extend_days,
  };
  _trialEvaluations.push(eval_); save(KEYS.trialEvaluations, _trialEvaluations);
  return eval_;
}

export function updateTrialChecklistItem(id: string, data: Partial<TrialChecklistItem>): TrialChecklistItem | null {
  const idx = _trialChecklist.findIndex(t => t.id === id);
  if (idx === -1) return null;
  _trialChecklist[idx] = { ..._trialChecklist[idx], ...data };
  save(KEYS.trialChecklist, _trialChecklist);
  return _trialChecklist[idx];
}

export function createTrialChecklistItem(data: Partial<TrialChecklistItem>): TrialChecklistItem {
  const item: TrialChecklistItem = {
    id: `trial-${uid()}`, title: data.title || '', description: data.description || '',
    category: data.category || '', weight: data.weight || 10, order: _trialChecklist.length + 1, is_active: true,
  };
  _trialChecklist.push(item); save(KEYS.trialChecklist, _trialChecklist);
  return item;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ONBOARDING
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getOnboardingSteps(): OnboardingStep[] { return _onboardingSteps.sort((a, b) => a.order - b.order); }

export function getOnboardingCompetencyGroups(): OnboardingCompetencyGroup[] {
  return [..._onboardingCompetencyGroups]
    .filter(group => group.active)
    .sort((left, right) => left.sort_order - right.sort_order);
}

export function getOnboardingChecklistTemplates(): OnboardingChecklistTemplate[] {
  return [..._onboardingChecklistTemplates]
    .filter((template) => template.status !== 'archived')
    .sort((left, right) => left.role_label.localeCompare(right.role_label) || left.version - right.version);
}

export function getOnboardingContentTopics(templateId: string): OnboardingContentTopic[] {
  return _onboardingContentTopics
    .filter((topic) => topic.template_id === templateId)
    .sort((left, right) => left.sort_order - right.sort_order || left.label.localeCompare(right.label));
}


export function updateOnboardingChecklistTemplate(
  templateId: string,
  patch: Partial<Pick<OnboardingChecklistTemplate, 'name' | 'description' | 'journey_length_days' | 'notes'>>,
): OnboardingChecklistTemplate | null {
  const current = getOnboardingChecklistTemplateById(templateId);
  if (!current) return null;

  const nextTemplate = {
    ...current,
    ...patch,
    updated_at: nowIso(),
    updated_by: 'current_user',
  } satisfies OnboardingChecklistTemplate;

  _onboardingChecklistTemplates = _onboardingChecklistTemplates.map((template) =>
    template.id === templateId ? nextTemplate : template,
  );
  save(KEYS.onboardingChecklistTemplates, _onboardingChecklistTemplates);

  appendOnboardingAuditEntry(createOnboardingAuditEntry({
    event_type: 'template_update',
    entity_type: 'template',
    entity_id: templateId,
    summary: `Update template ${templateId}`,
    changed_fields: Object.keys(patch),
  }));

  return nextTemplate;
}

export function createOnboardingContentTopic(templateId: string): OnboardingContentTopic {
  const sortOrder = getOnboardingContentTopics(templateId).length + 1;
  const topic: OnboardingContentTopic = {
    id: `topic-${uid()}`,
    template_id: templateId,
    code: `topic_${sortOrder}`,
    label: `Ch? ?? ${sortOrder}`,
    sort_order: sortOrder,
    active: true,
  };

  _onboardingContentTopics.push(topic);
  save(KEYS.onboardingContentTopics, _onboardingContentTopics);
  appendOnboardingAuditEntry(createOnboardingAuditEntry({
    event_type: 'topic_create',
    entity_type: 'topic',
    entity_id: topic.id,
    summary: `Create topic ${topic.label}`,
    changed_fields: ['id', 'code', 'label', 'sort_order', 'active'],
  }));

  return topic;
}

export function updateOnboardingContentTopic(
  topicId: string,
  patch: Partial<Pick<OnboardingContentTopic, 'label' | 'active' | 'code' | 'sort_order'>>,
): OnboardingContentTopic | null {
  const current = _onboardingContentTopics.find((topic) => topic.id === topicId);
  if (!current) return null;

  const nextTopic = { ...current, ...patch } satisfies OnboardingContentTopic;
  _onboardingContentTopics = _onboardingContentTopics.map((topic) =>
    topic.id === topicId ? nextTopic : topic,
  );
  save(KEYS.onboardingContentTopics, _onboardingContentTopics);
  appendOnboardingAuditEntry(createOnboardingAuditEntry({
    event_type: 'topic_update',
    entity_type: 'topic',
    entity_id: topicId,
    summary: `Update topic ${topicId}`,
    changed_fields: Object.keys(patch),
  }));

  return nextTopic;
}

export function updateOnboardingChecklistStage(
  stageId: string,
  patch: Partial<Pick<OnboardingChecklistStage, 'label' | 'required_to_pass' | 'goal_summary' | 'sort_order'>>,
): OnboardingChecklistStage | null {
  const current = _onboardingChecklistStages.find((stage) => stage.id === stageId);
  if (!current) return null;

  const nextStage = { ...current, ...patch } satisfies OnboardingChecklistStage;
  _onboardingChecklistStages = _onboardingChecklistStages.map((stage) =>
    stage.id === stageId ? nextStage : stage,
  );
  save(KEYS.onboardingChecklistStages, _onboardingChecklistStages);
  appendOnboardingAuditEntry(createOnboardingAuditEntry({
    event_type: 'stage_update',
    entity_type: 'stage',
    entity_id: stageId,
    summary: `Update stage ${stageId}`,
    changed_fields: Object.keys(patch),
  }));

  return nextStage;
}

export function createOnboardingChecklistItem(templateId: string): OnboardingChecklistItemTemplate {
  const stages = getOnboardingChecklistStages(templateId);
  const topics = getOnboardingContentTopics(templateId);
  const groups = getOnboardingCompetencyGroups();
  const sortOrder = getOnboardingChecklistItems(templateId).length + 1;
  const item: OnboardingChecklistItemTemplate = {
    id: `item-${uid()}`,
    template_id: templateId,
    stage_id: stages[0]?.id ?? '',
    topic_id: topics[0]?.id ?? '',
    competency_group_id: groups[0]?.id ?? '',
    code: `item_${sortOrder}`,
    title: `M?c onboarding ${sortOrder}`,
    instruction_text: '',
    success_criteria: '',
    training_method: 'shadow',
    evidence_type: 'buddy_check',
    confirmer_role: 'buddy',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: true,
    requires_manager_confirmation: false,
    requires_quiz: false,
    is_focus_block_eligible: false,
    estimated_minutes: 15,
    sort_order: sortOrder,
    active: true,
  };

  _onboardingChecklistItems.push(item);
  save(KEYS.onboardingChecklistItems, _onboardingChecklistItems);
  appendOnboardingAuditEntry(createOnboardingAuditEntry({
    event_type: 'item_create',
    entity_type: 'item',
    entity_id: item.id,
    summary: `Create checklist item ${item.title}`,
    changed_fields: ['id', 'code', 'title', 'topic_id', 'stage_id', 'sort_order'],
  }));

  return item;
}

export function updateOnboardingChecklistItem(
  itemId: string,
  patch: Partial<OnboardingChecklistItemTemplate>,
): OnboardingChecklistItemTemplate | null {
  const current = _onboardingChecklistItems.find((item) => item.id === itemId);
  if (!current) return null;

  const nextItem = {
    ...current,
    ...patch,
    estimated_minutes: Math.max(1, Number(patch.estimated_minutes ?? current.estimated_minutes)),
  } satisfies OnboardingChecklistItemTemplate;

  _onboardingChecklistItems = _onboardingChecklistItems.map((item) =>
    item.id === itemId ? nextItem : item,
  );
  save(KEYS.onboardingChecklistItems, _onboardingChecklistItems);
  appendOnboardingAuditEntry(createOnboardingAuditEntry({
    event_type: 'item_update',
    entity_type: 'item',
    entity_id: itemId,
    summary: `Update checklist item ${itemId}`,
    changed_fields: Object.keys(patch),
  }));

  return nextItem;
}

export function getPublishedOnboardingChecklistTemplate(roleCode: OnboardingRoleCode): OnboardingChecklistTemplate | null {
  return _onboardingChecklistTemplates
    .filter((template) => template.role_code === roleCode && template.status === 'published')
    .sort((left, right) => right.version - left.version)[0] ?? null;
}

export function getDraftOnboardingChecklistTemplate(roleCode: OnboardingRoleCode): OnboardingChecklistTemplate | null {
  return _onboardingChecklistTemplates
    .filter((template) => template.role_code === roleCode && template.status === 'draft')
    .sort((left, right) => right.version - left.version)[0] ?? null;
}

export function getOnboardingChecklistTemplateByRole(roleCode: OnboardingRoleCode): OnboardingChecklistTemplate | undefined {
  const roleSetting = getOnboardingRoleSettings().roles.find((role) => role.role_code === roleCode);
  if (!roleSetting?.template_id) {
    return undefined;
  }

  return getOnboardingChecklistTemplateById(roleSetting.template_id) ?? undefined;
}

export function validateOnboardingTemplateForPublish(templateId: string): OnboardingTemplateValidationIssue[] {
  const topics = getOnboardingContentTopics(templateId).filter((topic) => topic.active);
  const items = getOnboardingChecklistItems(templateId).filter((item) => item.active);
  const issues: OnboardingTemplateValidationIssue[] = [];

  if (topics.length === 0) {
    issues.push({ code: 'missing_topic', template_id: templateId, message: 'Published template must have at least one active topic.' });
  }

  if (items.length === 0) {
    issues.push({ code: 'missing_item', template_id: templateId, message: 'Published template must have at least one active item.' });
  }

  if (!items.some((item) => item.code.includes('orientation') || item.topic_id.includes('orientation'))) {
    issues.push({ code: 'missing_orientation', template_id: templateId, message: 'At least one orientation item is required before publish.' });
  }

  if (!items.some((item) => item.topic_id.includes('hygiene'))) {
    issues.push({ code: 'missing_hygiene', template_id: templateId, message: 'At least one hygiene item is required before publish.' });
  }

  if (!items.some((item) => item.topic_id.includes('service') || item.topic_id.includes('pos_payment'))) {
    issues.push({ code: 'missing_service', template_id: templateId, message: 'At least one service item is required before publish.' });
  }

  if (!items.some((item) => item.topic_id.includes('review') || item.stage_id.endsWith('week-2'))) {
    issues.push({ code: 'missing_follow_up', template_id: templateId, message: 'At least one shift readiness or follow-up item is required before publish.' });
  }

  return issues;
}

export function validateOnboardingTemplateForPublishReport(templateId: string): OnboardingPublishValidationReport {
  const blocking_issues = validateOnboardingTemplateForPublish(templateId);

  return {
    template_id: templateId,
    blocking_issues,
    warning_issues: [],
    checked_at: nowIso(),
  };
}

export function duplicateOnboardingChecklistTemplate(templateId: string): OnboardingChecklistTemplate {
  const source = getOnboardingChecklistTemplateById(templateId);
  if (!source) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const nextTemplate: OnboardingChecklistTemplate = {
    ...source,
    id: `onb-template-${uid()}`,
    version: source.version + 1,
    status: 'draft',
    source_type: 'duplicated',
    effective_from: null,
    published_at: null,
    published_by: null,
    created_at: nowIso(),
    updated_at: nowIso(),
    updated_by: 'current_user',
  };

  const topicIdMap = new Map<string, string>();
  const stageIdMap = new Map<string, string>();

  const duplicatedTopics = getOnboardingContentTopics(source.id).map((topic) => {
    const nextId = `topic-${uid()}`;
    topicIdMap.set(topic.id, nextId);
    return { ...topic, id: nextId, template_id: nextTemplate.id };
  });

  const duplicatedStages = getOnboardingChecklistStages(source.id).map((stage) => {
    const nextId = `${nextTemplate.id}-${stage.code}`;
    stageIdMap.set(stage.id, nextId);
    return { ...stage, id: nextId, template_id: nextTemplate.id };
  });

  const duplicatedItems = getOnboardingChecklistItems(source.id).map((item) => ({
    ...item,
    id: `item-${uid()}`,
    template_id: nextTemplate.id,
    stage_id: stageIdMap.get(item.stage_id) ?? item.stage_id,
    topic_id: topicIdMap.get(item.topic_id) ?? item.topic_id,
  }));

  _onboardingChecklistTemplates.push(nextTemplate);
  _onboardingContentTopics.push(...duplicatedTopics);
  _onboardingChecklistStages.push(...duplicatedStages);
  _onboardingChecklistItems.push(...duplicatedItems);
  save(KEYS.onboardingChecklistTemplates, _onboardingChecklistTemplates);
  save(KEYS.onboardingContentTopics, _onboardingContentTopics);
  save(KEYS.onboardingChecklistStages, _onboardingChecklistStages);
  save(KEYS.onboardingChecklistItems, _onboardingChecklistItems);
  return nextTemplate;
}

export function archiveOnboardingChecklistTemplate(templateId: string): void {
  _onboardingChecklistTemplates = _onboardingChecklistTemplates.map((template) =>
    template.id === templateId
      ? { ...template, status: 'archived', updated_at: nowIso(), updated_by: 'current_user' }
      : template,
  );
  save(KEYS.onboardingChecklistTemplates, _onboardingChecklistTemplates);
}

export function publishOnboardingChecklistTemplate(templateId: string): OnboardingChecklistTemplate {
  const report = validateOnboardingTemplateForPublishReport(templateId);
  if (report.blocking_issues.length > 0) {
    throw new Error(report.blocking_issues.map((issue) => issue.message).join(' | '));
  }

  const draft = getOnboardingChecklistTemplateById(templateId);
  if (!draft) {
    throw new Error(`Template not found: ${templateId}`);
  }

  _onboardingChecklistTemplates = _onboardingChecklistTemplates.map((template) => {
    if (template.role_code === draft.role_code && template.status === 'published') {
      return { ...template, status: 'archived', updated_at: nowIso(), updated_by: 'current_user' };
    }

    if (template.id === draft.id) {
      return {
        ...template,
        status: 'published',
        published_at: nowIso(),
        published_by: 'current_user',
        updated_at: nowIso(),
        updated_by: 'current_user',
      };
    }

    return template;
  });

  save(KEYS.onboardingChecklistTemplates, _onboardingChecklistTemplates);

  appendOnboardingAuditEntry(createOnboardingAuditEntry({
    event_type: 'template_publish',
    entity_type: 'template',
    entity_id: templateId,
    summary: `Publish template ${templateId}`,
    changed_fields: ['status', 'published_at', 'published_by'],
  }));

  return getOnboardingChecklistTemplateById(templateId)!;
}

export function getOnboardingChecklistStages(templateId: string): OnboardingChecklistStage[] {
  return _onboardingChecklistStages
    .filter(stage => stage.template_id === templateId)
    .sort((left, right) => left.sort_order - right.sort_order);
}

export function getOnboardingChecklistItems(templateId: string): OnboardingChecklistItemTemplate[] {
  return _onboardingChecklistItems
    .filter(item => item.template_id === templateId && item.active)
    .sort((left, right) => left.sort_order - right.sort_order);
}

export function getOnboardingChecklistBundle(roleCode: OnboardingRoleCode) {
  const template = getOnboardingChecklistTemplateByRole(roleCode);
  if (!template) {
    return null;
  }

  return {
    template,
    competency_groups: getOnboardingCompetencyGroups(),
    content_topics: getOnboardingContentTopics(template.id),
    stages: getOnboardingChecklistStages(template.id),
    items: getOnboardingChecklistItems(template.id),
  };
}

export function getEmployeeOnboardingChecklistPlan(employeeId: string): EmployeeOnboardingChecklistPlan | null {
  return _onboardingEmployeePlans.find(plan => plan.employee_id === employeeId && plan.status !== 'cancelled') ?? null;
}

export function getEmployeeOnboardingChecklistProgressItems(planId: string): EmployeeOnboardingChecklistProgressItem[] {
  return _onboardingEmployeeProgressItems
    .filter(item => item.onboarding_plan_id === planId)
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function getOnboardingMiniQuizTemplateForStage(stageCode: OnboardingStageCode): OnboardingMiniQuizTemplate | null {
  return _onboardingMiniQuizTemplates.find((entry) => entry.stage_code === stageCode) ?? null;
}

function calculateMiniQuizScore(template: OnboardingMiniQuizTemplate, answers: Record<string, string>): number {
  if (template.questions.length === 0) return 0;
  const correctCount = template.questions.filter((question) => answers[question.id] === question.correct_option_id).length;
  return Math.round((correctCount / template.questions.length) * 100);
}

function getMiniQuizWrongQuestionIds(template: OnboardingMiniQuizTemplate, answers: Record<string, string>): string[] {
  return template.questions
    .filter((question) => answers[question.id] !== question.correct_option_id)
    .map((question) => question.id);
}

function getMiniQuizStatusLabel(score?: number | null): OnboardingMiniQuizView['status_label'] {
  if (score === null || score === undefined) return 'Chưa làm bài kiểm tra ngắn';
  return score >= 80 ? 'Ổn phần nền' : 'Cần ôn lại';
}

export function submitOnboardingMiniQuizAttempt(input: {
  employeeId: string;
  onboardingPlanId: string;
  stageCode: OnboardingStageCode;
  answers: Record<string, string>;
}): OnboardingMiniQuizAttempt | null {
  const template = getOnboardingMiniQuizTemplateForStage(input.stageCode);
  if (!template) return null;

  const normalizedAnswers = Object.fromEntries(
    template.questions.map((question) => [question.id, input.answers[question.id] ?? '']),
  );

  const attempt: OnboardingMiniQuizAttempt = {
    id: `onb-mini-quiz-${uid()}`,
    employee_id: input.employeeId,
    onboarding_plan_id: input.onboardingPlanId,
    quiz_template_id: template.id,
    answers: normalizedAnswers,
    score: calculateMiniQuizScore(template, normalizedAnswers),
    submitted_at: new Date().toISOString(),
  };

  _onboardingMiniQuizAttempts = [..._onboardingMiniQuizAttempts, attempt];
  persistOnboardingMiniQuizAttempts();
  return attempt;
}

export function getOnboardingMiniQuizView(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingMiniQuizView | null {
  const template = getOnboardingMiniQuizTemplateForStage(stageCode);
  if (!template) return null;

  const history = sortMiniQuizAttempts(
    _onboardingMiniQuizAttempts.filter((entry) =>
      entry.employee_id === employeeId
      && entry.onboarding_plan_id === onboardingPlanId
      && entry.quiz_template_id === template.id),
  );
  const latest = history[0] ?? null;

  return {
    template,
    latest,
    history,
    latest_wrong_question_ids: latest ? getMiniQuizWrongQuestionIds(template, latest.answers) : [],
    status_label: getMiniQuizStatusLabel(latest?.score),
  };
}

export function getOnboardingStageGateHistoryForStage(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingStageGateRecord[] {
  return sortStageGateRecords(
    _onboardingStageGateRecords.filter((record) =>
      record.employee_id === employeeId
      && record.onboarding_plan_id === onboardingPlanId
      && record.stage_code === stageCode),
  );
}

function mapSelfReviewTimelineEntry(entry: OnboardingSelfReviewEntry): OnboardingStageEvaluationTimelineEntry {
  return {
    id: `timeline-self-review-${entry.id}`,
    stage_code: entry.stage_code,
    entry_type: 'self_review',
    occurred_at: entry.submitted_at,
    headline: 'Tự đánh giá mới',
    summary_lines: [
      `Tự tin nhất: ${entry.answers.confidence_tag}`,
      `Cần kèm sát: ${entry.answers.coaching_tag}`,
      `Sợ nhất: ${entry.answers.fear_tag}`,
    ],
    status_tone: 'neutral',
    raw_ref: entry,
  };
}

function mapMiniQuizTimelineEntry(
  stageCode: OnboardingStageCode,
  template: OnboardingMiniQuizTemplate,
  attempt: OnboardingMiniQuizAttempt,
): OnboardingStageEvaluationTimelineEntry {
  const wrongQuestionCount = getMiniQuizWrongQuestionIds(template, attempt.answers).length;

  return {
    id: `timeline-mini-quiz-${attempt.id}`,
    stage_code: stageCode,
    entry_type: 'mini_quiz',
    occurred_at: attempt.submitted_at,
    headline: `Bài kiểm tra ngắn ${attempt.score}%`,
    summary_lines: [
      `Trạng thái: ${getMiniQuizStatusLabel(attempt.score)}`,
      wrongQuestionCount > 0 ? `Cần ôn lại ${wrongQuestionCount} câu` : 'Không có câu sai',
    ],
    status_tone: attempt.score >= 80 ? 'good' : 'warning',
    raw_ref: attempt,
  };
}

function mapStageGateTimelineEntry(record: OnboardingStageGateRecord): OnboardingStageEvaluationTimelineEntry {
  return {
    id: `timeline-stage-gate-${record.id}`,
    stage_code: record.stage_code,
    entry_type: 'stage_gate',
    occurred_at: record.decided_at ?? record.created_at,
    headline:
      record.status === 'da_qua_gate'
        ? 'Bước chốt: Đã qua'
        : record.status === 'chua_qua_gate'
          ? 'Bước chốt: Chưa qua'
          : 'Bước chốt: Chờ duyệt',
    summary_lines: [
      record.buddy_note ? `Người kèm: ${record.buddy_note}` : 'Người kèm: Chưa có ghi chú',
      record.manager_note ? `Quản lý: ${record.manager_note}` : 'Quản lý: Chưa có ghi chú',
      record.retry_item_ids.length > 0 ? `Cần làm lại: ${record.retry_item_ids.length} mục` : 'Không có mục làm lại',
    ],
    status_tone:
      record.status === 'da_qua_gate'
        ? 'good'
        : record.status === 'cho_quan_ly_duyet'
          ? 'neutral'
          : 'warning',
    raw_ref: record,
  };
}

export function getOnboardingStageEvaluationTimelineView(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingStageEvaluationTimelineView {
  const selfReviewView = getOnboardingSelfReviewStageView(employeeId, onboardingPlanId, stageCode);
  const miniQuizView = getOnboardingMiniQuizView(employeeId, onboardingPlanId, stageCode);
  const gateHistory = getOnboardingStageGateHistoryForStage(employeeId, onboardingPlanId, stageCode);

  const entries = [
    ...selfReviewView.history.map(mapSelfReviewTimelineEntry),
    ...(miniQuizView
      ? miniQuizView.history.map((attempt) => mapMiniQuizTimelineEntry(stageCode, miniQuizView.template, attempt))
      : []),
    ...gateHistory.map(mapStageGateTimelineEntry),
  ].sort((left, right) => new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime());

  return {
    stage_code: stageCode,
    latest_self_review: selfReviewView.latest,
    latest_mini_quiz: miniQuizView?.latest ?? null,
    latest_stage_gate: gateHistory[0] ?? null,
    entries,
  };
}

export function getOnboardingSelfReviewStageView(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingSelfReviewStageView {
  const history = sortSelfReviewEntries(
    _onboardingSelfReviewEntries.filter((entry) =>
      entry.employee_id === employeeId
      && entry.onboarding_plan_id === onboardingPlanId
      && entry.stage_code === stageCode),
  );

  return {
    stage_code: stageCode,
    latest: history[0] ?? null,
    history,
  };
}

export function submitOnboardingSelfReview(input: {
  employeeId: string;
  onboardingPlanId: string;
  stageCode: OnboardingStageCode;
  answers: OnboardingSelfReviewAnswers;
  submittedBy: string;
}): OnboardingSelfReviewEntry {
  const entry: OnboardingSelfReviewEntry = {
    id: `onb-self-review-${uid()}`,
    employee_id: input.employeeId,
    onboarding_plan_id: input.onboardingPlanId,
    stage_code: input.stageCode,
    answers: {
      confidence_tag: input.answers.confidence_tag,
      confidence_note: assertSelfReviewNote(input.answers.confidence_note),
      coaching_tag: input.answers.coaching_tag,
      coaching_note: assertSelfReviewNote(input.answers.coaching_note),
      fear_tag: input.answers.fear_tag,
      fear_note: assertSelfReviewNote(input.answers.fear_note),
    },
    submitted_at: new Date().toISOString(),
    submitted_by: input.submittedBy,
  };

  _onboardingSelfReviewEntries = [..._onboardingSelfReviewEntries, entry];
  persistOnboardingSelfReviewEntries();
  return entry;
}

export function getLatestOnboardingSelfReviewForPlan(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingSelfReviewEntry | null {
  return getOnboardingSelfReviewStageView(employeeId, onboardingPlanId, stageCode).latest;
}

export function resolveGateCodeForStage(stageCode: OnboardingStageCode): OnboardingStageGateCode | null {
  if (stageCode === 'day_2_3') return 'ready_for_live_shift';
  if (stageCode === 'day_4_7') return 'ready_for_independent_shift';
  return null;
}

function getBlockedRequiredProgressItems(
  planId: string,
  stageCode: OnboardingStageCode,
): EmployeeOnboardingChecklistProgressItem[] {
  const plan = _onboardingEmployeePlans.find((entry) => entry.id === planId);
  if (!plan) return [];

  const stages = getOnboardingChecklistStages(plan.template_id);
  const stage = stages.find((entry) => entry.code === stageCode);
  if (!stage) return [];

  const items = getOnboardingChecklistItems(plan.template_id)
    .filter((item) => item.stage_id === stage.id && item.is_required);
  const progressItems = getEmployeeOnboardingChecklistProgressItems(planId);

  return items
    .map((item) => progressItems.find((progress) => progress.checklist_item_id === item.id) ?? getChecklistItemFallbackProgress(planId, item.id))
    .filter((progress) => progress.status === 'not_started' || progress.status === 'need_more_coaching');
}

export function getOnboardingStageGateView(
  employeeId: string,
  onboardingPlanId: string,
  stageCode: OnboardingStageCode,
): OnboardingStageGateView | null {
  const gateCode = resolveGateCodeForStage(stageCode);
  if (!gateCode) return null;

  const selfReview = getOnboardingSelfReviewStageView(employeeId, onboardingPlanId, stageCode);
  const blockedItems = getBlockedRequiredProgressItems(onboardingPlanId, stageCode);
  const record = getCurrentStageGateRecord(employeeId, onboardingPlanId, gateCode);

  return {
    gate_code: gateCode,
    status: record?.status ?? 'chua_de_xuat',
    required_self_review: true,
    has_self_review: Boolean(selfReview.latest),
    blocked_item_ids: blockedItems.map((item) => item.checklist_item_id),
    retry_item_ids: record?.retry_item_ids ?? [],
    buddy_note: record?.buddy_note ?? '',
    manager_note: record?.manager_note ?? '',
  };
}

export function proposeOnboardingStageGate(input: {
  employeeId: string;
  onboardingPlanId: string;
  stageCode: OnboardingStageCode;
  buddyNote: string;
}): OnboardingStageGateRecord | null {
  const gateView = getOnboardingStageGateView(input.employeeId, input.onboardingPlanId, input.stageCode);
  if (!gateView || !gateView.has_self_review || gateView.blocked_item_ids.length > 0) return null;

  const record: OnboardingStageGateRecord = {
    id: `onb-stage-gate-${uid()}`,
    employee_id: input.employeeId,
    onboarding_plan_id: input.onboardingPlanId,
    stage_code: input.stageCode,
    gate_code: gateView.gate_code,
    status: 'cho_quan_ly_duyet',
    buddy_recommendation: 'de_xuat_qua_gate',
    buddy_note: input.buddyNote.trim().slice(0, 280),
    manager_decision: null,
    manager_note: '',
    retry_item_ids: [],
    created_at: new Date().toISOString(),
    decided_at: null,
  };

  _onboardingStageGateRecords = [..._onboardingStageGateRecords, record];
  persistOnboardingStageGateRecords();
  return record;
}

function unlockNextStageFromGate(planId: string, gateCode: OnboardingStageGateCode): void {
  const planIndex = _onboardingEmployeePlans.findIndex((entry) => entry.id === planId);
  if (planIndex === -1) return;

  const nextStageCode: OnboardingStageCode =
    gateCode === 'ready_for_live_shift' ? 'day_4_7' : 'week_2';

  _onboardingEmployeePlans[planIndex] = {
    ..._onboardingEmployeePlans[planIndex],
    current_stage_code: nextStageCode,
    updated_at: today(),
  };

  save(KEYS.onboardingEmployeePlans, _onboardingEmployeePlans);
}

export function approveOnboardingStageGate(input: {
  employeeId: string;
  onboardingPlanId: string;
  stageCode: OnboardingStageCode;
  managerNote: string;
}): OnboardingStageGateRecord | null {
  const gateView = getOnboardingStageGateView(input.employeeId, input.onboardingPlanId, input.stageCode);
  const record = gateView ? getCurrentStageGateRecord(input.employeeId, input.onboardingPlanId, gateView.gate_code) : null;
  const managerNote = input.managerNote.trim().slice(0, 280);
  if (!gateView || !record || !gateView.has_self_review || gateView.blocked_item_ids.length > 0 || !managerNote) return null;

  const updatedRecord: OnboardingStageGateRecord = {
    ...record,
    status: 'da_qua_gate',
    manager_decision: 'duyet_gate',
    manager_note: managerNote,
    decided_at: new Date().toISOString(),
  };

  _onboardingStageGateRecords = _onboardingStageGateRecords.map((entry) => entry.id === record.id ? updatedRecord : entry);
  persistOnboardingStageGateRecords();
  unlockNextStageFromGate(input.onboardingPlanId, gateView.gate_code);
  return updatedRecord;
}

export function rejectOnboardingStageGate(input: {
  employeeId: string;
  onboardingPlanId: string;
  stageCode: OnboardingStageCode;
  managerNote: string;
  retryItemIds: string[];
}): OnboardingStageGateRecord | null {
  const gateView = getOnboardingStageGateView(input.employeeId, input.onboardingPlanId, input.stageCode);
  const record = gateView ? getCurrentStageGateRecord(input.employeeId, input.onboardingPlanId, gateView.gate_code) : null;
  const managerNote = input.managerNote.trim().slice(0, 280);
  const normalizedRetryItemIds = input.retryItemIds.slice(0, 3);
  if (!gateView || !record || !managerNote || normalizedRetryItemIds.length === 0) return null;

  const updatedRecord: OnboardingStageGateRecord = {
    ...record,
    status: 'chua_qua_gate',
    manager_decision: 'chua_duyet_gate',
    manager_note: managerNote,
    retry_item_ids: normalizedRetryItemIds,
    decided_at: new Date().toISOString(),
  };

  _onboardingStageGateRecords = _onboardingStageGateRecords.map((entry) => entry.id === record.id ? updatedRecord : entry);
  persistOnboardingStageGateRecords();
  return updatedRecord;
}

export function assignOnboardingChecklistTemplateToEmployee(
  employee: OnboardingEmployeeSnapshot,
  options?: {
    role_code?: OnboardingRoleCode;
    assigned_buddy_id?: string | null;
    assigned_manager_id?: string | null;
    start_date?: string;
    overall_note?: string;
  },
): EmployeeOnboardingChecklistPlan | null {
  const existing = getEmployeeOnboardingChecklistPlan(employee.id);
  if (existing) {
    return existing;
  }

  const settings = getOnboardingRoleSettings();
  const resolvedRole = options?.role_code
    ? (() => {
        const roleSetting = settings.roles.find((role) => role.role_code === options.role_code) ?? null;
        const template = roleSetting?.template_id
          ? getOnboardingChecklistTemplateById(roleSetting.template_id)
          : null;

        return createResolvedOnboardingRoleAssignment({
          source: 'settings',
          role_setting: roleSetting,
          role_code: options.role_code,
          template: template ?? null,
          unmatched_reason: template ? null : 'Khong tim thay checklist template cho role onboarding nay.',
        });
      })()
    : resolveOnboardingRoleForEmployee(employee, { settings });

  if (!resolvedRole.role_code || !resolvedRole.template) {
    return null;
  }

  const roleCode = resolvedRole.role_code;
  const template = resolvedRole.template;
  const buddyAssignment = _buddyAssignments.find(assignment => assignment.mentee_id === employee.id && assignment.status === 'active');
  const buddyId = options?.assigned_buddy_id ?? buddyAssignment?.mentor_id ?? null;
  const manager = options?.assigned_manager_id
    ? { id: options.assigned_manager_id, full_name: resolveEmployeeName(options.assigned_manager_id) ?? options.assigned_manager_id }
    : resolveStoreManager(employee.store_id);
  const stages = getOnboardingChecklistStages(template.id);
  const items = getOnboardingChecklistItems(template.id);
  const planId = `onb-plan-${uid()}`;
  const startDate = options?.start_date ?? employee.hire_date ?? today();
  const plan: EmployeeOnboardingChecklistPlan = {
    id: planId,
    employee_id: employee.id,
    template_id: template.id,
    role_code: roleCode,
    role_label_snapshot: resolvedRole.role_label ?? template.role_label ?? roleCode,
    template_label_snapshot: resolvedRole.template_label ?? template.role_label ?? null,
    assigned_store_id: employee.store_id ?? '',
    assigned_buddy_id: buddyId,
    assigned_buddy_name: resolveEmployeeName(buddyId),
    assigned_manager_id: manager?.id ?? null,
    assigned_manager_name: manager?.full_name ?? null,
    start_date: startDate,
    current_stage_code: stages[0]?.code ?? 'pre_start',
    status: startDate <= today() ? 'in_progress' : 'assigned',
    overall_progress: 0,
    overall_note: options?.overall_note ?? null,
    assigned_at: today(),
    created_at: today(),
    updated_at: today(),
  };

  const progressItems = items.map((item) => getChecklistItemFallbackProgress(planId, item.id));

  _onboardingEmployeePlans.push(plan);
  _onboardingEmployeeProgressItems.push(...progressItems);
  save(KEYS.onboardingEmployeePlans, _onboardingEmployeePlans);
  save(KEYS.onboardingEmployeeProgressItems, _onboardingEmployeeProgressItems);

  return plan;
}

export function ensureEmployeeOnboardingChecklist(employee: OnboardingEmployeeSnapshot): EmployeeOnboardingChecklistPlan | null {
  const existing = getEmployeeOnboardingChecklistPlan(employee.id);
  if (existing) {
    return existing;
  }

  if (!shouldAutoAssignOnboarding(employee)) {
    return null;
  }

  return assignOnboardingChecklistTemplateToEmployee(employee);
}

export function getEmployeeOnboardingChecklistBundleForEmployee(employee: OnboardingEmployeeSnapshot) {
  const plan = ensureEmployeeOnboardingChecklist(employee);
  if (!plan) {
    return null;
  }

  const template = _onboardingChecklistTemplates.find(entry => entry.id === plan.template_id);
  if (!template) {
    return null;
  }

  const stages = getOnboardingChecklistStages(plan.template_id);
  const items = getOnboardingChecklistItems(plan.template_id);
  const progressItems = getEmployeeOnboardingChecklistProgressItems(plan.id);
  const progressMap = new Map(progressItems.map((item) => [item.checklist_item_id, item]));
  const nextProgressItems = items.map((item) => progressMap.get(item.id) ?? getChecklistItemFallbackProgress(plan.id, item.id));
  const stageAndProgress = getPlanStageAndProgress(plan, stages, items, nextProgressItems);

  if (
    plan.current_stage_code !== stageAndProgress.currentStageCode
    || plan.overall_progress !== stageAndProgress.overallProgress
    || plan.status !== stageAndProgress.planStatus
  ) {
    const planIndex = _onboardingEmployeePlans.findIndex(entry => entry.id === plan.id);
    if (planIndex !== -1) {
      _onboardingEmployeePlans[planIndex] = {
        ...plan,
        current_stage_code: stageAndProgress.currentStageCode,
        overall_progress: stageAndProgress.overallProgress,
        status: stageAndProgress.planStatus,
        updated_at: today(),
      };
      save(KEYS.onboardingEmployeePlans, _onboardingEmployeePlans);
    }
  }

  const refreshedPlan = getEmployeeOnboardingChecklistPlan(employee.id) ?? plan;
  const stageSummaries = stages.map((stage) => {
    const stageItems = items.filter(item => item.stage_id === stage.id);
    const doneCount = stageItems.filter((item) => {
      const progressItem = progressMap.get(item.id);
      return progressItem?.status === 'passed';
    }).length;
    const activeCount = stageItems.filter((item) => {
      const progressItem = progressMap.get(item.id);
      return progressItem?.status === 'in_progress';
    }).length;

    return {
      ...stage,
      total_items: stageItems.length,
      done_items: doneCount,
      active_items: activeCount,
      status: doneCount === stageItems.length && stageItems.length > 0
        ? 'completed'
        : activeCount > 0 || refreshedPlan.current_stage_code === stage.code
          ? 'current'
          : 'upcoming',
    };
  });

  return {
    plan: refreshedPlan,
    template,
    competency_groups: getOnboardingCompetencyGroups(),
    stages: stageSummaries,
    items: items.map((item) => ({
      ...item,
      progress: progressMap.get(item.id) ?? getChecklistItemFallbackProgress(plan.id, item.id),
    })),
    summary: {
      total_items: items.length,
      done_items: nextProgressItems.filter(item => item.status === 'passed').length,
      in_progress_items: nextProgressItems.filter(item => item.status === 'in_progress').length,
      need_more_coaching_items: nextProgressItems.filter(item => item.status === 'need_more_coaching').length,
      overall_progress: refreshedPlan.overall_progress,
      current_stage_code: refreshedPlan.current_stage_code,
    },
  };
}

export function createOnboardingStep(data: Partial<OnboardingStep>): OnboardingStep {
  const step: OnboardingStep = {
    id: `onb-${uid()}`, title: data.title || '', description: data.description || '',
    type: data.type || 'document', estimated_minutes: data.estimated_minutes || 5,
    order: _onboardingSteps.length + 1, required: data.required ?? true, status: 'active',
    content_url: data.content_url, pass_score: data.pass_score,
  };
  _onboardingSteps.push(step); save(KEYS.onboardingSteps, _onboardingSteps);
  return step;
}

export function updateOnboardingStep(id: string, data: Partial<OnboardingStep>): OnboardingStep | null {
  const idx = _onboardingSteps.findIndex(s => s.id === id);
  if (idx === -1) return null;
  _onboardingSteps[idx] = { ..._onboardingSteps[idx], ...data };
  save(KEYS.onboardingSteps, _onboardingSteps);
  return _onboardingSteps[idx];
}

export function deleteOnboardingStep(id: string): boolean {
  const idx = _onboardingSteps.findIndex(s => s.id === id);
  if (idx === -1) return false;
  _onboardingSteps.splice(idx, 1); save(KEYS.onboardingSteps, _onboardingSteps);
  return true;
}

export function getEmployeeOnboarding(empId: string): EmployeeOnboarding | null {
  return _onboardingProgress.find(o => o.employee_id === empId) || null;
}

export function startOnboarding(empId: string): EmployeeOnboarding {
  const existing = getEmployeeOnboarding(empId);
  if (existing) return existing;
  const onb: EmployeeOnboarding = {
    id: `onb-prog-${uid()}`, employee_id: empId, started_at: today(), completed_at: null, overall_progress: 0,
    steps_progress: _onboardingSteps.filter(s => s.status === 'active').map(s => ({
      step_id: s.id, status: 'pending' as const, started_at: null, completed_at: null,
    })),
  };
  _onboardingProgress.push(onb); save(KEYS.onboardingProgress, _onboardingProgress);
  return onb;
}

export function completeOnboardingStep(empId: string, stepId: string, score?: number): void {
  const onb = getEmployeeOnboarding(empId);
  if (!onb) return;
  const sp = onb.steps_progress.find(s => s.step_id === stepId);
  if (!sp) return;
  sp.status = 'completed'; sp.completed_at = today(); if (score !== undefined) sp.score = score;
  const total = onb.steps_progress.length;
  const done = onb.steps_progress.filter(s => s.status === 'completed' || s.status === 'skipped').length;
  onb.overall_progress = Math.round((done / total) * 100);
  if (onb.overall_progress === 100) onb.completed_at = today();
  save(KEYS.onboardingProgress, _onboardingProgress);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// GOALS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getEmployeeGoals(empId: string): CareerGoal[] { return _goals.filter(g => g.employee_id === empId); }
export function getActiveGoals(empId: string): CareerGoal[] { return _goals.filter(g => g.employee_id === empId && g.status === 'active'); }

export function createGoal(empId: string, data: Partial<CareerGoal>): CareerGoal {
  const goal: CareerGoal = {
    id: `goal-${uid()}`, employee_id: empId, type: data.type || 'custom',
    target_skill_id: data.target_skill_id, target_level_id: data.target_level_id,
    custom_description: data.custom_description, title: data.title || '',
    target_date: data.target_date || '', status: 'active', progress: 0, created_at: today(),
  };
  _goals.push(goal); save(KEYS.goals, _goals);
  return goal;
}

export function achieveGoal(goalId: string): CareerGoal | null {
  const g = _goals.find(x => x.id === goalId);
  if (!g) return null;
  g.status = 'achieved'; g.progress = 100; g.achieved_at = today();
  save(KEYS.goals, _goals);
  addNotification(g.employee_id, 'goal_achieved', 'ðŸŽ¯ Má»¥c tiÃªu hoÃ n thÃ nh!', `Báº¡n Ä‘Ã£ Ä‘áº¡t: ${g.title}`, '/career-path/goals');
  return g;
}

export function cancelGoal(goalId: string): CareerGoal | null {
  const g = _goals.find(x => x.id === goalId);
  if (!g) return null;
  g.status = 'cancelled'; save(KEYS.goals, _goals);
  return g;
}

function updateGoalProgressForEmployee(empId: string): void {
  const goals = getActiveGoals(empId);
  for (const g of goals) {
    if (g.type === 'skill' && g.target_skill_id) {
      const es = getSkillStatus(empId, g.target_skill_id);
      if (es?.status === 'unlocked') { achieveGoal(g.id); }
      else {
        const elig = checkSkillUnlockEligibility(empId, g.target_skill_id);
        const avgProg = elig.conditions.length > 0 ? elig.conditions.reduce((s, c) => s + c.progress, 0) / elig.conditions.length : 0;
        g.progress = Math.round(avgProg);
      }
    }
  }
  save(KEYS.goals, _goals);
}

export function getSuggestedGoals(empId: string): Partial<CareerGoal>[] {
  const skills = getEmployeeSkills(empId);
  const suggestions: Partial<CareerGoal>[] = [];
  for (const skill of _skills.filter(s => s.is_active)) {
    const es = skills.find(x => x.skill_id === skill.id);
    if (!es || es.status === 'locked' || es.status === 'in_progress') {
      const elig = checkSkillUnlockEligibility(empId, skill.id);
      const avgProg = elig.conditions.length > 0 ? elig.conditions.reduce((s, c) => s + c.progress, 0) / elig.conditions.length : 0;
      if (avgProg >= 50) {
        suggestions.push({ type: 'skill', target_skill_id: skill.id, title: `Má»Ÿ khÃ³a "${skill.name}"`, progress: Math.round(avgProg) });
      }
    }
  }
  return suggestions.sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 5);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ENDORSEMENTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getSkillEndorsements(empId: string, skillId?: string): SkillEndorsement[] {
  return _endorsements.filter(e => e.employee_id === empId && (skillId ? e.skill_id === skillId : true));
}

export function endorseSkill(empId: string, skillId: string, endorserId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string): SkillEndorsement {
  const end: SkillEndorsement = {
    id: `end-${uid()}`, employee_id: empId, skill_id: skillId, endorsed_by: endorserId,
    endorsed_at: today(), rating, comment,
  };
  _endorsements.push(end); save(KEYS.endorsements, _endorsements);
  // Update skill stats
  const es = _employeeSkills.find(x => x.employee_id === empId && x.skill_id === skillId);
  if (es) {
    const all = getSkillEndorsements(empId, skillId);
    es.endorsement_count = all.length;
    es.avg_endorsement_rating = Math.round(all.reduce((s, e) => s + e.rating, 0) / all.length * 10) / 10;
    save(KEYS.employeeSkills, _employeeSkills);
  }
  addNotification(empId, 'endorsement_received', 'Ká»¹ nÄƒng Ä‘Æ°á»£c xÃ¡c nháº­n!', `Ká»¹ nÄƒng cá»§a báº¡n Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ ${rating}â­`, '/career-path/skills');
  return end;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SKILL REFRESH
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getRefreshRecords(empId?: string): SkillRefreshRecord[] {
  return empId ? _refreshRecords.filter(r => r.employee_id === empId) : _refreshRecords;
}

export function refreshSkill(empId: string, skillId: string): SkillRefreshRecord | null {
  const rec = _refreshRecords.find(r => r.employee_id === empId && r.skill_id === skillId);
  if (!rec) return null;
  rec.last_refresh_date = today();
  const skill = getSkillById(skillId);
  const months = skill?.refresh_months || 6;
  const next = new Date(); next.setMonth(next.getMonth() + months);
  rec.next_refresh_due = next.toISOString().split('T')[0];
  rec.status = 'valid';
  save(KEYS.refreshRecords, _refreshRecords);
  return rec;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CROSS-TRAINING
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getCrossTrainingRecords(empId?: string): CrossTrainingRecord[] {
  return empId ? _crossTraining.filter(r => r.employee_id === empId) : _crossTraining;
}

export function startCrossTraining(data: Partial<CrossTrainingRecord>): CrossTrainingRecord {
  const rec: CrossTrainingRecord = {
    id: `ct-${uid()}`, employee_id: data.employee_id || '', from_store_id: data.from_store_id || '',
    to_store_id: data.to_store_id || '', skills_learned: [], started_at: today(),
    completed_at: null, trainer_id: data.trainer_id || '', notes: data.notes || '', status: 'active',
  };
  _crossTraining.push(rec); save(KEYS.crossTraining, _crossTraining);
  return rec;
}

export function completeCrossTraining(id: string, skillsLearned: string[]): CrossTrainingRecord | null {
  const rec = _crossTraining.find(r => r.id === id);
  if (!rec) return null;
  rec.completed_at = today(); rec.skills_learned = skillsLearned; rec.status = 'completed';
  save(KEYS.crossTraining, _crossTraining);
  return rec;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// NOTIFICATIONS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getNotifications(empId: string): CareerNotification[] { return _notifications.filter(n => n.employee_id === empId).sort((a, b) => b.created_at.localeCompare(a.created_at)); }
export function getUnreadCount(empId: string): number { return _notifications.filter(n => n.employee_id === empId && !n.is_read).length; }

export function addNotification(empId: string, type: CareerNotification['type'], title: string, message: string, link?: string): CareerNotification {
  const notif: CareerNotification = { id: `notif-${uid()}`, employee_id: empId, type, title, message, link, is_read: false, created_at: today() };
  _notifications.push(notif); save(KEYS.notifications, _notifications);
  return notif;
}

export function markNotificationRead(id: string): void {
  const n = _notifications.find(x => x.id === id);
  if (n) { n.is_read = true; save(KEYS.notifications, _notifications); }
}

export function markAllNotificationsRead(empId: string): void {
  _notifications.filter(n => n.employee_id === empId).forEach(n => { n.is_read = true; });
  save(KEYS.notifications, _notifications);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LEADERBOARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getLeaderboard(category: string, period: string): LeaderboardEntry[] {
  return _leaderboard.filter(l => l.category === category && l.period === period).sort((a, b) => b.score - a.score);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SETTINGS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getSettings(): CareerPathSettings { return _settings; }
export function getOnboardingRoleSettings(): OnboardingRoleSettings {
  return _settings.onboarding_role_settings;
}

export function getEnabledOnboardingRoles(): OnboardingRoleSetting[] {
  return getOnboardingRoleSettings()
    .roles
    .filter(role => role.enabled)
    .sort((left, right) => left.sort_order - right.sort_order || left.role_code.localeCompare(right.role_code));
}
export function updateSettings(data: Partial<CareerPathSettings>): CareerPathSettings {
  const before = JSON.stringify(_settings);
  _settings = normalizeSettings({ ..._settings, ...data });
  save(KEYS.settings, _settings);
  logChange('settings', 'global', 'update', before, JSON.stringify(_settings), 'Cáº­p nháº­t cÃ i Ä‘áº·t');
  return _settings;
}

export function updateOnboardingRoleSettings(
  data: Partial<OnboardingRoleSettings>,
): UpdateOnboardingRoleSettingsResult {
  const currentSettings = getOnboardingRoleSettings();
  const nextOnboardingRoleSettings = normalizeOnboardingRoleSettings({
    ...currentSettings,
    ...data,
    roles: data.roles ?? currentSettings.roles,
    updated_at: nowIso(),
    updated_by: 'current_user',
  });
  const issues = validateOnboardingRoleSettings(nextOnboardingRoleSettings);

  if (issues.length > 0) {
    return {
      success: false,
      settings: nextOnboardingRoleSettings,
      issues,
    };
  }

  const before = JSON.stringify(_settings);
  _settings = normalizeSettings({
    ..._settings,
    onboarding_role_settings: nextOnboardingRoleSettings,
  });
  save(KEYS.settings, _settings);
  logChange('settings', 'global', 'update', before, JSON.stringify(_settings), 'Cáº­p nháº­t role onboarding');

  return {
    success: true,
    settings: _settings.onboarding_role_settings,
    issues: [],
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CHANGE LOGS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function upsertOnboardingOperationsStoreOverride(input: OnboardingOpsStoreOverride): void {
  const settings = getSettings();
  const currentOnboardingOperations = settings.onboarding_operations ?? defaultOnboardingOperationsSettings;
  const currentOverrides = currentOnboardingOperations.store_overrides;
  const nextOverrides = currentOverrides.some((item) => item.store_id === input.store_id)
    ? currentOverrides.map((item) => (item.store_id === input.store_id ? input : item))
    : [...currentOverrides, input];

  updateSettings({
    onboarding_operations: {
      ...currentOnboardingOperations,
      store_overrides: nextOverrides,
    },
  });
}

export function getChangeLogs(): SettingsChangeLog[] { return _changeLogs.sort((a, b) => b.changed_at.localeCompare(a.changed_at)); }

function logChange(entityType: SettingsChangeLog['entity_type'], entityId: string, action: SettingsChangeLog['action'], before: string, after: string, description: string): void {
  const log: SettingsChangeLog = {
    id: `log-${uid()}`, entity_type: entityType, entity_id: entityId, action,
    changed_by: 'current_user', changed_at: today(), before_snapshot: before, after_snapshot: after, description,
  };
  _changeLogs.push(log); save(KEYS.changeLogs, _changeLogs);
}

export function revertChange(logId: string): boolean {
  const log = _changeLogs.find(l => l.id === logId);
  if (!log || !log.before_snapshot) return false;
  // Simplified: just log the revert
  logChange(log.entity_type, log.entity_id, 'update', log.after_snapshot, log.before_snapshot, `HoÃ n tÃ¡c: ${log.description}`);
  return true;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TEMPLATES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getTemplates(): CareerPathTemplate[] { return _templates; }

export function createTemplate(name: string, description: string, createdBy: string): CareerPathTemplate {
  const tmpl: CareerPathTemplate = {
    id: `tmpl-${uid()}`, name, description, created_at: today(), created_by: createdBy,
    data: {
      levels: [..._levels],
      skills: [..._skills],
      conditions: [..._conditions],
      employee_types: [..._employeeTypes],
      buddy_rewards: [..._buddyRewards],
      trial_checklist: [..._trialChecklist],
      onboarding_steps: [..._onboardingSteps],
      onboarding_competency_groups: [..._onboardingCompetencyGroups],
      onboarding_checklist_templates: [..._onboardingChecklistTemplates],
      onboarding_content_topics: [..._onboardingContentTopics],
      onboarding_checklist_stages: [..._onboardingChecklistStages],
      onboarding_checklist_items: [..._onboardingChecklistItems],
      onboarding_employee_plans: [..._onboardingEmployeePlans],
      onboarding_employee_progress_items: [..._onboardingEmployeeProgressItems],
    },
  };
  _templates.push(tmpl); save(KEYS.templates, _templates);
  return tmpl;
}

export function applyTemplate(templateId: string): boolean {
  const tmpl = _templates.find(t => t.id === templateId);
  if (!tmpl) return false;
  _levels = [...tmpl.data.levels]; save(KEYS.levels, _levels);
  _skills = [...tmpl.data.skills]; save(KEYS.skills, _skills);
  _conditions = [...tmpl.data.conditions]; save(KEYS.conditions, _conditions);
  return true;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ANALYTICS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getCareerAnalytics(storeId: string, period: string): CareerAnalytics | null {
  return _analytics.find(a => a.store_id === storeId && a.period === period) || null;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ACHIEVEMENTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getAchievements(): Achievement[] { return _achievements; }

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXPORT / IMPORT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function createOnboardingAuditEntry(input: {
  event_type: string;
  entity_type: OnboardingSettingsAuditEntry['entity_type'];
  entity_id: string;
  summary: string;
  changed_fields: string[];
  actor?: string;
}): OnboardingSettingsAuditEntry {
  return {
    id: `onb-audit-${uid()}`,
    event_type: input.event_type,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    summary: input.summary,
    changed_fields: [...input.changed_fields],
    actor: input.actor ?? 'current_user',
    created_at: nowIso(),
  };
}

export function getOnboardingAuditEntries(): OnboardingSettingsAuditEntry[] {
  return [..._onboardingSettingsAuditEntries].sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export function appendOnboardingAuditEntry(entry: OnboardingSettingsAuditEntry): void {
  _onboardingSettingsAuditEntries = [entry, ..._onboardingSettingsAuditEntries];
  save(KEYS.onboardingAuditEntries, _onboardingSettingsAuditEntries);
}

export function exportOnboardingSettingsBundle(): OnboardingSettingsExportEnvelope {
  return {
    schema_version: '2026-06-02',
    module: 'onboarding_settings',
    exported_at: nowIso(),
    payload: {
      role_settings: getOnboardingRoleSettings(),
      templates: getOnboardingChecklistTemplates(),
      topics: [..._onboardingContentTopics],
      stages: [..._onboardingChecklistStages],
      items: [..._onboardingChecklistItems],
    },
  };
}

export function importOnboardingSettingsBundle(bundle: OnboardingSettingsExportEnvelope): boolean {
  if (bundle.schema_version !== '2026-06-02') return false;

  const normalizedSettings = normalizeOnboardingRoleSettings(bundle.payload.role_settings);
  const issues = validateOnboardingRoleSettings(normalizedSettings);
  if (issues.length > 0) return false;

  _onboardingChecklistTemplates = [...bundle.payload.templates];
  _onboardingContentTopics = [...bundle.payload.topics];
  _onboardingChecklistStages = [...bundle.payload.stages];
  _onboardingChecklistItems = [...bundle.payload.items];
  _settings = {
    ..._settings,
    onboarding_role_settings: normalizedSettings,
  };

  save(KEYS.onboardingChecklistTemplates, _onboardingChecklistTemplates);
  save(KEYS.onboardingContentTopics, _onboardingContentTopics);
  save(KEYS.onboardingChecklistStages, _onboardingChecklistStages);
  save(KEYS.onboardingChecklistItems, _onboardingChecklistItems);
  save(KEYS.settings, _settings);

  appendOnboardingAuditEntry(createOnboardingAuditEntry({
    event_type: 'settings_import',
    entity_type: 'import_export',
    entity_id: bundle.module,
    summary: `Import onboarding settings schema ${bundle.schema_version}`,
    changed_fields: ['role_settings', 'templates', 'topics', 'stages', 'items'],
  }));

  return true;
}

export function exportSettings(): string {
  return JSON.stringify({
    levels: _levels, skills: _skills, conditions: _conditions,
    employeeTypes: _employeeTypes, buddyRewards: _buddyRewards,
    trialChecklist: _trialChecklist,
    onboardingSteps: _onboardingSteps,
    onboardingCompetencyGroups: _onboardingCompetencyGroups,
    onboardingChecklistTemplates: _onboardingChecklistTemplates,
    onboardingContentTopics: _onboardingContentTopics,
    onboardingChecklistStages: _onboardingChecklistStages,
    onboardingChecklistItems: _onboardingChecklistItems,
    onboardingEmployeePlans: _onboardingEmployeePlans,
    onboardingEmployeeProgressItems: _onboardingEmployeeProgressItems,
    settings: _settings,
  }, null, 2);
}

export function importSettings(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.levels) { _levels = data.levels; save(KEYS.levels, _levels); }
    if (data.skills) { _skills = data.skills; save(KEYS.skills, _skills); }
    if (data.conditions) { _conditions = data.conditions; save(KEYS.conditions, _conditions); }
    if (data.onboardingChecklistTemplates) { _onboardingChecklistTemplates = data.onboardingChecklistTemplates; save(KEYS.onboardingChecklistTemplates, _onboardingChecklistTemplates); }
    if (data.onboardingContentTopics) { _onboardingContentTopics = data.onboardingContentTopics; save(KEYS.onboardingContentTopics, _onboardingContentTopics); }
    if (data.onboardingChecklistStages) { _onboardingChecklistStages = data.onboardingChecklistStages; save(KEYS.onboardingChecklistStages, _onboardingChecklistStages); }
    if (data.onboardingChecklistItems) { _onboardingChecklistItems = data.onboardingChecklistItems; save(KEYS.onboardingChecklistItems, _onboardingChecklistItems); }
    if (data.settings) {
      const normalizedSettings = normalizeSettings(data.settings);
      const issues = validateOnboardingRoleSettings(normalizedSettings.onboarding_role_settings);
      if (issues.length > 0) {
        return false;
      }
      _settings = normalizedSettings;
      save(KEYS.settings, _settings);
    }
    return true;
  } catch { return false; }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CAREER PROGRESS (COMPUTED)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getEmployeeCareerProgress(empId: string, currentLevelId: string): EmployeeCareerProgress {
  const currentLevel = getLevelById(currentLevelId) || getActiveLevels()[0];
  const activeLvls = getActiveLevels();
  const currentIdx = activeLvls.findIndex(l => l.id === currentLevelId);
  const nextLevel = currentIdx >= 0 && currentIdx < activeLvls.length - 1 ? activeLvls[currentIdx + 1] : null;

  const skills = getEmployeeSkills(empId);
  const unlocked = skills.filter(s => s.status === 'unlocked').length;
  const total = _skills.filter(s => s.is_active).length;

  let promoProgress: PromotionConditionProgress[] = [];
  let promoPercent = 0;
  if (nextLevel) {
    promoProgress = checkPromotionEligibility(empId, currentLevelId, nextLevel.id);
    promoPercent = promoProgress.length > 0 ? Math.round(promoProgress.reduce((s, c) => s + c.progress_percent, 0) / promoProgress.length) : 0;
  }

  return {
    employee_id: empId,
    current_level: currentLevel,
    current_skill_level: getEmployeeSkillLevel(empId),
    skills_unlocked: unlocked,
    skills_total: total,
    skills_progress_percent: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    next_level: nextLevel,
    promotion_progress_percent: promoPercent,
    promotion_conditions: promoProgress,
    estimated_promotion_date: null,
    months_at_current_level: 4, // mock
    active_goals: getActiveGoals(empId),
    buddy_status: _buddyAssignments.find(b => (b.mentor_id === empId || b.mentee_id === empId) && b.status === 'active') || null,
    onboarding_status: getEmployeeOnboarding(empId),
    recent_achievements: _achievements.slice(0, 3),
    smart_suggestions: getSmartSuggestions(empId),
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REPORTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getCareerPathReport(storeId: string, period: string): CareerPathReport {
  const analytics = getCareerAnalytics(storeId, period) || sampleAnalytics;
  const warnings: CareerWarning[] = [
    { type: 'trial_expiring', employee_id: 'emp-003', employee_name: 'Lan', message: 'Thá»­ viá»‡c cÃ²n 4 ngÃ y', severity: 'high', action_link: '/career-path/trial' },
    { type: 'no_progress', employee_id: 'emp-006', employee_name: 'Tuáº¥n', message: '3 thÃ¡ng chÆ°a má»Ÿ skill má»›i', severity: 'medium', action_link: '/career-path/reports' },
  ];
  return {
    store_id: storeId, period, generated_at: today(),
    summary: {
      total_employees: 8, pending_promotions: 1, pending_type_changes: 1, active_trials: 1, avg_skill_level: 1.8,
      by_level: [
        { level_id: 'level-trial', level_name: 'Thá»­ viá»‡c', count: 2 },
        { level_id: 'level-staff', level_name: 'NhÃ¢n viÃªn', count: 5 },
        { level_id: 'level-manager', level_name: 'Quáº£n lÃ½', count: 1 },
      ],
      by_type: [{ type: 'full_time', count: 6 }, { type: 'part_time', count: 2 }],
    },
    upcoming_promotions: [
      { employee_id: 'emp-004', employee_name: 'Nam', to_level: 'Trá»£ lÃ½ QL', progress_percent: 75, estimated_date: '2026-04-15' },
      { employee_id: 'emp-001', employee_name: 'Minh', to_level: 'Trá»£ lÃ½ QL', progress_percent: 42, estimated_date: '2026-08-01' },
    ],
    warnings,
    analytics,
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SMART SUGGESTIONS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function getSmartSuggestions(empId: string): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  // Check near-unlockable skills
  for (const skill of _skills.filter(s => s.is_active)) {
    const es = _employeeSkills.find(x => x.employee_id === empId && x.skill_id === skill.id);
    if (!es || es.status !== 'unlocked') {
      const elig = checkSkillUnlockEligibility(empId, skill.id);
      const avgProg = elig.conditions.length > 0 ? elig.conditions.reduce((s, c) => s + c.progress, 0) / elig.conditions.length : 0;
      if (avgProg >= 70) {
        suggestions.push({
          id: `sug-${skill.id}`, type: 'skill_unlock', priority: avgProg >= 90 ? 'high' : 'medium',
          title: `Sáº¯p má»Ÿ Ä‘Æ°á»£c "${skill.name}"!`, description: `Báº¡n Ä‘Ã£ Ä‘áº¡t ${Math.round(avgProg)}% Ä‘iá»u kiá»‡n`,
          action_label: 'Xem Ä‘iá»u kiá»‡n', action_link: '/career-path/skills',
        });
      }
    }
  }
  // Check buddy suggestion
  const buddyCount = _buddyAssignments.filter(b => b.mentor_id === empId && b.status === 'active').length;
  if (buddyCount === 0 && countUnlockedSkills(empId) >= 4) {
    suggestions.push({
      id: 'sug-buddy', type: 'buddy', priority: 'low',
      title: 'Trá»Ÿ thÃ nh Mentor!', description: 'HÆ°á»›ng dáº«n NV má»›i Ä‘á»ƒ nháº­n pháº§n thÆ°á»Ÿng',
      action_label: 'TÃ¬m hiá»ƒu', action_link: '/career-path',
    });
  }
  return suggestions.sort((a, b) => { const p = { high: 0, medium: 1, low: 2 }; return p[a.priority] - p[b.priority]; });
}







