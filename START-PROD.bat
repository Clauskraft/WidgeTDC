@echo off
color 0C
echo.
echo ========================================
echo   WIDGETTDC - PRODUCTION MODE
echo ========================================
echo.
echo   !!! WARNING: PRODUCTION DATABASE !!!
echo.
echo ========================================
echo.

cd /d "%~dp0"

set /p confirm="Type 'yes' to continue with PRODUCTION: "
if /i not "%confirm%"=="yes" (
    echo Cancelled.
    pause
    exit
)

echo.
echo Switching to PRODUCTION environment...
powershell -ExecutionPolicy Bypass -Command "Copy-Item '.env.production' '.env' -Force; Copy-Item '.env.production' 'apps\backend\.env' -Force"

echo.
echo Starting in PRODUCTION mode...
echo.
npm run dev

pause
