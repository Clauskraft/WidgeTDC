#!/bin/bash

# PR Orchestrator - Autonomous GitHub PR Management
# Purpose: Merge PRs to main in priority order with automatic conflict resolution
# Usage: ./pr-orchestrator.sh [--dry-run] [--priority LEVEL]

set -e

# Configuration
DRY_RUN=${1:-""}
PRIORITY_LEVEL="${2:-all}"
LOG_FILE="pr-orchestrator-$(date +%Y%m%d-%H%M%S).log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
  echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
  echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
  echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Priority classification
classify_pr() {
  local title="$1"
  local isDraft="$2"

  if [[ $title == *"security"* ]] || [[ $title == *"exposed"* ]]; then
    echo "1-security"
  elif [[ $title == *"corruption"* ]] || [[ $title == *"duplicate"* ]] || [[ $title == *"merge"* ]]; then
    echo "2-data"
  elif [[ $title == *"conflict"* ]] || [[ $title == *"error"* ]]; then
    echo "3-conflict"
  else
    echo "4-feature"
  fi
}

# Resolve common conflicts
resolve_conflicts() {
  local branch="$1"
  local count=0

  log "Resolving conflicts in $branch..."

  # Fetch latest main
  git fetch origin main

  # Merge main into branch
  if git merge origin/main --no-edit -q 2>/dev/null; then
    success "Auto-merged main into $branch"
    return 0
  fi

  # Handle known conflict patterns
  log "Detecting conflict patterns..."

  # Conflicts in index.ts - prefer main version
  if git diff --name-only --diff-filter=U | grep -q "index.ts"; then
    git checkout --theirs apps/backend/src/index.ts 2>/dev/null && ((count++)) || true
  fi

  # Conflicts in package.json - prefer main version
  if git diff --name-only --diff-filter=U | grep -q "package.json"; then
    git checkout --theirs package.json 2>/dev/null && ((count++)) || true
  fi

  # Conflicts in agent-state.json - prefer main version
  if git diff --name-only --diff-filter=U | grep -q "agent-state.json"; then
    git checkout --theirs .claude/agent-state.json 2>/dev/null && ((count++)) || true
  fi

  # Add all resolved conflicts
  git add -A 2>/dev/null || true

  # Try to complete merge
  if git commit -m "chore: Auto-resolve merge conflicts via orchestrator" --no-edit -q 2>/dev/null; then
    success "Resolved $count conflict(s) in $branch"
    git push origin "$branch" -q
    return 0
  else
    warning "Could not auto-resolve all conflicts in $branch"
    return 1
  fi
}

# Attempt PR merge
merge_pr() {
  local pr_num="$1"
  local priority="$2"

  log "Processing PR #$pr_num (Priority: $priority)..."

  # Get PR details
  local branch=$(gh pr view "$pr_num" --json headRefName --jq '.headRefName')
  local isDraft=$(gh pr view "$pr_num" --json isDraft --jq '.isDraft')

  # Mark ready if draft
  if [ "$isDraft" == "true" ]; then
    if ! gh pr ready "$pr_num" 2>/dev/null; then
      warning "Could not mark PR #$pr_num as ready"
      return 1
    fi
  fi

  # Checkout and attempt merge
  if ! gh pr checkout "$pr_num" -q 2>/dev/null; then
    warning "Could not checkout PR #$pr_num"
    return 1
  fi

  # Try to resolve conflicts
  if ! resolve_conflicts "$branch"; then
    warning "Could not resolve conflicts in PR #$pr_num"
    git checkout main -q 2>/dev/null || true
    return 1
  fi

  # Attempt merge
  if [ -z "$DRY_RUN" ]; then
    if gh pr merge "$pr_num" --squash --delete-branch -q 2>/dev/null; then
      success "Merged PR #$pr_num to main"
      return 0
    else
      warning "Could not merge PR #$pr_num"
      return 1
    fi
  else
    log "[DRY RUN] Would merge PR #$pr_num"
    git checkout main -q 2>/dev/null || true
    return 0
  fi
}

# Main orchestration
main() {
  log "========================================="
  log "PR Orchestrator Started"
  log "Mode: $([ -z "$DRY_RUN" ] && echo 'LIVE' || echo 'DRY RUN')"
  log "========================================="

  # Get all open PRs
  local prs=$(gh pr list --state open --json number,title,isDraft --jq '.[] | "\(.number) \(.title)"')

  if [ -z "$prs" ]; then
    log "No open PRs found"
    return 0
  fi

  # Process PRs by priority
  declare -A pr_queue
  local max_priority=0

  while IFS= read -r line; do
    local pr_num=$(echo "$line" | awk '{print $1}')
    local title=$(echo "$line" | cut -d' ' -f2-)
    local priority=$(classify_pr "$title")
    pr_queue["$priority $pr_num"]="$pr_num"

    # Extract priority level (1-4)
    local level=$(echo "$priority" | cut -d'-' -f1)
    [ "$level" -gt "$max_priority" ] && max_priority="$level"
  done <<< "$prs"

  # Merge in priority order
  local merged_count=0
  local failed_count=0

  for key in $(printf '%s\n' "${!pr_queue[@]}" | sort); do
    local pr_num="${pr_queue[$key]}"

    if merge_pr "$pr_num" "$key"; then
      ((merged_count++))
    else
      ((failed_count++))
    fi
  done

  # Summary
  log "========================================="
  log "Summary:"
  success "Merged: $merged_count PRs"
  if [ "$failed_count" -gt 0 ]; then
    warning "Failed: $failed_count PRs (manual review needed)"
  fi
  log "========================================="

  return $failed_count
}

# Run main function
main
