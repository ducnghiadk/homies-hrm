Đây là review feedback cho `TASK-05`.

Kết luận hiện tại: `CHƯA PASS`

Lý do:
- `build` đã pass
- `eslint` không có error, nhưng còn warning nhỏ
- quan trọng hơn: data layer schedule vẫn chưa thật sự thống nhất với data layer employee của pilot

## 1. Blocker chính phải sửa

### A. Schedule vẫn phụ thuộc trực tiếp vào `mockEmployees`

Các chỗ còn đọc trực tiếp `mockEmployees` hoặc helper mock employee:
- `src/lib/services/schedule-service.ts`
- `src/app/schedule/manage/page.tsx`
- `src/app/schedule/by-shift/page.tsx`
- `src/app/schedule/assign/page.tsx` vẫn dùng `getEmployeesByStore(...)` từ `mock-data`

Vấn đề:
- employee module hiện đã chuyển sang `EmployeeService`
- nếu thêm nhân sự mới ở `employees/new`, nhân sự đó có thể không xuất hiện đúng trong flow schedule
- như vậy `TASK-05` chưa đạt mục tiêu “một nguồn dữ liệu lịch dùng chung bám theo pilot data layer”

Bạn cần sửa theo hướng:
- schedule module phải lấy nhân sự từ cùng data source với employee module
- ưu tiên dùng `EmployeeService`
- không được để assign/manage/by-shift mỗi nơi tự đọc mock employee một kiểu

## 2. Warning nên dọn luôn

### B. `schedule-service.ts` còn warning unused

File:
- `src/lib/services/schedule-service.ts`

Lỗi:
- `mockSchedules` import nhưng không dùng

Không phải blocker lớn, nhưng nên dọn trong vòng sửa này để sạch hơn.

## 3. Những gì đã tốt

- Đã tạo `ScheduleService`
- `schedule/page.tsx`, `assign`, `manage`, `by-shift` đã bắt đầu nối qua service
- `build` pass
- policy chặn theo role/store trong service đã có nền tảng

## 4. Yêu cầu vòng sửa tiếp theo

1. Gom nguồn employee trong module schedule về cùng data source với employee pilot
2. Sửa `assign/manage/by-shift/schedule-service` để không phụ thuộc `mockEmployees` cho identity chính
3. Dọn warning unused trong `schedule-service.ts`
4. Chạy lại:
- `eslint`
- `npm run build`

## 5. Prompt ngắn gửi lại AI code

```text
Review TASK-05 hiện tại: CHƯA PASS.

Build đã pass, service lịch đã có, nhưng data layer schedule vẫn chưa thống nhất với employee data layer của pilot.

Blocker chính:
- schedule-service.ts vẫn đọc mockEmployees
- schedule/manage/page.tsx vẫn đọc mockEmployees
- schedule/by-shift/page.tsx vẫn đọc mockEmployees
- schedule/assign/page.tsx vẫn dùng getEmployeesByStore từ mock-data

Vấn đề:
- employee module đã dùng EmployeeService
- nếu thêm nhân sự mới ở employees/new thì flow schedule có nguy cơ không thấy nhân sự đó
- như vậy chưa đạt mục tiêu một nguồn dữ liệu thống nhất cho pilot

Yêu cầu sửa:
1. đổi các chỗ trên sang cùng data source với employee module, ưu tiên EmployeeService
2. không để assign/manage/by-shift mỗi nơi tự đọc employee từ mock
3. dọn warning unused ở src/lib/services/schedule-service.ts
4. chạy lại eslint + build

Không được:
- không mở publish flow
- không redesign UI
- không mở rộng attendance/leave/payroll
```
