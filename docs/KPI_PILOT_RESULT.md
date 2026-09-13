# KPI Pilot Result

## 1. Thong tin chung

- Ngay ghi nhan: `2026-08-22`
- Kieu pilot: nghiem thu nghiep vu tren seed/mock hien co
- Cua hang pilot: `store_001`
- Ky KPI pilot: `2026-08`
- KPI version: `kpi_set_2026_08_v1`

## 2. Du lieu dau vao pilot

### Nhan su trong ky

| ID | Cap bac | Ghi chu |
| --- | --- | --- |
| `emp_pt1` | `pt1_pc` | Co POS nhap tay dang cho xac nhan |
| `emp_pt2` | `pt2` | Co POS da confirmed |
| `emp_senior` | `senior` | Co service source ready |
| `emp_leader` | `shift_leader` | Co vi du leader dieu chinh diem |

### Nguon du lieu da thay trong pilot

| Nguon | So luong / trang thai |
| --- | --- |
| Attendance hours | 4/4 nhan su co |
| POS nhap tay | 2 ban ghi |
| POS confirmed | 1 ban ghi (`emp_pt2`) |
| Service ready | 1 ban ghi (`emp_senior`) |

## 3. Ket qua chay KPI thang

### 3.1 Muc tieu nghiem thu

- Mo duoc ky KPI cho 1 cua hang
- Leader vao duoc workspace cham
- CEO cong bo va mo cua so appeal
- Nhan vien xem duoc ket qua

### 3.2 Ket qua

| Hang muc | Ket qua |
| --- | --- |
| Dashboard KPI theo role | Dat |
| Quan ly ky KPI | Dat |
| Workspace cham KPI | Dat |
| Ket qua ca nhan | Dat |
| Bao cao KPI scoped | Dat |
| Navigation theo role | Dat |

### 3.3 Ghi chu nghiem thu

- Dashboard `/kpi` da tach role ro hon:
  - Nhan vien vao ket qua cua minh
  - Leader vao review va incidents
  - HR/CEO vao periods, reports, settings, promotion
- Bao cao `/kpi/reports` da scope theo quyen va hien du:
  - 4 macro cards
  - trend
  - risk list
  - appeal SLA
  - incident recurrence
  - promotion pipeline
  - leaderboard

## 4. Ket qua appeal va incident

### 4.1 KPI appeal

Kha nang da nghiem thu:
- Tinh deadline 48 gio
- Nhan vien chi duoc gui appeal cho ho so cua minh
- Bat buoc co ly do
- Can it nhat evidence hoac criterion doi chieu
- CEO moi duoc ket luan

Trang thai mong doi trong pilot:
- `submitted`
- `reviewing`
- `approved` / `partially_approved` / `rejected`

### 4.2 Incident appeal

Kha nang da nghiem thu:
- Tao incident appeal trong 48 gio
- CEO co the:
  - giu nguyen
  - doi phan loai
  - doi muc tac dong
  - huy incident

Canh bao:
- Pilot nay chua ghi nhan mot bo incident full du lieu thuc te tu van hanh cua cua hang.
- Neu can nghiem thu thuc dia, van nen lay them 1 case POS nhap sai / food app / attendance de doi chieu.

## 5. Ket qua ho so thang tien

### 5.1 Ho so full flow de demo

| Ho so | Trang thai | Ket qua |
| --- | --- | --- |
| `dossier_quan` | Ready for appointment | Dat |
| `dossier_mai` | In testing | Dat |
| `dossier_han` | Blocked | Dat |

### 5.2 Ho so `dossier_quan`

- Nhan su: `Nguyen Minh Quan`
- Tuyen: `PT2 -> Senior`
- Ket qua:
  - du dieu kien dau vao
  - bai test da pass
  - challenge da pass
  - co de xuat luong
  - san sang bo nhiem

Bang chung tren UI:
- `/kpi/promotion`
- `/kpi/development/tests`
- `/kpi/development/challenges`

### 5.3 Ho so `dossier_mai`

- Nhan su: `Tran Hoang Mai`
- Tuyen: `Senior -> Shift Leader`
- Ket qua:
  - du dieu kien vao test
  - bai test lan 1 chua qua san tung phan
  - da len lich test lai
  - chua mo challenge
  - chua co salary decision

Y nghia nghiem thu:
- Chung minh he thong co duong lui an toan, khong ep cho challenge khi bai test chua dat.

### 5.4 Ho so `dossier_han`

- Nhan su: `Le Gia Han`
- Tuyen: `PT1 -> PT2`
- Ket qua:
  - bi chan o checklist
  - chua vao test
  - chua co challenge
  - chua co salary suggestion

Y nghia nghiem thu:
- Chung minh he thong co chan dau vao bang KPI / warning, khong cho nhay buoc.

## 6. So lieu tong hop pilot

| Chi so | Ket qua hien tai |
| --- | --- |
| Cua hang pilot | 1 |
| Ky KPI pilot | 1 |
| Nhan su trong ky | 4 |
| KPI version publish | 1 |
| Phieu KPI seed | 4 |
| Nguon POS nhap tay | 2 |
| Ho so thang tien mau | 3 |
| Ho so full flow de demo | 1 |
| Ho so test lai | 1 |
| Ho so bi chan | 1 |

## 7. Du lieu thieu / viec con phai lam tay

Nhung viec van can Excel hoac nhap tay trong pilot hien tai:

1. POS doanh thu theo ca van dang la nguon nhap tay / xac nhan tay.
2. Chua co bo du lieu incident thuc te cua 1 cua hang de chay nghiem thu full incident -> appeal -> tac dong KPI.
3. Chua co du lieu luong thuc te dong bo backend that cho salary decision sau bo nhiem.
4. Chua co file xuat chuan Excel nghiem thu cuoi ky cho HR ky nhan.

## 8. Loi quyen va debt ky thuat can theo doi

Ghi nhan tai thoi diem `2026-08-22`:

- Test KPI trong scope da pass.
- Full `tsc --noEmit` toan repo chua pass vi loi cu ngoai scope KPI pilot.
- `npm run ai:ready` dang fail do `STATUS` hien tai la `DONE`, trong khi script guard doi `APPROVED` hoac `REVIEWING`.

Nhung diem nay khong chan viec demo luong KPI SaaS trong pilot, nhung se chan khi chuyen sang buoc chot production.

## 9. Ket luan

### 9.1 Gate mo rong

Quyet dinh gate hien tai:
- Demo/pilot nghiep vu: `PASS`
- Mo rong sang van hanh that nhieu cua hang: `HOLD`

Ly do chua mo rong ngay:
1. Nguon POS van con nhap tay va xac nhan tay, chua du 100% tu dong.
2. Chua co bo incident thuc te day du de nghiem thu tron vong incident -> appeal -> tac dong KPI.
3. Salary decision sau bo nhiem chua dong bo backend that va du lieu luong that.
4. Full kiem tra ky thuat toan repo chua xanh, trong do `tsc --noEmit` con loi cu ngoai scope va `npm run ai:ready` dang fail do guard `STATUS`.

Dieu kien de mo gate o buoc tiep theo:
- POS that vao on dinh cho cua hang pilot.
- Co it nhat 1 bo incident thuc te chay het appeal va ket luan CEO.
- Chot du lieu luong / salary decision theo nguon that.
- Don sach cac loi ky thuat dang chan buoc chot production.

Ket luan hien tai:
- Luong KPI SaaS co the demo duoc cho 1 cua hang, 1 ky KPI va 1 ho so thang tien mau.
- Phan role, review, result, reports, promotion da du ro de nghiem thu nghiep vu.
- De chuyen tu pilot sang van hanh that, uu tien tiep theo la:
  - dong bo nguon POS that
  - dong bo incident that
  - lam sach debt TypeScript toan repo
  - chot file xuat nghiem thu cuoi ky cho HR
