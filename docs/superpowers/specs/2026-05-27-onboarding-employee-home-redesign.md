# Onboarding Employee Home Redesign

Ngày: `2026-05-27`
Phạm vi: màn nhân viên `/onboarding`
Trạng thái: `approved-for-spec`

## 1. Mục tiêu

Thiết kế lại màn onboarding nhân viên để:
- dễ theo dõi hơn trong vận hành thật
- vẫn giữ cảm giác thân thiện cho nhân viên mới
- bám đúng rule brand Homies
- ưu tiên rõ việc cần làm thay vì chỉ hiển thị dữ liệu

Màn này không còn là màn “demo checklist”, mà là màn làm việc hàng ngày cho nhân viên đang onboarding.

## 2. Vấn đề của bản hiện tại

Các vấn đề chính:
- phần đầu trang loãng, nhiều khoảng trắng nhưng không tạo trọng tâm
- chưa nổi bật câu trả lời quan trọng nhất: `hôm nay tôi cần làm gì`
- timeline chặng nhỏ, khó quét nhanh
- card nội quy đang chiếm diện tích lớn dù không phải lúc nào cũng là việc ưu tiên số 1
- checklist item giống khối mô tả hơn là danh sách việc
- thông tin buddy/quản lý bị đẩy xuống cuối và chưa đủ nổi

Hệ quả:
- nhân viên mới dễ thấy dài và mơ hồ
- quản lý khó dùng ảnh chụp màn này để kiểm tra nhanh tiến độ
- cảm giác giao diện chưa đúng tinh thần `ấm ở nền, tin cậy ở màu brand, rõ ràng ở thông tin`

## 3. Hướng thiết kế đã chốt

Hướng chọn: `cân bằng cả hai`

Nghĩa là:
- đủ thân thiện để nhân viên mới không bị ngợp
- đủ rõ việc để dùng vận hành thật
- không làm kiểu enterprise khô
- không làm kiểu demo journey quá màu mè

Hướng cụ thể:
- lấy `task-first` làm lõi
- mượn `journey-first` ở phần timeline chặng, nhưng làm rất gọn
- không làm màn nhân viên giống màn quản lý

## 4. Nguyên tắc thiết kế bắt buộc

Áp dụng theo `DESIGN_RULE_HOMIES_FINAL.md`:

- nền chính dùng `#FFF8E8`
- card nền trắng
- điểm nhấn dùng `#2F6FA8` và `#001D3D`
- trạng thái hoàn tất dùng `#1E9E57`
- trạng thái chờ/cảnh báo nhẹ dùng `#F6C85F`
- không dùng viền đậm cho toàn bộ card
- không biến màn thành dark/premium giả
- phải mobile-first, dễ quét bằng mắt trong 3-5 giây

## 5. Thứ tự ưu tiên thông tin

Màn mới phải trả lời theo đúng thứ tự này:

1. Tôi đang ở chặng nào
2. Hôm nay tôi cần làm gì
3. Tôi còn bao nhiêu việc chưa đạt
4. Ai đang hỗ trợ tôi
5. Rule/nội quy liên quan hiện giờ là gì

Nếu block nào không phục vụ 5 câu này, block đó phải giảm ưu tiên hoặc đưa xuống dưới.

## 6. Cấu trúc màn hình mới

### 6.1. Khối 1: Hero ngắn và chắc

Nội dung:
- tên nhân viên
- vị trí + cửa hàng
- 1 dòng trạng thái lớn
- 3 chỉ số nhanh

Ba chỉ số nhanh:
- ngày bắt đầu
- buddy
- chặng hiện tại

Dòng trạng thái lớn phải là câu dễ hiểu, ví dụ:
- `Bạn đang ở chặng 3 ngày đầu`
- `Hôm nay cần hoàn tất ca đầu với buddy`
- `Đang chờ HR gửi nội quy đầy đủ`

Yêu cầu:
- giảm chiều cao khối đầu
- tăng độ nổi của trạng thái lớn
- không để phần đầu chỉ là avatar + vài text nhỏ

### 6.2. Khối 2: Ưu tiên hôm nay

Đây là block quan trọng nhất màn.

Nội dung gồm 3 ô:
- `Việc cần làm ngay`
- `Đang chờ ai`
- `Người hỗ trợ bạn`

Ví dụ:
- `Cần hoàn tất bàn giao quầy`
- `Đang chờ HR gửi nội quy đầy đủ`
- `Buddy: Nguyễn Thị Mai`

Nếu không có việc gấp:
- hiển thị thông điệp nhẹ, rõ
- ví dụ: `Hôm nay chưa có mục mới, bạn chỉ cần làm đúng ca và hoàn tất việc đang dở`

Mục tiêu:
- mở màn là biết phải làm gì
- giảm cảm giác “một trang báo cáo”

### 6.3. Khối 3: Tiến độ và chặng

Gồm 2 phần:
- thanh tiến độ tổng
- timeline chặng onboarding

Thanh tiến độ:
- nổi vừa phải, không quá to
- phải có số % và số mục đạt

Timeline chặng:
- đổi từ icon nhỏ thành step pills hoặc card step ngang
- mỗi step có:
  - tên chặng
  - trạng thái
  - số mục đạt / tổng

Quy ước màu:
- chặng hiện tại: xanh brand
- chặng hoàn tất: xanh lá nhạt
- chặng chưa tới: kem/xám nhạt

Yêu cầu:
- dễ quét
- bấm chuyển chặng rõ
- không quá nhỏ như bản hiện tại

### 6.4. Khối 4: Checklist chặng hiện tại

Mặc định chỉ hiện checklist của chặng hiện tại.

Mỗi item checklist chỉ giữ 4 lớp thông tin:
- tên việc
- tiêu chuẩn đạt
- ghi chú buddy/quản lý
- trạng thái

Nhóm trạng thái:
- `Đạt rồi`
- `Đang làm`
- `Cần kèm thêm`
- `Chưa làm`

Yêu cầu hiển thị:
- tên việc phải nổi nhất
- tiêu chuẩn đạt phải ngắn, đọc được trong 1 dòng hoặc 2 dòng
- ghi chú hiển thị như tín hiệu hỗ trợ, không chiếm spotlight
- card item phải giống danh sách việc hơn là biên bản

### 6.5. Khối 5: Hỗ trợ và chính sách

Gồm:
- nội quy nhận việc
- buddy + quản lý theo dõi
- ghi chú quản lý
- lịch sử ngắn nếu có

Nguyên tắc:
- đưa xuống sau checklist
- chỉ nâng lên cao nếu nội quy đang chờ nhân viên xác nhận

Nội quy là block quan trọng, nhưng không được luôn đứng trên phần `việc phải làm`.

## 7. Trạng thái hiển thị chính

Màn phải xử lý rõ các trạng thái sau:

### 7.1. Đang onboarding bình thường

Hiển thị:
- chặng hiện tại
- việc đang làm
- buddy hỗ trợ
- tiến độ tổng

### 7.2. Đang chờ HR

Hiển thị:
- banner hoặc ô cảnh báo nhẹ
- nêu rõ đang chờ gì
- ví dụ: `Đang chờ HR gửi nội quy đầy đủ`

Không để nhân viên tưởng là hệ thống bị thiếu dữ liệu.

### 7.3. Cần kèm thêm

Hiển thị:
- mục nào cần kèm thêm
- ghi chú ngắn của buddy/quản lý
- tránh màu đỏ gắt

### 7.4. Gần hoàn tất

Hiển thị:
- tiến độ cao
- còn bao nhiêu mục cuối
- tạo cảm giác sắp về đích

## 8. Thay đổi nội dung hiển thị

Các câu chữ nên chuyển sang giọng vận hành đơn giản:

Từ:
- dài
- thiên mô tả hệ thống

Sang:
- ngắn
- rõ chủ thể
- có tính hành động

Ví dụ:
- `HR chưa gán checklist cho tài khoản này...`
Thành:
- `Hiện chưa có checklist onboarding cho bạn. Vui lòng báo quản lý hoặc HR.`

- `Đang chờ HR kích hoạt nội quy đầy đủ`
Thành:
- `HR chưa gửi nội quy đầy đủ. Bạn chưa cần xác nhận lúc này.`

## 9. Phạm vi pass UI này

Pass redesign này chỉ tập trung:
- sắp xếp lại cấu trúc màn
- tăng thứ bậc nhìn
- chỉnh card, spacing, màu, trạng thái
- viết lại copy ngắn hơn

Không làm trong pass này:
- thay đổi rule nghiệp vụ onboarding
- thêm logic backend thật
- làm lịch sử xử lý chi tiết nhiều tầng
- thêm tính năng chat thật

## 10. Tác động code dự kiến

Các điểm sẽ bị ảnh hưởng:
- `src/app/onboarding/page.tsx`
- có thể tách thêm component con nếu cần để màn đỡ dài
- giữ nguyên service và data nếu không bắt buộc đổi

Ưu tiên:
- không đổi logic dữ liệu đang chạy
- chỉ đổi cách trình bày và thứ tự ưu tiên hiển thị

## 11. Tiêu chí hoàn thành

Màn mới được coi là đạt nếu:
- nhân viên mới mở màn là hiểu ngay hôm nay cần làm gì
- buddy/quản lý nhìn vào là biết chặng hiện tại và tình trạng chính
- hierarchy rõ hơn bản cũ
- bám đúng palette và tinh thần Homies
- dùng tốt trên mobile lẫn desktop

## 12. Khuyến nghị triển khai

Nên chia implementation thành 3 pass:

### Pass A
- làm lại hero
- làm khối ưu tiên hôm nay
- làm progress + timeline mới

### Pass B
- làm lại checklist item card
- tối ưu copy và trạng thái

### Pass C
- sắp lại block nội quy, buddy, ghi chú quản lý
- polish spacing, màu, responsive

## 13. Kết luận

Hướng redesign này không nhằm làm màn “đẹp hơn” đơn thuần.

Mục tiêu chính là:
- giúp nhân viên mới bớt mơ hồ
- giúp quản lý dễ theo dõi
- biến màn onboarding thành công cụ vận hành thật

Từ khóa chốt:
- `rõ việc`
- `ít áp lực`
- `ấm nhưng gọn`
- `brand Homies, không enterprise khô`
