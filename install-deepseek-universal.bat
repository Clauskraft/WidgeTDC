@echo off
echo ================================================
echo   Installing DeepSeek Agent Integration
echo ================================================
echo.

REM 1. Install dependencies
echo Installing OpenAI SDK (DeepSeek compatible)...
call npm install openai dotenv --save

REM 2. Create/Update .env file if missing
if not exist .env (
    echo Creating .env file...
    echo DEEPSEEK_API_KEY=your_key_here>> .env
    echo.
    echo [INFO] Created .env file. Please add your API Key!
)

REM 3. Verify Integration
echo.
echo Verifying setup...
if exist "node_modules\openai" (
    echo [SUCCESS] Dependencies installed.
) else (
    echo [ERROR] Failed to install dependencies.
)

echo.
echo ================================================
echo   Setup Complete!
echo   1. Add your key to .env: DEEPSEEK_API_KEY=...
echo   2. Use the agent in src/agents/deepseek.ts
echo ================================================
pause
