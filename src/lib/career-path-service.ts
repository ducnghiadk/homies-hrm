// ============================================================
// CAREER PATH MODULE — Core Service
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
} from './career-path-types';

import {
  defaultCareerLevels, defaultSkills, defaultSkillLevels, defaultEmployeeTypes,
  defaultPromotionConditions, defaultBuddyRewards, defaultTrialChecklist,
  defaultOnboardingSteps, defaultSettings,
  sampleEmployeeSkills, sampleBuddyAssignments, samplePromotionRequests,
  sampleTypeChangeRequests, sampleTrialEvaluations, sampleGoals,
  sampleEndorsements, sampleEmployeeOnboarding, sampleNotifications,
  sampleLeaderboard, sampleChangeLogs, sampleTemplate, sampleAnalytics,
  sampleAchievements, sampleRefreshRecords, sampleCrossTraining,
} from './mock-data-career-path';

// ─── Storage Keys ────────────────────────────────────────────

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

// ─── localStorage helpers ────────────────────────────────────

const defaultOnboardingOperationsSettings: OnboardingOpsSettings = {
  enabled: true,
  lookahead_days: 7,
  rules: [
    { key: 'first_shift', label: 'Ca dau va gio co mat', severity: 'attention', store_override_allowed: true },
    { key: 'buddy', label: 'Nguoi kem / nguoi huong dan', severity: 'block', store_override_allowed: true },
    { key: 'uniform_attendance_policy', label: 'Dong phuc, cham cong, noi quy tai quan', severity: 'attention', store_override_allowed: true },
    { key: 'tools_and_group', label: 'Tai khoan, nhom chat, cong cu', severity: 'attention', store_override_allowed: true },
    { key: 'first_shift_result', label: 'Xac nhan xong ca dau on', severity: 'attention', store_override_allowed: false },
  ],
  store_overrides: [],
};

function normalizeSettings(saved: CareerPathSettings): CareerPathSettings {
  return {
    ...defaultSettings,
    ...saved,
    onboarding_operations: {
      ...defaultOnboardingOperationsSettings,
      ...saved.onboarding_operations,
      rules: saved.onboarding_operations?.rules ?? defaultOnboardingOperationsSettings.rules,
      store_overrides: saved.onboarding_operations?.store_overrides ?? defaultOnboardingOperationsSettings.store_overrides,
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

// ─── Store Accessors ─────────────────────────────────────────

let _levels: CareerLevel[] = [];
let _skills: Skill[] = [];
let _employeeSkills: EmployeeSkill[] = [];
let _employeeTypes: EmployeeTypeConfig[] = [];
let _skillLevels: SkillLevelConfig[] = [];
let _conditions: PromotionCondition[] = [];
let _buddyRewards: BuddyRewardConfig[] = [];
let _trialChecklist: TrialChecklistItem[] = [];
let _onboardingSteps: OnboardingStep[] = [];
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

// ─── Init / Reset ────────────────────────────────────────────

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

// ═══════════════════════════════════════════════════════════════
// LEVELS CRUD
// ═══════════════════════════════════════════════════════════════

export function getLevels(): CareerLevel[] { return _levels; }
export function getActiveLevels(): CareerLevel[] { return _levels.filter(l => l.is_active).sort((a, b) => a.order - b.order); }
export function getLevelById(id: string): CareerLevel | undefined { return _levels.find(l => l.id === id); }

export function createLevel(data: Partial<CareerLevel>): CareerLevel {
  const level: CareerLevel = {
    id: `level-${uid()}`, name: data.name || '', icon: data.icon || '📌', order: _levels.length,
    description: data.description || '', color: data.color || '#607D8B', is_active: true,
    min_skills_required: data.min_skills_required || 0, min_months: data.min_months || 0,
    benefits: data.benefits || [], created_at: today(), updated_at: today(),
  };
  _levels.push(level); save(KEYS.levels, _levels);
  logChange('level', level.id, 'create', '', JSON.stringify(level), `Tạo cấp bậc: ${level.name}`);
  return level;
}

export function updateLevel(id: string, data: Partial<CareerLevel>): CareerLevel | null {
  const idx = _levels.findIndex(l => l.id === id);
  if (idx === -1) return null;
  const before = JSON.stringify(_levels[idx]);
  _levels[idx] = { ..._levels[idx], ...data, updated_at: today() };
  save(KEYS.levels, _levels);
  logChange('level', id, 'update', before, JSON.stringify(_levels[idx]), `Cập nhật cấp bậc: ${_levels[idx].name}`);
  return _levels[idx];
}

export function toggleLevel(id: string): CareerLevel | null {
  const level = _levels.find(l => l.id === id);
  if (!level) return null;
  const before = JSON.stringify({ is_active: level.is_active });
  level.is_active = !level.is_active;
  level.updated_at = today();
  save(KEYS.levels, _levels);
  logChange('level', id, 'toggle', before, JSON.stringify({ is_active: level.is_active }), `${level.is_active ? 'Bật' : 'Tắt'} cấp bậc: ${level.name}`);
  return level;
}

export function reorderLevels(ids: string[]): void {
  ids.forEach((id, i) => { const l = _levels.find(x => x.id === id); if (l) l.order = i; });
  save(KEYS.levels, _levels);
}

// ═══════════════════════════════════════════════════════════════
// SKILLS CRUD
// ═══════════════════════════════════════════════════════════════

export function getSkills(): Skill[] { return _skills; }
export function getSkillsByCategory(cat: string): Skill[] { return _skills.filter(s => s.category === cat && s.is_active); }
export function getSkillById(id: string): Skill | undefined { return _skills.find(s => s.id === id); }

export function createSkill(data: Partial<Skill>): Skill {
  const skill: Skill = {
    id: `skill-${uid()}`, name: data.name || '', icon: data.icon || '📌', category: data.category || 'basic',
    description: data.description || '', unlock_conditions: data.unlock_conditions || [],
    is_active: true, requires_approval: data.requires_approval || false,
    order: _skills.length + 1, created_at: today(), updated_at: today(),
  };
  _skills.push(skill); save(KEYS.skills, _skills);
  logChange('skill', skill.id, 'create', '', JSON.stringify(skill), `Tạo kỹ năng: ${skill.name}`);
  return skill;
}

export function updateSkill(id: string, data: Partial<Skill>): Skill | null {
  const idx = _skills.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const before = JSON.stringify(_skills[idx]);
  _skills[idx] = { ..._skills[idx], ...data, updated_at: today() };
  save(KEYS.skills, _skills);
  logChange('skill', id, 'update', before, JSON.stringify(_skills[idx]), `Cập nhật kỹ năng: ${_skills[idx].name}`);
  return _skills[idx];
}

export function deleteSkill(id: string): boolean {
  const idx = _skills.findIndex(s => s.id === id);
  if (idx === -1) return false;
  const before = JSON.stringify(_skills[idx]);
  _skills.splice(idx, 1);
  save(KEYS.skills, _skills);
  logChange('skill', id, 'delete', before, '', `Xóa kỹ năng`);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// EMPLOYEE SKILLS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// EMPLOYEE TYPE CONFIG
// ═══════════════════════════════════════════════════════════════

export function getEmployeeTypes(): EmployeeTypeConfig[] { return _employeeTypes; }
export function getEmployeeTypeConfig(type: string): EmployeeTypeConfig | undefined { return _employeeTypes.find(et => et.type === type); }
export function updateEmployeeTypeConfig(id: string, data: Partial<EmployeeTypeConfig>): EmployeeTypeConfig | null {
  const idx = _employeeTypes.findIndex(et => et.id === id);
  if (idx === -1) return null;
  const before = JSON.stringify(_employeeTypes[idx]);
  _employeeTypes[idx] = { ..._employeeTypes[idx], ...data };
  save(KEYS.employeeTypes, _employeeTypes);
  logChange('employee_type', id, 'update', before, JSON.stringify(_employeeTypes[idx]), 'Cập nhật loại NV');
  return _employeeTypes[idx];
}

// ═══════════════════════════════════════════════════════════════
// SKILL LEVELS
// ═══════════════════════════════════════════════════════════════

export function getSkillLevels(): SkillLevelConfig[] { return _skillLevels; }

// ═══════════════════════════════════════════════════════════════
// PROMOTION CONDITIONS
// ═══════════════════════════════════════════════════════════════

export function getPromotionConditions(): PromotionCondition[] { return _conditions; }
export function getConditionsForTransition(fromId: string, toId: string): PromotionCondition | undefined { return _conditions.find(c => c.from_level_id === fromId && c.to_level_id === toId); }

export function createPromotionCondition(data: Partial<PromotionCondition>): PromotionCondition {
  const cond: PromotionCondition = {
    id: `promo-${uid()}`, from_level_id: data.from_level_id || '', to_level_id: data.to_level_id || '',
    conditions: data.conditions || [], is_active: true, created_at: today(),
  };
  _conditions.push(cond); save(KEYS.conditions, _conditions);
  logChange('condition', cond.id, 'create', '', JSON.stringify(cond), 'Tạo điều kiện thăng tiến');
  return cond;
}

export function updatePromotionCondition(id: string, data: Partial<PromotionCondition>): PromotionCondition | null {
  const idx = _conditions.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const before = JSON.stringify(_conditions[idx]);
  _conditions[idx] = { ..._conditions[idx], ...data };
  save(KEYS.conditions, _conditions);
  logChange('condition', id, 'update', before, JSON.stringify(_conditions[idx]), 'Cập nhật điều kiện');
  return _conditions[idx];
}

// ═══════════════════════════════════════════════════════════════
// PROMOTION REQUESTS
// ═══════════════════════════════════════════════════════════════

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
    addNotification(req.employee_id, 'promotion_approved', 'Chúc mừng thăng tiến!', `Yêu cầu thăng tiến đã được duyệt.`, '/career-path');
  } else {
    addNotification(req.employee_id, 'promotion_rejected', 'Yêu cầu bị từ chối', note || 'Yêu cầu thăng tiến chưa được duyệt.', '/career-path/promotion');
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

// ═══════════════════════════════════════════════════════════════
// TYPE CHANGE REQUESTS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// BUDDY SYSTEM
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// TRIAL EVALUATION
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════════

export function getOnboardingSteps(): OnboardingStep[] { return _onboardingSteps.sort((a, b) => a.order - b.order); }

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

// ═══════════════════════════════════════════════════════════════
// GOALS
// ═══════════════════════════════════════════════════════════════

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
  addNotification(g.employee_id, 'goal_achieved', '🎯 Mục tiêu hoàn thành!', `Bạn đã đạt: ${g.title}`, '/career-path/goals');
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
        suggestions.push({ type: 'skill', target_skill_id: skill.id, title: `Mở khóa "${skill.name}"`, progress: Math.round(avgProg) });
      }
    }
  }
  return suggestions.sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 5);
}

// ═══════════════════════════════════════════════════════════════
// ENDORSEMENTS
// ═══════════════════════════════════════════════════════════════

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
  addNotification(empId, 'endorsement_received', 'Kỹ năng được xác nhận!', `Kỹ năng của bạn được đánh giá ${rating}⭐`, '/career-path/skills');
  return end;
}

// ═══════════════════════════════════════════════════════════════
// SKILL REFRESH
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// CROSS-TRAINING
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════

export function getLeaderboard(category: string, period: string): LeaderboardEntry[] {
  return _leaderboard.filter(l => l.category === category && l.period === period).sort((a, b) => b.score - a.score);
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

export function getSettings(): CareerPathSettings { return _settings; }
export function updateSettings(data: Partial<CareerPathSettings>): CareerPathSettings {
  const before = JSON.stringify(_settings);
  _settings = normalizeSettings({ ..._settings, ...data });
  save(KEYS.settings, _settings);
  logChange('settings', 'global', 'update', before, JSON.stringify(_settings), 'Cập nhật cài đặt');
  return _settings;
}

// ═══════════════════════════════════════════════════════════════
// CHANGE LOGS
// ═══════════════════════════════════════════════════════════════

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
  logChange(log.entity_type, log.entity_id, 'update', log.after_snapshot, log.before_snapshot, `Hoàn tác: ${log.description}`);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════

export function getTemplates(): CareerPathTemplate[] { return _templates; }

export function createTemplate(name: string, description: string, createdBy: string): CareerPathTemplate {
  const tmpl: CareerPathTemplate = {
    id: `tmpl-${uid()}`, name, description, created_at: today(), created_by: createdBy,
    data: { levels: [..._levels], skills: [..._skills], conditions: [..._conditions], employee_types: [..._employeeTypes], buddy_rewards: [..._buddyRewards], trial_checklist: [..._trialChecklist], onboarding_steps: [..._onboardingSteps] },
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

// ═══════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════

export function getCareerAnalytics(storeId: string, period: string): CareerAnalytics | null {
  return _analytics.find(a => a.store_id === storeId && a.period === period) || null;
}

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════

export function getAchievements(): Achievement[] { return _achievements; }

// ═══════════════════════════════════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════════════════════════════════

export function exportSettings(): string {
  return JSON.stringify({
    levels: _levels, skills: _skills, conditions: _conditions,
    employeeTypes: _employeeTypes, buddyRewards: _buddyRewards,
    trialChecklist: _trialChecklist, onboardingSteps: _onboardingSteps,
    settings: _settings,
  }, null, 2);
}

export function importSettings(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.levels) { _levels = data.levels; save(KEYS.levels, _levels); }
    if (data.skills) { _skills = data.skills; save(KEYS.skills, _skills); }
    if (data.conditions) { _conditions = data.conditions; save(KEYS.conditions, _conditions); }
    if (data.settings) { _settings = data.settings; save(KEYS.settings, _settings); }
    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════
// CAREER PROGRESS (COMPUTED)
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════

export function getCareerPathReport(storeId: string, period: string): CareerPathReport {
  const analytics = getCareerAnalytics(storeId, period) || sampleAnalytics;
  const warnings: CareerWarning[] = [
    { type: 'trial_expiring', employee_id: 'emp-003', employee_name: 'Lan', message: 'Thử việc còn 4 ngày', severity: 'high', action_link: '/career-path/trial' },
    { type: 'no_progress', employee_id: 'emp-006', employee_name: 'Tuấn', message: '3 tháng chưa mở skill mới', severity: 'medium', action_link: '/career-path/reports' },
  ];
  return {
    store_id: storeId, period, generated_at: today(),
    summary: {
      total_employees: 8, pending_promotions: 1, pending_type_changes: 1, active_trials: 1, avg_skill_level: 1.8,
      by_level: [
        { level_id: 'level-trial', level_name: 'Thử việc', count: 2 },
        { level_id: 'level-staff', level_name: 'Nhân viên', count: 5 },
        { level_id: 'level-manager', level_name: 'Quản lý', count: 1 },
      ],
      by_type: [{ type: 'full_time', count: 6 }, { type: 'part_time', count: 2 }],
    },
    upcoming_promotions: [
      { employee_id: 'emp-004', employee_name: 'Nam', to_level: 'Trợ lý QL', progress_percent: 75, estimated_date: '2026-04-15' },
      { employee_id: 'emp-001', employee_name: 'Minh', to_level: 'Trợ lý QL', progress_percent: 42, estimated_date: '2026-08-01' },
    ],
    warnings,
    analytics,
  };
}

// ═══════════════════════════════════════════════════════════════
// SMART SUGGESTIONS
// ═══════════════════════════════════════════════════════════════

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
          title: `Sắp mở được "${skill.name}"!`, description: `Bạn đã đạt ${Math.round(avgProg)}% điều kiện`,
          action_label: 'Xem điều kiện', action_link: '/career-path/skills',
        });
      }
    }
  }
  // Check buddy suggestion
  const buddyCount = _buddyAssignments.filter(b => b.mentor_id === empId && b.status === 'active').length;
  if (buddyCount === 0 && countUnlockedSkills(empId) >= 4) {
    suggestions.push({
      id: 'sug-buddy', type: 'buddy', priority: 'low',
      title: 'Trở thành Mentor!', description: 'Hướng dẫn NV mới để nhận phần thưởng',
      action_label: 'Tìm hiểu', action_link: '/career-path',
    });
  }
  return suggestions.sort((a, b) => { const p = { high: 0, medium: 1, low: 2 }; return p[a.priority] - p[b.priority]; });
}
