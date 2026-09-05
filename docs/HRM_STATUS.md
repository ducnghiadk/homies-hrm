# Trạng thái HRM

## P2b - Đăng nhập thật bằng Supabase Auth

Trạng thái: ĐÃ HOÀN THÀNH.

Các việc đã hoàn tất:

- Đã gỡ `DEMO_ACCOUNTS`, `loginAsDemo`, `loginAsRole`, auto-login CEO và mock `validatePassword`.
- Đã xoá 2 route cửa hậu: `src/app/verify/` và `src/app/rbac/`. Trang `/verify` trước đây cho phép bất kỳ ai đăng nhập thành CEO bằng mã 6 số bất kỳ.
- Đăng nhập nay dùng `supabase.auth.signInWithPassword`, kiểm tra liên kết `auth_id` với `nhan_vien` và chặn tài khoản không ở trạng thái `hoat_dong`.
- Khôi phục phiên dùng `supabase.auth.getSession`, không còn đọc `localStorage hrm-auth-v2`.
- Đã xác minh bằng tay: đăng nhập thật chạy được với tài khoản `BH-001`.

## Trạng thái tài khoản

Mới tạo 1/16 tài khoản Auth: `BH-001`.

15 người còn lại sẽ tạo qua màn hình quản trị ở P2c, không tạo tay trong Dashboard.

## Nợ kỹ thuật mới

Bổ sung các mục sau, không xoá nợ kỹ thuật cũ:

1. Cookie `hrm-auth` và `hrm-role` vẫn do client tự ghi, middleware vẫn tin chúng. Có thể sửa bằng DevTools để giả mạo vai trò. Xử lý ở P2b-2. TUYỆT ĐỐI CHƯA DEPLOY.
2. Còn một hàm chuyển đổi vai trò tiếng Anh sang tiếng Việt trong `auth-store.ts`, đánh dấu TẠM THỜI, xoá ở P6.
3. `proxy.ts` còn liệt kê `/verify` và `/rbac` trong danh sách route public dù 2 trang đã xoá.
4. Trang `src/app/employees/page.tsx` nạp dữ liệu từ 3 nguồn: `employeeAdapter` (DB thật), `EmployeeService` (localStorage), `mock-data`. Phải gộp về một nguồn duy nhất trước khi công bố view cho LMS.
5. Dòng 612 và 634 của `employees/page.tsx` có nhánh dự phòng gọi `EmployeeService.getEmployeeById`, có thể trả về nhân viên ma từ `INITIAL_EMPLOYEES`.
6. `EmployeeService.resetEmployeePassword` ghi mật khẩu vào localStorage, không qua Supabase Auth. Thay ở P2c.
7. Email trong `DEMO_ACCOUNTS` cũ không khớp DB thật. Mã nhân viên đang có 3 định dạng (`BH-001`, `BH-0913`, `NV0008`), cần chuẩn hoá trước khi công bố cho LMS.
8. `next/font/google` cần mạng lúc build, nên cân nhắc chuyển sang `next/font/local`.
9. `tsconfig.json` chưa loại trừ thư mục `.next` khỏi phạm vi kiểm tra kiểu.

## Bước kế tiếp

P2b-2 thay cookie giả bằng xác thực session Supabase phía server trong middleware. Sau đó P2c làm màn hình HR quản lý tài khoản, rồi P5 siết RLS.
