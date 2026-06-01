# Onboarding Day-1 Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lam cho checklist onboarding ngay dau cua muc noi quy dang tin hon bang cach cho 2 man HR/manager va nhan vien doc cung 1 logic that tu `OnboardingPolicyService`.

**Architecture:** Giu nguyen flow noi quy hien co va khong tao them du lieu moi. Bo sung mot helper snapshot trong `OnboardingPolicyService` de suy ra checklist ngay dau, roi cho `src/app/employees/[id]/page.tsx` va `src/app/onboarding/page.tsx` render tu snapshot nay thay vi tu noi logic rieng hoac dua qua nhieu vao mock.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, localStorage-backed service, Tailwind CSS v4, ESLint.

---

## File Map

- Modify: `src/lib/services/onboarding-policy-service.ts`
  Responsibility: them type va helper suy ra day-1 checklist snapshot tu record that, khong tao side effect.
- Modify: `src/app/onboarding/page.tsx`
  Responsibility: dung snapshot de hien trang thai, thong diep cho nhan vien, va dong bo task `Doc noi quy cong ty`.
- Modify: `src/app/employees/[id]/page.tsx`
  Responsibility: dung snapshot de hien checklist ngay dau ro rang cho HR/manager va khoa/mo action `chot tai cua hang` dung dieu kien.

## Task 1: Bo sung snapshot helper trong onboarding policy service

**Files:**
- Modify: `src/lib/services/onboarding-policy-service.ts`
- Test: `npx eslint src/lib/services/onboarding-policy-service.ts`

- [x] **Step 1: Them type cho checklist item va snapshot**

Chen type moi gan sau `EmployeeOnboardingPolicyRecord`:

```ts
export interface OnboardingDayOneChecklistItem {
  id: 'summary' | 'full' | 'responded' | 'clarification' | 'store_confirmed'
  label: string
  done: boolean
  tone: 'done' | 'pending' | 'warning'
  hint: string
}

export interface OnboardingDayOneChecklistSnapshot {
  status: OnboardingPolicyStatus
  needsManagerAttention: boolean
  needsEmployeeAction: boolean
  canConfirmAtStore: boolean
  summarySent: boolean
  fullSent: boolean
  employeeResponded: boolean
  clarificationRequested: boolean
  acknowledged: boolean
  storeConfirmed: boolean
  waitingLabel: string
  nextActionLabel: string
  items: OnboardingDayOneChecklistItem[]
}
```

- [x] **Step 2: Viet helper suy ra labels va booleans**

Them helper thuần, khong side effect, gan truoc `export const OnboardingPolicyService`:

```ts
function buildDayOneChecklistSnapshot(
  record: EmployeeOnboardingPolicyRecord | null,
): OnboardingDayOneChecklistSnapshot {
  const status = record?.status || 'chua_gui'
  const summarySent = Boolean(record?.summary_sent_at)
  const fullSent = Boolean(record?.full_sent_at)
  const clarificationRequested = Boolean(record?.clarification_requested_at) || status === 'can_giai_thich'
  const acknowledged = Boolean(record?.acknowledged_at)
  const storeConfirmed = Boolean(record?.confirmed_at_store_at)
  const employeeResponded = acknowledged || clarificationRequested
  const needsEmployeeAction = fullSent && !employeeResponded
  const canConfirmAtStore = fullSent && !storeConfirmed
  const needsManagerAttention = clarificationRequested || (fullSent && !storeConfirmed && !acknowledged)

  let waitingLabel = 'Dang cho HR kich hoat noi quy day du'
  let nextActionLabel = 'HR can gui noi quy day du dung moc onboarding'

  if (clarificationRequested) {
    waitingLabel = 'Dang cho HR giai thich them truoc ngay dau'
    nextActionLabel = 'HR/quan ly can giai thich roi moi chot onboarding tai cua hang'
  } else if (storeConfirmed) {
    waitingLabel = 'Da hoan tat buoc noi quy ngay dau'
    nextActionLabel = 'Khong con thao tac nao o muc noi quy'
  } else if (acknowledged) {
    waitingLabel = 'Nhan vien da xac nhan noi quy'
    nextActionLabel = 'Ngay dau quan ly co the chot tai cua hang'
  } else if (needsEmployeeAction) {
    waitingLabel = 'Dang cho nhan vien doc va phan hoi'
    nextActionLabel = 'Nhan vien can xac nhan hoac gui yeu cau giai thich them'
  } else if (summarySent && !fullSent) {
    waitingLabel = 'Da gui ban tom tat, chua gui ban day du'
    nextActionLabel = 'HR can kich hoat ban noi quy day du theo dung moc'
  }

  return {
    status,
    needsManagerAttention,
    needsEmployeeAction,
    canConfirmAtStore,
    summarySent,
    fullSent,
    employeeResponded,
    clarificationRequested,
    acknowledged,
    storeConfirmed,
    waitingLabel,
    nextActionLabel,
    items: [
      {
        id: 'summary',
        label: 'Da gui noi quy tom tat',
        done: summarySent,
        tone: summarySent ? 'done' : 'pending',
        hint: summarySent ? 'Nhan vien da nhan cac diem can biet som.' : 'Nen gui som de nhan vien biet truoc quy dinh chinh.',
      },
      {
        id: 'full',
        label: 'Da gui noi quy day du',
        done: fullSent,
        tone: fullSent ? 'done' : 'pending',
        hint: fullSent ? 'Nhan vien da co ban day du de doc va phan hoi.' : 'Can gui ban day du truoc khi yeu cau nhan vien xac nhan.',
      },
      {
        id: 'responded',
        label: 'Nhan vien da phan hoi',
        done: employeeResponded,
        tone: employeeResponded ? 'done' : fullSent ? 'warning' : 'pending',
        hint: employeeResponded ? 'Nhan vien da xac nhan hoac da gui yeu cau can HR giai thich.' : 'Dang cho nhan vien xac nhan hoac yeu cau giai thich.',
      },
      {
        id: 'clarification',
        label: 'Can HR giai thich them',
        done: !clarificationRequested,
        tone: clarificationRequested ? 'warning' : 'done',
        hint: clarificationRequested ? 'Can xu ly truoc khi chot onboarding ngay dau.' : 'Khong co yeu cau giai thich dang mo.',
      },
      {
        id: 'store_confirmed',
        label: 'Da chot tai cua hang',
        done: storeConfirmed,
        tone: storeConfirmed ? 'done' : canConfirmAtStore ? 'pending' : 'pending',
        hint: storeConfirmed ? 'Quan ly/HR da chot buoc noi quy ngay dau.' : 'Ngay dau quan ly can check lai va chot tai cua hang neu can.',
      },
    ],
  }
}
```

- [x] **Step 3: Expose helper qua service**

Them method public trong `OnboardingPolicyService`:

```ts
  getDayOneChecklistSnapshot(record: EmployeeOnboardingPolicyRecord | null) {
    return buildDayOneChecklistSnapshot(record)
  },
```

- [x] **Step 4: Run lint cho service**

Run: `npx eslint src/lib/services/onboarding-policy-service.ts`
Expected: exit code `0`

- [ ] **Step 5: Commit task 1**

```bash
git add src/lib/services/onboarding-policy-service.ts
git commit -m "feat: add onboarding day-one checklist snapshot"
```

## Task 2: Dong bo man nhan vien theo snapshot that

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/lib/services/onboarding-policy-service.ts`
- Test: `npx eslint src/app/onboarding/page.tsx src/lib/services/onboarding-policy-service.ts`

- [x] **Step 1: Lay snapshot tu service**

Trong `src/app/onboarding/page.tsx`, sau khi co `policyRecord`, tinh them:

```ts
  const policyRecord = { ...OnboardingPolicyService.ensureRecordFromEmployee(user) } as EmployeeOnboardingPolicyRecord
  const dayOneSnapshot = OnboardingPolicyService.getDayOneChecklistSnapshot(policyRecord)
```

Va doi:

```ts
  const hasAcknowledgedPolicy = dayOneSnapshot.acknowledged
```

- [x] **Step 2: Doi task `Doc noi quy cong ty` sang dung snapshot**

Sua block `onboardingTasks`:

```ts
  const onboardingTasks = mockOnboardingTasks.map((task) =>
    task.id === 'ob-004'
      ? {
          ...task,
          done: dayOneSnapshot.acknowledged || dayOneSnapshot.storeConfirmed,
        }
      : task,
  )
```

- [x] **Step 3: Doi thong diep card noi quy sang dung snapshot**

Thay phan mo ta text trong card bang:

```tsx
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {dayOneSnapshot.waitingLabel}
              </p>
              <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                {dayOneSnapshot.nextActionLabel}
              </p>
```

Va cap nhat badge theo snapshot thay vi tu switch rieng:

```ts
  const policyStatusTone = (() => {
    if (dayOneSnapshot.storeConfirmed || dayOneSnapshot.acknowledged) {
      return { label: 'Da hoan tat', color: 'var(--success)', background: 'color-mix(in srgb, var(--success) 12%, white)' }
    }
    if (dayOneSnapshot.clarificationRequested) {
      return { label: 'Can HR giai thich', color: 'var(--warning)', background: 'color-mix(in srgb, var(--warning) 12%, white)' }
    }
    if (dayOneSnapshot.needsEmployeeAction) {
      return { label: 'Dang cho ban phan hoi', color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 10%, white)' }
    }
    if (dayOneSnapshot.summarySent && !dayOneSnapshot.fullSent) {
      return { label: 'Da gui tom tat', color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 12%, white)' }
    }
    return { label: 'Dang cho HR', color: 'var(--text-secondary)', background: 'var(--gray-100)' }
  })()
```

- [x] **Step 4: Khoa/hien nut thao tac dung case**

Trong card noi quy:
- chi hien 2 nut khi `dayOneSnapshot.fullSent && !dayOneSnapshot.storeConfirmed`
- disable nut xac nhan khi `hasAcknowledgedPolicy`
- disable ca 2 nut khi `dayOneSnapshot.clarificationRequested`

Doan render co the sua thanh:

```tsx
              {dayOneSnapshot.fullSent && !dayOneSnapshot.storeConfirmed ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAcknowledgePolicy}
                    disabled={hasAcknowledgedPolicy || dayOneSnapshot.clarificationRequested}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'var(--primary)', color: 'white' }}
                  >
                    {hasAcknowledgedPolicy ? 'Ban da xac nhan noi quy' : 'Toi da doc va xac nhan'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestClarification}
                    disabled={dayOneSnapshot.clarificationRequested}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'white', color: 'var(--text-primary)', borderColor: 'var(--gray-300)' }}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <MessageCircleQuestion size={16} />
                      {dayOneSnapshot.clarificationRequested ? 'Dang cho HR giai thich' : 'Toi can HR giai thich them'}
                    </span>
                  </button>
                </div>
              ) : null}
```

- [x] **Step 5: Run lint cho onboarding page**

Run: `npx eslint src/app/onboarding/page.tsx src/lib/services/onboarding-policy-service.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 2**

```bash
git add src/app/onboarding/page.tsx src/lib/services/onboarding-policy-service.ts
git commit -m "feat: sync employee onboarding policy checklist"
```

## Task 3: Lam card HR/manager doc duoc checklist ngay dau

**Files:**
- Modify: `src/app/employees/[id]/page.tsx`
- Modify: `src/lib/services/onboarding-policy-service.ts`
- Test: `npx eslint src/app/employees/[id]/page.tsx src/lib/services/onboarding-policy-service.ts`

- [x] **Step 1: Lay snapshot trong trang ho so**

Trong `src/app/employees/[id]/page.tsx`, sau:

```ts
  const onboardingPolicyRecord = employee ? OnboardingPolicyService.getRecord(employee.id) : null
```

them:

```ts
  const onboardingDayOneSnapshot = OnboardingPolicyService.getDayOneChecklistSnapshot(onboardingPolicyRecord)
```

- [x] **Step 2: Dung snapshot de khoa action `chot tai cua hang`**

Trong `handleConfirmPolicyAtStore`, them gate dau ham:

```ts
    if (!onboardingDayOneSnapshot.canConfirmAtStore) {
      setMessage('Chua du dieu kien chot noi quy tai cua hang.')
      return
    }
```

Va o button `chot tai cua hang`, truyen `disabled={!onboardingDayOneSnapshot.canConfirmAtStore}`.

- [x] **Step 3: Them khu tong quan + checklist ngay dau trong card noi quy**

Trong card noi quy dang co, them block render tu snapshot:

```tsx
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Checklist ngay dau</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{onboardingDayOneSnapshot.waitingLabel}</p>
                          <p className="mt-1 text-xs text-slate-600">{onboardingDayOneSnapshot.nextActionLabel}</p>
                          <div className="mt-3 space-y-2">
                            {onboardingDayOneSnapshot.items.map((item) => (
                              <div
                                key={item.id}
                                className={`rounded-xl border px-3 py-2 text-sm ${
                                  item.tone === 'done'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : item.tone === 'warning'
                                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                                      : 'border-slate-200 bg-white text-slate-700'
                                }`}
                              >
                                <div className="font-semibold">{item.label}</div>
                                <div className="mt-1 text-xs opacity-80">{item.hint}</div>
                              </div>
                            ))}
                          </div>
                        </div>
```

- [x] **Step 4: Lam ro nhac HR khi can giai thich**

Neu `onboardingDayOneSnapshot.clarificationRequested`, them dong canh bao ngan ngay tren checklist:

```tsx
                          {onboardingDayOneSnapshot.clarificationRequested ? (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                              Nhan vien dang can HR/quan ly giai thich them truoc khi chot ngay dau.
                            </div>
                          ) : null}
```

- [x] **Step 5: Run lint cho trang ho so**

Run: `npx eslint src/app/employees/[id]/page.tsx src/lib/services/onboarding-policy-service.ts`
Expected: exit code `0`

- [ ] **Step 6: Commit task 3**

```bash
git add src/app/employees/[id]/page.tsx src/lib/services/onboarding-policy-service.ts
git commit -m "feat: show onboarding day-one checklist for hr"
```

## Task 4: Verify end-to-end cho pass

**Files:**
- Modify: none
- Test: `npx eslint src/lib/services/onboarding-policy-service.ts src/app/onboarding/page.tsx src/app/employees/[id]/page.tsx`

- [x] **Step 1: Run lint tong**

Run: `npx eslint src/lib/services/onboarding-policy-service.ts src/app/onboarding/page.tsx src/app/employees/[id]/page.tsx`
Expected: exit code `0`

- [ ] **Step 2: Verify case chua gui day du**

Kiem tra:
- HR/manager thay `Dang cho HR kich hoat noi quy day du`
- nhan vien thay `Dang cho HR kich hoat noi quy day du`
- task `Doc noi quy cong ty` chua done

- [ ] **Step 3: Verify case da gui day du nhung chua phan hoi**

Kiem tra:
- card HR/manager hien muc `Nhan vien da phan hoi` dang warning/pending
- trang nhan vien hien 2 nut thao tac

- [ ] **Step 4: Verify case can giai thich**

Thao tac:
- vao trang nhan vien
- bam `Toi can HR giai thich them`

Kiem tra:
- quay sang ho so HR/manager thay canh bao vang
- trang nhan vien hien `Dang cho HR giai thich them truoc ngay dau`

- [ ] **Step 5: Verify case xac nhan va chot tai cua hang**

Thao tac:
- bam `Toi da doc va xac nhan`
- dang nhap vai tro HR/manager
- bam `chot tai cua hang`

Kiem tra:
- task `Doc noi quy cong ty` done
- card HR/manager hien `Da hoan tat buoc noi quy ngay dau`
- lich su co them moc `store_confirmed`

- [ ] **Step 6: Commit neu can**

```bash
git status --short
```

Expected:
- khong con thay doi ngoai y muon
