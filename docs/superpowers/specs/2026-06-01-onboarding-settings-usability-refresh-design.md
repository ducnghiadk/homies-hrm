# Onboarding Settings Usability Refresh Design

## 1. Goal

Make `Cấu hình onboarding` understandable and usable for HR on first open.

Current page reads like system config panel:
- three different jobs mixed on one screen
- technical wording (`mapping`, `template`, `duplicate`) dominates business wording
- role setup and checklist setup are separated, forcing users to compare across long sections
- dense checkbox grid makes scanning and editing hard

Target outcome:
- HR can tell what needs attention within 5 seconds
- each onboarding role is managed as one complete unit
- common edits require less scrolling and less cross-referencing

## 2. Primary User

Primary user:
- HR / training staff configuring onboarding

Secondary user:
- system admin reviewing edge cases

Design bias:
- optimize for clarity first
- preserve enough power for admin users without exposing technical structure as main IA

## 3. Scope

In scope:
- restructure `Cấu hình onboarding` page IA and copy
- move from section-by-technical-domain to section-by-user-task
- merge role and checklist assignment into same role card flow
- reduce visual density in position mapping controls
- improve save state and exception visibility

Out of scope:
- changing underlying route structure
- changing onboarding role resolver model
- changing template entity model
- adding brand new backend capabilities

## 4. Chosen Approach

Chosen direction: single-page `task-first` redesign.

Why this approach:
- easier for HR than current config layout
- lower implementation risk than full wizard flow
- keeps current route and data model intact
- lets admin still scan whole setup on one page

Rejected alternatives:
- full 3-step wizard: best for new users, but slower for frequent edits and bigger flow rewrite
- moving all exceptions out of settings: cleaner IA, but weakens fix-in-place workflow

## 5. Information Architecture

New page order:

1. Header and summary status
2. `Cần xử lý ngay`
3. Role filters and search
4. `Thiết lập nhóm onboarding`
5. Optional compact checklist audit table
6. Sticky save bar

Principle:
- show problem first
- show editable unit second
- hide low-frequency detail until user asks for it

## 6. Header and Summary

### 6.1 Header

Replace repeated title block with:

- Title: `Cấu hình onboarding cho nhân sự mới`
- Subtitle: `Thiết lập nhóm onboarding, checklist áp dụng và xử lý lỗi cấu hình trước ngày vào làm.`

Remove duplicated heading text and garbled characters.

### 6.2 Summary bar

Keep four summary metrics, but each must be actionable.

Metrics:
- `Role đang dùng`
- `Role thiếu checklist`
- `Chức danh bị gán trùng`
- `Nhân viên chưa khớp role`

Interaction:
- clicking metric scrolls or jumps to related block
- metrics use business color semantics: neutral, warning, danger

## 7. Priority Block: `Cần xử lý ngay`

Rename `Ngoại lệ cần xử lý` to `Cần xử lý ngay`.

Each item in block must include:
- count
- one-sentence business explanation
- CTA to exact place to fix

Initial items:
- `Nhân viên chưa khớp role`
- `Role đang bật nhưng chưa có checklist`
- `Chức danh bị gán trùng`

Rules:
- if count is `0`, row still appears but with resolved styling or can collapse into `Không có lỗi cần xử lý`
- if any count is greater than `0`, this block stays above editing area

Example copy:
- `2 nhân viên cần kiểm tra chức danh để gán đúng lộ trình onboarding.`
- `1 role chưa thể dùng vì chưa gán checklist.`
- `1 chức danh đang nằm ở nhiều role onboarding.`

## 8. Main Editing Model

### 8.1 Core change

Current screen splits role mapping and checklist assignment into separate sections.

New model:
- each role is edited in one card
- card contains role status, role label, mapped positions, and assigned checklist

This removes cross-reference burden.

### 8.2 Role card structure

Each role card shows:
- role display name as main title
- small metadata: role code and sort order
- status badge: `Đang bật` or `Đang tắt`
- checklist state summary
- mapped position count
- inline warnings for that role

Primary actions on card:
- `Bật` / `Tắt`
- `Đổi checklist`
- `Mở chi tiết`

Default behavior:
- card is compact by default
- position mapping editor stays collapsed until expanded

### 8.3 Role card warnings

Warnings appear inside related card, not only in global block.

Supported warnings:
- missing checklist
- blank display label
- duplicate position assignment

Warning copy must explain effect, not only rule violation.

Example:
- `Role này đang bật nhưng chưa có checklist, nên nhân viên mới sẽ không nhận đúng danh sách việc cần làm.`

## 9. Position Mapping UX

Current multi-column checkbox wall is too dense.

Replace with lighter interaction:
- collapsed by default
- add search input: `Tìm chức danh`
- add quick filters: `Tất cả`, `Đã gán`, `Chưa gán`, `Đang trùng`
- show positions in vertical list or responsive two-column list, not wide matrix of equal cards

Each position row shows:
- position display name with diacritics
- small position code
- current assignment state if relevant

Selection behavior:
- checkbox remains acceptable for current data model
- interaction should prioritize scan speed over card decoration

## 10. Checklist Assignment UX

Checklist assignment moves into same role card as mapping.

Visible in compact card state:
- current checklist name or `Chưa có checklist`
- template version if available

Expanded editing state:
- select input for active templates
- missing-template warning directly under field

Optional secondary section:
- compact audit table listing all roles and current checklist
- include only if product still needs top-level checklist scan view
- do not duplicate full role cards again in separate section

## 11. Copy Changes

Prefer business wording over system wording.

Copy replacements:
- `Ngoại lệ cần xử lý` -> `Cần xử lý ngay`
- `Role onboarding` -> `Nhóm onboarding` or keep `Role onboarding` only if product terminology already locked elsewhere
- `Template checklist` -> `Checklist áp dụng`
- `Mapping xung đột` -> `Chức danh bị gán trùng`
- `Nhân viên chưa khớp role` -> `Nhân viên chưa xác định đúng nhóm onboarding`
- `Lưu cấu hình` -> `Lưu thay đổi`

Copy rule:
- if technical id is needed, show it as supporting metadata only
- business label always leads

## 12. Save and Feedback States

Add persistent save state near primary action.

Required states:
- `Chưa có thay đổi`
- `Đã chỉnh sửa, chưa lưu`
- `Đang lưu...`
- `Đã lưu lúc HH:MM`

Save action behavior:
- primary save action remains visible at all times on desktop
- sticky footer or sticky top action area acceptable

Source conflict handling:
- disable save when source conflict is detected
- show blocking warning with explicit reload CTA
- message: `Dữ liệu đã thay đổi ở nguồn khác. Tải lại trước khi tiếp tục.`

## 13. Responsive Behavior

Desktop:
- summary cards can stay in 4-column grid
- role cards use split layout for metadata vs actions

Mobile / narrow width:
- summary becomes 2-column or 1-column stack
- role actions stack below content
- expanded mapping list stays single-column
- avoid horizontal scroll for position selection

## 14. Empty, Loading, and Error States

### 14.1 Empty states

When no current issues:
- show positive resolved block: `Hiện chưa có lỗi cấu hình cần xử lý.`

When no positions match current search:
- show `Không tìm thấy chức danh phù hợp.`

### 14.2 Loading states

- use lightweight skeleton rows/cards
- do not show long paragraphs while loading

### 14.3 Error states

- global save error appears once near top action area
- role-level validation stays in related card
- garbled encoding text must be eliminated entirely

## 15. Implementation Notes

Expected code impact:
- refactor settings tab rendering in `src/app/career-path/settings/page.tsx`
- likely extract reusable components for summary, urgent issues, and role cards
- keep existing services and validation flows where possible

Suggested component boundaries:
- summary bar
- urgent issues panel
- role list filters
- role card
- compact checklist audit table if retained

## 16. Success Criteria

Design is successful if:
- HR can identify first action from top of page without reading whole screen
- each role can be reviewed and edited without scrolling between separate sections
- page feels shorter and less technical even with same data volume
- warning states explain business impact clearly
