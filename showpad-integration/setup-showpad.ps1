# TDC Showpad Integration - Automatisk Setup
# Konfigurerer sikker connection til TDC Showpad instance

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TDC SHOWPAD INTEGRATION SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = "C:\Users\claus\Projects\WidgeTDC"
$IntegrationDir = "$ProjectRoot\showpad-integration"
$EnvFile = "$IntegrationDir\.env.showpad"
$EnvTemplate = "$IntegrationDir\config\.env.showpad.template"
$CacheDir = "$IntegrationDir\cache"

# Step 1: Verify prerequisites
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version
    Write-Host "  ✓ pnpm installed: v$pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ pnpm not found! Installing..." -ForegroundColor Yellow
    npm install -g pnpm
}

Write-Host "`n[2/6] Creating directory structure..." -ForegroundColor Yellow

# Create directories
$directories = @(
    "$CacheDir\templates",
    "$CacheDir\logos",
    "$CacheDir\brand",
    "$IntegrationDir\backend\services",
    "$IntegrationDir\backend\routes",
    "$IntegrationDir\widgets",
    "$IntegrationDir\config"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✓ Created: $dir" -ForegroundColor Green
    }
}

Write-Host "`n[3/6] Configuring credentials..." -ForegroundColor Yellow

# Check if .env.showpad already exists
if (Test-Path $EnvFile) {
    Write-Host "  ! .env.showpad already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "  Overwrite existing configuration? (y/N)"
    
    if ($overwrite -ne 'y') {
        Write-Host "  → Skipping credential configuration" -ForegroundColor Cyan
        $skipCredentials = $true
    } else {
        $skipCredentials = $false
    }
} else {
    $skipCredentials = $false
}

if (-not $skipCredentials) {
    Write-Host "`n  TDC Showpad Credentials Setup" -ForegroundColor Cyan
    Write-Host "  ────────────────────────────────" -ForegroundColor Cyan
    
    # Showpad subdomain
    $subdomain = Read-Host "  Showpad subdomain (default: tdcerhverv)"
    if ([string]::IsNullOrWhiteSpace($subdomain)) {
        $subdomain = "tdcerhverv"
    }
    
    # Authentication method
    Write-Host "`n  Authentication Method:" -ForegroundColor Cyan
    Write-Host "    1. OAuth 2.0 (Recommended - Most secure)" -ForegroundColor White
    Write-Host "    2. Username/Password (Quick setup)" -ForegroundColor White
    $authMethod = Read-Host "  Select method (1/2)"
    
    if ($authMethod -eq "1") {
        # OAuth setup
        Write-Host "`n  → OAuth 2.0 Configuration" -ForegroundColor Cyan
        Write-Host "    You need to create an OAuth client in Showpad first:" -ForegroundColor Yellow
        Write-Host "    1. Go to https://$subdomain.showpad.biz" -ForegroundColor Yellow
        Write-Host "    2. Admin Settings → Integrations → API" -ForegroundColor Yellow
        Write-Host "    3. Manage OAuth Clients → Add Client" -ForegroundColor Yellow
        Write-Host ""
        
        $clientId = Read-Host "  Client ID"
        $clientSecret = Read-Host "  Client Secret" -AsSecureString
        $clientSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($clientSecret)
        )
        
        $envContent = @"
# TDC Showpad Integration Configuration
# OAuth 2.0 Authentication (Recommended)

SHOWPAD_SUBDOMAIN=$subdomain
SHOWPAD_BASE_URL=https://$subdomain.showpad.biz
SHOWPAD_API_BASE=https://$subdomain.api.showpad.com
SHOWPAD_API_VERSION=v4

# OAuth Credentials
SHOWPAD_CLIENT_ID=$clientId
SHOWPAD_CLIENT_SECRET=$clientSecretPlain

# Cache Configuration
SHOWPAD_CACHE_DIR=./cache
SHOWPAD_CACHE_TTL=86400000
SHOWPAD_AUTO_SYNC=true
SHOWPAD_SYNC_INTERVAL=3600000

# Webhook Configuration (Optional)
SHOWPAD_WEBHOOK_ENABLED=false
SHOWPAD_WEBHOOK_URL=http://localhost:3000/webhooks/showpad
"@
    } else {
        # Username/Password setup
        Write-Host "`n  → Username/Password Configuration" -ForegroundColor Cyan
        
        $username = Read-Host "  Email"
        $password = Read-Host "  Password" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
        )
        
        $envContent = @"
# TDC Showpad Integration Configuration
# Username/Password Authentication

SHOWPAD_SUBDOMAIN=$subdomain
SHOWPAD_BASE_URL=https://$subdomain.showpad.biz
SHOWPAD_API_BASE=https://$subdomain.api.showpad.com
SHOWPAD_API_VERSION=v4

# Credentials
SHOWPAD_USERNAME=$username
SHOWPAD_PASSWORD=$passwordPlain

# Cache Configuration
SHOWPAD_CACHE_DIR=./cache
SHOWPAD_CACHE_TTL=86400000
SHOWPAD_AUTO_SYNC=true
SHOWPAD_SYNC_INTERVAL=3600000

# Webhook Configuration (Optional)
SHOWPAD_WEBHOOK_ENABLED=false
SHOWPAD_WEBHOOK_URL=http://localhost:3000/webhooks/showpad
"@
    }
    
    # Save .env file
    Set-Content -Path $EnvFile -Value $envContent
    Write-Host "  ✓ Credentials saved to .env.showpad" -ForegroundColor Green
    
    # Set restrictive permissions (Windows)
    icacls $EnvFile /inheritance:r /grant:r "$env:USERNAME:(R)" | Out-Null
    Write-Host "  ✓ File permissions set (read-only for current user)" -ForegroundColor Green
}

Write-Host "`n[4/6] Testing Showpad connection..." -ForegroundColor Yellow

# Create test script
$testScript = @"
const { createShowpadAuthFromEnv } = require('./backend/services/showpad-auth');
require('dotenv').config({ path: '.env.showpad' });

async function testConnection() {
    try {
        const auth = createShowpadAuthFromEnv();
        await auth.authenticate();
        console.log('✓ Authentication successful!');
        console.log('✓ Token expires:', new Date(auth.getState().expiresAt));
        return true;
    } catch (error) {
        console.error('✗ Authentication failed:', error.message);
        return false;
    }
}

testConnection().then(success => {
    process.exit(success ? 0 : 1);
});
"@

$testScriptPath = "$IntegrationDir\test-connection.js"
Set-Content -Path $testScriptPath -Value $testScript

# Run test
try {
    cd $IntegrationDir
    $testResult = node $testScriptPath
    Write-Host "  $testResult" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Connection test failed" -ForegroundColor Red
    Write-Host "  → Please check your credentials and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[5/6] Syncing TDC brand assets..." -ForegroundColor Yellow

# Create sync script
$syncScript = @"
const { createShowpadAuthFromEnv } = require('./backend/services/showpad-auth');
const { ShowpadAssetService } = require('./backend/services/showpad-asset-service');
require('dotenv').config({ path: '.env.showpad' });

async function syncAssets() {
    try {
        const auth = createShowpadAuthFromEnv();
        const assets = new ShowpadAssetService(auth);
        
        console.log('Syncing templates...');
        const templates = await assets.getTDCTemplates();
        console.log(\`✓ Found \${templates.length} templates\`);
        
        console.log('Syncing logos...');
        const logos = await assets.getTDCLogos();
        console.log(\`✓ Found \${logos.length} logos\`);
        
        console.log('Downloading essential assets...');
        await assets.syncEssentialAssets();
        
        const stats = assets.getCacheStats();
        console.log(\`✓ Cache: \${stats.count} files, \${(stats.totalSize / 1024 / 1024).toFixed(2)} MB\`);
        
        return true;
    } catch (error) {
        console.error('✗ Sync failed:', error.message);
        return false;
    }
}

syncAssets().then(success => {
    process.exit(success ? 0 : 1);
});
"@

$syncScriptPath = "$IntegrationDir\sync-assets.js"
Set-Content -Path $syncScriptPath -Value $syncScript

try {
    $syncResult = node $syncScriptPath
    Write-Host "  $syncResult" -ForegroundColor Green
} catch {
    Write-Host "  ! Asset sync failed (non-critical)" -ForegroundColor Yellow
    Write-Host "  → You can run sync manually later with: npm run showpad:sync" -ForegroundColor Cyan
}

Write-Host "`n[6/6] Finalizing setup..." -ForegroundColor Yellow

# Add .gitignore entries
$gitignorePath = "$ProjectRoot\.gitignore"
$gitignoreEntries = @"

# Showpad Integration
.env.showpad
.env.showpad.local
showpad-integration/cache/
*.showpad-token
showpad-credentials.json
"@

if (Test-Path $gitignorePath) {
    Add-Content -Path $gitignorePath -Value $gitignoreEntries
    Write-Host "  ✓ Updated .gitignore" -ForegroundColor Green
} else {
    Write-Host "  ! .gitignore not found - please add Showpad files manually" -ForegroundColor Yellow
}

# Create package.json scripts
Write-Host "  ✓ Setup complete!" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETED SUCCESSFULLY! ✓" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test connection:  node showpad-integration/test-connection.js" -ForegroundColor White
Write-Host "  2. Sync assets:      node showpad-integration/sync-assets.js" -ForegroundColor White
Write-Host "  3. View cache stats: npm run showpad:stats" -ForegroundColor White
Write-Host "  4. Integrate with PPT generation pipeline" -ForegroundColor White
Write-Host ""
Write-Host "Security Reminder:" -ForegroundColor Yellow
Write-Host "  • NEVER commit .env.showpad to git" -ForegroundColor Red
Write-Host "  • Rotate credentials every 90 days" -ForegroundColor Yellow
Write-Host "  • Review access logs regularly" -ForegroundColor Yellow
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  • README:   showpad-integration/README.md" -ForegroundColor White
Write-Host "  • Security: showpad-integration/SECURITY.md" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
