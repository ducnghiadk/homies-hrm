# Antigravity Execution Prompt - Pass A PostgreSQL Runtime Verification

## EXECUTION REQUEST

**Goal:** Chay migration Career Map Pass A tren PostgreSQL/Supabase local that, kiem chung transaction va tao report bang chung; khong sua code trong lan nay.

## Context

- System: Homies Milk Tea HRM, Next.js 16, TypeScript, Supabase/PostgreSQL.
- Workspace: `H:\hrm-tra-sua-3535`.
- Migration can kiem tra: `supabase/migrations/20260824_kpi_career_map_round4_fix.sql`.
- Static contract: `src/lib/kpi/career-map-sql-contract.test.ts` dang PASS 10/10.
- Full KPI tests: PASS 242/242 o lan Codex verification gan nhat.
- Ly do can runtime: static test khong chung minh duoc SQL compile, foreign key, CHECK constraint, role/auth context va rollback transaction tren PostgreSQL that.

## RPM Context

- **RESULT:** Migration apply thanh cong tren database local sach va 12 scenario runtime co bang chung PASS/FAIL ro rang.
- **HARD RESULT:** Chung minh happy path, tenant isolation, state/role gate, KPI versioning va forced rollback deu dung tren PostgreSQL that.
- **PURPOSE:** Ngan viec CEO publish Career Map lam lan du lieu giua to chuc, tao khoa ngoai sai hoac de database o trang thai do dang.
- **FMA:** Test gia chi doc chuoi SQL; reset nham database remote; sua code de lam test pass; bo qua scenario rollback; bao COMPLETE khi chi co static evidence.

## 5D Impact Assessment

| Area | Affected | Severity | Explanation |
|---|---|---|---|
| UI | No | GREEN | Khong sua giao dien. |
| FE/BE | No | GREEN | Khong sua service/runtime app. |
| Data | Yes | RED | Tao/xoa du lieu chi trong database local disposable. Tuyet doi khong dung production. |
| Security | Yes | RED | Can mo phong CEO/HR va `auth.uid()` de kiem tra role gate. |
| UX | No | GREEN | Chi la kiem thu ky thuat. |

**Stop rule:** Data va Security deu RED. Chi duoc tiep tuc khi xac nhan target la local/disposable. Neu phat hien dang link remote/staging/production, DUNG NGAY va report `BLOCKED`.

## Mandatory Operating Rules

1. Day la task **VERIFY ONLY**. Khong sua migration, source code, test code, package files hoac schema production.
2. Chi duoc tao file report ket qua quy dinh o cuoi prompt.
3. Khong chay `supabase db reset`, `psql`, `DROP`, `TRUNCATE` hoac migration tren remote/staging/production.
4. Truoc moi lenh reset, phai chung minh database la local/disposable bang host, port, project/container name va connection target da che mat password.
5. Khong doc/in secret ra report. Connection string, token, password phai redact.
6. Neu Supabase CLI khong co, duoc phep dung PostgreSQL container tam. Tao container/database rieng, khong mount volume du lieu nguoi dung.
7. Neu dung PostgreSQL thuong, duoc tao test-only `auth.uid()` shim va JWT claims trong database tam de mo phong Supabase auth. Khong chen shim vao migration production.
8. Khong dung static `includes()` lam bang chung runtime. Moi scenario phai co SQL thuc thi va ket qua truy van truoc/sau.
9. Neu runtime phat hien bug, khong tu fix. Ghi root cause, SQL error, vi tri migration va de xuat correction rieng.
10. Khong commit, push, reset Git hoac revert thay doi cua nguoi khac.

## Environment Selection

### Preferred A - Supabase local

Dung khi Supabase CLI co san:

1. Kiem tra `supabase --version`.
2. Kiem tra `supabase/config.toml`. Neu thieu, chi duoc `supabase init` trong workspace local.
3. Chay `supabase status` va ghi local API/DB host, khong ghi secret.
4. Chay migration tu database local sach.

### Alternative B - Disposable PostgreSQL Docker

Dung khi Supabase CLI khong co:

1. Tao container co ten rieng, vi du `homies-kpi-pass-a-runtime`.
2. Dung database rieng, khong mount host volume.
3. Nap schema canonical va migration theo thu tu phu thuoc.
4. Tao test-only auth shim neu can.
5. Sau khi thu thap report, dung va xoa duy nhat container tam da tao.

Neu ca A va B deu khong chay duoc, verdict la `BLOCKED`, ghi chinh xac lenh va loi.

## Preflight Evidence

Report bat buoc ghi:

- PostgreSQL version.
- Supabase CLI version hoac Docker image/container.
- Database host/port/name da redact thong tin nhay cam.
- Danh sach migration duoc apply theo thu tu.
- Ket qua SQL compile/apply cua `20260824_kpi_career_map_round4_fix.sql`.
- Schema thuc cua `public.kpi_sets`, `public.kpi_set_versions`, `public.kpi_career_employee_placements`.
- CHECK constraints va foreign keys lien quan.

## Required Runtime Matrix

Moi scenario phai doc lap. Ghi setup, lenh SQL/routine, ket qua mong doi, ket qua thuc te va before/after counts.

### Scenario 1 - Clean migration apply

- Apply schema + migration tren database sach.
- PASS khi khong co syntax error, duplicate function signature hoac missing column/type.

### Scenario 2 - CEO actor thieu organization

- Tao CEO hop le nhung `to_chuc_id IS NULL`.
- Goi `publish_kpi_career_map` voi map `pending_approval`.
- PASS khi RPC fail closed voi thong diep organization va khong thay doi map/placement/KPI version/log.

### Scenario 3 - Non-CEO cannot publish

- Mo phong HR Admin hoac role khac.
- PASS khi RPC bi tu choi truoc mutation.

### Scenario 4 - Draft cannot publish directly

- CEO goi publish tren map `draft`.
- PASS khi bi tu choi va khong co mutation.

### Scenario 5 - Past effective date

- CEO goi map `pending_approval` voi ngay qua khu.
- PASS khi bi tu choi truoc mutation.

### Scenario 6 - Tenant isolation

- Tao organization A va B; map thuoc A.
- Tao nhan vien A, nhan vien B va nhan vien `to_chuc_id NULL`.
- PASS khi chi nhan vien A duoc xu ly; B va NULL khong co placement tren map A.

### Scenario 7 - Missing store and position handling

- Trong org A, tao mot nhan vien thieu store va mot nhan vien thieu position.
- PASS khi khong insert NULL/fabricated placement, RPC khong vo transaction va `excluded_count` tang dung.

### Scenario 8 - Real KPI set creation

- Publish map co position chua co `kpi_sets`.
- PASS khi tao `kpi_sets` dung `org_id`, khong loi `created_by`, va `kpi_set_versions.set_id` tro dung foreign key.

### Scenario 9 - Existing KPI set version increment

- Publish lan tiep theo cho cung position/org.
- PASS khi reuse cung `set_id`, tao `version_no + 1`, giu version cu bat bien.

### Scenario 10 - Invalid graph/criteria/preset

- Tach thanh cac case: empty map, edge sai cap, thieu profile, trong so khong 100, thieu preset.
- PASS khi moi case bi reject truoc mutation.

### Scenario 11 - Happy path publish

- CEO, map pending, date hop le, graph/profile/preset hop le.
- PASS khi map published; placements, KPI sets/versions va approval log duoc tao dung; counts RPC khop rows thuc.

### Scenario 12 - Forced failure rollback

- Tao test-only trigger/constraint trong database tam de forced failure o buoc muon, sau khi map status bat dau mutation nhung truoc khi ket thuc RPC.
- Goi publish va bat loi.
- PASS khi status map, profiles, placements, KPI sets/versions va approval logs tro ve dung before state.
- Go bo test-only trigger sau scenario.

## Verification Commands

Bat buoc chay lai sau runtime:

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-sql-contract.test.ts
$kpiTests = rg --files src/lib/kpi -g "*.test.ts"
node --experimental-strip-types --test $kpiTests
npx tsc --noEmit
npm run lint -- src/lib/kpi/career-map-sql-contract.test.ts
git diff --check -- supabase/migrations/20260824_kpi_career_map_round4_fix.sql src/lib/kpi/career-map-sql-contract.test.ts
```

Khong can build frontend neu khong co code change. Neu Antigravity sua code trai yeu cau, verdict phai la `FAIL - unauthorized mutation`.

## Report File - Mandatory

Tao duy nhat file:

`docs/superpowers/reviews/2026-08-25-kpi-career-map-pass-a-postgres-runtime-result.md`

Report phai co dung thu tu:

### 1. Verdict

- `PASS`, `PARTIAL` hoac `BLOCKED`.
- Chi dung `PASS` khi migration apply thanh cong va 12/12 runtime scenarios dat.

### 2. Environment

- Supabase local hoac Docker PostgreSQL.
- Version, host/port/database da redact.
- Chung minh target local/disposable.

### 3. Files Changed

- Expected: chi report file.
- Neu co file khac thay doi, liet ke va giai thich; verdict khong duoc PASS.

### 4. Migration Apply Evidence

- Exact commands.
- Exit codes.
- SQL errors neu co.
- Schema/constraint evidence.

### 5. Runtime Matrix

| # | Scenario | Expected | Actual | Result | Evidence query/count |
|---|---|---|---|---|---|

Phai co du 12 dong.

### 6. Rollback Evidence

- Before counts/status.
- Forced failure.
- After counts/status.
- Ket luan co atomic hay khong.

### 7. Verification Table

| Check | Command | Result | Evidence |
|---|---|---|---|

### 8. Remaining Risks

- Khong viet `khong co` neu khong test Supabase auth/RLS that.

### 9. Exact Next Step

- Neu PASS: de xuat Codex review report va browser scenarios.
- Neu PARTIAL/FAIL: ghi dung mot correction task nho nhat, khong tu code.

## Final Response Required From Antigravity

Sau khi tao report, tra loi ngan gon:

1. Verdict.
2. Runtime scenarios pass bao nhieu tren 12.
3. Co rollback that hay khong.
4. Co sua file nao ngoai report hay khong.
5. Duong dan report.

Khong tra loi `done`, `complete` hoac `100%` neu thieu bat ky runtime scenario nao.
