@echo off
echo ================================================
echo   Installing DeepSeek SDK (Force Clean)
echo ================================================
echo.

cd /d "%~dp0"

echo Lukker Node processer...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM vite.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Sletter node_modules...
if exist node_modules (
    echo Forsøger at slette med PowerShell...
    powershell -Command "Remove-Item -Path 'node_modules' -Recurse -Force -ErrorAction SilentlyContinue"
    timeout /t 2 /nobreak >nul
)

if exist package-lock.json (
    echo Sletter package-lock.json...
    del /f /q package-lock.json 2>nul
)

echo.
echo Installerer dependencies med --legacy-peer-deps...
call npm install --legacy-peer-deps

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo   SUCCESS! DeepSeek SDK er installeret
    echo ================================================
    echo.
    echo Verificerer installation...
    if exist "node_modules\deepseek-sdk" (
        echo [OK] deepseek-sdk found in node_modules
    ) else (
        echo [WARNING] deepseek-sdk not found
    )
    echo.
) else (
    echo.
    echo ================================================
    echo   FEJL! Installation fejlede
    echo ================================================
    echo.
)

pause
