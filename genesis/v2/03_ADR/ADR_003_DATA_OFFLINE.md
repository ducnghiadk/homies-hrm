# ADR-003: Data Architecture & Offline Strategy

**Status**: Accepted
**Date**: 2026-02-15

## Decision

### Data Flow

```
Client (PWA) ──▶ Supabase PostgREST ──▶ PostgreSQL
     │                                      │
     ├──▶ Supabase Storage (files)          │
     │                                      │
     └──▶ Supabase Realtime (WebSocket) ◀──┘
```

### Offline Strategy

- **Check-in**: Queue in IndexedDB → sync khi online
- **Daily Tasks**: Cache trong localStorage → sync completion
- **Read-only pages**: Service Worker cache (stale-while-revalidate)
- **Conflict resolution**: Server wins (last-write-wins cho đơn giản)

### Export Strategy

- **Excel**: Client-side generation (SheetJS/xlsx)
- **PDF**: Client-side generation (jsPDF + autoTable)
- **Payslip PDF**: Server-side Edge Function (formatting phức tạp)

## Consequences

- Offline check-in → NV không bị ảnh hưởng khi mất mạng
- Client-side export → không tốn server resources
- Server-wins → đơn giản nhưng có thể mất data offline trong edge case
