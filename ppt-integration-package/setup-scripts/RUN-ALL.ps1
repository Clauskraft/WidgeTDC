# WidgeTDC PowerPoint Integration - RUN ALL SETUP
# Dette script kører alle setup scripts i rækkefølge

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  WidgeTDC PowerPoint Integration Package" -ForegroundColor Cyan
Write-Host "  Automatic Setup - ALL STEPS" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$scripts = @(
    "01-install-dependencies.ps1",
    "02-setup-pptagent.ps1",
    "03-setup-multiagent.ps1",
    "04-download-datasets.ps1",
    "05-configure-services.ps1"
)

$totalSteps = $scripts.Count
$currentStep = 0

foreach($script in $scripts) {
    $currentStep++
    Write-Host ""
    Write-Host "[$currentStep/$totalSteps] Running: $script" -ForegroundColor Yellow
    Write-Host "=================================================" -ForegroundColor Gray
    
    try {
        & ".\$script"
        Write-Host "✅ $script completed successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error running $script" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        $continue = Read-Host "Continue with next step? (Y/N)"
        if($continue -ne "Y") {
            Write-Host "Setup aborted." -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  🎉 ALL SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start services: cd ..\docker && docker-compose up -d"
Write-Host "2. Copy files to WidgeTDC: See README.md"
Write-Host "3. Configure .env: Edit C:\Users\claus\Projects\WidgeTDC\.env"
Write-Host ""
