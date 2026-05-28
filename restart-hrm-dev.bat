@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo ========================================
echo    RESTART HRM TRA SUA - PORT 3333
echo ========================================
echo.
echo [1] Tim process dang LISTENING o port 3333...

set "FOUND_PID=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3333" ^| findstr "LISTENING"') do (
    set "FOUND_PID=1"
    echo     Dung PID %%a
    taskkill /F /PID %%a >nul 2>&1
)

if "%FOUND_PID%"=="0" (
    echo     Khong co process nao dang chiem port 3333
)

echo.
echo [2] Doi port 3333 giai phong...
timeout /t 2 /nobreak >nul

netstat -ano | findstr ":3333" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo [LOI] Port 3333 van dang bi chiem. Thu chay file nay bang quyen Admin.
    pause
    exit /b 1
)

echo.
echo [3] Mo lai dev server cua HRM...
start "HRM Dev Server 3333" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo.
echo Hoan tat. Co the dong cua so nay va F5 lai trinh duyet.
