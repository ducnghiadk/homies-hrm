# KPI SaaS Homies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** XÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢y lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân nghiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡p vÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥ KPI Homies theo mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh SaaS: cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥u hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng, chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m KPI thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng, sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“/khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i, thÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n, bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i test, thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­ thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch, tÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân.

**Architecture:** DÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±ng domain mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi trong `src/lib/kpi/` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ giao diÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi qua service/repository. Pass A-D chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng localStorage cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ revision vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  audit; Pass E thay repository bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng Supabase/RLS mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£p ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œng cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§a UI. CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c route KPI hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c chuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n sang nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân cÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â© trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc khi luÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œng thay thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢n.

**Tech Stack:** Next.js 16 App Router, React 19 Client Components, TypeScript 5.9, Tailwind CSS v4, Zustand auth, localStorage repository, Supabase, Node test runner, Lucide, Recharts.

---

## 1. CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âc kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿ hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ch

- ThÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â© tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± Pass A -> B -> C -> D -> E -> Pilot.
- MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi task chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° xÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­ lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥c tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°u tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“a 1-3 file code.
- MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi thay ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i logic phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc, code tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢u sau, rÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œi chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test xanh.
- Sau mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi task, tick `[x]` ngay trong file nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng code cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§a task.
- TrÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc khi sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a UI, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âc ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n liÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn quan trong `DESIGN_RULE_HOMIES_FINAL.md`.
- TrÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc khi sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a page App Router, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i chiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.
- KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng stage hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c commit cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c thay ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ang cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Âµn ngoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i task.

## 2. BÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ route sau rollout

| Route | Vai trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â² chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh | KÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ sau rollout |
|---|---|---|
| `/kpi` | TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ theo scope | Dashboard viÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡c cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â m, 4 chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“, bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢i ngÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â©, xu hÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºng |
| `/kpi/periods` | Admin/HR/CEO | TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³, theo dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµi trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ng thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡i, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a/mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i |
| `/kpi/review` | Shift Leader/CEO | Workspace chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m, trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i, duyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ |
| `/kpi/result` | NhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn | KÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n, lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ch sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­, bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng, khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i |
| `/kpi/violations` | Leader/Admin/CEO | HÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“, bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng, chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ng phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng |
| `/kpi/violations/appeals` | Leader/CEO | HÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£i khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh cuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i |
| `/kpi/promotion` | Leader/Admin/CEO | Pipeline thÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ng |
| `/kpi/development/tests` | NgÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m/Admin/CEO | BÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i test, rubric, test lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i |
| `/kpi/development/challenges` | Leader/CEO | Theo dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµi thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­ thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ nhiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡m |
| `/kpi/reports` | QuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ theo scope | Xu hÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºng, rÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§i ro, pipeline, xuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u |
| `/kpi/settings` | Admin/HR | KPI Builder, phiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n, xÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p loÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i, policy, khung lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ng |

Legacy route `/kpi/evaluate`, `/kpi/evaluate/trial` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  `/kpi/leaderboard` chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° redirect sau khi route thay thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c kiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­ trong Pass B/D.

## 3. CÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥u trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºc file ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ch

```text
src/lib/kpi/
  types.ts
  default-policy.ts
  scoring-engine.ts
  configuration-service.ts
  period-service.ts
  source-service.ts
  incident-service.ts
  development-service.ts
  report-service.ts
  permissions.ts
  repository.ts
  local-repository.ts
  supabase-repository.ts
  index.ts

src/components/kpi/
  KPIExecutiveHeader.tsx
  KPIStatusBadge.tsx
  builder/*
  periods/*
  workspace/*
  incidents/*
  development/*

src/app/kpi/
  page.tsx
  periods/page.tsx
  review/page.tsx
  result/page.tsx
  violations/**/*
  promotion/page.tsx
  development/tests/page.tsx
  development/challenges/page.tsx
  reports/page.tsx
  settings/page.tsx
```

CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c file cÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â© `src/lib/kpi-types.ts`, `src/lib/kpi-evaluation-service.ts`, `src/lib/kpi-settings-service.ts`, `src/lib/kpi-report-service.ts`, `src/lib/mock-data-kpi.ts` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  `src/lib/violation-service.ts` ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ trong lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºc chuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i. ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â nh compatibility export sau Pilot.

---

# PASS A - NÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u, cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥u hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng, phiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m

## Task 1: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o domain KPI chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©c

**Files:**
- Create: `src/lib/kpi/types.ts`
- Create: `src/lib/kpi/default-policy.ts`
- Test: `src/lib/kpi/default-policy.test.ts`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â cho policy mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh**

```ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

// @ts-expect-error Node test runner imports TypeScript files by explicit extension.
const { DEFAULT_KPI_POLICY } = await import('./default-policy.ts')

describe('DEFAULT_KPI_POLICY', () => {
  it('uses the approved career levels and a 1-5 KPI scale', () => {
    assert.deepEqual(DEFAULT_KPI_POLICY.levels, ['pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader'])
    assert.deepEqual(DEFAULT_KPI_POLICY.score_scale, [1, 2, 3, 4, 5])
    assert.equal(DEFAULT_KPI_POLICY.monthly_appeal_hours, 48)
    assert.equal(DEFAULT_KPI_POLICY.people_decision_appeal_business_days, 3)
  })
})
```

- [x] **Step 2: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ang ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

Run: `node --experimental-strip-types --test src/lib/kpi/default-policy.test.ts`
Expected: FAIL vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ `default-policy.ts` chÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œn tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i.

- [x] **Step 3: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c type canonical**

`src/lib/kpi/types.ts` phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh nghÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚Â©a tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢u:

```ts
export type KpiLevelCode = 'pt1_tn' | 'pt1_pc' | 'pt2' | 'senior' | 'shift_leader'
export type KpiGroupTag = 'revenue' | 'customer_service' | 'operations' | 'discipline' | 'custom'
export type KpiScoringMode = 'automatic' | 'leader' | 'combined'
export type KpiScoreValue = 1 | 2 | 3 | 4 | 5
export type KpiSetStatus = 'draft' | 'published' | 'archived'
export type KpiPeriodStatus =
  | 'draft' | 'collecting' | 'leader_scoring' | 'ceo_preapproval'
  | 'published' | 'appeal_window' | 'locked'

export interface KpiScoreBand {
  min: number
  max: number | null
  score: KpiScoreValue
}

export interface KpiCriterionDefinition {
  id: string
  group_id: string
  name: string
  description: string
  scoring_mode: KpiScoringMode
  weight: number
  source_key?: string
  score_bands: KpiScoreBand[]
  evidence_required_below?: KpiScoreValue
  adjustment_reason_required: boolean
  applies_when?: { min_hours?: number; position_ids?: string[] }
  sort_order: number
  active: boolean
}

export interface KpiGroupDefinition {
  id: string
  name: string
  tag: KpiGroupTag
  weight: number
  promotion_core: boolean
  sort_order: number
  criteria: KpiCriterionDefinition[]
}

export interface KpiSetVersion {
  id: string
  set_id: string
  version: number
  name: string
  status: KpiSetStatus
  level_codes: KpiLevelCode[]
  store_ids: string[] | 'all'
  effective_from: string
  effective_to?: string
  score_scale: KpiScoreValue[]
  groups: KpiGroupDefinition[]
  created_by: string
  created_at: string
  published_by?: string
  published_at?: string
}

export type KpiSetSnapshot = Omit<KpiSetVersion, 'status'> & { source_status: 'published' }

export interface KpiActor {
  id: string
  role: 'employee' | 'shift_leader' | 'store_manager' | 'area_manager' | 'hr_admin' | 'ceo'
  store_id?: string
}

export interface KpiEmployeeRef {
  id: string
  store_id: string
  level_code: KpiLevelCode
  position_id: string
  employment_status: 'probation' | 'official'
}

export interface KpiCriterionScore {
  criterion_id: string
  suggested_score?: number
  final_score?: number
  source_refs: string[]
  adjustment_reason?: string
  evidence_refs: string[]
}

export interface KpiEvaluation {
  id: string
  period_id: string
  employee: KpiEmployeeRef
  snapshot: KpiSetSnapshot
  scores: KpiCriterionScore[]
  total_score?: number
  grade_code?: string
  status: 'draft' | 'submitted' | 'returned' | 'preapproved' | 'published' | 'locked'
  revision: number
}

export interface KpiPeriod {
  id: string
  org_id: string
  store_id: string
  month: string
  status: KpiPeriodStatus
  snapshot: KpiSetSnapshot
  employee_ids: string[]
  opened_by: string
  opened_at: string
  published_at?: string
  locked_at?: string
  revision: number
}

export interface KpiIncidentViolation {
  code: string
  primary: boolean
  independent_behavior: boolean
  reason: string
  evidence_refs: string[]
}

export interface KpiIncident {
  id: string
  store_id: string
  employee_id: string
  period_id?: string
  occurred_at: string
  source: 'attendance' | 'food_app' | 'customer' | 'operation' | 'other'
  status: 'proposed' | 'confirmed' | 'acknowledged' | 'appealed' | 'finalized' | 'cancelled'
  violations: KpiIncidentViolation[]
  description: string
  evidence_refs: string[]
}

export interface KpiAppeal {
  id: string
  type: 'monthly_kpi' | 'incident' | 'people_decision'
  employee_id: string
  reference_id: string
  reason: string
  evidence_refs: string[]
  status: 'submitted' | 'reviewing' | 'approved' | 'partially_approved' | 'rejected'
  submitted_at: string
  deadline_at: string
}

export interface KpiDevelopmentCase {
  id: string
  employee_id: string
  current_level: KpiLevelCode
  target_level: KpiLevelCode
  status: 'detected' | 'leader_proposed' | 'testing' | 'challenge' | 'approved' | 'deferred' | 'rejected'
}

export interface KpiReopenRequest {
  id: string
  period_id: string
  requested_by: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface KpiAuditLog {
  id: string
  entity_type: string
  entity_id: string
  action: string
  actor_id: string
  old_value?: unknown
  new_value?: unknown
  reason?: string
  created_at: string
}
```

- [x] **Step 4: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o policy mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng spec**

`src/lib/kpi/default-policy.ts` export `DEFAULT_KPI_POLICY`, 4 nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³m chuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â©n, ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¡ng 80 giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â, hai cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c tuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n PT1 -> PT2 -> Senior -> Shift Leader. KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a Store Manager vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â o danh sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥p.

- [x] **Step 5: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  typecheck**

Run: `node --experimental-strip-types --test src/lib/kpi/default-policy.test.ts`
Expected: PASS.

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: exit 0 hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²n lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c ghi sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Âµn; khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« `src/lib/kpi/*`.

- [x] **Step 6: Commit**

```powershell
git add src/lib/kpi/types.ts src/lib/kpi/default-policy.ts src/lib/kpi/default-policy.test.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add canonical KPI domain"
```

## Task 2: XÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢y bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m thuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n

**Files:**
- Create: `src/lib/kpi/scoring-engine.ts`
- Test: `src/lib/kpi/scoring-engine.test.ts`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â cho quy ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“**

```ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

// @ts-expect-error Node test runner imports TypeScript files by explicit extension.
const { mapMetricToScore, calculateWeightedScore } = await import('./scoring-engine.ts')

describe('KPI scoring engine', () => {
  it('maps a metric to the configured 1-5 score band', () => {
    const bands = [
      { min: 0, max: 79.99, score: 1 },
      { min: 80, max: 89.99, score: 3 },
      { min: 90, max: null, score: 5 },
    ]
    assert.equal(mapMetricToScore(93, bands), 5)
  })

  it('returns a 1-5 weighted total', () => {
    assert.equal(calculateWeightedScore([
      { score: 4, weight: 20 },
      { score: 3.5, weight: 30 },
      { score: 4.5, weight: 50 },
    ]), 4)
  })
})
```

- [x] **Step 2: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

Run: `node --experimental-strip-types --test src/lib/kpi/scoring-engine.test.ts`
Expected: FAIL vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ module chÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œn tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i.

- [x] **Step 3: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t implementation tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢u**

```ts
import type { KpiScoreBand } from './types'

export function mapMetricToScore(value: number, bands: KpiScoreBand[]): number {
  const band = bands.find(item => value >= item.min && (item.max === null || value <= item.max))
  if (!band) throw new Error(`KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©c quy ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i cho giÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ ${value}`)
  return band.score
}

export function calculateWeightedScore(items: Array<{ score: number; weight: number }>): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight !== 100) throw new Error(`TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng 100%, hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i ${totalWeight}%`)
  return Math.round(items.reduce((sum, item) => sum + item.score * item.weight / 100, 0) * 100) / 100
}
```

- [x] **Step 4: BÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ sung test cho dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u, ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¡ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng nhau vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng khi ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âu chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°nh**

ThÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªm test cho `calculateEvaluation`, `requiresAdjustmentReason`, `requiresEvidence` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£o ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£m ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng vÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£t `1-5`.

- [x] **Step 5: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test xanh**

Run: `node --experimental-strip-types --test src/lib/kpi/scoring-engine.test.ts`
Expected: tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ test PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/kpi/scoring-engine.ts src/lib/kpi/scoring-engine.test.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add 1-5 scoring engine"
```

## Task 3: Validate bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ KPI vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ng bÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng phiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n

**Files:**
- Create: `src/lib/kpi/configuration-service.ts`
- Test: `src/lib/kpi/configuration-service.test.ts`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

Test cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c rule: tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³m `100%`, tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ trong nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³m bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³m, tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ `source_key` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  score bands, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i tÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£ng/thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi gian, bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n published khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p.

```ts
assert.deepEqual(validateKpiSet(invalidSet).map((item: { code: string }) => item.code), [
  'GROUP_WEIGHT_TOTAL',
  'MISSING_AUTO_SOURCE',
])
```

- [x] **Step 2: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

Run: `node --experimental-strip-types --test src/lib/kpi/configuration-service.test.ts`
Expected: FAIL vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ service chÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œn tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i.

- [x] **Step 3: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o API service**

```ts
export type KpiValidationCode =
  | 'GROUP_WEIGHT_TOTAL' | 'CRITERION_WEIGHT_TOTAL' | 'MISSING_AUTO_SOURCE'
  | 'MISSING_GUIDE' | 'MISSING_EVALUATOR' | 'EFFECTIVE_RANGE_OVERLAP'

export interface KpiValidationIssue {
  code: KpiValidationCode
  path: string
  message: string
}

export function validateKpiSet(version: KpiSetVersion): KpiValidationIssue[]
export function cloneAsNextDraft(version: KpiSetVersion, actorId: string, at: string): KpiSetVersion
export function publishVersion(version: KpiSetVersion, actorId: string, at: string): KpiSetVersion
export function createPeriodSnapshot(version: KpiSetVersion): KpiSetSnapshot
```

`publishVersion` phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i throw nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u validation cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²n lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi. `createPeriodSnapshot` phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i deep clone ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a draft sau ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â m ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i snapshot.

- [x] **Step 4: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test xanh**

Run: `node --experimental-strip-types --test src/lib/kpi/configuration-service.test.ts`
Expected: PASS, gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œm test chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng minh snapshot khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i sau khi source object bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ mutate.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/kpi/configuration-service.ts src/lib/kpi/configuration-service.test.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add configuration versioning"
```

## Task 4: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o local repository cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ revision vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  audit

**Files:**
- Create: `src/lib/kpi/repository.ts`
- Create: `src/lib/kpi/local-repository.ts`
- Test: `src/lib/kpi/local-repository.test.ts`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â cho optimistic concurrency**

```ts
const first = await repo.load()
await repo.save({ ...first, revision: first.revision + 1 }, first.revision)
await assert.rejects(
  repo.save({ ...first, revision: first.revision + 1 }, first.revision),
  /DÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­t/
)
```

- [x] **Step 2: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

Run: `node --experimental-strip-types --test src/lib/kpi/local-repository.test.ts`
Expected: FAIL.

- [x] **Step 3: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o repository contract**

```ts
export interface KpiDatabase {
  schema_version: 1
  revision: number
  sets: KpiSetVersion[]
  periods: KpiPeriod[]
  evaluations: KpiEvaluation[]
  incidents: KpiIncident[]
  appeals: KpiAppeal[]
  development_cases: KpiDevelopmentCase[]
  audit_logs: KpiAuditLog[]
}

export interface KpiRepository {
  load(): Promise<KpiDatabase>
  save(next: KpiDatabase, expectedRevision: number): Promise<KpiDatabase>
  reset(seed: KpiDatabase): Promise<void>
}
```

- [x] **Step 4: Implement localStorage vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  memory fallback**

DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng key `homies_kpi_saas_v1`; khi `window` khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œn tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i, dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng memory store ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ test. Parse lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ seed sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ch vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ghi warning, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng crash UI.

- [x] **Step 5: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test xanh**

Run: `node --experimental-strip-types --test src/lib/kpi/local-repository.test.ts`
Expected: PASS cho load/save, parse lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi, revision conflict vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  reset.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/kpi/repository.ts src/lib/kpi/local-repository.ts src/lib/kpi/local-repository.test.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add versioned local repository"
```

## Task 5: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân KPI thuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n

**Files:**
- Create: `src/lib/kpi/permissions.ts`
- Test: `src/lib/kpi/permissions.test.ts`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t matrix test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

```ts
assert.equal(canKpi('employee', 'view_self'), true)
assert.equal(canKpi('employee', 'configure'), false)
assert.equal(canKpi('shift_leader', 'score_store'), true)
assert.equal(canKpi('hr_admin', 'configure'), true)
assert.equal(canKpi('hr_admin', 'decide_salary'), false)
assert.equal(canKpi('ceo', 'lock_period'), true)
```

- [x] **Step 2: Implement permission map**

Bao phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§ `employee`, `shift_leader`, `store_manager`, `area_manager`, `hr_admin`, `ceo`. Store Manager cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân xem/giÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡m sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡t cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng nhÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ng khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng thay CEO quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ng, mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh thÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n.

- [x] **Step 3: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --experimental-strip-types --test src/lib/kpi/permissions.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/permissions.ts src/lib/kpi/permissions.test.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add role permission matrix"
```

## Task 6: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o seed vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  facade dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng chung

**Files:**
- Create: `src/lib/kpi/seed.ts`
- Create: `src/lib/kpi/index.ts`
- Create: `src/lib/adapters/kpi-adapter.ts`

- [x] **Step 1: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o seed ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng policy**

Seed gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œm mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t KPI set published, mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t draft version, mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â«u, dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u PT1/PT2/Senior/Shift Leader vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©a L0-L5. DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng icon key dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ng chuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi nghiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡p vÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng emoji.

- [x] **Step 2: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o adapter local-first**

```ts
import { LocalKpiRepository } from '@/lib/kpi/local-repository'
import { buildKpiSeed } from '@/lib/kpi/seed'

const localRepository = new LocalKpiRepository(buildKpiSeed())

export const kpiAdapter = {
  repository: localRepository,
  async getDatabase() {
    return localRepository.load()
  },
}
```

KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng `repositoryConfig.useRealSupabase` cho KPI trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc Pass E ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡nh gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng chÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œn tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i.

- [x] **Step 3: Export API ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh**

`src/lib/kpi/index.ts` chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° export type, engine vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  service cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng khai; UI khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng import trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« seed hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c local repository.

- [x] **Step 4: Typecheck vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« KPI.

```powershell
git add src/lib/kpi/seed.ts src/lib/kpi/index.ts src/lib/adapters/kpi-adapter.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add local-first KPI facade"
```

## Task 7: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o shell KPI Builder

**Files:**
- Create: `src/components/kpi/builder/KPIBuilderShell.tsx`
- Create: `src/components/kpi/builder/KPISetList.tsx`
- Create: `src/components/kpi/builder/KPIBuilderSummary.tsx`

- [x] **Step 1: KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a component contract**

```ts
export interface KPIBuilderShellProps {
  versions: KpiSetVersion[]
  selectedVersionId: string
  validationIssues: KpiValidationIssue[]
  onSelectVersion(id: string): void
  onCreateSet(): void
  onCloneVersion(): void
  onPublish(): void
}
```

- [x] **Step 2: XÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢y layout 3 cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t desktop vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  1 cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t mobile**

CÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡i lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  danh sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ KPI; cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯a lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥u trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºc nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³m/tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­; cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡m vi ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡p dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  checklist. DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân, typography, button hierarchy, Lucide vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  kÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ch thÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc theo `DESIGN_RULE_HOMIES_FINAL.md`.

- [x] **Step 3: ThÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªm empty/loading state**

KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng text mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh nÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i trong UI. Empty state chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu chÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ KPI vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  CTA `TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ KPI`.

- [x] **Step 4: Lint riÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªng component**

Run: `npm run lint -- src/components/kpi/builder/KPIBuilderShell.tsx src/components/kpi/builder/KPISetList.tsx src/components/kpi/builder/KPIBuilderSummary.tsx`
Expected: exit 0.

- [ ] **Step 5: Commit**

```powershell
git add src/components/kpi/builder docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add KPI builder shell"
```

## Task 8: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o editor nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³m vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­

**Files:**
- Create: `src/components/kpi/builder/KPIGroupEditor.tsx`
- Create: `src/components/kpi/builder/KPICriterionDrawer.tsx`
- Create: `src/components/kpi/builder/KPIClassificationEditor.tsx`

- [x] **Step 1: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o form state rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµ kiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢u**

Form tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn, mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£, trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“, cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m, source key, score bands, ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âu kiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡p dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  rule bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng. NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºt lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°u disabled khi local validation lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi.

- [x] **Step 2: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o score band editor**

MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi band cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ `min`, `max`, `score 1-5`; cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o ngay khi khoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œng hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ng. KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cho nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p score ngoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i 1-5.

- [x] **Step 3: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o xÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p loÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ phiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n**

Cho Admin cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥u hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh khoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m xÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p loÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i, cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â o tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â u semantic. CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c khoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œng hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸. CÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â· luÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­t. `KPIBuilderSummary.tsx` hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« `validateKpiSet`; nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºt `CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ phiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n` chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­t khi khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²n lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi.

- [x] **Step 4: Lint vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `npm run lint -- src/components/kpi/builder/KPIGroupEditor.tsx src/components/kpi/builder/KPICriterionDrawer.tsx src/components/kpi/builder/KPIClassificationEditor.tsx`
Expected: exit 0.

```powershell
git add src/components/kpi/builder docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add criteria and publish editors"
```

## Task 9: NÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i KPI Builder vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â o route settings

**Files:**
- Modify: `src/app/kpi/settings/page.tsx`
- Modify: `src/lib/navigation/sidebar-config.ts`
- Modify: `docs/CODEMAP.md`

- [x] **Step 1: Thay page 938 dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng page orchestration mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng**

Page giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ `'use client'`, auth hydration vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  role guard; state nghiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡p vÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âc/ghi qua `kpiAdapter` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  configuration service. KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng import `mockKPICategories`, `mockLevelConfigs` hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c `kpi-settings-service`.

- [x] **Step 2: GiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·t chuyÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u ngoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i dashboard**

Sidebar vÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â«n dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â«n `/kpi/settings`; trang builder cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ Executive Header, 4 cards: bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ang ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡p dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥ng, bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡p, lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥u hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh, kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng phiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i.

- [x] **Step 3: CÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­t CODEMAP**

Ghi file mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi `src/lib/kpi/*`, `src/components/kpi/builder/*` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ KPI Builder local-first.

- [ ] **Step 4: Verify Pass A**

Run: `node --import tsx --test src/lib/kpi/*.test.ts`
Expected: tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ test KPI PASS.

Run: `npm run lint -- src/lib/kpi src/components/kpi/builder src/app/kpi/settings/page.tsx src/lib/adapters/kpi-adapter.ts`
Expected: exit 0.

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi.

Run app: `npm run dev` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ `http://localhost:3535/kpi/settings`.
Expected desktop/mobile: khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n, tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµ, tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o/nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n/cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y qua localStorage, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ emoji.

- [ ] **Step 5: Commit checkpoint Pass A**

```powershell
git add src/app/kpi/settings/page.tsx src/lib/navigation/sidebar-config.ts docs/CODEMAP.md docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): complete dynamic KPI builder"
```

---

# PASS B - KÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ KPI, workspace Leader, CEO duyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn

## Task 10: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o period service vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  state machine

**Files:**
- Create: `src/lib/kpi/period-service.ts`
- Test: `src/lib/kpi/period-service.test.ts`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â cho state transition**

Test `draft -> collecting -> leader_scoring -> ceo_preapproval -> published -> appeal_window -> locked`; mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi bÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£y sai phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i throw. Test mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥p snapshot vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p.

- [x] **Step 2: Implement API**

```ts
export interface CreateKpiPeriodInput {
  org_id: string
  store_id: string
  month: string
  employee_ids: string[]
  opened_by: string
  opened_at: string
}

export function createKpiPeriod(input: CreateKpiPeriodInput, version: KpiSetVersion): KpiPeriod
export function transitionPeriod(period: KpiPeriod, next: KpiPeriodStatus, actor: KpiActor, reason?: string): KpiPeriod
export function requestPeriodReopen(period: KpiPeriod, actor: KpiActor, reason: string): KpiReopenRequest
export function approvePeriodReopen(period: KpiPeriod, request: KpiReopenRequest, ceo: KpiActor): KpiPeriod
```

- [x] **Step 3: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --experimental-strip-types --test src/lib/kpi/period-service.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/period-service.ts src/lib/kpi/period-service.test.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add monthly period workflow"
```

## Task 11: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o source service cho HRM, POS vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u

**Files:**
- Create: `src/lib/kpi/source-service.ts`
- Test: `src/lib/kpi/source-service.test.ts`
- Modify: `src/lib/adapters/kpi-adapter.ts`

- [ ] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

Test giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â m tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« attendance, POS nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p tay cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n, dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ng thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡i `missing` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± quy thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â nh ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥p.

- [ ] **Step 2: Implement source contract**

```ts
export interface KpiSourceDatum {
  key: string
  status: 'ready' | 'missing' | 'proposed' | 'confirmed'
  value?: number
  source_label: string
  captured_at: string
  captured_by?: string
  evidence_refs: string[]
}
```

TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o `collectEmployeeSources(employeeId, period, snapshot)` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  `confirmManualPosSource(...)`.

- [ ] **Step 3: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/source-service.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/source-service.ts src/lib/kpi/source-service.test.ts src/lib/adapters/kpi-adapter.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add KPI source collection"
```

## Task 12: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ KPI

**Files:**
- Create: `src/app/kpi/periods/page.tsx`
- Create: `src/components/kpi/periods/KPIPeriodTable.tsx`
- Create: `src/components/kpi/periods/KPICreatePeriodDrawer.tsx`

- [ ] **Step 1: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o route client orchestration**

Auth: Admin/HR chuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â©n bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹; CEO khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a/mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i. Header cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng, thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng, trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ng thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡i vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  CTA theo quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân.

- [ ] **Step 2: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³**

MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng, cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng, phiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n KPI, sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn, dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u, tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m, khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ng thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡i. Click cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ drawer chi tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t.

- [ ] **Step 3: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o drawer mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³**

ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng, cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng, published KPI version vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn. ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·n kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c version khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c.

- [ ] **Step 4: Verify UI vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `npm run lint -- src/app/kpi/periods/page.tsx src/components/kpi/periods`
Expected: exit 0.

```powershell
git add src/app/kpi/periods src/components/kpi/periods docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add period management UI"
```

## Task 13: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o service chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  autosave

**Files:**
- Create: `src/lib/kpi/evaluation-service.ts`
- Test: `src/lib/kpi/evaluation-service.test.ts`

- [ ] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

Test tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o phiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« snapshot, hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â xuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t, Leader chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°nh bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¯t buÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢c lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ do, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m dÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¡ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¯t buÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢c bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng, autosave dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng revision vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cho submit khi thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­.

- [ ] **Step 2: Implement API**

```ts
export interface LeaderScoreInput {
  criterion_id: string
  score: number
  adjustment_reason?: string
  evidence_refs: string[]
}

export interface KpiSubmissionIssue {
  code: 'MISSING_SCORE' | 'MISSING_SOURCE' | 'MISSING_REASON' | 'MISSING_EVIDENCE'
  criterion_id: string
  message: string
}

export function createEvaluationFromPeriod(period: KpiPeriod, employee: KpiEmployeeRef): KpiEvaluation
export function applySuggestedScores(evaluation: KpiEvaluation, sources: KpiSourceDatum[]): KpiEvaluation
export function updateLeaderScore(evaluation: KpiEvaluation, input: LeaderScoreInput): KpiEvaluation
export function validateEvaluationSubmission(evaluation: KpiEvaluation): KpiSubmissionIssue[]
export function submitEvaluation(evaluation: KpiEvaluation, actor: KpiActor): KpiEvaluation
```

- [ ] **Step 3: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/evaluation-service.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/evaluation-service.ts src/lib/kpi/evaluation-service.test.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add leader evaluation workflow"
```

## Task 14: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o workspace chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§a Shift Leader

**Files:**
- Create: `src/components/kpi/workspace/KPIScoringWorkspace.tsx`
- Create: `src/components/kpi/workspace/KPISourcePanel.tsx`
- Modify: `src/app/kpi/review/page.tsx`

- [ ] **Step 1: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o workspace contract**

Workspace nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n evaluation, employee, sources vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  callback autosave/submit. BÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­, trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“, gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£i ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“t, trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ng thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡i bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng.

- [ ] **Step 2: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o panel dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u tham chiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u**

HiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£p lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡, POS, lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi thÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng/nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·ng/liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u. MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ `DataSourceStatusBadge`.

- [ ] **Step 3: NÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i route `/kpi/review`**

Danh sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡i hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn mobile; phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­m trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc/sau; cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o revision conflict; banner trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ng thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡i autosave.

- [ ] **Step 4: Verify vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `npm run lint -- src/components/kpi/workspace src/app/kpi/review/page.tsx`
Expected: exit 0.

```powershell
git add src/components/kpi/workspace src/app/kpi/review/page.tsx docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add leader scoring workspace"
```

## Task 15: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o CEO preapproval, publish, lock vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  reopen

**Files:**
- Create: `src/components/kpi/workspace/KPIApprovalQueue.tsx`
- Create: `src/components/kpi/workspace/KPIReopenDialog.tsx`
- Modify: `src/app/kpi/periods/page.tsx`

- [ ] **Step 1: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£i ngoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡**

PhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³m `hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ch`, `ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âu chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°nh lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºn`, `thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng`, `vi phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡m nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·ng`, `dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u`. Batch approve chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡p dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥ng hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡ch.

- [ ] **Step 2: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o action CEO**

CEO ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c duyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t, trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ do, cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  duyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i. MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi action tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o audit log.

- [ ] **Step 3: Verify quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân**

ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p `shift_leader`: khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºt lock/reopen. ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p `ceo`: thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng action. DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ desktop vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  mobile.

- [ ] **Step 4: Commit**

```powershell
git add src/components/kpi/workspace/KPIApprovalQueue.tsx src/components/kpi/workspace/KPIReopenDialog.tsx src/app/kpi/periods/page.tsx docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add CEO KPI approval controls"
```

## Task 16: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i KPI 48 giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â

**Files:**
- Create: `src/lib/kpi/appeal-service.ts`
- Test: `src/lib/kpi/appeal-service.test.ts`
- Modify: `src/app/kpi/result/page.tsx`

- [ ] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â cho deadline**

Test gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­i ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â 47:59 ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n, giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â 48:01 bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·n; chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§ hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­i; appeal phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ do vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­t nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t criterion/data reference.

- [ ] **Step 2: Implement appeal service**

```ts
export interface CreateKpiAppealInput {
  employee_id: string
  evaluation_id: string
  reason: string
  evidence_refs: string[]
  criterion_ids: string[]
  submitted_at: string
  published_at: string
}

export interface KpiAppealDecision {
  result: 'approved' | 'partially_approved' | 'rejected'
  note: string
  score_changes: Array<{ criterion_id: string; old_score: number; new_score: number }>
}

export function getMonthlyAppealDeadline(publishedAt: string): string
export function canSubmitMonthlyAppeal(now: string, publishedAt: string): boolean
export function createMonthlyAppeal(input: CreateKpiAppealInput): KpiAppeal
export function decideAppeal(appeal: KpiAppeal, decision: KpiAppealDecision, ceo: KpiActor): KpiAppeal
```

- [ ] **Step 3: ChuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n `/kpi/result` sang dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u canonical**

HiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n 4 cards, breakdown theo nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³m, nguÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œn, lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ do ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âu chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°nh, mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥c cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n, lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ch sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­ 3 kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  countdown khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i. KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c.

- [ ] **Step 4: Test, lint vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/appeal-service.test.ts`
Expected: PASS.

Run: `npm run lint -- src/lib/kpi/appeal-service.ts src/app/kpi/result/page.tsx`
Expected: exit 0.

```powershell
git add src/lib/kpi/appeal-service.ts src/lib/kpi/appeal-service.test.ts src/app/kpi/result/page.tsx docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add employee KPI results and appeals"
```

## Task 17: ChuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n dashboard KPI vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  route legacy

**Files:**
- Modify: `src/app/kpi/page.tsx`
- Modify: `next.config.ts`
- Modify: `docs/CODEMAP.md`

- [x] **Step 1: BÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â fallback ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ trong dashboard**

KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²n `evaluation?.total_score || 85`, level `L2` hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m category hard-code. MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi card lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« canonical services; dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n `ChÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u`.

- [x] **Step 2: ChuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â©n hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a viÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡c cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â m theo role**

Employee thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§a mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh; Leader thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y phiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u chÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“; Admin thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u/config; CEO thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y duyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t, khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ thÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n.

- [x] **Step 3: Redirect route cÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â©**

Sau khi xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n route mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng: `/kpi/evaluate -> /kpi/result`, `/kpi/leaderboard -> /kpi/reports?view=leaderboard`. ChÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a redirect `/kpi/evaluate/trial` ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n khi Pass D hoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â nh.

- [x] **Step 4: Verify Pass B**

Run: `node --import tsx --test src/lib/kpi/*.test.ts`
Expected: tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ PASS.

Run: `npm run lint -- src/lib/kpi src/app/kpi src/components/kpi`
Expected: exit 0 hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° ra chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi legacy khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng thuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢c file ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i.

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi.

Browser: chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o -> chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m -> CEO duyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t -> cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ -> employee xem -> khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a.
Expected: khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng Excel ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ hoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t luÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œng.

- [ ] **Step 5: Commit checkpoint Pass B**

```powershell
git add src/app/kpi/page.tsx next.config.ts docs/CODEMAP.md docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): complete monthly KPI workflow"
```

---

# PASS C - SÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“, vi phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡m, bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng, khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ng phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng

## Task 18: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o incident service vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  root-cause rule

**Files:**
- Create: `src/lib/kpi/incident-service.ts`
- Test: `src/lib/kpi/incident-service.test.ts`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ng phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng**

Test mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t incident chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t `primary_violation_code`; secondary phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ `independent_behavior`, evidence riÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  reason. Complaint lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­u quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ sai topping bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â nh vi ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢c lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p.

- [x] **Step 2: Implement API**

```ts
export interface CreateIncidentInput {
  store_id: string
  employee_id: string
  occurred_at: string
  source: KpiIncident['source']
  primary_violation_code: string
  description: string
  evidence_refs: string[]
}

export interface SecondaryViolationInput {
  code: string
  independent_behavior: boolean
  reason: string
  evidence_refs: string[]
}

export interface AttendanceIncidentInput {
  store_id: string
  employee_id: string
  occurred_at: string
  attendance_reference_id: string
  minutes_late: number
}

export interface KpiIncidentPolicy {
  criterion_mappings: Record<string, string>
  manager_accountability_allowed_codes: string[]
}

export interface KpiIncidentImpact {
  criterion_id?: string
  suggested_score?: number
  promotion_block_months: number
  manager_accountability_proposed: boolean
}

export function createIncident(input: CreateIncidentInput, actor: KpiActor): KpiIncident
export function addSecondaryViolation(incident: KpiIncident, input: SecondaryViolationInput): KpiIncident
export function proposeAttendanceIncident(input: AttendanceIncidentInput): KpiIncident
export function confirmAttendanceIncident(incident: KpiIncident, leader: KpiActor, note: string): KpiIncident
export function calculateIncidentImpact(incident: KpiIncident, policy: KpiIncidentPolicy): KpiIncidentImpact
```

- [x] **Step 3: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/incident-service.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/incident-service.ts src/lib/kpi/incident-service.test.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add incident root-cause rules"
```

## Task 19: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o UI hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“

**Files:**
- Create: `src/components/kpi/incidents/KPIIncidentDrawer.tsx`
- Create: `src/components/kpi/incidents/KPIIncidentTable.tsx`
- Modify: `src/app/kpi/violations/page.tsx`

- [x] **Step 1: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o form hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡**

Form gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œm thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi gian, cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng/ca, nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn, nguÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œn, nguyÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n, lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“c, mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£, evidence, tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  liÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi Leader. Secondary violation nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±m trong action riÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ng trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng.

- [x] **Step 2: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  modal chi tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t**

Click cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ drawer. Footer bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ang chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ang khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·ng/liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t.

- [x] **Step 3: NÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i route canonical**

KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng import `mockViolationRecords` hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c `violation-service.ts`. TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡m giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c page batch/store cÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â© nhÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ng link chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i vÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â canonical route.

- [x] **Step 4: Lint vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `npm run lint -- src/components/kpi/incidents src/app/kpi/violations/page.tsx`
Expected: exit 0.

```powershell
git add src/components/kpi/incidents src/app/kpi/violations/page.tsx docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add incident case workspace"
```

## Task 20: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n, khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh incident

**Files:**
- Create: `src/components/kpi/incidents/KPIIncidentAppealQueue.tsx`
- Modify: `src/app/kpi/violations/appeals/page.tsx`
- Modify: `src/lib/kpi/appeal-service.ts`

- [x] **Step 1: MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ rÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng appeal service**

ThÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªm `createIncidentAppeal` dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng deadline 48 giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  `decideIncidentAppeal` vÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n loÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§y.

- [x] **Step 2: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o queue CEO**

MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi item hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n incident, bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng hai bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn, deadline, tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng KPI/kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â· luÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­t/thÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  audit. Decision bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¯t buÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢c note.

- [x] **Step 3: KiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m tra liÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi Leader**

KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o impact Leader mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh. ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° cho phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©p nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u incident policy cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ `manager_accountability_allowed`, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng ca vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ reason/evidence.

- [x] **Step 4: Test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/appeal-service.test.ts src/lib/kpi/incident-service.test.ts`
Expected: PASS.

```powershell
git add src/components/kpi/incidents/KPIIncidentAppealQueue.tsx src/app/kpi/violations/appeals/page.tsx src/lib/kpi/appeal-service.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add incident appeals"
```

## Task 21: NÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i incident vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â o ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  verify Pass C

**Files:**
- Modify: `src/lib/kpi/source-service.ts`
- Modify: `src/lib/kpi/evaluation-service.ts`
- Modify: `src/app/kpi/violations/settings/page.tsx`
- Modify: `docs/CODEMAP.md`

- [x] **Step 1: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y incident ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“t**

Source service bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â qua hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ proposed/appealed; mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t incident chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t impact gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“c vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c secondary hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£p lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡.

- [x] **Step 2: KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m ngoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥u hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh**

Incident chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o source datum/gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£i ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ cho criterion cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ mapping. ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚ÂiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m cuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i vÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â«n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i qua score bands vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  Leader xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n.

- [x] **Step 3: ChuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n trang cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥u hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ sang policy mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi**

Admin cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥u hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi, mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©c ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢, yÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§u evidence, khÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ nÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng liÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½, criterion mapping vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi gian chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·n thÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n. Published policy khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p; thay ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o version mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi.

- [ ] **Step 4: Verify Pass C**

Run: `node --import tsx --test src/lib/kpi/*.test.ts`
Expected: PASS.

Browser: tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o sai topping + complaint hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­u quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£.
Expected: hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ng cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng; chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° cho lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â© hai khi thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªm hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â nh vi ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢c lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  evidence riÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªng.

- [ ] **Step 5: Commit checkpoint**

```powershell
git add src/lib/kpi/source-service.ts src/lib/kpi/evaluation-service.ts src/app/kpi/violations/settings/page.tsx docs/CODEMAP.md docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): integrate incidents into monthly scores"
```

---

# PASS D - ThÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n, test, thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­ thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch, khung lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ngoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡

## Task 22: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o promotion policy engine

**Files:**
- Create: `src/lib/kpi/development-service.ts`
- Test: `src/lib/kpi/development-service.test.ts`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â cho ba tuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n**

Test PT1 -> PT2, PT2 -> Senior, Senior -> Shift Leader vÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng, KPI bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh quÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n, sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n, nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³m trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng yÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u, 80 giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â, lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o.

- [x] **Step 2: Implement eligibility result giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ch ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c**

```ts
export interface PromotionEligibilityInput {
  employee: KpiEmployeeRef
  target_level: KpiLevelCode
  months_in_level: number
  monthly_scores: Array<{ month: string; total: number; core_average: number; valid_hours: number }>
  critical_incident_dates: string[]
  active_warning_dates: string[]
  now: string
}

export interface PromotionEligibilityResult {
  status: 'not_eligible' | 'eligible_for_test'
  checks: EligibilityCheck[]
}

export interface EligibilityCheck {
  code: string
  label: string
  passed: boolean
  actual: string
  required: string
  blocking: boolean
}

export function evaluatePromotionEligibility(input: PromotionEligibilityInput): PromotionEligibilityResult
```

KÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  `eligible_for_test`, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh thÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n.

- [ ] **Step 3: Test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/development-service.test.ts`
Expected: PASS cho mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi tuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£p bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·n.

```powershell
git add src/lib/kpi/development-service.ts src/lib/kpi/development-service.test.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add promotion eligibility engine"
```

## Task 23: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  test lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i

**Files:**
- Create: `src/lib/kpi/test-service.ts`
- Test: `src/lib/kpi/test-service.test.ts`
- Create: `src/app/kpi/development/tests/page.tsx`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

PT1/PT2 vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  PT2/Senior pass tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng `>=80` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â«ng phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n; Senior/Shift Leader pass tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng `>=85`; test lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“a mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  sau 2 hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c 4 tuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n theo mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©c thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥t.

- [x] **Step 2: Implement test service**

API gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œm `createTestSession`, `scoreTestSection`, `finalizeTest`, `scheduleRetest`. Finalize trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ `passed`, `failed_section_floor` hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c `failed_total`.

- [x] **Step 3: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o UI rubric**

Trang hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ queue ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â«ng phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n, sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n, tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng, ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m, evidence vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ch test lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i. KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cho nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p; tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« sections.

- [ ] **Step 4: Test, lint vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/test-service.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/test-service.ts src/lib/kpi/test-service.test.ts src/app/kpi/development/tests/page.tsx docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add promotion tests and retests"
```

## Task 24: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­ thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ nhiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡m

**Files:**
- Create: `src/lib/kpi/challenge-service.ts`
- Test: `src/lib/kpi/challenge-service.test.ts`
- Create: `src/app/kpi/development/challenges/page.tsx`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

Test thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£ng 1/2/2-3 thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng, check-in, gia hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n, vi phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡m nghiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªm trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âng dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â«ng ngay, fail quay vÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥p cÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â©.

- [x] **Step 2: Implement challenge state machine**

`approved -> active -> passed | extended_once | failed | stopped_for_serious_incident`.

- [x] **Step 3: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o UI timeline thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­ thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch**

HiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥c tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu, ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi theo dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµi, tuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n 2/4/cuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³, incident phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡t sinh vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  decision CEO.

- [ ] **Step 4: Test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/challenge-service.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/challenge-service.ts src/lib/kpi/challenge-service.test.ts src/app/kpi/development/challenges/page.tsx docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add promotion challenge workflow"
```

## Task 25: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o khung lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ngoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡

**Files:**
- Create: `src/lib/kpi/salary-service.ts`
- Test: `src/lib/kpi/salary-service.test.ts`
- Modify: `src/app/kpi/settings/page.tsx`

- [ ] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â**

Test ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â xuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng max(sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥p mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi, lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ng hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i + mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©c tÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng), khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng vÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£t trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n; tÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng trong cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥p khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng vÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£t trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n; ngoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¯t buÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢c reason/evidence/expiry/CEO.

- [ ] **Step 2: Implement salary API**

```ts
export interface PromotionSalaryInput {
  current_hourly_rate: number
  target_band_min: number
  target_band_max: number
  promotion_increase_min: number
  promotion_increase_max: number
}

export interface InLevelRaiseInput {
  current_hourly_rate: number
  band_max: number
  increase_min: number
  increase_max: number
}

export interface SalarySuggestion {
  min: number
  max: number
  recommended: number
  capped: boolean
  explanation: string
}

export interface SalaryDecisionInput {
  employee_id: string
  development_case_id: string
  decided_rate: number
  effective_from: string
  reason: string
  exception?: { type: string; evidence_refs: string[]; expires_at: string }
}

export interface SalaryDecision extends SalaryDecisionInput {
  decided_by: string
  decided_at: string
}

export function suggestPromotionSalary(input: PromotionSalaryInput): SalarySuggestion
export function suggestInLevelRaise(input: InLevelRaiseInput): SalarySuggestion
export function approveSalaryDecision(input: SalaryDecisionInput, ceo: KpiActor): SalaryDecision
```

- [x] **Step 3: ThÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªm tab khung lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â o settings**

Khung cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ level, min/max, increase range vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c. Published band khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p; clone version mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi.

- [ ] **Step 4: Test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/salary-service.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/salary-service.ts src/lib/kpi/salary-service.test.ts src/app/kpi/settings/page.tsx docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add salary bands and exceptions"
```

## Task 26: ChuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n promotion hub vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  verify Pass D

**Files:**
- Modify: `src/app/kpi/promotion/page.tsx`
- Modify: `next.config.ts`
- Modify: `docs/CODEMAP.md`

- [x] **Step 1: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o pipeline 7 bÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc**

System detect -> Leader propose -> Test -> CEO approve challenge -> Challenge -> Final review -> Appointment/salary.

- [x] **Step 2: HiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n checklist ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âu kiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ch**

MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi rule cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ actual, required, pass/fail vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  blocking. KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t badge `ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âu kiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n` mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ do.

- [x] **Step 3: Redirect trial legacy**

Sau khi test `/kpi/development/challenges`, redirect `/kpi/evaluate/trial` sang route mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi.

- [ ] **Step 4: Verify Pass D**

Run: `node --import tsx --test src/lib/kpi/*.test.ts`
Expected: PASS.

Browser: chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ PT2 -> Senior tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â« phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡t hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n salary decision.
Expected: Leader chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â xuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t; CEO quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh; appeal quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ deadline 3 ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â m viÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡c.

- [ ] **Step 5: Commit checkpoint**

```powershell
git add src/app/kpi/promotion/page.tsx next.config.ts docs/CODEMAP.md docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): complete people development pipeline"
```

---

# PASS E - Supabase, RLS, chuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o

## Task 27: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o schema Supabase KPI

**Files:**
- Create: `supabase/migrations/20260821_kpi_saas_core.sql`
- Create: `supabase/seed_kpi_saas_pilot.sql`

- [x] **Step 1: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng theo 4 miÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân**

CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ng tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢u:

```text
kpi_sets
kpi_set_versions
kpi_periods
kpi_period_employees
kpi_evaluations
kpi_criterion_scores
kpi_source_data
kpi_incidents
kpi_incident_violations
kpi_appeals
kpi_development_cases
kpi_test_sessions
kpi_challenges
kpi_salary_bands
kpi_salary_decisions
kpi_audit_logs
```

- [x] **Step 2: ThÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªm constraint vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  index**

Unique kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ theo org/store/month, check score 1-5, status checks, foreign keys, index employee/period/status vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  JSONB snapshot version.

- [x] **Step 3: ThÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªm seed pilot**

Seed mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t published set, mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t period vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  policy PT1/PT2/Senior/Shift Leader; khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng seed L0-L5.

- [ ] **Step 4: Verify SQL**

ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y migration trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn Supabase local hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c project test.
Expected: tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o schema/seed khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i seed theo cÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿ idempotent.

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/20260821_kpi_saas_core.sql supabase/seed_kpi_saas_pilot.sql docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add Supabase KPI schema"
```

## Task 28: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o RLS ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng vai trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²

**Files:**
- Create: `supabase/migrations/20260821_kpi_saas_rls.sql`
- Create: `docs/KPI_RLS_TEST_MATRIX.md`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t matrix trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc**

Matrix phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ employee self-only, Leader store-only, Store/Area Manager scope, HR config, CEO all/final decisions vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  salary privacy.

- [x] **Step 2: Implement RLS**

Employee khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng select evaluation/salary cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§a ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c. Leader khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng update locked periods. HR khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh salary nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ CEO role. CEO cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân lock/reopen/decision.

- [ ] **Step 3: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y SQL impersonation tests**

Expected: tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â«ng dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²ng trong matrix cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng query allowed/denied.

- [ ] **Step 4: Commit**

```powershell
git add supabase/migrations/20260821_kpi_saas_rls.sql docs/KPI_RLS_TEST_MATRIX.md docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): enforce KPI row level security"
```

## Task 29: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o Supabase repository vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  switch cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ kiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m soÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡t

**Files:**
- Create: `src/lib/kpi/supabase-repository.ts`
- Test: `src/lib/kpi/supabase-repository.test.ts`
- Modify: `src/lib/adapters/kpi-adapter.ts`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t mapping tests**

Mock Supabase rows vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  test mapping snake_case -> canonical type, snapshot JSON, audit vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  revision conflict.

- [x] **Step 2: Implement repository**

Repository tuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n `KpiRepository`. KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng fallback ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢m thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§m sau write lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi; trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ UI giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ draft local vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o chÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢.

- [x] **Step 3: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o switch env**

ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng Supabase khi `NEXT_PUBLIC_KPI_REPOSITORY=supabase`; mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh `local`. KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng thay ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢i global adapter mode.

- [ ] **Step 4: Test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/supabase-repository.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/supabase-repository.ts src/lib/kpi/supabase-repository.test.ts src/lib/adapters/kpi-adapter.ts docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add Supabase KPI repository"
```

## Task 30: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥ chuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n

**Files:**
- Create: `src/lib/kpi/migration-service.ts`
- Test: `src/lib/kpi/migration-service.test.ts`
- Create: `src/app/kpi/settings/migration/page.tsx`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t test phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n loÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i legacy**

Legacy L0-L5 khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± map thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â nh official. Service trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ ba nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³m `auto_convertible`, `needs_mapping`, `rejected`; ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m 0-100 chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° chuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n khi cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ mapping rule ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c Admin xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n.

- [x] **Step 2: Implement dry-run**

Dry-run phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£n ghi, lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi mapping, dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  checksum. Import thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­t chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­t sau khi CEO/Admin xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n report.

- [x] **Step 3: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o UI migration**

UI cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ upload/ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âc local legacy, mapping cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥p, preview vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  import. KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u cÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â©.

- [ ] **Step 4: Test vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/migration-service.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/migration-service.ts src/lib/kpi/migration-service.test.ts src/app/kpi/settings/migration/page.tsx docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add reviewed legacy migration"
```

## Task 31: TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o report service vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  reports page

**Files:**
- Create: `src/lib/kpi/report-service.ts`
- Test: `src/lib/kpi/report-service.test.ts`
- Modify: `src/app/kpi/reports/page.tsx`

- [x] **Step 1: ViÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t aggregation tests**

Test xu hÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºng theo thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng/store/level/group, risk list, appeal SLA, incident recurrence vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  promotion pipeline. KPI vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  BSC khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng chung cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©c.

- [x] **Step 2: Implement report DTO**

Report trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ DTO ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ scope theo quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân; khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ page tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± filter dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£m.

- [x] **Step 3: ChuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n reports UI**

4 macro cards, tab xu hÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºng/rÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§i ro/pipeline/leaderboard, 2/3 chart-table + 1/3 insight. XuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t Excel dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u DTO ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ scope.

- [ ] **Step 4: Test, lint vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  commit**

Run: `node --import tsx --test src/lib/kpi/report-service.test.ts`
Expected: PASS.

```powershell
git add src/lib/kpi/report-service.ts src/lib/kpi/report-service.test.ts src/app/kpi/reports/page.tsx docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): add scoped KPI reporting"
```

## Task 32: HoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n navigation, code map vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  kiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m tra toÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ng

**Files:**
- Modify: `src/lib/navigation/sidebar-config.ts`
- Modify: `docs/CODEMAP.md`
- Modify: `docs/KNOWN_ISSUES.md`

- [x] **Step 1: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“t navigation theo role**

Employee thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n. Leader thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y dashboard/review/incidents. Admin/HR thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y periods/settings/reports. CEO thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y toÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  decision queues.

- [x] **Step 2: CÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­t CODEMAP**

Ghi rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµ domain services, component folders, routes, migrations vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  nÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡i dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng khi sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a KPI.

- [x] **Step 3: CÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­t known issues**

ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° ghi bug thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·p vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡nh. KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng ghi giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh chÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a xÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£y ra.

- [ ] **Step 4: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y full verification**

Run: `node --import tsx --test src/lib/kpi/*.test.ts`
Expected: 0 test fail.

Run: `npm run lint`
Expected: exit 0 hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân ngoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i scope trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc khi tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥c.

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: exit 0.

Run: `npm run ai:ready`
Expected: guard vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  context pass.

Run: `npm run build`
Expected: production build thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â nh cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng.

- [ ] **Step 5: Browser verification**

ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y `npm run dev` tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ng 3535. KiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m tra desktop 1440x900 vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  mobile 390x844 cho 10 route chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh; chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥p ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng in-app browser. XÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng blank, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng overlap, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n, modal/drawer hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  icon Lucide hiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹.

- [ ] **Step 6: Commit checkpoint Pass E**

```powershell
git add src/lib/navigation/sidebar-config.ts docs/CODEMAP.md docs/KNOWN_ISSUES.md docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "feat(kpi): complete KPI SaaS rollout"
```

---

# PILOT - MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng, mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ KPI

## Task 33: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y pilot vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  nghiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡m thu

**Files:**
- Create: `docs/KPI_PILOT_RUNBOOK.md`
- Create: `docs/KPI_PILOT_RESULT.md`

- [x] **Step 1: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u pilot**

Ghi cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng, kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng, danh sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn, KPI version, ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p POS, Leader chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m, CEO duyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸/khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³.

- [x] **Step 2: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân luÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œng thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng**

MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ -> thu thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p HRM/POS -> Leader chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥m -> CEO preapprove -> cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ -> nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn xem/khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i -> CEO quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh -> khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³.

- [x] **Step 3: ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ thÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n**

ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­t nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§/gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âu kiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y system detect -> Leader propose -> test -> challenge -> salary decision hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c deferred decision.

- [x] **Step 4: Ghi kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£ng**

`KPI_PILOT_RESULT.md` phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³: sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ nhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn, sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ phiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u hoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t, dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u thiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u, ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âu chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°nh cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ do, incident, cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£nh bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng, appeal, thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi gian xÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­ lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½, lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  viÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡c cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²n phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng Excel.

- [x] **Step 5: Gate mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ rÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng**

ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ rÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ng khi 100% ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m truy nguÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œn ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c, khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng, salary khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ sai quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân, CEO khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³a kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£c vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n Excel ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ hoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥t quy trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh.

- [ ] **Step 6: Final commit**

```powershell
git add docs/KPI_PILOT_RUNBOOK.md docs/KPI_PILOT_RESULT.md docs/superpowers/plans/2026-08-21-kpi-saas-implementation-plan.md
git commit -m "docs(kpi): record KPI pilot outcome"
```

## 4. ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚ÂiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â«ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¯t buÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢c giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯a cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c Pass

- Sau Pass A: ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng duyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t KPI Builder vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥u trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºc policy trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc khi lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â m kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ng.
- Sau Pass B: chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y demo mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â³ mock hoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°nh trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc khi lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â m incident mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi.
- Sau Pass C: ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng duyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ng phÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  khiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿u nÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i.
- Sau Pass D: ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng duyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡t pipeline thÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n/lÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ng bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ sÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¡ mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â«u.
- Sau Pass E: chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y kiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m tra phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­t trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc Pilot.

## 5. TiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªu chuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â©n hoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â nh chung

- KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m KPI chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©c tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng thang 0-100; chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â i test dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng 100 ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m.
- KhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²n logic thÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€ Ã¢â‚¬â„¢ng tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n L0-L5 trong luÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œng mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi.
- Published config vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  locked period khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­a trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â±c tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p.
- MÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“iÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢m, incident, appeal vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  salary decision cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ nguÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œn/audit.
- NhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n viÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§a mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬nh; Leader chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â° thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng scope; CEO lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ngÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi quyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh cuÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“i.
- KPI vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  BSC tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©c.
- UI ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡t checklist `DESIGN_RULE_HOMIES_FINAL.md` ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€¦Ã‚Â¸ desktop/mobile.
- Test, lint, TypeScript, AI guard vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  build cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â±ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡y mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc khi bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡o hoÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â nh.
