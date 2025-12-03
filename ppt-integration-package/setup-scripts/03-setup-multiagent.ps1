# Setup Script 03: Setup MultiAgentPPT
# Cloner og konfigurerer MultiAgentPPT systemet

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Step 3: Setup MultiAgentPPT" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$projectPath = "C:\Users\claus\Projects"
$multiagentPath = "$projectPath\MultiAgentPPT"

# Clone repository if not exists
if(-not (Test-Path $multiagentPath)) {
    Write-Host "Cloning MultiAgentPPT..." -ForegroundColor Yellow
    cd $projectPath
    git clone https://github.com/johnson7788/MultiAgentPPT.git
} else {
    Write-Host "MultiAgentPPT already cloned. Updating..." -ForegroundColor Yellow
    cd $multiagentPath
    git pull
}

# Setup Python environment
Write-Host "Setting up Python environment..." -ForegroundColor Yellow
cd "$multiagentPath\backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Copy environment templates
Write-Host "Configuring environments..." -ForegroundColor Yellow
$modules = @("simpleOutline", "simplePPT", "slide_outline", "slide_agent")
foreach($module in $modules) {
    if(Test-Path "$module\env_template") {
        Copy-Item "$module\env_template" "$module\.env"
        Write-Host "✅ Created .env for $module" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ MultiAgentPPT setup complete!" -ForegroundColor Green
Write-Host "Don't forget to configure .env files with your API keys!" -ForegroundColor Yellow
Write-Host ""
