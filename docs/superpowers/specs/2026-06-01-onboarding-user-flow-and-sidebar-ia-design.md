# Thiết kế IA và flow người dùng cho onboarding

Date: 2026-06-01
Status: Approved in chat

## Mục tiêu

Sắp lại flow onboarding theo đúng vai trò sử dụng để:

- giảm cảm giác rối khi tìm màn hình
- tách rõ luồng "tự xem việc của tôi" và luồng "vận hành / quản trị"
- không bắt mọi trang đều phải mang full sidebar
- làm cho HR / CEO / quản lý cửa hàng đi đúng vào màn họ cần

## Vấn đề hiện tại

Hiện tại cùng tên `Onboarding` nhưng đang mang 2 nghĩa khác nhau:

- với nhân viên mới: đây là hành trình cá nhân, xem hôm nay cần làm gì
- với HR / CEO / quản lý: đây phải là chỗ theo dõi, gán buddy, xử lý checklist, cấu hình

Hệ quả:

- HR / CEO có thể bấm `Onboarding` nhưng rơi vào màn self-service của nhân viên
- workspace vận hành thật bị giấu sâu và khó tìm
- sidebar đang xuất hiện dày ở nhiều chỗ, làm tăng tải nhận thức

## Quyết định thiết kế

### 1. Tổ chức theo vai trò sử dụng, không theo tên kỹ thuật

Thiết kế mới phải trả lời câu hỏi đúng với từng người:

- nhân viên mới: "Hôm nay tôi cần làm gì?"
- buddy / quản lý cửa hàng: "Tôi cần hỗ trợ ai, thiếu bước gì?"
- HR: "Ai sắp vào làm, ai chưa được gán, cấu hình đã đúng chưa?"
- CEO: "Tình hình onboarding toàn hệ thống đang ra sao?"

### 2. Tách rõ self-service và operations

`/onboarding` không còn là điểm vào chung cho mọi vai trò.

Thay vào đó:

- `employee` dùng `Onboarding của tôi`
- `hr_admin`, `ceo`, `store_manager` dùng nhóm `Nhân sự mới`

### 3. Sidebar chỉ dành cho trang hub / cấp 1

Không phải trang nào cũng cần full sidebar.

Quy tắc mới:

- trang hub cấp 1: hiện sidebar đầy đủ
- trang tác nghiệp sâu / detail: dùng shell gọn hơn
  - header
  - breadcrumb
  - nút quay lại
  - tab / subnav nhỏ nếu cần

Mục tiêu là người dùng đang ở khu nào thì chỉ thấy điều hướng cần cho khu đó.

## Cấu trúc điều hướng đề xuất

### Employee

Giữ menu gọn, chỉ thêm / đổi nhãn:

- `Onboarding của tôi`

Không hiển thị menu quản trị onboarding.

### HR admin / CEO / Store manager

Thêm nhóm điều hướng mới:

- `Nhân sự mới`

Bên trong có 3 mục:

- `Tổng quan onboarding`
- `Checklist vận hành`
- `Cấu hình onboarding`

### Buddy

Chưa cần menu riêng ở scope này.

Buddy làm việc qua:

- `Nhân sự mới > Checklist vận hành`
- hoặc card / task ở dashboard về sau nếu cần

## Flow theo từng vai trò

### 1. Nhân viên mới

Điểm vào:

- `Onboarding của tôi`

Mục tiêu:

- xem việc cá nhân
- biết hôm nay phải làm gì
- biết ai đang hỗ trợ

Thấy gì:

- chặng hiện tại
- việc cần làm hôm nay
- buddy là ai
- cần xác nhận nội quy gì
- checklist theo chặng
- mini quiz / tự đánh giá / gate nếu có

Không thấy:

- cấu hình
- danh sách người khác
- màn vận hành

### 2. Buddy / Quản lý cửa hàng

Điểm vào:

- `Nhân sự mới > Checklist vận hành`

Mục tiêu:

- biết ai sắp vào làm
- ai đang thiếu bước trước ngày đầu
- ai cần gán buddy / ca đầu / follow-up

Thấy gì:

- danh sách người sắp vào làm
- trạng thái `Block ngày đầu`, `Cần hoàn tất sớm`, `Sẵn sàng`
- badge unmatched nếu chưa map role
- detail để:
  - gán buddy
  - chọn ca đầu
  - xác nhận nội quy tại quán
  - đánh dấu nhóm chat / tool
  - ghi chú ca đầu
  - follow-up
  - xem timeline đánh giá

### 3. HR admin

Điểm vào chính:

- `Nhân sự mới > Tổng quan onboarding`

Mục tiêu:

- nhìn toàn cảnh
- phát hiện ngoại lệ
- vào đúng màn khi cần xử lý

Flow:

- vào `Tổng quan onboarding` để xem:
  - số người sắp vào làm
  - số người chưa match role
  - số người chưa có checklist
  - số người đang block ngày đầu
- nếu có lỗi cấu hình:
  - vào `Cấu hình onboarding`
- nếu cần xử lý từng người:
  - vào `Checklist vận hành`

### 4. CEO

Điểm vào chính:

- `Nhân sự mới > Tổng quan onboarding`

Mục tiêu:

- xem tình hình
- xem drill-down khi có vấn đề

Flow:

- mặc định xem dashboard / tổng quan
- khi cần mới drill vào `Checklist vận hành`
- có thể kiểm tra `Cấu hình onboarding`, nhưng không nên bị dẫn vào self-service của nhân viên

## Quy tắc hiển thị sidebar

### Hiện full sidebar

Áp dụng cho:

- trang hub cấp 1 như `Nhân sự`, `Nhân sự mới`, `Báo cáo`, `Cài đặt`

Lý do:

- đây là nơi người dùng chuyển khu vực làm việc
- cần thấy cây điều hướng rõ

### Không hiện full sidebar

Áp dụng cho:

- trang cá nhân kiểu `Onboarding của tôi`
- màn detail / xử lý sâu
- các màn cần tập trung vào 1 công việc cụ thể

Thay thế bằng:

- header rõ
- breadcrumb
- back button
- tab phụ nếu cần

## Đổi tên để giảm hiểu nhầm

### Nhân viên mới

- `Onboarding` -> `Onboarding của tôi`

### Nhóm quản trị / vận hành

- bỏ nhãn `Onboarding` chung chung
- dùng `Nhân sự mới`

Trong `Nhân sự mới`:

- `Tổng quan onboarding`
- `Checklist vận hành`
- `Cấu hình onboarding`

## Map với code hiện tại

### Route

- `/onboarding`
  - giữ làm màn self-service của nhân viên
  - đổi nhãn điều hướng thành `Onboarding của tôi`

- `/career-path/onboarding`
  - đổi vai trò điều hướng thành `Nhân sự mới > Checklist vận hành`

- `/career-path/settings`
  - phần onboarding role / template / unmatched được đưa vào `Nhân sự mới > Cấu hình onboarding`

### Sidebar

Trong `sidebar-config.ts`:

- với `employee`
  - chỉ thấy `Onboarding của tôi`

- với `hr_admin`, `ceo`, `store_manager`
  - bỏ `Onboarding` khỏi nhóm `Phát triển nhân viên`
  - thêm nhóm `Nhân sự mới`

### Shell

Trong `AppShell.tsx`:

- hỗ trợ 2 chế độ shell:
  - full sidebar shell cho trang hub
  - compact shell cho trang cá nhân / trang detail

## Phạm vi implementation tiếp theo

Pass code tiếp theo nên gồm:

1. cập nhật IA sidebar và nhãn route
2. thêm shell gọn cho một số trang
3. tạo hoặc đổi entry `Nhân sự mới`
4. giữ nguyên logic onboarding hiện có, chỉ đổi đường vào và cách trình bày flow

## Ngoài phạm vi

Chưa làm trong pass này:

- tách dashboard onboarding riêng hoàn toàn cho CEO
- tạo workspace buddy riêng
- làm lại toàn bộ kiến trúc menu toàn hệ thống

## Rủi ro

### 1. Người dùng cũ quen menu cũ

Giảm thiểu:

- đổi tên rõ ràng
- đặt nhóm mới ở vị trí dễ thấy

### 2. Một số route hiện thuộc `career-path` nhưng lại phục vụ HR ops

Giảm thiểu:

- trước mắt đổi điều hướng và shell
- chưa cần đổi URL ngay nếu muốn rollout nhẹ

### 3. Sidebar gọn quá có thể làm mất khả năng chuyển nhanh

Giảm thiểu:

- chỉ ẩn full sidebar ở trang detail / self-service
- giữ full sidebar ở hub cấp 1
