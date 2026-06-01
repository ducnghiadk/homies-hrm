# Pass F Design: Onboarding Role Display Hardening

Date: 2026-06-01
Status: Approved in chat

## Goal

Keep onboarding role identity stable in ASCII while rendering Vietnamese display names with diacritics consistently across settings, onboarding summary, and operations warning states.

## Scope

Pass F includes:

- keep stable role identity in service/data via `role_code`
- centralize display label resolution for `Thu ngân`, `Pha chế`, `Shift leader`
- harden unmatched/disabled resolver behavior with explicit tests
- add lightweight smoke coverage for accented UI copy without introducing a heavy UI test stack
- add merge note in `docs/CODEMAP.md`

Pass F does not include:

- new i18n layer
- schema migration for legacy plans
- broader onboarding layout redesign

## Design

### Stable identity

- `role_code` remains ASCII and is source of identity for settings, resolver, templates, and saved plans
- display text comes from one shared helper so UI does not mix accented and non-accented labels

### Display label policy

- seeded settings render:
  - `counter_staff` -> `Thu ngân`
  - `barista` -> `Pha chế`
  - `shift_leader` -> `Shift leader`
- legacy plans with `counter_staff` still render `Thu ngân`
- settings cards, unmatched warnings, and onboarding summaries all read same display helper

### Test policy

Because repo does not currently ship a full unit-test framework, Pass F uses Node native test runner with TypeScript strip-types for service-level checks.

Coverage must include:

- resolver match from saved settings
- disabled/unmatched flow
- legacy `counter_staff` display fallback
- accented text smoke for operations/settings copy where practical

## Verification

- `node --test --experimental-strip-types tests/onboarding-role-settings.test.ts`
- `npx eslint` on touched files
- `npm run build`
