# Flow noi quy nhan viec va setting toi thieu

## 1. Muc tieu

Chot 1 flow gon, de van hanh, cho viec gui noi quy cho nhan vien moi.

Muc tieu chinh:
- nhan vien biet truoc cac quy dinh quan trong
- HR khong phai nhac lai bang tay qua nhieu
- quan ly ngay dau biet ai da doc, ai chua doc
- khong bien flow nay thanh 1 cum setting qua phuc tap

## 2. Van de hien tai

Flow nhan viec hien tai da co:
- gui form tu dien
- HR duyet
- tao hop dong
- gui ky hop dong
- dua vao danh sach nhan vien

Nhung chua co flow ro rang cho `noi quy`:
- gui khi nao
- gui ban tom tat hay ban day du
- co bat xac nhan hay khong
- ai theo doi neu nhan vien chua doc

Trong mock onboarding hien tai, `Doc noi quy cong ty` dang nam o nhom viec ngay dau. Cach nay hoi muon vi den luc vao ca moi nhin thay noi quy.

## 3. Quyet dinh chot

Flow noi quy se di theo huong `2 nhip` va `co setting toi thieu`.

### 3.1. Khung flow co dinh

Khung flow chinh KHONG cho chinh tung buoc mot:

1. Gui ban tom tat som
2. Gui ban day du + yeu cau xac nhan gan ngay vao lam
3. Neu chua xac nhan thi nhac lai
4. Ngay dau quan ly kiem tra va chot tai cua hang

Ly do giu co dinh:
- tranh moi chi nhanh van hanh moi kieu
- de bao cao va theo doi trang thai de hon
- de sau nay noi vao onboarding khong bi vo flow

### 3.2. Setting chi o muc toi thieu

Cho phep chinh cac muc sau:
- bat/tat flow noi quy
- moc gui ban tom tat
- moc gui ban day du
- gui truoc ngay vao lam may ngay
- co bat nhan vien xac nhan hay chi can doc
- nhac toi da may lan neu chua xac nhan
- dung mau noi quy nao
- ai nhan canh bao neu nhan vien chua xac nhan

Khong cho chinh:
- bo khung 2 nhip
- bo buoc quan ly check ngay dau
- doi ten trang thai he thong
- bo lich su gui va lich su xac nhan

## 4. Flow de xuat chi tiet

### Chang A - Sau khi HR duyet ho so

Dieu kien:
- ung vien da duoc HR duyet
- da san sang di tiep sang hop dong / nhan viec

He thong:
- cho phep gui `Noi quy tom tat`
- ban tom tat chi gom 5-7 y quan trong

Noi dung tom tat nen co:
- dong phuc
- gio giac
- di tre
- bao nghi
- doi ca
- ve sinh
- tac phong

Muc tieu:
- cho nhan vien moi biet truoc
- giam bat ngo truoc ngay vao lam

O chang nay:
- KHONG bat xac nhan
- KHONG coi day la hoan tat noi quy

### Chang B - Sau khi hop dong xong hoac truoc ngay vao lam

Day la chang chinh.

Mac dinh de xuat:
- gui `Noi quy day du` sau khi hop dong da xong
- neu chua co diem gui sau hop dong thi gui truoc ngay vao lam 1 ngay

He thong gui:
- ban noi quy day du
- thong tin chi nhanh
- vi tri
- ngay vao lam
- ten nguoi phu trach / quan ly
- gio can co mat ngay dau

Neu bat xac nhan:
- nhan vien thay nut `Toi da doc`
- va nut `Toi can HR giai thich them`

Neu khong bat xac nhan:
- van luu dau vet la he thong da gui
- quan ly ngay dau van can check lai

### Chang C - Nhac lai neu chua xac nhan

Neu da bat xac nhan ma nhan vien chua xac nhan:
- he thong nhac lai theo setting
- toi da theo so lan da cau hinh

Nguoi can thay canh bao:
- HR
- quan ly cua hang nhan vien se vao lam

Canh bao can ro:
- ai chua xac nhan
- con bao nhieu ngay toi ngay vao lam
- da nhac bao nhieu lan

### Chang D - Ngay dau vao lam

Quan ly check trong checklist ngay dau:
- da doc chua
- da xac nhan chua
- co can giai thich them khong

Neu da xac nhan truoc do:
- muc `Doc noi quy cong ty` gan nhu hoan tat san

Neu chua xac nhan:
- mo lai noi quy tai cua hang
- giai thich ngan neu can
- nhan vien xac nhan tai cho

## 5. Trang thai can co

De tracking don gian, de xuat bo trang thai sau:
- `chua_gui`
- `da_gui_tom_tat`
- `da_gui_day_du`
- `da_doc`
- `da_xac_nhan`
- `can_nhac`
- `can_giai_thich`

Rule don gian:
- `da_gui_tom_tat` khong thay the cho `da_gui_day_du`
- chi `da_xac_nhan` moi duoc xem la da chot
- `can_giai_thich` uu tien hien cho HR/quan ly de xu ly truoc ngay dau

## 6. Setting toi thieu de lam o pass dau

De nghi chi lam 1 cum setting nho, tranh phong to scope:

1. `Bat flow noi quy`
2. `Gui ban tom tat tai moc nao`
3. `Gui ban day du tai moc nao`
4. `Gui truoc ngay vao lam bao nhieu ngay`
5. `Co bat xac nhan khong`
6. `Nhac toi da may lan`
7. `Mau noi quy dang dung`
8. `Ai nhan canh bao`

Mac dinh de xuat:
- bat flow = bat
- gui tom tat = luc gui hop dong
- gui day du = truoc ngay vao lam 1 ngay
- bat xac nhan = co
- nhac toi da = 1 lan

## 7. Diem cham tren man hinh

Khong doi flow lon, chi chen them vao diem dang co:

- `Employees Invitations / Contracts`:
  HR thay trang thai noi quy va nut gui lai neu can
- `Employee profile`:
  thay lich su noi quy cua tung nhan vien
- `Onboarding`:
  muc `Doc noi quy cong ty` doc trang thai tu flow nay
- `Notifications`:
  HR/quan ly nhan nhac khi sap toi ngay vao lam ma van chua xac nhan

## 8. Out of scope cho pass dau

Khong lam trong pass dau:
- quiz noi quy
- tach noi quy theo tung vai tro rat sau
- e-sign rieng cho noi quy
- workflow duyet noi quy nhieu cap
- bao cao nang cao theo cum chi nhanh

## 9. Ket qua mong muon

Sau khi ap dung flow nay:
- nhan vien moi khong bi nhan noi quy qua muon
- HR co moc gui ro rang
- quan ly ngay dau khong bi mo ho khi don nguoi moi
- he thong van gon, it setting, de demo va de nang cap sau
