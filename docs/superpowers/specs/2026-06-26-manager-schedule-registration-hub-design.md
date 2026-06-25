# Manager Schedule Registration Hub Design

Date: 2026-06-26
Topic: Consolidate manager schedule-registration setup into one user-friendly page while keeping employee registration and current-week schedule views separate.

## 1. Goal

Reduce fragmentation in manager schedule setup.

Manager should no longer need to jump between a policy page and a weekly registration page to understand or control next week's registration. Instead, the product should provide one manager-facing setup hub that answers three questions in one place:

- What is the current status of next week's registration?
- What default rules govern registration?
- What exactly will employees experience right now?

This design keeps employee flow separate and simple:

- `This week` is for viewing published work schedule.
- `Next week` is for shift registration only when registration is open.

## 2. Approved Direction

Approved direction: consolidate manager scheduling setup into one page only.

- Manager gets one page for registration setup and control.
- Employee keeps separate screens for `view current week` and `register next week`.
- No new fragmented child pages should be introduced for this domain.

## 3. Problem Summary

Current information architecture is hard to operate because it spreads one mental model across multiple places.

Observed confusion:

- policy settings page looks like it controls the live weekly cycle
- weekly registration control lives elsewhere
- copy such as `Deadline tiep theo` makes default rules look like live operational status
- manager must infer what employees can or cannot do instead of seeing it directly

This causes unnecessary setup mistakes and makes the system feel harder than the actual business flow.

## 4. Product Principles

This redesign should follow these principles:

1. One place for one job.
2. Show current operational status first.
3. Keep durable rules separate from week-specific overrides.
4. Let manager preview employee impact without switching role or page.
5. Prefer scanning over hunting.

## 5. Scope

Included in this design:

- one consolidated manager setup hub for schedule registration
- clear grouping of default policy and next-week operational controls
- employee-impact preview inside manager page
- route and copy cleanup so the system reads like one coherent flow

Out of scope for this redesign:

- changing the underlying employee registration data model
- merging employee and manager screens into one shared role surface
- redesigning admin review board behavior
- adding advanced automation logic

## 6. Users And Responsibilities

### 6.1. Manager / Admin

Uses one setup hub to:

- enable or disable employee registration feature
- define default registration rules
- configure next week's registration window
- adjust quota for next week
- open, close, review, publish, or reopen next-week cycle
- understand what message employees currently see

### 6.2. Employee

Uses separate screens to:

- view this week's published schedule
- register next week's preferred shifts only when registration is open

Employee should never need to interpret manager policy screens.

## 7. Information Architecture

Recommended manager route:

- keep one primary route for this domain, centered on the existing settings entry point or a direct replacement route

Recommended page name:

- `Cai dat dang ky ca`

Within that single page, organize content into four sections in this order:

1. `Tong quan ky dang ky tuan toi`
2. `Quy tac mac dinh`
3. `Thiet lap cho tuan toi`
4. `Nhan vien se thay gi`

This order matches real manager thinking:

1. What state are we in?
2. What rules apply by default?
3. What do I need to set for next week?
4. What effect will employees see?

## 8. Screen Design

### 8.1. Section A: Next-Week Overview

Purpose:

- give immediate operational clarity when manager enters page

Show at top:

- target week label
- current cycle status: `closed | open | reviewing | published`
- registration open date
- registration deadline
- last update metadata if available

Primary actions should appear here, not hidden below:

- `Mo dang ky`
- `Dong cong`
- `Chuyen sang xep lich`
- `Mo lai`

Only show actions valid for current state.

UX rule:

- manager must understand current state in under five seconds without scrolling through settings cards

### 8.2. Section B: Default Rules

Purpose:

- hold durable rules that apply as default behavior for future weeks

Include:

- feature enabled toggle
- default deadline rule, for example `3 days before Monday`
- reminder enabled and reminder lead time
- require reason when employee marks cannot work
- preference-priority rule for manager scheduling support

Important copy rule:

- this section must read as policy, not as live weekly control
- avoid wording that sounds like it is directly opening or closing next week's cycle

### 8.3. Section C: Setup For Next Week

Purpose:

- let manager adjust operational values for the actual upcoming registration cycle

Include:

- open date for next week registration
- exact deadline date and time
- quota matrix or quota controls for next week
- optional note for that week if current UI supports it

Behavior:

- system should prefill this section from default rules
- manager can override the suggested deadline for that specific week
- overrides affect next week only and must not silently rewrite default policy

### 8.4. Section D: Employee Impact Preview

Purpose:

- remove guesswork by showing what employees currently experience

Show one preview block driven by live status:

- if `closed`: employee sees `chua den thoi gian dang ky`
- if `open`: employee sees registration entry and can submit next week preferences
- if `reviewing`: employee sees `quan ly dang xep lich`
- if `published`: employee sees published schedule for current relevant week context

Preview should also show:

- where employee is sent from dashboard
- whether action is enabled or read-only

## 9. Interaction Model

Manager should be able to complete normal work in one page with this sequence:

1. Scan next-week overview.
2. Adjust default rules only if business policy changed.
3. Confirm or override next-week setup.
4. Check employee impact preview.
5. Save changes or trigger state action.

Recommended page-level actions:

- `Luu quy tac`
- `Cap nhat tuan toi`

If existing implementation keeps separate save operations for policy and weekly setup, the UI should still present them together clearly rather than hiding them on different routes.

## 10. State Model Clarification

This redesign must make a sharp distinction between two concepts:

### 10.1. Default Policy

Examples:

- registration enabled
- default deadline offset
- reminders
- required reason settings

These values describe how the system usually behaves.

### 10.2. Weekly Registration Cycle

Examples:

- next week target dates
- live cycle status
- actual deadline for that specific week
- quota for that specific week

These values describe what is happening operationally right now for next week.

Design requirement:

- both concepts live on one page
- both concepts must never be visually or semantically mixed together

## 11. Employee Flow Impact

Employee flow remains intentionally separate:

- `Lich tuan nay`: read-only view of current published schedule
- `Dang ky lich lam viec tuan toi`: registration screen for next week only

Registration availability rules remain:

- employee can register only when next week's cycle is `open`
- employee cannot register once deadline passes
- employee sees explanatory lock state when cycle is `closed`, `reviewing`, or `published`

This separation preserves clarity and avoids role confusion.

## 12. Route Strategy

Preferred route behavior:

- manager should have one obvious destination for schedule registration setup
- old fragmented entry points should either redirect there or be visually reframed as parts of the same hub

Minimum acceptable outcome:

- dashboard and settings shortcuts both lead manager to one unified setup page

## 13. Copy Strategy

Replace ambiguous copy with explicit operational language.

Examples:

- replace `Deadline tiep theo` in policy area with wording like `Mac dinh ap cho cac tuan moi`
- use `Han dang ky tuan toi` for week-specific deadline
- use `Trang thai ky dang ky` for live cycle state
- use `Nhan vien hien dang thay` for preview label

Copy must help users distinguish:

- default rule
- live next-week setup
- employee-facing outcome

## 14. Error Handling And Guardrails

- If next week's cycle does not exist yet, page should show neutral setup state and offer to initialize it.
- If default policy is disabled, week-specific controls should explain why registration cannot be opened.
- If manager edits a week-specific deadline earlier than the open date, block save with clear validation.
- If live status makes edits unsafe, disable only the conflicting controls and explain why.

## 15. Testing Focus

Tests for implementation should cover:

- manager can reach one unified setup route from major entry points
- page clearly separates policy controls from next-week controls
- employee-impact preview changes with weekly cycle status
- employee registration screen remains separate and honors `open` state only
- ambiguous copy from old fragmented flow is removed or updated

## 16. Risks And Mitigations

Risk: one page becomes too long and heavy.

Mitigation:

- keep only four high-value sections
- lead with overview and employee preview
- avoid dumping secondary analytics into same page

Risk: manager confuses default rules with next-week overrides.

Mitigation:

- separate section titles clearly
- use different helper copy for policy versus week setup
- prefill week setup from policy but show override behavior explicitly

Risk: old links continue to send users into fragmented legacy screens.

Mitigation:

- centralize navigation to one route
- reduce direct exposure of legacy child pages

## 17. Acceptance Criteria

- manager has one obvious page for schedule registration setup
- manager can see next-week cycle status immediately on page load
- default policy and next-week setup appear on same page but in distinct sections
- employee-impact preview explains what staff can currently do
- employee current-week schedule view remains separate from next-week registration flow
- route structure feels simpler than current fragmented setup

## 18. Final Decision

Chosen direction:

- consolidate manager schedule-registration control into one setup hub
- keep employee flow separate by purpose
- optimize for ease of use, fast scanning, and low cognitive load rather than spreading logic across many subpages
