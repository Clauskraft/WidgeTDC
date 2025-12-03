# Setup Script 05: Configure Services
# Konfigurerer alle services med API keys og connections

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Step 5: Configure Services" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$configPath = "..\config"

# Check if .env template exists
if(-not (Test-Path "$configPath\env.template")) {
    Write-Host "❌ env.template not found!" -ForegroundColor Red
    exit 1
}

# Prompt for API keys
Write-Host "Please provide your API keys:" -ForegroundColor Yellow
Write-Host ""

$openaiKey = Read-Host "OpenAI API Key"
$chatpptKey = Read-Host "ChatPPT API Key (optional, press Enter to skip)"

# Create .env file
$envContent = Get-Content "$configPath\env.template"
$envContent = $envContent -replace "your_openai_key_here", $openaiKey
$envContent = $envContent -replace "your_chatppt_key_here", $chatpptKey

$envContent | Out-File "$configPath\.env" -Encoding UTF8

Write-Host "✅ Created .env file" -ForegroundColor Green

# Copy to WidgeTDC main project
$widgetdcPath = "C:\Users\claus\Projects\WidgeTDC"
if(Test-Path $widgetdcPath) {
    Copy-Item "$configPath\.env" "$widgetdcPath\.env" -Force
    Write-Host "✅ Copied .env to WidgeTDC project" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Service configuration complete!" -ForegroundColor Green
Write-Host ""
