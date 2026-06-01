# Onboarding IA va Settings Redesign

Ngay: 2026-06-01
Scope: redesign flow va information architecture cho khu vuc onboarding, tap trung vao CEO/HR hop nhat trong boi canh cong ty chua co HR rieng.

## 1. Muc tieu

Nguoi dung chinh hien tai la CEO, dong thoi dong vai tro HR dieu phoi. Nguoi nay can:
- nhin nhanh toan canh onboarding
- biet viec nao can xu ly truoc
- nhay thang vao tung tac vu cu the
- co the sua cau hinh role/template khi can
- khong bi lac trong nhieu man co ten gan giong nhau

Muc tieu redesign:
- doi diem vao chinh thanh man tong quan theo tac vu
- tach ro van hanh va cau hinh
- giu CEO co day du quyen va kha nang thao tac nhu HR
- giam do kho tim, kho hieu, kho scan tren man settings hien tai
- dua text/label ve ngon ngu nghiep vu, giam lo code ky thuat

Khong nam trong scope nay:
- thay doi rule nghiep vu onboarding co ban
- doi model du lieu role onboarding
- them phan quyen moi giua CEO va HR
- viet lai toan bo UI onboarding employee

## 2. Van de hien tai

### 2.1 Lech mental model
Man settings onboarding hien tai tron 3 nhom cong viec khac nhau vao 1 khoi dai:
- map role onboarding
- gan checklist template
- xu ly nhan vien unmatched

Nguoi dung vao man nay de "xu ly onboarding", nhung UI lai to chuc theo data model thay vi tac vu.

### 2.2 Sai thu tu uu tien
Thong tin quan trong nhat la ngoai le va loi cau hinh:
- role mapping bi xung dot
- role chua co template
- nhan vien chua khop role

Nhung man hien tai buoc nguoi dung doc card role truoc, loi va ngoai le khong duoc day len dau.

### 2.3 Dieu huong kho hieu
Ten man va tab hien tai de gay nham:
- Buoc onboarding
- Cau hinh onboarding
- Tong quan onboarding

Nguoi dung kho doan "vao dau de lam viec gi". Sidebar va tab dang chua phan tach ro theo muc tieu su dung.

### 2.4 Ngon ngu giao dien chua than thien
Nhieu cho dang hien role_code, position_id, template_id nhu noi bo ky thuat. Dieu nay phu hop dev hon la CEO/nguoi van hanh.

### 2.5 Do tin cay giao dien giam do encoding
Mot so label tieng Viet bi loi dau, lam man hinh giong chua hoan thien va kho duyet.

## 3. Nguoi dung muc tieu

### 3.1 CEO/chu doanh nghiep
- khong co HR rieng
- can xem tong quan nhanh
- can vao thao tac truc tiep khi phat sinh van de
- uu tien "cho nao can xu ly ngay" hon la cau truc ky thuat

### 3.2 HR/Admin trong tuong lai
- neu co them HR sau nay, flow van dung duoc
- khong can hoc lai vi IA da tach theo cong viec

## 4. Nguyen tac design

- 1 man hinh phai tra loi 1 cau hoi chinh cua nguoi dung.
- Diem vao phai la tong quan va muc uu tien, khong phai form cau hinh.
- Ngoai le va loi phai len truoc du lieu binh thuong.
- Dung ngon ngu nghiep vu, khong lay ma ky thuat lam noi dung chinh.
- CEO co the xem va sua, nhung khong bi buoc vao form dai neu chi can check tinh trang.
- Sidebar chi dung cho cap dieu huong lon. Cong viec chi tiet dung section, card, CTA trong trang.

## 5. De xuat IA moi

Nhom sidebar: Nhan su moi

Ben trong nhom nay chi giu 3 muc:
- Tong quan onboarding
- Van hanh onboarding
- Cau hinh onboarding

Y nghia tung muc:
- Tong quan onboarding: diem vao chinh. Hien tinh trang he thong va dieu huong theo tac vu.
- Van hanh onboarding: xu ly nhan su sap vao lam, buddy, ca dau, follow-up, checklist van hanh.
- Cau hinh onboarding: map role, gan template, xu ly cac ngoai le cau hinh.

Loai bo cach dat ten mo ho hoac qua gan nghia. Khong dung song song cac nhan de nguoi dung phai doan.

## 6. Flow nguoi dung de xuat

### 6.1 Flow chinh cho CEO/HR hop nhat
1. Vao Tong quan onboarding.
2. Nhin trang thai chung va 4 nhom viec can xu ly.
3. Bam vao dung khoi cong viec can hanh dong.
4. Di den man tac vu tuong ung.
5. Xu ly xong quay lai Tong quan de tiep tuc.

### 6.2 Cac nhom tac vu tu Tong quan
- Nhan su sap vao lam -> vao Van hanh onboarding
- Block ngay dau / can follow-up -> vao Van hanh onboarding voi filter san
- Nhan vien chua khop role -> vao Cau hinh onboarding tai section Ngoai le
- Role thieu template / co xung dot -> vao Cau hinh onboarding tai section Role va Template

## 7. Design man Tong quan onboarding

Muc tieu man nay:
- cho nguoi dung thay toan canh trong 10-20 giay
- xac dinh ngay muc can xu ly truoc
- chuyen sang dung tac vu bang 1 click

### 7.1 Cau truc man hinh
- Hero nho dau trang
- Thanh trang thai he thong
- Luoi 4 khoi cong viec chinh
- Danh sach uu tien can xu ly ngay
- Khu "vao man nao khi nao" neu can, nhung viet gon hon hien tai

### 7.2 Hero
Noi dung:
- tieu de: Tong quan onboarding
- mo ta 1 dong: theo doi nhan su moi, loi cau hinh, va cac viec can xu ly ngay
- CTA nhanh:
  - Mo van hanh onboarding
  - Mo cau hinh onboarding

### 7.3 Thanh trang thai he thong
Muc dich: cho biet he thong dang on hay co loi can vao xu ly.

Trang thai de xuat:
- On dinh
- Can ra soat
- Co loi cau hinh

Rule goi y:
- Co loi cau hinh: co duplicate mapping, role active thieu template, xung dot draft/source
- Can ra soat: co unmatched employee, co block ngay dau, co follow-up
- On dinh: khong co cac van de tren

### 7.4 4 khoi cong viec chinh
1. Nhan su sap vao lam
- so luong
- 3 item dau
- CTA: Mo van hanh

2. Block ngay dau / can follow-up
- so luong
- tach bang tone mau
- CTA: Xu ly ngay

3. Nhan vien chua khop role
- so luong
- 3 item dau
- CTA: Xu ly unmatched

4. Cau hinh role va template
- so role dang bat
- so role thieu template
- so xung dot mapping
- CTA: Mo cau hinh

### 7.5 Danh sach uu tien can xu ly ngay
Dung de thay the viec nguoi dung phai doc tung man. Muc nay hien 5 item quan trong nhat toan workspace, sap theo uu tien:
- block ngay dau
- unmatched employee sap vao lam
- role active thieu template
- follow-up muc cao
- cac case con lai

Moi item co:
- ten nhan vien hoac ten role
- ly do hien ra o day
- 1 CTA ro rang

## 8. Design man Van hanh onboarding

Man nay tiep tuc dung cho xu ly hang ngay, khong gop them cau hinh.

Muc nang cap de xuat:
- nhan heading va copy ro hon theo ngon ngu van hanh
- giu list ben trai va detail ben phai neu desktop
- cho phep deep-link/filter tu Tong quan:
  - upcoming
  - block_day_one
  - need_follow_up
- hien badge uu tien ro hon
- neu khong co item trong filter, cho CTA quay lai Tong quan hoac bo loc

Khong dua cac field cau hinh role/template vao man nay.

## 9. Design man Cau hinh onboarding

Muc tieu man nay:
- cho CEO/HR sua rules he thong ma khong bi ngop
- sap theo viec can lam, khong sap theo kieu dev config panel

### 9.1 Cau truc moi
Dau trang:
- title: Cau hinh onboarding
- 1 dong mo ta gon
- summary bar

Summary bar gom:
- so role dang bat
- so role thieu template
- so mapping co xung dot
- so nhan vien chua khop role

Ngay ben duoi la 3 section theo thu tu uu tien:
1. Ngoai le can xu ly
2. Role onboarding
3. Template checklist

### 9.2 Section 1: Ngoai le can xu ly
Section nay phai day len dau neu co van de.

Hien:
- nhan vien unmatched
- role active chua co template
- duplicate position mapping

Moi nhom co:
- so luong
- danh sach ngan
- CTA di den vi tri can sua trong trang

Muc tieu la nguoi dung vao man cau hinh se thay ngay "dang vo o dau".

### 9.3 Section 2: Role onboarding
Moi role la 1 card gon.

Card role de xuat:
- ten lon: display_name co dau
- meta nho: role_code, thu tu, trang thai bat/tat
- chon danh sach chuc danh map vao role
- canh bao ngay tren card neu co loi

Nang cap usability:
- search/filter chuc danh
- filter role theo trang thai:
  - dang bat
  - thieu template
  - co xung dot
- khong dung role_code lam heading chinh

### 9.4 Section 3: Template checklist
Tach rieng phan template ra khoi role map de nguoi dung de scan.

Moi role hien:
- role display name
- template dang gan
- trang thai template active/inactive
- CTA doi template
- preview metadata gon: version, ten template

Neu chua co template, hien card warning ro rang.

### 9.5 Save va validation
Rule UX:
- thong bao loi ro bang ngon ngu nghiep vu
- loi tong hop o dau section
- loi chi tiet o card lien quan
- neu co source conflict, khoa Save va cho CTA tai lai nguon
- sau khi save thanh cong, cap nhat summary bar va block ngoai le ngay

## 10. Copy va naming de xuat

Sidebar group:
- Nhan su moi

Sidebar items:
- Tong quan onboarding
- Van hanh onboarding
- Cau hinh onboarding

CTA:
- Mo van hanh onboarding
- Mo cau hinh onboarding
- Xu ly unmatched
- Ra soat role va template
- Xu ly ngay

Label nghiep vu uu tien hon label ky thuat:
- dung Thu ngan thay vi counter_staff o UI
- dung Pha che thay vi barista o UI
- role_code va id chi hien o meta phu

## 11. States va xu ly loi

### 11.1 Empty states
- khong co nhan su sap vao lam
- khong co block/follow-up
- khong co unmatched employee
- tat ca role active deu da gan template

### 11.2 Error states
- draft cu hon source hien tai
- duplicate position mapping
- role active nhung thieu template
- label role trong

### 11.3 Loading states
- skeleton hoac loading card ngan, khong dung block text dai

## 12. Tinh tuong thich voi code hien tai

Huong nay tan dung duoc cau truc route hien co:
- /career-path/onboarding/overview
- /career-path/onboarding
- /career-path/settings

Khong can doi model role identity dang ASCII/stable.
Khong can doi service resolver hien tai.
Can chu yeu:
- doi IA trong sidebar/tab
- bo sung summary/CTA/filter/deep-link
- tach layout settings theo section tac vu
- chuan hoa copy co dau

## 13. Ke hoach nang cap theo pass

### Pass 1: IA va copy
- doi ten item dieu huong
- chuan hoa copy co dau
- sua hero va CTA o overview
- bo thong diep mo ho, kho tim

### Pass 2: Tong quan onboarding
- them thanh trang thai he thong
- them 4 khoi cong viec chinh
- them danh sach uu tien can xu ly ngay
- them deep-link/filter sang van hanh va cau hinh

### Pass 3: Cau hinh onboarding
- them summary bar
- day section ngoai le len dau
- doi card role sang display-first
- tach block template checklist
- them filter nhanh va validation ro hon

### Pass 4: Hardening
- test deep-link/filter
- test role save/validation/unmatched flow
- test render label co dau
- smoke test overview -> settings -> operations

## 14. Test strategy

Service/unit:
- resolver role onboarding theo settings
- duplicate mapping validation
- missing template validation
- unmatched employee aggregation
- overview status classification

UI smoke:
- Tong quan onboarding hien dung CTA va count chinh
- click tu Tong quan sang Van hanh dung filter
- click tu Tong quan sang Cau hinh den dung section
- Cau hinh onboarding hien unmatched len dau khi co loi
- role card hien display label co dau

Manual QA:
- login CEO/demo admin
- vao Tong quan onboarding
- vao tung CTA va quay lai
- sua 1 role mapping
- tao 1 case thieu template va xem warning

## 15. Tieu chi thanh cong

Nguoi dung moi vao khu onboarding co the:
- biet vao man nao trong vong 5-10 giay
- thay viec can xu ly truoc ma khong can doc het form
- sua duoc role/template ma khong can hieu code ky thuat
- giam so lan click sai man
- giam cam giac "kho kiem" va "qua nhieu"

## 16. Ranh gioi quyet dinh

Quyet dinh da chot trong spec nay:
- CEO co day du chuc nang nhu HR
- diem vao chinh la Tong quan onboarding
- tu Tong quan bam sang tung tac vu
- settings van ton tai, nhung la man cau hinh sau khi da xac dinh nhu cau

Cau can giu on dinh khi implement:
- khong dua them quyen moi vao scope nay
- khong doi role identity ASCII/stable ben duoi
- khong tron van hanh va cau hinh ve lai 1 man
