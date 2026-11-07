@echo off
chcp 65001 >nul
echo ====================================================
echo     MO PORT 3535 TREN WINDOWS FIREWALL CHO HRM
echo ====================================================
echo.
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [CANH BAO] Ban can chay file nay bang quyen Administrator!
    echo Vui long click chuot phai vao file nay va chon "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo Dang them rule mo port 3535 vao Windows Firewall...
netsh advfirewall firewall add rule name="HRM NextJS Port 3535" dir=in action=allow protocol=TCP localport=3535

if %errorLevel% equ 0 (
    echo.
    echo [THANH CONG] Da mo port 3535 tren Firewall thanh cong!
    echo May Mac gio day co the ket noi toi: http://100.77.93.127:3535
) else (
    echo.
    echo [THAT BAI] Khong the them luat firewall.
)
echo.
pause
