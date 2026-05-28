---
description: Kiểm tra sức khỏe toàn diện dự án
trigger: khi tôi nói audit, kiểm tra, health check, rà soát
---

# Skill: Project Audit

Khi được kích hoạt, chạy đúng quy trình sau. Báo cáo bằng tiếng Việt.

### Bước 1: Chọn phạm vi
Hỏi: "Bạn muốn kiểm tra gì?"
- Toàn bộ dự án
- 1 tính năng cụ thể
- 1 mảng cụ thể (security, performance, v.v.)

### Bước 2: Kiểm tra 6 mảng

Mảng 1 — Code Quality:
- File >300 dòng cần tách
- Code lặp, code thừa, import không dùng
- Tên không nhất quán
- Chạy lệnh kiểm tra lỗi phù hợp tech stack

Mảng 2 — Bug Hunting:
- Logic sai, điều kiện thiếu
- API thiếu try/catch
- State không reset đúng
- Null/undefined không handle

Mảng 3 — Security:
- API thiếu auth check
- Key/token viết thẳng trong code
- `.env` thiếu gitignore
- Input không validate
- RLS nếu dùng Supabase

Mảng 4 — Performance:
- Component thiếu memo/useMemo/useCallback
- Query database nặng
- Bundle/file quá lớn
- API gọi lặp không cần thiết

Mảng 5 — UX/UI:
- Thiếu loading state
- Thiếu error message
- Thiếu xác nhận trước xóa/gửi
- Không responsive
- Text thiếu/sai tiếng Việt

Mảng 6 — Dependencies:
- `npm audit` / `pip audit`
- Thư viện quá cũ
- Thư viện không dùng
- Lỗ hổng bảo mật đã biết

### Bước 3: Viết báo cáo

# Báo cáo kiểm tra dự án
**Ngày:** [ngày]
**Phạm vi:** [toàn bộ / cụ thể]
**Tình trạng:** [Tốt / Cần chú ý / Cần sửa gấp]

## Tóm tắt
- Nghiêm trọng: X vấn đề
- Trung bình: X vấn đề
- Nhẹ: X vấn đề

## Vấn đề nghiêm trọng
(Giải thích tiếng Việt dễ hiểu: nó là gì, tại sao nguy hiểm)

## Vấn đề trung bình
(Tương tự)

## Vấn đề nhẹ
(Tương tự)

## Kế hoạch sửa
### Sửa ngay (<30 phút)
| # | Vấn đề | Ảnh hưởng | Cách sửa |
### Sửa sớm (30p-2h)
| # | Vấn đề | Ảnh hưởng | Cách sửa |
### Sửa khi rảnh (>2h)
| # | Vấn đề | Ảnh hưởng | Cách sửa |

### Bước 4: Hỏi hành động
"Bạn muốn tôi làm gì?"
1. Sửa tất cả nghiêm trọng
2. Sửa vấn đề cụ thể (cho số)
3. Sửa lần lượt từ nghiêm trọng đến nhẹ
4. Lưu báo cáo, chưa sửa

Chờ tôi chọn.

### Bước 5: Sửa (nếu yêu cầu)
- Từng vấn đề, tuân thủ safety + TOKEN_PLAYBOOK
- Sau mỗi fix, chạy kiểm tra lỗi
- Cập nhật KNOWN_ISSUES.md
- Cập nhật CODEMAP.md nếu có file mới
