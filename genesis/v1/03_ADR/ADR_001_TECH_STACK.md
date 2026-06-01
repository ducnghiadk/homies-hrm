# ADR-001: Lựa chọn Tech Stack

## Trạng thái

**Accepted** — 2026-02-15

## Bối cảnh

Dự án HRM Trà Sữa cần xây dựng hệ thống quản lý nhân sự cho chuỗi trà sữa 2-5 cửa hàng (MVP), 20-50 nhân viên, 80% Gen Z dùng smartphone. Yêu cầu:

- Mobile-first, installable (PWA)
- Real-time (attendance, chat, notifications)
- Offline capable (check-in khi mất mạng)
- Budget: **100% FREE tier**
- Team: Solo developer / small team

## Quyết định

### Frontend: **Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui**

### Backend: **Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)**

### State: **Zustand + TanStack Query**

### Charts: **Recharts**

### PWA: **@ducanh2912/next-pwa**

### Push: **Firebase Cloud Messaging (FCM)**

### Deploy: **Vercel (frontend) + Supabase (backend)**

## So sánh phương án

### Frontend Framework

| Tiêu chí             | Next.js 14 |  Nuxt 3   | SvelteKit | React Native |
| -------------------- | :--------: | :-------: | :-------: | :----------: |
| Nhu cầu phù hợp      |   ★★★★★    |   ★★★★    |   ★★★★    |     ★★★      |
| Cộng đồng/Ecosystem  |   ★★★★★    |   ★★★★    |    ★★★    |     ★★★★     |
| PWA support          |    ★★★★    |   ★★★★    |    ★★★    |  ✗ (native)  |
| SSR/SSG              |   ★★★★★    |   ★★★★★   |   ★★★★    |      ✗       |
| shadcn/ui compatible |   ★★★★★    |     ✗     |     ✗     |      ✗       |
| Talent pool VN       |   ★★★★★    |    ★★★    |    ★★     |     ★★★★     |
| **Tổng**             | **29/30**  | **23/30** | **19/30** |  **17/30**   |

**Chọn Next.js 14** vì: ecosystem lớn nhất, SSR giúp SEO & performance, shadcn/ui UI premium, talent pool lớn ở VN.

### Backend

| Tiêu chí                 | Supabase  | Firebase  | Custom (Express)  | Appwrite  |
| ------------------------ | :-------: | :-------: | :---------------: | :-------: |
| Free tier generous       |   ★★★★    |   ★★★★    | ★★★★★ (self-host) |   ★★★★    |
| PostgreSQL (relational)  |   ★★★★★   | ✗ (NoSQL) |       ★★★★★       |   ★★★★    |
| Auth built-in            |   ★★★★★   |   ★★★★★   | ✗ (build/use lib) |   ★★★★★   |
| Realtime                 |   ★★★★★   |   ★★★★★   |  ★★★ (Socket.io)  |    ★★★    |
| RLS (row-level security) |   ★★★★★   |   ★★★★    |    ✗ (manual)     |    ★★★    |
| Storage                  |   ★★★★    |   ★★★★★   |   ✗ (S3 needed)   |   ★★★★    |
| Dev Experience           |   ★★★★★   |   ★★★★    |        ★★★        |   ★★★★    |
| Scale to 200+ users      |   ★★★★    |   ★★★★    |       ★★★★★       |    ★★★    |
| **Tổng**                 | **37/40** | **31/40** |     **28/40**     | **30/40** |

**Chọn Supabase** vì: PostgreSQL relational DB phù hợp HRM, RLS built-in cho multi-tenant, Realtime cho chat & attendance, all-in-one (auth + storage + DB).

### State Management

| Tiêu chí       |  Zustand  | Redux Toolkit |   Jotai   | Context API |
| -------------- | :-------: | :-----------: | :-------: | :---------: |
| Bundle size    |   ★★★★★   |      ★★★      |   ★★★★★   |    ★★★★★    |
| Learning curve |   ★★★★★   |      ★★★      |   ★★★★    |    ★★★★★    |
| DevTools       |   ★★★★    |     ★★★★★     |    ★★★    |     ★★      |
| Performance    |   ★★★★★   |     ★★★★      |   ★★★★★   |     ★★★     |
| **Tổng**       | **19/20** |   **15/20**   | **17/20** |  **15/20**  |

**Chọn Zustand** vì: nhẹ nhất, API đơn giản, performance tốt, kết hợp TanStack Query cho server state.

## Điểm cân nhắc (Trade-offs)

| Trade-off                       | Chọn                 | Đánh đổi                                                                               |
| ------------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| PWA vs Native App               | PWA                  | Mất native features (background GPS, biometrics) nhưng deployment free, cross-platform |
| Supabase vs Self-hosted         | Supabase             | Bị lock-in nhưng dev speed nhanh 5x, free tier đủ cho MVP                              |
| shadcn/ui vs Build from scratch | shadcn/ui            | Component có sẵn, customizable, nhưng phụ thuộc vào radix-ui                           |
| @ducanh2912/next-pwa vs Serwist | @ducanh2912/next-pwa | Community fork phổ biến hơn, nhưng có thể outdated                                     |

## Hệ quả

### Tích cực

- 🟢 **Dev speed**: Full stack trong 1 codebase (Next.js + Supabase)
- 🟢 **Cost**: $0/month cho MVP
- 🟢 **UX**: shadcn/ui cho UI premium, TailwindCSS cho responsive
- 🟢 **Real-time**: Supabase Realtime cho chat + attendance tracking

### Tiêu cực

- 🔴 **Vendor lock-in**: Supabase (nhưng có thể migrate vì PostgreSQL)
- 🔴 **Free tier limits**: 500MB DB, 1GB storage, 50K monthly active users
- 🔴 **PWA limitations**: Không có background GPS, push trên iOS hạn chế

### Hành động tiếp theo

- [ ] Tạo Supabase project
- [ ] Cấu hình env variables
- [ ] Run database schema SQL
- [ ] Setup Vercel project
