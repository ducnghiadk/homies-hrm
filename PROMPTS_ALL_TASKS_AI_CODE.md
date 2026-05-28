# Prompt Giao Việc Cho AI Code - Toàn Bộ Task Pilot

Ngày soạn: 2026-05-18

Mục tiêu:
- Gom toàn bộ prompt cho AI code vào 1 chỗ
- Dùng cho mô hình làm việc tuần tự với `1 AI code worker`
- Bạn chỉ cần copy prompt của task tương ứng rồi paste cho AI code

Ngữ cảnh chung cho tất cả task:
- Project: HRM web
- Mục tiêu gần nhất: `Pilot Ready v1`
- Pilot store: `store-001`
- Auth: `chuyển tiếp trước, harden sau`
- Offline check-in: `giữ trong pilot nhưng không là blocker của Sprint 1`
- Payroll: `vùng khóa an toàn, chưa mở rộng tính năng`
- Chỉ có: `1 AI code worker`

Nguyên tắc chung cho mọi task:
- Chỉ làm đúng task hiện tại
- Không tự nhảy sang task tiếp theo nếu task hiện tại chưa xong
- Không refactor lan rộng
- Không sửa các module ngoài scope pilot nếu không được giao rõ
- Không revert các thay đổi không phải của bạn
- Không tự mở rộng tính năng mới

Mẫu báo cáo bắt buộc sau mỗi task:

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

## TASK-00 - Rà scope pilot và khóa phạm vi

```text
Bạn đang làm TASK-00 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Chỉ có 1 AI code worker
- Auth: chuyển tiếp trước, harden sau
- Offline check-in: giữ trong pilot nhưng không là blocker của Sprint 1
- Payroll: vùng khóa an toàn, chưa mở rộng

TASK-00 không phải task code tính năng.
TASK-00 là task rà soát và khóa phạm vi để chuẩn bị cho các task tiếp theo.

Mục tiêu bắt buộc:
1. Xác định scope pilot
2. Xác định vùng cấm sửa
3. Tìm các nơi hard-code user hoặc employee trong flow pilot
4. Tìm các nơi đang phụ thuộc mock data trong flow pilot

Bạn phải đọc tối thiểu các file:

Auth / nền tảng:
- src/store/auth-store.ts
- src/lib/supabase.ts
- src/middleware.ts
- src/components/auth/ProtectedRoute.tsx
- src/app/login/page.tsx
- src/app/page.tsx

Nhân sự:
- src/app/employees/page.tsx
- src/app/employees/[id]/page.tsx
- src/app/employees/new/page.tsx

Lịch làm:
- src/app/schedule/page.tsx
- src/app/schedule/assign/page.tsx
- src/app/schedule/manage/page.tsx
- src/app/schedule/by-shift/page.tsx

Chấm công:
- src/app/checkin/page.tsx
- src/app/attendance/page.tsx
- src/app/attendance/today/page.tsx
- src/app/attendance/by-date/page.tsx

Nghỉ phép:
- src/app/leave/page.tsx
- src/app/leave/request/page.tsx
- src/app/leave/approval/page.tsx

Data/helper liên quan:
- src/lib/mock-data.ts
- src/lib/mock-data-checkin.ts
- src/lib/mock-data-leave.ts
- src/lib/mock-data-scheduling.ts
- src/lib/offline-checkin.ts
- src/lib/leave-attendance-sync.ts

Out of scope:
- src/app/kpi/**
- src/app/career*
- src/app/learning/**
- src/app/wellness/**
- src/app/gamification/**
- src/app/reports/**

Không được làm trong TASK-00:
- không refactor
- không sửa logic auth
- không sửa flow pilot
- không redesign UI
- không tạo feature mới

Chỉ được sửa file nếu thật sự cần để thêm note nội bộ, còn mặc định là không sửa gì.

Khi xong phải trả về đúng mẫu:

TASK: TASK-00

1. Scope pilot đã rà
- Auth:
- Employees:
- Schedule:
- Attendance:
- Leave:

2. Vùng cấm sửa / out of scope
- 

3. Các nơi đang hard-code user / employee
- File:
  Mô tả:
  Mức độ ảnh hưởng:

4. Các nơi đang phụ thuộc mock data trong flow pilot
- File:
  Mock đang dùng:
  Ảnh hưởng:

5. Nhận định về auth hiện tại
- 

6. Blocker cho task tiếp theo
- TASK-01:
- TASK-02:
- TASK-03:

7. File đã sửa
- Nếu không sửa file nào thì ghi rõ: không sửa file

8. Assumption
- 

9. Cách mình khuyên nên làm TASK-01
- 
```

---

## TASK-01 - Chuẩn hóa auth store cho pilot

```text
Bạn đang làm TASK-01 cho project HRM pilot.

Bối cảnh chung:
- Pilot store: store-001
- Auth: chuyển tiếp trước, harden sau
- Chỉ có 1 AI code worker
- Payroll chưa mở rộng

Mục tiêu TASK-01:
- Chuẩn hóa auth store để flow pilot dùng đúng user
- Không để page core tự bịa user hoặc bám demo rải rác

Phạm vi được đọc và sửa:
- src/store/auth-store.ts
- src/app/login/page.tsx
- src/lib/supabase.ts

Được phép đọc thêm nếu cần hiểu luồng:
- src/app/page.tsx
- src/components/layout/AppShell.tsx
- src/middleware.ts

Không được sửa:
- KPI
- Career
- Learning
- Wellness
- Gamification
- Schedule/attendance/leave logic ngoài mức cần để hiểu auth

Việc phải làm:
1. Rà auth store hiện tại
2. Chuẩn hóa lại nguồn user dùng chung cho pilot
3. Tạo lớp auth chuyển tiếp rõ ràng
4. Giảm lệ thuộc vào MOCK_EMPLOYEES trong flow pilot
5. Giữ thay đổi gọn, không refactor quá rộng

Yêu cầu bắt buộc:
- Sau login phải có user source thống nhất
- Không để các page pilot tự dựng user riêng
- Nếu chưa làm auth thật hoàn toàn thì phải mô tả rõ lớp chuyển tiếp đang dùng

Definition of Done:
- Login flow pilot dùng được
- User sau login lấy từ 1 nguồn rõ ràng
- Không còn phụ thuộc rải rác vào user demo trong flow pilot cốt lõi

Khi xong báo theo mẫu:

TASK: TASK-01
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-02 - Guard route core và user context dùng chung

```text
Bạn đang làm TASK-02 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Auth đang đi theo hướng chuyển tiếp trước
- TASK-01 đã chuẩn hóa auth store ở mức pilot

Mục tiêu TASK-02:
- Các page pilot đọc đúng user đăng nhập
- Có route protection cơ bản cho flow pilot

Phạm vi được sửa:
- src/middleware.ts
- src/components/auth/ProtectedRoute.tsx
- src/components/layout/AppShell.tsx
- src/app/page.tsx

Được đọc thêm nếu cần:
- src/store/auth-store.ts
- src/app/login/page.tsx
- src/hooks/usePermissions.ts
- src/lib/rbac.ts

Không được sửa:
- KPI
- Career
- Learning
- Wellness
- Gamification
- Các flow business lớn ngoài phần user context nếu không thật sự cần

Việc phải làm:
1. Guard các route core ở mức cơ bản
2. Đảm bảo app shell đọc đúng user chung
3. Đảm bảo dashboard home không tự dùng user sai
4. Giữ thay đổi nhỏ, dễ kiểm soát

Yêu cầu bắt buộc:
- Khi chưa login không được vào lung tung các page pilot
- Khi đã login, page pilot đọc đúng user từ nguồn chung
- Không làm vỡ luồng hiện có ngoài pilot scope

Definition of Done:
- Route core được bảo vệ ở mức cơ bản
- Home/app shell dùng đúng user context
- Không còn page pilot quan trọng nào rơi vào trạng thái “tự hiểu user”

Khi xong báo theo mẫu:

TASK: TASK-02
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-03 - Chuẩn hóa data layer cho employee/store/position/shift

```text
Bạn đang làm TASK-03 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Auth/user context cơ bản đã được chuẩn hóa
- Mục tiêu bây giờ là tạo nền dữ liệu thống nhất cho flow pilot

Mục tiêu TASK-03:
- Có một data layer ổn định cho employee/store/position/shift
- Các flow pilot không phải đọc mock rải rác một cách khó kiểm soát

Phạm vi được sửa:
- src/lib/mock-data.ts
- src/lib/supabase.ts
- service/helper dữ liệu mới nếu cần tạo

Được đọc thêm:
- src/app/employees/page.tsx
- src/app/employees/[id]/page.tsx
- src/app/employees/new/page.tsx
- src/app/schedule/page.tsx
- src/app/schedule/assign/page.tsx
- src/app/checkin/page.tsx

Không được sửa rộng:
- Không redesign employees pages ở task này
- Không đụng KPI/career/learning
- Không làm payroll

Việc phải làm:
1. Chọn 1 nguồn dữ liệu pilot đủ ổn định cho store-001
2. Chuẩn hóa cách lấy employee/store/position/shift
3. Tạo service/helper dùng chung nếu cần
4. Giữ backward compatibility đủ để không làm vỡ app

Yêu cầu bắt buộc:
- Các task sau có thể tái sử dụng data layer này
- Có thể truy được nhân sự của store-001 rõ ràng
- Không làm codebase rối hơn vì thêm quá nhiều lớp thừa

Definition of Done:
- Có lớp dữ liệu dùng chung cho pilot
- Có thể nói rõ employee/store/position/shift hiện được đọc từ đâu
- Task 04, 05, 08, 11 có thể dùng tiếp được

Khi xong báo theo mẫu:

TASK: TASK-03
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-04 - Biến module nhân sự thành CRUD cơ bản cho pilot

```text
Bạn đang làm TASK-04 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Đã có data layer gốc ở mức cơ bản từ TASK-03

Mục tiêu TASK-04:
- Module nhân sự không còn là màn hình tĩnh
- Có thể xem danh sách, xem chi tiết và thêm nhân sự cơ bản cho pilot

Phạm vi được sửa:
- src/app/employees/page.tsx
- src/app/employees/[id]/page.tsx
- src/app/employees/new/page.tsx

Được đọc thêm:
- service/helper dữ liệu employee từ TASK-03

Không được làm:
- Không redesign toàn bộ UI nhân sự
- Không thêm quá nhiều field ngoài scope pilot
- Không đụng payroll

Việc phải làm:
1. Danh sách nhân viên phải đọc từ data layer pilot
2. Chi tiết nhân viên phải đọc đúng theo id
3. Form thêm nhân viên phải có tác dụng thật ở mức pilot
4. Giữ trải nghiệm hiện có nếu có thể

Yêu cầu bắt buộc:
- Không còn chỉ hiển thị mock chết cho employees flow chính
- Add employee phải phản ánh lại ít nhất ở mức pilot
- Chỉ xử lý thông tin cơ bản: tên, điện thoại, email, store, position, role, status

Definition of Done:
- Xem được danh sách nhân viên store-001
- Vào được chi tiết nhân viên
- Thêm được nhân viên cơ bản cho pilot

Khi xong báo theo mẫu:

TASK: TASK-04
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-05 - Chuẩn hóa dữ liệu lịch cho pilot

```text
Bạn đang làm TASK-05 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Data layer gốc đã có ở mức cơ bản
- Sắp bước vào flow schedule

Mục tiêu TASK-05:
- Tạo nguồn dữ liệu lịch thống nhất cho pilot
- Tránh tình trạng employee và manager đọc lịch từ hai nguồn khác nhau

Phạm vi được sửa:
- src/app/schedule/page.tsx
- src/app/schedule/assign/page.tsx
- helper/service lịch liên quan

Được đọc thêm:
- src/app/schedule/manage/page.tsx
- src/app/schedule/by-shift/page.tsx
- src/lib/mock-data.ts
- src/lib/mock-data-scheduling.ts

Không được làm:
- Không mở rộng auto-scheduler
- Không redesign module lịch
- Không đụng attendance trong task này trừ khi cần đọc hiểu

Việc phải làm:
1. Xác định data source lịch cho pilot
2. Tách rõ lịch của store-001
3. Chuẩn hóa service/helper đọc lịch
4. Chuẩn bị nền cho draft/published ở TASK-06

Definition of Done:
- Employee và manager có thể dùng chung một data source lịch
- Có thể mô tả rõ lịch pilot hiện nằm ở đâu và đọc bằng cách nào

Khi xong báo theo mẫu:

TASK: TASK-05
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-06 - Thêm trạng thái draft/published và publish flow

```text
Bạn đang làm TASK-06 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Data source lịch pilot đã được chuẩn hóa ở TASK-05

Mục tiêu TASK-06:
- Quản lý có thể xếp ca tuần và publish lịch
- Chỉ lịch đã publish mới là lịch chính thức cho employee

Phạm vi được sửa:
- src/app/schedule/assign/page.tsx
- helper/service lịch liên quan

Được đọc thêm:
- src/app/schedule/page.tsx
- src/app/schedule/manage/page.tsx

Không được làm:
- Không mở rộng feature scheduling mới
- Không làm lại toàn bộ UI
- Không xử lý sâu open shift/swap trong task này

Việc phải làm:
1. Thêm hoặc chuẩn hóa trạng thái draft / published
2. Lưu lịch tuần theo pilot store
3. Tạo hành động publish lịch
4. Giữ logic rõ ràng, không tạo state chồng chéo

Yêu cầu bắt buộc:
- Quản lý phải có thể publish
- Employee về sau chỉ xem lịch đã publish
- Không để lịch nháp bị hiểu thành lịch chính thức

Definition of Done:
- Quản lý xếp ca và publish được
- Trạng thái lịch rõ ràng
- Có thể test được phân biệt draft và published

Khi xong báo theo mẫu:

TASK: TASK-06
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-07 - Chốt lịch cá nhân cho employee

```text
Bạn đang làm TASK-07 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Publish flow cho schedule đã có từ TASK-06

Mục tiêu TASK-07:
- Employee xem đúng lịch cá nhân của mình
- Ưu tiên lịch đã publish

Phạm vi được sửa:
- src/app/schedule/page.tsx

Được đọc thêm:
- service/helper lịch từ TASK-05, TASK-06
- src/store/auth-store.ts nếu cần hiểu user context

Không được làm:
- Không mở rộng tính năng mới ở page schedule
- Không sửa module scheduling khác nếu không bắt buộc

Việc phải làm:
1. Đảm bảo lịch cá nhân lấy theo user thật
2. Ưu tiên lịch đã publish
3. Không hiển thị nhầm lịch người khác hoặc lịch nháp
4. Nếu có dữ liệu giả kéo dài tháng chỉ để demo, phải xử lý sao cho không phá pilot

Definition of Done:
- Employee pilot login vào thấy đúng lịch của mình
- Không còn phụ thuộc dữ liệu lịch giả một cách sai ngữ nghĩa

Khi xong báo theo mẫu:

TASK: TASK-07
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-08 - Chuẩn hóa online check-in/check-out trước

```text
Bạn đang làm TASK-08 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Offline check-in vẫn giữ nhưng không là blocker
- Ưu tiên chốt online attendance trước

Mục tiêu TASK-08:
- Employee check-in/check-out online được với user thật
- Trạng thái công hôm nay phản ánh đúng

Phạm vi được sửa:
- src/app/checkin/page.tsx
- src/lib/mock-data-checkin.ts
- helper/service attendance liên quan

Được đọc thêm:
- src/app/attendance/today/page.tsx
- src/lib/offline-checkin.ts
- src/lib/leave-attendance-sync.ts

Không được làm:
- Không mở rộng feature thiết bị
- Không đào quá sâu offline ở task này
- Không đụng payroll

Việc phải làm:
1. Gắn check-in/check-out với user thật
2. Gắn record với employee/store đúng
3. Chuẩn hóa trạng thái bản ghi công hôm nay
4. Ưu tiên online flow chạy chắc

Definition of Done:
- Employee pilot check-in online được
- Employee pilot check-out online được
- Trạng thái công hôm nay có dữ liệu đúng ở mức pilot

Khi xong báo theo mẫu:

TASK: TASK-08
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-09 - Màn hình công hôm nay và công theo ngày cho manager

```text
Bạn đang làm TASK-09 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Online check-in/check-out cơ bản đã xong ở TASK-08

Mục tiêu TASK-09:
- Quản lý store-001 xem được công theo ngày
- Có trạng thái công cơ bản cho vận hành

Phạm vi được sửa:
- src/app/attendance/today/page.tsx
- src/app/attendance/by-date/page.tsx
- src/app/attendance/page.tsx

Được đọc thêm:
- helper/service attendance từ TASK-08
- src/store/auth-store.ts nếu cần phân role

Không được làm:
- Không mở dashboard toàn hệ thống
- Không mở rộng sang payroll
- Không redesign attendance pages lớn

Việc phải làm:
1. Đọc attendance đúng theo pilot store
2. Hiển thị danh sách công ngày cho manager
3. Hiển thị trạng thái công cơ bản
4. Tránh trộn dữ liệu không đúng scope

Definition of Done:
- Manager pilot xem được công theo ngày
- Thấy được trạng thái cơ bản như đã vào ca, đã ra ca, chưa hoàn tất

Khi xong báo theo mẫu:

TASK: TASK-09
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-10 - Giữ offline check-in trong pilot nhưng hạ ưu tiên

```text
Bạn đang làm TASK-10 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Online attendance đã được ưu tiên chốt trước
- Offline check-in phải còn tồn tại nhưng không được phá flow chính

Mục tiêu TASK-10:
- Giữ offline check-in trong pilot
- Nhưng không để nó gây rối hoặc phá online flow

Phạm vi được sửa:
- src/components/offline/OfflineCheckin.tsx
- src/lib/offline-checkin.ts
- src/app/checkin/page.tsx

Được đọc thêm:
- logic attendance ở TASK-08

Không được làm:
- Không làm offline trở thành trọng tâm sprint
- Không thêm tính năng phức tạp mới

Việc phải làm:
1. Rà lại offline mode hiện tại
2. Đảm bảo không phá online check-in/check-out
3. Nếu chưa đủ readiness, phải thể hiện rõ giới hạn
4. Giữ thay đổi nhỏ và an toàn

Definition of Done:
- Offline flow không phá online flow
- Có thể mô tả rõ phần offline hiện đã làm được gì và chưa làm được gì

Khi xong báo theo mẫu:

TASK: TASK-10
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-11 - Loại bỏ hard-code employee khỏi leave flow

```text
Bạn đang làm TASK-11 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- User context và data layer cơ bản đã có
- Leave flow hiện có dấu hiệu hard-code employee

Mục tiêu TASK-11:
- Leave flow phải bám user thật
- Không còn employee cứng trong flow chính

Phạm vi được sửa:
- src/app/leave/request/page.tsx
- src/app/leave/page.tsx

Được đọc thêm:
- src/store/auth-store.ts
- src/lib/mock-data-leave.ts
- src/lib/quota-service.ts

Không được làm:
- Không mở rộng policy nghỉ phép phức tạp
- Không redesign toàn bộ UI leave
- Không đụng payroll

Việc phải làm:
1. Loại bỏ hard-code employee id trong leave flow
2. Lấy employee hiện tại từ user context thật
3. Gắn request list với user thật
4. Gắn quota với user thật ở mức pilot

Definition of Done:
- Không còn currentEmployeeId cứng trong leave flow chính
- Employee pilot thấy đúng đơn của mình
- Tạo đơn nghỉ bằng user thật

Khi xong báo theo mẫu:

TASK: TASK-11
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-12 - Manager duyệt nghỉ đúng scope pilot

```text
Bạn đang làm TASK-12 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Leave flow đã gắn với user thật ở TASK-11

Mục tiêu TASK-12:
- Quản lý store-001 nhìn thấy và duyệt đúng đơn nghỉ

Phạm vi được sửa:
- src/app/leave/request/page.tsx
- src/app/leave/approval/page.tsx
- helper/service leave liên quan nếu cần

Được đọc thêm:
- src/store/auth-store.ts
- src/lib/quota-service.ts
- src/lib/leave-attendance-sync.ts

Không được làm:
- Không mở rộng rule nghỉ phép nâng cao
- Không làm lại toàn bộ luồng approval toàn công ty

Việc phải làm:
1. Phân tách danh sách đơn cho employee và manager
2. Manager chỉ nhìn thấy đúng scope pilot store nếu phù hợp
3. Duyệt/từ chối cập nhật đúng danh sách
4. Giữ quota logic cơ bản ở mức dùng được

Definition of Done:
- Employee gửi đơn xong manager nhìn thấy đúng
- Manager duyệt/từ chối được
- Danh sách phản ánh đúng theo vai trò

Khi xong báo theo mẫu:

TASK: TASK-12
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-13 - Siết hiển thị payroll nhạy cảm

```text
Bạn đang làm TASK-13 cho project HRM pilot.

Bối cảnh:
- Payroll không phải flow mở rộng ở đợt này
- Payroll đang được xem là vùng khóa an toàn

Mục tiêu TASK-13:
- Ngăn lộ dữ liệu payroll rõ ràng trong giai đoạn pilot
- Không mở rộng thêm tính năng payroll

Phạm vi được sửa:
- src/app/payroll/page.tsx
- src/app/payroll/salary-slip/page.tsx

Được đọc thêm:
- src/store/auth-store.ts
- src/components/auth/ProtectedRoute.tsx

Không được làm:
- Không thêm feature payroll mới
- Không viết lại payroll engine
- Không mở rộng phạm vi sang bonus/deduction/insurance nếu không cần

Việc phải làm:
1. Rà quyền xem payroll
2. Nếu có màn hình đang lộ dữ liệu không đúng role thì siết lại
3. Giữ payroll ở trạng thái an toàn trong pilot

Definition of Done:
- Không còn lộ dữ liệu payroll rõ ràng cho sai vai trò
- Không phát sinh thêm scope payroll

Khi xong báo theo mẫu:

TASK: TASK-13
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## TASK-14 - Rà tay toàn bộ pilot flow và sửa blocker

```text
Bạn đang làm TASK-14 cho project HRM pilot.

Bối cảnh:
- Các task chính của pilot đã xong tương đối
- Nhiệm vụ hiện tại là rà toàn bộ flow trước khi bàn giao review cuối

Mục tiêu TASK-14:
- Test lại end-to-end các flow pilot
- Sửa các blocker nhỏ, an toàn
- Tổng hợp rủi ro còn lại

Flow phải rà:
- login
- employees
- schedule
- attendance
- leave
- payroll visibility

Phạm vi được sửa:
- Chỉ sửa những file thật sự cần để fix blocker nhỏ, an toàn
- Không mở rộng thêm tính năng

Không được làm:
- Không refactor lớn
- Không mở task mới trá hình
- Không đổi scope pilot

Việc phải làm:
1. Test tay theo vai trò employee
2. Test tay theo vai trò store_manager
3. Ghi lại bug/blocker
4. Sửa những blocker nhỏ, rõ ràng, ít rủi ro
5. Tổng hợp rủi ro còn lại để reviewer cuối quyết định

Definition of Done:
- Có báo cáo test end-to-end
- Có danh sách blocker đã sửa
- Có danh sách rủi ro còn lại

Khi xong báo theo mẫu:

TASK: TASK-14
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:
```

---

## Prompt Tổng - Dùng nếu muốn giao nguyên chuỗi cho AI code

```text
Bạn là AI code worker duy nhất cho đợt Pilot Ready v1 của project HRM.

Bối cảnh cố định:
- Pilot store: store-001
- Auth: chuyển tiếp trước, harden sau
- Offline check-in: giữ trong pilot nhưng không là blocker của Sprint 1
- Payroll: vùng khóa an toàn, chưa mở rộng
- Chỉ có 1 AI code worker, nên bạn phải làm tuần tự

Mục tiêu đợt này:
- Làm cho pilot store dùng được các flow:
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
- Không tự mở thêm scope
- Không revert thay đổi không phải của bạn
- Không đổi UI lớn nếu không cần

Mẫu báo cáo sau mỗi task:

TASK:
File đã sửa:
Đã làm:
Chưa làm:
Assumption:
Blocker:
Cách test tay:
Rủi ro còn lại:

Thứ tự task phải làm:
- TASK-00
- TASK-01
- TASK-02
- TASK-03
- TASK-04
- TASK-05
- TASK-06
- TASK-07
- TASK-08
- TASK-09
- TASK-10
- TASK-11
- TASK-12
- TASK-13
- TASK-14

Không được tự nhảy task.
Phải xong task hiện tại rồi mới sang task tiếp theo.
```

---

## Gợi ý sử dụng

Nếu bạn muốn kiểm soát kỹ:
- Giao từng prompt một
- Nhận kết quả từng task
- Gửi lại cho reviewer

Nếu bạn muốn AI code tự chạy dài:
- Dùng `Prompt Tổng`
- Nhưng vẫn nên dừng sau từng task để review

