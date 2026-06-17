# Theo dõi thử việc theo hướng bảng danh sách nhân sự

Ngày: `2026-06-08`
Trạng thái: `đã chốt hướng trong trao đổi, chờ người dùng rà lại bản viết`
Phạm vi: `màn Theo dõi thử việc` và `quy tắc nối với màn Thiết lập quy trình thử việc`

## 1. Mục tiêu

Chốt lại hướng thiết kế cho màn `Theo dõi thử việc` theo kiểu `bảng danh sách nhân sự làm trung tâm`, để bộ phận nhân sự nhìn vào là biết ngay:

- đang có bao nhiêu nhân sự mới
- ai cần xử lý trước
- đang nghẽn ở chặng nào
- phải bấm vào đâu để xử lý tiếp

Bản này dùng để khóa 6 quyết định chính:

- màn này là nơi `theo dõi từng nhân sự mới`, không phải nơi `thiết lập quy trình`
- bố cục trung tâm phải là `bảng danh sách nhân sự`
- không đưa `khối việc nóng` lên đứng trước bảng
- chỉ mở `chi tiết 1 nhân sự` khi người dùng chọn dòng
- toàn bộ luồng phải bám đúng `4 chặng thử việc` đã chốt
- cảnh báo phải `ngắn, rõ, bám theo từng nhân sự`

## 2. Người dùng chính

Người dùng chính của màn này là `nhân sự`.

Nhịp làm việc của họ ở màn này là:

1. mở màn để quét danh sách toàn bộ nhân sự mới đang thử việc
2. nhận ra ai đang cần xử lý ngay hoặc sắp tới hạn
3. bấm vào từng người để xem hành trình chi tiết
4. xử lý đúng việc còn thiếu ở đúng chặng
5. quay lại bảng để tiếp tục rà người khác

Khác với màn `Thiết lập quy trình thử việc`, màn này không dùng để dựng quy trình chuẩn từ đầu.

## 3. Phân tách với màn thiết lập quy trình thử việc

### 3.1. Màn Theo dõi thử việc

Màn này chỉ trả lời câu hỏi:

`Từng nhân sự mới đang đi đến đâu và đang vướng ở đâu?`

Màn này làm các việc sau:

- xem toàn bộ danh sách nhân sự mới
- lọc ai cần xử lý trước
- mở chi tiết hành trình của từng người
- xử lý chậm, thiếu, nghẽn ở từng chặng
- chốt kết quả thử việc cuối kỳ

Màn này không làm các việc sau:

- không sửa cấu trúc quy trình chuẩn
- không thêm bớt chặng nền
- không đổi logic điều kiện qua chặng
- không đổi nơi áp dụng quy trình chuẩn

### 3.2. Màn Thiết lập quy trình thử việc

Màn đó chỉ trả lời câu hỏi:

`Quy trình chuẩn của công ty được dựng như thế nào?`

Nếu màn `Theo dõi thử việc` phát hiện thiếu nền tảng, phải chỉ rõ thiếu gì và có đường đi thẳng sang `Thiết lập quy trình thử việc`.

## 4. Quyết định bố cục đã chốt

Hướng được chọn là:

`Phương án A: bảng danh sách nhân sự là vùng chính, chi tiết nhân sự chỉ mở khi chọn dòng.`

Đây là hướng phù hợp nhất vì:

- hợp với thói quen của nhân sự là vào tìm người trước
- giữ được góc nhìn toàn cảnh tốt hơn kiểu dồn việc nóng lên đầu màn
- ít ngộp hơn kiểu mở sẵn chi tiết cố định
- vẫn đủ chỗ cho cảnh báo, lọc nhanh và hành động xử lý

## 5. Cấu trúc toàn màn

Màn `Theo dõi thử việc` phải có 3 lớp nội dung rõ ràng:

### 5.1. Thanh tóm tắt ngắn ở đầu màn

Chỉ giữ các thông tin ngắn sau:

- tổng số nhân sự mới
- số người `cần xử lý ngay`
- số người `đang đúng tiến độ`
- nút sang `Thiết lập quy trình thử việc`

Quy tắc:

- không biến phần đầu màn thành trang tổng quan lần hai
- không nhồi thêm nhiều khối cảnh báo lớn
- phần đầu chỉ đủ để định hướng nhanh trước khi nhìn vào bảng

### 5.2. Bảng danh sách nhân sự ở giữa màn

Đây là vùng chính của toàn màn.

Mọi quyết định nhìn đầu tiên phải đi qua bảng này.

### 5.3. Khung chi tiết nhân sự

Khung này chỉ mở khi người dùng bấm vào một dòng trong bảng.

Có thể là:

- cột phải mở theo ngữ cảnh
- hoặc lớp mở trượt trên màn

Quy tắc:

- không mở sẵn từ đầu
- không chiếm vai trò trung tâm hơn bảng
- đóng lại xong phải quay về bảng rất nhanh

## 6. Cấu trúc bảng danh sách nhân sự

### 6.1. Các cột bắt buộc

Bảng trung tâm phải có 8 cột:

1. `Nhân sự`
2. `Cửa hàng`
3. `Vị trí`
4. `Chặng hiện tại`
5. `Mốc cần làm tiếp`
6. `Tình trạng`
7. `Thiếu gì`
8. `Thao tác`

### 6.2. Quy tắc nhìn trong bảng

- `Nhân sự` là cột đầu, đậm, dễ bấm
- `Tình trạng` chỉ dùng nhãn ngắn, không dùng câu dài
- `Thiếu gì` chỉ hiện `1 ý quan trọng nhất`
- `Thao tác` chỉ có `1 nút chính`

Ví dụ ở cột `Thiếu gì`:

- `Chưa chốt người kèm`
- `Chưa đủ tài liệu`
- `Chờ chốt kết quả`

Ví dụ ở cột `Thao tác`:

- `Mở chi tiết`
- `Xử lý ngay` nếu tình huống đang rất gấp

### 6.3. Bộ lọc và công cụ rà nhanh

Phía trên bảng phải có thanh lọc nhanh gồm:

- `Tất cả`
- `Cần xử lý ngay`
- `Sắp tới hạn`
- `Đang đúng tiến độ`
- `Chưa thể bắt đầu`

Phải có thêm 3 công cụ rà nhanh:

- tìm theo `tên nhân sự`
- lọc theo `chặng`
- lọc theo `cửa hàng`

Không nên nhồi nhiều nút trên đầu bảng.

Chỉ nên giữ tối đa 2 nút hành động mức bảng:

- `Xem người cần xử lý ngay`
- `Xuất danh sách` nếu thật sự cần cho vận hành

### 6.4. Quy tắc sắp thứ tự trong bảng

Thứ tự ưu tiên hiển thị phải là:

1. `Cần xử lý ngay`
2. `Sắp tới hạn`
3. `Chưa thể bắt đầu`
4. `Đang đúng tiến độ`
5. `Đã chốt kết quả`

Trong cùng một nhóm, tiếp tục ưu tiên:

1. người có hạn gần nhất
2. người mới vào gần nhất
3. người còn thiếu bước quan trọng nhất

## 7. Khung chi tiết nhân sự

Khi người dùng bấm vào một dòng, mở `khung chi tiết nhân sự` để xử lý đúng chỗ đang vướng.

### 7.1. Phần đầu khung chi tiết

Phải có:

- tên nhân sự
- cửa hàng
- vị trí
- ngày nhận việc
- chặng hiện tại
- tình trạng hiện tại
- nút `Đóng`

### 7.2. Thanh 4 chặng trong khung chi tiết

Phải bám đúng 4 chặng đã chốt:

1. `Chốt nhận việc và chuẩn bị vào làm`
2. `Ngày đầu nhận việc`
3. `Làm quen và kèm cặp`
4. `Đánh giá và chốt kết quả`

Quy tắc hiển thị:

- chặng đang diễn ra được làm nổi bật
- chặng đã xong có nhãn `Đã xong`
- chặng đang nghẽn có nhãn `Đang nghẽn`
- chỉ mở `1 chặng` tại một thời điểm
- không bung cả 4 chặng cùng lúc

### 7.3. Bảng việc trong chặng đang mở

Vùng chính của khung chi tiết phải là `bảng việc của chặng đang mở` với các cột:

- `Việc cần làm`
- `Người phụ trách`
- `Hạn hoàn tất`
- `Kết quả cần có`
- `Trạng thái`
- `Thao tác`

### 7.4. Ba khối ngắn dưới bảng việc

Dưới bảng có 3 khối ngắn:

- `Đang vướng gì`
- `Ghi chú gần nhất`
- `Lịch sử xử lý`

Các khối này chỉ dùng để hỗ trợ xử lý, không được nặng hơn bảng việc.

## 8. Luồng theo dõi theo 4 chặng

### 8.1. Chặng 1. Chốt nhận việc và chuẩn bị vào làm

Theo dõi các việc:

- đã chốt nhận việc chưa
- đã chốt ngày vào làm chưa
- đã gắn người kèm chưa
- đã gửi tài liệu và hướng dẫn cần có chưa

Nếu thiếu, hành động chính là:

- `Bổ sung ngay`

### 8.2. Chặng 2. Ngày đầu nhận việc

Theo dõi các việc:

- đã vào ca chưa
- đã phổ biến nội quy và cách làm việc chưa
- đã có công cụ, nhóm trao đổi, người hướng dẫn chưa
- đã ghi nhận kết quả ca đầu chưa

Nếu có vấn đề, hành động chính là:

- `Xử lý ngay`

### 8.3. Chặng 3. Làm quen và kèm cặp

Theo dõi các việc:

- các việc phải hoàn tất trong những ngày đầu
- kỹ năng hay tài liệu còn thiếu
- người kèm đã đánh giá chưa
- ai đang chậm hoặc đứng yên

Hành động chính là:

- `Nhắc xử lý`
- `Cập nhật tiến độ`

### 8.4. Chặng 4. Đánh giá và chốt kết quả

Theo dõi các việc:

- tổng hợp kết quả toàn hành trình
- nhận xét của người kèm và quản lý
- chốt đạt hay chưa đạt
- nếu chưa đạt thì ghi rõ lý do và hướng xử lý tiếp

Hành động chính là:

- `Chốt kết quả`

## 9. Trạng thái cảnh báo và trạng thái rỗng

### 9.1. Các trạng thái cần có

- `Cần xử lý ngay`
- `Sắp tới hạn`
- `Đang đúng tiến độ`
- `Chưa thể bắt đầu`
- `Đã chốt kết quả`

### 9.2. Quy tắc màu và cách báo

Chỉ dùng nhãn ngắn, dễ quét:

- đỏ nhạt: `Cần xử lý ngay`
- vàng nhạt: `Sắp tới hạn`
- xanh nhạt: `Đang đúng tiến độ`
- xám nhạt: `Chưa thể bắt đầu`
- nhãn hoàn tất rõ: `Đã chốt kết quả`

Không viết câu dài trong cột `Tình trạng`.

Câu dài phải để ở:

- cột `Thiếu gì`
- hoặc trong `khung chi tiết nhân sự`

### 9.3. Các trạng thái rỗng phải hỗ trợ

1. `Chưa có nhân sự nào`
- hiện lời dẫn ngắn
- gợi ý nơi thêm nhân sự mới

2. `Không có ai trong bộ lọc này`
- ví dụ không có ai ở nhóm `Cần xử lý ngay`
- hiện thông điệp nhẹ, không gây cảm giác lỗi

3. `Chưa thể theo dõi vì thiếu thiết lập`
- nói rõ đang thiếu gì
- có nút sang `Thiết lập quy trình thử việc`

### 9.4. Quy tắc nhắc việc

Mỗi dòng chỉ nên nhắc `1 ý chính`.

Ví dụ:

- `Chưa chốt người kèm`
- `Chờ xác nhận ca đầu`
- `Chưa có đánh giá cuối kỳ`

Nếu thiếu nhiều thứ, chỉ hiện lỗi quan trọng nhất và thêm kiểu:

- `Còn 2 việc chưa xong`

## 10. Bộ quy tắc thiết kế toàn màn

1. Màn này là nơi `theo dõi từng nhân sự mới`, không phải nơi `thiết lập quy trình`.
2. `Bảng danh sách nhân sự` là vùng chính, luôn chiếm trọng tâm.
3. Mọi cảnh báo phải bám theo `từng dòng nhân sự`, không bung thành nhiều khối lớn ở đầu màn.
4. Trên đầu màn chỉ giữ `tóm tắt ngắn`, không biến thành trang tổng quan lần hai.
5. Người dùng vào màn phải trả lời được ngay 3 câu:
- `Có bao nhiêu nhân sự mới?`
- `Ai cần xử lý trước?`
- `Bấm vào đâu để xử lý?`
6. Mỗi dòng trong bảng chỉ có `1 trạng thái chính`, `1 thiếu sót chính`, `1 hành động chính`.
7. `Khung chi tiết nhân sự` chỉ mở khi người dùng chọn dòng, không mở sẵn từ đầu.
8. Trong khung chi tiết, chỉ mở `1 chặng` tại một thời điểm.
9. Luồng theo dõi phải bám đúng `4 chặng` đã chốt.
10. Mỗi chặng chỉ hiện `việc liên quan tới chặng đó`, không trộn với chặng khác.
11. Nếu thiếu thiết lập nền, màn phải nói rõ `chưa thể bắt đầu vì thiếu gì` và có đường sang `Thiết lập quy trình thử việc`.
12. Bộ lọc phải giúp rà nhanh, không bắt người dùng học thao tác phức tạp.
13. Bảng phải ưu tiên `dễ quét`, rồi mới tới `đủ chi tiết`.
14. Hành động gấp phải nằm ở `cột thao tác` hoặc trong `khung chi tiết`, không rải khắp màn.
15. Không dùng quá nhiều thẻ rời. Màn này ưu tiên `bảng`, `nhãn trạng thái`, `khung chi tiết`.
16. Mục tiêu cao nhất của màn là:
`biết đúng người, biết đúng chỗ vướng, xử lý đúng việc tiếp theo`

## 11. Ảnh minh họa đã dựng

Ảnh so sánh bố cục đã dựng trong trao đổi nằm tại:

- `output/mockups/so-sanh-bo-cuc-theo-doi-thu-viec-bang-nhan-vien.png`

Ảnh này dùng để khóa lựa chọn `Phương án A` trước khi chuyển sang kế hoạch làm.

## 12. Những gì không đưa vào màn này

Để tránh màn bị ngộp, không đưa các nội dung sau lên vùng chính:

- không đưa toàn bộ logic thiết lập quy trình chuẩn vào đây
- không mở sẵn toàn bộ lịch sử dài
- không bung nhiều khối cảnh báo lớn ở đầu màn
- không cho mỗi dòng nhiều hơn một hành động chính
- không mở đồng thời chi tiết của nhiều nhân sự

## 13. Ảnh hưởng tới tài liệu cũ

Bản này không thay thế phần bố cục đã chốt của màn `Thiết lập quy trình thử việc` trong tài liệu:

- `2026-06-08-thiet-lap-quy-trinh-thu-viec-dang-the-va-quy-tac-thiet-ke-design.md`

Bản này bổ sung phần còn thiếu cho màn `Theo dõi thử việc`, để hai màn có ranh giới rõ:

- `Thiết lập` là nơi dựng quy trình chuẩn
- `Theo dõi` là nơi theo dõi từng nhân sự mới theo quy trình đó

## 14. Bước tiếp theo

Sau bản này, thứ tự nên là:

1. người dùng rà lại file đặc tả
2. nếu không còn chỉnh hướng, viết lại kế hoạch làm
3. triển khai màn `Theo dõi thử việc` theo hướng `bảng danh sách nhân sự làm trung tâm`
4. chỉ sau đó mới rà tối ưu thêm ở mức thao tác và trạng thái

## 15. Kết luận

Quyết định đã chốt là:

- dùng `Phương án A`
- `bảng danh sách nhân sự` là trung tâm
- `khung chi tiết` chỉ mở khi chọn người
- luồng phải bám đúng `4 chặng thử việc`
- cảnh báo phải `ngắn, rõ, bám theo từng nhân sự`
- mục tiêu là `ít rối, dễ quét, xử lý nhanh`

Đây là hướng phù hợp nhất với bộ phận `nhân sự`, vì nó cân bằng được hai nhu cầu quan trọng nhất:

- quét nhanh toàn bộ nhân sự mới
- đi sâu đúng một người khi cần xử lý
