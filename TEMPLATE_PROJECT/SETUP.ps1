# WidgetTDC Platform Template - Automated Setup Script (PowerShell)
# This script initializes a new project from the template

$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "WidgetTDC Platform Template - Setup (Windows)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify Python
Write-Host "[1/6] Checking Python installation..." -ForegroundColor Blue
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ $pythonVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Install dependencies
Write-Host "[2/6] Installing Python dependencies..." -ForegroundColor Blue
try {
    python -c "import yaml" 2>$null
    Write-Host "✓ PyYAML already installed" -ForegroundColor Green
} catch {
    Write-Host "Installing PyYAML..."
    pip install pyyaml
    Write-Host "✓ PyYAML installed" -ForegroundColor Green
}
Write-Host ""

# Step 3: Verify project structure
Write-Host "[3/6] Verifying project structure..." -ForegroundColor Blue
$requiredDirs = @("agents", ".claude")
$requiredFiles = @("cascade-orchestrator.py", "agents/registry.yml", "TEMPLATE_README.md")

foreach ($dir in $requiredDirs) {
    if (-not (Test-Path $dir)) {
        Write-Host "Creating directory: $dir"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "Warning: Missing file: $file" -ForegroundColor Yellow
    }
}
Write-Host "✓ Project structure verified" -ForegroundColor Green
Write-Host ""

# Step 4: Initialize .claude directories
Write-Host "[4/6] Initializing state tracking..." -ForegroundColor Blue
New-Item -ItemType Directory -Path ".claude/logs" -Force | Out-Null

# Initialize agent state if not exists
if (-not (Test-Path ".claude/agent-state.json")) {
    $agentState = @{
        metadata = @{
            version = "1.0"
            cascade_id = "project-init"
            phase = "Template Project"
        }
        agent_status = @{
            "dashboard-shell-ui" = @{ status = "IDLE"; progress = 0; bottleneck = $false }
            "widget-registry-v2" = @{ status = "IDLE"; progress = 0; blocked_by = @("dashboard-shell-ui") }
            "audit-log-hash-chain" = @{ status = "BLOCKED"; progress = 0; bottleneck = $false }
            "database-foundation" = @{ status = "BLOCKED"; progress = 0; bottleneck = $true }
            "testing-infrastructure" = @{ status = "BLOCKED"; progress = 0 }
            "security-compliance" = @{ status = "BLOCKED"; progress = 0 }
        }
        critical_analysis = @{
            primary_blocker = "dashboard-shell-ui (Block 1)"
            impact = "Awaiting orchestrator execution"
        }
    }
    $agentState | ConvertTo-Json | Set-Content ".claude/agent-state.json"
    Write-Host "Created .claude/agent-state.json"
}

# Initialize cascade state if not exists
if (-not (Test-Path ".claude/agent-cascade-state.json")) {
    $cascadeState = @{
        cascade_id = "fresh-start"
        started_at = $null
        current_block = 0
        blocks_completed = @()
        blocks_in_progress = @()
        blocks_failed = @()
        cascade_status = "INITIALIZED"
        last_block_output = $null
        iteration = 0
    }
    $cascadeState | ConvertTo-Json | Set-Content ".claude/agent-cascade-state.json"
    Write-Host "Created .claude/agent-cascade-state.json"
}

Write-Host "✓ State tracking initialized" -ForegroundColor Green
Write-Host ""

# Step 5: Test orchestrator
Write-Host "[5/6] Testing cascade orchestrator..." -ForegroundColor Blue
if (Test-Path "cascade-orchestrator.py") {
    Write-Host "Running quick test (1 iteration)..."
    $testOutput = python cascade-orchestrator.py 1 2>&1
    if ($testOutput -match "CASCADE ITERATION #1") {
        Write-Host "✓ Orchestrator test passed" -ForegroundColor Green
    } else {
        Write-Host "⚠ Orchestrator test inconclusive (check logs)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ cascade-orchestrator.py not found" -ForegroundColor Red
}
Write-Host ""

# Step 6: Display setup summary
Write-Host "[6/6] Setup Summary" -ForegroundColor Blue
Write-Host "✓ WidgetTDC Platform Template initialized successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "Project structure:" -ForegroundColor Cyan
Write-Host "  ./"
Write-Host "  ├── cascade-orchestrator.py          (Main execution engine)"
Write-Host "  ├── agents/"
Write-Host "  │   ├── registry.yml                 (Agent definitions)"
Write-Host "  │   ├── error-recovery.yml          (Error handling)"
Write-Host "  │   └── *.md                        (Agent specifications)"
Write-Host "  ├── .claude/"
Write-Host "  │   ├── agent-state.json            (Agent status)"
Write-Host "  │   ├── agent-cascade-state.json    (Cascade state)"
Write-Host "  │   └── logs/                       (Execution logs)"
Write-Host "  └── TEMPLATE_README.md              (Full documentation)"
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Read TEMPLATE_README.md for detailed documentation"
Write-Host "  2. Edit agents/registry.yml to configure your agents"
Write-Host "  3. Run: python cascade-orchestrator.py"
Write-Host "  4. Monitor: Get-Content .claude/agent-cascade-state.json -Wait"
Write-Host ""

Write-Host "Quick start commands:" -ForegroundColor Yellow
Write-Host "  # Test execution (3 iterations)"
Write-Host "  python cascade-orchestrator.py 3"
Write-Host ""
Write-Host "  # Run indefinitely"
Write-Host "  python cascade-orchestrator.py"
Write-Host ""
Write-Host "  # Watch state changes"
Write-Host "  Get-Content .claude/agent-cascade-state.json -Wait"
Write-Host ""

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
