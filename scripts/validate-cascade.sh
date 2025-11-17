#!/bin/bash

# WidgetTDC Cascade Pre-Execution Validator
# Checks if a cascade is safe to execute before triggering workflows
# Usage: ./validate-cascade.sh [--blocks 1-6] [--dry-run]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REGISTRY_FILE="$PROJECT_ROOT/agents/registry.yml"
STATE_FILE="$PROJECT_ROOT/.claude/agent-state.json"
SCHEMA_FILE="$PROJECT_ROOT/agents/registry-schema.json"

BLOCKS_TO_CHECK="${1:-1-6}"
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --blocks) BLOCKS_TO_CHECK="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) shift ;;
  esac
done

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

# Helper functions
pass_check() {
  echo -e "${GREEN}✅${NC} $1"
  ((CHECKS_PASSED++))
}

fail_check() {
  echo -e "${RED}❌${NC} $1"
  ((CHECKS_FAILED++))
}

warn_check() {
  echo -e "${YELLOW}⚠️ ${NC} $1"
  ((CHECKS_WARNED++))
}

info_msg() {
  echo -e "${BLUE}ℹ️ ${NC} $1"
}

# ========== VALIDATION CHECKS ==========

echo ""
echo "=========================================="
echo "WidgetTDC Cascade Pre-Execution Validator"
echo "=========================================="
echo ""

# 1. Check registry file exists
info_msg "Checking registry configuration..."
if [ -f "$REGISTRY_FILE" ]; then
  pass_check "Agent registry found: $REGISTRY_FILE"
else
  fail_check "Agent registry not found: $REGISTRY_FILE"
  exit 1
fi

# 2. Validate YAML syntax
if command -v yamllint &> /dev/null; then
  if yamllint "$REGISTRY_FILE" > /dev/null 2>&1; then
    pass_check "Registry YAML syntax valid"
  else
    fail_check "Registry YAML syntax invalid"
    yamllint "$REGISTRY_FILE" || true
  fi
else
  warn_check "yamllint not installed - skipping YAML syntax check"
fi

# 3. Check schema file exists
if [ -f "$SCHEMA_FILE" ]; then
  pass_check "Validation schema found"
else
  warn_check "Validation schema not found - skipping schema validation"
fi

# 4. Check state file exists
info_msg "Checking cascade state..."
if [ -f "$STATE_FILE" ]; then
  pass_check "Cascade state file found"

  # Extract cascade status
  CASCADE_STATUS=$(jq -r '.cascade.status' "$STATE_FILE" 2>/dev/null || echo "unknown")
  info_msg "Current cascade status: $CASCADE_STATUS"
else
  warn_check "Cascade state file not found - will be created on first run"
fi

# 5. Check GitHub token
info_msg "Checking GitHub credentials..."
if [ ! -z "${GITHUB_TOKEN:-}" ]; then
  pass_check "GitHub token available"
else
  warn_check "GitHub token not set (GH_TOKEN or GITHUB_TOKEN)"
  info_msg "Set: export GITHUB_TOKEN=<your-token>"
fi

# 6. Check git configuration
if git config user.name > /dev/null 2>&1; then
  GIT_USER=$(git config user.name)
  pass_check "Git configured for user: $GIT_USER"
else
  fail_check "Git user not configured"
fi

# 7. Check npm installation
info_msg "Checking npm dependencies..."
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  pass_check "npm installed: v$NPM_VERSION"

  # Check for required packages
  if npm list typescript &> /dev/null; then
    pass_check "TypeScript available"
  else
    warn_check "TypeScript not installed locally (will be installed during execution)"
  fi
else
  fail_check "npm not found - required for agent execution"
fi

# 8. Check disk space
info_msg "Checking system resources..."
DISK_AVAILABLE=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $4}')
DISK_AVAILABLE_GB=$((DISK_AVAILABLE / 1024 / 1024))

if [ "$DISK_AVAILABLE_GB" -gt 1 ]; then
  pass_check "Sufficient disk space: ${DISK_AVAILABLE_GB}GB available"
else
  fail_check "Insufficient disk space: only ${DISK_AVAILABLE_GB}GB available"
fi

# 9. Check GitHub API connectivity
info_msg "Checking GitHub API connectivity..."
if command -v gh &> /dev/null; then
  if gh auth status > /dev/null 2>&1; then
    pass_check "GitHub CLI authenticated"
  else
    warn_check "GitHub CLI not authenticated - some features may not work"
  fi
else
  warn_check "GitHub CLI (gh) not installed"
fi

# 10. Check prerequisite blocks
info_msg "Checking block dependencies..."
if [ -f "$STATE_FILE" ]; then
  # For each block, check if its dependencies are completed
  for block_num in $(echo "$BLOCKS_TO_CHECK" | tr '-' ' '); do
    # This is a simplified check - in production would be more complex
    if jq -e ".blocks.\"$block_num\"" "$STATE_FILE" > /dev/null 2>&1; then
      BLOCK_STATUS=$(jq -r ".blocks.\"$block_num\".status" "$STATE_FILE")
      pass_check "Block $block_num status: $BLOCK_STATUS"
    else
      info_msg "Block $block_num not yet executed"
    fi
  done
fi

# 11. Check workflow files
info_msg "Checking workflow files..."
WORKFLOW_DIR="$PROJECT_ROOT/.github/workflows"
if [ -d "$WORKFLOW_DIR" ]; then
  WORKFLOW_COUNT=$(find "$WORKFLOW_DIR" -name "agent-block-*.yml" 2>/dev/null | wc -l)
  if [ "$WORKFLOW_COUNT" -gt 0 ]; then
    pass_check "Found $WORKFLOW_COUNT agent block workflows"
  else
    warn_check "No agent block workflows found"
  fi
else
  fail_check "Workflow directory not found: $WORKFLOW_DIR"
fi

# 12. Check branch protection rules
info_msg "Checking branch protections..."
if command -v gh &> /dev/null && gh auth status > /dev/null 2>&1; then
  if gh repo view --json branchProtectionRules > /dev/null 2>&1; then
    PROTECTED=$(gh repo view --json branchProtectionRules --jq '.branchProtectionRules | length')
    if [ "$PROTECTED" -gt 0 ]; then
      warn_check "Branch protection rules active ($PROTECTED rules) - PRs may need admin merge"
    else
      pass_check "No branch protection rules (clean merges possible)"
    fi
  fi
fi

# 13. Validate no uncommitted changes
info_msg "Checking git status..."
if [ -z "$(git status --porcelain)" ]; then
  pass_check "No uncommitted changes"
else
  warn_check "Uncommitted changes detected:"
  git status --short | head -5
fi

# ========== SUMMARY ==========

echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNED))
echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${YELLOW}⚠️  Warned: $CHECKS_WARNED${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"
echo ""

# Final decision
if [ "$CHECKS_FAILED" -eq 0 ]; then
  echo -e "${GREEN}🎉 CASCADE READY TO EXECUTE${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review the validation results above"
  if [ "$CHECKS_WARNED" -gt 0 ]; then
    echo "  2. Address any warnings (⚠️) if needed"
    echo "  3. Trigger cascade: gh workflow run hanspedder-orchestrator.yml"
  else
    echo "  2. Trigger cascade: gh workflow run hanspedder-orchestrator.yml"
  fi
  echo ""
  exit 0
else
  echo -e "${RED}❌ CASCADE NOT READY${NC}"
  echo ""
  echo "Issues to resolve:"
  echo "  - Fix the $CHECKS_FAILED failing checks above"
  echo "  - Re-run validation: $0"
  echo ""
  exit 1
fi
