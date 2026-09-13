# Thiết kế thư viện mẫu KPI F&B và mục tiêu theo nhóm cửa hàng

Ngày duyệt: 2026-08-22
Trạng thái: Đã duyệt thiết kế, chưa lập kế hoạch triển khai
Phạm vi: Nâng cấp khu vực `/kpi/settings`

## 1. Mục tiêu

Chuyển màn hình cài đặt KPI hiện tại từ một công cụ yêu cầu người dùng tự nhập và tự cân trọng số thành một quy trình SaaS F&B có hướng dẫn.

Người dùng trụ sở phải có thể bắt đầu từ bộ KPI dựng sẵn theo chức danh F&B, dùng tiêu chí và trọng số chuẩn chung cho toàn chuỗi, đặt con số mục tiêu theo nhóm cửa hàng, tạo ngoại lệ có kiểm soát, xem trước phạm vi áp dụng và giữ nguyên cấu hình của các kỳ KPI đã mở.

Mục tiêu trải nghiệm là người mua nhìn thấy ngay những lựa chọn quen thuộc trong ngành, không phải bắt đầu từ một biểu mẫu trống.

## 2. Các quyết định đã duyệt

1. Chọn phương án B: quy trình thiết lập có hướng dẫn gồm 5 bước.
2. Trụ sở thiết lập và công bố toàn bộ chỉ tiêu.
3. Quản lý cửa hàng không được sửa cấu hình KPI.
4. Cửa hàng được tổ chức theo nhóm; trụ sở chỉ sửa riêng các trường hợp ngoại lệ.
5. Cùng một chức danh phải dùng cùng tiêu chí và trọng số trên toàn chuỗi.
6. Các nhóm cửa hàng chỉ được khác nhau về con số mục tiêu.
7. Ngoại lệ cửa hàng chỉ được thay đổi con số mục tiêu, không được thay tiêu chí, trọng số hoặc công thức.
8. Cấu hình đã công bố được đóng băng theo phiên bản và theo kỳ KPI.

## 3. Nguyên tắc sản phẩm

### 3.1. Mẫu có sẵn là điểm bắt đầu chính

Màn hình không mở đầu bằng thanh kéo trọng số. Người dùng chọn một bộ KPI phù hợp với chức danh trước, sau đó kiểm tra và tinh chỉnh nếu cần.

Tùy chọn tự tạo vẫn tồn tại nhưng được đặt trong chế độ nâng cao.

### 3.2. Tiêu chuẩn chung, mục tiêu linh hoạt

Tiêu chí, trọng số, đơn vị đo và nguyên tắc chấm thuộc bộ KPI theo chức danh. Các giá trị này thống nhất toàn chuỗi để bảo đảm so sánh công bằng.

Con số cần đạt được đặt theo nhóm cửa hàng để phản ánh khác biệt về vị trí, quy mô, lưu lượng khách hoặc giai đoạn vận hành.

### 3.3. Mọi thay đổi đều có phiên bản

Không sửa trực tiếp bộ KPI đã công bố. Khi cần thay đổi, hệ thống tạo bản nháp phiên bản tiếp theo. Kỳ KPI cũ tiếp tục sử dụng bản chụp đã được khóa.

### 3.4. Cấu hình nâng cao không cản trở người dùng phổ thông

Người dùng mặc định chỉ cần chọn mẫu, kiểm tra, nhập mục tiêu và công bố. Công thức chi tiết, ngưỡng điểm tùy chỉnh và tiêu chí tự tạo nằm trong khu vực nâng cao.

## 4. Luồng thiết lập 5 bước

`Chọn mẫu -> Tiêu chí -> Mục tiêu -> Ngoại lệ -> Công bố`

Thanh tiến trình luôn hiển thị bước hiện tại, trạng thái hợp lệ và các phần còn thiếu. Bản nháp tự động lưu trong toàn bộ quy trình.

## 5. Bước 1 - Thư viện mẫu KPI F&B

Phiên bản đầu cung cấp 6 bộ mẫu:

| Bộ mẫu | Trọng tâm |
| --- | --- |
| Barista/Pha chế | Chất lượng món, tốc độ, vệ sinh, bán kèm |
| Thu ngân | Chính xác đơn, bán kèm, dịch vụ, tiền mặt |
| Phục vụ | Trải nghiệm khách, tốc độ, vệ sinh, phối hợp |
| Bếp | Chất lượng, an toàn thực phẩm, tốc độ, hao hụt |
| Ca trưởng | Doanh thu ca, vận hành, nhân sự, sự cố |
| Quản lý cửa hàng | Doanh thu, chi phí, chất lượng, phát triển đội ngũ |

Mỗi thẻ mẫu hiển thị:

- chức danh phù hợp;
- số trụ và số tiêu chí;
- tỷ lệ tiêu chí có thể lấy dữ liệu tự động;
- các chỉ số nổi bật;
- trọng số mặc định;
- nhãn `Phổ biến`, `Khuyên dùng` hoặc `Dành cho quản lý`.

Hai hành động chính:

- `Xem chi tiết`: mở bản xem trước mà không thay đổi dữ liệu;
- `Dùng bộ mẫu này`: tạo bản nháp và chuyển sang bước 2.

Bản xem trước phải cho biết từng trụ, tiêu chí con, nguồn dữ liệu, cách chấm và ví dụ đạt điểm 1-5.

## 6. Bước 2 - Kiểm tra tiêu chí và trọng số

Màn hình trọng số hiện tại được giữ lại ở bước này nhưng dữ liệu đã được điền sẵn từ mẫu.

Phần đầu hiển thị:

- tên bộ KPI và chức danh áp dụng;
- phiên bản và trạng thái;
- số trụ, số tiêu chí và tỷ lệ tự động;
- phạm vi cửa hàng dự kiến.

Mỗi trụ hiển thị:

- tên và trọng số hiện tại;
- khoảng trọng số ngành được khuyến nghị;
- số tiêu chí thành phần;
- nhãn `Cốt lõi`, `Khuyên dùng` hoặc `Tùy chọn`;
- số tiêu chí tự động và số tiêu chí cần người chấm.

Mỗi tiêu chí phải có:

- tên và mô tả dễ hiểu;
- đơn vị đo như `%`, phút, VNĐ hoặc số lỗi;
- chiều đánh giá: càng cao càng tốt hoặc càng thấp càng tốt;
- nguồn dữ liệu;
- cách chấm và yêu cầu bằng chứng;
- trạng thái cốt lõi hoặc tùy chọn.

Các hành động hỗ trợ:

- thêm tiêu chí từ thư viện F&B;
- thay thế bằng tiêu chí cùng loại;
- tự cân bằng phần trọng số còn thiếu;
- khôi phục mẫu chuẩn;
- thêm tiêu chí riêng trong chế độ nâng cao.

Ở bước này chỉ xác định chấm nội dung gì và đo bằng cách nào. Con số mục tiêu được nhập ở bước 3.

## 7. Bước 3 - Mục tiêu theo nhóm cửa hàng

Trụ sở nhập mục tiêu trong một bảng chung, không phải mở từng cửa hàng.

Ví dụ:

| Tiêu chí | Toàn chuỗi | Nhóm A | Nhóm B | Nhóm C |
| --- | ---: | ---: | ---: | ---: |
| Tỷ lệ món đạt chuẩn | >= 95% | Dùng chung | Dùng chung | Dùng chung |
| Thời gian ra món | - | <= 4 phút | <= 5 phút | <= 6 phút |
| Tỷ lệ bán kèm | - | >= 18% | >= 12% | >= 8% |
| Đi làm đúng giờ | >= 98% | Dùng chung | Dùng chung | Dùng chung |

Ba loại mục tiêu:

1. Cố định toàn chuỗi: an toàn thực phẩm, vệ sinh, kỷ luật.
2. Khác theo nhóm: doanh thu, bán kèm, tốc độ, hao hụt.
3. Định tính: dùng cùng một hướng dẫn chấm trên toàn chuỗi.

Người dùng chỉ cần nhập con số mục tiêu chính. Hệ thống đề xuất các ngưỡng điểm 1-5 dựa trên đơn vị và chiều đánh giá. Chế độ nâng cao cho phép trụ sở sửa các ngưỡng đề xuất.

Màn hình hỗ trợ:

- sao chép mục tiêu giữa các nhóm;
- tăng hoặc giảm đồng loạt theo phần trăm;
- hiển thị rõ đơn vị và chiều đánh giá;
- so sánh với kỳ trước khi có dữ liệu;
- cảnh báo mục tiêu thiếu, bất thường hoặc ngược chiều.

Việc chuyển cửa hàng sang nhóm khác chỉ ảnh hưởng từ kỳ tiếp theo, trừ khi kỳ mới chưa được mở.

## 8. Bước 4 - Ngoại lệ từng cửa hàng

Ngoại lệ phục vụ trường hợp như cửa hàng mới, sửa chữa, thay đổi mặt bằng hoặc có giai đoạn vận hành đặc biệt.

Một ngoại lệ bắt buộc có:

- cửa hàng;
- tiêu chí;
- mục tiêu của nhóm;
- mục tiêu ngoại lệ;
- lý do;
- ngày bắt đầu và kết thúc;
- người chịu trách nhiệm theo dõi.

Ngoại lệ không được thay đổi tiêu chí, trọng số, đơn vị đo, chiều đánh giá hoặc công thức chấm.

Khi hết hạn, cửa hàng tự quay lại mục tiêu của nhóm. Hệ thống phải lưu lịch sử người tạo, người sửa, thời điểm và lý do.

## 9. Bước 5 - Xem trước và công bố

Màn hình tổng kết hiển thị:

- bộ KPI và chức danh;
- tổng số trụ, tiêu chí và trọng số;
- danh sách nhóm cùng số cửa hàng trong mỗi nhóm;
- bảng so sánh mục tiêu giữa các nhóm;
- danh sách ngoại lệ;
- tiêu chí tự động và tiêu chí phải chấm thủ công;
- ngày bắt đầu áp dụng;
- lỗi hoặc phần còn thiếu.

Người dùng có thể chọn một cửa hàng để xem chính xác nhân viên tại đó sẽ được chấm như thế nào.

Các hành động cuối:

- `Lưu bản nháp`;
- `Xem thử theo cửa hàng`;
- `Lên lịch áp dụng`;
- `Công bố ngay`.

Sau khi công bố, cấu hình được khóa. Thay đổi tiếp theo phải tạo phiên bản mới.

## 10. Quyền sử dụng

### Trụ sở

- tạo và chỉnh bản nháp;
- chọn mẫu;
- chỉnh tiêu chí và trọng số;
- quản lý nhóm cửa hàng;
- đặt mục tiêu và ngoại lệ;
- công bố hoặc lên lịch áp dụng;
- xem lịch sử phiên bản.

### Quản lý cửa hàng

- xem bộ KPI và mục tiêu của cửa hàng;
- theo dõi tiến độ;
- chấm các tiêu chí được giao;
- không được sửa tiêu chí, trọng số, mục tiêu hoặc ngoại lệ.

### Nhân viên

- xem tiêu chí, mục tiêu và kết quả thuộc phạm vi cá nhân;
- không có quyền thay đổi cấu hình.

## 11. Các khối dữ liệu cần tách rõ

1. `KPI Template`: mẫu F&B dựng sẵn.
2. `Role KPI Policy`: tiêu chí và trọng số chuẩn theo chức danh.
3. `Store Group`: nhóm cửa hàng và danh sách thành viên.
4. `Target Profile`: mục tiêu của từng nhóm cho từng tiêu chí.
5. `Store Target Override`: phần mục tiêu ngoại lệ có thời hạn.
6. `Policy Version`: phiên bản đã công bố hoặc bản nháp.
7. `Period Snapshot`: bản chụp cấu hình được dùng trong một kỳ KPI.

Các khối này phải độc lập để có thể thay đổi mục tiêu nhóm mà không làm thay đổi thư viện mẫu hoặc lịch sử kỳ cũ.

## 12. Điều kiện kiểm tra trước khi công bố

Hệ thống chặn công bố nếu:

- tổng trọng số không bằng 100%;
- thiếu tiêu chí, đơn vị đo, nguồn dữ liệu hoặc người chịu trách nhiệm chấm;
- một cửa hàng chưa thuộc nhóm nào hoặc thuộc nhiều nhóm trong cùng thời gian;
- mục tiêu bắt buộc chưa có giá trị;
- mục tiêu không đúng đơn vị hoặc ngược chiều đánh giá;
- ngoại lệ thiếu lý do, thời hạn hoặc người theo dõi;
- có hai phiên bản áp dụng cùng chức danh và cùng khoảng thời gian;
- tiêu chí tự động chưa xác định nguồn dữ liệu.

Cảnh báo không chặn được dùng cho các trường hợp mục tiêu có vẻ quá cao, quá thấp hoặc trọng số nằm ngoài khoảng khuyến nghị.

## 13. Xử lý lỗi và bảo vệ thao tác

- Bản nháp tự động lưu và hiển thị thời điểm lưu gần nhất.
- Thay bộ mẫu phải xác nhận vì có thể ghi đè nội dung đang chỉnh.
- Nếu lưu thất bại, dữ liệu người dùng vừa nhập vẫn được giữ trên màn hình và có nút thử lại.
- Nếu nguồn POS hoặc chấm công chưa sẵn sàng, hệ thống ghi rõ tiêu chí nào cần nhập hoặc chấm thủ công.
- Không cho thay đổi dữ liệu thuộc kỳ đã mở hoặc phiên bản đã công bố.
- Mọi thay đổi quan trọng phải có lịch sử người thực hiện và thời gian.

## 14. Kiểm thử bắt buộc

### Luật nghiệp vụ

Kiểm tra tiêu chí và trọng số theo chức danh giống nhau trên toàn chuỗi; nhóm chỉ thay đổi mục tiêu; ngoại lệ chỉ thay đổi mục tiêu và tự hết hạn; tổng trọng số bằng 100%; mỗi cửa hàng chỉ thuộc một nhóm trong cùng thời gian; phiên bản đã công bố không thể sửa; kỳ KPI giữ nguyên bản chụp khi có cấu hình mới.

### Luồng giao diện

Kiểm tra chọn mẫu tạo đúng bản nháp; xem trước không thay đổi dữ liệu; đi đủ 5 bước không mất dữ liệu; cảnh báo chỉ đúng vị trí; xem thử theo cửa hàng phản ánh đúng nhóm và ngoại lệ; giao diện dùng được trên desktop và mobile.

### Phân quyền

Kiểm tra trụ sở có quyền cấu hình và công bố; quản lý cửa hàng chỉ xem và chấm phần được giao; nhân viên chỉ xem phạm vi cá nhân; dữ liệu cửa hàng khác không bị lộ.

## 15. Phạm vi phiên bản đầu

Bao gồm:

- 6 bộ mẫu KPI F&B;
- quy trình 5 bước;
- thư viện tiêu chí;
- tiêu chí và trọng số theo chức danh;
- mục tiêu theo nhóm cửa hàng;
- ngoại lệ có thời hạn;
- xem trước, kiểm tra và công bố theo phiên bản;
- bản chụp cấu hình theo kỳ KPI.

Chưa bao gồm:

- gợi ý bằng AI;
- dữ liệu chuẩn ngành từ bên ngoài;
- tự động tối ưu mục tiêu dựa trên dự báo;
- chia sẻ mẫu giữa nhiều thương hiệu;
- kho mẫu cộng đồng.

## 16. Tiêu chí nghiệm thu thiết kế

Thiết kế đạt yêu cầu khi người dùng bắt đầu từ bộ KPI F&B mà không tự gõ tiêu chí; hiểu rõ tiêu chuẩn chung và mục tiêu; trụ sở cấu hình hàng loạt theo nhóm; ngoại lệ không phá vỡ tính so sánh; quản lý cửa hàng không thể sửa mục tiêu; kỳ đã mở không đổi theo phiên bản mới; và trụ sở xem được cấu hình chính xác của từng cửa hàng trước khi công bố.
