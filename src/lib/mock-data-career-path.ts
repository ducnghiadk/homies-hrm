// ============================================================
// CAREER PATH MODULE â€” Mock Data
// Genesis v3 | T1.1.2
// ============================================================

import type {
  CareerLevel, Skill, SkillLevelConfig, EmployeeTypeConfig,
  PromotionCondition, BuddyRewardConfig, TrialChecklistItem,
  OnboardingStep, EmployeeSkill, BuddyAssignment, TrialEvaluation,
  PromotionRequest, TypeChangeRequest, CareerGoal, SkillEndorsement,
  SkillRefreshRecord, CrossTrainingRecord, CareerNotification,
  SettingsChangeLog, CareerPathTemplate, CareerPathSettings,
  LeaderboardEntry, CareerAnalytics, Achievement,
  OnboardingCompetencyGroup, OnboardingContentTopic, OnboardingChecklistTemplate,
  OnboardingChecklistStage, OnboardingChecklistItemTemplate,
  EmployeeOnboardingChecklistPlan, EmployeeOnboardingChecklistProgressItem,
  OnboardingMiniQuizTemplate, OnboardingRoleSettings,
} from './career-path-types';

// â”€â”€â”€ Default Levels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const defaultCareerLevels: CareerLevel[] = [
  {
    id: 'level-trial', name: 'Thá»­ viá»‡c', icon: 'ðŸŒ±', order: 0,
    description: 'NhÃ¢n viÃªn má»›i, Ä‘ang trong giai Ä‘oáº¡n thá»­ viá»‡c',
    color: '#8BC34A', is_active: true, min_skills_required: 0, min_months: 0,
    benefits: ['ÄÆ°á»£c hÆ°á»›ng dáº«n bá»Ÿi Buddy', 'Lá»™ trÃ¬nh onboarding rÃµ rÃ ng'],
    created_at: '2026-01-01', updated_at: '2026-01-01',
  },
  {
    id: 'level-staff', name: 'NhÃ¢n viÃªn', icon: 'â˜•', order: 1,
    description: 'NhÃ¢n viÃªn chÃ­nh thá»©c, cÃ³ thá»ƒ lÃ m ca Ä‘á»™c láº­p',
    color: '#2196F3', is_active: true, min_skills_required: 2, min_months: 1,
    benefits: ['Má»Ÿ khÃ³a ká»¹ nÄƒng nÃ¢ng cao', 'Tham gia Leaderboard', 'Äáº·t má»¥c tiÃªu cÃ¡ nhÃ¢n'],
    created_at: '2026-01-01', updated_at: '2026-01-01',
  },
  {
    id: 'level-leader', name: 'Trá»£ lÃ½ Quáº£n lÃ½', icon: 'â­', order: 2,
    description: 'Há»— trá»£ quáº£n lÃ½, cÃ³ thá»ƒ training nhÃ¢n viÃªn má»›i',
    color: '#FF9800', is_active: false, min_skills_required: 5, min_months: 4,
    benefits: ['ÄÆ°á»£c lÃ m Buddy/Mentor', 'Æ¯u tiÃªn chá»n ca', 'Ká»¹ nÄƒng quáº£n lÃ½'],
    created_at: '2026-01-01', updated_at: '2026-01-01',
  },
  {
    id: 'level-manager', name: 'Quáº£n lÃ½', icon: 'ðŸ‘”', order: 3,
    description: 'Quáº£n lÃ½ chi nhÃ¡nh, toÃ n quyá»n váº­n hÃ nh',
    color: '#9C27B0', is_active: true, min_skills_required: 8, min_months: 6,
    benefits: ['Quáº£n lÃ½ chi nhÃ¡nh', 'Duyá»‡t thÄƒng tiáº¿n', 'Truy cáº­p bÃ¡o cÃ¡o'],
    created_at: '2026-01-01', updated_at: '2026-01-01',
  },
];

// â”€â”€â”€ Default Skills (18) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const defaultSkills: Skill[] = [
  // === BASIC (4) ===
  { id: 'skill-brewing', name: 'Pha cháº¿ cÆ¡ báº£n', icon: 'â˜•', category: 'basic', description: 'Pha cháº¿ cÃ¡c loáº¡i trÃ  sá»¯a theo menu',
    unlock_conditions: [{ type: 'months_worked', value: 0, label: 'Ngay khi vÃ o' }],
    is_active: true, requires_approval: false, order: 1, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-cashier', name: 'Thu ngân', icon: '💰', category: 'basic', description: 'Sử dụng POS, tính tiền, xử lý thanh toán',
    unlock_conditions: [{ type: 'months_worked', value: 0, label: 'Ngay khi vÃ o' }],
    is_active: true, requires_approval: false, order: 2, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-open', name: 'Má»Ÿ ca', icon: 'ðŸ”“', category: 'basic', description: 'Quy trÃ¬nh má»Ÿ quÃ¡n: kiá»ƒm tra, setup, chuáº©n bá»‹',
    unlock_conditions: [{ type: 'months_worked', value: 1, label: 'â‰¥ 1 thÃ¡ng' }, { type: 'kpi_min', value: 70, label: 'KPI â‰¥ 70%' }],
    is_active: true, requires_approval: false, order: 3, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-close', name: 'ÄÃ³ng ca', icon: 'ðŸ”’', category: 'basic', description: 'Quy trÃ¬nh Ä‘Ã³ng quÃ¡n: vá»‡ sinh, kiá»ƒm kÃª, ná»™p tiá»n',
    unlock_conditions: [{ type: 'months_worked', value: 1, label: 'â‰¥ 1 thÃ¡ng' }, { type: 'kpi_min', value: 70, label: 'KPI â‰¥ 70%' }],
    is_active: true, requires_approval: false, order: 4, created_at: '2026-01-01', updated_at: '2026-01-01' },
  // === ADVANCED (8) ===
  { id: 'skill-inventory', name: 'Nháº­p hÃ ng', icon: 'ðŸ“¦', category: 'advanced', description: 'Kiá»ƒm tra, nháº­n, phÃ¢n loáº¡i nguyÃªn liá»‡u Ä‘áº§u vÃ o',
    unlock_conditions: [{ type: 'months_worked', value: 3, label: 'â‰¥ 3 thÃ¡ng' }, { type: 'kpi_min', value: 80, label: 'KPI â‰¥ 80%' }, { type: 'approval', value: 'manager', label: 'Leader phÃª duyá»‡t' }],
    is_active: true, requires_approval: true, order: 5, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-quality', name: 'Kiá»ƒm soÃ¡t CL', icon: 'âœ…', category: 'advanced', description: 'Kiá»ƒm tra cháº¥t lÆ°á»£ng Ä‘á»“ uá»‘ng, nguyÃªn liá»‡u',
    unlock_conditions: [{ type: 'months_worked', value: 2, label: 'â‰¥ 2 thÃ¡ng' }, { type: 'skills_required', value: ['skill-brewing'], label: 'CÃ³ Pha cháº¿ cÆ¡ báº£n' }],
    is_active: true, requires_approval: false, order: 6, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-hygiene', name: 'Vá»‡ sinh ATTP', icon: 'ðŸ§¹', category: 'advanced', description: 'An toÃ n thá»±c pháº©m, vá»‡ sinh chuáº©n HACCP',
    unlock_conditions: [{ type: 'months_worked', value: 2, label: 'â‰¥ 2 thÃ¡ng' }],
    is_active: true, requires_approval: false, order: 7, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-customer', name: 'Xá»­ lÃ½ khiáº¿u náº¡i', icon: 'ðŸ¤', category: 'advanced', description: 'Giáº£i quyáº¿t phÃ n nÃ n, hoÃ n tiá»n, xá»­ lÃ½ tÃ¬nh huá»‘ng',
    unlock_conditions: [{ type: 'months_worked', value: 3, label: 'â‰¥ 3 thÃ¡ng' }, { type: 'kpi_min', value: 75, label: 'KPI â‰¥ 75%' }],
    is_active: true, requires_approval: false, order: 8, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-equipment', name: 'Báº£o trÃ¬ thiáº¿t bá»‹', icon: 'ðŸ”§', category: 'advanced', description: 'Váº­n hÃ nh, vá»‡ sinh, báº£o trÃ¬ mÃ¡y pha',
    unlock_conditions: [{ type: 'months_worked', value: 3, label: 'â‰¥ 3 thÃ¡ng' }],
    is_active: true, requires_approval: false, order: 9, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-menu-dev', name: 'PhÃ¡t triá»ƒn menu', icon: 'ðŸ“', category: 'advanced', description: 'Äá» xuáº¥t, thá»­ nghiá»‡m, cáº£i tiáº¿n cÃ´ng thá»©c',
    unlock_conditions: [{ type: 'months_worked', value: 4, label: 'â‰¥ 4 thÃ¡ng' }, { type: 'skills_required', value: ['skill-brewing', 'skill-quality'], label: 'CÃ³ Pha cháº¿ + Kiá»ƒm soÃ¡t CL' }],
    is_active: true, requires_approval: true, order: 10, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-social', name: 'Marketing cá»­a hÃ ng', icon: 'ðŸ“±', category: 'advanced', description: 'Chá»¥p áº£nh, Ä‘Äƒng social media, tÆ°Æ¡ng tÃ¡c KH online',
    unlock_conditions: [{ type: 'months_worked', value: 2, label: 'â‰¥ 2 thÃ¡ng' }],
    is_active: true, requires_approval: false, order: 11, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-delivery', name: 'Quáº£n lÃ½ Ä‘Æ¡n online', icon: 'ðŸ›µ', category: 'advanced', description: 'GrabFood, ShopeeFood, BeFood, xá»­ lÃ½ Ä‘Æ¡n',
    unlock_conditions: [{ type: 'months_worked', value: 1, label: '≥ 1 tháng' }, { type: 'skills_required', value: ['skill-cashier'], label: 'Có Thu ngân' }],
    is_active: true, requires_approval: false, order: 12, created_at: '2026-01-01', updated_at: '2026-01-01' },
  // === MANAGEMENT (6) ===
  { id: 'skill-training', name: 'Training cÆ¡ báº£n', icon: 'ðŸŽ“', category: 'management', description: 'HÆ°á»›ng dáº«n NV má»›i cÃ¡c ká»¹ nÄƒng cÆ¡ báº£n',
    unlock_conditions: [{ type: 'months_worked', value: 4, label: 'â‰¥ 4 thÃ¡ng' }, { type: 'skills_required', value: ['skill-open', 'skill-close'], label: 'CÃ³ Má»Ÿ ca + ÄÃ³ng ca' }, { type: 'kpi_min', value: 85, label: 'KPI â‰¥ 85%' }],
    is_active: true, requires_approval: true, order: 13, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-scheduling', name: 'Xáº¿p lá»‹ch', icon: 'ðŸ“…', category: 'management', description: 'LÃªn lá»‹ch ca, phÃ¢n cÃ´ng nhÃ¢n viÃªn',
    unlock_conditions: [{ type: 'level_required', value: 'level-leader', label: 'Cáº¥p Trá»£ lÃ½ QL' }],
    is_active: true, requires_approval: true, order: 14, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-reporting', name: 'BÃ¡o cÃ¡o', icon: 'ðŸ“Š', category: 'management', description: 'Tá»•ng há»£p doanh thu, tá»“n kho, hiá»‡u suáº¥t',
    unlock_conditions: [{ type: 'level_required', value: 'level-leader', label: 'Cáº¥p Trá»£ lÃ½ QL' }],
    is_active: true, requires_approval: true, order: 15, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-hr', name: 'Quáº£n lÃ½ nhÃ¢n sá»±', icon: 'ðŸ‘¥', category: 'management', description: 'Tuyá»ƒn dá»¥ng, Ä‘Ã¡nh giÃ¡, ká»· luáº­t nhÃ¢n viÃªn',
    unlock_conditions: [{ type: 'level_required', value: 'level-manager', label: 'Cáº¥p Quáº£n lÃ½' }],
    is_active: true, requires_approval: true, order: 16, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-finance', name: 'Quáº£n lÃ½ tÃ i chÃ­nh', icon: 'ðŸ’µ', category: 'management', description: 'Chi phÃ­, lá»£i nhuáº­n, ngÃ¢n sÃ¡ch chi nhÃ¡nh',
    unlock_conditions: [{ type: 'level_required', value: 'level-manager', label: 'Cáº¥p Quáº£n lÃ½' }],
    is_active: true, requires_approval: true, order: 17, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-expansion', name: 'Má»Ÿ rá»™ng chi nhÃ¡nh', icon: 'ðŸª', category: 'management', description: 'Kháº£o sÃ¡t, setup, váº­n hÃ nh chi nhÃ¡nh má»›i',
    unlock_conditions: [{ type: 'level_required', value: 'level-manager', label: 'Cáº¥p Quáº£n lÃ½' }, { type: 'months_worked', value: 12, label: 'â‰¥ 12 thÃ¡ng' }],
    is_active: true, requires_approval: true, order: 18, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

// â”€â”€â”€ Skill Level Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const defaultSkillLevels: SkillLevelConfig[] = [
  { level: 1, label: 'CÆ¡ báº£n', icon: 'â­', min_advanced_skills: 0, color: '#8BC34A', description: '0-2 ká»¹ nÄƒng nÃ¢ng cao' },
  { level: 2, label: 'ThÃ nh tháº¡o', icon: 'â­â­', min_advanced_skills: 3, color: '#FF9800', description: '3-5 ká»¹ nÄƒng nÃ¢ng cao' },
  { level: 3, label: 'ChuyÃªn gia', icon: 'â­â­â­', min_advanced_skills: 6, color: '#E91E63', description: '6+ ká»¹ nÄƒng nÃ¢ng cao' },
];

// â”€â”€â”€ Employee Type Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const defaultEmployeeTypes: EmployeeTypeConfig[] = [
  { id: 'etype-ft', type: 'full_time', label: 'ToÃ n thá»i gian', max_skill_level: 3, max_career_level_order: 3,
    can_be_buddy: true, description: 'KhÃ´ng giá»›i háº¡n thÄƒng tiáº¿n', restrictions: [] },
  { id: 'etype-pt', type: 'part_time', label: 'BÃ¡n thá»i gian', max_skill_level: 2, max_career_level_order: 1,
    can_be_buddy: false, description: 'Giá»›i háº¡n Skill Level 2, tá»‘i Ä‘a NhÃ¢n viÃªn', restrictions: ['KhÃ´ng thá»ƒ lÃ m Buddy', 'KhÃ´ng thá»ƒ lÃªn Trá»£ lÃ½ QL+', 'Tá»‘i Ä‘a Skill Level 2'] },
];

// â”€â”€â”€ Promotion Conditions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const defaultPromotionConditions: PromotionCondition[] = [
  {
    id: 'promo-trial-staff', from_level_id: 'level-trial', to_level_id: 'level-staff', is_active: true, created_at: '2026-01-01',
    conditions: [
      { type: 'months_at_level', operator: '>=', value: 1, label: 'Thá»­ viá»‡c â‰¥ 1 thÃ¡ng' },
      { type: 'kpi_avg', operator: '>=', value: 70, label: 'KPI trung bÃ¬nh â‰¥ 70%' },
      { type: 'skills_count', operator: '>=', value: 2, label: 'Má»Ÿ khÃ³a â‰¥ 2 ká»¹ nÄƒng cÆ¡ báº£n' },
    ],
  },
  {
    id: 'promo-staff-leader', from_level_id: 'level-staff', to_level_id: 'level-leader', is_active: true, created_at: '2026-01-01',
    conditions: [
      { type: 'months_at_level', operator: '>=', value: 4, label: 'NhÃ¢n viÃªn â‰¥ 4 thÃ¡ng' },
      { type: 'kpi_avg', operator: '>=', value: 85, label: 'KPI trung bÃ¬nh â‰¥ 85%' },
      { type: 'skills_count', operator: '>=', value: 5, label: 'Má»Ÿ khÃ³a â‰¥ 5 ká»¹ nÄƒng' },
      { type: 'buddy_count', operator: '>=', value: 1, label: 'ÄÃ£ train â‰¥ 1 ngÆ°á»i' },
    ],
  },
  {
    id: 'promo-leader-manager', from_level_id: 'level-leader', to_level_id: 'level-manager', is_active: true, created_at: '2026-01-01',
    conditions: [
      { type: 'months_at_level', operator: '>=', value: 6, label: 'Trá»£ lÃ½ QL â‰¥ 6 thÃ¡ng' },
      { type: 'kpi_avg', operator: '>=', value: 90, label: 'KPI trung bÃ¬nh â‰¥ 90%' },
      { type: 'skills_count', operator: '>=', value: 8, label: 'Má»Ÿ khÃ³a â‰¥ 8 ká»¹ nÄƒng' },
      { type: 'buddy_count', operator: '>=', value: 3, label: 'ÄÃ£ train â‰¥ 3 ngÆ°á»i' },
      { type: 'custom', operator: '>=', value: 1, label: 'CÃ³ chi nhÃ¡nh má»›i cáº§n quáº£n lÃ½', description: 'Phá»¥ thuá»™c vÃ o káº¿ hoáº¡ch má»Ÿ rá»™ng' },
    ],
  },
];

// â”€â”€â”€ Buddy Rewards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const defaultBuddyRewards: BuddyRewardConfig[] = [
  { id: 'reward-badge', name: 'Huy hiá»‡u Mentor', icon: 'ðŸŽ–ï¸', description: 'Nháº­n huy hiá»‡u khi mentee pass', is_active: true, trigger: 'mentee_pass', reward_type: 'badge' },
  { id: 'reward-title', name: 'Danh hiá»‡u Mentor xuáº¥t sáº¯c', icon: 'ðŸ†', description: 'Sau 3 láº§n mentor thÃ nh cÃ´ng', is_active: true, trigger: 'mentor_streak', reward_type: 'title' },
  { id: 'reward-skill', name: 'Äiá»ƒm ká»¹ nÄƒng +1', icon: 'âš¡', description: '+1 Ä‘iá»ƒm ká»¹ nÄƒng khi mentee má»Ÿ 3 skills', is_active: true, trigger: 'mentee_3_skills', reward_type: 'skill_point' },
  { id: 'reward-shift', name: 'Æ¯u tiÃªn chá»n ca', icon: 'ðŸ“…', description: 'Æ¯u tiÃªn chá»n ca 1 tuáº§n sau khi mentee promoted', is_active: true, trigger: 'mentee_promoted', reward_type: 'priority_shift' },
  { id: 'reward-day', name: 'NgÃ y nghá»‰ thÆ°á»Ÿng', icon: 'ðŸŽ‰', description: '1 ngÃ y nghá»‰ phÃ©p thÆ°á»Ÿng khi mentee pass', is_active: false, trigger: 'mentee_pass', reward_type: 'bonus_day' },
];

// â”€â”€â”€ Trial Checklist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const defaultTrialChecklist: TrialChecklistItem[] = [
  { id: 'trial-1', title: 'ÄÃºng giá»', description: 'Äi lÃ m Ä‘Ãºng giá» â‰¥ 90% ca', category: 'Ká»· luáº­t', weight: 20, order: 1, is_active: true },
  { id: 'trial-2', title: 'Pha cháº¿ Ä‘áº¡t chuáº©n', description: 'Äá»“ uá»‘ng Ä‘Ãºng cÃ´ng thá»©c, Ä‘áº¹p máº¯t', category: 'Ká»¹ nÄƒng', weight: 25, order: 2, is_active: true },
  { id: 'trial-3', title: 'ThÃ¡i Ä‘á»™ phá»¥c vá»¥', description: 'ThÃ¢n thiá»‡n, nhiá»‡t tÃ¬nh vá»›i khÃ¡ch hÃ ng', category: 'ThÃ¡i Ä‘á»™', weight: 20, order: 3, is_active: true },
  { id: 'trial-4', title: 'Vá»‡ sinh', description: 'Giá»¯ khu vá»±c lÃ m viá»‡c sáº¡ch sáº½', category: 'Ká»· luáº­t', weight: 15, order: 4, is_active: true },
  { id: 'trial-5', title: 'Teamwork', description: 'Phá»‘i há»£p tá»‘t vá»›i Ä‘á»“ng nghiá»‡p', category: 'ThÃ¡i Ä‘á»™', weight: 20, order: 5, is_active: true },
];

// â”€â”€â”€ Onboarding Steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const defaultOnboardingSteps: OnboardingStep[] = [
  { id: 'onb-1', title: 'Giá»›i thiá»‡u cÃ´ng ty', description: 'TÃ¬m hiá»ƒu vÄƒn hÃ³a, sá»© má»‡nh, giÃ¡ trá»‹ cá»‘t lÃµi', type: 'video', estimated_minutes: 5, order: 1, required: true, status: 'active' },
  { id: 'onb-2', title: 'Ná»™i quy lÃ m viá»‡c', description: 'Quy Ä‘á»‹nh vá» giá» giáº¥c, Ä‘á»“ng phá»¥c, ká»· luáº­t', type: 'document', estimated_minutes: 10, order: 2, required: true, status: 'active' },
  { id: 'onb-3', title: 'HÆ°á»›ng dáº«n pha cháº¿', description: 'Video hÆ°á»›ng dáº«n pha cháº¿ 5 loáº¡i trÃ  sá»¯a phá»• biáº¿n', type: 'video', estimated_minutes: 15, order: 3, required: true, status: 'active' },
  { id: 'onb-4', title: 'Quiz kiáº¿n thá»©c cÆ¡ báº£n', description: '10 cÃ¢u há»i vá» menu, quy trÃ¬nh, vá»‡ sinh', type: 'quiz', estimated_minutes: 5, order: 4, required: true, pass_score: 80, status: 'active' },
  { id: 'onb-5', title: 'HÆ°á»›ng dáº«n sá»­ dá»¥ng POS', description: 'Thao tÃ¡c nháº­n Ä‘Æ¡n, tÃ­nh tiá»n, in hÃ³a Ä‘Æ¡n', type: 'video', estimated_minutes: 10, order: 5, required: true, status: 'active' },
  { id: 'onb-6', title: 'Thá»±c hÃ nh pha cháº¿', description: 'Pha 3 loáº¡i Ä‘á»“ uá»‘ng dÆ°á»›i giÃ¡m sÃ¡t Mentor', type: 'task', estimated_minutes: 30, order: 6, required: true, status: 'active' },
  { id: 'onb-7', title: 'Checkin Ä‘áº§u tiÃªn', description: 'HoÃ n thÃ nh checkin app láº§n Ä‘áº§u tiÃªn', type: 'checkin', estimated_minutes: 2, order: 7, required: true, status: 'active' },
  { id: 'onb-8', title: 'An toÃ n thá»±c pháº©m', description: 'Quy Ä‘á»‹nh ATTP, xá»­ lÃ½ sá»± cá»‘', type: 'document', estimated_minutes: 10, order: 8, required: false, status: 'active' },
];

// â”€â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const defaultOnboardingCompetencyGroups: OnboardingCompetencyGroup[] = [
  { id: 'ocg-shift-discipline', code: 'shift_discipline', label: 'Ká»· luáº­t ca', description: 'Giá» giáº¥c, Ä‘á»“ng phá»¥c, tÃ¡c phong vÃ  rule ca.', active: true, sort_order: 1 },
  { id: 'ocg-hygiene-safety', code: 'hygiene_safety', label: 'Vá»‡ sinh vÃ  an toÃ n', description: 'ATTP, vá»‡ sinh tay, quáº§y vÃ  dá»¥ng cá»¥.', active: true, sort_order: 2 },
  { id: 'ocg-customer-service', code: 'customer_service', label: 'Dá»‹ch vá»¥ khÃ¡ch hÃ ng', description: 'ChÃ o khÃ¡ch, xÃ¡c nháº­n Ä‘Æ¡n, xá»­ lÃ½ tÃ¬nh huá»‘ng cÆ¡ báº£n.', active: true, sort_order: 3 },
  { id: 'ocg-station-operation', code: 'station_operation', label: 'Thao tÃ¡c vá»‹ trÃ­', description: 'Ká»¹ nÄƒng thao tÃ¡c Ä‘Ãºng theo vá»‹ trÃ­ nháº­n viá»‡c.', active: true, sort_order: 4 },
  { id: 'ocg-shift-coordination', code: 'shift_coordination', label: 'Phá»‘i há»£p ca', description: 'BÃ n giao, phá»‘i há»£p quáº§y-bar vÃ  nhá»‹p váº­n hÃ nh.', active: true, sort_order: 5 },
];

export const defaultOnboardingRoleSettings: OnboardingRoleSettings = {
  roles: [
    {
      role_code: 'counter_staff',
      label: 'Thu ngân',
      enabled: true,
      template_id: 'onb-template-counter-published-v1',
      position_ids: ['pos-002'],
      sort_order: 1,
    },
    {
      role_code: 'barista',
      label: 'Pha cháº¿',
      enabled: true,
      template_id: 'onb-template-barista-published-v1',
      position_ids: ['pos-001'],
      sort_order: 2,
    },
    {
      role_code: 'shift_leader',
      label: 'TrÆ°á»Ÿng ca',
      enabled: true,
      template_id: 'onb-template-shift-leader-published-v1',
      position_ids: ['pos-004'],
      sort_order: 3,
    },
  ],
  unmatched_behavior: 'manual_required',
  allowed_editor_roles: ['hr_admin', 'store_manager', 'ceo'],
  updated_at: null,
  updated_by: null,
};

const starterTemplateBase = {
  name: 'Vietnam Milk Tea Store Onboarding - Starter',
  description: 'Starter content library for Vietnam milk tea store onboarding.',
  source_type: 'built_in' as const,
  effective_from: '2026-06-02',
  published_at: '2026-06-02T09:00:00.000Z',
  published_by: 'system',
  journey_length_days: 14,
  created_by: 'system',
  updated_by: 'system',
  created_at: '2026-06-02T09:00:00.000Z',
  updated_at: '2026-06-02T09:00:00.000Z',
};

export const defaultOnboardingChecklistTemplates: OnboardingChecklistTemplate[] = [
  {
    id: 'onb-template-counter-published-v1',
    role_code: 'counter_staff',
    role_label: 'Thu ngân',
    name: starterTemplateBase.name,
    description: starterTemplateBase.description,
    version: 1,
    status: 'published',
    source_type: starterTemplateBase.source_type,
    effective_from: starterTemplateBase.effective_from,
    published_at: starterTemplateBase.published_at,
    published_by: starterTemplateBase.published_by,
    journey_length_days: starterTemplateBase.journey_length_days,
    created_by: starterTemplateBase.created_by,
    updated_by: starterTemplateBase.updated_by,
    created_at: starterTemplateBase.created_at,
    updated_at: starterTemplateBase.updated_at,
    notes: 'Published starter template for counter staff.',
  },
  {
    id: 'onb-template-counter-draft-v2',
    role_code: 'counter_staff',
    role_label: 'Thu ngân',
    name: starterTemplateBase.name,
    description: 'Current working draft for HR edits.',
    version: 2,
    status: 'draft',
    source_type: 'duplicated',
    effective_from: null,
    published_at: null,
    published_by: null,
    journey_length_days: 14,
    created_by: 'system',
    updated_by: 'current_user',
    created_at: '2026-06-02T09:10:00.000Z',
    updated_at: '2026-06-02T09:10:00.000Z',
    notes: 'Draft stays separate from published snapshot.',
  },
  {
    id: 'onb-template-barista-published-v1',
    role_code: 'barista',
    role_label: 'Pha cháº¿',
    name: starterTemplateBase.name,
    description: 'Starter template adapted for barista role.',
    version: 1,
    status: 'published',
    source_type: starterTemplateBase.source_type,
    effective_from: starterTemplateBase.effective_from,
    published_at: starterTemplateBase.published_at,
    published_by: starterTemplateBase.published_by,
    journey_length_days: starterTemplateBase.journey_length_days,
    created_by: starterTemplateBase.created_by,
    updated_by: starterTemplateBase.updated_by,
    created_at: starterTemplateBase.created_at,
    updated_at: starterTemplateBase.updated_at,
    notes: 'Published starter template for barista onboarding.',
  },
  {
    id: 'onb-template-shift-leader-published-v1',
    role_code: 'shift_leader',
    role_label: 'TrÆ°á»Ÿng ca',
    name: starterTemplateBase.name,
    description: 'Starter template adapted for shift leader onboarding.',
    version: 1,
    status: 'published',
    source_type: starterTemplateBase.source_type,
    effective_from: starterTemplateBase.effective_from,
    published_at: starterTemplateBase.published_at,
    published_by: starterTemplateBase.published_by,
    journey_length_days: starterTemplateBase.journey_length_days,
    created_by: starterTemplateBase.created_by,
    updated_by: starterTemplateBase.updated_by,
    created_at: starterTemplateBase.created_at,
    updated_at: starterTemplateBase.updated_at,
    notes: 'Published starter template for shift leader onboarding.',
  },
];

const topicBlueprint = [
  { code: 'orientation', label: 'Orientation' },
  { code: 'customer_service', label: 'Customer Service' },
  { code: 'pos_payment', label: 'POS and Payment' },
  { code: 'hygiene_food_safety', label: 'Hygiene and Food Safety' },
  { code: 'opening_closing', label: 'Opening and Closing' },
  { code: 'first_shift_review', label: 'RÃ  ca Ä‘áº§u' },
];

export const defaultOnboardingContentTopics: OnboardingContentTopic[] = defaultOnboardingChecklistTemplates.flatMap((template) =>
  topicBlueprint.map((topic, index) => ({
    id: `${template.id}-topic-${topic.code}`,
    template_id: template.id,
    code: topic.code,
    label: topic.label,
    sort_order: index + 1,
    active: true,
  })),
);

export const defaultOnboardingChecklistStages: OnboardingChecklistStage[] = defaultOnboardingChecklistTemplates.flatMap((template) => [
  { id: `${template.id}-pre-start`, template_id: template.id, code: 'pre_start', label: 'TrÆ°á»›c ngÃ y vÃ o lÃ m', sort_order: 1, goal_summary: 'Chá»‘t Ä‘á»§ ná»n táº£ng trÆ°á»›c ngÃ y Ä‘áº§u nháº­n viá»‡c.', required_to_pass: true },
  { id: `${template.id}-day-1`, template_id: template.id, code: 'day_1', label: 'NgÃ y Ä‘áº§u nháº­n viá»‡c', sort_order: 2, goal_summary: 'Náº¯m ná»™i quy quÃ¡n vÃ  ná»n táº£ng phá»¥c vá»¥ cÆ¡ báº£n.', required_to_pass: true },
  { id: `${template.id}-day-2-3`, template_id: template.id, code: 'day_2_3', label: 'NgÃ y 2 - 3', sort_order: 3, goal_summary: 'Luyá»‡n menu, luá»“ng bÃ¡n hÃ ng vÃ  cÃ¡ch Ä‘Æ°á»£c kÃ¨m cáº·p.', required_to_pass: true },
  { id: `${template.id}-day-4-7`, template_id: template.id, code: 'day_4_7', label: 'NgÃ y 4 - 7', sort_order: 4, goal_summary: 'LÃ m ca tháº­t cÃ³ ngÆ°á»i kÃ¨m há»— trá»£.', required_to_pass: true },
  { id: `${template.id}-week-2`, template_id: template.id, code: 'week_2', label: 'Tuáº§n 2', sort_order: 5, goal_summary: 'RÃ  má»©c sáºµn sÃ ng vÃ  chá»‘t pháº§n cáº§n theo sÃ¡t.', required_to_pass: true },
]);

function topicId(templateId: string, code: string) {
  return `${templateId}-topic-${code}`;
}

export const defaultOnboardingChecklistItems: OnboardingChecklistItemTemplate[] = [
  {
    id: 'orientation-store-rules',
    template_id: 'onb-template-counter-published-v1',
    stage_id: 'onb-template-counter-published-v1-day-1',
    topic_id: topicId('onb-template-counter-published-v1', 'orientation'),
    competency_group_id: 'ocg-shift-discipline',
    code: 'orientation-store-rules',
    title: 'Ná»™i quy lÃ m viá»‡c, cháº¥m cÃ´ng, giá» nghá»‰ vÃ  vá»‡ sinh cÆ¡ báº£n',
    instruction_text: 'RÃ  láº¡i ná»™i quy cá»‘t lÃµi cá»§a quÃ¡n trÆ°á»›c ca lÃ m Ä‘áº§y Ä‘á»§ Ä‘áº§u tiÃªn.',
    success_criteria: 'NhÃ¢n sá»± nháº¯c láº¡i Ä‘Æ°á»£c quy Ä‘á»‹nh cháº¥m cÃ´ng vÃ  vá»‡ sinh cÆ¡ báº£n.',
    training_method: 'read',
    evidence_type: 'none',
    confirmer_role: 'hr_admin',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: false,
    requires_manager_confirmation: false,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 15,
    sort_order: 1,
    active: true,
  },
  {
    id: 'counter-pre-start-tools',
    template_id: 'onb-template-counter-published-v1',
    stage_id: 'onb-template-counter-published-v1-pre-start',
    topic_id: topicId('onb-template-counter-published-v1', 'orientation'),
    competency_group_id: 'ocg-shift-discipline',
    code: 'counter-pre-start-tools',
    title: 'Chuáº©n bá»‹ tÃ i khoáº£n, cÃ´ng cá»¥, nhÃ³m chat vÃ  ca Ä‘áº§u',
    instruction_text: 'XÃ¡c nháº­n quyá»n truy cáº­p tÃ i khoáº£n, nhÃ³m chat vÃ  giá» cÃ³ máº·t cá»§a ca Ä‘áº§u.',
    success_criteria: 'NhÃ¢n sá»± cÃ³ Ä‘á»§ cÃ´ng cá»¥ lÃ m viá»‡c vÃ  nháº¯c láº¡i Ä‘Ãºng thá»i gian ca Ä‘áº§u.',
    training_method: 'read',
    evidence_type: 'buddy_check',
    confirmer_role: 'buddy',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: true,
    requires_manager_confirmation: false,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 10,
    sort_order: 2,
    active: true,
  },
  {
    id: 'counter-day-2-3-pos-flow',
    template_id: 'onb-template-counter-published-v1',
    stage_id: 'onb-template-counter-published-v1-day-2-3',
    topic_id: topicId('onb-template-counter-published-v1', 'pos_payment'),
    competency_group_id: 'ocg-customer-service',
    code: 'counter-day-2-3-pos-flow',
    title: 'Ná»n táº£ng bÃ¡n hÃ ng, mÃ£ váº¡ch, voucher vÃ  thanh toÃ¡n',
    instruction_text: 'Thá»±c hÃ nh nháº­n Ä‘Æ¡n, Ã¡p mÃ£ thÃ nh viÃªn vÃ  xá»­ lÃ½ voucher.',
    success_criteria: 'Xá»­ lÃ½ 5 Ä‘Æ¡n máº«u mÃ  khÃ´ng thiáº¿u bÆ°á»›c thanh toÃ¡n.',
    training_method: 'hands_on',
    evidence_type: 'buddy_check',
    confirmer_role: 'buddy',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: true,
    requires_manager_confirmation: false,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 25,
    sort_order: 3,
    active: true,
  },
  {
    id: 'counter-day-4-7-opening-closing',
    template_id: 'onb-template-counter-published-v1',
    stage_id: 'onb-template-counter-published-v1-day-4-7',
    topic_id: topicId('onb-template-counter-published-v1', 'opening_closing'),
    competency_group_id: 'ocg-shift-coordination',
    code: 'counter-day-4-7-opening-closing',
    title: 'Má»Ÿ ca, Ä‘Ã³ng ca, nguyÃªn liá»‡u, háº¡n dÃ¹ng vÃ  ká»· luáº­t quáº§y',
    instruction_text: 'Äi cÃ¹ng ngÆ°á»i kÃ¨m qua checklist má»Ÿ ca vÃ  Ä‘Ã³ng ca.',
    success_criteria: 'HoÃ n táº¥t 1 checklist má»Ÿ ca hoáº·c Ä‘Ã³ng ca cÃ³ hÆ°á»›ng dáº«n mÃ  khÃ´ng thiáº¿u bÆ°á»›c quan trá»ng.',
    training_method: 'observation',
    evidence_type: 'manager_check',
    confirmer_role: 'store_manager',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: true,
    requires_manager_confirmation: true,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 30,
    sort_order: 4,
    active: true,
  },
  {
    id: 'counter-week-2-readiness-review',
    template_id: 'onb-template-counter-published-v1',
    stage_id: 'onb-template-counter-published-v1-week-2',
    topic_id: topicId('onb-template-counter-published-v1', 'first_shift_review'),
    competency_group_id: 'ocg-shift-coordination',
    code: 'counter-week-2-readiness-review',
    title: 'Chá»‘t káº¿t quáº£ ca Ä‘áº§u vÃ  xÃ¡c nháº­n sáºµn sÃ ng vÃ o ca cÆ¡ báº£n',
    instruction_text: 'RÃ  cÃ¡c ca Ä‘áº§u, ghi rÃµ chá»— cáº§n kÃ¨m thÃªm vÃ  xÃ¡c nháº­n má»©c sáºµn sÃ ng cÆ¡ báº£n.',
    success_criteria: 'Quáº£n lÃ½ chá»‘t Ä‘áº¡t hoáº·c cáº§n theo sÃ¡t thÃªm kÃ¨m ghi chÃº rÃµ rÃ ng.',
    training_method: 'observation',
    evidence_type: 'manager_check',
    confirmer_role: 'store_manager',
    ops_visibility: 'ops_only',
    is_required: true,
    requires_buddy_confirmation: false,
    requires_manager_confirmation: true,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 20,
    sort_order: 5,
    active: true,
  },
  {
    id: 'barista-day-1-hygiene',
    template_id: 'onb-template-barista-published-v1',
    stage_id: 'onb-template-barista-published-v1-day-1',
    topic_id: topicId('onb-template-barista-published-v1', 'hygiene_food_safety'),
    competency_group_id: 'ocg-hygiene-safety',
    code: 'barista-day-1-hygiene',
    title: 'Rá»­a tay vÃ  an toÃ n thá»±c pháº©m cÆ¡ báº£n',
    instruction_text: 'RÃ  quy trÃ¬nh vá»‡ sinh trÆ°á»›c khi cháº¡m vÃ o nguyÃªn liá»‡u.',
    success_criteria: 'NhÃ¢n sá»± nháº¯c láº¡i vÃ  lÃ m Ä‘Ãºng checklist vá»‡ sinh.',
    training_method: 'quiz',
    evidence_type: 'quiz_score',
    confirmer_role: 'store_manager',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: false,
    requires_manager_confirmation: true,
    requires_quiz: true,
    is_focus_block_eligible: true,
    quiz_template_id: 'quiz-barista-safety-core',
    estimated_minutes: 15,
    sort_order: 1,
    active: true,
  },
  {
    id: 'barista-day-4-7-practice',
    template_id: 'onb-template-barista-published-v1',
    stage_id: 'onb-template-barista-published-v1-day-4-7',
    topic_id: topicId('onb-template-barista-published-v1', 'opening_closing'),
    competency_group_id: 'ocg-station-operation',
    code: 'barista-day-4-7-practice',
    title: 'Thá»±c hÃ nh táº¡i quáº§y cÃ¹ng ngÆ°á»i kÃ¨m',
    instruction_text: 'Äá»©ng quáº§y trong ca tháº­t vá»›i há»— trá»£ cá»§a ngÆ°á»i kÃ¨m.',
    success_criteria: 'Pha vÃ  giao Ä‘á»“ uá»‘ng Ä‘Ãºng, khÃ´ng máº¯c lá»—i cÃ´ng thá»©c nghiÃªm trá»ng.',
    training_method: 'hands_on',
    evidence_type: 'buddy_check',
    confirmer_role: 'buddy',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: true,
    requires_manager_confirmation: false,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 40,
    sort_order: 2,
    active: true,
  },
  {
    id: 'shift-leader-week-2-review',
    template_id: 'onb-template-shift-leader-published-v1',
    stage_id: 'onb-template-shift-leader-published-v1-week-2',
    topic_id: topicId('onb-template-shift-leader-published-v1', 'first_shift_review'),
    competency_group_id: 'ocg-shift-coordination',
    code: 'shift-leader-week-2-review',
    title: 'RÃ  ca Ä‘á»™c láº­p vÃ  Ä‘Ã¡nh giÃ¡ pháº§n cáº§n theo sÃ¡t',
    instruction_text: 'Cháº¡y thá»­ 1 ca nháº¹ vÃ  bÃ¡o má»©c sáºµn sÃ ng.',
    success_criteria: 'Quáº£n lÃ½ cá»­a hÃ ng xÃ¡c nháº­n Ä‘Ã£ sáºµn sÃ ng hoáº·c cáº§n theo sÃ¡t thÃªm.',
    training_method: 'observation',
    evidence_type: 'manager_check',
    confirmer_role: 'store_manager',
    ops_visibility: 'ops_only',
    is_required: true,
    requires_buddy_confirmation: false,
    requires_manager_confirmation: true,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 30,
    sort_order: 1,
    active: true,
  },
  {
    id: 'orientation-store-rules-draft',
    template_id: 'onb-template-counter-draft-v2',
    stage_id: 'onb-template-counter-draft-v2-day-1',
    topic_id: topicId('onb-template-counter-draft-v2', 'orientation'),
    competency_group_id: 'ocg-shift-discipline',
    code: 'orientation-store-rules-draft',
    title: 'Ná»™i quy lÃ m viá»‡c, cháº¥m cÃ´ng, giá» nghá»‰ vÃ  vá»‡ sinh cÆ¡ báº£n',
    instruction_text: 'RÃ  láº¡i ná»™i quy cá»‘t lÃµi cá»§a quÃ¡n trÆ°á»›c ca lÃ m Ä‘áº§y Ä‘á»§ Ä‘áº§u tiÃªn.',
    success_criteria: 'NhÃ¢n sá»± nháº¯c láº¡i Ä‘Æ°á»£c quy Ä‘á»‹nh cháº¥m cÃ´ng vÃ  vá»‡ sinh cÆ¡ báº£n.',
    training_method: 'read',
    evidence_type: 'none',
    confirmer_role: 'hr_admin',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: false,
    requires_manager_confirmation: false,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 15,
    sort_order: 1,
    active: true,
  },
  {
    id: 'counter-pre-start-tools-draft',
    template_id: 'onb-template-counter-draft-v2',
    stage_id: 'onb-template-counter-draft-v2-pre-start',
    topic_id: topicId('onb-template-counter-draft-v2', 'orientation'),
    competency_group_id: 'ocg-shift-discipline',
    code: 'counter-pre-start-tools-draft',
    title: 'Chuáº©n bá»‹ tÃ i khoáº£n, cÃ´ng cá»¥, nhÃ³m chat vÃ  ca Ä‘áº§u',
    instruction_text: 'XÃ¡c nháº­n quyá»n truy cáº­p tÃ i khoáº£n, nhÃ³m chat vÃ  giá» cÃ³ máº·t cá»§a ca Ä‘áº§u.',
    success_criteria: 'NhÃ¢n sá»± cÃ³ Ä‘á»§ cÃ´ng cá»¥ lÃ m viá»‡c vÃ  nháº¯c láº¡i Ä‘Ãºng thá»i gian ca Ä‘áº§u.',
    training_method: 'read',
    evidence_type: 'buddy_check',
    confirmer_role: 'buddy',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: true,
    requires_manager_confirmation: false,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 10,
    sort_order: 2,
    active: true,
  },
  {
    id: 'counter-day-2-3-pos-flow-draft',
    template_id: 'onb-template-counter-draft-v2',
    stage_id: 'onb-template-counter-draft-v2-day-2-3',
    topic_id: topicId('onb-template-counter-draft-v2', 'pos_payment'),
    competency_group_id: 'ocg-customer-service',
    code: 'counter-day-2-3-pos-flow-draft',
    title: 'Ná»n táº£ng bÃ¡n hÃ ng, mÃ£ váº¡ch, voucher vÃ  thanh toÃ¡n',
    instruction_text: 'Thá»±c hÃ nh nháº­n Ä‘Æ¡n, Ã¡p mÃ£ thÃ nh viÃªn vÃ  xá»­ lÃ½ voucher.',
    success_criteria: 'Xá»­ lÃ½ 5 Ä‘Æ¡n máº«u mÃ  khÃ´ng thiáº¿u bÆ°á»›c thanh toÃ¡n.',
    training_method: 'hands_on',
    evidence_type: 'buddy_check',
    confirmer_role: 'buddy',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: true,
    requires_manager_confirmation: false,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 25,
    sort_order: 3,
    active: true,
  },
  {
    id: 'counter-day-4-7-opening-closing-draft',
    template_id: 'onb-template-counter-draft-v2',
    stage_id: 'onb-template-counter-draft-v2-day-4-7',
    topic_id: topicId('onb-template-counter-draft-v2', 'hygiene_food_safety'),
    competency_group_id: 'ocg-shift-coordination',
    code: 'counter-day-4-7-opening-closing-draft',
    title: 'Má»Ÿ ca, Ä‘Ã³ng ca, nguyÃªn liá»‡u, háº¡n dÃ¹ng vÃ  ká»· luáº­t quáº§y',
    instruction_text: 'Äi cÃ¹ng ngÆ°á»i kÃ¨m qua checklist má»Ÿ ca vÃ  Ä‘Ã³ng ca.',
    success_criteria: 'HoÃ n táº¥t 1 checklist má»Ÿ ca hoáº·c Ä‘Ã³ng ca cÃ³ hÆ°á»›ng dáº«n mÃ  khÃ´ng thiáº¿u bÆ°á»›c quan trá»ng.',
    training_method: 'observation',
    evidence_type: 'manager_check',
    confirmer_role: 'store_manager',
    ops_visibility: 'employee_visible',
    is_required: true,
    requires_buddy_confirmation: true,
    requires_manager_confirmation: true,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 30,
    sort_order: 4,
    active: true,
  },
  {
    id: 'counter-week-2-readiness-review-draft',
    template_id: 'onb-template-counter-draft-v2',
    stage_id: 'onb-template-counter-draft-v2-week-2',
    topic_id: topicId('onb-template-counter-draft-v2', 'first_shift_review'),
    competency_group_id: 'ocg-shift-coordination',
    code: 'counter-week-2-readiness-review-draft',
    title: 'Chá»‘t káº¿t quáº£ ca Ä‘áº§u vÃ  xÃ¡c nháº­n sáºµn sÃ ng vÃ o ca cÆ¡ báº£n',
    instruction_text: 'RÃ  cÃ¡c ca Ä‘áº§u, ghi rÃµ chá»— cáº§n kÃ¨m thÃªm vÃ  xÃ¡c nháº­n má»©c sáºµn sÃ ng cÆ¡ báº£n.',
    success_criteria: 'Quáº£n lÃ½ chá»‘t Ä‘áº¡t hoáº·c cáº§n theo sÃ¡t thÃªm kÃ¨m ghi chÃº rÃµ rÃ ng.',
    training_method: 'observation',
    evidence_type: 'manager_check',
    confirmer_role: 'store_manager',
    ops_visibility: 'ops_only',
    is_required: true,
    requires_buddy_confirmation: false,
    requires_manager_confirmation: true,
    requires_quiz: false,
    is_focus_block_eligible: true,
    estimated_minutes: 20,
    sort_order: 5,
    active: true,
  },
];export const onboardingMiniQuizTemplates: OnboardingMiniQuizTemplate[] = [
  {
    id: 'onb-quiz-pre-start',
    stage_code: 'pre_start',
    title: 'Bài kiểm tra ngắn trước ngày vào làm',
    questions: [
      {
        id: 'pre-start-q1',
        prompt: 'Khi chưa rõ giờ có mặt, bạn nên hỏi ai trước?',
        options: [
          { id: 'a', label: 'Người kèm hoặc quản lý đã được phân công' },
          { id: 'b', label: 'Tự đoán theo lịch cũ' },
          { id: 'c', label: 'Đợi đến giờ rồi tính' },
        ],
        correct_option_id: 'a',
      },
      {
        id: 'pre-start-q2',
        prompt: 'Trước ngày vào làm, việc nào nên chốt sớm?',
        options: [
          { id: 'a', label: 'Trang phục, giờ có mặt, điểm chấm công và người liên hệ' },
          { id: 'b', label: 'Chỉ cần biết món bán chạy là đủ' },
          { id: 'c', label: 'Chờ đến ca đầu mới hỏi từng việc' },
        ],
        correct_option_id: 'a',
      },
      {
        id: 'pre-start-q3',
        prompt: 'Nếu chưa vào nhóm chat hoặc chưa có tài khoản cần thiết, bạn nên làm gì?',
        options: [
          { id: 'a', label: 'Báo người kèm hoặc quản lý để được bổ sung trước ca đầu' },
          { id: 'b', label: 'Bỏ qua vì vào làm rồi tính sau' },
          { id: 'c', label: 'Tự dùng tài khoản chung của người khác' },
        ],
        correct_option_id: 'a',
      },
    ],
  },
  {
    id: 'onb-quiz-day-1',
    stage_code: 'day_1',
    title: 'Bài kiểm tra ngắn ngày đầu',
    questions: [
      {
        id: 'day-1-q1',
        prompt: 'Khi nhận đơn chưa rõ món thêm, bạn nên làm gì?',
        options: [
          { id: 'a', label: 'Xác nhận lại với khách trước khi bấm đơn' },
          { id: 'b', label: 'Bấm theo thói quen cho nhanh' },
          { id: 'c', label: 'Bỏ qua món thêm để đỡ chậm' },
        ],
        correct_option_id: 'a',
      },
      {
        id: 'day-1-q2',
        prompt: 'Nếu chưa nhớ quy trình thao tác, cách xử lý đúng là gì?',
        options: [
          { id: 'a', label: 'Dừng lại và hỏi người kèm hoặc người hướng dẫn ngay' },
          { id: 'b', label: 'Làm thử theo trí nhớ cho xong' },
          { id: 'c', label: 'Né tránh việc đó đến cuối ca' },
        ],
        correct_option_id: 'a',
      },
      {
        id: 'day-1-q3',
        prompt: 'Sau khi hoàn tất thao tác tại quầy, điều nào quan trọng nhất?',
        options: [
          { id: 'a', label: 'Dọn lại khu vực, giữ vệ sinh và sẵn sàng đón tiếp' },
          { id: 'b', label: 'Rời quầy ngay để tránh việc khác' },
          { id: 'c', label: 'Chờ người khác tự thu dọn' },
        ],
        correct_option_id: 'a',
      },
      {
        id: 'day-1-q4',
        prompt: 'Khi gặp tình huống khách hỏi gấp mà bạn chưa chắc, bạn nên làm gì?',
        options: [
          { id: 'a', label: 'Xin phép kiểm tra lại với người kèm hoặc quản lý rồi trả lời' },
          { id: 'b', label: 'Trả lời dài để khách yên tâm' },
          { id: 'c', label: 'Im lặng và chuyển khách sang nơi khác' },
        ],
        correct_option_id: 'a',
      },
    ],
  },
];
export const defaultSettings: CareerPathSettings = {
  buddy_system_enabled: true,
  leaderboard_enabled: true,
  goals_enabled: true,
  endorsements_enabled: true,
  notifications_enabled: true,
  onboarding_enabled: true,
  onboarding_role_settings: defaultOnboardingRoleSettings,
  onboarding_policy_enabled: true,
  onboarding_policy_summary_trigger: 'contract_send',
  onboarding_policy_full_trigger: 'days_before_start',
  onboarding_policy_full_days_before_start: 1,
  onboarding_policy_require_ack: true,
  onboarding_policy_max_reminders: 1,
  onboarding_policy_template_id: 'default-policy-v1',
  onboarding_policy_alert_scope: 'hr_and_store_manager',
  skill_refresh_enabled: false,
  cross_training_enabled: false,
  trial_duration_days: 14,
  max_active_goals: 3,
  leaderboard_reset_period: 'monthly',
};

// â”€â”€â”€ Sample Employee Skills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sampleEmployeeSkills: EmployeeSkill[] = [
  // emp-001 (Minh - level-staff, FT, 4 months, 6 skills unlocked)
  { id: 'es-001', employee_id: 'emp-001', skill_id: 'skill-brewing', status: 'unlocked', unlocked_at: '2025-10-15', unlocked_by: 'system', endorsement_count: 3, avg_endorsement_rating: 4.3 },
  { id: 'es-002', employee_id: 'emp-001', skill_id: 'skill-cashier', status: 'unlocked', unlocked_at: '2025-10-15', unlocked_by: 'system', endorsement_count: 2, avg_endorsement_rating: 4.0 },
  { id: 'es-003', employee_id: 'emp-001', skill_id: 'skill-open', status: 'unlocked', unlocked_at: '2025-11-20', unlocked_by: 'system', endorsement_count: 1, avg_endorsement_rating: 4.0 },
  { id: 'es-004', employee_id: 'emp-001', skill_id: 'skill-close', status: 'unlocked', unlocked_at: '2025-11-20', unlocked_by: 'system', endorsement_count: 1, avg_endorsement_rating: 3.0 },
  { id: 'es-005', employee_id: 'emp-001', skill_id: 'skill-quality', status: 'unlocked', unlocked_at: '2025-12-10', unlocked_by: 'system', endorsement_count: 0, avg_endorsement_rating: 0 },
  { id: 'es-006', employee_id: 'emp-001', skill_id: 'skill-hygiene', status: 'unlocked', unlocked_at: '2025-12-10', unlocked_by: 'system', endorsement_count: 0, avg_endorsement_rating: 0 },
  { id: 'es-007', employee_id: 'emp-001', skill_id: 'skill-inventory', status: 'in_progress', unlocked_at: null, unlocked_by: null, endorsement_count: 0, avg_endorsement_rating: 0 },
  { id: 'es-008', employee_id: 'emp-001', skill_id: 'skill-customer', status: 'locked', unlocked_at: null, unlocked_by: null, endorsement_count: 0, avg_endorsement_rating: 0 },
  // emp-003 (Lan - level-trial, PT, 2 weeks, onboarding)
  { id: 'es-020', employee_id: 'emp-003', skill_id: 'skill-brewing', status: 'in_progress', unlocked_at: null, unlocked_by: null, endorsement_count: 0, avg_endorsement_rating: 0 },
  { id: 'es-021', employee_id: 'emp-003', skill_id: 'skill-cashier', status: 'locked', unlocked_at: null, unlocked_by: null, endorsement_count: 0, avg_endorsement_rating: 0 },
  // emp-005 (Linh - level-staff, FT, 8 months, 8 skills, near leader)
  { id: 'es-030', employee_id: 'emp-005', skill_id: 'skill-brewing', status: 'unlocked', unlocked_at: '2025-06-15', unlocked_by: 'system', endorsement_count: 5, avg_endorsement_rating: 4.8 },
  { id: 'es-031', employee_id: 'emp-005', skill_id: 'skill-cashier', status: 'unlocked', unlocked_at: '2025-06-15', unlocked_by: 'system', endorsement_count: 4, avg_endorsement_rating: 4.5 },
  { id: 'es-032', employee_id: 'emp-005', skill_id: 'skill-open', status: 'unlocked', unlocked_at: '2025-07-20', unlocked_by: 'system', endorsement_count: 3, avg_endorsement_rating: 4.7 },
  { id: 'es-033', employee_id: 'emp-005', skill_id: 'skill-close', status: 'unlocked', unlocked_at: '2025-07-20', unlocked_by: 'system', endorsement_count: 3, avg_endorsement_rating: 4.3 },
  { id: 'es-034', employee_id: 'emp-005', skill_id: 'skill-quality', status: 'unlocked', unlocked_at: '2025-08-15', unlocked_by: 'system', endorsement_count: 2, avg_endorsement_rating: 4.0 },
  { id: 'es-035', employee_id: 'emp-005', skill_id: 'skill-hygiene', status: 'unlocked', unlocked_at: '2025-08-20', unlocked_by: 'system', endorsement_count: 2, avg_endorsement_rating: 4.5 },
  { id: 'es-036', employee_id: 'emp-005', skill_id: 'skill-inventory', status: 'unlocked', unlocked_at: '2025-09-10', unlocked_by: 'emp-002', endorsement_count: 1, avg_endorsement_rating: 4.0 },
  { id: 'es-037', employee_id: 'emp-005', skill_id: 'skill-training', status: 'unlocked', unlocked_at: '2025-10-01', unlocked_by: 'emp-002', endorsement_count: 3, avg_endorsement_rating: 4.7 },
  { id: 'es-038', employee_id: 'emp-005', skill_id: 'skill-customer', status: 'in_progress', unlocked_at: null, unlocked_by: null, endorsement_count: 0, avg_endorsement_rating: 0 },
  // emp-004 (Nam - level-staff, FT, 6 months, 7 skills, ready for promotion)
  { id: 'es-040', employee_id: 'emp-004', skill_id: 'skill-brewing', status: 'unlocked', unlocked_at: '2025-08-10', unlocked_by: 'system', endorsement_count: 2, avg_endorsement_rating: 3.5 },
  { id: 'es-041', employee_id: 'emp-004', skill_id: 'skill-cashier', status: 'unlocked', unlocked_at: '2025-08-10', unlocked_by: 'system', endorsement_count: 2, avg_endorsement_rating: 4.0 },
  { id: 'es-042', employee_id: 'emp-004', skill_id: 'skill-open', status: 'unlocked', unlocked_at: '2025-09-15', unlocked_by: 'system', endorsement_count: 1, avg_endorsement_rating: 3.0 },
  { id: 'es-043', employee_id: 'emp-004', skill_id: 'skill-close', status: 'unlocked', unlocked_at: '2025-09-15', unlocked_by: 'system', endorsement_count: 1, avg_endorsement_rating: 4.0 },
  { id: 'es-044', employee_id: 'emp-004', skill_id: 'skill-quality', status: 'unlocked', unlocked_at: '2025-10-10', unlocked_by: 'system', endorsement_count: 0, avg_endorsement_rating: 0 },
  { id: 'es-045', employee_id: 'emp-004', skill_id: 'skill-delivery', status: 'unlocked', unlocked_at: '2025-10-15', unlocked_by: 'system', endorsement_count: 1, avg_endorsement_rating: 4.0 },
  { id: 'es-046', employee_id: 'emp-004', skill_id: 'skill-equipment', status: 'unlocked', unlocked_at: '2025-11-01', unlocked_by: 'system', endorsement_count: 0, avg_endorsement_rating: 0 },
];

// â”€â”€â”€ Sample Buddy Assignments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sampleBuddyAssignments: BuddyAssignment[] = [
  { id: 'buddy-001', mentor_id: 'emp-005', mentee_id: 'emp-003', store_id: 'store-q1', started_at: '2026-02-07', completed_at: null, status: 'active', mentee_trial_result: null, mentor_rewards_given: [], notes: '' },
  { id: 'buddy-002', mentor_id: 'emp-001', mentee_id: 'emp-007', store_id: 'store-q1', started_at: '2026-01-15', completed_at: '2026-02-01', status: 'completed', mentee_trial_result: 'pass', mentor_rewards_given: ['reward-badge'], notes: 'Mentee Ä‘áº¡t yÃªu cáº§u' },
  { id: 'buddy-003', mentor_id: 'emp-005', mentee_id: 'emp-008', store_id: 'store-q1', started_at: '2025-12-01', completed_at: '2025-12-20', status: 'completed', mentee_trial_result: 'pass', mentor_rewards_given: ['reward-badge', 'reward-skill'], notes: '' },
];

// â”€â”€â”€ Sample Promotion Requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const samplePromotionRequests: PromotionRequest[] = [
  {
    id: 'preq-001', employee_id: 'emp-004', from_level_id: 'level-staff', to_level_id: 'level-leader',
    status: 'pending', submitted_at: '2026-02-18', reviewed_at: null, reviewed_by: null, review_note: null,
    conditions_snapshot: [
      { condition: { type: 'months_at_level', operator: '>=', value: 4, label: 'NV â‰¥ 4 thÃ¡ng' }, current_value: 6, is_met: true, progress_percent: 100 },
      { condition: { type: 'kpi_avg', operator: '>=', value: 85, label: 'KPI â‰¥ 85%' }, current_value: 88, is_met: true, progress_percent: 100 },
      { condition: { type: 'skills_count', operator: '>=', value: 5, label: 'â‰¥ 5 ká»¹ nÄƒng' }, current_value: 7, is_met: true, progress_percent: 100 },
      { condition: { type: 'buddy_count', operator: '>=', value: 1, label: 'Train â‰¥ 1 ngÆ°á»i' }, current_value: 0, is_met: false, progress_percent: 0 },
    ],
  },
];

// â”€â”€â”€ Sample Type Change Requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sampleTypeChangeRequests: TypeChangeRequest[] = [
  { id: 'tcreq-001', employee_id: 'emp-006', from_type: 'part_time', to_type: 'full_time', reason: 'Muá»‘n phÃ¡t triá»ƒn lÃªn Leader', status: 'pending', submitted_at: '2026-02-15', reviewed_at: null, reviewed_by: null, review_note: null },
];

// â”€â”€â”€ Sample Trial Evaluations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sampleTrialEvaluations: TrialEvaluation[] = [
  {
    id: 'trial-eval-001', employee_id: 'emp-007', evaluator_id: 'emp-002', buddy_id: 'emp-001',
    started_at: '2026-01-15', evaluated_at: '2026-02-01', result: 'pass', overall_score: 82, notes: 'Äáº¡t yÃªu cáº§u, chuyá»ƒn chÃ­nh thá»©c',
    checklist_scores: [
      { item_id: 'trial-1', score: 4, note: 'ÄÃºng giá» tá»‘t' },
      { item_id: 'trial-2', score: 4, note: 'Pha cháº¿ á»•n' },
      { item_id: 'trial-3', score: 5, note: 'Ráº¥t thÃ¢n thiá»‡n' },
      { item_id: 'trial-4', score: 3, note: 'Cáº§n cáº£i thiá»‡n vá»‡ sinh' },
      { item_id: 'trial-5', score: 4, note: 'Phá»‘i há»£p tá»‘t' },
    ],
  },
];

// â”€â”€â”€ Sample Goals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sampleGoals: CareerGoal[] = [
  { id: 'goal-001', employee_id: 'emp-001', type: 'skill', target_skill_id: 'skill-training', title: 'Má»Ÿ khÃ³a Training cÆ¡ báº£n', target_date: '2026-03-15', status: 'active', progress: 75, created_at: '2026-01-10' },
  { id: 'goal-002', employee_id: 'emp-001', type: 'level', target_level_id: 'level-leader', title: 'LÃªn Trá»£ lÃ½ Quáº£n lÃ½', target_date: '2026-05-01', status: 'active', progress: 42, created_at: '2026-01-15' },
  { id: 'goal-003', employee_id: 'emp-004', type: 'skill', target_skill_id: 'skill-training', title: 'Má»Ÿ khÃ³a Training', target_date: '2026-03-01', status: 'active', progress: 60, created_at: '2026-01-20' },
  { id: 'goal-004', employee_id: 'emp-001', type: 'skill', target_skill_id: 'skill-open', title: 'Má»Ÿ khÃ³a Má»Ÿ ca', target_date: '2026-02-15', status: 'achieved', progress: 100, created_at: '2025-12-01', achieved_at: '2026-02-01' },
];

// â”€â”€â”€ Sample Endorsements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sampleEndorsements: SkillEndorsement[] = [
  { id: 'end-001', employee_id: 'emp-001', skill_id: 'skill-brewing', endorsed_by: 'emp-005', endorsed_at: '2026-01-20', rating: 4, comment: 'Pha ráº¥t ngon' },
  { id: 'end-002', employee_id: 'emp-001', skill_id: 'skill-brewing', endorsed_by: 'emp-002', endorsed_at: '2026-02-01', rating: 5, comment: 'Xuáº¥t sáº¯c' },
  { id: 'end-003', employee_id: 'emp-001', skill_id: 'skill-brewing', endorsed_by: 'emp-004', endorsed_at: '2026-02-10', rating: 4 },
  { id: 'end-004', employee_id: 'emp-005', skill_id: 'skill-training', endorsed_by: 'emp-002', endorsed_at: '2026-01-15', rating: 5, comment: 'Mentor ráº¥t giá»i' },
  { id: 'end-005', employee_id: 'emp-005', skill_id: 'skill-brewing', endorsed_by: 'emp-002', endorsed_at: '2026-01-10', rating: 5 },
  { id: 'end-006', employee_id: 'emp-004', skill_id: 'skill-cashier', endorsed_by: 'emp-002', endorsed_at: '2026-02-05', rating: 4, comment: 'TÃ­nh tiá»n nhanh' },
];

// â”€â”€â”€ Sample Onboarding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sampleEmployeeOnboarding: import('./career-path-types').EmployeeOnboarding[] = [
  {
    id: 'onb-prog-001', employee_id: 'emp-003', started_at: '2026-02-07', completed_at: null, overall_progress: 62,
    steps_progress: [
      { step_id: 'onb-1', status: 'completed', started_at: '2026-02-07', completed_at: '2026-02-07' },
      { step_id: 'onb-2', status: 'completed', started_at: '2026-02-07', completed_at: '2026-02-07' },
      { step_id: 'onb-3', status: 'completed', started_at: '2026-02-08', completed_at: '2026-02-08' },
      { step_id: 'onb-4', status: 'completed', started_at: '2026-02-08', completed_at: '2026-02-08', score: 90 },
      { step_id: 'onb-5', status: 'completed', started_at: '2026-02-09', completed_at: '2026-02-09' },
      { step_id: 'onb-6', status: 'in_progress', started_at: '2026-02-10', completed_at: null },
      { step_id: 'onb-7', status: 'pending', started_at: null, completed_at: null },
      { step_id: 'onb-8', status: 'pending', started_at: null, completed_at: null },
    ],
  },

];

export const sampleNotifications: CareerNotification[] = [
  { id: 'notif-001', employee_id: 'emp-001', type: 'skill_unlock_available', title: 'Sap mo khoa Nhap hang!', message: 'Ban du 85% dieu kien mo khoa Nhap hang.', link: '/career-path/skills', is_read: false, created_at: '2026-02-20' },
  { id: 'notif-002', employee_id: 'emp-001', type: 'goal_reminder', title: 'Con 22 ngay muc tieu', message: 'Muc tieu Mo khoa Training co ban con 22 ngay.', link: '/career-path/goals', is_read: false, created_at: '2026-02-21' },
];

export const sampleLeaderboard: LeaderboardEntry[] = [
  { employee_id: 'emp-005', employee_name: 'Linh', store_id: 'store-q1', category: 'top_mentor', score: 3, rank: 1, period: '2026-02', trend: 'same', highlight: '3 mentees thanh cong' },
  { employee_id: 'emp-001', employee_name: 'Minh', store_id: 'store-q1', category: 'skill_unlock', score: 6, rank: 1, period: '2026-02', trend: 'up', highlight: '6 ki nang da mo' },
];

export const sampleChangeLogs: SettingsChangeLog[] = [
  { id: 'log-001', entity_type: 'skill', entity_id: 'skill-inventory', action: 'update', changed_by: 'emp-002', changed_at: '2026-02-10', before_snapshot: '{}', after_snapshot: '{}', description: 'Giam yeu cau Nhap hang tu 3 thang xuong 2 thang' },
];

export const sampleAchievements: Achievement[] = [
  { id: 'ach-001', type: 'badge', title: 'Mentor dau tien', icon: '???', description: 'Hoan thanh mentor mentee dau tien', earned_at: '2026-02-01' },
  { id: 'ach-002', type: 'milestone', title: '6 ki nang', icon: '?', description: 'Mo khoa 6 ki nang', earned_at: '2025-12-10' },
];
export const sampleEmployeeOnboardingChecklistPlans: EmployeeOnboardingChecklistPlan[] = [
  { id: 'onb-plan-007', employee_id: 'emp-007', template_id: 'onb-template-counter-published-v1', role_code: 'counter_staff', role_label_snapshot: null, template_label_snapshot: null, assigned_store_id: 'store-001', assigned_buddy_id: 'emp-006', assigned_buddy_name: 'Nguyễn Thị Mai', assigned_manager_id: 'emp-002', assigned_manager_name: 'Trần Thị Lan', start_date: '2025-12-01', current_stage_code: 'day_2_3', status: 'in_progress', overall_progress: 67, overall_note: 'Đã qua ca đầu, đang cần kèm thêm phần bàn giao quầy.', assigned_at: '2025-11-30', created_at: '2025-11-30', updated_at: '2025-12-03' },
  { id: 'onb-plan-017', employee_id: 'emp-017', template_id: 'onb-template-counter-published-v1', role_code: 'counter_staff', role_label_snapshot: null, template_label_snapshot: null, assigned_store_id: 'store-001', assigned_buddy_id: 'emp-006', assigned_buddy_name: 'Nguyễn Thị Mai', assigned_manager_id: 'emp-002', assigned_manager_name: 'Trần Thị Lan', start_date: '2026-06-03', current_stage_code: 'pre_start', status: 'assigned', overall_progress: 0, overall_note: null, assigned_at: '2026-06-01', created_at: '2026-06-01', updated_at: '2026-06-01' },
  { id: 'onb-plan-018', employee_id: 'emp-018', template_id: 'onb-template-barista-published-v1', role_code: 'barista', role_label_snapshot: null, template_label_snapshot: null, assigned_store_id: 'store-001', assigned_buddy_id: 'emp-005', assigned_buddy_name: 'Võ Thanh Bình', assigned_manager_id: 'emp-002', assigned_manager_name: 'Trần Thị Lan', start_date: '2026-05-27', current_stage_code: 'day_1', status: 'in_progress', overall_progress: 25, overall_note: 'Hoàn thành giai đoạn chuẩn bị, bắt đầu ngày đầu nhận việc.', assigned_at: '2026-05-27', created_at: '2026-05-27', updated_at: '2026-06-01' },
];
export const sampleEmployeeOnboardingChecklistProgressItems: EmployeeOnboardingChecklistProgressItem[] = [
  {
    id: 'onb-plan-007-item-1',
    onboarding_plan_id: 'onb-plan-007',
    checklist_item_id: 'counter-pre-start-tools',
    status: 'passed',
    note: 'Đã xác nhận giờ có mặt và vào nhóm chat.',
    started_at: '2025-11-30',
    completed_at: '2025-11-30',
    buddy_confirmed_by: 'emp-006',
    buddy_confirmed_at: '2025-11-30',
    manager_confirmed_by: null,
    manager_confirmed_at: null,
    quiz_score: null,
  },
  {
    id: 'onb-plan-007-item-2',
    onboarding_plan_id: 'onb-plan-007',
    checklist_item_id: 'orientation-store-rules',
    status: 'passed',
    note: 'Đúng quy định đón khách.',
    started_at: '2025-12-01',
    completed_at: '2025-12-01',
    buddy_confirmed_by: 'emp-006',
    buddy_confirmed_at: '2025-12-01',
    manager_confirmed_by: null,
    manager_confirmed_at: null,
    quiz_score: null,
  },
  {
    id: 'onb-plan-007-item-3',
    onboarding_plan_id: 'onb-plan-007',
    checklist_item_id: 'counter-day-2-3-pos-flow',
    status: 'in_progress',
    note: 'Còn nhầm 1 đơn khi đông khách, cần kèm thêm cuối ca.',
    started_at: '2025-12-02',
    completed_at: null,
    buddy_confirmed_by: null,
    buddy_confirmed_at: null,
    manager_confirmed_by: null,
    manager_confirmed_at: null,
    quiz_score: null,
  },
];
export const sampleTemplate: CareerPathTemplate = {
  id: 'tmpl-001', name: 'Template Chuáº©n Q1', description: 'Template máº·c Ä‘á»‹nh cho chi nhÃ¡nh Quáº­n 1',
  created_at: '2026-01-01', created_by: 'emp-002',
  data: {
    levels: defaultCareerLevels,
    skills: defaultSkills,
    conditions: defaultPromotionConditions,
    employee_types: defaultEmployeeTypes,
    buddy_rewards: defaultBuddyRewards,
    trial_checklist: defaultTrialChecklist,
    onboarding_steps: defaultOnboardingSteps,
    onboarding_competency_groups: defaultOnboardingCompetencyGroups,
    onboarding_content_topics: defaultOnboardingContentTopics,
    onboarding_checklist_templates: defaultOnboardingChecklistTemplates,
    onboarding_checklist_stages: defaultOnboardingChecklistStages,
    onboarding_checklist_items: defaultOnboardingChecklistItems,
    onboarding_employee_plans: sampleEmployeeOnboardingChecklistPlans,
    onboarding_employee_progress_items: sampleEmployeeOnboardingChecklistProgressItems,
  },
};

// â”€â”€â”€ Sample Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sampleAnalytics: CareerAnalytics = {
  store_id: 'store-q1', period: '2026-02',
  avg_time_to_promotion: 45,
  skill_unlock_rate: 2.5,
  buddy_success_rate: 89,
  retention_by_level: [
    { level_id: 'level-trial', retention_rate: 72 },
    { level_id: 'level-staff', retention_rate: 91 },
    { level_id: 'level-leader', retention_rate: 100 },
    { level_id: 'level-manager', retention_rate: 100 },
  ],
  top_skills_unlocked: [
    { skill_id: 'skill-brewing', count: 8 },
    { skill_id: 'skill-cashier', count: 8 },
    { skill_id: 'skill-open', count: 5 },
    { skill_id: 'skill-close', count: 5 },
    { skill_id: 'skill-quality', count: 3 },
  ],
  promotion_funnel: [
    { level_id: 'level-trial', eligible: 2, promoted: 1 },
    { level_id: 'level-staff', eligible: 3, promoted: 0 },
    { level_id: 'level-leader', eligible: 0, promoted: 0 },
  ],
};

// â”€â”€â”€ Sample Skill Refresh Records â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sampleRefreshRecords: SkillRefreshRecord[] = [
  { id: 'ref-001', employee_id: 'emp-001', skill_id: 'skill-hygiene', original_unlock_date: '2025-12-10', last_refresh_date: '2025-12-10', next_refresh_due: '2026-06-10', status: 'valid' },
  { id: 'ref-002', employee_id: 'emp-005', skill_id: 'skill-hygiene', original_unlock_date: '2025-08-20', last_refresh_date: '2025-08-20', next_refresh_due: '2026-02-20', status: 'expiring_soon' },
];

// â”€â”€â”€ Sample Cross-Training â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sampleCrossTraining: CrossTrainingRecord[] = [
  { id: 'ct-001', employee_id: 'emp-001', from_store_id: 'store-q1', to_store_id: 'store-q3', skills_learned: ['skill-delivery'], started_at: '2026-01-10', completed_at: '2026-01-15', trainer_id: 'emp-010', notes: 'Há»c quáº£n lÃ½ Ä‘Æ¡n online tá»« CN3', status: 'completed' },
];




