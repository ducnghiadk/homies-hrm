# TO_CODE

## STATUS
`REVIEWING`

## TASK
`TASK-KPI-MULTISKILL-CAREER-GRADE-01`

## CURRENT ASK
Triển khai toàn bộ lộ trình cấp bậc và kỹ năng Homies từ Pass A đến Pass E theo spec và implementation plan đã duyệt.

## GOAL
Admin tạo toàn bộ Career Map Homies trong một lần với mô hình C1-PC/C1-TN hội tụ C2, sau đó C3 Senior → C4 Trưởng ca → C5 Quản lý cửa hàng, đầy đủ tiêu chí, placement và migration.

## IN SCOPE
`src/lib/kpi/career-grade-types.ts`
`src/lib/kpi/career-grade-catalog.ts`
`src/lib/kpi/career-map-types.ts`
`src/lib/kpi/career-map-criteria-service.ts`
`src/lib/kpi/career-map-service.ts`
`src/lib/kpi/repository.ts`
`src/lib/kpi/supabase-repository.ts`
`src/lib/kpi/career-grade-placement-service.ts`
`src/lib/kpi/career-grade-migration-service.ts`
`src/lib/kpi/development-service.ts`
`src/components/kpi/career-map/KPICareerMapNode.tsx`
`docs/CODEMAP.md`

## OUT OF SCOPE
Không thay đổi kiến trúc bảng lương, không sửa logic ngoài KPI / Career Map.

## DONE WHEN
Hoàn tất Pass A đến Pass E, mọi test KPI, TypeScript và ai:ready đều pass.

---

## EXECUTION REQUEST

**Goal:** Triển khai lộ trình cấp bậc Nhân viên đa năng Homies: C1-PC/C1-TN hội tụ C2, sau đó C3 Senior → C4 Trưởng ca → C5 Quản lý cửa hàng.

**Vai trò của AI Code:** Thực thi đúng spec và implementation plan đã duyệt. Không tự thiết kế lại nghiệp vụ. Không làm lại các phần ngoài scope.

**Tài liệu bắt buộc phải đọc trước khi sửa:**

1. docs/superpowers/specs/2026-08-25-kpi-homies-multiskill-career-grade-design.md
2. docs/superpowers/plans/2026-08-25-kpi-homies-multiskill-career-grade-implementation-plan.md
3. docs/CODEMAP.md
4. docs/TOKEN_PLAYBOOK.md
5. docs/KNOWN_ISSUES.md
6. DESIGN_RULE_HOMIES_FINAL.md
7. AGENTS.md

Không đọc lan toàn repo. Dùng CODEMAP và phạm vi file trong plan.

---

## RPM CONTEXT

### RESULT

- Admin tạo toàn bộ Career Map Homies trong một lần.
- Sơ đồ chính xác: C1-PC/C1-TN → C2 → C3 → C4 → C5.
- Mỗi grade có bộ tiêu chí hợp lệ, tổng trọng số 100%.
- Nhân viên được xếp theo quyết định grade và chứng nhận kỹ năng.
- Thử việc/chính thức và Part-time/Full-time không làm thay đổi cấp bậc.
- Đủ điều kiện chỉ đưa vào hàng chờ xét, không tự tăng bậc hoặc đổi lương.

### HARD RESULT

- Người xem demo hiểu lộ trình trong tối đa 60 giây.
- Admin thiết lập lần đầu trong tối đa 5 phút.
- Flow chính: Dùng lộ trình chuẩn Homies → Kiểm tra → Gửi duyệt.
- Không bắt Admin tạo tiêu chí hoặc từng chặng từ form trống.

### PURPOSE

Phản ánh đúng vận hành Homies, giảm thời gian học, tăng khả năng chốt mua khi demo và giữ so sánh KPI công bằng toàn chuỗi.

### FMA

Nếu làm sai có thể xếp nhầm cấp nhân viên, xét thăng tiến/lương sai, làm mất lịch sử KPI, trộn thử việc với thăng tiến hoặc khiến Admin bỏ tính năng.

---

## CURRENT ROOT CAUSE

Hệ thống hiện có ba logic level không thống nhất:

- Master Data dùng Nhân viên Level 1, Trưởng ca Level 2, Quản lý Level 3.
- Career Map seed cũ dùng nhiều nghề riêng và Trưởng ca/Quản lý ở level khác.
- career-map-service suy luận C1-C6 từ tên chức danh, kể cả thử việc/chính thức.

Criteria profile đang chủ yếu gắn theo position_id. Homies có C1-PC, C1-TN, C2 và C3 cùng một chức danh Nhân viên cửa hàng, nên position_id không đủ để phân biệt node/profile. Unique constraint hiện tại cũng không cho hai node cùng position trong một map.

Đây là FIX CONFIRMED ROOT CAUSE. Không quay lại mô hình Pha chế/Thu ngân như chức danh độc lập.

---

## BUSINESS RULES ĐÃ DUYỆT

1. Chức danh vận hành: Nhân viên cửa hàng, Trưởng ca, Quản lý cửa hàng.
2. Cấp năng lực: C1-PC, C1-TN, C2 đa năng, C3 Senior, C4 Trưởng ca, C5 Quản lý cửa hàng.
3. Thử việc/chính thức là contract status, không phải grade.
4. Part-time/Full-time là employment type, không phải grade.
5. Nhân viên thử việc đã có thể là C1-PC hoặc C1-TN.
6. Đạt thử việc không tự tăng C2.
7. Có hai chứng nhận skill không tự tăng C2; chỉ hiển thị Đủ điều kiện xét.
8. Không tự tăng bậc, đổi lương, hạ bậc hoặc publish.
9. Admin trụ sở cấu hình điều kiện; phần mềm cung cấp preset F&B.
10. Cửa hàng không sửa tiêu chí, trọng số, đường nối hoặc điều kiện.

---

## BLUEPRINT BẮT BUỘC

Thực hiện tuần tự toàn bộ implementation plan từ Pass A đến Pass E. Mỗi pass dưới 60k token. Sau mỗi pass, tự cập nhật checkbox, ghi checkpoint nội bộ và chuyển ngay sang pass tiếp theo; không dừng chờ user hoặc AI Plan review. Chỉ dừng khi có blocker thật, cần mở rộng file ngoài scope, xuất hiện rủi ro YELLOW/RED mới, hoặc có nguy cơ ghi dữ liệu remote/mất dữ liệu.

## FULL EXECUTION MODE

- Mục tiêu của lần chạy này là hoàn thành toàn bộ Pass A → B → C → D → E rồi mới bàn giao để AI Plan review một lần.
- Không gửi yêu cầu duyệt trung gian sau Pass A/B/C/D nếu verification của pass đang xanh.
- Nếu môi trường tự chia thành nhiều turn, tiếp tục tự động trong cùng task từ checkpoint gần nhất.
- Vẫn phải chạy test và ghi checkpoint sau từng pass; không dồn toàn bộ verification đến cuối.
- Báo cáo cho người dùng khi hoàn tất toàn bộ, hoặc báo sớm duy nhất khi bị BLOCKED theo điều kiện trên.

### PASS A — DOMAIN VÀ CAREER MAP

- Task 1: CareerGradeCode, skill types và Homies catalog.
- Task 2: Career Map node/profile grade-aware.
- Task 3: Seed C1-PC/C1-TN/C2/C3/C4/C5 và criteria profile riêng.

**Pass A done khi:** catalog đúng sáu grade; hai C1 cùng position và hội tụ C2; không suy luận grade từ tên/probation; profile đủ 100%; test và TypeScript pass.

### PASS B — PERSISTENCE VÀ POSTGRES

- Task 4: KpiDatabase/localStorage collections mới.
- Task 5: SQL schema + RLS contract.
- Task 6: Supabase gateway round-trip và Postgres local runtime.

**Constraints:** chỉ Docker Postgres local; cấm remote, DROP, TRUNCATE, reset; migration idempotent; row mơ hồ giữ unresolved.

### PASS C — PLACEMENT, MIGRATION, ELIGIBILITY

- Task 7: Placement dựa vào decision/certification.
- Task 8: Dry-run migration có checksum.
- Task 9: Eligibility dùng transition rule của Admin.
- Task 9B: Program Setup dùng grade transition, cho phép C1→C2 và C2→C3 cùng position.

**Pass C done khi:** hai skill không tự tăng C2; thiếu evidence tạo unresolved; C4→C5 hợp lệ; same-position grade transition hợp lệ; integration tests pass.

### PASS D — ADMIN UX

- Task 10: Dùng lộ trình chuẩn Homies và CTA sửa lỗi.
- Task 11: Settings flow + migration review.

**Pass D done khi:** một click tạo 6 node/5 edge/6 profile; flow Dùng mẫu → Kiểm tra → Gửi duyệt; kéo thả trong Nâng cao; UI tiếng Việt có dấu.

### PASS E — EMPLOYEE/PROMOTION/MASTER DATA

- Task 12: ReadOnly map và Promotion Hub theo grade.
- Task 13: Master Data ba chức danh chuẩn.
- Task 14: CODEMAP, KNOWN_ISSUES và verification cuối.

**Pass E done khi:** highlight bằng grade_code; Promotion Hub dùng dữ liệu thật; tenant cũ không bị ghi đè; tests/lint/tsc/build/ai:ready pass; không có route chết/action giả.

---

## EXPECTED FILE SCOPE

Chỉ sửa/tạo file được liệt kê trong implementation plan, thuộc các nhóm:

- src/lib/kpi/career-grade-*
- src/lib/kpi/career-map-*
- src/lib/kpi/repository.ts
- src/lib/kpi/local-repository*
- src/lib/kpi/supabase-repository*
- src/lib/kpi/seed.ts
- src/lib/kpi/types.ts
- src/lib/kpi/program-service*
- src/lib/kpi/development-service*
- src/lib/kpi/migration-service.ts
- src/components/kpi/career-map/*
- src/components/kpi/program/KPIProgramScopeStep.tsx
- src/app/kpi/settings/page.tsx
- src/app/kpi/settings/migration/page.tsx
- src/app/kpi/promotion/page.tsx
- src/lib/adapters/master-data-adapter*
- src/app/settings/master-data/page.tsx
- supabase/migrations/20260825_kpi_multiskill_career_grade*.sql
- docs/CODEMAP.md
- docs/KNOWN_ISSUES.md
- implementation plan và docs/TO_CODE.md

Nếu cần file ngoài danh sách, dừng và báo AI Plan.

---

## MUST PRESERVE

- KPI evaluation và score snapshot cũ.
- Published Career Map hiện tại đến ngày hiệu lực bản mới.
- Một aggregate save cho mỗi thao tác map.
- Workflow HR draft → pending approval → authorized publish.
- Phân quyền theo tổ chức/cửa hàng.
- Audit log và lịch sử quyết định.
- LocalStorage fallback và Supabase gateway.
- Mọi thay đổi có sẵn của người dùng trong dirty worktree.

## MUST NOT DO

- Không revert/reset/rename/refactor ngoài scope.
- Không xóa position/data cũ ngay.
- Không đổi mã nhân viên.
- Không hard-code employee/store IDs.
- Không dùng position name làm nguồn grade chính.
- Không tự tạo C2-C5 từ suy đoán.
- Không publish hoặc apply migration remote.
- Không bỏ qua failing test trước implementation.
- Không commit file ngoài task.
- Không ghi PASS khi chưa chạy lại verification.

---

## EXECUTION METHOD

1. TDD từng task: failing test → xác nhận fail đúng lý do → implementation tối thiểu → test pass → lint/typecheck scope → commit riêng nếu Git cho phép.
2. Tick checkbox đúng trong implementation plan sau khi thực sự hoàn thành.
3. Sau mỗi pass đọc diff đúng file pass, kiểm tra scope, cập nhật checkpoint nội bộ rồi tiếp tục ngay pass sau.
4. GREEN bug bắt buộc cho pass: thêm test và fix trong scope.
5. YELLOW/RED hoặc ngoài scope: không sửa, ghi blocker và dừng.

---

## DONE CRITERIA

- [ ] Task 1-14 và Task 9B hoàn thành.
- [ ] C1-PC/C1-TN cùng position, hội tụ C2.
- [ ] C2-C3 same-position transition hợp lệ.
- [ ] C5 là target thật.
- [ ] Không trộn probation/PT-FT với grade.
- [ ] Không tự tăng bậc/lương.
- [ ] Migration preview/checksum hoạt động.
- [ ] RLS fail-closed và Postgres local idempotent.
- [ ] Một click tạo toàn bộ map/profile/rule.
- [ ] Promotion Hub và Master Data dùng mô hình mới.
- [ ] KPI tests, ESLint scope, TypeScript, build pass.
- [ ] ai:ready pass hoặc blocker ngoài scope được ghi rõ.
- [ ] CODEMAP và KNOWN_ISSUES cập nhật.
- [ ] Không có thay đổi ngoài scope trong commit.

---

## VERIFY

Dùng lệnh chính xác trong từng task của implementation plan.

Verification cuối tối thiểu:

~~~powershell
node --experimental-strip-types --test src/lib/kpi/career-grade-catalog.test.ts src/lib/kpi/career-grade-placement-service.test.ts src/lib/kpi/career-grade-migration-service.test.ts src/lib/kpi/career-map-service.test.ts src/lib/kpi/career-map-criteria-service.test.ts src/lib/kpi/career-map-deployment-service.test.ts src/lib/kpi/career-map-sql-contract.test.ts src/lib/kpi/local-repository.test.ts src/lib/kpi/supabase-repository.test.ts src/lib/kpi/development-service.test.ts src/lib/kpi/program-service.test.ts src/lib/kpi/monthly-review-integration.test.ts
npx tsc --noEmit
npm run build
npm run ai:ready
~~~

Lint đúng danh sách file Task 14; không lint toàn repo mặc định.

Browser/demo check:

- /kpi/settings
- /kpi/settings/migration
- /kpi/promotion
- /settings/master-data

Kiểm tra desktop/mobile và không render CTA dẫn route chết.

---

## STATUS MANAGEMENT

Khi bắt đầu: STATUS: IN_PROGRESS

Khi code và tự test xong: STATUS: REVIEWING

Chỉ AI Plan/user chuyển: STATUS: DONE

Nếu bị chặn: STATUS: BLOCKED và ghi rõ pass/task, lệnh, output quan trọng, đề xuất.

---

## CHECKPOINT NỘI BỘ SAU MỖI PASS

Phần này phải được cập nhật để giữ dấu vết, nhưng không dùng làm lý do dừng hoặc chờ review trung gian khi pass đang xanh.

### PASS HIỆN TẠI

- Pass/Task: Correction Pass F sau review độc lập Pass A-E
- Trạng thái: PASS phần code; BLOCKED phần runtime Postgres/browser
- File đã sửa: career grade catalog/placement/migration, career map service + tray/canvas/designer/validation, migration UI, Master Data seed/UI, migration SQL/RLS, tests và docs
- Test đã viết: regression preset, placement fail-closed, migration HR confirmation/checksum, same-position grade nodes, SQL/RLS contract, UI contract
- Lệnh đã chạy: KPI tests, scoped ESLint, TypeScript, production build, ai:ready, Docker info
- Kết quả chính: 269/269 KPI tests pass; ESLint pass; TypeScript pass; build 143/143 routes pass
- Postgres runtime: blocked do môi trường từ chối quyền truy cập Docker API; chưa áp migration thật
- File ngoài scope: không sửa thêm ngoài correction scope và docs bắt buộc
- Điểm còn thiếu: ai:ready còn fail vì mojibake ở module employees ngoài KPI; browser localhost bị policy chặn; Postgres runtime chưa chạy
- Commit: chưa tạo
- Next exact step: chạy migration 20260825 hai lần trên Docker Postgres local và demo desktop/mobile sau khi quyền runtime được mở

### BÁO CÁO CUỐI

- Tổng task hoàn thành: đã sửa toàn bộ finding P1/P2 của review độc lập; các bước commit/runtime vẫn để mở
- Tổng test PASS: 269/269 KPI tests
- Lint: pass phạm vi Correction Pass F
- TypeScript: pass (`tsc --noEmit`)
- Build: pass, 143/143 routes
- ai:ready: fail do mojibake tại module employees ngoài phạm vi KPI
- Postgres runtime: blocked do Docker API không được cấp quyền
- Browser desktop/mobile: blocked do công cụ browser từ chối điều hướng localhost
- Migration preview: pass contract; row mơ hồ giữ `needs_confirmation`, có dropdown HR và checksum, chưa ghi DB
- Rủi ro còn lại: cần xác nhận migration idempotent/RLS trên Postgres thật và kiểm tra giao diện responsive thực tế
- Có sẵn sàng demo/pilot không: sẵn sàng demo code/local build; chưa chốt pilot backend thật trước khi runtime verification pass
- Danh sách commit: chưa tạo
- Next exact step: mở quyền Docker local, chạy migration hai lần rồi kiểm tra `/kpi/settings`, `/kpi/settings/migration`, `/kpi/promotion`, `/settings/master-data`
