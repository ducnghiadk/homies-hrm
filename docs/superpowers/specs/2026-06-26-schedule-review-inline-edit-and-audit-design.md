# Schedule Review Inline Edit And Audit Design

Date: 2026-06-26
Topic: Add manager review page that turns employee shift registrations into draft schedule assignments, supports inline manual edits, and records detailed audit logs before publish.

## 1. Goal

Extend weekly schedule-registration flow so manager can review employee registrations, edit them directly on review page, and publish final work schedule with full traceability.

System must support this sequence:

1. Employee submits weekly shift registrations.
2. Manager opens review page for target store and week.
3. Manager bulk-copies registrations into draft schedule assignments.
4. Manager adjusts draft inline inside review grid.
5. Every draft change is logged.
6. Manager publishes final work schedule.
7. Published schedule becomes employee-visible truth.

## 2. Scope

Included in this design:

- manager review page as main approval surface
- inline edit of draft schedule before publish
- draft edit audit log per manual change
- approval log at publish time
- separation between registration data, draft schedule data, and published schedule data
- published schedule visibility in final work-schedule screens

Explicitly out of scope for this iteration:

- rollback workflow from audit log
- multi-shift-per-day support
- required reason for every draft edit before publish
- advanced automatic assignment engine
- multi-store approval in one action

## 3. Users And Permissions

### 3.1. Employee

Can:

- register preferred shifts for open week
- edit registration before deadline
- view published final schedule only

Cannot:

- edit manager draft schedule
- view unpublished draft schedule
- view draft audit log

### 3.2. Store Manager / Admin

Can:

- open review week
- bulk-approve registrations into draft assignments
- add, replace, or remove draft assignments inline
- view audit log of draft changes
- publish final weekly schedule
- view summary of differences between registrations and final schedule

## 4. Recommended Approach

Recommended approach: keep review inside existing `/schedule/admin/review` page and strengthen that page into one approval workspace.

Why:

- matches real manager workflow of scanning one weekly board and making many quick edits
- preserves clear separation between registration and final schedule truth
- avoids extra navigation to a second draft editor screen
- fits current codebase direction and existing manager review route

Alternative approaches considered:

1. Separate draft editor page
   - cleaner boundary
   - worse speed and more context switching

2. Review directly in final schedule board only
   - simpler route model
   - blurs line between employee request, manager draft, and published truth

## 5. Data Layers

System keeps three distinct truth layers:

1. `ShiftRegistration`
   - employee request layer
   - preserved for comparison

2. `ScheduleAssignment` with `status = draft`
   - manager working layer during review
   - may differ from registration

3. `ScheduleAssignment` with `status = published`
   - final employee-visible work schedule
   - authoritative after publish

This separation is intentional and not considered drift.

## 6. Data Model

### 6.1. RegistrationWeek

Represents weekly cycle.

Fields already relevant:

- `id`
- `store_id`
- `week_start_date`
- `week_end_date`
- `status: closed | open | reviewing | published`
- `published_at`
- `published_by`

Rule:

- once status becomes `reviewing`, employee registration becomes read-only and manager owns draft process

### 6.2. ShiftRegistration

Represents employee proposal.

Important rule:

- registration remains source reference only and never becomes final schedule truth automatically

### 6.3. ScheduleAssignment

Represents draft or published assignment.

Fields:

- `id`
- `schedule_week_id`
- `employee_id`
- `store_id`
- `date`
- `shift_id`
- `status: draft | published | cancelled`
- `source_registration_id` optional
- `modified_after_publish`
- `change_reason` optional
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

Rules:

- manager edits review board by creating, updating, or removing `draft` rows
- publish converts active draft rows into `published` rows
- `source_registration_id` preserves traceability back to employee request when applicable

### 6.4. ScheduleEditLog

Represents every draft edit made during review.

Fields:

- `id`
- `schedule_week_id`
- `assignment_id` optional
- `employee_id`
- `date`
- `action: create | update | remove | approve_from_registration`
- `source: registration_review | published_schedule_edit`
- `before_state`
- `after_state`
- `changed_by`
- `changed_at`
- `reason` optional

Purpose:

- capture each draft mutation before publish
- explain how manager changed employee request before final approval
- provide foundation for future history drawer and rollback tooling

### 6.5. ScheduleApprovalLog

Represents publish-time approval event.

Fields:

- `id`
- `schedule_week_id`
- `registration_week_id`
- `approved_by`
- `approved_at`
- `draft_change_count`
- `approved_assignment_count`
- `notes` optional
- `snapshot`

Recommended `snapshot` contents:

- total registrations
- assignments copied directly from registration
- assignments changed manually after copy
- registrations skipped from final draft
- final published assignment count

Purpose:

- mark approval checkpoint
- summarize approval decision in one record
- complement detailed edit log rather than replace it

## 7. Audit Rules

### 7.1. Bulk Approval

When manager clicks `Duyet tat ca theo dang ky`:

- system copies valid registrations into draft assignments
- each copied row creates one `ScheduleEditLog` with `action = approve_from_registration`
- copied draft assignments keep `source_registration_id`

### 7.2. Inline Draft Edit

When manager changes draft inside review grid:

- add employee to shift -> log `create`
- replace shift -> log `update`
- remove draft assignment -> log `remove`

Each log stores compact `before_state` and `after_state` snapshots.

### 7.3. Publish

When manager clicks `Duyet lich lam viec` or `Publish lich`:

- system validates blocking conflicts first
- system creates one `ScheduleApprovalLog`
- system converts draft assignments to published assignments
- system updates `RegistrationWeek.status` and schedule-week status to `published`

Important rule:

- publish creates summary approval log but does not replace per-edit logs

### 7.4. Post-Publish Edit

For future or existing post-publish edits:

- require reason
- reuse `ScheduleEditLog` with `source = published_schedule_edit`
- continue to treat published changes as higher-control actions

## 8. Screen Design

### 8.1. Review Page Role

Route: `/schedule/admin/review`

Purpose:

- one primary manager surface to compare employee registrations, adjust draft schedule, inspect change history, and publish final schedule

### 8.2. Top Controls

Show at top:

- store selector when role permits
- week selector
- cycle status badge
- summary counts for registrations, draft assignments, skipped items, and unassigned demand

Primary actions:

- `Duyet tat ca theo dang ky`
- `Xem log`
- `Duyet lich lam viec` or `Publish lich`

### 8.3. Review Grid

Recommended visual model:

- layout remains weekly board for fast scanning
- each cell shows two layers:
  - registration chip in lighter tone
  - draft schedule chip in stronger tone

If draft differs from registration:

- show small `Da sua` or equivalent edited indicator

This is critical so manager sees both employee intent and final draft at once.

### 8.4. Inline Editing

Default interaction:

- click cell to open quick inline editor
- manager can add, replace, or remove draft assignment without leaving board

Quick editor supports:

- choose valid employee or shift option for that cell context
- clear current draft assignment
- close without change

Complex operations may still open drawer later, but routine review should remain inline-first.

### 8.5. Log Drawer

`Xem log` opens right-side drawer.

Drawer shows:

- total change count
- latest actor and timestamp
- list of edit logs in reverse chronological order
- compact before/after change preview
- simple filter by action type

Reasoning:

- preserves clean board layout
- keeps audit information close to workflow without requiring route switch

## 9. Interaction Flow

Normal manager flow:

1. Open target review week.
2. Scan registration and staffing summary.
3. Click `Duyet tat ca theo dang ky` to create base draft.
4. Adjust exceptions inline.
5. Open log drawer if needed.
6. Publish final weekly schedule.

This flow prioritizes speed while preserving traceability.

## 10. Validation Rules

### 10.1. Draft Edit Blocking Rules

Block when:

- employee is inactive or out of store scope
- same employee gets overlapping same-day assignment
- target shift or date cannot be resolved

### 10.2. Draft Edit Warning Rules

Warn when:

- draft diverges from employee registration
- staffing remains under quota
- staffing exceeds quota
- registration remains unapproved

Warnings should not automatically block draft editing unless business later tightens policy.

### 10.3. Publish Rules

Block publish when:

- hard assignment conflicts still exist
- schedule week cannot be resolved

Warn but allow confirmation when:

- quota remains underfilled or overfilled
- some registrations were skipped
- some cells remain unassigned

## 11. Visibility Rules

- employee-facing schedule screens read published assignments only
- employee never sees draft assignments or draft audit logs
- manager can compare registration and draft during review
- history screens can later consume both `ScheduleEditLog` and `ScheduleApprovalLog`

## 12. UX Decisions

### 12.1. Why Inline First

Review board is high-frequency operational UI. Requiring popup-only editing for every change would slow managers down. Inline edit keeps weekly review fast and close to spreadsheet-like mental model.

### 12.2. Why Drawer For Logs

Audit detail is important but secondary to scheduling task. Drawer keeps board readable while making history available on demand.

### 12.3. Why No Mandatory Draft Reason Yet

For pre-publish edits, speed matters more than formal justification. Detailed audit log already captures who changed what and when. Mandatory reasons should stay reserved for post-publish edits unless business later needs stricter controls.

## 13. Codebase Mapping

Likely first implementation points:

- `src/app/schedule/admin/review/page.tsx`
- `src/lib/mock-data-schedule-weeks.ts`
- `src/lib/mock-data-shift-registrations.ts`
- employee-visible published schedule consumers under `src/app/schedules/` or existing schedule views

Implementation should prefer extending current mock/service layer rather than introducing separate parallel state model.

## 14. Risks And Mitigations

Risk: manager confuses registration chip with final draft chip.

Mitigation:

- keep strong visual distinction
- include top legend
- mark diverged cells clearly

Risk: audit log becomes noisy after bulk approval.

Mitigation:

- support filter by action type
- surface summary counts above list

Risk: draft and published queries leak into employee view.

Mitigation:

- employee routes must read published assignments only
- do not reuse review query directly in employee screens

## 15. Acceptance Criteria

- manager can open review page for one store and target week
- manager can bulk-copy employee registrations into draft assignments
- manager can edit draft assignments inline on same review page
- every draft change creates audit log entry
- manager can open log drawer and inspect change history
- publish creates summary approval log
- published schedule becomes employee-visible truth
- employee still cannot see draft review state

## 16. Final Decision

Chosen design:

- keep `/schedule/admin/review` as primary review-and-approval workspace
- support inline draft editing directly in weekly board
- log every draft mutation in detailed edit log
- create approval summary log at publish time
- maintain strict separation between employee registration, manager draft, and published work schedule
