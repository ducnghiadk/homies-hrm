# TO_CODE

File nay la control file mong cho moi vong lam viec.

Nguyen tac:
- chi giu `current ask`, scope, done criteria, report vong nay
- khong lap lai spec cu, review cu, hay bao cao cu
- neu can boi canh dai, doc file tham chieu ben duoi

---

## STATUS

`REVIEWING`

Gia tri hop le:
- `DRAFT`
- `APPROVED`
- `IN_PROGRESS`
- `REVIEWING`
- `DONE`
- `BLOCKED`

Rule:
- chi code khi `STATUS = APPROVED`
- code xong va tu test xong thi doi thanh `REVIEWING`
- review pass va user chot thi doi thanh `DONE`

---

## TASK

`TASK-SCHEDULE-BOARD-POLISH-02`

---

## OWNER

`AI CODE A`

---

## GOAL

Polish board `/schedules` de gan hon voi flow Stage 2:
- them so tong quan de quan ly quet nhanh tinh trang tuan
- lam ro canh bao chan publish va canh bao mem
- giu nguyen flow gan nhanh, publish va history dang chay

---

## IN SCOPE

- `src/app/schedules/page.tsx`
- `docs/TO_CODE.md`

---

## OUT OF SCOPE

- doi backend that
- doi cau truc board sang layout moi
- sua bug quota theo vi tri trong pass nay
- doi flow publish, attendance, payroll, contract

---

## CURRENT ASK

Lam mot luot polish board `/schedules` hien co:
- bo sung khung tong quan cho `nhan su trong tuan`, `o trong chua xep`, `slot con thieu nguoi`, `tong canh bao`
- lam ro warning nao chan publish, warning nao chi can xem lai
- bo sung nhac nho ngan trong panel slot dang chon de quan ly biet slot da du nguoi hay con thieu

## STATUS

- [x] Wording/polish board `/schedules`

---

## DONE WHEN

- board `/schedules` co khung tong quan bo sung theo dung muc tieu pass nay
- khu warnings phan biet ro `chan publish` va `can xem lai`
- panel slot dang chon nhac ro trang thai du/thiieu nguoi va viec sua sau publish can ly do
- `npx eslint src/app/schedules/page.tsx` pass
- `npm run build` pass

---

## VERIFY

Toi thieu:
- vao `/schedules`
- xem khung tong quan dau trang
- chon 1 slot dang thieu nguoi va xem panel ben phai
- xem khu warning khi co hard/soft warning
- chay `npx eslint src/app/schedules/page.tsx`
- chay `npm run build`

---

## REFERENCES

- `docs/CODEMAP.md`
- `docs/TOKEN_PLAYBOOK.md`
- `docs/STAGE2_SCHEDULING_FLOW_SPEC.md`

---

## BAO CAO SAU KHI LAM

Da xong:
- sua `src/app/schedules/page.tsx`, `docs/TO_CODE.md`
- board `/schedules` da co them khung tong quan cho nhan su trong tuan, o trong chua xep, slot con thieu nguoi va tong canh bao
- khu warnings da tach ro nhom chan publish va nhom can xem lai
- panel slot dang chon da nhac ro slot con thieu bao nhieu va nhac viec sua sau publish can ly do
- Chua lam: chua sua bug quota theo vi tri, chua doi board sang layout theo nhan vien x ngay
- Verify: `npx eslint src/app/schedules/page.tsx` pass, `npm run build` pass, `npm run ai:guard` pass
- Link local: `http://localhost:3333/schedules`
- Rui ro con lai: so tong quan van bi anh huong boi bug quota theo vi tri da ghi trong `KNOWN_ISSUES.md`
