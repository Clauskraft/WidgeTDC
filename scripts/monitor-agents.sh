#!/bin/bash
# WidgetTDC Agent Monitor - Runs every 15 minutes to ensure all agents are busy

MONITOR_LOG=".claude/logs/agent-monitor.log"
AGENT_STATE=".claude/agent-state.json"
CASCADE_STATE=".claude/agent-cascade-state.json"

# Create log directory
mkdir -p "$(dirname "$MONITOR_LOG")"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%S')] $1" | tee -a "$MONITOR_LOG"
}

check_agent_status() {
    log "=== AGENT MONITOR CHECK STARTED ==="
    
    # Check if state files exist
    if [[ ! -f "$AGENT_STATE" ]]; then
        log "ERROR: Agent state file $AGENT_STATE not found"
        return 1
    fi
    
    if [[ ! -f "$CASCADE_STATE" ]]; then
        log "ERROR: Cascade state file $CASCADE_STATE not found"
        return 1
    fi
    
    # Parse agent state
    idle_count=$(jq -r '.runtime_agents.summary.idle_agents' "$AGENT_STATE" 2>/dev/null || echo "0")
    loaded_count=$(jq -r '.runtime_agents.summary.loaded_agents' "$AGENT_STATE" 2>/dev/null || echo "0")
    total_agents=$(jq -r '.runtime_agents.summary.total_agents' "$AGENT_STATE" 2>/dev/null || echo "0")
    
    # Parse cascade state
    cascade_status=$(jq -r '.cascade_status' "$CASCADE_STATE" 2>/dev/null || echo "UNKNOWN")
    blocks_completed=$(jq -r '.blocks_completed | length' "$CASCADE_STATE" 2>/dev/null || echo "0")
    
    log "Agent Status: $loaded_count loaded, $idle_count idle (out of $total_agents total)"
    log "Cascade Status: $cascade_status with $blocks_completed blocks completed"
    
    # Check if any agents are idle
    if [[ "$idle_count" -gt 0 ]]; then
        log "WARNING: $idle_count agents are idle - checking for available work..."
        
        # Try to restart cascade if agents are idle but cascade should be running
        if [[ "$cascade_status" == "RUNNING" || "$cascade_status" == "INITIALIZED" ]]; then
            log "Attempting to restart cascade execution..."
            python3 cascade-orchestrator.py 1 >> "$MONITOR_LOG" 2>&1
            log "Cascade restart attempted"
        fi
    else
        log "SUCCESS: All agents are busy (workload: $loaded_count/$total_agents)"
    fi
    
    # Check cascade health
    if [[ "$cascade_status" == "BLOCKED" || "$cascade_status" == "FAILED" ]]; then
        log "ALERT: Cascade is $cascade_status - requires intervention"
    elif [[ "$cascade_status" == "COMPLETE" ]]; then
        log "INFO: Cascade completed successfully"
    fi
    
    log "=== AGENT MONITOR CHECK COMPLETED ==="
    echo ""
}

# Main execution
check_agent_status

exit 0