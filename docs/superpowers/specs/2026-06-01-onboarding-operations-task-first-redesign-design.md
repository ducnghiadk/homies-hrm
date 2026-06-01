# 2026-06-01 Onboarding Operations Task-First Redesign

## M?c tiêu

Nâng c?p màn `V?n hành onboarding` d? ngu?i m?i dùng nhìn giao di?n là hi?u:
- màn này dùng d? làm gì,
- nên b?t d?u t? dâu,
- m?i card có ch?c nang gì,
- bu?c ti?p theo c?n b?m là gì.

Tr?ng tâm không ph?i thêm nhi?u d? li?u hon, mà d?i cách t? ch?c thông tin theo lu?ng thao tác th?c t? c?a HR.

## V?n d? hi?n t?i

T? màn hi?n t?i:
- Ngu?i m?i th?y nhi?u card song song nhung không có di?m b?t d?u rõ ràng.
- `Danh sách c?n x? lý` và `Chi ti?t checklist` dúng d? li?u nhung chua nói rõ logic thao tác.
- Ngôn ng? tr?ng thái nhu `Block ngày d?u` thiên v? tr?ng thái h? th?ng hon là hu?ng d?n v?n hành.
- Ngu?i dùng ph?i t? suy lu?n: nên ch?n ai tru?c, card nào c?n b?m, b?m xong s? d?n t?i dâu.
- C?t ph?i dang là t?p h?p checklist, chua ph?i vùng “làm vi?c theo bu?c”.

## K?t qu? mong mu?n

Sau redesign, ngu?i m?i vào màn ph?i hi?u ngay:
1. Hôm nay c?n x? lý nhóm vi?c nào.
2. Ch?n nhân s? nào tru?c.
3. Nhân s? dang k?t ? bu?c nào.
4. Vi?c ti?p theo là gì.
5. M?i card bên ph?i dùng d? làm gì và b?m vào dâu.

## Ph?m vi

In scope:
- Route `src/app/career-path/onboarding/page.tsx`
- Component danh sách trái `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- Component chi ti?t ph?i `src/components/onboarding-operations/OperationsChecklistDetail.tsx`
- Có th? thêm 1-2 component nh? m?i cho timeline d?u trang và sticky guide panel.
- Ði?u ch?nh wording, hierarchy, grouping, step logic, visual emphasis.

Out of scope trong pass này:
- Không d?i service nghi?p v? lõi c?a onboarding.
- Không seed thêm progress th?t cho “ngày 5”.
- Không thêm workflow dóng case m?i.
- Không thay d?i route IA t?ng th? ngoài màn `V?n hành onboarding`.

## Hu?ng thi?t k? du?c ch?n

Ch?n hu?ng `Task-first lite`.

Lý do:
- Gi?i quy?t tr?c ti?p v?n d? “nhìn không hi?u làm gì”.
- Gi? du?c b? c?c 2 c?t quen thu?c cho HR.
- Không bi?n màn v?n hành thành wizard c?ng gây ch?m thao tác.
- Có th? tri?n khai theo pass nh?, r?i ro th?p hon redesign toàn b? flow state.

## Lu?ng m?i

Màn `V?n hành onboarding` s? du?c t? ch?c theo 4 bu?c ngang ? d?u trang:
1. `Xem uu tiên hôm nay`
2. `Ch?n nhân s?`
3. `Chu?n b? tru?c ngày d?u`
4. `Theo dõi sau ca d?u`

Ý nghia:
- Bu?c 1 cho ngu?i m?i bi?t b?i c?nh và di?m b?t d?u.
- Bu?c 2 bi?n c?t trái thành hàng d?i có nghia.
- Bu?c 3 và 4 bi?n c?t ph?i thành vùng hành d?ng theo ng? c?nh, không còn là checklist r?i r?c.

## C?u trúc UI d? xu?t

### 1. Kh?i d?u trang

Thay c?m stat card thu?n hi?n t?i b?ng:
- Timeline ngang 4 bu?c.
- Thanh “Hôm nay c?n gì” ngay du?i timeline.

Timeline ngang:
- M?i bu?c có tên ng?n.
- M?i bu?c có mô t? 1 dòng.
- Có tr?ng thái `dang làm`, `s?p t?i`, `dã qua` theo employee dang ch?n.
- N?u chua ch?n employee, timeline m?c d?nh neo ? bu?c 1-2.

Thanh “Hôm nay c?n gì”:
- Nêu t?ng quan r?t ng?n nhu:
  - `2 ngu?i c?n x? lý ngay`
  - `0 ngu?i c?n follow-up sau ca`
- Có CTA ki?u `Ch?n ngu?i d?u tiên` ho?c `Xem nhóm c?n x? lý ngay`.

### 2. C?t trái: Bu?c 2 - Ch?n nhân s? c?n x? lý

Gi? pattern list card d? h?n ch? phá c?u trúc cu, nhung card ph?i có nghia v?n hành rõ hon.

Header c?t trái:
- Title d?i thành `Bu?c 2: Ch?n nhân s? c?n x? lý`
- Subtitle: `Ch?n 1 ngu?i. H? th?ng s? ch? ra bu?c dang ch? và vi?c c?n b?m ti?p theo.`

B? l?c:
- Gi? `T?t c? / Block ngày d?u / C?n follow-up / S?n sàng`
- Nhung hi?n th? theo vai trò tab hàng d?i.
- Khi active, tab có mô t? ng?n b?ng copy g?n nghia v?n hành hon.

M?i card nhân s? ph?i có 4 l?p thông tin:
- `Ai`: tên, v? trí, c?a hàng, ngày vào làm.
- `Ðang ? bu?c nào`: ví d? `Ðang ? bu?c 3: Chu?n b? tru?c ngày d?u`.
- `Vi?c k? ti?p`: ví d? `Vi?c k? ti?p: Gán ngu?i kèm`.
- `M?c uu tiên`: `Làm ngay`, `C?n chu?n b?`, `Theo dõi sau ca`.

Card dang ch?n:
- Có nhãn `Ðang xem`.
- Vi?n và bóng n?i rõ hon.

Ngôn ng? tr?ng thái trên card:
- Uu tiên wording v?n hành hon wording k? thu?t.
- Ví d?:
  - `Thi?u ngu?i kèm`
  - `Chua ch?t ca d?u`
  - `Chua xác nh?n n?i quy t?i quán`
- Tránh d? ngu?i m?i ch? th?y `Block ngày d?u` mà không hi?u nguyên nhân.

### 3. C?t ph?i: vùng làm vi?c theo bu?c

C?t ph?i d?i vai trò t? “Chi ti?t checklist” sang “dang làm bu?c nào cho nhân s? này”.

Header c?t ph?i:
- Title d?ng:
  - `Bu?c 3: Chu?n b? tru?c ngày d?u` n?u còn vi?c tru?c ngày d?u.
  - `Bu?c 4: Theo dõi sau ca d?u` n?u ph?n tru?c ngày d?u dã xong.
- Có 1 dòng ph? d?ng:
  - `Hi?n dang ch?: Gán ngu?i kèm`
  - `Sau khi xong bu?c này: Xác nh?n n?i quy t?i quán`

Badge tr?ng thái c?p vùng:
- Dùng ngôn ng? ngu?i v?n hành hi?u ngay:
  - `Làm ngay`
  - `C?n chu?n b?`
  - `Ðã s?n sàng`
- H?n ch? l?m d?ng `Block` làm ngôn ng? chính.

### 4. Sticky guide panel

Panel sticky n?m trên d?u c?t ph?i, luôn th?y khi scroll.

M?c dích:
- Gi?i thích ng?n g?n màn này dùng d? làm gì.
- Gi?m nhu c?u t? suy lu?n ý nghia card.
- D?n ngu?i m?i theo flow.

N?i dung panel:
- `Màn này dùng d? làm gì`
  - `X? lý t?ng nhân s? m?i theo dúng th? t?, tránh sót bu?c tru?c ngày d?u và sau ca d?u.`
- `B?n dang ? bu?c nào`
  - bind theo employee dang ch?n.
- `Làm nhu th? nào`
  - `1. Nhìn vi?c k? ti?p`
  - `2. B?m ngay trong card bên du?i`
  - `3. Xong bu?c nào, h? th?ng t? d?y sang bu?c ti?p`
- `Card bên du?i nghia là gì`
  - `M?i card = 1 vi?c v?n hành`
  - `Nhãn góc ph?i = m?c uu tiên`
  - `Nút trong card = hành d?ng c?n b?m`

Panel này ph?i ng?n, không bi?n thành tài li?u dài.

### 5. Card checklist

Không d?i thành card quá dài. V?n g?n, nhung tang clarity b?ng structure và copy.

M?i card nên có:
- Tên vi?c.
- 1 dòng `Dùng d? làm gì`.
- Tr?ng thái hi?n t?i.
- Action rõ ràng.

Ví d? copy:
- `Ca d?u và gi? có m?t`
  - `Dùng d? ch?t ca d?u nhân s? s? vào và gi? c?n có m?t.`
- `Ngu?i kèm / ngu?i hu?ng d?n`
  - `Dùng d? ch? d?nh ai ch?u trách nhi?m kèm nhân s? này trong ngày d?u.`
- `Ð?ng ph?c, ch?m công, n?i quy t?i quán`
  - `Dùng d? xác nh?n nhân s? dã du?c nh?c l?i n?i quy th?c t? t?i quán.`
- `Tài kho?n, nhóm chat, công c?`
  - `Dùng d? ki?m tra nhân s? dã có d? kênh liên l?c và công c? làm vi?c.`

### 6. Action wording

Ð?i label nút d? ngu?i m?i d? ph?i suy di?n.

Gi? l?a ch?n ca:
- `Sáng`
- `Gi?a ngày`
- `T?i`

Nhung m?i l?a ch?n c?n thêm tín hi?u dây là action ch?n ca, không ph?i ch? tag thông tin.

Ð?i wording action khác:
- `Xác nh?n t?i quán` -> `Ðã nh?c và xác nh?n t?i quán`
- `Ðã vào nhóm chat` gi? nguyên nhung nhìn nhu toggle action rõ ràng.
- `Thi?u tool làm vi?c` -> uu tiên d?ng có nghia hành d?ng hon nhu `Ðã c?p d? tool` / `Chua c?p d? tool`
- Sau ca d?u:
  - `?n, không c?n theo sát`
  - `T?m ?n, c?n theo sát thêm`
  - `Có v?n d?, c?n x? lý`

## Quy t?c s?p x?p n?i dung hành d?ng

Thay vì render checklist ch? theo phase c?ng, UI c?n nh?n m?nh `vi?c k? ti?p`.

Quy t?c:
- Card là next action ph?i n?m trên cùng trong vùng step hi?n t?i.
- Card next action có visual emphasis m?nh nh?t.
- Các card còn l?i cùng step x?p du?i.
- Các card c?a step sau v?n có th? xu?t hi?n, nhung m? hon ho?c d?t sau divider rõ ràng.

M?c tiêu:
- M?t ngu?i dùng b? kéo vào dúng 1 vi?c nên làm ti?p theo.
- Gi?m t?i nh?n th?c.

## Logic step active

Step active du?c suy ra t? d? li?u hi?n có, không t?o workflow m?i.

Nguyên t?c:
- N?u còn b?t k? item `before_first_shift` chua xong -> active step là `Bu?c 3: Chu?n b? tru?c ngày d?u`.
- N?u t?t c? item `before_first_shift` dã xong -> active step là `Bu?c 4: Theo dõi sau ca d?u`.
- N?u chua ch?n employee -> active flow d?ng ? `Bu?c 2: Ch?n nhân s?`.

`Vi?c k? ti?p` du?c suy ra t? item chua xong uu tiên cao nh?t trong phase active.

## Mapping wording tr?ng thái

Mapping trình bày d? xu?t:
- `block_day_one` -> `Làm ngay`
- `need_follow_up` -> `Theo dõi sau ca`
- `ready` -> `Ðã s?n sàng`

Luu ý:
- key k? thu?t trong code/service có th? gi? nguyên.
- ch? d?i l?p presentation copy.

## Ki?n trúc tri?n khai d? xu?t

### File s?a chính
- `src/app/career-path/onboarding/page.tsx`
- `src/components/onboarding-operations/UpcomingOnboardingList.tsx`
- `src/components/onboarding-operations/OperationsChecklistDetail.tsx`

### File m?i có th? thêm
- `src/components/onboarding-operations/OnboardingOpsTimeline.tsx`
- `src/components/onboarding-operations/OnboardingOpsStickyGuide.tsx`

### Trách nhi?m
- `page.tsx`: tính header data, active step summary, truy?n props.
- `UpcomingOnboardingList.tsx`: render card nhân s? theo ngôn ng? task-first.
- `OperationsChecklistDetail.tsx`: render vùng step active + sticky guide + card emphasis.
- `OnboardingOpsTimeline.tsx`: timeline 4 bu?c ? d?u trang.
- `OnboardingOpsStickyGuide.tsx`: panel gi?i thích ng?n cho ngu?i m?i.

## R?i ro và ki?m soát

R?i ro 1:
- Màn quá nhi?u ch? khi c? gi?i thích cho ngu?i m?i.
- Ki?m soát: dua gi?i thích vào sticky guide chung, gi? card checklist ng?n.

R?i ro 2:
- Ngu?i dùng cu th?y ch?m hon n?u b? wizard hóa quá m?nh.
- Ki?m soát: gi? b? c?c 2 c?t, không khóa thao tác theo step c?ng.

R?i ro 3:
- Copy m?i l?ch v?i key/tr?ng thái service hi?n t?i.
- Ki?m soát: ch? d?i presentation layer, không d?i service contract trong pass này.

## Testing

C?n test ? 3 l?p:
- Contract test cho copy/structure m?i c?a page và component.
- Test routing/filter cu v?n còn ho?t d?ng.
- Smoke test th? công v?i 2 account demo onboarding m?i d? ch?c overview và operations v?n render dúng.

## Tiêu chí hoàn thành

Pass này d?t n?u:
- Ngu?i m?i m? màn th?y timeline 4 bu?c ngay d?u trang.
- C?t trái nói rõ `dang ? bu?c nào` và `vi?c k? ti?p` cho t?ng ngu?i.
- C?t ph?i có sticky guide gi?i thích cách dùng màn.
- Card checklist nói rõ m?c dích và hành d?ng, không bu?c ngu?i dùng t? doán.
- Không c?n d?c tài li?u ngoài màn hình v?n có th? b?t d?u thao tác.
