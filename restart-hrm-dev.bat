@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo ========================================
echo    RESTART HRM TRA SUA - PORT 3535
echo ========================================
echo.
echo [1] Tim process dang LISTENING o port 3535...

set "FOUND_PID=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3535" ^| findstr "LISTENING"') do (
    set "FOUND_PID=1"
    echo     Dung PID %%a
    taskkill /F /PID %%a >nul 2>&1
)

if "%FOUND_PID%"=="0" (
    echo     Khong co process nao dang chiem port 3535
)

echo.
echo [2] Doi port 3535 giai phong...
timeout /t 2 /nobreak >nul

netstat -ano | findstr ":3535" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo [LOI] Port 3535 van dang bi chiem. Thu chay file nay bang quyen Admin.
    pause
    exit /b 1
)

echo.
echo [3] Mo lai dev server cua HRM o port 3535...
start "HRM Dev Server 3535" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo.
echo Hoan tat. Co the dong cua so nay va F5 lai trinh duyet (http://localhost:3535).
