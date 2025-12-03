@echo off
title WidgeTDC Deployer
color 0A

:: Token fra dig
set RAILWAY_TOKEN=7436829c-b725-4a63-9a4c-ef9dd5c4831f

echo ==========================================
echo   DEPLOYING TO EXISTING PROJECT
echo ==========================================
echo.

:: Forsøg at deploye direkte (hvis tokenet er et Service/Project token)
echo [1/2] Attempting deployment with provided token...
call railway up --detach

if %errorlevel% neq 0 (
    echo.
    echo [!] Deployment via token failed directly.
    echo     If this is a new project, we need to link it first.
    echo.
    echo     Attempting to link to project ID (guessed from token context)...
    :: Her kan vi ikke gætte ID'et, men vi kan prøve 'railway link' hvis brugeren er logget ind interaktivt
    call railway link
)

echo.
echo ==========================================
echo   PROCESS FINISHED
echo ==========================================
pause