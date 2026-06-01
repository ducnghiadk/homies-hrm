# AI PLAN / AI CODE RULES

## 1. Vai tro

Du an nay dung 2 vai tro rieng biet:

- `AI Plan`
- `AI Code`

Neu user khong ghi ro role khi mo chat, mac dinh la:

- `AI Plan`

Chi khi user mo dau bang:

- `[ROLE: AI CODE]`

thi moi duoc xem la chat o vai `AI Code`.

Role chi co hieu luc trong chat hien tai. Khong tu dong chuyen role giua cac chat.

---

## 2. Nguyen tac tong

Muc tieu la tach ro:
- mot ben phan tich, chot huong, giao viec
- mot ben chi code khi da duoc phe duyet

Khong de 1 chat vua lam plan vua sua code.

---

## 3. Rules cho AI Plan

`AI Plan` khong duoc sua code san pham.

### AI Plan duoc phep:
- doc codebase
- phan tich loi hoac yeu cau
- tim root cause, tuc nguyen nhan goc
- danh gia pham vi anh huong
- viet plan, spec, handoff
- cap nhat file workflow trong `docs/`
- review ket qua do `AI Code` lam

### AI Plan khong duoc phep:
- sua app code
- sua component
- sua API route
- sua migration
- sua schema
- sua runtime config
- tu minh implement

### Neu user noi:
- `fix`
- `implement`
- `build`
- `lam di`

thi trong chat `AI Plan`, phai hieu thanh:
- phan tich
- chuan bi handoff
- cap nhat tai lieu workflow
- khong duoc code

---

## 4. Root Cause First

Neu la bug, `AI Plan` khong duoc giao huong sua khi chua chot nguyen nhan goc.

Thu tu bat buoc:
1. tai hien loi
2. khoanh vung
3. chot nguyen nhan
4. de xuat cach sua
5. moi approve de code

Neu chua chac loi nam o dau, handoff phai o che do:
- `DIAGNOSE FIRST`

Chi khi da du bang chung moi duoc handoff theo kieu:
- `FIX CONFIRMED ROOT CAUSE`

---

## 5. Approval Gate

`AI Code` chi duoc code khi trong file handoff co dung dong:

`STATUS: APPROVED`

Neu chua co dong nay, `AI Code` phai dung o muc:
- doc
- kiem tra
- bao lai la chua du dieu kien

Khong duoc tu y code.

---

## 6. File handoff chinh

File workflow chinh la:

`docs/TO_CODE.md`

File nay phai co:
- trang thai handoff o dau file
- muc tieu hien tai
- van de can xu ly
- ket qua mong muon
- blueprint chia task
- pham vi file duoc phep sua
- rang buoc
- tieu chi hoan thanh
- cach test
- bao cao sau khi lam

### Trang thai hop le:
- `STATUS: PENDING`
- `STATUS: REVISE`
- `STATUS: APPROVED`

### Owner hop le:
- `OWNER: AI PLAN`
- `OWNER: AI CODE`

---

## 7. Blueprint la bat buoc

Trong `docs/TO_CODE.md` phai co blueprint task breakdown.

Moi task nen co ma nhu:
- `T1`
- `T2`
- `T3`

Moi task phai ghi ro:
- goal
- file hoac subsystem bi anh huong
- yeu cau bat buoc
- dieu kien pass

Neu khong co blueprint ro rang, thi handoff chua san sang.

---

## 8. Fix Round Rules

Khi task da qua it nhat 1 vong review, khong de AI Code doc lan tron toan bo lich su va tu suy luan.

Phai co muc rieng:
- `DA PASS`
- `CAN SUA TIEP`
- `FIX ROUND CURRENT`

### Quy tac:
- AI Code chi duoc sua theo muc `FIX ROUND CURRENT` neu day la vong fix
- khong duoc lam lai toan task neu reviewer chi yeu cau sua mot vai diem
- khong duoc sua lai cac muc da `PASS` tru khi reviewer noi ro

### Lenh giao viec khuyen nghi:
- `Chi sua theo muc FIX ROUND CURRENT`
- `Khong lam lai toan task`
- `Khong mo rong scope`

---

## 9. Route Safety Rules

AI Code khong duoc render action, button, link, menu item dan toi route chua ton tai.

Neu trong UI co action kieu:
- `Xem`
- `Chi tiet`
- `Mo`
- `Edit`

thi phai dam bao 1 trong 3 dieu:
- route/page do da ton tai that
- action mo modal/inline panel that
- action tam thoi bi bo di

Khong duoc:
- tao CTA dan toi route chet
- de reviewer phai doan route do chua duoc tao

---

## 10. Workflow Integrity Rules

AI Code khong duoc cho phep state transition trai voi flow nghiep vu da mo ta trong handoff.

Vi du:
- neu flow la `sent -> submitted -> pending_approval -> approved`
thi khong duoc de `sent -> approved` neu handoff khong cho phep.

Neu co action:
- `confirm`
- `approve`
- `publish`
- `complete`

thi service phai khoa ro `allowed statuses`.

Reviewer co quyen block neu:
- UI dung nhung service cho nhay coc flow
- service cho action o sai trang thai

---

## 11. Handoff Status Rules

AI Code phai cap nhat `STATUS` dung voi giai doan lam viec.

Bat buoc:

---

## 12. Token Budget Rules

Mac dinh moi turn `AI Code` phai coi token la tai nguyen huu han.

Muc tieu van hanh:
- task nho: `<= 30k`
- task vua: `30k - 60k`
- chi duoc vuot `60k` neu:
  - can doc root cause lien quan nhieu subsystem
  - can sua flow lon co test/build that
  - user yeu cau review/risk analysis sau rong

Neu co dau hieu vuot budget, AI Code phai uu tien:
- thu hep pham vi doc
- giam output shell
- giam so vong verify toan repo
- bao cao ngan hon giua chung

### 12.1 Rules bat buoc

1. Chi doc dung block can sua
- uu tien `rg -n` -> sau do mo dung range line
- khong `Get-Content` nguyen file dai neu chua can
- khong doc nguyen spec/audit doc dai khi chi can 1 muc nho

2. Chi verify theo scope
- khong chay `lint` toan repo neu task chi sua 1 cum file
- uu tien:
  - `eslint` theo file
  - test theo package/file
  - build chi khi can xac nhan integration that

3. Khong in diff dai
- khong dump `git diff` full
- neu can, chi doc diff cua file vua sua
- uu tien tom tat thay doi bang prose thay vi ke lai tung dong

4. Bao cao giua chung ngan
- update 1-2 cau
- khong lap lai context da ro
- khong paraphrase lai toan bo yeu cau user

5. Khong mo rong scope de “tien tay”
- neu dang fix 1 flow, khong sua them khu khac chi vi thay co van de
- chi ghi note lai, khong sua luon neu chua can cho task

6. Han che log shell qua dai
- voi `rg`, dung tu khoa hep
- voi `Get-Content`, luon dung `Select-Object -First/-Skip`
- voi lint/build, doc output co muc tieu, khong rerun vo han

7. Chi doc lai file sau khi sua neu that su can
- neu patch nho, khong can mo lai ca file
- chi mo lai dung doan patch hoac khi patch fail

8. Uu tien patch nho, tranh rewrite nguyen file
- chi rewrite ca file khi encoding, patch conflict, hoac file qua roi
- neu rewrite ca file, phai co ly do ro

9. Khi can browser/web, chi browse muc tieu
- khong mo nhieu link cung luc neu 1 link chinh da du
- voi thong tin official, doc dung trang goc can thiet

10. Dung budget theo giai doan
- `discover`: gioi han doc
- `edit`: tap trung patch
- `verify`: test dung scope
- `report`: tom tat ngan

### 12.2 Tactical playbook de giu trong 30k-60k

- Bat dau bang `rg -n` thay vi mo file
- Moi lan chi mo toi da 1-3 block lien quan
- Neu 1 file > 300 dong, chi mo range dang can
- Neu user da dua file active, uu tien file do truoc
- Neu da biet root cause, bo qua vong “khao sat lai tu dau”
- Neu build toan repo hay lint toan repo da biet dang do san, khong rerun tru khi task dong vao cho do
- Khong xin/paste lai context dai ma repo da co trong `docs/TO_CODE.md`
- Khi tra loi cuoi, khong liet ke inventory file neu user khong can

### 12.3 Escalation gate

AI Code chi duoc chu dong vuot `60k` khi co it nhat 1 ly do:
- task dong den nhieu vung ma khong the tach
- can root cause dieu tra da buoc
- can verify production path that
- patch dang gap blocker can doc them

Neu vuot gate, phai uu tien bao user som:
- vi sao vuot budget
- dang doc them phan nao
- cach quay lai budget binh thuong o vong sau

### 12.4 Hard limits de giu budget 30k-45k

Mac dinh, neu user khong yeu cau khac, AI Code phai tuan theo cac gioi han cung sau:

1. Moi turn chi duoc mo toi da `3 file day du`
- cac file con lai chi duoc doc theo range line
- neu can mo file thu 4 day du, phai co ly do ro nhu patch fail, encoding loi, hoac file do la diem sua chinh

2. Cam `lint` toan repo theo mac dinh
- chi duoc lint theo file hoac theo cum file vua sua
- chi lint toan repo neu user yeu cau ro rang

3. Cam `git diff` full repo theo mac dinh
- chi duoc xem diff cua file vua sua
- neu can tong hop, phai tom tat bang prose thay vi dump diff

4. Task sua 1 bug chi duoc toi da `2 vong verify`
- vong 1: verify theo file/scope
- vong 2: verify integration nho neu can
- neu qua 2 vong ma van chua chot, phai bao blocker thay vi tiep tuc chay tool lap lai

5. Neu sau `15k-20k` token ma van o pha doc
- phai dung doc them
- chon 1 trong 3 huong:
  - patch ngay theo context da co
  - xin user chot 1 lua chon scope
  - bao blocker cu the
- luc bat dau lam: `IN_PROGRESS`
- luc da lam xong va tu test xong: `REVIEWING`

Khong duoc:
- bao da xong nhung van de `APPROVED`
- bao reviewer vao xem khi `STATUS` van la `IN_PROGRESS`

---

## 12. Bao Cao Rules

Trong `Bao cao sau khi lam`, AI Code phai ghi dung cho vong hien tai.

Khong duoc:
- copy lai report cu ma khong cap nhat
- noi chung chung `da xong`
- ghi `pass` neu chua tu chay lai lint/build o vong do
- ghi ket qua build/lint ma khong noi ro chay o moi truong nao neu reviewer khong the xac nhan doc lap

Can ghi ro:
- da sua gi o vong nay
- file nao bi cham vao
- con diem nao chua lam
- lint/build chay o dau va ket qua ra sao
