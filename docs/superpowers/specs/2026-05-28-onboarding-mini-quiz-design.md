# Mini quiz onboarding theo chang va quiz cuoi

Ngay: `2026-05-28`
Pham vi: `Pass C - Mini test / quiz`
Trang thai: `approved-for-spec`

## 1. Muc tieu

Pass nay chi giai quyet 3 viec:

- them `mini quiz theo chang` de kiem tra nho nhanh sau tung chang chinh
- them `final quiz` de xac nhan nhan vien nam du output toi thieu truoc khi chot onboarding
- giu `quiz` thanh 1 flow rieng, de `gate tong ket chang` chi doc ket qua tom tat thay vi om logic cham bai

Pass nay khong giai quyet:

- editor tao/sua cau hoi tren man operations
- random de thi
- essay, upload video, hoac cham tay
- cap bang/chung chi sau onboarding
- bao cao tong hop quiz theo cua hang

## 2. Scope nghiep vu da chot

Huong da chot:

- `Hybrid`
  - moi chang onboarding chinh co the co `mini quiz`
  - cuoi onboarding co `final quiz`

- `Mixed`
  - `mini quiz` la `soft signal`
  - `final quiz` la `required pass`

- `Template only`
  - cau hoi va dap an nam trong mock/template theo vi tri
  - he thong cham tu dong
  - khong co thao tac sua template trong pass nay

## 3. Ly do chon scope nay

Huong nay duoc chon vi:

- giu rollout nho, khong mo them bai toan authoring
- tach ro `tu danh gia`, `quiz kien thuc`, va `gate quyet dinh`
- cho operations co them bang chung de doc truoc gate cuoi
- van giu gate o tay buddy/quan ly, tranh bien onboarding thanh flow hoc online tu dong

## 4. Vai tro cua quiz trong onboarding

Quiz trong Pass C dong vai tro:

- kiem tra muc nho va hieu quy trinh co ban
- tao dau vet hoc tap tach rieng theo chang
- bo sung them 1 tin hieu cho operations va quan ly khi xem gate

Quiz trong Pass C khong dong vai tro:

- thay buddy danh gia thuc hanh
- thay self-review cua nhan vien
- tu dong mo chang sau ma khong qua gate

## 5. Rule quiz theo chang va quiz cuoi

### 5.1. Mini quiz theo chang

Mini quiz:

- gan voi tung `stage_code`
- mo khi chang do da mo cho nhan vien
- nhan vien co the lam lai
- ket qua hien cho nhan vien, buddy, operations, quan ly
- khong chan buddy `de xuat gate`
- khong chan manager `duyet gate`

Mini quiz la `soft signal`.
Neu diem thap, operations va quan ly thay de canh bao, nhung van duoc phep quyet dinh gate dua tren tong hop thuc te.

### 5.2. Final quiz

Final quiz:

- la 1 quiz rieng, khong thuoc item checklist le
- mo khi nhan vien da den chang cuoi onboarding
- nhan vien co the lam lai
- phai `dat nguong` moi duoc xem la `passed`

Final quiz la `required pass`.
Neu chua dat nguong:

- manager khong duoc `approve gate cuoi`
- he thong van cho `reject gate`
- nhan vien thay ro rang trang thai chua dat va duoc lam lai

## 6. Vai tro cua tung nguoi

### 6.1. Nhan vien

Nhan vien:

- xem card quiz trong man onboarding
- lam mini quiz theo chang khi duoc mo
- lam final quiz khi duoc mo
- xem diem, trang thai dat/rot, va mot so cau can xem lai

Nhan vien khong duoc:

- sua dap an dung cua template
- xem dap an dung truoc khi nop bai

### 6.2. Buddy

Buddy:

- xem tom tat ket qua quiz gan nhat
- dung quiz nhu mot tin hieu phu khi kem cap
- van `de xuat gate` dua tren checklist, quan sat, va self-review

Buddy khong duoc:

- tao de moi
- sua cau hoi
- override diem quiz

### 6.3. Operations / Quan ly

Operations va quan ly:

- xem ket qua quiz theo chang
- xem final quiz da dat hay chua
- bi chan `approve gate cuoi` neu final quiz chua dat

Operations va quan ly khong duoc:

- sua template quiz trong pass nay
- mo khoa gate cuoi bo qua final quiz

## 7. Mo hinh du lieu duoc chon

Huong duoc chon:

`Quiz template` va `employee quiz record` tach rieng khoi `stage gate record`

Khong chon:

- nhung quiz vao gate record, vi du lieu se bi tron va kho support retry
- nhung quiz vao self-review, vi sai vai tro nghiep vu

Ly do chon:

- de audit va lich su lan thi
- de cham diem doc lap
- de UI nhan vien va operations tai du lieu gon hon
- de noi tiep sang bao cao quiz sau nay

## 8. Cau truc du lieu

### 8.1. Quiz template

Them loai du lieu template quiz trong `career-path-types.ts` va mock data.

Moi quiz template can co:

- `quiz_code`
- `stage_code`
- `kind` = `stage` | `final`
- `position_ids` hoac lien ket theo template onboarding hien co
- `title`
- `description`
- `passing_score`
- `questions`

Moi question can co:

- `id`
- `prompt`
- `options`
- `correct_option_id`
- `explanation_after_submit?`

Pass nay chi can `single choice`.
Khong can:

- multi select
- sap xep thu tu
- nhap text tu do

### 8.2. Employee quiz record

Them record luu bai lam cua nhan vien.

Record can co:

- `id`
- `employee_id`
- `onboarding_plan_id`
- `quiz_code`
- `stage_code`
- `kind`
- `attempt_no`
- `answers`
- `score`
- `passed`
- `status`
- `submitted_at`
- `submitted_by`

`status` persistence trong Pass C chot gom:

- `passed`
- `failed`

Neu can UI local cho bai dang lam, state `in_progress` chi ton tai trong component, khong can luu vao store/service mock o pass nay.

## 9. Service layer can co

Them nhom ham service rieng trong `career-path-service.ts` de:

- lay quiz template theo `employee + stage`
- lay final quiz theo `employee`
- nop bai va cham diem tu dong
- tra ket qua moi nhat
- tra lich su lan thi gon
- tra `quiz summary` cho gate panel

Can co 3 kieu view:

1. `Employee stage quiz view`
   - card cho nhan vien o tung chang

2. `Employee final quiz view`
   - card final quiz cho nhan vien

3. `Operations quiz summary view`
   - tom tat cho detail panel va gate panel

## 10. Rule cham diem

Rule cham diem da chot:

- moi cau dung = 1 diem
- `score` tinh theo ty le dung tren tong so cau, lam tron so nguyen
- `passed = score >= passing_score`

Ket qua hien thi:

- so cau dung / tong so cau
- phan tram diem
- `Dat` hoac `Chua dat`

Sau khi nop bai:

- luu ca `answers`
- luu `score`
- luu `passed`

Pass nay khong can:

- tru diem
- canh tranh thoi gian
- countdown timer

## 11. Rule retry

Nhan vien duoc lam lai quiz.

Rule retry da chot:

- moi lan nop tao `attempt` moi
- `attempt_no` tang dan
- man hinh hien `ket qua moi nhat`
- neu da co bat ky lan `passed`, quiz summary danh dau `passed`
- final quiz chi het khoa gate cuoi khi da co it nhat 1 lan `passed`

Ly do:

- giong van hanh training thuc te
- khuyen khich hoc lai thay vi danh rot vinh vien

## 12. Rule mo quiz

### 12.1. Mini quiz

Mini quiz mo khi:

- stage tuong ung da duoc mo cho nhan vien

Mini quiz an hoac khoa khi:

- stage chua den

### 12.2. Final quiz

Final quiz mo khi:

- nhan vien da toi chang cuoi onboarding

Khong bat buoc:

- phai dat tat ca mini quiz truoc moi duoc mo final quiz

Ly do:

- giu flow mem, tranh khoa cheo qua som
- mini quiz la tin hieu phu, final quiz moi la diem khoa gate

## 13. Man hinh nhan vien

Trang `/onboarding` can co them 2 cum UI:

### 13.1. Card mini quiz theo chang

Dat trong khu vuc stage dang xem.

Card can hien:

- ten quiz
- so cau
- nguong dat
- ket qua moi nhat neu da lam
- so lan da lam
- nut `Lam bai` hoac `Lam lai`

Khi vao lam bai:

- hien danh sach cau hoi va option
- nhan vien chon dap an
- nop bai
- hien ket qua ngay sau submit

Sau submit, card hien them:

- diem
- `Dat` / `Chua dat`
- 1 vai cau sai gan nhat de xem lai

### 13.2. Card final quiz

Dat rieng gan khu gate/status cuoi chang hoac cuoi trang.

Card can hien:

- ten final quiz
- dieu kien `Can dat de chot onboarding`
- nguong dat
- trang thai gan nhat
- nut `Lam final quiz` / `Lam lai`

Neu chua dat:

- hien wording ro `Ban can dat final quiz truoc khi quan ly chot gate cuoi`

## 14. Man hinh operations

Trang `/career-path/onboarding` can hien quiz o detail panel.

### 14.1. Quiz summary theo chang

Trong `OperationsChecklistDetail` hoac panel con:

- hien moi stage co quiz
- diem gan nhat
- da tung dat hay chua
- so lan lam

Muc nay chi de doc.
Khong can cho nop bai ho thay dap an chi tiet.

### 14.2. Final quiz summary

Trong khu gate cuoi:

- hien `final quiz passed` hoac `final quiz not passed`
- hien diem moi nhat
- hien so lan lam

Neu `final quiz not passed`:

- nut `Approve gate` bi disable
- hien ly do disable ro rang

Nut `Reject gate` van hoat dong de manager co the tra ve kem lai.

## 15. Rule gate va quiz

Map gate Pass B giu nguyen:

- `day_2_3 -> ready_for_live_shift -> mo week_1`
- `week_1 -> ready_for_independent_shift -> mo week_2`

Bo sung rule quiz:

- mini quiz chi hien trong chang lien quan, khong doi rule gate
- final quiz la dieu kien bo sung cho `ready_for_independent_shift`

Manager chi duoc `approve` gate `ready_for_independent_shift` khi:

1. cac dieu kien gate cua Pass B da dat
2. `final quiz passed = true`

## 16. Error handling va edge cases

Can xu ly cac tinh huong:

- khong co quiz template cho stage
  - UI an card quiz, khong bao loi

- stage co quiz nhung nhan vien chua lam
  - hien `Chua lam bai`

- co nhieu lan fail truoc khi pass
  - summary van hien `Da dat`, kem diem lan gan nhat

- template doi sau khi nhan vien da lam bai
  - pass nay chap nhan du lieu mock hien tai, khong version template

- final quiz chua mo
  - card final quiz hien `Chua den chang nay`

## 17. Test va verify

Can co verify toi thieu:

- service cham diem dung / sai
- retry tao attempt moi
- `passed` tinh dung theo `passing_score`
- summary danh dau `passed` neu co bat ky attempt pass
- manager bi chan approve gate cuoi khi final quiz chua pass
- manager approve duoc gate cuoi khi final quiz da pass

Smoke test tay:

- nhan vien lam mini quiz fail roi retry pass
- nhan vien lam final quiz fail, operations thay gate cuoi bi khoa
- nhan vien lam final quiz pass, operations approve gate cuoi duoc

## 18. File map du kien

File chac chan se dung:

- `src/lib/career-path-types.ts`
- `src/lib/mock-data-career-path.ts`
- `src/lib/career-path-service.ts`
- `src/app/onboarding/page.tsx`
- `src/app/career-path/onboarding/page.tsx`
- `src/components/onboarding-employee/*`
- `src/components/onboarding-operations/*`

Co the them:

- component card/modal quiz moi cho nhan vien
- component summary quiz moi cho operations

## 19. Quy tac rollout

Pass C nen rollout theo thu tu:

1. data type + mock template + mock records
2. service submit/cham/summary
3. UI nhan vien cho mini quiz
4. UI final quiz va khoa gate cuoi
5. UI operations summary
6. verify

Khong nen tron voi:

- pass authoring template
- pass reporting
- pass random de
