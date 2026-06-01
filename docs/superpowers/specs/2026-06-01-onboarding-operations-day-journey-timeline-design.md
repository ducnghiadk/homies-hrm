# 2026-06-01 Onboarding Operations Day Journey Timeline Design

## Muc tieu

Thay khung chinh cua man `Van hanh onboarding` tu cac block step roi rac sang mot `journey overview` de nguoi van hanh:

- thay toan cuc hanh trinh onboarding trong `7-14 ngay` hoac theo setting admin,
- khong can doc tung card moi hieu flow tong the,
- click vao tung ngay de mo nhanh chi tiet,
- vao man la biet ngay `hom nay can lam gi`.

Huong nay uu tien `overview truoc`, `drill-down sau`, `today action` ro rang nhat.

## Van de hien tai

Tu man hien tai:

- thong tin dang to chuc theo cac block nghiep vu song song,
- nguoi dung phai tu ghep `Buoc 3`, `Buoc 4`, `follow-up`, `timeline danh gia`, `lich su xu ly` de hieu tong the,
- man tra loi tot cau hoi `task nay dung de lam gi`,
- nhung tra loi chua tot cau hoi `hanh trinh 7-14 ngay nay dang di den dau`,
- khong co mot lop overview theo `Ngay 1 -> Ngay N`,
- user khong de quet nhanh de thay ngay nao dang den han, ngay nao co van de, ngay nao da xong.

Ket qua la:

- kho nhin toan cuc,
- kho uu tien ngay hien tai,
- kho mo rong khi admin doi setting tong so ngay onboarding.

## Insight tu pattern thi truong

Qua pattern pho bien o cac ung dung nhu Asana, monday.com, Rippling, BambooHR:

- lop `plan overview` luon xuat hien truoc,
- chi tiet task la lop sau khi nguoi dung chon 1 diem trong hanh trinh,
- hanh trinh thuong duoc nhin theo `phase`, `date`, hoac `day milestones`,
- user khong bi dat vao tinh huong phai mo tung block roi rac moi hieu flow,
- task hien tai va next action luon duoc dua len vi tri uu tien.

Pattern rut ra:

1. Tong quan hanh trinh truoc.
2. Chon 1 moc hien tai.
3. Xem chi tiet va hanh dong.
4. Thong tin lich su / danh gia de o tang phu.

## Quyet dinh thiet ke duoc chon

Chon huong `Timeline doc theo Ngay 1 -> Ngay N + panel chi tiet ben phai`.

Day la `Phuong an B` da duoc duyet.

Khong chon:

- timeline ngang kieu roadmap, vi kho scan voi chuoi 7-14 ngay va bat buoc cuon ngang,
- accordion inline lam khung chinh, vi se dai man va de mat overview khi mo nhieu ngay,
- timeline theo phase truoc, ngay sau, vi van buoc user hieu 2 tang logic ngay tu dau.

## Ket qua mong muon

Sau redesign, nguoi van hanh vao man phai hieu ngay:

1. Hanh trinh onboarding nay co bao nhieu ngay.
2. Hom nay dang o `Ngay may`.
3. Ngay nao da xong, ngay nao sap toi, ngay nao can xu ly.
4. Trong ngay dang chon, viec uu tien nhat la gi.
5. Click vao ngay nao thi mo nhanh duoc task cua ngay do.

## Pham vi

In scope:

- route `src/app/career-path/onboarding/page.tsx`,
- khu vuc overview dau trang cua man operations,
- khu vuc chi tiet panel ben phai,
- copy va hierarchy cho `today action`,
- mapping presentation cho `Ngay 1 -> Ngay N`,
- sap xep lai vi tri `timeline danh gia`, `lich su xu ly`, `ghi chu` thanh lop thong tin phu.

Out of scope trong pass nay:

- khong doi service nghiep vu cot loi,
- khong doi logic checklist item co san,
- khong doi logic gate / mini test / self-review,
- khong dua ngay lich that nhu `09/05` vao journey overview,
- khong them workflow moi ngoai viec doi cach to chuc va trinh bay.

## Nguyen tac UX

### 1. Overview truoc detail

User phai thay duoc toan bo `Ngay 1 -> Ngay N` truoc khi di vao 1 ngay cu the.

### 2. Day-based, khong date-based

Khung journey dung `Ngay 1`, `Ngay 2`, `Ngay 3`... thay vi ngay lich.

Ly do:

- phu hop setting linh hoat 7, 10, 14 ngay,
- khong phu thuoc ngay bat dau thuc te,
- nguoi van hanh quan tam chang onboarding hon la lich ngay-thang.

### 3. Hom nay la diem neo

Man mo ra phai auto focus vao ngay hien tai hoac ngay can xu ly gan nhat.

### 4. Mot ngay = mot don vi scan duoc

Moi ngay tren timeline chi giu 3 tin hieu ngan:

- trang thai,
- so viec,
- viec quan trong nhat.

### 5. Tang phu khong tranh spotlight

`Timeline danh gia chang hien tai`, `lich su xu ly`, `ghi chu` van co gia tri, nhung khong duoc canh tranh su chu y voi `hanh trinh ngay` va `viec can lam hom nay`.

## Cau truc UI duoc de xuat

### 1. Header moi

Phan dau man doi thanh mot `journey header`.

Thanh phan:

- title: `Hanh trinh onboarding`,
- subtitle: `Theo doi toan bo ngay onboarding, mo nhanh tung ngay de xu ly`,
- summary bar ngay ben duoi.

Summary bar gom:

- `Tong 10 ngay` hoac so ngay tu setting admin,
- `Hom nay: Ngay 4`,
- `2 viec can lam ngay`,
- `1 ngay co rui ro`.

Khong dua qua nhieu metric. Muc tieu la tao boi canh, khong bien thanh dashboard KPI.

### 2. Layout tong the

Man chinh theo 2 cot:

- cot trai: `Journey timeline`,
- cot phai: `Day detail panel`.

Desktop:

- giu overview va detail cung luc.

Mobile:

- journey nam tren,
- detail stack xuong duoi,
- giu logic chon 1 ngay -> detail cap nhat ngay ben duoi.

### 3. Cot trai: Journey timeline theo Ngay 1 -> Ngay N

Moi dong ngay la mot item click duoc.

Moi item hien 4 lop nho:

- `Ngay 4`,
- nhan trang thai,
- `3 viec`,
- `Uu tien: Gan nguoi kem`.

#### Trang thai de xuat

- `Chua toi`
- `Sap toi`
- `Dang lam`
- `Can xu ly`
- `Da xong`

#### Rule visual

- `Hom nay` highlight manh nhat,
- `Can xu ly` dung warning tone,
- `Da xong` dung tone diu va co the thu gon,
- `Chua toi` de nhe de user van thay toan chang.

#### Rule thong tin

Khong render full checklist trong item overview.

Chi hien:

- tinh trang cua ngay,
- tong so viec,
- next action quan trong nhat.

Muc tieu la de quet nhanh toan bo 7-14 ngay ma khong met mat.

### 4. Cot phai: Day detail panel

Khi user click vao 1 ngay o cot trai, cot phai cap nhat ngay lap tuc.

Header panel:

- `Ngay 4`,
- ten phase phu neu can, vi du `Chuan bi truoc ngay dau`,
- trang thai tong cua ngay.

Khong de `phase` lam khung chinh. Phase chi la subtitle de giu ngu canh nghiep vu.

### 5. Khoi `Hom nay can lam gi`

Day la khoi uu tien cao nhat trong panel phai.

Noi dung:

- `Lam ngay: Gan nguoi kem`,
- `Tiep theo: Xac nhan noi quy tai quan`.

Chi 1 CTA chinh, 1 CTA phu.

Khong hien 3-4 nut ngang muc uu tien nhu dang co neu chung lam loang focus.

Neu ngay dang chon khong phai hom nay, wording doi thanh:

- `Trong ngay nay can lam gi`,
- `Viec dau tien`,
- `Sau do`.

### 6. Danh sach task trong ngay

Sau khoi `Hom nay can lam gi` moi den task list cua ngay dang chon.

Vi du:

- `Nguoi kem / nguoi huong dan`
- `Dong phuc, cham cong, noi quy tai quan`
- `Tai khoan, nhom chat, cong cu`
- `Ca dau va gio co mat`

Moi task card chi nen co:

- ten viec,
- mo ta 1 dong `Dung de lam gi`,
- trang thai hien tai,
- action ro nghia.

Task trong ngay sap xep theo:

1. viec can lam ngay,
2. viec tiep theo,
3. viec con lai.

Khong sap xep thuan theo vi tri ky thuat trong data neu thu tu do khong phu hop van hanh.

### 7. Secondary blocks

Day la cac block nen dat ben duoi task list hoac khu vuc phu trong panel phai:

- `Timeline danh gia chang hien tai`
- `Lich su xu ly`
- `Ghi chu`

Ly do:

- day la thong tin tham chieu,
- khong nen cat ngang luong hanh dong chinh,
- user chi can xuong den day sau khi da xu ly duoc `viec can lam hom nay`.

### 8. Mapping tu step cu sang journey moi

He thong van co the giu logic `before_first_shift`, `after_first_shift`, `follow_up`, nhung lop UI ngoai cung khong nen bat user bat dau tu day.

Mapping trinh bay:

- `before_first_shift` -> hien thanh cac ngay truoc / trong ngay dau tuy rule setting,
- `after_first_shift` -> hien thanh cac ngay theo sau,
- `follow_up` -> hien thanh task cua ngay tuong ung,
- `block_day_one` -> `Can xu ly truoc ngay dau`,
- `ready` -> `Da san sang`,
- `need_follow_up` -> `Can theo sat sau ca dau`.

Noi cach khac:

- logic nghiep vu cu giu o tang du lieu,
- tang UI ben ngoai chuyen qua ngon ngu `journey theo ngay`.

### 9. Logic mo mac dinh

Rule de xuat:

- neu co `hom nay` trong hanh trinh -> auto chon `hom nay`,
- neu chua den ngay dau nhung da co viec pending -> chon ngay gan nhat can xu ly,
- neu tat ca da xong -> chon ngay cuoi cung co thay doi gan nhat,
- neu ngay khong co viec -> hien empty state ngan `Ngay nay khong co dau viec van hanh`.

### 10. Empty, warning, and done states

#### Empty day

- `Ngay nay khong co dau viec van hanh.`
- co the them copy phu `Chuyen sang ngay tiep theo de xem cong viec sap toi.`

#### Warning day

- highlight o cot trai,
- panel phai dua blocker len tren `Hom nay can lam gi`.

#### Done day

- item timeline dung mau nhe,
- panel phai co summary ngan `Da hoan tat tat ca dau viec cua ngay nay`.

## Vi sao huong nay tot hon man hien tai

- giai quyet truc tiep van de `khong nhin duoc toan cuc`,
- giam nhu cau user tu ghep flow tu nhieu block,
- dua `hom nay can lam gi` len dung tang uu tien,
- scale tot neu admin doi tong so ngay onboarding,
- giu duoc bo cuc 2 cot quen thuoc cua man operations.

## Kien truc trien khai du kien

File co kha nang can sua:

- `src/app/career-path/onboarding/page.tsx`
- `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- `src/components/onboarding-operations/OperationsChecklistDetail.tsx`

File moi co the can them hoac doi vai tro:

- `src/components/onboarding-operations/OnboardingOpsTimeline.tsx`

Trach nhiem de xuat:

- `page.tsx`: tinh tong so ngay, ngay hien tai, summary bar, selected day mac dinh,
- `OnboardingOpsTimeline.tsx`: render danh sach `Ngay 1 -> Ngay N`,
- `OperationsChecklistDetail.tsx`: render panel chi tiet cua ngay dang chon,
- neu `UpcomingOnboardingList.tsx` dang dong vai tro list employee, can quyet dinh ro no van la list employee hay duoc doi cho phu hop voi journey layout.

## Rui ro va kiem soat

Rui ro 1:

- data hien tai co the dang map theo phase hon la theo day.
- Kiem soat: tao presentation mapping theo `Ngay N` o view-model, khong doi service cot loi trong pass nay.

Rui ro 2:

- neu overview item hien qua nhieu text se mat uu diem scan nhanh.
- Kiem soat: khoa overview con 3 tin hieu chinh.

Rui ro 3:

- panel phai van de qua nhieu block phu se lap lai van de cu.
- Kiem soat: day secondary info xuong duoi va uu tien `today action`.

Rui ro 4:

- mobile co the dai man.
- Kiem soat: giu item timeline gon, detail stack 1 panel, khong render full task cua nhieu ngay cung luc.

## Tieu chi hoan tat

Pass nay duoc xem la dat khi:

- nguoi dung thay duoc toan bo `Ngay 1 -> Ngay N` trong cung mot khu overview,
- khong can doc het cac card van biet hanh trinh dang o dau,
- click vao tung ngay mo nhanh duoc chi tiet,
- `Hom nay can lam gi` la khoi de thay nhat trong detail,
- `timeline danh gia`, `lich su xu ly`, `ghi chu` khong con tranh su chu y voi flow chinh,
- giao dien van hoat dong voi tong so ngay thay doi theo setting admin.

## Khuyen nghi thuc thi

Nen trien khai theo thu tu:

1. dung lai information architecture va hierarchy,
2. tao view-model cho `journey day summary`,
3. map selected day -> detail panel,
4. day secondary blocks xuong tang phu,
5. tinh chinh copy va visual emphasis.

Huong nay giai quyet dung bai toan UX hien tai ma khong can viet lai workflow nghiep vu tu dau.
