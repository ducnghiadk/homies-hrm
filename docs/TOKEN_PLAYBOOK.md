# TOKEN_PLAYBOOK

## Hard Rules
- Mỗi turn chỉ 1 mục tiêu chính
- Không đọc full file lớn, dùng `rg` + đọc theo dòng
- File > 400-600 dòng phải đọc theo line-range
- Mỗi pass chỉ sửa tối đa 1-3 file
- Sau khi chốt root cause, không đọc lại file cũ
- File mới vượt 300 dòng -> tách component
- UI tiếng Việt phải có dấu; không được merge chuỗi mojibake hoặc copy fallback không dấu ở màn người dùng nhìn thấy
- Khi sửa `employees/contracts/offboarding/sidebar`, phải chạy `npm run ai:guard` trước khi báo xong task

## Pass Sizes
- Small (1 file, 1 bug): 20k-35k token
- Medium (tạo page, nối UI): 35k-50k token
- Large (type + API + UI): 50k-60k token

## Scope Gates - tách pass nếu:
- Mở hơn 3 file code
- Đọc hơn 2 file lớn
- File mới vượt 300 dòng
- Verify fail

## Feature lớn chia:
Pass A: data/type/API -> Pass B: page shell -> Pass C: interaction -> Pass D: wiring -> Pass E: polish + verify
