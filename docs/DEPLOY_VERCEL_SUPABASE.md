# Hướng Dẫn Đưa Homies HRM Lên Mạng Chạy Thật (Vercel + Supabase)

Tài liệu này dành cho Chủ thương hiệu không chuyên kỹ thuật — chỉ cần làm đúng **4 bước** bên dưới (khoảng 10 phút) là toàn bộ nhân viên có thể mở web trên điện thoại để đăng ký ca, chấm công, xem lịch và lưu dữ liệu bền vững vĩnh viễn trên đám mây.

---

## Bước 1: Tạo một kho dữ liệu Supabase mới (Miễn phí)

1. Truy cập `https://supabase.com/dashboard` và đăng nhập tài khoản của anh.
2. Bấm **New Project** $\rightarrow$ đặt tên ví dụ: `homies-hrm-prod`.
3. Ở mục **Region**, chọn **Southeast Asia (Singapore)** để nhân viên ở Việt Nam mở app nhanh nhất.
4. Đặt mật khẩu Database (lưu lại ở chỗ riêng để phòng khi cần), rồi bấm **Create new project** và chờ 1–2 phút cho Supabase khởi tạo xong.

---

## Bước 2: Chạy đoạn lệnh tạo bảng lưu trữ

1. Trong trang quản trị dự án Supabase vừa tạo, nhìn cột menu bên trái, bấm vào **SQL Editor**.
2. Bấm **New query**.
3. Mở file [schema_v5_runtime_persistence.sql](file:///h:/hrm-tra-sua-3535/supabase/schema_v5_runtime_persistence.sql) trong dự án này, copy toàn bộ nội dung dán vào ô soạn thảo trên Supabase.
4. Bấm nút **Run** (góc dưới bên phải). Khi thấy báo thành công (`Success`) là xong Bước 2.

---

## Bước 3: Lấy 3 chìa khóa và gắn vào Vercel

1. Trong Supabase, vào **Project Settings** (biểu tượng bánh răng ở menu trái) $\rightarrow$ chọn **API Keys / Data API** (hoặc **API**):
   * Copy **Project URL** $\rightarrow$ đây là giá trị cho **`NEXT_PUBLIC_SUPABASE_URL`**.
   * Copy khóa công khai (**`anon` / `publishable`**) $\rightarrow$ đây là giá trị cho **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**.
   * Copy khóa bí mật (**`service_role` / `secret`**) $\rightarrow$ đây là giá trị cho **`SUPABASE_SERVICE_ROLE_KEY`** *(chỉ dán ở cài đặt máy chủ, tuyệt đối không gửi ra ngoài)*.
2. Mở dự án trên **Vercel** $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**, thêm đầy đủ các biến sau (và chọn áp dụng cho Production):
   * `NEXT_PUBLIC_SUPABASE_URL` = *(Project URL vừa copy)*
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(khóa anon vừa copy)*
   * `SUPABASE_SERVICE_ROLE_KEY` = *(khóa `service_role` vừa copy — biến bí mật trên máy chủ)*
   * `NEXT_PUBLIC_USE_REAL_SUPABASE` = `true`
   * *(Nếu muốn tiếp tục bật đồng bộ iPOS trên mạng, gắn thêm các biến iPOS đang có trong `.env.local` gồm `IPOS_HRM_BASE_URL`, `STORE_ID_429`, `STORE_ID_HBP`.)*
3. Bấm **Redeploy** trên Vercel để ứng dụng nhận cấu hình mới. *(Nếu muốn chạy thử kết nối Supabase ngay trên máy cá nhân trước khi lên mạng, anh cũng dán 3 giá trị này thay cho link cũ trong file `.env.local` rồi khởi động lại máy chủ.)*

---

## Bước 4: Kiểm tra đèn xanh & Chọn chế độ vận hành

1. Mở ứng dụng Homies HRM sau khi triển khai, nhìn lên góc phải thanh đầu trang, bấm vào nút **Đồng bộ iPOS** (hoặc **Homies Tự Vận Hành**).
2. Kiểm tra ô **Kho Lưu Trữ Dữ Liệu**: nếu hiện màu xanh lá **`Supabase Đám Mây — Sẵn sàng Deploy`** là hệ thống đã nối kho đám mây thành công.
   * Ngay lần mở đầu tiên, hệ thống tự động đưa toàn bộ danh sách 2 cơ sở (`Hồ Bá Phấn`, `Đường 429`), nhân sự, ca làm và cấu hình lên Supabase một cách an toàn.
3. Gạt **Công tắc Tổng** theo nhu cầu thực tế của quán:
   * **Bật `Đồng bộ iPOS`**: Lấy vân tay, đăng ký ca, nhân sự song song từ hệ thống iPOS HRM.
   * **Tắt sang `Homies Tự Vận Hành`**: Nhân viên toàn quán đăng ký ca, chấm công QR/GPS, quản lý duyệt lịch hoàn toàn khép kín trực tiếp trên ứng dụng Homies HRM, lưu bền vững trên Supabase.
