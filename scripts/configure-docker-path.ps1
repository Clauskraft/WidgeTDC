# Configure Docker Desktop to use D:\dOCKER
# Run as Administrator

param(
    [string]$DockerPath = "D:\dOCKER"
)

Write-Host "🐳 Docker Windows Path Configuration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Desktop is running
Write-Host "📋 Checking Docker Desktop status..." -ForegroundColor Yellow
$dockerRunning = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if ($dockerRunning) {
    Write-Host "⚠️  Docker Desktop is running. Please close it before continuing." -ForegroundColor Yellow
    $response = Read-Host "Close Docker Desktop now? (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
    } else {
        Write-Host "❌ Please close Docker Desktop manually and run this script again." -ForegroundColor Red
        exit 1
    }
}

# Check if path exists
if (-not (Test-Path $DockerPath)) {
    Write-Host "❌ Path does not exist: $DockerPath" -ForegroundColor Red
    Write-Host "Creating directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DockerPath -Force | Out-Null
}

# Check WSL distributions
Write-Host ""
Write-Host "📋 Checking WSL distributions..." -ForegroundColor Yellow
$wslList = wsl --list --verbose 2>&1
Write-Host $wslList

# Check if docker-desktop-data exists
$hasDockerData = $wslList -match "docker-desktop-data"
$hasDockerDesktop = $wslList -match "docker-desktop"

if ($hasDockerData -or $hasDockerDesktop) {
    Write-Host ""
    Write-Host "⚠️  Docker Desktop WSL distributions found." -ForegroundColor Yellow
    Write-Host "You have two options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Use Docker Desktop Settings (Recommended)" -ForegroundColor Cyan
    Write-Host "  1. Open Docker Desktop" -ForegroundColor White
    Write-Host "  2. Go to Settings → Resources → Advanced" -ForegroundColor White
    Write-Host "  3. Change 'Disk image location' to: $DockerPath" -ForegroundColor White
    Write-Host "  4. Click 'Apply & Restart'" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Manual WSL Migration (Advanced)" -ForegroundColor Cyan
    Write-Host "  See DOCKER_WINDOWS_CONFIG.md for detailed instructions" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "✅ No Docker Desktop WSL distributions found." -ForegroundColor Green
    Write-Host "Docker Desktop will use default location or configured path." -ForegroundColor Green
}

# Verify Docker path structure
Write-Host ""
Write-Host "📁 Checking Docker path structure..." -ForegroundColor Yellow
$expectedPath = Join-Path $DockerPath "wsl\DockerDesktopWSL\data"
if (Test-Path $expectedPath) {
    Write-Host "✅ Found Docker data at: $expectedPath" -ForegroundColor Green
    
    # List contents
    Write-Host ""
    Write-Host "Contents:" -ForegroundColor Cyan
    Get-ChildItem -Path $expectedPath -Recurse -Depth 2 | Select-Object FullName, Length | Format-Table -AutoSize
} else {
    Write-Host "⚠️  Expected path not found: $expectedPath" -ForegroundColor Yellow
    Write-Host "This is normal if Docker Desktop hasn't been configured yet." -ForegroundColor Yellow
}

# Check .wslconfig
Write-Host ""
Write-Host "📋 Checking .wslconfig..." -ForegroundColor Yellow
$wslConfigPath = "$env:USERPROFILE\.wslconfig"
if (Test-Path $wslConfigPath) {
    Write-Host "✅ Found .wslconfig at: $wslConfigPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current content:" -ForegroundColor Cyan
    Get-Content $wslConfigPath
} else {
    Write-Host "⚠️  .wslconfig not found. Creating template..." -ForegroundColor Yellow
    
    $wslConfigContent = @"
[wsl2]
# Memory limit (adjust based on your system)
memory=4GB

# CPU cores (adjust based on your system)
processors=2

# Swap file location
swap=$($DockerPath.Replace('\', '\\'))\\wsl\\swap.vhdx

# Page reporting (better performance)
pageReporting=true

# VM idle timeout
vmIdleTimeout=60000
"@
    
    $wslConfigContent | Out-File -FilePath $wslConfigPath -Encoding UTF8
    Write-Host "✅ Created .wslconfig at: $wslConfigPath" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Configuration Check Complete" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open Docker Desktop" -ForegroundColor White
Write-Host "2. Go to Settings → Resources → Advanced" -ForegroundColor White
Write-Host "3. Set 'Disk image location' to: $DockerPath" -ForegroundColor White
Write-Host "4. Click 'Apply & Restart'" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: DOCKER_WINDOWS_CONFIG.md" -ForegroundColor Cyan
Write-Host ""

