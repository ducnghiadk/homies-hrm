# Handoff Tiếp Theo Cho AI Code

Ngày cập nhật: 2026-05-19

Mục tiêu:
- Truyền lại các quyết định đã được chốt sau `TASK-00`
- Giúp AI code nắm rõ hướng triển khai tiếp theo
- Tránh làm sai scope giữa `pilot`, `service layer`, `localStorage`, và `Supabase`

---

## 1. Bối cảnh đã chốt

- Mục tiêu hiện tại: `Pilot Ready v1`
- Pilot store: `store-001`
- Auth: `chuyển tiếp trước, harden sau`
- Offline check-in: `giữ trong pilot`, nhưng `không là blocker`; ưu tiên chốt online attendance trước
- Payroll: `vùng khóa an toàn`, chưa mở rộng tính năng, chỉ siết tránh lộ dữ liệu
- Chỉ có `1 AI code worker`, nên làm `tuần tự`, không mở rộng song song

Flow ưu tiên:
- login / user context
- employees cơ bản
- schedule
- attendance
- leave

Ngoài scope trước mắt:
- KPI
- Career path
- Learning
- Gamification
- Wellness
- Reports nâng cao
- Payroll feature mới

---

## 2. Các quyết định đã chốt với AI Plan

### 2.1 Thêm nhân sự mới

Quyết định:
- `Chưa nối thẳng page vào Supabase write ở bước này`
- `Làm qua service layer + localStorage trước`

Ý nghĩa:
- `employees/new/page.tsx` không được tự ghi localStorage trực tiếp nếu có thể tránh
- Cần tạo `employee service` hoặc `repository` cho pilot
- Adapter hiện tại của service có thể dùng `localStorage`
- Sau này đổi adapter sang Supabase thì page không phải sửa quá nhiều

Yêu cầu:
- Khi thêm nhân sự mới, danh sách ở `employees/page.tsx` phải cập nhật ngay
- Logic pilot phải đi qua một lớp service thống nhất

### 2.2 Chính sách xem danh sách nhân viên

Quyết định:
- `store_manager` chỉ thấy nhân viên thuộc cửa hàng mình quản lý
- `shift_leader` nếu có quyền vào màn hình này thì cũng chỉ thấy nhân viên thuộc cửa hàng mình
- `hr_admin` và `ceo` được thấy toàn bộ công ty
- `employee` không có quyền xem danh sách toàn công ty

Cho pilot hiện tại:
- Manager của `store-001` chỉ thấy nhân sự `store-001`
- Không hiển thị nhân sự `store-002`, `store-003` cho manager pilot
- Không hiển thị danh bạ toàn công ty cho store manager trong giai đoạn này

### 2.3 Supabase DB ban đầu

Quyết định:
- `Có, hãy chuẩn bị file SQL cho pilot`

Nhưng lưu ý:
- Chỉ làm `schema pilot tối thiểu`
- Không ôm toàn bộ hệ thống ngay
- Ưu tiên naming thống nhất với repo hiện tại
- Nếu schema hiện tại đi theo `users`, không tự ý đổi sang `profiles` nếu chưa có quyết định kiến trúc mới

Yêu cầu:
- Tạo file SQL riêng cho pilot, ví dụ:
  - `supabase/pilot_ready_v1_schema.sql`
  - `supabase/pilot_ready_v1_seed_store_001.sql`
- Chỉ cần phục vụ các bảng tối thiểu:
  - users
  - stores
  - positions
  - shifts
  - schedules
  - attendance
  - leave_requests
- Chưa mở rộng payroll schema trong nhịp này

### 2.4 Hướng kỹ thuật bắt buộc

Quyết định:
- `Không nối page thẳng vào Supabase ngay`
- `Phải đi qua service layer`

Thứ tự đúng:
1. Chuẩn hóa auth / user context
2. Guard route core
3. Tạo service layer cho dữ liệu pilot
4. Chuyển employees list/detail/new sang service layer
5. Sau đó mới tính chuyện thay adapter localStorage bằng Supabase

### 2.5 Attendance offline

Quyết định:
- Giữ trong pilot
- Nhưng không được làm blocker

Ý nghĩa:
- Online attendance phải chạy chắc trước
- Offline có thể đi qua service riêng
- Nếu chưa hoàn chỉnh đồng bộ, phải ghi rõ là `beta` hoặc `giới hạn`

---

## 3. Những phát hiện từ TASK-00 phải được coi là đầu vào bắt buộc

### 3.1 Leave đang hard-code user

Đã biết:
- `src/app/leave/request/page.tsx` đang hard-code `currentEmployeeId = 'emp-005'`
- Đồng thời còn tự gán tên, vị trí, store

Ý nghĩa:
- Đây là lỗi bắt buộc phải xử lý trong flow leave

### 3.2 Employees page đang lộ toàn bộ công ty

Đã biết:
- `src/app/employees/page.tsx` hiện hiển thị toàn bộ nhân sự

Ý nghĩa:
- Trái với chính sách pilot đã chốt
- Cần lọc theo role/store

### 3.3 Employees new chưa lưu thật

Đã biết:
- `src/app/employees/new/page.tsx` đang chỉ `setTimeout` rồi chuyển trang

Ý nghĩa:
- Phải chuyển sang cơ chế save qua service layer

### 3.4 Attendance có chỗ hard-code ngày

Đã biết:
- `src/app/attendance/by-date/page.tsx` đang default cứng vào `2026-02-15`

Ý nghĩa:
- Cần xem lại ở nhịp attendance, nhưng chưa phải việc đầu tiên nếu đang làm auth/data layer

### 3.5 Auth hiện tại vẫn dựa nhiều vào demo mode

Đã biết:
- `src/store/auth-store.ts` còn `MOCK_EMPLOYEES`
- `src/lib/supabase.ts` còn placeholder
- `src/middleware.ts` chưa enforce auth thật

Ý nghĩa:
- Không được tiếp tục làm flow pilot mà bỏ qua lớp user context

---

## 4. Chỉ đạo thực hiện ngay cho AI code

AI code phải đi đúng hướng này:

### Giai đoạn tiếp theo ưu tiên

#### A. Auth và user context

Mục tiêu:
- Mọi flow pilot dùng đúng user đăng nhập

#### B. Employee service layer

Mục tiêu:
- Tạo một lớp service thống nhất cho employee pilot
- Adapter hiện tại dùng localStorage

#### C. Employee list/detail/new

Mục tiêu:
- Đọc và ghi qua service layer
- Áp đúng rule phân quyền danh sách nhân sự

### Chưa làm ngay

- Chưa nối page viết thẳng vào Supabase
- Chưa mở rộng payroll
- Chưa làm offline sync hoàn chỉnh
- Chưa mở thêm flow ngoài pilot

---

## 5. Hướng triển khai cụ thể mà AI code nên làm

### Bước 1

Làm `TASK-01` và `TASK-02`:
- chuẩn hóa auth chuyển tiếp
- user context
- route guard cơ bản

### Bước 2

Làm `TASK-03`:
- tạo service layer cho employee/store/position/shift
- adapter trước mắt dùng localStorage hoặc lớp dữ liệu pilot thống nhất

### Bước 3

Làm `TASK-04`:
- sửa `employees/page.tsx`
- sửa `employees/[id]/page.tsx`
- sửa `employees/new/page.tsx`
- tất cả phải đi qua service layer

### Bước 4

Chuẩn bị thêm file SQL pilot:
- `supabase/pilot_ready_v1_schema.sql`
- `supabase/pilot_ready_v1_seed_store_001.sql`

Lưu ý:
- Đây là bước chuẩn bị backend schema pilot
- Không ép UI phụ thuộc trực tiếp DB write ngay ở nhịp này

---

## 6. Điều không được làm sai

AI code không được:
- tự ý đổi model `users` sang `profiles`
- nối page write thẳng vào Supabase trước khi có service layer
- cho store manager nhìn toàn bộ nhân sự công ty
- giữ nguyên hard-code employee trong leave flow
- mở thêm scope payroll
- mở rộng KPI/career/learning trong đợt này

---

## 7. Definition of Done cho nhịp tiếp theo

Nhịp tiếp theo chỉ được coi là đạt khi:

- Login và user context dùng được cho pilot
- Employee list/detail/new đi qua service layer
- Store manager của `store-001` chỉ thấy nhân sự `store-001`
- Add employee tạo ra dữ liệu thật ở mức pilot
- Có file SQL pilot để chuẩn bị Supabase

---

## 8. Prompt ngắn gửi cho AI code

```text
Đây là handoff sau TASK-00 cho project HRM Pilot Ready v1.

Các quyết định đã chốt:
- Pilot store: store-001
- Auth: chuyển tiếp trước, harden sau
- Offline check-in: giữ trong pilot nhưng không là blocker; ưu tiên online attendance trước
- Payroll: vùng khóa an toàn, chưa mở rộng
- Chỉ có 1 AI code worker nên làm tuần tự

Quyết định kỹ thuật bắt buộc:
- Chưa nối page write thẳng vào Supabase
- Phải đi qua service layer
- Với employees/new, dùng service layer + localStorage trước
- Sau này mới đổi adapter sang Supabase

Chính sách dữ liệu nhân sự:
- store_manager chỉ thấy nhân viên thuộc store mình quản lý
- shift_leader nếu có vào thì cũng chỉ thấy nhân viên store mình
- hr_admin và ceo thấy toàn công ty
- employee không xem danh sách toàn công ty

Những việc phải ưu tiên tiếp theo:
1. Chuẩn hóa auth và user context
2. Guard route core
3. Tạo employee service layer
4. Chuyển employees list/detail/new sang service layer
5. Chuẩn bị SQL pilot cho Supabase

Những lỗi đã biết cần coi là đầu vào:
- leave/request/page.tsx đang hard-code currentEmployeeId = 'emp-005'
- employees/page.tsx đang lộ toàn bộ nhân sự công ty
- employees/new/page.tsx chưa save thật
- attendance/by-date/page.tsx đang hard-code ngày mặc định
- auth-store, supabase, middleware vẫn còn dấu hiệu demo mode

Không được làm:
- không đổi model users sang profiles nếu chưa có quyết định mới
- không nối page trực tiếp vào Supabase write trước service layer
- không mở rộng payroll
- không mở thêm scope KPI/career/learning

Hãy dùng handoff này làm đầu vào cho task kế tiếp và bám đúng backlog pilot.
```

---

## 9. Kết luận

Handoff này dùng để AI code nắm rõ:
- những gì đã được chốt
- những gì chưa được phép làm
- thứ tự đúng phải làm tiếp theo

Nếu AI code bắt đầu ngay, nên đi tiếp từ:
- `TASK-01`
- rồi `TASK-02`
- rồi `TASK-03`
- rồi `TASK-04`

