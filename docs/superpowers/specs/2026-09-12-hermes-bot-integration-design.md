# Tài liệu Đặc tả Thiết kế: Tích hợp Bot Hermes vào Hệ thống Web HRM Trà Sữa

**Ngày tạo:** 2026-09-12  
**Trạng thái:** Bản thảo đã thống nhất (Ready for Spec Review)  
**Tác giả:** Antigravity & Tech Lead  

---

## 1. Tổng quan Mục tiêu & Phạm vi (Executive Summary)

Hệ thống tích hợp **Bot Hermes** (Autonomous Agent có khả năng đọc file, chạy lệnh, phân tích source code) vào nền tảng Web Next.js 16 + Supabase của chuỗi Trà Sữa với các mục tiêu trọng tâm:

1. **Local Dev Cockpit:** Trợ lý debug trực quan trên giao diện web cho lập trình viên ở môi trường phát triển (`NODE_ENV === 'development'`). Bắt lỗi tức thì, gọi Hermes đọc mã nguồn cục bộ, hiển thị code diff và hỗ trợ ghi đè file sửa lỗi trực tiếp.
2. **Production SRE & Tự động tạo GitHub PR:** Hệ thống bắt lỗi ngầm từ người dùng thật ở môi trường Production. Gom nhóm và chống spam lỗi (Deduplication), lưu vào hàng đợi Supabase. Worker Hermes độc lập sẽ đọc Git repository gốc và tự động mở **Pull Request** trên GitHub kèm giải thích nguyên nhân gốc rễ (Root Cause Analysis).
3. **Smart Bug Reporter (Dành cho Nhân viên):** Widget tương tác cho phép nhân viên (pha chế, thu ngân, kho) báo cáo sự cố nghiệp vụ bằng ngôn ngữ tự nhiên. Hệ thống tự chụp ngữ cảnh (màn hình, 5 network request gần nhất, state hiện tại) để Hermes hỗ trợ ngay lập tức và tạo ticket sửa lỗi kèm đầy đủ bối cảnh kỹ thuật.
4. **Admin / Manager Copilot (Dành cho Quản lý):** Trợ lý chuyên sâu trong trang quản trị cho các tài khoản có quyền `admin`/`manager` để hỏi đáp về tình trạng lỗi hệ thống, chẩn đoán hàm nghiệp vụ và rà soát logic source code an toàn.

---

## 2. Kiến trúc Hệ thống & Phân vùng Môi trường (System Architecture)

```
                            ┌────────────────────────────────────────────────────────┐
                            │                    NEXT.JS WEB APP                     │
                            │                                                        │
                            │  ┌────────────────────┐      ┌──────────────────────┐  │
                            │  │  Dev Cockpit UI    │      │  Smart Bug Reporter  │  │
                            │  │  (Chỉ bật ở Dev)   │      │  (Dành cho nhân viên)│  │
                            │  └─────────┬──────────┘      └──────────┬───────────┘  │
                            │            │                            │              │
                            │  ┌─────────┴──────────┐      ┌──────────┴───────────┐  │
                            │  │  Admin Copilot UI  │      │  Global Error Catch  │  │
                            │  │  (Role: Admin/Mgr) │      │  (Boundary + Window) │  │
                            │  └─────────┬──────────┘      └──────────┬───────────┘  │
                            └────────────┼────────────────────────────┼──────────────┘
                                         │ (Direct Dev API)           │ (Telemetry & Logs)
                                         ▼                            ▼
                           ┌───────────────────────────┐  ┌───────────────────────────┐
                           │   Hermes Local Agent      │  │     Supabase Database     │
                           │   (http://localhost:8000) │  │   - telemetry_error_logs  │
                           │                           │  │   - user_bug_reports      │
                           │   Đọc / Ghi file Local    │  │   - copilot_chat_sessions │
                           └───────────────────────────┘  └─────────────┬─────────────┘
                                                                        │
                                                                        ▼ (Async Queue)
                                                          ┌───────────────────────────┐
                                                          │   Hermes SRE Worker       │
                                                          │   (Service Role / Daemon) │
                                                          │                           │
                                                          │   - Đọc Git Repo / Commit │
                                                          │   - Mở GitHub PR Fix      │
                                                          └───────────────────────────┘
```

---

## 3. Thiết kế Chi tiết Từng Thành phần

### 3.1. Thành phần 1: Local Dev Cockpit (`src/components/dev/HermesDevCockpit.tsx`)

* **Phạm vi kích hoạt:** Chỉ được bundle và render khi `process.env.NODE_ENV === 'development'`.
* **Giao diện:**
  * Floating badge góc dưới màn hình hiển thị trạng thái kết nối tới Agent (`Online`/`Offline`) và số lượng lỗi bắt được trong phiên làm việc.
  * Khi mở rộng: Drawer chứa danh sách các lỗi unhandled runtime, console error, và API thất bại.
* **Tương tác với Local Hermes:**
  * Gọi trực tiếp `POST http://localhost:8000/api/dev/analyze` với payload:
    ```json
    {
      "errorName": "TypeError",
      "errorMessage": "Cannot read properties of undefined (reading 'inventory_count')",
      "stack": "...",
      "componentStack": "...",
      "route": "/inventory/sessions/current"
    }
    ```
  * Nhận về JSON chứa `{ rootCause: string, targetFile: string, diff: string }`.
  * Hiển thị UI Diff trước / sau (màu đỏ / xanh).
  * Nút **"Apply Fix"**: Gọi `POST http://localhost:8000/api/dev/apply` để agent ghi đè file trên máy dev. Next.js Fast Refresh tự động nạp lại code mới mà không cần F5 trình duyệt.

---

### 3.2. Thành phần 2: Bộ bắt lỗi Telemetry & Hàng đợi Supabase

* **Client Capture:**
  * `HermesErrorBoundary`: Bắt render crash của các trang/component React. Hiển thị thông báo thân thiện và gợi ý người dùng bấm nút *"Báo sự cố cho Hermes"*.
  * Global Listeners: Bắt `window.addEventListener('error')` và `window.addEventListener('unhandledrejection')`.
* **Deduplication & Rate Limiting (Chống bão log):**
  * Mã băm định danh lỗi `fingerprint = SHA256(error_name + ':' + error_message + ':' + top_stack_frame)`.
  * Bộ đệm phía client/server kiểm tra trong cửa sổ 5 phút: Nếu trùng fingerprint, chỉ tăng biến đếm `occurrences` thay vì gửi nhiều bản ghi lên Supabase.
* **Lọc bỏ dữ liệu nhạy cảm (Sanitization):**
  * Tự động quét và thay thế bằng `[REDACTED]` đối với: Authorization tokens, cookies, passwords, số tài khoản, thông tin thẻ tín dụng.

---

### 3.3. Thành phần 3: Hermes SRE Worker & Luồng Tự động Mở GitHub PR

* **Môi trường:** Daemon Worker chạy trên server độc lập (Node.js/Python) có quyền truy cập GitHub Personal Access Token và Supabase Service Role.
* **Quy trình xử lý:**
  1. Lắng nghe/polling các bản ghi có `status = 'pending'` trong bảng `telemetry_error_logs`.
  2. Cập nhật `status = 'analyzing'`.
  3. Lấy `git_commit_sha` gắn kèm log. Dùng GitHub API truy xuất file mã nguồn tại commit đó.
  4. Prompting Hermes Agent để phân tích nguyên nhân gốc và sinh bản vá ngắn gọn, chuẩn xác.
  5. Tự động:
     - Tạo nhánh Git mới: `fix/hermes-sre-<short_fingerprint>`.
     - Commit thay đổi mã nguồn.
     - Tạo GitHub Pull Request với format Markdown:
       * **Mô tả lỗi:** Tên lỗi, tần suất xuất hiện, route bị ảnh hưởng.
       * **Phân tích nguyên nhân gốc:** Tại sao bug xảy ra.
       * **Giải pháp áp dụng:** Chi tiết thay đổi.
       * **Khuyến nghị kiểm thử:** Các ca kiểm thử cần chạy trước khi merge.
  6. Cập nhật bản ghi Supabase thành `status = 'pr_created'`, lưu `pr_url` để dev theo dõi.

---

### 3.4. Thành phần 4: Smart Bug Reporter cho Nhân viên (`src/components/telemetry/SmartBugReporter.tsx`)

* **Đối tượng sử dụng:** Tất cả nhân viên thao tác trên web (thu ngân, pha chế, kho).
* **Giao diện:** Icon nhỏ hình bot hoặc nút *"Báo sự cố"* ở góc phải phía dưới.
* **Ngữ cảnh tự động thu thập:**
  * Route hiện tại và quyền hạn của user (`user.role`).
  * Danh sách 5 request API gần nhất (URL, method, status code, thời gian phản hồi).
  * Ảnh chụp màn hình hiện tại (sử dụng `html2canvas` hoặc capture metadata).
  * Dữ liệu form đang nhập dở (đã qua bộ lọc khử password/thông tin nhạy cảm).
* **Trải nghiệm tương tác:**
  * Nhân viên gõ mô tả ngắn hoặc chọn danh mục sự cố.
  * Hermes phân tích sơ bộ và đưa ra hướng dẫn tức thì (ví dụ: *"Có vẻ kết nối mạng chi nhánh đang chập chờn, bạn hãy thử kiểm tra lại wifi hoặc bấm Lưu lại sau 1 phút"*).
  * Ghi nhận dữ liệu vào bảng `user_bug_reports` trên Supabase với trạng thái `open`, liên kết với bảng `telemetry_error_logs` nếu có lỗi JS đi kèm.

---

### 3.5. Thành phần 5: Admin / Manager Copilot (`src/components/admin/AdminCopilotDrawer.tsx`)

* **Phân quyền nghiêm ngặt:** Chỉ hiển thị khi `user.role === 'admin' || user.role === 'manager'`.
* **Tính năng chính:**
  * **System Health Q&A:** Hỏi đáp tình trạng lỗi ("Hôm nay có trang nào bị lỗi nhiều nhất?", "Phiếu kiểm kho chi nhánh 1 bị treo do đâu?").
  * **Logic Inspection:** Yêu cầu Hermes rà soát một luồng nghiệp vụ ("Kiểm tra xem công thức tính BTP trà sữa có đang bị trừ âm kho không?").
  * **Cơ chế An toàn:** Mọi câu trả lời của Copilot chỉ tập trung vào giải thích kỹ thuật và hướng dẫn xử lý; không cho phép user dùng prompt injection để trích xuất file `.env`, mật khẩu cơ sở dữ liệu hoặc secret keys.

---

## 4. Thiết kế Cơ sở Dữ liệu (Supabase Database Schema)

### Bảng 1: `telemetry_error_logs` (Hàng đợi lỗi hệ thống)
```sql
CREATE TABLE public.telemetry_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint TEXT NOT NULL,
    error_name TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    route TEXT,
    component_stack TEXT,
    environment TEXT NOT NULL DEFAULT 'production',
    git_commit_sha TEXT,
    occurrences INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'analyzing', 'pr_created', 'resolved', 'ignored'
    hermes_report JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telemetry_fingerprint ON public.telemetry_error_logs (fingerprint);
CREATE INDEX idx_telemetry_status ON public.telemetry_error_logs (status);
```

### Bảng 2: `user_bug_reports` (Báo cáo sự cố từ nhân viên)
```sql
CREATE TABLE public.user_bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT,
    user_description TEXT NOT NULL,
    route TEXT NOT NULL,
    network_breadcrumbs JSONB DEFAULT '[]'::jsonb,
    screenshot_url TEXT,
    telemetry_log_id UUID REFERENCES public.telemetry_error_logs(id) ON DELETE SET NULL,
    hermes_instant_reply TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'dismissed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Bảng 3: `copilot_chat_sessions` (Lịch sử trao đổi của Admin)
```sql
CREATE TABLE public.copilot_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Chính sách Bảo mật Dữ liệu (Row Level Security - RLS):
* **`telemetry_error_logs`:**
  * Quyền `INSERT`: Cho phép cả `anon` và `authenticated` (để mọi client web đều có thể gửi log lỗi).
  * Quyền `SELECT`, `UPDATE`: Chỉ cho phép `service_role` (Worker Hermes) và người dùng có role `admin`.
* **`user_bug_reports`:**
  * Quyền `INSERT`: Mọi user đã đăng nhập (`authenticated`).
  * Quyền `SELECT`: Chỉ chính user đó xem được báo cáo của mình, hoặc role `admin`/`manager`.

---

## 5. Kế hoạch Kiểm thử & Xác minh (Verification Plan)

### Kiểm thử Tự động (Automated Tests):
1. **Kiểm thử Fingerprint:** Đảm bảo hàm hash sinh cùng một mã fingerprint khi cùng một lỗi xảy ra ở cùng dòng code, và sinh khác mã khi lỗi xảy ra ở vị trí khác.
2. **Kiểm thử Sanitize:** Đảm bảo chuỗi chứa `Bearer <token>`, `password: "123"` bị che giấu thành `[REDACTED]` trước khi gửi.
3. **Kiểm thử RLS Supabase:** Đảm bảo user thường không thể đọc trộm bảng `telemetry_error_logs` hoặc sửa đổi trạng thái của bản ghi.

### Kiểm thử Thủ công (Manual Verification):
1. **Dev Cockpit Test:**
   * Thêm một nút giả lập lỗi trong trang Dev: Bấm nút gây ra lỗi `throw new Error("Hermes Test Crash")`.
   * Kiểm tra xem Widget Dev Cockpit có nổi thông báo đỏ không.
   * Bấm *"Ask Hermes to Fix"* và kiểm tra code diff trả về từ Hermes local agent.
2. **Smart Bug Reporter Test:**
   * Mở widget báo lỗi ở vai trò nhân viên thu ngân.
   * Gửi phản ánh: "Kiểm tra nút thanh toán bị chậm".
   * Xác nhận Hermes trả về phản hồi tức thì và bản ghi được lưu đầy đủ vào Supabase kèm 5 network request gần nhất.
3. **Hermes SRE Worker Test:**
   * Tạo 1 bản ghi lỗi mẫu trong `telemetry_error_logs` với `status = 'pending'`.
   * Kích hoạt script worker của Hermes.
   * Kiểm tra worker có phân tích đúng code và tạo Pull Request thành công trên GitHub hay không.
