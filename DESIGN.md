# 🎨 HOMIES MILK TEA — DESIGN SYSTEM & GUIDELINE
> Phiên bản 1.0 (Pilot Ready)  
> Hệ thống thiết kế chuẩn cho Chuỗi Cửa Hàng Homies Milk Tea.

---

## 1. TRIẾT LÝ THIẾT KẾ
Bộ nhận diện của **Homies Milk Tea** hướng tới sự **Thân thiện, Hiện đại, Cao cấp và Tiện dụng**.
*   **Thân thiện (Homies):** Sử dụng các gam màu ấm áp, dịu mắt (Kem sữa ấm, Mint mát lạnh, Vàng mật ong).
*   **Hiện đại & Cao cấp:** Nền tối xanh navy sâu và màu đen vũ trụ mang lại tính tương phản sắc nét, tạo cảm giác sang trọng của các thương hiệu thế hệ mới.
*   **Tiện dụng:** Thiết kế đáp ứng trên thiết bị di động (Mobile-first), các mục tiêu chạm tối thiểu `44px` - `48px`, font chữ rõ ràng hỗ trợ tiếng Việt hoàn chỉnh.

---

## 2. BẢNG MÀU THƯƠNG HIỆU (BRAND COLOR PALETTE)

Hệ thống màu sắc được cấu trúc hóa trực tiếp vào biến CSS toàn cục trong `src/app/globals.css` để phục vụ **Tailwind CSS v4** biên dịch nhanh chóng:

| Màu Sắc | Mã Hex | Tên Biến CSS | Vai Trò & Cách Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Deep Dark Blue** | `#001D3D` | `--color-primary-800` | Màu nền tối của AppShell, Header cao cấp, Sidebar |
| **Rich Black** | `#000814` | `--color-primary-900` | Màu chữ tiêu đề chính (`text-primary`), màu nền tối nhất |
| **Primary Blue** | `#2F6FA8` | `--color-primary-600` | Màu nhấn hành động chính (Buttons, Links, Active state) |
| **Soft Cream** | `#FFF8E8` | `--color-bg-page` | Màu nền trang chủ đạo, tạo cảm giác dễ chịu, ngọt ngào |
| **Warm Yellow** | `#F6C85F` | `--color-vanilla-500` | Điểm nhấn cảnh báo nhẹ, thẻ VIP, highlight số liệu |
| **Mint Soft Green** | `#DDF4EC` | `--color-accent-200` | Trạng thái thành công (`success-light`), badge ca làm việc |

### Biểu đồ phân cấp màu trong Tailwind v4:
*   `primary` (`--color-primary`): `#2F6FA8` (Action & Brand Accent)
*   `background` (`--color-background`): `#FFF8E8` (Page background)
*   `text-primary` (`--color-text-primary`): `#001D3D` (Typography head contrast)

---

## 3. QUY CHUẨN TRÌNH BÀY GIAO DIỆN (UI PATTERNS)

### 3.1. Thẻ Thông Tin (Cards & Paper)
Sử dụng lớp `.card` được thiết kế sẵn với hiệu ứng đổ bóng mượt mà, góc bo tròn thân thiện:
```html
<div class="card bg-white p-4 border border-accent-200 shadow-md">
  <h3 class="text-lg font-bold text-dark-700">Tên thẻ</h3>
  <p class="text-sm text-gray-600">Nội dung thẻ thông tin...</p>
</div>
```

### 3.2. Gradient Cao Cấp (Premium Gradients)
Dành cho các banner nổi bật hoặc thẻ KPI quan trọng của nhân viên:
*   Sử dụng `.card-feature`: Tạo dải màu chuyển tiếp sang trọng từ `primary-600` (`#2F6FA8`) tới `primary-800` (`#001D3D`).
```html
<div class="card-feature">
  <span class="text-xs uppercase font-semibold opacity-80">Homies Milk Tea</span>
  <h2 class="text-2xl font-bold">Thành tích xuất sắc</h2>
</div>
```

### 3.3. Các Nút Hành Động (Buttons)
*   **Primary Button (`.btn-primary`):** Nút hành động chính, đổ bóng xanh mờ sang trọng.
*   **Secondary Button (`.btn-secondary`):** Sử dụng màu nhấn Mint/Cream dịu mát.
*   **Outline Button (`.btn-outline`):** Viền màu xanh biển, nền trong suốt.

---

## 4. TYPOGRAPHY & CHỮ VIẾT
*   **Font chữ chính:** `Inter` (qua Google Fonts hỗ trợ tiếng Việt có dấu hoàn hảo).
*   **Heading Styles:** Tăng cường độ đậm (`font-semibold` hoặc `font-bold`), khoảng cách chữ thu hẹp (`tracking-tight`) tạo cảm giác thời thượng.
*   **Số liệu thống kê:** Sử dụng `.stat-value` và `.font-numeric` để hiển thị các số liệu bảng chấm công hoặc lương căn chỉnh đều tăm tắp.

---

## 5. CHỈ THỊ THỰC THI CHO AI CODE WORKER
Khi xây dựng hoặc sửa đổi bất kỳ trang/giao diện nào của Homies Milk Tea HRM:
1.  **Tuyệt đối không dùng màu thô:** Không dùng các màu mặc định như `bg-red-500`, `bg-blue-600`. Hãy dùng `bg-primary`, `bg-accent-200`, `bg-vanilla-500` hoặc các biến định sẵn.
2.  **Đồng bộ Layout:** Luôn bọc phần chính trong vùng đệm an toàn `px-4 py-6` và dùng nền `bg-background` (`#FFF8E8`).
3.  **Logo:** Luôn gọi ảnh từ `/logo.png` với kích thước thích hợp và giữ nguyên tỷ lệ khung hình (`object-contain`).
