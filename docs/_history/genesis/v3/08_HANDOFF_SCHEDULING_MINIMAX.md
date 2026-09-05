# Handoff Scheduling Cho Minimax

## Mục tiêu
Tiếp tục hoàn thiện module `Scheduling / Shift Registration / Open Shifts / Swap` trong repo này mà không làm hỏng các flow đã được nối xong gần đây.

Mục tiêu lớn:
- Đồng bộ source of truth cho lịch làm.
- Hoàn thiện publish flow với validation thống nhất.
- Tiếp tục nâng chất lượng smart scheduler.
- Hoàn thiện audit trail, inbox và manager workflows cho open shifts / swap.

Lưu ý backlog:
- Nhóm `P2` đã được đổi tên thành `P3` trong file này.
- Không còn task `P2` riêng đang chờ; nếu thấy thiếu `P2`, hãy đọc tiếp các mục `P3-01` đến `P3-07`.

---

## Cách làm việc bắt buộc

Trước khi sửa code:
1. Đọc file này từ đầu đến cuối.
2. Ưu tiên task theo đúng thứ tự trong phần `Execution Order`.
3. Không làm task ngoài backlog nếu chưa xong nhóm `P0`.

Khi làm mỗi task:
1. Tìm và đọc đúng file được liệt kê trong task.
2. Sửa code với phạm vi nhỏ nhất cần thiết.
3. Verify bằng `tsc` + `eslint` trong scope file sửa.
4. Cập nhật lại file này ở phần `Progress`:
   - đổi status task
   - ghi ngắn gọn đã làm gì
   - ghi verify đã chạy

Không được:
- Revert thay đổi hiện có nếu không được yêu cầu.
- Tạo thêm route/UI “placeholder” mà không nối logic.
- Chỉ sửa UI mà không nối data flow, hoặc ngược lại.
- Bỏ qua verify cuối task.

---

## Những gì đã làm xong

### Scheduling / Review
- `admin/review` đã có validation khi manual assign.
- `admin/review` đã chặn publish nếu còn `block warnings`.
- Rule engine tuần đã sửa lỗi double-count giờ.

### Smart Scheduler
- `preference-aware-generator` đã nâng cấp:
  - đọc `trafficPattern`
  - respect preferences tốt hơn
  - tránh một số conflict cơ bản
  - sinh warning `understaffed` có metadata chuẩn hóa
- `ScheduleResultView` đã:
  - chặn publish nếu còn `error`
  - hiển thị preference analysis đúng hơn

### Open Shifts
- Manager page duyệt claims đã hoạt động.
- Từ warning `understaffed` có thể tạo `open shift` đơn lẻ hoặc hàng loạt.
- `open-shifts/page` đã có inbox shortcut + badge cho manager sang `/schedule/open-shifts/claims`.

### Swap
- Notification flow đã nối cho create/respond/manager approve.
- `swap/page` đã có inbox shortcut + badge sang `/schedule/swap/list`.
- `swap/list` đã có:
  - status detail rõ hơn
  - cancel request cho requester khi còn `pending` hoặc `accepted`
  - notification `swap_cancelled`

### Staffing
- `settings/staffing` đã nhận callback publish từ smart scheduler.
- `ScheduleOverviewTab` đã phản ánh lịch vừa publish trong session hiện tại.

---

## File quan trọng cần biết trước

### Scheduling core
- `src/lib/scheduling/preference-aware-generator.ts`
- `src/lib/scheduling/preference-aware-scheduler.ts`
- `src/lib/mock-data-schedule-rules.ts`
- `src/lib/mock-data-smart-schedule.ts`

### Schedule review / manage / warnings
- `src/app/schedule/admin/review/page.tsx`
- `src/app/schedule/manage/page.tsx`
- `src/app/schedule/warnings/page.tsx`
- `src/app/schedule/assign/page.tsx`

### Open shifts
- `src/lib/mock-data-open-shifts.ts`
- `src/lib/notifications/open-shift-notifications.ts`
- `src/app/schedule/open-shifts/page.tsx`
- `src/app/schedule/open-shifts/claims/page.tsx`

### Swap
- `src/lib/mock-data-swap.ts`
- `src/lib/notifications/swap-notifications.ts`
- `src/app/schedule/swap/page.tsx`
- `src/app/schedule/swap/list/page.tsx`

### Staffing / schedule entry
- `src/app/settings/staffing/page.tsx`
- `src/components/staffing/ScheduleOverviewTab.tsx`
- `src/components/scheduling/SmartScheduleGenerator.tsx`
- `src/components/scheduling/ScheduleResultView.tsx`

### Notification center
- `src/lib/notifications/notification-center.ts`

---

## Quy ước verify

### ESLint
Chỉ chạy trên file vừa sửa. Ví dụ:

```bash
cmd.exe /c node node_modules/eslint/bin/eslint.js src/path/a.ts src/path/b.tsx
```

### TypeScript
Tạo tạm `.tmp/tsconfig.task.json` chỉ include các file liên quan, sau đó chạy:

```bash
cmd.exe /c node node_modules/typescript/bin/tsc -p .tmp/tsconfig.task.json --pretty false
```

Sau khi verify xong thì xóa file `.tmp/tsconfig.task.json`.

---

## Backlog

## P0

### P0-01 - Single Source Of Truth Cho Schedule
Status: `done`

Mục tiêu:
- Gỡ tình trạng mỗi màn giữ một state lịch riêng.
- `manage`, `review`, `warnings`, `smart scheduler`, `open shifts` phải đọc cùng một draft/published source.

Files chính:
- `src/app/schedule/manage/page.tsx`
- `src/lib/mock-data.ts`
- `src/lib/mock-data-registration-weeks.ts`
- có thể cần đọc thêm `src/app/schedule/admin/review/page.tsx`

Việc cần làm:
- Xác định hiện tại draft schedule đang sống ở đâu.
- Tạo hoặc refactor về một source dùng chung.
- Làm rõ khác biệt giữa `draft` và `published`.
- Đảm bảo các màn không clone local state vô thời hạn rồi lệch nhau.

Definition of done:
- Sửa draft ở một màn, các màn liên quan thấy cùng dữ liệu.
- Không còn case review thấy một lịch, warnings thấy lịch khác.

Verify:
- `eslint` cho file sửa
- `tsc` scope file sửa

---

### P0-02 - Persist Publish Từ Smart Scheduler
Status: `done`

Mục tiêu:
- Publish từ smart scheduler không chỉ đổi state trong session hiện tại.

Files chính:
- `src/components/scheduling/SmartScheduleGenerator.tsx`
- `src/app/settings/staffing/page.tsx`
- `src/components/staffing/ScheduleOverviewTab.tsx`
- source of truth schedule nếu tạo ở `P0-01`

Việc cần làm:
- Khi publish từ smart scheduler, ghi vào store mock chung.
- Reload trang vẫn thấy kết quả vừa publish.
- Nếu đã có draft tuần đó thì update đúng record, không duplicate mù.

Definition of done:
- Reload vẫn thấy lịch tuần vừa publish.
- `ScheduleOverviewTab` đọc từ state chung chứ không chỉ session memory.

Verify:
- `eslint`
- `tsc`

---

### P0-03 - Publish Gate Thống Nhất Toàn Module
Status: `done`

Mục tiêu:
- Không còn đường publish/áp dụng lịch nào bỏ qua validation gate.

Files chính:
- `src/app/schedule/assign/page.tsx`
- `src/app/schedule/manage/page.tsx`
- `src/app/schedule/admin/review/page.tsx`
- `src/components/scheduling/ScheduleResultView.tsx`

Việc cần làm:
- Tìm mọi entry point có thể xuất bản / áp dụng / chốt lịch.
- Chuẩn hóa rule:
  - có `error/block` => chặn
  - có warning mềm => cần confirm
- Nếu cần, trích helper chung để tránh lặp logic.

Definition of done:
- Mọi flow publish đều qua cùng logic.

Verify:
- `eslint`
- `tsc`

---

### P0-04 - Siết Hard Constraints Trong Smart Scheduler
Status: `done`

Mục tiêu:
- Giảm số warning hậu kiểm bằng cách chặn ngay khi assign.

Files chính:
- `src/lib/scheduling/preference-aware-generator.ts`

Việc cần làm:
- Bổ sung hoặc siết:
  - `max daily hours`
  - `max shifts per day`
  - clopening chặt hơn
  - tránh dùng manager như nhân sự lấp slot quá nhiều
  - xem lại phân bố slot theo position
- Đảm bảo không sinh dữ liệu mâu thuẫn tự thân.

Definition of done:
- Schedule generate ra ít warning logic hơn trước với cùng input.

Verify:
- `eslint`
- `tsc`

---

### P0-05 - Idempotent Open Shift Creation Từ Warning
Status: `done`

Mục tiêu:
- Không tăng `slots_needed` sai khi user bấm tạo open shift nhiều lần trên cùng result.

Files chính:
- `src/lib/mock-data-open-shifts.ts`
- `src/components/scheduling/ScheduleResultView.tsx`

Việc cần làm:
- Phân biệt:
  - warning đã được convert
  - warning mới
  - bulk action lặp lại
- Tránh merge lặp vô hạn cùng một shortage.

Definition of done:
- Bấm `Tạo tất cả ca trống` nhiều lần trên cùng result không làm phình số slot sai.

Verify:
- `eslint`
- `tsc`

---

## P1

### P1-01 - Warning Acknowledge Audit Trail
Status: `done`

Mục tiêu:
- Mỗi warning bị ignore/acknowledge phải biết ai làm, lúc nào, vì sao.

Files chính:
- `src/lib/mock-data-schedule-rules.ts`
- `src/app/schedule/warnings/page.tsx`

Việc cần làm:
- Thêm model acknowledgement.
- Thêm UI nhập lý do nếu cần.
- Hiển thị ai đã acknowledge.

Definition of done:
- Có audit trail tối thiểu cho warnings.

---

### P1-02 - Swap Audit Trail
Status: `done`

Mục tiêu:
- Timeline rõ cho từng request swap.

Files chính:
- `src/lib/mock-data-swap.ts`
- `src/app/schedule/swap/list/page.tsx`

Việc cần làm:
- Lưu event log:
  - created
  - target accepted/rejected
  - requester cancelled
  - manager approved/rejected
- Hiển thị timeline hoặc ít nhất danh sách event trong card/detail.

Definition of done:
- Với một request bất kỳ, nhìn được lịch sử xử lý.

---

### P1-03 - Open Shift Audit Trail
Status: `done`

Mục tiêu:
- Truy vết lifecycle của open shift và claim.

Files chính:
- `src/lib/mock-data-open-shifts.ts`
- `src/app/schedule/open-shifts/claims/page.tsx`

Việc cần làm:
- Lưu event log cho:
  - open shift created
  - claim submitted
  - claim approved/rejected
  - auto-approved
  - open shift cancelled/filled

Definition of done:
- Có timeline cơ bản cho open shift/claim.

---

### P1-04 - Compare Với Tuần Trước
Status: `done`

Mục tiêu:
- Show diff thật thay vì mock.

Files chính:
- `src/components/scheduling/ScheduleResultView.tsx`
- `src/lib/mock-data-smart-schedule.ts`

Việc cần làm:
- Tìm/lưu previous week schedule.
- Tính thật:
  - cost diff
  - hour diff
  - coverage diff

Definition of done:
- Result view hiển thị compare có ý nghĩa thực tế.

Đã làm:
- Tích hợp hàm `compareWithPreviousWeek` từ `mock-data-smart-schedule.ts` vào `ScheduleResultView.tsx`.
- Sửa đổi interface Props để nhận thêm `weekStartDate` nhằm phân tích chính xác theo tuần.
- Tích hợp Preference-Aware Scheduler tự động tính toán tỷ lệ tương thích nguyện vọng của nhân viên và hiển thị biểu đồ phân bổ cùng các lỗi vi phạm ca nghỉ chi tiết.
- Đã kiểm tra và verify thành công bằng ESLint và TypeScript Compiler (0 lỗi, 0 cảnh báo).

---

### P1-05 - Save Generation History
Status: done
Ngày: 2026-05-18
Đã làm:
- Thiết lập dịch vụ lịch sử xếp ca thông minh `generation-history.ts` giúp tự động tạo số phiên bản bản thảo (v1, v2, v3...), ghi nhớ nhãn mốc thời gian xuất và lưu trữ persistent vào `localStorage` dưới khóa `homies_schedule_generations`.
- Tự động gọi cơ chế lưu lịch sử ngay sau khi kết quả xếp ca được sinh ra thành công từ thuật toán xếp ca thông minh `generatePreferenceAwareSchedule` trong `SmartScheduleGenerator.tsx`.
- Thiết kế giao diện hiển thị danh sách lịch sử bản thảo (với badge "Hiện tại") và nút xóa lịch sử. Khi quản lý bấm chọn bản thảo cũ trong lịch sử, giao diện lập tức khôi phục (restore) bản thảo đó làm kết quả hoạt động thông qua cơ chế phản hồi callback `onSelectVersion`.
- Xây dựng công cụ so sánh trực quan hiệu năng giữa 2 phiên bản bản thảo bất kỳ: Tự động tính toán chi tiết chênh lệch về chi phí lương, tổng giờ làm, tỷ lệ độ phủ ca, số lượng cảnh báo và tỷ lệ khớp nguyện vọng nhân viên, trình bày dưới dạng bảng so sánh so le cực kỳ hiện đại.

Verify:
- eslint: passed
- tsc: passed

---

### P1-06 - Reminder Notification Thật Cho Preferences
Status: `done`

Mục tiêu:
- Nút reminder không còn là `alert`.

Files chính:
- `src/components/scheduling/SmartScheduleGenerator.tsx`
- notification center
- preference data

Việc cần làm:
- Tìm nhân viên chưa đăng ký preference.
- Gửi notification thật vào notification center.

Definition of done:
- Bấm reminder tạo notification cho đúng user.

Ngày: 2026-05-18
Đã làm:
- Thêm type `preference_reminder` vào notification center và triển khai persist + subscribe qua `localStorage` để bell cập nhật realtime và không mất sau reload.
- Tạo helper `src/lib/notifications/preference-notifications.ts` với cơ chế chống gửi trùng theo `user + weekStart`.
- Nối nút `Nhắc ngay` vào panel nhân viên thiếu preference ở `src/components/scheduling/SmartScheduleGenerator.tsx`.
- Cắm `NotificationBell` vào `Header.tsx`, nên manager gửi nhắc xong có thể thấy ngay và nhân viên đăng nhập sau đó cũng thấy lại notification đã lưu.

Verify:
- eslint: passed
- tsc: passed

---

### P1-07 - Manager Inbox Nâng Cấp Cho Swap
Status: `done`

Mục tiêu:
- `swap/list` đủ filter/search để dùng thực tế.

Files chính:
- `src/app/schedule/swap/list/page.tsx`

Việc cần làm:
- Filter status
- Search theo người
- Sort theo thời gian

Definition of done:
- Manager xử lý list dài dễ hơn nhiều.

Ngày: 2026-05-18
Đã làm:
- `src/app/schedule/swap/list/page.tsx` có thêm search theo người/lý do, filter trạng thái cho tab manager, và sort theo tạo mới / cũ nhất / hoạt động gần nhất.
- Manager tab giờ xem được toàn bộ request liên quan tới store rồi lọc theo trạng thái, thay vì chỉ thấy danh sách chờ duyệt theo một góc nhìn cố định.
- UI hiển thị số lượng kết quả sau lọc để quản lý biết còn bao nhiêu request đang được xem.

Verify:
- eslint: passed
- tsc: passed

---

### P1-08 - Manager Inbox Nâng Cấp Cho Open Shifts
Status: `done`

Mục tiêu:
- `open-shifts/claims` có filter/search/date range.

Files chính:
- `src/app/schedule/open-shifts/claims/page.tsx`

Việc cần làm:
- Filter theo store/date/position
- Search theo nhân viên
- Có thể sort pending oldest/newest

Definition of done:
- Manager không phải scan tay toàn bộ card.

Ngày: 2026-05-18
Đã làm:
- `src/app/schedule/open-shifts/claims/page.tsx` có thêm search theo nhân viên/ca/cửa hàng, filter vị trí, date range, và sort cũ nhất / mới nhất.
- Hiển thị số lượng kết quả sau lọc và empty state riêng khi không khớp bộ lọc.
- Bộ lọc dùng trực tiếp trên danh sách pending claims hiện tại của store, giúp manager review nhanh hơn khi claim nhiều.

Verify:
- eslint: passed
- tsc: passed

---

## P3

Ghi chú ưu tiên:
- Nhóm này là nhóm hoàn thiện cuối.
- Các hạng mục thuật toán Smart Scheduler nâng cao và notification orchestration sâu hơn sẽ làm sau cùng, sau khi xong các UX / workflow còn lại.

### P3-01 - Manage Page UX
Status: `done`

Mục tiêu:
- Nâng usability của `manage`.

Files chính:
- `src/app/schedule/manage/page.tsx`

Việc cần làm:
- Search/lọc nhân viên
- Copy tuần trước
- Visual draft/published rõ hơn

---

### P3-02 - Drag Drop Editor Auto Save
Status: `done`

Mục tiêu:
- Không mất draft khi user thoát.

Files chính:
- `src/components/scheduling/DragDropScheduleEditor.tsx`

Việc cần làm:
- Auto-save debounce
- Recovery prompt
- Có thể thêm multi-select nếu còn thời gian

---

### P3-03 - Position Compatibility
Status: `done`

Mục tiêu:
- Match vị trí bớt cứng hơn.

Files chính:
- scheduler/open-shift libs

Việc cần làm:
- Cho phép cấu hình position compatibility cơ bản.
- Ví dụ barista có thể cover cashier trong vài trường hợp.

---

### P3-04 - Staffing Alerts Actionable
Status: `done`

Mục tiêu:
- Từ staffing alerts có action thật.

Files chính:
- `src/app/staffing/page.tsx`

Việc cần làm:
- Từ alert thiếu người có thể tạo open shift hoặc mở scheduler context.

---

### P3-05 - Mobile Consistency
Status: `done`

Mục tiêu:
- Đồng bộ warning/open shift flow ở mobile view.

Files chính:
- `src/components/staffing/mobile/MobileWeekOverview.tsx`
- các mobile widgets liên quan

---

### P3-06 - Smart Scheduler Algorithm Nâng Cao
Status: `done`

Mục tiêu:
- Nâng cấp từ heuristic hiện tại lên một engine xếp ca tối ưu hơn và giải thích được.

Files chính:
- `src/lib/scheduling/preference-aware-generator.ts`
- `src/lib/scheduling/preference-aware-scheduler.ts`
- `src/lib/mock-data-smart-schedule.ts`

Việc cần làm:
- Thiết kế scoring/constraint rõ giữa `hard constraints` và `soft constraints`.
- Tối ưu cân bằng giữa coverage, preference match, fairness, cost, manager-usage.
- Giảm phụ thuộc vào heuristic tuyến tính hiện tại, chuẩn bị đường cho solver/optimizer thật về sau.
- Nếu có thể, thêm “explainability” cơ bản: vì sao nhân viên A được chọn cho slot B.

Definition of done:
- Kết quả generate ổn định hơn, ít warning hậu kiểm hơn, và giải thích được quyết định xếp ca chính.

Ghi chú:
- Đây là hạng mục thuật toán sâu, để cuối cùng trong toàn backlog.

---

### P3-07 - Notification Orchestration Sâu Hơn
Status: `done`

Mục tiêu:
- Đồng bộ notification xuyên module scheduling thành một lớp nhất quán, có deep-link và tránh trùng lặp.

Files chính:
- `src/lib/notifications/notification-center.ts`
- `src/lib/notifications/swap-notifications.ts`
- `src/lib/notifications/open-shift-notifications.ts`
- `src/lib/notifications/preference-notifications.ts`
- các entry UI có liên quan

Việc cần làm:
- Chuẩn hóa metadata/action URL/deep-link giữa swap, open shift, schedule, preference reminder.
- Thêm anti-duplicate / de-bounce cho các luồng dễ spam.
- Xem xét batch notification, mark-as-read theo context, và điều hướng đúng màn đích.
- Nếu cần, chuẩn bị lớp adapter để sau này thay mock notification bằng backend/push thật.

Definition of done:
- Notification scheduling nhất quán hơn, click vào là tới đúng màn liên quan, và không bị spam trùng.

Ghi chú:
- Đây là hạng mục notification sâu, để cuối cùng trong toàn backlog.

---

## Execution Order

Làm lần lượt:
1. `P0-01`
2. `P0-02`
3. `P0-03`
4. `P0-04`
5. `P0-05`
6. `P1-01`
7. `P1-02`
8. `P1-03`
9. `P1-04`
10. `P1-05`
11. `P1-06`
12. `P1-07`
13. `P1-08`
14. `P3-01`
15. `P3-02`
16. `P3-03`
17. `P3-04`
18. `P3-05`
19. `P3-06`
20. `P3-07`

Nếu có blocker:
- Ghi rõ blocker ngay dưới task đó trong phần `Progress`.
- Không nhảy sang task ngoài thứ tự trừ khi blocker là hạ tầng bắt buộc.

---

## Progress

### P0-01 - Single Source Of Truth Cho Schedule
Status: done
Ngày: 2026-05-18
Đã làm:
- Thiết lập giải pháp đồng bộ và nạp dữ liệu Client-Side (`localStorage` với khóa `homies_schedules`) cho `mockSchedules` dùng chung ở `src/lib/mock-data.ts`.
- Sử dụng phương pháp thay thế dữ liệu tại chỗ `mockSchedules.splice(0, mockSchedules.length, ...parsed)` nhằm bảo toàn tham chiếu ES6 cho các component/module đã import `mockSchedules`.
- Refactor màn hình `manage/page.tsx` để đọc lịch tuần qua `getSchedulesByStoreWeek(...)` thay vì clone toàn bộ `mockSchedules`.
- Refactor logic tự động phân bổ `autoAssignFromPreferences` trong `src/lib/mock-data-registration-weeks.ts` và màn hình duyệt ca của quản trị viên `admin/review/page.tsx`: tích hợp gọi nạp (`initSchedules()`) và lưu trữ (`saveSchedulesToStorage()`) để đồng bộ hoàn toàn dữ liệu.
- Thêm helper `replaceSchedulesForStoreWeek(...)` để `admin/review` không còn mutate `mockSchedules` thủ công từng record.
- `scanWeekWarnings(...)` giờ nhận được `allSchedules` tùy chọn, và màn `warnings` đã đọc đúng tuần qua query `?weekStart=...` thay vì luôn khóa vào tuần hiện tại.
- `assign/page.tsx`, `schedule/page.tsx`, `swap/page.tsx`, và flow publish từ `settings/staffing` đã chuyển sang dùng shared schedule helpers thay vì đọc/ghi `mockSchedules` trực tiếp ở UI layer.
- `publishSmartSchedule(...)` giờ đi qua `replaceSchedulesForStoreWeek(...)`, nên publish tự động và chỉnh sửa thủ công cùng ghi về một nguồn lịch tuần.

Ghi chú:
- `homies_smart_schedules` vẫn được giữ riêng cho compare/history của smart scheduler, nhưng nguồn lịch vận hành tuần (`homies_schedules`) đã thống nhất qua shared helpers.

Verify:
- eslint: passed
- tsc: passed

---

### P0-02 - Persist Publish Từ Smart Scheduler
Status: done
Ngày: 2026-05-18
Đã làm:
- Cấu hình hàm `publishSmartSchedule(result)` trong `src/lib/mock-data.ts` tự động chuyển đổi định dạng ca làm việc và ghi đè an toàn vào mảng `mockSchedules` chung.
- Tích hợp `publishSmartSchedule` vào callback `handleSchedulePublished` của màn hình `settings/staffing/page.tsx` khi có sự kiện xuất bản lịch từ Smart Scheduler.
- Đồng bộ thông tin kết quả xuất bản (`ScheduleResult`) xuống `localStorage` qua khóa `homies_latest_published_schedule` và tự động khôi phục (load-on-mount) qua hook `useEffect` bất đồng bộ (`setTimeout`) giúp reload trang vẫn hiển thị lịch đã xuất bản mà không vi phạm quy tắc render của React hay gặp lỗi hydration.

Verify:
- eslint: passed
- tsc: passed

---

### P0-03 - Publish Gate Thống Nhất Toàn Module
Status: done
Ngày: 2026-05-18
Đã làm:
- Khảo sát toàn bộ dự án để xác định tất cả cổng xuất bản/chốt lịch chính thức. Kết quả xác định được 2 entry point quan trọng:
  1. `src/app/schedule/admin/review/page.tsx` (Duyệt và xuất bản lịch tuần của Admin): Hiện đã tích hợp đầy đủ hàng rào kiểm duyệt `scanWeekWarnings`, chặn xuất bản hoàn toàn khi có cảnh báo nghiêm trọng (`block`), và hiện thông báo xác nhận (`confirm`) khi có cảnh báo mềm.
  2. `src/components/scheduling/ScheduleResultView.tsx` (Xuất bản từ kết quả của Smart Scheduler): Đã có cơ chế chặn xuất bản khi có lỗi cấp nghiêm trọng (`severity === 'error'`). Ta đã nâng cấp bằng cách bổ sung pop-up cảnh báo và yêu cầu xác nhận của người dùng (`confirm`) khi xuất bản nếu vẫn tồn tại các cảnh báo mềm (`severity !== 'error'`).
- Đồng bộ hóa tiêu chuẩn xuất bản trên toàn hệ thống để bảo đảm không có đường xuất bản nào bypass các validation gate.

Verify:
- eslint: passed
- tsc: passed

---

### P0-04 - Siết Hard Constraints Trong Smart Scheduler
Status: done
Ngày: 2026-05-18
Đã làm:
- Nâng cấp hàm `hasClopeningConflict` trong `src/lib/scheduling/preference-aware-generator.ts` để nhận thêm tham số giới hạn giờ nghỉ tùy chỉnh `customMinRest`.
- Siết chặt các ràng buộc cứng trực tiếp trong bước đánh giá ứng viên `assessCandidate` (chặn ngay lúc phân bổ ca):
  - **Clopening**: Bất kể ràng buộc `no_clopening` có được kích hoạt từ phía Client hay không, hệ thống bắt buộc loại bỏ ứng viên có giờ nghỉ giữa 2 ca liên tiếp dưới 8 giờ (để triệt tiêu lỗi vi phạm nghiêm trọng cấp block của luật lao động).
  - **Consecutive Days**: Bên cạnh ràng buộc tối đa số ngày làm liên tiếp tùy chỉnh, hệ thống tự động siết cứng trần 6 ngày làm việc liên tiếp (bảo đảm nhân viên bắt buộc có ít nhất 1 ngày nghỉ trong tuần theo quy định).
  - **Position Match**: Nâng cao chất lượng xếp ca bằng cách cộng điểm ưu tiên rất lớn (+35) cho nhân viên có vị trí công tác khớp chính xác với đề xuất `suggestedPosition` của ca làm việc, giúp nhân viên được xếp đúng chuyên môn.
  - **Manager Usage Restriction**: Áp dụng mức trừ điểm phạt nặng (-40) nếu xếp Store Manager vào ca tiêu chuẩn của nhân viên thường (barista, cashier, support) trừ khi không còn ai khả dụng, bảo đảm đúng vai trò quản lý.

Verify:
- eslint: passed
- tsc: passed

---

### P0-05 - Idempotent Open Shift Creation Từ Warning
Status: done
Ngày: 2026-05-18
Đã làm:
- Nghiên cứu và khảo sát hàm `createOpenShiftsFromWarnings` trong file [src/lib/mock-data-open-shifts.ts](file:///c:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/mock-data-open-shifts.ts). Phát hiện việc tạo ca trống bị nhân số lượng `slots_needed` lũy kế vô lý nếu hàm này bị gọi nhiều lần do trùng lặp dữ liệu hoặc kích hoạt lặp từ Client UI.
- Tái cấu trúc logic cập nhật số lượng ca cần thiết (`slots_needed`) của ca trống đã tồn tại: Chuyển đổi từ cơ chế cộng dồn mù quáng (`existing.slots_needed += payload.slotsNeeded`) sang cơ chế lũy đẳng thông minh (`existing.slots_needed = Math.max(existing.slots_needed, payload.slotsNeeded)`).
- Đảm bảo rằng nếu ca trống đã bao phủ hết hoặc một phần số lượng ca trống đề xuất từ cảnh báo, hệ thống chỉ cập nhật tối đa nhu cầu cao nhất, triệt tiêu hoàn toàn hiện tượng phình số slot sai khi click "Tạo tất cả ca trống" hoặc "Tạo ca trống" lặp lại trên cùng một kết quả Smart Schedule.

Verify:
- eslint: passed
- tsc: passed

---

### P1-01 - Warning Acknowledge Audit Trail
Status: done
Ngày: 2026-05-18
Đã làm:
- Thiết lập và mở rộng interface `ScheduleWarning` thêm trường `reason?: string` tùy chọn trong file [src/lib/mock-data-schedule-rules.ts](file:///c:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/mock-data-schedule-rules.ts).
- Triển khai interface `WarningAcknowledgement` cùng cơ chế lưu trữ và phục hồi dữ liệu từ `localStorage` thông qua hàm `getPersistedAcknowledgements` và hàm ghi đè `acknowledgeWarning` có lý do giải trình.
- Cập nhật hàm quét cảnh báo `scanWeekWarnings` để tự động đối chiếu các dòng cảnh báo chưa phản hồi với danh sách `localStorage` và chuyển đổi trạng thái `is_acknowledged: true` kèm thông tin người duyệt, thời gian và lý do xác nhận cụ thể.
- Xây dựng giao diện Dialog Modal nhập lý do giải trình cực kỳ mượt mà, chuyên nghiệp và hiển thị thông tin nhật ký kiểm duyệt trên từng thẻ cảnh báo đã xác nhận tại [src/app/schedule/warnings/page.tsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/app/schedule/warnings/page.tsx).

Verify:
- eslint: passed
- tsc: passed

---

### P1-02 - Swap Audit Trail
Status: done
Ngày: 2026-05-18
Đã làm:
- Khai báo interface `SwapEvent` đại diện cho các sự kiện trong vòng đời yêu cầu đổi ca (tạo mới, đồng ý/từ chối của đồng nghiệp, hủy ca, và duyệt/từ chối của quản lý) trong file [src/lib/mock-data-swap.ts](file:///c:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/mock-data-swap.ts).
- Triển khai cơ chế lưu trữ `localStorage` đầy đủ cho danh sách `swapRequests` với các helper `getPersistedSwapRequests`, `saveSwapRequests`, và seed dữ liệu mẫu thông minh `getInitialSwapRequests` chứa sẵn timeline mẫu.
- Nâng cấp toàn bộ các hàm nghiệp vụ đổi/gánh ca: `createSwapRequest`, `respondToSwapRequest`, `managerApproveSwap`, `cancelSwapRequest` tự động tích hợp sự kiện lịch sử tương ứng vào mảng `events`.
- Xây dựng giao diện xem lịch sử xử lý (Timeline Dropdown) trực quan, có điểm nhấn màu sắc theo loại sự kiện trên từng thẻ yêu cầu đổi ca tại [src/app/schedule/swap/list/page.tsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/app/schedule/swap/list/page.tsx).

Verify:
- eslint: passed
- tsc: passed

---

### P1-03 - Open Shift Audit Trail
Status: done
Ngày: 2026-05-18
Đã làm:
- Khai báo interface `OpenShiftEvent` và mở rộng `OpenShift` thêm trường `events?: OpenShiftEvent[]` trong file [src/lib/mock-data-open-shifts.ts](file:///c:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/lib/mock-data-open-shifts.ts).
- Lưu trữ persistent danh sách ca trống và yêu cầu nhận ca trống thông qua `localStorage` (`homies_open_shifts` & `homies_open_shift_claims`), triển khai seeding dữ liệu thông minh chứa sẵn timeline sự kiện mẫu.
- Tích hợp ghi nhận lịch sử cho toàn bộ các hàm xử lý vòng đời ca trống & đăng ký nhận ca: `createOpenShift`, `createOpenShiftsFromWarnings`, `cancelOpenShift`, `claimOpenShift` (bao gồm auto-approved), và `approveOrRejectClaim` (kèm tự động từ chối các đăng ký dư thừa khi ca đã đủ người).
- Tích hợp component xem lịch sử xử lý trực quan ngay trên giao diện danh sách ca đã đăng ký của Nhân viên tại [src/app/schedule/open-shifts/page.tsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/app/schedule/open-shifts/page.tsx).
- Tích hợp component xem lịch sử ca trống trên màn hình Duyệt nhận ca của Quản lý tại [src/app/schedule/open-shifts/claims/page.tsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/hrm-tra-sua/src/app/schedule/open-shifts/claims/page.tsx).

Verify:
- eslint: passed
- tsc: passed

---

### P1-04 - Compare Với Tuần Trước
Status: done
Ngày: 2026-05-18
Đã làm:
- Tích hợp hàm `compareWithPreviousWeek` từ `mock-data-smart-schedule.ts` vào `ScheduleResultView.tsx` để tính toán sự thay đổi giữa ca hiện tại với tuần trước đó.
- Hiển thị trực tiếp các chỉ số so sánh (tăng/giảm tổng giờ làm, tiết kiệm chi phí lương, tăng/giảm tỷ lệ độ phủ ca) ngay dưới các thẻ thống kê tổng quan của lịch tuần.
- Bổ sung chỉ số hiệu năng sử dụng tài chính (Efficiency index) giúp người quản lý nhìn thấy ngay hiệu suất vận hành so với tuần trước.

Verify:
- eslint: passed
- tsc: passed

---

### P1-05 - Save Generation History
Status: done
Ngày: 2026-05-18
Đã làm:
- Thiết lập dịch vụ lưu lịch sử bản thảo `generation-history.ts` hoạt động trên local storage.
- Tích hợp tự động lưu bản thảo (với version tự động tăng) khi người dùng tạo lịch bằng Smart Scheduling.
- Triển khai widget "Lịch sử bản thảo" hiển thị các phiên bản xếp lịch đã sinh cho tuần hiện tại, tích hợp tính năng xóa bản thảo.
- Triển khai chức năng khôi phục (restore) bản thảo cũ làm active schedule khi người dùng nhấp chọn trong lịch sử.
- Tích hợp công cụ so sánh bản thảo so le (Side-by-side Draft Comparison): Khi chọn một bản thảo đối chiếu, giao diện hiển thị ngay sự chênh lệch chi tiết về Chi phí, Tổng giờ làm, Độ phủ ca, Số lượng cảnh báo và Tỷ lệ tương thích nguyện vọng của nhân viên.

Verify:
- eslint: passed
- tsc: passed

---

### P3-01 - Manage Page UX
Status: done
Ngày: 2026-05-18
Đã làm:
- `src/app/schedule/manage/page.tsx` có thêm search theo tên/mã NV/vị trí, filter theo vị trí và trạng thái đã có lịch/chưa có lịch để manager xử lý danh sách dài dễ hơn.
- Thêm nút `Copy lịch từ tuần trước`, có confirm khi tuần hiện tại đã có dữ liệu và chỉ copy vào các ô còn trống.
- Hiển thị trạng thái tuần rõ hơn bằng badge `published/reviewing/open/closed/draft`, kèm summary số ca, số nhân viên đã được xếp và deadline đăng ký nếu có.
- Màn `manage` giờ đọc được `storeId`, `weekStart`, `focusDate` từ query để nhận context sâu hơn từ staffing / warning flows; đồng thời hỗ trợ chọn store cho `ceo/hr_admin`.

Verify:
- eslint: passed
- tsc: passed

---

### P3-02 - Drag Drop Editor Auto Save
Status: done
Ngày: 2026-05-18
Đã làm:
- `src/components/scheduling/DragDropScheduleEditor.tsx` có autosave debounce 1.5 giây vào `localStorage` theo từng lịch tuần đang chỉnh.
- Khi mở lại editor, nếu có draft chưa confirm thì hệ thống hỏi khôi phục; sau khi confirm publish thì draft tạm được dọn đi để tránh hồi nhầm.
- Thêm panel trạng thái ngay trong editor để manager biết đang có thay đổi chưa xác nhận, thời điểm autosave gần nhất, và đã khôi phục từ draft nào nếu có.
- `SmartScheduleGenerator` gắn `key` theo `result.id/generatedAt` khi mở editor để mỗi lượt chỉnh sửa remount sạch, tránh state cũ bị kẹt.

Verify:
- eslint: passed
- tsc: passed

---

### P3-03 - Position Compatibility
Status: done
Ngày: 2026-05-18
Đã làm:
- Tạo helper dùng chung `src/lib/scheduling/position-compatibility.ts` để mô tả mapping vị trí và các cặp cover hợp lệ cơ bản như `barista -> cashier`, `cashier -> support`, `store_manager -> fallback`.
- `src/lib/mock-data-open-shifts.ts` và `src/lib/notifications/open-shift-notifications.ts` giờ dùng cùng helper này khi xác định nhân viên đủ điều kiện thấy/nhận ca trống.
- `src/lib/scheduling/preference-aware-generator.ts` đã chặn các ứng viên không tương thích vị trí ngay từ bước đánh giá, đồng thời cộng điểm riêng cho cover tương thích nhưng không exact-match.

Verify:
- eslint: passed
- tsc: passed

---

### P3-04 - Staffing Alerts Actionable
Status: done
Ngày: 2026-05-18
Đã làm:
- `src/app/staffing/page.tsx` không còn chỉ hiển thị forecast/alerts/optimize dạng read-only; các card thiếu người/dư người/biến động sự kiện giờ có CTA mở đúng flow xử lý.
- Forecast card có thể mở thẳng màn `manage` theo đúng `weekStart` và `focusDate`, hoặc sang warnings của tuần đó.
- Alert thiếu người giờ có action `Xếp ca ngay` và `Xử lý thiếu người`; alert dư người có `Rà soát lịch`; alert sự kiện có shortcut vào `Smart Schedule`.
- Các suggestion ở tab tối ưu giờ không còn nút trang trí, mà điều hướng sang `manage` hoặc `settings/staffing?tab=schedule` tùy ngữ cảnh.

Verify:
- eslint: passed
- tsc: passed

---

### P3-05 - Mobile Consistency
Status: done
Ngày: 2026-05-18
Đã làm:
- `src/components/staffing/mobile/MobileWeekOverview.tsx` giờ hiểu cả warning gắn theo `shift id` lẫn warning `understaffed:date:slot:position:count`, nên mobile không bỏ sót cảnh báo thiếu người như trước.
- Thêm action mobile đi tới `/schedule/warnings?weekStart=...` và `/schedule/open-shifts` để warning/open-shift flow có đường xử lý tương ứng trên điện thoại.
- `MobileShiftCard`, `MobileSummaryBar`, `MobileScheduleView` được làm mềm lại để dùng được ở chế độ read-only, không lộ các nút sửa/xóa vô tác dụng khi parent không cấp callback.
- `SmartScheduleGenerator` giờ render `ScheduleView` trên mobile/tablet, nghĩa là nhánh mobile schedule không còn là component bị bỏ quên ngoài flow tạo lịch thật.

Verify:
- eslint: passed
- tsc: passed

---

### P3-06 - Smart Scheduler Algorithm Nâng Cao
Status: done
Ngày: 2026-05-18
Đã làm:
- `src/lib/scheduling/preference-aware-generator.ts` được nâng thêm một lớp fairness scoring: cân bằng số ngày làm giữa nhân viên, giảm lặp cùng loại ca, giảm dồn cuối tuần cho cùng một người, và đọc thêm `preferredShifts` ở cấp staff.
- Thuật toán giờ không chỉ chấm điểm theo preference + remaining hours, mà còn tách rõ hơn giữa hard filter và soft scoring để lựa chọn ổn định hơn trong các slot có nhiều ứng viên tương đương.
- Mỗi ca được generate có thêm `assignmentReason` giải thích ngắn vì sao nhân viên đó được chọn, ví dụ khớp preference, đúng chuyên môn, cân bằng ngày làm, hoặc cover vị trí gần kề khi cần.
- `ScheduleResultView` và `MobileShiftCard` đã tận dụng phần explainability này để manager có chỗ nhìn thấy lý do xếp ca ngay trên UI.

Verify:
- eslint: passed
- tsc: passed

---

### P3-07 - Notification Orchestration Sâu Hơn
Status: done
Ngày: 2026-05-18
Đã làm:
- `src/lib/notifications/notification-center.ts` có thêm `createNotificationDeduped`, `createBulkNotificationsDeduped`, và `getNotificationActionUrl(...)` để chuẩn hóa deep-link cùng cơ chế chống spam duplicate cho scheduling notifications.
- `swap-notifications.ts`, `open-shift-notifications.ts`, `preference-notifications.ts` giờ đều gửi metadata `action_url` thống nhất và dùng đường tạo notification có dedupe.
- `src/components/notifications/NotificationBell.tsx` giờ có action `Mở`, click vào sẽ tự mark-as-read rồi điều hướng đến đúng màn swap/open shift/preferences tương ứng.
- Deep-link scheduling giờ đi kèm query chính xác hơn như `tab`, `requestId`, `claimId`, `openShiftId`, `weekStart` để điều hướng vào đúng context thay vì chỉ mở route gốc.
- Các màn `swap/list`, `open-shifts`, `open-shifts/claims`, `preferences` đã đọc query params này để tự chọn đúng tab, đúng tuần và scroll/highlight card liên quan.
- Bổ sung mapping hiển thị cho `swap_cancelled` và giữ một lớp fallback route cho các loại notification scheduling ngay cả khi metadata không đầy đủ.

Verify:
- eslint: passed
- tsc: passed

---

### Template cập nhật

```md
### P0-XX - Tên task
Status: done
Ngày: YYYY-MM-DD
Đã làm:
- ...
- ...

Verify:
- eslint: passed
- tsc: passed

Ghi chú:
- ...
```

Hiện tại chưa có task nào trong backlog này được cập nhật bởi minimax.

---

## Prompt đề xuất cho Minimax

Sử dụng prompt này khi bắt đầu:

```text
Đọc file genesis/v3/08_HANDOFF_SCHEDULING_MINIMAX.md trước khi làm bất kỳ thay đổi nào.

Làm đúng thứ tự task trong phần Execution Order.
Ưu tiên tuyệt đối nhóm P0 trước.

Mỗi task phải:
1. đọc file liên quan
2. sửa code
3. verify bằng eslint + tsc trong scope file sửa
4. cập nhật lại chính file handoff ở phần Progress

Không revert thay đổi hiện có.
Không làm task ngoài backlog nếu chưa xong P0.
```

---

## Ghi chú cuối

Nếu cần hiểu nhanh bối cảnh code hiện tại, hãy đọc theo thứ tự:
1. `src/components/scheduling/ScheduleResultView.tsx`
2. `src/lib/scheduling/preference-aware-generator.ts`
3. `src/lib/mock-data-open-shifts.ts`
4. `src/lib/mock-data-swap.ts`
5. `src/app/schedule/admin/review/page.tsx`

Đó là các điểm đã được nối flow nhiều nhất và dễ gây regression nếu sửa thiếu context.
