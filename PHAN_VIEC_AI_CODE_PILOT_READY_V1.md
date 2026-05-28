# Phân Việc Cho AI Code - Pilot Ready v1

Ngày soạn: 2026-05-18

Mục tiêu tài liệu:
- Biến kế hoạch triển khai thành bộ giao việc cụ thể cho AI code.
- Viết theo kiểu "đọc là làm được", phù hợp cả với AI code có năng lực suy luận yếu.
- Giảm tối đa việc hiểu sai yêu cầu, làm lệch scope, hoặc sửa lan sang vùng không liên quan.

Tài liệu này dùng để:
- Giao việc cho từng AI code
- Chạy nhiều AI code song song
- Review đầu ra sau khi AI code làm xong

---

## 1. Mục tiêu chung của đợt này

Đợt này không phải để hoàn thiện toàn bộ HRM.

Đợt này chỉ nhắm tới:

## Pilot Ready v1 cho 1 cửa hàng

Flow bắt buộc phải ưu tiên:
- Đăng nhập và user context thật
- Hồ sơ nhân sự cơ bản
- Lịch làm
- Chấm công
- Nghỉ phép

Không làm trong đợt này:
- KPI nâng cao
- Learning
- Career path
- Gamification
- Wellness
- Báo cáo nâng cao
- Payroll go-live thật

Payroll chỉ cần giữ nguyên hoặc khóa quyền, chưa cần nâng lên sản xuất thật.

---

## 2. Nguyên tắc giao việc cho AI code

Đây là phần bắt buộc. Mỗi AI code phải tuân thủ đúng.

### 2.1 Chỉ sửa đúng phạm vi được giao

AI code không được:
- tự ý refactor toàn repo
- đổi kiến trúc diện rộng
- đụng vào các module ngoài phạm vi task
- sửa style hàng loạt vì "tiện tay"

### 2.2 Ưu tiên sửa để chạy đúng, không ưu tiên làm đẹp

Mục tiêu là:
- đúng dữ liệu
- đúng user
- đúng quyền
- đúng flow

Không phải:
- đổi thiết kế lớn
- làm animation mới
- làm lại toàn bộ UI

### 2.3 Không đụng các module ngoài scope pilot

Tạm không đụng:
- `src/app/kpi/**`
- `src/app/career*`
- `src/app/learning/**`
- `src/app/wellness/**`
- `src/app/gamification/**`
- `src/app/reports/**` trừ khi được giao rõ

### 2.4 Không xóa luồng cũ nếu chưa có thay thế rõ ràng

Nếu thấy code demo cũ:
- có thể cô lập
- có thể thêm guard
- có thể thêm fallback

Nhưng không được xóa ẩu nếu chưa chắc tác động.

### 2.5 Mỗi AI code phải trả về theo mẫu cố định

Khi làm xong, AI code phải báo:
- Đã sửa file nào
- Đã làm được gì
- Chưa làm được gì
- Có assumption gì
- Có blocker gì
- Cần người review test case nào

---

## 3. Cách chia AI code

Đề xuất chia thành 5 AI code chính và 1 AI kiểm tra phụ.

## AI-0: Điều phối và tích hợp

Vai trò:
- Không code chính
- Theo dõi thứ tự merge hợp lý
- Kiểm tra xung đột giữa các nhánh việc

AI này thường là người tổng hợp, không phải worker chính.

## AI-1: Auth và quyền

Phụ trách:
- Đăng nhập thật hoặc ít nhất là auth gần-production
- Session
- Route protection
- User context

## AI-2: Dữ liệu nhân sự và dữ liệu gốc

Phụ trách:
- Employee data
- Store, position, shift data
- CRUD cơ bản cho hồ sơ nhân sự pilot

## AI-3: Scheduling

Phụ trách:
- Xếp ca tuần
- Publish lịch
- Lịch cá nhân
- Lịch theo cửa hàng

## AI-4: Attendance

Phụ trách:
- Check-in/check-out
- Công hôm nay
- Danh sách công theo ngày
- Ngoại lệ công cơ bản

## AI-5: Leave

Phụ trách:
- Gửi đơn nghỉ
- Duyệt nghỉ
- Danh sách đơn đúng user
- Đồng bộ tác động cơ bản

## AI-6: QA/Review phụ

Phụ trách:
- Không sửa logic lớn
- Soát flow sau khi AI khác hoàn thành
- Bắt lỗi sai user, sai quyền, sai dữ liệu, regression bề mặt

---

## 4. Thứ tự triển khai bắt buộc

Không được chạy theo thứ tự ngẫu nhiên.

### Bắt buộc theo chuỗi:

1. AI-1 làm trước
2. AI-2 làm tiếp
3. AI-3, AI-4, AI-5 có thể làm sau đó và song song tương đối
4. AI-6 chỉ làm khi 3 nhánh core đã xong

Lý do:
- Nếu auth và user context chưa xong thì lịch, công, nghỉ sẽ tiếp tục bám mock hoặc hard-code user

---

## 5. Các vấn đề đã biết, cần đưa vào phạm vi xử lý

Đây là các lỗi hoặc dấu hiệu đã phát hiện. AI code phải dùng làm đầu vào.

### Auth / nền tảng

- `src/store/auth-store.ts` đang dùng `MOCK_EMPLOYEES`
- `src/lib/supabase.ts` vẫn để placeholder
- `src/middleware.ts` chưa enforce session server-side
- `ProtectedRoute` tồn tại nhưng chưa được dùng rộng rãi

### Nghỉ phép

- `src/app/leave/request/page.tsx` đang có `currentEmployeeId = 'emp-005'`
- Luồng nghỉ phép đang có dấu hiệu dùng dữ liệu người mẫu

### Payroll

- `src/app/payroll/salary-slip/page.tsx` đang render từ `mockSalarySlips`
- Phần này chưa phải phạm vi build mới, nhưng phải lưu ý không làm lộ thêm dữ liệu

### Lưu ý repo hiện tại

Repo đang có rất nhiều thay đổi chưa commit.
AI code tuyệt đối:
- không revert các thay đổi không do mình tạo
- không reset file lạ
- không chỉnh hàng loạt ngoài vùng được giao

---

## 6. Định nghĩa "xong việc" cho AI code

Một task chỉ được coi là xong khi đủ 6 điều kiện:

1. Dùng đúng dữ liệu trong phạm vi mới
2. Không còn hard-code user trong flow được giao
3. Không còn phụ thuộc mock ở điểm dữ liệu chính của flow đó
4. Có xử lý trạng thái lỗi cơ bản
5. Không phá giao diện hiện có ở mức nghiêm trọng
6. Có thể mô tả cách test tay rõ ràng

Không được coi là xong nếu:
- chỉ mới sửa UI
- vẫn còn toast giả mà không lưu dữ liệu
- vẫn còn dữ liệu cứng trong luồng chính
- vẫn chưa gắn với user thật

---

## 7. Giao việc chi tiết cho từng AI code

---

## AI-1 - Auth, Session, User Context, Route Protection

### Mục tiêu

Biến flow đăng nhập từ demo mode sang trạng thái có thể dùng cho pilot.

### Kết quả đầu ra bắt buộc

- Có user context thật cho app
- Các page pilot không còn phụ thuộc vào user demo cứng
- Route core có guard cơ bản
- App shell, dashboard, và các flow core đọc user từ cùng một nguồn

### Phạm vi file ưu tiên đọc trước

- `src/store/auth-store.ts`
- `src/lib/supabase.ts`
- `src/middleware.ts`
- `src/components/auth/ProtectedRoute.tsx`
- `src/hooks/usePermissions.ts`
- `src/lib/rbac.ts`
- `src/app/login/page.tsx`
- `src/app/page.tsx`
- `src/components/layout/AppShell.tsx`

### Phạm vi file có thể phải sửa

- `src/store/auth-store.ts`
- `src/lib/supabase.ts`
- `src/middleware.ts`
- `src/components/auth/ProtectedRoute.tsx`
- `src/app/login/page.tsx`
- các helper liên quan auth/permission nếu cần

### Việc phải làm

1. Xác định mô hình auth hiện tại đang dùng demo ở đâu.
2. Chuẩn hóa lại auth store để có thể dùng user thật cho pilot.
3. Gắn user context ổn định cho các flow pilot.
4. Tạo cơ chế guard route cơ bản cho các page pilot.
5. Nếu chưa thể làm auth full thật, phải tạo lớp chuyển tiếp rõ ràng:
   - không dùng hard-code account rải rác
   - không để page core tự bịa user

### Việc không được làm

- Không refactor toàn bộ hệ thống RBAC
- Không sửa các module KPI/career/learning
- Không làm thay đổi lớn ở dashboard ngoài phần user source

### Acceptance criteria

- Không còn flow pilot nào tự tạo user cứng
- `login -> vào app -> đọc đúng user -> route core được bảo vệ` chạy thông suốt
- Có thể mô tả user pilot đăng nhập như thế nào

### Mẫu báo cáo bắt buộc khi xong

- Đã sửa file:
- Cơ chế auth mới/tạm thời hoạt động ra sao:
- Những page pilot nào đã đọc được user thật:
- Còn mock/demo nào chưa loại bỏ được:
- Rủi ro còn lại:

### Prompt giao cho AI-1

```text
Bạn phụ trách Auth + Session + User Context cho pilot HRM.

Mục tiêu:
- Làm cho các flow pilot dùng đúng user đăng nhập
- Không còn lệ thuộc vào user demo cứng trong flow core
- Có route protection cơ bản cho các page pilot

Phạm vi được sửa:
- src/store/auth-store.ts
- src/lib/supabase.ts
- src/middleware.ts
- src/components/auth/ProtectedRoute.tsx
- src/app/login/page.tsx
- file helper auth/permission liên quan nếu thật sự cần

Không được sửa lan sang:
- KPI
- Career
- Learning
- Wellness
- Gamification

Yêu cầu bắt buộc:
- Không hard-code user trong flow pilot
- Không xóa bừa logic cũ nếu chưa có thay thế
- Nếu auth full chưa làm xong, vẫn phải tạo lớp chuyển tiếp rõ ràng và dùng chung cho pilot

Khi xong phải báo:
- file đã sửa
- thay đổi chính
- cách test tay
- assumption
- blocker
```

---

## AI-2 - Dữ liệu nhân sự và dữ liệu gốc

### Mục tiêu

Tạo nền dữ liệu thật cho pilot store:
- nhân viên
- cửa hàng
- vị trí
- ca làm

### Kết quả đầu ra bắt buộc

- Danh sách nhân viên dùng dữ liệu thật hoặc lớp dữ liệu pilot chuẩn
- Trang chi tiết nhân viên dùng dữ liệu thật
- Form thêm/cập nhật nhân viên không chỉ là giả lập
- Có nguồn dữ liệu thống nhất cho employee/store/position/shift

### Phạm vi file ưu tiên đọc trước

- `src/app/employees/page.tsx`
- `src/app/employees/[id]/page.tsx`
- `src/app/employees/new/page.tsx`
- `src/lib/mock-data.ts`
- `src/lib/supabase.ts`
- `supabase/schema.sql`
- `supabase/schema-v2.sql`

### Phạm vi file có thể phải sửa

- `src/app/employees/page.tsx`
- `src/app/employees/[id]/page.tsx`
- `src/app/employees/new/page.tsx`
- service/helper dữ liệu nhân sự mới nếu cần
- schema/seed pilot nếu cần

### Việc phải làm

1. Xác định lớp dữ liệu nào sẽ dùng cho pilot employee.
2. Chuẩn hóa model hiển thị của employee cho app.
3. Thay list/detail/new employee khỏi phụ thuộc hoàn toàn vào mock.
4. Chuẩn bị dữ liệu pilot đủ cho 1 cửa hàng.
5. Đảm bảo các flow khác có thể tái sử dụng nguồn employee/store/position/shift này.

### Việc không được làm

- Không redesign toàn bộ employee pages
- Không thêm quá nhiều trường ngoài scope pilot
- Không đụng payroll

### Acceptance criteria

- Nhân sự pilot không còn là màn hình đọc dữ liệu chết
- Có thể thêm/sửa nhân viên cơ bản ở mức pilot
- Các flow khác có thể truy ngược employee/store/position/shift ổn định

### Mẫu báo cáo bắt buộc khi xong

- Đã sửa file:
- Nguồn dữ liệu pilot đang dùng:
- CRUD nào đã thật, CRUD nào còn tạm:
- Những field employee đã hỗ trợ:
- Việc còn lại:

### Prompt giao cho AI-2

```text
Bạn phụ trách dữ liệu nhân sự và dữ liệu gốc cho pilot store.

Mục tiêu:
- Employee/store/position/shift phải trở thành nguồn dữ liệu dùng được cho pilot
- Trang nhân sự không còn chỉ đọc mock chết

Phạm vi được sửa:
- src/app/employees/page.tsx
- src/app/employees/[id]/page.tsx
- src/app/employees/new/page.tsx
- service/helper dữ liệu nhân sự liên quan
- seed/schema pilot nếu thật sự cần

Không được làm:
- Không redesign lớn
- Không mở rộng quá scope pilot
- Không đụng KPI, payroll

Yêu cầu:
- Ưu tiên tính đúng dữ liệu
- Có thể dùng tạm data layer pilot, nhưng phải thống nhất, không rải mock khắp nơi
- Form thêm nhân viên phải có tác dụng thật ở mức pilot

Khi xong phải báo:
- file đã sửa
- data source đã dùng
- cách test tay
- assumption
- blocker
```

---

## AI-3 - Scheduling Pilot

### Mục tiêu

Làm cho lịch làm tuần hoạt động được ở mức pilot:
- quản lý xếp ca
- lưu ca
- publish lịch
- nhân viên xem đúng lịch đã publish

### Kết quả đầu ra bắt buộc

- Có trạng thái lịch tối thiểu: nháp / đã publish
- Quản lý lưu được lịch tuần cho pilot store
- Nhân viên xem đúng lịch cá nhân
- Không còn phụ thuộc hoàn toàn vào mock cho lịch pilot

### Phạm vi file ưu tiên đọc trước

- `src/app/schedule/page.tsx`
- `src/app/schedule/assign/page.tsx`
- `src/app/schedule/manage/page.tsx`
- `src/app/schedule/by-shift/page.tsx`
- `src/lib/mock-data.ts`
- `src/lib/mock-data-scheduling.ts`
- `src/lib/mock-data-open-shifts.ts`

### Phạm vi file có thể phải sửa

- `src/app/schedule/page.tsx`
- `src/app/schedule/assign/page.tsx`
- các service dữ liệu lịch liên quan
- helper publish state nếu cần thêm

### Việc phải làm

1. Chốt 1 nguồn dữ liệu lịch pilot.
2. Tạo hoặc chuẩn hóa trạng thái nháp / publish.
3. Bảo đảm manager thao tác trên lịch của pilot store.
4. Bảo đảm employee chỉ xem lịch của mình và ưu tiên lịch đã publish.
5. Nếu open shift/swap chưa thể nâng thật, phải giữ chúng không phá flow chính.

### Việc không được làm

- Không mở rộng sang auto-scheduling nâng cao
- Không làm thêm tính năng mới ngoài publish flow
- Không đụng sang attendance nếu không bắt buộc

### Acceptance criteria

- Quản lý tạo/lưu/publish được tuần lịch pilot
- Nhân viên nhìn thấy đúng lịch đã publish
- Flow lịch không còn chỉ là UI demo

### Mẫu báo cáo bắt buộc khi xong

- Đã sửa file:
- Lịch pilot hiện lấy từ đâu:
- Publish state được lưu ra sao:
- Manager test như thế nào:
- Employee test như thế nào:

### Prompt giao cho AI-3

```text
Bạn phụ trách Scheduling cho pilot store.

Mục tiêu:
- Quản lý xếp ca được
- Có trạng thái nháp và đã publish
- Nhân viên xem đúng lịch đã publish của mình

Phạm vi được sửa:
- src/app/schedule/page.tsx
- src/app/schedule/assign/page.tsx
- service/helper dữ liệu lịch liên quan

Không được làm:
- Không mở rộng auto-scheduler
- Không redesign toàn bộ module lịch
- Không xử lý KPI hay payroll

Yêu cầu:
- Phải có nguồn dữ liệu lịch thống nhất cho pilot
- Phải có publish flow tối thiểu
- Nhân viên không xem lịch ngẫu nhiên hoặc lịch nháp của người khác

Khi xong phải báo:
- file đã sửa
- dữ liệu lịch đang dùng
- cách test manager
- cách test employee
- assumption
- blocker
```

---

## AI-4 - Attendance Pilot

### Mục tiêu

Làm cho chấm công trở thành flow có thể test thật ở cửa hàng:
- check-in
- check-out
- trạng thái công hôm nay
- màn hình quản lý công theo ngày

### Kết quả đầu ra bắt buộc

- Employee check-in/check-out được ở mức pilot
- Quản lý xem được danh sách công ngày
- Có trạng thái ngoại lệ cơ bản
- Không còn chỉ ghi local kiểu demo cho flow chính nếu đã có lớp dữ liệu thật

### Phạm vi file ưu tiên đọc trước

- `src/app/checkin/page.tsx`
- `src/app/attendance/page.tsx`
- `src/app/attendance/today/page.tsx`
- `src/app/attendance/by-date/page.tsx`
- `src/lib/mock-data-checkin.ts`
- `src/lib/offline-checkin.ts`
- `src/lib/leave-attendance-sync.ts`

### Phạm vi file có thể phải sửa

- `src/app/checkin/page.tsx`
- `src/app/attendance/today/page.tsx`
- service/helper attendance/checkin liên quan
- trạng thái ngoại lệ cơ bản nếu cần helper mới

### Việc phải làm

1. Chốt nguồn dữ liệu attendance/check-in cho pilot.
2. Gắn check-in/check-out với user thật.
3. Bảo đảm trạng thái công hôm nay đọc đúng dữ liệu.
4. Tạo lớp xem công theo ngày cho manager ở mức dùng được.
5. Nếu offline còn giữ, phải rõ:
   - cái gì là pilot-ready
   - cái gì vẫn là demo/tạm

### Việc không được làm

- Không mở rộng sâu tính năng thiết bị
- Không làm thêm dashboard toàn hệ thống
- Không đụng payroll

### Acceptance criteria

- Employee pilot check-in/check-out xong nhìn thấy trạng thái đúng
- Quản lý xem được công theo ngày
- Có ít nhất trạng thái ngoại lệ cơ bản như thiếu check-out hoặc công chưa hoàn tất

### Mẫu báo cáo bắt buộc khi xong

- Đã sửa file:
- Check-in/check-out đang ghi dữ liệu vào đâu:
- Trạng thái công hôm nay đọc từ đâu:
- Ngoại lệ nào đã hỗ trợ:
- Phần offline hiện còn là gì:

### Prompt giao cho AI-4

```text
Bạn phụ trách Attendance cho pilot store.

Mục tiêu:
- Check-in/check-out dùng được cho pilot
- Có trạng thái công hôm nay
- Quản lý xem được công theo ngày

Phạm vi được sửa:
- src/app/checkin/page.tsx
- src/app/attendance/today/page.tsx
- helper/service attendance liên quan

Không được làm:
- Không mở rộng feature thiết bị lớn
- Không đụng payroll
- Không sửa lan sang các module phụ

Yêu cầu:
- User phải là user thật
- Dữ liệu công phải nhất quán trong phạm vi pilot
- Nếu giữ offline mode thì phải nói rõ giới hạn

Khi xong phải báo:
- file đã sửa
- data flow check-in/check-out
- cách test employee
- cách test manager
- assumption
- blocker
```

---

## AI-5 - Leave Pilot

### Mục tiêu

Làm cho nghỉ phép trở thành flow đúng user, đúng quyền, đúng danh sách.

### Kết quả đầu ra bắt buộc

- Không còn `currentEmployeeId` cứng cho flow chính
- Employee gửi đơn bằng user thật
- Quản lý duyệt đúng scope
- Danh sách đơn hiển thị đúng vai trò

### Phạm vi file ưu tiên đọc trước

- `src/app/leave/page.tsx`
- `src/app/leave/request/page.tsx`
- `src/app/leave/approval/page.tsx`
- `src/lib/mock-data-leave.ts`
- `src/lib/quota-service.ts`
- `src/lib/leave-attendance-sync.ts`

### Phạm vi file có thể phải sửa

- `src/app/leave/request/page.tsx`
- `src/app/leave/page.tsx`
- helper/service leave liên quan

### Việc phải làm

1. Loại bỏ employee cứng khỏi leave flow.
2. Gắn request list và create request với user thật.
3. Gắn approval list với manager role ở phạm vi pilot store.
4. Giữ quota logic ở mức đủ dùng nếu chưa thể làm full.
5. Nếu có tác động sang attendance thì đồng bộ ở mức tối thiểu và không làm vỡ flow.

### Việc không được làm

- Không mở rộng policy nghỉ phép phức tạp
- Không làm lại toàn bộ UI leave
- Không đụng payroll

### Acceptance criteria

- Employee pilot gửi đơn nghỉ đúng user
- Manager pilot nhìn thấy đúng đơn cần duyệt
- Không còn hard-code `emp-005` trong leave flow chính

### Mẫu báo cáo bắt buộc khi xong

- Đã sửa file:
- User nào gửi đơn sẽ đi qua dữ liệu nào:
- Manager lấy danh sách duyệt bằng rule gì:
- Quota logic giữ lại phần nào:
- Còn hạn chế gì:

### Prompt giao cho AI-5

```text
Bạn phụ trách Leave cho pilot store.

Mục tiêu:
- Loại bỏ hard-code employee trong leave flow
- Employee gửi đơn đúng user
- Manager duyệt đúng scope pilot

Phạm vi được sửa:
- src/app/leave/request/page.tsx
- src/app/leave/page.tsx
- helper/service leave liên quan

Không được làm:
- Không mở rộng policy nghỉ phép phức tạp
- Không redesign toàn bộ UI
- Không đụng payroll

Yêu cầu:
- currentEmployeeId cứng phải biến mất khỏi flow chính
- Danh sách đơn phải đúng theo vai trò
- Nếu có đồng bộ attendance thì chỉ làm phần tối thiểu, an toàn

Khi xong phải báo:
- file đã sửa
- cách user gửi đơn
- cách manager duyệt
- assumption
- blocker
```

---

## AI-6 - QA/Review phụ

### Mục tiêu

Sau khi AI-1 đến AI-5 hoàn tất, AI-6 chỉ làm nhiệm vụ rà soát và bắt lỗi.

### Không phải mục tiêu

- Không code mới lớn
- Không refactor

### Việc phải làm

1. Test theo vai trò:
   - employee
   - store_manager
   - hr_admin nếu liên quan
2. Bắt các lỗi:
   - sai user
   - sai quyền
   - màn hình trắng
   - page pilot còn phụ thuộc mock/hard-code
   - flow không khép kín
3. Chỉ tạo patch nhỏ nếu lỗi hiển nhiên và an toàn.

### Prompt giao cho AI-6

```text
Bạn là AI review phụ cho pilot store.

Nhiệm vụ:
- Không làm feature mới
- Chỉ rà soát các flow pilot sau khi worker khác xong
- Bắt lỗi sai user, sai quyền, sai dữ liệu, regression bề mặt

Flow cần rà:
- login
- employees cơ bản
- schedule
- check-in/attendance
- leave

Khi báo cáo phải có:
- finding theo mức độ
- file liên quan
- cách tái hiện
- patch nhỏ nếu thật sự an toàn
```

---

## 8. Mẫu checklist review khi AI code trả bài

Người review cuối dùng checklist này:

### A. Đúng scope chưa

- Có sửa ngoài phạm vi không
- Có đụng module không liên quan không

### B. Đúng user chưa

- Có còn hard-code user không
- Có chỗ nào vẫn lấy sai employee không

### C. Đúng quyền chưa

- Employee có thấy thứ không nên thấy không
- Manager có thiếu quyền tác nghiệp không

### D. Đúng dữ liệu chưa

- Dữ liệu lấy từ nguồn nào
- Có còn mock chen vào luồng chính không

### E. Flow có khép kín chưa

- User bấm xong thì dữ liệu thay đổi thật chưa
- Hay chỉ toast thành công

### F. Có regression rõ không

- Vỡ layout
- Vỡ điều hướng
- Vỡ page khác

---

## 9. Cách chạy triển khai thực tế

Mình đề xuất chạy theo 3 nhịp:

### Nhịp 1 - Chạy nền

Giao:
- AI-1
- AI-2

Chỉ khi 2 AI này xong tương đối mới sang nhịp 2.

### Nhịp 2 - Chạy flow core

Giao song song:
- AI-3
- AI-4
- AI-5

### Nhịp 3 - Soát

Giao:
- AI-6

Sau đó người điều phối tổng hợp, rà lại và chốt fix cuối.

---

## 10. Những thông tin cần bạn chốt trước khi cho AI code chạy thật

Mình vẫn làm được bộ giao việc ngay cả khi chưa có câu trả lời, nhưng để giao chính xác hơn thì bạn nên chốt 6 thông tin sau:

### 1. Pilot store là cửa hàng nào?

Ví dụ:
- `store-001`

Nếu chưa chốt, mình sẽ tạm coi pilot store là `store-001`.

### 2. Muốn auth thật ngay hay auth chuyển tiếp?

Chọn 1 trong 2:
- Auth thật với Supabase ngay
- Hoặc auth chuyển tiếp nhưng dữ liệu core đã thật

Nếu chưa chốt, mình khuyên:
- `auth chuyển tiếp rõ ràng ở Sprint 1`
- rồi nâng auth thật ngay sau đó

### 3. Có muốn giữ offline check-in trong phạm vi pilot không?

Chọn 1 trong 2:
- Giữ nhưng ghi rõ là tính năng beta trong pilot
- Hoặc tạm hạ ưu tiên để chốt online attendance trước

Nếu chưa chốt, mình khuyên:
- `ưu tiên online attendance trước`
- offline để sau một nhịp

### 4. Có bao nhiêu AI code worker dự kiến dùng thật?

Nếu ít hơn 5 worker, mình sẽ gộp việc lại để bạn giao dễ hơn.

### 5. Có muốn payroll bị khóa quyền mạnh trong đợt này không?

Mình khuyên:
- Có

Tức là:
- chưa mở rộng payroll
- chỉ giữ an toàn, không để lộ dữ liệu

### 6. Có muốn mình làm tiếp file phân việc dạng bảng task rất ngắn để copy vào Jira/Trello không?

Nếu có, bước tiếp theo mình sẽ làm:
- `BACKLOG_PILOT_AI_CODE_JIRA_READY.md`

---

## 10A. Thông tin đã chốt cho đợt này

Các quyết định đã được chốt để dùng cho toàn bộ đợt pilot:

- `Pilot store`: `store-001`
- `Auth`: chuyển tiếp trước, harden sau
- `Offline check-in`: vẫn giữ trong pilot, nhưng không là blocker của Sprint 1; ưu tiên chốt online attendance trước
- `Số AI code worker`: `1`
- `Payroll`: xem là vùng khóa an toàn, chưa mở rộng tính năng, chỉ siết tránh lộ dữ liệu

Hệ quả triển khai:

- Không chạy nhiều AI code song song ở đợt này
- Giao việc sẽ chuyển sang dạng tuần tự cho `1 worker`
- Worker phải hoàn thành từng block rồi mới sang block tiếp theo
- Các task payroll chỉ được phép sửa nếu liên quan tới khóa quyền hoặc ngăn lộ dữ liệu

---

## 11. Kết luận cuối

Tài liệu này đã ở mức có thể giao việc cho AI code ngay.

Thứ tự dùng đúng là:
- Đưa AI-1 và AI-2 chạy trước
- Xong thì mới thả AI-3, AI-4, AI-5
- Cuối cùng AI-6 đi rà

Nếu bạn muốn, bước tiếp theo mình sẽ làm một file rất thực dụng nữa:

### `BACKLOG_PILOT_AI_CODE_JIRA_READY.md`

File đó sẽ gồm:
- Mỗi task 1 dòng
- Có `title`
- `owner`
- `priority`
- `depends on`
- `definition of done`

để bạn copy thẳng cho team hoặc cho AI code runner.
