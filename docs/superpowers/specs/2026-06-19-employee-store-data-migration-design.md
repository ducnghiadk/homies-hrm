# Thiet ke migration du lieu chi nhanh va nhan vien

**Ngay:** 2026-06-19  
**Trang thai:** Cho nguoi dung duyet spec  
**Pham vi:** thay du lieu `store` va `employee` trong app bang file HRM cu, nhung giu app dang chay on dinh

## 1. Muc tieu

Huong duoc chot la thay du lieu co kiem soat:

1. Thay danh sach chi nhanh va nhan vien van hanh bang du lieu cu.
2. Giu lai `ceo`, `hr_admin`.
3. Giu nguyen user dang test onboarding va record onboarding lien quan.
4. Khong bat buoc mo UI cho moi cot ngay dot dau; uu tien giu du lieu va giu app song.

## 2. Rang buoc he thong

App dang bam vao `store_id` va `employee_id` o nhieu luong: auth, employee service, scheduling, KPI, attendance, communication, onboarding.

Vi vay khong the xoa demo du lieu theo cach tay chan. Migration phai co whitelist bao ton va reset co kiem soat.

## 3. Nguon du lieu da xac nhan

File Excel nhan vien da doc co:

1. 14 nhan vien
2. 2 chi nhanh: `HBP - Tra sua pho mai tuoi HOMIES`, `429 - Tra Sua Pho Mai Tuoi Homies`
3. 2 nhan vien thieu `Ma nhan vien`
4. 1 nhan vien thieu `CCCD`
5. nhieu gia tri `-`, `--`, rong can chuan hoa

## 4. Pham vi du lieu sau migration

### 4.1 Nhom bao ton

- `ceo`
- `hr_admin`
- toan bo user dang test onboarding
- onboarding plans, onboarding policy records, va record lien quan truc tiep den nhom tren

Quy tac: giu nguyen `id`, `email`, `role`, `store_id`, va khong de file HRM cu ghi de nhom nay.

### 4.2 Nhom thay the

Tat ca nhan vien cua hang/van hanh khong nam trong whitelist bao ton se duoc thay bang du lieu file HRM cu.

## 5. Thiet ke chi nhanh moi

Chi nhanh moi se duoc tao tu file cu, khong dung danh sach demo hien tai.

Quy tac:

1. Moi chi nhanh co `store_id` on dinh, khong dua truc tiep vao ten hien thi day du.
2. Ten hien thi lay tu file cu sau khi chuan hoa.
3. Dot dau co the dung ma nhu `store-hbp`, `store-429`.

Moi store can toi thieu:

- `id`
- `org_id`
- `name`
- `address`
- `phone`
- `is_active`

## 6. Thiet ke nhan vien moi

### 6.1 Field cot loi can hoat dong ngay

- `employee_code`
- `full_name`
- `phone`
- `email`
- `hire_date`
- `store_id`
- `position_id`
- `role`
- `status`
- `date_of_birth`
- `gender`
- `cccd`
- `address`
- `emergency_contact`

### 6.2 Field mo rong giu trong model truoc

- `job_level`
- `employee_type`
- `official_salary`
- `bank_name`
- `bank_account`
- `permanent_address`
- `current_address`
- `branch_join_date`
- `official_branch_join_date`
- `marital_status`
- `ethnicity`
- `religion`
- `cccd_issue_date`
- `tax_code`
- `resignation_date`
- `resignation_reason`
- `contract_type`

### 6.3 Quy tac map

1. Sinh `id` noi bo on dinh, khong dung `employee_code` lam `id`.
2. Dong thieu `Ma nhan vien` duoc cap ma tu dong, vi du `NV-AUTO-001`.
3. `Quan ly diem ban hang` -> `store_manager`.
4. `Nhan vien` -> `employee`.
5. Neu co `Ngay nghi viec` -> `resigned`, con lai uu tien `active` tru khi dang la user onboarding bao ton.
6. Dot dau cho phep map frontline ve 1 `position_id` mac dinh neu file cu chua du thong tin tach vai tro chi tiet.

## 7. Truong chua lo day du tren UI

UI hien tai da co cho: ho ten, sdt, email, ngay vao lam, chi nhanh, chuc danh, vai tro, trang thai, ngay sinh, gioi tinh, cccd, dia chi, lien he khan cap.

Nhung cac field sau chua lo ro tren UI nhan vien chinh, nen dot dau chi can giu trong model:

- thong tin ngan hang
- ma so thue
- loai hop dong
- ngay gia nhap chi nhanh
- ngay gia nhap chi nhanh chinh thuc
- dia chi thuong tru tach rieng
- dia chi hien tai tach rieng
- tinh trang hon nhan
- dan toc
- ton giao
- ngay cap cccd
- ngay nghi viec
- ly do nghi viec

## 8. Chien luoc reset du lieu phu thuoc

Can reset neu dang bam demo cu:

- employee database van hanh cu
- store demo cu
- schedule/open shifts/preferences/registration demo cu
- KPI/violation/report demo cu
- communication group demo cu
- attendance demo cu

Khong reset:

- setting he thong tong quat
- onboarding settings/template
- du lieu onboarding cua nhom user bao ton

## 9. Luong migration

1. Doc file HRM cu.
2. Chuan hoa cot va gia tri rong (`-`, `--`, `None` -> rong).
3. Chuan hoa ten chi nhanh.
4. Sinh ma cho dong thieu `Ma nhan vien`.
5. Tach nhom whitelist bao ton de khong bi ghi de.
6. Tao output stores moi.
7. Tao output employees moi da map role/status/position/store.
8. Nap lai du lieu employee/store va reset dataset phu thuoc demo cu.

## 10. Error handling va test

Migration phai dung va bao loi ro neu:

1. file khong doc duoc
2. khong map duoc chi nhanh
3. trung email/phone voi user bao ton theo cach gay mat du lieu
4. khong map duoc `position_id` toi thieu
5. tao output bi trung `employee_code` hoac `id`

Can test:

1. `ceo`, `hr_admin`, user onboarding van login duoc
2. flow onboarding dang test van mo dung
3. employee list hien chi nhanh moi va nhan vien moi
4. local storage reset khong quet sach setting can giu

## 11. Tieu chi hoan thanh

1. App hien danh sach chi nhanh moi va nhan vien moi theo file cu.
2. `ceo`, `hr_admin`, va user onboarding dang test van dung duoc.
3. Du lieu onboarding cua nhom bao ton khong mat.
4. Dataset demo cu khong con lam sai dashboard/logic chinh.
5. Field chua co UI van duoc giu trong model de mo rong sau.
