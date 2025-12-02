<#
.SYNOPSIS
    Switch between development and production environments
.DESCRIPTION
    Copies the appropriate .env file to .env and apps/backend/.env
.EXAMPLE
    ./switch-env.ps1 local
    ./switch-env.ps1 production
    ./switch-env.ps1 status
#>

param(
    [Parameter(Position=0)]
    [ValidateSet("local", "production", "status", "help")]
    [string]$Environment = "status"
)

$root = $PSScriptRoot
$backendDir = Join-Path $root "apps\backend"

function Write-ColorLine($text, $color) {
    Write-Host $text -ForegroundColor $color
}

function Show-Status {
    Write-Host ""
    Write-ColorLine "========================================" "Cyan"
    Write-ColorLine "  WIDGETTDC ENVIRONMENT STATUS" "Cyan"
    Write-ColorLine "========================================" "Cyan"
    Write-Host ""

    # Check root .env
    $rootEnv = Join-Path $root ".env"
    if (Test-Path $rootEnv) {
        $content = Get-Content $rootEnv -Raw
        if ($content -match "NODE_ENV=development") {
            Write-ColorLine "  Root .env:     LOCAL (development)" "Green"
        } elseif ($content -match "NODE_ENV=production") {
            Write-ColorLine "  Root .env:     PRODUCTION" "Red"
        } else {
            Write-ColorLine "  Root .env:     Unknown" "Yellow"
        }
    } else {
        Write-ColorLine "  Root .env:     NOT SET" "Yellow"
    }

    # Check backend .env
    $backendEnv = Join-Path $backendDir ".env"
    if (Test-Path $backendEnv) {
        $content = Get-Content $backendEnv -Raw
        if ($content -match "bolt://localhost") {
            Write-ColorLine "  Backend .env:  LOCAL (Docker)" "Green"
        } elseif ($content -match "neo4j\+s://") {
            Write-ColorLine "  Backend .env:  PRODUCTION (AuraDB)" "Red"
        } else {
            Write-ColorLine "  Backend .env:  Custom" "Yellow"
        }
    } else {
        Write-ColorLine "  Backend .env:  NOT SET" "Yellow"
    }

    Write-Host ""
    Write-ColorLine "Commands:" "White"
    Write-Host "  ./switch-env.ps1 local       - Switch to LOCAL development"
    Write-Host "  ./switch-env.ps1 production  - Switch to PRODUCTION"
    Write-Host "  ./switch-env.ps1 status      - Show this status"
    Write-Host ""
}

function Switch-ToLocal {
    Write-Host ""
    Write-ColorLine "========================================" "Green"
    Write-ColorLine "  SWITCHING TO LOCAL DEVELOPMENT" "Green"
    Write-ColorLine "========================================" "Green"
    Write-Host ""

    $source = Join-Path $root ".env.local"

    if (-not (Test-Path $source)) {
        Write-ColorLine "ERROR: .env.local not found!" "Red"
        return
    }

    # Copy to root
    Copy-Item $source (Join-Path $root ".env") -Force
    Write-ColorLine "  [OK] Copied to .env" "Green"

    # Copy to backend
    Copy-Item $source (Join-Path $backendDir ".env") -Force
    Write-ColorLine "  [OK] Copied to apps/backend/.env" "Green"

    Write-Host ""
    Write-ColorLine "  LOCAL environment is now ACTIVE" "Green"
    Write-ColorLine "  Using: Docker databases (localhost)" "White"
    Write-Host ""
    Write-Host "  Start with: npm run dev"
    Write-Host ""
}

function Switch-ToProduction {
    Write-Host ""
    Write-ColorLine "========================================" "Red"
    Write-ColorLine "  SWITCHING TO PRODUCTION" "Red"
    Write-ColorLine "========================================" "Red"
    Write-Host ""

    $source = Join-Path $root ".env.production"

    if (-not (Test-Path $source)) {
        Write-ColorLine "ERROR: .env.production not found!" "Red"
        Write-Host ""
        Write-Host "Create it by copying the template:"
        Write-Host "  Copy-Item .env.production.template .env.production"
        Write-Host "  Then edit .env.production with your real secrets"
        Write-Host ""
        return
    }

    # Safety check
    Write-ColorLine "  WARNING: You are switching to PRODUCTION!" "Yellow"
    Write-Host ""
    $confirm = Read-Host "  Type 'yes' to confirm"

    if ($confirm -ne "yes") {
        Write-ColorLine "  Cancelled." "Yellow"
        return
    }

    # Copy to root
    Copy-Item $source (Join-Path $root ".env") -Force
    Write-ColorLine "  [OK] Copied to .env" "Green"

    # Copy to backend
    Copy-Item $source (Join-Path $backendDir ".env") -Force
    Write-ColorLine "  [OK] Copied to apps/backend/.env" "Green"

    Write-Host ""
    Write-ColorLine "  PRODUCTION environment is now ACTIVE" "Red"
    Write-ColorLine "  Using: Cloud databases (AuraDB, etc)" "White"
    Write-Host ""
}

# Main
switch ($Environment) {
    "local" { Switch-ToLocal }
    "production" { Switch-ToProduction }
    "status" { Show-Status }
    "help" { Show-Status }
}
