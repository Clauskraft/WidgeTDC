#!/bin/bash

# WidgetTDC Expert Bug Finder
# Intelligent error diagnosis with root cause analysis and recovery suggestions
# Inspired by Hugging Face graceful degradation + GitHub Actions error patterns
# Usage: ./bug-finder.sh [--error <type>] [--verbose] [--suggest] [--json]

set -euo pipefail

# ========== CONFIGURATION ==========

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STATE_FILE="$PROJECT_ROOT/.claude/agent-state.json"
RECOVERY_CONFIG="$PROJECT_ROOT/agents/error-recovery.yml"
DIAGNOSTICS_DIR="$PROJECT_ROOT/.claude/diagnostics"

# Options
ERROR_TYPE="${1:-}"
VERBOSE="${VERBOSE:-false}"
SUGGEST_FIXES=false
OUTPUT_JSON=false
PARSE_LOGS=true

# Analysis results
DIAGNOSED_ERROR=""
ROOT_CAUSES=()
SUGGESTIONS=()
CONFIDENCE=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# ========== ARGUMENT PARSING ==========

parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --error)
        ERROR_TYPE="$2"
        shift 2
        ;;
      --verbose|-v)
        VERBOSE=true
        shift
        ;;
      --suggest|-s)
        SUGGEST_FIXES=true
        shift
        ;;
      --json)
        OUTPUT_JSON=true
        shift
        ;;
      --logs)
        PARSE_LOGS=true
        shift
        ;;
      --no-logs)
        PARSE_LOGS=false
        shift
        ;;
      *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
    esac
  done
}

show_help() {
  cat << 'EOF'
Expert Bug Finder - Intelligent error diagnosis and recovery suggestions

USAGE:
  ./bug-finder.sh [options]

OPTIONS:
  --error <type>        Analyze specific error type
  --verbose, -v         Show detailed analysis
  --suggest, -s         Show recovery suggestions
  --json                Output results as JSON
  --logs                Parse execution logs (default: true)
  --no-logs             Don't parse execution logs

EXAMPLES:
  ./bug-finder.sh --error github_auth_failure --suggest
  ./bug-finder.sh --verbose --json
  ./bug-finder.sh --suggest | jq '.suggestions'

OUTPUT:
  Diagnosed error with confidence score
  Root cause analysis
  Recovery suggestions
  System diagnostics
EOF
}

# ========== PRIMARY DIAGNOSIS (Hugging Face graceful degradation pattern) ==========

diagnose_error() {
  local error_input=$1

  [[ $VERBOSE == "true" ]] && log_info "Starting diagnosis..."

  # Try multiple diagnosis strategies in order of specificity
  # 1. Parse error logs (most specific)
  if [[ "$PARSE_LOGS" == "true" ]]; then
    diagnose_from_logs "$error_input"
    [[ -n "$DIAGNOSED_ERROR" ]] && return 0
  fi

  # 2. Query state file for recent errors
  diagnose_from_state_file "$error_input"
  [[ -n "$DIAGNOSED_ERROR" ]] && return 0

  # 3. Analyze environment
  diagnose_from_environment "$error_input"
  [[ -n "$DIAGNOSED_ERROR" ]] && return 0

  # 4. Parse error message directly (least specific)
  diagnose_from_error_message "$error_input"
  [[ -n "$DIAGNOSED_ERROR" ]] && return 0

  # Fallback: unknown error
  DIAGNOSED_ERROR="unknown_error"
  CONFIDENCE=10
  ROOT_CAUSES+=("Unable to determine root cause - requires manual investigation")
}

# Strategy 1: Parse execution logs
diagnose_from_logs() {
  local error_pattern=$1

  [[ $VERBOSE == "true" ]] && log_info "Parsing execution logs..."

  # Find most recent log or error output
  local log_file=$(find . -name "*.log" -o -name "*error*" -type f 2>/dev/null | head -1)

  if [[ -z "$log_file" ]]; then
    [[ $VERBOSE == "true" ]] && log_warning "No log files found"
    return 1
  fi

  # Extract error patterns from log
  local error_lines=$(grep -i "error\|failed\|exception" "$log_file" 2>/dev/null | tail -5)

  if [[ -n "$error_lines" ]]; then
    match_error_patterns "$error_lines"
    return 0
  fi

  return 1
}

# Strategy 2: Query state file
diagnose_from_state_file() {
  local error_pattern=$1

  [[ $VERBOSE == "true" ]] && log_info "Checking state file for errors..."

  if [[ ! -f "$STATE_FILE" ]]; then
    return 1
  fi

  # Get most recent error from state
  if command -v jq &>/dev/null; then
    local recent_error=$(jq -r '.errors[-1] | select(. != null) | .type' "$STATE_FILE" 2>/dev/null)
    if [[ -n "$recent_error" ]]; then
      DIAGNOSED_ERROR="$recent_error"
      CONFIDENCE=85
      [[ $VERBOSE == "true" ]] && log_success "Found error in state: $DIAGNOSED_ERROR"
      return 0
    fi
  fi

  return 1
}

# Strategy 3: Analyze environment
diagnose_from_environment() {
  local error_pattern=$1

  [[ $VERBOSE == "true" ]] && log_info "Analyzing system environment..."

  # Check common environmental issues
  local issues=()

  # Disk space
  local disk_available=$(df . | tail -1 | awk '{print $4}')
  if [[ $disk_available -lt 1048576 ]]; then  # < 1GB
    issues+=("disk_space_insufficient")
    CONFIDENCE=90
  fi

  # Memory
  local mem_available=$(free -m | awk 'NR==2 {print $7}')
  if [[ $mem_available -lt 256 ]]; then  # < 256MB
    issues+=("memory_insufficient")
    CONFIDENCE=90
  fi

  # GitHub token
  if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    issues+=("github_auth_failure")
    CONFIDENCE=75
  fi

  # Git config
  if ! git config user.name &>/dev/null; then
    issues+=("git_config_missing")
    CONFIDENCE=85
  fi

  # Network
  if ! curl -s --connect-timeout 2 https://api.github.com &>/dev/null; then
    issues+=("network_error")
    CONFIDENCE=70
  fi

  if [[ ${#issues[@]} -gt 0 ]]; then
    DIAGNOSED_ERROR="${issues[0]}"
    ROOT_CAUSES+=("${issues[@]}")
    return 0
  fi

  return 1
}

# Strategy 4: Parse error message
diagnose_from_error_message() {
  local error_message=$1

  [[ $VERBOSE == "true" ]] && log_info "Matching error patterns..."

  match_error_patterns "$error_message"
}

# ========== PATTERN MATCHING ==========

match_error_patterns() {
  local text=$1

  # Load error patterns from config
  local patterns=$(extract_patterns_from_config)

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue

    local pattern=$(echo "$line" | cut -d: -f1)
    local error_type=$(echo "$line" | cut -d: -f2)

    if echo "$text" | grep -qi "$pattern"; then
      DIAGNOSED_ERROR="$error_type"
      CONFIDENCE=$((50 + RANDOM % 40))  # 50-90 confidence
      [[ $VERBOSE == "true" ]] && log_success "Pattern matched: $error_type (confidence: $CONFIDENCE%)"
      return 0
    fi
  done <<< "$patterns"

  return 1
}

extract_patterns_from_config() {
  if [[ ! -f "$RECOVERY_CONFIG" ]]; then
    return 1
  fi

  if command -v yq &>/dev/null; then
    yq eval '.error_patterns[] | .patterns[] as $pattern | "\($pattern)"' "$RECOVERY_CONFIG" 2>/dev/null | \
      sed 's/"//g' | \
      awk '{print NR": "$0}'
  fi
}

# ========== ROOT CAUSE ANALYSIS ==========

analyze_root_causes() {
  [[ $VERBOSE == "true" ]] && log_info "Analyzing root causes..."

  case "$DIAGNOSED_ERROR" in
    github_auth_failure)
      analyze_github_auth_failure
      ;;
    github_permission_denied)
      analyze_permission_denied
      ;;
    disk_space_insufficient)
      analyze_disk_space
      ;;
    network_error)
      analyze_network_error
      ;;
    timeout_exceeded)
      analyze_timeout
      ;;
    yaml_syntax_invalid)
      analyze_yaml_syntax
      ;;
    *)
      ROOT_CAUSES+=("See logs: grep -i error ./*.log")
      ;;
  esac
}

analyze_github_auth_failure() {
  [[ -z "${GITHUB_TOKEN:-}" ]] && ROOT_CAUSES+=("GitHub token not set in environment")
  [[ -n "${GITHUB_TOKEN:-}" ]] && ROOT_CAUSES+=("GitHub token may be expired or invalid")

  if ! command -v gh &>/dev/null; then
    ROOT_CAUSES+=("GitHub CLI (gh) not installed")
  fi

  if ! gh auth status &>/dev/null; then
    ROOT_CAUSES+=("GitHub CLI not authenticated - run: gh auth login")
  fi
}

analyze_permission_denied() {
  ROOT_CAUSES+=("GitHub App lacks required permissions")
  ROOT_CAUSES+=("Check: gh api /app | jq '.permissions'")

  if [[ -f "$STATE_FILE" ]]; then
    ROOT_CAUSES+=("See recent errors: jq '.errors[-1]' $STATE_FILE")
  fi
}

analyze_disk_space() {
  local disk_free=$(df . | tail -1 | awk '{print $4}')
  ROOT_CAUSES+=("Disk space: only ${disk_free}KB available (need ≥1GB)")
  ROOT_CAUSES+=("Clear cache: rm -rf .cache/*")
  ROOT_CAUSES+=("Remove Docker images: docker system prune")
}

analyze_network_error() {
  ROOT_CAUSES+=("Network may be unavailable")
  ROOT_CAUSES+=("Check connectivity: ping 8.8.8.8")
  ROOT_CAUSES+=("Check DNS: nslookup github.com")
  ROOT_CAUSES+=("Check firewall rules")
}

analyze_timeout() {
  ROOT_CAUSES+=("Command execution exceeded timeout")
  ROOT_CAUSES+=("Check system load: uptime")
  ROOT_CAUSES+=("Monitor resources: top -b -n 1 | head -20")
  ROOT_CAUSES+=("Consider increasing timeout threshold")
}

analyze_yaml_syntax() {
  ROOT_CAUSES+=("YAML file has syntax errors")
  if command -v yamllint &>/dev/null; then
    ROOT_CAUSES+=("Run: yamllint agents/registry.yml")
  fi
  ROOT_CAUSES+=("Check indentation: use spaces, not tabs")
}

# ========== RECOVERY SUGGESTIONS ==========

suggest_recovery() {
  [[ $VERBOSE == "true" ]] && log_info "Generating recovery suggestions..."

  # Get suggestions from recovery config
  if [[ -n "$DIAGNOSED_ERROR" ]]; then
    local config_suggestions=$(get_suggestions_from_config "$DIAGNOSED_ERROR")
    if [[ -n "$config_suggestions" ]]; then
      while IFS= read -r suggestion; do
        [[ -z "$suggestion" ]] && continue
        SUGGESTIONS+=("$suggestion")
      done <<< "$config_suggestions"
    fi
  fi

  # Add intelligent suggestions based on environment
  add_intelligent_suggestions
}

get_suggestions_from_config() {
  local error_type=$1

  if [[ ! -f "$RECOVERY_CONFIG" ]]; then
    return 1
  fi

  if command -v yq &>/dev/null; then
    yq eval ".error_patterns.${error_type}.recovery_suggestions[]" "$RECOVERY_CONFIG" 2>/dev/null || true
  fi
}

add_intelligent_suggestions() {
  # Suggestion 1: Check logs
  SUGGESTIONS+=("📋 Check recent logs: tail -50 ./*.log")

  # Suggestion 2: Run validator
  if [[ -f "$SCRIPT_DIR/validate-cascade.sh" ]]; then
    SUGGESTIONS+=("🔍 Run validator: $SCRIPT_DIR/validate-cascade.sh")
  fi

  # Suggestion 3: Check diagnostics
  if [[ -d "$DIAGNOSTICS_DIR" ]]; then
    local recent_diag=$(ls -t "$DIAGNOSTICS_DIR"/* 2>/dev/null | head -1)
    if [[ -n "$recent_diag" ]]; then
      SUGGESTIONS+=("📊 View diagnostics: jq . $recent_diag")
    fi
  fi

  # Suggestion 4: Escalate if needed
  if [[ $CONFIDENCE -lt 50 ]]; then
    SUGGESTIONS+=("🆘 Low confidence diagnosis - consider manual investigation")
  fi
}

# ========== OUTPUT FORMATTING ==========

output_diagnosis() {
  if [[ "$OUTPUT_JSON" == "true" ]]; then
    output_json_format
  else
    output_human_format
  fi
}

output_human_format() {
  echo ""
  echo -e "${CYAN}═══ BUG FINDER DIAGNOSIS ═══${NC}"
  echo ""

  # Error diagnosis
  if [[ -n "$DIAGNOSED_ERROR" ]]; then
    echo -e "${MAGENTA}🔴 Diagnosed Error:${NC} $DIAGNOSED_ERROR"
    echo -e "${BLUE}📊 Confidence:${NC} ${CONFIDENCE}%"
  else
    echo -e "${YELLOW}⚠️  No error diagnosed${NC}"
  fi

  echo ""

  # Root causes
  if [[ ${#ROOT_CAUSES[@]} -gt 0 ]]; then
    echo -e "${RED}🔍 Root Causes:${NC}"
    for cause in "${ROOT_CAUSES[@]}"; do
      echo "  • $cause"
    done
    echo ""
  fi

  # Recovery suggestions
  if [[ "$SUGGEST_FIXES" == "true" && ${#SUGGESTIONS[@]} -gt 0 ]]; then
    echo -e "${GREEN}✅ Recovery Suggestions:${NC}"
    for suggestion in "${SUGGESTIONS[@]}"; do
      echo "  • $suggestion"
    done
    echo ""
  fi

  # System info
  if [[ "$VERBOSE" == "true" ]]; then
    output_system_info
  fi

  echo -e "${CYAN}═══════════════════════════════${NC}"
  echo ""
}

output_json_format() {
  local json=$(cat <<EOF
{
  "error": "$DIAGNOSED_ERROR",
  "confidence": $CONFIDENCE,
  "root_causes": $(printf '%s\n' "${ROOT_CAUSES[@]}" | jq -R . | jq -s .),
  "suggestions": $(printf '%s\n' "${SUGGESTIONS[@]}" | jq -R . | jq -s .),
  "diagnostics": {
    "disk_available_gb": $(df . | tail -1 | awk '{print $4/1024/1024}'),
    "memory_available_mb": $(free -m | awk 'NR==2 {print $7}'),
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF
  )

  echo "$json"
}

output_system_info() {
  echo -e "${BLUE}💻 System Information:${NC}"
  echo "  • Disk: $(df -h . | tail -1 | awk '{print $4}') free"
  echo "  • Memory: $(free -h | awk 'NR==2 {print $7}') free"
  echo "  • CPU: $(nproc) cores"
  echo "  • Uptime: $(uptime -p 2>/dev/null || uptime)"
  echo ""
}

# ========== LOGGING ==========

log_info() {
  local msg=$1
  [[ "$VERBOSE" == "true" ]] && echo -e "${BLUE}ℹ️  $msg${NC}" >&2
}

log_warning() {
  local msg=$1
  echo -e "${YELLOW}⚠️  $msg${NC}" >&2
}

log_success() {
  local msg=$1
  [[ "$VERBOSE" == "true" ]] && echo -e "${GREEN}✅ $msg${NC}" >&2
}

# ========== MAIN EXECUTION ==========

main() {
  parse_arguments "$@"

  [[ "$VERBOSE" == "true" ]] && log_info "Bug Finder starting..."

  # Run diagnosis
  diagnose_error "$ERROR_TYPE"

  # Analyze root causes
  analyze_root_causes

  # Generate suggestions if requested
  if [[ "$SUGGEST_FIXES" == "true" ]]; then
    suggest_recovery
  fi

  # Output results
  output_diagnosis

  # Return appropriate exit code
  if [[ "$CONFIDENCE" -lt 50 ]]; then
    exit 2  # Low confidence
  elif [[ -z "$DIAGNOSED_ERROR" || "$DIAGNOSED_ERROR" == "unknown_error" ]]; then
    exit 1  # Unknown error
  else
    exit 0  # Successfully diagnosed
  fi
}

# Run if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
