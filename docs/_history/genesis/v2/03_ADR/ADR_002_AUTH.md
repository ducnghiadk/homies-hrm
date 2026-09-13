# ADR-002: Authentication & Authorization

**Status**: Accepted
**Date**: 2026-02-15

## Decision

### Authentication

- **Method**: Phone OTP via Supabase Auth
- **Token**: JWT with auto-refresh
- **Session**: 7 days persistent, remember-me option

### Authorization (5 Roles)

```
SUPER_ADMIN (CEO)
  └── HR_ADMIN
       └── STORE_MANAGER
            └── SHIFT_LEADER
                 └── EMPLOYEE
```

### RLS Strategy

- Mỗi employee có `store_id` → filter dữ liệu theo store
- Manager chỉ xem NV cùng store
- HR Admin xem tất cả
- CEO read-only toàn bộ
- Custom claims trong JWT: `{ role, store_id, employee_id }`

## Consequences

- RLS tại DB layer → an toàn ngay cả khi API bị bypass
- Role hierarchy rõ ràng → dễ mở rộng
- Phone-only auth → đơn giản cho NV cửa hàng (không cần email)
