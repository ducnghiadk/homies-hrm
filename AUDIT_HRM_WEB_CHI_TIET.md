# Audit Web HRM Chi Tiet

Ngay audit: 2026-05-18

Pham vi audit:
- Danh gia codebase web hien tai theo goc nhin san pham HRM.
- Doi chieu voi cac nhom tinh nang cot loi cua mot he thong HRM cho chuoi cua hang F&B/tra sua.
- Danh gia muc do san sang de demo, de dung noi bo, va de van hanh that.
- Danh gia trai nghiem nguoi dung theo vai tro: nhan vien, truong ca, quan ly cua hang, HR/Admin.

Nguon danh gia:
- Toan bo `src/app`
- Cac `mock-data`, store auth, middleware, Supabase schema
- Cac module chinh: nhan su, lich lam, cham cong, nghi phep, payroll, KPI, staffing, reports, settings

Luu y quan trong:
- Day la tai lieu san pham, khong phai review code.
- Tai lieu nay co tinh "no-code": doc de hieu tinh trang san pham, khong can doc implementation.
- Danh gia duoc dua tren code snapshot hien tai, khong dua tren demo noi bo hay backend da trien khai o ben ngoai repo.

---

## 1. Ket luan nhanh

Web nay da co do phu tinh nang rat rong va nhin be ngoai giong mot he thong HRM kha day du cho chuoi F&B:
- Quan ly nhan su
- Phan ca
- Cham cong
- Xin nghi va phe duyet nghi phep
- Payroll
- KPI va danh gia
- Staffing/dao tao dinh bien
- Bao cao
- Settings/Admin
- Cac module mo rong: chat, learning, gamification, wellness, career path

Tuy nhien, neu danh gia nghiem tuc theo muc tieu "dung that de van hanh HRM", he thong hien tai chua dat muc MVP production.

Danh gia tong quan:
- Muc do san sang de demo: Cao
- Muc do san sang de pilot noi bo: Trung binh thap
- Muc do san sang de van hanh that: Thap

Ly do chinh:
- Da co rat nhieu man hinh va luong nghiep vu
- Nhung phan lon du lieu hien dang chay bang mock data va localStorage
- Auth, session, RBAC, payroll privacy, employee ownership va process approval chua du chat de dua vao van hanh that

Noi ngan gon:
- Day la mot prototype san pham rat giau tinh nang
- Chua phai mot HRM production-ready

---

## 2. Nhan dinh cap cao

### 2.1 Diem manh lon nhat

- Do phu module rong, nhin vao la thay tu duy san pham kha day du.
- Mobile-first kha ro, phu hop van hanh cua nhan vien cua hang.
- Luong cham cong, lich lam, xin nghi, open shift, swap shift duoc dau tu giao dien kha ky.
- Co huong nghiem tuc ve architecture du lieu do repo da co schema Supabase cho users, schedules, attendance, leave, payroll.
- Co tu duy role-based UX: giao dien cho employee, manager, admin duoc tach kha ro.

### 2.2 Diem yeu lon nhat

- Nhieu tinh nang dang la "man hinh co cam giac that" hon la "quy trinh van hanh that".
- Du lieu nghiep vu chua gan that vao user dang dang nhap o nhieu cho.
- Chua co lop bao mat du lieu nhay cam du manh, nhat la payroll va ho so nhan vien.
- Cac module core HRM va cac module mo rong dang nam cung mot mat bang uu tien, lam web trong co ve "rat nhieu" nhung chua "rat chac".
- Dieu huong dang co dau hieu bi qua tai khi he thong tiep tuc tang tinh nang.

---

## 3. Muc do truong thanh cua san pham

Co the xem he thong hien tai dang o muc:

### 3.1 Ve mat san pham

- Gan muc "High-fidelity prototype"
- O mot so module da cham nguong "functional demo"
- Chua len muc "operational MVP"

### 3.2 Ve mat van hanh

He thong chua du dieu kien de giao cho HR, payroll, store manager su dung hang ngay vi:
- Co nguy co sai user context
- Co nguy co lo du lieu luong
- Chua co session va permission enforcement that
- Chua co audit trail va persisted workflow day du

### 3.3 Ve mat ky vong

Neu doi ngu coi day la:
- Ban demo cho stakeholder: rat on
- Nen tang de tiep tuc phat trien: co tiem nang
- San pham co the ban giao van hanh ngay: chua nen

---

## 4. Ban do tinh nang HRM hien co

### 4.1 Nhom core co mat trong web

| Nhom tinh nang | Tinh trang | Nhan xet nhanh |
| --- | --- | --- |
| Dang nhap / phan quyen | Co | Co man hinh va role demo, chua la auth production |
| Nhan su | Co | Co danh sach, chi tiet, them moi, import/export/offboarding route |
| Lich lam / phan ca | Manh | La module duoc dau tu nhieu nhat |
| Cham cong | Co | Co check-in GPS/WiFi/offline, lich su, requests |
| Nghi phep | Co | Co xin nghi, lich nghi, phe duyet |
| Payroll | Co | Co bang luong, tinh luong, phieu luong, bonus/deduction/insurance |
| KPI / danh gia | Co | Rất nhieu page, coverage cao |
| Bao cao | Co | Co nhieu dashboard va bao cao |
| Cài đặt | Co | Co khung settings rong |
| Staffing / workforce planning | Co | Rất hop voi F&B, co gia tri |

### 4.2 Nhom mo rong da xuat hien

| Nhom tinh nang | Tinh trang | Nhan xet nhanh |
| --- | --- | --- |
| Chat | Co | Tinh nang mo rong, chua thay lien ket voi core workflow |
| Learning | Co | Hay cho long-term HR platform, khong phai uu tien so 1 |
| Gamification | Co | Tang engagement, nhung la nhom sau core HRM |
| Wellness | Co | Co tinh thuong hieu, chua phai uu tien van hanh |
| Career path | Co | Huu ich cho phat trien nhan su, nhung nen sau HRIS core |
| Recognition / rewards | Co | Tot cho culture, khong phai blocker van hanh |

### 4.3 Nhom chua thay ro hoac con rat mong

| Nhom tinh nang | Tinh trang | Nhan xet nhanh |
| --- | --- | --- |
| Tuyendung / ATS | Thieu | Chua thay pipeline ung vien, interview, offer |
| Ho so hop dong / phap ly | Mong | Chua thay do sau ve contract, ID docs, tax dependents |
| Asset management | Gan nhu khong | Chua thay giao tai san theo nhan vien |
| Workflow center tap trung | Mong | Approval dang phan tan |
| Audit trail chinh quy | Mong | Chua thay tam nhin compliance day du |
| Tich hop thiet bi / may cham cong that | Mong | Co mo phong va logic, chua thay integration that |

---

## 5. Audit theo tung nhom chuc nang

## 5.1 Auth, session, phan quyen

### Hien trang

- Co login page va auth store.
- Co nhieu role: employee, shift_leader, store_manager, area_manager, hr_admin, ceo.
- Co middleware, role labels, permission logic, ProtectedRoute, trang demo RBAC.
- Co Supabase client va schema backend.

### Diem tot

- Tu duy role hierarchy ro.
- Da tinh den RBAC tu som.
- Co phan tach trai nghiem theo role trong dashboard va navigation.

### Van de

- Dang nhap van la demo mode.
- Session dang luu client-side, chua thay session server-side that.
- Middleware chua enforce auth va permission that.
- ProtectedRoute co ton tai nhung chua thay duoc dung rong rai tren toan bo cac page nghiep vu.
- Supabase van dang de placeholder.

### Tac dong san pham

- Nguoi dung co the co cam giac da "co phan quyen", nhung thuc te he thong chua du chan sai truy cap.
- Neu dua vao van hanh that, day la rui ro cap 1.

### Danh gia

- Do hoan thien: Thap
- Uu tien sua: Rat cao

---

## 5.2 HRIS / Ho so nhan vien

### Hien trang

- Co danh sach nhan vien
- Co trang chi tiet nhan vien
- Co them moi, import, export, offboarding route
- Co thong tin co ban: ten, email, phone, vai tro, store, position, status

### Diem tot

- Tu duy "employee directory" da co
- Routing du cho vong doi nhan su co ban
- UI nhin de tiep can va phu hop mobile

### Van de

- Danh sach nhan vien dang doc tu mock data
- Search va filter chua thay tinh nang that
- Them nhan vien chua tao ban ghi that
- Chua thay audit cho thay luong employee lifecycle that: onboarding, contract, bank info, tax info, BHXH, document, history
- Chua thay phan phong ban, cost center, reporting line ro net

### Tac dong san pham

- Day chua phai mot "ho so nhan su trung tam" dung nghia
- Muc nay chua du de lam nguon su that cho payroll, policy, promotion, training

### Danh gia

- Do hoan thien: Thap den trung binh
- Uu tien sua: Cao

---

## 5.3 Lich lam, phan ca, swap shift, open shift

### Hien trang

Day la nhom module manh nhat cua san pham.

Web hien co:
- Lich lam ca nhan
- Lich theo cua hang
- Quan ly phan ca
- Dang ky preference
- Admin registration/review
- Open shifts
- Claim open shifts
- Swap shifts
- Warnings
- Auto schedule / smart scheduling

### Diem tot

- Coverage nghiep vu rat tot cho mo hinh F&B
- Co suy nghi den nhieu tinh huong thuc te: open shift, swap, preference, warning, staffing, labor cost
- Manager flow kha day
- Employee flow cung kha day
- UI co nhieu quick action, thao tac de hieu tren mobile

### Van de

- Rat nhieu route va luong con, nguy co lam nguoi dung roi
- Nhiều logic dang van hanh tren mock/local storage
- Co feature trông san sang nhưng thuc ra moi la placeholder, demo action, hoac alert
- Chua thay duoc mot "single source of truth" ro rang cho lich da publish va lich dang draft
- Neu nhieu manager cung thao tac, chua ro conflict handling, lock, versioning

### Tac dong san pham

- Ve mat demo: rat an tuong
- Ve mat van hanh that: can lam chac data model, publishing workflow, permission, audit trail

### Danh gia

- Do hoan thien: Trung binh kha ve mat giao dien va flow
- Do san sang production: Trung binh thap
- Uu tien sua: Rat cao vi day la module xuong song cua F&B HRM

---

## 5.4 Cham cong va check-in

### Hien trang

Web hien co:
- Check-in GPS
- Check-in theo WiFi
- Co offline mode
- Co pending sync
- Co check-out
- Co lich su cham cong
- Co overtime, requests, manual edits, device alerts, by-store, by-date, calendar

### Diem tot

- Dinh huong mobile-first dung voi bai toan cua hang
- Co y tuong hay: offline-first, GPS + WiFi, pending sync
- Coverage man hinh rat tot
- Co kha nang tro thanh mot diem khac biet cua san pham

### Van de

- Chua thay integration voi ha tang that
- Chua thay quy trinh xac minh gian lan, evidence, photo proof, policy breach handling
- Chua thay workflow review cong chuan cho payroll close
- Co nhieu logic local, khong thay transaction boundary ro
- Chua thay role/data boundary chuan giua employee, store manager, HR, payroll

### Tac dong san pham

- Co gia tri demo rat cao
- Neu dua vao van hanh that se can lam rat ky vi attendance la input truc tiep cho payroll va discipline

### Danh gia

- Do hoan thien: Trung binh
- Uu tien sua: Rat cao

---

## 5.5 Nghi phep

### Hien trang

Web hien co:
- Trang tong vao leave
- Request leave
- Approval
- Leave calendar
- Leave balance
- Quota logic
- Dong bo leave voi attendance records

### Diem tot

- Da co du suy nghi nghiep vu: quota, pending quota, approve/reject/cancel, impact staffing
- UX xin nghi kha ro rang
- Co ket noi y tuong giua nghi phep va chieu sau van hanh cua cua hang

### Van de

- Luong dang bi gan cung vao mot employee mau thay vi user dang login
- Identity nguoi gui va quota chua that su dynamic
- Approval logic co ve hop ly ve y tuong nhung chua du tin cay de chay that
- Chua thay cap approval linh hoat theo to chuc, cua hang, cap quan ly, HR
- Chua thay policy phuc tap: blackout periods, holiday rules, carry-forward, encashment, proof docs

### Tac dong san pham

- Day la module "nhin rat that" nhung hien tai chua duoc tin de su dung that

### Danh gia

- Do hoan thien: Trung binh ve UI, thap ve trustworthiness
- Uu tien sua: Rat cao

---

## 5.6 Payroll

### Hien trang

Web hien co:
- Bang luong
- Tinh luong
- Salary slip
- Insurance
- Advance
- Bonus
- Deductions
- Payroll by store
- Payroll company

### Diem tot

- Coverage route kha day du
- Co tinh den base salary, OT, bonus, deductions, insurance, tax
- Co payroll engine va UI tong quan

### Van de cuc ky quan trong

- Payroll la du lieu nhay cam nhat, nhung quyen xem hien chua du chat
- Salary slip page dang render danh sach phieu luong mau thay vi phieu cua user dang login
- Cac role manager duoc coi nhieu thong tin payroll hon muc an toan neu khong co boundary ro
- Chua thay quy trinh close payroll:
  - Chot cong
  - Freeze ky luong
  - Review exception
  - Approval line
  - Export bank
  - Publish payslip
  - Re-open with audit trail
- Chua thay co che khoa ky, version, reconciliation

### Tac dong san pham

- Day la blocker cap 1 de dua san pham vao van hanh that
- Neu payroll khong chac, toan bo he thong mat do tin cay

### Danh gia

- Do hoan thien: Trung binh thap
- Rui ro nghiep vu: Rat cao
- Uu tien sua: Rat cao

---

## 5.7 KPI, danh gia, vi pham, thang tien

### Hien trang

Day la mot nhom duoc dau tu rat nhieu:
- KPI dashboard
- Evaluate
- Trial evaluate
- Review
- Result
- Reports
- Settings
- Leaderboard
- Promotion
- Violations
- Appeals
- Batch log

### Diem tot

- Coverage san pham rat day
- Nhin ra y tuong "HRM + van hanh + performance system" rat ro
- Co tiem nang tro thanh diem khac biet cua san pham

### Van de

- Day khong phai nhom blocker de chay HRM core, nhung dang chiem ty trong feature kha lon
- Neu core data chua chac, KPI cung kho dung that
- Chua thay ro quy tac governance:
  - ai dat KPI
  - KPI version theo ky
  - calibration
  - escalation
  - audit phuc tra
- Can xem lai su can bang giua "discipline" va "coaching"

### Tac dong san pham

- Phan nay rat hay de demo, rat tot de mo rong sau
- Nhung neu bat dau commercialization hoac pilot, khong nen dat no cao hon auth, attendance, leave, payroll

### Danh gia

- Do hoan thien: Trung binh ve breadth
- Uu tien sua: Trung binh

---

## 5.8 Staffing / workforce planning

### Hien trang

Web hien co:
- Staffing page
- Calculator
- Optimization
- Quick estimate
- Labor cost settings
- Traffic templates
- Salary templates

### Diem tot

- Rat hop nganh F&B
- Co tinh "business operator" ro, khong chi la HR admin tool
- Co the la mot module ban hang manh

### Van de

- Can rang buoc chat hon voi du lieu that:
  - revenue/traffic
  - availability
  - labor budget
  - actual attendance
  - forecast accuracy
- Neu khong, module nay de tro thanh mot "simulator dep" hon la cong cu quyet dinh

### Danh gia

- Do hoan thien: Trung binh
- Uu tien sua: Trung binh

---

## 5.9 Reports va analytics

### Hien trang

Co bao cao tong quan va cac nhanh:
- attendance report
- staff hours
- salary structure
- hr overview
- budget
- tasks
- analytics page

### Diem tot

- Bao cao du route, de tao cam giac san pham day dan
- Hop voi nhu cau manager va owner

### Van de

- Phan lon dang dua tren mock data
- Chua thay metric dictionary, filter governance, export governance
- Chua thay distinction giua:
  - dashboard operational
  - report management
  - report compliance
- Chua thay confidence level cua data

### Danh gia

- Do hoan thien: Trung binh thap
- Uu tien sua: Trung binh

---

## 5.10 Settings, admin, master data

### Hien trang

Co settings hub va nhieu route:
- payroll
- staffing
- labor cost
- master data
- permissions
- wifi
- schedule rules
- system

### Diem tot

- Da co suy nghi ve khung setting theo category
- Co setup wizard mindset

### Van de

- Nhieu setting co ve la catalog/UI thay vi da gan vao persisted config
- Settings nhieu nhung chua ro muc uu tien va business criticality
- Chua thay distinction ro giua:
  - system settings
  - org settings
  - store settings
  - manager-level settings
- Chua thay workflow "draft/publish/impact analysis" cho setting nhay cam

### Danh gia

- Do hoan thien: Trung binh thap
- Uu tien sua: Trung binh

---

## 5.11 Chat, learning, gamification, wellness, career path

### Nhan dinh

Day la nhom "gia tri tang them" rat tot cho tam nhin nen tang nhan su.

### Diem tot

- Cho thay doi ngu co tam nhin lon hon mot HRM co ban
- Phu hop neu muon di theo huong employee experience platform

### Van de

- Trong giai doan hien tai, nhom nay dang vuot qua do chac cua core HRM
- Neu phan bo effort khong can bang, se dan den san pham "rong nhung khong sau"

### Danh gia

- Do hoan thien: Khong can danh gia theo chuan core HRM
- Uu tien sua: Thap hon core

---

## 6. Danh gia trai nghiem nguoi dung

## 6.1 Tong quan UX

Cam nhan tong the:
- Giao dien than thien
- Mau sac, icon, the card, quick action kha de tiep can
- Mobile-first ro
- Nhan vien su dung cac luong co ban se thay kha thoai mai

Nhung khi nhin duoi goc van hanh that:
- Thong tin va thao tac bat dau tan man
- So page qua nhieu
- Co nhieu duong di den cung mot chu de
- Muc do nhat quan ve "day la man hinh xem", "day la man hinh tac nghiep", "day la setting", "day la demo" chua ro

---

## 6.2 UX theo vai tro

### A. Employee

Muc do de dung:
- Kha de dung

Diem tot:
- Lich lam, nghi phep, luong, profile, check-in la cac entry point ro
- Bottom nav cho employee hop ly
- Man hinh cham cong va lich lam phu hop ngu can thao tac nhanh

Diem gay kho:
- Khi feature tang len, employee co the khong phan biet duoc cai nao la can dung hang ngay, cai nao la tinh nang phu
- Mot so route trông rat that nhung ket qua chua chac la du lieu that
- Neu user gap sai data, khong thay co co che explain hoac support ro

Danh gia:
- De hoc: Tot
- De tin: Chua du

### B. Shift Leader / Store Manager

Muc do de dung:
- Trung binh

Diem tot:
- Co rat nhieu cong cu tac nghiep
- Nhom schedule/staffing duoc dau tu
- More page tap hop nhieu tinh nang quan ly

Diem gay kho:
- Dieu huong bi tan man
- Nhieu route phan ca co ten gan nhau: assign, manage, review, by-shift, warnings, open-shifts, registration
- Ranh gioi giua "xem", "duyet", "cau hinh", "mo dang ky", "xep ca", "toi uu" chua that ro
- Co nguy co thua click va kho nho duong di

Danh gia:
- De hoc: Trung binh
- De thao tac nhanh hang ngay: Trung binh thap

### C. HR Admin / CEO

Muc do de dung:
- Trung binh thap

Diem tot:
- Co rat nhieu module de tham khao va quan sat tong quan
- Reports va settings kha day

Diem gay kho:
- Qua nhieu route
- Chua thay mot "control center" dung nghia cho HR/Admin
- Du lieu nhay cam va tac vu nhay cam chua duoc tach ro theo cap do
- Payroll, nhan su, setting, bao cao, KPI dang song song ma chua co thu tu uu tien UX ro

Danh gia:
- De hoc: Trung binh
- De van hanh chuan: Thap

---

## 6.3 Cac van de UX lon can uu tien

### 1. Information Architecture chua dong vai tro "ban do san pham"

Van de:
- Nguoi dung thay nhieu tinh nang, nhung kho biet bat dau o dau
- Chuc nang schedule dang chia thanh qua nhieu route
- Chuc nang manager bi day mot phan vao `More`, mot phan o nav chinh, mot phan o dashboard

Khuyen nghi:
- Chot lai 5 nhom nav cap 1 theo role
- Gom cac route schedule thanh 3 nhom ro:
  - Lich cua toi
  - Tac nghiep ca lam
  - Cau hinh/quan ly lich

### 2. Chua phan biet ro man hinh demo va man hinh production-like

Van de:
- User co the tin rang tat ca thao tac deu co gia tri van hanh that
- Thuc te mot so noi moi la local action, mock action, hoac alert

Khuyen nghi:
- Can co quy uoc ro:
  - demo only
  - coming soon
  - active workflow
- Khong nen de nut nhin nhu "lam duoc ngay" neu chua co tac dung that

### 3. Qua nhieu quick actions

Van de:
- Quick actions giup dep UX, nhung neu qua nhieu se gay roi

Khuyen nghi:
- Moi role chi nen co 4-6 quick actions quan trong nhat
- Cac action it dung dua vao menu muc 2

### 4. Chua co "ngu canh nghiep vu"

Van de:
- Nguoi dung khong luon biet minh dang thao tac cho cua hang nao, ky nao, tuan nao, user nao

Khuyen nghi:
- Tren man hinh manager/admin, can co context bar ro:
  - cua hang
  - ky luong
  - tuan lich
  - trang thai draft/published/locked

### 5. Chua co cam giac "safe to operate"

Van de:
- Chua thay status, lock, warning, undo, audit, review pattern du ro cho thao tac nhay cam

Khuyen nghi:
- Moi thao tac anh huong payroll, attendance, leave, schedule publish can co:
  - preview
  - confirm
  - ket qua
  - audit note

---

## 7. Cac tinh nang cot loi da du chua?

Neu chi hoi "co page chua?" thi:
- Da kha day

Neu hoi "du de goi la mot HRM dung that chua?" thi:
- Chua du

### 7.1 Cac nhom co the coi la da co khung

- Employee self-service
- Scheduling
- Attendance
- Leave
- Payroll
- KPI/performance
- Reports
- Settings

### 7.2 Cac nhom con thieu de HRM tro thanh he thong van hanh

- Auth production va session production
- RBAC production
- Employee master data that
- Approval engine nhat quan
- Persisted workflow thay cho mock/local state
- Payroll privacy va payroll close process
- Attendance exception handling
- Audit trail
- Notifications/workflow event that
- Import/export business-grade

### 7.3 Cac nhom con thieu de tro thanh "full HR platform"

- ATS/tuyen dung
- Contract & legal records
- Asset handover
- Document management
- Compliance history
- Workforce budget control end-to-end

---

## 8. Diem nghep vu can canh bao ngay

### Muc do nghiem trong rat cao

- Auth dang o che do demo
- Session va route protection chua production-ready
- Payroll privacy chua an toan
- Leave dang co dau hieu sai context user

### Muc do nghiem trong cao

- Employee CRUD chua la CRUD that
- Ranh gioi quyen xem/sua/chot du lieu chua ro
- Attendance va payroll chua co freeze/approval chain

### Muc do nghiem trong trung binh

- IA va navigation co nguy co tang do roi khi them feature
- Cac module mo rong co the danh lech focus khoi core HRM

---

## 9. Thu tu uu tien nen lam tiep

## Phase 0 - Giai cuu nen tang

Muc tieu:
- Bien san pham tu demo thanh nen tang co the tin duoc

Can lam:
- Auth that
- Session that
- Supabase connection that
- Route protection that
- RBAC that
- User context that
- Remove hard-code employee context o cac luong core

Ket qua mong doi:
- Moi page nghiep vu deu biet user nao dang thao tac
- Moi role chi thay duoc dung thu can thay

---

## Phase 1 - Chac hoa 4 module song con

Muc tieu:
- HRM co the pilot duoc

Tap trung vao:
- Employee master data
- Scheduling
- Attendance
- Leave

Can lam:
- Persist data that
- Approval workflow that
- Publish/unpublish/lock state
- Change log
- Notification event that
- Exception handling

Ket qua mong doi:
- Quan ly cua hang co the xep ca, duyet nghi, xem cong ma khong so sai context

---

## Phase 2 - Chot payroll

Muc tieu:
- Dong duoc ky luong co kiem soat

Can lam:
- Cut-off cong
- Review exception
- Lock payroll period
- Approval workflow
- Payslip access by role
- Export banking/compliance
- Recalculation governance

Ket qua mong doi:
- Payroll tro thanh module dang tin, khong chi la dashboard dep

---

## Phase 3 - Toi uu trai nghiem

Muc tieu:
- Giam roi, tang toc do thao tac

Can lam:
- Re-architecture navigation theo role
- Gom bớt route trung y nghia
- Uu tien dashboard theo tac vu hang ngay
- Tach man hinh demo / mo rong / core
- Thiet ke lai manager workspace

Ket qua mong doi:
- He thong de hoc, de thao tac, de tin

---

## Phase 4 - Mo rong gia tri

Muc tieu:
- Sau khi core chac, moi day manh differentiation

Can lam sau:
- KPI nang cao
- Career path
- Learning
- Gamification
- Wellness
- Chat workflow

Ly do:
- Nhung nhom nay chi phat huy gia tri khi data core da dung va user da tin he thong

---

## 10. De xuat cau truc san pham de de dung hon

Neu tai cau truc thong tin, nen nghi theo 5 nhom lon:

### Cho employee

- Trang chu
- Lich lam
- Cham cong
- Nghi phep
- Luong

### Cho manager

- Van hanh hom nay
- Lich va nhan su
- Cham cong va nghi phep
- KPI va su co
- Bao cao

### Cho HR/Admin

- Nhan su
- Cong va luong
- Chinh sach va cai dat
- Bao cao dieu hanh
- He thong

### Nguyen tac dieu huong

- Mot bai toan chi nen co 1 lo vao chinh
- Cac lo vao phu chi dung cho shortcut
- Khong de nguoi dung phai nho route
- Moi page phai tra loi duoc 3 cau:
  - Toi dang o dau?
  - Toi dang thao tac cho ai/cua hang nao/ky nao?
  - Hanh dong nay se anh huong den dau?

---

## 11. Danh gia theo muc do san sang kinh doanh

### Neu muc tieu la demo goi von / demo stakeholder

Danh gia:
- Tot

Ly do:
- Nhin thay tam nhin ro
- Nhan duoc do day san pham
- Co diem manh F&B scheduling va attendance

### Neu muc tieu la pilot voi 1-2 cua hang

Danh gia:
- Chua nen pilot ngay

Dieu kien toi thieu truoc khi pilot:
- Auth that
- RBAC that
- Employee context that
- Attendance/leave data that
- Payroll privacy chuan

### Neu muc tieu la trien khai van hanh rong

Danh gia:
- Chua san sang

Ly do:
- Core control layers chua du
- Chua thay compliance-grade process

---

## 12. Bang cham diem tong hop

| Nhom | Diem | Ghi chu |
| --- | --- | --- |
| Tam nhin san pham | 8.5/10 | Rong, co tham vong, hop F&B |
| Do day man hinh | 9/10 | Rat nhieu route va flow |
| Do chac core data | 3.5/10 | Mock/localStorage con nhieu |
| Auth va bao mat | 2.5/10 | Chua du van hanh that |
| UX employee | 7.5/10 | Than thien, de tiep can |
| UX manager | 5.5/10 | Nhieu cong cu nhung roi |
| UX HR/Admin | 5/10 | Nhieu route, chua co cockpit ro |
| Scheduling fit cho F&B | 8/10 | Day la diem sang |
| Payroll readiness | 3/10 | Rui ro cao |
| Muc san sang production | 3.5/10 | Chua dat MVP operational |

---

## 13. Ket luan cuoi cung

Neu nhin nghiem tuc, web nay khong thieu tinh nang theo nghia "khong co gi de dung". Nguoc lai, web dang co rat nhieu tinh nang. Van de lon nhat khong nam o cho thieu them page, ma nam o cho:
- core control chua chac
- data chua that
- quyen chua that
- workflow chua khoa chat

Noi cach khac:
- Day khong phai bai toan "lam them nhieu module"
- Day la bai toan "lam cho cac module da co tro thanh he thong co the tin duoc"

Uu tien dung nhat luc nay:
1. Chac hoa auth, session, permission
2. Chac hoa user context va employee master data
3. Chac hoa schedule, attendance, leave
4. Chac hoa payroll privacy va payroll process
5. Sau do moi toi uu UX va tiep tuc mo rong KPI/career/learning/gamification

Ket luan mot cau:
- San pham nay rat co tiem nang, nhung de tro thanh HRM that su dung duoc, can chuyen trong tam tu "mo rong tinh nang" sang "chac hoa cot song van hanh".

