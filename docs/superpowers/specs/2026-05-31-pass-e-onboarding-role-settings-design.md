# Pass E Design: Onboarding Role Settings

Date: 2026-05-31
Status: Approved in chat, written spec pending final user review

## Goal

Pass E adds settings for onboarding role management so onboarding assignment no longer depends on hardcoded role mapping in service code.

This pass must support:

- custom onboarding role labels
- enable/disable onboarding roles
- mapping many employee positions into one onboarding role
- assigning one onboarding template per onboarding role
- unmatched employees not being auto-assigned
- replacing `counter_staff` naming with `Thu ngan`

## Why This Pass Exists

Current onboarding logic hardcodes onboarding role resolution in service code. That creates product risk because:

- business vocabulary can differ by company
- role structure can change over time
- assignment rules become hard to maintain
- unmatched employees can be assigned incorrectly

For this workspace, business confirmed:

- there is no separate `phuc vu` role
- `Thu ngan` is preferred naming
- role mapping must be configurable
- if an employee does not match any onboarding rule, the system must not auto-assign and must require manual handling
- settings editors are `hr_admin`, `store_manager`, and `ceo`

## Recommended Approach

Use onboarding role settings as single source of truth for onboarding role resolution.

This means:

- keep seed defaults for first-run behavior
- stop relying on hardcoded role mapping as runtime source
- resolve employee onboarding role from saved settings
- store role/template snapshot on each created onboarding plan

This approach gives enough control for operations without adding heavy version migration in Pass E.

## Scope

Pass E includes:

- new onboarding role settings data model
- settings persistence and validation
- settings UI for role management
- dynamic employee-to-onboarding-role resolution
- unmatched employee warning flow
- update of default naming from `counter_staff` to `Thu ngan`
- employee and operations UI reading role labels from snapshot/config where needed

Pass E does not include:

- historical versioning of onboarding role settings
- bulk migration of all existing plans into new settings snapshots
- full template editor redesign
- automation workflows beyond current onboarding assignment flow

## Product Rules

### 1. Onboarding role settings

System stores a configurable list of onboarding roles.

Each onboarding role contains:

- `id`
- `label`
- `enabled`
- `template_id`
- `position_ids`
- `sort_order`

Seed defaults:

- `cashier` with label `Thu ngan`
- `barista` with label `Pha che`
- `shift_leader` with label `Shift leader`

### 2. Source of truth

Runtime onboarding assignment must resolve from saved onboarding role settings, not from hardcoded mapping logic.

Hardcoded mapping may remain only as temporary compatibility fallback for old data rendering if needed, but must not remain primary assignment logic.

### 3. Position mapping

One onboarding role can map many employee positions.

Constraints:

- one `position_id` can belong to only one enabled onboarding role at save time
- disabled roles should not participate in assignment
- enabled roles must have valid `template_id`

### 4. Unmatched employees

If employee position does not match any enabled onboarding role mapping:

- system must not auto-assign onboarding plan
- system must expose employee as unmatched and needing manual handling
- operations/settings UI must show clear warning state

No fallback default role will be used in Pass E.

### 5. Settings editors

Only these roles can update onboarding role settings:

- `hr_admin`
- `store_manager`
- `ceo`

All other users are read-only or blocked from this settings flow.

### 6. Snapshotting on plan creation

When system creates onboarding plan, it must persist snapshot values on plan so plan behavior remains stable after later settings changes.

Snapshot fields should include at least:

- onboarding role id
- onboarding role label
- template id

## Data Model

### New types

Add types for settings-driven onboarding role management:

- `OnboardingRoleSetting`
- `OnboardingRoleSettings`
- `OnboardingRoleUnmatchedRecord` or equivalent view model if unmatched state is surfaced via computed service view instead of persistence

Suggested shape:

```ts
type OnboardingRoleSetting = {
  id: string
  label: string
  enabled: boolean
  template_id: string | null
  position_ids: string[]
  sort_order: number
}

type OnboardingRoleSettings = {
  roles: OnboardingRoleSetting[]
  unmatched_behavior: 'manual_required'
  allowed_editor_roles: Array<'hr_admin' | 'store_manager' | 'ceo'>
  updated_at: string
  updated_by: string | null
}
```

### Existing type impact

Current `OnboardingRoleCode` hardcoded union is too rigid for settings-driven role control.

Pass E should refactor this carefully so runtime role identity is not blocked by compile-time business naming. Two acceptable implementations:

1. keep known seed ids via narrow union plus extensible string support
2. move to string-backed role ids in settings-driven flows

Recommendation:

- use string-backed `role_id` in settings-driven entities
- keep seed constants for known defaults

### Plan snapshot impact

`EmployeeOnboardingChecklistPlan` should carry role snapshot fields if missing today. If similar fields already exist, Pass E should normalize naming and ensure they are written from settings.

## Service Design

### Persistence

Add storage key for onboarding role settings.

On initialization:

- load saved onboarding role settings if present
- otherwise seed defaults

### Validation

Before saving settings:

- reject empty roles list if all roles disabled
- reject enabled role with missing template
- reject duplicate `position_id` across roles
- reject blank label after trim
- keep deterministic sort order

Validation errors should be returned in structured way for UI display.

### Role resolution

Add helper like:

```ts
resolveOnboardingRoleForEmployee(employee): { matched: true, role: OnboardingRoleSetting } | { matched: false, reason: 'no_position_match' | 'role_disabled' | 'missing_template' }
```

Assignment flow:

- employee enters onboarding assignment candidate pool
- service reads current onboarding role settings
- if exactly one valid role matches employee position, use role template
- if no valid role matches, mark unmatched and skip auto-assignment

### Compatibility

Existing plans created before Pass E may still contain legacy role values like `counter_staff`.

Compatibility rule:

- render legacy `counter_staff` as `Thu ngan` in UI fallback paths
- do not rewrite all legacy plans eagerly

### Template lookup

Template lookup must be driven by role settings assignment, not by fixed role-code-to-template assumption.

## UI Design

### Settings surface

Add onboarding role settings UI under career-path settings area.

Main sections:

1. role settings list
2. unmatched employees panel

Each role card shows:

- role label input
- enabled toggle
- assigned template selector
- multi-select or checklist of employee positions mapped to role

### Unmatched panel

Show employees needing manual onboarding role handling when current mapping finds no role.

Panel should explain:

- employee was not auto-assigned because no onboarding role rule matched
- HR/store manager must update role mapping or handle manually

### Guardrails

UI should prevent invalid save and explain why.

Examples:

- `Thu ngan` enabled without template
- same position assigned to both `Thu ngan` and `Pha che`
- all roles disabled

### Naming

New settings and operational UI must use `Thu ngan`, not `counter_staff`.

Avoid introducing `phuc vu` anywhere in onboarding role flows.

## Employee and Operations UX Impact

### Employee onboarding page

Employee onboarding page should continue to render checklist, self-review, mini test, timeline, and gate from assigned plan/template.

No large layout redesign is required in Pass E.

Main impact:

- role/template assignment source changes
- labels shown from snapshot/config should reflect `Thu ngan`

### Operations onboarding page

Operations view should:

- continue to show employee detail based on assigned onboarding plan where available
- surface unmatched employees clearly
- avoid implying onboarding checklist exists when employee is unmatched

Recommended states for unmatched employee:

- warning badge in list
- detail card explaining no onboarding role mapping matched
- action hint pointing manager/HR to settings

## Migration Strategy

Pass E should use lightweight migration.

### On first load after deploy

- if no onboarding role settings exist in storage, seed defaults
- existing checklist templates/stages/items remain unchanged

### Existing plans

- existing plans remain valid
- legacy role label fallback maps `counter_staff` display to `Thu ngan`
- newly created plans use settings snapshot immediately

### Unmatched employees after deploy

If employee positions are not covered by saved or seeded rules:

- no auto-assignment
- employee appears in unmatched state

## Verification Plan

### Functional checks

- save onboarding role settings successfully
- reload page and confirm settings persist
- assign multiple positions to `Thu ngan`
- confirm duplicate position mapping is blocked
- confirm enabled role without template is blocked
- confirm employee with matching position gets correct onboarding template
- confirm unmatched employee does not receive auto-created onboarding plan
- confirm unmatched employee appears with warning in operations/settings flow
- confirm old `counter_staff` display reads as `Thu ngan`

### Build checks

- `npx eslint` on Pass E files
- `npm run build`
- HTTP smoke for onboarding pages affected by this pass

## Risks

### 1. Legacy type coupling

If current code assumes hardcoded `OnboardingRoleCode` in many places, refactor may touch more files than expected.

Mitigation:

- isolate settings-driven role id logic in service helpers
- keep compatibility layer where needed

### 2. Invalid template linkage

Settings may point role to template that is archived or missing.

Mitigation:

- restrict selector to valid templates
- validate on save

### 3. Operational confusion for unmatched state

Managers may think onboarding is broken when employee is intentionally unmatched.

Mitigation:

- use explicit warning copy
- give direct action hint to settings

## Implementation Boundary For Next Step

Implementation plan should break work into:

1. types and storage model
2. service validation and role resolution
3. settings UI
4. employee/operations integration
5. verification

Next step after user reviews this spec: create implementation plan for Pass E.
