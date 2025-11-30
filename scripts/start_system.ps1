# --- WIDGETDC SYSTEM START ---
# Dette script sikrer en ren start af hele systemet.

Write-Host "`n🚀 INITIALIZING WIDGETDC NEURAL SYSTEMS..." -ForegroundColor Cyan

# 1. DRÆB ZOMBIER (Rens op)
Write-Host "   Stopping old processes..." -NoNewline
try {
    # Dræb node.exe processer aggressivt
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host " DONE" -ForegroundColor Green
} catch {
    Write-Host " (Ingen processer fundet)" -ForegroundColor Gray
}

# 2. TJEK MILJØ
$BackendPath = "apps/backend"
$FrontendPath = "apps/widget-board"

if (!(Test-Path $BackendPath) -or !(Test-Path $FrontendPath)) {
    Write-Host "`n❌ KRITISK FEJL: Kan ikke finde apps/backend eller apps/widget-board." -ForegroundColor Red
    Write-Host "   Er du i roden af WidgeTDC mappen?" -ForegroundColor Yellow
    exit
}

# 3. START SYSTEMET (Concurrent Mode)
Write-Host "`n🧠 Starter 'The Architect' (Backend + Frontend)..." -ForegroundColor Magenta
Write-Host "   Backend API:  http://localhost:3001" -ForegroundColor Gray
Write-Host "   Frontend UI:  http://localhost:8888" -ForegroundColor Gray
Write-Host "`n   [Tryk Ctrl+C for at stoppe begge]" -ForegroundColor Yellow

# Kør npm run dev fra roden (som bruger 'concurrently' fra package.json)
npm run dev