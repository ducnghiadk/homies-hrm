# Weekly Schedule Registration Approval Design

Date: 2026-06-23
Topic: Weekly shift registration where employees propose concrete shifts and admins review, adjust, then publish final weekly schedule.

## 1. Goal

Build weekly scheduling flow with clear separation between:

- employee shift proposals
- admin draft review and adjustment
- published final schedule

System must support this sequence:

1. Admin opens registration for one store and one target week.
2. Employees register specific desired shifts for each day in that week.
3. Admin reviews registrations, edits freely, and prepares draft final assignments.
4. Admin publishes final weekly schedule.
5. Employees only see published schedule, not admin draft.

This feature intentionally treats employee registrations as soft proposals rather than commitments.

## 2. Scope

Included in this design:

- one registration period per store per target week
- employee registration of one concrete shift per day
- admin review board that shows both registrations and draft assignments
- bulk action to approve registrations into draft assignments
- final publish flow for weekly schedule
- employee view of published schedule only
- post-publish schedule edits with required reason and audit trail

Explicitly out of scope for this iteration:

- multiple shifts per employee per day
- per-registration rejection reasons
- advanced AI assignment logic
- cross-store scheduling
- complex shift swap workflows

## 3. Users And Permissions

### 3.1. Employee

Can:

- view open registration week for own store
- register one desired shift per day
- edit or remove own registration before deadline
- view only published final schedule in personal schedule screens

Cannot:

- publish schedule
- edit admin draft schedule
- view unpublished admin draft assignments

### 3.2. Store Manager / Admin

Can:

- create and configure registration week
- define per-shift quota by day
- close registration and move week into review
- review registrations
- create and edit final draft assignments freely
- bulk approve registrations into draft assignments
- publish weekly schedule
- edit published schedule with change reason
- view change history

## 4. Recommended Architecture

Recommended approach: separate registration data from final schedule data.

Why:

- avoids mixing employee intent with final schedule truth
- keeps draft versus published behavior clear
- makes publish and post-publish audit easier
- supports future automation without losing original employee requests

Core data layers:

1. Registration layer
2. Draft/final schedule layer
3. Publish/change-log layer

## 5. Data Model

### 5.1. RegistrationWeek

Represents one store's weekly registration cycle.

Fields:

- `id`
- `org_id`
- `store_id`
- `week_start_date`
- `week_end_date`
- `status`: `closed | open | reviewing | published`
- `registration_open_date`
- `registration_deadline`
- `published_at`
- `published_by`
- `created_by`
- `created_at`
- `updated_at`

Meaning of statuses:

- `closed`: draft setup exists but employees cannot register yet
- `open`: employees can submit or edit registrations
- `reviewing`: registration is locked, admin is building final draft schedule
- `published`: final schedule is published for employee visibility

### 5.2. ShiftQuota

Represents staffing target for one shift on one day.

Fields:

- `id`
- `registration_week_id`
- `shift_id`
- `date`
- `position_id` optional
- `min_staff`
- `max_staff`
- `notes`

### 5.3. ShiftRegistration

Represents one employee proposal for one concrete shift on one day.

Fields:

- `id`
- `registration_week_id`
- `employee_id`
- `store_id`
- `date`
- `shift_id`
- `status`: `submitted | withdrawn`
- `submitted_at`
- `updated_at`
- `notes` optional

Constraints:

- max one active registration per employee per day in this iteration
- registration belongs to same store as registration week

Important rule:

- `ShiftRegistration` is never final schedule truth by itself

### 5.4. ScheduleWeek

Represents final admin-managed schedule container for one store and week.

Fields:

- `id`
- `registration_week_id`
- `store_id`
- `week_start`
- `week_end`
- `status`: `draft | published`
- `published_at`
- `published_by`
- `notes`
- `created_at`
- `updated_at`

### 5.5. ScheduleAssignment

Represents one final or draft assignment line for one employee on one day.

Fields:

- `id`
- `schedule_week_id`
- `employee_id`
- `store_id`
- `date`
- `shift_id`
- `status`: `draft | published | cancelled`
- `source_registration_id` optional
- `modified_after_publish`
- `change_reason` optional
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

Purpose of `source_registration_id`:

- indicates assignment came from employee registration originally
- keeps review traceability without making registration authoritative

### 5.6. ScheduleChangeLog

Represents audit trail for changes after publish.

Fields:

- `id`
- `assignment_id`
- `action`: `create | update | cancel | delete`
- `before_state`
- `after_state`
- `changed_by`
- `changed_at`
- `reason`

## 6. State Flow

High-level lifecycle:

1. Admin creates `RegistrationWeek` and `ShiftQuota`.
2. Week moves to `open`.
3. Employees submit `ShiftRegistration` rows.
4. Deadline passes or admin closes registration.
5. Week moves to `reviewing`.
6. Admin creates or updates `ScheduleWeek` in `draft` state.
7. Admin approves, changes, or removes draft assignments.
8. Admin publishes week.
9. Employees see only published `ScheduleAssignment` rows.

Key state boundaries:

- employee action stops at `ShiftRegistration`
- admin draft lives in `ScheduleAssignment` with `ScheduleWeek.status = draft`
- employee-visible truth starts only at published schedule

## 7. Screen Design

### 7.1. `/schedule/admin/registration`

Purpose:

- prepare one weekly registration cycle
- configure quota targets before employees register

Main sections:

- week selector or create-week form
- registration open date
- registration deadline
- per-day and per-shift quota matrix
- actions: `Save draft`, `Open registration`

Behavior:

- `Save draft` keeps week `closed`
- `Open registration` moves week to `open`
- once `open`, employees can begin shift registration

### 7.2. `/schedule/preferences`

Purpose:

- employee selects concrete desired shifts for each day of open week

Main behavior:

- each day allows `0 or 1` selected shift
- employee may clear previously selected shift before deadline
- after deadline or when week leaves `open`, form becomes read-only

UI outcome:

- registration is framed as desired shift, not confirmed schedule
- copy should make soft-proposal meaning explicit

### 7.3. `/schedule/admin/review`

Purpose:

- admin compares employee registrations against staffing quota and builds final draft schedule

Grid model:

- rows: employees
- columns: seven days
- each cell shows two layers when available:
  - `Registration`: employee requested shift, shown as lighter chip or secondary indicator
  - `Draft assignment`: current admin-selected final draft shift, shown as stronger primary chip

This dual-layer display is essential so admin can distinguish what employee asked for from what admin currently intends to publish.

Cell actions:

- approve requested shift into draft assignment
- replace with different shift
- clear draft assignment
- leave registration visible but unapproved

Recommended bulk action:

- `Approve all by registration`

Bulk action behavior:

- copies all valid registrations into draft assignments
- respects hard blocking rules
- leaves warnings for later manual cleanup

Footer or summary panel:

- total registrations
- total draft assignments
- unassigned cells
- quota warnings
- registrations skipped by final draft

### 7.4. `/my-schedule`

Purpose:

- employee views published final schedule only

Behavior:

- reads from published `ScheduleAssignment`
- does not expose registrations or admin draft state
- shows `New update` style badge when assignment changed after publish

### 7.5. `/schedules/history`

Purpose:

- admin and HR review post-publish modifications

Behavior:

- filters by store, date, employee, actor, action type
- shows before/after shift state and change reason

## 8. Detailed Business Rules

### 8.1. Employee Registration Rules

- employee can register only when `RegistrationWeek.status = open`
- employee must belong to same store as registration week
- employee can select at most one shift per day
- employee can edit or remove registration before deadline
- employee cannot register for inactive or unavailable store context

### 8.2. Admin Review Rules

- admin can freely change or remove proposed shifts before publish
- employee registration is advisory only
- one employee can have at most one final assignment per day in this iteration
- admin cannot assign inactive or resigned employees
- admin cannot assign employees outside allowed store scope
- overlapping same-day assignments are blocked

### 8.3. Quota Rules

- assigned count below `min_staff` is warning
- assigned count above `max_staff` is warning
- warning does not automatically block publish unless business later decides otherwise

### 8.4. Visibility Rules

- employees never see `ScheduleWeek.status = draft`
- employees see only published assignments
- admin can always see registration and draft state

## 9. Validation Model

### 9.1. Registration Validation

Block when:

- registration week is not `open`
- employee is not in same store as week
- employee tries to submit more than one shift in same day
- employee submits after deadline

Allow but record normally when:

- employee leaves a day empty

### 9.2. Review Validation

Block when:

- employee is inactive or resigned
- employee belongs to different store and is not eligible for assignment scope
- assignment causes overlapping same-day shift conflict

Warn when:

- shift remains under `min_staff`
- shift exceeds `max_staff`
- final draft diverges from employee registration
- week still has many unassigned demand slots

### 9.3. Publish Validation

Block publish when:

- blocking assignment violations still exist
- target week or schedule container cannot be resolved

Warn but still allow confirmation when:

- quota underfilled or overfilled
- many employee registrations were skipped
- some days remain unassigned

## 10. Publish Behavior

When admin publishes:

1. Resolve or create `ScheduleWeek` for target registration week.
2. Set `ScheduleWeek.status = published`.
3. Convert all active draft `ScheduleAssignment` rows to `published`.
4. Set `RegistrationWeek.status = published`.
5. Persist `published_at` and `published_by`.
6. Notify affected employees.
7. Expose published assignments to employee schedule screens.

Important publish principle:

- published schedule is separate truth layer; it is not reconstructed live from registrations afterward

## 11. Post-Publish Editing

After publish, admin may still edit final schedule, but changes require stronger controls.

Required behavior:

- change modal must require `change_reason`
- assignment sets `modified_after_publish = true`
- system writes `ScheduleChangeLog`
- employee sees updated published schedule and update badge

Supported post-publish actions:

- replace assigned shift
- cancel assigned shift
- add newly assigned shift for previously empty day

## 12. UX Notes

### 12.1. Employee Copy

Copy should clearly say registration is request only.

Suggested meaning:

- employee is choosing preferred shift
- manager will review and publish final schedule later

### 12.2. Review Grid Readability

Do not collapse registration and final draft into one ambiguous marker.

Admin must be able to understand in one glance:

- what employee requested
- what final draft currently contains
- whether staffing quota is healthy

### 12.3. Bulk Approval

`Approve all by registration` should exist because it matches real workflow:

- take employee registrations as base draft
- manually fix exceptions afterward

This is especially useful because registrations are soft proposals rather than binding commitments.

## 13. Delivery Scope For First Implementation

Phase 1 should include:

1. weekly registration setup by admin
2. employee registration of one shift per day
3. admin review board with registration layer plus draft assignment layer
4. bulk approve by registration
5. final publish flow
6. employee published schedule view
7. post-publish edit reason plus audit log

Phase 1 should exclude:

- multi-shift-per-day support
- per-registration reject reason workflow
- advanced recommendation or optimization engine
- swap marketplace behavior

## 14. Risks And Mitigations

Risk: registration data and final schedule data drift apart.

Mitigation:

- treat drift as expected behavior, not data corruption
- preserve `source_registration_id` for traceability
- keep side-by-side review UI

Risk: admin may not understand whether a chip is request or final schedule.

Mitigation:

- use clear dual visual treatment in each review cell
- label legend at top of board

Risk: publish may accidentally expose draft state.

Mitigation:

- employee-facing queries must filter for published schedule only
- never render draft assignment data in employee route

## 15. Acceptance Criteria

- admin can open one weekly registration period for a store
- employee can register one concrete shift per day during open period
- employee cannot edit registration after deadline
- admin can review employee registrations without them becoming final automatically
- admin can bulk copy registrations into draft assignments
- admin can change or clear draft assignments freely before publish
- employee cannot see admin draft schedule
- publish makes final assignments visible to employees
- post-publish edits require reason and generate audit log

## 16. Final Decision

Chosen business model:

- employees register concrete desired shifts
- those registrations are soft proposals
- admin can freely adjust before publish
- published weekly schedule is separate final truth

This design gives clear data boundaries, practical review UX, and safe room for future automation.
