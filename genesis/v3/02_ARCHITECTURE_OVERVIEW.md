# Architecture Overview — Career Path Module v2

## 1. System Overview

Career Path Module là subsystem của HRM Trà Sữa với 24 features, 17 routes, ~82 files. Sử dụng cùng tech stack (Next.js 15, TypeScript, localStorage persistence).

---

## 2. Route Tree (17 routes)

```
/career-path/                          # Main dashboard (role-based)
/career-path/skills/                   # Skill tree (3 views)
/career-path/promotion/                # Promotion progress + timeline
/career-path/goals/                    # Goal setting (NEW)
/career-path/onboarding/               # Onboarding flow (NEW)
/career-path/leaderboard/              # Leaderboard
/career-path/notifications/            # Notification center (NEW)
/career-path/requests/                 # Promotion + type change (admin)
/career-path/trial/                    # Trial evaluation (admin)
/career-path/assign-skill/             # Manual skill unlock (admin)
/career-path/reports/                  # Reports + analytics (admin)
/career-path/endorsements/             # Endorsements management (NEW)
/career-path/settings/                 # Settings main (6 tabs)
/career-path/settings/buddy/           # Buddy system
/career-path/settings/trial/           # Trial checklist
/career-path/settings/templates/       # Templates
/career-path/settings/history/         # Change logs
/career-path/settings/onboarding/      # Onboarding steps (NEW)
```

---

## 3. File Structure (~82 files)

```
src/
├── lib/
│   ├── types/
│   │   └── career-path.ts                  # 30+ interfaces
│   ├── mock-data/
│   │   └── career-path.ts                  # Comprehensive mock data
│   └── services/
│       ├── career-path-service.ts          # 100+ service functions
│       └── career-path-ai.ts              # Smart features (NEW)
├── components/
│   └── career-path/
│       ├── shared/ (6)
│       │   ├── ProgressRing.tsx
│       │   ├── ProgressBar.tsx
│       │   ├── IconPicker.tsx
│       │   ├── ConditionChip.tsx
│       │   ├── TimelineView.tsx            # NEW
│       │   └── SkillHexagon.tsx            # NEW
│       ├── employee/ (17)
│       │   ├── CareerProgressCard.tsx
│       │   ├── SkillTreeView.tsx
│       │   ├── SkillGroupSection.tsx
│       │   ├── SkillItemCard.tsx
│       │   ├── SkillDetailSheet.tsx
│       │   ├── SkillHexagonView.tsx         # NEW
│       │   ├── PromotionProgressCard.tsx
│       │   ├── PromotionTimeline.tsx         # NEW
│       │   ├── ConditionProgressBar.tsx
│       │   ├── LevelBadge.tsx
│       │   ├── SkillLevelBadge.tsx
│       │   ├── AchievementBadge.tsx
│       │   ├── BuddyStatusCard.tsx
│       │   ├── SmartSuggestionCard.tsx
│       │   ├── GoalCard.tsx                 # NEW
│       │   ├── OnboardingStepCard.tsx        # NEW
│       │   └── EndorsementDisplay.tsx        # NEW
│       ├── settings/ (16)
│       │   ├── LevelCard.tsx
│       │   ├── LevelForm.tsx
│       │   ├── SkillCard.tsx
│       │   ├── SkillForm.tsx
│       │   ├── EmployeeTypeCard.tsx
│       │   ├── EmployeeTypeForm.tsx
│       │   ├── PromotionConditionCard.tsx
│       │   ├── PromotionConditionForm.tsx
│       │   ├── BuddyRewardToggle.tsx
│       │   ├── TrialChecklistItem.tsx
│       │   ├── SettingsChangeLogItem.tsx
│       │   ├── TemplateCard.tsx
│       │   ├── OnboardingStepCard.tsx        # NEW
│       │   ├── OnboardingStepForm.tsx        # NEW
│       │   ├── SkillRefreshConfig.tsx        # NEW
│       │   └── ExportImportButtons.tsx       # NEW
│       ├── admin/ (10)
│       │   ├── PromotionRequestCard.tsx
│       │   ├── TypeChangeRequestCard.tsx
│       │   ├── ReviewDialog.tsx
│       │   ├── TrialEvaluationForm.tsx
│       │   ├── ManualSkillUnlockForm.tsx
│       │   ├── CareerReportSummary.tsx
│       │   ├── UpcomingPromotionsList.tsx
│       │   ├── WarningsList.tsx
│       │   ├── EndorsementReviewCard.tsx     # NEW
│       │   └── AnalyticsChart.tsx            # NEW
│       ├── leaderboard/ (5)
│       │   ├── LeaderboardPodium.tsx
│       │   ├── LeaderboardRow.tsx
│       │   ├── MyPositionCard.tsx
│       │   ├── CategoryTab.tsx
│       │   └── AchievementHighlight.tsx      # NEW
│       └── smart/ (4) — NEW
│           ├── SmartSuggestionBanner.tsx
│           ├── PredictionCard.tsx
│           ├── MentorMatchCard.tsx
│           └── PersonalizedTip.tsx
└── app/
    └── career-path/
        ├── page.tsx
        ├── skills/page.tsx
        ├── promotion/page.tsx
        ├── goals/page.tsx                    # NEW
        ├── onboarding/page.tsx               # NEW
        ├── leaderboard/page.tsx
        ├── notifications/page.tsx            # NEW
        ├── requests/page.tsx
        ├── trial/page.tsx
        ├── assign-skill/page.tsx
        ├── reports/page.tsx
        ├── endorsements/page.tsx             # NEW
        └── settings/
            ├── page.tsx
            ├── buddy/page.tsx
            ├── trial/page.tsx
            ├── templates/page.tsx
            ├── history/page.tsx
            └── onboarding/page.tsx           # NEW
```

---

## 4. Implementation Waves (7 waves)

| Wave | Focus                                        | Files | Duration |
| ---- | -------------------------------------------- | ----- | -------- |
| 1    | Foundation (types + mock + service + shared) | 8     | 1-2 days |
| 2    | Employee Pages (5 pages + 17 components)     | 22    | 2-3 days |
| 3    | Admin Settings (6 pages + 16 components)     | 22    | 2-3 days |
| 4    | Admin Management (5 pages + 10 components)   | 15    | 2 days   |
| 5    | Leaderboard + Integration                    | 10    | 1-2 days |
| 6    | Smart Features + Notifications               | 8     | 1-2 days |
| 7    | Polish + Verification                        | —     | 1 day    |

---

## 5. New Interfaces (v2 additions)

| Interface                 | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| `OnboardingStep`          | Steps in the onboarding flow (video/doc/quiz/task) |
| `EmployeeOnboarding`      | Employee's onboarding progress                     |
| `CareerGoal`              | Employee-set goals (skill/level/custom)            |
| `SkillEndorsement`        | Manager endorsement of employee skills             |
| `SkillRefreshConfig`      | Skill expiry configuration                         |
| `SkillRefreshRecord`      | Tracking skill refresh status                      |
| `CrossTrainingRecord`     | Cross-store training tracking                      |
| `CareerNotificationPrefs` | Per-employee notification preferences              |
| `CareerAnalytics`         | Store-level career analytics                       |

---

## 6. Integration Points

### Employee Model Extension

```typescript
employee_type: EmployeeType;
current_level_id: string;
level_started_at: string;
hired_at: string;
```

### Navigation (More page)

- 🎯 Lộ trình thăng tiến → /career-path
- 🏆 Bảng vinh danh → /career-path/leaderboard
- 🎯 Mục tiêu → /career-path/goals
- ⚙️ Cài đặt lộ trình → /career-path/settings (admin)
- 📋 Yêu cầu chờ duyệt → /career-path/requests (admin, badge)

### Dashboard Widgets

- EmployeeDashboard: Career progress mini card + goal reminder
- ManagerDashboard: Pending requests + trial alerts + team skills
- AdminDashboard: System overview + analytics summary

### Cross-references

- KPI service for `avg_kpi_3_months`
- Attendance for `months_worked`
- `mockEmployees` for employee base data

---

## 7. Persistence Pattern

localStorage with same pattern as KPI module. Storage keys:

```
career_levels, career_skills, career_employee_skills, career_settings,
career_requests, career_buddy_assignments, career_trial_evaluations,
career_change_logs, career_onboarding, career_goals, career_endorsements,
career_refresh_records, career_cross_training, career_notification_prefs
```
