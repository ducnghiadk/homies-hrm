---
paths:
  - "**/*"
---

# Project Conventions

## Stack và pattern chính
- Dự án dùng `Next.js App Router` với route nằm trong `src/app`.
- Phần lớn màn hình là `use client` và xử lý nghiệp vụ qua `service layer` trong `src/lib/services`.
- Dữ liệu MVP đang đi qua `mock-data` và `localStorage`, chưa phải backend thật ở mọi module.

## Naming
- Route page dùng `page.tsx`.
- Component dùng `PascalCase.tsx`.
- Hook dùng `useXxx.ts`.
- Helper/service dùng `kebab-case.ts` hoặc `camel-like service name` đang có sẵn, ưu tiên giữ đồng bộ theo file hiện hữu.

## Cách sửa an toàn
- Ưu tiên thêm logic vào service hiện có trước khi nhét xử lý trực tiếp vào page.
- Nếu sửa quyền nhìn dữ liệu, kiểm tra cả `auth-store`, `ProtectedRoute`, `RoleGuard`, service và route liên quan.
- Nếu sửa text tiếng Việt, kiểm tra nguy cơ lỗi mã hóa ký tự trước khi lưu.
- Nếu tạo route/component mới, phải cập nhật `docs/CODEMAP.md`.

## Anti-pattern cần tránh
- Không copy lại logic trạng thái ở nhiều page nếu đã có thể gom vào service/helper.
- Không đọc hoặc chỉnh các thư mục ignore lớn như `node_modules`, `.next`, `public` khi không cần.
- Không trộn sửa UI lớn với thay đổi business logic lớn trong cùng một pass.
- Không đổi tên route/module cũ nếu chưa có yêu cầu nghiệp vụ rõ ràng.

## Verify mặc định
- UI/page: chạy `npm run lint`, nếu có thể thêm `npm run build`.
- Flow dữ liệu mock: kiểm tra localStorage/service sau khi đổi status hoặc tạo bản ghi mới.
- Route quan trọng: thử bằng role demo phù hợp nếu task liên quan RBAC.
