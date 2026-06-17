# Thi?t k? popup x?p ngu?i theo hu?ng task-first t?i gi?n

**Ngày:** 2026-06-17  
**Tr?ng thái:** Ch? ngu?i dùng duy?t spec  
**Ph?m vi:** `src/app/schedules/_components/AssignmentModal.tsx`

## 1. M?c tiêu

Popup hi?n t?i có d? thông tin nhung b? chia l?c chú ý sang nhi?u kh?i: ph?n header, danh sách g?i ý, card v? trí, card tình tr?ng, m?o thao tác. K?t qu? là ngu?i qu?n lý ph?i quét nhi?u noi tru?c khi ch?m vào hành d?ng chính.

Thi?t k? m?i ph?i d?t 4 m?c tiêu:

1. M? popup là th?y ngay ca nào, v? trí nào, dang thi?u bao nhiêu ngu?i.
2. M?t roi vào danh sách ?ng viên tru?c, không b? c?t ph? kéo sang bên.
3. M?i ?ng viên ch? gi? metadata ph?c v? quy?t d?nh gán ngu?i ngay lúc dó.
4. T?ng th? nhìn ?m, s?ch, nh?, dúng mood Homies và d?ng b? board tu?n m?i.

## 2. Hu?ng dã ch?t

Hu?ng du?c ch?t là **task-first, thông tin sau**.

- Header gói ng? c?nh chính.
- Search n?m ngay du?i header.
- Thân popup t?p trung vào danh sách ?ng viên theo nhóm uu tiên.
- B? h?n c?t ph?i c? d?nh.
- Tip thao tác rút xu?ng t?i da m?t dòng ho?c b? n?u không th?t s? c?n.

## 3. V?n d? c?a popup hi?n t?i

### 3.1 Lu?ng nhìn b? tách dôi

- Danh sách ?ng viên n?m bên trái.
- Thông tin v? trí, tr?ng thái, m?o thao tác n?m bên ph?i.
- Khi quy?t d?nh gán ngu?i, ngu?i dùng ph?i liên t?c d?o m?t qua l?i gi?a hai c?t.

### 3.2 Thông tin l?p l?i nhi?u t?ng

- `filledCountLabel`, `registeredCountLabel`, `shortageLabel` dang xu?t hi?n ? header và l?p l?i trong panel ph?i.
- V? trí dang xem cung l?p l?i gi?a danh sách và card tr?ng thái.

### 3.3 M?t d? card cao hon m?c c?n thi?t

- Nhi?u box bo tròn trong m?t popup làm nh?p d?c n?ng.
- `M?o thao tác` chi?m di?n tích nhung không giúp ra quy?t d?nh tr?c ti?p.

## 4. C?u trúc popup m?i

Popup m?i v?n dùng modal gi?a màn, nhung chuy?n sang b? c?c m?t c?t uu tiên thao tác.

### 4.1 Header gói d? ng? c?nh

Header g?m 3 l?p:

1. Kicker ng?n: `X?p l?ch cho ca`
2. Tiêu d? chính: ví d? `Ca Sáng - T2 22/06`
3. Dòng ng? c?nh g?n: gi?, v? trí dang xem, tr?ng thái thi?u ho?c d? ngu?i

Ví d? copy:

- `08:30 - 12:00 · Pha ch? · Thi?u 1 ngu?i`

Ph?n pill ch? gi? t?i da 2-3 nhãn th?t s? h?u ích:

- `1/2 ngu?i`
- `Thi?u 1 ngu?i`
- `C?n lý do n?u s?a sau khi ch?t` n?u ca dã published

Không hi?n th? thêm card tr?ng thái nào khác bên du?i header.

### 4.2 Search di ngay tru?c danh sách

- Ô tìm ki?m full-width ho?c g?n full-width trên desktop.
- Placeholder gi? ng?n: `Tìm nhân viên...`
- M?t dòng mô t? r?t ng?n bên du?i search: `Uu tiên ngu?i dã dang ký tru?c. Nhóm c?n cân nh?c hi?n th? phía sau.`

Không dùng block hu?ng d?n l?n.

### 4.3 Danh sách theo 2 nhóm chính

Danh sách ?ng viên chia còn 2 nhóm rõ ràng:

1. `Ðã dang ký và phù h?p`
2. `Có th? b? sung`

N?u c?n gi? nhóm r?i ro nh?, nó v?n n?m trong nhóm 2 du?i d?ng nhãn c?nh báo ng?n trên item, không tách thêm m?t kh?i l?n riêng.

M?c tiêu là gi?m s? l?n ng?t nh?p khi cu?n danh sách.

### 4.4 C?u trúc m?i item

M?i ?ng viên ch? gi? 4 thành ph?n:

1. Tên nhân viên
2. Dòng meta ng?n: v? trí, s? ca tu?n này, ho?c xung d?t chính n?u có
3. Ði?m ho?c tag ng?n th? hi?n d? phù h?p
4. M?t hành d?ng chính: `Gán vào ca` ho?c `G? kh?i ca`

Ví d? meta t?t:

- `Pha ch? · 1 ca tu?n này`
- `Pha ch? · C?n ki?m tra ca chi?u cùng ngày`
- `Thu ngân · Ðã d? ca tu?n`

Không gi? các câu dài nhi?u v? ki?u gi?i thích d?y d? trong card hi?n t?i. N?u có r?i ro, câu copy ph?i nén v? dúng m?t ý quan tr?ng nh?t.

### 4.5 B? c?t ph?i

Các kh?i sau b? lo?i b? kh?i layout c? d?nh:

- `V? trí trong ca này`
- `Tình tr?ng ô dang xem`
- `M?o thao tác`

Thông tin trong hai kh?i d?u du?c h?p th? lên header. `M?o thao tác` ch? gi? l?i n?u sau khi rút g?n v?n c?n m?t note 1 dòng n?m du?i search.

## 5. Quy t?c n?i dung

### 5.1 Th? t? uu tiên hi?n th?

Khi nhi?u thông tin cùng t?n t?i, th? t? uu tiên là:

1. Có gán du?c ngu?i hay không
2. Ngu?i này có ph?i uu tiên tru?c không
3. Có xung d?t nào bu?c ngu?i qu?n lý ph?i bi?t tru?c khi b?m không
4. Ði?m phù h?p ho?c tr?ng thái ph?

N?u m?t n?i dung không giúp tr? l?i 4 câu h?i trên, nó không nên có m?t trong item.

### 5.2 Rút g?n copy

Copy m?i c?n ng?n, có d?u d?y d?, không k? chuy?n dài dòng.

Ví d?:

- `Ðang gi? ca này`
- `C?n ki?m tra ca chi?u cùng ngày`
- `Ðã d? ca tu?n`
- `Ðã dang ký tru?c`

Tránh d?ng câu dài nhu:

- `Chua có dang ký · Ðã x?p 1 ca trong tu?n · Ðang có ca Ca chi?u cùng ngày · Ðang th? vi?c`

N?u có nhi?u c? tr?ng thái, ch? hi?n th? c? ?nh hu?ng l?n nh?t d?n quy?t d?nh.

## 6. Ngôn ng? hình ?nh

### 6.1 Visual tone

- N?n popup tr?ng ?m ho?c ivory r?t nh?t
- Border kem nh?t
- Navy d?m cho c?u trúc chính
- Vanilla ho?c amber nh?t cho tr?ng thái thi?u
- Mint ch? dùng nh? cho tr?ng thái an toàn ho?c hint tích c?c

### 6.2 Nh?p card

- Bo góc v?n m?m nhung gi?m c?m giác nhi?u l?p h?p l?ng nhau
- Kho?ng cách gi?a item d?u, thoáng
- Gi?m s? vùng n?n màu khác nhau trong cùng m?t popup

### 6.3 Typography

- Header rõ c?p m?nh nh?t
- Group title nh? g?n nhung d? phân tách
- Meta text ng?n, d? tuong ph?n v?a d? d? không tranh v?i tên ngu?i và nút hành d?ng

## 7. Hành vi chính

### 7.1 Lu?ng thao tác

1. Ngu?i dùng m? popup t? m?t ô ca trên board.
2. Header cho bi?t ngay ca nào dang x? lý và còn thi?u bao nhiêu ngu?i.
3. Ngu?i dùng tìm nhanh b?ng search ho?c quét nhóm uu tiên d?u tiên.
4. B?m `Gán vào ca` ho?c `G? kh?i ca` ngay trên item.
5. N?u ca dã published, h? th?ng ti?p t?c gi? flow yêu c?u lý do thay d?i nhu hi?n t?i.
6. Popup c?p nh?t tr?ng thái danh sách và board.

### 7.2 Không d?i ph?m vi nghi?p v?

Thi?t k? này không thay d?i:

- Thu?t toán recommendation
- Logic published change reason
- D? li?u source c?a score ho?c label
- Quy t?c gán ho?c g? ngu?i kh?i ca

Ch? thay d?i cách trình bày và uu tiên thông tin trong UI.

## 8. Tiêu chí hoàn thành UX/UI

Thi?t k? du?c xem là d?t n?u:

1. Ngu?i dùng hi?u tr?ng thái ca hi?n t?i ch? b?ng header, không c?n nhìn panel ph?.
2. Danh sách ?ng viên tr? thành vùng nhìn d?u tiên và l?n nh?t.
3. M?i item d?c trong vài giây là quy?t du?c có nên gán hay không.
4. Popup nh? hon rõ r?t so v?i b?n hi?n t?i nhung không làm m?t ng? c?nh quan tr?ng.
5. Giao di?n nhìn g?n, t?i gi?n, ?m và d?ng b? v?i board tu?n m?i.

## 9. G?i ý tri?n khai UI

- Chuy?n grid hai c?t hi?n t?i thành lu?ng m?t c?t.
- D?n `positionLabel`, `filledCountLabel`, `registeredCountLabel`, `shortageLabel` vào header ho?c subheader g?n.
- Gi?m `reason` dài thành b?n copy uu tiên ng?n.
- Ch? gi? `sections` ? m?c hai nhóm chính n?u d? li?u cho phép, ho?c g?p nhóm ? t?ng hi?n th?.
- Gi? nút dóng popup nhung gi?m d? n?i d? không tranh v?i tác v? chính.

## 10. Ngoài ph?m vi

- Thi?t k? l?i board tu?n
- Thay d?i ranking recommendation
- Thêm ch?n nhi?u ngu?i trong m?t lu?t
- Thêm footer sticky action bar cho version d?u

Version d?u c?n t?i gi?n tru?c, không thêm co ch? hành d?ng m?i.
