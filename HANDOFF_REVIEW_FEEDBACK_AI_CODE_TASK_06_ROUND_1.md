Đây là review feedback cho `TASK-06`.

Kết luận hiện tại: `CHƯA PASS`

## 1. Điều đã làm đúng

- Đã thêm `status: 'draft' | 'published'` vào schedule data
- Đã có `ScheduleService.publishWeek(...)`
- Manager có hành động publish trong `schedule/manage/page.tsx`
- `ScheduleService.getSchedulesForUser(...)` đã bắt đầu lọc employee theo `published`
- `eslint` pass
- `npm run build` pass

Nói ngắn gọn:
- hướng triển khai đúng
- nhưng còn 2 lỗi nghiệp vụ quan trọng nên chưa thể pass

## 2. Blocker nghiệp vụ

### A. `schedule/page.tsx` vẫn tự sinh thêm lịch demo cho employee

File:
- `src/app/schedule/page.tsx`

Đoạn vấn đề:
- hàm `getExtendedSchedules(...)`
- đang lấy lịch thật rồi tự sinh thêm các ngày Mon-Fri cho cả tháng
- còn gắn `status: 'published'` cho các lịch sinh thêm

Vấn đề:
- employee có thể nhìn thấy các ca được “nội suy” thêm, không phải ca đã được manager tạo và publish thật
- điều này vi phạm trực tiếp yêu cầu:
  - employee chỉ được thấy lịch đã publish là lịch chính thức
  - không được nhìn nhầm draft hoặc lịch giả thành lịch thật

Yêu cầu sửa:
- bỏ logic tự sinh thêm lịch published cho employee
- nếu cần giữ demo month view thì chỉ được hiển thị từ dữ liệu thật đã publish
- không được fabricate thêm official schedules

### B. `initPublishedWeeks()` đang tự seed tuần này và tuần trước là published

File:
- `src/lib/services/schedule-service.ts`

Đoạn vấn đề:
- `initPublishedWeeks()`
- tự động thêm:
  - `store-001_thisWeek`
  - `store-001_lastWeek`

Trong khi:
- `mockSchedules` seed cũ ban đầu không có `status`
- filter hiện tại chỉ loại `draft`, còn schedule không có status vẫn lọt qua nếu tuần bị đánh dấu published

Hệ quả:
- employee có thể thấy lịch seed cũ như lịch chính thức
- dù manager chưa thực hiện publish theo flow mới

Yêu cầu sửa:
- không tự seed published weeks theo kiểu mặc định như hiện tại
- hoặc nếu bắt buộc seed vì demo, phải seed một cách nhất quán:
  - dữ liệu nào là published thì schedule record phải được đánh status published rõ ràng
  - không được dùng published registry để “nâng cấp ngầm” lịch seed cũ thành official

## 3. Kết luận reviewer

Hiện tại:
- pass kỹ thuật
- chưa pass nghiệp vụ

TASK-06 chỉ được coi là pass khi:
1. employee chỉ thấy lịch đã publish thật
2. không còn lịch tự sinh giả làm official
3. không còn published-by-default gây hiểu sai việc manager đã publish
4. eslint pass
5. build pass

## 4. Prompt ngắn gửi lại AI code

```text
Review TASK-06 hiện tại: CHƯA PASS.

Điểm tốt:
- đã có status draft/published
- đã có publishWeek
- manage page có action publish
- eslint + build pass

Nhưng còn 2 blocker nghiệp vụ:

1. src/app/schedule/page.tsx vẫn có getExtendedSchedules(...)
- đang tự sinh thêm lịch Mon-Fri cho cả tháng
- còn gắn status published cho lịch sinh thêm
- employee có nguy cơ thấy lịch giả như lịch chính thức

Yêu cầu:
- bỏ logic fabricate official schedules cho employee
- employee chỉ được thấy lịch thật đã publish

2. src/lib/services/schedule-service.ts đang tự seed homies_published_weeks
- tuần này và tuần trước của store-001 bị mặc định coi là published
- trong khi mockSchedules seed cũ không có status rõ ràng
- điều này làm employee có thể thấy lịch cũ như official dù chưa publish theo flow mới

Yêu cầu:
- bỏ seed published mặc định kiểu này
- hoặc chuẩn hóa toàn bộ seed published một cách nhất quán, không nâng cấp ngầm lịch cũ

Không được:
- không mở thêm scope
- không redesign UI
- không đổi flow auth

Chỉ pass khi employee thực sự chỉ thấy lịch đã publish thật.
```
