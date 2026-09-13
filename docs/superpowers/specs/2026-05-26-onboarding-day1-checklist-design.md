# Checklist onboarding ngay dau dua tren flow noi quy

## 1. Muc tieu

Chot pass dau cho flow onboarding/ngay dau theo huong:
- giu roadmap `1 -> 2 -> 3`
- gia tri chinh nam o `2`: checklist ngay dau dang tin hon
- xương sống van di theo `1`: trang thai noi quy phai chay kin
- `3` chi dung muc can hien trong app, chua gia lap scheduler that

Pass nay khong mo rong them flow moi. Chi sua de man HR/manager va man nhan vien doc cung 1 nguon su that.

## 2. Van de hien tai

He thong da co kha nhieu nen:
- service noi quy da co record, lich su, gui tom tat, gui day du, xac nhan, xin HR giai thich, nhac lai, chot tai cua hang
- ho so nhan vien da co card noi quy rieng
- trang onboarding cua nhan vien da co khu noi quy va checklist onboarding

Nhung van con 3 lech chinh:

### 2.1. Checklist onboarding van dua nhieu vao mock

`src/app/onboarding/page.tsx` dang dung `mockOnboardingTasks` lam truc chinh. Chi 1 task noi quy duoc doi `done` theo record. Cach nay du de demo, nhung chua du de noi checklist ngay dau la dang tin.

### 2.2. HR/manager phai tu noi logic trong dau

`src/app/employees/[id]/page.tsx` da co card noi quy va lich su, nhung chua bien no thanh mot checklist ngay dau ro rang. Nguoi xem van phai tu suy:
- da gui du chua
- nhan vien da phan hoi chua
- co can giai thich khong
- ngay dau co con viec gi de chot

### 2.3. Nguon su that chua duoc dong goi cho UI

`src/lib/services/onboarding-policy-service.ts` da co record nghiep vu, nhung chua co helper suy ra "anh chup ngay dau" de 2 man hinh cung doc cung mot logic.

## 3. Quyet dinh chot cho pass nay

Pass nay chi sua 3 file:
- `src/lib/services/onboarding-policy-service.ts`
- `src/app/onboarding/page.tsx`
- `src/app/employees/[id]/page.tsx`

Khong sua settings, khong sua scheduler, khong sua contract page, khong doi flow invitation.

Quyet dinh chot:

1. `OnboardingPolicyService` tro thanh nguon su that cho muc noi quy/ngay dau
2. Them helper suy ra checklist ngay dau tu record that, khong tao them bang du lieu moi
3. Man HR/manager la man chinh
4. Man nhan vien la man phu, chi hien dung buoc tiep theo
5. Khong co checklist tong moi cho toan bo onboarding; pass nay chi nang muc noi quy/ngay dau

## 4. Thiet ke nguon su that

### 4.1. Helper moi trong service

Trong `src/lib/services/onboarding-policy-service.ts`, them 1 helper nho, ten co the la:
- `getDayOneChecklistSnapshot`
- hoac ten tuong duong, nhung y nghia phai ro

Helper nay nhan vao `EmployeeOnboardingPolicyRecord | null` va tra ra 1 object da duoc suy san cho UI.

No khong ghi localStorage, khong tao side effect, khong gui notification.

### 4.2. Du lieu helper can tra ra

It nhat can co:
- `status`
- `needsManagerAttention`
- `needsEmployeeAction`
- `canConfirmAtStore`
- `summarySent`
- `fullSent`
- `employeeResponded`
- `clarificationRequested`
- `acknowledged`
- `storeConfirmed`
- `waitingLabel`
- `nextActionLabel`
- `items`

`items` la mang checklist nho cho UI, gom cac muc:
- `Da gui noi quy tom tat`
- `Da gui noi quy day du`
- `Nhan vien da phan hoi`
- `Can HR giai thich them`
- `Da chot tai cua hang`

Moi item chi can:
- `id`
- `label`
- `done`
- `tone`: `done | pending | warning`
- `hint`

### 4.3. Rule suy ra checklist

Rule chot cho pass nay:

- `summarySent = true` khi co `summary_sent_at`
- `fullSent = true` khi co `full_sent_at`
- `employeeResponded = true` khi co `acknowledged_at` hoac `clarification_requested_at`
- `clarificationRequested = true` khi status la `can_giai_thich` hoac co `clarification_requested_at`
- `acknowledged = true` khi co `acknowledged_at`
- `storeConfirmed = true` khi co `confirmed_at_store_at`
- `needsEmployeeAction = true` khi da gui day du nhung chua `employeeResponded`
- `needsManagerAttention = true` khi `clarificationRequested = true` hoac da den muc co the chot tai cua hang ma van chua xong
- `canConfirmAtStore = true` khi da gui day du va chua `storeConfirmed`

`waitingLabel` va `nextActionLabel` la chuoi ngan de UI khong phai tu lap logic trong file page.

Vi du:
- chua gui day du -> `Dang cho HR kich hoat noi quy day du`
- da gui day du, chua phan hoi -> `Cho nhan vien doc va phan hoi`
- can giai thich -> `HR can giai thich truoc khi chot ngay dau`
- da xac nhan, chua chot tai cua hang -> `Ngay dau quan ly co the chot tai cua hang`
- da chot -> `Da hoan tat buoc noi quy ngay dau`

## 5. Thiet ke man HR/manager

File: `src/app/employees/[id]/page.tsx`

### 5.1. Muc tieu man nay

Nguoi HR/manager mo 1 ho so va tra loi nhanh 3 cau hoi:
- noi quy da den dau
- ai dang no hanh dong
- ngay dau con can chot gi

### 5.2. Cach hien

Giu card noi quy dang co. Khong doi vi tri lon, khong gop voi checklist ho so tong.

Trong card noi quy, bo sung 3 lop:

1. `Tong quan trang thai`
- badge trang thai hien tai
- 1 dong mo ta ngan lay tu `waitingLabel`
- 1 dong hanh dong tiep theo lay tu `nextActionLabel`

2. `Checklist ngay dau`
- render tu `snapshot.items`
- muc `Can HR giai thich them` phai noi bat hon neu dang ton tai
- HR/manager nhin phat biet ngay muc nao xong, muc nao dang cho

3. `Lich su gan nhat`
- tiep tuc dung lich su hien co
- khong can tang them so muc trong pass nay

### 5.3. Nut thao tac

Pass nay khong them nut moi. Giu nut `chot tai cua hang` dang co.

Nhung nut nay phai obey `snapshot.canConfirmAtStore`:
- du dieu kien thi cho bam
- khong du dieu kien thi khoa hoac an, tuy theo UI hien co de sua it nhat

Neu `clarificationRequested = true`, phan mo ta phai uu tien nhac HR/manager xu ly truoc khi chot.

## 6. Thiet ke man nhan vien

File: `src/app/onboarding/page.tsx`

### 6.1. Muc tieu man nay

Nhan vien khong can thay 1 checklist phuc tap hon. Chi can ro:
- minh dang o buoc nao
- can bam gi tiep
- dang cho HR gi

### 6.2. Cach hien

Khu noi quy hien co se tiep tuc la tam diem.

Sua theo huong:
- badge trang thai doc tu helper snapshot
- dong mo ta chinh doc tu `waitingLabel`
- dong huong dan tiep theo doc tu `nextActionLabel`

Case hien:
- chua co ban day du: bao dang cho HR kich hoat dung moc
- da co ban day du, chua phan hoi: hien 2 nut `Toi da doc va xac nhan` va `Toi can HR giai thich them`
- da xin giai thich: hien trang thai cho HR xu ly, khong giong case chua bam gi
- da xac nhan: hien da hoan tat

### 6.3. Checklist onboarding tren man nhan vien

Pass nay KHONG viet lai toan bo checklist onboarding.

Chi doi quy tac item `Doc noi quy cong ty`:
- `done = true` khi `acknowledged` hoac `storeConfirmed`
- `done = false` trong cac case con lai

Nghia la task nay khong con "xong tam" vi mock. No xong khi flow that xong.

## 7. Pham vi khong lam trong pass nay

Khong lam:
- them moc scheduler/nhiem vu nen that
- doi cau truc `mockOnboardingTasks`
- thay doi settings flow
- dua checklist onboarding tong sang service khac
- tao them route moi
- sua login, account activation, schedule readiness

## 8. Verify cho pass code sau spec

Can verify it nhat:

1. `npx eslint src/lib/services/onboarding-policy-service.ts src/app/onboarding/page.tsx src/app/employees/[id]/page.tsx`
2. Mo 1 nhan vien chua co `full_sent_at`:
- HR thay thong diep dang cho gui day du
- nhan vien thay trang thai dang cho HR
3. Mo 1 nhan vien da co `full_sent_at` nhung chua phan hoi:
- HR thay checklist ngay dau dang cho nhan vien
- nhan vien thay du 2 nut thao tac
4. Mo 1 nhan vien da bam `Toi can HR giai thich them`:
- HR thay muc can giai thich noi bat
- nhan vien thay trang thai dang cho HR
5. Mo 1 nhan vien da xac nhan:
- task `Doc noi quy cong ty` tren onboarding duoc danh dau xong
6. HR/manager bam `chot tai cua hang`:
- card cap nhat thanh da chot
- lich su co them moc moi

## 9. Ket qua mong muon

Sau pass nay:
- checklist ngay dau cho muc noi quy bot "mock"
- HR/manager khong phai tu noi logic
- nhan vien thay ro minh dang cho ai va can lam gi
- app van giu scope gon, dung roadmap `1 -> 2 -> 3`
