# HRM Scheduling System — Design Spec

**Date:** 2026-06-11
**Author:** Codex
**Status:** Approved

---

## 1. Overview

Xay dung he thong xep lich lam viec hoan chinh cho chuoi tra sua Homies Milk Tea, bao gom 3 nhom tinh nang: Dang ky + Xep lich, Thao tac sau publish, Cham cong + OT.

**Phuong phap:** Incremental — tung buoc nho, test ky, khong big bang.
**Backend:** API routes (Next.js) + mock data → sau thay PostgreSQL.
**Testing:** Service unit tests → API tests → E2E (sau).

---

## 2. Architecture

```
UI Layer
  schedule/preferences  schedule/manage  schedule/swap
  schedule/open-shifts  attendance/today  admin/review
        |
        v API calls
API Routes Layer
  /api/schedule/*  /api/registration/*  /api/attendance
  /api/swap/*  /api/open-shifts/*
        |
        v Service calls
Service Layer
  ScheduleService  RegistrationService  AttendanceService
  SwapService  OpenShiftService  AutoAssignService
        |
        v Data access
Data Layer
  localStorage (phase 1) → PostgreSQL (phase 2)
```

Moi layer doc lap. Thay doi layer duoi khong anh huong layer tren.

---

## 3. Data Model

### 3.1 RegistrationWeek
```typescript
interface RegistrationWeek {
  id: string
  store_id: string
  week_start_date: string // T2
  status: '"'"'open'"'"' | '"'"'reviewing'"'"' | '"'"'published'"'"'
  registration_open_date: string
  registration_deadline: string // Admin set (vd: T5)
  published_at?: string
}
```

### 3.2 ShiftQuota
```typescript
interface ShiftQuota {
  id: string
  registration_week_id: string
  shift_id: string
  date: string
  position_id?: string // MOI: theo vi tri
  min_staff: number
  max_staff: number
}
```

### 3.3 ShiftPreference
```typescript
interface ShiftPreference {
  id: string
  user_id: string
  registration_week_id: string
  date: string
  shift_id: string
  level: '"'"'preferred'"'"' | '"'"'available'"'"' | '"'"'unavailable'"'"'
  not_available: boolean
  reason?: string
}
```

### 3.4 Schedule
```typescript
interface Schedule {
  id: string
  employee_id: string
  shift_id: string
  date: string
  store_id: string
  status: '"'"'draft'"'"' | '"'"'published'"'"'
  modified_after_publish: boolean
  change_reason?: string
  updated_by?: string
  updated_at?: string
}
```

### 3.5 OpenShift
```typescript
interface OpenShift {
  id: string
  shift_id: string
  date: string
  store_id: string
  slots_needed: number
  slots_filled: number
  status: '"'"'pending_approval'"'"' | '"'"'open'"'"' | '"'"'filled'"'"' | '"'"'cancelled'"'"'
  released_by: string
  released_at: string
  auto_approve: boolean
}
```

### 3.6 OpenShiftClaim
```typescript
interface OpenShiftClaim {
  id: string
  open_shift_id: string
  employee_id: string
  status: '"'"'pending'"'"' | '"'"'approved'"'"' | '"'"'rejected'"'"'
  claimed_at: string
  reviewed_by?: string
  reviewed_at?: string
}
```

### 3.7 SwapRequest
```typescript
interface SwapRequest {
  id: string
  requester_id: string
  requester_schedule_id: string
  target_id: string
  target_schedule_id?: string // null neu cover-only
  type: '"'"'swap'"'"' | '"'"'cover'"'"'
  reason: string
  status: '"'"'pending'"'"' | '"'"'peer_accepted'"'"' | '"'"'approved'"'"' | '"'"'rejected'"'"'
  created_at: string
  peer_accepted_at?: string
  reviewed_by?: string
  reviewed_at?: string
}
```

### 3.8 Attendance
```typescript
interface Attendance {
  id: string
  employee_id: string
  store_id: string
  date: string
  shift_id?: string
  scheduled_shift_id?: string // Link voi lich publish
  scheduled_start?: string    // 06:00
  scheduled_end?: string      // 14:00
  check_in_time?: string
  check_out_time?: string
  check_in_distance_meters?: number
  status: '"'"'on_time'"'"' | '"'"'late'"'"' | '"'"'early'"'"' | '"'"'absent'"'"' | '"'"'leave'"'"'
  late_minutes: number
  total_hours: number
  ot_hours: number // Tinh tu dong
  ot_status: '"'"'auto'"'"' | '"'"'pending_approval'"'"' | '"'"'approved'"'"' | '"'"'rejected'"'"'
}
```

---

## 4. API Endpoints

### Registration
- POST /api/registration/create-next — Auto tao ky tuan toi
- GET /api/registration/weeks?storeId= — Danh sach ky dang ky
- GET /api/registration/:id/quotas — Lay quota matrix
- PUT /api/registration/:id/quotas — Cap nhat quota
- POST /api/registration/:id/close — Dong dang ky → reviewing

### Preferences
- GET /api/preferences?weekStart= — Lay preferences employee
- POST /api/preferences — Luu preferences (draft/submitted)
- GET /api/preferences/summary?weekId= — Admin: bao nhieu da submit

### Schedule
- GET /api/schedule?storeId=&weekStart= — Lay lich tuan
- POST /api/schedule/assign — Gan ca (manual)
- DELETE /api/schedule/:id — Go ca
- POST /api/schedule/auto-assign — Auto assign theo preferences
- POST /api/schedule/publish — Publish lich tuan
- GET /api/schedule/changes?weekId= — Lich su thay doi

### Open Shifts
- GET /api/open-shifts?storeId= — Danh sach ca trong
- POST /api/open-shifts/release — Nha ca (tao open shift)
- GET /api/open-shifts/claims — Claims cho duyet
- POST /api/open-shifts/claims — Employee nhan ca
- PUT /api/open-shifts/claims/:id — Manager duyet/tu choi claim
- PUT /api/open-shifts/:id/approve — Manager duyet nha ca

### Swap
- GET /api/swap/requests — Yeu cau doi ca cua toi
- POST /api/swap/requests — Tao yeu cau doi ca
- PUT /api/swap/requests/:id/accept — Peer dong y
- PUT /api/swap/requests/:id/approve — Manager duyet
- PUT /api/swap/requests/:id/reject — Tu choi

### Attendance
- POST /api/attendance/check-in — Check-in
- POST /api/attendance/check-out — Check-out
- GET /api/attendance?date= — Lay cham cong ngay
- GET /api/attendance/summary?weekId= — Tong hop tuan
- PUT /api/attendance/:id/ot-approve — Admin duyet OT

---

## 5. Key Logic

### 5.1 Auto-assign voi fallback
```
1. Lay all preferences cho tuan
2. Voi moi ca (date + shift):
   a. Loc employee co preference = '"'"'preferred'"'"' → chua co ca ngay do
   b. Neu du max_staff → gan het preferred
   c. Neu chua du → them employee co preference = '"'"'available'"'"'
   d. Neu van chua du → them employee chua dang ky (setting)
   e. Notify employee neu duoc gan ca khac preference
3. Check gioi han: max_shifts/employee, min_rest_hours
4. Violation → warning, khong block
```

### 5.2 Nha ca workflow
```
Employee bam "Nha ca"
 → Tao OpenShift (status: pending_approval)
    → Notify admin
    → Admin duyet
       ├── Approve → status: open → employee go khoi Schedule
       └── Reject → status: cancelled → giu nguyen Schedule, notify employee
```

### 5.3 OT calculation
```
ot_hours = max(0, actual_checkout - scheduled_end)
if ot_hours > ot_approval_threshold:
    ot_status = '"'"'pending_approval'"'"'
else:
    ot_status = '"'"'auto'"'"'
```

### 5.4 Deadline enforcement
```
- Form tu khoa khi deadline den
- Bao "Da het han dang ky"
- Admin se gan tay phan thieu
```

### 5.5 Post-publish edits
```
- Admin sua ca → ghi ly do bat buoc
- Tu cap nhat thay doi, KHONG can publish lai
- Notify employee khi ca thay doi
```

---

## 6. Settings

```typescript
SCHEDULE_CYCLE = {
  registration_open_offset_days: -7,
  registration_deadline_offset_days: -2, // Admin set cung T5
  auto_create_next_week: true,
  reminder_before_deadline_hours: 24,
}

AUTO_ASSIGN = {
  enabled: true,
  fallback_to_available: true,          // Xep ca available neu preferred full
  notify_on_fallback: true,             // Notify khi bi fallback
  max_shifts_per_employee_per_week: 6,
  min_rest_hours_between_shifts: 12,
  balance_workload: true,
}

PUBLISH_RULES = {
  publish_day: '"'"'sunday'"'"',               // Publish CN hang tuan
  auto_publish_on_deadline: false,
  allow_republish: false,
  notify_on_publish: true,
}

RELEASE_SHIFT = {
  allow_release_after_publish: true,
  release_requires_approval: true,      // CAN ADMIN DUYET
  release_min_hours_before_shift: 4,
  release_auto_notify_store: true,
}

OPEN_SHIFT = {
  auto_approve: false,
  requires_manager_approval: true,
  max_claims_per_week: 2,
  display_all_stores: false,
}

SWAP_RULES = {
  requires_peer_approval: true,
  requires_manager_approval: true,
  min_hours_before_shift: 4,
  same_day_allowed: false,
  cover_only_requires_manager: true,
}

ATTENDANCE = {
  ot_approval_threshold_hours: 2,       // OT > 2h can duyet
  max_ot_hours_per_day: 3,             // Cap OT 3h/ngay
  late_grace_minutes: 5,               // Tre <= 5p khong bi late
  early_leave_grace_minutes: 5,
}
```

---

## 7. Incremental Phases

### Phase 1: Fix + Settings (1-2 tuan)
- [ ] Fix auto-assign overwrite bug (check isWeekPublished)
- [ ] Them position_id vao ShiftQuota
- [ ] Them isLocked enforcement trong savePreferences
- [ ] Tao settings store (localStorage → API)
- [ ] Viet service unit tests

### Phase 2: API Layer (1-2 tuan)
- [ ] Bo cua mock data trong API routes
- [ ] Them validation + error handling
- [ ] Viet API integration tests
- [ ] Dam bao UI goi API thay vi import truc tiep

### Phase 3: Open Shifts + Swap (1-2 tuan)
- [ ] Fix open shift disable khi full
- [ ] Them duyet nha ca cho admin
- [ ] Fix swap notify cho manager
- [ ] Them pending count badge real-time
- [ ] Integration tests

### Phase 4: Attendance + OT (2-3 tuan)
- [ ] Them Attendance model + API
- [ ] Tich hop scheduled_shift_id vao attendance
- [ ] Tinh OT tu dong (check-out - scheduled_end)
- [ ] Admin duyet OT > threshold
- [ ] Late/Early detection
- [ ] E2E tests

---

## 8. Open Questions (resolved)

| # | Cau hoi | Quyet dinh |
|---|---|---|
| 1 | Auto-assign ca preferred full? | Fallback sang available + notify |
| 2 | Dang ky sau deadline? | Tu khoa form, admin gan tay |
| 3 | Nha ca co can duyet? | CAN ADMIN DUYET |
| 4 | Publish lai sau sua? | Khong can, tu cap nhat |
| 5 | Backend? | API routes + mock → sau thay DB |
| 6 | Testing? | Service tests → API tests → E2E |
| 7 | Attendance tich hop lich? | Co, link scheduled_shift_id |
| 8 | OT? | Tu dong + admin duyet OT lon |
