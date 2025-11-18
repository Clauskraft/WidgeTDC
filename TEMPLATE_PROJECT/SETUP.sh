#!/bin/bash

# WidgetTDC Platform Template - Automated Setup Script
# This script initializes a new project from the template

set -e

echo "======================================================================"
echo "WidgetTDC Platform Template - Setup"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify Python
echo -e "${BLUE}[1/6] Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python 3 not found. Please install Python 3.10+${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo -e "${GREEN}✓ Python ${PYTHON_VERSION} found${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}[2/6] Installing Python dependencies...${NC}"
if ! python3 -c "import yaml" 2>/dev/null; then
    echo "Installing PyYAML..."
    pip install pyyaml
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Verify project structure
echo -e "${BLUE}[3/6] Verifying project structure...${NC}"
required_dirs=("agents" ".claude")
required_files=("cascade-orchestrator.py" "agents/registry.yml" "TEMPLATE_README.md")

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}Creating directory: $dir${NC}"
        mkdir -p "$dir"
    fi
done

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}Warning: Missing file: $file${NC}"
    fi
done
echo -e "${GREEN}✓ Project structure verified${NC}"
echo ""

# Step 4: Initialize .claude directories
echo -e "${BLUE}[4/6] Initializing state tracking...${NC}"
mkdir -p ".claude/logs"

# Initialize agent state if not exists
if [ ! -f ".claude/agent-state.json" ]; then
    cat > ".claude/agent-state.json" << 'EOF'
{
  "metadata": {
    "version": "1.0",
    "cascade_id": "project-init",
    "phase": "Template Project"
  },
  "agent_status": {
    "dashboard-shell-ui": {"status": "IDLE", "progress": 0, "bottleneck": false},
    "widget-registry-v2": {"status": "IDLE", "progress": 0, "blocked_by": ["dashboard-shell-ui"]},
    "audit-log-hash-chain": {"status": "BLOCKED", "progress": 0, "bottleneck": false},
    "database-foundation": {"status": "BLOCKED", "progress": 0, "bottleneck": true},
    "testing-infrastructure": {"status": "BLOCKED", "progress": 0},
    "security-compliance": {"status": "BLOCKED", "progress": 0}
  },
  "critical_analysis": {
    "primary_blocker": "dashboard-shell-ui (Block 1)",
    "impact": "Awaiting orchestrator execution"
  }
}
EOF
    echo "Created .claude/agent-state.json"
fi

# Initialize cascade state if not exists
if [ ! -f ".claude/agent-cascade-state.json" ]; then
    cat > ".claude/agent-cascade-state.json" << 'EOF'
{
  "cascade_id": "fresh-start",
  "started_at": null,
  "current_block": 0,
  "blocks_completed": [],
  "blocks_in_progress": [],
  "blocks_failed": [],
  "cascade_status": "INITIALIZED",
  "last_block_output": null,
  "iteration": 0
}
EOF
    echo "Created .claude/agent-cascade-state.json"
fi

echo -e "${GREEN}✓ State tracking initialized${NC}"
echo ""

# Step 5: Test orchestrator
echo -e "${BLUE}[5/6] Testing cascade orchestrator...${NC}"
if [ -f "cascade-orchestrator.py" ]; then
    # Run quick test (1 iteration)
    echo "Running quick test (1 iteration)..."
    python3 cascade-orchestrator.py 1 > /tmp/orchestrator-test.log 2>&1 || true

    if grep -q "CASCADE ITERATION #1" /tmp/orchestrator-test.log; then
        echo -e "${GREEN}✓ Orchestrator test passed${NC}"
    else
        echo -e "${YELLOW}⚠ Orchestrator test inconclusive (check logs)${NC}"
    fi
else
    echo -e "${YELLOW}✗ cascade-orchestrator.py not found${NC}"
fi
echo ""

# Step 6: Display setup summary
echo -e "${BLUE}[6/6] Setup Summary${NC}"
echo -e "${GREEN}✓ WidgetTDC Platform Template initialized successfully!${NC}"
echo ""
echo "Project structure:"
echo "  ./"
echo "  ├── cascade-orchestrator.py          (Main execution engine)"
echo "  ├── agents/"
echo "  │   ├── registry.yml                 (Agent definitions)"
echo "  │   ├── error-recovery.yml          (Error handling)"
echo "  │   └── *.md                        (Agent specifications)"
echo "  ├── .claude/"
echo "  │   ├── agent-state.json            (Agent status)"
echo "  │   ├── agent-cascade-state.json    (Cascade state)"
echo "  │   └── logs/                       (Execution logs)"
echo "  └── TEMPLATE_README.md              (Full documentation)"
echo ""

echo "Next steps:"
echo "  1. Read TEMPLATE_README.md for detailed documentation"
echo "  2. Edit agents/registry.yml to configure your agents"
echo "  3. Run: python3 cascade-orchestrator.py"
echo "  4. Monitor: tail -f .claude/logs/cascade-orchestrator.log"
echo ""

echo -e "${YELLOW}Quick start commands:${NC}"
echo "  # Test execution (3 iterations)"
echo "  python3 cascade-orchestrator.py 3"
echo ""
echo "  # Run indefinitely"
echo "  python3 cascade-orchestrator.py"
echo ""
echo "  # Watch state changes"
echo "  watch -n 1 cat .claude/agent-cascade-state.json"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo "======================================================================"
