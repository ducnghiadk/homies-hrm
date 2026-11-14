# CODEMAP

Muc tieu: vao dung diem sua, giam doc full file, giam token.

## App Shell va dieu huong
### Khung ung dung & Site Map Tinh Gon (18 Hubs)
- Mo ta: layout goc, toaster, error boundary, shell, BottomNav va Sidebar duoc tinh gon theo mo hinh 18 Hubs nghiep vu chuan SaaS F&B. Cac route cu/trung lap duoc tu dong chuyen huong qua `next.config.ts`.
- File chinh: `src/app/layout.tsx`, `src/components/layout/AppShell.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/layout/Header.tsx`, `src/hooks/useMounted.ts`, `src/lib/navigation/sidebar-config.ts`, `src/lib/navigation/sidebar-config.test.ts`, `next.config.ts`
- Dung khi: sua khung chung, dieu huong, bao ve trai nghiem toan app, them redirect hoac sua menu theo role, chong loi hydration SSR/client.
- Menu KPI desktop chi giu 5 diem vao da duyet: tong quan, viec can danh gia, ket qua, san sang tang bac va chuong trinh danh gia. BSC nam trong hub luong/thuong; su co nam trong hub van hanh; ky KPI, queue khieu nai va bao cao duoc mo tu man nghiep vu phu hop thay vi lap lai tren sidebar.

### Xac thuc demo va role
- Mo ta: dang nhap mock, user hien tai, role label, nho phien dang nhap.
- File chinh: `src/store/auth-store.ts`, `src/components/auth/ProtectedRoute.tsx`, `src/components/auth/RoleGuard.tsx`
- Dung khi: sua login, role, quyen nhin du lieu, tai khoan demo

## Backend REST API & Du lieu tap trung (Direct API Protocol)
### REST API Route Handlers & Server Database
- Mo ta: he thong REST API phuc vu bot tu dong va kiem thu ket noi truc tiep vao backend, luu tru du lieu tap trung phia server qua file `data/server-db.json`.
- File chinh:
  + `src/lib/security/token-signer.ts`: module ky va xac thuc chu ky so HMAC-SHA256 cho vai tro va session, ngan chan gia mao cookie tren trinh duyet.
  + `src/lib/server/auth-helper.ts`: module kiem tra va xac thuc phien dang nhap an toan phia server (token/cookie homies_session), ngan chan gia mao vai tro tu client.
  + `src/lib/server/db.ts`: module quan ly doc/ghi CSDL server, seed du lieu chuan cho 2 chi nhanh (HBP & 429), 14 nhan vien that (2 Full-time 6.6tr, 12 Part-time luong gio, 4 nhan su xoay ca 2 quan), 5 khung ca that Homies F&B, 447 ca T8 va 87 ca T9, bang luong quy 43.4 trieu va toa do GPS.
  + `src/app/api/auth/login/route.ts`: POST dang nhap, cap session token cho Bot dong vai (Nhan vien, Quan ly, CEO).
  + `src/app/api/stores/route.ts`: GET & POST quan ly danh sach co so, toa do GPS, ban kinh check-in va ma PIN bao mat cua tung quan.
  + `src/app/api/employees/route.ts`: GET & POST/PUT danh sach 14 nhan vien that va cap nhat ho so/muc luong gio.
  + `src/app/api/shifts/route.ts`: GET lich ca theo co so, theo thang (T8/T9), tra ve 5 khung ca that F&B (Sang, Trua, Toi, Cao diem trua, Don quay dem) va POST quan ly khung ca mau.
  + `src/app/api/schedule-rules/route.ts`: GET & POST quan ly bang quy tac xep ca F&B (dinh muc ngay 8.5h, OT tuan, thoi gian nghi giua 2 ca, clopening) va ngoai le theo vi tri tren CSDL may chu.
  + `src/app/api/master-data/route.ts`: GET & POST quan ly danh muc dung chung (phong ban, chuc vu, loai nghi phep) dong bo CSDL may chu.
  + `src/app/api/shifts/register/route.ts`: GET & POST dang ky ca ranh cua nhan vien (Mobile bundle gui len, ManagerSchedulingBoard va Trang phe duyet ca tai ve tu server).
  + `src/app/forgot-password/page.tsx`: trang Quen mat khau voi Hotline 1 phut 0919.246.273 va form gui yeu cau cap lai.
  + `src/app/api/shifts/approve/route.ts`: POST duyet ca lam viec (kiem tra quyen Store Manager / CEO).
  + `src/app/api/attendance/route.ts`: GET & POST lich su cham cong, loc theo chi nhanh, ngay, thang va nhan vien.
  + `src/app/api/attendance/checkin/route.ts`: POST cham cong ma QR + GPS doi soat ban kinh <= 100m (loai bo Wifi Simulator).
  + `src/app/api/attendance/qr-token/route.ts`: GET sinh ma QR dong doi token sau 30s het han 60s cho Kiosk/POS.
  + `src/app/api/requests/route.ts`: GET & POST danh sach don tu (nghi phep, doi ca, tam ung, giai trinh cham cong, ca hoc viec), tao don moi va phe duyet don.
  + `src/app/requests/page.tsx`: man hinh Quan ly Don tu & Giai trinh cham cong khac phuc loi iPOS (tabs Cho duyet kem badge do, Da duyet, Tu choi, bo loc loai don, nut Duyet/Tu choi 1-Click va Duyet Tat Ca).
  + `src/components/requests/CreateRequestModal.tsx`: modal tao don giai trinh cham cong & bo sung ca thong minh voi tag 1-tap ly do chuan F&B (Quen quet QR, Loi Wifi, Dien thoai het pin, Hoc viec...).
  + `src/app/api/reports/route.ts`: GET bao cao tong hop quy luong (40tr-45tr), gio cong, phan bo theo 3 co so that (HBP, 429, LVS) va tinh tu dong ty trong chi phi nhan su (28.6%).
  + `src/app/api/contracts/route.ts`: GET & POST danh sach va them moi hop dong lao dong luu CSDL server.
  + `src/app/api/contracts/[id]/route.ts`: GET & PUT chi tiet, cap nhat ky duyet (e-signature canvas), gia han va thanh ly hop dong.
  + `src/components/contracts/SignaturePadModal.tsx`: bang ve cam ung ngon tay ky dien tu tren dien thoai va may tinh.
  + `src/components/contracts/ContractPrintA4Modal.tsx`: xem truoc va in an hop dong A4 chuan phap ly luu tru thanh tra lao dong.
  + `src/app/api/payroll/route.ts`: GET xuat bang tinh luong chi tiet doi soat tung dong voi iPOS, quan ly cot late_deduction.
  + `src/app/api/kpi/incidents/route.ts`: GET & POST ho so vi pham ky luat cham cong va su co van hanh dong bo giua CSDL server va So loi KPI.
  + `src/app/payroll/lock/route.ts`: POST khoa so bang luong thang (chi CEO / HR Admin).
  + `src/app/checkin/kiosk/page.tsx`: man hinh Kiosk QR Code dong full-screen quay bar.
  + `src/app/stores/page.tsx`: quan ly danh sach 2 co so Homies (HBP & 429) kem toa do GPS va ban kinh.
  + `src/components/scheduling/MobileQuickAssignDrawer.tsx`: nut bam noi va modal gan ca nhanh 1-cham tren Mobile.
  + `scripts/seed_ipos_real_data.mjs`: script nap du lieu that iPOS vao server-db.json.
  + `src/app/my-payslip/page.tsx`: trang Phieu luong cua toi (xem chi tiet luong ca nhan, gio lam, don gia, tip va thuc nhan).
  + `src/app/my-requests/page.tsx`: dieu huong nhanh ve trang gui don tu (/requests).
  + `src/app/swap/page.tsx`: dieu huong nhanh ve trang doi ca (/schedule/swap).
  + `src/app/branches/page.tsx`: chuyen huong tu dong sang /stores (chong loi 404 the Trang chu).
  + `src/app/leave/approvals/page.tsx`: chuyen huong tu dong sang /leave/approval (chong loi 404 the Trang chu).
  + `src/app/tasks/page.tsx`: chuyen huong tu dong sang /tasks/daily (chong loi 404 the Trang chu).
  + `src/app/career-path/promotions/page.tsx`: chuyen huong tu dong sang /career-path (chong loi 404 the Trang chu).
  + `src/app/api/bsc/targets/route.ts`: GET & POST bang quyet toan va muc tieu doanh thu BSC, tu dong hoa Doanh thu POS va Hao hut kho IVT (Zero-Manual Input).
  + `src/app/api/bsc/settings/route.ts`: GET & POST quan ly toan bo cai dat safety settings, ma tran tieu chi, bac thuong va he so chuc danh BSC dong bo 100% CSDL may chu.
  + `src/app/api/bsc/logs/route.ts`: GET, POST, DELETE nhat ky loi van hanh va su co cua hang tren CSDL may chu.
  + `src/app/api/hermes/report-error/route.ts`: POST danh rieng cho bot Hermes (Telegram/Zalo) ghi loi van hanh/loi ca nhan vao so loi BSC; bat buoc ma HERMES_BOT_TOKEN, luon o trang thai cho CEO duyet (proposed_manager).
  + `src/app/api/bsc/approve/route.ts`: POST danh rieng cho CEO duyet & ban hanh BSC, tu dong khoa so va day tien thuong vao bang luong (/api/payroll).
  + `src/app/api/report/v2/dashboard/management/lost-chart/route.ts`: GET ty le % hao hut kho tu dong tu he thong kiem ke iPOS IVT.
  + `src/lib/services/ipos/ipos-cloud-client.ts`: module dich vu ket noi truc tiep REST API v2 iPOS HRM Cloud (https://hrm.ipos.vn/api/v2) cho Ca lam viec (/work-schedule/list), Cham cong (/timesheet/list) va Nhan vien (/employee/list), xac thuc Bearer & Cookie token, tu dong loc dung 17 nhan su dang hoat dong va co che Fallback an toan ve server-db.json.
  + `scripts/sync_ipos_active_17.mjs`: script dong bo truc tiep 17 nhan su thuc te (WORKING) va 138 ca lam viec thang 10/2026 tu hai co so Ho Ba Phan va Duong 429 vao data/server-db.json.
  + `src/lib/services/ipos/ipos-hrm-client.ts`: module dich vu dang nhap truc tiep may chu iPOS HRM (hrm.ipos.vn) tu backend Cloud Worker khong can Extension (xac thuc email/mat khau, lay thong tin nhan su, lich su quet van tay va bang luong chu ky).
  + `src/lib/services/ipos/ipos-fabi-client.ts`: module dich vu ket noi va dang nhap truc tiep web CMS iPOS FABi (posapi.ipos.vn) chuan ZaloCRM (Private Dashboard API, 0d phi API, tu dong lay JWT Token 7 ngay va doc doanh thu ban hang theo ca/ngay).
  + `src/lib/services/ipos/ipos-normalizer.ts`: bo phien dich va chuan hoa du lieu tu iPOS sang Homies HRM (mapping ma nhan vien, chi nhanh, quy doi gio cong, bang luong va cham cong).
  + `src/lib/services/ipos/ipos-schema-detector.ts`: bo ghi nhan cau truc truong thuc te tu hrm.ipos.vn (Schema Registry), tu dong doi soat phat hien truong thieu va sinh de xuat bo sung thong minh 1-cham.
  + `src/app/api/ipos/sync/route.ts`: cong tiep nhan REST API CORS, GET health check va POST dong bo du lieu tu Tien ich Chrome.
  + `src/app/api/ipos/cloud-worker/route.ts`: API REST quan tri Backend Worker, handshake Private Cloud API iPOS, tiep nhan chu ky thang dong bo (Thang 7, Thang 8, Thang 9...), tinh toan checksum doi soat an toan 100% va xu ly cac action schema.
  + `src/app/settings/integrations/ipos/page.tsx`: man hinh Quan tri Tich hop ben thu 3 & Cong iPOS Private Cloud (bo chon chu ky thang dong bo Zero-Touch, thanh kiem toan doi soat toan ven 100%, hen gio Worker 24/7 va doi soat schema).
  + `scripts/test_ipos_cloud_worker.mjs`: bo kiem thu tu dong Backend Worker dong bo ngam iPOS Private Cloud.
  + `scripts/test_ipos_schema_detector.mjs`: bo kiem thu tu dong Bo doi soat schema va ap dung de xuat 1-cham.
  + `extensions/homies-ipos-bridge/`: tien ich Chrome Manifest V3 tu dong bat goi tin ngam tu hrm.ipos.vn / fabi.ipos.vn (manifest.json, injected-hook.js, content.js, popup.html/js/css, icons, HUONG_DAN_CAI_DAT.md).
  + `src/app/bsc-bonus/page.tsx`: man hinh Bao cao diem & Phe duyet thuong BSC chuoi Homies, phan quyen ro ret giua CEO va Quan ly; tich hop bo chon ky dong theo thoi gian thuc (tu dong chon thang hien tai va rolling 12 thang gan nhat), bang phan bo thuong nhan vien realtime dua theo gio cong (>=110h), he so cap bac (QL 1.5, TC 1.2, FT 1.0, PT 0.8) va he so loi ca nhan ngay duoi form quyet toan.
  + `src/components/bsc-bonus/BSCTeamTable.tsx`: bang phan bo chi tiet tien thuong tung nhan vien, tinh toan theo cong thuc BSC chuan F&B kem xuat file CSV.
  + `src/components/bsc-bonus/BSCHandbookTab.tsx`: So tay nghiep vu va the le tinh thuong BSC truc quan, 3 chot chan mo quy, cong thuc diem nhan vien va case study tien that.
  + `src/components/bsc-bonus/BSCMonthlyInputForm.tsx`: form quyet toan thang tu dong dong bo iPOS, khoa sua doi voi Quan ly khi pending_ceo hoac da ban hanh.
  + `scripts/test-bsc-flow.mjs`: bo kiem thu tu dong 9 test cases nghiem thu toan bo luong BSC tu Quan ly gui duyet den CEO phe duyet va dong bo vao phieu luong.
  + `scripts/test-api-endpoints.mjs`: bo kiem thu tu dong 58 test cases toan dien dat 100% pass cho toan bo REST API, bao gom 4 bo loc logic cot tu: bat tre/ve som, de-bounce check-in 15 phut, chan dang ky trung ca va dong bo vi pham vao late_deduction.
  + `src/lib/scheduling/strict-shift-validator.ts`: Bo loc Strict Validator & 10 Khung ca chuan Homies F&B (ket thuc <= 22:00), loai bo 100% ca don quay dem (22:00 - 01:30) va ca linh dong (11:30 - 14:30), tu dong canh bao va loai khoi tong gio cong khi vuot moc 22:00.
  + `src/components/attendance/AttendanceQuickDrawer.tsx`: UI Drawer 1-cham truat tu ben phai xem chi tiet gio ke hoach, gio quet van tay/Wi-Fi thuc te, trang thai nguyen ban hay da chinh sua kem nguoi/ly do.
  + `src/components/payroll/PayrollHourlyRateDrawer.tsx`: UI Drawer 1-cham dieu chinh nhanh don gia luong theo gio (ap dung rieng thang do hoac luu vinh vien vao ho so nhan su qua PUT /api/employees).
  + `100% Direct API Protocol`: Toan bo cac man hinh trong yeu (/attendance, /payroll, /schedule, /checkin, /schedule/swap, /my-schedule, /bsc-bonus) da duoc chuyen doi 100% sang goi REST API truc tiep tu server (/api/attendance, /api/payroll, /api/shifts, /api/bsc/*), go bo hoan toan doc tu localStorage.
- Dung khi: sua doi endpoint REST API, logic xac thuc API, cau truc du lieu server-side, kiosk checkin, dang ky ca mobile, phieu luong ca nhan, quan ly BSC va quen mat khau.


## Dashboard
### Trang chu theo role
- Mo ta: route `/` chon dashboard theo role nhan vien, quan ly, admin.
- File chinh: `src/app/page.tsx`
- Component employee: `src/components/dashboard/EmployeeDashboardPremium.tsx`
- Component manager: `src/components/dashboard/ManagerDashboardPremium.tsx`
- Component admin: `src/components/dashboard/AdminDashboardPremium.tsx` (kết nối 100% REST API máy chủ /api/reports, /api/employees, /api/requests)
- Shared premium components: `src/components/dashboard/premium/`
- Service layer: `src/lib/services/dashboard-service.ts`
- Dung khi: sua man hinh sau dang nhap, phan nhanh theo vai tro, quick actions, stat cards

## Trung tam Phe Duyet
### Trung tam Duyet & Yeu cau Nhan su (Executive Approval Hub)
- Mo ta: quan ly va phe duyet 7 loai yeu cau (nghi phep, di muon/ve som, doi ca, sua cong, tam ung, review KPI, nhan su moi). Thiet ke theo chuan 3 Tang Executive SaaS Golden Standard (DESIGN_RULE_HOMIES_FINAL.md), ty le vang 2/3 + 1/3, Macro KPI Cards, Modal boc tach chi tiet 4 khoi co phim dieu huong.
- File chinh: `src/app/approvals/page.tsx`, `src/components/approvals/ApprovalExecutiveHeader.tsx`, `src/components/approvals/ApprovalMacroCards.tsx`, `src/components/approvals/ApprovalDetailModal.tsx`, `src/components/approvals/ApprovalSidebarWidgets.tsx`, `src/lib/mock-data/approvals.ts`
- Dung khi: sua giao dien phe duyet, modal chi tiet don tu, bo loc danh muc, duyet hang loat, widget thong ke.

### Quan ly Quy Trinh Phe Duyet (Approval Workflow Settings)
- Mo ta: cau hinh danh muc 15 quy trinh phe duyet chuan (Xin nghi ngay, Duyet cham cong, Doi ca, Nho lam thay, Ung luong...), phan cap duyet dong (1 cap, 2 cap, 3 cap...), chon chuc vu duyet cho tung cap, chuc vu nhan thong bao khi hoan tat, loai tru nhan vien va cac toggle quy tac nang cao.
- File chinh: `src/components/settings/ApprovalWorkflowManager.tsx`, `src/app/settings/master-data/page.tsx`, `src/lib/adapters/master-data-adapter.ts`
- Dung khi: them, sua, xoa, nhan ban quy trinh phe duyet, cau hinh cap duyet 1 cap/2 cap/3 cap.

## Nhan su va tuyen noi bo
### Danh sach nhan vien va ho so
- Mo ta: xem danh sach nhan vien, chi tiet ho so, phan quyen theo store va role.
- File chinh: `src/app/employees/page.tsx`, `src/app/employees/[id]/page.tsx`, `src/app/employees/new/page.tsx`, `src/app/employees/import/page.tsx`, `src/app/employees/export/page.tsx`, `src/components/employee/EmployeeImportModal.tsx`, `src/lib/services/employee-service.ts`, `src/lib/services/employee-excel-service.ts`
- Dung khi: sua thong tin nhan vien, filter, profile, visibility

### Loi moi ung vien noi bo (F&B Onboarding Hub)
- Mo ta: tao loi moi, REST API may chu (/api/invitations, /api/invitations/form, /api/invitations/submit, /api/invitations/[id]/approve), bieu mau ung vien tu dien Mobile-First 5 khoi F&B (Size ao, Anh CCCD 2 mat, The xanh y te VSATTP, Tai khoan ngan hang tu dong in hoa khong dau, Cam ket noi quy va bao mat cong thuc), phe duyet tu sinh ma NV va tao tai khoan mat khau 123456 (go bo 100% localStorage).
- File chinh:
  + `src/app/api/invitations/route.ts`: GET & POST danh sach loi moi va tao loi moi moi tren CSDL server.
  + `src/app/api/invitations/form/route.ts`: GET doc thong tin loi moi theo token cho ung vien mo link tu email.
  + `src/app/api/invitations/submit/route.ts`: POST luu toan bo ho so ung vien tu dien vao CSDL server (chuyen status thanh submitted).
  + `src/app/api/invitations/[id]/approve/route.ts`: POST duyet ho so, tu sinh ma NVxxxx ke tiep, tao nhan vien vao db.employees voi pass 123456.
  + `src/app/employees/invitations/page.tsx`: quan ly loi moi, danh sach cho duyet va dong bo phe duyet may chu.
  + `src/app/employees/invitations/new/page.tsx`: tao loi moi moi gui email.
  + `src/app/employees/invitations/form/page.tsx`: bieu mau Mobile-First 5 khoi F&B cho ung vien tu dien.
  + `src/app/employees/invitations/_components/InvitationDetailModal.tsx`: modal xem chi tiet ho so, anh CCCD 2 mat, size ao, the xanh va STK ngan hang.
  + `src/lib/mock-data-employee-ext.ts`: kieu du lieu EmployeeInvitation mo rong 5 khoi F&B.
  + `src/lib/server/db.ts`: ServerInvitation schema va khoi tao du lieu seed mau F&B.
- Dung khi: sua flow moi nhan su, bieu mau onboarding, API invitations, checklist duyet nhan su moi F&B.

### Rule lich va staffing
- Mo ta: cau hinh shift template, preference, staffing calculator, toi uu nhan su (tich hop `/settings/staffing`).
- File chinh: `src/app/settings/schedule-rules/**/*`, `src/app/settings/staffing/page.tsx`, `src/lib/adapters/staffing-adapter.ts`, `src/components/staffing/*`, `src/lib/staffing/*`, `src/lib/mock-data-settings.ts`
- Dung khi: sua dinh muc ca, nhu cau tuan, cong cu tinh nhan su

### Dang ky ca va Phan ca tuan
- Mo ta: dang ky ca ranh tuan Mobile-First, quan ly phan ca theo tuan, 1-cham duyet dang ky ca hop le, ban do thoi gian trong (Availability Heatmap 7 ngay x 3 ca) va ty le nop lich ranh.
- File chinh: `src/app/shifts/register/page.tsx`, `src/app/my-schedule/page.tsx`, `src/app/schedule/page.tsx`, `src/app/schedule/registrations/page.tsx`, `src/components/scheduling/ManagerSchedulingBoard.tsx`, `src/lib/services/scheduling/shift-registration-service.ts`, `src/lib/services/scheduling/schedule-service.ts`, `src/lib/services/scheduling/schedule-import-batch.ts`, `src/lib/services/scheduling/schedule-export-service.ts`
- Dung khi: sua flow dang ky ca di dong, phe duyet ca tuan, xep lich lam viec, radar phat hien lung ca.

### CÃ i Ä‘áº·t vÃ  Danh má»¥c chuáº©n SaaS
- Mo ta: he thong cai dat duoc gom thanh 5 nhom SaaS chuyen nghiep (Doanh nghiep, Danh muc nhan su, Luong & Phu cap, Phan ca & Cham cong, He thong & Phan quyen).
- File chinh: `src/app/settings/page.tsx`, `src/app/settings/organization/page.tsx`, `src/components/settings/OrganizationGeneralTab.tsx`, `src/app/settings/master-data/page.tsx`, `src/components/settings/VisualOrgChart.tsx`, `src/lib/adapters/master-data-adapter.ts`, `src/app/settings/payroll/page.tsx`, `src/app/settings/schedule-rules/page.tsx`, `src/app/settings/schedule-rules/shifts/page.tsx`, `src/app/settings/schedule-rules/preferences/page.tsx`, `src/app/settings/staffing/page.tsx`, `src/app/settings/wifi/page.tsx`, `src/app/settings/permissions/page.tsx`, `src/app/settings/system/page.tsx`, `src/lib/navigation/sidebar-config.ts`, `src/lib/mock-data/settings.ts`
- Dung khi: sua thong tin chuoi, chi nhanh GPS, danh muc nhan su, so do cay to chuc (Visual Org Chart), luu tru va dong bo Supabase/LocalStorage master data, khung luong & OT, quy tac phan ca, WiFi check-in, RBAC phan quyen.

## Attendance va check-in
- Dung khi: sua dieu huong xep lich, board tuan theo ca, board tuan theo nhan vien, setting ca, quy tac xep ca, nhu cau tuan, assignment, publish, smart mapping máº«u ca vÃ  bá»™ nhá»› tá»± há»c (Smart Memory)

### Rule lich va staffing
- Mo ta: cau hinh shift template, preference, staffing calculator, toi uu nhan su (tich hop `/settings/staffing`).
- File chinh: `src/app/settings/schedule-rules/**/*`, `src/app/settings/staffing/page.tsx`, `src/lib/adapters/staffing-adapter.ts`, `src/components/staffing/*`, `src/lib/staffing/*`, `src/lib/mock-data-settings.ts`
- Dung khi: sua dinh muc ca, nhu cau tuan, cong cu tinh nhan su

### Cài đặt và Danh mục chuẩn SaaS
- Mo ta: he thong cai dat duoc gom thanh 5 nhom SaaS chuyen nghiep (Doanh nghiep, Danh muc nhan su, Luong & Phu cap, Phan ca & Cham cong, He thong & Phan quyen).
- File chinh: `src/app/settings/page.tsx`, `src/app/settings/hermes/page.tsx`, `src/app/api/hermes/copilot/route.ts`, `src/app/settings/organization/page.tsx`, `src/components/settings/OrganizationGeneralTab.tsx`, `src/app/settings/master-data/page.tsx`, `src/components/settings/VisualOrgChart.tsx`, `src/lib/adapters/master-data-adapter.ts`, `src/app/settings/payroll/page.tsx`, `src/app/settings/schedule-rules/page.tsx`, `src/app/settings/schedule-rules/shifts/page.tsx`, `src/app/settings/schedule-rules/preferences/page.tsx`, `src/app/settings/staffing/page.tsx`, `src/app/settings/wifi/page.tsx`, `src/app/settings/permissions/page.tsx`, `src/app/settings/system/page.tsx`, `src/lib/navigation/sidebar-config.ts`, `src/lib/mock-data/settings.ts`, `src/lib/hermes/hermes-config-service.ts`, `src/components/admin/AdminCopilotDrawer.tsx`, `src/components/telemetry/SmartBugReporter.tsx`
- Dung khi: sua thong tin chuoi, chi nhanh GPS, danh muc nhan su, so do cay to chuc (Visual Org Chart), luu tru va dong bo Supabase/LocalStorage master data, khung luong & OT, quy tac phan ca, WiFi check-in, RBAC phan quyen, cau hinh Hermes Copilot & Webhook.

# CODEMAP

Muc tieu: vao dung diem sua, giam doc full file, giam token.

## App Shell va dieu huong
### Khung ung dung & Site Map Tinh Gon (18 Hubs)
- Mo ta: layout goc, toaster, error boundary, shell, BottomNav va Sidebar duoc tinh gon theo mo hinh 18 Hubs nghiep vu chuan SaaS F&B. Cac route cu/trung lap duoc tu dong chuyen huong qua `next.config.ts`.
- File chinh: `src/app/layout.tsx`, `src/components/layout/AppShell.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/layout/Header.tsx`, `src/lib/navigation/sidebar-config.ts`, `next.config.ts`
- Dung khi: sua khung chung, dieu huong, bao ve trai nghiem toan app, them redirect hoac sua menu theo role.

### Xac thuc demo va role
- Mo ta: dang nhap mock, user hien tai, role label, nho phien dang nhap.
- File chinh: `src/store/auth-store.ts`, `src/components/auth/ProtectedRoute.tsx`, `src/components/auth/RoleGuard.tsx`, `src/proxy.ts`, `src/lib/rbac.ts`, `src/proxy-access.test.ts`
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

## Trung tam Phe Duyet
### Trung tam Duyet & Yeu cau Nhan su (Executive Approval Hub)
- Mo ta: quan ly va phe duyet 7 loai yeu cau (nghi phep, di muon/ve som, doi ca, sua cong, tam ung, review KPI, nhan su moi). Thiet ke theo chuan 3 Tang Executive SaaS Golden Standard (DESIGN_RULE_HOMIES_FINAL.md), ty le vang 2/3 + 1/3, Macro KPI Cards, Modal boc tach chi tiet 4 khoi co phim dieu huong.
- File chinh: `src/app/approvals/page.tsx`, `src/components/approvals/ApprovalExecutiveHeader.tsx`, `src/components/approvals/ApprovalMacroCards.tsx`, `src/components/approvals/ApprovalDetailModal.tsx`, `src/components/approvals/ApprovalSidebarWidgets.tsx`, `src/lib/mock-data/approvals.ts`
- Dung khi: sua giao dien phe duyet, modal chi tiet don tu, bo loc danh muc, duyet hang loat, widget thong ke.

### Quan ly Quy Trinh Phe Duyet (Approval Workflow Settings)
- Mo ta: cau hinh danh muc 15 quy trinh phe duyet chuan (Xin nghi ngay, Duyet cham cong, Doi ca, Nho lam thay, Ung luong...), phan cap duyet dong (1 cap, 2 cap, 3 cap...), chon chuc vu duyet cho tung cap, chuc vu nhan thong bao khi hoan tat, loai tru nhan vien va cac toggle quy tac nang cao.
- File chinh: `src/components/settings/ApprovalWorkflowManager.tsx`, `src/app/settings/master-data/page.tsx`, `src/lib/adapters/master-data-adapter.ts`
- Dung khi: them, sua, xoa, nhan ban quy trinh phe duyet, cau hinh cap duyet 1 cap/2 cap/3 cap.

## Nhan su va tuyen noi bo
### Danh sach nhan vien va ho so
- Mo ta: xem danh sach nhan vien, chi tiet ho so, phan quyen theo store va role.
- File chinh: `src/app/employees/page.tsx`, `src/app/employees/[id]/page.tsx`, `src/app/employees/new/page.tsx`, `src/app/employees/import/page.tsx`, `src/app/employees/export/page.tsx`, `src/components/employee/EmployeeImportModal.tsx`, `src/lib/services/employee-service.ts`, `src/lib/services/employee-excel-service.ts`
- Dung khi: sua thong tin nhan vien, filter, profile, visibility

### Loi moi ung vien noi bo
- Mo ta: tao loi moi, email preview, form ung vien tu dien, duyet ho so.
- File chinh: `src/app/employees/invitations/page.tsx`, `src/app/employees/invitations/new/page.tsx`, `src/app/employees/invitations/form/page.tsx`, `src/lib/mock-data-employee-ext.ts`, `src/lib/services/employee-service.ts`
- Dung khi: sua flow moi nhan su, trang thai invitation, checklist duyet

### Rule lich va staffing
- Mo ta: cau hinh shift template, preference, staffing calculator, toi uu nhan su (tich hop `/settings/staffing`).
- File chinh: `src/app/settings/schedule-rules/**/*`, `src/app/settings/staffing/page.tsx`, `src/lib/adapters/staffing-adapter.ts`, `src/components/staffing/*`, `src/lib/staffing/*`, `src/lib/mock-data-settings.ts`
- Dung khi: sua dinh muc ca, nhu cau tuan, cong cu tinh nhan su

### Cài đặt và Danh mục chuẩn SaaS
- Mo ta: he thong cai dat duoc gom thanh 5 nhom SaaS chuyen nghiep (Doanh nghiep, Danh muc nhan su, Luong & Phu cap, Phan ca & Cham cong, He thong & Phan quyen).
- File chinh: `src/app/settings/page.tsx`, `src/app/settings/organization/page.tsx`, `src/components/settings/OrganizationGeneralTab.tsx`, `src/app/settings/master-data/page.tsx`, `src/components/settings/VisualOrgChart.tsx`, `src/lib/adapters/master-data-adapter.ts`, `src/app/settings/payroll/page.tsx`, `src/app/settings/schedule-rules/page.tsx`, `src/app/settings/schedule-rules/shifts/page.tsx`, `src/app/settings/schedule-rules/preferences/page.tsx`, `src/app/settings/staffing/page.tsx`, `src/app/settings/wifi/page.tsx`, `src/app/settings/permissions/page.tsx`, `src/app/settings/system/page.tsx`, `src/lib/navigation/sidebar-config.ts`, `src/lib/mock-data/settings.ts`, `supabase/schema_v4_schedule_rules.sql`, `supabase/migrations/20260828_schedule_payroll_rls_lockdown.sql`
- Dung khi: sua thong tin chuoi, chi nhanh GPS, danh muc nhan su, so do cay to chuc (Visual Org Chart), luu tru va dong bo Supabase/LocalStorage master data, khung luong & OT, quy tac phan ca, WiFi check-in, RBAC phan quyen.

### Tích hợp Bên thứ 3 & Cổng iPOS Private Cloud (iPOS HRM Integration)
- Mo ta: trung tam quan ly ket noi he sinh thai iPOS (Cổng 1: iPOS HRM cham cong, phan ca, tinh luong; Cổng 2: FABi POS Doanh thu & iPOS IVT Hao hut kho). Tich hop Backend Cloud Worker kiem tra ket noi mang that, chan tuyet doi tai khoan mau/mock data, co che bao ve an toan chan dong bo khi chua xac thuc that, va bo Schema Detector doi soat 14 truong du lieu F&B thuc te kem de xuat truong thieu tu dong.
- File chinh: `src/app/settings/integrations/ipos/page.tsx`, `src/app/api/ipos/cloud-worker/route.ts`, `src/app/api/notifications/route.ts`, `src/lib/services/ipos/ipos-notifier.ts`, `src/lib/services/ipos/ipos-schema-detector.ts`, `src/lib/services/ipos/ipos-normalizer.ts`, `src/lib/server/db.ts`, `scripts/test_ipos_cloud_worker.mjs`, `scripts/test_ipos_schema_detector.mjs`
- Dung khi: cau hinh ket noi iPOS, kiem tra ket noi mang thuc te toi hrm.ipos.vn, bat tay Tien ich Chrome Bridge, xem nhat ky dong bo ngam, doi soat danh ba truong du lieu, cau hinh thong bao da kenh Telegram/Zalo/Qua chuong va ap dung de xuat bo sung vao Homies HRM.

## Attendance va check-in
- Dung khi: sua dieu huong xep lich, board tuan theo ca, board tuan theo nhan vien, setting ca, quy tac xep ca, nhu cau tuan, assignment, publish, smart mapping mẫu ca và bộ nhớ tự học (Smart Memory)

### Rule lich va staffing
- Mo ta: cau hinh shift template, preference, staffing calculator, toi uu nhan su (tich hop `/settings/staffing`).
- File chinh: `src/app/settings/schedule-rules/**/*`, `src/app/settings/staffing/page.tsx`, `src/lib/adapters/staffing-adapter.ts`, `src/components/staffing/*`, `src/lib/staffing/*`, `src/lib/mock-data-settings.ts`
- Dung khi: sua dinh muc ca, nhu cau tuan, cong cu tinh nhan su

### Cài đặt và Danh mục chuẩn SaaS
- Mo ta: he thong cai dat duoc gom thanh 5 nhom SaaS chuyen nghiep (Doanh nghiep, Danh muc nhan su, Luong & Phu cap, Phan ca & Cham cong, He thong & Phan quyen).
- File chinh: `src/app/settings/page.tsx`, `src/app/settings/organization/page.tsx`, `src/components/settings/OrganizationGeneralTab.tsx`, `src/app/settings/master-data/page.tsx`, `src/components/settings/VisualOrgChart.tsx`, `src/lib/adapters/master-data-adapter.ts`, `src/app/settings/payroll/page.tsx`, `src/app/settings/schedule-rules/page.tsx`, `src/app/settings/schedule-rules/shifts/page.tsx`, `src/app/settings/schedule-rules/preferences/page.tsx`, `src/app/settings/staffing/page.tsx`, `src/app/settings/wifi/page.tsx`, `src/app/settings/permissions/page.tsx`, `src/app/settings/system/page.tsx`, `src/lib/navigation/sidebar-config.ts`, `src/lib/mock-data/settings.ts`
- Dung khi: sua thong tin chuoi, chi nhanh GPS, danh muc nhan su, so do cay to chuc (Visual Org Chart), luu tru va dong bo Supabase/LocalStorage master data, khung luong & OT, quy tac phan ca, WiFi check-in, RBAC phan quyen.

## Attendance va check-in
### Bang cham cong & Check-in (Executive Timesheet Hub)
- Mo ta: bang cham cong tuan ma tran 7 ngay theo nhan vien truc quan theo hinh anh thuc te, tuan thu 100% DESIGN_RULE_HOMIES_FINAL.md (Kien truc 3 Tang Executive SaaS, 4 Macro KPI cards, dải Legend 6 trang thai, modal chi tiet & sua gio truc tiep, modal them ca cham cong bu (+), bo loc chi nhanh/tuan/bo phan, xuat Excel va chot/khoa ky cong).
- File chinh: `src/app/attendance/page.tsx`, `src/app/attendance/**/*`, `src/app/checkin/page.tsx`, `src/components/checkin/*`, `src/lib/services/attendance-service.ts`, `src/lib/services/attendance/attendance-service.ts`, `src/lib/services/attendance/ipos-attendance-importer.ts`, `src/lib/services/scheduling/schedule-service.ts`, `src/app/attendance/published-schedule-flow.test.ts`, `src/lib/mock-data/attendance.ts`, `supabase/rls_v3_policies.sql`, `supabase/migrations/20260828_schedule_payroll_rls_lockdown.sql`, `src/proxy-access.test.ts`
- Dung khi: sua giao dien bang cham cong, luoi ma tran tuan, chi tiet ca cham cong, bo loc gio check-in/out, xuat Excel cham cong.

## KPI va danh gia
### KPI, vi pham, xet duyet (Executive KPI Hub)
- Mo ta: module KPI da tach thanh cac man ro vai tro. `/kpi` la dashboard dieu hanh theo role, khong con chen diem dep khi thieu du lieu. `/kpi/periods` quan ly mo ky, publish, mo khieu nai, khoa ky va CEO queue. `/kpi/review` la khong gian danh gia thang & dong nghiep an danh theo vai tro (`KPIMonthlyRoleWorkspace`: employee reviewer, shift leader scoring, store manager selection/approval drawer, HR integrity queue & audit reveal). `/kpi/result` la ket qua ca nhan, diem dong nghiep an danh gop, tong hop nhan xet, chuoi thang dat tot cho thang tien va khieu nai 48 gio. `/kpi/settings` la KPI Builder local-first dung `kpiAdapter`, `KPIPeerReviewSettingsPanel` (trong so, ranking ca lam chung, thoi han chon 24h, thoi han nop 48h, fallback an toan). `/kpi/promotion` la promotion hub 7 buoc co co che khoa thang tien khi dang co khieu nai chua giai quyet (`isEvaluationUsableForPromotion`). Legacy route `/kpi/evaluate/trial` da redirect sang challenge route moi.
- File chinh: `src/app/kpi/page.tsx`, `src/app/kpi/periods/page.tsx`, `src/app/kpi/review/page.tsx`, `src/app/kpi/result/page.tsx`, `src/app/kpi/reports/page.tsx`, `src/app/kpi/settings/page.tsx`, `src/app/kpi/settings/migration/page.tsx`, `src/app/kpi/promotion/page.tsx`, `src/app/kpi/development/tests/page.tsx`, `src/app/kpi/development/challenges/page.tsx`, `src/app/kpi/violations/page.tsx`, `src/app/kpi/violations/appeals/page.tsx`, `src/app/kpi/violations/settings/page.tsx`, `src/components/kpi/monthly/*` (`KPIMonthlyRoleWorkspace.tsx`, `KPIReviewTaskList.tsx`, `KPIPeerReviewForm.tsx`, `KPIReviewerSelectionPanel.tsx`, `KPIReviewProgressPanel.tsx`, `KPIManagerApprovalDrawer.tsx`, `KPIHrIntegrityQueue.tsx`), `src/components/kpi/program/KPIPeerReviewSettingsPanel.tsx`, `src/components/kpi/workspace/*`, `src/components/kpi/builder/*`, `src/components/kpi/program/*`, `src/components/kpi/incidents/*`, `src/lib/kpi/*` (`career-map-types.ts`, `career-map-service.ts`, `career-map-service.test.ts`, `peer-assignment-service.ts`, `peer-response-service.ts`, `peer-aggregation-service.ts`, `monthly-review-service.ts`, `evaluation-integrity-service.ts`, `evaluation-notification-service.ts`, `peer-review-repository.ts`, `local-peer-review-repository.ts`, `supabase-peer-review-repository.ts`, `appeal-service.ts`, `development-service.ts`, `seed.ts`), `src/lib/adapters/peer-review-adapter.ts`, `src/lib/kpi/monthly-review-integration.test.ts`, `supabase/migrations/20260823_kpi_monthly_peer_review.sql`, `supabase/migrations/20260823_kpi_monthly_peer_review_rls.sql`, `supabase/seed_kpi_monthly_peer_review_demo.sql`
- Giai doan 2 danh gia thang & peer an danh: spec da duyet tai `docs/superpowers/specs/2026-08-23-kpi-danh-gia-thang-peer-an-danh-design.md`; ke hoach code tai `docs/superpowers/plans/2026-08-23-kpi-danh-gia-thang-peer-an-danh-implementation-plan.md`. Bao gom toan bo 12 tasks: types, policy, ranking ca lam chung, 5 cau hoi F&B, aggregate an danh gop, 7 trang thai lifecycle, 7 cờ liêm chính, 9 mốc notification, secure local/Supabase repository, ca lam adapter & seed demo, settings panel, role workspace `/kpi/review`, ket qua va appeal 48h, full integration tests.
- So do lo trinh phat trien Homies keo tha (Career Map Drag-and-Drop): spec tai `docs/superpowers/specs/2026-08-24-kpi-homies-career-map-drag-drop-design.md`; ke hoach tai `docs/superpowers/plans/2026-08-24-kpi-homies-career-map-drag-drop-implementation-plan.md`. Domain đồ thị và luật nối vị trí: `src/lib/kpi/career-map-types.ts`, `src/lib/kpi/career-map-service.ts`, `src/lib/kpi/career-map-service.test.ts`.
- Program setup wizard: `src/components/kpi/program/KPIProgramStepper.tsx` thanh dieu huong 5 buoc muc tieu kinh doanh; `src/components/kpi/program/KPIProgramPurposeStep.tsx` chon muc tieu chinh & phu va goi nhanh mau Homies; `src/components/kpi/program/KPIProgramScopeStep.tsx` dung Career Map toan chuoi va mot callback tong hop cho moi thao tac; `src/lib/kpi/program-service.ts` goi y chang tu master data, chan nhay cap, tao hang loat draft va `createSingleStageExceptionDraft` tao dung mot ngoai le lien cap o trang thai draft; `src/lib/kpi/program-service.test.ts` kiem tra adjacent target, scope/date va no-publish; `src/lib/kpi/career-map-aggregate-contract.test.ts` khoa hop dong mot aggregate save; `src/components/kpi/program/KPISingleStageExceptionPanel.tsx` dat trong Advanced Settings, preview nhan vien/cua hang va luu draft that; `src/app/kpi/settings/page.tsx` persist draft/revision va khong tu publish; `src/components/kpi/program/KPIProgramSourcesStep.tsx` chon 9 nguon danh gia; `src/components/kpi/program/KPIProgramReadinessStep.tsx` cau hinh dieu kien san sang tang bac; `src/components/kpi/program/KPIProgramReviewStep.tsx` xem truoc mo phong va phat hanh chuong trinh; `src/components/kpi/program/KPIAdvancedSettingsPanel.tsx` drawer cau hinh chuyen sau.
- Giai doan 2 danh gia thang & peer an danh: spec da duyet tai `docs/superpowers/specs/2026-08-23-kpi-danh-gia-thang-peer-an-danh-design.md`; ke hoach code tai `docs/superpowers/plans/2026-08-23-kpi-danh-gia-thang-peer-an-danh-implementation-plan.md`. Dung khi lam reviewer eligibility/ranking, manager chon 2 nguoi, auto-select/replacement, form peer 5 cau, aggregate an danh, fallback trong so, monthly review lifecycle, integrity flags, secure repository/RLS, role workspace `/kpi/review`, ket qua va appeal 48 gio.
- Builder setup F&B: `src/components/kpi/builder/KPISetupStepper.tsx` render 5 buoc setup; `src/components/kpi/builder/KPITemplateLibrary.tsx` render thu vien 6 mau KPI F&B, chon vi tri ap dung va bo loc nang cao; `src/components/kpi/builder/KPIStoreGroupPanel.tsx` phan nhom cua hang A/B/C; `src/components/kpi/builder/KPITargetMatrix.tsx` dat muc tieu theo toan chuoi va nhom cua hang; `src/components/kpi/builder/KPIStoreOverridePanel.tsx` dieu chinh target ngoai le theo tung cua hang.
- Dung khi: sua dashboard dieu hanh KPI theo role, workspace cham diem cho leader/quan ly, ket qua ca nhan cho nhan vien, quan ly ky KPI cho HR/CEO, bao cao KPI da scope theo quyen (macro cards, xu huong, rui ro, SLA khiu nai, pipeline, leaderboard), ho so su co va queue khiu nai incident cho CEO, KPI Builder local-first, logic giai thich dieu kien thang tien, promotion hub 7 buoc, rubric bai test nang bac, lich test lai, timeline challenge, goi y salary khi bo nhiem, navigation role-based cua menu trai, hoac can 2 tai lieu nghiem thu pilot KPI (`KPI_PILOT_RUNBOOK.md`, `KPI_PILOT_RESULT.md`) de chay demo 1 cua hang / 1 ky / 1 ho so thang tien truoc khi mo rong.
- Mo ta: route `/kpi/violations` da doi sang workspace canonical cho ho so su co van hanh / ky luat. Cổng ghi nhận sự cố công khai `/kpi/violations/public` (kem link tat `/incident`, `/leader/log`, `/bsc/log`) cho phep Leader tai quan nhap loi bang ma PIN, tu dong dong bo 2 chieu vao ca KPI Ca Nhan va Bang Diem Thuong BSC Cua Hang thong qua `kpiBscSyncService`. Nut sao chep link nhanh `[Link Leader Nhap (Public)]` duoc dong bo tren ca 2 man hinh `/kpi/violations` va `/bsc-bonus`.
- File chinh: `src/app/kpi/violations/page.tsx`, `src/app/kpi/violations/public/page.tsx`, `src/app/kpi/violations/appeals/page.tsx`, `src/app/kpi/violations/settings/page.tsx`, `src/components/bsc-bonus/BSCLogsTab.tsx`, `src/components/kpi/incidents/AuthorizedVerifiersModal.tsx`, `src/components/kpi/incidents/StoreOperationIncidentModal.tsx`, `src/components/kpi/incidents/IncidentCatalogSettingsModal.tsx`, `src/lib/services/incident-catalog-service.ts`, `src/components/kpi/incidents/KPIIncidentDrawer.tsx`, `src/components/kpi/incidents/KPIIncidentTable.tsx`, `src/components/kpi/incidents/KPIIncidentAppealQueue.tsx`, `src/lib/kpi/incident-service.ts`, `src/lib/kpi/incident-service.test.ts`, `src/lib/kpi/appeal-service.ts`, `src/lib/kpi/appeal-service.test.ts`, `src/lib/kpi/source-service.ts`, `src/lib/kpi/evaluation-service.ts`, `src/lib/adapters/kpi-adapter.ts`, `src/lib/services/kpi-bsc-sync-service.ts`, `src/lib/services/violation-permission-service.ts`, `next.config.ts`, `src/proxy.ts`
- Dung khi: sua logic tao / xac nhan ho so su co, root-cause rule, tac dong KPI tu su co, bang canonical incidents, queue khieu nai incident, policy versioned, mapping incident vao nguon cham diem thang, lien doi leader, drawer chi tiet, hoac cac bo loc va footer tong hop.

### Thuong BSC cua hang & Ca nhan
- Mo ta: hub tinh va chia thuong BSC cua hang theo chinh sach Homies Ho Ba Phan (moc loi nhuan >=6.5tr, 4 tieu chi BSC dong, ho tro phan ra tieu chi con voi trong so noi bo & quy doi BSC tu dong, dong co quy doi moc diem 1-5 va mo phong truc quan, quy 1%, chia gio lam x cap bac x loi ca nhan) voi luong 3 buoc van hanh va trang Cai dat He thong BSC doc lap cho CEO/HR Admin.
- File chinh: `src/app/bsc-bonus/page.tsx`, `src/app/settings/bsc/page.tsx`, `src/components/bsc-bonus/*` (`BSCMonthlyImportModal.tsx`), `src/components/kpi/incidents/*` (`StoreOperationIncidentModal.tsx`), `src/lib/bsc-types.ts`, `src/lib/bsc-engine.ts`, `src/lib/mock-data-bsc.ts`, `src/lib/adapters/bsc-adapter.ts`
- Dung khi: sua cong thuc BSC, quy chia thuong, bang log loi van hanh / ca nhan, modal ghi vi pham hop nhat StoreOperationIncidentModal, form quyet toan 01 mau vang va trang cai dat he thong bsc doc lap /settings/bsc

## Payroll va leave
### Luong, nghi phep, yeu cau
- Mo ta: route payroll, leave request/approval/calendar va cac yeu cau lien quan, tinh luong theo gio ca nhan (hourly_rate), giao dien xem phieu luong di dong ca nhan (`/payroll/salary-slip`), cai dat chinh sach bang luong F&B (`/settings/payroll`).
- File chinh: `src/app/payroll/**/*`, `src/app/payroll/salary-slip/page.tsx`, `src/components/payroll/*` (`PayrollHeaderControls.tsx`, `PayrollPaymentModal.tsx`), `src/app/settings/payroll/page.tsx`, `src/app/leave/**/*`, `src/app/requests/page.tsx`, `src/lib/payroll/payroll-calculator.ts`, `src/lib/payroll-engine.ts`, `src/lib/payroll-payment-ledger.ts`, `src/lib/services/payroll/payroll-policy-service.ts`, `src/lib/quota-service.ts`, `[BOT]_HOMIES_HRM_REAL_SEED_PAYLOAD.json`, `data/server-db.json`, `supabase/rls_v3_policies.sql`, `supabase/migrations/20260828_schedule_payroll_rls_lockdown.sql`, `supabase/migrations/20260828_payroll_payment_ledger.sql`, `src/proxy-access.test.ts`
- Dung khi: sua phep, bang luong, don gia gio, quota, quy trinh phe duyet, phieu luong di dong nhan vien, cai dat tham so bang luong (cong 26 ngay, phat tre 3 bac, OT, tip, phu cap).

## Trung tam Duyet (Approval Center)
### Hub duyet yeu cau hop nhat
- Mo ta: trang hub gom tat ca 7 loai yeu cau cho duyet (nghi phep, di muon/ve som, doi ca, sua cong, tam ung, KPI review, nhan su moi), kem lien ket sang Duyet dang ky ca & Ban do thoi gian trong (/schedule/registrations). Co summary cards, tab loc, filter chi nhanh/trang thai, batch approve, phan biet do uu tien.
- File chinh: `src/app/approvals/page.tsx`, `src/app/schedule/registrations/page.tsx`, `src/lib/mock-data/approvals.ts`
- Dung khi: sua trang duyet yeu cau, them loai yeu cau moi, doi giao dien approval cards

## Notifications, offline va tich hop nen
### Thong bao va nen tang offline
- Mo ta: notification center, sync offline, network status, PWA.
- File chinh: `src/hooks/useOfflineSync.ts`, `src/hooks/useNotifications.ts`, `src/hooks/useNetworkStatus.ts`, `src/lib/notifications/*`, `src/lib/offline-store.ts`, `next.config.ts`, `public/manifest.json`
- Dung khi: sua trang thai offline, push/local notifications, PWA

## Du lieu nen va backend tuong lai
### Mock data, service, Data Adapters va Supabase
- Mo ta: mock data tap trung theo module, service layer phan theo linh vuc SaaS (`employees/`, `scheduling/`, `onboarding/`, `payroll/`, `attendance/`), Data Adapters layer tu dong switch giua Mock Data va Supabase Real DB (`src/lib/adapters/`), script schema/seed/RLS Master v3, va bo migration/seed KPI SaaS pilot cho cau hinh KPI, ky KPI, score, incident, appeal, thang tien, challenge va salary decision.
- File chinh: `src/lib/adapters/*` (`payroll-adapter.ts`, `attendance-adapter.ts`, `employee-adapter.ts`, `schedule-adapter.ts`, `schedule-adapter.test.ts`, `master-data-adapter.ts`, `master-data-adapter.test.ts`, `store-adapter.ts`, `schedule-rules-adapter.ts`), `src/lib/mock-data/*`, `src/lib/services/**/*`, `src/lib/supabase.ts`, `supabase/schema_v3_master_fixed.sql`, `supabase/schema_v4_schedule_rules.sql`, `supabase/seed_v3_clean.sql`, `supabase/rls_v3_policies.sql`, `supabase/migrations/20260821_kpi_saas_core.sql`, `supabase/migrations/20260821_kpi_saas_rls.sql`, `supabase/migrations/20260828_schedule_payroll_rls_lockdown.sql`, `supabase/seed_kpi_saas_pilot.sql`, `docs/KPI_RLS_TEST_MATRIX.md`, `src/proxy-access.test.ts`
- Dung khi: truy vet du lieu nguon, chuyen linh hoat giua mock va backend that qua `repositoryConfig.useRealSupabase`, chinh sua schema/seed/RLS Supabase cho KPI SaaS pilot, hoac doi chieu matrix quyen truoc khi bat backend that.

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
- File chinh: `src/lib/services/onboarding-policy-service.ts`, `src/lib/services/onboarding-operations-service.ts`, `src/app/career-path/settings/page.tsx`, `src/app/career-path/onboarding/page.tsx`, `src/components/onboarding-operations/*`, `src/components/onboarding-operations/OnboardingSelfReviewSummary.tsx`, `src/components/onboarding-operations/OnboardingStageGatePanel.tsx`, `src/components/onboarding-employee/*`, `src/components/onboarding-employee/OnboardingSelfReviewCard.tsx`, `src/components/onboarding-employee/OnboardingStageGateStatusCard.tsx`, `src/app/employees/contracts/[id]/page.tsx`, `src/app/employees/[id]/page.tsx`, `src/app/onboarding/page.tsx`
- Dung khi: sua moc gui noi quy, nhac lai, xac nhan nhan vien, checklist onboarding ngay dau, rule block/can hoan tat som, danh sach nguoi sap vao lam, checklist chi tiet theo tung nguoi, flow `tu danh gia theo chang`, hoac `gate tong ket chang`

### Nen du lieu checklist onboarding mau
- Mo ta: nhom nang luc mac dinh, template theo vi tri, chang onboarding, va item checklist co tieu chuan dat de sau nay gan cho nhan vien that.
- File chinh: `src/lib/career-path-types.ts`, `src/lib/mock-data-career-path.ts`, `src/lib/career-path-service.ts`
- Dung khi: sua cau truc du lieu onboarding mau cho `nhan vien quay`, `pha che`, `shift leader`, map checklist mau vao UI/employee plan sau nay, hoac luu/doc `self-review history` va `stage gate record` theo chang onboarding

### Spec flow va quyet dinh moi
- Mo ta: cac spec nho de chot flow nghiep vu truoc khi code, nhu flow noi quy nhan viec, setting toi thieu, va cac quyet dinh scope tuong tu.
- File chinh: `docs/superpowers/specs/*`, `docs/superpowers/specs/2026-05-25-noi-quy-onboarding-flow-design.md`, `docs/superpowers/specs/2026-05-27-setting-shortcut-full-web-backlog.md`, `docs/superpowers/specs/2026-05-28-onboarding-3-mat-design.md`, `docs/superpowers/specs/2026-05-28-onboarding-output-standard-design.md`, `docs/superpowers/specs/2026-05-28-onboarding-self-review-design.md`, `docs/superpowers/specs/2026-05-28-onboarding-stage-gate-design.md`
- Dung khi: can xem lai quyet dinh da chot voi user truoc khi viet plan hoac sua UI/service, dac biet khi can chot `chuan dau ra onboarding theo vi tri`, `gate giao ca`, `muc dat khi co kem / dat tu lam`, `tu danh gia that cua nhan vien`, hoac `gate tong ket chang`

### Backlog map icon rang cua toan web
- Mo ta: map man hinh nao nen co icon rang cua, dat o dau, va nhay toi route setting nao de rollout theo tung pass.
- File chinh: `docs/superpowers/specs/2026-05-27-setting-shortcut-full-web-backlog.md`
- Dung khi: can mo lai backlog shortcut setting, uu tien rollout, hoac doi chieu route setting truoc khi code UI

### Plan trien khai chi tiet
- Mo ta: implementation plan chia task nho de code theo tung cum, bao gom file map, verify va commit checkpoint.
- File chinh: `docs/superpowers/plans/*`, `docs/superpowers/plans/2026-05-25-noi-quy-onboarding-flow-plan.md`, `docs/superpowers/plans/2026-05-28-onboarding-3-mat-plan.md`, `docs/superpowers/plans/2026-05-28-onboarding-output-standard-plan.md`, `docs/superpowers/plans/2026-05-28-onboarding-self-review-plan.md`, `docs/superpowers/plans/2026-05-28-onboarding-stage-gate-plan.md`
- Dung khi: da duyet spec va can bat dau code theo tung task co thu tu ro rang, nhat la rollout `chuan dau ra onboarding theo vi tri` vao data mock, service, 3 man onboarding, hoac pass `self-review theo chang` / `gate tong ket chang`

## Quan ly Thuong BSC Cua Hang (Role-Based Multi-Tab)
### Man hinh Thuong BSC & Cai Dat Quy Tac
- Mo ta: module quan ly quy thuong BSC theo mo hinh tab vong doi nghiep vu da phan quyen chat che: Quáº£n lÃ½ cua hang (`store_manager`) tu dong mo Form Quyet Toan Thang va khoa xem chi nhanh khac (tu dong ke thua Target va moc hoa von theo ky hieu luc do CEO cai dat); Truong ca (`shift_leader`) chi mo Nhat ky loi ca; CEO/HR Admin xem Dashboard vi mo 4 khia canh, chuyen doi chi nhanh, chot cong bo quy thuong, quan tri `/settings/bsc` (dat moc hoa von, 2 che do target tu dong/thu cong, thoi han hieu luc tu thang ... den thang ...).
- File chinh: `src/app/bsc-bonus/page.tsx`, `src/app/settings/bsc/page.tsx`, `src/components/bsc-bonus/settings/*`, `src/components/bsc-bonus/BSCApprovalBar.tsx`, `src/components/bsc-bonus/BSCExecutiveCards.tsx`, `src/components/bsc-bonus/BSCScorecardGap.tsx`, `src/components/bsc-bonus/BSCIndividualDetailModal.tsx`, `src/components/bsc-bonus/BSCTeamTable.tsx`, `src/components/bsc-bonus/BSCMonthlyInputForm.tsx`, `src/components/bsc-bonus/BSCLogsTab.tsx`, `src/components/bsc-bonus/BSCSettingsTab.tsx`, `src/lib/adapters/bsc-adapter.ts`, `src/lib/bsc-engine.ts`
- Dung khi: xem bang cong bo thuong, quyet toan du lieu thang (O Vang), doi chieu bao cao su co/loi read-only, cai dat dinh muc tieu chi BSC, cau hinh diem phat va ma tran thuong, thoi han ap dung target BSC

## Script tien ich cuc bo
### Mo nhanh va restart dev server
- Mo ta: script Windows giup mo nhanh, restart app HRM local va cong cu dang nhap tu dong lay token iPOS Cloud.
- File chinh: `open-hrm.bat`, `restart-hrm-dev.bat`, `login-ipos.bat`, `scripts/login_ipos_get_token.mjs`
- Dung khi: can mo app local, restart dev server dung cong `3535`, hoac dang nhap tai khoan iPOS HRM de tu dong cap nhat Token vao .env.local.

### Spec thiet ke KPI SaaS
- Mo ta: dac ta da duyet cho KPI thang, cau hinh dong, vi pham, khieu nai, thang tien, bai test, thu thach, tang luong va rollout theo Pass A-E.
- File chinh: `docs/superpowers/specs/2026-08-21-kpi-saas-design.md`, `docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md`
- Dung khi: viet implementation plan hoac sua nen nghiep vu KPI moi theo `DESIGN_RULE_HOMIES_FINAL.md`

### Spec mau KPI F&B va muc tieu theo nhom cua hang
- Mo ta: dac ta da duyet cho quy trinh KPI SaaS 5 buoc, gom thu vien 6 mau theo chuc danh, tieu chi va trong so chung toan chuoi, muc tieu theo nhom cua hang, ngoai le co thoi han va cong bo theo phien ban.
- File chinh: `docs/superpowers/specs/2026-08-22-kpi-fnb-template-targets-design.md`, `docs/superpowers/plans/2026-08-22-kpi-fnb-template-targets-implementation-plan.md`
- Dung khi: nang cap `/kpi/settings` tu trinh chinh tay thanh quy trinh F&B co huong dan, hoac trien khai template, target profile, store override va period snapshot theo Pass A-E.

### So Do Lo Trinh Phat Trien Su Nghiep (Career Map Drag & Drop)
- Mo ta: module thiet ke so do lo trinh phat trien su nghiep toan chuoi Homies dang keo tha truc quan tren canvas (@xyflow/react), ho tro nhieu nhanh hoi tu (Pha che, Thu ngan, Phuc vu, Bep -> Truong ca -> Cua hang truong), tu dong phat hien va chan loi noi (nhay cap, noi nguoc, noi ngang, vong lap), thu vien tieu chi F&B voi wizard 4 cau hoi don gian, can trong so 100%, preview pham vi anh huong nhan vien/cua hang, flow duyet 2 cap (HR gui duyet -> CEO phe duyet & ban hanh), va che do xem read-only theo role tai Hub Thang tien (`/kpi/promotion`).
- File domain & service: `src/lib/kpi/career-map-types.ts`, `src/lib/kpi/career-map-service.ts`, `src/lib/kpi/career-map-criteria-service.ts`, `src/lib/kpi/career-map-deployment-service.ts`, `src/lib/kpi/seed.ts`, `src/lib/kpi/local-repository.ts`, `src/lib/kpi/repository.ts`
- File components: `src/components/kpi/career-map/KPICareerMapDesigner.tsx`, `src/components/kpi/career-map/KPICareerMapCanvas.tsx`, `src/components/kpi/career-map/KPICareerPositionTray.tsx`, `src/components/kpi/career-map/KPICareerMapNode.tsx`, `src/components/kpi/career-map/KPICareerMapInspector.tsx`, `src/components/kpi/career-map/KPICareerCriteriaLibraryDrawer.tsx`, `src/components/kpi/career-map/KPICareerMapValidationPanel.tsx`, `src/components/kpi/career-map/KPICareerMapDeploymentPreview.tsx`, `src/components/kpi/career-map/KPICareerMapReadOnly.tsx`
- File UI routes: `src/app/kpi/settings/page.tsx` (Tab "So Do Lo Trinh Homies"), `src/components/kpi/program/KPIProgramScopeStep.tsx`, `src/app/kpi/promotion/page.tsx` (Tab "So Do Lo Trinh Homies")
- File Supabase & SQL: `supabase/migrations/20260824_kpi_career_map.sql`, `supabase/migrations/20260824_kpi_career_map_rls.sql`, `supabase/seed_kpi_career_map_demo.sql`
- File tests: `src/lib/kpi/career-map-service.test.ts`, `src/lib/kpi/career-map-criteria-service.test.ts`, `src/lib/kpi/career-map-deployment-service.test.ts`, `src/lib/kpi/local-repository.test.ts`
- File correction sau audit Antigravity: vòng 2 tại `docs/superpowers/reviews/2026-08-24-kpi-career-map-antigravity-correction-prompt.md`; vòng 3 tại `docs/superpowers/reviews/2026-08-24-kpi-career-map-antigravity-correction-prompt-v3.md`; vòng 4 tại `docs/superpowers/reviews/2026-08-24-kpi-career-map-antigravity-correction-prompt-v4.md`; vòng 5 tại `docs/superpowers/reviews/2026-08-24-kpi-career-map-antigravity-correction-prompt-v5.md`, khóa 8 lỗi còn lại về foreign key, placement thiếu store, Promotion dữ liệu giả, strict publish validation, atomic UI save, validation context, test Supabase gateway thật và single-stage functional flow.
- Prompt giao Antigravity chi kiem tra runtime Pass A tren PostgreSQL/Supabase local, khong sua code: `docs/superpowers/reviews/2026-08-25-kpi-career-map-pass-a-postgres-runtime-verification-prompt.md`; report bat buoc tra ve tai `docs/superpowers/reviews/2026-08-25-kpi-career-map-pass-a-postgres-runtime-result.md`.
- Dung khi: sua canvas keo tha lo trinh, sua luat noi vi tri, sua tieu chi/trong so, sua workflow duyet CEO/HR, sua migration Supabase career map, hoac sua man hinh xem lo trinh nhan vien.

### Spec & Implementation Lo Trinh Cap Bac Nhan Vien Da Nang Homies (Multiskill Career Grade)
- Mo ta: dac ta nghiep vu va he thong code chuan hoa lo trinh cap bac van hanh da nang toan chuoi `C1-PC/C1-TN -> C2 -> C3 -> C4 -> C5`, quy dinh chi tiet bo tieu chi KPI (100% trong so), dinh muc chuan dat cho tung cap bac/tram, va dieu kien chuyen cap chi tiet cho tung doan C1 -> C2 -> C3 -> C4 -> C5 (tham nien, so gio, diem KPI, bai test, thu vai, danh gia tin nhiem, tham quyen duyet).
- File spec & plan: `docs/superpowers/specs/2026-08-25-kpi-homies-multiskill-career-grade-design.md`, `docs/superpowers/plans/2026-08-25-kpi-homies-multiskill-career-grade-implementation-plan.md`
- File domain & catalog: `src/lib/kpi/career-grade-types.ts`, `src/lib/kpi/career-grade-catalog.ts`
- File service: `src/lib/kpi/career-grade-placement-service.ts` (fail-closed theo chứng nhận + quyết định), `src/lib/kpi/career-grade-migration-service.ts` (dry-run nhân viên, HR confirmation, checksum), `src/lib/kpi/development-service.ts`, `src/lib/kpi/career-map-service.ts`, `src/lib/kpi/career-map-criteria-service.ts`, `src/lib/kpi/career-map-deployment-service.ts`
- File database & Supabase: `src/lib/kpi/repository.ts`, `src/lib/kpi/local-repository.ts`, `src/lib/kpi/supabase-repository.ts`, `supabase/migrations/20260825_kpi_multiskill_career_grade.sql`, `supabase/migrations/20260825_kpi_multiskill_career_grade_rls.sql`
- File UI Admin: `src/app/kpi/settings/migration/page.tsx`, `src/components/kpi/career-map/KPICareerPositionTray.tsx`, `src/components/kpi/career-map/KPICareerMapValidationPanel.tsx`, `src/app/settings/master-data/page.tsx`
- File tests: `src/lib/kpi/career-grade-catalog.test.ts`, `src/lib/kpi/career-grade-placement-service.test.ts`, `src/lib/kpi/career-grade-migration-service.test.ts`, `src/lib/kpi/career-grade-ui-contract.test.ts`, `src/lib/kpi/career-map-sql-contract.test.ts`
- Dung khi: trien khai hoac sua logic cap bac nhan vien, ma tran ky nang tram, dieu kien xet thang cap, bo tieu chi KPI theo cap.

### Master Data & Career Grade Alignment
- File UI: `src/app/settings/master-data/page.tsx` (nhom Van hanh cua hang/ Khoi quan ly, preview legacy)
- File adapter: `src/lib/adapters/master-data-adapter.ts` (`getPositionPresentation`, `buildLegacyPositionMapping`)
- File migration preview: `src/app/kpi/settings/migration/page.tsx`, `src/lib/kpi/career-grade-migration-service.ts`
- File tests: `src/lib/adapters/master-data-adapter.test.ts`, `src/lib/kpi/career-grade-ui-contract.test.ts`, `src/lib/kpi/career-grade-migration-service.test.ts`
- Dung khi: sua mo hinh `C1-PC/C1-TN -> C2 -> C3 -> C4 -> C5`; du lieu chuc danh cu chi duoc preview va cho HR xac nhan.

### Lộ Trình Sự Nghiệp Cá Nhân & Ma Trận Kỹ Năng (Career Path Dashboard)
- Mo ta: module Lộ Trình Sự Nghiệp cá nhân theo chuẩn Executive SaaS F&B Golden Standard (HOMIES_DESIGN_SYSTEM_GOLDEN_RULES.md). Bố cục 3 Tầng hoàn chỉnh: Header điều hành cố định, 4 Thẻ KPI Vĩ Mô, Tỷ lệ vàng (2/3 Hero Navy + Ma trận Kỹ năng đa tầng + Điều kiện xét thăng chức & 1/3 Mục tiêu cá nhân, Thành tích, Mentor đồng hành, Gợi ý thông minh). Hỗ trợ Modal bóc tách chi tiết kỹ năng với bảo chứng đồng nghiệp/leader và 100% icon chuẩn Lucide React. Đồng bộ 5 subpages: Bảng xếp hạng (`/career-path/leaderboard`), Danh mục kỹ năng (`/career-path/skills`), Mục tiêu (`/career-path/goals`), Xét thăng cấp (`/career-path/promotion`), Thông báo (`/career-path/notifications`).
- File chinh: `src/app/career-path/page.tsx`, `src/app/career-path/leaderboard/page.tsx`, `src/app/career-path/skills/page.tsx`, `src/app/career-path/goals/page.tsx`, `src/app/career-path/promotion/page.tsx`, `src/app/career-path/notifications/page.tsx`, `src/components/career-path/SkillDetailModal.tsx`, `src/components/career-path/SkillHexagon.tsx`, `src/components/career-path/ProgressRing.tsx`, `src/components/career-path/ProgressBar.tsx`, `src/lib/career-path-icon-helper.tsx`, `src/lib/career-path-service.ts`, `src/lib/mock-data-career-path.ts`
- Dung khi: sua giao dien lo trinh su nghiep ca nhan, ma tran ky nang, bang xep hang thi dua, muc tieu ca nhan, tien do thang cap, modal chi tiet ky nang, bao chung dong nghiep.

## Read Order De Xuat
1. `rg` tim symbol
2. Doc 50-150 dong quanh ham can sua
3. Sua 1 cum nho
4. Verify
5. Cap nhat CODEMAP neu them file moi
