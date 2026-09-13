# Replace `xlsx` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the production security risk from `xlsx` while keeping the employee and contract Excel flows working in the browser.

**Architecture:** Replace direct `xlsx` usage with `exceljs` for all remaining browser-side spreadsheet reads and writes. Keep the employee import/export service API stable so the existing pages can continue calling the same helpers, and swap the contract pages to a small shared workbook pattern instead of inline `xlsx` calls.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, browser-side `exceljs`, npm audit, ESLint, Next production build.

---

## File Map

- Modify: `package.json`
  Responsibility: replace the vulnerable dependency and keep scripts unchanged.
- Modify: `package-lock.json`
  Responsibility: record the resolved dependency tree after removing `xlsx` and adding `exceljs`.
- Modify: `src/lib/services/employee-excel-service.ts`
  Responsibility: keep employee spreadsheet parsing/export helpers stable while moving workbook read/write logic to `exceljs`.
- Modify: `src/app/employees/contracts/page.tsx`
  Responsibility: replace inline contract list import/export workbook handling with `exceljs`.
- Modify: `src/app/employees/contracts/[id]/page.tsx`
  Responsibility: replace inline contract detail export workbook handling with `exceljs`.

## Implementation Notes

- Keep scope locked to the 5 approved files only.
- Do not rename routes, move files, or refactor unrelated contract/employee logic.
- Preserve current user-facing behavior:
  - employee import still accepts `.xlsx`, `.xls`, `.csv` in the UI label if already shown
  - employee export still downloads `.xlsx`
  - contract list export still downloads `.xlsx`
  - contract import preview still reads the first sheet and guesses headers
  - contract detail export still downloads one `.xlsx` file
- For `exceljs` browser export, write to a buffer, wrap in `Blob`, then trigger download with a temporary anchor.
- For `exceljs` browser import, load the `ArrayBuffer`, read the first worksheet, take row 1 as headers, and map remaining rows to objects using empty string defaults.
- Keep the existing helper names where possible so `src/app/employees/import/page.tsx` and `src/app/employees/export/page.tsx` do not need edits.
- If `exceljs` cannot read legacy `.xls`, keep the UI accept list for now but surface a friendly error message when such a file fails to parse instead of crashing. Do not widen scope to add a second parser in this pass.

### Task 1: Swap the dependency safely

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Replace the spreadsheet dependency declaration**

Edit `package.json` dependencies so `xlsx` is removed and `exceljs` is added in its place.

```json
{
  "dependencies": {
    "exceljs": "^4.4.0"
  }
}
```

- [ ] **Step 2: Install and refresh the lockfile**

Run:

```bash
npm install
```

Expected:
- `package-lock.json` no longer contains `xlsx`
- `package-lock.json` contains `exceljs`
- install exits successfully

- [ ] **Step 3: Verify the audit issue moved off production**

Run:

```bash
npm audit --omit=dev
```

Expected:
- the prior `xlsx` advisory is gone
- if any new production advisory appears, stop and report it before moving on

- [ ] **Step 4: Commit the dependency-only change**

Run:

```bash
git add package.json package-lock.json
git commit -m "chore: replace xlsx dependency"
```

### Task 2: Move employee spreadsheet helpers to `exceljs`

**Files:**
- Modify: `src/lib/services/employee-excel-service.ts`

- [ ] **Step 1: Replace the import and add browser workbook helpers**

At the top of `src/lib/services/employee-excel-service.ts`, replace the old import and add minimal helpers for converting worksheets to row objects and downloading buffers in the browser.

```ts
import ExcelJS from 'exceljs'

function triggerWorkbookDownload(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function worksheetToJsonRows<T extends Record<string, string>>(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1)
  const headers = headerRow.values
    .slice(1)
    .map((value) => String(value ?? '').trim())

  const rows: T[] = []
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const record = {} as T
    headers.forEach((header, index) => {
      if (!header) return
      record[header as keyof T] = String(row.getCell(index + 1).text ?? '').trim()
    })
    rows.push(record)
  })
  return rows
}
```

- [ ] **Step 2: Rewrite workbook parsing with `exceljs` while preserving the public API**

Replace the current `readWorkbookRows` implementation so it still returns `Promise<Partial<EmployeeExcelRow>[]>`, but internally reads the first worksheet with `exceljs`.

```ts
const readWorkbookRows = async (file: File) => {
  const workbook = new ExcelJS.Workbook()
  const data = await file.arrayBuffer()
  await workbook.xlsx.load(data)
  const worksheet = workbook.worksheets[0]

  if (!worksheet) {
    return []
  }

  return worksheetToJsonRows<Partial<EmployeeExcelRow>>(worksheet)
}
```

- [ ] **Step 3: Rewrite employee workbook export with `exceljs`**

Replace `downloadEmployeeWorkbook` so it creates a worksheet, writes the header row in the approved order, adds each employee row in the same order, and downloads a browser buffer.

```ts
export async function downloadEmployeeWorkbook(rows: EmployeeExcelRow[], fileName: string) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Nhan su')

  worksheet.addRow([...EMPLOYEE_EXCEL_HEADERS])
  rows.forEach((row) => {
    worksheet.addRow(EMPLOYEE_EXCEL_HEADERS.map((header) => row[header] || ''))
  })

  const buffer = await workbook.xlsx.writeBuffer()
  triggerWorkbookDownload(buffer as ArrayBuffer, fileName)
}
```

- [ ] **Step 4: Keep import failure user-safe**

If `parseEmployeeSpreadsheet(file)` throws because the file cannot be read by `exceljs`, keep the throw behavior so the page can show its existing fallback message. Do not swallow the error or return partial garbage rows.

- [ ] **Step 5: Run focused lint for the employee service**

Run:

```bash
npx eslint src/lib/services/employee-excel-service.ts
```

Expected:
- PASS with no lint errors

- [ ] **Step 6: Commit the employee service migration**

Run:

```bash
git add src/lib/services/employee-excel-service.ts
git commit -m "refactor: migrate employee excel helpers to exceljs"
```

### Task 3: Move contract list import/export to `exceljs`

**Files:**
- Modify: `src/app/employees/contracts/page.tsx`

- [ ] **Step 1: Replace the old spreadsheet import and add two local helpers**

Replace `import * as XLSX from 'xlsx'` with `import ExcelJS from 'exceljs'`, then add:
- one helper to download workbook rows by header order
- one helper to read the first worksheet into `Record<string, string>[]`

Use this pattern near the existing `downloadWorkbook` helper:

```ts
function triggerWorkbookDownload(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

async function downloadWorkbook(rows: Record<string, unknown>[], fileName: string) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Contracts')
  const headers = rows.length ? Object.keys(rows[0]) : []

  if (headers.length) {
    worksheet.addRow(headers)
    rows.forEach((row) => {
      worksheet.addRow(headers.map((header) => String(row[header] ?? '')))
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  triggerWorkbookDownload(buffer as ArrayBuffer, fileName)
}

async function readImportRows(file: File) {
  const workbook = new ExcelJS.Workbook()
  const data = await file.arrayBuffer()
  await workbook.xlsx.load(data)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []

  const headerRow = worksheet.getRow(1)
  const headers = headerRow.values.slice(1).map((value) => String(value ?? '').trim())

  return worksheet.getRows(2, Math.max(worksheet.rowCount - 1, 0))?.map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      if (!header) return
      record[header] = String(row.getCell(index + 1).text ?? '').trim()
    })
    return record
  }) ?? []
}
```

- [ ] **Step 2: Await export properly**

Update `handleExportContracts` so it awaits the new async downloader:

```ts
const handleExportContracts = async () => {
  if (!user) return
  const rows = ContractService.exportContracts(filteredContracts, user, { statusLabel: currentStatusLabel })
  await downloadWorkbook(rows, `hop-dong-nhan-su-${new Date().toISOString().slice(0, 10)}.xlsx`)
  setMessage(`...`)
}
```

Also change the export button handler from `onClick={handleExportContracts}` to:

```tsx
onClick={() => {
  void handleExportContracts()
}}
```

- [ ] **Step 3: Rewrite contract import preview parsing**

Replace the body of `handleImportFile` so it reads rows through `readImportRows(file)`, derives headers from the first row keys, and keeps the existing mapping flow intact.

```ts
const handleImportFile = async (file: File) => {
  const rows = (await readImportRows(file)) as ContractImportRow[]
  const headers = rows.length ? Object.keys(rows[0]) : []
  const mapping = ContractService.guessImportMapping(headers)
  setImportPreview({ headers, rows, mapping })
  setMessage(`Da doc ${rows.length} dong tu file import. Hay kiem tra mapping truoc khi nhap.`)
}
```

- [ ] **Step 4: Keep the sample workbook flow on the same helper**

Update the sample template button handler to call the new async `downloadWorkbook` through `void downloadWorkbook(...)` so it still downloads the one-row template without changing the surrounding UI logic.

- [ ] **Step 5: Run focused lint for the contract list page**

Run:

```bash
npx eslint src/app/employees/contracts/page.tsx
```

Expected:
- PASS with no lint errors

- [ ] **Step 6: Commit the contract list migration**

Run:

```bash
git add src/app/employees/contracts/page.tsx
git commit -m "refactor: migrate contract workbook page to exceljs"
```

### Task 4: Move contract detail export to `exceljs`

**Files:**
- Modify: `src/app/employees/contracts/[id]/page.tsx`

- [ ] **Step 1: Replace the old import and rewrite the downloader**

Swap `import * as XLSX from 'xlsx'` for `import ExcelJS from 'exceljs'`, then replace `downloadContract` with an async `exceljs` version that preserves the same sheet content.

```ts
function triggerWorkbookDownload(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

async function downloadContract(contract: EmployeeContract) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Contract')

  ;[
    ['Ma hop dong', contract.customFields['contract.code'] || contract.id],
    ['Phien ban', String(contract.version)],
    ['Trang thai', contract.status],
    ['Ngay hieu luc', contract.startDate],
    ['Ngay ket thuc', contract.endDate || ''],
    ['', ''],
    ['Noi dung da render', ''],
    [contract.renderedContent, ''],
  ].forEach((row) => worksheet.addRow(row))

  const buffer = await workbook.xlsx.writeBuffer()
  triggerWorkbookDownload(buffer as ArrayBuffer, `${contract.customFields['contract.code'] || contract.id}.xlsx`)
}
```

- [ ] **Step 2: Update the button call site**

Wherever the page currently triggers `downloadContract(contract)`, switch it to:

```tsx
void downloadContract(contract)
```

This keeps the UI synchronous while avoiding an unhandled promise.

- [ ] **Step 3: Run focused lint for the contract detail page**

Run:

```bash
npx eslint src/app/employees/contracts/[id]/page.tsx
```

Expected:
- PASS with no lint errors

- [ ] **Step 4: Commit the contract detail migration**

Run:

```bash
git add src/app/employees/contracts/[id]/page.tsx
git commit -m "refactor: migrate contract detail export to exceljs"
```

### Task 5: Final verification and closeout

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/lib/services/employee-excel-service.ts`
- Modify: `src/app/employees/contracts/page.tsx`
- Modify: `src/app/employees/contracts/[id]/page.tsx`

- [ ] **Step 1: Run the approved lint checks together**

Run:

```bash
npx eslint src/lib/services/employee-excel-service.ts src/app/employees/contracts/page.tsx src/app/employees/contracts/[id]/page.tsx
```

Expected:
- PASS

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected:
- PASS

- [ ] **Step 3: Re-run production audit**

Run:

```bash
npm audit --omit=dev
```

Expected:
- the old `xlsx` vulnerability is no longer present

- [ ] **Step 4: Manual smoke-check in the app**

Verify these flows in the browser:
- `/employees/import`: choose a normal `.xlsx` employee file and confirm preview rows still appear
- `/employees/export`: export employees and confirm the file downloads as `.xlsx`
- `/employees/contracts`: export the filtered contract list and confirm the file downloads as `.xlsx`
- `/employees/contracts`: import a normal `.xlsx` contract file and confirm preview + guessed mapping still appear
- `/employees/contracts/[id]`: export one contract detail file and confirm the file downloads as `.xlsx`

- [ ] **Step 5: Record the result**

If the migration succeeds cleanly, include in the final report:
- `xlsx` removed from production dependencies
- which flows were smoke-tested
- results of `eslint`, `build`, and `npm audit --omit=dev`

