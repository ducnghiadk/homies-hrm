@echo off
cd /d "%~dp0"
start "HRM Dev Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
start "" "http://localhost:3333"
