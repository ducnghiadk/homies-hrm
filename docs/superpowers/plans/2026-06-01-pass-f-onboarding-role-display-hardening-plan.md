# Pass F Onboarding Role Display Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden onboarding role naming so stable ASCII role codes stay untouched while all affected UI paths consistently render accented Vietnamese labels.

**Architecture:** Add one shared display-name helper in onboarding service layer, cover it with native Node tests, then update settings and operations copy to read from that helper or aligned strings.

**Tech Stack:** Next.js App Router, TypeScript, Node native test runner, existing localStorage-backed onboarding services.

---

### Task 1: Add failing service tests

**Files:**
- Create: `tests/onboarding-role-settings.test.ts`
- Modify: `src/lib/career-path-service.ts`

- [ ] Write failing tests for:
  - resolver match by configured position mapping
  - unmatched result when mapped role is disabled
  - legacy `counter_staff` plan label fallback to `Thu ngân`
- [ ] Run `node --test --experimental-strip-types tests/onboarding-role-settings.test.ts` and confirm failure first.

### Task 2: Centralize display labels

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Modify: `src/lib/services/onboarding-operations-service.ts`

- [ ] Add shared display-label helper for known legacy/default role codes.
- [ ] Route plan-label fallback and operations role labels through shared helper.
- [ ] Keep resolver logic fail-closed for unmatched/disabled cases.

### Task 3: Polish accented UI copy

**Files:**
- Modify: `src/app/career-path/settings/page.tsx`
- Modify: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Modify: `docs/CODEMAP.md`

- [ ] Replace remaining onboarding-role ASCII copy with accented Vietnamese where user-facing.
- [ ] Keep `Shift leader` unchanged.
- [ ] Note shared display-name rule in `docs/CODEMAP.md`.

### Task 4: Verify

**Files:**
- Verify only

- [ ] Re-run `node --test --experimental-strip-types tests/onboarding-role-settings.test.ts`
- [ ] Run `npx eslint` on touched files
- [ ] Run `npm run build`
