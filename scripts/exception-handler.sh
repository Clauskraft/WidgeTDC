#!/bin/bash

# WidgetTDC Exception Handler
# Trap-based error handling with 4-action recovery model
# Inspired by Bash Infinity framework and YAML Workflow Engine
# Usage: source exception-handler.sh [--strict] [--cascade] [--recover-config <file>]

set -o pipefail

# ========== CONFIGURATION ==========

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STATE_FILE="$PROJECT_ROOT/.claude/agent-state.json"
RECOVERY_CONFIG="$PROJECT_ROOT/agents/error-recovery.yml"
DIAGNOSTICS_DIR="$PROJECT_ROOT/.claude/diagnostics"

# Execution context
CURRENT_BLOCK="${BLOCK_NUMBER:-unknown}"
CURRENT_AGENT="${AGENT_NAME:-unknown}"
CALL_STACK=()
ERROR_COUNT=0
MAX_RETRIES=3
RETRY_COUNT=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ========== TRAP SETUP (Bash Infinity pattern) ==========

# Main error trap - catches all errors
trap 'handle_error $? $LINENO "$BASH_COMMAND"' ERR

# Exit trap - cleanup on exit
trap 'handle_exit' EXIT

# Interrupt trap - graceful shutdown on Ctrl+C
trap 'handle_interrupt' INT TERM

# ========== CORE ERROR HANDLING ==========

handle_error() {
  local exit_code=$1
  local line_number=$2
  local command=$3

  # Don't handle errors if we're already in error handling
  if [[ "${IN_ERROR_HANDLER:-0}" == "1" ]]; then
    return
  fi

  export IN_ERROR_HANDLER=1

  ((ERROR_COUNT++))

  # Capture error context
  local error_context=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "block": $CURRENT_BLOCK,
  "agent": "$CURRENT_AGENT",
  "exit_code": $exit_code,
  "line": $line_number,
  "command": "$command",
  "error_count": $ERROR_COUNT,
  "call_stack": $(printf '%s\n' "${CALL_STACK[@]}" | jq -R . | jq -s .)
}
EOF
  )

  # Determine error type and recovery action
  local error_type=$(classify_error "$command" "$exit_code")
  local recovery_action=$(get_recovery_action "$error_type")

  # Log the error
  log_error "$error_type" "$error_context" "$recovery_action"

  # Execute recovery action
  case "$recovery_action" in
    retry)
      execute_retry "$command" "$error_type"
      ;;
    continue)
      execute_continue "$error_type"
      ;;
    next)
      execute_next "$error_type"
      ;;
    fail)
      execute_fail "$error_type" "$error_context"
      ;;
    *)
      execute_fail "UNKNOWN_RECOVERY_ACTION" "$error_context"
      ;;
  esac

  unset IN_ERROR_HANDLER
}

handle_interrupt() {
  log_warning "Cascade interrupted by user"
  update_state "interrupted"
  exit 130
}

handle_exit() {
  if [[ $? -eq 0 && ${ERROR_COUNT:-0} -eq 0 ]]; then
    return 0
  fi

  # Cleanup on exit
  if [[ ${ERROR_COUNT:-0} -gt 0 ]]; then
    log_error_summary
  fi
}

# ========== ERROR CLASSIFICATION ==========

classify_error() {
  local command=$1
  local exit_code=$2

  # Pattern matching for error classification
  if [[ "$command" =~ github|gh|git ]]; then
    if [[ $exit_code -eq 401 ]]; then
      echo "github_auth_failure"
    elif [[ $exit_code -eq 403 ]]; then
      echo "github_permission_denied"
    else
      echo "git_error"
    fi
  elif [[ "$command" =~ yarn|npm ]]; then
    echo "dependency_error"
  elif [[ "$command" =~ curl|wget ]]; then
    echo "network_error"
  elif [[ "$command" =~ yamllint|jsonschema ]]; then
    echo "validation_error"
  elif [[ $exit_code -eq 124 ]]; then
    echo "timeout_exceeded"
  elif [[ $exit_code -eq 127 ]]; then
    echo "command_not_found"
  elif [[ $exit_code -eq 130 ]]; then
    echo "interrupted"
  else
    echo "unknown_error"
  fi
}

# ========== RECOVERY ACTION LOOKUP ==========

get_recovery_action() {
  local error_type=$1

  # Query recovery config for action
  if command -v yq &>/dev/null; then
    yq eval ".strategies.$error_type.action" "$RECOVERY_CONFIG" 2>/dev/null || echo "fail"
  else
    # Fallback: simple grep-based lookup
    grep -A 5 "^  $error_type:" "$RECOVERY_CONFIG" | grep "action:" | sed 's/.*action: //' | head -1 || echo "fail"
  fi
}

get_max_attempts() {
  local error_type=$1

  if command -v yq &>/dev/null; then
    yq eval ".strategies.$error_type.max_attempts" "$RECOVERY_CONFIG" 2>/dev/null || echo "0"
  else
    grep -A 5 "^  $error_type:" "$RECOVERY_CONFIG" | grep "max_attempts:" | sed 's/.*max_attempts: //' | head -1 || echo "0"
  fi
}

get_backoff_config() {
  local error_type=$1

  if command -v yq &>/dev/null; then
    yq eval ".strategies.$error_type.backoff" "$RECOVERY_CONFIG" 2>/dev/null
  fi
}

# ========== RECOVERY EXECUTION (4-Action Model) ==========

execute_retry() {
  local command=$1
  local error_type=$2

  local max_attempts=$(get_max_attempts "$error_type")
  ((RETRY_COUNT++))

  if [[ $RETRY_COUNT -gt $max_attempts ]]; then
    log_error "Max retries ($max_attempts) exceeded for $error_type"
    execute_fail "$error_type" ""
    return 1
  fi

  # Calculate backoff delay
  local delay=$(calculate_backoff "$error_type" "$RETRY_COUNT")

  log_warning "Retry $RETRY_COUNT/$max_attempts for '$command' (waiting ${delay}s)"
  sleep "$delay"

  # Re-execute the command
  eval "$command"
}

execute_continue() {
  local error_type=$1

  log_warning "Continuing despite error: $error_type"
  # Don't fail - just log and continue execution
}

execute_next() {
  local error_type=$1

  log_warning "Executing cleanup for: $error_type"

  # Perform cleanup actions
  if command -v yq &>/dev/null; then
    local cleanup_actions=$(yq eval ".strategies.$error_type.cleanup_actions[]" "$RECOVERY_CONFIG" 2>/dev/null)
    while IFS= read -r action; do
      [[ -z "$action" ]] && continue
      log_info "Executing cleanup: $action"
      eval "$action" 2>/dev/null || true
    done <<< "$cleanup_actions"
  fi

  # Then retry or continue based on config
  local after_cleanup=$(yq eval ".strategies.$error_type.after_cleanup" "$RECOVERY_CONFIG" 2>/dev/null || echo "retry")
  if [[ "$after_cleanup" == "retry" ]]; then
    RETRY_COUNT=0  # Reset retry counter after cleanup
    return 1  # Let ERR trap handle retry
  fi
}

execute_fail() {
  local error_type=$1
  local error_context=$2

  log_error "FATAL: $error_type - cascade cannot continue"

  # Update state file with error
  update_state_error "$error_type" "$error_context"

  # Collect diagnostics
  collect_diagnostics "$error_type"

  # Escalate if configured
  if [[ "${AUTO_ESCALATE:-true}" == "true" ]]; then
    escalate_error "$error_type"
  fi

  # Exit with error
  exit 1
}

# ========== BACKOFF CALCULATION ==========

calculate_backoff() {
  local error_type=$1
  local attempt=$2

  if ! command -v yq &>/dev/null; then
    # Simple exponential backoff: 1, 2, 4, 8, 16
    echo $((2 ** (attempt - 1)))
    return
  fi

  local backoff_type=$(yq eval ".strategies.$error_type.backoff.type" "$RECOVERY_CONFIG" 2>/dev/null)
  local initial_delay=$(yq eval ".strategies.$error_type.backoff.initial_delay" "$RECOVERY_CONFIG" 2>/dev/null)
  local multiplier=$(yq eval ".strategies.$error_type.backoff.multiplier" "$RECOVERY_CONFIG" 2>/dev/null)
  local max_delay=$(yq eval ".strategies.$error_type.backoff.max_delay" "$RECOVERY_CONFIG" 2>/dev/null)

  local delay=0
  case "$backoff_type" in
    exponential)
      delay=$((initial_delay * (multiplier ** (attempt - 1))))
      ;;
    linear)
      delay=$((initial_delay * attempt))
      ;;
    *)
      delay=$initial_delay
      ;;
  esac

  # Cap at max delay
  if [[ $delay -gt $max_delay ]]; then
    delay=$max_delay
  fi

  echo "$delay"
}

# ========== STATE MANAGEMENT ==========

update_state() {
  local status=$1

  if [[ ! -f "$STATE_FILE" ]]; then
    return
  fi

  if command -v jq &>/dev/null; then
    jq --arg status "$status" \
       --arg cascade_id "$CURRENT_BLOCK" \
       '.cascade.status = $status | .cascade.last_error_time = now' \
       "$STATE_FILE" > "$STATE_FILE.tmp" && \
       mv "$STATE_FILE.tmp" "$STATE_FILE"
  fi
}

update_state_error() {
  local error_type=$1
  local error_context=$2

  if [[ ! -f "$STATE_FILE" ]]; then
    return
  fi

  if command -v jq &>/dev/null; then
    jq \
      --arg error_type "$error_type" \
      --arg error_context "$error_context" \
      '.errors += [{
        "timestamp": now,
        "type": $error_type,
        "context": ($error_context | fromjson),
        "status": "unresolved"
      }]' \
      "$STATE_FILE" > "$STATE_FILE.tmp" && \
      mv "$STATE_FILE.tmp" "$STATE_FILE"
  fi
}

# ========== DIAGNOSTICS ==========

collect_diagnostics() {
  local error_type=$1

  mkdir -p "$DIAGNOSTICS_DIR"

  local diag_file="$DIAGNOSTICS_DIR/$(date +%s)_${error_type}.json"

  cat > "$diag_file" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "error_type": "$error_type",
  "block": $CURRENT_BLOCK,
  "agent": "$CURRENT_AGENT",
  "system_info": {
    "disk_free_gb": $(df -h . | tail -1 | awk '{print $4}'),
    "memory_free_mb": $(free -m | awk 'NR==2 {print $7}'),
    "cpu_count": $(nproc),
    "uptime": "$(uptime -p)"
  },
  "github_status": {
    "gh_available": $(command -v gh &>/dev/null && echo "true" || echo "false"),
    "git_user": "$(git config user.name 2>/dev/null || echo 'not configured')",
    "github_token_set": $([[ -n "$GITHUB_TOKEN" ]] && echo "true" || echo "false")
  },
  "environment": {
    "bash_version": "$BASH_VERSION",
    "pwd": "$(pwd)",
    "home": "$HOME"
  }
}
EOF

  log_info "Diagnostics saved: $diag_file"
}

# ========== LOGGING ==========

log_error() {
  local error_type=$1
  local context=$2
  local recovery=$3

  echo -e "${RED}❌ ERROR [Block $CURRENT_BLOCK]${NC} $error_type"
  [[ -n "$recovery" ]] && echo -e "${YELLOW}   Recovery: $recovery${NC}"

  # Also log to state file
  if [[ -n "$context" && -f "$STATE_FILE" ]]; then
    update_state_error "$error_type" "$context"
  fi
}

log_warning() {
  local msg=$1
  echo -e "${YELLOW}⚠️  WARNING${NC} $msg"
}

log_info() {
  local msg=$1
  echo -e "${BLUE}ℹ️  INFO${NC} $msg"
}

log_success() {
  local msg=$1
  echo -e "${GREEN}✅ SUCCESS${NC} $msg"
}

log_error_summary() {
  echo ""
  echo -e "${RED}═══ ERROR SUMMARY ═══${NC}"
  echo "Total Errors: $ERROR_COUNT"
  echo "Total Retries: $RETRY_COUNT"
  if [[ -d "$DIAGNOSTICS_DIR" ]]; then
    echo "Diagnostics saved to: $DIAGNOSTICS_DIR"
  fi
  echo ""
}

# ========== ERROR ESCALATION ==========

escalate_error() {
  local error_type=$1

  if [[ ${ERROR_COUNT} -ge 3 ]]; then
    log_error "Multiple errors detected - escalating"

    # Send alert (stub for integration)
    if command -v mail &>/dev/null; then
      echo "Cascade failed with: $error_type" | \
        mail -s "WidgetTDC Cascade Error" "${ADMIN_EMAIL:-admin@example.com}" 2>/dev/null || true
    fi
  fi
}

# ========== PUBLIC API ==========

# Allow scripts to check error state
get_error_count() {
  echo $ERROR_COUNT
}

get_retry_count() {
  echo $RETRY_COUNT
}

reset_error_state() {
  ERROR_COUNT=0
  RETRY_COUNT=0
}

# Export functions for use in sourced context
export -f handle_error
export -f classify_error
export -f get_recovery_action
export -f calculate_backoff
export -f log_error
export -f log_warning
export -f log_info

echo -e "${GREEN}✅${NC} Exception handler loaded for Block $CURRENT_BLOCK ($CURRENT_AGENT)"
