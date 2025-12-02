@echo off
title WidgeTDC Safe Builder
color 0B

echo ==========================================
echo   ISOLATED BUILD ENVIRONMENT
echo ==========================================

set TEMP_DIR=%TEMP%\widget-tdc-build
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo.
echo [1/4] Copying files to temporary build zone...
xcopy desktop-app\* "%TEMP_DIR%\" /E /I /Y >nul

echo.
echo [2/4] Installing dependencies (Clean)...
cd /d "%TEMP_DIR%"
call npm install --legacy-peer-deps

echo.
echo [3/4] Building Windows Executable...
call npm run build

if %errorlevel% neq 0 (
    echo ERROR: Build failed in safe zone.
    pause
    exit /b
)

echo.
echo [4/4] Retrieving Artifacts...
cd /d "%~dp0"
mkdir "desktop-app\dist" 2>nul
xcopy "%TEMP_DIR%\dist\*.exe" "desktop-app\dist\" /Y

echo.
echo ==========================================
echo   BUILD COMPLETE!
echo   desktop-app/dist/WidgeTDC Command Center Setup 1.0.0.exe
echo ==========================================
explorer "desktop-app\dist"
pause
