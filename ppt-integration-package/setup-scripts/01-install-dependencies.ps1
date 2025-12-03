# Setup Script 01: Install Dependencies
# Installerer alle nødvendige dependencies til WidgeTDC PPT Integration

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Step 1: Installing Dependencies" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if(-not $isAdmin) {
    Write-Host "⚠️  Warning: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some installations may fail. Consider running as Admin." -ForegroundColor Yellow
    Write-Host ""
}

# 1. Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker installed: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker not found!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# 2. Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 3. Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "✅ Python installed: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Python not found. Installing..." -ForegroundColor Yellow
    Write-Host "Please install Python 3.11+ from: https://www.python.org/downloads/" -ForegroundColor Yellow
}

# 4. Check Git LFS (for Zenodo10K dataset)
Write-Host "Checking Git LFS..." -ForegroundColor Yellow
try {
    $lfsVersion = git lfs version
    Write-Host "✅ Git LFS installed: $lfsVersion" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Git LFS not found. Installing..." -ForegroundColor Yellow
    git lfs install
}

# 5. Check pnpm (for frontend)
Write-Host "Checking pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm installed: $pnpmVersion" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  pnpm not found. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
}

Write-Host ""
Write-Host "✅ All dependencies checked!" -ForegroundColor Green
Write-Host ""
