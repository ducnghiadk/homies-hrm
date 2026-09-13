# Homies Milk Tea HRM

## Dự án là gì
Đây là hệ thống quản lý nhân sự cho chuỗi Homies Milk Tea/Boba House, tập trung vào vận hành cửa hàng như phân ca, chấm công, nhân viên, KPI, payroll và cài đặt nội bộ.
Hiện tại dự án thiên về mô phỏng nghiệp vụ nhanh cho web nội bộ, dùng nhiều dữ liệu mock phía client để thử flow trước khi khóa backend thật.

## Tech Stack
Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Zustand, Supabase client, React Query, PWA.
Kiến trúc hiện tại nghiêng về client-side pages + service layer + mock data + localStorage.

## Cấu trúc chính
- `src/app/`: route chính của ứng dụng theo App Router
- `src/components/`: UI dùng lại theo module
- `src/lib/services/`: service xử lý nghiệp vụ phía client
- `src/lib/mock-data*`: dữ liệu mẫu và helper mock
- `src/store/`: auth store và state dùng chung
- `src/hooks/`: custom hooks
- `supabase/`: schema, seed, RLS script
- `docs/`: spec, checklist, file điều phối
- `genesis/`: PRD, ADR, task và tài liệu kiến trúc theo version

## Context bắt buộc
- Quy chuẩn thiết kế UI/UX bắt buộc: @DESIGN_RULE_HOMIES_FINAL.md
- Bản đồ code: @docs/CODEMAP.md
- Các lỗi đã biết: @docs/KNOWN_ISSUES.md
- Quy tắc token: @docs/TOKEN_PLAYBOOK.md
- Skill audit: gõ "audit" hoặc "kiểm tra" để chạy kiểm tra sức khỏe dự án
- Điều phối chính hiện tại: @docs/TO_CODE.md
- Handoff song song: @docs/TO_CODE_PARALLEL_B.md
- Spec scheduling stage 2: @docs/STAGE2_SCHEDULING_FLOW_SPEC.md
- Checklist stage 1: @docs/STAGE1_STATUS_CHECKLIST.md
- Rule AI plan: @docs/AI_PLAN_AI_CODE_RULES.md

## Quy tắc làm việc
1. Tôi là người dùng nocode. KHÔNG hỏi tôi đường dẫn file, tự tìm.
2. Giải thích bằng tiếng Việt đơn giản, không thuật ngữ kỹ thuật.
3. Trước khi sửa nhiều file, liệt kê danh sách file sẽ sửa để tôi xác nhận.
4. Mỗi lần chỉ làm 1 task, xong báo kết quả rõ ràng.
5. Luôn tuân thủ TOKEN_PLAYBOOK.md: mỗi pass dưới 60k token, chỉ 1 mục tiêu chính, đọc file theo khúc không đọc full.
6. Luôn dùng CODEMAP.md để tìm đúng file cần sửa, không scan cả codebase.
7. Nếu task phức tạp, tự chia nhỏ thành pass A/B/C/D/E.
8. Khi xong task, luôn ghi "next exact step" vào cuối response.
9. Sau khi sửa code, LUÔN chạy lệnh kiểm tra lỗi phù hợp tech stack trước khi báo hoàn thành.
10. Khi gặp bug mới và đã fix, thêm vào docs/KNOWN_ISSUES.md.
11. Sau khi tạo file/route/component mới, cập nhật docs/CODEMAP.md.
12. KHÔNG tự ý refactor, rename, di chuyển file nếu tôi không yêu cầu.
13. Không đọc thư mục đã bị ignore trong .codexignore trừ khi tôi yêu cầu.
14. Sau mỗi task, cập nhật tick [x] vào file sprint/plan nếu task nằm trong đó.
15. Khi tôi nói "audit", "kiểm tra", hoặc "health check", chạy skill audit theo đúng quy trình.

## Lệnh dev
- `npm run dev`: chạy dev server ở cổng `3535`
- `npm run restart`: restart dev server ở cổng `3535`
- `npm run build`: build production
- `npm run start`: chạy bản build
- `npm run lint`: chạy ESLint
- `npm run ai:guard`: kiểm tra guardrail AI
- `npm run ai:context`: in context làm việc AI
- `npm run ai:ready`: chạy guard + context

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
