@echo off
REM ============================================
REM  DeepSeek SDK Quick Install (Windows)
REM ============================================

echo.
echo ================================================
echo   Installing DeepSeek SDK for WidgetTDC
echo ================================================
echo.

REM Gå til script location
cd /d "%~dp0"

REM Check package.json
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Run this from WidgetTDC root folder
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

REM Stop node processes
echo Stopping Node processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM vite.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Clean up
echo Cleaning old installation...
if exist node_modules (
    echo   Deleting node_modules...
    rmdir /s /q node_modules 2>nul
)
if exist package-lock.json (
    echo   Deleting package-lock.json...
    del /f /q package-lock.json 2>nul
)
echo   Done!
echo.

REM Install
echo Installing dependencies...
echo This may take a few minutes...
echo.

call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo   SUCCESS! DeepSeek SDK installed
    echo ================================================
    echo.
    
    REM Verify
    if exist "node_modules\deepseek-sdk" (
        echo [OK] deepseek-sdk found in node_modules
    ) else (
        echo [WARNING] deepseek-sdk not found!
    )
    
    echo.
    echo You can now use deepseek-sdk in your project!
    echo.
) else (
    echo.
    echo ================================================
    echo   ERROR! Installation failed
    echo ================================================
    echo.
    echo Try running manually:
    echo   npm install
    echo.
)

pause
