@echo off
color 0A
echo.
echo ========================================
echo   WIDGETTDC - LOCAL DEVELOPMENT
echo ========================================
echo.

cd /d "%~dp0"

echo Switching to LOCAL environment...
powershell -ExecutionPolicy Bypass -File "switch-env.ps1" local

echo.
echo Starting development server...
echo.
npm run dev

pause
