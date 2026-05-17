@echo off
chcp 65001 >nul
echo ========================================
echo    RESTART HRM TRA SUA - PORT 3333
echo ========================================

echo.
echo [1] Tim process dung port 3333...

set "found=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3333 ^| findstr LISTENING') do (
    set "found=1"
    echo     Kill PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

if "%found%"=="0" (
    echo     Khong co process nao dung port 3333
)

echo.
echo [2] Doi 2 giay...
timeout /t 2 /nobreak >nul

echo.
echo [3] Kiem tra port...
netstat -ano | findstr :3333 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo [LOI] Port 3333 van bi chiem! Thu chay Admin.
    pause
    exit /b 1
)
echo     [OK] Port 3333 da san sang!

echo.
echo [4] Khoi dong server...
echo ========================================
npm run dev
