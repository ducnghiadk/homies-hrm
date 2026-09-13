# Backlog icon răng cưa mở cài đặt toàn web

## 1. Mục tiêu

Lưu backlog cho pattern:

- khối hoặc bảng nào có `setting` thật đứng sau
- thì hiện `icon răng cưa`
- bấm vào sẽ nhảy tới đúng `trang cài đặt + section liên quan`

Pattern này nhằm giảm thời gian tìm đường:

- người vận hành đang xem số liệu hoặc bảng
- thấy rule chưa đúng
- bấm ngay vào đúng chỗ cấu hình thay vì tự nhớ đường đi

## 2. Pattern đã chốt

### 2.1. Cách mở

Chốt hướng:

- `icon răng cưa` sẽ `nhảy sang trang setting`
- chưa làm `drawer/modal setting nhanh` ở giai đoạn này

Lý do:

- nhanh làm
- ít rủi ro
- hợp với app hiện có vì setting đang nằm rải theo từng module

### 2.2. Rule hiển thị

Chỉ hiện icon khi:

- khối đó có `setting thật`
- user có quyền vào setting đó

Không hiện icon khi:

- chỉ là màn xem dữ liệu
- chưa có setting riêng rõ ràng
- bấm vào sẽ không dẫn tới nơi cấu hình có ý nghĩa

### 2.3. UI chung

- đặt icon ở góc phải header khối
- có tooltip: `Mở cài đặt liên quan`
- ưu tiên nhảy tới `anchor section` thay vì chỉ nhảy đầu trang

### 2.4. Rule chốt thêm

- icon răng cưa map theo `khu vực có setting`, không map theo `status`
- icon giữ nguyên vị trí giữa các trạng thái
- thứ thay đổi theo `status` là badge, alert, text và nút hành động
- mỗi block chỉ nên có `1 icon răng cưa`
- không đặt icon trong badge, alert, hoặc từng dòng của bảng

## 3. Map full web

## 3.1. Nhân sự và onboarding

### Có icon

- `Hồ sơ nhân sự /employees/[id]`
  - đặt ở header card `Nội quy`
  - đích: `/career-path/settings#onboarding-policy`
- `Onboarding /onboarding`
  - đặt ở header block `Nội quy / checklist ngày đầu`
  - đích: `/career-path/settings#onboarding-policy`
- `Career path onboarding /career-path/onboarding`
  - đặt ở header block onboarding
  - đích: `/career-path/settings#onboarding-policy`
- `Chi tiết hợp đồng /employees/contracts/[id]`
  - đặt ở header block `Flow nhận việc / nội quy`
  - đích: `/career-path/settings#onboarding-policy`
- `Lời mời nhân sự /employees/invitations`
  - đặt ở header bảng hoặc header trang
  - đích: `/career-path/settings#onboarding-policy`
- `Tạo lời mời /employees/invitations/new`
  - đặt ở header block cấu hình lời mời nếu cần
  - đích: `/career-path/settings#onboarding-policy`

### Chưa nên có

- `Trung tâm nhân sự /employees`

Lý do:

- trang này nên giữ nhẹ, chỉ đọc trạng thái nhanh
- setting nên đi từ block nghiệp vụ cụ thể hơn

## 3.2. Scheduling

### Có icon

- `Board tuần /schedules`
  - đặt ở header board
  - đích: `/settings/schedule-rules#weekly-board-rules`
- `Quản lý lịch /schedule/manage`
  - đặt ở header toolbar
  - đích: `/settings/schedule-rules#weekly-board-rules`
- `Shift templates /schedule/templates`
  - đặt ở header bảng template ca
  - đích: `/settings/schedule-rules/shifts#shift-templates`
- `Preference ca /schedule/preferences`
  - đặt ở header block preference
  - đích: `/settings/schedule-rules/preferences#shift-preferences`
- `Open shifts /schedule/open-shifts`
  - đặt ở header block open shift
  - đích: `/settings/schedule-rules#open-shift-rules`
- `Đổi ca /schedule/swap`
  - đặt ở header block đổi ca
  - đích: `/settings/schedule-rules/preferences#swap-rules`
- `Staffing /staffing`
  - đặt ở header block staffing
  - đích: `/settings/staffing#staffing-rules`
- `Staffing calculator /settings/staffing`
  - đặt ở header card máy tính định biên
  - đích: `/settings/staffing/calculator#staffing-calculator`

### Không cần icon

- `Lịch cá nhân /schedule`
- `Lịch cá nhân /my-schedule`
- `Lịch sử publish /schedule/history`

Lý do:

- đây là màn thao tác hoặc màn xem dữ liệu
- không phải nơi cấu hình rule hệ thống

## 3.3. Chấm công

### Có icon

- `Attendance /attendance`
  - đặt ở header trang
  - đích: `/settings/wifi#wifi-checkin`
- `Attendance theo chi nhánh /attendance/by-store`
  - đặt ở header bảng chi nhánh
  - đích: `/settings/wifi#wifi-checkin`
- `Thiết bị chấm công /attendance/devices`
  - đặt ở header block thiết bị
  - đích: `/settings/system#attendance-devices`
- `Cảnh báo thiết bị /attendance/device-alerts`
  - đặt ở header block cảnh báo
  - đích: `/settings/system#attendance-devices`
- `Check-in /checkin`
  - đặt ở header block check-in
  - đích: `/settings/wifi#wifi-checkin`
- `Chỉnh công /attendance/manual`
  - đặt ở header block chỉnh công
  - đích: `/settings/permissions#attendance-manual-adjustment`

## 3.4. KPI và đánh giá

### Có icon

- `KPI tổng quan /kpi`
  - đặt ở header trang
  - đích: `/kpi/settings#kpi-rules`
- `Review KPI /kpi/review`
  - đặt ở header block rule review
  - đích: `/kpi/settings#kpi-rules`
- `Đánh giá KPI /kpi/evaluate`
  - đặt ở header block form đánh giá
  - đích: `/kpi/settings#kpi-rules`
- `Vi phạm /kpi/violations`
  - đặt ở header block vi phạm
  - đích: `/kpi/settings#violation-rules`
- `Leaderboard KPI /kpi/leaderboard`
  - đặt ở header block xếp hạng
  - đích: `/kpi/settings#leaderboard-rules`
- `Xét thăng tiến KPI /kpi/promotion`
  - đặt ở header block liên kết thăng tiến
  - đích: `/career-path/settings#promotion-rules`

### Không cần icon

- `Báo cáo KPI /kpi/reports`

Lý do:

- chủ yếu là màn đọc báo cáo

## 3.5. Lương và nghỉ phép

### Có icon

- `Payroll tổng quan /payroll`
  - đặt ở header trang lương
  - đích: `/settings/payroll#payroll-policy`
- `Tính lương /payroll/calculate`
  - đặt ở header block tính lương
  - đích: `/settings/payroll#payroll-policy`
- `Thưởng /payroll/bonus`
  - đặt ở header block thưởng
  - đích: `/settings/payroll#bonus-policy`
- `Khấu trừ /payroll/deductions`
  - đặt ở header block khấu trừ
  - đích: `/settings/payroll#deduction-policy`
- `Bảo hiểm /payroll/insurance`
  - đặt ở header block bảo hiểm
  - đích: `/settings/payroll#insurance-policy`
- `Tạm ứng /payroll/advance`
  - đặt ở header block tạm ứng
  - đích: `/settings/payroll#advance-policy`
- `Leave tổng quan /leave`
  - đặt ở header trang nghỉ phép
  - đích: `/settings/payroll#leave-policy`
- `Số dư phép /leave/balance`
  - đặt ở header block quota phép
  - đích: `/settings/payroll#leave-policy`
- `Duyệt nghỉ phép /leave/approval`
  - đặt ở header block rule duyệt phép
  - đích: `/settings/permissions#leave-approval-policy`

### Không cần icon

- `Tạo đơn nghỉ /leave/request`

Lý do:

- đây là màn tạo giao dịch

## 3.6. Career Path và phát triển

### Có icon

- `Career path tổng quan /career-path`
  - đặt ở header trang
  - đích: `/career-path/settings#general`
- `Mục tiêu /career-path/goals`
  - đặt ở header block mục tiêu
  - đích: `/career-path/settings#goals`
- `Thăng tiến /career-path/promotion`
  - đặt ở header block rule thăng tiến
  - đích: `/career-path/settings#promotion-rules`
- `Kỹ năng /career-path/skills`
  - đặt ở header block kỹ năng
  - đích: `/career-path/settings#skills-framework`
- `Yêu cầu /career-path/requests`
  - đặt ở header block yêu cầu
  - đích: `/career-path/settings#requests`
- `Báo cáo /career-path/reports`
  - đặt ở header block báo cáo
  - đích: `/career-path/settings#reports`
- `Thông báo /career-path/notifications`
  - đặt ở header block thông báo
  - đích: `/career-path/settings#notifications`

### Cân nhắc sau

- `Learning /learning`
- `Recognition /recognition`
- `Rewards /rewards`
- `Gamification /gamification`
- `Wellness /wellness`

Lý do:

- cần chốt rõ có setting riêng thật hay chỉ là màn nội dung

## 3.7. Quyền, dữ liệu gốc, hệ thống

### Có icon

- `RBAC /rbac`
  - đặt ở header trang
  - đích: `/settings/permissions#role-matrix`
- `Admin /admin`
  - đặt ở header từng block quản trị
  - đích: `/settings/system#admin-controls`
- `Settings /settings`
  - đặt ở từng card setting con
  - đích: route con tương ứng
- `Master data /settings/master-data`
  - đặt ở header từng bảng dữ liệu
  - đích: `/settings/master-data`
- `Permissions /settings/permissions`
  - đặt ở header từng block quyền
  - đích: `/settings/permissions`
- `System /settings/system`
  - đặt ở header từng block hệ thống
  - đích: `/settings/system`
- `Labor cost /settings/labor-cost`
  - đặt ở header block labor cost
  - đích: `/settings/labor-cost#cost-rules`

## 3.8. Operations nội bộ

### Có thể có sau

- `Task templates /tasks/templates`
  - đích đề xuất: `/tasks/templates#template-settings`
- `Policies /policies`
  - đích đề xuất: `/policies#policy-settings`

### Không nên có lúc này

- `Tasks daily /tasks/daily`
- `Handover /tasks/handover`
- `Incidents /tasks/incidents`
- `Chat /chat`
- `News /news`
- `Notifications /notifications`
- `Reports /reports`
- `Analytics /analytics`

Lý do:

- đây là màn giao dịch, đọc dữ liệu, hoặc cần chốt thêm rule đích trước khi gắn icon

## 4. Ưu tiên rollout

### Pass 1

- `Hồ sơ nhân sự /employees/[id]`
- `Onboarding /onboarding`
- `Board tuần /schedules`
- `Staffing /staffing`
- `Payroll tổng quan /payroll`
- `KPI tổng quan /kpi`

### Pass 2

- `Leave /leave`
- `Career path /career-path`
- `Attendance devices /attendance/devices`

### Pass 3

- `Task templates /tasks/templates`
- `Policies /policies`
- `Inventory /inventory`
- `Contracts` nếu sau này có khu setting riêng rõ

## 5. Cần chuẩn bị trước khi code

Trước khi rollout thật, nên có:

1. `setting link registry` dùng chung
2. rule `module nào có setting thật mới có icon`
3. rule ẩn icon theo quyền user
4. quy ước anchor section cho từng trang setting
5. checklist verify:
   - bấm từ đúng block
   - nhảy đúng route
   - nhảy đúng section
   - không hiện icon ở màn không có setting
