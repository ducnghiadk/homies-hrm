# Tinh gon Tong quan va nang cap tab Noi quy onboarding

## 1. Muc tieu

Nang cap trang chi tiet nhan su de:

- `Tong quan` gon hon, chi con thong tin quyet dinh nhanh
- `Noi quy & onboarding` de theo doi van hanh bang bang ngang
- tranh tinh trang nguoi xem phai doc qua nhieu card doc tren 1 man hinh
- sua toan bo chu UI nguoi dung nhin thay sang `tieng Viet co dau`
- bo sung `ngay gui du kien` theo `setting tung moc`

## 2. Van de hien tai

Sau pass tach tab truoc:

- `Tong quan` da gon hon nhung van can giu ky luat la man tom tat, khong keo chi tiet quay lai
- tab `Noi quy & onboarding` da co bang ngang, nhung van con cac van de:
  - mot so text UI dang la tieng Viet khong dau
  - chua co cot `Ngay du kien`
  - chua phan biet ro `chua toi lich`, `tre moc`, `dang cho phan hoi`, `da xong`
  - chua nhin ro moc nao dang can xu ly truoc

## 3. Quyet dinh chot

### 3.1. Rule ngon ngu UI

Tat ca chuoi nguoi dung nhin thay tren man hinh nay phai la `tieng Viet co dau`.

Bao gom:

- ten cot bang
- badge trang thai
- mo ta duoi card
- lich su gan day
- thong diep canh bao
- nut thao tac

Khong duoc de lot bat ky chuoi khong dau nao trong UI.

### 3.2. Vai tro cua tung tab

#### Tong quan

Chi giu 4 cum:

1. trang thai tong cua ho so
2. 3 o tom tat nho
3. viec can chot ngay
4. loi tat sang tab chi tiet

Khong dua lai vao `Tong quan`:

- bang onboarding chi tiet
- lich su onboarding day du
- bang hop dong
- timeline dai

#### Noi quy & onboarding

La noi HR/quan ly vao de theo doi tien do thuc te.

Tab nay giu 3 lop:

1. `hero tong quan`
2. `bang tien do onboarding`
3. `lich su gan day`

#### Hop dong

Giu bang ngang rieng cho hop dong, khong lap lai trong tab khac.

## 4. Thiet ke tab Noi quy & onboarding

### 4.1. Hero dau tab

Giu bo cuc hien tai, nhung text phai co dau va ro nghiep vu hon:

- ten khoi: `Noi quy nhan viec`
- trang thai lon: vi du `Dang cho nhan vien doc va phan hoi`
- cau hanh dong tiep theo: vi du `Nhan vien can xac nhan hoac gui yeu cau giai thich them`
- nut hanh dong chinh: `Xac nhan tai cua hang ngay dau` khi du dieu kien

Them dong tong ket nho:

- `Con X moc can xu ly`
- `Y moc dang tre`

### 4.2. Bang tien do onboarding

Bang nay la trung tam theo doi chinh.

#### Cot bang chot

1. `Moc`
2. `Trang thai`
3. `Ngay du kien`
4. `Ngay da gui / phan hoi`
5. `Ghi chu`

#### Cach hien cot `Ngay du kien`

`Ngay du kien` khong hard-code.

No phai duoc tinh tu `setting tung moc`, vi du:

- sau duyet ho so
- sau ky hop dong
- truoc ngay vao lam X ngay
- ngay dau vao lam

Tren UI, can hien ro ngay cu the. Neu can, co them label phu ngan de biet moc lay tu dau, vi du:

- `Truoc ngay vao lam 1 ngay`
- `Sau ky hop dong`

#### Cach hien cot `Ngay da gui / phan hoi`

User da chot: `gop chung 1 cot`.

Nguyen tac:

- voi moc gui: hien ngay gui that neu da gui
- voi moc phan hoi: hien ngay nhan vien phan hoi neu da co
- neu chua co: hien trang thai phu hop thay vi de trong

#### Trang thai van hanh can co

Can co bo nhan de quan ly nhin phat hieu ngay:

- `Da xong`
- `Dang cho`
- `Chua toi lich`
- `Tre moc`
- `Can giai thich`

Khong dung nhan mo ho nhu chi `pending` chung chung.

#### Quy tac mau

- xanh: `Da xong`
- vang: `Dang cho` hoac `sap toi moc`
- cam/do: `Tre moc` hoac `Can giai thich`
- xam: `Chua toi lich`

### 4.3. Lich su gan day

Van giu gon:

- chi hien `3 moc moi nhat`
- co `Xem tat ca` neu can mo rong sau
- text co dau, uu tien cau nghiep vu ngan

## 5. Nang cap nghiep vu nen co them

Ngoai phan layout, tab nay nen nang cap them cac diem sau:

### 5.1. Uu tien moc sap den han

Bang nen sap theo thu tu:

1. moc dang tre
2. moc sap den han
3. moc da xong
4. moc chua toi lich

Muc tieu la nguoi quan ly vao se thay ngay viec can xu ly truoc.

### 5.2. Tong ket van hanh tren dau bang

Them dong thong ke ngan:

- `1 moc dang tre`
- `2 moc dang cho`
- `1 moc da xong`

Khong can bieu do, chi can nhin nhanh.

### 5.3. Ghi chu theo huong hanh dong

Cot `Ghi chu` khong viet dai.

Uu tien kieu:

- `Nen gui som de nhan vien biet truoc quy dinh chinh`
- `Dang cho nhan vien xac nhan`
- `Can quan ly chot vao ngay dau`

Khong de mo ta lan man.

## 6. Ngoai scope cho pass nay

Khong lam trong pass tiep theo:

- sua flow setting lon o trang cau hinh
- them dashboard bao cao tong hop onboarding
- them nguoi phu trach tung moc
- them bo loc nang cao cho lich su

## 7. Ket qua mong muon

Sau khi ap dung ban nang cap nay:

- `Tong quan` nhin 1 lan la du
- tab `Noi quy & onboarding` tro thanh man theo doi thuc te
- HR/quan ly thay ngay `moc nao den han`, `moc nao tre`, `moc nao da xong`
- khong con text UI khong dau tren man hinh
