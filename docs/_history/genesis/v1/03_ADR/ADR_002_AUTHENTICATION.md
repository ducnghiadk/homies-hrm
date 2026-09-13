# ADR-002: Chiến lược xác thực (Authentication Strategy)

## Trạng thái

**Accepted** — 2026-02-15

## Bối cảnh

- 80% nhân viên Gen Z, dùng smartphone
- Cần login đơn giản, không password (80% sẽ quên)
- Multi-tenant: mỗi organization cách ly dữ liệu
- 3 roles: CEO, Manager, Employee

## Quyết định

### Phương thức: **Phone/Email OTP qua Supabase Auth**

- Primary: Số điện thoại → SMS OTP (6 số, 5 phút expiry)
- Secondary: Email → Magic Link / OTP
- Không dùng password truyền thống
- Session: JWT access token (1h) + refresh token (7d)

### Phân quyền: **Role-based qua `employees.role` + RLS policies**

| Role       | Route mặc định      | Quyền hạn                                  |
| ---------- | ------------------- | ------------------------------------------ |
| `ceo`      | /dashboard/ceo      | Toàn quyền, xem tất cả stores              |
| `manager`  | /dashboard/manager  | Quản lý store được gán, CRUD employees     |
| `employee` | /dashboard/employee | Self-service (check-in, xem lịch, profile) |

### Multi-tenant: **RLS policy filter bằng `org_id`**

```sql
-- Nhân viên chỉ thấy data org mình
CREATE POLICY "Employees can view own org"
ON employees FOR SELECT
USING (org_id = (SELECT org_id FROM employees WHERE auth_user_id = auth.uid()));
```

## Phương án loại bỏ

| Phương án                      | Lý do loại                                  |
| ------------------------------ | ------------------------------------------- |
| Username + Password            | Gen Z sẽ quên, UX kém                       |
| Social login (Google/Facebook) | Nhân viên không muốn dùng tài khoản cá nhân |
| Biometric (fingerprint)        | PWA không hỗ trợ đầy đủ                     |
| QR code login                  | Cần thêm thiết bị, phức tạp                 |

## Rủi ro

- SMS OTP cost (Supabase free tier: 30 users/month SMS) → Khuyến khích dùng email cho scale
- OTP brute force → Rate limit 5 attempts/5 phút
- Token theft → httpOnly cookies + SameSite=Strict
