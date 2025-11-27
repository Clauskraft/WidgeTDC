# Build Shared Packages Script
# Dette script bygger shared packages i den rigtige rækkefølge

Write-Host "=== Building Widget TDC Shared Packages ===" -ForegroundColor Cyan

# Byg domain-types først
Write-Host "`nStep 1: Building @widget-tdc/domain-types..." -ForegroundColor Yellow
Set-Location -Path "packages\shared\domain-types"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Gray
    npm install
}
Write-Host "Building..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building domain-types!" -ForegroundColor Red
    Set-Location -Path "..\..\..\"
    exit 1
}

# Byg mcp-types derefter
Write-Host "`nStep 2: Building @widget-tdc/mcp-types..." -ForegroundColor Yellow
Set-Location -Path "..\mcp-types"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Gray
    npm install
}
Write-Host "Building..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building mcp-types!" -ForegroundColor Red
    Set-Location -Path "..\..\..\"
    exit 1
}

# Gå tilbage til root
Set-Location -Path "..\..\..\"

Write-Host "`n=== Build Complete! ===" -ForegroundColor Green
Write-Host "Both packages built successfully." -ForegroundColor Green
