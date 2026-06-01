# STAGE 1 STATUS CHECKLIST

## Ket luan hien tai

`Giai doan 1: Nhan su co ban` da dat muc:
- `MVP DONE`
- co the demo tron ven
- co the dung de di tiep sang `Giai doan 2: Lich lam`

Noi cach khac:
- nghiep vu cot loi da khép
- UI/UX da ro hon va hop web admin hon truoc
- van con cho de polish sau, nhung khong con chan flow chinh nua

---

## Nhung gi da xong

### 1. Loi moi nhan vien

Trang thai:
- `DONE`

Da co:
- `/employees/invitations`
- `/employees/invitations/new`
- tao loi moi
- preview email co kiem soat
- gui email mock
- gui lai email
- trang thai gui:
  - `Chua gui`
  - `Da gui mail`
  - `Gui loi`
- luu snapshot noi dung email

### 2. Candidate self-fill flow

Trang thai:
- `DONE O MUC MVP`

Da co:
- `/employees/invitations/form`
- link candidate mo form va tu dien thong tin
- submit xong chuyen `pending_approval`
- route public/mock da tach rieng khoi invitation admin flow
- khi co `id` tren URL thi form hien theo mode loi moi truc tiep, khong con phu thuoc vao demo selector

Ghi chu:
- day van la `mock/public exception`
- neu muon dung that hon sau nay thi bo sung token/link secure

### 3. Cho duyet nhan vien moi

Trang thai:
- `DONE`

Da co:
- tab `Cho duyet`
- checklist/completeness
- field thieu
- modal chi tiet
- action:
  - `Duyet`
  - `Yeu cau bo sung`
  - `Tu choi`
- logic service chan duyet neu ho so chua du thong tin bat buoc

### 4. Danh sach nhan vien chinh thuc

Trang thai:
- `DONE`

Da co:
- `/employees`
- CTA uu tien `Loi moi nhan vien`
- search theo ten / ma NV / email / SĐT
- loc theo chi nhanh
- loc theo trang thai lam viec
- desktop-first table
- mobile card list
- phan biet:
  - trang thai lam viec
  - trang thai tai khoan

### 5. Ho so nhan vien chinh thuc

Trang thai:
- `DONE O MUC MVP`

Da co:
- `/employees/[id]`
- sidebar tong quan
- 3 cum:
  - `Ca nhan`
  - `Cong viec`
  - `Lich su hoat dong`
- muc do hoan thien ho so
- thong tin duoc promote tu invitation self-fill
- phu hop web desktop hon truoc

### 6. Role visibility

Trang thai:
- `DONE O MUC HIEN TAI`

Da co:
- `getEmployees(currentUser)`
- `getEmployeeById(id, currentUser)`
- `getInvitations(currentUser)`
- `getInvitationById(id, currentUser)`
- helper public rieng cho candidate flow:
  - `getPublicInvitationsForCandidate()`
  - `getPublicInvitationById()`

Rule hien tai:
- `ceo / hr_admin`: thay toan bo
- `store_manager / shift_leader`: thay trong chi nhanh minh
- `employee`: chi thay ho so cua minh

### 7. Logic trang thai

Trang thai:
- `DONE O MUC MVP`

Da co:
- invitation statuses
- send statuses
- work status
- account status
- service va UI da dong bo tot hon
- chan transition nhay coc o cac diem nguy hiem

---

## Nhung gi chua can chan Giai doan 1

Nhung muc nay con co the lam sau, nhung khong con chan viec chot Stage 1:
- email server that
- track email da mo / click
- secure invite token cho candidate
- lich su thay doi ho so day du
- desktop polish sau cho CEO/HR
- profile completeness nang cao hon

---

## Tieu chi da dat

Stage 1 duoc xem la da dat vi:
- HR tao loi moi duoc
- HR gui mail va biet gui thanh cong hay that bai
- ung vien tu dien thong tin duoc
- ho so vao cho duyet duoc
- reviewer co du thong tin de quyet dinh
- duyet xong thi tao thanh nhan vien chinh thuc
- nhan vien len danh sach va co ho so xem duoc
- role visibility da co lop chan co ban

---

## Buoc tiep theo de xuat

`Giai doan 2: Lich lam`

Nen bat dau voi:
1. data model cho shift / week schedule
2. man hinh lich tuan cua quan ly
3. man hinh lich ca nhan cua nhan vien
4. publish schedule
5. chan xep ca cho nhan vien khong hop le

---

## Chot

`Giai doan 1`:
- `DONE (MVP)`

Co the tiep tuc sang `Giai doan 2` ma khong bi thieu nen nghiep vu cot loi.
