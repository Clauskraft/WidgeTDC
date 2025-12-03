@echo off
title WidgeTDC Desktop Builder
color 0B

echo ==========================================
echo   BUILDING WIDGETTDC DESKTOP APP (.EXE)
echo ==========================================

cd desktop-app

echo.
echo [1/3] Installing Electron dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b
)

echo.
echo [2/3] Building Windows Executable...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed.
    pause
    exit /b
)

echo.
echo ==========================================
echo   BUILD COMPLETE!
echo   Your app is ready in:
echo   desktop-app/dist/WidgeTDC Command Center Setup 1.0.0.exe
echo ==========================================
explorer dist
pause
