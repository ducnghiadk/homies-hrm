# KPI Pilot Runbook

## 1. Muc tieu pilot

Pilot nay dung de chay thu luong KPI SaaS tren 1 cua hang, 1 ky KPI va 1 ho so thang tien mau, de tra loi 4 cau hoi:

1. He thong co chay du duong di tu mo ky -> cham -> CEO duyet -> cong bo -> khiu nai -> khoa ky khong?
2. Leader co du thong tin de cham va dieu chinh diem co ly do/bang chung khong?
3. Nhan vien co xem duoc ket qua va gui khiu nai trong 48 gio khong?
4. Pipeline thang tien co nhin ro du dieu kien, bai test, challenge va de xuat luong khong?

## 2. Pham vi pilot

- Cua hang: `store_001`
- Ky KPI: `2026-08`
- KPI version: `kpi_set_2026_08_v1`
- Phien ban draft ke tiep: `kpi_set_2026_09_v2`
- Nguon du lieu: local repository seed + mock source trong `kpiAdapter`
- Ngay tham chieu de chay pilot: `2026-08-22`

## 3. Danh sach nhan su pilot

| Nhan su | ID | Cap bac | Vi tri | Vai tro trong pilot |
| --- | --- | --- | --- | --- |
| PT1 Pha che | `emp_pt1` | `pt1_pc` | `cashier` | Ca co POS nhap tay dang cho xac nhan |
| PT2 | `emp_pt2` | `pt2` | `barista` | Ca co POS da xac nhan, dung de xem diem dep hon |
| Senior | `emp_senior` | `senior` | `senior_barista` | Co nguon service ready |
| Shift Leader | `emp_leader` | `shift_leader` | `shift_leader` | Co final score nhom ky luat va duoc dung de review |

## 4. Vai tro tham gia pilot

| Vai tro | Tai khoan / actor | Viec can lam |
| --- | --- | --- |
| HR Admin | `hr_admin_01` | Mo ky, chon nhan su, quan ly config |
| Leader | `leader_01` hoac role `shift_leader` / `store_manager` | Xac nhan POS nhap tay, cham va submit |
| CEO | `ceo_01` | Publish, preapprove, quyet dinh khiu nai, salary decision |
| Nhan vien | chinh chu ho so | Xem ket qua va gui khiu nai |

## 5. Du lieu nguon pilot da co san

### 5.1 KPI va ky KPI

- KPI version `kpi_set_2026_08_v1` da publish luc `2026-08-01 09:00`
- Ky `period_2026_08_store_001` da mo cho `store_001`
- Trang thai seed hien tai: `leader_scoring`
- 4 nhom KPI:
  - Doanh thu
  - Dich vu khach hang
  - Van hanh
  - Ky luat

### 5.2 Nguon tu dong / nhap tay

| Nhan su | Nguon | Trang thai | Gia tri |
| --- | --- | --- | --- |
| `emp_pt1` | Attendance | Co san | `92` gio |
| `emp_pt1` | POS nhap tay | `proposed` | `88` |
| `emp_pt2` | Attendance | Co san | `96` gio |
| `emp_pt2` | POS nhap tay | `confirmed` | `91` |
| `emp_senior` | Attendance | Co san | `104` gio |
| `emp_senior` | Service | `ready` | `4.6` |
| `emp_leader` | Attendance | Co san | `110` gio |

### 5.3 Phieu KPI seed

- `eval_emp_pt1_2026_08`
- `eval_emp_pt2_2026_08`
- `eval_emp_senior_2026_08`
- `eval_emp_leader_2026_08`

Ghi chu:
- `emp_pt1`, `emp_pt2` dang co `total_score = 4`
- `emp_senior`, `emp_leader` dang co `total_score = 3`
- `emp_leader` co vi du final score o nhom ky luat + ly do dieu chinh

## 6. Luong chay pilot KPI thang

### Buoc 1 - Kiem tra config

Vao:
- `/kpi/settings`
- `/kpi/periods`

Can xac nhan:
- Version `kpi_set_2026_08_v1` la ban dang dung
- Ky `2026-08` cua `store_001` co 4 nhan su
- Nhom KPI va trong so dung nhu policy

### Buoc 2 - Thu thap va xac nhan nguon

Vao:
- `/kpi/review`

Can lam:
1. Mo ky `2026-08`
2. Chon `emp_pt1`
3. Kiem tra POS nhap tay dang o trang thai cho leader xac nhan
4. Chon `emp_pt2`
5. Kiem tra POS da confirmed
6. Chon `emp_senior`
7. Kiem tra nguon service da ready

Dat neu:
- Man review hien ro nguon nao thieu, nguon nao proposed, nguon nao confirmed
- Leader co the nhin thay bang chung nguon

### Buoc 3 - Leader cham va submit

Vao:
- `/kpi/review`

Can lam:
1. Leader cham tung nhan su
2. Neu sua diem goi y, bat buoc nhap ly do
3. Neu cham diem duoi nguong, bat buoc co bang chung
4. Bam submit

Dat neu:
- He thong chan submit khi thieu diem / thieu ly do / thieu bang chung
- Sau khi hop le, phieu chuyen sang `submitted`

### Buoc 4 - CEO preapprove va cong bo

Vao:
- `/kpi/periods`
- `/kpi`

Can lam:
1. Chuyen ky tu `leader_scoring` -> `ceo_preapproval`
2. Chuyen tiep sang `published`
3. Sau do mo `appeal_window`

Dat neu:
- KPI dashboard doi so metric theo trang thai moi
- Nhan vien vao `/kpi/result` thay duoc ket qua da cong bo

### Buoc 5 - Nhan vien xem ket qua va gui khiu nai

Vao:
- `/kpi/result`

Can lam:
1. Chon 1 nhan su co ket qua da cong bo
2. Kiem tra countdown 48 gio
3. Gui 1 monthly appeal co ly do va evidence

Dat neu:
- Appeal duoc tao trong han 48 gio
- Appeal co `status = submitted`
- Deadline tinh tu ngay publish

### Buoc 6 - CEO xu ly khiu nai va khoa ky

Vao:
- `/kpi/periods`
- neu la appeal KPI: theo queue/ket qua KPI hien co
- neu la incident appeal: `/kpi/violations/appeals`

Can lam:
1. CEO xem ho so appeal
2. Quyết dinh `approved`, `partially_approved` hoac `rejected`
3. Khoa ky sau khi het cua so appeal

Dat neu:
- Quy trinh ket thuc o `locked`
- Nhan vien khong con sua / gui them

## 7. Luong chay pilot ho so thang tien

### Ho so khuyen nghi dung de demo full nhat

Dung ho so mau `dossier_quan` trong `/kpi/promotion`.

Thong tin chinh:
- Nhan su: `Nguyen Minh Quan`
- Tuyen: `PT2 -> Senior`
- Test tao ngay `2026-08-22`
- Challenge duoc CEO mo ngay `2026-08-23`
- Final challenge pass ngay `2026-10-07`
- De xuat luong: band `31,000 - 36,000 / gio`

### Luong demo

1. Vao `/kpi/promotion`
2. Chon ho so `Nguyen Minh Quan`
3. Kiem tra checklist eligibility
4. Mo `/kpi/development/tests`
5. Xem bai test 3 phan, tong diem va ket qua pass
6. Mo `/kpi/development/challenges`
7. Xem moc week 2, week 4, final
8. Quay lai `/kpi/promotion`
9. Xem de xuat salary va ghi chu bo nhiem

Dat neu:
- Co the giai thich ro he thong detect -> leader propose -> test -> challenge -> salary
- Moi buoc co note, actor va moc thoi gian

### Ho so dung de demo nhanh truong hop chua dat

Dung `dossier_mai`:
- Dang o trang thai test lai
- Chua mo challenge
- Chua co quyet dinh luong

Dung `dossier_han`:
- Bi chan o checklist dau vao
- Chua vao test

## 8. Checklist nghiem thu

### KPI thang

- [ ] Co 1 ky KPI cho 1 cua hang
- [ ] Co 4 nhan su trong ky
- [ ] Co it nhat 1 nguon POS nhap tay
- [ ] Leader cham duoc va submit duoc
- [ ] CEO cong bo duoc
- [ ] Nhan vien xem ket qua duoc
- [ ] Gui duoc 1 appeal trong 48 gio
- [ ] CEO ket luan appeal duoc
- [ ] Khoa ky duoc

### Thang tien

- [ ] Co 1 ho so du dieu kien
- [ ] Co 1 bai test da cham xong
- [ ] Co 1 challenge co checkpoint
- [ ] Co 1 salary suggestion
- [ ] Co 1 ho so test lai hoac deferred

## 9. Cach ghi ket qua pilot

Sau khi chay xong, cap nhat `docs/KPI_PILOT_RESULT.md` theo 4 nhom:

1. Ket qua KPI thang
2. Ket qua appeal / incident
3. Ket qua ho so thang tien
4. Nhung viec van phai dung Excel tay

## 10. Ghi chu quan trong

- Pilot hien tai la demo nghiep vu tren du lieu seed/mock, chua phai du lieu van hanh that.
- Neu chay bang local repository, reset seed se mat ket qua vua thao tac.
- Full verification toan repo ngay `2026-08-22` chua xanh 100%, nen pilot nay dung de nghiem thu luong nghiep vu KPI SaaS trong scope hien tai.
