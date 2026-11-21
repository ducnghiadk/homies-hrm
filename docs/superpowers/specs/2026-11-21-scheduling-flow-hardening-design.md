# Đặc tả Thiết kế: Tách Kho Lịch Rảnh & Lịch Chính Thức — Vá Dứt Điểm 6 Lỗ Hổng Luồng Xếp Ca

- **Ngày khóa đặc tả:** 2026-11-21
- **Trạng thái:** Đã được Founder phê duyệt kiến trúc & chọn **Lựa chọn A** (`duyệt nha. hướng a`)
- **Phạm vi:** Hệ thống Xếp lịch & Xem lịch Homies HRM (Backend SSOT Supabase + Giao diện Quản lý + Giao diện Nhân viên)

---

## 1. Bối cảnh & Quyết định Nghiệp vụ Đã Khóa

### 1.1. Thực tế vận hành tại Homies Milk Tea
1. **Dữ liệu kéo từ iPOS hoặc nhân viên tự gửi trên Homies là "Lịch Rảnh Đầu Vào":**
   - Phản ánh các khung giờ nhân viên rảnh trong tuần (một nhân viên có thể đăng ký rảnh 15–18 ca/tuần để quản lý có nguyên liệu sắp ca).
   - **Không có bước duyệt từng ca rảnh trên màn hình `/schedule/registrations`:** Không ai ngồi bấm duyệt từng slot đăng ký rảnh; trang `/schedule/registrations` đóng vai trò **Bản đồ Lịch Rảnh Tuần** để quản lý soi độ phủ, nhắc Zalo nhân viên chưa nộp, phát hiện ca thiếu người, rồi mở thẳng sang Bảng Xếp Lịch.
2. **Bảng Xếp Lịch `/schedule` là Nguồn Sự Thật Duy Nhất (Single Source of Truth) của Homies:**
   - Quản lý dựa vào lịch rảnh (từ iPOS hoặc Homies) để **kéo-thả thiết kế Bản Nháp**, gán đúng vị trí (`Thu ngân`, `Pha chế`, `Bếp`), rồi bấm **`Chốt Lịch Chính Thức`**.
   - Quản lý có thể nạp nhanh bản nháp từ lịch rảnh (`Điền nhanh từ lịch rảnh vào Nháp`), xóa/đổi bất kỳ ca nào trước khi chốt mà **iPOS tuyệt đối không ghi đè ngược lại**.
   - Chỉ đọc dữ liệu rảnh từ iPOS về để tham khảo/thiết kế bản chốt trên Homies; không đẩy ngược dữ liệu từ Homies sang phần mềm iPOS.
3. **Lựa chọn A (Nghiêm ngặt cho màn hình Nhân viên `/my-schedule`):**
   - Nhân viên chỉ được nhìn thấy **Lịch Đã Chốt Chính Thức** do Quản lý bấm chốt trên Homies.
   - Nếu tuần đang xem **chưa được Quản lý bấm Chốt trên Homies**, `/my-schedule` phải hiển thị thông báo rõ ràng: *"Quản lý đang xếp lịch, tuần này chưa có lịch chính thức"* — tuyệt đối không để lộ bản Nháp đang kéo thử và tuyệt đối không lấy nhầm lịch rảnh từ iPOS làm lịch đi làm.

---

## 2. Tổng hợp 6 Lỗ Hổng Đã Kiểm Chứng & Nguyên Nhân Gốc Rễ

| STT | Mô tả lỗ hổng | Nguyên nhân gốc rễ đã kiểm chứng trong mã nguồn |
| --- | --- | --- |
| **1** | **Trộn kho Lịch rảnh & Lịch đi làm thật** | `db.shifts` (key `'shifts'` trong `homies_runtime_store`) đang chứa lẫn cả đăng ký rảnh (`PENDING`), ca iPOS và ca phân công (`APPROVED`). Một thay đổi ở iPOS hoặc bước duyệt dễ biến lịch rảnh 18 ca/tuần thành lịch đi làm. |
| **2** | **Xóa ca không mất trên máy chủ & xóa nhầm ca cùng ngày** | `/api/shifts` (`src/app/api/shifts/route.ts`) không có handler `DELETE`. Phía client, `ScheduleService.deleteSchedule()` (`src/lib/services/scheduling/schedule-service.ts` L1858–1883) và `removeSchedule()` (`src/lib/mock-data.ts` L705–716) chỉ khớp `employeeId + date` mà bỏ qua `shift_id` (làm xóa nhầm ca Sáng khi muốn gỡ ca Tối), và không xóa khỏi `db.shifts`. |
| **3** | **Màn hình `/my-schedule` mất ca khi làm nhiều ca/ngày & lỗi cuối tháng** | `src/app/my-schedule/page.tsx` L155–159 dùng `new Map<string, Schedule>()` keyed theo `schedule.date` khiến ca sau ghi đè ca trước trong cùng ngày; L120 gọi `/api/shifts?employee_id=...` thiếu `from_date`/`to_date` nên mặc định server chỉ lấy tháng hiện tại (gãy tuần vắt qua hai tháng); L133 không lọc theo tuần đã chốt. |
| **4** | **Trạng thái chốt tuần & nhật ký chỉ nằm cục bộ + lỗi `isWeekPublished()`** | `WEEK_META_KEY` và `CHANGE_LOG_KEY` trong `schedule-service.ts` (L284–340) chỉ lưu ở `localStorage` của trình duyệt (mở máy khác/điện thoại khác không thấy). Ngoài ra `isWeekPublished()` (`schedule-service.ts` L1041–1051) có dòng `return true` ở L1050 làm mọi tuần luôn bị coi là đã chốt. |
| **5** | **iPOS ghi đè bảng xếp lịch Homies & tách 2 kho lưu không đồng nhất** | `GET /api/shifts` (`src/app/api/shifts/route.ts` L52–62) gọi thẳng `fetchIposWorkSchedule` ghi đè khi công tắc iPOS bật. Trong khi đó `ManagerSchedulingBoard.tsx` L466 đọc từ `scheduleAdapter.getShiftsByStoreAndWeek` (`lich_phan_ca`) nhưng `saveSchedulesToStorage()` (`src/lib/mock-data.ts` L565–575) lại ghi lên `POST /api/shifts`. |
| **6** | **Chưa khóa sửa lịch rảnh khi tuần đã chốt & lỗi lệch `-1 ngày` ở `/shifts/register`** | `POST /api/shifts/register` (`src/app/api/shifts/register/route.ts`) không kiểm tra xem `(store_id, week_start_date)` đã được Quản lý chốt lịch chính thức hay chưa. Đồng thời `src/app/shifts/register/page.tsx` L50–52 dùng `d.toISOString().split('T')[0]` gây lệch `-1 ngày` theo múi giờ UTC. |

---

## 3. Kiến trúc Kho Dữ Liệu Đám Mây Supabase (0 SQL Migration)

Hệ thống giữ nguyên bảng key-value `public.homies_runtime_store (collection_key TEXT PRIMARY KEY, payload JSONB NOT NULL, updated_at TIMESTAMPTZ)` hiện có trên Supabase Cloud — không yêu cầu chạy thêm script SQL thủ công.

### 3.1. Phân tách 2 kho độc lập trên `homies_runtime_store`

1. **Kho 1 — Lịch Rảnh Đầu Vào (chỉ đọc tham khảo / đăng ký rảnh):**
   - Collection key giữ nguyên: `'shifts'` (`db.shifts: ServerShiftRegistration[]`).
   - Nguồn ghi: Đồng bộ tự động từ iPOS (khi công tắc iPOS bật) hoặc nhân viên tự gửi qua `/shifts/register` (khi tự vận hành).
   - Quy tắc bất biến: **Không bao giờ** được hiển thị trực tiếp như lịch đi làm chính thức trên `/my-schedule`.

2. **Kho 2 — Lịch Chính Thức Homies (3 collection mới trong `PERSISTED_KEYS` của `src/lib/server/supabase-store.ts`):**
   - `'official_schedules'` → `db.official_schedules: ServerOfficialSchedule[]`
   - `'schedule_weeks'` → `db.schedule_weeks: ServerScheduleWeekMeta[]`
   - `'schedule_change_logs'` → `db.schedule_change_logs: ServerScheduleChangeLog[]`

### 3.2. Cấu trúc kiểu dữ liệu máy chủ (`src/lib/server/db.ts`)

```ts
export interface ServerOfficialSchedule {
  id: string
  store_id: string
  week_start_date: string // YYYY-MM-DD (Thứ 2 của tuần theo lịch dương thuần)
  date: string            // YYYY-MM-DD
  employee_id: string
  employee_name?: string
  shift_id: string        // shift-001 | shift-002 | shift-003 | ...
  shift_name?: string
  assigned_position_id?: string // pos-001 | pos-002 | pos-bep | ...
  status: 'draft' | 'published'
  notes?: string
  modified_after_publish?: boolean
  change_reason?: string
  updated_by?: string
  updated_at: string
  created_at: string
}

export interface ServerScheduleWeekMeta {
  store_id: string
  week_start: string // YYYY-MM-DD (Thứ 2)
  week_end: string   // YYYY-MM-DD (Chủ Nhật)
  status: 'draft' | 'published'
  published_at?: string
  published_by?: string
  published_by_name?: string
  updated_at: string
  updated_by?: string
  last_modified_after_publish_at?: string
  source?: 'manual' | 'seeded_from_availability' | 'imported_excel' | 'copied_week'
}

export interface ServerScheduleChangeLog {
  id: string
  store_id: string
  week_start: string
  assignment_id: string
  employee_id: string
  employee_name?: string
  date: string
  shift_id?: string
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'cancel' | 'seed_draft'
  reason?: string
  changed_by: string
  changed_by_name?: string
  changed_at: string
  before_state?: Partial<ServerOfficialSchedule> | null
  after_state?: Partial<ServerOfficialSchedule> | null
}
```

### 3.3. Quy tắc chuẩn hóa dữ liệu & Lịch dương thuần trong `normalizeServerDb`
1. **Hàm tính ngày tuần thuần lịch dương (`getCalendarWeekStart(ymd)`):**
   - Dùng `Date.UTC(year, month - 1, day)` kết hợp `getUTCDay()` và `setUTCDate()` — kết quả đồng nhất 100% giữa máy local UTC+7 (Việt Nam) và server Vercel UTC, loại bỏ hoàn toàn lỗi lệch `-1 ngày`.
2. **Khóa chống trùng `official_schedules`:**
   - Khóa chống trùng slot: `(store_id, date, employee_id, canonicalShiftKey)` trong đó `canonicalShiftKey` chuẩn hóa `shift_id` (và ca linh hoạt dựa theo khung giờ trong `notes` nếu là ca phát sinh).
   - Một nhân viên **được phép** làm 2–3 ca khác nhau trong cùng một ngày (`Ca Sáng` + `Ca Trưa` + `Ca Tối`), nhưng không thể tồn tại 2 bản ghi trùng cùng nhân viên + cùng ngày + cùng một ca tại cùng cửa hàng.
   - Tự động loại bỏ bản ghi giả lập (`isFakeSeedShift` — `sch-seed-*`) và nhân viên đã nghỉ (`RESIGNED_IDS` / `RESIGNED_NAMES`).
3. **Chuẩn hóa `schedule_weeks`:**
   - Duy nhất tối đa 1 bản ghi cho mỗi cặp `(store_id, week_start)`.
   - Nếu trùng khóa, giữ bản mới nhất theo `updated_at` (ưu tiên `published` nếu có `published_at` mới hơn).

---

## 4. Đặc tả Hợp đồng API (API Contracts)

### 4.1. Route mới `src/app/api/schedules/route.ts`

Route này là cổng giao tiếp duy nhất của **Kho 2 (`official_schedules`, `schedule_weeks`, `schedule_change_logs`)**, không bao giờ gọi iPOS hay tự động đọc `db.shifts` làm lịch đi làm.

#### `GET /api/schedules`
- **Tham số truy vấn:**
  - `store_id`: mã cửa hàng (hoặc `ALL`)
  - `week_start`: `YYYY-MM-DD` (nếu có mà thiếu `from_date`/`to_date`, tự lọc `week_start` hoặc `[week_start .. week_start+6]` theo lịch dương thuần)
  - `from_date`, `to_date`: lọc theo khoảng ngày `YYYY-MM-DD` (chính xác khi tuần vắt qua hai tháng)
  - `employee_id`: lọc riêng cho một nhân viên
  - `published_only=1`: chế độ nghiêm ngặt cho nhân viên theo **Lựa chọn A**:
    - Chỉ trả các ca có `status === 'published'` **VÀ** tuần tương ứng `(s.store_id, s.week_start_date)` có bản ghi trong `db.schedule_weeks` với `status === 'published'`.
    - Nếu tuần đó chưa chốt trên Homies, mảng `data` của tuần đó trả rỗng và `is_week_published` trả `false`.
  - `include_meta=1`: trả kèm `week_meta` (cho cặp `(store_id, week_start)`) và `week_metas` (danh sách)
  - `include_logs=1`: trả kèm `change_logs` đã lọc theo `store_id` / `week_start`
- **Kết quả trả về:**
  ```json
  {
    "success": true,
    "source": "homies_official",
    "count": 12,
    "is_week_published": true,
    "week_meta": { "...": "..." },
    "week_metas": [],
    "change_logs": [],
    "data": []
  }
  ```

#### `POST /api/schedules`
- Hỗ trợ 1 ca đơn, mảng ca, hoặc object có trường `action`:
  1. **`action: 'upsert'` (hoặc gửi object ca / mảng ca mặc định):**
     - Từ chối ngay HTTP `400` nếu phát hiện `sch-seed-*` hoặc nhân viên đã nghỉ.
     - Kiểm tra `schedule_weeks` của `(store_id, week_start_date)`:
       - Nếu tuần **đã `published`**: bắt buộc phải có `change_reason` (trả HTTP `400` nếu thiếu), ép trạng thái bản ghi thành `'published'`, đánh dấu `modified_after_publish = true`, lưu `change_reason`, cập nhật `last_modified_after_publish_at` của tuần và ghi log `'create'`/`'update'` vào `schedule_change_logs`.
       - Nếu tuần **chưa chốt (hoặc chưa có meta)**: tự khởi tạo/giữ `week_meta.status = 'draft'`, ép trạng thái bản ghi thành `'draft'`.
     - Chống trùng slot theo `(store_id, date, employee_id, canonicalShiftKey)` hoặc `id` / `replace_schedule_id`.
  2. **`action: 'seed_from_availability'` (`{ store_id, week_start, mode?: 'merge' | 'replace', actor_id?, actor_name? }`):**
     - Kiểm tra nếu tuần `(store_id, week_start)` đã `published` → trả HTTP `409` (không được nạp đè vào tuần đã chốt).
     - Lấy danh sách ca rảnh từ `db.shifts` theo `(store_id, week_start)` (loại `REJECTED` và nhân viên đã nghỉ), không trùng với ca đã có trong `official_schedules` (hoặc thay thế phần nháp nếu `mode === 'replace'`), tạo bản ghi mới trong `db.official_schedules` với `status: 'draft'`, đánh dấu `week_meta.status = 'draft'`, ghi 1 dòng log `'seed_draft'`.
     - Tuyệt đối không sửa đổi dữ liệu trong `db.shifts`.
  3. **`action: 'publish_week'` (`{ store_id, week_start, week_end?, actor_id?, actor_name?, sync_schedule_ids? }`):**
     - Chuyển toàn bộ ca trong tuần `(store_id, week_start)` sang `status: 'published'`.
     - Cập nhật `db.schedule_weeks` cho `(store_id, week_start)` thành `status: 'published'`, `published_at`, `published_by`, `published_by_name`.
     - Ghi log `'publish'` vào `db.schedule_change_logs` và gọi `saveServerDb(db)`.
  4. **`action: 'unpublish_week'` (`{ store_id, week_start, reason?, actor_id?, actor_name? }`):**
     - Chuyển `week_meta.status = 'draft'` và toàn bộ ca tuần đó về `'draft'`, ghi log `'unpublish'`.
  5. **`action: 'replace_week_draft'` (`{ store_id, week_start, items: [...], actor_id?, actor_name? }`):**
     - Chặn HTTP `409` nếu tuần đã `published`.
     - Thay thế các ca `draft` của `(store_id, week_start)` bằng danh sách `items` mới (dùng cho Import Excel / Copy tuần trước / Smart Scheduler) và lưu `saveServerDb(db)`.

#### `DELETE /api/schedules`
- Nhận qua query string hoặc JSON body:
  - Hoặc `id` (mã bản ghi cụ thể)
  - Hoặc đủ bộ 4 khóa: `store_id`, `employee_id`, `date`, `shift_id` (tuyệt đối từ chối xóa nếu chỉ gửi `employee_id + date` mà thiếu cả `id` và `shift_id` — vá triệt để lỗ hổng xóa nhầm ca cùng ngày).
- Nếu tuần của ca bị xóa đang ở trạng thái `'published'`: bắt buộc có `reason` / `change_reason` (thiếu trả HTTP `400`), ghi log `'cancel'` kèm `before_state` vào `db.schedule_change_logs`.
- Xóa phần tử khỏi `db.official_schedules` và gọi `saveServerDb(db)` ngay lập tức để bền vững trên Supabase Cloud.

### 4.2. Tương thích ngược `src/app/api/shifts/route.ts`
- Giữ nguyên quản lý `shift_templates` (thêm/sửa/xóa mẫu ca).
- Với `GET /api/shifts` (đang được `/attendance`, `/checkin`, `ManagerDashboardPremium`, `/schedule/swap`, `ShiftAdapter` dùng):
  - Trong khoảng `[fromDate .. toDate]`, ưu tiên đọc các ca **đã chốt chính thức** (`status === 'published'`) từ `db.official_schedules` thuộc các tuần `published` trong `db.schedule_weeks`.
  - Chỉ với những ngày/tuần chưa có lịch chốt trên Homies (ví dụ dữ liệu lịch sử tháng trước từ iPOS khi chưa vận hành luồng chốt Homies), mới fallback bổ sung dữ liệu từ iPOS Cloud (nếu công tắc iPOS bật và không có `published_only=1`).
  - Các màn hình nhân sự dùng `/api/shifts` sẽ không bao giờ bị lịch rảnh chưa chốt đè lên lịch đã chốt của Homies.

### 4.3. Khóa đăng ký rảnh sau chốt trong `src/app/api/shifts/register/route.ts`
- `GET /api/shifts/register`:
  - Khi có `store_id` và `week`, trả thêm `week_status: 'published' | 'draft'` và `week_meta` từ `db.schedule_weeks` để UI biết tuần đó đã khóa đăng ký rảnh hay chưa.
- `POST /api/shifts/register`:
  - Trước khi ghi nhận ca rảnh mới, kiểm tra toàn bộ các `(store_id, week_start_date)` nằm trong gói dữ liệu gửi lên (tính `week_start_date` bằng `getCalendarWeekStart(item.date)` nếu client chưa truyền hoặc truyền sai).
  - Nếu bất kỳ tuần nào đã có `schedule_weeks.status === 'published'`, trả HTTP `409 Conflict` với thông báo rõ: `"Quản lý đã chốt lịch chính thức cho tuần này, không thể gửi hoặc sửa lịch rảnh nữa. Nếu cần đổi ca vui lòng dùng mục Xin đổi ca."`

---

## 5. Thiết kế Giao diện & Hành vi từng Màn hình

### 5.1. Trang Bản đồ Lịch Rảnh Tuần (`/schedule/registrations`)
- Làm rõ đúng bản chất: đây là **Màn hình đầu vào (Lịch Rảnh Tuần từ iPOS / Homies)** để Quản lý nắm ai rảnh ca nào, **không cần duyệt từng ô**.
- Bổ sung nhãn trạng thái tuần hiện tại từ `schedule_weeks` (`Tuần này chưa chốt lịch chính thức` hoặc `Đã chốt lịch chính thức`).
- Nút hành động chính trên header chuyển thẳng sang bảng thiết kế xếp lịch đúng cửa hàng và đúng tuần đang xem: **`Mở Bảng Xếp Lịch tuần này →`** (`/schedule?storeId=...&weekStart=...`).
- Giữ nguyên ma trận 7x3 trực quan, banner nhắc Zalo nhân viên chưa nộp lịch, nút nhắc lẻ từng bạn, và drawer xem chi tiết từng ô.

### 5.2. Bảng Xếp Lịch Kéo-Thả (`/schedule`)
- **Nạp dữ liệu 1 nguồn chuẩn (`/api/schedules?include_meta=1&include_logs=1`):** không còn phụ thuộc `localStorage` cho `weekMeta`/`changeLogs`, không bị `scheduleAdapter` hay iPOS ghi đè ngược khi F5.
- **Lịch rảnh tham khảo & Điền nhanh vào Nháp:**
  - Lịch rảnh tuần vẫn được nạp từ `/api/shifts/register?status=all` để gợi ý khi kéo-thả hoặc mở modal gán ca (hiển thị ai rảnh ca đó).
  - Bổ sung nút **`Điền nhanh từ lịch rảnh vào Nháp`** (chỉ hiện khi tuần chưa chốt) gọi `POST /api/schedules` với `action: 'seed_from_availability'`.
- **Xóa ca chính xác từng ca:** `handleRemove` truyền đủ `(employeeId, date, shiftId, scheduleId, changeReason)`, gọi thẳng `DELETE /api/schedules` để xóa đúng ca (ví dụ xóa Ca Tối không đụng vào Ca Sáng cùng ngày) và bền vững qua F5 trên mọi máy.
- **Sửa lỗi `isWeekPublished()`:** Gỡ bỏ `return true` ở dòng 1050 `schedule-service.ts`; đọc trực tiếp trạng thái tuần từ `serverWeekMeta` được đồng bộ từ Supabase Cloud (`'published'` chỉ khi `schedule_weeks.status === 'published'`).
- **Trạng thái Nháp vs Đã Chốt & Lý do sửa sau chốt:**
  - Khi tuần ở trạng thái `Nháp`: kéo-thả, thêm, xóa, đổi vị trí (`Thu ngân` / `Pha chế` / `Bếp`) tự động lưu `draft` lên Supabase Cloud; nhân viên chưa thấy gì.
  - Khi bấm **`Chốt Lịch Chính Thức`**: gọi `POST /api/schedules` (`action: 'publish_week'`), đồng bộ toàn bộ lên Supabase Cloud, khóa chỉnh sửa đăng ký rảnh tuần đó và phát hành ngay cho nhân viên.
  - Khi sửa/gỡ ca sau khi đã chốt: bắt buộc nhập **Lý do thay đổi**, ghi nhận `modified_after_publish: true` và lưu nhật ký kiểm toán lên Supabase Cloud để CEO xem từ mọi thiết bị.

### 5.3. Màn hình Nhân viên `/my-schedule` & `/shifts/register`
- **`/my-schedule` (Lựa chọn A nghiêm ngặt):**
  - Gọi `GET /api/schedules?employee_id=${targetUserId}&from_date=${weekStrs[0]}&to_date=${weekStrs[6]}&published_only=1&include_meta=1` mỗi khi đổi tuần hoặc đổi nhân viên (hỗ trợ đầy đủ tuần vắt qua hai tháng).
  - Nếu tất cả các cửa hàng liên quan (hoặc cửa hàng của nhân viên) trong tuần chưa chốt (`is_week_published === false`), hiển thị rõ banner/trạng thái trống: *"Quản lý đang xếp lịch, tuần này chưa có lịch chính thức"* (tuyệt đối không fallback sang `mockSchedules` nháp hay dữ liệu iPOS chưa chốt).
  - Đổi `scheduleByDate` từ `Map<string, Schedule>` thành `Map<string, Schedule[]>` và sắp xếp theo thứ tự giờ ca (Sáng → Trưa → Tối) để **nhân viên làm 2–3 ca trong cùng một ngày** nhìn thấy trọn vẹn tất cả các ca ở cả thẻ **Ca hôm nay**, **Bảng tuần** và **Khung chi tiết ngày được chọn**.
- **`/shifts/register`:**
  - Sửa hàm `formatDate(d)` dùng lịch địa phương (`getFullYear()`, `getMonth() + 1`, `getDate()`) thay vì `toISOString().split('T')[0]`, vá dứt điểm lỗi lệch `-1 ngày` ở múi giờ Việt Nam.
  - Hiển thị trạng thái **Tuần đã chốt lịch chính thức (đã khóa gửi lịch rảnh)** dựa trên `week_status === 'published'` từ API và vô hiệu nút gửi để tránh nhân viên thao tác nhầm.

---

## 6. Kế hoạch Triển khai 3 Pass (< 60k token / Pass)

### Pass A — Backend SSOT & Lưu trữ Đám Mây Supabase (5 file)
1. `src/lib/server/supabase-store.ts` — thêm 3 key (`official_schedules`, `schedule_weeks`, `schedule_change_logs`) vào `PERSISTED_KEYS`.
2. `src/lib/server/db.ts` — khai báo 3 kiểu dữ liệu mới, helper lịch dương thuần, chống trùng/lọc bẩn trong `normalizeServerDb`.
3. `src/app/api/schedules/route.ts` *(file mới)* — đầy đủ `GET`, `POST` (`upsert`, `seed_from_availability`, `publish_week`, `unpublish_week`, `replace_week_draft`), `DELETE` chuẩn 4 khóa.
4. `src/app/api/shifts/route.ts` — cập nhật tương thích ngược ưu tiên lịch đã chốt trên Homies trước iPOS fallback.
5. `src/app/api/shifts/register/route.ts` — trả kèm trạng thái khóa tuần trên `GET` và chặn HTTP `409` trên `POST` nếu tuần đã chốt.

- **Kiểm chứng Pass A:** Chạy script test trực tiếp các API trên `localhost:3535` (tạo nháp 2 ca cùng ngày → xóa đúng 1 ca còn ca kia → chốt tuần → kiểm tra `published_only=1` → kiểm tra chặn `409` khi gửi lịch rảnh → kiểm tra dữ liệu lưu thật trên Supabase Cloud rồi dọn sạch dữ liệu test), chạy `npm run ai:guard`, `npx tsc --noEmit`, `npm run build`.

### Pass B — Giao diện Quản lý `/schedule` & `/schedule/registrations` (6 file)
1. `src/lib/mock-data.ts`
2. `src/lib/services/scheduling/schedule-service.ts`
3. `src/components/scheduling/ManagerSchedulingBoard.tsx`
4. `src/app/schedule/registrations/page.tsx`
5. `src/components/scheduling/registrations/RegistrationHeaderAndKpis.tsx`
6. `src/components/scheduling/registrations/RegistrationMatrixAndStaffView.tsx`

- **Kiểm chứng Pass B:** `npm run ai:guard`, `npx tsc --noEmit`, `npm run build`, kiểm tra thực tế kéo-thả/xóa ca/chốt lịch trên `localhost:3535` và mở từ `/schedule/registrations` sang `/schedule`.

### Pass C — Giao diện Nhân viên `/my-schedule`, `/shifts/register`, Tài liệu & Deploy Vercel (4 file)
1. `src/app/my-schedule/page.tsx`
2. `src/app/shifts/register/page.tsx`
3. `docs/CODEMAP.md`
4. `docs/KNOWN_ISSUES.md`

- **Kiểm chứng Pass C:** `npm run ai:guard`, `npx tsc --noEmit`, `npm run build`, kiểm tra đa ca/tuần chưa chốt/tuần vắt tháng trên `localhost:3535`, commit + push lên `origin/main`, và xác minh live trên cả hai URL `https://homies-hrm.vercel.app` và `https://homies-hrm-jmwi.vercel.app`.
