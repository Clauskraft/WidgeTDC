@echo off
color 0B
echo.
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "switch-env.ps1" status
pause
