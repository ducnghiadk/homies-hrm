# Handoff Task 01 - HRM Pilot Ready v1

## 1. Quyết định đã chốt
- **Pilot store**: store-001
- **Auth**: Chuyển tiếp trước, Harden sau. Gỡ bỏ dấu hiệu Demo mode.
- **Offline check-in**: Giữ trong pilot nhưng KHÔNG là blocker; ưu tiên online attendance trước.
- **Payroll**: Vùng khóa an toàn, chưa mở rộng tính năng.
- **AI Code Worker**: Chỉ có 1, làm tuần tự.

## 2. Quyết định kỹ thuật bắt buộc
- CHƯA nối page write thẳng vào Supabase. Phải đi qua **Service Layer**.
- Với `employees/new`, dùng Service Layer + LocalStorage trước. Sau này mới đổi Adapter sang Supabase.
- KHÔNG đổi model `users` sang `profiles` nếu chưa có quyết định mới.
- KHÔNG mở rộng scope KPI/Career/Learning.

## 3. Chính sách dữ liệu nhân sự (Data Policy)
- `store_manager`: Chỉ thấy nhân viên thuộc store mình quản lý.
- `shift_leader`: Chỉ thấy nhân viên store mình.
- `hr_admin` & `ceo`: Thấy toàn công ty.
- `employee`: Không xem danh sách toàn công ty (Chỉ xem bản thân nếu cần).

## 4. Những việc phải ưu tiên tiếp theo (Backlog)
1. Chuẩn hóa auth và user context.
2. Guard route core.
3. Tạo employee service layer.
4. Chuyển employees list/detail/new sang service layer.
5. Chuẩn bị SQL pilot cho Supabase.

## 5. Những lỗi đã biết cần xử lý (Known Issues)
- `leave/request/page.tsx`: Đang hard-code `currentEmployeeId = 'emp-005'`
- `employees/page.tsx`: Đang lộ toàn bộ nhân sự công ty.
- `employees/new/page.tsx`: Chưa save thật.
- `attendance/by-date/page.tsx`: Đang hard-code ngày mặc định.
- `auth-store`, `supabase`, `middleware`: Vẫn còn dấu hiệu demo mode.
