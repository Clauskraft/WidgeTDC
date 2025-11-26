# WidgeTDC Monorepo Scaffolder
# Usage: .\scaffold-new-project.ps1 -ProjectName "MyNewApp"

param (
    [string]$ProjectName = "NewMonorepo"
)

Write-Host "🏗️  Initializing WidgeTDC Monorepo Structure for: $ProjectName" -ForegroundColor Cyan

# 1. Create Directories
$dirs = @(
    "apps\backend\src",
    "apps\frontend\src",
    "packages\domain-types",
    "docs\architecture",
    "docs\status",
    "scripts"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "   + Created $dir"
}

# 2. Create Root Configuration
$packageJson = @{
    name       = $ProjectName.ToLower()
    private    = $true
    workspaces = @("apps/*", "packages/*")
    scripts    = @{
        dev = "concurrently \"npm run dev:backend\" \"npm run dev:frontend\""
    }
}

$packageJson | ConvertTo-Json -Depth 4 | Set-Content "package.json"
Write-Host "   + Created root package.json (Monorepo configured)"

# 3. Create Guardrails Documentation
$guardrails = "# Project Guardrails`n`nThis project follows the WidgeTDC Monorepo Standard.`n`n- NO code in root.`n- Use apps/ for applications.`n- Use packages/ for shared code."
Set-Content "docs\GUARDRAILS.md" $guardrails
Write-Host "   + Created docs\GUARDRAILS.md"

# 4. Initialize Git
if (-not (Test-Path ".git")) {
    git init | Out-Null
    Write-Host "   + Initialized Git repository"
}

# 5. Create .gitignore
$gitignore = "node_modules`ndist`n.env`n.DS_Store"
Set-Content ".gitignore" $gitignore

Write-Host "`n✅ Project Scaffolding Complete!" -ForegroundColor Green
Write-Host "   You can now open this folder in Cursor."
Write-Host "   The Global Git Guardrails will automatically protect this repo because 'workspaces' is detected in package.json."
