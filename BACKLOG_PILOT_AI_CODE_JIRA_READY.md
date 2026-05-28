# Backlog Pilot AI Code - Jira Ready

Ngày soạn: 2026-05-18

Mục tiêu:
- Dùng cho `1 AI code worker`
- Chạy tuần tự, không chạy song song
- Scope pilot: `store-001`
- Auth: `chuyển tiếp trước, harden sau`
- Offline check-in: `giữ trong pilot nhưng ưu tiên sau online`
- Payroll: `khóa an toàn, không mở rộng`

Nguyên tắc sử dụng:
- Mỗi task phải xong hẳn mới sang task tiếp theo
- Không mở thêm task ngoài backlog này nếu chưa có quyết định mới
- Mỗi task phải có báo cáo theo mẫu ở cuối file

---

## Epic 0 - Chốt nền pilot

### TASK-00 - Rà scope pilot và đánh dấu vùng cấm sửa

Priority: P0  
Owner: AI code worker  
Depends on: Không có

Mục tiêu:
- Xác định chính xác các file thuộc flow pilot
- Ghi rõ các vùng không được đụng

Phạm vi chính:
- `src/app/login/page.tsx`
- `src/app/employees/**`
- `src/app/schedule/**`
- `src/app/checkin/page.tsx`
- `src/app/attendance/**`
- `src/app/leave/**`
- `src/store/auth-store.ts`
- `src/lib/supabase.ts`
- `src/middleware.ts`

Không được đụng:
- `src/app/kpi/**`
- `src/app/career*`
- `src/app/learning/**`
- `src/app/wellness/**`
- `src/app/gamification/**`
- `src/app/reports/**`
- payroll trừ khi cần khóa quyền

Definition of Done:
- Có ghi chú nội bộ hoặc báo cáo xác nhận phạm vi file
- Liệt kê được nơi nào còn hard-code user
- Liệt kê được nơi nào còn dùng mock trong flow pilot

---

## Epic 1 - Auth chuyển tiếp và user context thật

### TASK-01 - Chuẩn hóa auth store cho pilot

Priority: P0  
Owner: AI code worker  
Depends on: TASK-00

Mục tiêu:
- Biến auth hiện tại thành lớp dùng được cho pilot
- Không để page core tự bịa user

Phạm vi file:
- `src/store/auth-store.ts`
- `src/app/login/page.tsx`
- `src/lib/supabase.ts`

Việc phải làm:
- Rà lại auth store hiện tại
- Tạo cơ chế auth chuyển tiếp rõ ràng
- Chuẩn hóa user source dùng chung
- Không để flow pilot phụ thuộc `MOCK_EMPLOYEES` rải rác

Definition of Done:
- Login flow dùng được cho pilot
- User sau login được lấy từ một nguồn thống nhất
- Không còn page pilot tự gán user cứng

---

### TASK-02 - Guard route core và user context dùng chung

Priority: P0  
Owner: AI code worker  
Depends on: TASK-01

Mục tiêu:
- Các page pilot đọc đúng user đăng nhập
- Có route protection cơ bản

Phạm vi file:
- `src/middleware.ts`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/layout/AppShell.tsx`
- `src/app/page.tsx`

Việc phải làm:
- Cập nhật guard route cho flow pilot
- Đảm bảo app shell đọc đúng user
- Giữ logic đơn giản, tránh refactor rộng

Definition of Done:
- Mở page pilot khi chưa login sẽ bị chặn đúng cách
- Sau login, app đọc đúng user ở các flow pilot
- Không làm vỡ dashboard hiện có

---

## Epic 2 - Dữ liệu nhân sự và dữ liệu gốc pilot store-001

### TASK-03 - Chuẩn hóa data layer cho employee/store/position/shift

Priority: P0  
Owner: AI code worker  
Depends on: TASK-02

Mục tiêu:
- Có một lớp dữ liệu ổn định cho pilot store-001

Phạm vi file:
- `src/lib/mock-data.ts`
- `src/lib/supabase.ts`
- service/helper mới nếu cần

Việc phải làm:
- Chọn một nguồn dữ liệu pilot thống nhất
- Chuẩn hóa cách lấy employee/store/position/shift
- Giảm việc đọc trực tiếp mock rải rác trong flow pilot nếu có thể

Definition of Done:
- Có API/service/helper rõ để các page pilot dùng chung
- Có thể truy được nhân viên của `store-001`
- Các flow sau có thể tái sử dụng data layer này

---

### TASK-04 - Biến module nhân sự thành CRUD cơ bản cho pilot

Priority: P1  
Owner: AI code worker  
Depends on: TASK-03

Mục tiêu:
- Employees page không còn là màn hình tĩnh

Phạm vi file:
- `src/app/employees/page.tsx`
- `src/app/employees/[id]/page.tsx`
- `src/app/employees/new/page.tsx`

Việc phải làm:
- Danh sách nhân sự đọc từ nguồn dữ liệu pilot
- Chi tiết nhân sự đọc đúng theo id
- Form thêm nhân sự có tác dụng thật ở mức pilot

Definition of Done:
- Có thể xem danh sách nhân viên store-001
- Có thể vào chi tiết nhân viên
- Có thể thêm nhân viên cơ bản và thấy dữ liệu phản ánh lại

---

## Epic 3 - Scheduling Pilot

### TASK-05 - Chuẩn hóa dữ liệu lịch cho pilot

Priority: P0  
Owner: AI code worker  
Depends on: TASK-03

Mục tiêu:
- Có một nguồn dữ liệu lịch dùng chung cho pilot

Phạm vi file:
- `src/app/schedule/page.tsx`
- `src/app/schedule/assign/page.tsx`
- helper/service lịch liên quan

Việc phải làm:
- Xác định nguồn dữ liệu lịch pilot
- Tách rõ dữ liệu lịch của store-001
- Chuẩn bị nền cho draft/publish

Definition of Done:
- Employee và manager không đọc lịch từ hai nguồn mâu thuẫn
- Có service/helper lịch dùng lại được

---

### TASK-06 - Thêm trạng thái draft/published và publish flow

Priority: P0  
Owner: AI code worker  
Depends on: TASK-05

Mục tiêu:
- Quản lý có thể xếp và publish lịch tuần

Phạm vi file:
- `src/app/schedule/assign/page.tsx`
- helper/service lịch liên quan

Việc phải làm:
- Thêm hoặc chuẩn hóa trạng thái lịch
- Lưu lịch tuần
- Publish lịch
- Chỉ lịch đã publish mới là lịch chính thức cho employee

Definition of Done:
- Quản lý xếp ca được cho tuần
- Có hành động publish
- Sau publish, employee nhìn thấy đúng lịch

---

### TASK-07 - Chốt lịch cá nhân cho employee

Priority: P1  
Owner: AI code worker  
Depends on: TASK-06

Mục tiêu:
- Employee xem đúng lịch cá nhân của mình

Phạm vi file:
- `src/app/schedule/page.tsx`

Việc phải làm:
- Đảm bảo lịch cá nhân lấy theo user thật
- Ưu tiên lịch đã publish
- Không hiển thị nhầm lịch người khác hoặc lịch nháp

Definition of Done:
- Employee pilot login vào sẽ thấy đúng lịch của mình
- Không còn phụ thuộc lịch kéo dài giả ngoài mức cần thiết cho pilot

---

## Epic 4 - Attendance Pilot

### TASK-08 - Chuẩn hóa online check-in/check-out trước

Priority: P0  
Owner: AI code worker  
Depends on: TASK-02, TASK-03

Mục tiêu:
- Chốt attendance online trước khi đụng sâu offline

Phạm vi file:
- `src/app/checkin/page.tsx`
- `src/lib/mock-data-checkin.ts`
- helper/service attendance liên quan

Việc phải làm:
- Gắn check-in/check-out với user thật
- Gắn record với employee/store phù hợp
- Chuẩn hóa trạng thái bản ghi công hôm nay

Definition of Done:
- Employee check-in/check-out online được
- Bản ghi công hôm nay phản ánh lại đúng

---

### TASK-09 - Màn hình công hôm nay và công theo ngày cho manager

Priority: P1  
Owner: AI code worker  
Depends on: TASK-08

Mục tiêu:
- Quản lý store-001 xem được công theo ngày

Phạm vi file:
- `src/app/attendance/today/page.tsx`
- `src/app/attendance/by-date/page.tsx`
- `src/app/attendance/page.tsx`

Việc phải làm:
- Đọc công đúng theo pilot store
- Hiển thị tình trạng công cơ bản
- Không trộn dữ liệu cửa hàng khác nếu không cần

Definition of Done:
- Manager pilot xem được danh sách công ngày
- Thấy được trạng thái cơ bản của nhân viên

---

### TASK-10 - Giữ offline check-in trong pilot nhưng hạ ưu tiên

Priority: P2  
Owner: AI code worker  
Depends on: TASK-08

Mục tiêu:
- Không bỏ offline check-in, nhưng không để nó làm blocker của pilot

Phạm vi file:
- `src/components/offline/OfflineCheckin.tsx`
- `src/lib/offline-checkin.ts`
- `src/app/checkin/page.tsx`

Việc phải làm:
- Rà lại offline mode
- Đảm bảo không phá flow online
- Nếu chưa fully-ready, phải chú thích hoặc giới hạn rõ hành vi

Definition of Done:
- Offline mode không phá online flow
- Có mô tả rõ phần nào beta/tạm

---

## Epic 5 - Leave Pilot

### TASK-11 - Loại bỏ hard-code employee khỏi leave flow

Priority: P0  
Owner: AI code worker  
Depends on: TASK-02, TASK-03

Mục tiêu:
- Leave flow phải bám user thật

Phạm vi file:
- `src/app/leave/request/page.tsx`
- `src/app/leave/page.tsx`

Việc phải làm:
- Bỏ `currentEmployeeId = 'emp-005'`
- Lấy employee hiện tại từ user context thật
- Lấy quota và request theo user thật

Definition of Done:
- Không còn hard-code employee trong flow chính
- Employee pilot thấy đúng đơn của mình

---

### TASK-12 - Manager duyệt nghỉ đúng scope pilot

Priority: P1  
Owner: AI code worker  
Depends on: TASK-11

Mục tiêu:
- Quản lý store-001 nhìn thấy và duyệt đúng đơn nghỉ

Phạm vi file:
- `src/app/leave/request/page.tsx`
- `src/app/leave/approval/page.tsx`
- helper leave liên quan

Việc phải làm:
- Phân luồng danh sách cho employee và manager
- Manager chỉ thấy scope phù hợp cho pilot
- Giữ quota logic cơ bản ở mức dùng được

Definition of Done:
- Employee gửi đơn xong manager nhìn thấy đúng
- Duyệt/từ chối phản ánh lại vào danh sách

---

## Epic 6 - Khóa an toàn payroll trong giai đoạn pilot

### TASK-13 - Siết hiển thị payroll nhạy cảm

Priority: P1  
Owner: AI code worker  
Depends on: TASK-02

Mục tiêu:
- Không để payroll trở thành lỗ hổng trong giai đoạn pilot

Phạm vi file:
- `src/app/payroll/page.tsx`
- `src/app/payroll/salary-slip/page.tsx`

Việc phải làm:
- Rà quyền xem payroll
- Nếu chưa đủ an toàn, hạn chế bớt hiển thị
- Không mở rộng thêm tính năng payroll

Definition of Done:
- Không còn màn hình nhạy cảm lộ dữ liệu rõ ràng cho sai vai trò
- Payroll giữ trạng thái an toàn, không phải mục tiêu mở rộng

---

## Epic 7 - Soát và khóa pilot flow

### TASK-14 - Rà tay toàn bộ pilot flow và sửa blocker

Priority: P0  
Owner: AI code worker  
Depends on: TASK-04, TASK-07, TASK-09, TASK-12, TASK-13

Mục tiêu:
- Soát end-to-end trước khi bàn giao review cuối

Phạm vi test:
- login
- employees
- schedule
- attendance
- leave
- payroll visibility

Việc phải làm:
- Test theo vai trò employee và store_manager
- Ghi lại bug blocker
- Sửa các blocker nhỏ, an toàn

Definition of Done:
- Có báo cáo test tay
- Có danh sách blocker đã sửa
- Có danh sách rủi ro còn lại

---

## 11. Mẫu báo cáo bắt buộc cho mỗi task

Sau mỗi task, AI code phải báo theo mẫu:

```text
TASK:
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## 12. Prompt tổng để giao cho 1 AI code worker

```text
Bạn là AI code worker duy nhất cho đợt Pilot Ready v1 của HRM.

Bối cảnh đã chốt:
- Pilot store: store-001
- Auth: chuyển tiếp trước, harden sau
- Offline check-in: vẫn giữ trong pilot nhưng ưu tiên sau online attendance
- Payroll: khóa an toàn, không mở rộng
- Chỉ có 1 AI worker, nên bạn phải làm tuần tự theo backlog

Mục tiêu của đợt này:
- Làm cho 1 cửa hàng pilot dùng được các flow:
  1. login / user context
  2. employees cơ bản
  3. schedule
  4. attendance
  5. leave

Không được mở rộng:
- KPI
- Career
- Learning
- Gamification
- Wellness
- Báo cáo nâng cao
- Payroll tính năng mới

Nguyên tắc:
- Chỉ làm đúng task hiện tại
- Không refactor lan rộng
- Không đổi UI lớn nếu không cần
- Không xóa bừa code cũ nếu chưa có thay thế rõ ràng
- Không revert các thay đổi không phải của bạn

Definition of Done cho mỗi task:
- Dùng đúng user
- Đúng quyền
- Đúng dữ liệu
- Không còn hard-code user trong flow đang sửa
- Có thể mô tả cách test tay

Sau khi xong mỗi task phải báo theo mẫu:

TASK:
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:

Hãy bắt đầu từ TASK-00 rồi làm tuần tự.
Không tự nhảy sang task khác nếu task hiện tại chưa xong.
```

---

## 13. Kết luận

File này là bản giao việc thực chiến cho `1 AI code worker`.

Nếu cần, bước tiếp theo có thể là:
- Tách mỗi task thành một prompt riêng thành nhiều file
- Hoặc mình sẽ đóng vai AI Plan và bắt đầu điều phối `TASK-00 -> TASK-01 -> ...`, sau đó review từng chặng một

