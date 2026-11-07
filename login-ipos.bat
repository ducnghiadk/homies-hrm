@echo off
chcp 65001 >nul
title Đăng Nhập iPOS HRM Cloud - Lấy Token Tự Động
cls
echo ======================================================================
echo    HOMIES HRM - TỰ ĐỘNG ĐĂNG NHẬP VÀ LẤY TOKEN iPOS HRM CLOUD
echo ======================================================================
echo.
node scripts\login_ipos_get_token.mjs
echo.
pause
