# CODEMAP

Muc tieu: vao dung diem sua, giam doc full file, giam token.

## App Shell va dieu huong
### Khung ung dung
- Mo ta: layout goc, toaster, error boundary, shell va dieu huong day.
- File chinh: `src/app/layout.tsx`, `src/components/layout/AppShell.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/layout/Header.tsx`, `src/lib/navigation/sidebar-config.ts`
- Dung khi: sua khung chung, dieu huong, bao ve trai nghiem toan app

### Xac thuc demo va role
- Mo ta: dang nhap mock, user hien tai, role label, nho phien dang nhap.
- File chinh: `src/store/auth-store.ts`, `src/components/auth/ProtectedRoute.tsx`, `src/components/auth/RoleGuard.tsx`
- Dung khi: sua login, role, quyen nhin du lieu, tai khoan demo

## Dashboard
### Trang chu theo role
- Mo ta: route `/` chon dashboard theo role nhan vien, quan ly, admin.
- File chinh: `src/app/page.tsx`
- Component employee: `src/components/dashboard/EmployeeDashboardPremium.tsx`
- Component manager: `src/components/dashboard/ManagerDashboardPremium.tsx`
- Component admin: `src/components/dashboard/AdminDashboardPremium.tsx`
- Shared premium components: `src/components/dashboard/premium/`
- Service layer: `src/lib/services/dashboard-service.ts`
- Dung khi: sua man hinh sau dang nhap, phan nhanh theo vai tro, quick actions, stat cards

## Nhan su va tuyen noi bo
### Danh sach nhan vien va ho so
- Mo ta: xem danh sach nhan vien, chi tiet ho so, phan quyen theo store va role.
- File chinh: `src/app/employees/page.tsx`, `src/app/employees/[id]/page.tsx`, `src/app/employees/new/page.tsx`, `src/app/employees/import/page.tsx`, `src/app/employees/export/page.tsx`, `src/lib/services/employee-service.ts`, `src/lib/services/employee-excel-service.ts`
- Dung khi: sua thong tin nhan vien, filter, profile, visibility

### Loi moi ung vien noi bo
- Mo ta: tao loi moi, email preview, form ung vien tu dien, duyet ho so.
- File chinh: `src/app/employees/invitations/page.tsx`, `src/app/employees/invitations/new/page.tsx`, `src/app/employees/invitations/form/page.tsx`, `src/lib/mock-data-employee-ext.ts`, `src/lib/services/employee-service.ts`
- Dung khi: sua flow moi nhan su, trang thai invitation, checklist duyet

### Hop dong nhan su va ky tren app
- Mo ta: thu vien template hop dong, tao contract tu ho so nhan su, quet placeholder `{{group.field}}`, preview web co highlight field, checklist chan gui ky, gui nhan su ky tren app, HR countersign va luu audit/version.
- File chinh: `src/app/employees/contracts/page.tsx`, `src/app/employees/contracts/[id]/page.tsx`, `src/app/employees/contracts/_components.tsx`, `src/lib/services/contract-service.ts`, `src/lib/services/contract-service-data.ts`, `src/lib/services/contract-template-placeholder.ts`, `src/lib/navigation/sidebar-config.ts`, `src/app/more/page.tsx`
- Dung khi: sua template hop dong, flow ky hop dong, trang thai contract, audit log, placeholder tu dong, panel field va checklist preview

## Scheduling
### Lich ca nhan
- Mo ta: nhan vien xem lich tuan, ca hom nay, tha ca, dieu huong qua open shifts va swap.
- File chinh: `src/app/schedule/page.tsx`, `src/app/my-schedule/page.tsx`, `src/lib/services/schedule-service.ts`, `src/lib/mock-data.ts`
- Dung khi: sua lich ca nhan, publish state, card ca lam

### Bang phan ca va quan tri lich
- Mo ta: flow chinh cho quan ly la board tuan theo demand -> assignment -> publish.
- File chinh: `src/app/schedules/page.tsx`, `src/app/settings/schedule-rules/shifts/page.tsx`, `src/app/settings/schedule-rules/page.tsx`, `src/components/layout/AppShell.tsx`, `src/app/more/page.tsx`, `src/lib/services/schedule-service.ts`
- Dung khi: sua dieu huong xep lich, board tuan, setting ca, quy tac xep ca, nhu cau tuan, assignment, publish

### Rule lich va staffing
- Mo ta: cau hinh shift template, preference, staffing calculator, toi uu nhan su.
- File chinh: `src/app/settings/schedule-rules/**/*`, `src/app/staffing/page.tsx`, `src/components/staffing/*`, `src/lib/staffing/*`, `src/lib/mock-data-settings.ts`
- Dung khi: sua dinh muc ca, nhu cau tuan, cong cu tinh nhan su

## Attendance va check-in
### Cham cong
- Mo ta: route cham cong theo ngay, chi nhanh, thiet bi, tang ca, canh bao.
- File chinh: `src/app/attendance/**/*`, `src/app/checkin/page.tsx`, `src/components/checkin/*`, `src/lib/services/attendance-service.ts`, `src/lib/offline-checkin.ts`
- Dung khi: sua flow cham cong, map, wifi, offline

## KPI va danh gia
### KPI, vi pham, xet duyet
- Mo ta: score, review, leaderboard, settings, reports, violations va appeal.
- File chinh: `src/app/kpi/**/*`, `src/components/kpi/*`, `src/lib/kpi-*.ts`, `src/lib/violation-service.ts`
- Dung khi: sua KPI engine, bieu mau danh gia, canh bao vi pham

## Payroll va leave
### Luong, nghi phep, yeu cau
- Mo ta: route payroll, leave request/approval/calendar va cac yeu cau lien quan.
- File chinh: `src/app/payroll/**/*`, `src/app/settings/payroll/page.tsx`, `src/app/leave/**/*`, `src/app/requests/page.tsx`, `src/lib/payroll-engine.ts`, `src/lib/services/payroll-policy-service.ts`, `src/lib/quota-service.ts`
- Dung khi: sua phep, bang luong, quota, quy trinh phe duyet

## Notifications, offline va tich hop nen
### Thong bao va nen tang offline
- Mo ta: notification center, sync offline, network status, PWA.
- File chinh: `src/hooks/useOfflineSync.ts`, `src/hooks/useNotifications.ts`, `src/hooks/useNetworkStatus.ts`, `src/lib/notifications/*`, `src/lib/offline-store.ts`, `next.config.ts`, `public/manifest.json`
- Dung khi: sua trang thai offline, push/local notifications, PWA

## Du lieu nen va backend tuong lai
### Mock data, service va Supabase
- Mo ta: mock data lon cho MVP, service layer phia client, script schema/seed/RLS.
- File chinh: `src/lib/mock-data*.ts`, `src/lib/services/*`, `src/lib/supabase.ts`, `supabase/*.sql`
- Dung khi: truy vet du lieu nguon, chuan bi chuyen dan tu mock sang backend that

## Tai lieu dieu phoi hien co
### File uu tien doc truoc khi lam task lon
- Mo ta: file dieu phoi task, spec scheduling, checklist stage, PRD/ADR.
- File chinh: `docs/TO_CODE.md`, `docs/TO_CODE_PARALLEL_B.md`, `docs/STAGE2_SCHEDULING_FLOW_SPEC.md`, `docs/STAGE1_STATUS_CHECKLIST.md`, `docs/HRM_HIRING_TO_EMPLOYEE_FLOW.md`, `genesis/**/*`
- Dung khi: can hieu dung scope business truoc khi sua code

### Tai lieu flow co anh
- Mo ta: huong dan flow nhan su tu dau phong van den thanh nhan vien, co screenshot de training noi bo.
- File chinh: `docs/HRM_HIRING_TO_EMPLOYEE_FLOW.md`, `docs/assets/hrm-hiring-flow/*`
- Dung khi: can huong dan nguoi van hanh bam tung man hinh theo dung flow

### Noi quy nhan viec va onboarding
- Mo ta: flow gui noi quy 2 nhip, setting toi thieu, xac nhan cua nhan vien, nhac day-1, va workspace onboard van hanh do quan ly cua hang cam chinh.
- File chinh: `src/lib/services/onboarding-policy-service.ts`, `src/lib/services/onboarding-operations-service.ts`, `src/app/career-path/settings/page.tsx`, `src/app/career-path/onboarding/page.tsx`, `src/components/onboarding-operations/*`, `src/app/employees/contracts/[id]/page.tsx`, `src/app/employees/[id]/page.tsx`, `src/app/onboarding/page.tsx`
- Dung khi: sua moc gui noi quy, nhac lai, xac nhan nhan vien, checklist onboarding ngay dau, rule block/can hoan tat som, danh sach nguoi sap vao lam, va checklist chi tiet theo tung nguoi

### Spec flow va quyet dinh moi
- Mo ta: cac spec nho de chot flow nghiep vu truoc khi code, nhu flow noi quy nhan viec, setting toi thieu, va cac quyet dinh scope tuong tu.
- File chinh: `docs/superpowers/specs/*`, `docs/superpowers/specs/2026-05-25-noi-quy-onboarding-flow-design.md`, `docs/superpowers/specs/2026-05-27-setting-shortcut-full-web-backlog.md`
- Dung khi: can xem lai quyet dinh da chot voi user truoc khi viet plan hoac sua UI/service

### Backlog map icon rang cua toan web
- Mo ta: map man hinh nao nen co icon rang cua, dat o dau, va nhay toi route setting nao de rollout theo tung pass.
- File chinh: `docs/superpowers/specs/2026-05-27-setting-shortcut-full-web-backlog.md`
- Dung khi: can mo lai backlog shortcut setting, uu tien rollout, hoac doi chieu route setting truoc khi code UI

### Plan trien khai chi tiet
- Mo ta: implementation plan chia task nho de code theo tung cum, bao gom file map, verify va commit checkpoint.
- File chinh: `docs/superpowers/plans/*`, `docs/superpowers/plans/2026-05-25-noi-quy-onboarding-flow-plan.md`
- Dung khi: da duyet spec va can bat dau code theo tung task co thu tu ro rang

## Script tien ich cuc bo
### Mo nhanh va restart dev server
- Mo ta: script Windows giup mo nhanh hoac restart rieng app HRM local.
- File chinh: `open-hrm.bat`, `restart-hrm-dev.bat`
- Dung khi: can mo app local hoac restart dev server dung cong `3333` ma khong dung toi cong khac

## Read Order De Xuat
1. `rg` tim symbol
2. Doc 50-150 dong quanh ham can sua
3. Sua 1 cum nho
4. Verify
5. Cap nhat CODEMAP neu them file moi
