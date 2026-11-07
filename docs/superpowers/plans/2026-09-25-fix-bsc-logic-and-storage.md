# Kế Hoạch Sửa Toàn Bộ Lỗ Hổng Logic & Đồng Bộ BSC

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khắc phục toàn bộ 8 lỗ hổng logic, xóa bỏ hoàn toàn `localStorage`, đồng bộ 100% qua API máy chủ (`server-db.json`) và chuẩn hóa công thức tính thưởng BSC cho chuỗi Homies F&B.

**Architecture:** 
- Xây dựng endpoint `/api/bsc/settings` và cấu trúc `ServerBscSettings` trong `src/lib/server/db.ts` để lưu trữ cài đặt BSC trên máy chủ.
- Chuyển toàn bộ thao tác đọc/ghi trong `bsc-adapter.ts` sang gọi API máy chủ.
- Sửa triệt để các lỗi tính toán trong `bsc-engine.ts`: fallback giờ công, đồng bộ mục tiêu doanh thu, cảnh báo ghi đè hệ số thưởng CEO và chuẩn hóa lọc lỗi cá nhân.

**Tech Stack:** Next.js 16 App Router, TypeScript, REST API, Server JSON DB.

---

## Danh Sách File Sẽ Thay Đổi

1. `src/lib/server/db.ts` (Thêm schema và hàm lưu trữ `bsc_settings` trên server)
2. `src/app/api/bsc/settings/route.ts` (Tạo mới REST API GET/POST cài đặt BSC)
3. `src/lib/adapters/bsc-adapter.ts` (Xóa bỏ `localStorage`, đồng bộ gọi API `/api/bsc/settings`, sửa fallback 120h -> 0h)
4. `src/lib/bsc-engine.ts` (Đồng bộ `is_unlocked`, chuẩn hóa làm tròn quỹ thưởng, siết chặt lọc lỗi cá nhân)
5. `src/components/bsc-bonus/BSCMonthlyInputForm.tsx` (Thêm hiển thị ghi đè hệ số CEO và mục tiêu thực tế)
6. `docs/CODEMAP.md` (Cập nhật endpoint `/api/bsc/settings`)
7. `docs/KNOWN_ISSUES.md` (Ghi nhận các lỗi logic đã khắc phục)

---

## Chi Tiết Các Bước Thực Hiện (Làm Lần Lượt)

### Task 1: Xóa bỏ hoàn toàn LocalStorage & Tạo API Cài Đặt BSC (`/api/bsc/settings`)
- [x] Bổ sung kiểu dữ liệu `ServerBscSettings` vào `src/lib/server/db.ts`.
- [x] Tạo file route API `src/app/api/bsc/settings/route.ts` (hỗ trợ GET lấy cài đặt, POST cập nhật cài đặt).
- [x] Chỉnh sửa `src/lib/adapters/bsc-adapter.ts` để `getSafetySettings()`, `saveSafetySettings()`, `getCriteriaCatalog()`, `saveCriteriaCatalog()`, `getBonusTiers()`, `saveBonusTiers()` gọi qua API máy chủ thay vì `localStorage` hoặc chỉ lưu trên RAM.
- [x] Chạy kiểm thử tự động xác nhận API hoạt động và không còn dùng `localStorage`.

### Task 2: Sửa Lỗi Giờ Công Mặc Định (120h -> 0h)
- [x] Chỉnh sửa `src/lib/adapters/bsc-adapter.ts` ở hàm `getEmployeePersonalData`: đổi fallback từ `120` thành `0`.
- [x] Đảm bảo nhân sự không có giờ công trong tháng sẽ có `work_hours = 0` và không được phân bổ thưởng nhầm.
- [x] Chạy script kiểm tra phân bổ nhân sự.

### Task 3: Đồng Bộ Mục Tiêu Doanh Thu & Cờ Mở Thưởng (`is_unlocked`)
- [x] Chỉnh sửa `src/lib/bsc-engine.ts`: đảm bảo cờ `is_unlocked` trong kết quả trả về luôn đồng nhất với kết quả tính toán Gate Check.
- [x] Đảm bảo `storeResult.revenue_target.target_daily` luôn phản ánh đúng giá trị mục tiêu thực tế (`effectiveTargetDaily`).

### Task 4: Thêm Cảnh Báo Ghi Đè Hệ Số BSC Của CEO & Chuẩn Hóa Quỹ Thưởng
- [x] Cập nhật `src/lib/bsc-engine.ts`: chuẩn hóa làm tròn quỹ thưởng `store_bonus_pool` khớp 100% với công thức `Math.round(base_bonus_pool * bsc_coefficient)`.
- [x] Thêm thông báo/ghi chú rõ ràng trên form `BSCMonthlyInputForm.tsx` khi có sự can thiệp chỉ định hệ số thưởng từ CEO.

### Task 5: Siết Chặt Bộ Lọc Lỗi Cá Nhân & Kiểm Thử Toàn Diện
- [x] Chỉnh sửa `src/lib/bsc-engine.ts`: chỉ tính các lỗi cá nhân có trạng thái duyệt hợp lệ (`approved_ceo`).
- [x] Chạy kiểm tra TypeScript (`npx tsc --noEmit`) và chạy bộ kiểm thử BSC tự động (10/10 PASS).
- [x] Cập nhật tài liệu `CODEMAP.md` và `KNOWN_ISSUES.md`.
