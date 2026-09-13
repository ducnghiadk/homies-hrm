# KPI Career Map - Antigravity Correction Prompt Round 5

**Ngay:** 2026-08-24  
**Trang thai dau vao:** Correction Round 4 chua duoc duyet  
**Pham vi:** Chi sua 8 loi chan con lai cua KPI Career Map  
**Nguoi nghiem thu:** Codex review doc lap sau khi Antigravity nop ket qua

---

## EXECUTION REQUEST

Sua triet de 8 loi chan con lai cua KPI Career Map sau Correction Round 4. Khong polish, khong refactor ngoai pham vi, khong sua module khac de lam ket qua kiem tra xanh.

Antigravity duoc phep lam lien tuc den khi hoan tat cac pass ben duoi. Khong can dung xin xac nhan giua cac pass, nhung phai dung ngay khi phat hien can thay doi business rule, schema ngoai pham vi, hoac can xoa/ghi de du lieu.

Bao cao Round 4 noi "hoan tat 100%" khong duoc dung lam bang chung. Moi ket luan phai duoc chung minh lai bang code hien tai, test hanh vi that va ket qua lenh moi chay.

---

## RPM CANVAS

### RESULT

Career Map hoat dong nhat quan tu giao dien den database:

1. HR them mot vi tri thi map va criteria profile duoc luu trong dung mot revision.
2. CEO publish mot map pending qua mot RPC duy nhat.
3. RPC chi publish sau khi da kiem tra day du map, criteria, preset, master position, employee placement va KPI set.
4. Promotion Hub chi hien thi ho so duoc tao tu placement va du lieu danh gia that.
5. Ngoai le mot chang co form hoat dong that va chi tao draft.

### HARD RESULT

- Khong con mock/fallback/fabricated promotion dossier trong production runtime.
- Khong con callback save tach map/profile trong bat ky thao tac Career Map nao.
- Khong con duong validation profiles optional.
- Khong con UUID ngau nhien de lap cho foreign key that.
- Khong co nhan vien bi bo qua hoac lam transaction loi chi vi thieu store/position.
- Default Supabase gateway phai duoc test truc tiep cho select/delete/scope/error.
- Bat ky loi publish nao cung rollback toan bo transaction.
- Khong bao hoan thanh neu Supabase runtime hoac browser scenario chua chay.

### PURPOSE

Career Map la nen tang cho KPI, danh gia va xet tang bac. Neu he thong hien ho so gia, publish mot phan, hoac luu mat profile, nguoi dung se khong tin ket qua tang bac va san pham khong the demo nhu mot SaaS HRM chuyen nghiep.

### FAILURE MODE ANALYSIS

- KPI version tham chieu `kpi_sets` khong ton tai lam publish rollback.
- Nhan vien chua gan cua hang lam placement insert loi.
- Promotion Hub tu chen diem dep lam nhan vien du dieu kien tang bac sai.
- Mot thao tac UI tao ba lan save lam stale revision hoac mat map/profile.
- Validation khong truyen profiles van cho CEO publish.
- Test chi tim chuoi SQL hoac assert payload gia tao cam giac an toan sai.
- Panel ngoai le mot chang chi co mo ta nen nguoi dung khong the thao tac.

---

## 5D IMPACT - QUYET DINH DA KHOA

| Khu vuc | Muc do | Quyet dinh bat buoc |
|---|---|---|
| UX | RED | Promotion khong hien du lieu gia; single-stage phai dung duoc |
| UI | YELLOW | Mot Career Map o buoc 2; mobile read-only; role HR-only |
| FE/BE | RED | Mot aggregate callback, strict validation, mot publish RPC |
| Data | RED | Foreign key that, placements day du, transaction rollback |
| Security | RED | HR submit; CEO return/publish; actor lay tu session |

Day la correction da duoc nguoi dung phe duyet. Khong hoi lai ID strategy, role matrix, main flow hoac kien truc Career Map.

---

## DOC BAT BUOC PHAI DOC TRUOC KHI SUA

- `AGENTS.md`
- `DESIGN_RULE_HOMIES_FINAL.md`
- `docs/CODEMAP.md`
- `docs/KNOWN_ISSUES.md`
- `docs/TOKEN_PLAYBOOK.md`
- `docs/AI_PLAN_AI_CODE_RULES.md`
- `docs/superpowers/specs/2026-08-24-kpi-homies-career-map-drag-drop-design.md`
- `docs/superpowers/plans/2026-08-24-kpi-homies-career-map-drag-drop-implementation-plan.md`
- `docs/superpowers/reviews/2026-08-24-kpi-career-map-antigravity-correction-prompt-v4.md`
- file Round 5 nay.

Neu sua Next.js component, doc guide lien quan trong `node_modules/next/dist/docs/` truoc khi sua.

---

## BAO VE WORKTREE

1. Chay `git status --short` truoc khi sua.
2. Khong revert, reset, checkout, clean, format hang loat hoac ghi de thay doi cua nguoi dung.
3. Khong commit, stage hoac push.
4. Khong cai dependency moi.
5. Khong sua attendance, employee, payroll, scheduling, app shell, global font hoac auth ngoai pham vi KPI Career Map.
6. Khong sua test chi de no pass neu hanh vi production van sai.
7. Neu gap thay doi bat ngo khong phai do minh tao, dung va bao ro.

---

# 8 LOI CHAN PHAI SUA

## BLOCKER 1 - Publish tao foreign key ngau nhien khong ton tai

### Hien trang sai

Trong `20260824_kpi_career_map_round4_fix.sql`, publish dang dung:

```sql
COALESCE((SELECT s.id ...), gen_random_uuid())
COALESCE((SELECT to_chuc_id ...), gen_random_uuid())
```

`kpi_set_versions.set_id` va `org_id` deu la foreign key bat buoc. UUID ngau nhien khong tham chieu row nao va co the lam transaction fail.

### Ket qua bat buoc

1. Lay organization that cua actor/map theo schema hien co. Khong tim thay thi raise exception ro rang truoc moi mutation.
2. Voi moi position can deploy:
   - tim `kpi_sets` theo dung organization + code;
   - neu chua co thi insert `kpi_sets` that truoc;
   - dung ID vua tim/tao de insert `kpi_set_versions`.
3. Tinh `version_no` theo chinh `set_id` da resolve.
4. Khong mutate version published cu.
5. Khong dung random UUID lam fallback cho foreign key master.

### Regression test bat buoc

```ts
it('creates a real kpi_set before inserting the first version for a new position', () => {})
it('uses the existing organization and never fabricates an org foreign key', () => {})
it('creates version 2 without mutating published version 1', () => {})
it('rolls back when the actor has no valid organization', () => {})
```

Static test phai kiem tra khong con `COALESCE(... gen_random_uuid())` tai `set_id`/`org_id`. Database test phai kiem tra foreign key that.

---

## BLOCKER 2 - Placement loi khi nhan vien thieu store/position

### Hien trang sai

RPC loop toan bo nhan vien active va insert `cua_hang_id` vao cot `store_id NOT NULL`. Nhan vien thieu store co the lam publish rollback. Position null cung chua co policy xu ly ro rang.

### Quyet dinh bat buoc

1. Moi nhan vien active trong organization/scope phai duoc phan loai:
   - `placed`: co store, position va node phu hop;
   - `unresolved`: co du foreign key bat buoc nhung position khong map duoc;
   - `excluded_with_reason`: khong the tao placement hop le vi thieu store/master link.
2. Khong insert `NULL` vao foreign key NOT NULL.
3. Khong am tham bo qua nhan vien.
4. Publish response phai tra counts:
   - `placed_count`;
   - `unresolved_count`;
   - `excluded_count`;
   - ly do theo nhom.
5. Neu schema hien tai khong co noi luu excluded reason, dung va bao blocker schema. Khong tu phat minh table ngoai spec.

### Regression test bat buoc

```ts
it('does not insert a placement with a null store foreign key', () => {})
it('reports active employees missing store or position instead of silently dropping them', () => {})
it('scopes placement generation to the published organization', () => {})
```

---

## BLOCKER 3 - Promotion Hub con mock va du lieu du dieu kien gia

### Hien trang sai

- `/kpi/promotion` van fallback sang `buildDossiers()` khi placement rong.
- `buildPromotionDossiers()` tu chen diem 85/86, 6 thang, 0 su co, 0 warning va `eligible_for_test`.

### Ket qua bat buoc

1. Xoa production runtime fallback `buildDossiers()` va static dossier data.
2. Khong tao diem, gio, thang trong bac, incident, warning, eligibility hoac luong neu repository khong co du lieu.
3. Dossier chi duoc tao khi co placement hop le va employee map hop le.
4. Truong du lieu thieu phai hien trang thai ro rang:
   - `Chua co du lieu danh gia`;
   - `Chua du du lieu xet tang bac`;
   - hoac empty state phu hop.
5. `eligibilityStatus` phai duoc tinh tu evaluation/development/incident/appeal that. Khong hard-code.
6. Store Manager chi thay dossier thuoc store scope.
7. Employee mapping thieu khong duoc fallback sang mot nhan vien khac.

### Regression test bat buoc

```ts
it('renders an empty state when repository placements are empty', () => {})
it('never falls back to static promotion dossiers in production runtime', () => {})
it('does not fabricate scores months hours incidents warnings or eligibility', () => {})
it('keeps a dossier not eligible when required evaluation data is missing', () => {})
```

Search gate:

```powershell
rg -n "buildDossiers|DOSSIERS|eligible_for_test as const|total: 85|months_in_level: 6" src/app/kpi/promotion src/lib/kpi/career-map-deployment-service.ts
```

Ket qua phai khong con production mock/fabricated fallback.

---

## BLOCKER 4 - Publish RPC chua validate day du truoc mutation

### Hien trang sai

RPC Round 4 moi kiem tra CEO, date, status, node count, profile existence va weight 100. Test SQL mang ten day du nhung chi tim vai chuoi text.

### Validation bat buoc truoc dong mutation dau tien

1. Actor tu session ton tai va thuoc organization hop le.
2. Actor la CEO.
3. Lock target map `FOR UPDATE`.
4. Map la `pending_approval`.
5. Effective date hop le va khong trong qua khu.
6. Co active node va co it nhat mot lo trinh hop le neu graph co nhieu cap.
7. Tat ca node:
   - cung target map;
   - position ID ton tai trong live master position;
   - position dang active;
   - level > 0;
   - co criteria profile.
8. Tat ca edge:
   - source/target ton tai;
   - cung map;
   - khong self-loop;
   - target level = source level + 1;
   - khong cycle;
   - preset key/version ton tai dung snapshot.
9. Moi active profile:
   - co it nhat mot active criterion;
   - tong active weight = 100;
   - criterion field bat buoc hop le.
10. Cac nhanh nghiep vu bat buoc hoi tu cap quan ly theo rule domain da khoa.
11. KPI set/org foreign key da resolve hop le.
12. Employee placement input da duoc phan loai an toan.

Chi sau khi tat ca validation pass moi duoc:

- supersede map cu;
- publish map moi;
- update profile effective date;
- tao placements;
- tao KPI sets/versions;
- ghi approval log.

Tat ca nam trong cung transaction cua function. Bat ky exception nao cung khong de lai map published mot phan.

### Regression test bat buoc

```ts
it('rejects an edge whose source or target belongs to another map', () => {})
it('rejects a cycle and a skipped level before changing map status', () => {})
it('rejects a missing or mismatched preset version', () => {})
it('rejects an inactive or missing live master position', () => {})
it('rejects a branch that does not converge to management', () => {})
it('leaves map status and deployment tables unchanged after a forced publish failure', () => {})
```

Khong duoc dat ten test "validates graph criteria presets" neu assert khong kiem tra tung hanh vi tren.

---

## BLOCKER 5 - UI van save ba lan va Canvas thieu snapshot/role

### Hien trang sai

Designer/Canvas dang goi ca:

- `onChange(map)`;
- `onUpdateProfiles(profiles)`;
- `onAggregateChange({ map, profiles })`.

Page van truyen ca ba callback. Canvas khong nhan `positions` va `userRole`; Scope Step rut gon position chi con id/name/level.

### Event contract duy nhat

Career Map Designer va Canvas chi duoc dung:

```ts
interface CareerMapAggregateChange {
  map: KpiCareerMapVersion
  profiles: KpiPositionCriteriaProfile[]
}

onAggregateChange(change: CareerMapAggregateChange): void
```

### Ket qua bat buoc

1. Xoa callback split khoi Career Map Designer/Canvas/Scope path:
   - `onChange` cho map mutation;
   - `onUpdateProfiles` cho profile mutation.
2. Page chi persist mot lan cho moi thao tac aggregate.
3. Them position, drag position, move node, connect edge, delete node/edge va sua profile deu phai tao mot aggregate event.
4. Scope Step truyen full `KpiCareerPositionSnapshot`, khong map bo:
   - `department_id`;
   - `job_family`;
   - `base_salary`;
   - `pay_type`;
   - `active`.
5. Designer truyen `positions` xuong Canvas.
6. Designer/Canvas nhan role that tu auth context/prop da co.
7. Chi `hr_admin` duoc sua graph draft/returned tren desktop.
8. `admin`, CEO, manager, employee va role undefined khong duoc sua graph.
9. Mobile luon read-only bat ke role.
10. Khong fallback `{ id, name: id }` trong live drop path. Neu khong tim thay snapshot thi bao loi va khong add node.

### Regression test bat buoc

```ts
it('persists one repository revision when a dropped position creates a node and profile', () => {})
it('emits exactly one aggregate change for add move connect delete and profile edit', () => {})
it('passes the complete live position snapshot through Scope Designer and Canvas', () => {})
it('rejects a dropped position that is missing from the live position list', () => {})
it('allows desktop graph editing only for hr_admin draft or returned maps', () => {})
it('keeps mobile graph read-only for every role', () => {})
```

---

## BLOCKER 6 - Validation/publish van cho bo profiles

### Hien trang sai

`ValidateCareerMapInput` va service submit/publish van khai bao profiles optional. `validateCareerMap()` chi validate criteria khi profiles duoc truyen, nen publish co the bypass.

### Ket qua bat buoc

1. `profiles`, `presets`, `masterPositions` bat buoc trong validation context dung cho submit/publish.
2. Xoa legacy overload nhan `map` va cac arg optional.
3. Tach neu can:
   - lightweight graph validation cho UI draft;
   - strict deployment validation cho submit/publish.
4. `submitCareerMapForApproval()` va `publishCareerMap()` nhan mot object input bat buoc, khong co optional profile path.
5. Missing validation context phai la compile error va runtime error tai boundary du lieu ngoai.
6. Empty map, missing profile, missing preset, missing master position deu blocking.

### Regression test bat buoc

```ts
it('rejects strict validation when profiles presets or master positions are missing', () => {})
it('cannot call submit or publish through the legacy optional profile signature', () => {})
it('blocks an empty career map from continue submit and publish', () => {})
```

---

## BLOCKER 7 - Supabase reconciliation test van gia va loi bi nuot

### Hien trang sai

Test delete hien tai su dung custom fake gateway. No chi chung minh repository gui payload khong co row cu; no khong chay `createDefaultSupabaseKpiGateway()` va khong quan sat `.delete()`.

Default gateway cung chi reconcile neu select khong loi. Neu select loi, code bo qua delete va tiep tuc upsert, lam row cu co the song lai.

### Ket qua bat buoc

1. Export default gateway theo cach testable noi bo hoac tach reconciliation thanh don vi co contract ro rang.
2. Mock Supabase chain phai ghi nhan that:
   - `.from(table)`;
   - `.select(...)`;
   - `.delete()`;
   - `.in()`/`.eq()` scope;
   - IDs bi xoa;
   - thu tu delete truoc upsert.
3. Test truc tiep default gateway, khong chi test custom gateway.
4. Select reconciliation error phai throw sync error; khong duoc bo qua.
5. Delete/upsert error phai throw.
6. Chi xoa child row nam trong target map/profile scope.
7. Khong xoa published snapshot hoac row cua map/profile khac.
8. Placements va approval logs phai load/save dung dedicated tables. Khong dung `selectTableSafe` neu viec fail am tham lam sai canonical state.

### Regression test bat buoc

```ts
it('calls delete on the default Supabase gateway for child rows missing from the aggregate', () => {})
it('scopes node edge and placement deletes to the target career map', () => {})
it('scopes criteria item deletes to the target profile', () => {})
it('does not delete rows belonging to another map or profile', () => {})
it('throws when reconciliation select delete or upsert fails', () => {})
it('loads placements and approval logs from their dedicated tables without silent fallback', () => {})
```

Moi test phai assert call log cua Supabase client chain, khong chi assert payload `replaceAll`.

---

## BLOCKER 8 - Advanced single-stage chi la noi dung tinh

### Hien trang sai

Section `single_stage` da co nhung chi hien giai thich. Nguoi dung khong the tao ngoai le mot chang.

### UI/flow bat buoc

Panel `Ngoai le: Thiet lap mot chang rieng` phai co:

1. Chon vi tri hien tai tu live master positions.
2. Chon dung mot vi tri cap ke tiep.
3. Chi hien target co `level = source level + 1`.
4. Chon preset/template hien co; khong tao engine thu ba.
5. Chon pham vi:
   - toan chuoi;
   - nhom cua hang;
   - mot hoac nhieu cua hang.
6. Chon ngay hieu luc hop le.
7. Preview tac dong:
   - vi tri/chang;
   - so cua hang;
   - so nhan vien anh huong;
   - preset/tieu chi se dung;
   - xung dot voi draft/version hien co.
8. Nut `Tao ban nhap ngoai le`.
9. Nut khong publish truc tiep.
10. Tao draft bang service promotion rule hien co.
11. Validation loi hien bang tieng Viet de hieu.
12. Khong dua single-stage tro lai main Step 2.

### Regression test bat buoc

```ts
it('offers only adjacent next-level target positions', () => {})
it('previews affected stores and employees before creating the exception', () => {})
it('creates one draft and never publishes directly', () => {})
it('keeps single-stage setup only inside Advanced Settings', () => {})
```

---

# PASS THUC HIEN BAT BUOC

## PASS 0 - Baseline va thay test gia

1. Chay test hien tai, ghi baseline.
2. Viet regression tests cho tung blocker.
3. Chay RED va ghi:
   - ten test;
   - assertion fail;
   - tai sao fail dung loi production.
4. Test fail do import/syntax/setup khong duoc tinh la RED evidence.

## PASS 1 - Promotion data truth

Sua Blocker 3 truoc de khong con du lieu thang tien gia trong runtime.

Gate: test promotion real data GREEN; search production mock khong con ket qua.

## PASS 2 - Strict domain validation

Sua Blocker 6 va phan domain validation cua Blocker 4.

Gate: optional validation signature bi xoa; strict validation tests GREEN.

## PASS 3 - Atomic SQL deployment

Sua Blocker 1, 2 va 4 trong migration correction moi.

Neu migration Round 4 da duoc deploy o bat ky moi truong nao, tao migration Round 5 moi. Khong sua lich su da deploy nhu the chua tung ton tai. Neu day chi la scratch local chua deploy, ghi ro precondition trong bao cao.

Gate: SQL contract test that + Supabase reset/test matrix neu CLI/Docker co san.

## PASS 4 - Real Supabase reconciliation

Sua Blocker 7 va thay test false positive.

Gate: test phai quan sat `.delete()` va error propagation tren default gateway.

## PASS 5 - Atomic Career Map UI

Sua Blocker 5.

Gate: mot user action = mot aggregate event = mot repository revision.

## PASS 6 - Single-stage functional flow

Sua Blocker 8.

Gate: tao draft tu preview, khong publish truc tiep.

## PASS 7 - Full verification va bao cao

Chay tat ca lenh bat buoc, test Supabase/browser neu moi truong cho phep, cap nhat tai lieu va nop report dung mau.

---

# FILE SCOPE DU KIEN

Chi sua file that su can thiet trong danh sach sau:

- `src/app/kpi/settings/page.tsx`
- `src/app/kpi/promotion/page.tsx`
- `src/components/kpi/career-map/KPICareerMapDesigner.tsx`
- `src/components/kpi/career-map/KPICareerMapCanvas.tsx`
- `src/components/kpi/program/KPIProgramScopeStep.tsx`
- `src/components/kpi/program/KPIAdvancedSettingsPanel.tsx`
- component single-stage moi neu can, dat trong `src/components/kpi/program/`
- `src/lib/kpi/career-map-service.ts`
- `src/lib/kpi/career-map-deployment-service.ts`
- `src/lib/kpi/career-map-types.ts`
- `src/lib/kpi/supabase-repository.ts`
- test tuong ung trong `src/lib/kpi/`
- migration Career Map correction trong `supabase/migrations/`
- `docs/CODEMAP.md` neu tao file moi
- `docs/KNOWN_ISSUES.md` neu phat hien va sua bug moi
- plan Career Map hien tai de tick task Round 5 neu co section phu hop.

Muon sua file ngoai danh sach phai ghi ro ly do trong report. Khong tu y refactor/rename/move.

---

# VERIFICATION BAT BUOC

## Career Map focused tests

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/career-map-sql-contract.test.ts src/lib/kpi/local-repository.test.ts src/lib/kpi/supabase-repository.test.ts src/lib/kpi/program-service.test.ts src/lib/kpi/fnb-template-catalog.test.ts
```

## Full KPI tests

```powershell
$tests = Get-ChildItem 'src/lib/kpi' -Filter '*.test.ts' | ForEach-Object { $_.FullName }
node --experimental-strip-types --test $tests
```

## Lint focused

```powershell
npm run lint -- src/app/kpi/settings/page.tsx src/app/kpi/promotion/page.tsx src/components/kpi/career-map src/components/kpi/program/KPIProgramScopeStep.tsx src/components/kpi/program/KPIAdvancedSettingsPanel.tsx src/lib/kpi
```

## TypeScript

```powershell
npx tsc --noEmit
```

## Production build

```powershell
npm run build
```

## AI guard

```powershell
npm run ai:ready
```

## Diff hygiene

```powershell
git diff --check
git status --short
```

## Supabase runtime

Neu Supabase CLI va Docker co san:

```powershell
supabase status
supabase db reset
```

Sau reset, chay matrix it nhat:

1. HR submit draft thanh cong.
2. CEO submit bi reject.
3. HR publish bi reject.
4. CEO publish draft bi reject.
5. CEO publish pending thanh cong.
6. Past date bi reject.
7. Invalid graph bi reject va khong doi status.
8. Invalid criteria/preset/master position bi reject.
9. Position chua co KPI set duoc tao set that roi version 1.
10. Publish lan sau tao version 2, giu version 1.
11. Employee thieu store/position duoc xu ly dung policy, khong insert NULL.
12. Forced failure rollback map/placements/KPI versions/log.

Neu khong co Supabase CLI/Docker, ghi dung:

`Supabase runtime: NOT RUN - [ly do cu the]`

Khong duoc viet "SQL da chuan", "migration san sang deploy" hoac "atomic da xac nhan" neu database that chua chay.

## Browser scenarios

Test desktop va mobile:

1. HR desktop add/drop position tao mot lan save.
2. CEO/admin/manager/employee khong sua graph.
3. Role undefined khong sua graph.
4. Mobile HR khong drag/connect/delete/drop.
5. Empty map khong continue/submit.
6. Promotion placements rong hien empty state, khong mock.
7. Promotion du lieu thieu hien chua du dieu kien.
8. Advanced single-stage loc dung cap ke tiep, preview va tao draft.

Neu khong chay duoc browser, ghi:

`Browser scenarios: NOT RUN - [ly do cu the]`

---

# QUY TAC CHONG FALSE POSITIVE

1. Test SQL khong duoc chi dung `includes()` de dai dien cho behavior transaction.
2. Test co the dung static contract cho signature/schema, nhung role/state/rollback/FK phai chay database neu moi truong co san.
3. Test repository delete phai quan sat `.delete()` tren default gateway.
4. Test atomic UI phai dem aggregate callbacks va repository revisions.
5. Test promotion phai assert khong co fabricated eligibility khi input thieu.
6. Khong hard-code test data trung khop implementation roi chi assert ID/payload.
7. Khong sua test de chap nhan behavior sai hien tai.
8. Moi regression test phai co RED evidence truoc fix va GREEN evidence sau fix.

---

# DEFINITION OF DONE

Chi duoc bao `HOAN TAT` khi tat ca dieu sau dung:

- [ ] Khong con production mock/fabricated promotion dossier.
- [ ] Publish tao/lay foreign key that, khong random fallback.
- [ ] Placement khong insert NULL foreign key va khong bo qua nhan vien am tham.
- [ ] Publish validate day du truoc mutation va rollback khi fail.
- [ ] Submit/publish strict context khong optional.
- [ ] Moi Career Map UI action chi persist mot revision.
- [ ] Full live position snapshot va role that di qua Canvas.
- [ ] Mobile va non-HR khong sua graph.
- [ ] Default gateway delete/error duoc test that.
- [ ] Single-stage panel hoat dong va chi tao draft.
- [ ] Focused tests pass.
- [ ] Full KPI tests pass.
- [ ] Lint khong co error; warning moi phai duoc giai thich.
- [ ] TypeScript pass.
- [ ] Build pass hoac ghi FAIL dung output va phan loai root cause.
- [ ] AI guard pass hoac ghi FAIL dung output va phan loai root cause.
- [ ] Supabase runtime va browser co PASS evidence; neu NOT RUN thi trang thai chung khong duoc ghi 100% production-ready.
- [ ] `docs/CODEMAP.md`, `docs/KNOWN_ISSUES.md` va plan duoc cap nhat dung quy tac neu can.

---

# MAU BAO CAO ANTIGRAVITY BAT BUOC

Tao file:

`docs/superpowers/reviews/2026-08-24-kpi-career-map-antigravity-round5-result.md`

Noi dung dung thu tu:

## 1. Verdict

- `COMPLETE`, `PARTIAL` hoac `BLOCKED`.
- Khong dung `100%` neu Supabase/browser NOT RUN.

## 2. Changed files

- Tung file.
- Ly do sua.
- Khong dung mo ta chung chung.

## 3. Blocker-by-blocker evidence

Voi moi Blocker 1-8:

- trieu chung cu;
- root cause;
- test RED va assertion fail;
- file/ham da sua;
- test GREEN;
- hanh vi nguoi dung sau fix.

## 4. SQL evidence

- final publish RPC signature;
- state machine role matrix;
- validation order;
- transaction mutation order;
- KPI set/version creation;
- employee placement handling;
- rollback evidence.

## 5. Repository evidence

- call log `.select/.delete/.scope/.upsert` cua default gateway;
- error propagation evidence;
- cross-map safety evidence.

## 6. UI evidence

- callback/revision count;
- role desktop matrix;
- mobile lock matrix;
- Promotion empty/missing-data behavior;
- single-stage flow.

## 7. Verification table

| Check | Command/scenario | Result | Evidence |
|---|---|---|---|
| Focused tests | ... | PASS/FAIL | count |
| Full KPI tests | ... | PASS/FAIL | count |
| ESLint | ... | PASS/FAIL | errors/warnings |
| TypeScript | ... | PASS/FAIL | exit code |
| Build | ... | PASS/FAIL | root cause |
| AI ready | ... | PASS/FAIL | root cause |
| Supabase runtime | ... | PASS/FAIL/NOT RUN | ly do |
| Browser desktop | ... | PASS/FAIL/NOT RUN | scenario |
| Browser mobile | ... | PASS/FAIL/NOT RUN | scenario |
| git diff --check | ... | PASS/FAIL | files |

## 8. Remaining risks

- Liet ke ro, khong viet `khong co` neu database/browser chua chay.

## 9. Exact next step

- Mot buoc cu the de Codex review doc lap.

---

# LENH BAN GIAO CUOI

Sau khi hoan tat, Antigravity chi gui:

1. Duong dan report Round 5.
2. Verdict `COMPLETE/PARTIAL/BLOCKED`.
3. Tong test pass/fail.
4. Supabase runtime `PASS/FAIL/NOT RUN`.
5. Browser scenarios `PASS/FAIL/NOT RUN`.
6. Danh sach remaining risks.

Khong gui bai tong ket marketing. Khong tu tuyen bo duyet. Quyen duyet cuoi cung thuoc Codex review doc lap va nguoi dung.
