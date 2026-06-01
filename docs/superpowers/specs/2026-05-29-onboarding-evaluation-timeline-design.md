# Timeline lich su danh gia theo chang onboarding

Ngay: `2026-05-29`
Pham vi: `Pass D - Timeline lich su danh gia`
Trang thai: `approved-for-spec`

## 1. Muc tieu

Pass nay chi giai quyet 1 viec:

- gom `self-review + mini test + gate` thanh 1 timeline de doc nhanh
- hien timeline tren `ca man nhan vien` va `man operations`
- giu ngu canh `theo chang onboarding`
- cho phep mo lich su tung ban ghi trong chang

Pass nay khong giai quyet:

- timeline tong onboarding xuyen tat ca chang
- moc van hanh nhu buddy, ca dau, follow-up
- doi logic gate
- doi logic mini test
- doi cau hoi self-review
- tao page rieng cho timeline

## 2. Ly do chon scope nay

Huong nay duoc chon vi:

- du lieu danh gia da co sau Pass A, B, C
- hien tai thong tin dang nam roi rac thanh nhieu block
- buddy, quan ly, va nhan vien can 1 diem nhin chung de xem tien trinh danh gia trong chang
- giu Pass D gon, khong vo sang timeline onboarding tong hop

## 3. Quyet dinh nghiep vu da chot

### 3.1. Mat hien thi

Timeline hien o:

- `man nhan vien /onboarding`
- `man operations /career-path/onboarding`

### 3.2. Kieu timeline

Huong duoc chon la `hybrid`:

- mac dinh nhin `theo chang`
- moi chang co summary rieng
- co the mo ra `lich su tung ban ghi trong chang`

### 3.3. Loai du lieu duoc dua vao timeline

Pass D chi dua 3 loai:

- `self-review`
- `mini quiz`
- `stage gate`

Khong dua vao:

- moc chot buddy
- moc chot ca dau
- ket qua sau ca
- nhac policy
- item checklist thu ngan / phuc vu

## 4. Huong data duoc chon

Pass D khong tao bang du lieu moi.

Chi tai su dung 3 nguon da co:

- `self-review history`
- `mini quiz history`
- `stage gate records`

Can bo sung service de doc `gate history` theo:

- `employee_id`
- `onboarding_plan_id`
- `stage_code`

Khong chi lay `current gate record` nhu block gate hien tai.

## 5. View model timeline can co

### 5.1. Entry model

Them 1 view model moi de UI 2 mat dung chung:

- `OnboardingStageEvaluationTimelineEntry`

Moi entry can co:

- `id`
- `stage_code`
- `entry_type`: `self_review | mini_quiz | stage_gate`
- `occurred_at`
- `headline`
- `summary_lines`
- `status_tone`
- `raw_ref`

`status_tone` chi de tom tat nhanh tren UI, vi du:

- `neutral`
- `good`
- `warning`

### 5.2. Stage timeline view

Them 1 view model:

- `OnboardingStageEvaluationTimelineView`

Moi view gom:

- `stage_code`
- `latest_self_review`
- `latest_mini_quiz`
- `latest_stage_gate`
- `entries`

Trong do:

- `entries` la danh sach da merge va sort moi nhat len tren
- 3 truong `latest_*` de dung cho summary mac dinh o dau block

## 6. Rule merge va sort

- Timeline chi lay du lieu cua `1 chang dang xem`
- Khong tron du lieu chang khac vao cung block
- Moi entry dung `submitted_at`, `created_at`, hoac `decided_at` phu hop de lam `occurred_at`
- Sap xep `moi nhat len tren`
- Neu gate co record chua duyet va sau do co record da duyet/chua qua, timeline phai giu day du

## 7. Rule cho tung loai entry

### 7.1. Self-review

Mac dinh summary lay `ban moi nhat`.

Entry self-review hien:

- `headline`: `Tu danh gia moi`
- `summary_lines`:
  - `Tu tin nhat: ...`
  - `Can kem sat: ...`
  - `So nhat: ...`

History mo rong hien day du tung lan gui.

### 7.2. Mini quiz

Neu chang co quiz template, timeline moi co du lieu mini quiz.

Entry mini quiz hien:

- `headline`: `Mini test 80%` hoac muc diem thuc te
- `summary_lines`:
  - `Trang thai: On phan nen / Can on lai`
  - `Can on lai: ...` neu co cau sai

Latest score chi la tin hieu tham chieu.
Khong doi wording gate vi quiz.

### 7.3. Stage gate

Neu chang do khong co gate code, block timeline van hien self-review + mini quiz.

Entry gate hien:

- `headline`: `Gate: Cho duyet` / `Gate: Da qua` / `Gate: Chua qua`
- `summary_lines`:
  - `Buddy: ...` neu co buddy note
  - `Quan ly: ...` neu co manager note
  - `Can lam lai: ...` neu co retry items

Timeline phai doc duoc nhieu ban ghi gate trong cung chang neu co.

## 8. Cach hien thi tren UI

### 8.1. Man nhan vien

Route hien tai: `src/app/onboarding/page.tsx`

Them 1 block moi:

- `Timeline danh gia chang nay`

Vi tri:

- dat sau `Mini test`
- dat sau `Tu danh gia`
- dat truoc hoac gan `Gate status`

Block gom:

- summary mac dinh cua 3 loai du lieu
- nut `Xem lich su chang nay`
- danh sach timeline mo rong khi can

Neu chang chua co du lieu:

- hien `Chua co du lieu danh gia trong chang nay`

### 8.2. Man operations

Route hien tai: `src/app/career-path/onboarding/page.tsx`

Trong panel chi tiet:

- gop `mini test + self-review + gate` thanh 1 block timeline chung

Khong giu 3 block roi rac rieng le nua neu block timeline da du thong tin.

Block gom:

- summary latest cua mini test
- summary latest cua self-review
- summary latest cua gate
- nut mo `Lich su trong chang`

Ly do chon:

- dung ten Pass D hon
- giam lap thong tin
- de scan nhanh trong operations panel

## 9. Mau dong timeline

### 9.1. Self-review

- `Tu danh gia moi`
- `Tu tin nhat: ...`
- `Can kem sat: ...`

### 9.2. Mini quiz

- `Mini test 75%`
- `Trang thai: Can on lai`
- `Can on lai 2 cau`

### 9.3. Gate

- `Gate: Cho duyet`
- `Buddy de xuat qua gate`

hoac

- `Gate: Chua qua`
- `Quan ly yeu cau lam lai 2 muc`

## 10. Rule UX

- Mac dinh timeline o trang thai gon
- Uu tien latest summary de scan nhanh
- Chi mo lich su khi nguoi dung can xem sau
- Lich su trong chang hien theo thu tu moi nhat len tren
- Khong dung modal
- Khong tao tab rieng

## 11. Quyen xem

- Nhan vien chi thay timeline cua chinh minh
- Buddy/quan ly thay timeline cua nhan vien dang mo trong operations
- Khong them quyen moi

## 12. Scope code du kien

File se uu tien dung:

- `src/lib/career-path-types.ts`
- `src/lib/career-path-service.ts`
- `src/app/onboarding/page.tsx`
- `src/components/onboarding-employee/*`
- `src/lib/services/onboarding-operations-service.ts`
- `src/components/onboarding-operations/*`
- `docs/CODEMAP.md`

## 13. Ngoai scope ro rang

Pass D khong lam:

- timeline tong hop xuyen tat ca chang
- report timeline rieng trong ho so nhan vien
- bo loc timeline theo loai su kien
- export timeline
- nhac viec tu timeline
- gom su kien van hanh khac vao cung block

## 14. Tieu chi hoan tat

Pass D duoc xem la xong khi:

- nhan vien thay duoc timeline danh gia cua chang dang xem
- operations thay duoc timeline danh gia cua chang hien tai cua nhan vien
- timeline gop du 3 loai `self-review + mini test + gate`
- lich su mo rong sort moi nhat len tren
- chang khong co gate hoac khong co quiz van hien on dinh
- khong lam vo logic gate va mini test da co
