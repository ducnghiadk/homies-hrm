# Settings Hub Tab-Workspace Minimal Redesign Design

**Muc tieu**

Nang cap man `/settings` thanh workspace theo tab, de hieu hon, logic hon, toi gian hon, thong minh hon; moi tab la mot cum nghiep vu lon va ben trong thao tac truc tiep bang form/list thay vi day nhieu card dieu huong.

**Van de hien tai**

- Trang dang tron 3 lop cung luc: gioi thieu, dieu huong, va thao tac CRUD chi tiet.
- So card nhieu, pham vi card chong lap, co card summary trung voi card thao tac.
- User phai cuon dai va doan xem nen sua tai card nao.
- Nhieu phan dang dung card nhu link trung gian thay vi workspace thao tac ngay.

**Huong chot**

- Giu `tab theo nhom nghiep vu lon`, khong tach theo tung man nho.
- Trong moi tab, `hien thang form/list de thao tac nhanh`, khong mac dinh an sau accordion.
- Giam manh so card: moi tab toi da `3-4 card chinh`.
- Moi card chi co `1 muc dich chinh`, khong lap lai noi dung giua header tab, status, va body card.
- Metadata phu, truong it dung, va cau hinh nang cao dua vao `drawer` hoac `inline expand`, khong dung card rieng.

**Cac tab chot**

- `Cua hang`
- `Nhan su & ca lam`
- `Chinh sach nhan su`
- `He thong & phan quyen`

**Nguyen tac IA va noi dung**

- Moi tab la `workspace`, khong phai landing page.
- Dau tab chi giu `status strip` mong: muc hoan tat, canh bao, va 1 action uu tien.
- Khong dung card hero lon, card gioi thieu dai, hoac card chi de nhay sang man khac neu nghiep vu da co the lam truc tiep tai `/settings`.
- Thong tin hien thi uu tien theo thu tu: `viec can lam` -> `du lieu dang van hanh` -> `cau hinh nang cao`.
- Moi card chi giu: `tieu de ro`, `1 cau mo ta ngan`, `1 action chinh`, va `list/table/form ngan`.
- Card summary rieng bi loai bo neu card thao tac da the hien duoc trang thai.

**Bo khung tung tab**

### 1. Cua hang

Muc tieu: quan ly nen van hanh diem ban.

Giu 3 card chinh:
- `Mang luoi cua hang`
  - list cua hang
  - them / sua / xoa
  - trang thai hoat dong
  - field phu nhu `checkin_radius_meters`, quy uoc ma, thong tin them dua vao drawer
- `Bo phan & diem lam viec`
  - list bo phan theo cua hang
  - them / sua nhanh
  - khong tach them card mo ta trung nghia
- `Dong bo tu file nhan su`
  - upload file
  - preview thay doi
  - ap dung dong bo
  - thong ke tao moi / cap nhat / ngung hoat dong nam trong cung card, khong lap card summary rieng

Loai bo hoac sat nhap:
- `Thuong hieu & phap nhan` khong de thanh card doc lap tren mat tab; dua vao drawer cau hinh chung neu van can
- moi copy giai thich dai cho `co cau cua hang`

### 2. Nhan su & ca lam

Muc tieu: quan ly cau truc van hanh nhan su hang ngay.

Giu 4 card chinh:
- `Vi tri van hanh`
- `Ca lam`
- `Quy tac xep ca`
- `Dinh bien nhan su`

Quy uoc tinh gon:
- `Dang ky ca mong muon` khong ngang cap neu pham vi hep hon; dua vao phan duoi `Quy tac xep ca` hoac thanh block mo rong
- neu `Vi tri van hanh` va `Ca lam` can di cung nhau, cho phep render thanh 2 panel trong cung 1 card lon, thay vi 2 card roi rac

### 3. Chinh sach nhan su

Muc tieu: quan ly cac rule anh huong quyen loi va phe duyet.

Giu 3 card chinh:
- `Loai nghi phep`
- `Cap bac & khung ap dung`
- `Quy trinh duyet`

Quy uoc tinh gon:
- khong tach `policy summary` va `master data` neu cung phuc vu mot nghiep vu
- bo card nao khong co thao tac truc tiep

### 4. He thong & phan quyen

Muc tieu: quan ly nhom cai dat nhay cam, it doi.

Giu 3 card chinh:
- `Phan quyen vai tro`
- `Thiet lap he thong`
- `Tich hop / thiet bi / bao mat` neu du lieu scope hien tai co that

Quy uoc tinh gon:
- uu tien `1 card lon / 1 nhom nghiep vu` hon nhieu card be status
- status hien tai dua len status strip, khong lap lai trong tung card neu khong can

**Hanh vi tuong tac**

- Search van giu o cap toan trang, loc ca item thao tac trong tab.
- Tab switch khong doi route; day la mot workspace duy nhat.
- Nut `Them` nam ngay tren card va mo `EditDrawer` dung chung.
- `Sua` va `Xoa` nam trong list item cua card, khong mo man rieng.
- `Advanced settings` chi mo khi user can, bang drawer hoac inline expand.
- `Status strip` dua ra 1 action uu tien duy nhat, vi du `Them chi nhanh`, `Cau hinh quy tac xep ca`, `Cap nhat quy trinh duyet`.

**Anh huong code du kien**

- Tiep tuc dung `src/app/settings/page.tsx` lam diem vao duy nhat.
- Can doi tu `section dai theo category` sang `workspace theo tab + card it hon`.
- Co kha nang tach them component moi trong `src/components/settings/*` cho:
  - `SettingsTabWorkspace`
  - `SettingsStatusStrip`
  - `SettingsCardShell`
  - card nghiep vu rieng theo tung tab khi card co logic va state rieng
- Tai su dung `EditDrawer`, `ConfirmDialog`, va service CRUD hien co.

**Khong nam trong scope**

- Khong doi backend, schema, hay co che luu tru trong buoc redesign IA nay.
- Khong mo rong them nhom nghiep vu moi ngoai 4 tab da chot.
- Khong xay dashboard KPI tong quan cho settings.

**Tieu chi xong**

- `/settings` hien 4 tab nghiep vu ro rang.
- Moi tab chi con 3-4 card chinh, khong trung noi dung.
- User thao tac `them / sua / xoa / dong bo` ngay trong tab, khong can qua nhieu lop dieu huong.
- Cac card mo ta ngan, muc dich ro, co action chinh ro rang.
- Cac field phu va setting hiem dung khong chiem dien tich mat chinh.
- Bo cuc moi giam cuon dai va giam card-link trung gian so voi trang hien tai.

**Testing**

- Them test contract cho IA moi cua `/settings`:
  - 4 tab chinh ton tai
  - khong render lai nhieu section trung noi dung cua cung category
  - card count theo tab khong vuot nguong thiet ke mong muon trong mock layout/cofig
- Chay smoke test local de xac nhan:
  - tab switch dung
  - CRUD hien co van mo drawer va confirm dialog dung nhu cu
  - luong `Dong bo tu file nhan su` van hoat dong trong tab `Cua hang`

