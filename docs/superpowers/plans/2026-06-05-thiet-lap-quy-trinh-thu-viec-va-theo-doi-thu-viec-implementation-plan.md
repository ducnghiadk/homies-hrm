# Thi?t l?p quy tr?nh th? vi?c v? theo d?i th? vi?c Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** T?ch khu onboarding hi?n t?i th?nh hai m?n ??c l?p, m?t m?n thi?t l?p quy tr?nh th? vi?c v? m?t m?n theo d?i th? vi?c, v?i ti?ng Vi?t 100% v? ranh gi?i nghi?p v? r? r?ng.

**Architecture:** T?o m?t route ??c l?p cho m?n thi?t l?p quy tr?nh th? vi?c d??i c?m `Nh?n s? m?i`, gi? m?n theo d?i th? vi?c l? route v?n h?nh theo ng??i, r?i c?p nh?t ?i?u h??ng, c?u ch?, v? c?c h?p ??ng ki?m th? ?? ph?n ?nh ??ng hai t?ng. T?n d?ng d? li?u v? d?ch v? onboarding hi?n c?, ?u ti?n ??i c?u tr?c hi?n th? v? ng?n ng? tr??c khi ??ng s?u v?o m? h?nh d? li?u.

**Tech Stack:** Next.js App Router, React client components, TypeScript, d?ch v? d? li?u n?i b? trong `src/lib`, ki?m th? h?p ??ng b?ng `tsx --test`, ki?m tra m? ngu?n b?ng ESLint.

---

## C?u tr?c file d? ki?n

**T?o m?i:**
- `src/app/career-path/onboarding/setup/page.tsx` - m?n ??c l?p cho `Thi?t l?p quy tr?nh th? vi?c`.
- `src/components/onboarding-settings/TrialWorkflowWorkspaceHeader.tsx` - ??u trang m?i cho m?n thi?t l?p, ch? d?ng ng?n ng? `quy tr?nh th? vi?c`.
- `src/components/onboarding-settings/TrialWorkflowStagePlannerSection.tsx` - kh?i b??c 1 thi?t k? giai ?o?n.
- `src/components/onboarding-settings/TrialWorkflowTaskAuthoringSection.tsx` - kh?i b??c 2 so?n danh s?ch vi?c c?n l?m.
- `src/components/onboarding-settings/TrialWorkflowAssignmentPublishSection.tsx` - kh?i b??c 3 ch?n nh?m ?p d?ng v? ??a v?o s? d?ng.
- `tests/trial-workflow-navigation-contract.test.ts` - h?p ??ng ?i?u h??ng v? t?n g?i hai m?n.
- `tests/trial-workflow-setup-shell-contract.test.ts` - h?p ??ng cho m?n thi?t l?p m?i.
- `tests/trial-workflow-operations-copy-contract.test.ts` - h?p ??ng cho m?n theo d?i th? vi?c.

**S?a:**
- `src/lib/navigation/sidebar-config.ts` - ??i nh?n v? route trong c?m `Nh?n s? m?i`.
- `src/app/career-path/onboarding/overview/page.tsx` - ??i CTA v? c?u ch? ?? tr? sang hai m?n m?i.
- `src/app/career-path/onboarding/page.tsx` - ??i c?u ch? v? tr?ng t?m t? `V?n h?nh onboarding` sang `Theo d?i th? vi?c`.
- `src/app/career-path/settings/page.tsx` - g? vai tr? m?n thi?t l?p onboarding kh?i tab `C?u h?nh onboarding`, thay b?ng l?i ?i sang route m?i ho?c thu h?p n?i dung c?n l?i.
- `src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx` - ??i sang ng? ngh?a `quy tr?nh th? vi?c`.
- `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx` - b? th?ng ?i?p mang m?u v?n h?nh theo ng??i, thay b?ng ki?m tra m?c s?n s?ng c?a quy tr?nh.
- `src/components/onboarding-settings/OnboardingRoleFilters.tsx` - ??i copy t? `nh?m onboarding` sang `nh?m ?p d?ng` ho?c `nh?m c?ng vi?c`.
- `src/components/onboarding-settings/OnboardingRoleCard.tsx` - ??i copy hi?n th? sang `quy tr?nh`, `giai ?o?n`, `danh s?ch vi?c c?n l?m`, gi? logic g?n nh?m ?p d?ng.
- `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx` - ??i copy th? vi?n th?nh danh s?ch vi?c c?n l?m theo giai ?o?n.
- `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx` - ??i copy bi?n so?n n?i dung sang `so?n danh s?ch vi?c c?n l?m`.
- `src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx` - ??i copy ki?m tra tr??c khi d?ng v? ??a v?o s? d?ng.
- `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx` - ??i t?n c?ng c? ph? tr? cho ??ng spec.
- `tests/onboarding-navigation-ia.test.ts` - c?p nh?t IA cho t?n g?i m?i.
- `tests/onboarding-settings-ia.test.ts` - c?p nh?t h?p ??ng IA c?a m?n thi?t l?p.
- `tests/onboarding-settings-components-contract.test.ts` - c?p nh?t c?u ch? kh?i th?nh ph?n.
- `tests/onboarding-admin-settings-shell-contract.test.ts` ho?c thay b?ng file test m?i n?u c?n - c?p nh?t shell theo route m?i.
- `docs/CODEMAP.md` - ghi l?i entry point m?i sau khi code xong.

### Task 1: Kh?a ?i?u h??ng v? h?p ??ng t?n g?i

**Files:**
- Create: `tests/trial-workflow-navigation-contract.test.ts`
- Modify: `tests/onboarding-navigation-ia.test.ts`
- Modify: `src/lib/navigation/sidebar-config.ts`

- [ ] **Step 1: Vi?t ki?m th? th?t b?i cho ?i?u h??ng m?i**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sidebarSource = readFileSync(
  resolve(process.cwd(), 'src/lib/navigation/sidebar-config.ts'),
  'utf8',
)

test('c?m nh?n s? m?i d?ng ??ng hai m?n th? vi?c', () => {
  assert.equal(sidebarSource.includes('Thi?t l?p quy tr?nh th? vi?c'), true)
  assert.equal(sidebarSource.includes('Theo d?i th? vi?c'), true)
  assert.equal(sidebarSource.includes('/career-path/onboarding/setup'), true)
  assert.equal(sidebarSource.includes('/career-path/onboarding'), true)
  assert.equal(sidebarSource.includes('C?u h?nh onboarding'), false)
  assert.equal(sidebarSource.includes('V?n h?nh onboarding'), false)
})
```

- [ ] **Step 2: Ch?y ki?m th? ?? x?c nh?n ?ang l?i**

Run: `npx tsx --test tests/trial-workflow-navigation-contract.test.ts tests/onboarding-navigation-ia.test.ts`

Expected: FAIL v? menu hi?n t?i v?n c?n `C?u h?nh onboarding` v? ch?a c? route `/career-path/onboarding/setup`.

- [ ] **Step 3: C?p nh?t c?u h?nh sidebar cho ??ng IA m?i**

```ts
{
  id: 'new-hires',
  label: 'Nh?n s? m?i',
  icon: Users,
  roles: ONBOARDING_ADMIN_ROLES,
  items: [
    { href: '/career-path/onboarding/overview', label: 'T?ng quan th? vi?c', roles: ['hr_admin', 'ceo'] },
    { href: '/career-path/onboarding', label: 'Theo d?i th? vi?c', roles: ONBOARDING_ADMIN_ROLES },
    { href: '/career-path/onboarding/setup', label: 'Thi?t l?p quy tr?nh th? vi?c', roles: ['store_manager', 'hr_admin', 'ceo'] },
  ],
}
```

- [ ] **Step 4: C?p nh?t ki?m th? IA c? ?? d?ng t?n g?i m?i**

```ts
test('?i?u h??ng onboarding d?ng hai t?ng th? vi?c r? r?ng', () => {
  assert.equal(sidebarSource.includes('T?ng quan th? vi?c'), true)
  assert.equal(sidebarSource.includes('Theo d?i th? vi?c'), true)
  assert.equal(sidebarSource.includes('Thi?t l?p quy tr?nh th? vi?c'), true)
})
```

- [ ] **Step 5: Ch?y l?i ki?m th? ?i?u h??ng**

Run: `npx tsx --test tests/trial-workflow-navigation-contract.test.ts tests/onboarding-navigation-ia.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/trial-workflow-navigation-contract.test.ts tests/onboarding-navigation-ia.test.ts src/lib/navigation/sidebar-config.ts
git commit -m "feat: split new hire navigation into setup and tracking"
```

### Task 2: D?ng route m?i cho m?n thi?t l?p quy tr?nh th? vi?c

**Files:**
- Create: `src/app/career-path/onboarding/setup/page.tsx`
- Create: `tests/trial-workflow-setup-shell-contract.test.ts`
- Modify: `src/app/career-path/onboarding/overview/page.tsx`

- [ ] **Step 1: Vi?t ki?m th? th?t b?i cho shell m?n thi?t l?p**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = readFileSync(
  resolve(process.cwd(), 'src/app/career-path/onboarding/setup/page.tsx'),
  'utf8',
)

test('m?n thi?t l?p d?ng ti?u ?? quy tr?nh th? vi?c', () => {
  assert.equal(pageSource.includes('Thi?t l?p quy tr?nh th? vi?c'), true)
  assert.equal(pageSource.includes('T?o quy tr?nh th? vi?c chu?n ?? nh?n vi?n m?i ???c giao ??ng vi?c theo t?ng giai ?o?n.'), true)
  assert.equal(pageSource.includes('B??c 1. Thi?t k? c?c giai ?o?n th? vi?c'), true)
  assert.equal(pageSource.includes('B??c 2. So?n danh s?ch vi?c c?n l?m'), true)
  assert.equal(pageSource.includes('B??c 3. Ch?n nh?m ?p d?ng v? ??a v?o s? d?ng'), true)
})
```

- [ ] **Step 2: Ch?y ki?m th? shell ?? x?c nh?n route ch?a t?n t?i**

Run: `npx tsx --test tests/trial-workflow-setup-shell-contract.test.ts`

Expected: FAIL v?i l?i kh?ng ??c ???c `src/app/career-path/onboarding/setup/page.tsx`.

- [ ] **Step 3: T?o route m?i v?i shell t?i thi?u**

```tsx
'use client'

import AppShell from '@/components/layout/AppShell'
import { TrialWorkflowWorkspaceHeader } from '@/components/onboarding-settings/TrialWorkflowWorkspaceHeader'

export default function TrialWorkflowSetupPage() {
  return (
    <AppShell navMode="full">
      <div style={{ padding: '20px 24px 96px', maxWidth: 1280, margin: '0 auto' }}>
        <TrialWorkflowWorkspaceHeader
          title="Thi?t l?p quy tr?nh th? vi?c"
          subtitle="T?o quy tr?nh th? vi?c chu?n ?? nh?n vi?n m?i ???c giao ??ng vi?c theo t?ng giai ?o?n."
        />
        <section id="trial-workflow-step-1">
          <h2>B??c 1. Thi?t k? c?c giai ?o?n th? vi?c</h2>
        </section>
        <section id="trial-workflow-step-2">
          <h2>B??c 2. So?n danh s?ch vi?c c?n l?m</h2>
        </section>
        <section id="trial-workflow-step-3">
          <h2>B??c 3. Ch?n nh?m ?p d?ng v? ??a v?o s? d?ng</h2>
        </section>
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 4: ??i CTA ? m?n t?ng quan ?? tr? ??ng route m?i**

```tsx
<Link href="/career-path/onboarding/setup" className="rounded-full border ...">
  M? thi?t l?p quy tr?nh th? vi?c
</Link>
```

- [ ] **Step 5: Ch?y l?i ki?m th? shell**

Run: `npx tsx --test tests/trial-workflow-setup-shell-contract.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/career-path/onboarding/setup/page.tsx src/app/career-path/onboarding/overview/page.tsx src/components/onboarding-settings/TrialWorkflowWorkspaceHeader.tsx tests/trial-workflow-setup-shell-contract.test.ts
git commit -m "feat: add trial workflow setup route shell"
```

### Task 3: Tr?ch ??u trang v? ??i c?u ch? n?n t?ng cho m?n thi?t l?p

**Files:**
- Create: `src/components/onboarding-settings/TrialWorkflowWorkspaceHeader.tsx`
- Modify: `src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx`
- Modify: `tests/onboarding-settings-components-contract.test.ts`

- [ ] **Step 1: Vi?t ki?m th? th?t b?i cho ??u trang v? thanh ph? tr?**

```ts
test('m?n thi?t l?p d?ng c?u ch? quy tr?nh th? vi?c', () => {
  assert.equal(componentSource.includes('Thi?t l?p quy tr?nh th? vi?c'), true)
  assert.equal(componentSource.includes('T?o quy tr?nh th? vi?c chu?n ?? nh?n vi?n m?i ???c giao ??ng vi?c theo t?ng giai ?o?n.'), true)
  assert.equal(componentSource.includes('H?m nay c?n l?m g??'), true)
  assert.equal(componentSource.includes('?i theo 3 b??c ?? ho?n thi?n quy tr?nh th? vi?c tr??c khi ??a v?o s? d?ng.'), true)
})
```

- [ ] **Step 2: Ch?y ki?m th? ?? x?c nh?n c?u ch? hi?n t?i ch?a ??ng**

Run: `npx tsx --test tests/onboarding-settings-components-contract.test.ts`

Expected: FAIL v? source hi?n t?i c?n ng?n ng? `onboarding` v? `c?u h?nh`.

- [ ] **Step 3: T?o component ??u trang m?i chuy?n tr?ch**

```tsx
import React from 'react'

export function TrialWorkflowWorkspaceHeader({
  saveMessage,
  statusLabel,
}: {
  saveMessage: string
  statusLabel: string
}) {
  return (
    <section>
      <div>Thi?t l?p quy tr?nh th? vi?c</div>
      <h1>T?o quy tr?nh th? vi?c chu?n ?? nh?n vi?n m?i ???c giao ??ng vi?c theo t?ng giai ?o?n.</h1>
      <div>{statusLabel}</div>
      <div>{saveMessage}</div>
    </section>
  )
}
```

- [ ] **Step 4: ??i copy ? thanh ph? tr? ?? n?i ??ng vai tr? m?n**

```tsx
<div>H?m nay c?n l?m g??</div>
<div>?i theo 3 b??c ?? ho?n thi?n quy tr?nh th? vi?c tr??c khi ??a v?o s? d?ng.</div>
<div style={railSectionTitleStyle}>Nh?n nhanh</div>
<div style={railSectionTitleStyle}>?i t?i ??ng b??c</div>
```

- [ ] **Step 5: Ch?y l?i ki?m th? th?nh ph?n**

Run: `npx tsx --test tests/onboarding-settings-components-contract.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding-settings/TrialWorkflowWorkspaceHeader.tsx src/components/onboarding-settings/OnboardingSettingsAdminRail.tsx tests/onboarding-settings-components-contract.test.ts
git commit -m "feat: rename setup shell copy to trial workflow terms"
```

### Task 4: T?ch m?n thi?t l?p kh?i `C?i ??t Career Path` v? gh?p c?c kh?i theo ??ng 3 b??c

**Files:**
- Modify: `src/app/career-path/settings/page.tsx`
- Modify: `src/app/career-path/onboarding/setup/page.tsx`
- Create: `src/components/onboarding-settings/TrialWorkflowStagePlannerSection.tsx`
- Create: `src/components/onboarding-settings/TrialWorkflowTaskAuthoringSection.tsx`
- Create: `src/components/onboarding-settings/TrialWorkflowAssignmentPublishSection.tsx`
- Modify: `tests/onboarding-settings-ia.test.ts`
- Modify: `tests/trial-workflow-setup-shell-contract.test.ts`

- [ ] **Step 1: Vi?t ki?m th? th?t b?i cho b? c?c 3 b??c ? route m?i**

```ts
test('m?n thi?t l?p s?p x?p ??ng ba b??c v? c?ng c? h? tr?', () => {
  assert.equal(pageSource.includes('Th?ng tin quy tr?nh'), true)
  assert.equal(pageSource.includes('B??c 1. Thi?t k? c?c giai ?o?n th? vi?c'), true)
  assert.equal(pageSource.includes('B??c 2. So?n danh s?ch vi?c c?n l?m'), true)
  assert.equal(pageSource.includes('B??c 3. Ch?n nh?m ?p d?ng v? ??a v?o s? d?ng'), true)
  assert.equal(pageSource.includes('C?ng c? h? tr?'), true)
})
```

- [ ] **Step 2: Ch?y ki?m th? IA ?? x?c nh?n ch?a ?? kh?i**

Run: `npx tsx --test tests/onboarding-settings-ia.test.ts tests/trial-workflow-setup-shell-contract.test.ts`

Expected: FAIL v? route m?i m?i ch? c? shell t?i thi?u.

- [ ] **Step 3: R?t m?n `roles` trong `settings/page.tsx` v? vai tr? d?n ???ng**

```tsx
{activeTab === 'roles' ? (
  <Panel
    title="Thi?t l?p quy tr?nh th? vi?c"
    subtitle="M?n thi?t l?p ?? ???c chuy?n sang khu Nh?n s? m?i ?? t?ch kh?i c?i ??t chung."
  >
    <Link href="/career-path/onboarding/setup">M? thi?t l?p quy tr?nh th? vi?c</Link>
  </Panel>
) : null}
```

- [ ] **Step 4: T?o ba section chuy?n tr?ch cho route m?i**

```tsx
<TrialWorkflowStagePlannerSection
  title="B??c 1. Thi?t k? c?c giai ?o?n th? vi?c"
  helper="X?c ??nh quy tr?nh th? vi?c g?m nh?ng giai ?o?n n?o v? th? t? th?c hi?n ra sao."
/>
<TrialWorkflowTaskAuthoringSection
  title="B??c 2. So?n danh s?ch vi?c c?n l?m"
  helper="M?i giai ?o?n c?n c? danh s?ch vi?c r? r?ng ?? ng??i m?i v? ng??i h??ng d?n bi?t ph?i l?m g?."
/>
<TrialWorkflowAssignmentPublishSection
  title="B??c 3. Ch?n nh?m ?p d?ng v? ??a v?o s? d?ng"
  helper="Ch?n nh?m s? d?ng quy tr?nh n?y, sau ?? ki?m tra l?i tr??c khi ??a v?o s? d?ng."
/>
```

- [ ] **Step 5: Ch?y l?i ki?m th? IA**

Run: `npx tsx --test tests/onboarding-settings-ia.test.ts tests/trial-workflow-setup-shell-contract.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/career-path/settings/page.tsx src/app/career-path/onboarding/setup/page.tsx src/components/onboarding-settings/TrialWorkflowStagePlannerSection.tsx src/components/onboarding-settings/TrialWorkflowTaskAuthoringSection.tsx src/components/onboarding-settings/TrialWorkflowAssignmentPublishSection.tsx tests/onboarding-settings-ia.test.ts tests/trial-workflow-setup-shell-contract.test.ts
git commit -m "feat: move trial workflow setup out of settings tab"
```

### Task 5: ??i c?u ch? v? tr?ng th?i trong c?c kh?i thi?t l?p sang ti?ng Vi?t nghi?p v?

**Files:**
- Modify: `src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleFilters.tsx`
- Modify: `src/components/onboarding-settings/OnboardingRoleCard.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx`
- Modify: `src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx`
- Modify: `src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx`
- Modify: `src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx`
- Modify: `tests/onboarding-settings-components-contract.test.ts`

- [ ] **Step 1: Vi?t ki?m th? th?t b?i cho ng?n ng? nghi?p v? m?i**

```ts
test('kh?i thi?t l?p d?ng ti?ng Vi?t nghi?p v? th? vi?c', () => {
  assert.equal(roleFilterSource.includes('T?m nh?m ?p d?ng ho?c ch?c danh'), true)
  assert.equal(roleCardSource.includes('Nh?m ?p d?ng'), true)
  assert.equal(roleCardSource.includes('Danh s?ch vi?c c?n l?m ?ang d?ng'), true)
  assert.equal(urgentPanelSource.includes('Quy tr?nh ch?a s?n s?ng ??a v?o s? d?ng'), true)
  assert.equal(publishPanelSource.includes('Ki?m tra tr??c khi d?ng'), true)
  assert.equal(publishPanelSource.includes('??a v?o s? d?ng'), true)
})
```

- [ ] **Step 2: Ch?y ki?m th? ?? x?c nh?n c?c component c?n d?ng t? c?**

Run: `npx tsx --test tests/onboarding-settings-components-contract.test.ts`

Expected: FAIL.

- [ ] **Step 3: ??i copy kh?i c?nh b?o t? l?i c?u h?nh ng??i sang m?c s?n s?ng quy tr?nh**

```tsx
const trialWorkflowAlerts = [
  'Ch?a c? giai ?o?n n?o',
  'C? giai ?o?n ch?a c? vi?c c?n l?m',
  'Ch?a ch?n nh?m ?p d?ng',
]
```

- [ ] **Step 4: ??i copy b? l?c v? th? nh?m ?p d?ng**

```tsx
const filterOptions = [
  { key: 'all', label: 'T?t c?' },
  { key: 'enabled', label: '?ang s? d?ng' },
  { key: 'issues', label: 'C?n ho?n thi?n' },
  { key: 'missing_template', label: 'Ch?a c? danh s?ch vi?c' },
]
```

```tsx
<div style={fieldLabelStyle}>Danh s?ch vi?c c?n l?m ?ang d?ng</div>
<div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Nh?m ?p d?ng</div>
<input placeholder="T?m nh?m ?p d?ng ho?c ch?c danh" />
```

- [ ] **Step 5: ??i copy th? vi?n, bi?n so?n, ph?t h?nh, c?ng c? ph?**

```tsx
<h3>So?n danh s?ch vi?c c?n l?m</h3>
<button>Ki?m tra tr??c khi d?ng</button>
<button>??a v?o s? d?ng</button>
<div>C?ng c? h? tr?</div>
<a>Xem tr??c quy tr?nh</a>
<a>L?ch s? thay ??i</a>
```

- [ ] **Step 6: Ch?y l?i ki?m th? th?nh ph?n**

Run: `npx tsx --test tests/onboarding-settings-components-contract.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding-settings/OnboardingSettingsUrgentPanel.tsx src/components/onboarding-settings/OnboardingRoleFilters.tsx src/components/onboarding-settings/OnboardingRoleCard.tsx src/components/onboarding-settings/OnboardingTemplateLibrarySection.tsx src/components/onboarding-settings/OnboardingTemplateEditorSection.tsx src/components/onboarding-settings/OnboardingPublishValidationPanel.tsx src/components/onboarding-settings/OnboardingSettingsSecondaryTools.tsx tests/onboarding-settings-components-contract.test.ts
git commit -m "feat: translate setup workspace into trial workflow language"
```

### Task 6: ??i m?n v?n h?nh th?nh `Theo d?i th? vi?c`

**Files:**
- Modify: `src/app/career-path/onboarding/page.tsx`
- Modify: `src/app/career-path/onboarding/overview/page.tsx`
- Create: `tests/trial-workflow-operations-copy-contract.test.ts`
- Modify: `tests/onboarding-overview-contract.test.ts`
- Modify: `tests/onboarding-operations-task-first-contract.test.ts`

- [ ] **Step 1: Vi?t ki?m th? th?t b?i cho c?u ch? v?n h?nh m?i**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const operationsPage = readFileSync(resolve(process.cwd(), 'src/app/career-path/onboarding/page.tsx'), 'utf8')

test('m?n v?n h?nh d?ng t?n theo d?i th? vi?c', () => {
  assert.equal(operationsPage.includes('Theo d?i th? vi?c'), true)
  assert.equal(operationsPage.includes('Theo d?i t?ng nh?n vi?n m?i ?ang th? vi?c, bi?t h? ?ang ? giai ?o?n n?o v? c?n thi?u vi?c g?.'), true)
  assert.equal(operationsPage.includes('V?n h?nh onboarding'), false)
})
```

- [ ] **Step 2: Ch?y ki?m th? ?? x?c nh?n ?ang sai copy**

Run: `npx tsx --test tests/trial-workflow-operations-copy-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-task-first-contract.test.ts`

Expected: FAIL.

- [ ] **Step 3: ??i ti?u ?? v? m? t? ? route v?n h?nh**

```tsx
<div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
  Th? vi?c
</div>
<h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', color: '#001D3D' }}>Theo d?i th? vi?c</h1>
<div style={{ marginTop: 6, fontSize: 13, color: '#5F6B7A' }}>
  Theo d?i t?ng nh?n vi?n m?i ?ang th? vi?c, bi?t h? ?ang ? giai ?o?n n?o v? c?n thi?u vi?c g?.
</div>
```

- [ ] **Step 4: ??i CTA ? t?ng quan sang ??ng hai m?n m?i**

```tsx
<Link href="/career-path/onboarding" className="rounded-full bg-[#2F6FA8] ...">
  M? theo d?i th? vi?c
</Link>
<Link href="/career-path/onboarding/setup" className="rounded-full border ...">
  M? thi?t l?p quy tr?nh th? vi?c
</Link>
```

- [ ] **Step 5: Ch?y l?i ki?m th? m?n v?n h?nh**

Run: `npx tsx --test tests/trial-workflow-operations-copy-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-task-first-contract.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/career-path/onboarding/page.tsx src/app/career-path/onboarding/overview/page.tsx tests/trial-workflow-operations-copy-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-task-first-contract.test.ts
git commit -m "feat: rename operations workspace to trial tracking"
```

### Task 7: G?n d? li?u hi?n c? v?o kh?i thi?t l?p m?i m? kh?ng ??i logic l?i

**Files:**
- Modify: `src/app/career-path/onboarding/setup/page.tsx`
- Modify: `src/lib/career-path-service.ts`
- Modify: `src/lib/career-path-types.ts`
- Modify: `tests/onboarding-role-settings.test.ts`
- Modify: `tests/onboarding-template-publish-validation.test.ts`

- [ ] **Step 1: Vi?t ki?m th? th?t b?i cho ?nh x? d? li?u hi?n c? sang ng?n ng? m?i**

```ts
test('tr?nh ki?m tra quy tr?nh y?u c?u c? ?t nh?t m?t nh?m ?p d?ng', () => {
  const report = validateOnboardingRoleSettings({
    version: 1,
    roles: [
      {
        role_code: 'cashier',
        label: 'Thu ng?n',
        enabled: true,
        template_id: 'template-cashier-v1',
        mapped_position_ids: [],
      },
    ],
  })

  assert.equal(report.some((issue) => issue.message.includes('Ch?a ch?n nh?m ?p d?ng')), true)
})
```

- [ ] **Step 2: Ch?y ki?m th? ?? x?c nh?n th?ng ?i?p hi?n t?i ch?a ??ng**

Run: `npx tsx --test tests/onboarding-role-settings.test.ts tests/onboarding-template-publish-validation.test.ts`

Expected: FAIL ho?c assertion mismatch ? th?ng ?i?p v? b?o c?o.

- [ ] **Step 3: Gi? m? h?nh d? li?u c? nh?ng b? sung l?p di?n gi?i theo spec**

```ts
export type TrialWorkflowReadinessIssueCode =
  | 'missing_stage'
  | 'missing_task_list'
  | 'missing_assignment_group'

export type TrialWorkflowReadinessIssue = {
  code: TrialWorkflowReadinessIssueCode
  message: string
}
```

```ts
export function buildTrialWorkflowReadinessReport(settings: OnboardingRoleSettings): TrialWorkflowReadinessIssue[] {
  const issues: TrialWorkflowReadinessIssue[] = []
  if (settings.roles.length === 0) {
    issues.push({ code: 'missing_stage', message: 'Ch?a c? giai ?o?n n?o' })
  }
  if (settings.roles.some((role) => !role.template_id)) {
    issues.push({ code: 'missing_task_list', message: 'C? giai ?o?n ch?a c? vi?c c?n l?m' })
  }
  if (settings.roles.every((role) => role.mapped_position_ids.length === 0)) {
    issues.push({ code: 'missing_assignment_group', message: 'Ch?a ch?n nh?m ?p d?ng' })
  }
  return issues
}
```

- [ ] **Step 4: D?ng b?o c?o m?i trong route setup thay cho c?ch gh?p l?i t? m?n c?**

```tsx
const readinessIssues = buildTrialWorkflowReadinessReport(draft)
const canPublish = readinessIssues.length === 0
```

- [ ] **Step 5: Ch?y l?i ki?m th? d? li?u**

Run: `npx tsx --test tests/onboarding-role-settings.test.ts tests/onboarding-template-publish-validation.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/career-path/onboarding/setup/page.tsx src/lib/career-path-service.ts src/lib/career-path-types.ts tests/onboarding-role-settings.test.ts tests/onboarding-template-publish-validation.test.ts
git commit -m "feat: add trial workflow readiness report"
```

### Task 8: C?p nh?t t?i li?u ??nh v? m? ngu?n

**Files:**
- Modify: `docs/CODEMAP.md`

- [ ] **Step 1: Th?m entry point m?i cho hai m?n th? vi?c**

```md
- `/career-path/onboarding/setup` = `Nh?n s? m?i > Thi?t l?p quy tr?nh th? vi?c`
- `/career-path/onboarding` = `Nh?n s? m?i > Theo d?i th? vi?c`
- `src/app/career-path/onboarding/setup/page.tsx` = workspace thi?t l?p quy tr?nh th? vi?c
- `src/app/career-path/onboarding/page.tsx` = workspace theo d?i th? vi?c theo t?ng nh?n vi?n
```

- [ ] **Step 2: Ki?m tra l?i kh?ng c?n m? t? c? g?y l?n t?ng**

Run: `rg -n "C?u h?nh onboarding|V?n h?nh onboarding" docs/CODEMAP.md`

Expected: ch? c?n k?t qu? trong ph?n l?ch s? n?u c? ch? ??ch; n?u c?n entry ch?nh th? s?a ti?p.

- [ ] **Step 3: Commit**

```bash
git add docs/CODEMAP.md
git commit -m "docs: map trial workflow setup and tracking routes"
```

### Task 9: Ki?m tra to?n b? v? ch?t tr??c khi xin review

**Files:**
- Verify only: `src/app/career-path/onboarding/setup/page.tsx`
- Verify only: `src/app/career-path/onboarding/page.tsx`
- Verify only: `src/app/career-path/onboarding/overview/page.tsx`
- Verify only: `src/lib/navigation/sidebar-config.ts`
- Verify only: `src/components/onboarding-settings/*`
- Verify only: `tests/*trial-workflow*`

- [ ] **Step 1: Ch?y nh?m ki?m th? ?i?u h??ng v? h?p ??ng m?n h?nh**

Run: `npx tsx --test tests/trial-workflow-navigation-contract.test.ts tests/trial-workflow-setup-shell-contract.test.ts tests/trial-workflow-operations-copy-contract.test.ts tests/onboarding-navigation-ia.test.ts tests/onboarding-settings-ia.test.ts tests/onboarding-settings-components-contract.test.ts tests/onboarding-overview-contract.test.ts tests/onboarding-operations-task-first-contract.test.ts tests/onboarding-role-settings.test.ts tests/onboarding-template-publish-validation.test.ts`

Expected: PASS v?i to?n b? test li?n quan th? vi?c v? onboarding IA.

- [ ] **Step 2: Ch?y ESLint tr?n ??ng ph?m vi ??i**

Run: `npx eslint src/app/career-path/onboarding/setup/page.tsx src/app/career-path/onboarding/page.tsx src/app/career-path/onboarding/overview/page.tsx src/app/career-path/settings/page.tsx src/lib/navigation/sidebar-config.ts src/lib/career-path-service.ts src/lib/career-path-types.ts src/components/onboarding-settings/*.tsx`

Expected: exit 0.

- [ ] **Step 3: Ch?y build ?ng d?ng**

Run: `npm run build -- --webpack`

Expected: build th?nh c?ng, kh?ng c? l?i route m?i ho?c import m?i.

- [ ] **Step 4: Ki?m tra tay c?c h?nh tr?nh ch?nh**

Run:

```bash
npm run dev
```

Manual checklist:
- M? `/career-path/onboarding/overview`, th?y hai CTA m?i.
- M? `/career-path/onboarding/setup`, th?y ba b??c thi?t l?p v? c?ng c? h? tr?.
- M? `/career-path/onboarding`, th?y ti?u ?? `Theo d?i th? vi?c`.
- M? sidebar `Nh?n s? m?i`, th?y `T?ng quan th? vi?c`, `Theo d?i th? vi?c`, `Thi?t l?p quy tr?nh th? vi?c`.
- M? `/career-path/settings`, tab c? kh?ng c?n ??ng vai tr? m?n thi?t l?p ch?nh.

Expected: m?i lu?ng ??ng nh? spec, kh?ng c?n c?m gi?c g?n ng??i ? m?n thi?t l?p.

- [ ] **Step 5: Commit**

```bash
git add src/app/career-path/onboarding/setup/page.tsx src/app/career-path/onboarding/page.tsx src/app/career-path/onboarding/overview/page.tsx src/app/career-path/settings/page.tsx src/lib/navigation/sidebar-config.ts src/lib/career-path-service.ts src/lib/career-path-types.ts src/components/onboarding-settings docs/CODEMAP.md tests
git commit -m "feat: split trial workflow setup from trial tracking"
```
