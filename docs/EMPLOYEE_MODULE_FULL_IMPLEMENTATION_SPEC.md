# EMPLOYEE MODULE FULL IMPLEMENTATION SPEC

## Muc tieu

Tai lieu nay gom 2 nhom viec can lam tiep cho module `Nhan su`:

1. Hoan thien flow `Loi moi nhan vien` theo huong dung duoc that hon
2. Nang cap layout / UX / UI de phu hop voi web admin desktop va van de dung tren mobile

Muc tieu sau cung:
- HR co the tao va gui loi moi nhan vien mot cach ro rang
- co the kiem soat noi dung email truoc khi gui
- biet duoc da gui duoc chua
- reviewer duyet ho so nhanh va it sai
- danh sach / chi tiet nhan vien nhin giong cong cu van hanh that, khong con qua mobile-first

---

## Ket luan hien tai

Nhung gi da co:
- co flow `tao loi moi -> self fill -> cho duyet -> tao employee`
- co preview email co ban
- co candidate self-fill route
- co danh sach nhan vien chinh thuc
- co chi tiet nhan vien 3 cum `Ca nhan / Cong viec / Lich su`

Nhung gi chua xong:
- chua co `email sending state` ro rang
- chua co `edit noi dung gui` theo muc doanh nghiep can
- chua biet `gui duoc chua`, `gui loi chua`, `gui lai duoc khong`
- candidate form van la demo/mock flow
- layout desktop cua list/detail chua du giong web admin hien dai

---

## Phan A. Email moi nhan vien

## A1. Muc tieu nghiep vu

HR can lam duoc 5 viec:
- tao loi moi
- sua noi dung email trong khung cho phep
- preview email truoc khi gui
- gui loi moi
- biet trang thai gui thanh cong hay that bai

Khong can lam ngay:
- mail server that
- tracking email da mo
- rich text editor

Ban MVP nen lam:
- mo phong he thong gui
- luu lich su gui
- hien trang thai gui ro rang

---

## A2. Entity can bo sung cho invitation

Ngoai cac field da co, can them:
- `send_status`
- `send_attempt_count`
- `last_sent_at`
- `last_send_error`
- `last_sent_by`
- `email_template_version`
- `email_preview_snapshot`

Gia tri de xuat:

`send_status`
- `not_sent`
- `sending`
- `sent_success`
- `sent_failed`

Y nghia:
- `not_sent`: moi tao xong, chua gui
- `sending`: dang gui
- `sent_success`: gui xong
- `sent_failed`: gui loi

---

## A3. Noi dung email cho phep edit den dau

Nen chia thanh 3 lop:

### Lop 1. Co dinh

Khong cho sua:
- brand
- cau truc email
- link/form CTA
- cau disclaimer
- footer lien he cong ty

### Lop 2. Co the cau hinh

Cho HR sua:
- tieu de email
- loi nhan ngan
- han hoan tat
- nguoi lien he ho tro
- thong tin lien he ho tro

### Lop 3. Tu dong do du lieu he thong

Khong nhap tay:
- ten ung vien
- chi nhanh
- vi tri
- ma loi moi
- link form

---

## A4. Noi dung email de xuat

### Subject mac dinh

`[Homies Milk Tea] Thu moi nhan viec va hoan tat ho so`

### Body structure

1. Loi chao theo ten
2. Gioi thieu ngan:
   - ban da duoc moi vao vi tri nao
   - tai chi nhanh nao
3. Yeu cau:
   - vui long hoan tat thong tin nhan su theo link ben duoi
4. Han hoan tat
5. CTA:
   - `Hoan tat thong tin`
6. Ho tro:
   - ten nguoi lien he
   - sdt/email
7. Disclaimer:
   - sau khi gui thong tin, bo phan nhan su se kiem tra va xac nhan
   - day chua phai xac nhan da tro thanh nhan vien chinh thuc

---

## A5. Man hinh can co

### 1. Trang Tao loi moi

Can co:
- form thong tin ung vien
- khung `Cau hinh email`
- khung `Preview email`
- button:
  - `Luu nhap`
  - `Gui loi moi`
  - `Tao va xem truoc`

UX:
- desktop: 2 cot
  - trai: form
  - phai: email preview
- mobile: form truoc, preview sau

### 2. Danh sach Loi moi

Can co them cot/trang thai:
- `Trang thai gui`
- `Lan gui cuoi`

Can co action:
- `Gui`
- `Gui lai`
- `Sao chep link`
- `Xem chi tiet`
- `Huy`

### 3. Chi tiet Loi moi

Can hien:
- thong tin ung vien
- thong tin cong viec
- noi dung email da gui
- lich su gui
- loi gui gan nhat neu co

---

## A6. Logic gui email MVP

Ban MVP nen theo huong:
- chua can server email that
- nhung service phai mo phong day du event gui

Them method de xuat:
- `sendInvitation(invitationId, currentUser)`
- `resendInvitation(invitationId, currentUser)`
- `markInvitationSendFailed(invitationId, error)`

Hanh vi:
- khi HR bam `Gui loi moi`
  - validate invitation
  - luu snapshot email
  - tang `send_attempt_count`
  - cap nhat `last_sent_at`
  - cap nhat `send_status`

Neu mock mode:
- gia lap `success/fail`
- neu fail phai co thong bao ro

---

## A7. Rule nghiep vu cho gui email

- khong cho gui neu invitation thieu:
  - full_name
  - store
  - position
  - role
  - email hoac phone
- khong cho gui neu invitation da `approved`, `cancelled`, `rejected`, `expired`
- cho `Gui lai` neu:
  - `sent_failed`
  - `sent_success`
  - `needs_revision`

---

## A8. Cac trang thai can quet duoc tren UI

Trang thai invitation:
- `Da tao`
- `Da gui`
- `Ung vien dang dien`
- `Cho duyet`
- `Can bo sung`
- `Da duyet`
- `Da tu choi`

Trang thai gui:
- `Chua gui`
- `Da gui`
- `Gui loi`

Khong gop 2 lop nay vao 1 badge.

---

## Phan B. Layout va UX/UI web admin

## B1. Danh sach nhan vien

### Van de hien tai

- dang hien theo list card mot cot
- hop mobile hon desktop
- HR scan thong tin chua nhanh
- chua tao cam giac cong cu van hanh web

### Layout de xuat

Desktop:
- table/grid ro cot
- sticky toolbar tren cung
- sticky header cho table neu danh sach dai

Cot de xuat:
- Ma NV
- Ho ten
- SDT
- Email
- Chi nhanh
- Chuc danh
- Trang thai lam viec
- Trang thai tai khoan
- Thao tac

Mobile:
- giu card list
- nhung can compact hon

Toolbar:
- search
- loc chi nhanh
- loc trang thai lam viec
- loc trang thai tai khoan
- CTA:
  - `Loi moi nhan vien`
  - `Them truc tiep`

---

## B2. Danh sach Loi moi

### Van de hien tai

- da co table-like grid
- nhung nhieu thong tin quan trong dang nam trong modal
- trang thai gui email chua hien
- reviewer phai click sau moi thay ro

### Layout de xuat

Desktop:
- table 2 tang thong tin
- panel ben phai hoac drawer khi chon row

Cot de xuat:
- Ung vien
- SDT / Email
- Chi nhanh / Vi tri
- Trang thai invitation
- Trang thai gui
- Do hoan thien
- Ngay gui
- Thao tac

Can co bulk scan:
- badge `Cho duyet`
- badge `Gui loi`
- badge `Can bo sung`

---

## B3. Chi tiet nhan vien

### Van de hien tai

- dang theo kieu mobile app detail
- header va stats tot cho mobile
- nhung tren desktop chua toi uu cho HR

### Layout de xuat

Desktop:
- 2 cot
- cot trai:
  - avatar
  - ten
  - ma NV
  - chi nhanh
  - trang thai
  - completeness
- cot phai:
  - tabs `Ca nhan / Cong viec / Lich su`
  - noi dung tab rong va de quet

Them can co:
- profile completeness bar
- badge tai khoan
- badge tinh trang lam viec
- quick actions:
  - `Cap nhat`
  - `Khoa tai khoan`
  - `Chuyen trang thai`

Mobile:
- giu vertical stack
- tabs sticky nho gon

---

## B4. Tao loi moi

### Van de hien tai

- da co nhieu phan can
- nhung can ro hon theo desktop-admin

### Layout de xuat

Desktop:
- 2 cot 6/6 hoac 7/5
- cot trai:
  - thong tin ung vien
  - thong tin cong viec
  - cau hinh email
- cot phai:
  - preview email
  - checklist truoc khi gui

Checklist truoc khi gui:
- da chon chi nhanh
- da chon vi tri
- da co email/phone
- da chot han hoan tat

---

## B5. Candidate self-fill form

### Van de hien tai

- dung duoc, de hieu
- nhung con dam chat demo
- visual tone khac kha xa voi admin

### De xuat

Giu route mock hien tai cho dev/test.

Them 2 mode:
- `mock mode`
- `invitation mode`

Trong `invitation mode`:
- khong hien dropdown chon invitation
- vao la thay dung 1 ho so
- CTA ro:
  - `Gui thong tin`

Trong `mock mode`:
- moi hien selector de test

---

## Phan C. Definition of Done moi

De goi phan nay xong, can dat:

1. HR sua duoc noi dung email trong pham vi cho phep
2. HR preview duoc email truoc khi gui
3. He thong luu duoc `trang thai gui`
4. Co `Gui` va `Gui lai`
5. Danh sach loi moi hien duoc `trang thai invitation` va `trang thai gui`
6. Candidate form co `invitation mode` ro rang
7. Danh sach nhan vien duoc toi uu lai cho desktop
8. Chi tiet nhan vien duoc toi uu lai cho desktop
9. UI tong the dong bo hon, it cam giac demo hon

---

## Phan D. Thu tu trien khai de xuat

### Sprint 1

- bo sung `send_status`
- bo sung `sendInvitation / resendInvitation`
- UI `Gui`, `Gui lai`, `Trang thai gui`
- cap nhat `Tao loi moi` voi khu `Edit + Preview email`

### Sprint 2

- nang cap `/employees` sang desktop table-first
- nang cap `/employees/[id]` sang detail desktop 2 cot
- toi uu `/employees/invitations`

### Sprint 3

- tach `candidate form` thanh `mock mode` va `invitation mode`
- lam ro flow public/mock exception
- polish wording / states / empty states

---

## Phan E. Khuyen nghi thuc te

Neu can chon viec de lam ngay, thu tu tot nhat la:

1. Hoan thien `email send state + edit preview`
2. Refactor `Danh sach nhan vien` cho desktop
3. Refactor `Chi tiet nhan vien` cho desktop
4. Sau do moi quay lai polish candidate form

Ly do:
- email gui la logic nghiep vu con thieu ro rang nhat
- layout danh sach/chi tiet la diem user nhin thay ngay va anh huong trai nghiem web nhieu nhat

---

## Phan F. Nang cap hop dong nhan su

### F1. Muc tieu

Lam mot khu `Hop dong` dung duoc nhu san pham that:
- HR chon san template theo vi tri / loai nhan su / chi nhanh
- he thong tu dien du lieu nhan su, noi quy, quy dinh cua hang, muc luong, phu cap, ngay hieu luc
- HR xem truoc, sua cac truong duoc phep sua, roi gui cho nhan su ky tren app
- sau khi ky xong, hop dong duoc chot version va lien ket voi ho so nhan su + payroll

Muc tieu cuoi:
- khong phai soan contract tu dau moi lan
- khong bi sai du lieu do copy tay
- co luong ky ro rang, co lich su, co trang thai, co bang chung
- phu hop mo hinh F&B: nhieu vi tri, nhieu chi nhanh, nhieu quy dinh rieng theo cua hang

### F2. Pham vi san pham

Nang cap nay nen gom 4 lop:

1. `Template library`
- mau hop dong theo vi tri: barista, cashier, shift leader, store manager, area manager, HR
- mau theo loai nhan su: full-time, part-time, probation, internship, seasonal
- mau theo nhom chi nhanh: standard store, flagship, kiosk, delivery-only

2. `Contract builder`
- khung tao hop dong co block
- block co the khoa / mo khoa
- block co the map du lieu tu app

3. `Signing flow`
- gui hop dong cho nhan su ky tren app
- nhan su xem, dong y, ky so / ky dien tu / xac nhan OTP
- HR ky lai hoac countersign neu can

4. `Contract archive`
- luu version, file snapshot, trang thai, log ky
- contract da ky khong sua truc tiep, chi tao ban moi

### F3. Template de xuat

Moi template nen co 2 lop:

#### Lop co dinh
Khong sua tay trong san pham van hanh:
- ten cong ty / chi nhanh
- loai hop dong
- chuc danh / vi tri
- ngay hieu luc
- muc luong / phu cap / thoi gian thu viec
- phan quy dinh bat buoc

#### Lop co the cai bien
Sua trong app theo tung lan tao:
- ten nhan su
- CCCD / so ho chieu
- dia chi / so dien thoai / email
- ten store / bo phan / quan ly truc tiep
- bank info
- ngay bat dau
- ngay ket thuc thu viec neu co
- cac ghi chu phu hop voi ca lam / model cua hang

### F4. Placeholder du lieu

Nen support placeholder ro rang de copy ra san pham that:
- `{{employee.full_name}}`
- `{{employee.cccd}}`
- `{{employee.address}}`
- `{{employee.phone}}`
- `{{employee.email}}`
- `{{employee.bank_name}}`
- `{{employee.bank_account}}`
- `{{store.name}}`
- `{{store.address}}`
- `{{store.manager_name}}`
- `{{position.name}}`
- `{{position.level}}`
- `{{contract.start_date}}`
- `{{contract.end_date}}`
- `{{salary.official}}`
- `{{salary.probation}}`
- `{{salary.kpi}}`
- `{{policy.work_rules}}`
- `{{policy.dress_code}}`
- `{{policy.cash_handling}}`
- `{{policy.food_safety}}`
- `{{policy.attendance}}`
- `{{policy.overtime}}`
- `{{policy.discipline}}`

### F5. Noi dung hop dong nen co

Hop dong F&B khong chi la luong. Nen co day du cac nhom sau:
- thong tin hai ben
- vi tri / bo phan / chi nhanh
- thoi han hop dong
- che do lam viec / khung gio / ca xoay
- luong co ban / KPI / phu cap / OT / thu viec
- bhxh / bhyt / bhtn theo version chinh sach
- tip pool / service charge neu ap dung
- quy dinh chot ca / dong tien / lech tien / hu hong
- quy dinh ve ve sinh an toan thuc pham
- quy dinh dong phuc / tac phong / doi ca / di muon / ve som
- bao mat du lieu / tai san / mat mat hang hoa
- dieu khoan cham dut / bo viec / ban giao
- dong y ky dien tu / ky so tren app

### F6. Flow nghiep vu

#### Flow 1. Tao hop dong tu loi moi
1. HR hoan tat invitation
2. HR chon template hop dong
3. he thong tu lay du lieu nhan su va cua hang
4. HR xem preview, chinh cac truong cho phep sua
5. HR gui hop dong cho nhan su

#### Flow 2. Nhan su ky tren app
1. nhan su mo dong hop dong trong app
2. xem noi dung, file, phu luc, quy dinh cua hang
3. tick dong y
4. ky dien tu / nhap OTP / xac nhan thiet bi
5. hop dong chuyen sang trang thai da ky boi nhan su

#### Flow 3. HR countersign
1. HR xem hop dong da ky boi nhan su
2. check du lieu, chot version
3. ky lai neu quy trinh yeu cau
4. hop dong chuyen sang `active`
5. ho so nhan su va payroll duoc mo khoa theo ngay hieu luc

#### Flow 4. Tao ban moi
1. neu thay doi luong, quy dinh, chi nhanh, vi tri
2. tao phien ban moi cua template
3. hop dong cu giu lich su
4. hop dong moi co ngay hieu luc moi
5. khong sua chong len ban cu

### F7. Trang thai de xuat

Template:
- `draft`
- `active`
- `archived`

Contract:
- `draft`
- `pending_employee_sign`
- `signed_by_employee`
- `pending_hr_sign`
- `active`
- `rejected`
- `expired`
- `void`
- `superseded`

### F8. Man hinh can co

1. `Contract template library`
- xem template theo loai vi tri
- tao moi / clone / archive
- xem block nao khoa, block nao sua duoc

2. `Contract builder`
- cot trai: form du lieu
- cot giua: noi dung hop dong
- cot phai: preview
- co checklist truoc khi gui

3. `Contract inbox`
- hop dong cho ky
- hop dong da gui
- hop dong cho HR ky
- hop dong het han

4. `Contract detail`
- file snapshot
- version history
- log ky
- link tai ve PDF

### F9. Quy tac F&B rieng

Phan nay nen co block rieng cho F&B:
- quy dinh chot ket tien cuoi ca
- quy trinh ban giao may POS / quet QR / do kho / nguyen lieu
- quy dinh hu hong, mat mat, sai quy trinh
- quy dinh tip/service charge
- quy dinh train ca, opening shift, closing shift
- quy dinh an toan thuc pham, ve sinh ca lam
- quy dinh lam viec luan chuyen giua store neu co

### F10. Gia tri can dat

Sau khi lam xong phan nay:
- HR khong con soan contract bang tay
- nhan su ky hop dong ngay trong app
- template co the dung lai theo vi tri va chi nhanh
- noi quy cua hang duoc gan vao hop dong, khong bi tach roi
- payroll va employee record khop nhau hon
- co version ro rang de tranh tranh chap sau nay

### F11. Thu tu lam de xuat

Sprint 1:
- template library
- placeholders
- preview contract

Sprint 2:
- signing flow trong app
- trang thai contract
- archive version

Sprint 3:
- countersign cua HR
- lien ket voi employee profile + payroll
- F&B specific clauses

### F12. Definition of Done

Phan hop dong nay chi goi la xong khi:
1. co it nhat 1 bo template theo vi tri
2. co placeholder tu dong do du lieu
3. co preview truoc khi gui
4. co luong ky tren app
5. co trang thai va lich su version
6. co hop dong F&B co block noi quy cua hang
7. co lien ket voi ho so nhan su va payroll
