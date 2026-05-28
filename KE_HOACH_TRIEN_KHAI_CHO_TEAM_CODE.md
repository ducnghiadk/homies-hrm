# Kế Hoạch Triển Khai Cho Team Code

Ngày soạn: 2026-05-18

Mục tiêu tài liệu:
- Biến phần định hướng sản phẩm thành kế hoạch thực thi cho team phát triển.
- Trả lời rõ câu hỏi: "Bây giờ làm gì tiếp theo?"
- Giúp team code có thể bắt đầu làm ngay, không bị mơ hồ giữa demo, pilot và go-live.

Tài liệu này không bàn sâu về code cụ thể.
Tài liệu này tập trung vào:
- Chốt mục tiêu gần nhất
- Chia việc đúng thứ tự
- Xác định backlog ưu tiên
- Xác định đầu ra từng giai đoạn
- Tránh làm lan man

---

## 1. Kết luận trước khi bắt đầu

Hiện tại không nên hỏi theo kiểu:
- "Còn thiếu bao nhiêu tính năng nữa?"

Mà phải hỏi đúng hơn:
- "Ta đang làm cho mục tiêu nào tiếp theo?"

Với tình trạng hiện tại của hệ thống, mục tiêu hợp lý nhất cho team code là:

## Mục tiêu gần nhất

### Làm ra một bản pilot demo-operational cho 1 cửa hàng

Ý nghĩa của mục tiêu này:
- Không phải chỉ là demo giao diện
- Cũng chưa phải production full company
- Mà là một bản đủ thật để test quy trình với cửa hàng

Phiên bản này cần làm tốt 4 flow sống còn:
- Lịch làm
- Chấm công
- Nghỉ phép
- Hồ sơ nhân sự cơ bản

Payroll chưa cần go-live thật ngay.
Payroll nên để ở trạng thái:
- có luồng
- có số liệu mô phỏng hoặc bán thật
- dùng để đối chiếu nội bộ sau khi 4 flow core ổn

---

## 2. Quyết định chiến lược cho team

Team cần thống nhất 1 quyết định rất quan trọng:

### Không làm theo hướng "đụng đâu vá đó"

Thay vào đó, làm theo 3 lớp:

### Lớp 1: Chốt flow để test

Mục tiêu:
- Đảm bảo luồng người dùng hợp lý
- Quản lý và nhân viên hiểu cách dùng

### Lớp 2: Chốt dữ liệu và quyền cho flow đó

Mục tiêu:
- Flow đã test xong thì phải dùng dữ liệu đúng
- Đúng người, đúng quyền, đúng trạng thái

### Lớp 3: Harden để pilot

Mục tiêu:
- Không còn logic demo chen vào flow core
- Có thể giao cho cửa hàng dùng thật ở mức pilot

---

## 3. Kết quả cụ thể team cần đạt trong giai đoạn tiếp theo

Team nên nhắm tới một cột mốc rất cụ thể:

## Cột mốc: Pilot Ready v1

Định nghĩa:
- 1 cửa hàng có thể dùng lịch, chấm công, nghỉ phép trên hệ thống
- Tài khoản là tài khoản thật
- Dữ liệu là dữ liệu thật
- Có phân quyền đúng
- Quản lý cửa hàng có thể vận hành hằng ngày

Không bắt buộc ở cột mốc này:
- KPI full
- Career path full
- Learning full
- Gamification full
- Payroll full company

---

## 4. Team nên làm gì tiếp theo ngay bây giờ

Nếu bắt đầu từ hôm nay, thứ tự đúng là:

### Bước 1: Chốt phạm vi pilot

Phải chốt trong 1 buổi họp ngắn:
- Pilot cho 1 cửa hàng nào
- Ai là người dùng thật
- Những flow nào sẽ được test thật
- Những flow nào tạm chưa đưa vào pilot

Đầu ra bắt buộc:
- 1 danh sách scope rõ ràng

Ví dụ scope pilot hợp lý:
- Đăng nhập
- Hồ sơ nhân viên cơ bản
- Lịch tuần
- Publish lịch
- Check-in/check-out
- Xin nghỉ
- Duyệt nghỉ
- Xem công theo ngày

Tạm chưa đưa vào pilot:
- KPI nâng cao
- Payroll thật
- Career path
- Learning
- Gamification

### Bước 2: Chốt flow chuẩn của 4 nghiệp vụ core

Team product, vận hành và dev cần ngồi chốt:
- Flow lịch làm
- Flow chấm công
- Flow nghỉ phép
- Flow hồ sơ nhân sự

Không chốt flow thì team code sẽ rất dễ:
- làm nhiều màn hình
- nhưng không ra quy trình rõ

### Bước 3: Chuyển từ feature map sang backlog triển khai

Đây là bước quan trọng nhất.
Không nói "làm module lịch" chung chung nữa.
Phải tách thành task có thể giao cho dev.

### Bước 4: Chia workstream và giao owner

Mỗi nhánh việc phải có người chịu trách nhiệm chính.
Không nên để cả team cùng đụng một vùng mà không có owner.

### Bước 5: Bắt đầu Sprint 1 theo trục nền tảng + flow core

Sprint đầu tiên không nên làm thêm màn hình mới nếu những điểm sau chưa xong:
- auth thật
- user context thật
- dữ liệu core thật

---

## 5. Phạm vi pilot đề xuất cho team code

Đây là phạm vi mình khuyến nghị để team bắt đầu.

## 5.1 In scope

### A. Đăng nhập và tài khoản

- Đăng nhập thật
- Đăng xuất
- Phiên đăng nhập ổn định
- Gắn đúng user vào toàn bộ flow core

### B. Hồ sơ nhân sự cơ bản

- Danh sách nhân viên
- Chi tiết nhân viên
- Thêm nhân viên
- Cập nhật thông tin cơ bản
- Gắn cửa hàng, vai trò, vị trí

### C. Lịch làm

- Xem lịch cá nhân
- Quản lý xếp ca tuần
- Publish lịch
- Xem lịch theo cửa hàng
- Open shift hoặc swap ở mức tối thiểu nếu đủ thời gian

### D. Chấm công

- Check-in
- Check-out
- Trạng thái công hôm nay
- Danh sách công theo ngày
- Ngoại lệ cơ bản

### E. Nghỉ phép

- Gửi đơn
- Duyệt hoặc từ chối
- Đồng bộ tác động cơ bản vào vận hành

## 5.2 Out of scope tạm thời

- KPI nâng cao
- Learning
- Career path
- Wellness
- Gamification
- Báo cáo nâng cao
- Payroll go-live thật

Những phần này không xóa, chỉ chưa ưu tiên code hardening ở giai đoạn này.

---

## 6. Cách chia việc cho team code

Đề xuất chia theo workstream thay vì chia theo page lẻ.

## Workstream 1: Nền tảng xác thực và quyền

Mục tiêu:
- Mọi flow core đều dùng user thật, role thật

Đầu việc:
- Tích hợp auth thật
- Chuẩn hóa session
- Chặn route đúng
- Gắn user context vào app shell, dashboard và các flow core
- Xóa các hard-code user ở flow sống còn

Owner phù hợp:
- 1 dev fullstack hoặc backend-oriented frontend

Ưu tiên:
- Cao nhất

## Workstream 2: Dữ liệu nhân sự và dữ liệu gốc

Mục tiêu:
- Có nguồn dữ liệu thật cho nhân sự, cửa hàng, vị trí, ca làm

Đầu việc:
- Chuẩn hóa employee model dùng cho app
- Chuẩn hóa stores, positions, shifts
- CRUD cơ bản cho employee
- Seed dữ liệu pilot ban đầu

Owner phù hợp:
- 1 dev phụ trách data model + CRUD

Ưu tiên:
- Rất cao

## Workstream 3: Lịch làm

Mục tiêu:
- Quản lý cửa hàng xếp ca được, nhân viên xem được

Đầu việc:
- Danh sách tuần
- Xếp ca
- Lưu ca
- Publish lịch
- Hiển thị trạng thái draft/published
- Xem lịch cá nhân lấy từ dữ liệu thật

Owner phù hợp:
- 1 dev frontend chính + 1 dev hỗ trợ data

Ưu tiên:
- Rất cao

## Workstream 4: Chấm công

Mục tiêu:
- Check-in/check-out chạy được với dữ liệu thật

Đầu việc:
- Ghi nhận check-in/check-out
- Đồng bộ bản ghi công
- Trạng thái công hôm nay
- Danh sách công theo ngày cho quản lý
- Hàng chờ xử lý ngoại lệ cơ bản

Owner phù hợp:
- 1 dev frontend logic mạnh

Ưu tiên:
- Rất cao

## Workstream 5: Nghỉ phép

Mục tiêu:
- Nhân viên gửi đơn đúng, quản lý duyệt đúng

Đầu việc:
- Gửi đơn
- Duyệt/từ chối
- Danh sách đơn theo user thật
- Liên kết tối thiểu với lịch/chấm công

Owner phù hợp:
- 1 dev fullstack hoặc 1 dev kết hợp với workstream 2

Ưu tiên:
- Rất cao

## Workstream 6: Dashboard vận hành cho pilot

Mục tiêu:
- Người dùng vào là thấy được việc cần làm

Đầu việc:
- Dashboard nhân viên
- Dashboard quản lý cửa hàng
- Danh sách việc chờ xử lý

Owner phù hợp:
- 1 frontend dev

Ưu tiên:
- Cao, nhưng sau nền tảng

---

## 7. Backlog ưu tiên theo thứ tự làm

Đây là phần team có thể dùng để tạo task.

## Nhóm P0 - Bắt buộc làm ngay

### P0.1 Auth thật

Mục tiêu:
- Không dùng auth demo cho flow pilot nữa

Xong khi:
- User đăng nhập bằng tài khoản thật
- App nhớ phiên đúng
- Route core không mở bừa

### P0.2 User context thật

Mục tiêu:
- Mọi flow lấy đúng user đang đăng nhập

Xong khi:
- Không còn màn hình core dùng employee cứng
- Nghỉ phép, lịch, công, profile đều bám user thật

### P0.3 Dữ liệu nhân sự gốc thật

Mục tiêu:
- Có employee/store/position/shift thật cho pilot

Xong khi:
- Pilot store có dữ liệu đầy đủ
- Các flow core không phụ thuộc mock để chạy

### P0.4 Phân quyền thật cho flow pilot

Mục tiêu:
- Nhân viên, trưởng ca, quản lý cửa hàng nhìn đúng thứ mình cần

Xong khi:
- Nhân viên không xem được dữ liệu quản lý
- Quản lý có đúng quyền tác nghiệp

## Nhóm P1 - Bắt buộc để pilot chạy được

### P1.1 Lịch làm thật

Xong khi:
- Quản lý tạo/xếp/lưu lịch tuần
- Có trạng thái nháp và đã publish
- Nhân viên xem đúng lịch đã publish

### P1.2 Chấm công thật

Xong khi:
- Nhân viên check-in/check-out thành công
- Quản lý xem được công hôm nay
- Có trạng thái lỗi cơ bản để xử lý

### P1.3 Nghỉ phép thật

Xong khi:
- Nhân viên gửi đơn đúng
- Quản lý duyệt được
- Danh sách đơn theo đúng vai trò

### P1.4 Hồ sơ nhân sự cơ bản thật

Xong khi:
- Quản lý hoặc HR xem được hồ sơ nhân viên pilot
- Có thể sửa thông tin cơ bản

## Nhóm P2 - Bắt buộc để pilot vận hành mượt

### P2.1 Dashboard quản lý cửa hàng

Xong khi thấy được:
- Ai đi làm hôm nay
- Ai chưa check-in
- Đơn nghỉ chờ duyệt
- Tuần sau còn ca nào chưa publish

### P2.2 Nhật ký thay đổi cơ bản

Xong khi:
- Có log tối thiểu cho lịch, nghỉ phép, công

### P2.3 Ngoại lệ công

Xong khi:
- Quản lý có thể thấy và xử lý các case thiếu check-out, sai giờ, chưa rõ trạng thái

## Nhóm P3 - Làm sau pilot hoặc song song nhẹ

- Payroll đối chiếu
- KPI review
- Staffing nâng cao
- Báo cáo nâng cao

---

## 8. Kế hoạch 6 tuần đề xuất cho team

Đây là kế hoạch thực tế, gọn, để team code bám theo.

## Tuần 1 - Chốt nền và scope

Mục tiêu:
- Chốt đúng cái cần làm

Đầu ra:
- Scope pilot
- Danh sách user pilot
- Store pilot
- Workstream owner
- Danh sách backlog P0, P1

Việc chính:
- Họp chốt phạm vi
- Rà lại flow core
- Tạo backlog
- Chốt data mẫu pilot thật

## Tuần 2 - Auth, user context, quyền

Mục tiêu:
- App biết đúng ai đang dùng

Đầu ra:
- Đăng nhập thật
- User context thật
- Route protection cơ bản
- Role gating cho flow pilot

## Tuần 3 - Dữ liệu nhân sự + lịch làm

Mục tiêu:
- Bắt đầu dùng dữ liệu thật cho pilot

Đầu ra:
- CRUD nhân sự cơ bản
- Stores/positions/shifts thật
- Xếp ca tuần lưu thật

## Tuần 4 - Publish lịch + chấm công

Mục tiêu:
- Cửa hàng bắt đầu chạy vận hành hằng ngày

Đầu ra:
- Publish lịch
- Nhân viên xem lịch đúng
- Check-in/check-out chạy được
- Quản lý xem công hôm nay

## Tuần 5 - Nghỉ phép + ngoại lệ + dashboard quản lý

Mục tiêu:
- Quản lý xử lý tác vụ hằng ngày trong app

Đầu ra:
- Gửi và duyệt nghỉ
- Danh sách ngoại lệ công cơ bản
- Dashboard quản lý cửa hàng

## Tuần 6 - UAT + pilot nội bộ

Mục tiêu:
- Test bằng người dùng thật trước khi đưa vào vận hành pilot

Đầu ra:
- Test theo vai trò
- Sửa lỗi blocker
- Chốt checklist pilot

---

## 9. Cách chuyển thành task cho dev

Khi đưa cho team code, không nên tạo task kiểu:
- "Làm module lịch"
- "Làm phần nghỉ phép"

Phải tách thành task có thể giao được.

Ví dụ đúng:

### Epic: Auth & Access

Task:
- Tích hợp đăng nhập thật
- Lưu session
- Guard route core
- Gắn user hiện tại vào app

### Epic: Employee Master Data

Task:
- Tạo schema employee pilot
- Tạo service lấy danh sách nhân viên
- Trang danh sách dùng dữ liệu thật
- Trang chi tiết dùng dữ liệu thật
- Form thêm/sửa nhân viên lưu thật

### Epic: Scheduling Pilot

Task:
- Tạo model tuần lịch
- Tạo trạng thái draft/published
- Lưu ca tuần
- Publish lịch
- Trang lịch cá nhân đọc lịch đã publish

### Epic: Attendance Pilot

Task:
- Ghi check-in
- Ghi check-out
- Trạng thái công hôm nay
- Danh sách công trong ngày cho quản lý
- Xử lý lỗi cơ bản

### Epic: Leave Pilot

Task:
- Gửi đơn nghỉ
- Danh sách đơn theo user
- Duyệt/từ chối
- Danh sách chờ xử lý cho quản lý

---

## 10. Định nghĩa hoàn thành cho team

Đây là phần rất cần thiết để tránh "xong giao diện nhưng chưa dùng được".

## 10.1 Definition of Done cho một flow pilot

Một flow chỉ được coi là xong khi đủ:
- Có dữ liệu thật
- Đúng user
- Đúng quyền
- Không phụ thuộc mock để chạy
- Có xử lý lỗi cơ bản
- Có thể test bằng tài khoản pilot

## 10.2 Không chấp nhận coi là xong nếu

- Chỉ mới render được UI
- Chỉ mới lấy từ mock data
- Chỉ mới alert hoặc toast thành công
- Chưa biết dữ liệu ghi đi đâu
- Còn hard-code user

---

## 11. Vai trò của từng nhóm trong tuần đầu

## Product/PM

Phải chốt:
- Pilot store
- Scope pilot
- User role
- Flow chuẩn

## Design/UX

Phải chốt:
- Luồng ngắn nhất cho employee
- Luồng ngắn nhất cho manager
- Trạng thái màn hình nháp/publish/chờ duyệt/ngoại lệ

## Tech Lead

Phải chốt:
- Cấu trúc workstream
- Phần nào refactor trước
- Phần nào tạm giữ mock
- Nguyên tắc migration từ demo sang pilot

## Dev

Phải bắt đầu từ:
- Auth
- Data core
- User context

Không nên tự phát mở thêm nhiều page mới trong tuần đầu.

---

## 12. Những việc team không nên làm tiếp theo

Đây là phần để tránh trôi sprint.

Không nên ưu tiên ngay lúc này:
- Thêm page mới cho module phụ
- Tô đẹp thêm dashboard nhưng chưa chốt dữ liệu
- Mở rộng gamification
- Mở rộng learning
- Mở rộng career path
- Làm báo cáo rất sâu khi dữ liệu gốc chưa chắc

Lý do:
- Sẽ làm team bận
- Nhưng không giúp cửa hàng pilot dùng được

---

## 13. Rủi ro lớn nhất nếu làm sai thứ tự

### Rủi ro 1: Demo đẹp nhưng pilot không chạy

Lý do:
- Nhiều flow nhìn thấy được
- Nhưng user thật vào dùng thì sai người, sai quyền, sai dữ liệu

### Rủi ro 2: Team bị phân tán

Lý do:
- Quá nhiều module đang mở
- Không có scope pilot rõ

### Rủi ro 3: Quản lý cửa hàng mất niềm tin

Lý do:
- Lịch không đúng
- Công không đúng
- Nghỉ phép không đúng người

### Rủi ro 4: Team tiếp tục build feature mà không khóa core

Lý do:
- Sản phẩm rộng hơn
- Nhưng lại xa hơn mục tiêu vận hành thật

---

## 14. Quyết định thực thi khuyến nghị

Nếu mình là người chốt cho team code bắt đầu ngay, mình sẽ ra quyết định như sau:

### Quyết định 1

Từ giờ đến hết giai đoạn pilot, chỉ ưu tiên 4 flow:
- Hồ sơ nhân sự cơ bản
- Lịch làm
- Chấm công
- Nghỉ phép

### Quyết định 2

Tất cả các flow pilot phải bỏ hard-code user và bỏ mock ở lớp dữ liệu chính.

### Quyết định 3

Không mở thêm module mới trước khi P0 và P1 hoàn thành.

### Quyết định 4

Payroll chỉ làm theo hướng:
- chuẩn bị dữ liệu
- đối chiếu nội bộ
- chưa go-live ngay

### Quyết định 5

Sau 6 tuần phải có một bản:
- quản lý cửa hàng dùng thử được
- nhân viên dùng thử được
- đội vận hành phản hồi được

---

## 15. Team nên bắt đầu bằng checklist này trong 48 giờ tới

## Việc phải xong trong 2 ngày đầu

1. Chốt 1 cửa hàng pilot
2. Chốt 4 flow pilot
3. Lập backlog P0/P1/P2
4. Giao owner cho từng workstream
5. Chốt danh sách tài khoản pilot
6. Chốt nguồn dữ liệu thật ban đầu
7. Chốt definition of done

## Việc phải xong trong tuần đầu

1. Mở auth thật hoặc tối thiểu là luồng auth gần production
2. Chỉ ra tất cả nơi đang hard-code employee trong flow core
3. Chỉ ra tất cả page pilot còn dùng mock data
4. Chốt màn hình nào dùng cho pilot, màn hình nào tạm coi là demo
5. Tạo board triển khai theo epic

---

## 16. Kết luận cuối

Nếu hỏi thật thực dụng: "Giờ làm gì tiếp theo để đưa team code vào làm?"

Câu trả lời là:

### Không bắt đầu bằng viết thêm tính năng mới.
### Bắt đầu bằng chốt pilot scope và biến nó thành backlog có owner.

Sau đó, team triển khai theo thứ tự:
1. Auth và quyền
2. Dữ liệu nhân sự gốc
3. Lịch làm
4. Chấm công
5. Nghỉ phép
6. Dashboard quản lý
7. UAT pilot

Đây là hướng ngắn nhất để đi từ:
- web có nhiều tính năng

sang:
- một phiên bản đủ thật để cửa hàng bắt đầu dùng thử nghiêm túc.

