# Onboard van hanh do quan ly cua hang cam chinh

## 1. Muc tieu

Chot 1 flow onboard van hanh thuc te, de van hanh duoc o cua hang, theo huong:

- `quan ly cua hang` la nguoi cam chinh
- `HR` chi ban giao du lieu nen truoc ngay vao lam
- man hinh phai gon, de quet nhanh, hop voi cach dung hang ngay
- giu chuan toan he thong, nhung van cho cua hang linh hoat o muc vua du

Flow nay tap trung vao viec dua nguoi moi vao ca dau an toan va ro rang, khong mo rong sang payroll, leave, hay KPI.

## 2. Van de can giai quyet

Neu khong chot flow rieng cho onboard van hanh, se gap 4 van de:

### 2.1. Quan ly khong co 1 cho de quet nhanh nguoi sap vao lam

Quan ly can biet ngay:

- ai vao lam trong vai ngay toi
- ai dang thieu muc quan trong
- ai da san sang

Neu phai mo tung ho so moi biet thieu gi thi qua cham cho van hanh.

### 2.2. Checklist de roi rac, khong ro ai cam viec chinh

Mot so buoc nam o HR, mot so buoc nam o onboarding, mot so buoc lai la viec tai quan. Neu khong chot nguoi cam chinh, ngay dau se de bi sot:

- chua co nguoi kem
- chua chot ca dau
- chua vao nhom chat
- chua nhac lai noi quy tai quan

### 2.3. Do nghiem trong cua tung muc chua ro

Khong phai muc nao cung nang nhu nhau. Can tach:

- muc `block ngay dau`
- muc `can hoan tat som`

Neu tat ca deu do hoac tat ca deu vang thi quan ly mat diem uu tien.

### 2.4. Neu tha tu do setting se loat

Moi cua hang khong nen tu ve ra 1 bo checklist rieng. He thong can co bo khung chung, nhung van cho tung cua hang chinh vai muc phu hop thuc te.

## 3. Quyet dinh chot

Flow nay chot 4 quyet dinh lon:

1. `Quan ly cua hang` cam chinh onboard van hanh
2. Man hinh chinh di theo `2 lop`: danh sach tong -> checklist tung nguoi
3. Trang thai di theo `do / vang / xanh`
4. Setting di theo `2 tang`: toan he thong + override gioi han theo cua hang

## 4. Vai tro va pham vi

### 4.1. HR

HR lo phan ban giao truoc:

- ten nhan vien
- vi tri
- cua hang
- ngay vao lam
- cac trang thai giay to / noi quy lien quan

HR khong cam checklist van hanh ngay dau o pass nay.

### 4.2. Quan ly cua hang

Quan ly cua hang la nguoi chiu trach nhiem chinh cho:

- chot ca dau va gio co mat
- gan nguoi kem
- xac nhan dong phuc, cham cong, noi quy tai quan
- them nhom chat, cong cu, quyen dung thiet bi neu can
- chot ket qua sau ca dau

### 4.3. Admin trung tam

Admin trung tam giu bo rule mac dinh cho toan he thong:

- muc nao la `block ngay dau`
- muc nao la `can hoan tat som`
- khung checklist pass dau
- khoang nhin mac dinh cua danh sach, de xuat la `7 ngay toi`

## 5. Thiet ke man hinh chinh

### 5.1. Lop 1: Danh sach nguoi sap vao lam

Day la man quan ly mo ra dau tien.

Muc tieu:

- quet nhanh nguoi moi trong `7 ngay toi`
- thay ngay ai dang do, vang, xanh
- thay ngay muc thieu chinh ma khong can mo sau

Moi dong trong danh sach chi nen hien:

- ten
- vi tri
- ngay vao lam
- trang thai tong
- toi da `2 muc thieu chinh`

Quy tac hien muc thieu:

- neu chi thieu 1 muc: hien 1 muc
- neu thieu 2 muc: hien 2 muc
- neu thieu hon 2 muc: hien `2 muc + so muc con lai`

Vi du:

- `Thieu nguoi kem`
- `Thieu nguoi kem, chua vao nhom chat`
- `Thieu nguoi kem, chua vao nhom chat +2 muc`

### 5.2. Lop 2: Checklist chi tiet tung nguoi

Khi bam vao 1 nguoi trong danh sach, quan ly mo checklist chi tiet.

Checklist chia thanh 2 nhom ro:

1. `Truoc ngay dau`
2. `Sau ca dau`

Pass dau gom 5 nhom viec:

1. ca dau va gio co mat
2. nguoi kem / nguoi huong dan
3. dong phuc, cham cong, noi quy tai quan
4. tai khoan, nhom chat, cong cu
5. xac nhan xong ca dau on

Moi nhom chi nen hien ngan:

- trang thai
- noi dung thieu chinh
- thao tac can lam neu co

Khong bien checklist thanh form dai bat quan ly nhap nhieu chu.

## 6. Rule trang thai va canh bao

He thong chi dung 3 muc tong:

### 6.1. `Do = Block ngay dau`

Dung khi nhan vien dang thieu muc thuoc nhom block.

Vi du:

- chua co nguoi kem
- chua co ca dau neu cua hang dat muc nay la block
- chua vao duoc cham cong neu cua hang duoc phep override muc nay thanh block

### 6.2. `Vang = Can hoan tat som`

Dung khi chua chan ngay dau, nhung can xu ly gap.

Vi du:

- chua vao nhom chat
- chua nhac lai noi quy tai quan
- chua du cong cu phu

### 6.3. `Xanh = San sang`

Dung khi da du dieu kien truoc ngay dau theo rule hien hanh.

## 7. Setting 2 tang

### 7.1. Tang 1: Toan he thong

Admin trung tam dat bo mac dinh:

- checklist chuan pass dau
- muc nao la `block ngay dau`
- muc nao la `can hoan tat som`
- khoang nhin danh sach mac dinh

Bo nay la xuong song chung, de tat ca cua hang van di cung 1 huong.

### 7.2. Tang 2: Theo cua hang

Moi cua hang duoc override `mot vai muc gioi han`, khong duoc sua tung thu tu do.

Cua hang co the duoc chinh:

- bat/tat them vai muc block trong danh sach cho phep
- doi nguoi nhan nhac viec
- doi moc nhac gan ngay vao lam

Cua hang khong duoc:

- tu tao checklist rieng
- tu doi ten nhom viec
- tu bo nhom viec chuan
- tu sua rule he thong ngoai danh sach override duoc mo

### 7.3. Quan ly cua hang khong sua setting trong luc lam checklist

Quan ly tap trung xu ly tung nguoi:

- gan nguoi kem
- chot ca dau
- tick xong tung muc
- chot ket qua sau ca dau

Khong doi rule ngay trong luong thao tac hang ngay.

## 8. Data flow nghiep vu

Flow tong di theo 4 chang:

### 8.1. Chang A - HR ban giao

HR day du lieu nen cho quan:

- nhan vien
- vi tri
- cua hang
- ngay vao lam
- thong tin noi quy / giay to lien quan neu co

### 8.2. Chang B - He thong tu tinh trang thai

He thong tu tong hop:

- checklist chuan
- rule block toan he thong
- override cua cua hang
- tien do tung muc do quan ly cap nhat

Tu do sinh ra:

- trang thai do / vang / xanh
- 2 muc thieu chinh tren dong danh sach
- thong diep ket luan ngan trong man chi tiet

### 8.3. Chang C - Quan ly xu ly truoc ngay dau

Quan ly vao checklist va lan luot:

- chot ca dau
- gan nguoi kem
- xac nhan dong phuc / cham cong / noi quy tai quan
- them nhom chat / cong cu

### 8.4. Chang D - Chot sau ca dau

Sau khi nhan vien di ca dau, quan ly chot ket qua ngan gon.

De xuat 3 ket qua:

1. `On, hoan tat onboard van hanh`
2. `On mot phan, can theo sat them`
3. `Co van de, can xu ly ngay`

Muc tieu la de quan ly bam nhanh, khong phai viet bao cao dai.

## 9. Rule UI theo Homies

UI cho flow nay phai theo huong `gon, am, de quet`.

Nguyen tac:

- nen trang tong la tong `am`, uu tien nen kem nhe
- card trang, bong nhe, vien mong
- mau manh chi dung o tag trang thai va diem can nhan
- `do` chi dung cho block that
- `vang` chi dung cho can hoan tat som
- `xanh` chi dung cho san sang / hoan tat
- danh sach khong nhoi nhieu text
- checklist khong thanh form nang

Cam giac can dat:

- than thien
- sach
- hien dai
- de dung tren mobile
- ro thong tin cho van hanh hang ngay

## 10. Out of scope cho pass dau

Khong lam trong flow nay:

- payroll
- leave
- KPI
- quiz noi quy
- workflow danh gia nang luc sau nhieu ngay
- cho moi cua hang tu tao checklist rieng hoan toan
- form dai cho quan ly ghi bao cao tu do

## 11. Ket qua mong muon

Sau khi ap dung flow nay:

- quan ly mo 1 man la biet ai sap vao lam va ai dang co rui ro
- nguoi moi khong vao ca dau trong tinh trang thieu nguoi kem hay thieu dau viec quan trong
- HR khong phai om ca van hanh ngay dau
- chuoi van giu duoc 1 khung chung, nhung cua hang van co du linh hoat de dung thuc te

## 12. Huong verify cho plan code sau nay

Khi chuyen sang plan code, can verify it nhat:

1. man danh sach hien dung nguoi sap vao lam trong khoang thoi gian mac dinh
2. moi dong hien dung trang thai tong va toi da 2 muc thieu chinh
3. mo tung nguoi ra thay checklist tach ro `truoc ngay dau` va `sau ca dau`
4. doi rule block mac dinh thi mau/trang thai cap nhat dung
5. override theo cua hang chi sua duoc cac muc duoc mo
6. quan ly chot ket qua sau ca dau bang 1 lua chon ngan, khong can nhap nhieu chu
