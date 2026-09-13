# Gate tong ket chang onboarding dua tren self-review va de xuat buddy

Ngay: `2026-05-28`
Pham vi: `Pass B - Gate tong ket chang`
Trang thai: `approved-for-spec`

## 1. Muc tieu

Pass nay chi giai quyet 1 viec:

- them `gate tong ket chang` cho 2 moc cuoi cua onboarding
- dung du lieu self-review vua co
- cho buddy `de xuat`
- cho quan ly `duyet gate cuoi`
- neu chua duyet thi chi ro `1-3 item can lam lai`

Pass nay khong giai quyet:

- quiz
- timeline tong hop onboarding
- bao cao tong onboarding
- tach rieng UI theo track thu ngan/phuc vu va pha che
- gate cho moi chang nho

## 2. Ly do chon scope nay

Huong nay duoc chon vi:

- dung thu tu rollout ngan nhat
- dung lai du lieu self-review cua Pass A
- tap trung vao 2 moc co rui ro van hanh that
- giu gate o tay quan ly, khong de checklist tu cho qua chang

## 3. Pham vi gate da chot

Pass B chi gate 2 moc:

1. `ready_for_live_shift`
   - gate truoc khi nhan vien duoc vao `ca that co giam sat`

2. `ready_for_independent_shift`
   - gate truoc khi nhan vien duoc vao `tu chay ca co ban`

Pass nay khong gate:

- chang nen chung
- chang track vi tri o muc nho
- tung item checklist le

## 4. Vai tro cua self-review trong gate

Self-review trong Pass B dong vai tro:

- `bat buoc phai co` truoc khi manager duyet gate
- khong tu quyet dinh `dat` hay `rot`
- dung de buddy va quan ly doc tam ly thuc te cua nhan vien

Neu chua co self-review:

- buddy khong duoc de xuat gate
- manager khong duoc duyet gate

## 5. Vai tro cua tung nguoi

### 5.1. Nhan vien

Nhan vien:

- gui self-review truoc gate
- xem trang thai gate
- neu bi tra ve thi xem duoc `1-3 item can lam lai`

Nhan vien khong duoc:

- tu de xuat gate
- tu duyet gate

### 5.2. Buddy

Buddy la nguoi:

- theo sat ca that
- doc self-review
- xem item bat buoc con do
- bam `De xuat qua gate`
- ghi ghi chu de xuat ngan

Buddy khong duoc:

- tu duyet gate

### 5.3. Quan ly

Quan ly la nguoi:

- xem self-review moi nhat
- xem de xuat cua buddy
- xem item bat buoc con do
- bam `Duyet gate` hoac `Chua duyet`
- ghi ket luan ngan

Neu `Chua duyet`, quan ly phai chon ro `1-3 item can lam lai`.

## 6. Dieu kien gate da chot

Manager chi duoc bam `Duyet gate` khi dung ca 4 dieu kien:

1. da co self-review cho chang lien quan
2. buddy da `de xuat gate`
3. khong con item bat buoc dang `chua_dat` hoac `can_kem_lai`
4. manager ghi `ket luan ngan`

Self-review la `dieu kien vao gate`, khong phai `ket qua gate`.

## 7. Neu manager khong duyet

Neu manager bam `Chua duyet`:

- trang thai gate la `chua_qua_gate`
- chang hien tai duoc giu nguyen
- he thong bat buoc manager ghi ket luan ngan
- he thong bat buoc manager chon `1-3 item can lam lai`

Muc tieu:

- khong tra ve mo ho ca chang
- chi ro diem can buddy kem lai
- de nhan vien biet dang vuong o dau

## 8. Huong nghiep vu duoc chon

Huong duoc chon la:

`Gate record rieng co lich su quyet dinh`

Khong chon:

- gate card don gian khong co audit, vi sau nay kho doi chieu
- gate gan thang vao onboarding plan, vi de roi logic va kho giu lich su

Ly do chon huong nay:

- van gon scope
- co dau vet ro
- de noi tiep sang timeline/bao cao sau nay
- tach ro self-review, buddy de xuat, va manager quyet dinh

## 9. Cau truc gate record

Moi moc gate la 1 `gate record` rieng.

Gate record can co:

- `id`
- `employee_id`
- `onboarding_plan_id`
- `stage_code`
- `gate_code`
- `buddy_recommendation`
- `buddy_note`
- `manager_decision`
- `manager_note`
- `retry_item_ids`
- `created_at`
- `decided_at`

## 10. Trang thai gate

Trang thai gate da chot:

- `chua_de_xuat`
- `cho_quan_ly_duyet`
- `da_qua_gate`
- `chua_qua_gate`

Trang thai hien cho nhan vien co them wording nghiep vu:

- `Can kem lai`

`Can kem lai` la cach hien thi de de hieu.
No khong can la 1 status data rieng neu service da co `chua_qua_gate`.

## 11. Rule mo chang sau

Huong duoc chon:

`Duyet gate xong mo chang sau ngay, nhung luu dau vet gate rieng`

Rule cu the:

- gate `ready_for_live_shift` duyet xong:
  - mo chang `ca that co giam sat`

- gate `ready_for_independent_shift` duyet xong:
  - mo chang `tu chay ca co ban`

Neu `Chua duyet`:

- giu nguyen chang hien tai
- buddy thay dung item can lam lai
- nhan vien thay trang thai `Can kem lai`

## 12. Man hinh va thao tac

### 12.1. Man buddy

O chang co gate, buddy thay card `De xuat gate`.

Card hien:

- da co self-review chua
- con item bat buoc do nao khong
- ghi chu de xuat ngan
- nut `De xuat qua gate`

Sau khi de xuat:

- trang thai doi sang `Cho quan ly duyet`

Buddy khong thay nut `Duyet gate`.

### 12.2. Man quan ly

Quan ly thay hang doi `Gate can duyet` trong workspace onboarding.

Mo tung nguoi se thay:

- self-review moi nhat
- de xuat cua buddy
- item bat buoc con do
- nut `Duyet gate`
- nut `Chua duyet`

Neu `Chua duyet`:

- phai co `manager_note`
- phai co `1-3 retry_item_ids`

### 12.3. Man nhan vien

Nhan vien chi xem ket qua gate:

- `Dang cho quan ly chot gate`
- `Da qua gate`
- `Can kem lai`

Neu `Can kem lai`, nhan vien thay duoc:

- ghi chu manager
- `1-3 item can lam lai`

## 13. Rule UI va wording

Wording nghiep vu da chot:

- `Chưa đề xuất`
- `Chờ quản lý duyệt`
- `Đã qua gate`
- `Chưa qua gate`
- `Cần kèm lại`

Wording phai tranh:

- `pass/fail`
- `rot`
- `test`

Muc tieu la giu day la `gate van hanh`, khong bien thanh bai thi.

## 14. Ngoai scope ro rang

Pass B khong lam:

- manager cham tung item nho
- quiz
- timeline gate day du
- thong ke bao cao gate
- multi-level approve
- gate cho moi chang nho
- cho buddy override manager

## 15. Rui ro va cach giam

### 15.1. Rui ro gate thanh hinh thuc

Neu manager chi bam cho qua ma khong nhin du lieu, gate se vo nghia.

Cach giam:

- bat buoc co self-review
- bat buoc co de xuat buddy
- bat buoc manager ghi ket luan ngan

### 15.2. Rui ro tra ve mo ho

Neu manager chi bam `chua duyet` ma khong noi ro vuong dau, buddy kho kem lai.

Cach giam:

- bat buoc chon `1-3 item can lam lai`

### 15.3. Rui ro scope tran sang workflow lon

Neu them qua nhieu gate cho moi chang, pass B se qua to.

Cach giam:

- chi gate 2 moc cuoi

## 16. Verify muc tieu sau khi code

Can verify toi thieu:

- buddy chi de xuat gate duoc khi da co self-review va khong con item bat buoc do
- quan ly thay hang doi gate cho duyet
- quan ly duyet gate thi mo chang sau ngay
- quan ly chua duyet thi bat buoc ghi note va chon `1-3 item can lam lai`
- nhan vien thay trang thai `Dang cho quan ly chot gate` hoac `Can kem lai` dung theo ket qua

## 17. File huong den khi vao plan

File kha nang dong vao o pass code:

- `src/lib/career-path-types.ts`
- `src/lib/career-path-service.ts`
- `src/app/onboarding/page.tsx`
- `src/components/onboarding-employee/*`
- `src/app/career-path/onboarding/page.tsx`
- `src/components/onboarding-operations/*`
- `src/lib/services/onboarding-operations-service.ts`

Plan code phai giu dung rule:

- 1 pass
- co fail-first check nho
- khong tran sang quiz/timeline
- verify lint + build + smoke role
