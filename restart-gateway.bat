@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "GATEWAY_PORT=3333"
set "WINDOW_TITLE=HRM_TRA_SUA_GATEWAY_%GATEWAY_PORT%"

echo [gateway] Restarting project gateway on port %GATEWAY_PORT%...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$projectDir = (Resolve-Path '%PROJECT_DIR%').Path.TrimEnd('\');" ^
  "$port = '%GATEWAY_PORT%';" ^
  "$candidates = Get-CimInstance Win32_Process | Where-Object {" ^
  "  $_.Name -match '^(node|cmd)\.exe$' -and $_.CommandLine -and (" ^
  "    $_.CommandLine -match 'next(\.cmd)?\s+dev' -or" ^
  "    $_.CommandLine -match 'npm(\.cmd)?\s+run\s+dev'" ^
  "  ) -and $_.CommandLine -match ('\s-p\s+' + [regex]::Escape($port) + '(\s|$)')" ^
  "};" ^
  "foreach ($proc in $candidates) {" ^
  "  try { Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop; Write-Host ('[gateway] Stopped PID ' + $proc.ProcessId) }" ^
  "  catch { Write-Host ('[gateway] Skip PID ' + $proc.ProcessId + ': ' + $_.Exception.Message) }" ^
  "}"

pushd "%PROJECT_DIR%"
start "%WINDOW_TITLE%" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run dev"
popd

echo [gateway] Started new gateway window: %WINDOW_TITLE%
exit /b 0
