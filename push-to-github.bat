@echo off
REM WidgeTDC - Push Script (Windows)
REM Dette script pusher commits til GitHub på den nemmeste måde

REM Brug korrekt sti
cd /d "C:\Users\claus\Projects\WidgeTDC\WidgeTDC"
if errorlevel 1 (
    echo ❌ Fejl: Kunne ikke finde repository!
    echo Tjek at stien er korrekt: C:\Users\claus\Projects\WidgeTDC\WidgeTDC
    pause
    exit /b 1
)

echo 🚀 WidgeTDC Push Script
echo ======================
echo.

REM Tjek status
echo 📊 Tjekker status...
git fetch origin >nul 2>&1

for /f %%i in ('git rev-list --count origin/main..HEAD 2^>nul') do set COMMITS_AHEAD=%%i

if "%COMMITS_AHEAD%"=="0" (
    echo ✅ Ingen commits at pushe - alt er opdateret!
    exit /b 0
)

echo ✅ %COMMITS_AHEAD% commit(s) klar til push:
git log origin/main..HEAD --oneline --format="   - %%h %%s"
echo.

REM Prøv at pushe
echo 🔄 Prøver at pushe til GitHub...
echo.

git push origin main
if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS! Commits er nu pushet til GitHub!
    echo.
    git status -sb
    exit /b 0
)

REM Hvis push fejlede
echo.
echo ⚠️  Push fejlede - autentificering kræves
echo.
echo 📋 LØSNING:
echo.
echo 1. Opret Personal Access Token:
echo    → Gå til: https://github.com/settings/tokens
echo    → Klik 'Generate new token (classic)'
echo    → Vælg scope: 'repo' (fuld kontrol)
echo    → Kopier tokenen
echo.
echo 2. Kør dette script igen, eller push manuelt:
echo    git push origin main
echo    (Brug token som password)
echo.
echo 3. ELLER: Sæt token i environment variabel:
echo    set GITHUB_TOKEN=din_token_her
echo    push-to-github.bat
echo.

REM Hvis GITHUB_TOKEN er sat, prøv at bruge den
if defined GITHUB_TOKEN (
    echo 🔑 Bruger GITHUB_TOKEN fra environment...
    git remote set-url origin https://%GITHUB_TOKEN%@github.com/Clauskraft/WidgeTDC.git
    
    git push origin main
    if %errorlevel% equ 0 (
        REM Skift tilbage til normal URL
        git remote set-url origin https://github.com/Clauskraft/WidgeTDC.git
        echo.
        echo ✅ SUCCESS! Commits er nu pushet til GitHub!
        exit /b 0
    ) else (
        REM Skift tilbage til normal URL
        git remote set-url origin https://github.com/Clauskraft/WidgeTDC.git
        echo.
        echo ❌ Push fejlede selv med token. Tjek at tokenen har 'repo' scope.
    )
)

exit /b 1

