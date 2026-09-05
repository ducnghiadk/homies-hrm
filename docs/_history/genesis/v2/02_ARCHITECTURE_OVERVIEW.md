# HRM Trà Sữa — Architecture Overview

# Genesis v2

## 1. System Overview

```
┌─────────────────────────────────────────────────────┐
│                    HRM Trà Sữa                       │
│                   (PWA Client)                       │
│  Next.js 14 + React 19 + TypeScript + TailwindCSS   │
└──────────┬──────────────────────────┬────────────────┘
           │ REST API / Realtime      │ File Upload
           ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐
│   Supabase Backend   │   │  Supabase Storage    │
│  ┌────────────────┐  │   │  - Selfies           │
│  │ Auth (OTP)     │  │   │  - Evidence photos   │
│  │ PostgREST API  │  │   │  - Course materials  │
│  │ Realtime       │  │   │  - Documents         │
│  │ Edge Functions │  │   └──────────────────────┘
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ PostgreSQL DB  │  │
│  │ (~65 tables)   │  │
│  │ RLS Policies   │  │
│  └────────────────┘  │
└──────────────────────┘
```

## 2. System Decomposition

### System 1: Frontend PWA (SYS-FE)

- **Responsibility**: UI rendering, routing, state management, offline support
- **Source**: `src/`
- **Boundary**: All client-side code
- **Dependencies**: SYS-API, SYS-STORAGE

### System 2: API Layer (SYS-API)

- **Responsibility**: Data access, auth, business logic
- **Source**: Supabase (PostgREST auto-generated + Edge Functions)
- **Boundary**: All server-side logic
- **Dependencies**: SYS-DB

### System 3: Database (SYS-DB)

- **Responsibility**: Data storage, RLS security, triggers, functions
- **Source**: `supabase/` (migrations, schema, seed)
- **Boundary**: PostgreSQL with RLS
- **Dependencies**: None (data layer)

### System 4: Storage (SYS-STORAGE)

- **Responsibility**: File storage for selfies, evidence, documents
- **Source**: Supabase Storage buckets
- **Boundary**: Blob storage
- **Dependencies**: SYS-API (access control)

## 3. Frontend Architecture

### 3.1 Module Structure

```
src/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth group
│   │   ├── login/page.tsx
│   │   └── verify/page.tsx
│   ├── (main)/                    # Authenticated pages
│   │   ├── page.tsx               # Dashboard (role-based)
│   │   │
│   │   ├── schedule/              # MODULE: Scheduling
│   │   │   ├── page.tsx           # Employee schedule view
│   │   │   ├── manage/page.tsx    # Manager schedule editor
│   │   │   ├── by-shift/page.tsx  # Grid: shift × date
│   │   │   ├── by-employee/page.tsx
│   │   │   ├── approval/page.tsx
│   │   │   ├── auto/page.tsx      # Auto-schedule
│   │   │   └── locations/page.tsx # Work locations
│   │   │
│   │   ├── attendance/            # MODULE: Attendance
│   │   │   ├── page.tsx           # My attendance
│   │   │   ├── today/page.tsx     # Today's overview
│   │   │   ├── by-store/page.tsx  # Grid view
│   │   │   ├── by-date/page.tsx
│   │   │   ├── requests/page.tsx
│   │   │   ├── devices/page.tsx
│   │   │   ├── alerts/page.tsx    # Duplicate device
│   │   │   └── late-report/page.tsx
│   │   │
│   │   ├── checkin/page.tsx       # Check-in action
│   │   │
│   │   ├── tasks/                 # MODULE: Tasks
│   │   │   ├── page.tsx           # Daily tasks
│   │   │   └── templates/page.tsx
│   │   │
│   │   ├── employees/             # MODULE: Employees
│   │   │   ├── page.tsx           # List
│   │   │   ├── [id]/page.tsx      # Detail
│   │   │   └── new/page.tsx       # Add
│   │   │
│   │   ├── communication/         # MODULE: Communication
│   │   │   ├── news/page.tsx
│   │   │   ├── announcements/page.tsx
│   │   │   └── policies/page.tsx
│   │   │
│   │   ├── payroll/               # MODULE: Payroll
│   │   │   ├── page.tsx           # My salary slip
│   │   │   ├── by-store/page.tsx
│   │   │   ├── company/page.tsx
│   │   │   ├── hold/page.tsx
│   │   │   ├── bonus/page.tsx
│   │   │   ├── deduction/page.tsx
│   │   │   ├── advance/page.tsx
│   │   │   └── insurance/page.tsx
│   │   │
│   │   ├── reports/               # MODULE: Reports
│   │   │   ├── page.tsx           # HR Overview
│   │   │   ├── staff-hour/page.tsx
│   │   │   ├── attendance/page.tsx
│   │   │   ├── salary/page.tsx
│   │   │   ├── budget/page.tsx
│   │   │   ├── auto-raise/page.tsx
│   │   │   └── tasks/page.tsx
│   │   │
│   │   ├── settings/              # MODULE: Settings
│   │   │   ├── page.tsx           # Overview
│   │   │   ├── payroll/           # Payroll config sub-screens
│   │   │   ├── master/            # Master data CRUD
│   │   │   └── system/            # System settings
│   │   │
│   │   ├── kpi/page.tsx           # KPI
│   │   ├── rewards/page.tsx       # Rewards
│   │   ├── evaluation/page.tsx    # 360° Eval
│   │   ├── career/page.tsx        # Career Path
│   │   ├── gamification/page.tsx  # Gamification
│   │   ├── recognition/page.tsx   # Recognition
│   │   ├── learning/page.tsx      # Learning
│   │   ├── onboarding/page.tsx    # Onboarding
│   │   ├── wellness/page.tsx      # Wellness
│   │   ├── staffing/page.tsx      # Smart Staffing
│   │   ├── analytics/page.tsx     # Analytics
│   │   ├── admin/page.tsx         # Admin Config
│   │   ├── notifications/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── chat/page.tsx
│   │   └── requests/page.tsx
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          # Main layout wrapper
│   │   └── BottomNav.tsx         # Role-based bottom nav
│   ├── ui/                       # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Calendar.tsx
│   │   └── Chart.tsx
│   └── features/                 # Feature-specific components
│       ├── schedule/
│       ├── attendance/
│       ├── payroll/
│       └── ...
│
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── mock-data.ts              # Phase 1-3 mock data
│   ├── mock-data-p4.ts           # Phase 4 mock data
│   ├── mock-data-p5.ts           # Phase 4i+5 mock data
│   ├── utils.ts                  # Utilities
│   └── constants.ts              # App constants
│
├── store/
│   └── auth-store.ts             # Zustand auth store
│
└── types/
    └── index.ts                  # TypeScript types
```

### 3.2 State Management

- **Auth**: Zustand store (`auth-store.ts`)
- **Server State**: React Query (TanStack Query) for API data
- **UI State**: React useState/useReducer
- **Offline**: Service Worker + IndexedDB queue

### 3.3 Routing

- Next.js App Router (file-based)
- Middleware for auth protection
- Role-based route guards

## 4. Database Architecture

### 4.1 Schema Groups

```
┌─────────┐     ┌─────────┐     ┌───────────┐
│  Core   │────▶│Schedule │────▶│Attendance │
│ (org,   │     │(shifts, │     │(records,  │
│  store, │     │ work    │     │ devices,  │
│  dept,  │     │ locs)   │     │ requests) │
│  pos,   │     └─────────┘     └───────────┘
│  emp)   │
└────┬────┘     ┌─────────┐     ┌───────────┐
     │         ▶│ Payroll │◀───▶│  Reports  │
     ├────────▶│(config, │     │(computed  │
     │          │ slips,  │     │ views)    │
     │          │ adj)    │     └───────────┘
     │          └─────────┘
     │
     ├────────▶┌─────────┐     ┌───────────┐
     │         │  KPI/   │────▶│  Career   │
     │         │ Rewards │     │  Path     │
     │         └─────────┘     └───────────┘
     │
     ├────────▶┌─────────┐
     │         │Gamifi-  │
     │         │cation + │
     │         │Learning │
     │         └─────────┘
     │
     └────────▶┌─────────┐
               │Settings │
               │+ Audit  │
               └─────────┘
```

### 4.2 RLS (Row Level Security)

- **Employee**: chỉ xem dữ liệu của mình (attendance, salary, KPI)
- **Manager**: xem dữ liệu NV trong cùng store
- **HR Admin**: xem tất cả NV, chỉnh sửa config
- **CEO**: read-only toàn bộ
- **ShiftLeader**: xem NV trong ca mình quản lý

## 5. Security Architecture

### 5.1 Authentication

- OTP via phone number (Supabase Auth)
- JWT tokens (auto-refresh)
- Session management

### 5.2 Authorization (5 Roles)

| Role          | Permissions              |
| ------------- | ------------------------ |
| CEO           | Read all, no edit        |
| HR Admin      | Full CRUD, config        |
| Store Manager | CRUD within store        |
| Shift Leader  | View team, basic approve |
| Employee      | Self-service only        |

### 5.3 Data Protection

- GPS/selfie chỉ dùng cho check-in, không tracking
- Anonymous feedback thực sự ẩn danh (no FK to employee)
- Audit log cho mọi thay đổi config
- Device fingerprint cho fraud detection

## 6. Performance Considerations

- **PWA**: Service Worker caching, offline check-in
- **Images**: Supabase Image Transforms, lazy loading
- **DB**: Proper indexing, materialized views for reports
- **Bundle**: Code splitting per route (Next.js automatic)
