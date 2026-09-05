# Homies Milk Tea - Quy Chuẩn Thiết Kế Giao Diện (Design Rule Final Master)

Phiên bản: `v3.1 (Executive SaaS Golden Standard - Full System)`  
Cập nhật chốt: `2026-08-19`  
Chuẩn mực đối chiếu kép:
1. **Trang Chủ Dashboard Tổng Thể:** (`src/components/dashboard/`) — Đại diện cho Giao diện Tổng quan & Trải nghiệm Dashboard.
2. **Trang Báo Cáo & Thưởng BSC:** (`src/app/bsc-bonus/page.tsx`) — **Chuẩn mực tối cao cho MỌI TRANG CON NGHIỆP VỤ / VẬN HÀNH SAAS**.

Phạm vi áp dụng:
- Toàn bộ giao diện web HRM Homies Milk Tea.
- Tất cả các trang con hiện tại và tương lai: **Bảng Lương (`/payroll`), Phân Ca (`/schedule`), Nhân Sự (`/employees`), Chấm Công (`/attendance`), Tuyển Dụng (`/recruitment`), Cài Đặt (`/settings/*`)**.
- Kim chỉ nam bắt buộc cho AI code và lập trình viên. Chỉ cần yêu cầu: *"Áp dụng đúng rules @DESIGN_RULE_HOMIES_FINAL.md"* là hệ thống phải tự động tuân thủ 100% không sai lệch.

---

## 1. Tinh Thần Thương Hiệu & Trải Nghiệm Người Dùng (Apple SaaS F&B)

* **Ấm áp & Dễ chịu:** Nền toàn trang luôn là màu kem ấm (`#FFF8E8`), giảm mỏi mắt khi vận hành cả ngày.
* **Chuyên nghiệp & Vững chãi:** Màu thương hiệu **Homies Blue (`#2F6FA8`)** kết hợp **Deep Navy (`#001D3D`)** cho tiêu đề và số liệu tài chính quan trọng.
* **Full Màn Hình Web (100% Full Width):** Không giới hạn co cụm hẹp (`max-w-7xl`). Luôn dùng `w-full max-w-none` để bảng biểu và dữ liệu trải dài thoáng mắt trên màn hình máy tính.
* **Lean & Sạch Sẽ (Chuẩn Apple SaaS):**
  * Thẻ trắng bo góc tròn mềm (`rounded-2xl`).
  * Viền mỏng tinh tế (`border-gray-100` hoặc `border-gray-200/70`).
  * Bóng đổ nhẹ (`shadow-xs` / `shadow-2xs`), không dùng bóng đen đậm.
  * Độ đậm chữ thanh thoát: Ưu tiên `font-bold` / `font-semibold` / `font-medium`, **tuyệt đối không dùng `font-black` hay `font-extrabold` thô dày**.
* **Trực quan số liệu (Financial Clarity):** 100% số tiền, giờ công, điểm số dùng `font-mono tabular-nums font-bold`.
* **Tuyệt đối 0 Emoji:** 100% biểu tượng dùng từ thư viện `lucide-react`.

---

## 2. Bảng Màu Chuẩn Cốt Lõi (Color Tokens)

| Tên Màu | Mã HEX | Class Tailwind Chuẩn | Vai Trò Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Soft Cream Page** | `#FFF8E8` | `bg-[#FFF8E8]` | Nền toàn trang cho 100% màn hình |
| **Card White** | `#FFFFFF` | `bg-white` | Bề mặt thẻ, bảng dữ liệu, modal, header |
| **Primary Blue** | `#2F6FA8` | `bg-[#2F6FA8]` / `text-[#2F6FA8]` | Nút chính (CTA), Tab đang chọn, icon thương hiệu |
| **Deep Navy** | `#001D3D` | `text-[#001D3D]` | Tiêu đề lớn H1/H2, số liệu tài chính quan trọng |
| **Dark Slate** | `#1D3E61` | `bg-[#1D3E61]` | Nút hover, trạng thái active đậm |
| **Soft Blue Box** | `#F4F8FC` | `bg-primary-50` / `bg-blue-50` | Hộp icon, nền thông báo nhẹ |
| **Mint Green** | `#1E9E57` | `text-emerald-700` / `bg-emerald-600` | Thành công, đã duyệt, đạt chuẩn, mở quỹ |
| **Mint Light** | `#DDF4EC` | `bg-emerald-50` / `border-emerald-200`| Nền badge đạt chuẩn, thông báo an toàn |
| **Warm Amber** | `#D97706` | `text-amber-800` / `bg-amber-600` | Cảnh báo nhẹ, chờ CEO duyệt, trừ điểm nhẹ |
| **Amber Light** | `#FEF3C7` | `bg-amber-50` / `border-amber-200` | Nền badge chờ duyệt, ghi chú điều hành |
| **Error Rose** | `#E11D48` | `text-rose-700` / `bg-rose-600` | Lỗi vi phạm, từ chối, khóa quỹ, thiếu giờ |
| **Error Light** | `#FFE4E6` | `bg-rose-50` / `border-rose-200` | Nền badge lỗi, cảnh báo phạt |

---

## 3. Quy Chuẩn Font Chữ Chi Tiết (Typography System)

### 3.1. Quy định Họ Font Chữ (Font Family)
* **Font văn bản chính:** 100% ứng dụng sử dụng font **`Inter`** (qua biến `--font-inter` / `font-sans`).
* **Font số liệu tài chính:** 100% số tiền VNĐ, giờ công, điểm đánh giá, phần trăm % dùng font **Monospace** (`font-mono`) kết hợp với **`tabular-nums`** để các con số thẳng hàng tuyệt đối theo cột đứng.
* **CÁC ĐIỀU CẤM KỊ:**
  * ❌ Tuyệt đối **CẤM** dùng font `Poppins`, `Arial`, `Times New Roman` hoặc font có chân (Serif).
  * ❌ Tuyệt đối **CẤM** dùng độ đậm chữ `font-black` (900) hoặc `font-extrabold` (800) làm thô chữ, chật chội.

### 3.2. Cấp Bậc Kích Thước Font & Độ Đậm (Font Scale & Weight Hierarchy)

| Cấp Vị Trí | Kích Thước Class | Độ Đậm (Weight) | Màu Chữ Quy Định | Ứng Dụng Thực Tế |
| :--- | :--- | :--- | :--- | :--- |
| **Tiêu đề Trang (H1)** | `text-xl` (20px) / `text-2xl` (24px) | `font-bold` (700) | `text-[#001D3D]` | Tiêu đề chính trang web ở Header cố định |
| **Tiêu đề Khối (H2)** | `text-base` (16px) / `text-lg` (18px) | `font-bold` (700) | `text-[#001D3D]` | Tiêu đề thẻ lớn, tiêu đề bảng dữ liệu |
| **Tiêu đề Thẻ / Mục (H3)** | `text-sm` (14px) | `font-semibold` (600) | `text-gray-800` | Tiêu đề thẻ chỉ số vĩ mô, tiêu đề modal |
| **Số Liệu Tài Chính To** | `text-2xl` / `text-3xl` | `font-bold font-mono tabular-nums` | `text-[#001D3D]` / `text-emerald-700` | Con số tổng tiền, số quỹ thưởng, KPI tổng |
| **Nội Dung Bảng & Form** | `text-xs` (12px) | `font-medium` (500) | `text-gray-700` | Dòng dữ liệu trong bảng, nội dung ô nhập liệu |
| **Chú Thích Phụ (Caption)**| `text-[11px]` (11px) | `font-medium` (500) | `text-gray-500` | Dòng mô tả nhỏ dưới số liệu, breadcrumb |
| **Nhãn Trạng Thái (Badge)**| `text-[10px]` (10px) | `font-bold uppercase tracking-wider` | Tùy trạng thái (Rose/Amber/Mint) | Viên thuốc báo trạng thái (Đã duyệt, Chờ duyệt) |

### 3.3. Quy Chuẩn Hiển Thị Số Liệu (Financial Number Code Template)
Mọi số tiền VNĐ, giờ công, điểm đánh giá, phần trăm **BẮT BUỘC** viết dưới dạng:
```tsx
<span className="font-mono tabular-nums font-bold text-[#001D3D]">
  {formatVnd(12500000)}
</span>
```

---

## 4. Kiến Trúc 3 Tầng Cho Trang Con Nghiệp Vụ (Executive Command Pattern)

Mọi trang con nghiệp vụ (Lương, Thưởng, Ca, Nhân sự...) **BẮT BUỘC** triển khai theo cấu trúc 3 Tầng sau:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 1: EXECUTIVE COMMAND HEADER (Cố định sticky top-0 z-30 trên nền trắng) │
│ • Cột trái: Breadcrumb (HRM > Phân Hệ) + Tiêu Đề Trang + Badge Trạng Thái  │
│ • Cột phải: Chọn Cơ Sở + Chọn Kỳ Xét + [ Xuất Excel ] + Cụm Nút Phê Duyệt  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 2: DẢI 4 THẺ CHỈ SỐ VĨ MÔ (Macro KPI Cards - grid-cols-4)               │
│ [ 📊 Chỉ Số Chính 1 ] [ 🎯 Chỉ Số 2 ] [ 💰 Tài Chính Thực Chi ] [ 👥 Nhân Sự ]│
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 3: BỘ TAB NGHIỆP VỤ & TỶ LỆ VÀNG (2/3 + 1/3)                           │
│ • Thanh chuyển đổi Tab gọn nhẹ (Báo cáo | Nhật ký đối soát | + Link Cài Đặt)│
│                                                                             │
│   ◀ CỘT CHÍNH (2/3):                       │ ▶ CỘT PHỤ (1/3):               │
│   1. Bảng Chấm Điểm / Ma Trận Đánh Giá     │ 1. Sơ Đồ Radar / Biểu Đồ Kép   │
│   2. Bảng Dữ Liệu Nhân Sự (Data Table)     │ 2. Lịch Sử Diễn Biến 3 Kỳ      │
│      (Click cả dòng mở Modal bóc tách)     │                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Quy Chuẩn Chi Tiết Từng Thành Phần (Component Blueprints)

### 5.1. Header Điều Hành Cố Định (Executive Command Header)
```tsx
<div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs w-full sticky top-0 z-30">
  <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4">
    {/* Trái: Breadcrumb + Tiêu đề + Trạng thái */}
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <span>HRM Homies</span>
        <ChevronRight size={12} className="text-gray-400" />
        <span className="text-[#2F6FA8] font-bold">Tên Phân Hệ Nghiệp Vụ</span>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight">Tiêu Đề Báo Cáo &amp; Nghiệp Vụ</h1>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
          ● Chờ Phê Duyệt
        </span>
      </div>
    </div>

    {/* Phải: Bộ chọn + Nút Xuất Excel + Phím Hành Động CEO */}
    <div className="flex items-center gap-2 flex-wrap">
      {/* Selector Chi nhánh & Kỳ xét */}
      <button className="px-3 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-100 transition">
        <FileSpreadsheet size={14} className="text-[#2F6FA8]" />
        <span>Xuất Excel</span>
      </button>
      <button className="px-3.5 py-1.5 min-h-[36px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition">
        <Sparkles size={14} />
        <span>Chốt &amp; Phê Duyệt</span>
      </button>
    </div>
  </div>
</div>
```

---

### 5.2. Bảng Dữ Liệu Vận Hành Trực Quan (Interactive Data Table)
* **Quy tắc quan trọng:** Bấm vào **BẤT KỲ ĐÂU trên hàng `<tr>`** đều mở Modal bóc tách chi tiết.
* **Chân bảng (Footer):** Luôn có 1 dòng tóm tắt tinh gọn (`Đội ngũ: X người • Đủ điều kiện: Y/X • Tổng giờ: Z`).

```tsx
<div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
  <div className="overflow-x-auto">
    <table className="w-full text-xs text-left border-collapse">
      <thead>
        <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-100">
          <th className="py-3 px-4 text-[#001D3D]">Nhân Viên</th>
          <th className="py-3 px-3 text-center">Cấp Bậc</th>
          <th className="py-3 px-3 text-center">Giờ Làm</th>
          <th className="py-3 px-3 text-center">Vi Phạm</th>
          <th className="py-3 px-4 text-right">Số Tiền (VND)</th>
          <th className="py-3 px-3 text-center">Thao Tác</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        <tr
          onClick={() => handleOpenDetail(emp.id)}
          className="hover:bg-primary-50/30 transition-all cursor-pointer"
        >
          <td className="py-3.5 px-4 font-bold text-gray-900">{emp.name}</td>
          <td className="py-3.5 px-3 text-center font-bold text-gray-600">{emp.role}</td>
          <td className="py-3.5 px-3 text-center font-mono font-bold tabular-nums">{emp.hours}h</td>
          <td className="py-3.5 px-3 text-center">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">0 lỗi</span>
          </td>
          <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-emerald-700">{formatVnd(emp.amount)}</td>
          <td className="py-3.5 px-3 text-center">
            <button className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-bold text-[11px] hover:bg-[#2F6FA8] hover:text-white transition">
              Chi tiết
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

### 5.3. Modal Bóc Tách Chi Tiết Cá Nhân (Individual Detail Breakdown Modal)
Mọi bảng nhân sự khi click vào dòng bắt buộc phải có Modal bóc tách gồm **4 khối tiêu chuẩn**:
1. **Hero Header:** Tên nhân sự, chức vụ, số tiền thực nhận, % chiếm trong quỹ (hoặc lý do khóa nếu không đạt chuẩn).
2. **4 Bước Toán Học Minh Bạch:** Giờ làm việc ➡️ Cấp bậc & Hệ số ➡️ Kỷ luật cá nhân ➡️ Điểm chia & Tỷ trọng.
3. **Danh Sách Sự Cố & Lỗi Kỷ Luật (5 trường thông tin):**
   - Tên lỗi & Nhóm lỗi.
   - Điểm phạt (-điểm).
   - Mô tả hành vi vi phạm thực tế.
   - Tác động lên hệ số tiền thưởng.
   - Thời gian ghi nhận & Người xác nhận.
4. **Phím Điều Hướng Nhanh:** Nút `[ < Trước ]` và `[ Tiếp > ]` (kèm phím tắt `←` / `→`) để duyệt liên tục từng nhân viên.

---

### 5.4. Quy Tắc Phân Tách Tab Nghiệp Vụ vs Trung Tâm Cài Đặt (Tab Separation Rule)
* **Không nhúng các khối cài đặt định mức cồng kềnh vào thanh Tab báo cáo.**
* Trang nghiệp vụ chỉ gồm các tab:
  * **Tab 1:** Báo Cáo & Phê Duyệt Số Liệu.
  * **Tab 2:** Nhật Ký Đối Soát / Log Vận Hành & Lỗi (Chia 3 sub-tabs: *Lỗi theo nhân viên | Lỗi vận hành quán | Dòng thời gian audit*).
  * **Nút bấm góc phải:** `[ ⚙️ Cài Đặt Phân Hệ ↗ ]` dẫn thẳng sang trang `/settings/*` chuyên sâu.

---

## 6. Các Thành Phần Vận Hành Bổ Sung (Operational UI Standards)

### 6.1. Nút Bấm & Phân Cấp (Button Hierarchy)
* **Nút Chính (Primary CTA):** `bg-[#2F6FA8] hover:bg-[#1D3E61] text-white font-bold rounded-xl shadow-xs min-h-[38px] px-4`
* **Nút Phê Duyệt (Success CTA):** `bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs min-h-[38px] px-4`
* **Nút Phụ (Secondary):** `bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-xl min-h-[38px] px-3.5`
* **Nút Cảnh Báo/Xóa (Danger):** `bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold rounded-xl min-h-[38px] px-3.5`

### 6.2. Ô Nhập Liệu & Bộ Lọc (Inputs & Filters)
* Label ô nhập: `text-xs font-bold text-gray-700 mb-1.5 block`
* Input: `bg-white border border-gray-200 text-xs rounded-xl py-2 px-3 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]`
* Filter Chips: Nằm ngang `[ Tất cả ] [ 🟢 Đã duyệt ] [ 🟡 Chờ duyệt ]` với thẻ active màu xám đâm/xanh Homies.

### 6.3. Trạng Thái Trống & Loading (Empty State & Skeleton)
* **Empty State:** Dùng icon nằm trong ô `bg-blue-50 text-[#2F6FA8] p-4 rounded-2xl` + tiêu đề `text-sm font-bold text-[#001D3D]` + hướng dẫn `text-xs text-gray-500` + 1 nút CTA tạo mới.
* **Loading Skeleton:** Sử dụng ô mờ nhấp nháy `animate-pulse bg-gray-100 rounded-xl` mô phỏng bảng biểu.

### 6.4. Ngăn Trượt Bên Phải (Slide-over Drawer)
* Dùng cho thao tác tạo nhanh/xem bộ lọc nâng cao. Nền trắng `bg-white shadow-2xl z-50 animate-in slide-in-from-right w-96 sm:w-[480px]`.

### 6.5. Giải Thích Chỉ Số (Tooltips)
* Icon `(?)` `HelpCircle` 13px màu xám bên cạnh thuật ngữ/số tiền. Rê chuột mở tooltip màu `bg-[#001D3D] text-white text-[11px] p-2.5 rounded-xl shadow-xl`.

### 6.6. Tương Thích Di Động (Mobile Responsiveness)
* Màn hình nhỏ (<768px): Hide Sidebar, hiển thị **Bottom Navigation Bar** 5 nút cố định dưới đáy màn hình (`fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-40`).

---

## 7. Checklist Kiểm Tra 15 Điểm Bắt Buộc Trước Khi Hoàn Thành Bất Kỳ Trang Con Nào

Mỗi lần AI thiết kế hoặc tinh chỉnh một trang con, **PHẢI TỰ CHECK ĐỦ 15 ĐIỀU NÀY**:

- [ ] **1. Full Màn Hình:** Container bọc trong `w-full max-w-none`, không dùng `max-w-7xl` co cụm.
- [ ] **2. Màu Nền Chuẩn:** Nền toàn trang là màu kem ấm `bg-[#FFF8E8]`.
- [ ] **3. Executive Header:** Có Header trắng cố định `sticky top-0 z-30` với Breadcrumb, trạng thái duyệt, bộ lọc chi nhánh/kỳ và nút hành động CEO.
- [ ] **4. Dải 4 Thẻ Vĩ Mô:** Đầu trang có 4 thẻ KPI tóm tắt `grid-cols-4`.
- [ ] **5. Tỷ Lệ Vàng 2/3 + 1/3:** Cột chính 2/3 (Bảng ma trận dữ liệu), Cột phụ 1/3 (Biểu đồ Radar/Lịch sử/Widget).
- [ ] **6. Chuẩn Typography Font Inter:** 100% dùng font Inter, cỡ chữ và độ đậm đúng bảng chuẩn scale.
- [ ] **7. Chuẩn Số Liệu Monospace:** 100% số tiền/KPI dùng `font-mono tabular-nums font-bold`.
- [ ] **8. Tương Tác Click Dòng:** Click bất kỳ đâu trên hàng bảng dữ liệu đều mở Modal bóc tách chi tiết.
- [ ] **9. Modal Chi Tiết Đầy Đủ:** Bóc tách công thức toán học + Nhật ký lỗi 5 trường + Phím chuyển `<` `>`.
- [ ] **10. Tab Nhật Ký Có Lỗi Theo Nhân Viên:** Tab nhật ký đối soát có phân khu xem lỗi gom theo từng nhân sự.
- [ ] **11. Nút Bấm Đúng Phân Cấp:** Nút chính xanh Homies `#2F6FA8`, nút chốt xanh lá, nút phụ trắng viền xám.
- [ ] **12. Trạng Thái Trống Chi Tiết:** Có Empty State rõ ràng với icon trong hộp xanh dịu + nút tạo mới khi không có dữ liệu.
- [ ] **13. Tải Dữ Liệu Dạng Skeleton:** Sử dụng `animate-pulse bg-gray-100` nhấp nháy mô phỏng bảng.
- [ ] **14. Tooltip Giải Thích `(?)`:** Có icon `(?)` giải thích công thức khi rê chuột.
- [ ] **15. Tuyệt Đối 0 Emoji:** 100% icon dùng Lucide, 0 lỗi TypeScript khi biên dịch.
