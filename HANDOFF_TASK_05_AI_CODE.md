Đây là handoff cho `TASK-05` của project `HRM Pilot Ready v1`.

## 1. Bối cảnh đã chốt

- Pilot store: `store-001`
- Chỉ có `1 AI code worker`
- Auth: `chuyển tiếp trước, harden sau`
- Offline check-in: giữ trong pilot nhưng không là blocker của giai đoạn này
- Payroll: vùng khóa an toàn, không mở rộng

## 2. Những gì đã xong trước TASK-05

Các phần sau đã pass review:
- `auth-store` đã ổn cho pilot tạm thời
- login flow hiện tại build được
- employee list/detail/new đã đi qua service layer
- employee detail đã chặn quyền theo role/store
- leave request đã bỏ blocker hard-code chính
- `eslint` và `build` đều đang pass

Vì vậy, từ đây trở đi:
- không quay lại sửa auth nếu không thật sự bắt buộc
- không quay lại mở rộng employee module nếu không bị block bởi schedule

## 3. Mục tiêu của TASK-05

Chuẩn hóa dữ liệu lịch cho pilot.

Nói đơn giản hơn:
- phải có `một nguồn dữ liệu lịch dùng chung`
- manager và employee không được đọc lịch từ hai nguồn mâu thuẫn
- dữ liệu lịch phải bám theo `store-001`
- chuẩn bị nền để sang `TASK-06` làm `draft / publish`

## 4. Kết quả đầu ra bắt buộc

Sau task này:
1. `schedule page` và `schedule assign page` phải dùng cùng một service/helper dữ liệu lịch
2. lịch không được đọc trực tiếp mock rải rác ở mỗi page theo cách khác nhau
3. có thể lấy được lịch theo:
- store
- user
- tuần / ngày cơ bản
4. kiến trúc phải đủ rõ để task sau thêm `draft` và `published`

## 5. Scope được sửa

Ưu tiên đọc trước:
- `src/app/schedule/page.tsx`
- `src/app/schedule/assign/page.tsx`
- `src/app/schedule/manage/page.tsx`
- `src/app/schedule/by-shift/page.tsx`
- `src/lib/mock-data-scheduling.ts`
- `src/lib/mock-data.ts`
- mọi helper/service lịch đang có
- các phần auth/user context nếu cần chỉ để đọc user, không sửa sâu

Có thể tạo mới:
- service/helper cho schedule
- type/helper nhỏ liên quan tới schedule nếu thật sự cần

Có thể sửa:
- `src/app/schedule/page.tsx`
- `src/app/schedule/assign/page.tsx`
- `src/app/schedule/manage/page.tsx`
- `src/app/schedule/by-shift/page.tsx`
- file service/helper lịch mới hoặc liên quan

## 6. Không được làm

- không làm `publish flow` ở task này
- không thêm UI lớn ngoài nhu cầu tối thiểu để nối dữ liệu
- không redesign trang schedule
- không mở rộng sang attendance
- không mở rộng sang leave
- không sửa payroll
- không refactor auth rộng
- không đổi policy role

Nếu có chỗ cần cho `draft/published`, chỉ chuẩn bị `data shape` hoặc `service shape`, không làm full flow.

## 7. Yêu cầu kỹ thuật cụ thể

### 7.1 Phải có service layer cho schedule

Không để các page schedule tự đọc mock theo kiểu riêng lẻ.

Yêu cầu:
- tạo một `ScheduleService` hoặc helper tương đương
- page schedule phải đi qua lớp này
- page assign cũng phải đi qua lớp này

### 7.2 Dữ liệu phải bám theo user/store thật

Yêu cầu:
- nếu user là `employee`: xem lịch cá nhân của chính mình
- nếu user là `store_manager` hoặc `shift_leader`: xem/làm việc trên lịch của `store_id` mình
- nếu user là `hr_admin` hoặc `ceo`: có thể xem rộng hơn, nhưng trong pilot vẫn ưu tiên `store-001`

### 7.3 Chuẩn hóa nguồn dữ liệu

Bạn có thể vẫn dùng mock/localStorage ở giai đoạn này.

Nhưng phải:
- có một nguồn đọc thống nhất
- có một cách lưu thống nhất
- không để `schedule/page.tsx` và `schedule/assign/page.tsx` mỗi nơi tự hiểu dữ liệu khác nhau

### 7.4 Chuẩn bị cho TASK-06

Service nên đủ chỗ để bước sau thêm:
- `draft`
- `published`
- tuần lịch
- publish hành động

Nhưng ở task này chưa cần hoàn thiện flow đó.

## 8. Điều nên ưu tiên

Ưu tiên theo thứ tự:
1. tạo service dữ liệu lịch dùng chung
2. nối `schedule/page.tsx` sang service
3. nối `schedule/assign/page.tsx` sang service
4. nếu còn thời gian và không lệch scope thì nối thêm `manage` hoặc `by-shift`

## 9. Definition of Done

Chỉ được coi là xong khi đủ các điều kiện:

1. Có `service/helper` lịch dùng chung rõ ràng
2. `schedule/page.tsx` và `schedule/assign/page.tsx` không còn đọc lịch từ hai nguồn mâu thuẫn
3. user khác nhau đọc đúng phạm vi lịch phù hợp với role/store
4. `eslint` pass cho các file đã chạm
5. `npm run build` vẫn pass
6. Không làm vỡ flow employee và leave đã pass trước đó

## 10. Cách test tay bạn phải tự kiểm tra

Tối thiểu tự test:

1. Login bằng `store_manager`
- vào trang lịch
- xem dữ liệu có bám store hợp lý không

2. Login bằng `employee`
- vào trang lịch
- không thấy lịch người khác như một danh sách lẫn lộn

3. Vào trang assign
- dữ liệu lịch lấy từ cùng nguồn với schedule page
- không có dấu hiệu mỗi trang hiển thị một kiểu dữ liệu khác nhau

4. Chạy lại:
- `eslint` cho file đã chạm
- `npm run build`

## 11. Format báo cáo bắt buộc

Khi làm xong, trả kết quả đúng format này:

```text
TASK: TASK-05

1. File đã sửa
- 

2. File mới đã tạo
- 

3. Đã chuẩn hóa gì trong data layer schedule
- 

4. Page nào đã chuyển sang dùng service chung
- 

5. Policy đọc lịch theo role/store hiện tại
- 

6. Điều gì CHƯA làm trong task này
- 

7. Kết quả kiểm tra
- eslint:
- build:

8. Rủi ro còn lại
- 

9. Assumption
- 
```

## 12. Prompt copy-paste cho AI code

```text
Bạn đang làm TASK-05 cho project HRM Pilot Ready v1.

Bối cảnh:
- pilot store: store-001
- auth chuyển tiếp trước, harden sau
- offline check-in chưa là blocker
- payroll khóa an toàn, không mở rộng
- chỉ có 1 AI code worker

Những phần đã pass:
- auth-store hiện tại dùng được cho pilot
- employees module đã qua service layer cơ bản
- leave request đã xử lý blocker chính
- eslint và build đang pass trước khi vào task này

Mục tiêu TASK-05:
- chuẩn hóa dữ liệu lịch cho pilot
- tạo một nguồn dữ liệu lịch dùng chung
- manager và employee không đọc lịch từ hai nguồn mâu thuẫn
- chuẩn bị nền cho TASK-06 làm draft/published

Ưu tiên đọc:
- src/app/schedule/page.tsx
- src/app/schedule/assign/page.tsx
- src/app/schedule/manage/page.tsx
- src/app/schedule/by-shift/page.tsx
- src/lib/mock-data-scheduling.ts
- src/lib/mock-data.ts
- helper/service lịch liên quan

Bạn được phép:
- tạo ScheduleService hoặc helper tương đương
- sửa schedule page
- sửa schedule assign page
- nếu cần thì sửa thêm manage/by-shift ở mức tối thiểu

Không được làm:
- không làm publish flow ở task này
- không redesign UI
- không mở rộng attendance/leave/payroll
- không refactor auth rộng
- không sửa ngoài scope khi không cần

Yêu cầu bắt buộc:
1. schedule/page.tsx và schedule/assign/page.tsx phải dùng cùng service/helper lịch
2. dữ liệu lịch phải bám theo user/store thật
3. employee xem lịch cá nhân của mình
4. store_manager hoặc shift_leader làm việc trên dữ liệu store mình
5. code phải mở đường cho draft/published ở task sau nhưng chưa cần làm full flow
6. eslint pass cho file đã chạm
7. npm run build pass

Khi xong trả kết quả đúng format:

TASK: TASK-05

1. File đã sửa
- 

2. File mới đã tạo
- 

3. Đã chuẩn hóa gì trong data layer schedule
- 

4. Page nào đã chuyển sang dùng service chung
- 

5. Policy đọc lịch theo role/store hiện tại
- 

6. Điều gì CHƯA làm trong task này
- 

7. Kết quả kiểm tra
- eslint:
- build:

8. Rủi ro còn lại
- 

9. Assumption
- 
```
