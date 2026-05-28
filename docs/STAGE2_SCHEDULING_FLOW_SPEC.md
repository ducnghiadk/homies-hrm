# STAGE 2 SCHEDULING FLOW SPEC

## Muc tieu tai lieu

Tai lieu nay mo ta chi tiet `Giai doan 2: Lich lam`.

Muc dich:
- chot flow nghiep vu truoc khi build
- mo ta ro tung man hinh hien gi
- mo ta ro ai thao tac
- mo ta ket qua dau ra cua moi action
- tranh build theo cam tinh hoac theo demo UI

Tai lieu nay tap trung vao:
- `Quan ly xep lich`
- `Nhan vien xem lich`
- `Publish lich`
- `Sua lich sau publish`

Khong di qua sau o giai doan nay:
- doi ca phuc tap
- AI tu dong xep lich
- labor cost forecast
- staffing optimization nang cao

---

## 1. Muc tieu nghiep vu cua Giai doan 2

Sau khi xong giai doan 2, he thong phai giup doanh nghiep lam duoc 6 viec:

1. Quan ly tao duoc lich lam theo tuan cho chi nhanh
2. Quan ly chi xep ca cho nhung nhan vien hop le
3. Quan ly luu duoc `nhap` truoc khi chot
4. Quan ly `publish` lich de nhan vien nhin thay lich chinh thuc
5. Nhan vien chi nhin thay lich da chot
6. Neu sua lich sau khi da publish thi he thong phai ghi nhan thay doi

Noi ngan gon:
- xep duoc
- chot duoc
- xem duoc
- khong nham giua `nhap` va `lich that`

---

## 2. Vai tro tham gia

### 2.1. HR Admin

Co the:
- xem lich toan he thong
- vao ho tro xu ly neu can
- xem lich su thay doi

Khong phai:
- nguoi xep lich chinh moi tuan

### 2.2. Quan ly cua hang

La nguoi dung chinh cua giai doan 2.

Co the:
- tao lich tuan
- xep ca
- luu nhap
- publish lich
- sua lich sau publish

### 2.3. Truong ca

Co the:
- xem lich van hanh
- xem danh sach nhan su theo ngay

Ban dau:
- chua can cho sua lich neu muon giam scope

### 2.4. Nhan vien

Co the:
- xem lich ca nhan
- xem hom nay lam ca gi
- xem lich tuan nay
- biet lich da chot hay chua
- biet lich co vua bi thay doi khong

Khong duoc:
- thay lich nhap cua quan ly

---

## 3. Doi tuong du lieu can co

## 3.1. Shift Template

La mau ca co dinh.

Vi du:
- Ca sang: `08:00 - 12:00`
- Ca chieu: `13:00 - 17:00`
- Ca toi: `17:00 - 22:00`

Field can co:
- `id`
- `name`
- `code`
- `start_time`
- `end_time`
- `store_scope`: `global | store_specific`
- `store_id` neu la ca rieng cho chi nhanh
- `color`
- `is_active`

Ket qua dau ra:
- he thong co danh sach ca de quan ly chon khi xep lich

## 3.2. Schedule Week

La 1 bo lich cua 1 chi nhanh trong 1 tuan.

Field can co:
- `id`
- `store_id`
- `week_start`
- `week_end`
- `status`: `draft | published | locked`
- `published_at`
- `published_by`
- `notes`

Ket qua dau ra:
- moi chi nhanh co the co 1 lich tuan ro rang

## 3.3. Schedule Assignment

La 1 dong xep ca cho 1 nhan vien trong 1 ngay.

Field can co:
- `id`
- `schedule_week_id`
- `employee_id`
- `store_id`
- `date`
- `shift_template_id`
- `status`: `draft | published | cancelled`
- `modified_after_publish`
- `change_reason`
- `created_by`
- `updated_by`

Ket qua dau ra:
- xac dinh ro ai lam ca nao, ngay nao

## 3.4. Schedule Change Log

Luu lich su thay doi sau khi lich da chot.

Field can co:
- `id`
- `assignment_id`
- `action`: `create | update | cancel | delete`
- `before_state`
- `after_state`
- `changed_by`
- `changed_at`
- `reason`

Ket qua dau ra:
- sau nay truy duoc ai sua lich gi, luc nao, vi sao

---

## 4. Rule nghiep vu bat buoc

## 4.1. Nhan vien duoc xep lich

Chi duoc xep cho nhung nguoi co:
- `employment_status = active`
- `employment_status = probation`

Khong cho xep neu:
- `inactive`
- `resigned`

Ket qua tren UI:
- nhan vien khong hop le khong duoc hien trong danh sach xep ca
hoac
- hien nhung bi khoa va co ly do

## 4.2. Gioi han theo chi nhanh

Quan ly chi nhanh chi duoc xep lich cho nguoi thuoc chi nhanh cua minh.

Ket qua tren UI:
- dropdown / list nhan vien tu dong loc theo `store_id`

## 4.3. Nhan vien chi thay lich da chot

Nhan vien khong duoc thay:
- lich `draft`

Chi thay:
- lich `published`

Ket qua tren UI:
- neu tuan sau chua chot thi hien thong bao:
  - `Lich tuan sau chua duoc quan ly chot`

## 4.4. Khong cho trung ca

1 nhan vien khong duoc bi xep 2 ca trung gio trong cung 1 ngay.

Ket qua tren UI:
- khi quan ly gan ca bi trung thi hien warning ngay tai o do

## 4.5. Sua sau publish phai co ly do

Neu lich da `published` ma co thay doi thi:
- bat buoc nhap `change_reason`
- gan `modified_after_publish = true`
- tao `change log`

Ket qua tren UI:
- modal sua lich sau publish phai co field `Ly do thay doi`

---

## 5. Flow tong the cua Giai doan 2

Flow chinh:

1. Quan ly vao man `Lich lam`
2. Chon `chi nhanh`
3. Chon `tuan`
4. He thong load danh sach nhan vien hop le
5. Quan ly xep ca cho tung nguoi
6. Quan ly `Luu nhap`
7. Quan ly `Publish lich`
8. Nhan vien vao man `Lich cua toi` va thay lich da chot
9. Neu can sua sau publish thi quan ly mo o ca va nhap ly do

---

## 6. Man hinh 1 - Lich tuan cua quan ly

Route goi y:
- `/schedules`

Day la man hinh quan trong nhat cua giai doan 2.

## 6.1. Muc tieu man hinh

Giup quan ly:
- xep lich cho 1 tuan
- nhin tong the 7 ngay
- thao tac nhanh
- biet duoc loi xep lich ngay tren man

## 6.2. Hien thi tren man hinh

Phan dau trang:
- Tieu de: `Lich lam chi nhanh`
- Subtitle:
  - `Xep lich, luu nhap va publish lich tuan cho nhan vien`

Thanh dieu khien tren cung:
- bo loc `Chi nhanh`
- bo loc `Tuan`
- nut:
  - `Tuan truoc`
  - `Tuan sau`
  - `Hom nay`
- action:
  - `Luu nhap`
  - `Publish lich`

Khoi thong tin tong quan:
- So nhan vien trong tuan
- So ca da xep
- So o trong chua xep
- So canh bao

Bang lich:
- cot dau la `Nhan vien`
- 7 cot tiep theo la `Thu 2 -> Chu nhat`
- moi o la 1 ca hoac nhieu ca
- cuoi moi dong co:
  - `Tong ca`
  - `Tong gio`

Mau hien thi:
- ca sang: 1 mau
- ca chieu: 1 mau
- ca toi: 1 mau
- o trong: vien xam
- o loi: vien do / icon warning

## 6.3. Quan ly thao tac tren man nay nhu the nao

Action 1: chon tuan
- quan ly bam chon `Tuan 20/05/2026 - 26/05/2026`

Ket qua dau ra:
- he thong load lich cua tuan do

Action 2: click vao 1 o
- vi du:
  - dong `Nguyen Van A`
  - cot `Thu 4`

Ket qua dau ra:
- mo modal `Gan ca`

Action 3: luu nhap
- quan ly bam `Luu nhap`

Ket qua dau ra:
- tao / cap nhat `Schedule Week` voi `status = draft`
- luu tat ca assignment hien tai
- hien toast:
  - `Da luu nhap lich tuan`

Action 4: publish
- quan ly bam `Publish lich`

Ket qua dau ra:
- `Schedule Week.status = published`
- cac assignment thanh `published`
- gan `published_at`, `published_by`
- nhan vien co the thay lich
- hien toast:
  - `Da publish lich tuan thanh cong`

## 6.4. Cac warning can hien

Warning 1:
- `Nhan vien da nghi / chua active`

Warning 2:
- `Trung ca trong cung ngay`

Warning 3:
- `Nhan vien khong thuoc chi nhanh nay`

Warning 4:
- `Tuan chua xep ca nao`

Warning 5:
- `Co thay doi sau publish chua ghi ly do`

---

## 7. Man hinh 2 - Modal gan ca

Day la modal hien khi quan ly click vao 1 o trong bang lich.

## 7.1. Muc tieu man hinh

Giup quan ly:
- gan 1 ca
- doi 1 ca
- huy 1 ca

## 7.2. Hien thi tren man hinh

Header:
- `Gan ca cho Nguyen Van A`
- ngay duoc chon

Noi dung:
- thong tin nhan vien
- ca dang co (neu co)
- dropdown / button chon `Shift Template`
- ghi chu noi bo (optional)

Neu la sua lich da publish:
- them field bat buoc:
  - `Ly do thay doi`

Footer:
- `Luu`
- `Huy ca`
- `Dong`

## 7.3. Ket qua dau ra

Neu them moi:
- tao `Schedule Assignment`

Neu sua:
- update assignment

Neu sua sau publish:
- update assignment
- `modified_after_publish = true`
- tao log thay doi

Neu huy:
- assignment `cancelled`
hoac
- xoa assignment neu van dang la draft

---

## 8. Man hinh 3 - Lich cua toi cho nhan vien

Route goi y:
- `/my-schedule`

## 8.1. Muc tieu man hinh

Giup nhan vien:
- biet hom nay lam ca gi
- xem lich trong tuan
- biet lich da chot hay chua
- biet co thay doi moi khong

## 8.2. Hien thi tren man hinh

Khoi tren cung:
- `Hom nay`
- hien:
  - ten ca
  - gio bat dau
  - gio ket thuc
  - chi nhanh

Khoi tiep theo:
- `Lich tuan nay`
- dang list card theo tung ngay

Moi card ngay gom:
- Thu / ngay
- ten ca
- gio
- badge:
  - `Da chot`
  - `Moi cap nhat` neu co sua sau publish

Neu chua co lich:
- `Hom nay ban khong co ca lam`

Neu tuan sau chua publish:
- block thong bao:
  - `Lich tuan sau chua duoc quan ly chot`

## 8.3. Ket qua dau ra

Nhan vien khong thao tac xep lich.

Ket qua dau ra cua man nay la:
- nhan vien nhin thay ro lich chinh thuc cua minh
- giam hoi lai quan ly bang tay

---

## 9. Man hinh 4 - Lich su thay doi lich

Route goi y:
- `/schedules/history`

## 9.1. Muc tieu man hinh

Giup HR/Admin va quan ly:
- xem ai sua lich gi
- khi nao sua
- sua cai gi
- vi sao

## 9.2. Hien thi tren man hinh

Bo loc:
- chi nhanh
- ngay
- nguoi sua
- loai thay doi

Bang log:
- thoi gian
- nhan vien
- ngay bi sua
- truoc
- sau
- nguoi sua
- ly do

## 9.3. Ket qua dau ra

Co lich su ro rang de:
- doi soat
- tranh tranh cai
- ho tro payroll/cham cong sau nay

---

## 10. Luong nghiep vu chi tiet

## 10.1. Luong 1 - Tao lich tuan moi

Buoc 1:
- Quan ly vao `/schedules`

Buoc 2:
- chon `Chi nhanh A`
- chon `Tuan 20/05 - 26/05`

Buoc 3:
- he thong tim `Schedule Week`

Neu chua co:
- tao view rong
- hien thong bao:
  - `Tuan nay chua co lich. Bat dau xep ca ngay.`

Buoc 4:
- quan ly click vao tung o de gan ca

Buoc 5:
- bam `Luu nhap`

Ket qua dau ra:
- co 1 `Schedule Week` trang thai `draft`

## 10.2. Luong 2 - Publish lich

Buoc 1:
- Quan ly mo lai lich nhap

Buoc 2:
- ra soat tong the

Buoc 3:
- bam `Publish lich`

Buoc 4:
- he thong validate:
  - co nhan vien khong hop le khong
  - co trung ca khong
  - co assignment loi khong

Buoc 5:
- neu hop le thi publish

Ket qua dau ra:
- nhan vien thay lich
- he thong ghi `published_at`, `published_by`

## 10.3. Luong 3 - Sua lich sau publish

Buoc 1:
- Quan ly click vao 1 ca da publish

Buoc 2:
- modal mo ra

Buoc 3:
- doi sang ca khac hoac huy ca

Buoc 4:
- he thong bat buoc nhap `Ly do thay doi`

Buoc 5:
- luu

Ket qua dau ra:
- assignment duoc update
- `modified_after_publish = true`
- tao `Schedule Change Log`
- nhan vien thay badge:
  - `Moi cap nhat`

---

## 11. Mo ta ket qua dau ra theo tung man

## 11.1. Dau ra cua man lich quan ly

Quan ly se co:
- 1 bang lich tuan de quan sat toan canh
- biet ai duoc xep, ai chua
- biet tong so ca / tong gio
- biet o nao dang loi

## 11.2. Dau ra cua modal gan ca

He thong se tao ra:
- `1 assignment moi`
hoac
- `1 assignment cap nhat`
hoac
- `1 assignment bi huy`

## 11.3. Dau ra cua action publish

He thong se tao ra:
- `lich chinh thuc`
- nhan vien thay lich tren man `Lich cua toi`

## 11.4. Dau ra cua man nhan vien

Nhan vien se nhin thay:
- lich hom nay
- lich tuan nay
- thay doi moi neu co

## 11.5. Dau ra cua man lich su thay doi

Bo phan dieu hanh se co:
- bang thay doi ro rang
- truy vet de doi soat

---

## 12. Tieu chi danh gia UI/UX

## 12.1. Man cua quan ly

Phai:
- desktop-first
- nhin 7 ngay trong 1 man
- click nhanh
- warning ro
- sticky cot ten / sticky header neu co the

Khong nen:
- card mot cot nhu mobile
- an qua nhieu thong tin trong popup
- phai click qua nhieu tang moi xep duoc ca

## 12.2. Man cua nhan vien

Phai:
- mobile-first
- xem 3 giay la hieu hom nay lam gi
- card ro rang
- badge trang thai ro

Khong nen:
- bang desktop thu nho
- qua nhieu cot

---

## 13. Definition of Done cua Giai doan 2

Giai doan 2 duoc xem la xong khi:

- co du lieu mau ca
- co lich tuan theo chi nhanh
- quan ly xep lich duoc
- luu nhap duoc
- publish duoc
- nhan vien chi thay lich publish
- sua sau publish co ly do va co log
- man quan ly dung tot tren web
- man nhan vien dung tot tren mobile

---

## 14. Thu tu build de xuat

1. Shift template
2. Schedule week
3. Schedule assignment
4. Man lich quan ly
5. Save draft
6. Publish
7. Man lich ca nhan
8. Change log

---

## 15. Chot

Neu build dung theo tai lieu nay thi `Giai doan 2` se cho ra:
- 1 flow xep lich dung that
- 1 giao dien quan ly hop desktop
- 1 giao dien nhan vien hop mobile
- 1 nen du lieu tot de sang `Giai doan 3: Cham cong`
