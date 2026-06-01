# Mini test / quiz onboarding de ho tro buddy va quan ly

Ngay: `2026-05-29`
Pham vi: `Pass C - Mini test / quiz`
Trang thai: `approved-for-spec`

## 1. Muc tieu

Pass nay chi giai quyet 1 viec:

- them `mini test / quiz` cho cac chang ly thuyet, quy trinh ro
- cho nhan vien lam quiz nhieu lan
- giu lich su cac lan lam
- cho buddy va quan ly xem ket qua de kem dung diem

Pass nay khong giai quyet:

- gate qua chang
- quiz cho chang thuc chien
- report quiz rieng
- profile quiz rieng trong ho so nhan vien
- game hoa

## 2. Ly do chon scope nay

Huong nay duoc chon vi:

- quiz chi la lop ho tro, khong vo gate
- dung de bo sung cho phan quy trinh, ve sinh, thong tin nen
- de buddy va quan ly thay nhanh phan nao nhan vien dang yeu
- giu pass C nho, it sai

## 3. Vai tro cua quiz da chot

Quiz trong Pass C dong vai tro:

- `tin hieu ho tro`
- khong phai dieu kien bat buoc de qua gate
- khong tu quyet dinh nhan vien `dat` hay `rot`

Quiz dung de:

- nhan vien tu kiem nhanh phan nen
- buddy biet phan nao can kem ly thuyet
- quan ly biet nhan vien co dang yeu quy trinh nen hay khong

## 4. Chang nao co quiz

Pass C chi gan quiz cho:

- `pre_start`
- `day_1`

Khong gan quiz cho:

- `day_2_3`
- `week_1`
- `week_2`

Ly do:

- `pre_start` va `day_1` phu hop bai toan quy trinh, ve sinh, thong tin nen
- chang sau nghieng ve thuc chien, nen buddy/quan ly la lop kiem chinh

## 5. Dang quiz da chot

Moi quiz co:

- `3-5 cau`
- `trac nghiem chon 1 dap an`

Khong lam trong pass nay:

- tu luan
- tinh huong dai
- dung/sai flashcard
- quiz nhieu dap an

## 6. Huong nghiep vu duoc chon

Huong duoc chon la:

`Quiz template rieng + quiz attempts`

Khong chon:

- nhoi quiz vao checklist item progress
- tao tab rieng cho quiz

Ly do chon:

- dep cho data
- de tai su dung
- hop voi rule `giu lich su`
- khong roi logic checklist va gate

## 7. Cau truc quiz

### 7.1. Quiz template

Moi quiz la 1 `quiz template` rieng.

Quiz template can co:

- `id`
- `stage_code`
- `title`
- `questions`

Moi chang co the gan:

- `0 hoac 1 quiz template`

Pass C chi gan quiz cho `pre_start` va `day_1`.

### 7.2. Quiz attempt

Moi lan nhan vien lam quiz tao 1 `quiz attempt` moi.

Quiz attempt can co:

- `id`
- `employee_id`
- `onboarding_plan_id`
- `quiz_template_id`
- `answers`
- `score`
- `submitted_at`

## 8. Rule lam lai va lich su

Nhan vien duoc:

- lam lai nhieu lan
- moi lan nop tao 1 attempt moi

He thong phai:

- giu lich su cac lan lam
- hien lan moi nhat lam mac dinh

Khong ghi de len attempt cu.

## 9. Quyen xem

Ket qua quiz duoc xem boi:

- nhan vien do
- buddy duoc gan cho nhan vien do
- quan ly duoc gan cho nhan vien do

Buddy va quan ly trong pass nay chi duoc `xem`.
Khong duoc sua, khong duyet, khong cham tay vao dap an.

## 10. Cach hien thi ket qua

Ket qua phai hien:

- `diem tong`
- `cau nao sai`
- `lich su cac lan lam`

Khong chi hien:

- da lam/chua lam
- diem tong don le

Vi neu chi co diem tong thi buddy/quan ly kho biet nhan vien vuong phan nao.

## 11. Huong dat UI duoc chon

Huong duoc chon la:

`Quiz embedded trong chang`

Khong chon:

- drawer/modal
- tab rieng

Ly do:

- gan ngu canh chang nhat
- de nhin thay
- de lam lai
- buddy/quan ly xem ngay trong workspace onboarding hien co

## 12. Man nhan vien

Trong chang co quiz, hien card `Mini test nhanh`.

Card gom:

- tieu de quiz
- 3-5 cau trac nghiem
- nut `Nop mini test`
- ket qua lan moi nhat
- danh sach lich su cac lan lam

Sau khi nop:

- hien `diem tong`
- hien `cau nao sai`
- cho phep lam lai

## 13. Man buddy/quan ly

Trong panel operations hien co, them block `Ket qua mini test`.

Block nay hien:

- da lam hay chua
- diem lan moi nhat
- cac cau sai lan moi nhat
- lich su rut gon cac lan lam

Buddy va quan ly chi xem.
Khong co nut sua hay duyet.

## 14. Wording va muc goi y

Huong duoc chon:

`Co nguong goi y, nhung khong chan gate`

Nguong goi y:

- `80%`

Wording:

- `On phần nền`
- `Cần ôn lại`
- `Chưa làm mini test`

`80%` chi la moc goi y de quet nhanh.
No khong duoc bien thanh hard gate trong pass nay.

## 15. Tac dong toi buddy va quan ly

Neu quiz hien `Can on lai`:

- buddy thay de biet can kem them phan ly thuyet
- quan ly thay de biet nhan vien con yeu phan nen

Tac dong nay chi la `nhac nhe`.
Khong dua vao hang doi gate va khong tao hard warning.

## 16. Ngoai scope ro rang

Pass C khong lam:

- quiz la dieu kien qua gate
- report quiz rieng
- tab quiz rieng
- tong hop quiz theo cua hang
- game hoa, huy hieu, xp
- quiz cho chang thuc chien
- buddy/quan ly sua dap an

## 17. Rui ro va cach giam

### 17.1. Rui ro quiz bi hieu nham la gate

Neu wording khong ro, nhan vien co the nghi phai qua quiz moi duoc sang chang.

Cach giam:

- wording phai ro day la `mini test nhanh`
- dung label `goi y`
- khong dung chu `bat buoc`, `chan`, `rot`

### 17.2. Rui ro man hinh dai

Neu quiz qua nhieu cau, man onboarding bi dai.

Cach giam:

- moi quiz chi `3-5 cau`
- chi gan cho `pre_start` va `day_1`

### 17.3. Rui ro data bi roi

Neu nhoi quiz vao progress item, sau nay kho doc lich su.

Cach giam:

- dung `quiz template` + `quiz attempt` tach rieng

## 18. Verify muc tieu sau khi code

Can verify toi thieu:

- chang `pre_start` va `day_1` co card `Mini test nhanh`
- nhan vien nop quiz duoc va thay `diem tong + cau sai`
- nhan vien lam lai duoc va lich su van giu lan cu
- buddy/quan ly mo panel operations thay duoc ket qua quiz moi nhat va lich su rut gon
- ket qua quiz khong chan gate

## 19. File huong den khi vao plan

File kha nang dong vao o pass code:

- `src/lib/career-path-types.ts`
- `src/lib/mock-data-career-path.ts`
- `src/lib/career-path-service.ts`
- `src/app/onboarding/page.tsx`
- `src/components/onboarding-employee/*`
- `src/app/career-path/onboarding/page.tsx`
- `src/components/onboarding-operations/*`
- `src/lib/services/onboarding-operations-service.ts`

Plan code phai giu dung rule:

- 1 pass
- co fail-first check nho
- khong tran sang gate/report/game hoa
- verify lint + build + smoke role
