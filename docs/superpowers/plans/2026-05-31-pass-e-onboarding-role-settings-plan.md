# Pass E Onboarding Role Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add settings-driven onboarding role management so role labels, enabled state, position mapping, and template assignment can be configured without hardcoded runtime mapping, while unmatched employees are held for manual handling.

**Architecture:** Extend career-path settings with a new onboarding-role configuration model stored in the existing `cp_settings` payload, then route all onboarding assignment through service helpers that resolve roles from saved settings instead of hardcoded `counter_staff/barista/shift_leader` logic. Surface this configuration in `career-path/settings`, persist role snapshots on onboarding plans, and expose unmatched state in onboarding operations and employee-facing flows without rewriting old plans.

**Tech Stack:** Next.js App Router, React client components, TypeScript, localStorage-backed services, existing career-path/onboarding service layer.

---

## File Map

### Core data and service files

- Modify: `src/lib/career-path-types.ts`
  - Add onboarding role settings types, validation result types, and plan snapshot fields.
- Modify: `src/lib/mock-data-career-path.ts`
  - Seed default onboarding role settings and rename default role label from `counter_staff` to `Thu ngan`.
- Modify: `src/lib/career-path-service.ts`
  - Load/save onboarding role settings, validate settings, resolve employee onboarding roles from config, expose unmatched lists, and write role snapshot fields onto plans.

### Settings UI files

- Modify: `src/app/career-path/settings/page.tsx`
  - Add onboarding role settings section inside existing onboarding/general settings flow.
- Create: `src/components/onboarding-settings/OnboardingRoleSettingsPanel.tsx`
  - Focused panel for role cards, template selection, position mapping, and validation errors.
- Create: `src/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel.tsx`
  - Focused panel for unmatched employees needing manual review.

### Operations and employee UX files

- Modify: `src/lib/services/onboarding-operations-service.ts`
  - Surface unmatched state, role labels from snapshots/settings, and warning copy.
- Modify: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
  - Show unmatched badge / list-row cue.
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
  - Show unmatched detail state instead of pretending checklist exists.
- Modify: `src/app/career-path/onboarding/page.tsx`
  - Ensure role labels and unmatched logic stay coherent in operations workspace.
- Modify: `src/app/onboarding/page.tsx`
  - Keep employee-facing bundle consumption compatible with settings-driven role snapshots.

### Documentation

- Modify: `docs/CODEMAP.md`
  - Add new settings panel entry and note settings-driven onboarding role source.

### Verification targets

- Run: `npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingRoleSettingsPanel.tsx src/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/app/career-path/onboarding/page.tsx src/app/onboarding/page.tsx docs/CODEMAP.md`
- Run: `npm run build`
- Run: HTTP smoke against `http://127.0.0.1:3333/onboarding` and `http://127.0.0.1:3333/career-path/onboarding`

---

### Task 1: Extend career-path types for settings-driven onboarding roles

**Files:**
- Modify: `src/lib/career-path-types.ts`

- [ ] **Step 1: Write the failing type-first check by listing exact additions in comments or scratch note**

Add these type targets near existing onboarding types so implementation has stable names:

```ts
export type OnboardingRoleSettingId = string;

export interface OnboardingRoleSetting {
  id: OnboardingRoleSettingId;
  label: string;
  enabled: boolean;
  template_id: string | null;
  position_ids: string[];
  sort_order: number;
}

export interface OnboardingRoleSettings {
  roles: OnboardingRoleSetting[];
  unmatched_behavior: 'manual_required';
  allowed_editor_roles: Array<'hr_admin' | 'store_manager' | 'ceo'>;
  updated_at: string | null;
  updated_by: string | null;
}

export interface OnboardingRoleSettingsValidationIssue {
  code: 'blank_label' | 'missing_template' | 'duplicate_position' | 'all_roles_disabled';
  role_id?: string;
  position_id?: string;
  message: string;
}
```

Expected result: after this step, later tasks can reference stable type names instead of inventing them ad hoc.

- [ ] **Step 2: Add plan snapshot fields to onboarding plan types**

Update the onboarding plan interface so newly-created plans can keep stable labels even if settings change later:

```ts
export interface EmployeeOnboardingChecklistPlan {
  // existing fields...
  role_code: string;
  role_label_snapshot?: string;
  template_label_snapshot?: string | null;
}
```

If `role_code` already exists and is currently `OnboardingRoleCode`, widen it to `string` for settings-driven compatibility.

- [ ] **Step 3: Remove compile-time dependence on rigid onboarding role union where it blocks config**

Replace or relax this:

```ts
export type OnboardingRoleCode = 'counter_staff' | 'barista' | 'shift_leader';
```

With this:

```ts
export type OnboardingRoleCode = string;
```

And add seed constants in later task instead of relying on union literals for business vocabulary.

- [ ] **Step 4: Run TypeScript/ESLint check on the updated type file**

Run:

```bash
npx eslint src/lib/career-path-types.ts
```

Expected: PASS with no parser/type-style errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/career-path-types.ts
git commit -m "feat: add onboarding role settings types"
```

If repository is not available in this workspace, skip commit and note that limitation in execution log.

---

### Task 2: Seed default onboarding role settings and default `Thu ngan` naming

**Files:**
- Modify: `src/lib/mock-data-career-path.ts`
- Modify: `src/lib/career-path-types.ts`

- [ ] **Step 1: Write the failing expectation in scratch note**

Seed data must include these three default roles:

```ts
export const defaultOnboardingRoleSettings: OnboardingRoleSettings = {
  roles: [
    {
      id: 'cashier',
      label: 'Thu ngan',
      enabled: true,
      template_id: 'onb-template-counter-v1',
      position_ids: ['pos-002'],
      sort_order: 1,
    },
    {
      id: 'barista',
      label: 'Pha che',
      enabled: true,
      template_id: 'onb-template-barista-v1',
      position_ids: ['pos-001'],
      sort_order: 2,
    },
    {
      id: 'shift_leader',
      label: 'Shift leader',
      enabled: true,
      template_id: 'onb-template-shift-leader-v1',
      position_ids: ['pos-004'],
      sort_order: 3,
    },
  ],
  unmatched_behavior: 'manual_required',
  allowed_editor_roles: ['hr_admin', 'store_manager', 'ceo'],
  updated_at: null,
  updated_by: null,
}
```

Adjust `position_ids` if this codebase uses different position ids for cashier/thu ngan.

- [ ] **Step 2: Export the default settings object and wire it near existing onboarding defaults**

Place it close to:

```ts
export const defaultOnboardingChecklistTemplates = [...]
```

So all onboarding defaults stay co-located.

- [ ] **Step 3: Preserve compatibility for legacy `counter_staff` templates while changing display naming**

Do not delete legacy template id `onb-template-counter-v1`.

Keep template data intact, but make role-facing text align with:

```ts
role_label: 'Thu ngan'
```

Expected: old template ids keep working, new settings and UI use `Thu ngan`.

- [ ] **Step 4: Run lint on mock data file**

Run:

```bash
npx eslint src/lib/mock-data-career-path.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mock-data-career-path.ts src/lib/career-path-types.ts
git commit -m "feat: seed onboarding role settings defaults"
```

---

### Task 3: Load, validate, and persist onboarding role settings in career-path service

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Modify: `src/lib/career-path-types.ts`
- Modify: `src/lib/mock-data-career-path.ts`

- [ ] **Step 1: Add storage/plumbing constants and normalization helper**

Extend service imports to include new settings default/type:

```ts
import type {
  // existing imports...
  OnboardingRoleSettings,
  OnboardingRoleSetting,
  OnboardingRoleSettingsValidationIssue,
} from './career-path-types';

import {
  // existing imports...
  defaultOnboardingRoleSettings,
} from './mock-data-career-path';
```

Add a new storage key if role settings live outside `cp_settings`, or keep them inside `CareerPathSettings` if that is cleaner for existing export/import. Recommended minimal path: embed inside `CareerPathSettings` and normalize it:

```ts
function normalizeOnboardingRoleSettings(
  saved?: OnboardingRoleSettings | null,
): OnboardingRoleSettings {
  return {
    ...defaultOnboardingRoleSettings,
    ...saved,
    roles: (saved?.roles ?? defaultOnboardingRoleSettings.roles)
      .map((role, index) => ({
        ...role,
        label: role.label.trim(),
        position_ids: [...new Set(role.position_ids)],
        sort_order: role.sort_order ?? index + 1,
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}
```

- [ ] **Step 2: Extend `CareerPathSettings` normalize/load flow**

Update `normalizeSettings` so `getSettings()` always returns valid onboarding role settings:

```ts
function normalizeSettings(saved: CareerPathSettings): CareerPathSettings {
  return {
    ...defaultSettings,
    ...saved,
    onboarding_role_settings: normalizeOnboardingRoleSettings(saved.onboarding_role_settings),
    onboarding_operations: {
      ...defaultOnboardingOperationsSettings,
      ...saved.onboarding_operations,
      rules: saved.onboarding_operations?.rules ?? defaultOnboardingOperationsSettings.rules,
      store_overrides: saved.onboarding_operations?.store_overrides ?? defaultOnboardingOperationsSettings.store_overrides,
    },
  };
}
```

- [ ] **Step 3: Add validator and save entrypoint**

Add focused helpers:

```ts
export function validateOnboardingRoleSettings(
  input: OnboardingRoleSettings,
): OnboardingRoleSettingsValidationIssue[] {
  const issues: OnboardingRoleSettingsValidationIssue[] = [];
  const enabledRoles = input.roles.filter((role) => role.enabled);

  if (enabledRoles.length === 0) {
    issues.push({ code: 'all_roles_disabled', message: 'Can it nhat 1 role dang bat.' });
  }

  const usedPositions = new Map<string, string>();

  enabledRoles.forEach((role) => {
    if (!role.label.trim()) {
      issues.push({ code: 'blank_label', role_id: role.id, message: 'Ten role khong duoc de trong.' });
    }
    if (!role.template_id) {
      issues.push({ code: 'missing_template', role_id: role.id, message: 'Role dang bat phai co template.' });
    }
    role.position_ids.forEach((positionId) => {
      const current = usedPositions.get(positionId);
      if (current && current !== role.id) {
        issues.push({
          code: 'duplicate_position',
          role_id: role.id,
          position_id: positionId,
          message: '1 chuc danh chi duoc map vao 1 role onboarding.',
        });
      } else {
        usedPositions.set(positionId, role.id);
      }
    });
  });

  return issues;
}
```

Then add:

```ts
export function updateOnboardingRoleSettings(
  data: OnboardingRoleSettings,
  updatedBy: string,
): { ok: true; settings: CareerPathSettings } | { ok: false; issues: OnboardingRoleSettingsValidationIssue[] } {
  const normalizedRoleSettings = normalizeOnboardingRoleSettings(data);
  const issues = validateOnboardingRoleSettings(normalizedRoleSettings);
  if (issues.length > 0) return { ok: false, issues };

  const before = JSON.stringify(_settings);
  _settings = normalizeSettings({
    ..._settings,
    onboarding_role_settings: {
      ...normalizedRoleSettings,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    },
  });
  save(KEYS.settings, _settings);
  logChange('settings', 'onboarding_role_settings', 'update', before, JSON.stringify(_settings), 'Cap nhat role onboarding');
  return { ok: true, settings: _settings };
}
```

- [ ] **Step 4: Add getters for settings UI and consumers**

Export focused helpers:

```ts
export function getOnboardingRoleSettings(): OnboardingRoleSettings {
  return normalizeOnboardingRoleSettings(getSettings().onboarding_role_settings);
}

export function getEnabledOnboardingRoles(): OnboardingRoleSetting[] {
  return getOnboardingRoleSettings().roles.filter((role) => role.enabled);
}
```

- [ ] **Step 5: Run service lint**

Run:

```bash
npx eslint src/lib/career-path-service.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/career-path-service.ts src/lib/career-path-types.ts src/lib/mock-data-career-path.ts
git commit -m "feat: persist onboarding role settings"
```

---

### Task 4: Replace hardcoded onboarding role resolution with settings-driven matching

**Files:**
- Modify: `src/lib/career-path-service.ts`

- [ ] **Step 1: Write the failing behavior target**

Current hardcoded helper:

```ts
function mapEmployeeToOnboardingRole(employee: OnboardingEmployeeSnapshot): OnboardingRoleCode
```

Must stop being primary runtime source. Replace with settings-aware resolver:

```ts
type OnboardingRoleMatchResult =
  | { matched: true; role: OnboardingRoleSetting }
  | { matched: false; reason: 'no_position_match' | 'role_disabled' | 'missing_template' };
```

- [ ] **Step 2: Implement settings-driven resolver**

Add helper:

```ts
export function resolveOnboardingRoleForEmployee(
  employee: OnboardingEmployeeSnapshot,
): OnboardingRoleMatchResult {
  const positionId = employee.position_id ?? '';
  const roles = getEnabledOnboardingRoles();
  const matchedRole = roles.find((role) => role.position_ids.includes(positionId));

  if (!matchedRole) {
    return { matched: false, reason: 'no_position_match' };
  }

  if (!matchedRole.template_id) {
    return { matched: false, reason: 'missing_template' };
  }

  return { matched: true, role: matchedRole };
}
```

Keep old `mapEmployeeToOnboardingRole` only as optional legacy label fallback for already-existing plans if absolutely necessary.

- [ ] **Step 3: Update plan creation / assignment call sites**

Locate plan creation around `getEmployeeOnboardingChecklistBundleForEmployee` and assignment helpers near lines reported by `rg`:

```ts
const roleMatch = resolveOnboardingRoleForEmployee(employee)
if (!roleMatch.matched) {
  return null
}

const template = getOnboardingChecklistTemplates().find(
  (entry) => entry.id === roleMatch.role.template_id && entry.status === 'active'
)
if (!template) {
  return null
}
```

When creating/storing plan:

```ts
role_code: roleMatch.role.id,
role_label_snapshot: roleMatch.role.label,
template_id: template.id,
template_label_snapshot: template.role_label ?? template.name ?? null,
```

- [ ] **Step 4: Add legacy display fallback helper**

To keep old plans readable:

```ts
function getPlanRoleLabel(plan: EmployeeOnboardingChecklistPlan): string {
  if (plan.role_label_snapshot?.trim()) return plan.role_label_snapshot;
  if (plan.role_code === 'counter_staff') return 'Thu ngan';
  return plan.role_code;
}
```

Use this helper in plan-to-view shaping code instead of raw `role_code`.

- [ ] **Step 5: Run lint after resolver swap**

Run:

```bash
npx eslint src/lib/career-path-service.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/career-path-service.ts
git commit -m "feat: resolve onboarding roles from settings"
```

---

### Task 5: Expose unmatched employees from career-path service

**Files:**
- Modify: `src/lib/career-path-service.ts`
- Modify: `src/lib/career-path-types.ts`

- [ ] **Step 1: Add unmatched view type**

Add:

```ts
export interface OnboardingRoleUnmatchedEmployeeView {
  employee_id: string;
  employee_name: string;
  store_id: string;
  store_label: string;
  position_id: string | null;
  position_label: string;
  reason: 'no_position_match' | 'role_disabled' | 'missing_template';
}
```

- [ ] **Step 2: Implement unmatched collector helper**

In `career-path-service.ts`:

```ts
export function getUnmatchedOnboardingEmployees(): OnboardingRoleUnmatchedEmployeeView[] {
  return mockEmployees
    .filter((employee) => shouldAutoAssignOnboarding(employee))
    .map((employee) => {
      const match = resolveOnboardingRoleForEmployee(employee);
      return { employee, match };
    })
    .filter((entry) => !entry.match.matched)
    .map(({ employee, match }) => ({
      employee_id: employee.id,
      employee_name: resolveEmployeeName(employee.id) ?? employee.id,
      store_id: employee.store_id ?? '',
      store_label: mockStores.find((store) => store.id === employee.store_id)?.name ?? (employee.store_id ?? '-'),
      position_id: employee.position_id ?? null,
      position_label: mockPositions.find((position) => position.id === employee.position_id)?.name ?? employee.position_id ?? '-',
      reason: match.reason,
    }));
}
```

If `mockEmployees` shape differs from `OnboardingEmployeeSnapshot`, adapt using existing employee list source already used by onboarding functions.

- [ ] **Step 3: Reuse this helper in settings and operations instead of duplicating matching logic**

Expected result: one service owns unmatched logic, UI only renders it.

- [ ] **Step 4: Run lint**

Run:

```bash
npx eslint src/lib/career-path-service.ts src/lib/career-path-types.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/career-path-service.ts src/lib/career-path-types.ts
git commit -m "feat: expose unmatched onboarding employees"
```

---

### Task 6: Build focused onboarding role settings UI components

**Files:**
- Create: `src/components/onboarding-settings/OnboardingRoleSettingsPanel.tsx`
- Create: `src/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel.tsx`

- [ ] **Step 1: Create `OnboardingRoleSettingsPanel.tsx` with explicit props contract**

Create component skeleton:

```tsx
'use client'

import type {
  OnboardingChecklistTemplate,
  OnboardingRoleSettings,
  OnboardingRoleSettingsValidationIssue,
} from '@/lib/career-path-types'
import { mockPositions } from '@/lib/mock-data'

type Props = {
  value: OnboardingRoleSettings
  templates: OnboardingChecklistTemplate[]
  issues: OnboardingRoleSettingsValidationIssue[]
  onChange: (next: OnboardingRoleSettings) => void
  onSave: () => void
  saving?: boolean
}

export function OnboardingRoleSettingsPanel({
  value,
  templates,
  issues,
  onChange,
  onSave,
  saving = false,
}: Props) {
  // render role cards here
}
```

- [ ] **Step 2: Implement role-card interactions inside panel**

Each role card needs:

```tsx
<input
  value={role.label}
  onChange={(event) => updateRole(role.id, { label: event.target.value })}
/>

<button
  type="button"
  onClick={() => updateRole(role.id, { enabled: !role.enabled })}
>
  {role.enabled ? 'Dang bat' : 'Dang tat'}
</button>

<select
  value={role.template_id ?? ''}
  onChange={(event) => updateRole(role.id, { template_id: event.target.value || null })}
>
  <option value="">Chon template</option>
  {templates
    .filter((template) => template.status === 'active')
    .map((template) => (
      <option key={template.id} value={template.id}>
        {template.role_label} - v{template.version}
      </option>
    ))}
</select>
```

Position mapping can use checkbox list:

```tsx
{mockPositions.map((position) => (
  <label key={position.id}>
    <input
      type="checkbox"
      checked={role.position_ids.includes(position.id)}
      onChange={() => togglePosition(role.id, position.id)}
    />
    <span>{position.name}</span>
  </label>
))}
```

- [ ] **Step 3: Show validation errors inline**

Add summary block:

```tsx
{issues.length > 0 ? (
  <div style={{ borderRadius: 12, background: '#FFF8E8', border: '1px solid #F6C85F', padding: 12 }}>
    {issues.map((issue) => (
      <div key={`${issue.code}-${issue.role_id ?? 'global'}-${issue.position_id ?? ''}`}>
        {issue.message}
      </div>
    ))}
  </div>
) : null}
```

- [ ] **Step 4: Create `OnboardingUnmatchedEmployeesPanel.tsx`**

Use narrow props:

```tsx
'use client'

import type { OnboardingRoleUnmatchedEmployeeView } from '@/lib/career-path-types'

export function OnboardingUnmatchedEmployeesPanel({
  employees,
}: {
  employees: OnboardingRoleUnmatchedEmployeeView[]
}) {
  if (employees.length === 0) {
    return <div>Khong co nhan vien unmatched.</div>
  }

  return (
    <div>
      {employees.map((employee) => (
        <div key={employee.employee_id}>
          <div>{employee.employee_name}</div>
          <div>{employee.position_label} • {employee.store_label}</div>
          <div>Can map role onboarding truoc khi auto-assign.</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Run lint on new components**

Run:

```bash
npx eslint src/components/onboarding-settings/OnboardingRoleSettingsPanel.tsx src/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding-settings/OnboardingRoleSettingsPanel.tsx src/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel.tsx
git commit -m "feat: add onboarding role settings panels"
```

---

### Task 7: Wire onboarding role settings into career-path settings page

**Files:**
- Modify: `src/app/career-path/settings/page.tsx`
- Create: `src/components/onboarding-settings/OnboardingRoleSettingsPanel.tsx`
- Create: `src/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel.tsx`
- Modify: `src/lib/career-path-service.ts`

- [ ] **Step 1: Extend imports and state**

Add settings helpers/imports:

```tsx
import {
  // existing imports...
  getOnboardingChecklistTemplates,
  getOnboardingRoleSettings,
  getUnmatchedOnboardingEmployees,
  updateOnboardingRoleSettings,
} from '@/lib/career-path-service'
import { OnboardingRoleSettingsPanel } from '@/components/onboarding-settings/OnboardingRoleSettingsPanel'
import { OnboardingUnmatchedEmployeesPanel } from '@/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel'
```

Add local state:

```tsx
const [roleSettingsDraft, setRoleSettingsDraft] = useState(() => getOnboardingRoleSettings())
const [roleSettingsIssues, setRoleSettingsIssues] = useState<OnboardingRoleSettingsValidationIssue[]>([])
const [unmatchedEmployees, setUnmatchedEmployees] = useState(() => getUnmatchedOnboardingEmployees())
```

- [ ] **Step 2: Keep `reload()` synchronized**

Update `reload()`:

```tsx
const reload = () => {
  setLevels(getLevels())
  setSkills(getSkills())
  setConditions(getPromotionConditions())
  setRewards(getBuddyRewards())
  setChecklist(getTrialChecklist())
  setOnbSteps(getOnboardingSteps())
  setSettingsState(getSettings())
  setLogs(getChangeLogs())
  setRoleSettingsDraft(getOnboardingRoleSettings())
  setUnmatchedEmployees(getUnmatchedOnboardingEmployees())
}
```

- [ ] **Step 3: Add save handler with editor identity**

Use current auth user if available on page; if page lacks auth today, use existing local role source already present in the codebase. Handler shape:

```tsx
const handleSaveOnboardingRoles = () => {
  const actorId = 'career-path-settings'
  const result = updateOnboardingRoleSettings(roleSettingsDraft, actorId)
  if (!result.ok) {
    setRoleSettingsIssues(result.issues)
    return
  }
  setRoleSettingsIssues([])
  reload()
}
```

If page already has access to signed-in user, replace `'career-path-settings'` with `user.id`.

- [ ] **Step 4: Render panel in onboarding settings area**

Inside onboarding/general tab, add:

```tsx
<div id="onboarding-role-settings" style={{ marginTop: 14 }}>
  <OnboardingRoleSettingsPanel
    value={roleSettingsDraft}
    templates={getOnboardingChecklistTemplates()}
    issues={roleSettingsIssues}
    onChange={setRoleSettingsDraft}
    onSave={handleSaveOnboardingRoles}
  />

  <div style={{ height: 12 }} />

  <OnboardingUnmatchedEmployeesPanel employees={unmatchedEmployees} />
</div>
```

- [ ] **Step 5: Run lint on settings page**

Run:

```bash
npx eslint src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingRoleSettingsPanel.tsx src/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingRoleSettingsPanel.tsx src/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel.tsx
git commit -m "feat: add onboarding role settings to career path settings"
```

---

### Task 8: Surface unmatched state and settings-driven role labels in onboarding operations service

**Files:**
- Modify: `src/lib/services/onboarding-operations-service.ts`
- Modify: `src/lib/career-path-service.ts`

- [ ] **Step 1: Import new helpers**

Add:

```ts
import {
  // existing imports...
  getUnmatchedOnboardingEmployees,
  getOnboardingRoleSettings,
} from '@/lib/career-path-service'
```

Also add optional unmatched fields to service view types:

```ts
export interface OnboardingOpsListRow {
  // existing fields...
  isUnmatched?: boolean
  unmatchedReason?: string | null
}

export interface OnboardingOpsEmployeeDetail {
  // existing fields...
  isUnmatched?: boolean
  unmatchedReason?: string | null
}
```

- [ ] **Step 2: Replace raw position label fallback with settings-aware role label helper where possible**

Add helper:

```ts
function getConfiguredRoleLabel(employee: AuthUser) {
  const matchedRole = getOnboardingRoleSettings().roles.find((role) =>
    role.enabled && role.position_ids.includes(employee.position_id || '')
  )
  return matchedRole?.label
    || mockPositions.find((item) => item.id === employee.position_id)?.name
    || employee.job_level
    || employee.role
}
```

Use this instead of raw `getRoleLabel()` when building row/detail summaries.

- [ ] **Step 3: Inject unmatched metadata into row/detail builders**

In `getWorkspaceOverview`:

```ts
const unmatchedById = new Map(
  getUnmatchedOnboardingEmployees().map((entry) => [entry.employee_id, entry])
)

// inside row builder:
const unmatched = unmatchedById.get(employee.id)
isUnmatched: Boolean(unmatched),
unmatchedReason: unmatched ? 'Chua map role onboarding' : null,
```

In `getEmployeeDetail`:

```ts
const unmatched = getUnmatchedOnboardingEmployees().find((entry) => entry.employee_id === employee.id)
```

Set:

```ts
isUnmatched: Boolean(unmatched),
unmatchedReason: unmatched ? 'Nhan vien nay chua duoc map role onboarding trong settings.' : null,
```

- [ ] **Step 4: Prevent checklist illusion for unmatched employees**

If employee is unmatched and no plan exists:

```ts
if (unmatched && !onboardingPlan) {
  return {
    // existing identity fields...
    checklist: [],
    summaryLabel: 'Chua auto-assign vi chua match role onboarding',
    quickNote: 'Vao Career Path Settings de map chuc danh vao role onboarding',
    isUnmatched: true,
    unmatchedReason: 'Nhan vien nay can duoc HR/quan ly map role onboarding truoc.',
    // other nullable view fields...
  }
}
```

- [ ] **Step 5: Run lint**

Run:

```bash
npx eslint src/lib/services/onboarding-operations-service.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/onboarding-operations-service.ts src/lib/career-path-service.ts
git commit -m "feat: surface unmatched onboarding state in operations service"
```

---

### Task 9: Update onboarding operations UI for unmatched handling

**Files:**
- Modify: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Modify: `src/app/career-path/onboarding/page.tsx`

- [ ] **Step 1: Add unmatched badge in list rows**

In `UpcomingOnboardingList.tsx`, render row cue:

```tsx
{row.isUnmatched ? (
  <span
    style={{
      borderRadius: 999,
      padding: '4px 8px',
      background: 'rgba(217, 56, 30, 0.12)',
      color: '#D9381E',
      fontSize: 10,
      fontWeight: 800,
    }}
  >
    Chua map role
  </span>
) : null}
```

- [ ] **Step 2: Add unmatched state to detail card**

Near top of `OperationsChecklistDetail.tsx`, after `if (!detail)` check, add special rendering when:

```tsx
if (detail?.isUnmatched) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(217, 56, 30, 0.18)', borderRadius: 28, padding: 20 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#001D3D' }}>{detail.employeeName}</div>
      <div style={{ fontSize: 13, color: '#4A5A6A', marginTop: 4 }}>
        {detail.roleLabel} • {detail.storeLabel} • Vao lam {detail.hireDate}
      </div>
      <div style={{ marginTop: 14, borderRadius: 18, padding: 14, background: '#FFF8E8', border: '1px solid rgba(246, 200, 95, 0.35)' }}>
        {detail.unmatchedReason}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: '#5F6B7A' }}>
        Vao Career Path Settings de map chuc danh vao role onboarding va chon template.
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Keep page refresh behavior unchanged**

No new state machine needed in `src/app/career-path/onboarding/page.tsx`; only ensure row/detail rendering survives extra fields.

If TypeScript complains, widen inferred detail types by using updated service interfaces.

- [ ] **Step 4: Run lint**

Run:

```bash
npx eslint src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/app/career-path/onboarding/page.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/app/career-path/onboarding/page.tsx
git commit -m "feat: show unmatched onboarding role warnings in operations ui"
```

---

### Task 10: Keep employee onboarding page compatible with settings-driven plans

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/lib/career-path-service.ts`

- [ ] **Step 1: Identify plan-null flow after unmatched behavior**

Employee page already handles `!checklistBundle`.

Ensure the service now returns `null` when employee cannot be auto-assigned due to unmatched config and no plan exists.

Expected UI outcome: existing empty state remains stable instead of crashing.

- [ ] **Step 2: Improve empty-state copy if needed**

If current empty-state message is too generic, update it to acknowledge settings-driven assignment:

```tsx
<div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
  HR chua gan checklist onboarding cho tai khoan nay, hoac chuc danh nay chua duoc map role onboarding trong settings.
</div>
```

- [ ] **Step 3: Ensure role labels use snapshot when a plan exists**

If employee page shows role label from user position elsewhere and that conflicts with snapshot-based role, prefer plan snapshot in onboarding-specific cards where role wording matters.

Minimal helper idea in service:

```ts
role_label: getPlanRoleLabel(plan),
```

Use only where onboarding-facing role wording is displayed.

- [ ] **Step 4: Run lint**

Run:

```bash
npx eslint src/app/onboarding/page.tsx src/lib/career-path-service.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/page.tsx src/lib/career-path-service.ts
git commit -m "feat: keep employee onboarding page compatible with role settings"
```

---

### Task 11: Update CODEMAP and export/import compatibility

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `src/lib/career-path-service.ts`

- [ ] **Step 1: Ensure export/import includes onboarding role settings**

Update `exportSettings()`:

```ts
settings: _settings,
```

This likely already exists, but verify `normalizeSettings()` rehydrates `onboarding_role_settings` after import. If import currently does raw assignment, change:

```ts
if (data.settings) {
  _settings = normalizeSettings(data.settings);
  save(KEYS.settings, _settings);
}
```

Expected: imported settings do not lose role configuration.

- [ ] **Step 2: Update CODEMAP onboarding section**

Add wording near onboarding area:

```md
- Dung khi: sua onboarding role settings, map chuc danh -> role onboarding, chon template theo role, xu ly nhan vien unmatched, hoac flow `Thu ngan` / `Pha che` / `Shift leader`.
```

And add new components:

```md
`src/components/onboarding-settings/OnboardingRoleSettingsPanel.tsx`
`src/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel.tsx`
```

- [ ] **Step 3: Run lint/check for touched code**

Run:

```bash
npx eslint src/lib/career-path-service.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/CODEMAP.md src/lib/career-path-service.ts
git commit -m "docs: map onboarding role settings flow"
```

---

### Task 12: Full verification

**Files:**
- Verify only

- [ ] **Step 1: Run targeted eslint**

Run:

```bash
npx eslint src/lib/career-path-types.ts src/lib/mock-data-career-path.ts src/lib/career-path-service.ts src/app/career-path/settings/page.tsx src/components/onboarding-settings/OnboardingRoleSettingsPanel.tsx src/components/onboarding-settings/OnboardingUnmatchedEmployeesPanel.tsx src/lib/services/onboarding-operations-service.ts src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx src/app/career-path/onboarding/page.tsx src/app/onboarding/page.tsx
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run manual smoke checks**

Verify these scenarios in local app:

1. Settings page shows roles `Thu ngan`, `Pha che`, `Shift leader`.
2. Saving duplicate `position_id` mapping is blocked with clear error.
3. Saving enabled role without template is blocked.
4. Employee with mapped cashier position receives `Thu ngan` onboarding template.
5. Employee with unmatched position appears in unmatched panel and operations warning state.
6. Existing legacy `counter_staff` plan displays `Thu ngan`.

- [ ] **Step 4: Run HTTP smoke**

Run:

```bash
curl http://127.0.0.1:3333/onboarding
curl http://127.0.0.1:3333/career-path/onboarding
```

Expected: both return `200`.

- [ ] **Step 5: Commit verification-ready state**

```bash
git add .
git commit -m "feat: add onboarding role settings flow"
```

If no git repository is available, record verification results in execution notes instead.

---

## Self-Review

### Spec coverage

- Settings-driven source of truth: Task 3, Task 4
- `Thu ngan` naming: Task 2, Task 11
- Enable/disable roles: Task 3, Task 6, Task 7
- Template selection per role: Task 2, Task 6, Task 7
- Mapping many positions to one role: Task 3, Task 6, Task 7
- Unmatched manual handling: Task 5, Task 8, Task 9, Task 10
- Editor guardrails/validation: Task 3, Task 7
- Snapshot on plan creation: Task 1, Task 4
- Operations and employee compatibility: Task 8, Task 9, Task 10
- Verification: Task 12

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each task names exact files and commands.
- Code-touching steps include concrete target snippets.

### Type consistency

- `OnboardingRoleSettings`
- `OnboardingRoleSetting`
- `OnboardingRoleSettingsValidationIssue`
- `OnboardingRoleUnmatchedEmployeeView`

These names are used consistently across service, UI, and verification tasks.

