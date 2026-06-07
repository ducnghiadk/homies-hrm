# Thiết lập quy trình thử việc dạng thẻ và quy tắc thiết kế

Ngày: `2026-06-08`
Trạng thái: `đã chốt hướng trong trao đổi, chờ người dùng rà lại bản viết`
Phạm vi: `màn thiết lập quy trình thử việc` và `quy tắc nối sang màn theo dõi thử việc`

## 1. Mục tiêu

Chốt lại hướng thiết kế cho màn `Thiết lập quy trình thử việc` theo dạng `thẻ ngang`, để người dùng không bị rối bởi nhiều khối mở cùng lúc và vẫn sửa nhanh được ngay trong từng bảng.

Bản này dùng để khóa 4 quyết định chính:

- màn thiết lập là nơi dựng `quy trình chuẩn`, không phải nơi theo dõi từng nhân sự
- bố cục phải đi theo `dải thẻ ngang`, không mở đồng thời nhiều khối song song
- trong từng thẻ, nội dung chính phải ưu tiên `dạng bảng`
- mọi chỗ còn thiếu phải có `thao tác ngay` và `đường đi rõ ràng`

## 2. Người dùng chính

Người dùng chính của màn này là `nhân sự`.

Luồng làm việc của họ gồm 2 nhịp:

1. Vào lần đầu để thiết lập khung thử việc:
- chốt thời gian thử việc
- chốt các chặng
- soạn việc cần làm theo từng chặng
- chốt điều kiện qua chặng
- gắn quy trình vào nơi áp dụng

2. Khi có nhân sự mới:
- không quay lại màn này để vận hành từng người
- chuyển sang màn `Theo dõi thử việc` để xem hành trình thực tế của từng nhân sự mới

## 3. Phân tách hai màn

### 3.1. Màn thiết lập quy trình thử việc

Màn này chỉ trả lời câu hỏi:

`Quy trình chuẩn của công ty được dựng như thế nào?`

Màn này làm các việc sau:

- chốt khung chung
- chốt bốn chặng thử việc
- soạn việc cần làm
- chốt điều kiện qua chặng
- chốt nơi áp dụng

Màn này không làm các việc sau:

- không gắn tiến độ của từng nhân sự mới
- không theo dõi ai đang chậm
- không ghi nhận vận hành hằng ngày
- không chốt kết quả thử việc cho từng người

### 3.2. Màn theo dõi thử việc

Màn này chỉ trả lời câu hỏi:

`Từng nhân sự mới đang đi đến đâu và đang mắc ở đâu?`

Màn này làm các việc sau:

- xem danh sách nhân sự mới đang thử việc
- lọc nhanh ai đang ở chặng nào
- mở hành trình của từng người
- xử lý chỗ chậm, thiếu, nghẽn
- chốt kết quả thử việc cuối kỳ

Màn này không làm các việc sau:

- không sửa cấu trúc quy trình gốc
- không thêm bớt chặng chuẩn
- không đổi logic nền của quy trình chuẩn

## 4. Khung bốn chặng đã chốt

Giai đoạn đầu chỉ làm trước 4 chặng để dễ vận hành:

1. `Chốt nhận việc và chuẩn bị vào làm`
2. `Ngày đầu nhận việc`
3. `Làm quen và kèm cặp trong thời gian đầu`
4. `Đánh giá và chốt kết quả thử việc`

Bốn chặng này phải xuất hiện nhất quán ở cả màn thiết lập và màn theo dõi.

## 5. Vì sao không dùng nhiều khối mở cùng lúc

Hướng cũ làm người dùng bị ngợp vì trên cùng một màn có quá nhiều phần bung ra đồng thời:

- thông tin quy trình
- các chặng
- việc cần làm
- điều kiện qua chặng
- nơi áp dụng
- cảnh báo
- lịch sử thay đổi

Cách đó làm người dùng khó trả lời ngay 3 câu hỏi cơ bản:

- Tôi đang ở phần nào?
- Tôi phải sửa gì trước?
- Chỗ còn thiếu nằm ở đâu?

Vì vậy, màn mới phải đổi sang hướng `một vùng làm việc chính tại một thời điểm`.

## 6. Hướng thiết kế đã chốt

Hướng được chọn là:

`Màn thiết lập dạng thẻ ngang, mỗi lần chỉ mở một thẻ, trong thẻ dùng bảng làm trung tâm, có cột thao tác và có đường đi tới chỗ thiếu.`

Đây là hướng cân bằng nhất vì:

- đỡ rối hơn kiểu nhiều khối mở song song
- vẫn cho phép sửa nhanh ngay tại dòng
- phù hợp với cách đọc của nhân sự và vận hành
- dễ mở rộng dần sang các thẻ còn lại mà không vỡ bố cục

## 7. Cấu trúc thẻ của màn thiết lập

Màn `Thiết lập quy trình thử việc` phải có dải thẻ ngang gồm 5 thẻ:

1. `Thông tin chung`
2. `Bốn chặng thử việc`
3. `Việc cần làm`
4. `Điều kiện qua chặng`
5. `Áp dụng quy trình`

Quy tắc hiển thị:

- chỉ mở `một thẻ` tại một thời điểm
- các thẻ còn lại vẫn hiện ở dải ngang để người dùng biết còn gì phía trước
- mỗi thẻ phải cho thấy `còn thiếu hay không`
- thẻ đang mở phải có vùng làm việc lớn, rõ và tập trung

## 8. Quy tắc thiết kế cho màn thiết lập

1. Màn này là nơi `thiết lập quy trình chuẩn`, không phải nơi theo dõi từng nhân sự mới.
2. Toàn màn chỉ có `một vùng làm việc chính` tại một thời điểm.
3. Các phần lớn phải tổ chức theo `dải thẻ ngang`, không mở đồng thời nhiều khối song song.
4. Mỗi thẻ chỉ phục vụ `một mục tiêu rõ ràng`.
5. Trong mỗi thẻ, nội dung chính phải ưu tiên `dạng bảng`, không ưu tiên thẻ rời.
6. Mỗi bảng phải có `cột thao tác`.
7. Dòng nào đã có dữ liệu thì hành động chính là `Sửa`.
8. Dòng nào còn thiếu dữ liệu thì hành động chính là `Thiết lập ngay`.
9. Phải có `nút thao tác nhanh` ở đầu mỗi thẻ để xử lý các việc hay dùng.
10. Phải có `nút đi tới chỗ thiếu` để người dùng không phải tự dò.
11. Các lỗi còn thiếu không bung thành nhiều khối riêng, mà gom thành `một danh sách ngắn ở cuối thẻ đang mở`.
12. Dải thẻ phía trên luôn phải cho biết `thẻ nào đang mở` và `thẻ nào còn thiếu`.
13. Màn phải phục vụ tốt cho 2 kiểu dùng:
- người vào lần đầu để thiết lập từ đầu
- người quay lại để sửa nhanh một phần
14. Không đưa dữ liệu vận hành của từng nhân sự vào màn này.
15. Nếu một nội dung chưa cần xử lý ngay, không mở rộng nó trong cùng màn hình.
16. Mọi cảnh báo đều phải đi kèm `đường đi cụ thể` tới nơi cần sửa.
17. Trật tự thao tác mặc định phải là:
- thông tin chung
- bốn chặng thử việc
- việc cần làm
- điều kiện qua chặng
- áp dụng quy trình
18. Mục tiêu cao nhất của màn này là:
`ít rối, dễ rà, sửa nhanh, biết ngay còn thiếu gì`

## 9. Quy tắc nội dung cho từng thẻ

### 9.1. Thẻ `Thông tin chung`

Thẻ này dùng để chốt nền tảng ban đầu.

Phải có các nội dung:

- thời gian thử việc
- mốc bắt đầu tính thử việc
- người theo dõi chính
- người phối hợp
- nguyên tắc chốt cuối kỳ
- nơi lưu ghi nhận cuối kỳ nếu có

Thẻ này phải có:

- bảng nền tảng với cột `Thao tác`
- các nút `Sửa nhanh thời gian`, `Sửa người theo dõi`, `Thiết lập nguyên tắc chốt`
- danh sách thiếu ở cuối thẻ nếu còn dòng chưa chốt

### 9.2. Thẻ `Bốn chặng thử việc`

Thẻ này dùng để chốt xương sống của quy trình.

Phải có các nội dung:

- tên chặng
- mục tiêu chặng
- người phụ trách chính
- mốc thời gian
- trạng thái hoàn tất của chặng

Thẻ này phải có:

- bảng chặng với cột `Thao tác`
- các nút `Thêm chặng`, `Đổi thứ tự`, `Ẩn chặng`, `Xem việc trong chặng`
- dòng nào chưa đủ dữ liệu phải hiện `Thiết lập ngay`

### 9.3. Thẻ `Việc cần làm`

Thẻ này dùng để soạn việc cụ thể theo từng chặng.

Phải có các nội dung:

- việc cần làm
- người làm chính
- kết quả cần có
- có bắt buộc hay không
- hạn hoàn tất
- trạng thái
- thao tác

Thẻ này phải có:

- vùng chọn chặng đang chỉnh
- bảng việc cần làm
- nút `Thêm việc mới`, `Nhân bản việc`, `Chuyển sang chặng khác`, `Đánh dấu bắt buộc`
- danh sách việc còn thiếu ở cuối thẻ

### 9.4. Thẻ `Điều kiện qua chặng`

Thẻ này dùng để chốt logic qua chặng.

Phải có các nội dung:

- điều kiện phải có
- kết quả hiện tại
- mức bắt buộc hay hỗ trợ
- người duyệt qua chặng nếu có
- thao tác

Thẻ này phải có:

- bảng điều kiện với cột `Thao tác`
- các nút `Sửa điều kiện`, `Chọn người duyệt`, `Bỏ điều kiện`
- dòng nào chưa có người duyệt hoặc chưa đủ điều kiện phải hiện rất rõ

### 9.5. Thẻ `Áp dụng quy trình`

Thẻ này dùng để gắn quy trình vào nơi sử dụng thật.

Phải có các nội dung:

- nhóm áp dụng
- cửa hàng
- vị trí
- ngày bắt đầu dùng
- trạng thái
- thao tác

Thẻ này phải có:

- bảng phạm vi áp dụng với cột `Thao tác`
- các nút `Thêm vị trí`, `Sửa phạm vi áp dụng`, `Ngừng áp dụng`
- danh sách những nơi còn thiếu phạm vi áp dụng ở cuối thẻ

## 10. Quy tắc thao tác nhanh

Màn thiết lập phải có 3 lớp thao tác:

### 10.1. Thao tác mức toàn màn

- `Xem chỗ còn thiếu`
- `Lưu bản nháp`
- `Đưa vào áp dụng`

### 10.2. Thao tác mức thẻ

Mỗi thẻ phải có nhóm thao tác nhanh riêng ở đầu thẻ, ví dụ:

- thẻ `Thông tin chung`: sửa nhanh thời gian, sửa người theo dõi
- thẻ `Việc cần làm`: thêm việc mới, nhân bản việc
- thẻ `Áp dụng quy trình`: thêm vị trí, sửa phạm vi áp dụng

### 10.3. Thao tác mức dòng

Trong mỗi bảng:

- dữ liệu đã có: `Sửa`
- dữ liệu còn thiếu: `Thiết lập ngay`
- tình huống đặc biệt: có thể có `Nhân bản`, `Xem việc`, `Bỏ điều kiện` nếu phù hợp

## 11. Quy tắc cảnh báo và danh sách thiếu

Cảnh báo không được là thông tin chết.

Mỗi cảnh báo phải trả lời đủ 3 ý:

- thiếu cái gì
- nó nằm ở thẻ nào
- bấm vào thì nên làm gì

Danh sách thiếu phải đặt trong `thẻ đang mở` hoặc cuối vùng làm việc chính.

Không tách thành nhiều khối cảnh báo rời vì sẽ kéo màn quay lại trạng thái rối như trước.

## 12. Trạng thái màn cần hỗ trợ

Màn này phải hỗ trợ ít nhất 3 trạng thái:

### 12.1. Lần đầu vào, chưa có gì

- hiện lời dẫn rõ
- cho chọn `Tạo từ đầu` hoặc `Dùng mẫu chuẩn`
- các bảng còn trống hoặc ở mức gợi ý

### 12.2. Đang làm dở

- có một phần đã có dữ liệu
- còn một số dòng hiện `Thiết lập ngay`
- có danh sách thiếu để tiếp tục xử lý

### 12.3. Gần hoàn tất

- đa số dữ liệu đã đủ
- chỉ còn vài cảnh báo nhỏ
- có thể `Đưa vào áp dụng` sau khi sửa nốt phần thiếu

## 13. Ảnh minh họa đã dựng

Các ảnh minh họa đã chốt trong trao đổi hiện nằm tại:

- `output/mockups/man-thiet-lap-dang-the-buoc.png`
- `output/mockups/the-thong-tin-chung-dang-mo.png`
- `output/mockups/the-ap-dung-quy-trinh-dang-mo.png`
- `output/mockups/man-theo-doi-thu-viec-chi-tiet.png`

Các ảnh này dùng để khóa hướng nhìn và bố cục trước khi chuyển sang kế hoạch làm.

## 14. Ảnh hưởng tới tài liệu cũ

Bản này không phủ nhận hướng tách hai màn trong tài liệu `2026-06-05-thiet-lap-quy-trinh-thu-viec-va-theo-doi-thu-viec-design.md`.

Bản này chỉ cập nhật và khóa lại phần sau:

- màn `Thiết lập quy trình thử việc` phải đi theo `dạng thẻ ngang`
- không dùng bố cục nhiều khối mở song song
- dùng bảng làm trung tâm
- thêm cơ chế thao tác nhanh và đi tới chỗ thiếu

Nếu sau này viết lại kế hoạch làm, cần coi bản `2026-06-08` là bản chốt mới cho phần bố cục của màn thiết lập.

## 15. Bước tiếp theo sau bản này

Bước tiếp theo nên đi đúng thứ tự sau:

1. chốt nốt quy tắc thiết kế cho các thẻ còn lại nếu cần minh họa thêm
2. chốt `quy tắc thiết kế` cho màn `Theo dõi thử việc`
3. từ hai bộ rule này, viết lại `bản đồ chức năng` của cả hai màn
4. sau khi bản đồ chức năng rõ, mới cập nhật hoặc viết lại `kế hoạch làm`

## 16. Kết luận

Quyết định đã chốt là:

- `Thiết lập quy trình thử việc` dùng bố cục `dạng thẻ ngang`
- mỗi lần chỉ mở `một thẻ`
- trong thẻ dùng `bảng` làm trung tâm
- mọi chỗ thiếu phải có `thao tác ngay` và `đường đi rõ ràng`

Đây là hướng phù hợp nhất với người dùng chính là `nhân sự`, nhất là trong bối cảnh họ cần vừa thiết lập lần đầu vừa có thể quay lại sửa rất nhanh mà không bị ngợp.

