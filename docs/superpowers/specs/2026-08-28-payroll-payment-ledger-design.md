# Payroll Payment Ledger Design

## Mục tiêu

Tách dữ liệu xác nhận thanh toán lương ra khỏi `phieu_luong.ghi_chu`, giữ được lịch sử đầy đủ và bảo đảm thao tác thanh toán/hủy thanh toán không tạo trạng thái nửa chừng.

## Phạm vi

- Áp dụng cho thanh toán từng phiếu lương và hủy thanh toán từ màn hình payroll hiện tại.
- Hỗ trợ Supabase thật và chế độ mock/local hiện có.
- Không thay đổi công thức tính lương, luồng duyệt phiếu lương hoặc giao diện bảng lương ngoài thông báo lỗi/trạng thái cần thiết.
- Khi mở lại kỳ lương, trạng thái phiếu phải được đọc lại từ dữ liệu đã lưu thay vì mặc định về trạng thái ban đầu.

## Các phương án

1. **Ledger bất biến + RPC giao dịch (chọn):** lưu mọi lần thanh toán và hoàn tác bằng bản ghi mới; một RPC khóa phiếu lương, kiểm tra điều kiện, ghi ledger và cập nhật phiếu lương trong cùng giao dịch. Đây là phương án an toàn nhất cho tiền và audit.
2. **Hai lệnh client liên tiếp:** insert ledger rồi update phiếu lương. Dễ làm hơn nhưng có thể ghi ledger thành công mà trạng thái phiếu lương thất bại, hoặc ngược lại.
3. **API/server route riêng:** bảo vệ tốt nhưng thêm một lớp backend trong khi repo hiện đang dùng adapter Supabase trực tiếp, làm phạm vi pass lớn hơn cần thiết.

## Mô hình dữ liệu

Bảng mới `phieu_luong_thanh_toan`:

- `id`: UUID khóa chính.
- `to_chuc_id`, `ky_luong_id`, `phieu_luong_id`, `nhan_vien_id`: liên kết và giới hạn dữ liệu trong cùng tổ chức.
- `loai_giao_dich`: `thanh_toan` hoặc `hoan_tac`.
- `giao_dich_goc_id`: bắt buộc cho bản ghi hoàn tác và trỏ tới giao dịch thanh toán gốc.
- `so_tien`: số tiền giao dịch, lớn hơn 0.
- `phuong_thuc`: ngân hàng, tiền mặt hoặc ví điện tử.
- `ngan_hang`, `so_tai_khoan`, `chu_tai_khoan`: snapshot thông tin nhận tiền tại thời điểm thanh toán.
- `ghi_chu`, `anh_chung_tu`: thông tin vận hành và chứng từ.
- `nguoi_thuc_hien_id`, `ngay_tao`: người thao tác và thời điểm server ghi nhận.

Ledger chỉ cho phép thêm bản ghi. Không có luồng xóa hoặc sửa giao dịch đã ghi.

## Luồng nghiệp vụ

### Xác nhận thanh toán

1. Adapter gọi RPC với kỳ lương, nhân viên, số tiền, phương thức, ghi chú, chứng từ và snapshot ngân hàng; RPC tự tìm đúng phiếu lương theo cặp kỳ lương + nhân viên.
2. RPC khóa phiếu lương bằng `FOR UPDATE`.
3. RPC chỉ cho thanh toán khi phiếu đang ở trạng thái `Đã gửi phiếu lương` và chưa có giao dịch thanh toán đang hiệu lực.
4. RPC tạo bản ghi `thanh_toan`, cập nhật phiếu lương thành `Đã thanh toán`, đồng thời ghi `ngay_thanh_toan` và người thực hiện.
5. Nếu bất kỳ bước nào lỗi, toàn bộ giao dịch rollback.

### Hủy thanh toán

1. Adapter gọi RPC hủy theo kỳ lương + nhân viên.
2. RPC khóa phiếu lương và tìm giao dịch thanh toán hiệu lực gần nhất.
3. RPC tạo bản ghi `hoan_tac` trỏ về giao dịch gốc; không xóa giao dịch cũ.
4. RPC đưa phiếu lương về `Đã gửi phiếu lương` và xóa thông tin xác nhận thanh toán trên phiếu.
5. Không cho hoàn tác lần hai nếu giao dịch gốc đã có bản ghi hoàn tác.

## Mock/local

Mock dùng cùng interface adapter, lưu ledger trong `localStorage` với khóa riêng theo tổ chức/kỳ lương. Các thao tác mock cũng kiểm tra trùng thanh toán và hoàn tác để hành vi gần với Supabase thật.

Payroll tải trạng thái đã lưu theo kỳ lương sau khi danh sách nhân viên sẵn sàng. Dữ liệu này chỉ bổ sung trạng thái cho bảng tính hiện tại, không thay thế các giá trị lương do payroll engine tính.

## Quyền và lỗi

- Chỉ payroll admin được ghi hoặc hoàn tác giao dịch.
- Nhân viên chỉ được xem phiếu lương theo RLS hiện hành; không được xem ledger của người khác.
- Số tiền phải hữu hạn và lớn hơn 0.
- Phiếu lương, kỳ lương và nhân viên phải cùng tổ chức.
- UI chỉ cập nhật trạng thái sau khi adapter trả về thành công.
- Khi tải lại trang hoặc đổi kỳ lương, UI không được ghi đè trạng thái đã lưu bằng giá trị mặc định.
- Lỗi RPC được chuyển thành thông báo dễ hiểu, không hiển thị chi tiết SQL cho người dùng.

## Kiểm thử bắt buộc

- Thanh toán thành công tạo đúng một giao dịch và đổi trạng thái phiếu.
- Thanh toán lặp bị từ chối.
- Hủy thanh toán tạo giao dịch hoàn tác, giữ lại giao dịch gốc và đưa phiếu về trạng thái chờ.
- Hủy lần hai bị từ chối.
- Thanh toán thất bại không làm thay đổi trạng thái phiếu.
- Không cho ghi giao dịch với số tiền không hợp lệ hoặc phiếu không tồn tại.
