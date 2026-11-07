# Kế Hoạch Triển Khai: Tiện Ích Đồng Bộ iPOS HRM Sang Homies HRM (Homies iPOS Bridge)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng Tiện ích Chrome Manifest V3 tự động bắt dữ liệu từ iPOS HRM / FABi web và cổng API tiếp nhận / chuẩn hóa dữ liệu an toàn vào Homies HRM.

**Architecture:** Sử dụng kiến trúc 2 tầng gồm: (1) Chrome Extension Manifest V3 với Network Interceptor Hook chạy ngầm trên `*://*.ipos.vn/*` và `*://*.fabi.vn/*` để bắt số liệu sạch và hiển thị thông báo 1 chạm; (2) Bộ phiên dịch `ipos-normalizer` và endpoint `POST /api/ipos/sync` trên Homies HRM server để map mã nhân viên, cửa hàng, giờ công và lương vào database.

**Tech Stack:** Chrome Extension Manifest V3 (Vanilla JS, CSS), Next.js 16 App Router (TypeScript, Node.js), Server DB (`data/server-db.json`).

**Spec:** `docs/superpowers/specs/2026-10-02-ipos-hrm-bridge-extension-design.md`

## Global Constraints
- Tuân thủ Manifest V3: Không dùng `eval()`, không dùng inline scripts trong popup, bắt buộc tạo đầy đủ các file icon thật (`16x16`, `48x48`, `128x128`).
- Endpoint nhận dữ liệu phải hỗ trợ CORS (preflight `OPTIONS` & `POST`) để nhận request từ Extension.
- Bộ phiên dịch tuyệt đối không làm mất dữ liệu thưởng phạt BSC, KPI hay hợp đồng của Homies; dùng cơ chế Upsert thông minh.
- Bảo đảm 10/10 test case trong `scripts/test-bsc-flow.mjs` luôn PASS và `npm run ai:guard` thành công.

---

### Task 1: Bộ Phiên Dịch Chuẩn Hóa & Cổng Tiếp Nhận Dữ Liệu iPOS (Backend Adapter)

**Files:**
- Create: `src/lib/services/ipos/ipos-normalizer.ts`
- Create: `src/app/api/ipos/sync/route.ts`
- Test: `scripts/test-ipos-sync.mjs`

**Interfaces:**
- Consumes: JSON payload từ Extension `{ module, store_raw_code, period, raw_data, timestamp }`
- Produces: `normalizeIposData(payload)` -> kết quả lưu vào `data/server-db.json` và trả về `{ success: true, count: number, module: string }`

- [x] **Step 1: Viết script kiểm thử thất bại (Failing Test)**
Tạo file `scripts/test-ipos-sync.mjs` để gửi payload mẫu iPOS (nhân viên, bảng lương HBP tháng 8/2026) vào `http://localhost:3535/api/ipos/sync` và kiểm tra phản hồi.
```javascript
import assert from 'assert'

async function run() {
  console.log('--- TEST 1: Health check GET /api/ipos/sync ---')
  const resHealth = await fetch('http://localhost:3535/api/ipos/sync')
  assert.strictEqual(resHealth.status, 200)
  const healthJson = await resHealth.json()
  assert.strictEqual(healthJson.status, 'ready')

  console.log('--- TEST 2: Sync mock iPOS employees & payroll ---')
  const payload = {
    source: 'ipos_hrm',
    module: 'payroll',
    store_raw_code: 'HBP',
    period: '2026-08',
    raw_data: [
      {
        employeeCode: 'BH-9852',
        employeeName: 'Huỳnh Lê Kiều Linh',
        position: 'Quản lý cửa hàng',
        regularHours: 186.65,
        hourlyRate: 25000,
        netSalary: 3599500
      }
    ],
    timestamp: new Date().toISOString()
  }

  const resPost = await fetch('http://localhost:3535/api/ipos/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  assert.strictEqual(resPost.status, 200)
  const postJson = await resPost.json()
  assert.strictEqual(postJson.success, true)
  assert.strictEqual(postJson.count >= 1, true)
  console.log('✅ [PASS] All iPOS sync tests succeeded!')
}

run().catch((err) => {
  console.error('❌ [FAIL]', err)
  process.exit(1)
})
```

- [x] **Step 2: Chạy kiểm thử để xác nhận thất bại**
Chạy: `node scripts/test-ipos-sync.mjs`  
Kỳ vọng: Thất bại vì `/api/ipos/sync` chưa tồn tại (404 Not Found).

- [x] **Step 3: Viết mã nguồn Bộ phiên dịch `ipos-normalizer.ts`**
Tạo `src/lib/services/ipos/ipos-normalizer.ts` xử lý:
- Map chi nhánh: `'HBP'`, `'Hồ Bá Phấn'` -> `'store-001'`; `'429'` -> `'store-002'`.
- Map nhân viên: Lấy `employeeCode` khớp với `employee_code` của `mockEmployees` hoặc tạo mới.
- Upsert vào danh sách bảng lương và bảng chấm công trong `data/server-db.json` với trường `source: 'ipos'`.

- [x] **Step 4: Viết Route Handler `src/app/api/ipos/sync/route.ts`**
- Hỗ trợ `OPTIONS` trả về CORS headers: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`.
- Hỗ trợ `GET` trả về trạng thái máy chủ `{ status: 'ready', server: 'Homies HRM', time: ... }`.
- Hỗ trợ `POST` xác thực payload, gọi `normalizeIposData`, ghi DB và trả về kết quả chi tiết.

- [x] **Step 5: Chạy lại kiểm thử để xác nhận thành công**
Chạy: `node scripts/test-ipos-sync.mjs`  
Kỳ vọng: 100% PASS.

---

### Task 2: Xây Dựng Tiện Ích Chrome Core (Manifest V3, Hook ngầm & Content Script)

**Files:**
- Create: `extensions/homies-ipos-bridge/manifest.json`
- Create: `extensions/homies-ipos-bridge/injected-hook.js`
- Create: `extensions/homies-ipos-bridge/content.js`
- Create: `extensions/homies-ipos-bridge/content.css`
- Create: `extensions/homies-ipos-bridge/icons/generate-icons.js` (tạo icon 16, 48, 128)

**Interfaces:**
- `injected-hook.js` chạy trong MAIN world, chặn XHR/Fetch của iPOS, bắn `window.postMessage({ type: 'HOMIES_IPOS_DATA_CAPTURED', ... })`.
- `content.js` nhận message, hiển thị Smart Floating Toast:
  ```html
  <div id="homies-ipos-toast">
    <span>⚡ Homies Bridge: Phát hiện dữ liệu...</span>
    <button id="homies-sync-btn">Đồng bộ ngay</button>
    <button id="homies-dismiss-btn">✕</button>
  </div>
  ```

- [x] **Step 1: Tạo bộ Icon thật cho tiện ích**
Chạy script tạo các file PNG `icon-16.png`, `icon-48.png`, `icon-128.png` với logo nhận diện màu vàng ấm / xanh navy đặc trưng của Homies.

- [x] **Step 2: Tạo `manifest.json` chuẩn Manifest V3**
Khai báo host permissions cho `*://*.ipos.vn/*`, `*://*.fabi.vn/*`, `*://localhost/*`. Đăng ký `content_scripts` chạy `content.js` và `web_accessible_resources` cho `injected-hook.js`.

- [x] **Step 3: Viết `injected-hook.js` bắt phản hồi ngầm an toàn**
Ghi đè `window.fetch` và `XMLHttpRequest` để sao chép JSON khi gặp các API chứa dữ liệu nhân sự, chấm công hoặc doanh thu; gửi sang `content.js` qua `window.postMessage`.

- [x] **Step 4: Viết `content.js` và `content.css` hiển thị thông báo nổi thông minh**
Khi nhận được dữ liệu, hiện Toast ở góc phải trên màn hình iPOS. Bấm `[Đồng bộ ngay]` sẽ gửi dữ liệu tới Server URL (lấy từ `chrome.storage.local` với fallback là `http://localhost:3535`).

- [x] **Step 5: Kiểm tra cú pháp và cấu trúc file Extension**
Kiểm tra đảm bảo không có cú pháp lỗi, icon tồn tại đầy đủ, không vi phạm CSP Manifest V3.

---

### Task 3: Bảng Điều Khiển Cài Đặt Popup của Tiện Ích

**Files:**
- Create: `extensions/homies-ipos-bridge/popup.html`
- Create: `extensions/homies-ipos-bridge/popup.js`
- Create: `extensions/homies-ipos-bridge/popup.css`

**Interfaces:**
- Popup hiển thị khi bấm icon trên thanh Chrome:
  - Đèn trạng thái máy chủ Homies: 🟢 Đã kết nối / 🔴 Mất kết nối
  - Input: `Địa chỉ máy chủ Homies HRM` (lưu vào `chrome.storage.local`)
  - Nút `Lưu cài đặt`
  - Nút `Kiểm tra kết nối`
  - Thống kê: `Lần đồng bộ gần nhất: 15 nhân sự (HBP)`

- [x] **Step 1: Thiết kế giao diện `popup.html` và `popup.css`**
Giao diện nhỏ gọn 320px x 400px, phối màu chuẩn Homies (Navy `#001D3D`, Vàng Kem `#FFF8E8`, Xanh biển `#2F6FA8`), có logo và hướng dẫn sử dụng nhanh.

- [x] **Step 2: Viết logic `popup.js`**
- Đọc và lưu `serverUrl` vào `chrome.storage.local`.
- Tự động gọi `GET ${serverUrl}/api/ipos/sync` để đổi đèn tín hiệu máy chủ (Xanh/Đỏ).
- Cung cấp nút test ping để người dùng kiểm tra kết nối ngay lập tức.

- [x] **Step 3: Kiểm thử tương thích Popup**
Đảm bảo không dùng inline event handler (`onclick=...`), dùng hoàn toàn `addEventListener` theo đúng quy chuẩn bảo mật Manifest V3.

---

### Task 4: Gắn Huy Hiệu Nhận Diện Dữ Liệu & Kiểm Thử Toàn Diện (End-to-End Verification)

**Files:**
- Modify: `src/components/ui/DataSourceStatusBadge.tsx` hoặc các trang hiển thị liên quan.
- Test: `scripts/test-bsc-flow.mjs`
- Test: `npm run ai:guard`

- [x] **Step 1: Cập nhật component hiển thị nguồn dữ liệu**
Thêm hiển thị badge `🟢 iPOS Sync` khi phiếu lương hoặc bản ghi chấm công có trường `source: 'ipos'`.

- [x] **Step 2: Chạy kiểm thử luồng BSC và chấm công**
Chạy: `node scripts/test-bsc-flow.mjs`  
Kỳ vọng: 10/10 test case tiếp tục PASS không bị ảnh hưởng.

- [x] **Step 3: Chạy AI Guardrail**
Chạy: `npm run ai:guard`  
Kỳ vọng: PASS code health check.

- [x] **Step 4: Tạo tài liệu hướng dẫn cài đặt 1 chạm cho người dùng (README)**
Tạo `extensions/homies-ipos-bridge/HUONG_DAN_CAI_DAT.md` hướng dẫn chi tiết cách nạp tiện ích vào Chrome qua 3 bước đơn giản (Bật Chế độ nhà phát triển -> Tải tiện ích đã giải nén).
