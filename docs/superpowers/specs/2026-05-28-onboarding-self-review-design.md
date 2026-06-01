# Tu danh gia that cua nhan vien theo chang onboarding

Ngay: `2026-05-28`
Pham vi: `Pass A - Tu danh gia that cua nhan vien`
Trang thai: `approved-for-spec`

## 1. Muc tieu

Pass nay chi giai quyet 1 viec:

- cho nhan vien moi tu danh gia that o cuoi moi chang onboarding
- cho phep cap nhat nhieu lan
- luu lich su cac lan tu danh gia
- cho buddy va quan ly xem ban tom tat

Pass nay khong giai quyet:

- gate qua chang
- quiz
- danh gia buddy
- manager approve
- timeline tong hop onboarding

## 2. Ly do chon scope nay

Huong nay duoc chon vi:

- nho scope, it vo logic da co
- tao ra du lieu that de pass sau dung cho gate chang
- giup buddy va quan ly thay diem manh, diem can kem, va diem so cua nhan vien
- khong can sua dong thoi qua nhieu data model, UI, va rule he thong

## 3. Quy tac nghiep vu da chot

### 3.1. Don vi tu danh gia

Tu danh gia gan theo `chang onboarding`, khong gan theo tung item checklist.

Moi chang co 1 khu `Tu danh gia chang nay`.

### 3.2. Tan suat cap nhat

Nhan vien duoc cap nhat nhieu lan trong cung 1 chang.

Moi lan gui tao thanh 1 ban ghi moi.
Khong ghi de len lan cu.

### 3.3. Lich su

He thong giu lich su day du theo thu tu thoi gian.

- ban moi nhat la `ban hien tai`
- cac ban cu dung de xem tien bo va doi chieu

### 3.4. Quyen xem

Ban tu danh gia duoc xem boi:

- nhan vien do
- buddy duoc gan cho nhan vien do
- quan ly duoc gan cho nhan vien do

Buddy va quan ly trong pass nay chi duoc `xem`.
Khong duoc sua, khong duyet, khong phan loai.

### 3.5. Anh huong gate

Self-review trong pass nay:

- khong tu dong cho qua chang
- khong chan qua chang
- khong doi status checklist item
- chi dong vai tro du lieu tham chieu va nhac nhe

Neu chang chua co self-review, he thong chi hien nhac nhe.
Khong tao hard block.

## 4. Bo 3 cau hoi da chot

Moi lan self-review gom 3 cau:

1. `Hom nay em tu tin nhat muc nao?`
2. `Muc nao em van can nguoi kem sat?`
3. `Neu ngay mai dung ca that, em so nhat dieu gi?`

Bo 3 cau nay duoc giu nguyen vi:

- lo diem manh that
- lo diem can kem that
- lo rui ro truoc khi vao ca that

## 5. Dang cau tra loi da chot

Moi cau hoi dung dang:

- `1 tag chon nhanh`
- `1 ghi chu ngan`

Muc tieu:

- de nhan vien tra loi nhanh
- de buddy va quan ly doc nhanh
- de sau nay tong hop thanh bao cao va gate de hon

## 6. Du lieu can luu

Moi lan self-review luu 1 ban ghi moi gom:

- `id`
- `employee_id`
- `onboarding_plan_id`
- `stage_code`
- `answers`
- `submitted_at`
- `submitted_by`

Trong `answers` luu 3 cap `tag + note`:

- `confidence_tag`
- `confidence_note`
- `coaching_tag`
- `coaching_note`
- `fear_tag`
- `fear_note`

## 7. Tag preset de chot cho pass A

### 7.1. Tag cho muc tu tin nhat

- `quy_trinh`
- `thao_tac`
- `giao_tiep_khach`
- `toc_do`
- `ve_sinh`
- `phoi_hop_ca`

### 7.2. Tag cho muc can kem sat

- `quy_trinh`
- `thao_tac`
- `giao_tiep_khach`
- `toc_do`
- `ve_sinh`
- `phoi_hop_ca`

### 7.3. Tag cho dieu so nhat

- `nham_order`
- `cham_nhip`
- `sai_cong_thuc`
- `quen_quy_trinh`
- `giao_tiep_khach`
- `xu_ly_loi`

Pass nay chot tag o muc du de dung.
Neu sau nay thay thieu, bo sung bang pass rieng.

## 8. Cach hien thi tren UI

### 8.1. Man nhan vien

Route hien tai: `src/app/onboarding/page.tsx`

Dat 1 card `Tu danh gia chang nay` ngay trong man chang hien tai.

Card gom:

- 3 cau hoi
- moi cau co 1 cum tag chon nhanh
- moi cau co 1 o ghi chu ngan
- nut `Luu lan tu danh gia moi`
- khu `Lich su tu danh gia`

Lich su hien:

- moi nhat len tren
- moi dong co `thoi gian`
- hien ro 3 muc `Tu tin nhat`, `Can kem sat`, `So nhat`
- note chi hien rut gon, uu tien de scan nhanh

### 8.2. Man buddy/quan ly

Man hien tai uu tien: workspace onboarding operations.

Trong panel chi tiet onboarding, them 1 block `Tom tat tu danh gia`.

Block nay hien:

- ban moi nhat mac dinh
- 3 dong tom tat co dinh
- lich su rut gon o ben duoi hoac mo rong

Buddy va quan ly doc cung 1 du lieu.
Khong tach 2 phien ban rieng.

### 8.3. Huong dat UI duoc chon

Huong duoc chon la `dat card trong chang hien tai`, khong tao tab rieng va khong dung modal.

Ly do:

- de thay
- dung ngu canh chang onboarding
- giam nguy co bo quen
- giu pass A ngan gon

## 9. Rule hien thi va fallback

- Neu chang hien tai chua co self-review, hien nhac nhe `Ban chua tu danh gia chang nay`
- Neu da co nhieu lan, luon lay ban moi nhat lam ban mac dinh
- Neu nhan vien doi chang, lich su chang cu van duoc giu nguyen
- Khong map nguoc self-review cu sang chang moi

## 10. Ngoai scope ro rang

Pass A khong lam:

- gate tong ket chang
- chan hoac mo chang
- manager approve tu danh gia
- buddy comment vao self-review
- mini quiz
- timeline tong onboarding
- dua self-review vao profile nhan vien
- tach rieng UI cho thu ngan/phuc vu va pha che

## 11. Rui ro va cach giam

### 11.1. Rui ro data roong qua nhanh

Vi cho cap nhat nhieu lan, lich su co the dai.

Cach giam trong pass A:

- chi hien ban moi nhat + lich su rut gon
- chua them dashboard tong hop

### 11.2. Rui ro nguoi dung hieu nham la gate

Neu wording khong ro, nhan vien co the nghi phai nhap moi duoc qua chang.

Cach giam:

- wording phai ro day la `tu nhin lai de duoc kem dung diem`
- khong dung chu `bat buoc`, `gate`, `chan`

### 11.3. Rui ro scope tran sang buddy/manager review

Neu them thao tac cho buddy/manager ngay pass nay se vo scope.

Cach giam:

- pass A chi cho `xem`
- moi thao tac danh gia/duyet de pass sau

## 12. Verify muc tieu sau khi code

Can verify toi thieu:

- nhan vien vao `/onboarding` thay card `Tu danh gia chang nay`
- nhan vien gui duoc 1 lan moi
- nhan vien gui them lan nua, lich su van giu lan cu
- buddy/quan ly mo man onboarding operations thay duoc ban tom tat moi nhat
- neu chua co self-review, UI chi nhac nhe, khong block

## 13. File huong den khi vao plan

File kha nang dong vao o pass code:

- `src/app/onboarding/page.tsx`
- `src/components/onboarding-employee/*`
- `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- `src/lib/career-path-types.ts`
- `src/lib/career-path-service.ts`

Plan code phai giu dung rule:

- 1 pass
- fail check truoc
- chua dong vao gate chang
- verify lint + build + smoke role lien quan
