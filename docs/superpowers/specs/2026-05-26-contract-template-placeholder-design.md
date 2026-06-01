# Flow mau hop dong placeholder va preview web

## 1. Muc tieu

Chot pass dau cho khu `Hop dong` theo huong:
- mau `docx` duoc chuan hoa bang placeholder
- app quet field tu mau
- app tu do du lieu co san vao hop dong
- HR xem preview web de soat nhanh
- HR xem panel field de biet field nao du, thieu, hoac sai chuan
- he thong chan gui ky neu du lieu chua sach

Muc tieu cua pass dau:
- giam soan hop dong bang tay
- giam loi copy sai du lieu
- giup HR khong phai doc tay tung trang de tim field loi
- tao nen tang de mo rong sang flow ky o pass sau

## 2. Van de hien tai

Module hop dong hien tai da co:
- danh sach hop dong
- preview noi dung da render
- service hop dong va bo custom field co ban

Nhung chua co lop `mau docx chuan` de dung lai on dinh:
- chua co quy tac placeholder chot
- chua co buoc quet field tu file mau
- chua co panel soat field ro rang
- chua co checklist chan loi truoc khi gui ky

Neu giu cach lam bang noi dung gan nhu tu do:
- HR van phai soat thu cong nhieu
- de sot field thieu trong file dai
- kho scale khi them nhieu mau theo vi tri va chi nhanh

## 3. Quyet dinh chot

Chot `Cach 1: Placeholder cung + preview web + panel field`.

Huong nay co 4 quyet dinh nen:
1. Mau hop dong phai dung placeholder chuan dang `{{group.field}}`
2. App phai quet field tu mau ngay khi upload
3. App phai render preview web de HR soat trong app
4. App phai co panel field + checklist loi va chan gui ky neu con loi

Khong chon pass dau theo huong:
- chi hien danh sach field ma khong co preview web
- cho map tay truc tiep len noi dung hop dong
- cho render tu do khong theo bo field chuan

## 4. Pham vi pass dau

Pass dau chi gom:
- upload 1 file mau `docx`
- quet placeholder tu file mau
- luu metadata field cua mau
- chon nhan su de do du lieu
- render preview web tu noi dung da thay field
- hien panel field va checklist loi
- khoa nut `Gui ky` neu con field thieu hoac field la

Pass dau chua gom:
- ky that, OTP that, chu ky so that
- editor sua mau tren web
- map tay field tren tung doan noi dung
- render giong Word 100%
- import hang loat nhieu mau phuc tap trong cung 1 lan
- parser nang cho header/footer/bang bieu dac thu den muc giong file goc tuyet doi

## 5. Quy tac placeholder

### 5.1. Dinh dang chap nhan

Chi nhan placeholder theo dang:
- `{{employee.full_name}}`
- `{{store.name}}`
- `{{contract.start_date}}`

Rule:
- co dau `{{` va `}}`
- ben trong la `group.field`
- chi dung chu thuong, so, dau gach duoi
- khong cho long nhau
- khong cho tieng Viet co dau trong key

Regex de thong nhat logic quet:
- `{{\\s*([a-z0-9_]+)\\.([a-z0-9_]+)\\s*}}`

### 5.2. Phan loai field sau khi quet

Moi field trong mau sau khi quet se roi vao 1 trong 4 nhom:
- `hop_le`: nam trong bo field chuan va co the map du lieu
- `thieu_du_lieu`: field hop le nhung record hien tai chua co gia tri
- `field_la`: khong nam trong bo field chuan
- `trung_lap`: xuat hien nhieu lan trong mau

`trung_lap` khong phai loi chan gui ky neu gia tri dung. No chi la canh bao de HR de y.

### 5.3. Rule chan gui ky

Nut `Gui ky` bi khoa neu co it nhat 1 dieu kien:
- con `field_la`
- con `thieu_du_lieu`
- mau chua quet field xong
- preview render loi

Nut `Gui ky` duoc mo khi:
- tat ca field deu hop le
- du lieu can thiet da co
- preview render thanh cong

## 6. Bo field dau can ho tro

Pass dau chot cac nhom sau:

### 6.1. `employee.*`
- `employee.full_name`
- `employee.employee_code`
- `employee.phone`
- `employee.email`
- `employee.address`
- `employee.id_number`
- `employee.bank_name`
- `employee.bank_account`
- `employee.start_date`

### 6.2. `store.*`
- `store.name`
- `store.address`
- `store.phone`
- `store.manager_name`

### 6.3. `position.*`
- `position.name`
- `position.level`

### 6.4. `contract.*`
- `contract.code`
- `contract.type`
- `contract.start_date`
- `contract.end_date`
- `contract.signer_name`
- `contract.signer_title`

### 6.5. `salary.*`
- `salary.official`
- `salary.probation`
- `salary.allowances`
- `salary.kpi`

### 6.6. `policy.*`
- `policy.work_rules`
- `policy.dress_code`
- `policy.cash_handling`
- `policy.food_safety`
- `policy.attendance`
- `policy.overtime`
- `policy.discipline`
- `policy.contract_note`

Neu mau dung field ngoai danh sach nay, app bao `field_la`.

## 7. Flow nguoi dung

### 7.1. Upload mau

1. HR vao thu vien mau hop dong
2. HR tai file `docx`
3. App quet placeholder trong file
4. App tra ve:
- danh sach field tim thay
- so field hop le
- so field la
- so field trung lap
5. Neu co `field_la`, mau van duoc xem tam nhung khong nen bat `active`

### 7.2. Tao preview tu nhan su

1. HR chon 1 mau
2. HR chon 1 nhan su
3. App lay du lieu tu ho so nhan su, cua hang, chuc danh, hop dong, luong, noi quy
4. App thay placeholder bang du lieu thuc te
5. App render preview web
6. App to mau hoac danh dau doan co field vung vua duoc do

### 7.3. Soat field truoc khi gui

1. HR mo panel field ben canh preview
2. App hien tung field, gia tri xem truoc, va trang thai
3. Checklist tong ket:
- so field hop le
- field thieu du lieu
- field la
- canh bao trung lap
4. HR chi duoc gui khi checklist dat

## 8. Man hinh can co

### 8.1. Thu vien mau hop dong

Muc tieu:
- xem danh sach mau
- biet mau nao dang sach, mau nao dang loi

Can co:
- ten mau
- loai mau
- ngay cap nhat
- so field tim thay
- trang thai `draft` / `active` / `can_soat`

### 8.2. Man hinh upload va quet field

Muc tieu:
- tai file mau
- thay ket qua quet ngay

Can co:
- vung upload file
- danh sach field tim thay
- nhom loi va canh bao
- huong dan placeholder chuan

### 8.3. Man hinh preview hop dong

Muc tieu:
- HR xem hop dong trong app ma khong can mo Word

Bo cuc de xuat:
- trai: thong tin nguon du lieu chinh
- giua: preview web
- phai: panel field + checklist loi

### 8.4. Panel field

Can co cho moi field:
- ten field
- nhom field
- gia tri hien tai
- trang thai
- ghi chu vi sao loi neu co

Can co bo loc nhanh:
- tat ca
- hop le
- thieu du lieu
- field la
- trung lap

## 9. Rule preview web

Preview web trong pass dau phai uu tien:
- doc nhanh
- de soat field
- on dinh tren web

Preview web khong can:
- giong file Word 100%
- giu moi chi tiet can le khoang cach phuc tap
- giu dung moi block trang tri cua file goc

Nguyen tac:
- noi dung phai dung nghia
- thu tu doan van phai giu dung
- field duoc do du lieu nen co cach nhan biet de HR soat nhanh

## 10. Trang thai loi va canh bao

Can thong nhat 4 muc hien thi:

- `Dat`: field hop le va da co du lieu
- `Can bo sung`: field hop le nhung thieu du lieu
- `Khong dung chuan`: field la, sai key, hoac sai format
- `Can xem lai`: field trung lap hoac preview co diem can de y

Muc uu tien xu ly:
1. `Khong dung chuan`
2. `Can bo sung`
3. `Can xem lai`
4. `Dat`

## 11. Gioi han ro cho pass dau

Pass dau khong co muc tieu bien web thanh trinh sua `docx`.

Phan nay chi giai quyet bai toan:
- chuan hoa mau
- quet field
- do du lieu
- preview de soat
- chan loi truoc khi gui ky

Nhung bai toan de sau:
- countersign day du
- version file da ky
- PDF snapshot that
- editor block tren web
- map tay field cho mau lon xon
- bo rule nang cho nhieu loai phu luc dac biet

## 12. Dieu kien xong cho muc 1

Muc 1 duoc xem la xong khi:
1. Co it nhat 1 mau `docx` mau dung placeholder chuan
2. App quet duoc danh sach placeholder tu mau
3. App phan loai duoc field hop le, field la, field thieu du lieu, field trung lap
4. App render duoc preview web tu du lieu nhan su
5. Panel field hien ro gia tri va trang thai tung field
6. Checklist tong hop hien ro loi truoc khi gui
7. Nut `Gui ky` bi khoa neu con `field_la` hoac `thieu_du_lieu`
8. Flow nay noi duoc vao module contracts hien co ma khong doi huong van hanh lon

## 13. Huong noi vao app hien tai

De giu scope gon, muc 1 nen noi vao cum file hop dong hien co:
- `src/app/employees/contracts/page.tsx`
- `src/app/employees/contracts/[id]/page.tsx`
- `src/app/employees/contracts/_components.tsx`
- `src/lib/services/contract-service.ts`
- `src/lib/services/contract-service-data.ts`

Huong noi:
- them lop metadata cho mau hop dong
- them ham quet placeholder va phan loai field
- them du lieu panel field/checklist de UI doc lai
- giu flow list hop dong va detail hop dong hien co lam nen
