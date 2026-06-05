# Thiết kế luồng cấu hình onboarding thực tế cho admin và HR

## 1. Mục tiêu

Biến màn `Cấu hình onboarding` từ vùng cấu hình kỹ thuật thành workspace chuẩn bị onboarding mà HR nhìn vào là biết cần làm gì trước đợt nhân sự mới.

Kết quả mong muốn:

- HR hiểu trạng thái sẵn sàng trong 5 giây đầu
- lỗi chặn onboarding được đưa lên trước và có đường sửa ngay
- gán checklist cho từng nhóm onboarding trở thành việc chính của màn hình
- sửa nội dung checklist chỉ xuất hiện khi thật sự cần
- copy trên màn hình dùng ngôn ngữ vận hành dễ hiểu, không buộc HR phải hiểu model nội bộ

## 2. Người dùng chính và ngữ cảnh thật

Người dùng chính:

- HR
- admin nhân sự phụ trách chuẩn bị onboarding

Ngữ cảnh sử dụng chính:

- trước một đợt nhân sự mới vào làm, HR mở màn này để kiểm tra cấu hình đã sẵn sàng chưa
- khi có lỗi, HR cần biết lỗi nào đang chặn việc gán checklist cho nhân sự mới
- sau khi hệ thống đã sẵn sàng, HR chỉ cần rà nhanh nhóm onboarding nào đang dùng checklist nào
- chỉ một phần nhỏ phiên làm việc mới đi sâu vào sửa nội dung checklist

Thiên hướng thiết kế:

- tối ưu cho HR làm việc nhanh và chắc tay
- không lấy editor làm trung tâm mặc định
- không bắt người dùng bắt đầu từ `content library -> template -> editor`

## 3. Audit luồng hiện tại

Luồng hiện tại chưa khớp thực tế vì bắt đầu từ tài sản hệ thống thay vì việc HR cần hoàn tất.

Các vấn đề chính:

- thứ tự suy nghĩ của màn hình đang là `nội dung -> template -> editor`, trong khi thứ tự nghiệp vụ của HR là `đã sẵn sàng chưa -> còn lỗi gì -> nhóm nào đang dùng checklist nào`
- editor xuất hiện quá sớm, khiến người dùng tưởng rằng việc chính là sửa nội dung
- các khái niệm kỹ thuật như `library`, `journey rules`, `published`, `draft` lấn át ngôn ngữ vận hành
- người dùng phải tự nối nhiều vùng màn hình với nhau mới hiểu cấu hình nào đang ảnh hưởng nhân sự mới
- các công cụ phụ đang cạnh tranh chú ý với phần việc chính

Kết luận audit:

- màn này phải xoay trục sang `workspace chuẩn bị onboarding`
- luồng đúng phải là `fix blocker trước`, `gán checklist theo nhóm sau`, `sửa nội dung nếu cần` cuối cùng

## 4. Phạm vi

Trong phạm vi:

- tái cấu trúc IA và thứ tự ưu tiên trong màn admin settings onboarding
- chuẩn hóa copy theo ngôn ngữ HR/admin dễ hiểu
- định nghĩa rõ hành vi blocker-first, assign-second, edit-last
- định nghĩa wireframe một route với 3 bước chính
- giữ nguyên tinh thần dữ liệu hiện có: nhóm onboarding, checklist, draft, publish, lịch sử thay đổi

Ngoài phạm vi:

- đổi kiến trúc route toàn bộ module onboarding
- đổi model dữ liệu checklist, snapshot, publish runtime
- thiết kế lại editor chi tiết vượt quá nhu cầu của bước 3
- thêm năng lực backend hoàn toàn mới không phục vụ trực tiếp flow này

## 5. Phương án đã cân nhắc

### 5.1. Phương án A - workspace chuẩn bị onboarding trên một route

Đây là phương án được chọn.

Đặc điểm:

- một màn hình duy nhất
- nội dung được tổ chức theo việc HR cần làm
- 3 bước lớn, rõ ưu tiên
- editor nằm phía sau, không chiếm tiêu điểm ban đầu

Lý do chọn:

- dễ hiểu nhất cho HR
- vẫn giữ được khả năng rà nhanh toàn cục cho admin
- ít xáo trộn kiến trúc hơn so với tách route hoặc wizard hoàn toàn

### 5.2. Phương án B - dọn lại dashboard hiện tại nhưng giữ cấu trúc cũ

Không chọn vì chỉ sửa bề mặt. Người dùng vẫn phải tự nối `lỗi`, `gán checklist`, `sửa template` thành một luồng trong đầu.

### 5.3. Phương án C - tách thành 2 route hoặc wizard cứng

Không chọn vì nặng tay hơn mức cần thiết. Luồng này phục vụ cả chuẩn bị định kỳ lẫn xử lý nhanh lỗi nhỏ, nên tách route sẽ làm chậm các thao tác ngắn.

## 6. Nguyên tắc thiết kế phải khóa cứng

1. Trạng thái sẵn sàng phải đứng trên cùng.
2. Nếu còn blocker, hệ thống phải nhấn mạnh sửa blocker trước khi khuyến khích chỉnh nội dung.
3. Gán checklist theo nhóm onboarding là tác vụ chính của màn.
4. Editor không được là trải nghiệm mở màn mặc định.
5. Công cụ phụ phải nằm sau, không tranh chú ý với luồng chính.
6. Mọi copy phải đọc như ngôn ngữ vận hành HR, không như tên model kỹ thuật.

## 7. Luồng chính được chốt

Luồng chuẩn của HR trên màn này:

1. Mở màn và đọc trạng thái sẵn sàng.
2. Nếu có lỗi chặn, xử lý ngay từng lỗi.
3. Rà từng nhóm onboarding đang gán checklist nào.
4. Chỉ mở bước sửa nội dung checklist nếu cần thay đổi nội dung thật.
5. Kiểm tra bản nháp trước khi phát hành.
6. Phát hành khi validation đạt.

Ba flow thực tế cần hỗ trợ:

- `Flow A - chuẩn bị đợt onboarding mới`: vào màn, xem readiness, sửa blocker, rà gán checklist, lưu.
- `Flow B - chữa cháy nhanh`: vào màn, thấy blocker cụ thể, bấm `Sửa ngay`, xử lý xong rồi thoát.
- `Flow C - kiểm tra độ yên tâm`: vào màn, thấy trạng thái sẵn sàng, rà vài nhóm onboarding, không cần sửa gì.

## 8. Wireframe đã chốt

### 8.1. Thanh trên cùng

- nút quay lại
- tiêu đề trang
- `Lịch sử thay đổi`

### 8.2. Hàng tab

- giữ tab điều hướng hiện có nếu sản phẩm đang dùng
- tab không được lấn át luồng chính của màn hình

### 8.3. Header card

Nội dung bắt buộc:

- tiêu đề: `Cấu hình onboarding nhân sự mới`
- mô tả: `Làm theo 3 bước để nhân sự mới nhận đúng checklist trước ngày vào làm.`
- trạng thái sẵn sàng nổi bật
- nút chính: `Lưu thay đổi`

### 8.4. Bước 1 - kiểm tra lỗi cấu hình

Tiêu đề bước: `BƯỚC 1. KIỂM TRA LỖI CẤU HÌNH`

Hiển thị 3 card lỗi chính:

- `Nhân viên chưa vào đúng nhóm onboarding`
- `Chức danh đang bị gán 2 nhóm onboarding`
- `Nhóm onboarding chưa có checklist`

Mỗi card phải có:

- số lượng
- lý do dễ hiểu bằng ngôn ngữ vận hành
- CTA `Sửa ngay`

Rule:

- bước này luôn nằm trước phần chỉnh cấu hình khác
- nếu tất cả bằng 0, hiển thị trạng thái đã ổn thay vì để trống

### 8.5. Bước 2 - gán checklist cho từng nhóm onboarding

Tiêu đề bước: `BƯỚC 2. GÁN CHECKLIST CHO TỪNG NHÓM ONBOARDING`

Thành phần:

- ô tìm kiếm
- bộ lọc
- danh sách card theo từng nhóm onboarding

Mỗi card nhóm onboarding phải có:

- tên nhóm
- checklist đang dùng hoặc trạng thái chưa có
- hành động `Đổi checklist`
- hành động `Xem chức danh áp dụng`
- hành động `Gán checklist ngay` nếu nhóm chưa có checklist

Mục tiêu bước này:

- giúp HR rà nhanh nhóm nào đang dùng checklist nào
- cho phép sửa assignment mà không cần nhảy sang editor

### 8.6. Bước 3 - sửa nội dung checklist

Tiêu đề bước: `BƯỚC 3. SỬA NỘI DUNG CHECKLIST`

Rule bắt buộc:

- đóng mặc định khi mới vào màn
- chỉ mở khi người dùng chủ động muốn chỉnh nội dung
- không render editor chi tiết như phần trung tâm của màn hình ban đầu

Điểm vào bước này:

- nút `Mở danh sách checklist`

### 8.7. Hành vi với checklist đang published

Khi người dùng mở checklist đang dùng thật:

- hiển thị cảnh báo `Checklist này đang được dùng thật`
- không cho sửa trực tiếp bản published
- CTA chính là `Tạo bản nháp`

### 8.8. Panel editor bản nháp

Khi đã tạo hoặc mở bản nháp, panel chỉnh sửa cần có tối thiểu:

- `Tên checklist`
- `Số ngày onboarding`
- `Mô tả`
- danh sách stage và task
- `Lưu bản nháp`
- `Kiểm tra trước khi phát hành`

### 8.9. Panel kiểm tra trước khi phát hành

Panel này phải hiển thị:

- trạng thái đạt hoặc lỗi
- lỗi hoặc cảnh báo theo phần cần sửa
- CTA `Mở lại phần cần sửa`
- CTA `Phát hành bản nháp`

### 8.10. Công cụ phụ

Khối `Công cụ phụ` phải thu gọn mặc định và chứa:

- `Xem trước checklist`
- `Báo cáo sử dụng checklist`
- `Lịch sử thay đổi`

## 9. Hệ thống copy phải đổi

Các đổi tên bắt buộc:

- `Content Library` -> `Danh sách checklist mẫu`
- `Journey Rules` -> `Nhóm onboarding và checklist`
- `Published template` -> `Bản đang dùng`
- `Draft` -> `Bản nháp`
- `Preview` -> `Xem trước`
- `Audit log` -> `Lịch sử thay đổi`
- `Role thiếu checklist hợp lệ` -> `Nhóm onboarding chưa có checklist`
- `Nhân viên chưa khớp role` -> `Nhân viên chưa vào đúng nhóm onboarding`

Rule copy:

- business label luôn đi trước
- tên kỹ thuật chỉ nên giữ như metadata phụ nếu thật sự cần

## 10. Rule hành vi và ưu tiên

1. Nếu còn blocker ở bước 1, bước 3 không được trở thành điểm nhấn thị giác chính.
2. Khi nhóm onboarding chưa có checklist, CTA ưu tiên là `Gán checklist ngay`, không ép người dùng vào editor.
3. Khi người dùng chọn checklist đang published, hệ thống phải đẩy sang tạo draft thay vì sửa trực tiếp.
4. Validation publish phải xảy ra sau khi chỉnh draft, không chen lên trước bước gán checklist.
5. Công cụ phụ luôn đứng sau luồng chính và có thể thu gọn.

## 11. Hướng dẫn layout và khả dụng

- bỏ hoặc giảm mạnh panel phụ kiểu dashboard bên phải; nếu còn giữ thì chỉ nên là box nhỏ `Hôm nay cần làm gì`
- desktop ưu tiên đọc theo một cột nội dung chính rõ ràng
- mobile vẫn phải giữ thứ tự `readiness -> blocker -> assignment -> editor -> tools`
- tránh để người dùng phải cuộn qua editor lớn khi mục tiêu chỉ là rà cấu hình
- trạng thái, CTA, và tiêu đề bước phải đủ rõ để người dùng nhìn lướt cũng hiểu

## 12. Tiêu chí thành công

Thiết kế này được xem là đúng nếu:

- HR mở màn và biết ngay còn lỗi gì trong vài giây đầu
- người dùng hiểu `việc cần làm trước` mà không cần đọc hết toàn bộ màn
- phần lớn phiên làm việc dừng ở bước 1 và bước 2, không buộc mở editor
- việc sửa nội dung published luôn đi qua draft rõ ràng
- copy trên màn dễ hiểu với admin hoặc HR không quen thuật ngữ kỹ thuật

## 13. Ghi chú triển khai cho bước plan sau

- giữ nguyên wireframe đã chốt trong spec này
- không biến bước 3 thành layout mặc định khi triển khai UI
- nếu code hiện tại có rail phải hoặc dashboard nặng, ưu tiên thu nhỏ hoặc bỏ khỏi vùng tiêu điểm
- plan triển khai sau đó phải bám đúng thứ tự blocker-first, assign-second, edit-last