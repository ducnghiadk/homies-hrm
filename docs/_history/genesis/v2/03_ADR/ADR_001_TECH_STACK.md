# ADR-001: Tech Stack Selection

**Status**: Accepted
**Date**: 2026-02-15
**Context**: HRM PWA cho chuỗi trà sữa Việt Nam

## Decision

| Layer        | Choice                      | Rationale                                                        |
| ------------ | --------------------------- | ---------------------------------------------------------------- |
| **Frontend** | Next.js 14 + React 19       | App Router, SSR/SSG, file-based routing, native PWA support      |
| **Language** | TypeScript                  | Type safety, DX, maintainability                                 |
| **Styling**  | TailwindCSS + CSS Variables | Rapid prototyping, design tokens, theming                        |
| **State**    | Zustand + TanStack Query    | Zustand: simple auth state; TanStack: server-state cache         |
| **Backend**  | Supabase                    | Auth, PostgreSQL, Realtime, Storage, Edge Functions — all-in-one |
| **Database** | PostgreSQL (via Supabase)   | RLS, triggers, full-text search, JSON support                    |
| **Storage**  | Supabase Storage            | Selfies, documents, course materials                             |
| **Auth**     | Supabase Auth (OTP)         | Phone OTP, JWT, row-level security integration                   |
| **Deploy**   | Vercel                      | Zero-config Next.js, edge functions, preview deploys             |
| **PWA**      | @ducanh2912/next-pwa        | Service worker, offline support, install prompt                  |

## Alternatives Considered

### Frontend Framework

- **Vite + React**: Không có SSR/SSG built-in, cần thêm routing
- **Remix**: Tốt nhưng ecosystem nhỏ hơn Next.js
- **Flutter Web**: Quá nặng cho PWA, bundle size lớn

### Backend

- **Firebase**: Không có full SQL, Firestore query hạn chế
- **Custom Node.js**: Tốn thời gian setup auth, storage, realtime
- **Appwrite**: Ecosystem nhỏ hơn Supabase

### Database

- **MongoDB**: NoSQL không phù hợp cho payroll/attendance relational data
- **MySQL**: Thiếu RLS, JSON support kém hơn PostgreSQL

## Consequences

**Positive**:

- Rapid development (Supabase tự tạo REST API từ schema)
- Security built-in (RLS policies)
- Real-time subscriptions cho chat, notifications
- Zero-infra management

**Negative**:

- Vendor lock-in (Supabase)
- Edge function cold start (~200ms)
- Supabase Storage bandwidth limits on free tier
