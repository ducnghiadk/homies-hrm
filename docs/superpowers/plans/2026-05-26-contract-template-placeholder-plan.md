# Contract Template Placeholder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Them pass dau cho module hop dong: upload mau `docx`, quet placeholder `{{group.field}}`, render preview web, hien panel field va checklist loi, khoa `Gui ky` neu du lieu chua sach.

**Architecture:** Mo rong service hop dong hien co de quan ly metadata cua mau, danh sach field hop le, ket qua quet placeholder, va preview da phan loai loi. UI contract list page se them khu upload + panel field; contract detail page chi cap nhat hien thi de doc ket qua preview va checklist khi can. Toan bo flow van dua tren mock/service layer hien co, khong them ky that, editor nang, hay parser Word 1:1.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, localStorage/service layer, `read-excel-file`, `eslint`, `next build`

---

## File Structure

### File sua

- `src/lib/services/contract-service-data.ts`
  - Them bo field chuan cho placeholder, metadata mau `docx`, ham build noi dung preview web co danh dau field da do.
- `src/lib/services/contract-service.ts`
  - Them type cho template placeholder, ham quet placeholder, ham phan loai field, ham tong hop checklist chan gui, ham tao preview state cho UI.
- `src/app/employees/contracts/page.tsx`
  - Them flow upload mau, xem ket qua quet field, preview web moi, panel field, checklist loi, va khoa nut `Gui ky`.
- `src/app/employees/contracts/[id]/page.tsx`
  - Hien thong tin preview/checklist giong logic moi o trang chi tiet khi mo tung hop dong.
- `src/app/employees/contracts/_components.tsx`
  - Them component dung chung cho badge trang thai field, checklist row, panel filter chip.
- `docs/CODEMAP.md`
  - Cap nhat mo ta module contract de ghi nhan flow template placeholder neu co file moi duoc them trong luc code.
- `docs/KNOWN_ISSUES.md`
  - Chi cap nhat neu trong qua trinh code phat hien bug moi va da fix.

### File moi de tao

- `src/lib/services/contract-template-placeholder.ts`
  - Gom logic nho, de tach khoi `contract-service.ts`: regex quet placeholder, bo field chuan, ham phan loai field, ham tao checklist state.

## Task 1: Chot model du lieu cho template placeholder

**Files:**
- Create: `src/lib/services/contract-template-placeholder.ts`
- Modify: `src/lib/services/contract-service.ts`
- Modify: `src/lib/services/contract-service-data.ts`

- [ ] **Step 1: Them type va constant cho field chuan**

```ts
export type ContractPlaceholderGroup =
  | 'employee'
  | 'store'
  | 'position'
  | 'contract'
  | 'salary'
  | 'policy'

export type ContractPlaceholderStatus =
  | 'hop_le'
  | 'thieu_du_lieu'
  | 'field_la'
  | 'trung_lap'

export type ContractPlaceholderItem = {
  key: string
  group: ContractPlaceholderGroup | 'unknown'
  field: string
  occurrences: number
  value: string
  status: ContractPlaceholderStatus
  note?: string
}

export const CONTRACT_PLACEHOLDER_CATALOG = {
  employee: ['full_name', 'employee_code', 'phone', 'email', 'address', 'id_number', 'bank_name', 'bank_account', 'start_date'],
  store: ['name', 'address', 'phone', 'manager_name'],
  position: ['name', 'level'],
  contract: ['code', 'type', 'start_date', 'end_date', 'signer_name', 'signer_title'],
  salary: ['official', 'probation', 'allowances', 'kpi'],
  policy: ['work_rules', 'dress_code', 'cash_handling', 'food_safety', 'attendance', 'overtime', 'discipline', 'contract_note'],
} as const
```

- [ ] **Step 2: Run build de xac nhan type moi chua duoc noi vao service**

Run: `npm run build`

Expected: FAIL voi loi TypeScript vi `ContractTemplate` va `page.tsx` chua biet toi metadata moi.

- [ ] **Step 3: Mo rong model template trong `contract-service.ts`**

```ts
export type ContractTemplatePlaceholderMeta = {
  sourceFileName?: string
  sourceKind: 'blocks' | 'docx_upload'
  sourceText: string
  scannedAt?: string
  placeholders: ContractPlaceholderItem[]
  blockingIssues: string[]
  warningIssues: string[]
}

export type ContractTemplate = {
  id: string
  name: string
  description: string
  employmentType: 'full_time' | 'part_time' | 'seasonal' | 'intern'
  positionIds: string[]
  storeScope: 'all' | 'standard_store' | 'flagship' | 'kiosk'
  status: ContractTemplateStatus
  version: string
  updatedAt: string
  blocks: ContractBlock[]
  placeholderMeta: ContractTemplatePlaceholderMeta
}
```

- [ ] **Step 4: Noi default template data voi metadata moi**

```ts
const templateText = blocks.map((block) => block.content).join('\n\n')

return {
  ...template,
  placeholderMeta: {
    sourceKind: 'blocks',
    sourceText: templateText,
    scannedAt: '2026-05-26T00:00:00.000Z',
    placeholders: scanContractPlaceholders(templateText, {}),
    blockingIssues: [],
    warningIssues: [],
  },
}
```

- [ ] **Step 5: Run build lai de xac nhan model da thong**

Run: `npm run build`

Expected: PASS qua phan type cua service; neu UI chua dung field moi thi build van PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/contract-template-placeholder.ts src/lib/services/contract-service.ts src/lib/services/contract-service-data.ts
git commit -m "feat: add contract placeholder metadata model"
```

## Task 2: Them logic quet placeholder va checklist chan gui

**Files:**
- Modify: `src/lib/services/contract-template-placeholder.ts`
- Modify: `src/lib/services/contract-service.ts`

- [ ] **Step 1: Viet ham quet placeholder tu text**

```ts
const PLACEHOLDER_REGEX = /{{\s*([a-z0-9_]+)\.([a-z0-9_]+)\s*}}/g

export function extractPlaceholderKeys(sourceText: string) {
  const matches = sourceText.matchAll(PLACEHOLDER_REGEX)
  return Array.from(matches, (match) => `${match[1]}.${match[2]}`)
}
```

- [ ] **Step 2: Run build de thay noi goi chua co `scanContractPlaceholders`**

Run: `npm run build`

Expected: FAIL voi loi `scanContractPlaceholders` chua ton tai hoac tra ve sai kieu.

- [ ] **Step 3: Hoan thien ham phan loai field**

```ts
export function scanContractPlaceholders(
  sourceText: string,
  values: Record<string, string>,
): ContractPlaceholderItem[] {
  const counts = new Map<string, number>()

  for (const key of extractPlaceholderKeys(sourceText)) {
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return Array.from(counts.entries()).map(([key, occurrences]) => {
    const [groupRaw, field] = key.split('.')
    const group = isKnownGroup(groupRaw) ? groupRaw : 'unknown'
    const allowed = group !== 'unknown' && CONTRACT_PLACEHOLDER_CATALOG[group].includes(field as never)
    const value = String(values[key] || '').trim()

    if (!allowed) {
      return { key, group, field, occurrences, value, status: 'field_la', note: 'Field khong nam trong bo chuan' }
    }

    if (!value) {
      return { key, group, field, occurrences, value, status: 'thieu_du_lieu', note: 'Chua co gia tri de do vao hop dong' }
    }

    if (occurrences > 1) {
      return { key, group, field, occurrences, value, status: 'trung_lap', note: 'Field xuat hien nhieu lan trong mau' }
    }

    return { key, group, field, occurrences, value, status: 'hop_le' }
  })
}
```

- [ ] **Step 4: Them state checklist tong hop cho UI**

```ts
export type ContractPreviewChecklist = {
  total: number
  valid: number
  missing: number
  unknown: number
  duplicates: number
  canSend: boolean
  blockingReasons: string[]
}

export function buildContractPreviewChecklist(items: ContractPlaceholderItem[]): ContractPreviewChecklist {
  const missing = items.filter((item) => item.status === 'thieu_du_lieu').length
  const unknown = items.filter((item) => item.status === 'field_la').length
  const duplicates = items.filter((item) => item.status === 'trung_lap').length

  return {
    total: items.length,
    valid: items.filter((item) => item.status === 'hop_le').length,
    missing,
    unknown,
    duplicates,
    canSend: missing === 0 && unknown === 0,
    blockingReasons: [
      ...(unknown > 0 ? ['Mau co field la ngoai bo chuan'] : []),
      ...(missing > 0 ? ['Ho so hien tai con thieu du lieu bat buoc'] : []),
    ],
  }
}
```

- [ ] **Step 5: Noi logic moi vao `ContractService.previewDraft()`**

```ts
static previewDraft(input: ContractDraftInput, currentUser?: AuthUser) {
  const draft = this.createDraftContract(input, currentUser)
  if (!draft) return null

  const placeholderItems = scanContractPlaceholders(draft.renderedContentSource, draft.placeholderValues)
  const checklist = buildContractPreviewChecklist(placeholderItems)

  return {
    renderedContent: draft.renderedContent,
    placeholderItems,
    checklist,
  }
}
```

- [ ] **Step 6: Run verify service layer**

Run:
- `npm run lint src/lib/services/contract-template-placeholder.ts src/lib/services/contract-service.ts`
- `npm run build`

Expected:
- `eslint` khong bao syntax/type import loi
- `next build` PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/services/contract-template-placeholder.ts src/lib/services/contract-service.ts
git commit -m "feat: add contract placeholder scanning and checklist"
```

## Task 3: Them khu upload mau va ket qua quet field o trang contracts

**Files:**
- Modify: `src/app/employees/contracts/page.tsx`
- Modify: `src/app/employees/contracts/_components.tsx`
- Modify: `src/lib/services/contract-service.ts`

- [ ] **Step 1: Them UI state cho upload va preview state**

```ts
const [uploadedTemplateName, setUploadedTemplateName] = useState('')
const [uploadedTemplateText, setUploadedTemplateText] = useState('')
const [previewState, setPreviewState] = useState<ReturnType<typeof ContractService.previewDraft> | null>(null)
const [fieldFilter, setFieldFilter] = useState<'all' | 'hop_le' | 'thieu_du_lieu' | 'field_la' | 'trung_lap'>('all')
```

- [ ] **Step 2: Run build de thay component panel moi chua ton tai**

Run: `npm run build`

Expected: FAIL voi loi `FieldStatusTag` hoac component checklist moi chua duoc khai bao.

- [ ] **Step 3: Doc file upload va quet placeholder**

```ts
async function readDocxAsText(file: File) {
  const buffer = await file.arrayBuffer()
  const text = new TextDecoder().decode(new Uint8Array(buffer))
  return text.replace(/\0/g, ' ')
}

async function handleTemplateUpload(file: File) {
  const sourceText = await readDocxAsText(file)
  setUploadedTemplateName(file.name)
  setUploadedTemplateText(sourceText)
}
```

- [ ] **Step 4: Dong bo preview state moi theo nhan su + mau**

```ts
useEffect(() => {
  if (!currentEmployee || !currentTemplate) {
    setPreviewState(null)
    return
  }

  const nextPreview = ContractService.previewDraft({
    employeeId: currentEmployee.id,
    templateId: currentTemplate.id,
    startDate,
    endDate: endDate || undefined,
    customFields: buildCustomFields(currentEmployee.id),
  }, user ?? undefined)

  setPreviewState(nextPreview)
}, [currentEmployee?.id, currentTemplate?.id, startDate, endDate, companySignerName, companySignerTitle, contractType, contractCodePrefix, bankName, managerName, salaryAllowances, workingSchedule, mainDuties, contractNote, user])
```

- [ ] **Step 5: Them component panel field va checklist**

```tsx
<SectionCard title="Soat field truoc khi gui" description="Kiem tra du lieu truoc khi day hop dong sang buoc ky.">
  <div className="grid gap-3 md:grid-cols-4">
    <ChecklistChip label="Hop le" value={previewState?.checklist.valid || 0} tone="emerald" />
    <ChecklistChip label="Thieu du lieu" value={previewState?.checklist.missing || 0} tone="amber" />
    <ChecklistChip label="Field la" value={previewState?.checklist.unknown || 0} tone="rose" />
    <ChecklistChip label="Trung lap" value={previewState?.checklist.duplicates || 0} tone="slate" />
  </div>
  <div className="mt-4 space-y-2">
    {filteredPlaceholderItems.map((item) => (
      <div key={item.key} className="rounded-2xl border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold text-slate-900">{item.key}</p>
          <FieldStatusTag status={item.status} />
        </div>
        <p className="mt-2 text-sm text-slate-600">{item.value || 'Chua co du lieu'}</p>
        {item.note ? <p className="mt-1 text-xs text-slate-500">{item.note}</p> : null}
      </div>
    ))}
  </div>
</SectionCard>
```

- [ ] **Step 6: Khoa nut gui theo checklist moi**

```ts
const sendBlocked = !previewState?.checklist.canSend

<button
  type="button"
  disabled={sendBlocked || primaryBulkDisabled}
  className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
>
  Gui ky
</button>
```

- [ ] **Step 7: Run verify UI page**

Run:
- `npm run lint src/app/employees/contracts/page.tsx src/app/employees/contracts/_components.tsx`
- `npm run build`

Expected:
- `eslint` PASS
- `next build` PASS

- [ ] **Step 8: Commit**

```bash
git add src/app/employees/contracts/page.tsx src/app/employees/contracts/_components.tsx src/lib/services/contract-service.ts
git commit -m "feat: add contract template upload and review panel"
```

## Task 4: Cap nhat contract detail va preview web de doc de soat

**Files:**
- Modify: `src/app/employees/contracts/[id]/page.tsx`
- Modify: `src/lib/services/contract-service.ts`
- Modify: `src/app/employees/contracts/_components.tsx`

- [ ] **Step 1: Them helper preview segment de highlight field**

```ts
export type ContractPreviewSegment =
  | { type: 'text'; value: string }
  | { type: 'field'; key: string; value: string; status: ContractPlaceholderStatus }

export function buildPreviewSegments(sourceText: string, values: Record<string, string>, items: ContractPlaceholderItem[]): ContractPreviewSegment[] {
  // Tach text thuong va field de UI highlight tung doan da do gia tri
}
```

- [ ] **Step 2: Run build de thay trang detail chua biet segment moi**

Run: `npm run build`

Expected: FAIL voi loi `ContractPreviewSegment` hoac `previewSegments` chua ton tai.

- [ ] **Step 3: Render preview web co highlight field**

```tsx
<div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
    {previewState?.segments.map((segment, index) => (
      segment.type === 'text' ? (
        <span key={index}>{segment.value}</span>
      ) : (
        <mark key={`${segment.key}-${index}`} className="rounded bg-amber-100 px-1 text-slate-900">
          {segment.value || `{{${segment.key}}}`}
        </mark>
      )
    ))}
  </div>
</div>
```

- [ ] **Step 4: Them khu checklist thu gon o trang detail**

```tsx
<SectionCard title="Checklist truoc khi gui" description="Doc nhanh trang thai field cua hop dong nay.">
  {previewState?.checklist.blockingReasons.length ? (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      {previewState.checklist.blockingReasons.join('. ')}
    </div>
  ) : (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
      Hop dong nay da dat dieu kien de gui ky.
    </div>
  )}
</SectionCard>
```

- [ ] **Step 5: Run verify detail page**

Run:
- `npm run lint src/app/employees/contracts/[id]/page.tsx src/app/employees/contracts/_components.tsx src/lib/services/contract-service.ts`
- `npm run build`

Expected:
- `eslint` PASS
- `next build` PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/employees/contracts/[id]/page.tsx src/app/employees/contracts/_components.tsx src/lib/services/contract-service.ts
git commit -m "feat: add contract preview checklist to detail page"
```

## Task 5: Tai lieu hoa va verify cuoi pass

**Files:**
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md` (chi neu co bug moi da fix)

- [ ] **Step 1: Cap nhat CODEMAP neu co file moi**

```md
### Hop dong nhan su va ky tren app
- Mo ta: thu vien template hop dong, quet placeholder `{{group.field}}`, preview web, panel field, checklist chan gui ky.
- File chinh: `src/app/employees/contracts/page.tsx`, `src/app/employees/contracts/[id]/page.tsx`, `src/app/employees/contracts/_components.tsx`, `src/lib/services/contract-service.ts`, `src/lib/services/contract-service-data.ts`, `src/lib/services/contract-template-placeholder.ts`
```

- [ ] **Step 2: Neu co bug moi da fix thi ghi vao KNOWN_ISSUES**

```md
- Da fix YYYY-MM-DD: [mo ta bug moi lien quan contract placeholder] | nguyen nhan: ... | cach fix: ... | file lien quan: ...
```

- [ ] **Step 3: Run verify cuoi pass**

Run:
- `npm run lint`
- `npm run build`
- `npm run ai:guard`

Expected:
- `eslint` PASS
- `next build` PASS
- `ai:guard` PASS

- [ ] **Step 4: Commit**

```bash
git add docs/CODEMAP.md docs/KNOWN_ISSUES.md src/app/employees/contracts/page.tsx src/app/employees/contracts/[id]/page.tsx src/app/employees/contracts/_components.tsx src/lib/services/contract-service.ts src/lib/services/contract-service-data.ts src/lib/services/contract-template-placeholder.ts
git commit -m "feat: add contract template placeholder review flow"
```

## Self-Review

### Spec coverage

- Upload mau `docx`: Task 3
- Quet placeholder `{{group.field}}`: Task 2
- Bo field chuan: Task 1
- Preview web: Task 4
- Panel field + checklist loi: Task 3 va Task 4
- Chan `Gui ky` neu co loi: Task 2 va Task 3
- Khong nhay sang OTP/ky that/editor nang: da giu scope trong tat ca task

### Placeholder scan

- Khong de `TODO`, `TBD`, hay "lam sau"
- Moi task deu co file ro va lenh verify ro

### Type consistency

- `ContractPlaceholderItem`, `ContractPreviewChecklist`, `ContractPreviewSegment` duoc dung thong nhat giua service va UI
- File moi `contract-template-placeholder.ts` la noi duy nhat chua regex va logic phan loai

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-26-contract-template-placeholder-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
