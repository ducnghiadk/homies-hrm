Đây là review feedback cho `TASK-05-ROUND-2`.

Kết luận hiện tại: `CHƯA PASS`

## 1. Điều đã làm đúng

Các blocker vòng trước đã được xử lý đúng hướng:
- `schedule-service.ts` đã chuyển từ `mockEmployees` sang `EmployeeService`
- `schedule/assign/page.tsx` đã lấy danh sách employee từ `EmployeeService`
- `schedule/manage/page.tsx` đã lấy danh sách employee từ `EmployeeService`
- `schedule/by-shift/page.tsx` đã lookup employee bằng `EmployeeService`
- `npm run build` pass

Nói ngắn gọn:
- phần “thống nhất nguồn employee data” đã gần đạt

## 2. Blocker mới khiến task chưa pass

### A. Vi phạm Rules of Hooks trong `schedule/manage/page.tsx`

File:
- `src/app/schedule/manage/page.tsx`

Lỗi:
- `React Hook "useMemo" is called conditionally`
- vị trí chính: khoảng dòng `169`

Nguyên nhân:
- đang có `return` sớm ở đoạn:
  - `if (!user || user.role === 'employee') return ...`
- nhưng phía sau đó mới gọi thêm:
  - `const storeEmps = useMemo(...)`

Điều này làm hook không còn được gọi theo cùng thứ tự ở mọi render.

Yêu cầu sửa:
- đưa `storeEmps` và mọi hook khác lên trước early return
- hoặc đổi cách tổ chức logic để không còn hook nằm sau nhánh return

## 3. Warning nên dọn luôn

### B. `schedule-service.ts` còn warning unused

File:
- `src/lib/services/schedule-service.ts`

Lỗi:
- import `mockSchedules` nhưng không dùng

Yêu cầu:
- dọn luôn trong vòng sửa này

## 4. Kết luận reviewer

Hiện tại:
- về hướng nghiệp vụ: tốt hơn nhiều, gần đạt
- về chất lượng code: vẫn chưa pass vì còn lỗi lint mức error

TASK-05 chỉ được coi là pass khi:
1. không còn lỗi hooks/lint mức error
2. warning còn lại trong vùng sửa được dọn sạch nếu gọn
3. `eslint` pass
4. `build` pass

## 5. Prompt ngắn gửi lại AI code

```text
Review TASK-05-ROUND-2 hiện tại: CHƯA PASS.

Điểm tốt:
- schedule-service, assign, manage, by-shift đã chuyển sang dùng EmployeeService cho employee data
- build pass

Blocker mới:
- src/app/schedule/manage/page.tsx đang vi phạm Rules of Hooks
- lỗi: React Hook "useMemo" is called conditionally
- nguyên nhân: có early return trước rồi mới gọi useMemo(storeEmps)

Yêu cầu sửa:
1. sửa schedule/manage/page.tsx để mọi hook được gọi ổn định, không nằm sau early return
2. dọn warning unused import mockSchedules trong src/lib/services/schedule-service.ts
3. chạy lại eslint + build

Không được:
- không mở thêm scope
- không làm publish flow
- không redesign UI
```
