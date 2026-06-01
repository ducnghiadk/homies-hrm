# Onboarding User Flow And Sidebar IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize onboarding navigation and shell behavior so each user role lands in the right flow, while reducing sidebar overload on self-service and deep-detail pages.

**Architecture:** Keep current onboarding business logic intact, but change the information architecture around it: employee self-service stays at `/onboarding`, operations stays at `/career-path/onboarding`, onboarding settings stay in `career-path/settings`, and sidebar/shell rules are updated so these routes are presented under clearer labels and lighter page chrome where appropriate.

**Tech Stack:** Next.js App Router, React client components, TypeScript, existing `AppShell`, `sidebar-config`, local onboarding services.

---

## File Map

### Navigation and shell

- Modify: `src/lib/navigation/sidebar-config.ts`
  - Add role-based onboarding IA entries and rename employee-facing labels.
- Modify: `src/components/layout/AppShell.tsx`
  - Add compact-shell option and sidebar visibility rules by page intent.
- Modify: `src/components/layout/BottomNav.tsx`
  - Ensure employee-facing onboarding label still makes sense in bottom navigation if surfaced there later.

### Employee onboarding self-service

- Modify: `src/app/onboarding/page.tsx`
  - Update shell mode and wording to `Onboarding của tôi`.

### Operations onboarding

- Modify: `src/app/career-path/onboarding/page.tsx`
  - Update page title, framing, and shell intent to `Nhân sự mới > Checklist vận hành`.

### Settings entry points

- Modify: `src/app/career-path/settings/page.tsx`
  - Rename onboarding-related tabs/headers to align with `Cấu hình onboarding`.

### Documentation

- Modify: `docs/CODEMAP.md`
  - Add new IA pointers and shell rules.

### Verification

- Run: `npx tsx --test tests/onboarding-role-settings.test.ts`
- Run: `npm run build`

---

### Task 1: Add a failing navigation contract test or checklist note for the new IA

**Files:**
- Create: `tests/onboarding-navigation-ia.test.ts`
- Modify: `src/lib/navigation/sidebar-config.ts`

- [ ] **Step 1: Write the failing navigation expectations**

Create a lightweight TypeScript test that asserts:

- employee does not get desktop manager sidebar entries
- manager/admin entries include a new `Nhân sự mới` group
- employee-facing onboarding naming is `Onboarding của tôi`
- manager/admin no longer see ambiguous standalone onboarding under `Phát triển nhân viên`

Suggested test shape:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { getDesktopSidebarEntries } from '../src/lib/navigation/sidebar-config.ts'

test('manager roles get nhan su moi group', () => {
  const entries = getDesktopSidebarEntries('hr_admin')
  assert.ok(entries.some((entry) => entry.label === 'Nhân sự mới'))
})
```

- [ ] **Step 2: Run test to verify it fails first**

Run:

```bash
npx tsx --test tests/onboarding-navigation-ia.test.ts
```

Expected: FAIL because current sidebar config does not yet expose the new IA.

- [ ] **Step 3: Commit**

```bash
git add tests/onboarding-navigation-ia.test.ts
git commit -m "test: define onboarding navigation IA expectations"
```

If git is unavailable in this workspace, skip commit and note it in execution log.

---

### Task 2: Refactor desktop sidebar IA around `Nhân sự mới`

**Files:**
- Modify: `src/lib/navigation/sidebar-config.ts`
- Test: `tests/onboarding-navigation-ia.test.ts`

- [ ] **Step 1: Introduce a dedicated `Nhân sự mới` sidebar group**

Replace ambiguous manager/admin onboarding access with a new sidebar entry similar to:

```ts
{
  id: 'new-hires',
  label: 'Nhân sự mới',
  icon: Users,
  roles: ['store_manager', 'area_manager', 'hr_admin', 'ceo'],
  items: [
    { href: '/career-path', label: 'Tổng quan onboarding', roles: ['hr_admin', 'ceo'] },
    { href: '/career-path/onboarding', label: 'Checklist vận hành', roles: ['store_manager', 'area_manager', 'hr_admin', 'ceo'] },
    { href: '/career-path/settings', label: 'Cấu hình onboarding', roles: ['hr_admin', 'ceo', 'store_manager'] },
  ],
}
```

Use existing routes for now; label them according to the approved IA. If `/career-path` is too broad for `Tổng quan onboarding`, keep this item out of code for now and document that it will land in a later route pass instead of linking to a misleading page.

- [ ] **Step 2: Remove ambiguous manager/admin onboarding entry from growth section**

In the `Phát triển nhân viên` group:

- keep learning / goals / recognition items
- remove or rename the current `/onboarding` item so managers/admins do not hit the employee self-service screen

Employee-facing onboarding should not be shown in manager/admin sidebar groups.

- [ ] **Step 3: Keep employee naming separate**

If employee-only nav is defined outside desktop sidebar today, ensure future naming stays:

```ts
'Onboarding của tôi'
```

Do not reintroduce generic `Onboarding` for employee self-service.

- [ ] **Step 4: Re-run test to verify it passes**

Run:

```bash
npx tsx --test tests/onboarding-navigation-ia.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/navigation/sidebar-config.ts tests/onboarding-navigation-ia.test.ts
git commit -m "feat: reorganize onboarding sidebar IA by role"
```

---

### Task 3: Add shell modes so not every page shows full sidebar

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Write a failing expectation note in the test or scratch checklist**

Target behavior:

- hub pages keep full sidebar
- employee self-service pages and deep-detail pages can opt into compact shell

New prop recommendation:

```ts
type AppShellNavMode = 'full' | 'compact' | 'none'
```

Extend props:

```ts
type AppShellProps = {
  // existing props...
  navMode?: AppShellNavMode
}
```

- [ ] **Step 2: Implement shell mode logic**

Suggested rules:

```ts
const resolvedNavMode = navMode ?? (showManagerSidebar ? 'full' : 'none')
const showDesktopSidebar = resolvedNavMode === 'full' && showManagerSidebar
const showBottomNav = showNav && (
  resolvedNavMode === 'none'
  || resolvedNavMode === 'compact'
  || !showManagerSidebar
)
```

Compact mode should:

- keep header
- remove full left sidebar
- keep content width comfortable
- still allow back button / breadcrumb usage

- [ ] **Step 3: Preserve mobile drawer only for full mode**

Do not show manager mobile drawer on compact pages unless product explicitly wants it. Compact mode should reduce noise.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat: add compact shell mode for focused pages"
```

---

### Task 4: Reframe employee page as `Onboarding của tôi`

**Files:**
- Modify: `src/app/onboarding/page.tsx`

- [ ] **Step 1: Update shell mode**

Wrap page with compact shell:

```tsx
<AppShell title="Onboarding của tôi" navMode="compact">
```

This page is personal self-service, not a management workspace.

- [ ] **Step 2: Update user-facing copy**

Replace generic onboarding framing with employee-first language such as:

- page title: `Onboarding của tôi`
- empty-state copy: `HR chưa gán checklist cho tài khoản này, hoặc chức danh của bạn chưa được map role onboarding trong cấu hình.`

Do not add management wording like `vận hành`, `map role`, or `Checklist vận hành` in primary headings.

- [ ] **Step 3: Keep route stable**

Do not rename the route path yet unless product explicitly approves URL migration. Only change IA label and page chrome.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: frame employee self-service as my onboarding"
```

---

### Task 5: Reframe operations page as `Nhân sự mới > Checklist vận hành`

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- Modify: `src/components/onboarding-operations/OperationsChecklistDetail.tsx`

- [ ] **Step 1: Switch page to full hub mode**

Use:

```tsx
<AppShell navMode="full">
```

if the page is migrated into `AppShell`, or otherwise align page framing with hub semantics.

- [ ] **Step 2: Update headings to match IA**

Examples:

- page eyebrow: `Nhân sự mới`
- page title: `Checklist vận hành`
- list heading: `Người sắp vào làm`

The goal is that HR/store managers instantly understand this is operational onboarding, not employee self-service.

- [ ] **Step 3: Keep unmatched warning state explicit**

Preserve existing unmatched messaging, but align wording with the new IA:

- `Chưa map role`
- `Vào Cấu hình onboarding để map chức danh vào role onboarding và chọn template.`

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/career-path/onboarding/page.tsx src/components/onboarding-operations/UpcomingOnboardingList.tsx src/components/onboarding-operations/OperationsChecklistDetail.tsx
git commit -m "feat: reframe onboarding operations as new hires workspace"
```

---

### Task 6: Align settings wording with `Cấu hình onboarding`

**Files:**
- Modify: `src/app/career-path/settings/page.tsx`

- [ ] **Step 1: Add onboarding settings entry wording**

Where role/template/settings copy is shown, align text with:

- `Cấu hình onboarding`
- `Tên hiển thị`
- `Checklist template`
- `Nhân viên chưa match role`

Do not leave ASCII-only placeholders where user-facing copy is already being touched.

- [ ] **Step 2: Make it obvious this is admin config, not employee flow**

Add helper text near onboarding role settings:

```txt
Quản lý role onboarding, template và map chức danh cho nhóm nhân sự mới.
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/career-path/settings/page.tsx
git commit -m "feat: align onboarding settings wording with IA"
```

---

### Task 7: Update CODEMAP for new IA and shell rules

**Files:**
- Modify: `docs/CODEMAP.md`

- [ ] **Step 1: Add IA note**

Document that:

- `/onboarding` = `Onboarding của tôi`
- `/career-path/onboarding` = `Nhân sự mới > Checklist vận hành`
- onboarding settings in `career-path/settings` are treated as `Cấu hình onboarding`

- [ ] **Step 2: Add shell rule note**

Document:

- hub pages use full sidebar shell
- employee self-service and detail pages should prefer compact shell

- [ ] **Step 3: Commit**

```bash
git add docs/CODEMAP.md
git commit -m "docs: map onboarding IA and shell behavior"
```

---

### Task 8: Full verification

**Files:**
- Verify only

- [ ] **Step 1: Run onboarding role tests**

Run:

```bash
npx tsx --test tests/onboarding-role-settings.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run navigation IA tests**

Run:

```bash
npx tsx --test tests/onboarding-navigation-ia.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Manual smoke checklist**

Verify:

1. Employee sees `Onboarding của tôi`, not generic manager onboarding wording.
2. HR/CEO/store manager no longer use employee onboarding as their main entry point.
3. `Nhân sự mới` is easy to find in sidebar.
4. `Checklist vận hành` is understandable on first glance.
5. `Cấu hình onboarding` is clearly admin-only.
6. Compact pages no longer feel overloaded by full sidebar.

- [ ] **Step 5: Commit final state**

```bash
git add .
git commit -m "feat: improve onboarding IA and sidebar flow by role"
```
