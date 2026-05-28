# BAO_CAO_TIEN_DO_VA_UU_TIEN_HRM_PILOT

Ngày cập nhật: 2026-05-19

## Mục đích

File này dùng để:
- lưu lại những gì team đã làm được đến thời điểm hiện tại
- phân biệt rõ cái gì đã xong, cái gì đang dở
- đưa các việc làm sau nhưng chưa cấp bách về backlog tương lai
- giúp team tập trung vào các ưu tiên quan trọng hơn cho pilot

---

## 1. Tóm tắt rất ngắn

Hiện tại hệ thống đã đi được một đoạn khá tốt ở 4 mảng:
- đăng nhập demo
- nhân sự cơ bản
- lịch làm
- check-in online

Điểm mạnh là:
- web không còn chỉ là demo UI thuần
- nhiều luồng chính đã bắt đầu đi qua service layer
- quyền xem dữ liệu đã được siết tốt hơn trước

Điểm còn thiếu là:
- attendance cho manager chưa đúng nghiệp vụ hoàn toàn
- vẫn còn vài phần mock/demo chưa chuyển hẳn sang luồng pilot rõ ràng
- hệ thống chưa sẵn sàng go-live thật, nhưng đã tốt hơn nhiều để test pilot

---

## 2. Những gì đã làm xong

### 2.1. Đăng nhập và tài khoản demo

Đã làm:
- giữ lại cơ chế đăng nhập demo
- khôi phục và bảo toàn các tài khoản demo seed
- thêm lại danh sách account demo ở màn login để bấm chọn nhanh
- không cần gõ email thủ công như trước

Kết quả:
- demo thuận tiện hơn
- tránh lỗi localStorage làm “mất tài khoản”
- phù hợp cho test nội bộ và demo nhanh

### 2.2. Nền tảng nhân sự cơ bản

Đã làm:
- chuẩn hóa lại employee service theo hướng có data source rõ hơn
- danh sách nhân sự bám policy role/store tốt hơn
- chi tiết nhân sự không còn dễ bypass quyền như trước
- màn thêm nhân sự đã bớt giả lập, có lưu theo luồng pilot hiện tại

Kết quả:
- manager không còn nhìn lung tung toàn công ty như ban đầu
- luồng nhân sự bắt đầu usable hơn cho pilot

### 2.3. Lịch làm

Đã làm:
- tạo và dùng `ScheduleService`
- kéo nhiều màn schedule về cùng một data layer hơn trước
- làm xong cơ chế `draft / published`
- manager có thể làm lịch nháp
- manager có thể publish lịch
- employee chỉ thấy lịch đã publish
- lịch cá nhân của employee rõ hơn, ít hiểu nhầm hơn

Kết quả:
- đây là phần đã tiến xa nhất trong pilot
- đủ tốt để test luồng quản lý xếp ca và nhân viên xem lịch

### 2.4. Check-in / Check-out online

Đã làm:
- tạo `AttendanceService`
- check-in/check-out online đã đi qua service
- đồng bộ được dữ liệu live check-in vào lớp dữ liệu attendance hiện tại
- các màn attendance bắt đầu dùng chung service thay vì mỗi nơi đọc một kiểu

Kết quả:
- đặt được nền cho attendance pilot
- có thể dùng để tiếp tục hoàn thiện manager-side attendance

---

## 3. Những gì đang làm dở

### 3.1. Attendance cho manager

Trạng thái:
- đã làm được một phần
- chưa pass hoàn toàn về nghiệp vụ

Đã có:
- manager xem được `công hôm nay`
- manager xem được `công theo ngày`
- các màn này đã đọc dữ liệu qua `AttendanceService`
- đã bám `user.store_id`
- employee bị chặn ở manager screens

Vấn đề còn lại:
- hệ thống hiện chỉ hiển thị những ai đã có attendance record
- ai chưa có record có thể biến mất khỏi danh sách
- vì vậy số `vắng mặt` có thể bị sai

Hiểu đơn giản:
- hệ thống biết ai đã chấm công
- nhưng chưa suy ra đầy đủ ai đáng lẽ thuộc phạm vi theo dõi mà lại chưa chấm công

Đây là blocker nghiệp vụ hiện tại của nhánh attendance manager-side.

---

## 4. Những việc đã làm nhưng chưa cần ưu tiên tiếp ngay

Các việc dưới đây không phải bỏ hẳn.
Chúng nên được đưa về backlog tương lai, làm sau khi các ưu tiên pilot cốt lõi đã ổn.

### 4.1. Dọn kỹ thuật không chặn pilot

- truy nguyên và sửa log `ReferenceError: location is not defined` khi prerender
- thay `<img>` ở trang login bằng `next/image`
- dọn warning nhỏ, cleanup import thừa, polish lint sâu hơn

Lý do để sau:
- chưa chặn việc test pilot
- không tạo giá trị vận hành ngay lập tức

### 4.2. Mở rộng attendance ngoài scope pilot hiện tại

- offline sync sâu hơn
- attendance reports nâng cao
- calendar/by-store/device alerts/overtime/request flow hoàn chỉnh
- exception workflow đầy đủ cho quên check-out, sửa công, duyệt công

Lý do để sau:
- dễ loãng scope
- hiện chưa phải điểm nghẽn lớn nhất của pilot

### 4.3. Mở rộng nhân sự beyond pilot

- import/export thật sự mạnh
- offboarding chuẩn
- hồ sơ nhân sự nhiều trường sâu hơn
- giấy tờ, hợp đồng, hồ sơ BH, ngân hàng

Lý do để sau:
- cần nhưng chưa phải thứ quyết định pilot có test được hay không

### 4.4. Các module rộng khác

- KPI
- career path
- learning
- wellness
- gamification
- reports nâng cao
- payroll mở rộng

Lý do để sau:
- chưa phải xương sống của pilot store đầu tiên
- nếu đụng sớm sẽ phân tán lực code

---

## 5. Những ưu tiên nên làm ngay bây giờ

### Ưu tiên 1: Sửa đúng attendance manager-side

Mục tiêu:
- manager thấy đủ người trong scope store
- không chỉ thấy người đã có record
- ai chưa chấm công phải hiện đúng là `vắng` hoặc trạng thái phù hợp

Vì sao ưu tiên cao:
- đây là lỗi nghiệp vụ thật
- nếu số vắng sai thì manager sẽ mất niềm tin vào hệ thống

### Ưu tiên 2: Chốt lại định nghĩa “ai phải được tính attendance”

Cần quyết định rõ:
- attendance sẽ dựa trên toàn bộ nhân sự active của store
- hay chỉ dựa trên nhân sự có lịch làm trong ngày

Khuyến nghị hiện tại:
- pilot có thể đi theo bản đơn giản trước
- nhưng cần chốt rule rõ để AI code không làm sai hướng

### Ưu tiên 3: Kiểm thử chéo giữa schedule và attendance

Cần test:
- nhân viên có lịch đã publish
- check-in đúng người
- manager xem được danh sách công hợp lý
- trường hợp chưa check-in có được hiện đúng không

Lý do:
- schedule và attendance đang bắt đầu chạm nhau
- nếu không test chéo sớm sẽ dễ sai logic

### Ưu tiên 4: Chốt flow pilot thực dụng

Nên tập trung vào 4 flow:
- đăng nhập
- xem lịch
- check-in/check-out
- manager xem attendance

Lý do:
- đây là 4 flow người dùng cảm nhận rõ nhất
- đủ để test giá trị pilot trước

---

## 6. Đề xuất chuyển backlog

### Nhóm cần làm ngay

- hoàn thiện `attendance/today`
- hoàn thiện `attendance/by-date`
- chốt rule tính `vắng`
- test chéo `schedule -> check-in -> attendance`

### Nhóm giữ lại cho sprint sau

- cleanup build log `location is not defined`
- polish login image optimization
- offline attendance nâng cao
- attendance exception flow
- employee profile sâu hơn

### Nhóm giữ cho tương lai xa hơn

- payroll production-ready
- KPI/career/learning/wellness/gamification
- report nâng cao
- đa cửa hàng hoàn chỉnh
- tích hợp backend thật sâu hơn ngoài pilot scope

---

## 7. Kết luận

Chúng ta không đi lạc hướng.

Phần đã làm được là có giá trị:
- login demo tiện hơn
- employee data tốt hơn
- schedule mạnh lên rõ rệt
- check-in online đã có nền

Nhưng để pilot có ý nghĩa thực tế hơn, việc cần tập trung bây giờ không phải mở thêm module mới.
Việc cần nhất là chốt đúng attendance manager-side, đặc biệt là logic `vắng mặt`.

Nói ngắn gọn:
- lịch làm đã khá ổn để test
- check-in đã có nền
- attendance manager là mắt xích cần sửa tiếp ngay
- các việc khác nên đưa về backlog tương lai để tránh phân tán lực
