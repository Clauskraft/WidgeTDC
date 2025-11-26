#!/usr/bin/env pwsh

Write-Host "🚀 Setting up Enterprise Infrastructure..." -ForegroundColor Cyan

# Navigate to backend
Set-Location apps\backend

Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow

# Clean install to avoid permission issues
if (Test-Path "node_modules") {
    Write-Host "Cleaning node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
}

# Install packages
npm install

# Install embedding provider
Write-Host "`n🧠 Installing local embeddings..." -ForegroundColor Yellow
npm install @xenova/transformers

# Copy .env if doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "`n📄 Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    
    # Add embedding provider setting
    Add-Content .env "`n# Embedding Configuration"
    Add-Content .env "EMBEDDING_PROVIDER=transformers"
    
    Write-Host "✅ .env created with local embeddings configured" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  .env already exists - please manually add:" -ForegroundColor Yellow
    Write-Host "EMBEDDING_PROVIDER=transformers" -ForegroundColor White
}

Write-Host "`n🔧 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Start Docker: docker-compose up -d" -ForegroundColor White
Write-Host "2. Run migrations: npx prisma migrate dev --name init" -ForegroundColor White
Write-Host "3. Build: npm run build" -ForegroundColor White
Write-Host "4. Start: npm run dev (or pm2 start ../../ecosystem.config.js)" -ForegroundColor White

Set-Location ..\..
