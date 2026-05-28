# Practical HRM MVP Flow

Ngay cap nhat: 2026-05-19

Muc tieu tai lieu:
- Chot lai web HRM theo huong "dung duoc that", khong dan trai tinh nang.
- Xac dinh flow toi thieu cho 3 vai tro: nhan vien, quan ly cua hang, HR/Admin.
- Dinh nghia nhung man hinh va thao tac can co ngay tu luc 1 nhan su bat dau vao lam.
- Dat nen tang cho giai doan build tiep theo.

---

## 1. Ket luan nhanh

Codebase hien tai da co rat nhieu module, nhung neu dua theo van hanh thuc te cua cua hang F&B thi chua nen build tiep theo kieu "them tinh nang". Can thu gon ve mot MVP chac.

Ban MVP nen chi xoay quanh 6 cum nghiep vu:
- Dang nhap va kich hoat tai khoan
- Ho so nhan vien co ban
- Lich lam
- Cham cong
- Nghi phep va yeu cau
- Bang dieu khien theo vai tro

Tat ca module khac nhu KPI, career path, wellness, chat, gamification, learning, analytics nang cao nen de sau khi 6 cum tren chay on.

---

## 2. Flow thuc te cua 1 nhan su moi

### Giai doan 1: Truoc ngay vao lam

HR/Admin can lam:
- Tao ho so nhan vien
- Gan cua hang
- Gan chuc danh
- Gan vai tro he thong
- Gan ngay bat dau lam
- Cap trang thai `sap_nhan_viec` hoac `thu_viec`
- Tao tai khoan dang nhap hoac gui link kich hoat

He thong can co:
- Form tao nhan vien thuc su
- Ma nhan vien duy nhat
- Trang thai nhan su ro rang
- Log nguoi tao va thoi diem tao

### Giai doan 2: Ngay dau vao lam

Nhan vien can lam:
- Dang nhap lan dau
- Doi mat khau
- Xac nhan thong tin ca nhan co ban
- Xem cua hang lam viec
- Xem lich lam sap toi
- Biet cach cham cong

He thong can co:
- Man hinh chao mung lan dau
- Checklist onboarding ngan gon
- Nut ro rang: `Xem lich`, `Cham cong`, `Xin nghi`, `Cap nhat ho so`

### Giai doan 3: Su dung hang ngay

Nhan vien can lam:
- Mo app/web va thay ngay hom nay co ca hay khong
- Neu co ca: check-in nhanh
- Trong ngay: xem thong tin ca, lien he quan ly neu co van de
- Cuoi ca: check-out
- Khi can: xin nghi, xin doi ca, nhan ca trong

Quan ly can lam:
- Xem hom nay ai di lam
- Xem ai tre, ai vang, ai chua check-in
- Xu ly nghi phep, doi ca, open shift
- Chinh lich truoc khi publish

HR/Admin can lam:
- Theo doi du lieu nhan su
- Soat ngoai le cong
- Quan ly trang thai nhan vien
- Chuan bi du lieu cho payroll

---

## 3. 3 vai tro va nhu cau thuc te

### Nhan vien

Can thay nhanh:
- Hom nay lam ca nao
- May gio vao ca
- Da check-in chua
- Con bao nhieu ngay phep
- Yeu cau cua minh dang cho duyet hay da duyet

Khong nen thay tren menu chinh:
- Bao cao
- Cau hinh he thong
- KPI phuc tap
- Qua nhieu entry point gay roi

### Quan ly cua hang

Can thay nhanh:
- Lich cua ngay
- Nhan su thieu/du
- Danh sach di tre, vang mat, nghi phep
- Yeu cau can duyet
- Tuan lich dang nhap hay da publish

Khong nen bat quan ly vao:
- Qua nhieu dashboard cap cao
- Module khong lien quan truc tiep van hanh ca

### HR/Admin

Can thay nhanh:
- Nhan su moi
- Nhan su sap nghi / da nghi
- Ngoai le cong
- Yeu cau can xu ly
- Cac du lieu thieu trong ho so

Khong nen de lẫn:
- Bao cao CEO
- Dashboard cua nhan vien
- Chuc nang mo rong chua lien quan den du lieu nguon

---

## 4. Feature set toi thieu de "dung duoc that"

## 4.1 Auth va account

Bat buoc phai co:
- Dang nhap that
- Dang xuat
- Quen mat khau
- Doi mat khau lan dau
- Role-based access dung that
- Nhan vien chi xem duoc du lieu cua minh

Khong the go-live neu:
- Van con login demo bang local state
- Role chi doi UI nhung khong chan du lieu

## 4.2 Ho so nhan vien co ban

Bat buoc phai co:
- Ma nhan vien
- Ho ten
- So dien thoai
- Email dang nhap
- Cua hang
- Chuc danh
- Vai tro
- Ngay vao lam
- Trang thai lam viec

Nen co ngay sau do:
- CCCD
- Tai khoan ngan hang
- Nguoi lien he khan cap
- Tai lieu hop dong

## 4.3 Lich lam

Bat buoc phai co:
- Tao lich theo tuan
- Trang thai `nhap`
- Trang thai `da publish`
- Nhan vien chi thay lich da publish
- Quan ly sua lich nhap duoc
- Cac canh bao xung dot co ban

Nen de phase 2:
- Auto scheduling nang cao
- Toi uu labor cost qua sau

## 4.4 Cham cong

Bat buoc phai co:
- Check-in
- Check-out
- Ghi nhan gio thuc te
- Ghi nhan ngoai le: tre, som, thieu check-out
- Gop voi lich da publish
- Quan ly xem duoc cong theo ngay

Neu co GPS/WiFi/offline:
- Phai co trang thai ro rang
- Phai co log dong bo
- Phai tranh ghi trung

## 4.5 Nghi phep va yeu cau

Bat buoc phai co:
- Tao don nghi
- Trang thai `cho_duyet`, `da_duyet`, `tu_choi`, `da_huy`
- Quan ly duyet/tu choi
- Ghi ly do
- Cap nhat vao lich va cong

Nen co tiep theo:
- Doi ca
- Open shift
- Yeu cau sua cong

## 4.6 Dashboard theo vai tro

Employee dashboard chi can:
- Ca hom nay
- Nut cham cong
- Lich tuan nay
- So du nghi phep
- Yeu cau gan day

Manager dashboard chi can:
- Lich hom nay
- Ai chua check-in
- Ai nghi / ai duoc duyet
- Yeu cau can duyet
- Tuan lich can publish

HR dashboard chi can:
- Nhan vien moi
- Ho so thieu thong tin
- Ngoai le cong
- Nhan vien sap offboarding
- Tong hop yeu cau can xu ly

---

## 5. User flow toi thieu can build truoc

## Flow A: Tao nhan vien moi

1. HR tao nhan vien
2. He thong tao employee code
3. Gan store, role, position
4. Gui thong tin dang nhap
5. Nhan vien dang nhap lan dau
6. Nhan vien xac nhan thong tin

## Flow B: Xep lich va publish

1. Quan ly tao lich tuan
2. Quan ly gan ca cho nhan vien
3. He thong canh bao xung dot co ban
4. Quan ly publish lich
5. Nhan vien nhan duoc lich chinh thuc

## Flow C: Cham cong hang ngay

1. Nhan vien vao trang chu
2. Thay card `Ca hom nay`
3. Bam `Check-in`
4. He thong xac nhan vi tri/WiFi neu ap dung
5. Luu ban ghi cong
6. Cuoi ca bam `Check-out`

## Flow D: Xin nghi

1. Nhan vien vao `Nghi phep`
2. Chon ngay, loai nghi, ly do
3. Gui duyet
4. Quan ly vao `Yeu cau can duyet`
5. Duyet hoac tu choi
6. He thong cap nhat lich/cong

## Flow E: Xu ly ngoai le cong

1. Quan ly/HR mo danh sach ngoai le
2. Loc theo ngay, cua hang, nhan vien
3. Xem ly do
4. Xac nhan hoac dieu chinh
5. Ghi log nguoi sua va thoi diem

---

## 6. Goi y cau truc menu de de dung ngay

Nen rut gon thanh 5 muc cho nhan vien:
- Trang chu
- Lich lam
- Cham cong
- Nghi phep
- Tai khoan

Nen rut gon thanh 6 muc cho quan ly:
- Trang chu
- Nhan vien
- Lich lam
- Cham cong
- Yeu cau
- Them

Ben trong `Them` moi dat:
- Bao cao
- Cai dat
- Payroll
- KPI

Nen rut gon thanh 6 muc cho HR/Admin:
- Tong quan
- Nhan su
- Lich va cong
- Yeu cau
- Payroll
- Cai dat

---

## 7. Nguyen tac UX/UI bat buoc

## 7.1 Truoc het la de hieu

Moi man hinh phai tra loi duoc 3 cau hoi:
- Day la man hinh gi
- Viec quan trong nhat o day la gi
- Bam nut nao tiep theo

## 7.2 Moi vai tro chi thay viec cua minh

Khong de nhan vien thay qua nhieu module.
Khong de quan ly bi lac vao cac tinh nang HR cap cao.
Khong de HR phai di qua dashboard giong nhan vien.

## 7.3 1 man hinh, 1 nhiem vu chinh

Vi du:
- Trang chu nhan vien: xem ca hom nay va cham cong
- Trang xin nghi: tao va theo doi don nghi
- Trang lich cua quan ly: sap ca va publish

## 7.4 Tinh trang phai ro rang

Moi doi tuong nghiep vu deu can badge trang thai:
- Nhan vien: thu viec, dang lam, tam nghi, da nghi
- Lich: nhap, da publish
- Cham cong: dung gio, di tre, thieu check-out, can review
- Don nghi: cho duyet, da duyet, tu choi

## 7.5 Giam so nut hanh dong

Khong nen co qua nhieu quick actions tren trang chu.
Moi vai tro chi nen co 3 den 5 thao tac nhanh.

## 7.6 Loi va canh bao phai noi ro cach xu ly

Khong chi bao:
- "That bai"

Ma phai bao:
- "Ban dang o ngoai khu vuc cua hang, hay den gan cua hang hon hoac ket noi WiFi cua hang de check-in."

---

## 8. Doi chieu nhanh voi codebase hien tai

Nhung diem da co san:
- Nhieu route cho employee, manager, HR
- Co module lich lam, cham cong, nghi phep
- Co y tuong dashboard theo role
- Co huong mobile-first

Nhung diem dang lech khoi MVP thuc te:
- Auth van la demo/local persisted state
- Home dashboard chua toi uu cho "viec dau tien can lam"
- Employee dashboard dang co qua nhieu muc phu nhu KPI, chat, offline demo, RBAC
- Dieu huong nhan vien chua dua `Cham cong` thanh muc chinh
- Codebase dang uu tien breadth hon operational depth

---

## 9. Thu tu build de thuc te nhat

Phase 1:
- Auth that
- Employee profile source of truth
- Employee home dashboard toi gian
- Manager home dashboard toi gian

Phase 2:
- Schedule draft/publish flow
- Employee schedule view
- Attendance check-in/out flow
- Attendance exception list cho manager

Phase 3:
- Leave request + approval
- Request center cho manager va HR
- Basic notifications

Phase 4:
- Payroll input readiness
- Export cong
- Offboarding co ban

Phase 5:
- KPI
- Staffing optimization
- Learning / career / gamification

---

## 10. De xuat build tiep ngay trong repo nay

Neu di theo huong thuc dung, sprint tiep theo nen lam 4 viec:

1. Don lai dashboard va bottom navigation theo dung vai tro
2. Chot lai schema va source of truth cho `employee`, `schedule`, `attendance`, `leave_request`
3. Bien login demo thanh auth flow that
4. Tao `request center` tap trung cho manager va HR

Neu 4 viec nay xong, web se chuyen tu "demo nhieu tinh nang" sang "nen tang co the van hanh that".
