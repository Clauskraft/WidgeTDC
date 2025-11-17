#!/bin/bash

# WidgetTDC Agent CLI - Query and manage cascade state
# Usage: ./agent-cli.sh <command> [options]
# Commands:
#   agents list          - List all agents
#   agents show <id>     - Show agent details
#   cascade status       - Show cascade status
#   blocks status        - Show all block statuses
#   block <number>       - Show block details
#   validate             - Run pre-execution validation
#   errors               - Show all errors
#   timeline             - Show audit trail timeline
#   help                 - Show this help message

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REGISTRY_FILE="$PROJECT_ROOT/agents/registry.yml"
STATE_FILE="$PROJECT_ROOT/.claude/agent-state.json"
VALIDATOR_SCRIPT="$SCRIPT_DIR/validate-cascade.sh"

# ========== UTILITY FUNCTIONS ==========

info_msg() {
  echo -e "${BLUE}ℹ️ ${NC}$1"
}

success_msg() {
  echo -e "${GREEN}✅${NC} $1"
}

warn_msg() {
  echo -e "${YELLOW}⚠️ ${NC}$1"
}

error_msg() {
  echo -e "${RED}❌${NC} $1"
}

# Check if jq is available
check_jq() {
  if ! command -v jq &> /dev/null; then
    error_msg "jq is required but not installed"
    echo "Install: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
  fi
}

# Check if yq is available
check_yq() {
  if ! command -v yq &> /dev/null; then
    warn_msg "yq is not installed - YAML parsing limited"
    echo "Install: brew install yq (macOS) or pip install yq (Python)"
    return 1
  fi
  return 0
}

# ========== AGENTS COMMANDS ==========

agents_list() {
  info_msg "Listing all agents from registry..."
  echo ""

  if [ ! -f "$REGISTRY_FILE" ]; then
    error_msg "Registry file not found: $REGISTRY_FILE"
    return 1
  fi

  # Try yq first, fallback to simple grep
  if check_yq; then
    yq eval '.agents[] | "\(.id) | \(.name) | Block \(.block_number) | \(.story_points)pts"' "$REGISTRY_FILE" | while read -r line; do
      if [ -n "$line" ]; then
        IFS='|' read -r id name block_info points <<< "$line"
        printf "${CYAN}%-25s${NC} ${GREEN}%-25s${NC} ${BLUE}%-15s${NC} ${YELLOW}%s${NC}\n" \
          "$(echo $id | xargs)" "$(echo $name | xargs)" "$(echo $block_info | xargs)" "$(echo $points | xargs)"
      fi
    done
  else
    # Fallback: simple grep parsing
    grep -E "^  - id:" "$REGISTRY_FILE" | sed 's/.*id: //' | sed 's/ *$//' | while read -r agent_id; do
      name=$(grep -A 1 "id: $agent_id" "$REGISTRY_FILE" | grep "name:" | sed 's/.*name: //' | sed 's/ *$//')
      block=$(grep -A 3 "id: $agent_id" "$REGISTRY_FILE" | grep "block_number:" | sed 's/.*block_number: //' | sed 's/ *$//')
      printf "${CYAN}%-25s${NC} ${GREEN}%-25s${NC} ${BLUE}Block %s${NC}\n" "$agent_id" "$name" "$block"
    done
  fi

  echo ""
  success_msg "Use 'agents show <id>' for details"
}

agents_show() {
  local agent_id=$1

  if [ -z "$agent_id" ]; then
    error_msg "Agent ID required: agents show <id>"
    return 1
  fi

  check_yq || {
    error_msg "yq required for detailed agent info"
    return 1
  }

  info_msg "Showing details for agent: $agent_id"
  echo ""

  yq eval ".agents[] | select(.id == \"$agent_id\")" "$REGISTRY_FILE"
}

# ========== CASCADE COMMANDS ==========

cascade_status() {
  info_msg "Cascade Status"
  echo ""

  if [ ! -f "$STATE_FILE" ]; then
    warn_msg "State file not found - cascade not yet executed"
    return 0
  fi

  check_jq

  # Extract cascade-level data
  cascade_id=$(jq -r '.cascade.id' "$STATE_FILE")
  status=$(jq -r '.cascade.status' "$STATE_FILE")
  total_blocks=$(jq -r '.cascade.total_blocks' "$STATE_FILE")
  completed=$(jq -r '.cascade.completed_blocks' "$STATE_FILE")
  total_points=$(jq -r '.cascade.total_story_points' "$STATE_FILE")
  completed_points=$(jq -r '.cascade.completed_story_points' "$STATE_FILE")

  # Format status with color
  case "$status" in
    completed)
      status_color="${GREEN}completed${NC}"
      ;;
    in_progress)
      status_color="${YELLOW}in_progress${NC}"
      ;;
    failed)
      status_color="${RED}failed${NC}"
      ;;
    *)
      status_color="$status"
      ;;
  esac

  echo -e "Cascade ID:        ${CYAN}$cascade_id${NC}"
  echo -e "Status:            $status_color"
  echo -e "Blocks:            ${BLUE}$completed${NC}/${CYAN}$total_blocks${NC} completed"
  echo -e "Story Points:      ${BLUE}$completed_points${NC}/${CYAN}$total_points${NC} points"

  if [ "$completed" == "$total_blocks" ]; then
    success_msg "Cascade fully completed"
  else
    warn_msg "Cascade in progress - $((total_blocks - completed)) blocks remaining"
  fi

  echo ""
}

blocks_status() {
  info_msg "Block Status Summary"
  echo ""

  if [ ! -f "$STATE_FILE" ]; then
    warn_msg "State file not found - cascade not yet executed"
    return 0
  fi

  check_jq

  echo -e "${BLUE}#${NC}  ${CYAN}Agent${NC}                    ${GREEN}Status${NC}      ${YELLOW}PR${NC}    ${BLUE}Points${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  jq -r '.blocks | to_entries[] | "\(.key) \(.value.agent_name) \(.value.status) \(.value.pr_number) \(.value.outputs.files_created) \(.value.outputs.loc)"' "$STATE_FILE" | \
  while read -r block_num agent_name status pr_num files loc; do
    # Format status with color
    case "$status" in
      merged)
        status_color="${GREEN}merged${NC}"
        ;;
      in_review)
        status_color="${YELLOW}in_review${NC}"
        ;;
      in_progress)
        status_color="${BLUE}running${NC}"
        ;;
      failed)
        status_color="${RED}failed${NC}"
        ;;
      *)
        status_color="$status"
        ;;
    esac

    # Get story points from registry
    story_points=$(yq eval ".agents[] | select(.block_number == $block_num) | .story_points" "$REGISTRY_FILE" 2>/dev/null || echo "?")

    printf "%s  %-24s %b %-6s %s\n" \
      "$block_num" \
      "$agent_name" \
      "$status_color" \
      "#$pr_num" \
      "${story_points}pts"
  done

  echo ""
}

block_show() {
  local block_num=$1

  if [ -z "$block_num" ]; then
    error_msg "Block number required: block <number>"
    return 1
  fi

  if [ ! -f "$STATE_FILE" ]; then
    error_msg "State file not found - cascade not yet executed"
    return 1
  fi

  check_jq

  info_msg "Block $block_num Details"
  echo ""

  # Get block data
  block_data=$(jq ".blocks.\"$block_num\"" "$STATE_FILE" 2>/dev/null)

  if [ "$block_data" == "null" ]; then
    error_msg "Block $block_num not found in state file"
    return 1
  fi

  agent_id=$(echo "$block_data" | jq -r '.agent_id')
  agent_name=$(echo "$block_data" | jq -r '.agent_name')
  status=$(echo "$block_data" | jq -r '.status')
  pr_num=$(echo "$block_data" | jq -r '.pr_number')
  branch=$(echo "$block_data" | jq -r '.branch')
  completion_time=$(echo "$block_data" | jq -r '.completion_time')
  files_created=$(echo "$block_data" | jq -r '.outputs.files_created')
  loc=$(echo "$block_data" | jq -r '.outputs.loc')

  echo -e "Agent:             ${CYAN}$agent_name${NC} (ID: $agent_id)"
  echo -e "Status:            ${GREEN}$status${NC}"
  echo -e "PR:                #$pr_num"
  echo -e "Branch:            $branch"
  echo -e "Completion Time:   $completion_time"
  echo -e "Files Created:     $files_created"
  echo -e "Lines of Code:     $loc"

  echo ""
}

# ========== VALIDATION COMMANDS ==========

validate_cascade() {
  info_msg "Running cascade validation..."
  echo ""

  if [ ! -f "$VALIDATOR_SCRIPT" ]; then
    error_msg "Validator script not found: $VALIDATOR_SCRIPT"
    return 1
  fi

  bash "$VALIDATOR_SCRIPT"
}

# ========== ERROR COMMANDS ==========

show_errors() {
  info_msg "Cascade Errors"
  echo ""

  if [ ! -f "$STATE_FILE" ]; then
    warn_msg "State file not found - no errors recorded yet"
    return 0
  fi

  check_jq

  error_count=$(jq '.errors | length' "$STATE_FILE")

  if [ "$error_count" -eq 0 ]; then
    success_msg "No errors recorded"
    return 0
  fi

  echo -e "${RED}$error_count Errors Found:${NC}"
  echo ""

  jq -r '.errors[] |
    "Block \(.block)\n" +
    "  Step: \(.step)\n" +
    "  Type: \(.error_type)\n" +
    "  Message: \(.message)\n" +
    "  Resolution: \(.resolution)\n" +
    "  Status: \(.status)\n"' "$STATE_FILE"
}

# ========== TIMELINE COMMANDS ==========

show_timeline() {
  info_msg "Audit Trail Timeline"
  echo ""

  if [ ! -f "$STATE_FILE" ]; then
    warn_msg "State file not found - no timeline available"
    return 0
  fi

  check_jq

  echo -e "${BLUE}Time${NC}                    ${CYAN}Block${NC}  ${GREEN}Action${NC}        ${YELLOW}Status${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  jq -r '.audit_trail[] | "\(.timestamp) \(.block) \(.action) \(.status)"' "$STATE_FILE" | \
  while read -r timestamp block action status; do
    # Format status with color
    case "$status" in
      success)
        status_color="${GREEN}success${NC}"
        ;;
      failed)
        status_color="${RED}failed${NC}"
        ;;
      *)
        status_color="$status"
        ;;
    esac

    # Format timestamp to be more readable
    timestamp_short=$(echo "$timestamp" | cut -d'T' -f2 | cut -d'Z' -f1)

    printf "%-23s %s  %-12s %b\n" \
      "$timestamp_short" \
      "B$block" \
      "$action" \
      "$status_color"
  done

  echo ""
}

# ========== HELP ==========

show_help() {
  cat << 'EOF'
WidgetTDC Agent CLI - Query and manage cascade orchestration

USAGE:
  ./agent-cli.sh <command> [options]

COMMANDS:

Agent Management:
  agents list              List all agents in registry
  agents show <id>         Show detailed agent information

Cascade Monitoring:
  cascade status           Show overall cascade status
  blocks status            Show all block statuses
  block <number>           Show specific block details

Validation:
  validate                 Run pre-execution validation

Diagnostics:
  errors                   Show all recorded errors
  timeline                 Show audit trail timeline

Utility:
  help                     Show this help message

EXAMPLES:
  ./agent-cli.sh agents list
  ./agent-cli.sh agents show dashboard-shell-ui
  ./agent-cli.sh cascade status
  ./agent-cli.sh block 1
  ./agent-cli.sh validate
  ./agent-cli.sh errors
  ./agent-cli.sh timeline

DEPENDENCIES:
  - jq        (JSON query tool) - Required
  - yq        (YAML query tool) - Optional (some features limited without)
  - bash 4.0+

INSTALL DEPENDENCIES:
  macOS:  brew install jq yq
  Linux:  apt-get install jq yq

For complete cascade context, see: .claude/cascade-context.md
EOF
}

# ========== MAIN ENTRY POINT ==========

main() {
  # Show help if no arguments
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi

  local command=$1
  shift || true

  case "$command" in
    # Agent commands
    agents)
      if [ $# -eq 0 ]; then
        error_msg "agents command requires subcommand: list or show"
        exit 1
      fi
      subcommand=$1
      shift || true
      case "$subcommand" in
        list)
          agents_list
          ;;
        show)
          agents_show "$@"
          ;;
        *)
          error_msg "Unknown agents subcommand: $subcommand"
          exit 1
          ;;
      esac
      ;;

    # Cascade commands
    cascade)
      cascade_status
      ;;

    blocks)
      blocks_status
      ;;

    block)
      block_show "$@"
      ;;

    # Validation
    validate)
      validate_cascade
      ;;

    # Diagnostics
    errors)
      show_errors
      ;;

    timeline)
      show_timeline
      ;;

    # Help
    help|--help|-h)
      show_help
      ;;

    # Unknown
    *)
      error_msg "Unknown command: $command"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

main "$@"
