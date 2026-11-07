# Tài Liệu Thiết Kế (Design Spec): Chuẩn Hóa Toàn Diện Flow Bảng Lương Chuỗi F&B Homies

- **Ngày tạo**: 2026-09-14
- **Dự án**: Homies Milk Tea HRM (`ducnghiadk/homies-hrm`)
- **Mục tiêu**: Chuẩn hóa toàn bộ luồng tính toán, hiển thị, nguồn dữ liệu và cài đặt của Bảng Lương (Payroll Hub).

---

## 1. Bối cảnh & Vấn đề cần giải quyết

Qua đợt rà soát toàn diện 29 cột bảng lương hiện hữu (`src/app/payroll/page.tsx`, `src/lib/payroll-engine.ts`, `src/app/settings/payroll/page.tsx`), hệ thống đang có 5 điểm nghẽn nghiêm trọng:

1. **Thiếu 2 cột Khấu trừ cốt lõi trên Bảng lương**: Trong công thức `Thực nhận (NET)`, hệ thống có khấu trừ Bảo hiểm (BHXH, BHYT, BHTN: 10.5%) và Thuế TNCN (lũy tiến 7 bậc), nhưng trên bảng hiển thị lớn lại KHÔNG CÓ 2 cột này. Dẫn đến người xem đối chiếu `Tổng lương - Phạt - Trừ - Ứng != Thực nhận`, gây hiểu lầm và mất minh bạch.
2. **Trộn lẫn nhân viên Toàn thời gian (Full-time) và Bán thời gian (Part-time)**: 
   - Full-time nhận lương tháng cố định theo ngày công (`base_salary / 26 * công`).
   - Part-time nhận lương theo giờ (`tổng giờ thường * đơn giá giờ`).
   - Cột 15 hiện ghi nhãn chung *"Lương theo giờ làm việc"* gây hiểu lầm cho người Full-time. Cần hiển thị ngữ cảnh linh hoạt.
3. **Mức phạt đi muộn bị fix cứng (Hardcode 50.000đ)**: `LATE_PENALTY = 50000` nằm cứng trong code `payroll-engine.ts`, thiếu cấu hình trong trang Cài đặt lương (`/settings/payroll`) để chủ quán tùy chỉnh.
4. **Nhập nhằng giữa "Số ca" (`total_shifts`) và "Ngày công" (`work_days`)**:
   - Hiện tại hệ thống đếm `1 bản ghi chấm công = 1 ca = 1 ngày công`.
   - Nhân viên Part-time làm ca gãy 2 ca/ngày (ví dụ ca sáng 4h, ca tối 4h) bị đếm thành 2 ca và bị đẩy thành 2 ngày công.
   - Cần phân định rõ: `total_shifts` = tổng số ca làm việc, còn `work_days` = số ngày đi làm thực tế (distinct dates).
5. **Modal "Xem lương từng ngày" (`view_daily_salary`) bị cào bằng tiền**:
   - Modal đang lấy `workedSalary / workRecords.length` chia đều, khiến ngày làm 4 tiếng nhận tiền bằng ngày làm 8 tiếng. Cần tính đúng theo số giờ thực tế của ngày đó nhân đơn giá.

---

## 2. Thiết Kế Giải Pháp Chi Tiết

### 2.1. Cấu hình Cài đặt Lương (`src/lib/services/payroll/payroll-policy-service.ts` & `src/app/settings/payroll/page.tsx`)
- Thêm trường `latePenaltyPerOccurrence` vào `PayrollPolicy['rates']` (mặc định: `50000` VNĐ).
- Bổ sung ô nhập "Mức phạt đi muộn mỗi lần (VNĐ)" trong tab Cài đặt Thang lương & Quy tắc tại `/settings/payroll`.
- Người dùng có thể chỉnh thành `20.000đ`, `30.000đ`, `50.000đ` hoặc `0đ` nếu không phạt tiền.
- Cập nhật chính sách lưu trữ (LocalStorage + Supabase sync) để mọi máy kế toán đồng bộ cùng cấu hình.

### 2.2. Động cơ tính toán Lương (`src/lib/payroll-engine.ts`)
- **Tiền phạt trễ**: `lateDeduction = att.lateCount * (policy.rates.latePenaltyPerOccurrence ?? 50000)`.
- **Phân tách Số ca vs Ngày công**:
  - `total_shifts`: Đếm tổng số bản ghi chấm công hợp lệ (có check-in/out, đã duyệt).
  - `work_days`: Đếm số ngày làm việc duy nhất trong kỳ (`Set(records.map(r => r.date)).size`).
  - Tránh tình trạng làm 2 ca ngắn trong 1 ngày bị đội thành 2 ngày công.
- **Dữ liệu trả về `PayrollResult`**: Đảm bảo trường `total_shifts` được trả về tường minh cùng `work_days`, `bhxh`, `bhyt`, `bhtn`, `tax`, `total_insurance`.

### 2.3. Cấu trúc Cột Bảng Lương (`src/app/payroll/page.tsx`)
Mở rộng danh mục cột từ 29 lên **31 cột** hoàn chỉnh:
- Thêm cột `insurance`: "Bảo hiểm (BHXH, BHYT, BHTN)" thuộc nhóm `Khấu trừ khác`.
- Thêm cột `tax`: "Thuế TNCN" thuộc nhóm `Khấu trừ khác`.
- Cập nhật bộ đếm hiển thị: `(X/31 cột)`.
- Cập nhật `DEFAULT_COLUMN_VISIBILITY`, modal "Cài đặt hiển thị cột", và tính năng "Xuất Excel / CSV" để đầy đủ 31 cột.

### 2.4. Trình bày Thông minh theo Loại Nhân Viên (Full-time vs Part-time)
- Cột **Lương chính (Công/Giờ)**:
  - Nếu **Full-time**: Hiển thị số tiền kèm phụ đề `(X công)`, tooltip giải thích `Lương tháng × (công / 26)`.
  - Nếu **Part-time**: Hiển thị số tiền kèm phụ đề `(X giờ × Yđ/h)`.
- Cột **Công & Giờ**:
  - Part-time: Nhấn mạnh **Số ca** và **Tổng giờ**.
  - Full-time: Nhấn mạnh **Số công**.

### 2.5. Tối ưu Modal "Xem Lương Từng Ngày" (`view_daily_salary`)
- Duyệt từng ngày làm việc từ `dailyAttendanceRecords`:
  - Lấy `actualHours` (giờ thực tế) và `regularHours` (giờ thường), `otHours` (giờ tăng ca).
  - Với **Part-time**:
    `dailySalary = Math.round(regularHours * hourlyRate + overtimeSalary)`.
  - Với **Full-time**:
    `dailyRate = Math.round(baseSalary / standardDays)`.
    `dailySalary = Math.round(dailyRate + overtimeSalary)`.
- Đảm bảo tiền ngày nào phản ánh đúng công sức và giờ làm của ngày đó, không cào bằng.

---

## 3. Danh Sách Các File Cần Thay Đổi

1. `src/lib/services/payroll/payroll-policy-service.ts`:
   - Khai báo thêm trường `latePenaltyPerOccurrence` trong `PayrollPolicy`.
2. `src/lib/payroll-engine.ts`:
   - Phân biệt `total_shifts` và `work_days` (distinct dates).
   - Sử dụng `policy.rates.latePenaltyPerOccurrence` thay vì hằng số cố định 50k.
3. `src/app/settings/payroll/page.tsx`:
   - Thêm ô cấu hình "Mức phạt đi muộn (VNĐ/lần)" và preset đi kèm.
4. `src/app/payroll/page.tsx`:
   - Thêm 2 cột `insurance` và `tax` vào `DEFAULT_COLUMN_VISIBILITY`, `<thead>`, `<tbody>`, modal chọn cột và xuất file Excel.
   - Cập nhật nhãn và hiển thị trực quan cho Full-time vs Part-time tại cột lương làm việc.
   - Sửa thuật toán tính chi tiết trong modal `view_daily_salary`.

---

## 4. Kế Hoạch Kiểm Tra & Đảm Bảo Chất Lượng (Verification Plan)

- Chạy kiểm tra TypeScript và ESLint (`npm run lint` hoặc `npm run ai:guard`).
- Kiểm tra tính toán:
  - `Tổng lương (Gross) - Bảo hiểm - Thuế - Phạt - Trừ - Ứng = Thực nhận (Net)` khớp chính xác từng đồng.
  - Thử đổi mức phạt đi muộn từ 50k sang 30k trong Settings và xác nhận bảng lương cập nhật theo.
  - Mở modal xem lương từng ngày của nhân viên Part-time kiểm tra ca 4h và ca 8h có ra số tiền khác nhau.
