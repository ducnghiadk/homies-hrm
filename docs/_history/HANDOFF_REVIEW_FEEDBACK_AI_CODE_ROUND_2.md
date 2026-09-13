Kết quả review vòng 2 cho AI code: `NEAR PASS`

Các blocker chính từ vòng trước đã được xử lý:
- `npm run build` đã pass
- `DEMO_ACCOUNTS` đã được khôi phục để không làm vỡ `Header` và `rbac`
- `employees/[id]` đã chuyển sang `EmployeeService` và có chặn quyền theo role/store
- `employees/new` không còn lưu role sai model `"manager"`
- `leave/request` đã sửa dependency của `handleSubmit`
- đã có 2 file SQL pilot:
  - `supabase/pilot_ready_v1_schema.sql`
  - `supabase/pilot_ready_v1_seed_store_001.sql`

Tuy nhiên hiện tại vẫn còn một nhóm lỗi cần bạn nắm rõ:

1. `eslint` vẫn fail ở `src/app/rbac/page.tsx`
- Các lỗi hiện còn:
  - dòng khoảng `86`: `Unexpected any`
  - dòng khoảng `147`: `Unexpected any`
  - dòng khoảng `269`: `Unexpected any`
- Ngoài ra còn một số warning unused import/unused variable ở:
  - `src/app/rbac/page.tsx`
  - `src/app/employees/[id]/page.tsx`
  - `src/lib/services/employee-service.ts`

Nhận định:
- Đây không còn là lỗi của các blocker pilot chính nữa
- Nhưng nếu team cần `lint clean` để merge thì nhánh này vẫn `chưa pass hoàn toàn`

Kết luận reviewer:
- Nếu chốt theo mục tiêu sửa blocker vòng 1: `PASS`
- Nếu chốt theo tiêu chuẩn nhánh merge sạch (`build + lint sạch`): `CHƯA PASS`

Hướng xử lý mình khuyên:
1. Không mở rộng thêm scope pilot
2. Sửa dứt điểm `src/app/rbac/page.tsx` để bỏ `any`
3. Dọn warning unused ở các file đã chạm
4. Chạy lại `eslint` và `build`

Mẫu việc giao tiếp theo:

```text
Review vòng 2: gần đạt.

Các blocker pilot chính đã qua:
- build pass
- detail employee đã chặn đúng quyền
- role sai model đã hết
- leave request đã sửa hook deps
- SQL pilot đã có đủ

Nhưng hiện còn lỗi lint:
- src/app/rbac/page.tsx còn 3 lỗi no-explicit-any
- còn warning unused ở một vài file đã chạm

Yêu cầu vòng này:
1. sửa sạch lỗi eslint ở src/app/rbac/page.tsx
2. dọn warning unused trong các file vừa chạm nếu sửa gọn được
3. không mở thêm scope
4. chạy lại eslint + build

Chỉ khi eslint pass và build pass thì mới coi là pass hoàn toàn.
```
