# Gmail Test Setup

De gui email that cho flow `Loi moi nhan vien` bang Gmail ca nhan:

1. Bat `2-Step Verification` cho tai khoan Gmail.
2. Tao `App Password` trong Google Account.
3. Tao file `.env.local` o root project voi noi dung:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=your_16_char_app_password
EMAIL_FROM=yourname@gmail.com
APP_BASE_URL=http://localhost:3535
```

Luu y:
- `SMTP_PASS` la `App Password`, khong phai mat khau Gmail thuong.
- `EMAIL_FROM` nen trung voi `SMTP_USER`.
- App local dang chay port `3535`, nen `APP_BASE_URL` mac dinh la `http://localhost:3535`.

Sau khi set xong:
1. restart `npm run dev`
2. vao `/employees/invitations/new`
3. tao loi moi va gui email
4. neu loi, vao chi tiet invitation de xem `Lich su gui mock email` va `last_send_error`
