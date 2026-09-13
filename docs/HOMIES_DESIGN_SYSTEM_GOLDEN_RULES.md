# BẢNG QUY CHUẨN THIẾT KẾ GIAO DIỆN EXECUTIVE SAAS (GOLDEN DESIGN SYSTEM RULES)

> **Phiên bản:** `v3.2 (Golden Standard - Multi-Project Standalone Edition)`  
> **Áp dụng cho:** Tất cả các dự án Web SaaS, F&B, HRM, Kiểm kho, CRM, Quản lý chuỗi cửa hàng.  
> **Triết lý chủ đạo:** Apple SaaS F&B (Ấm áp - Sang trọng - Tinh gọn - Chuẩn chỉnh số liệu).

---

## 1. Triết Lý Thiết Kế & Phong Cách Chủ Đạo

1. **Nền Trang Kem Ấm (`#FFF8E8`):** Nền toàn trang **luôn luôn** là màu kem ấm dịu mắt (`bg-[#FFF8E8]`). Giúp người dùng vận hành hệ thống cả ngày không bị mỏi mắt.
2. **Màn Hình Tràn Viền 100% (`w-full max-w-none`):** Tuyệt đối không co cụm nội dung ở giữa màn hình (`max-w-7xl`). Bảng biểu và dữ liệu phải được trải rộng thoáng mắt trên màn hình máy tính.
3. **Thẻ Trắng Bo Góc Mềm (`rounded-2xl`):** Các khối thông tin, bảng biểu, thẻ card nằm trên bề mặt trắng (`bg-white`), bo góc tròn mềm (`rounded-2xl`), viền siêu mỏng (`border-gray-100` hoặc `border-gray-200/70`), bóng mờ tinh tế (`shadow-xs` / `shadow-2xs`).
4. **Trực Quan Số Liệu Tài Chính (Financial Clarity):** 100% số tiền VNĐ, giờ công, điểm đánh giá, phần trăm % **bắt buộc** dùng kiểu chữ số thẳng hàng (`font-mono tabular-nums font-bold`).
5. **Độ Đậm Chữ Thanh Thoát:** Ưu tiên dùng `font-bold` (700) / `font-semibold` (600) / `font-medium` (500). Tuyệt đối **KHÔNG** dùng `font-black` (900) hay `font-extrabold` (800) làm thô chữ.
6. **Tuyệt Đối 0 Emoji:** 100% biểu tượng sử dụng từ thư viện icon chuẩn `lucide-react`.

---

## 2. Bảng Màu Chuẩn (Color Tokens & Tailwind Classes)

| Tên Màu | Mã HEX | Class Tailwind | Vai Trò & Trường Hợp Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Kem Ấm Page BG** | `#FFF8E8` | `bg-[#FFF8E8]` | **Nền toàn bộ tất cả màn hình web** |
| **Thẻ Trắng (Surface)** | `#FFFFFF` | `bg-white` | Thẻ card, bảng dữ liệu, pop-up modal, header |
| **Xanh Homies (Primary)** | `#2F6FA8` | `bg-[#2F6FA8]` / `text-[#2F6FA8]` | Nút chính (CTA), Tab đang chọn, icon thương hiệu |
| **Xanh Đậm Navy** | `#001D3D` | `text-[#001D3D]` | Tiêu đề lớn (H1/H2), số liệu tài chính quan trọng |
| **Xanh Đậm Hover** | `#1D3E61` | `bg-[#1D3E61]` | Trạng thái rê chuột (hover) của nút bấm chính |
| **Xanh Nhạt Hộp Icon** | `#F4F8FC` | `bg-blue-50` / `bg-primary-50` | Hộp vuông chứa icon, nền ô thông báo nhẹ |
| **Xanh Lá Mint (Success)** | `#1E9E57` | `text-emerald-700` / `bg-emerald-600` | Thành công, đã chốt, đạt KPI, tiền thưởng |
| **Xanh Lá Nhạt** | `#DDF4EC` | `bg-emerald-50` / `border-emerald-200` | Nhãn trạng thái đạt chuẩn, hộp thông báo an toàn |
| **Vàng Cam (Warning)** | `#D97706` | `text-amber-800` / `bg-amber-600` | Chờ duyệt, cảnh báo nhẹ, cần xem lại |
| **Vàng Cam Nhạt** | `#FEF3C7` | `bg-amber-50` / `border-amber-200` | Nhãn trạng thái "Chờ duyệt", dòng lưu ý |
| **Đỏ Hồng (Error/Danger)** | `#E11D48` | `text-rose-700` / `bg-rose-600` | Lỗi vi phạm, từ chối, trừ tiền, lỗi hệ thống |
| **Đỏ Hồng Nhạt** | `#FFE4E6` | `bg-rose-50` / `border-rose-200` | Nhãn báo lỗi, ô cảnh báo bị phạt |

---

## 3. Quy Chuẩn Font Chữ Chi Tiết (Typography System)

### 3.1. Quy Định Họ Font Chữ (Font Family)
* **Font văn bản chính:** 100% ứng dụng sử dụng font **`Inter`** (qua biến `--font-inter` / `font-sans`).
* **Font số liệu tài chính:** 100% số tiền VNĐ, giờ công, điểm số dùng font **Monospace** (`font-mono`) kết hợp **`tabular-nums`** để các con số gióng thẳng hàng dọc.
* **CÁC ĐIỀU CẤM KỊ:**
  * ❌ Tuyệt đối **CẤM** dùng font `Poppins`, `Arial`, `Times New Roman` hoặc font chân hoa văn (Serif).
  * ❌ Tuyệt đối **CẤM** dùng độ đậm chữ `font-black` (900) hoặc `font-extrabold` (800) làm thô chữ, chật chội.

### 3.2. Cấp Bậc Kích Thước & Độ Đậm Font (Font Hierarchy Scale)

| Cấp Vị Trí | Kích Thước Class | Độ Đậm (Weight) | Màu Chữ Quy Định | Dùng Cho Thành Phần Nào? |
| :--- | :--- | :--- | :--- | :--- |
| **Tiêu đề Trang (H1)** | `text-xl` (20px) / `text-2xl` (24px) | `font-bold` (700) | `text-[#001D3D]` | Tiêu đề chính trang web ở Header cố định |
| **Tiêu đề Khối (H2)** | `text-base` (16px) / `text-lg` (18px) | `font-bold` (700) | `text-[#001D3D]` | Tiêu đề thẻ lớn, tiêu đề bảng dữ liệu |
| **Tiêu đề Thẻ (H3)** | `text-sm` (14px) | `font-semibold` (600) | `text-gray-800` | Tiêu đề thẻ chỉ số vĩ mô, tiêu đề modal |
| **Số Liệu Tài Chính To** | `text-2xl` / `text-3xl` | `font-bold font-mono tabular-nums` | `text-[#001D3D]` / `text-emerald-700` | Con số tổng tiền, số quỹ thưởng, KPI tổng |
| **Nội Dung Bảng & Form** | `text-xs` (12px) | `font-medium` (500) | `text-gray-700` | Dòng nội dung trong bảng, ô nhập liệu |
| **Chú Thích Phụ (Caption)**| `text-[11px]` (11px) | `font-medium` (500) | `text-gray-500` | Dòng mô tả nhỏ dưới số liệu, breadcrumb |
| **Nhãn Trạng Thái (Badge)**| `text-[10px]` (10px) | `font-bold uppercase tracking-wider` | Tùy nhãn (Rose/Amber/Mint) | Viên thuốc báo trạng thái (Đã duyệt, Chờ duyệt) |

### 3.3. Mẫu Code Chuẩn Cho Số Liệu Tài Chính
```tsx
<span className="font-mono tabular-nums font-bold text-[#001D3D]">
  {formatVnd(12500000)}
</span>
```

---

## 4. Bố Cục 3 Tầng Cho Trang Con Nghiệp Vụ (Executive Command Pattern)

Mọi trang con nghiệp vụ (Báo cáo Lương, Phân Ca, Chấm Công, Thưởng, Kiểm Kho...) **BẮT BUỘC** triển khai theo cấu trúc 3 Tầng:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 1: EXECUTIVE COMMAND HEADER (Cố định sticky top-0 z-30 trên nền trắng) │
│ • Cột trái: Breadcrumb (Hệ thống > Phân hệ) + Tiêu đề H1 + Badge Trạng thái│
│ • Cột phải: Chọn Chi nhánh + Chọn Kỳ xét + [ Xuất Excel ] + [ Phê Duyệt ]   │
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
│   ◀ CỘT CHÍNH (2/3 bên trái):              │ ▶ CỘT PHỤ (1/3 bên phải):      │
│   1. Bảng dữ liệu chính (Data Table)       │ 1. Biểu đồ Radar / Biểu đồ cột │
│      (Click cả dòng mở Modal bóc tách)     │ 2. Lịch sử diễn biến / Widget   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Chi Tiết Bản Vẽ Thành Phần Giao Diện (Component Blueprints)

### 5.1. Thanh Menu Bên Trái (Sidebar Navigation)
* **Vị trí:** Cố định mép trái màn hình (`fixed left-0 top-0 h-screen w-64`), nền trắng sạch (`bg-white`), viền mỏng mép phải (`border-r border-gray-100`).
* **Phần Logo:** Logo thương hiệu + Tên chi nhánh hiện tại + Avatar tài khoản bên dưới.
* **Mục Menu:**
  * *Chưa chọn:* Nền trong suốt, chữ xám (`text-gray-600 font-medium`), icon xám. Hover vào đổi nền xám nhẹ (`hover:bg-gray-50`).
  * *Đang chọn (Active):* Nền xanh nhạt (`bg-blue-50/70`), chữ xanh Homies (`text-[#2F6FA8] font-bold`), icon xanh, mép trái có **vạch màu xanh đứng 4px**.
  * *Tên nhóm menu:* Chữ in hoa nhỏ (`text-[10px] uppercase font-bold text-gray-400 tracking-wider px-3 py-2`).

---

### 5.2. Header Điều Hành Cố Định (Executive Command Header)
```tsx
<div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs w-full sticky top-0 z-30">
  <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4">
    {/* Trái: Breadcrumb + Tiêu đề + Trạng thái */}
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <span>Homies SaaS</span>
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

### 5.3. Thẻ Chỉ Số Vĩ Mô (Macro KPI Cards)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-gray-500">Tên Chỉ Số Vĩ Mô</span>
      <div className="p-2 bg-blue-50 text-[#2F6FA8] rounded-xl">
        <DollarSign size={16} />
      </div>
    </div>
    <div className="mt-3">
      <div className="text-2xl font-bold text-[#001D3D] font-mono tabular-nums">
        125.000.000 đ
      </div>
      <div className="flex items-center gap-1 mt-1 text-[11px]">
        <span className="text-emerald-600 font-bold flex items-center">+12.5%</span>
        <span className="text-gray-400">so với tháng trước</span>
      </div>
    </div>
  </div>
</div>
```

---

### 5.4. Bảng Dữ Liệu Tương Tác Click Dòng (Interactive Data Table)
* **Quy tắc quan trọng:** Bấm vào **BẤT KỲ ĐÂU trên hàng `<tr>`** đều mở Modal bóc tách chi tiết.
* **Chân bảng (Footer):** Luôn có 1 dòng tóm tắt tinh gọn (`Đội ngũ: X người • Đủ điều kiện: Y/X • Tổng giờ: Z`).

```tsx
<div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
  <div className="overflow-x-auto">
    <table className="w-full text-xs text-left border-collapse">
      <thead>
        <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-100">
          <th className="py-3 px-4 text-[#001D3D]">Đối Tượng / Nhân Viên</th>
          <th className="py-3 px-3 text-center">Cấp Bậc</th>
          <th className="py-3 px-3 text-center">Số Lượng / Giờ</th>
          <th className="py-3 px-3 text-center">Trạng Thái</th>
          <th className="py-3 px-4 text-right">Thành Tiền (VND)</th>
          <th className="py-3 px-3 text-center">Thao Tác</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        <tr
          onClick={() => handleOpenDetail(item.id)}
          className="hover:bg-primary-50/30 transition-all cursor-pointer"
        >
          <td className="py-3.5 px-4 font-bold text-gray-900">{item.name}</td>
          <td className="py-3.5 px-3 text-center font-bold text-gray-600">{item.role}</td>
          <td className="py-3.5 px-3 text-center font-mono font-bold tabular-nums">{item.qty}</td>
          <td className="py-3.5 px-3 text-center">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Đạt chuẩn</span>
          </td>
          <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-emerald-700">{formatVnd(item.amount)}</td>
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

### 5.5. Modal Bóc Tách Chi Tiết Cá Nhân (Individual Breakdown Modal)
Mọi bảng khi click vào dòng bắt buộc có Modal bóc tách gồm **4 khối tiêu chuẩn**:
1. **Hero Header:** Tên đối tượng/nhân sự, chức vụ, số tiền thực nhận lớn, badge trạng thái đạt/không đạt.
2. **4 Bước Toán Học Minh Bạch:** Hiển thị dạng sơ đồ từ trái sang phải:  
   `Giờ làm / Số lượng` ➡️ `Cấp bậc & Hệ số` ➡️ `Điểm kỷ luật / Phạt` ➡️ `Số tiền thực nhận`.
3. **Danh Sách Sự Cố & Vi Phạm (5 trường thông tin):**
   - Tên lỗi & Nhóm lỗi.
   - Điểm phạt (-điểm).
   - Mô tả thực tế vi phạm.
   - Tác động lên tiền thưởng/chi phí.
   - Thời gian ghi nhận & Người xác nhận.
4. **Phím Điều Hướng Nhanh:** Nút `[ < Trước ]` và `[ Tiếp > ]` (kèm phím tắt `←` / `→`) để duyệt liên tục từng đối tượng mà không đóng modal.

---

### 5.6. Quy Tắc Phân Tách Tab Nghiệp Vụ vs Trung Tâm Cài Đặt (Tab Separation Rule)
* **Không nhúng các khối cài đặt định mức cồng kềnh vào thanh Tab báo cáo.**
* Trang nghiệp vụ chỉ gồm các tab:
  * **Tab 1:** Báo Cáo & Phê Duyệt Số Liệu.
  * **Tab 2:** Nhật Ký Đối Soát / Log Vận Hành & Lỗi.
  * **Nút bấm góc phải:** `[ ⚙️ Cài Đặt Phân Hệ ↗ ]` dẫn thẳng sang trang `/settings/*` chuyên sâu.

---

## 6. Các Thành Phần Vận Hành Bổ Sung (Operational UI Controls)

### 6.1. Hệ Thống Nút Bấm (Button Hierarchy)
* **Nút Chính (Primary CTA):** `bg-[#2F6FA8] hover:bg-[#1D3E61] text-white font-bold rounded-xl shadow-xs min-h-[38px] px-4`
* **Nút Phê Duyệt (Success CTA):** `bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs min-h-[38px] px-4`
* **Nút Phụ (Secondary):** `bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-xl min-h-[38px] px-3.5`
* **Nút Cảnh Báo/Xóa (Danger):** `bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold rounded-xl min-h-[38px] px-3.5`
* **Nút Nền Trong (Ghost):** `p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl`

### 6.2. Ô Nhập Liệu & Bộ Lọc (Inputs & Filter Chips)
* Label ô nhập: `text-xs font-bold text-gray-700 mb-1.5 block`
* Input field: `bg-white border border-gray-200 text-xs rounded-xl py-2 px-3 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8]`
* Filter Chips: Nằm ngang `[ Tất cả ] [ 🟢 Đã duyệt ] [ 🟡 Chờ duyệt ]` với thẻ active màu xám đậm/xanh Homies.

### 6.3. Trạng Thái Trống & Loading (Empty State & Skeleton)
* **Empty State:** Icon nằm trong ô `bg-blue-50 text-[#2F6FA8] p-4 rounded-2xl` + tiêu đề `text-sm font-bold text-[#001D3D]` + hướng dẫn `text-xs text-gray-500` + 1 nút CTA tạo mới.
* **Loading Skeleton:** Sử dụng ô mờ nhấp nháy `animate-pulse bg-gray-100 rounded-xl` mô phỏng bảng biểu.

### 6.4. Ngăn Trượt Bên Phải (Slide-over Drawer)
* Dùng cho thao tác tạo nhanh/xem bộ lọc nâng cao. Nền trắng `bg-white shadow-2xl z-50 animate-in slide-in-from-right w-96 sm:w-[480px]`.

### 6.5. Tooltips Giải Thích `(?)`
* Icon `(?)` `HelpCircle` 13px màu xám bên cạnh thuật ngữ/số tiền. Rê chuột mở tooltip màu `bg-[#001D3D] text-white text-[11px] p-2.5 rounded-xl shadow-xl`.

### 6.6. Thông Báo Nổi (Toast & Alert Banners)
* **Băng rôn hệ thống:** `bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-4 py-2.5 flex items-center justify-between`
* **Toast thành công:** `border-l-4 border-emerald-500 bg-white shadow-lg rounded-xl p-3.5`
* **Toast lỗi:** `border-l-4 border-rose-500 bg-white shadow-lg rounded-xl p-3.5`

### 6.7. Tương Thích Di Động (Mobile Responsiveness)
* Màn hình nhỏ (<768px): Hide Sidebar, hiển thị **Bottom Navigation Bar** 5 nút cố định dưới đáy màn hình (`fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-40`).

---

## 7. Master Checklist 15 Điểm Kiểm Tra Trước Khi Chốt Màn Hình

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
