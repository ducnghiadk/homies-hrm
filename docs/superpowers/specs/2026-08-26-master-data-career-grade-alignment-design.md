# Chuẩn hóa Vị trí & Cấp bậc Master Data theo mô hình Homies

**Ngày:** 2026-08-26  
**Trạng thái:** Chờ người dùng duyệt spec  
**Spec gốc:** `2026-08-25-kpi-homies-multiskill-career-grade-design.md`

## 1. Vấn đề hiện tại

Trang `Cài đặt hệ thống -> Danh mục Nhân sự -> Vị trí & Cấp bậc` đang hiển thị dữ liệu cũ theo thang `L1-L10` và tách `Pha chế`, `Thu ngân` thành chức danh riêng.

Giao diện này không khớp mô hình Homies đã duyệt:

`C1-PC/C1-TN -> C2 -> C3 -> C4 -> C5`

Trong mô hình chuẩn:

- `Position` là chức danh công việc.
- `CareerGrade` là cấp năng lực.
- `OperationalSkill` là kỹ năng/trạm.
- Pha chế và Thu ngân là kỹ năng, không phải hai chức danh vận hành độc lập.

## 2. Nguyên nhân gốc

Seed cho tenant mới đã chỉ còn ba chức danh vận hành:

1. Nhân viên cửa hàng.
2. Trưởng ca.
3. Quản lý cửa hàng.

Tuy nhiên `MasterDataAdapter.getPositions()` ưu tiên dữ liệu đã lưu trong localStorage hoặc bảng Supabase `chuc_vu`. Tenant hiện tại vẫn có danh mục cũ nên trang tiếp tục nhận các dòng `Pha chế`, `Thu ngân` và level `L1-L10`.

Phần render của trang vẫn dùng `position.level` để vẽ huy hiệu `Lx` và suy ra quyền quản lý. Vì vậy chỉ đổi seed hoặc đổi câu mô tả không thể sửa dữ liệu đang hiển thị.

## 3. Quyết định đã chốt

Người dùng chọn phương án A ngày 2026-08-26:

- C1-C5 chỉ áp dụng cho lộ trình vận hành cửa hàng.
- Chức danh CEO, Chủ thương hiệu, Quản lý vùng và HR vẫn được giữ.
- Khối quản lý không gắn `L1-L10` hoặc `C1-C5`.
- Pha chế và Thu ngân được quản lý dưới dạng kỹ năng/chứng nhận của Nhân viên cửa hàng.

## 4. Mô hình hiển thị đích

### 4.1 Khối quản lý

Các chức danh quản lý/văn phòng được hiển thị dưới nhóm `Khối quản lý`, ví dụ:

- Ban giám đốc.
- Chủ thương hiệu.
- Quản lý vùng.
- Quản trị HR.

Mỗi thẻ hiển thị:

- tên chức danh;
- phòng ban/phạm vi;
- quyền hoặc vai trò quản lý;
- lương cơ sở và loại lương;
- nhãn `Khối quản lý`.

Không hiển thị huy hiệu `L4`, `L5`, `L10` hoặc cấp C.

### 4.2 Khối vận hành cửa hàng

Danh mục chức danh chuẩn:

| Chức danh | Cấp năng lực liên quan | Nội dung hiển thị |
|---|---|---|
| Nhân viên cửa hàng | C1-PC, C1-TN, C2, C3 | `C1-PC/C1-TN -> C2 Đa năng -> C3 Senior` |
| Trưởng ca | C4 | `C4 - Trưởng ca` |
| Quản lý cửa hàng | C5 | `C5 - Quản lý cửa hàng` |

Thẻ chức danh không dùng huy hiệu `Lx`. Thay vào đó dùng nhãn `Lộ trình năng lực` hoặc cấp C tương ứng.

### 4.3 Kỹ năng vận hành

Pha chế và Thu ngân được hiển thị trong phần kỹ năng/chứng nhận:

- Pha chế (`barista`).
- Thu ngân (`cashier`).

Không cho tạo lại `Pha chế` hoặc `Thu ngân` như chức danh vận hành nếu tenant đang dùng bộ Homies chuẩn.

## 5. Tên và bố cục trang

Đổi tên tab từ:

`Vị trí & Cấp bậc`

thành:

`Vị trí công việc & Lộ trình năng lực`

Đổi tiêu đề khu vực từ:

`Vị trí Công việc & Cấp bậc Level`

thành:

`Vị trí công việc & Lộ trình năng lực Homies`

Trang chia thành hai khu vực:

1. `Vận hành cửa hàng`.
2. `Khối quản lý`.

Nếu phát hiện dữ liệu legacy, hiển thị một cảnh báo phía trên danh sách thay vì âm thầm thay đổi dữ liệu.

## 6. Flow chuẩn hóa dữ liệu cũ

### 6.1 Phát hiện

Hệ thống đánh dấu dữ liệu cần chuẩn hóa khi có một trong các dấu hiệu:

- chức danh tên `Pha chế` hoặc `Thu ngân`;
- nhiều chức danh vận hành cùng level 1 nhưng thực chất là kỹ năng;
- level ngoài mô hình trách nhiệm hiện tại được dùng để vẽ `L1-L10`;
- thiếu một trong ba chức danh vận hành chuẩn.

### 6.2 Cảnh báo

Giao diện hiển thị:

> Danh mục chức danh chưa khớp mô hình Homies  
> Phát hiện các chức danh/ký hiệu cấp bậc cũ. Hệ thống sẽ không tự xóa hoặc đổi nhân viên.  
> CTA: `Xem trước chuẩn hóa`

### 6.3 Xem trước

Bản xem trước phải cho biết:

- chức danh cũ nào sẽ được giữ;
- chức danh cũ nào sẽ gộp;
- số nhân viên đang tham chiếu từng chức danh;
- kỹ năng nào được đề xuất từ dữ liệu cũ;
- hồ sơ nào cần HR xác nhận;
- dữ liệu nào không thể tự chuyển.

### 6.4 Quy tắc chuyển đổi

- `Pha chế` -> chức danh `Nhân viên cửa hàng` + chứng nhận/kỹ năng Pha chế nếu có bằng chứng.
- `Thu ngân` -> chức danh `Nhân viên cửa hàng` + chứng nhận/kỹ năng Thu ngân nếu có bằng chứng.
- Có cả hai kỹ năng không tự động cấp C2; chỉ hiển thị `Đủ điều kiện xét C2` nếu chưa có quyết định.
- Hồ sơ thiếu bằng chứng chuyển sang `HR cần xác nhận`, không tự gán C1-PC/C1-TN.
- `Trưởng ca` giữ chức danh và liên kết cấp C4 nếu có placement/quyết định hợp lệ.
- `Quản lý cửa hàng` giữ chức danh và liên kết cấp C5 nếu có placement/quyết định hợp lệ.
- Chức danh khối quản lý được giữ nguyên và bỏ cách trình bày `Lx` trên UI.

### 6.5 Xác nhận ghi dữ liệu

Không ghi dữ liệu thật ngay khi mở trang.

Flow bắt buộc:

`Phát hiện -> Xem trước -> HR xác nhận hồ sơ mơ hồ -> Xác nhận phạm vi -> Ghi dữ liệu -> Kiểm tra lại`

Nếu Supabase từ chối hoặc có khóa ngoại, toàn bộ thao tác phải báo lỗi rõ ràng; không hiện thông báo thành công giả.

## 7. Bảo toàn dữ liệu

- Không xóa nhân viên.
- Không xóa lịch sử chức danh.
- Không sửa kết quả KPI đã khóa.
- Không tự đổi lương.
- Không tự tăng cấp.
- Không xóa chức danh cũ khi vẫn còn nhân viên tham chiếu và chưa hoàn thành mapping.
- Sau chuẩn hóa phải giữ bảng đối chiếu ID cũ -> ID mới để truy vết.

## 8. Hành vi thêm/sửa chức danh sau chuẩn hóa

Form chức danh chỉ cấu hình:

- tên chức danh;
- nhóm `Vận hành cửa hàng` hoặc `Khối quản lý`;
- phòng ban/phạm vi;
- quyền/vai trò;
- lương cơ sở và loại lương.

Form không dùng `level` như cấp năng lực nhân viên.

Nếu cần chọn cấp trách nhiệm để tương thích hệ thống cũ, trường này phải có nhãn `Cấp trách nhiệm của chức danh`, không hiển thị thành cấp nghề C1-C5.

Cấp C và kỹ năng của nhân viên được quản lý tại `KPI & Phát triển`, không chỉnh trực tiếp trong form chức danh.

## 9. Giải pháp kỹ thuật ở mức thiết kế

### 9.1 Adapter

- Thêm hàm phát hiện danh mục legacy.
- Thêm hàm tạo preview chuẩn hóa thuần dữ liệu để có thể test độc lập.
- Không tự chuẩn hóa bên trong `getPositions()`.
- Chỉ ghi sau khi người dùng xác nhận.
- Dùng guard khi xóa/gộp chức danh đang có nhân viên tham chiếu.

### 9.2 UI Master Data

- Bỏ render huy hiệu `L{position.level}`.
- Phân nhóm danh sách vận hành và quản lý.
- Hiển thị lộ trình C trên đúng ba chức danh vận hành.
- Hiển thị banner và drawer/modal xem trước chuẩn hóa.
- Chặn tạo chức danh Pha chế/Thu ngân riêng khi dùng preset Homies.

### 9.3 Career grade

- Tái sử dụng catalog `HOMIES_CAREER_GRADES` và migration service hiện có.
- Không tạo danh sách grade thứ hai trong trang Master Data.
- Việc gán grade cho nhân viên phải đi qua placement/chứng nhận/quyết định hiện có.

## 10. Trạng thái trống và lỗi

### Không có dữ liệu legacy

Hiển thị danh mục bình thường, không hiện banner chuẩn hóa.

### Có legacy nhưng chưa có nhân viên tham chiếu

Cho phép gộp sau preview và xác nhận.

### Có legacy đang được nhân viên sử dụng

Bắt buộc mapping nhân viên trước khi xóa/ẩn chức danh cũ.

### Không đủ bằng chứng xác định kỹ năng

Giữ nhân viên ở `Nhân viên cửa hàng`, grade/skill ở trạng thái cần HR xác nhận.

### Supabase lỗi

Giữ nguyên giao diện/dữ liệu trước thao tác và hiển thị nguyên nhân. Không cập nhật UI trước khi database xác nhận.

## 11. Đánh giá tác động 5D

| Khu vực | Ảnh hưởng | Mức độ | Giải thích |
|---|---|---|---|
| UX | Có | YELLOW | Người dùng thấy cấu trúc rõ hơn nhưng cần hướng dẫn chuẩn hóa một lần |
| UI | Có | YELLOW | Đổi tên tab, phân nhóm thẻ, bỏ L badge và thêm preview |
| FE/BE | Có | YELLOW | Thêm phát hiện/mapping và nối migration hiện có |
| Data | Có | RED | Có thể gộp chức danh legacy và cập nhật tham chiếu nhân viên sau xác nhận |
| Security | Không đổi | GREEN | Giữ quyền CEO/HR hiện tại; không mở quyền mới |

Stop rule Data RED đã được kích hoạt. Thay đổi cấu trúc dữ liệu đã được người dùng duyệt trong spec gốc ngày 2026-08-25; phương án xử lý khối quản lý được người dùng duyệt ngày 2026-08-26.

## 12. Tiêu chí nghiệm thu

- Trang không còn hiển thị `L1-L10` như cấp nghề.
- Khối quản lý không mang cấp C.
- Nhân viên cửa hàng hiển thị đúng C1-PC/C1-TN -> C2 -> C3.
- Trưởng ca hiển thị C4.
- Quản lý cửa hàng hiển thị C5.
- Pha chế/Thu ngân không còn được khuyến khích tạo như chức danh độc lập.
- Dữ liệu legacy được phát hiện từ localStorage và Supabase.
- Preview cho biết số nhân viên bị ảnh hưởng trước khi ghi.
- Không tự cấp C2 hoặc tự đổi lương.
- Không xóa chức danh đang được sử dụng nếu chưa mapping xong.
- F5 không làm danh mục legacy xuất hiện trở lại sau khi chuẩn hóa thành công.
- Tenant mới vẫn nhận đúng ba chức danh vận hành chuẩn.
- Các chức danh quản lý hiện có vẫn được giữ.
- Tests, ESLint, TypeScript, build và AI guard phù hợp đều được chạy trước khi hoàn thành.

## 13. Rollback

- Lưu preview và bảng đối chiếu trước khi ghi.
- Nếu ghi thất bại, giữ nguyên danh mục và tham chiếu nhân viên cũ.
- Nếu cần quay lại sau khi ghi nhưng chưa có quyết định mới, phục hồi mapping từ snapshot trước chuẩn hóa.
- Không rollback bằng cách xóa lịch sử KPI, chứng nhận kỹ năng hoặc quyết định cấp bậc.

## 14. Ngoài phạm vi pass này

- Không thiết kế lại toàn bộ trang Master Data.
- Không đổi công thức KPI.
- Không đổi điều kiện chuyển C1-C5.
- Không sửa lương hàng loạt.
- Không đổi quyền CEO/HR.
- Không xử lý các chức danh chuyên môn ngoài mô hình Homies nếu không liên quan dữ liệu đang hiển thị.

