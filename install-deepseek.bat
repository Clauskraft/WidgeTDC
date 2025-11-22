@echo off
echo ================================================
echo   Installing DeepSeek SDK with peer dep fixes
echo ================================================
echo.

cd /d "%~dp0"

echo Sletter gamle node_modules og package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

echo.
echo Installerer dependencies...
call npm install --legacy-peer-deps

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo   SUCCESS! DeepSeek SDK er installeret
    echo ================================================
    echo.
    echo Du kan nu bruge deepseek-sdk i dit projekt!
    echo.
) else (
    echo.
    echo ================================================
    echo   FEJL! Installation fejlede
    echo ================================================
    echo.
    echo Prov at kore manuelt:
    echo   npm install --legacy-peer-deps
    echo.
)

pause
