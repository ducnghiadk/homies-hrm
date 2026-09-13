# Blueprint Vận Hành HRM Cho Cửa Hàng

Ngày soạn: 2026-05-18

Mục tiêu tài liệu:
- Đề xuất một blueprint thực tế để web HRM này có thể đi vào vận hành.
- Tập trung vào mức “cửa hàng dùng được”, không đặt mục tiêu quá rộng ngay từ đầu.
- Viết theo hướng dễ hiểu, không kỹ thuật, để chủ cửa hàng, quản lý vận hành, HR và đội phát triển có thể cùng đọc.

Phạm vi blueprint:
- Mô hình vận hành cho 1 cửa hàng đầu tiên
- Điều kiện tối thiểu để go-live
- Các giai đoạn triển khai
- Quy trình cần chạy ổn trước
- Vai trò, trách nhiệm, dữ liệu, kiểm soát
- Tiêu chí đánh giá đã “dùng được thật” hay chưa

---

## 1. Kết luận ngắn

Để hệ thống này vận hành được ở cửa hàng, không cần làm hết mọi thứ ngay. Cần chốt một bản vận hành tối thiểu nhưng chắc.

Blueprint khuyến nghị là:

### Giai đoạn 1: Chạy chắc 4 nghiệp vụ sống còn

- Nhân sự
- Lịch làm
- Chấm công
- Nghỉ phép

### Giai đoạn 2: Mở payroll bán tự động

- Tính công
- Soát ngoại lệ
- Chốt kỳ
- Xuất bảng lương

### Giai đoạn 3: Mở rộng quản trị

- KPI
- Báo cáo quản trị
- Staffing tối ưu
- Career path, learning, gamification

Nếu làm đúng thứ tự này, cửa hàng có thể dùng được sớm hơn, đội ngũ cũng đỡ rơi vào tình trạng “nhiều tính năng nhưng chưa dám dùng thật”.

---

## 2. Mục tiêu vận hành thực tế

Khi nói “cửa hàng có thể dùng được”, nên hiểu rất cụ thể như sau:

### Mức 1: Dùng được hằng ngày

Nhân viên và quản lý có thể:
- Xem lịch làm đúng
- Check-in/check-out đúng
- Xin nghỉ và duyệt nghỉ đúng
- Biết ai đi làm, ai nghỉ, ai đi trễ

### Mức 2: Dùng được cuối tuần

Quản lý có thể:
- Xếp ca tuần mới
- Xử lý đổi ca, open shift
- Kiểm tra thiếu người
- Chốt công sơ bộ

### Mức 3: Dùng được cuối tháng

HR hoặc quản lý vận hành có thể:
- Đối chiếu công
- Xử lý ngoại lệ
- Tính lương
- Xuất phiếu lương đúng vai trò

### Mức 4: Dùng được lâu dài

Doanh nghiệp có thể:
- Tin dữ liệu trong hệ thống
- Không sợ lộ thông tin nhạy cảm
- Có nhật ký thay đổi
- Có quy trình rõ ai chịu trách nhiệm ở bước nào

---

## 3. Triết lý triển khai

Blueprint này đi theo 5 nguyên tắc:

### 1. Chắc trước, rộng sau

Không nên cố mở hết toàn bộ module cùng lúc. Một cửa hàng dùng thật cần độ tin cậy cao hơn số lượng màn hình.

### 2. Một nguồn dữ liệu, một trạng thái đúng

Lịch làm, chấm công, nghỉ phép, lương phải có “nguồn sự thật” duy nhất. Không để mỗi màn hình giữ một bản riêng.

### 3. Vai trò rõ ràng

Ai được xem gì, làm gì, duyệt gì phải rõ. Đặc biệt với lương, hồ sơ nhân viên và chỉnh công.

### 4. Mọi thao tác nhạy cảm đều phải có kiểm soát

Những hành động như duyệt nghỉ, sửa công, publish lịch, chốt lương phải có:
- xác nhận
- lý do
- người thực hiện
- thời điểm thực hiện

### 5. Đi từ 1 cửa hàng trước

Không nên triển khai đa cửa hàng ngay nếu 1 cửa hàng còn chưa ổn.

---

## 4. Blueprint mục tiêu cho phiên bản “Cửa hàng dùng được”

Đây là phiên bản mục tiêu đầu tiên nên hướng đến.

## 4.1 Vai trò tham gia

### Nhân viên

Được làm:
- Xem lịch cá nhân
- Check-in/check-out
- Xin nghỉ
- Gửi yêu cầu đổi ca hoặc nhận ca trống
- Xem phiếu lương của chính mình

Không được làm:
- Xem dữ liệu lương người khác
- Xem hồ sơ nhạy cảm người khác
- Sửa lịch đã publish

### Trưởng ca

Được làm:
- Theo dõi danh sách đi làm trong ca
- Xử lý tình huống thiếu người trong ngày
- Xác nhận một số ngoại lệ vận hành nếu doanh nghiệp cho phép

Không nên được làm mặc định:
- Xem toàn bộ lương
- Chốt payroll
- Sửa công lịch sử diện rộng

### Quản lý cửa hàng

Được làm:
- Xếp ca
- Publish lịch
- Duyệt nghỉ
- Xem chấm công cửa hàng
- Xử lý ngoại lệ công ở phạm vi cửa hàng
- Theo dõi chi phí nhân sự cửa hàng

Không nên được làm mặc định:
- Xem bảng lương toàn công ty
- Cấu hình hệ thống công ty

### HR/Admin

Được làm:
- Quản lý hồ sơ nhân viên
- Quản lý chính sách
- Soát công
- Chạy lương
- Phân quyền
- Quản trị cấu hình hệ thống

### CEO/Chủ doanh nghiệp

Được làm:
- Xem tổng quan
- Xem báo cáo cấp cao
- Phê duyệt các cấu hình hoặc quyết định quan trọng nếu doanh nghiệp yêu cầu

---

## 4.2 4 quy trình bắt buộc phải chạy ổn

## A. Quy trình nhân sự cơ bản

Mục tiêu:
- Mỗi nhân viên có đúng 1 hồ sơ
- Có đúng cửa hàng, vai trò, vị trí, trạng thái làm việc

Tối thiểu phải có:
- Mã nhân viên
- Họ tên
- Số điện thoại
- Email hoặc tài khoản đăng nhập
- Cửa hàng
- Chức danh
- Vai trò hệ thống
- Trạng thái làm việc
- Ngày bắt đầu làm

Kết quả mong muốn:
- Không có nhân viên “mồ côi dữ liệu”
- Payroll, lịch và chấm công đều dựa vào cùng một hồ sơ

## B. Quy trình lịch làm

Mục tiêu:
- Nhân viên biết rõ tuần tới làm ca nào
- Quản lý có thể xếp ca và publish lịch dứt điểm

Tối thiểu phải có:
- Tạo tuần lịch
- Xếp ca
- Cảnh báo xung đột cơ bản
- Publish lịch
- Nhân viên xem lịch
- Đổi ca/open shift ở mức tối thiểu

Điểm bắt buộc:
- Phải có trạng thái `nháp` và `đã publish`
- Chỉ lịch đã publish mới là lịch chính thức
- Mọi thay đổi sau publish phải ghi nhận

## C. Quy trình chấm công

Mục tiêu:
- Chấm công đúng người, đúng nơi, đúng ngày

Tối thiểu phải có:
- Check-in
- Check-out
- Gắn với lịch nếu có
- Ghi nhận trạng thái: đúng giờ, trễ, thiếu check-out, ngoại lệ
- Màn hình quản lý công theo ngày và theo người

Điểm bắt buộc:
- Nếu offline thì phải có hàng chờ đồng bộ rõ ràng
- Dữ liệu sau đồng bộ không được trùng, không được mất
- Mọi chỉnh sửa công phải có người sửa và lý do

## D. Quy trình nghỉ phép

Mục tiêu:
- Nhân viên gửi đơn đúng
- Quản lý duyệt đúng
- Lịch và công được cập nhật theo quyết định duyệt

Tối thiểu phải có:
- Gửi đơn nghỉ
- Duyệt hoặc từ chối
- Kiểm tra quota cơ bản
- Đồng bộ với lịch/chấm công

Điểm bắt buộc:
- Đơn nghỉ phải gắn đúng người đăng nhập
- Không được dùng dữ liệu người mẫu hay dữ liệu cố định
- Sau duyệt phải phản ánh vào vận hành

---

## 5. Blueprint dữ liệu tối thiểu

Để cửa hàng dùng được, dữ liệu phải được tổ chức theo các nhóm sau.

## 5.1 Dữ liệu gốc

- Cửa hàng
- Vị trí công việc
- Loại ca
- Người dùng
- Vai trò
- Quy tắc chấm công cơ bản
- Quota nghỉ phép cơ bản

## 5.2 Dữ liệu giao dịch hằng ngày

- Lịch làm
- Check-in/check-out
- Yêu cầu nghỉ
- Yêu cầu đổi ca
- Yêu cầu nhận ca trống

## 5.3 Dữ liệu chốt kỳ

- Bảng công
- Ngoại lệ công
- Dữ liệu lương
- Phiếu lương

## 5.4 Nhật ký thay đổi

Tối thiểu phải có log cho:
- Sửa lịch
- Publish lịch
- Duyệt nghỉ
- Sửa công
- Chạy lương
- Mở khóa hoặc chỉnh lại dữ liệu sau khi chốt

---

## 6. Kiến trúc vận hành đề xuất

Không nói về kỹ thuật, chỉ nói về cách hệ thống nên vận hành.

### Tầng 1: Hồ sơ chuẩn

Đây là tầng gốc. Nếu tầng này sai, các tầng sau đều sai.

Bao gồm:
- nhân viên
- cửa hàng
- vị trí
- vai trò
- ca làm

### Tầng 2: Vận hành tuần

Bao gồm:
- lịch làm
- đăng ký ca
- đổi ca
- open shift
- nghỉ phép

### Tầng 3: Vận hành ngày

Bao gồm:
- check-in/check-out
- công hôm nay
- danh sách nhân viên đang làm
- cảnh báo thiếu người

### Tầng 4: Chốt kỳ

Bao gồm:
- tổng hợp công
- xử lý ngoại lệ
- tính lương
- xuất phiếu lương

### Tầng 5: Quản trị và tối ưu

Bao gồm:
- KPI
- staffing
- báo cáo
- learning
- career path

Khuyến nghị:
- Chỉ nên mở rộng mạnh tầng 5 khi tầng 1 đến tầng 4 đã ổn.

---

## 7. Trạng thái vận hành cần có

Một hệ thống dùng thật phải có trạng thái rõ ràng, không chỉ có dữ liệu.

## 7.1 Với lịch làm

Cần có:
- Nháp
- Chờ duyệt, nếu doanh nghiệp cần
- Đã publish
- Đã khóa, nếu đã dùng làm cơ sở tính công

## 7.2 Với chấm công

Cần có:
- Ghi nhận mới
- Chờ đồng bộ
- Chờ rà soát
- Đã xác nhận
- Đã khóa kỳ công

## 7.3 Với nghỉ phép

Cần có:
- Nháp
- Chờ duyệt
- Đã duyệt
- Từ chối
- Đã hủy

## 7.4 Với payroll

Cần có:
- Nháp
- Đang rà soát
- Đã chốt
- Đã phát hành phiếu lương
- Mở lại có kiểm soát, nếu buộc phải sửa

---

## 8. Điều kiện tối thiểu trước khi go-live

Đây là danh sách “không đạt thì chưa nên cho cửa hàng dùng thật”.

## 8.1 Điều kiện bắt buộc

- Đăng nhập thật
- Mỗi người dùng có tài khoản thật
- Phân quyền thật
- Dữ liệu nhân viên thật
- Lịch làm lưu thật
- Chấm công lưu thật
- Nghỉ phép lưu thật
- Không còn hard-code user mẫu trong luồng core

## 8.2 Điều kiện rất nên có

- Nhật ký thay đổi
- Thông báo cơ bản
- Tìm kiếm nhân viên thật
- Lọc thật
- Có trang ngoại lệ công
- Có trang danh sách cần xử lý cho quản lý

## 8.3 Điều kiện với payroll

Nếu chưa đạt các điều kiện này thì chưa nên dùng payroll thật:
- Công đã được soát
- Có quy trình chốt kỳ
- Có phân quyền xem lương đúng
- Phiếu lương chỉ đúng người đúng quyền mới xem được

---

## 9. Lộ trình triển khai đề xuất

Blueprint này đề xuất 4 chặng.

## Chặng 1: Chuẩn hóa nền

Thời gian gợi ý:
- 2 đến 4 tuần đầu

Mục tiêu:
- Làm cho hệ thống biết chính xác ai đang dùng và đang thao tác trên dữ liệu nào

Việc phải làm:
- Kích hoạt auth thật
- Kích hoạt session thật
- Kích hoạt phân quyền thật
- Chuẩn hóa hồ sơ nhân viên
- Chuẩn hóa cửa hàng, ca làm, vị trí
- Dọn sạch luồng demo trong các nghiệp vụ core

Kết quả đầu ra:
- Mỗi người dùng có thể đăng nhập bằng tài khoản thật
- Mỗi vai trò nhìn thấy đúng phần của mình

## Chặng 2: Vận hành cửa hàng hằng ngày

Thời gian gợi ý:
- 3 đến 5 tuần tiếp theo

Mục tiêu:
- Cửa hàng dùng được lịch, công, nghỉ phép

Việc phải làm:
- Hoàn thiện luồng tạo và publish lịch
- Hoàn thiện check-in/check-out
- Hoàn thiện nghỉ phép
- Tạo hàng chờ xử lý ngoại lệ
- Làm dashboard vận hành cho quản lý cửa hàng

Kết quả đầu ra:
- Cửa hàng có thể dùng hằng ngày mà không cần quay ra Excel cho lịch và công

## Chặng 3: Chốt công và payroll

Thời gian gợi ý:
- 2 đến 4 tuần tiếp theo

Mục tiêu:
- Dùng dữ liệu hệ thống để hỗ trợ hoặc bán tự động hóa bảng lương

Việc phải làm:
- Trang rà soát công
- Quy trình khóa kỳ công
- Quy trình chạy lương
- Quy trình soát ngoại lệ
- Quyền xem phiếu lương

Kết quả đầu ra:
- Có thể dùng hệ thống như nguồn dữ liệu chính cho lương

## Chặng 4: Mở rộng tối ưu

Mục tiêu:
- Tăng hiệu quả vận hành và gắn kết nhân sự

Việc phải làm:
- KPI
- Staffing tối ưu
- Learning
- Career path
- Gamification

---

## 10. Mô hình rollout thực tế

Không nên bật toàn bộ công ty ngay.

## Bước 1: 1 cửa hàng pilot

Chọn 1 cửa hàng có:
- quản lý chịu phối hợp
- số lượng nhân sự vừa phải
- ca làm tương đối ổn định
- sẵn sàng phản hồi

Mục tiêu:
- Kiểm tra quy trình thật
- Phát hiện điểm nghẽn vận hành

## Bước 2: 1 chu kỳ đầy đủ

Pilot tối thiểu phải đi qua:
- 2 tuần xếp ca
- nhiều ngày chấm công
- ít nhất 1 đợt nghỉ phép
- 1 lần chốt công sơ bộ

Nếu có thể, đi qua luôn:
- 1 kỳ lương nhỏ hoặc song song với bảng lương hiện tại

## Bước 3: Chạy song song

Trong thời gian đầu:
- Hệ thống chạy song song với cách làm cũ
- Không bỏ ngay Excel hoặc bảng chấm công cũ nếu chưa đủ tin

Mục tiêu:
- So sánh số liệu
- Bắt lỗi
- Xây niềm tin cho quản lý

## Bước 4: Chuyển sang nguồn chính

Chỉ khi:
- Sai lệch rất thấp
- Quản lý thao tác ổn
- Dữ liệu không rơi rụng
- Quyền truy cập an toàn

thì mới chuyển hệ thống thành nguồn chính thức.

---

## 11. Dashboard tối thiểu mỗi vai trò nên có

## 11.1 Dashboard nhân viên

Nên có:
- Ca hôm nay
- Tình trạng check-in
- Lịch tuần này
- Số ngày phép còn lại
- Yêu cầu đang chờ
- Phiếu lương của tôi

## 11.2 Dashboard quản lý cửa hàng

Nên có:
- Hôm nay ai đi làm
- Ai chưa check-in
- Ai đi trễ
- Đơn nghỉ chờ duyệt
- Tuần tới còn ca chưa xếp
- Các ngoại lệ cần xử lý

## 11.3 Dashboard HR/Admin

Nên có:
- Nhân viên mới/chưa đủ hồ sơ
- Ngoại lệ công toàn hệ thống
- Kỳ lương sắp chốt
- Các quyền hoặc cấu hình nhạy cảm vừa thay đổi
- Các cửa hàng đang có rủi ro thiếu người

---

## 12. Chỉ số để biết hệ thống đã dùng được chưa

Không nên đánh giá bằng cảm giác. Nên có các chỉ số cụ thể.

## 12.1 Chỉ số vận hành hằng ngày

- Tỷ lệ check-in thành công
- Tỷ lệ check-out đầy đủ
- Tỷ lệ ca đã publish trước hạn
- Tỷ lệ đơn nghỉ được xử lý đúng thời gian

## 12.2 Chỉ số chất lượng dữ liệu

- Tỷ lệ nhân viên có hồ sơ đầy đủ
- Tỷ lệ bản ghi công bị lỗi
- Tỷ lệ lệch giữa lịch và công
- Tỷ lệ ngoại lệ cần sửa tay

## 12.3 Chỉ số niềm tin vận hành

- Quản lý còn phải quay lại Excel bao nhiêu phần trăm
- Mỗi tuần có bao nhiêu lỗi quyền truy cập
- Mỗi kỳ lương lệch bao nhiêu so với đối chiếu thủ công

## 12.4 Mốc đạt “dùng được”

Có thể coi là dùng được khi:
- 95 phần trăm check-in/check-out chạy ổn
- 100 phần trăm nhân viên pilot có hồ sơ chuẩn
- 100 phần trăm lịch tuần được publish trên hệ thống
- Đơn nghỉ không còn xử lý ngoài hệ thống
- Sai lệch công và lương ở mức rất thấp, có giải thích được

---

## 13. Những việc không nên làm ngay

Đây là phần rất quan trọng để tránh đi sai hướng.

Không nên ưu tiên trước:
- Gamification nâng cao
- Career path quá sâu
- Learning quá rộng
- Dashboard quá đẹp nhưng không có dữ liệu chuẩn
- Quá nhiều báo cáo nếu dữ liệu gốc chưa tin được

Lý do:
- Các phần này có giá trị, nhưng không giúp cửa hàng “dùng được thật” nếu lịch, công, nghỉ, lương còn chưa chắc.

---

## 14. Những rủi ro lớn cần khóa sớm

## 14.1 Rủi ro sai người, sai dữ liệu

Nếu user context không chắc:
- xin nghỉ có thể sai người
- công có thể sai người
- lương có thể sai người xem

Đây là rủi ro cấp 1.

## 14.2 Rủi ro lộ dữ liệu lương

Nếu phân quyền payroll chưa chặt:
- mất niềm tin nội bộ
- ảnh hưởng rất mạnh tới việc triển khai

## 14.3 Rủi ro quản lý không dám bỏ cách cũ

Nếu không có:
- trạng thái rõ
- số liệu rõ
- quy trình rõ

thì quản lý sẽ vẫn quay về Excel, Zalo, giấy note.

## 14.4 Rủi ro “sản phẩm rộng nhưng không chốt được quy trình”

Đây là rủi ro lớn nhất hiện nay.

---

## 15. Đề xuất blueprint chức năng theo thứ tự build

Nếu phải xếp thứ tự xây để đi vào vận hành, mình đề xuất như sau:

### Nhóm 1: Bắt buộc làm trước

- Đăng nhập thật
- Phân quyền thật
- Hồ sơ nhân viên thật
- Lịch làm thật
- Chấm công thật
- Nghỉ phép thật

### Nhóm 2: Bắt buộc ngay sau đó

- Publish/lock trạng thái
- Nhật ký thay đổi
- Ngoại lệ công
- Bảng điều hành cho quản lý cửa hàng
- Thông báo cơ bản

### Nhóm 3: Cần cho chốt kỳ

- Chốt công
- Soát công
- Tính lương
- Phiếu lương đúng quyền

### Nhóm 4: Mở rộng sau khi ổn

- KPI
- Staffing nâng cao
- Learning
- Career path
- Gamification

---

## 16. Blueprint tổ chức đội triển khai

Để đưa vào vận hành, không chỉ cần đội dev.

Nên có tối thiểu:

### 1. Product owner

Chịu trách nhiệm:
- chốt phạm vi
- chốt thứ tự ưu tiên
- quyết định thế nào là “đủ dùng”

### 2. Đại diện vận hành cửa hàng

Chịu trách nhiệm:
- xác nhận luồng lịch, công, nghỉ có thực tế không

### 3. Đại diện HR/Payroll

Chịu trách nhiệm:
- xác nhận dữ liệu hồ sơ, công, lương
- duyệt quy trình chốt kỳ

### 4. Đội kỹ thuật

Chịu trách nhiệm:
- biến demo thành hệ thống vận hành thật

### 5. Cửa hàng pilot

Chịu trách nhiệm:
- dùng thật
- phản hồi thật
- báo lỗi thật

---

## 17. Kịch bản thành công mong muốn

Sau khi triển khai đúng blueprint, trạng thái mong muốn là:

### Đối với nhân viên

- Mở app là thấy ngay ca hôm nay
- Check-in không mơ hồ
- Xin nghỉ không phải nhắn nhiều nơi
- Xem lương của mình rõ ràng

### Đối với quản lý cửa hàng

- Không phải tổng hợp lịch bằng tay
- Không phải theo dõi công bằng nhiều file
- Không bỏ sót đơn nghỉ
- Biết hôm nay đang thiếu người ở đâu

### Đối với HR/Admin

- Có một nơi chuẩn để quản lý nhân sự
- Có dữ liệu công sạch hơn
- Có thể chốt kỳ đỡ thủ công hơn
- Kiểm soát được ai xem gì, sửa gì

---

## 18. Kết luận cuối

Blueprint phù hợp nhất cho giai đoạn hiện tại không phải là “làm thêm thật nhiều”, mà là:

- chốt phạm vi vận hành tối thiểu
- làm chắc dữ liệu và quyền
- cho 1 cửa hàng dùng thật
- chạy song song để kiểm chứng
- sau đó mới mở rộng

Nếu đi đúng hướng, hệ thống này hoàn toàn có thể trở thành một HRM phù hợp cho chuỗi cửa hàng. Điểm mạnh rõ nhất là phần lịch, công và vận hành ca. Đây nên là trục chính để đưa sản phẩm vào thực tế.

Kết luận một câu:
- Muốn cửa hàng dùng được, hãy biến hệ thống thành một công cụ vận hành đáng tin trước khi biến nó thành một nền tảng quá nhiều tính năng.

