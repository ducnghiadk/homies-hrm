# KPI RLS Test Matrix

Muc tieu: co bang test ro rang de kiem tra quyen KPI khi chuyen sang Supabase that.

## 1. Role map

| DB role (`nhan_vien.vai_tro`) | Web role |
|---|---|
| `nhan_vien` | `employee` |
| `truong_ca` | `shift_leader` |
| `quan_ly_cua_hang` | `store_manager` |
| `quan_ly_khu_vuc` | `area_manager` |
| `quan_tri_hr` | `hr_admin` |
| `ban_giam_doc` | `ceo` |

## 2. Ghi chu test

- KPI RLS dang map nguoi dung theo `nhan_vien.auth_id`.
- De test nhanh trong SQL editor, co the tam set `request.jwt.claim.sub` bang `nhan_vien.id` neu chua co `auth_id` that.
- Salary la du lieu nhay cam: `employee` chi xem salary cua chinh minh, `shift_leader` khong co quyen xem salary scope.

## 3. SQL impersonation mau

```sql
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'e1000000-0000-0000-0000-000000000002', true);
```

Thay UUID theo persona dang test.

## 4. Persona de test

| Persona | UUID goi y | Role |
|---|---|---|
| PT2 pilot | `e1000000-0000-0000-0000-000000000002` | `employee` |
| Shift leader pilot | `e1000000-0000-0000-0000-000000000004` | `shift_leader` |
| Store manager | `e0000000-0000-0000-0000-000000000002` | `store_manager` |
| HR admin | `e0000000-0000-0000-0000-000000000016` | `hr_admin` |
| CEO | `e0000000-0000-0000-0000-000000000001` | `ceo` |

## 5. Matrix query allowed / denied

| # | Persona | Query / Action | Expected |
|---|---|---|---|
| 1 | employee | `select * from kpi_evaluations` cua chinh minh | allowed |
| 2 | employee | `select * from kpi_evaluations` cua nguoi khac | denied |
| 3 | employee | `select * from kpi_salary_decisions` cua chinh minh | allowed |
| 4 | employee | `select * from kpi_salary_decisions` cua nguoi khac | denied |
| 5 | employee | `insert into kpi_appeals (...)` voi `employee_id` cua chinh minh | allowed |
| 6 | employee | `insert into kpi_appeals (...)` voi `employee_id` cua nguoi khac | denied |
| 7 | shift_leader | `select * from kpi_evaluations` trong cung cua hang | allowed |
| 8 | shift_leader | `select * from kpi_evaluations` cua cua hang khac | denied |
| 9 | shift_leader | `update kpi_periods` khi `status = 'locked'` | denied |
| 10 | shift_leader | `select * from kpi_salary_decisions` | denied |
| 11 | store_manager | `select * from kpi_salary_decisions` trong cua hang minh | allowed |
| 12 | store_manager | `select * from kpi_salary_decisions` cua hang khac | denied |
| 13 | store_manager | `update kpi_evaluations` trong period `leader_scoring` cung cua hang | allowed |
| 14 | store_manager | `update kpi_periods` khi `status = 'locked'` | denied |
| 15 | area_manager | `select * from kpi_development_cases` trong to chuc | allowed |
| 16 | area_manager | `select * from kpi_salary_decisions` trong to chuc | allowed |
| 17 | area_manager | `insert into kpi_salary_decisions (...)` | denied |
| 18 | hr_admin | `insert/update kpi_sets`, `kpi_set_versions`, `kpi_salary_bands` | allowed |
| 19 | hr_admin | `insert into kpi_salary_decisions (...)` | denied |
| 20 | hr_admin | `select * from kpi_audit_logs` trong to chuc | allowed |
| 21 | ceo | `update kpi_periods` khi `status = 'locked'` | allowed |
| 22 | ceo | `insert/update kpi_salary_decisions` | allowed |
| 23 | ceo | `select * from kpi_audit_logs` trong to chuc | allowed |
| 24 | ceo | `select * from tat ca bang KPI` trong to chuc | allowed |

## 6. Query mau cho tung nhom

### Employee self-only

```sql
select id, period_id, total_score, grade_code
from kpi_evaluations;
```

### Salary privacy

```sql
select id, employee_id, decided_rate, effective_from
from kpi_salary_decisions;
```

### Period lock control

```sql
update kpi_periods
set status = 'locked'
where id = '11111111-1111-1111-1111-111111111113';
```

### HR config allowed, salary decision denied

```sql
update kpi_salary_bands
set max_hourly_rate = 47000
where id = '11111111-1111-1111-1111-111111112204';
```

```sql
insert into kpi_salary_decisions (
  id,
  development_case_id,
  employee_id,
  decided_rate,
  effective_from,
  reason,
  decided_by
) values (
  '99999999-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111903',
  'e1000000-0000-0000-0000-000000000003',
  42000,
  date '2026-10-15',
  'HR thu insert salary',
  'e0000000-0000-0000-0000-000000000016'
);
```

Expected: update salary band allowed, insert salary decision denied.

## 7. Muc dat khi verify that

- Moi dong trong matrix co ket qua `allowed` hoac `denied` dung nhu cot `Expected`.
- Khong co truong hop employee nhin thay evaluation / salary cua nguoi khac.
- Khong co truong hop `shift_leader`, `store_manager`, `area_manager`, `hr_admin` chot salary thay CEO.
- Khong co truong hop leader sua period da `locked`.
