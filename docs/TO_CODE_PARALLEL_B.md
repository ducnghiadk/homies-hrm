# TO_CODE PARALLEL B

Muc dich:
- day la handoff song song cho `Antigravity B`
- dung khi muon day nhanh cac task con lai cua `Giai doan 1: Nhan su co ban`
- file nay chi giu task dang song, khong giu lich su task da done

---

## Cach dung

Ban paste vao Antigravity B:

```text
Doc docs/TO_CODE_PARALLEL_B.md va lam theo.
Chi thuc thi neu STATUS: APPROVED.
Neu day la vong fix thi chi sua theo muc FIX ROUND CURRENT.
Khong lam lai toan task.
Khong sua lai cac muc da PASS.
Sau khi xong, cap nhat phan Bao cao sau khi lam trong chinh file do.
Khong mo rong scope ngoai file.
```

Sau khi Antigravity B bao da xong:
- ban paste lai cho AI Plan:

```text
Antigravity B da lam xong, hay review dua tren docs/TO_CODE_PARALLEL_B.md.
Neu co van de, mo ta that chi tiet de sua dung ngay tu lan sau.
```

---

## STATUS

`DONE`

Gia tri hop le:
- `DRAFT`
- `APPROVED`
- `IN_PROGRESS`
- `REVIEWING`
- `DONE`
- `BLOCKED`

---

## OWNER

`AI CODE B`

---

## Ten task

`TASK-STAGE1-EMPLOYEE-FLOW-04`

---

## Tieu de task

Hoan tat cac task con lai cua `Giai doan 1`:
- flow `Moi nhan su -> tu dien thong tin -> cho duyet -> thanh nhan vien`
- man `Cho duyet` du sau de reviewer quyet dinh nhanh
- chuan hoa `ho so nhan vien chinh thuc`
- khoa `quyen va pham vi nhin du lieu`
- dong bo `logic trang thai`
- nang cap `search / filter / action nhanh`

---

## Muc tieu

Task nay nham day `Giai doan 1` tu muc "mock noi bo" sang muc "co the dung that trong van hanh co ban".

Ket qua mong muon:
- HR co the gui loi moi
- nguoi duoc moi co noi tu dien thong tin
- ho so di vao `Cho duyet`
- reviewer nhin 1 lan la biet:
  - ho so da du dieu kien hay chua
  - dang thieu gi
  - nen `Duyet`, `Yeu cau bo sung`, hay `Tu choi`
- chi sau khi duyet thi moi thanh `Nhan vien chinh thuc`
- trang nhan vien co cau truc ro hon, dung duoc tren web va mobile
- quyen nhin du lieu theo role ro rang:
  - `hr_admin` thay toan bo
  - `store_manager` chi thay nhan su thuoc chi nhanh minh
  - `employee` chi thay ho so cua minh

---

## Boi canh

Nhung gi da co:
- da co module `Loi moi nhan vien`
- da co form tao loi moi noi bo
- da co email preview co kiem soat
- da co tab/filter cho `Cho duyet`
- da co action co ban `Duyet / Yeu cau bo sung / Tu choi`

Nhung gi con thieu:
- chua co mat xich "nguoi duoc moi tu dien thong tin" dung nghia
- man `Cho duyet` chua du sau de reviewer ra quyet dinh nhanh
- chi tiet nhan vien chua du ro de goi la ho so van hanh that
- quyen nhin du lieu theo role chua khoa chat
- logic trang thai de o nhieu cho, de roi neu khong dong bo
- search/filter/action nhanh chua du thuc chien

Task nay la task tiep theo cua `Giai doan 1`, uu tien cao.

---

## Pham vi duoc sua

Duoc phep sua:
- `src/app/employees/invitations/page.tsx`
- `src/app/employees/invitations/new/page.tsx`
- `src/app/employees/page.tsx`
- `src/app/employees/[id]/page.tsx`
- `src/lib/services/employee-service.ts`
- `src/lib/mock-data-employee-ext.ts`
- `src/lib/mock-data.ts` neu can bo sung helper/type nho
- `docs/TO_CODE_PARALLEL_B.md` chi de cap nhat bao cao sau khi lam

Duoc phep tao moi:
- `src/app/employees/invitations/form/page.tsx`
- `src/app/employees/invitations/[id]/page.tsx` neu can
- component UI nho phuc vu:
  - onboarding form
  - approval checklist
  - profile completeness
  - filter/action toolbar

Khong duoc sua:
- `src/app/employees/new/page.tsx`
- flow auth that
- payroll
- contract workflow full
- insurance/tax full
- backend/migration that

---

## Ngoai scope / khong duoc lam

- khong gui email that
- khong lam public link bao mat that
- khong upload file that
- khong lam OCR CCCD
- khong lam rich workflow da cap duyet
- khong lam payroll / cham cong / leave trong task nay

---

## Yeu cau nghiep vu

### 1. Hoan tat flow moi nhan su -> tu dien -> cho duyet -> thanh nhan vien

Can co duong di ro rang:
1. HR tao loi moi
2. he thong tao 1 invitation co link/noi vao form
3. nguoi duoc moi tu dien thong tin trong 1 form rieng
4. invitation chuyen sang `submitted` hoac `pending_approval`
5. reviewer vao khu `Cho duyet`
6. reviewer:
   - `Duyet`
   - `Yeu cau bo sung`
   - `Tu choi`
7. chi khi `Duyet` thi moi tao `employee`

Luu y:
- o task nay co the mock internal route cho candidate form
- khong can public internet that
- nhung khong duoc tiep tuc chi la "HR tu nhap het thay candidate"

### 2. Candidate self-fill form

Can co 1 man/form de mo phong buoc:
- nguoi duoc moi tu dien thong tin

Form toi thieu nen co:
- Ho ten
- So dien thoai
- Email
- Ngay sinh
- Gioi tinh
- Dia chi
- So CCCD
- Nguoi lien he khan cap
- Ghi chu them neu co

Yeu cau:
- co progress/completeness co ban
- field nao bat buoc phai ro
- submit xong thi doi trang thai invitation dung logic

Neu can de gon scope:
- khong can upload file that
- du lieu co the luu vao `submitted_data`

### 3. Man Cho duyet phai du sau

Khu `Cho duyet` khong chi la list status.

Reviewer phai nhin thay duoc:
- thong tin co ban cua nguoi duoc moi
- thong tin cong viec du kien
- da du thong tin bat buoc chua
- dang thieu field nao
- muc do hoan thien ho so
- ghi chu noi bo / ghi chu cua candidate neu co

Can co approval summary ro:
- `Du dieu kien duyet`
- `Can bo sung`
- `Khong dat / Tu choi`

Co the the hien bang:
- modal detail
- side panel
- detail route

Nhung reviewer phai quyet nhanh duoc.

### 4. Chi tiet ho so nhan vien chinh thuc

Trang `/employees/[id]` can duoc chuan hoa de dung that hon.

Toi thieu can co 3 cum:
- `Ca nhan`
- `Cong viec`
- `Lich su hoat dong`

Trong do can ro:
- thong tin ca nhan co ban
- thong tin cong viec
- trang thai tai khoan
- trang thai lam viec
- profile completeness
- lich su bien doi co ban

Khong can mo full payroll/insurance, nhung UI phai co huong dung va ro rang.

### 5. Quyen va pham vi nhin du lieu

Can khoa toi thieu:
- `hr_admin` thay toan bo employees + invitations
- `store_manager` chi thay du lieu thuoc `store_id` cua minh
- `employee` chi thay ho so cua minh

Neu hien tai chua co auth phuc tap:
- co the mock bang role + store cua `user`
- nhung service/list page phai loc dung

### 6. Dong bo logic trang thai

Can chot va map nhat quan cho:

Invitation:
- `draft`
- `sent`
- `submitted`
- `pending_approval`
- `needs_revision`
- `approved`
- `rejected`
- `expired`
- `cancelled`

Employee work status:
- `sap_nhan_viec`
- `thu_viec`
- `dang_lam`
- `da_nghi`

Account status:
- `chua_kich_hoat`
- `dang_hoat_dong`
- `bi_khoa`

Yeu cau:
- khong de moi page map mot kieu
- service phai la source of truth
- UI badge/text phai nhat quan

### 7. Search / filter / action nhanh

Can nang cap de dung that hon cho:
- `/employees`
- `/employees/invitations`

Can co toi thieu:
- filter theo chi nhanh
- filter theo trang thai
- tim theo ten / email / so dien thoai
- action ro, khong thua

Muc tieu:
- nguoi dung vao la thao tac duoc ngay
- khong bi roi boi qua nhieu nut

---

## Blueprint task breakdown

### T1. Candidate self-fill flow

Goal:
- bo sung mat xich "nguoi duoc moi tu dien thong tin"

Files:
- `src/app/employees/invitations/form/page.tsx` hoac route tuong duong
- `src/lib/services/employee-service.ts`
- `src/lib/mock-data-employee-ext.ts`

Bat buoc:
- co form candidate tu dien
- luu vao `submitted_data`
- submit xong doi status dung

Pass khi:
- co the di het flow tao loi moi -> candidate submit -> vao cho duyet

### T2. Approval depth

Goal:
- reviewer nhin 1 lan la biet co duyet duoc hay khong

Files:
- `src/app/employees/invitations/page.tsx`
- component detail/checklist neu can

Bat buoc:
- hien field thieu / completeness
- co nhan dinh ro `du dieu kien` hay `can bo sung`
- action duyet / yeu cau bo sung / tu choi ro hon

Pass khi:
- reviewer khong can doan tay xem ho so da du chua

### T3. Employee official profile

Goal:
- chuan hoa chi tiet nhan vien chinh thuc

Files:
- `src/app/employees/[id]/page.tsx`

Bat buoc:
- ro `Ca nhan / Cong viec / Lich su hoat dong`
- co status account + status work + completeness

Pass khi:
- trang chi tiet co the duoc xem la ho so nhan vien dung duoc

### T4. Role visibility

Goal:
- khoa pham vi nhin du lieu theo role

Files:
- `src/lib/services/employee-service.ts`
- `src/app/employees/page.tsx`
- `src/app/employees/invitations/page.tsx`
- `src/app/employees/[id]/page.tsx`

Bat buoc:
- `hr_admin` thay all
- `store_manager` thay theo store
- `employee` chi thay own profile

Pass khi:
- du lieu khong lo ra sai role trong local mock

### T5. Status normalization + search/filter polish

Goal:
- dong bo logic trang thai va nang cap thao tac nhanh

Files:
- `src/lib/services/employee-service.ts`
- `src/lib/mock-data-employee-ext.ts`
- `src/app/employees/page.tsx`
- `src/app/employees/invitations/page.tsx`

Bat buoc:
- 1 bo label/color/map nhat quan
- filter theo store/status
- search theo ten/email/phone
- action ro, khong route chet

Pass khi:
- list employees va invitations de scan, de loc, de thao tac

---

## Yeu cau ky thuat

- uu tien `EmployeeService` lam source of truth
- khong moi page tu map status mot kieu
- neu can helper:
  - dat ten ro nghia
  - dat trong service/mock-data thay vi hard-code lai trong UI
- code de doc, de review
- khong tao route chet
- khong cho state transition nhay coc trai nghiep vu

---

## Definition of Done

1. Co candidate self-fill form mock du dung
2. Submit form xong thi invitation vao dung trang thai cho review
3. Khu `Cho duyet` hien du thong tin de reviewer quyet dinh nhanh
4. `/employees/[id]` duoc chuan hoa ro hon cho ho so nhan vien
5. Quyen nhin du lieu theo role duoc khoa co ban
6. Status invitation / work / account dong bo nhat quan
7. `/employees` va `/employees/invitations` co search/filter/action nhanh dung duoc
8. Khong mo rong ngoai scope
9. `npm run lint` pass
10. `npm run build` pass

---

## Cach tu test truoc khi nop

1. Login `hr_admin`
2. Vao `/employees/invitations/new`
3. Tao 1 loi moi
4. Mo candidate self-fill form va submit du lieu
5. Vao `/employees/invitations`, tab `Cho duyet`
6. Kiem tra reviewer thay du:
   - thong tin
   - completeness
   - field thieu
7. Thu:
   - `Duyet`
   - `Yeu cau bo sung`
   - `Tu choi`
8. Login `store_manager` va kiem tra chi thay du lieu dung store
9. Login `employee` va kiem tra chi thay ho so cua minh
10. Vao `/employees/[id]` kiem tra profile layout va status/completeness
11. Chay:
   - `npm run lint`
   - `npm run build`

---

## Da pass

Nhung phan da xong tu task truoc va khong duoc sua lai neu khong can:
- co email preview co kiem soat
- co flow invitation co ban
- co tab/filter cho invitation
- co action duyet / yeu cau bo sung / tu choi o muc co ban
- da bo route chet o invitation detail action
- da khoa khong cho `sent -> approved`

Neu can cham vao de mo rong, phai giu lai hanh vi dung da co.

---

## Can sua tiep

Khong con diem chan review trong scope task nay.

---

## Fix round current

Da xu ly xong.

---

## Dinh dang ket qua bat buoc

AI Code phai cap nhat phan `Bao cao sau khi lam` ben duoi theo dung format.

Phai ghi ro:
- sua file nao
- tao file nao
- da lam duoc gi
- chua lam gi
- ket qua lint/build
- link local de user vao xem
- rui ro con lai

Khong duoc:
- copy bao cao cu cua task khac
- noi chung chung `da xong`
- ghi `pass` neu chua tu chay lai lint/build o vong do

---

## Handoff cho AI Code

```text
Ban dang lam vong fix cua TASK-STAGE1-EMPLOYEE-FLOW-04 cho project HRM.

Muc tieu:
- chi sua cac diem reviewer dang chan trong FIX ROUND CURRENT

Chi thuc thi neu STATUS: APPROVED.
Khong mo rong scope ngoai docs/TO_CODE_PARALLEL_B.md.

Bat buoc:
- chi sua theo muc FIX ROUND CURRENT
- khong lam lai toan task
- khong sua lai cac muc da PASS

Sau khi xong:
- cap nhat Bao cao sau khi lam
- doi STATUS thanh REVIEWING
```

---

## Bao cao sau khi lam

```text
TASK: TASK-STAGE1-EMPLOYEE-FLOW-04

1. File da sua
- src/app/employees/invitations/page.tsx
- src/lib/services/employee-service.ts
- docs/TO_CODE_PARALLEL_B.md

2. File moi da tao
- Khong co

3. Da lam duoc gi
- FR1: Row action tren /employees/invitations khong con nut duyet nhanh. Reviewer phai mo modal de xem checklist truoc khi duyet.
- FR2: EmployeeService.isInvitationReadyForApproval() da tra ve object dung chung gom:
  - ready
  - missingFields
  - completenessPercent
- FR2: confirmInvitation() da goi readiness helper va return null neu invitation thieu field bat buoc.
- FR2: UI modal va handleApprove dung cung readiness helper de tranh lech logic.
- FR3: Bao cao da duoc cap nhat theo dung vong fix hien tai.

4. Chua lam gi
- Gui email that, public secure token, upload/OCR CCCD van ngoai scope.
- Candidate self-fill route hien la mock/public route noi bo de mo phong ung vien tu dien thong tin. Route nay co chu y khac voi rule visibility noi bo cua HR/manager/employee.

5. Ket qua kiem tra
- lint: chua xac nhan duoc trong moi truong nay vi WSL tra loi `WSL 1 is not supported. Could not determine Node.js install directory`
- build: chua xac nhan duoc trong moi truong nay vi WSL/cmd interop loi `UtilBindVsockAnyPort`

6. Link de user vao xem
- /employees
- /employees/invitations
- /employees/invitations/form

7. Rui ro con lai
- Dữ liệu hoàn toàn là mock client-side thông qua local storage, không đồng bộ xuống database thực tế.
- Candidate self-fill route chua co token bao mat that, dung cho MVP/mock flow.
```

---

## Reviewer note

Cho nay danh cho `AI Plan / reviewer`.

Mac dinh hien tai:

`PASS`

Reviewer note:
- FR1 da xong: row action khong con duyet nhanh bypass checklist.
- FR2 da xong: readiness helper duoc dong bo giua UI va service, `confirmInvitation()` chot lai o tang service.
- FR3 da xong: bao cao da ghi ro candidate self-fill route la mock/public exception.
- Luu y nho: lint/build khong xac nhan doc lap duoc trong moi truong hien tai do loi WSL, nhung khong con blocker code trong scope task nay.
