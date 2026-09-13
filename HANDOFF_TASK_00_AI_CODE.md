# Handoff Cho AI Code - TASK-00

Mục tiêu tài liệu:
- Đây là handoff đầu tiên cho AI code
- Dùng để thực hiện `TASK-00` trong backlog pilot
- Viết theo kiểu copy-paste được, đọc là làm được

Ngữ cảnh:
- Project hiện tại là HRM web
- Mục tiêu gần nhất là `Pilot Ready v1`
- Pilot store đã chốt là: `store-001`
- Chỉ có `1 AI code worker`
- Auth đi theo hướng: `chuyển tiếp trước, harden sau`
- Offline check-in: vẫn giữ trong pilot, nhưng `không phải blocker của Sprint 1`
- Payroll là `vùng khóa an toàn`, chưa mở rộng tính năng

Mục tiêu lớn của đợt này:
- Chốt được bản pilot đủ dùng cho 1 cửa hàng
- Flow ưu tiên:
  - login / user context
  - employees cơ bản
  - schedule
  - attendance
  - leave

---

## 1. TASK-00 là gì?

`TASK-00` không phải task code tính năng.

`TASK-00` là task rà soát và khóa phạm vi để chuẩn bị cho các task code tiếp theo.

Nói ngắn gọn:
- xác định đúng vùng pilot
- xác định đúng vùng cấm sửa
- xác định đúng nơi đang có hard-code user
- xác định đúng nơi đang còn phụ thuộc mock ở flow pilot

Task này làm tốt sẽ giúp các task sau không bị lạc hướng.

---

## 2. Mục tiêu bắt buộc của TASK-00

Sau khi xong TASK-00, cần có 4 đầu ra:

### 1. Danh sách file thuộc scope pilot

Phải chỉ ra rõ những file chính của pilot hiện nay nằm ở đâu.

### 2. Danh sách file/vùng không được đụng

Phải chỉ ra rõ những module ngoài phạm vi, AI code không nên sửa ở đợt này.

### 3. Danh sách nơi đang hard-code user hoặc employee

Phải tìm ra những nơi trong flow pilot đang:
- gắn cứng user
- gắn cứng employee id
- giả lập user thay vì lấy từ auth context

### 4. Danh sách nơi đang phụ thuộc mock data trong flow pilot

Phải tìm ra:
- page nào đang đọc mock data
- flow nào đang chỉ toast thành công nhưng không có dữ liệu thật
- vùng nào là blocker cho pilot

---

## 3. TASK-00 có cần sửa code không?

### Mặc định: Không

Task này ưu tiên:
- đọc
- rà
- tổng hợp

### Chỉ được sửa file nếu thật sự cần

Ví dụ:
- thêm 1 file note nội bộ
- cập nhật 1 tài liệu backlog nếu cần làm rõ

Không được:
- tự ý refactor code
- tự ý sửa logic auth
- tự ý sửa flow pilot trong TASK-00

Nếu thấy bug hoặc vấn đề:
- chỉ ghi nhận
- không sửa ở task này

---

## 4. Phạm vi phải đọc trong TASK-00

AI code phải đọc tối thiểu các vùng sau.

## 4.1 Flow pilot

### Auth / nền tảng

- `src/store/auth-store.ts`
- `src/lib/supabase.ts`
- `src/middleware.ts`
- `src/components/auth/ProtectedRoute.tsx`
- `src/app/login/page.tsx`
- `src/app/page.tsx`

### Nhân sự

- `src/app/employees/page.tsx`
- `src/app/employees/[id]/page.tsx`
- `src/app/employees/new/page.tsx`

### Lịch làm

- `src/app/schedule/page.tsx`
- `src/app/schedule/assign/page.tsx`
- `src/app/schedule/manage/page.tsx`
- `src/app/schedule/by-shift/page.tsx`

### Chấm công

- `src/app/checkin/page.tsx`
- `src/app/attendance/page.tsx`
- `src/app/attendance/today/page.tsx`
- `src/app/attendance/by-date/page.tsx`

### Nghỉ phép

- `src/app/leave/page.tsx`
- `src/app/leave/request/page.tsx`
- `src/app/leave/approval/page.tsx`

### Data/helper có khả năng ảnh hưởng trực tiếp đến pilot

- `src/lib/mock-data.ts`
- `src/lib/mock-data-checkin.ts`
- `src/lib/mock-data-leave.ts`
- `src/lib/mock-data-scheduling.ts`
- `src/lib/offline-checkin.ts`
- `src/lib/leave-attendance-sync.ts`

## 4.2 Vùng cấm sửa trong đợt này

AI code cần xác nhận lại các vùng sau là `out of scope`:

- `src/app/kpi/**`
- `src/app/career*`
- `src/app/learning/**`
- `src/app/wellness/**`
- `src/app/gamification/**`
- `src/app/reports/**`

### Payroll

Payroll không hoàn toàn out of scope, nhưng:
- chưa được mở rộng tính năng
- chỉ được xem là vùng an toàn cần rà về quyền nếu task sau yêu cầu

---

## 5. Điều AI code phải tìm ra trong TASK-00

AI code phải trả lời được rõ các câu hỏi sau:

### A. Pilot hiện đang phụ thuộc mock ở đâu?

Ví dụ:
- employees list
- leave request list
- schedule list
- attendance summary

Không cần sửa, chỉ cần chỉ ra đúng file và mức độ phụ thuộc.

### B. Pilot hiện đang hard-code user ở đâu?

Ví dụ:
- hard-code employee id
- hard-code current user
- login demo

### C. Auth hiện tại đang là auth kiểu gì?

Phải mô tả ngắn:
- nguồn user là gì
- session đang lưu ở đâu
- page nào đang tự push `/login`
- page nào đang tin vào client-side state

### D. Những gì sẽ là blocker cho TASK-01, TASK-02, TASK-03?

Phải chỉ ra rõ:
- blocker của auth
- blocker của employee data
- blocker của schedule

---

## 6. Cách làm được khuyến nghị

AI code nên làm theo đúng thứ tự sau:

### Bước 1

Đọc backlog:
- `KE_HOACH_TRIEN_KHAI_CHO_TEAM_CODE.md`
- `PHAN_VIEC_AI_CODE_PILOT_READY_V1.md`
- `BACKLOG_PILOT_AI_CODE_JIRA_READY.md`

Mục đích:
- hiểu đúng pilot scope

### Bước 2

Đọc flow auth và login trước.

Mục đích:
- hiểu user đang vào app bằng cách nào

### Bước 3

Đọc lần lượt 4 flow pilot:
- employees
- schedule
- attendance
- leave

Mục đích:
- xem mỗi flow đang dùng dữ liệu nào

### Bước 4

Tổng hợp theo 4 nhóm:
- scope pilot
- vùng cấm sửa
- hard-code user
- phụ thuộc mock

### Bước 5

Viết báo cáo kết quả theo đúng mẫu ở cuối file này.

---

## 7. Những điều không được làm trong TASK-00

AI code không được:
- sửa auth logic
- thay đổi code flow pilot
- refactor mock-data
- chạm vào payroll
- dọn dẹp repo hàng loạt
- sửa UI
- tạo thêm feature

Task này là task rà soát và khóa phạm vi.

---

## 8. Definition of Done cho TASK-00

TASK-00 chỉ được coi là xong khi:

### 1. Có danh sách scope pilot rõ

Phải nhóm được:
- auth
- employees
- schedule
- attendance
- leave

### 2. Có danh sách vùng cấm sửa rõ

Phải chỉ ra được:
- module ngoài pilot
- module chưa được ưu tiên

### 3. Có danh sách hard-code user rõ

Phải chỉ ra:
- file
- dòng hoặc khu vực
- kiểu hard-code là gì

### 4. Có danh sách phụ thuộc mock rõ

Phải chỉ ra:
- file
- dữ liệu mock nào
- ảnh hưởng đến pilot ở mức nào

### 5. Có khuyến nghị task kế tiếp

Phải nói ngắn gọn:
- TASK-01 nên xử lý gì trước

---

## 9. Mẫu kết quả AI code phải gửi lại

Khi làm xong TASK-00, AI code phải trả về theo đúng mẫu này:

```text
TASK: TASK-00

1. Scope pilot đã rà
- Auth:
- Employees:
- Schedule:
- Attendance:
- Leave:

2. Vùng cấm sửa / out of scope
- 

3. Các nơi đang hard-code user / employee
- File:
  Mô tả:
  Mức độ ảnh hưởng:

4. Các nơi đang phụ thuộc mock data trong flow pilot
- File:
  Mock đang dùng:
  Ảnh hưởng:

5. Nhận định về auth hiện tại
- 

6. Blocker cho task tiếp theo
- TASK-01:
- TASK-02:
- TASK-03:

7. File đã sửa
- Nếu không sửa file nào thì ghi rõ: không sửa file

8. Assumption
- 

9. Cách mình khuyên nên làm TASK-01
- 
```

---

## 10. Prompt copy-paste giao cho AI code

```text
Bạn đang làm TASK-00 cho project HRM pilot.

Bối cảnh:
- Pilot store: store-001
- Chỉ có 1 AI code worker
- Auth: chuyển tiếp trước, harden sau
- Offline check-in: giữ trong pilot nhưng không là blocker của Sprint 1
- Payroll: vùng khóa an toàn, chưa mở rộng

TASK-00 không phải task code tính năng.
TASK-00 là task rà soát và khóa phạm vi để chuẩn bị cho các task sau.

Mục tiêu bắt buộc:
1. Xác định scope pilot
2. Xác định vùng cấm sửa
3. Tìm các nơi hard-code user hoặc employee trong flow pilot
4. Tìm các nơi đang phụ thuộc mock data trong flow pilot

Bạn phải đọc tối thiểu các file:

Auth / nền tảng:
- src/store/auth-store.ts
- src/lib/supabase.ts
- src/middleware.ts
- src/components/auth/ProtectedRoute.tsx
- src/app/login/page.tsx
- src/app/page.tsx

Nhân sự:
- src/app/employees/page.tsx
- src/app/employees/[id]/page.tsx
- src/app/employees/new/page.tsx

Lịch làm:
- src/app/schedule/page.tsx
- src/app/schedule/assign/page.tsx
- src/app/schedule/manage/page.tsx
- src/app/schedule/by-shift/page.tsx

Chấm công:
- src/app/checkin/page.tsx
- src/app/attendance/page.tsx
- src/app/attendance/today/page.tsx
- src/app/attendance/by-date/page.tsx

Nghỉ phép:
- src/app/leave/page.tsx
- src/app/leave/request/page.tsx
- src/app/leave/approval/page.tsx

Data/helper liên quan:
- src/lib/mock-data.ts
- src/lib/mock-data-checkin.ts
- src/lib/mock-data-leave.ts
- src/lib/mock-data-scheduling.ts
- src/lib/offline-checkin.ts
- src/lib/leave-attendance-sync.ts

Out of scope:
- src/app/kpi/**
- src/app/career*
- src/app/learning/**
- src/app/wellness/**
- src/app/gamification/**
- src/app/reports/**

Không được làm trong TASK-00:
- không refactor
- không sửa logic auth
- không sửa flow pilot
- không redesign UI
- không tạo feature mới

Chỉ được sửa file nếu thật sự cần để thêm note nội bộ, còn mặc định là không sửa gì.

Khi xong phải trả về đúng mẫu:

TASK: TASK-00

1. Scope pilot đã rà
- Auth:
- Employees:
- Schedule:
- Attendance:
- Leave:

2. Vùng cấm sửa / out of scope
- 

3. Các nơi đang hard-code user / employee
- File:
  Mô tả:
  Mức độ ảnh hưởng:

4. Các nơi đang phụ thuộc mock data trong flow pilot
- File:
  Mock đang dùng:
  Ảnh hưởng:

5. Nhận định về auth hiện tại
- 

6. Blocker cho task tiếp theo
- TASK-01:
- TASK-02:
- TASK-03:

7. File đã sửa
- Nếu không sửa file nào thì ghi rõ: không sửa file

8. Assumption
- 

9. Cách mình khuyên nên làm TASK-01
- 
```

---

## 11. Kỳ vọng khi nhận kết quả về

Khi AI code gửi kết quả TASK-00 về, người review sẽ dùng nó để:
- xác nhận worker hiểu đúng project
- xác nhận worker không làm sai scope
- quyết định có cho sang TASK-01 hay không

Nếu báo cáo mơ hồ, thiếu hard-code chính, hoặc bỏ sót vùng pilot lớn:
- coi như TASK-00 chưa đạt

Nếu báo cáo rõ, có hệ thống, bám đúng scope:
- pass và chuyển TASK-01

