# PRD — Career Path Module (v3)

## 1. Tổng quan

Hệ thống Lộ trình Thăng tiến linh hoạt cho Startup Trà sữa Take-away. Admin tùy chỉnh hoàn toàn: cấp bậc, kỹ năng, điều kiện thăng tiến. Hỗ trợ Part-time & Full-time với Skill Unlock, Buddy System (không thưởng tiền), và Leaderboard.

### Nguyên tắc thiết kế

- MỌI THỨ ĐỀU CÓ THỂ TÙY CHỈNH qua Admin Settings
- Mobile-first (375px+)
- TypeScript strict, no external chart libraries (SVG/CSS only)
- Sử dụng shared UI components có sẵn

---

## 2. Cấp bậc mặc định

```
🌱 THỬ VIỆC (2-4 tuần)
     ↓
☕ NHÂN VIÊN [Skill Level 1 → 2 → 3]
     ↓
⭐ TRỢ LÝ QUẢN LÝ (mặc định TẮT)
     ↓
👔 QUẢN LÝ (khi mở chi nhánh mới)
```

---

## 3. User Stories & Requirements

### [REQ-CP-001] Quản lý Cấp bậc (Admin)

**As** Admin, **I want** to CRUD career levels (thêm/sửa/xóa/bật/tắt/reorder) **so that** I can customize the promotion path.

**Acceptance Criteria:**

- **Given** Admin ở Settings/Cấp bậc tab **When** bấm "Thêm cấp bậc" **Then** hiện form dialog với name, icon, description, applicable_employee_types
- **Given** level đang có employees **When** Admin xóa **Then** từ chối và hiện thông báo lỗi
- **Given** Admin drag-drop levels **When** thả **Then** reorder được lưu ngay

### [REQ-CP-002] Quản lý Kỹ năng (Admin)

**As** Admin, **I want** to CRUD skills với điều kiện mở khóa **so that** employees biết cần gì để unlock.

**Acceptance Criteria:**

- **Given** skill form **When** chọn required_skill_ids **Then** validate không có circular dependency
- **Given** skill có prerequisite skills **When** hiển thị **Then** hiện dependency tree
- 3 groups: basic (4), advanced (8), management (6) = 18 skills mặc định

### [REQ-CP-003] Skill Unlock (Employee)

**As** Employee, **I want** to see my skill tree và unlock eligible skills **so that** I progress in my career.

**Acceptance Criteria:**

- **Given** employee đủ điều kiện (months, KPI, prerequisites) **When** bấm "Mở khóa" **Then** skill chuyển sang unlocked (hoặc pending nếu requires_approval)
- **Given** skill locked **When** xem detail **Then** hiện rõ điều kiện chưa đạt
- **Given** skill unlocked **When** đếm advanced skills **Then** tính skill level (1/2/3)

### [REQ-CP-004] Skill Level System

**As** Employee, **I want** to see my skill level (1-2-3) based on advanced skills unlocked.

**Acceptance Criteria:**

- Level 1: 0-4 advanced skills
- Level 2: 5-7 advanced skills
- Level 3: 8+ advanced skills
- **Given** employee unlocks enough skills **When** threshold met **Then** auto-upgrade skill level

### [REQ-CP-005] Điều kiện Thăng tiến (Admin)

**As** Admin, **I want** to configure promotion conditions between levels **so that** criteria are transparent.

**Acceptance Criteria:**

- Thử việc → NV: 14-30 ngày, 80% menu, mentor xác nhận
- NV → Trợ lý QL: 6 tháng, KPI >85%, Skill Level 3, train 2 người
- NV/TL → Quản lý: 12 tháng, KPI >90%, train 5 người, chi nhánh mới

### [REQ-CP-006] Promotion Request (Employee)

**As** Employee, **I want** to request promotion when eligible **so that** I can advance.

**Acceptance Criteria:**

- **Given** all conditions met **When** bấm "Yêu cầu thăng tiến" **Then** request created with status=pending
- **Given** pending request **When** Admin approves **Then** level updated, notification sent
- **Given** request rejected **When** view **Then** hiện review_note

### [REQ-CP-007] Part-time / Full-time Policies

**As** Admin, **I want** to set different policies for PT/FT employees **so that** career paths are appropriate.

**Acceptance Criteria:**

- Part-time: max Nhân viên, max Skill Level 2 (default, có thể tắt)
- **Given** PT hits limit **When** view career page **Then** hiện message khuyến khích (not blocking)
- **Given** PT wants FT **When** submit type change request **Then** Admin review

### [REQ-CP-008] Type Change Request

**As** Part-time Employee, **I want** to request conversion to Full-time **so that** I can unlock more career options.

**Acceptance Criteria:**

- **Given** type change request **When** Admin approves **Then** employee_type updated, limits removed
- Show current stats (months worked, KPI, skill level) in request

### [REQ-CP-009] Buddy System (Admin + Employee)

**As** Admin, **I want** to assign mentors to new hires **so that** onboarding is smooth.

**Acceptance Criteria:**

- Admin assigns mentor to mentee
- Mentor tracks mentee progress
- **Given** mentee passes trial **When** assignment completes **Then** give buddy rewards to mentor
- Rewards: badge, +10 skill points, priority shift selection, "Đã train X người" badge
- NO monetary rewards

### [REQ-CP-010] Trial Evaluation

**As** Mentor/Admin, **I want** to evaluate trial employees with checklist **so that** decisions are consistent.

**Acceptance Criteria:**

- 5 checklist items: Pha 80% menu, POS thành thạo, Không lỗi nghiêm trọng, Giao tiếp tốt, Vệ sinh
- Result: Pass / Extend (+ days) / Fail
- **Given** trial expiring in 3 days **When** check notifications **Then** alert shown

### [REQ-CP-011] Leaderboard

**As** Employee, **I want** to see the leaderboard **so that** I'm motivated.

**Acceptance Criteria:**

- Categories: top_mentor, streak, skill_unlock, drinks_made
- Top 3 podium (animated), full list, my position highlight
- Period selector

### [REQ-CP-012] Career Progress Dashboard (Employee)

**As** Employee, **I want** to see my career progress at a glance.

**Acceptance Criteria:**

- Current level + icon
- Next level conditions with progress bars
- Skill tree preview
- Smart suggestions ("Mở thêm 2 kỹ năng nâng cao để lên Skill Level 2")
- Buddy status if mentoring

### [REQ-CP-013] Admin Reports

**As** Admin, **I want** career path reports **so that** I can make informed decisions.

**Acceptance Criteria:**

- Summary cards (by level, by type, skills unlocked)
- Upcoming promotions list
- Warnings (trial expiring, inactive employees)
- Period + store selector

### [REQ-CP-014] Templates

**As** Admin, **I want** to save current config as template **so that** I can clone for new branches.

**Acceptance Criteria:**

- Create from current config (levels + skills + conditions + rewards)
- Preview before apply
- Apply to override current config

### [REQ-CP-015] Settings Change History

**As** Admin, **I want** to see change history and revert if needed.

**Acceptance Criteria:**

- Log all CRUD operations on career settings
- Show old/new values
- Revert button (1-click undo)

### [REQ-CP-016] Manual Skill Unlock (Admin)

**As** Admin, **I want** to manually unlock skills for employees **so that** I handle exceptions.

**Acceptance Criteria:**

- Select employee → select skill → enter reason → confirm
- Logged in change history
- Marked as `is_manual_unlock`

### [REQ-CP-017] Smart Suggestions

**As** Employee, **I want** AI-like suggestions **so that** I know what to do next.

**Acceptance Criteria:**

- "Mở thêm 2 kỹ năng nâng cao để lên Skill Level 2"
- "KPI 3 tháng đạt 87%, gần đủ điều kiện thăng tiến (cần 90%)"
- "Bạn đã train 1 người, train thêm 1 người nữa để đủ điều kiện QL"

---

## 4. Data Models

> Đầy đủ 25+ interfaces đã được user cung cấp trong spec. Xem `src/lib/types/career-path.ts`.

Key entities: CareerLevel, Skill, EmployeeSkill, EmployeeTypeConfig, SkillLevelConfig, PromotionCondition, PromotionRequest, TypeChangeRequest, BuddyAssignment, BuddyRewardConfig, TrialEvaluation, TrialChecklistItem, SettingsChangeLog, CareerPathTemplate, CareerPathSettings, EmployeeCareerProgress, CareerPathReport, LeaderboardEntry.

---

## 5. Non-functional Requirements

- **Performance**: Render < 200ms trên mobile 4G
- **Responsive**: 375px – 1440px, mobile-first
- **Persistence**: localStorage (giống KPI module pattern)
- **TypeScript**: strict mode, tsc --noEmit phải pass
- **Build**: next build phải pass
- **No external chart libs**: SVG thuần hoặc CSS
