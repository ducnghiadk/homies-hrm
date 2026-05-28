# Handoff Review Feedback Cho AI Code - Round 1

Ngày cập nhật: 2026-05-19

Mục tiêu:
- Phản hồi lại kết quả AI code theo đúng cách giao tiếp handoff
- Chỉ ra rõ:
  - phần nào đã đi đúng hướng
  - phần nào chưa đạt
  - blocker nào phải sửa ngay
  - điều kiện để pass vòng review tiếp theo

Trạng thái hiện tại:
- `Chưa pass`
- Cần sửa tiếp trước khi sang task kế tiếp

---

## 1. Kết luận ngắn

Bạn đã đi đúng hướng ở một số điểm:
- Đã bắt đầu đưa `employees/page.tsx` sang service layer
- Đã sửa `employees/new/page.tsx` để không còn chỉ `setTimeout` giả lập
- Đã bỏ được hard-code `currentEmployeeId = 'emp-005'` trong leave flow chính
- Đã sửa ngày mặc định ở `attendance/by-date/page.tsx`

Tuy nhiên bản hiện tại **chưa đạt** vì còn các lỗi blocker:
- Build fail
- Detail employee vẫn bypass policy pilot
- Role mới tạo không khớp model hệ thống
- Leave flow còn lỗi dependency / lint
- Chưa tạo file SQL pilot đã được yêu cầu

Vì vậy:
- **Không được coi là xong**
- **Chưa được sang bước tiếp theo**

---

## 2. Các blocker phải sửa ngay

## Blocker 1 - Build đang fail do mất export `DEMO_ACCOUNTS`

### Hiện trạng

Bạn đã thay đổi `src/store/auth-store.ts`, nhưng không còn export `DEMO_ACCOUNTS`.

Trong khi đó các file sau vẫn đang import:
- `src/app/rbac/page.tsx`
- `src/components/layout/Header.tsx`

Kết quả:
- `npm run build` fail

### Bằng chứng

Build lỗi ở:
- `src/app/rbac/page.tsx`
- `src/components/layout/Header.tsx`

### Yêu cầu sửa

Bạn phải chọn **một trong hai cách**:

### Cách A - Khôi phục export tương thích

Nếu muốn thay đổi ít nhất:
- export lại `DEMO_ACCOUNTS` từ `auth-store.ts`
- giữ tương thích cho các màn hình đang phụ thuộc nó

### Cách B - Sửa nơi đang import

- sửa `rbac/page.tsx`
- sửa `Header.tsx`
- để các file đó không còn phụ thuộc vào `DEMO_ACCOUNTS`

### Khuyến nghị

Với scope hiện tại, nên chọn:
- `Cách A`, tức là giữ backward compatibility để không làm lan rộng

### Điều kiện pass blocker này

- `npm run build` phải chạy qua được

---

## Blocker 2 - Employee detail vẫn đọc mock trực tiếp

### Hiện trạng

`src/app/employees/[id]/page.tsx` vẫn đang:
- đọc `mockEmployees`
- không dùng `EmployeeService`
- không kiểm tra policy xem user hiện tại có được xem employee đó hay không

### Rủi ro

Store manager của `store-001` vẫn có thể mở thẳng URL của nhân sự ngoài store mình nếu biết id.

Điều này vi phạm chính sách pilot đã chốt:
- `store_manager` chỉ được thấy nhân sự thuộc store mình quản lý

### Yêu cầu sửa

Bạn phải sửa `src/app/employees/[id]/page.tsx` để:
- dùng `EmployeeService`
- đọc đúng employee từ data layer pilot
- kiểm tra scope theo role/store

### Rule bắt buộc

- `ceo`, `hr_admin`: xem được toàn công ty
- `store_manager`, `shift_leader`: chỉ xem được user cùng store
- `employee`: không được xem chi tiết người khác nếu không có policy riêng

### Điều kiện pass blocker này

- Detail page không còn đọc `mockEmployees` trực tiếp cho flow pilot
- Không còn bypass policy bằng cách sửa URL

---

## Blocker 3 - Role `"manager"` không hợp lệ với model hệ thống

### Hiện trạng

Trong `src/app/employees/new/page.tsx`, form role đang có option:
- `"manager"`

Nhưng type hệ thống hiện tại chỉ có:
- `ceo`
- `hr_admin`
- `store_manager`
- `area_manager`
- `shift_leader`
- `employee`

### Rủi ro

Nếu lưu role `"manager"`:
- dữ liệu tạo mới sẽ không khớp type chuẩn
- logic phân quyền về sau sẽ lỗi hoặc méo

### Yêu cầu sửa

Bạn phải thay `"manager"` bằng role hợp lệ.

### Khuyến nghị

Cho pilot hiện tại, đơn giản nhất là:
- giữ `employee`
- nếu cần role quản lý thì phải chọn rõ một role hợp lệ như `store_manager` hoặc `shift_leader`

### Điều kiện pass blocker này

- Không còn giá trị role ngoài enum của hệ thống

---

## Blocker 4 - Leave flow còn lỗi dependency / lint

### Hiện trạng

Trong `src/app/leave/request/page.tsx`, bạn đã dùng thêm:
- `user?.full_name`
- `user?.role`
- `user?.store_id`

nhưng `useCallback` của `handleSubmit` chưa cập nhật dependencies tương ứng.

### Kết quả

ESLint báo lỗi:
- `react-hooks/preserve-manual-memoization`
- `react-hooks/exhaustive-deps`

### Yêu cầu sửa

Bạn phải sửa callback này cho đúng:
- hoặc bổ sung đủ dependencies
- hoặc bỏ `useCallback` nếu không còn cần thiết

### Khuyến nghị

Với scope hiện tại:
- ưu tiên cách đơn giản, rõ ràng, ít rủi ro

### Điều kiện pass blocker này

- Chạy lint ở file leave không còn lỗi mức error

---

## Blocker 5 - Chưa có file SQL pilot

### Hiện trạng

Theo handoff đã chốt, cần chuẩn bị:
- `supabase/pilot_ready_v1_schema.sql`
- `supabase/pilot_ready_v1_seed_store_001.sql`

Hiện tại chưa thấy hai file này tồn tại.

### Yêu cầu sửa

Tạo hai file SQL pilot tối thiểu như đã thống nhất.

### Scope schema tối thiểu

Chỉ cần phục vụ pilot:
- users
- stores
- positions
- shifts
- schedules
- attendance
- leave_requests

### Không được làm

- Không mở rộng payroll schema
- Không ôm toàn bộ platform schema
- Không tự đổi naming từ `users` sang `profiles`

### Điều kiện pass blocker này

- Cả hai file SQL tồn tại
- Nội dung bám đúng pilot scope

---

## 3. Những điểm làm đúng, nên giữ

Các điểm này đúng hướng, không cần rollback:

### 1. Tạo `EmployeeService`

Đây là hướng đúng:
- page không nên tự xử lý localStorage trực tiếp
- cần đi qua service layer

### 2. Lọc employees list theo role/store

Hướng này đúng với policy pilot đã chốt.

### 3. Sửa `employees/new` để có save thật ở mức pilot

Đây là bước đúng, chỉ cần chỉnh lại:
- role hợp lệ
- độ an toàn dữ liệu

### 4. Bỏ hard-code `emp-005` trong leave

Đây là sửa đúng hướng, chỉ còn lỗi lint/dependency cần hoàn thiện

---

## 4. Những điều không được làm khi sửa vòng tiếp theo

Trong vòng sửa tiếp theo, bạn không được:
- refactor toàn bộ auth-store lớn hơn mức cần thiết
- đổi model toàn hệ thống sang `profiles`
- mở rộng payroll feature
- mở thêm scope KPI/career/learning
- đụng sâu offline attendance nếu không liên quan blocker hiện tại

Chỉ sửa đúng các blocker nêu trên.

---

## 5. Danh sách file bạn phải kiểm tra lại ngay

### Bắt buộc sửa / rà lại

- `src/store/auth-store.ts`
- `src/app/rbac/page.tsx`
- `src/components/layout/Header.tsx`
- `src/app/employees/[id]/page.tsx`
- `src/app/employees/new/page.tsx`
- `src/app/leave/request/page.tsx`
- `supabase/pilot_ready_v1_schema.sql`
- `supabase/pilot_ready_v1_seed_store_001.sql`

### Có thể cần rà thêm

- `src/lib/services/employee-service.ts`

---

## 6. Definition of Done cho vòng sửa này

Vòng sửa này chỉ được coi là đạt khi đủ tất cả điều kiện sau:

1. `npm run build` pass
2. `DEMO_ACCOUNTS` mismatch không còn làm vỡ app
3. `employees/[id]` không còn bypass policy pilot
4. Không còn role `"manager"` sai model
5. Leave file không còn lỗi lint mức error
6. Có đủ 2 file SQL pilot

Nếu thiếu 1 trong 6 điều trên:
- coi như chưa đạt

---

## 7. Cách bạn nên sửa

Thứ tự nên làm:

### Bước 1

Sửa build blocker trước:
- `DEMO_ACCOUNTS`

### Bước 2

Sửa `employees/[id]` sang service layer + policy check

### Bước 3

Sửa role `"manager"` ở form nhân sự

### Bước 4

Sửa dependency/lint ở leave

### Bước 5

Tạo 2 file SQL pilot

### Bước 6

Tự chạy lại:
- build
- lint tối thiểu ở file đã sửa

---

## 8. Mẫu báo cáo bạn phải gửi lại sau khi sửa

```text
TASK: REVIEW FIX ROUND 1

1. Các blocker đã sửa
- Blocker 1:
- Blocker 2:
- Blocker 3:
- Blocker 4:
- Blocker 5:

2. File đã sửa
- 

3. Kết quả build
- 

4. Kết quả lint
- 

5. Cách test tay
- 

6. Assumption
- 

7. Rủi ro còn lại
- 
```

---

## 9. Prompt ngắn gửi lại cho AI code

```text
Đây là review feedback cho vòng hiện tại. Kết quả hiện tại CHƯA PASS.

Bạn chỉ được sửa tiếp đúng các blocker sau:

1. Build đang fail vì auth-store không còn export DEMO_ACCOUNTS nhưng:
- src/app/rbac/page.tsx
- src/components/layout/Header.tsx
vẫn đang import.

Yêu cầu:
- ưu tiên sửa theo hướng backward compatible, ít lan rộng nhất
- mục tiêu là npm run build phải pass

2. src/app/employees/[id]/page.tsx vẫn đọc mockEmployees trực tiếp

Yêu cầu:
- chuyển sang dùng EmployeeService
- áp policy xem theo role/store đúng như pilot đã chốt

3. src/app/employees/new/page.tsx đang lưu role = "manager"

Yêu cầu:
- thay bằng role hợp lệ trong hệ thống
- không được lưu dữ liệu sai enum role

4. src/app/leave/request/page.tsx còn lỗi dependency/lint ở useCallback(handleSubmit)

Yêu cầu:
- sửa để lint không còn lỗi mức error

5. Chưa có:
- supabase/pilot_ready_v1_schema.sql
- supabase/pilot_ready_v1_seed_store_001.sql

Yêu cầu:
- tạo 2 file SQL pilot tối thiểu
- không mở rộng payroll
- không đổi model users sang profiles

Không được làm:
- không mở rộng scope
- không refactor lớn
- không đụng KPI/career/learning
- không mở payroll feature

Chỉ khi đủ các điều kiện sau mới được coi là pass:
1. npm run build pass
2. DEMO_ACCOUNTS mismatch hết
3. employee detail không bypass policy
4. không còn role "manager" sai model
5. leave file không còn lint error
6. có đủ 2 file SQL pilot

Khi xong, báo lại theo mẫu:

TASK: REVIEW FIX ROUND 1

1. Các blocker đã sửa
- Blocker 1:
- Blocker 2:
- Blocker 3:
- Blocker 4:
- Blocker 5:

2. File đã sửa
- 

3. Kết quả build
- 

4. Kết quả lint
- 

5. Cách test tay
- 

6. Assumption
- 

7. Rủi ro còn lại
- 
```

