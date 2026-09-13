# Career Map Antigravity Correction Prompt - Vong 3

**Ngay:** 2026-08-24  
**Trang thai:** Lan sua vong 2 chua duoc nghiem thu  
**Muc tieu:** Sua dung cac loi con lai sau review doc lap, khong mo rong tinh nang moi

## EXECUTION REQUEST

Hay thuc hien tron goi Correction Round 3 cho KPI Career Map. Duoc phep lam lien tuc tu Pass 0 den Pass E, khong can dung cho xac nhan giua cac pass. Tuy nhien, moi pass chi duoc chuyen sang pass tiep theo khi test cua pass hien tai da dat.

Khong tin vao bao cao hoan thanh vong 2. Hay kiem tra hanh vi runtime, repository va SQL thuc te. Test dang xanh nhung khong kiem tra dung ket qua nghiep vu phai duoc thay bang test co kha nang that bai khi loi quay lai.

### Tai lieu bat buoc doc truoc khi sua

1. `AGENTS.md`
2. `DESIGN_RULE_HOMIES_FINAL.md`
3. `docs/CODEMAP.md`
4. `docs/KNOWN_ISSUES.md`
5. `docs/TOKEN_PLAYBOOK.md`
6. `docs/AI_PLAN_AI_CODE_RULES.md`
7. `docs/superpowers/specs/2026-08-24-kpi-homies-career-map-drag-drop-design.md`
8. `docs/superpowers/plans/2026-08-24-kpi-homies-career-map-drag-drop-implementation-plan.md`
9. `docs/superpowers/reviews/2026-08-24-kpi-career-map-antigravity-correction-prompt.md`
10. File correction vong 3 nay.

Neu sua component Next.js, phai doc guide lien quan trong `node_modules/next/dist/docs/` theo quy tac cua du an.

### Quy tac an toan

- Chay `git status --short` truoc khi sua.
- Worktree dang co nhieu thay doi cua nguoi dung. Khong revert, overwrite, format hang loat hoac lam sach thay doi khong thuoc Career Map.
- Khong commit, stage, push, rename hoac di chuyen file.
- Khong sua module attendance, payroll, scheduling, employee contracts hoac giao dien KPI khong lien quan.
- Khong sua `KPIDetailModal.tsx` va `KPITeamTable.tsx` de doi lay lint xanh neu loi khong do Career Map gay ra.
- Khong che loi build Google Fonts bang cach thay font/global config ngoai pham vi.
- Khong tick plan hoan thanh neu con mot Done Criterion chua co bang chung.
- Moi loi nghiep vu phai co regression test do that bai khi implementation bi go bo.
- Neu Supabase local khong chay duoc, ghi ro `NOT RUN`; khong tuyen bo SQL/RLS dat.

---

## RPM CANVAS

### RESULT

Tai buoc 2 cua `/kpi/settings`, HR su dung mot Career Map duy nhat duoc tao tu danh muc chuc danh Homies that. Keo mot chuc danh vao so do phai dong thoi tao profile tieu chi F&B 100%. HR gui duyet mot lan, CEO duyet mot lan, sau do he thong tao dung placement va KPI version moi cho toan chuoi.

### HARD RESULT

- Khong con ID chuc danh gia khi master data that da tai.
- Khong co caller frontend, service, repository hay RPC nao bypass `HR -> pending_approval -> CEO -> published`.
- Local repository va Supabase repository cho ket qua nghiep vu tuong duong.
- Preset chi co mot nguon su that, Admin sua mot lan va moi edge cung loai dung dung version moi.
- Employee chi xem ho so cua minh; Store Manager chi xem nhan vien trong store scope.
- Mobile khong cho thay doi cau truc so do.

### PURPOSE

Day la flow demo quyet dinh kha nang khach hang F&B hieu san pham va chot mua. Neu so do dung du lieu gia, mat tieu chi, lo thong tin hoac publish sai, nguoi dung se mat niem tin vao toan bo module KPI va thang tien.

### FAILURE MODE ANALYSIS

- ID gia khong map duoc nhan vien that, preview va placement sai.
- Node chi co `criteria_profile_id` nhung khong co profile that, nhan vien duoc xet bang bo tieu chi rong.
- Supabase nhan ID chuoi vao cot UUID hoac ghi cot khong ton tai, save production that bai.
- RLS mo draft criteria hoac promotion page fallback sai, nhan vien thay du lieu cua nguoi khac.
- RPC chi doi status ma khong tao snapshot/placement/KPI version, giao dien bao thanh cong nhung backend chua trien khai.
- Test xanh gia tao cam giac da an toan trong khi runtime van sai.

---

## 5D IMPACT ASSESSMENT

| Khu vuc | Muc do | Yeu cau kiem soat |
|---|---|---|
| UX | RED | Thay flow buoc 2, bo flow tung chang khoi luong chinh, mobile read-only |
| UI | YELLOW | Chinh Career Map, preset editor, empty state promotion; giu design Homies |
| FE/BE | RED | Sua domain API, state transition, atomic save va deployment |
| Data | RED | Dong bo ID strategy, schema preset, placements, logs va KPI snapshots |
| Security | RED | Sua RLS va scope Employee/Store Manager; bat buoc test role matrix |

Day la thay doi RED da duoc nguoi dung phe duyet de lap correction prompt. Khong mo rong ngoai pham vi da liet ke.

---

## CURRENT FAILURES - BANG CHUNG PHAI SUA

### 1. Active map van uu tien seed ID gia

- `src/app/kpi/settings/page.tsx`: `activeCareerMap` lay `database.career_maps[0]` truoc khi tao map tu `careerPositions` that.
- `src/lib/kpi/seed.ts`: seed van dung `pos_barista_c1`, `pos_cashier_c1`, `pos_shift_leader`...
- Seed published co the lam Career Map mac dinh bi read-only.

### 2. UI them node sai contract va khong tao profile

- `KPICareerMapDesigner.tsx` va `KPICareerMapCanvas.tsx` goi `addCareerMapNode(map, positionId, ...)` bang chuoi ID.
- Neu UUID moi khong co trong snapshot cu, service co the dung UUID lam display name.
- Service chi gan `criteria_profile_id`; khong tao `KpiPositionCriteriaProfile`.
- Map va profiles dang luu bang hai lan `persistDatabase` rieng, khong atomic.

### 3. Test profile hien tai la false positive

Test `creates and links the default F&B criteria profile when a node is added` chi assert node co chuoi `criteria_profile_id`. Test khong assert profile duoc tao, co criteria active va tong weight bang 100.

### 4. Flow chinh van con flow tung chang va duplicate Career Map

- `KPIProgramScopeStep` van co nut `Mot chang rieng (Nang cao)` trong main step.
- Nut Continue cua standard mode luon enabled.
- `/kpi/settings` van co tab `Career Map` ngang hang voi wizard, du Career Map da nam trong buoc 2.
- `handleApplyCareerStages` va callback cu van con trong main page.
- `KPIAdvancedSettingsPanel` chua chua flow ngoai le mot chang rieng.

### 5. Validation va approval van co bypass

- `validateCareerMap(map, profiles?)` chi validate criteria neu profiles duoc truyen.
- `submitCareerMapForApproval(..., profiles?)` va `publishCareerMap(..., profiles?)` cho phep caller bo profiles.
- `submitCareerMapForApproval` van cho `ceo` va `admin` gui duyet.
- `publishCareerMap` van cho role `admin` publish, trai state machine da duyet.
- Ngay hieu luc chi check rong, chua chan ngay trong qua khu.
- Chua co `no_management_convergence` dung theo spec.

### 6. Preset van co nhieu nguon su that

- `DEFAULT_CAREER_TRANSITION_PRESETS` co domain value.
- `KPICareerMapInspector.tsx` van dung `PRESET_DESCRIPTIONS` hard-code voi so thang, diem, gio khac domain.
- `KPICareerMapReadOnly.tsx` hard-code them mot bo value nua.
- Chua co UI Admin sua preset mot lan va preview so edge bi anh huong.
- Chua co test bat buoc `updates every matching edge when one shared preset receives a new version`.

### 7. Supabase repository khong khop schema

- Repository ghi `transition_presets` vao `kpi_career_map_versions`, nhung migration khong co cot nay.
- Runtime tao ID dang `career_map_*`, `node_*`, `profile_*`, trong khi SQL khai bao UUID cho map/node/edge/profile/item.
- Gateway chi map versions/nodes/edges/profiles/items; bo placements va approval logs.
- `replaceAll` chi upsert, nen row da xoa khoi client van co the con trong database.
- Unit test gateway dang mock table, khong bat duoc loi cot SQL va UUID.

### 8. RLS va publish RPC chua dat

- Draft criteria profiles/items van `USING (TRUE)`.
- Approval logs bat RLS nhung thieu read policy dung cho HR/CEO.
- Placement chua co pipeline ghi tu publish RPC.
- RPC publish chi supersede/publish/log; chua validate full graph/profile/preset, tao snapshots, placements va KPI version trong cung transaction.
- Edge chua bi chan khi source/target node thuoc map version khac.

### 9. Promotion scope van dung mock va fallback nguy hiem

- `/kpi/promotion` van dung static `DOSSIERS`.
- Employee khong match bi fallback sang dossier dau tien.
- Store Manager khong match store bi fallback sang toan bo dossiers.
- Chua co empty state an toan va repository/RLS enforcement.

### 10. Mobile van edit duoc

Banner mobile khong phai khoa nghiep vu. `draggable`, `onDrop`, `onConnect`, drag stop va Delete van hoat dong neu `readOnly=false`, khong phu thuoc viewport.

---

## PASS 0 - KHOA REGRESSION TEST DUNG

Viet test do truoc khi sua implementation. Cac test phai test output thuc, khong chi test field ID duoc gan.

### Test bat buoc

```ts
it('creates a live-master career map instead of reusing the fake-id seed', () => {})
it('adds a position snapshot with its UUID name level department and job family intact', () => {})
it('atomically adds a node and a real default profile whose active weights total 100', () => {})
it('rejects submission when profiles are omitted', () => {})
it('allows only HR Admin to submit and only CEO to return or publish', () => {})
it('rejects a past effective date', () => {})
it('blocks an operations branch that never converges to management', () => {})
it('updates every matching edge when a shared preset receives a new version', () => {})
it('persists deletion of career map child rows in the Supabase gateway', () => {})
it('round trips presets placements and approval logs through the Supabase gateway', () => {})
it('shows no dossier instead of another employee when employee mapping is missing', () => {})
it('shows no dossiers outside the store managers permitted stores', () => {})
```

Neu component test infrastructure khong co, tach logic chon active map, role scoping va mobile edit policy thanh pure functions co test. Khong them framework test moi chi de hoan thanh task.

### Verification Pass 0

Chay test moi va ghi nhan no fail dung ly do truoc khi sua. Trong bao cao cuoi phai liet ke test nao da RED truoc va GREEN sau.

---

## PASS A - MASTER DATA, ATOMIC NODE/PROFILE VA FLOW BUOC 2

### A1. Chon hoac tao active Career Map dung

- Khi master positions tai thanh cong, khong dung map seed neu map hien tai chua khop live IDs.
- Uu tien draft/returned map moi nhat co snapshot khop master data.
- Neu chi co published map, HR phai clone thanh draft version moi truoc khi sua.
- Neu chua co map hop le, tao draft tu `careerPositions` that.
- Seed chi dung khi master data rong hoac demo mode duoc xac dinh ro.
- Khong silently mutate published snapshot.

Tach selection logic thanh pure function, vi du:

```ts
selectEditableCareerMap({ maps, livePositions, actorId, demoFallback })
```

Function phai co test cho: database co fake seed + live UUID positions, published-only map, draft matching map va master data rong.

### A2. Doi contract them node

Khong cho them node bang string ID don le. API phai nhan full position snapshot.

```ts
type AddCareerPositionResult = {
  map: KpiCareerMapVersion
  profiles: KpiPositionCriteriaProfile[]
}

addCareerPosition(
  map: KpiCareerMapVersion,
  profiles: KpiPositionCriteriaProfile[],
  position: KpiCareerPositionSnapshot,
  coords?: { x: number; y: number },
): AddCareerPositionResult
```

Bat buoc:

- Giu nguyen ID, name, level, department_id, active va job_family.
- Khong suy dien level neu master data da co level.
- Neu level master data thieu, dung rule suy dien va chan neu van khong xac dinh duoc.
- Tao profile mac dinh bang `createDefaultProfileForPosition` hoac service F&B da co.
- Profile phai ton tai that trong ket qua, co criteria active va tong weight dung 100.
- Neu profile da ton tai, khong tao ban trung.
- Map va profiles phai duoc save trong mot lan repository update.
- Designer va Canvas phai lookup full position object truoc khi goi domain action.

### A3. Don main flow

- Buoc 2 mac dinh render Career Map.
- Xoa Career Map tab ngang hang voi wizard.
- Xoa khoi standard flow: dropdown from/to, tao N chang, template tung chang va callback `handleApplyCareerStages`.
- Chuyen `Mot chang rieng` vao `KPIAdvancedSettingsPanel` duoi nhom `Ngoai le nang cao`.
- Continue chi enabled khi map/profile/preset validation khong co blocking issue.
- Khong xoa engine mot chang neu Advanced Settings van can; chi doi vi tri va luong truy cap.

### Verification Pass A

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/program-service.test.ts src/lib/kpi/local-repository.test.ts
npm run lint -- src/app/kpi/settings/page.tsx src/components/kpi/career-map src/components/kpi/program/KPIProgramScopeStep.tsx src/components/kpi/program/KPIAdvancedSettingsPanel.tsx src/lib/kpi/career-map-service.ts src/lib/kpi/career-map-criteria-service.ts
npx tsc --noEmit
```

---

## PASS B - PRESET, VALIDATION, APPROVAL VA MOBILE POLICY

### B1. Mot nguon preset duy nhat

- Dung mot collection preset co version trong canonical KPI database/repository.
- Inspector va ReadOnly nhan preset qua props/service; xoa `PRESET_DESCRIPTIONS` va moi hard-code business values trong component.
- Edge chi luu `preset_key` va `preset_version`.
- Admin UI cho phep sua preset theo loai chang, hien preview so edge bi anh huong va xac nhan truoc khi ap dung.
- Khi ap dung preset version moi, cap nhat moi matching edge chua published theo policy da chot; published snapshots giu nguyen version cu.
- Snapshot KPI version phai luu dung preset version tai ngay hieu luc.

### B2. Validation khong optional

Thay API de khong caller nao co the bo profiles, presets hoac live positions:

```ts
validateCareerMap({
  map,
  profiles,
  presets,
  masterPositions,
  effectiveDate,
})
```

Blocking issues toi thieu:

- missing position/master reference;
- missing/invalid level;
- missing profile;
- no active criteria;
- active weight total != 100;
- missing/invalid preset;
- dangling node/edge reference;
- cross-map node reference;
- self-loop, cycle, downward, same-level, skipped-level;
- operations branch khong hoi tu len management;
- effective date trong qua khu.

### B3. State machine dung vai tro

Bat buoc dung chinh xac:

```text
draft/returned --HR_ADMIN--> pending_approval
pending_approval --CEO--> returned
pending_approval --CEO--> published
published --HR_ADMIN clone--> draft version + 1
```

- CEO khong duoc submit.
- Generic `admin` khong duoc submit/publish neu spec khong dinh nghia role nay.
- HR khong duoc publish.
- Service signatures phai bat buoc truyen validation context.
- UI button visibility va service authorization phai dong nhat.

### B4. Mobile edit policy

- Dinh nghia mot policy `canEditCareerMapStructure(role, status, viewport)` hoac hook tuong duong.
- O mobile/tablet nho: read-only structure; cho pan/zoom va xem chi tiet, khong drop, drag node, connect edge, delete node/edge.
- Khoa bang behavior, khong chi an nut hoac hien banner.
- Desktop HR draft/returned moi duoc edit.
- CEO pending chi review/return/publish, khong sua graph.

### Verification Pass B

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts
npm run lint -- src/components/kpi/career-map src/lib/kpi/career-map-types.ts src/lib/kpi/career-map-service.ts src/lib/kpi/career-map-deployment-service.ts
npx tsc --noEmit
```

---

## PASS C - SUPABASE SCHEMA, REPOSITORY, RLS VA ATOMIC PUBLISH

Day la pass chan nghiem thu. Khong duoc chi sua TypeScript mock.

### C1. Chot ID strategy

Chon mot trong hai va dung nhat quan:

1. Khuyen nghi: runtime tao UUID hop le cho map/node/edge/profile/item/log/placement; hoac
2. Neu phai giu semantic string ID, migration phai doi cac cot tuong ung sang TEXT va tat ca FK phai cung kieu.

Khong duoc gui `career_map_*`, `node_*`, `profile_*` vao cot UUID.

Master `position_id` co the giu VARCHAR/TEXT neu adapter hien tai dung UUID hoac legacy string; phai bao toan gia tri that.

### C2. Schema preset

Khong luu `transition_presets` vao cot khong ton tai.

Khuyen nghi tao table rieng co it nhat:

- id;
- preset_key;
- version;
- cac field dieu kien;
- effective_from;
- status/snapshot metadata;
- unique `(preset_key, version)`.

Neu chon JSONB tren version table, migration, repository, RLS va tests phai dong bo day du. Khong duoc co hai nguon su that.

### C3. Gateway day du va delete sync

Load/save day du:

- career map versions;
- nodes;
- edges;
- transition presets;
- criteria profiles/items;
- placements;
- approval logs.

Khi save aggregate:

- Upsert row hien tai.
- Xoa row con khong con trong aggregate, chi trong dung career map/profile scope.
- Khong xoa du lieu KPI ngoai scope.
- Bao toan published snapshots.
- Gateway tests phai verify delete propagation, not just upsert calls.

### C4. RLS

Bat buoc policy matrix:

| Du lieu | HR Admin | CEO | Store Manager | Employee |
|---|---|---|---|---|
| Draft/returned map | read/write/submit | no write | no access | no access |
| Pending map | read | read/return/publish | no access | no access |
| Published map | read | read | read | read |
| Draft criteria/preset | read/write | read | no access | no access |
| Published placement | full chain | full chain | permitted stores only | own employee only |
| Approval logs | read | read | no access | no access |

- Xoa `USING (TRUE)` tren criteria.
- Client khong duoc tu insert/update placements va approval logs.
- Store scope phai dua tren membership/assignment that, khong chi field do client truyen.
- Approval log co read policy HR/CEO.
- Them constraint/trigger chan edge neu source/target node khong thuoc cung `career_map_version_id` voi edge.

### C5. Atomic publish RPC

`publish_kpi_career_map` phai chay trong mot transaction va:

1. Lock map row.
2. Xac thuc actor la CEO.
3. Bat buoc status `pending_approval`.
4. Chan effective date trong qua khu.
5. Revalidate master references, nodes, edges, levels, graph convergence.
6. Revalidate profiles, criteria active va weight 100.
7. Revalidate preset keys/versions.
8. Tao immutable snapshot.
9. Tao employee placements hoac unresolved queue.
10. Tao KPI set version moi cho moi position; khong ghi de v1.
11. Publish map va supersede map cu theo effective-date policy.
12. Ghi approval log.
13. Neu mot buoc fail, rollback toan bo.

Frontend production phai goi RPC/repository thuc, khong chi doi local status roi hien toast thanh cong.

### C6. SQL tests

Neu local Supabase/Docker san sang:

```powershell
supabase status
supabase db reset
```

Sau do chay role matrix hoac SQL verification cho:

- HR thay draft, Employee khong thay;
- CEO publish pending, HR publish bi reject;
- Employee chi thay placement cua minh;
- Store Manager chi thay permitted store;
- cross-map edge bi reject;
- publish tao placement, KPI version va log;
- failure giua transaction khong de lai partial data.

Neu khong chay duoc, ghi `Supabase local: NOT RUN` va ly do. Unit mock tests khong duoc tinh la bang chung RLS/RPC dat.

### Verification Pass C

```powershell
node --experimental-strip-types --test src/lib/kpi/supabase-repository.test.ts src/lib/kpi/local-repository.test.ts src/lib/kpi/career-map-deployment-service.test.ts
npm run lint -- src/lib/kpi/supabase-repository.ts src/lib/kpi/supabase-repository.test.ts src/lib/kpi/career-map-deployment-service.ts
npx tsc --noEmit
```

---

## PASS D - PROMOTION HUB DUNG DATA VA DUNG SCOPE

### D1. Bo static DOSSIERS khoi runtime production

- Lay placement/promotion dossier tu repository/service hien co.
- Mock chi duoc dung trong demo adapter ro rang, khong dung lam fallback authorization.
- Map employee bang live employee ID va live position ID.

### D2. Scope an toan

- Employee: query/filter chi chinh employee ID cua user.
- Store Manager: chi permitted store IDs tu auth/assignment, khong fallback sang all.
- Area Manager: chi permitted region/stores neu role nay duoc ho tro.
- HR/CEO: toan chuoi.
- Neu mapping thieu: hien empty state, khong chon dossier cua nguoi khac.
- Server/repository/RLS enforce scope; UI filter chi la lop hien thi.

### D3. Empty states

Toi thieu:

- Chua co Career Map published.
- Nhan vien chua duoc placement.
- Chuc danh nhan vien khong map duoc node.
- Store Manager khong co store scope.
- Khong co ho so du dieu kien trong bo loc.

Moi empty state phai noi ro ai can xu ly va CTA an toan; khong hien data gia.

### Test bat buoc

```ts
it('returns only the logged-in employees dossier', () => {})
it('returns no dossier when the employee has no placement', () => {})
it('returns only dossiers in the store managers permitted stores', () => {})
it('returns an empty list instead of all dossiers when store scope is missing', () => {})
it('allows HR and CEO to view the chain scope', () => {})
```

### Verification Pass D

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/supabase-repository.test.ts
npm run lint -- src/app/kpi/promotion/page.tsx src/components/kpi/career-map src/lib/kpi
npx tsc --noEmit
```

---

## PASS E - UX CHECK, DOCUMENTATION VA FULL VERIFICATION

### E1. UX scenarios phai kiem tra

1. HR desktop mo buoc 2 voi live positions.
2. HR keo mot position moi vao map va thay profile F&B da co, weight 100.
3. HR noi edge va thay shared preset dung domain values.
4. HR khong Continue/Submit khi map co blocking issue.
5. HR submit thanh cong; khong thay nut Publish.
6. CEO mo pending map, khong sua graph, chi Return/Publish.
7. CEO khong publish duoc ngay qua khu.
8. Employee chi thay career placement cua minh.
9. Store Manager chi thay nhan vien trong store duoc phep.
10. Mobile pan/zoom/view duoc nhung khong thay doi graph.

Neu khong the test browser, ghi `Browser role/mobile test: NOT RUN`; khong mo ta da test.

### E2. Tai lieu

- Cap nhat `docs/CODEMAP.md` neu tao file/repository/service/test/route moi.
- Them `docs/KNOWN_ISSUES.md` chi cho bug moi thuc su da fix.
- Cap nhat implementation plan bang `[x]` chi cho item co bang chung.
- Cap nhat `docs/KPI_RLS_TEST_MATRIX.md` bang ket qua thuc te, khong dien gia.

### E3. Full verification bat buoc

```powershell
node --experimental-strip-types --test src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/local-repository.test.ts src/lib/kpi/supabase-repository.test.ts src/lib/kpi/program-service.test.ts src/lib/kpi/fnb-template-catalog.test.ts
npm run lint -- src/app/kpi/settings/page.tsx src/app/kpi/promotion/page.tsx src/components/kpi/career-map src/components/kpi/program/KPIProgramScopeStep.tsx src/components/kpi/program/KPIAdvancedSettingsPanel.tsx src/lib/kpi
npx tsc --noEmit
npm run build
npm run ai:ready
git diff --check
git status --short
git diff --stat
```

Bao cao exit code cua tung lenh.

- Neu build fail vi Google Fonts/network, ghi `BUILD FAIL - ENVIRONMENT` kem error chinh xac; khong ghi pass.
- Neu `ai:ready` fail do mojibake employee files ngoai task, ghi fail va danh sach file; khong sua mo rong neu khong can.
- `git diff --check` phai phan biet loi moi trong file Career Map voi loi co san ngoai scope.

---

## EXPECTED FILE SCOPE

### Du kien sua

- `src/app/kpi/settings/page.tsx`
- `src/app/kpi/promotion/page.tsx`
- `src/components/kpi/career-map/*`
- `src/components/kpi/program/KPIProgramScopeStep.tsx`
- `src/components/kpi/program/KPIAdvancedSettingsPanel.tsx`
- `src/lib/kpi/career-map-types.ts`
- `src/lib/kpi/career-map-service.ts`
- `src/lib/kpi/career-map-criteria-service.ts`
- `src/lib/kpi/career-map-deployment-service.ts`
- `src/lib/kpi/local-repository.ts`
- `src/lib/kpi/supabase-repository.ts`
- cac test tuong ung trong `src/lib/kpi/`
- `supabase/migrations/20260824_kpi_career_map.sql`
- `supabase/migrations/20260824_kpi_career_map_rls.sql`
- `supabase/seed_kpi_career_map_demo.sql`
- `docs/KPI_RLS_TEST_MATRIX.md`
- `docs/CODEMAP.md`
- `docs/KNOWN_ISSUES.md`
- implementation plan Career Map.

### Co the tao them neu that su can

- Focused Career Map repository.
- Pure selection/scoping/mobile policy service va test.
- Migration moi de sua schema da ton tai, thay vi rewrite migration cu neu project da ap dung migration.

Moi file moi phai duoc them vao CODEMAP.

### Khong duoc sua

- Module payroll, attendance, scheduling, contracts.
- Global design system, app shell, font configuration.
- Cac API/adapter khong lien quan truc tiep.
- Dependency/package neu khong co ly do bat buoc va duoc bao cao.

---

## ROLLBACK PLAN

- Truoc migration, ghi ro schema hien tai va migration moi co the rollback nhu the nao.
- Khong xoa bang/cot co du lieu bang migration destructive.
- Neu chuyen ID strategy, phai co migration/backfill an toan cho row demo hien co.
- Neu publish RPC moi fail verification, khong de frontend goi nua; giu feature o draft-only va bao blocker.
- Published Career Map/KPI snapshots cu phai bat bien.
- Khong reset localStorage hoac Supabase data cua nguoi dung de lam test xanh.

---

## DONE CRITERIA - KHONG DUOC TU DANH DAU NEU CHUA CO BANG CHUNG

- [ ] Buoc 2 chi co Career Map trong main flow; mot chang rieng nam trong Advanced Settings.
- [ ] Active draft dung live Homies position IDs, names va levels.
- [ ] Khong dung fake seed khi live master data ton tai.
- [ ] Them node tao profile that, criteria active va weight 100 trong mot atomic update.
- [ ] Test profile assert profile object/criteria/weight, khong chi assert ID.
- [ ] Continue, Submit va Publish cung dung full validation context bat buoc.
- [ ] Chi HR Admin submit; chi CEO return/publish.
- [ ] Past effective date bi reject.
- [ ] Management convergence duoc validate.
- [ ] Preset co mot nguon su that va Admin sua mot lan cho moi matching edge.
- [ ] Inspector/ReadOnly khong hard-code business preset values.
- [ ] Mobile khong drop/drag/connect/delete graph.
- [ ] Supabase schema va runtime ID strategy tuong thich.
- [ ] Repository round-trip presets, placements va approval logs.
- [ ] Deletion cua node/edge/item duoc dong bo xuong Supabase dung scope.
- [ ] Draft criteria/preset khong lo cho Employee/Store Manager.
- [ ] Approval logs chi HR/CEO doc.
- [ ] Cross-map edge bi database reject.
- [ ] Publish RPC atomic tao snapshot, placements, KPI version va log.
- [ ] Promotion Hub khong fallback sang dossier cua nguoi khac hoac toan chuoi.
- [ ] Employee va Store Manager dung scope tai UI, service/repository va RLS.
- [ ] Tat ca regression tests bat buoc ton tai va dat.
- [ ] Supabase/browser test duoc ghi PASS hoac NOT RUN trung thuc.
- [ ] Lint va TypeScript dat.
- [ ] Build, AI ready va diff check duoc bao cao dung output thuc.

---

## BAO CAO CUOI BAT BUOC CUA ANTIGRAVITY

Bao cao theo dung cau truc, khong viet chung chung:

1. **Pass 0-E:** moi pass da sua gi, file/hàm nao.
2. **Audit mapping:** tung current failure 1-10 duoc fix tai dau.
3. **Regression tests:** test nao RED truoc, GREEN sau.
4. **Database:** migration/ID strategy da chon va ly do.
5. **Supabase:** local da chay that hay `NOT RUN`; ket qua RLS/RPC matrix.
6. **Role scenarios:** HR, CEO, Employee, Store Manager da test the nao.
7. **Mobile/Desktop:** scenario nao da test that, scenario nao chua.
8. **Verification:** command, exit code, pass/fail va loi chinh xac.
9. **Files changed:** danh sach file va `git diff --stat`.
10. **Residual risks:** moi rui ro con lai; khong ghi `none` neu con NOT RUN.
11. **No commit:** dung lai o worktree, khong commit/stage/push.

Khong tu tuyen bo `100% complete`, `spec dat` hoac `ready for production`. Sau khi hoan tat, giao report va diff de Codex review doc lap vong cuoi.

## NEXT EXACT STEP SAU KHI ANTIGRAVITY HOAN TAT

Codex chay lai audit doc lap, full verification, kiem tra SQL/RLS va test role scope. Chi khi khong con finding nghiem trong/trung binh moi de xuat nghiem thu Career Map.
