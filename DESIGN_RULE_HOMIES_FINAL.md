# Homies Design Rule Final

Phiên bản: `v1`
Ngày chốt: `2026-05-19`
Phạm vi áp dụng:
- toàn bộ web HRM của Homies
- các màn hình mới
- các lần refactor UI về sau
- input cho AI code khi build giao diện

Tài liệu này là bản rule cuối cùng, tổng hợp từ:
- [DESIGN.md](/mnt/c/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/DESIGN.md:1)
- [src/lib/theme.ts](/mnt/c/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/theme.ts:1)
- [src/app/globals.css](/mnt/c/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/app/globals.css:3)

---

## 1. Tinh thần thương hiệu

Homies không phải là một sản phẩm enterprise khô, cũng không phải một app quá “kẹo ngọt”.

Cảm giác đúng cần đạt là:
- thân thiện
- sạch
- hiện đại
- có chút premium
- dễ dùng trên mobile
- ấm và gần gũi như một thương hiệu đồ uống, nhưng vẫn đủ tin cậy cho vận hành nội bộ

Nói ngắn gọn:
- `ấm ở nền`
- `tin cậy ở màu brand`
- `rõ ràng ở thông tin`
- `nhẹ mắt trong dùng hàng ngày`

---

## 2. Màu thương hiệu chính thức

### 2.1. Màu cốt lõi

Đây là bộ màu Homies phải ưu tiên dùng:

- `Primary Blue`: `#2F6FA8`
- `Deep Navy`: `#001D3D`
- `Rich Black Navy`: `#000814`
- `Soft Cream Page`: `#FFF8E8`
- `Card White`: `#FFFFFF`
- `Mint Green`: `#1E9E57`
- `Mint Light`: `#DDF4EC`
- `Warm Vanilla`: `#F6C85F`
- `Error Red`: `#D9381E`

### 2.2. Vai trò từng màu

`#2F6FA8`:
- CTA chính
- tab active
- link chính
- icon chính
- trạng thái thông tin

`#001D3D`:
- tiêu đề lớn
- header đậm
- vùng premium
- text cần độ tin cậy cao

`#FFF8E8`:
- nền trang chính
- nền khu vực nhẹ
- background tổng thể cho app mobile-first

`#1E9E57`:
- thành công
- đã duyệt
- trạng thái active
- confirm/check-in/check-out tốt

`#F6C85F`:
- pending
- warning nhẹ
- nhấn số liệu
- tag/ca sáng/các điểm cần tạo cảm giác ấm

`#D9381E`:
- lỗi
- từ chối
- cảnh báo nghiêm trọng
- trạng thái vi phạm

---

## 3. Thứ tự ưu tiên màu khi thiết kế

Khi làm giao diện mới, ưu tiên theo thứ tự này:

1. `bg-page`: `#FFF8E8`
2. `card`: `#FFFFFF`
3. `primary action`: `#2F6FA8`
4. `heading/text mạnh`: `#001D3D`
5. `success`: `#1E9E57`
6. `warning`: `#F6C85F`
7. `error`: `#D9381E`

Không được đảo logic này nếu không có lý do rõ ràng.

---

## 4. Các rule bắt buộc về màu

### 4.1. Không dùng màu thô tùy hứng

Không tự ý dùng:
- `bg-blue-600`
- `bg-red-500`
- `text-purple-600`
- các mã hex ngẫu nhiên không nằm trong palette

Ưu tiên:
- token trong `globals.css`
- token trong `theme.ts`
- các alias như `primary`, `success`, `warning`, `error`

### 4.2. Không dùng tím làm màu chủ đạo

Tím có xuất hiện ở vài badge/role cũ, nhưng:
- không được dùng tím làm màu dẫn dắt brand
- không dùng tím cho CTA chính
- không dùng tím cho nền trang

Tím chỉ được dùng khi:
- kế thừa một badge role đặc biệt đã tồn tại
- hoặc cần giữ tương thích với dữ liệu cũ

### 4.3. Không làm dark mode giả premium

Homies không theo hướng:
- nền đen toàn app
- neon
- cyber
- fintech lạnh

Nếu có vùng tối:
- chỉ dùng cho hero, header đặc biệt, card nổi bật
- phải dùng `#001D3D` hoặc `#000814`
- không biến cả app thành dark UI

---

## 5. Rule cho nền, card, viền, bóng

### 5.1. Nền

Nền chuẩn của app:
- `#FFF8E8`

Nền phụ:
- `#FFFDF9`
- `#F4F8FC`
- `#F5FCFA`

Tránh:
- xám lạnh phủ toàn trang
- trắng tinh toàn bộ khiến app mất chất thương hiệu

### 5.2. Card

Card nên có:
- nền trắng
- bo góc mềm
- đổ bóng nhẹ
- viền sáng rất mỏng nếu cần

Cảm giác card:
- dễ chạm
- nhẹ
- sạch
- không nặng nề

Không làm card kiểu:
- viền dày
- quá nhiều layer
- shadow đậm kiểu desktop enterprise cũ

### 5.3. Shadow

Ưu tiên shadow nhẹ:
- card thường: shadow nhỏ
- card hover: tăng vừa phải
- card CTA/feature: có thể dùng glow xanh nhẹ

Không dùng:
- shadow đen đậm
- shadow blur to làm giao diện nặng

---

## 6. Rule cho button

### 6.1. Primary Button

Dùng:
- nền `#2F6FA8`
- text trắng
- hover đậm hơn về `#1D3E61`

Dùng cho:
- lưu
- xác nhận
- tiếp tục
- hành động chính của màn

### 6.2. Secondary Button

Dùng khi cần nhẹ hơn:
- nền sáng
- text `primary`
- viền nhẹ

### 6.3. Outline Button

Dùng cho:
- hành động phụ
- quay lại
- lọc
- mở sheet phụ

Không để outline button nổi hơn primary button.

### 6.4. Destructive Button

Dùng `error red` rất tiết chế.

Chỉ dùng cho:
- xóa
- từ chối
- hủy thao tác quan trọng

Không dùng đỏ cho hành động thông thường.

---

## 7. Rule cho trạng thái

### 7.1. Success

Màu:
- nền nhẹ: `#DDF4EC`
- text/icon: `#1E9E57` hoặc `#107C41`

Dùng cho:
- approved
- active
- hoàn tất
- đúng giờ

### 7.2. Warning

Màu:
- nền nhẹ: `#FFF8E8`
- text/icon: `#F6C85F` hoặc `#D97706`

Dùng cho:
- pending
- chờ duyệt
- thiếu thông tin
- cảnh báo nhẹ

### 7.3. Error

Màu:
- nền nhẹ: `#FEF2F2`
- text/icon: `#D9381E`

Dùng cho:
- rejected
- fail
- vi phạm
- lỗi cần chú ý ngay

### 7.4. Info

Màu:
- nền nhẹ xanh
- text/icon dùng `primary blue`

Dùng cho:
- thông báo hệ thống
- hướng dẫn
- dữ liệu trung tính

---

## 8. Rule cho typography

### 8.1. Font

Font chính:
- `Inter`

Không tự ý đổi sang:
- font quá trang trí
- font serif
- font tech cứng

### 8.2. Heading

Heading nên:
- đậm
- gọn
- `tracking-tight`
- màu `#001D3D`

### 8.3. Body text

Body text nên:
- dễ đọc
- tương phản vừa đủ
- tránh xám quá nhạt

### 8.4. Numeric UI

Các vùng số liệu như:
- KPI nhẹ
- chấm công
- lương
- giờ làm
- staffing

nên dùng kiểu hiển thị số nhất quán và dễ scan.

---

## 9. Rule cho layout

### 9.1. Mobile first

Tất cả màn hình mới phải ưu tiên:
- dùng tốt trên mobile trước
- sau đó mới mở rộng desktop

### 9.2. Padding chuẩn

Ưu tiên:
- `px-4`
- `py-4` hoặc `py-6`

Không để màn hình quá bí hoặc quá loãng.

### 9.3. Touch target

Target bấm tối thiểu:
- `44px`

Khuyến nghị:
- `48px`

### 9.4. Safe area

Với màn hình full mobile:
- phải tính vùng tai thỏ/home indicator nếu cần

---

## 10. Rule cho component pattern

### 10.1. AppShell

Màn hình mới nên bám AppShell hiện có.

Không tự tạo layout lạ nếu không có lý do mạnh.

### 10.2. Card pattern

Nếu là thông tin nghiệp vụ:
- ưu tiên card trắng
- bo mềm
- thông tin chia tầng rõ

### 10.3. Premium banner / feature card

Nếu cần làm vùng nổi bật:
- dùng gradient từ `#2F6FA8` sang `#001D3D`
- text trắng
- chỉ dùng rất tiết chế

Không biến mọi card thành gradient.

### 10.4. Badge

Badge phải:
- ngắn
- dễ quét
- màu đúng theo semantic

Không dùng badge quá sặc sỡ hoặc mỗi badge một màu vô tổ chức.

---

## 11. Rule cho vai trò và nghiệp vụ HRM

### 11.1. Màu role

Role có thể giữ mapping hiện có trong `theme.ts`, nhưng:
- chỉ dùng cho tag/phân loại
- không dùng làm màu chủ đạo của cả màn

### 11.2. Màu theo ca làm

Cho schedule:
- sáng: vàng ấm
- chiều: xanh mint
- tối: xanh brand
- đêm: navy đậm

Điều này hợp với nhận diện hiện tại và nên được giữ nhất quán.

### 11.3. Dữ liệu nhạy cảm

Các vùng payroll, duyệt, vi phạm:
- ưu tiên nền sạch
- thông tin rõ ràng
- màu ít nhưng đúng

Không gamify hoặc trang trí quá mức ở vùng nhạy cảm.

---

## 12. Những thứ không được làm

- không dùng tím làm màu brand chính
- không dùng nền trắng lạnh phủ toàn hệ thống
- không dùng quá nhiều gradient
- không dùng màu raw ngẫu nhiên ngoài palette
- không dùng đỏ và vàng tràn lan
- không làm giao diện enterprise xám nặng
- không làm dark mode giả sang nếu không có yêu cầu rõ
- không mỗi màn một style khác nhau

---

## 13. Rule riêng cho AI code

Khi AI code tạo màn hình mới, phải tuân thủ:

1. Dùng token màu từ `globals.css` hoặc `theme.ts`
2. Ưu tiên `primary blue + warm cream + white + navy`
3. Chỉ dùng `green/yellow/red` theo semantic
4. Mobile first
5. Card trắng, nền ấm, CTA xanh
6. Không tự bẻ style sang tím, neon, enterprise xám
7. Nếu không chắc, chọn:
- nền `#FFF8E8`
- card `#FFFFFF`
- heading `#001D3D`
- CTA `#2F6FA8`

---

## 14. Gợi ý mapping chuẩn để dùng nhanh

### 14.1. Quick mapping

- Page background: `#FFF8E8`
- Surface/card: `#FFFFFF`
- Heading: `#001D3D`
- Body text strong: `#1D3E61`
- Primary action: `#2F6FA8`
- Primary soft background: `#E6F0FA`
- Success: `#1E9E57`
- Success bg: `#DDF4EC`
- Warning: `#F6C85F`
- Warning bg: `#FFF8E8`
- Error: `#D9381E`
- Error bg: `#FEF2F2`

### 14.2. Premium gradient

Cho banner hoặc highlight card:
- từ `#2F6FA8`
- tới `#001D3D`

---

## 15. Ghi chú kỹ thuật cần sửa sau

Hiện có một giá trị màu có dấu hiệu sai cú pháp:
- `accent-100`: `#EFFBFAF`

Nên kiểm tra và sửa sớm tại:
- [src/lib/theme.ts](/mnt/c/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/theme.ts:28)
- [src/app/globals.css](/mnt/c/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/app/globals.css:18)

Khuyến nghị:
- đổi về một giá trị hợp lệ, gần logic palette hiện tại
- ví dụ một tone rất nhạt của mint, rồi cập nhật đồng bộ ở cả hai nơi

---

## 16. Kết luận

Từ thời điểm này, rule nhận diện thiết kế của Homies nên được hiểu như sau:

- `brand chính`: xanh Homies `#2F6FA8`
- `chiều sâu`: navy `#001D3D`
- `nền`: cream ấm `#FFF8E8`
- `thành công`: mint green `#1E9E57`
- `cảnh báo`: vanilla `#F6C85F`
- `lỗi`: đỏ `#D9381E`

Nếu một màn hình mới nhìn không ra tinh thần:
- ấm
- sạch
- thân thiện
- hiện đại
- premium vừa phải

thì coi như màn đó chưa đúng rule của Homies.
