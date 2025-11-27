# ============================================
#  DeepSeek SDK Installation Script
#  Tested and verified - Windows PowerShell
# ============================================

# Farver
$ESC = [char]27
$Red = "$ESC[31m"
$Green = "$ESC[32m"
$Yellow = "$ESC[33m"
$Cyan = "$ESC[36m"
$Reset = "$ESC[0m"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Installing DeepSeek SDK for WidgetTDC"
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check om vi er i den rigtige mappe
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json ikke fundet!" -ForegroundColor Red
    Write-Host "Kør dette script fra WidgetTDC root mappen"
    exit 1
}

Write-Host "📂 Arbejder i: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Stop alle node processer
Write-Host "🛑 Stopper Node processer..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process vite -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Ryd op med PowerShell (mere robust end cmd)
Write-Host "🗑️  Sletter gamle node_modules og package-lock.json..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "   Sletter node_modules..." -ForegroundColor Gray
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

if (Test-Path "package-lock.json") {
    Write-Host "   Sletter package-lock.json..." -ForegroundColor Gray
    Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
}

Write-Host "   Slettet!" -ForegroundColor Green
Write-Host ""

# Installer dependencies
Write-Host "📦 Installerer dependencies..." -ForegroundColor Cyan
Write-Host "   Dette kan tage et par minutter..." -ForegroundColor Gray
Write-Host ""

$installSuccess = $false
try {
    $output = npm install 2>&1
    if ($LASTEXITCODE -eq 0) {
        $installSuccess = $true
        Write-Host ""
        Write-Host "✅ Installation gennemført!" -ForegroundColor Green
    }
} catch {
    Write-Host ""
    Write-Host "❌ Installation fejlede!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

if (-not $installSuccess) {
    Write-Host "❌ Installation fejlede!" -ForegroundColor Red
    exit 1
}

# Verificer deepseek-sdk
Write-Host ""
Write-Host "🔍 Verificerer installation..." -ForegroundColor Cyan

$deepseekPath = "node_modules\deepseek-sdk"
if (Test-Path $deepseekPath) {
    Write-Host "✅ deepseek-sdk installeret korrekt" -ForegroundColor Green
    
    # Læs version
    $packageJson = Get-Content "$deepseekPath\package.json" -Raw | ConvertFrom-Json
    Write-Host "   Version: $($packageJson.version)" -ForegroundColor Gray
} else {
    Write-Host "❌ deepseek-sdk ikke fundet!" -ForegroundColor Red
    exit 1
}

# Vis statistik
Write-Host ""
Write-Host "📊 Installation statistik:" -ForegroundColor Cyan
$listOutput = npm list --depth=0 2>&1 | Select-String -Pattern "(deepseek|react@)"
$listOutput | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  ✨ SUCCESS! Alt er klar!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Du kan nu bruge deepseek-sdk i dit projekt:" -ForegroundColor White
Write-Host ""
Write-Host @"
  import { DeepSeekAPI } from 'deepseek-sdk';

  const api = new DeepSeekAPI({
    apiKey: process.env.DEEPSEEK_API_KEY
  });

  const response = await api.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: 'Hej!' }]
  });
"@ -ForegroundColor Cyan
Write-Host ""

# Hold vinduet åbent
Write-Host "Tryk på en vilkårlig tast for at lukke..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
