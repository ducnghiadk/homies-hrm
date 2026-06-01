# Changelog - Genesis v2

> File này ghi nhận các thay đổi trong quá trình lặp. Thay đổi lớn cần tạo phiên bản mới.

## Định dạng

- **[ADD]** Thêm tính năng/task
- **[FIX]** Sửa lỗi
- **[CHANGE]** Thay đổi nội dung hiện có
- **[REMOVE]** Xóa nội dung

---

## 2026-02-15 - v2.2 Blueprint (/blueprint)

- [CHANGE] 05_TASKS.md v2.2: 60 tasks, ~255h (was 55 tasks, ~222h)
- [ADD] Full WBS with verification instructions per task
- [ADD] Mermaid dependency graph (3-level depth)
- [ADD] Complexity audit: all ≤8h, no cycles
- [ADD] 6-wave execution plan
- [ADD] System 12: Asset Management (optional, P2)
- [CHANGE] Updated .agent/rules/agents.md with v2.2 stats

## 2026-02-15 - v2.2 Kiến trúc & Specs bổ sung

- [ADD] Section 10: Data Model — ER diagram (Mermaid) + Key Entities table
- [ADD] Section 11: API Structure — 8 module endpoints + response format
- [ADD] Section 12: Notification Events — 13 event types
- [ADD] Section 13: Permission Matrix — 5 roles × 18 features
- [ADD] Section 14: Key Test Scenarios — 15 test cases (Auth, ATT, LVE, PAY)
- [ADD] Section 15: Audit Trail — REQ-SYS-001 (8 action types, retention rules)
- [ADD] Section 16: Mobile Requirements — REQ-MOB-001~004 (PWA, Camera, GPS, Push)
- [ADD] NG-006: Tablet layout riêng not supported
- [ADD] CEO Bottom Nav (Reports, Notifications, Settings)
- [CHANGE] PRD version 2.1 → 2.2, status → Complete

## 2026-02-15 - v2.1 Cập nhật từ user feedback

- [ADD] Module 19: Leave Management (5 REQs: Balance, Request, Approval, Calendar, Policy)
- [ADD] Module 20: Asset Management (3 REQs: List, Assignment, Return)
- [ADD] REQ-AUTH-003 Session Management, REQ-AUTH-004 First Login
- [ADD] REQ-ATT-008 OT Request, REQ-ATT-009 Calendar, REQ-ATT-010 Manual Override
- [ADD] REQ-TASK-003 Handover, REQ-TASK-004 Incident Report
- [ADD] REQ-COM-005 Team Chat, REQ-COM-006 Direct Message
- [ADD] REQ-PAY-009 Calculation, REQ-PAY-010 History, REQ-PAY-011 Allowance
- [ADD] REQ-SET-018~021 Notification, Backup, Audit, Integration settings
- [ADD] REQ-EMP-005~007 Import, Export, Offboarding
- [ADD] NFR-001~007 Non-Functional Requirements
- [ADD] ERR-001~004 Error Handling
- [ADD] Glossary (thuật ngữ)
- [CHANGE] PRD version 2.0 → 2.1
- [CHANGE] Tasks 40 → 55, ~161h → ~222h

## 2026-02-15 - Khởi tạo

- [ADD] Tạo Genesis v2 từ spec chi tiết 18 modules
- [CHANGE] Mở rộng concept model với đầy đủ entities và flows
- [ADD] PRD chi tiết với 70+ screens, Given-When-Then acceptance criteria
