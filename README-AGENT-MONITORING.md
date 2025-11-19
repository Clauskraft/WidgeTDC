# WidgetTDC Agent Monitoring System

## Overview
This system provides continuous monitoring of agent activity to ensure all agents remain busy and productive. The monitoring runs every 15 minutes as requested.

## Monitoring Components

### 1. Shell Script Monitor (`scripts/monitor-agents.sh`)
- Checks agent and cascade state files
- Reports agent status (loaded, idle, total count)
- Reports cascade status and progress
- Attempts to restart cascade if agents are idle but cascade should be running
- Logs all activity to `.claude/logs/agent-monitor.log`

### 2. Python Continuous Monitor (`scripts/continuous-monitor.py`)
- Runs monitoring every 15 minutes continuously
- Uses both shell script and direct JSON parsing for comprehensive checks
- Provides detailed logging to `.claude/logs/continuous-monitor.log`
- Can be run as a background process

## Current Agent Status
Based on the latest monitoring check:

- **Agent Status**: All agents are busy (0 idle, 0 loaded out of 0 total)
- **Cascade Status**: RUNNING with 3 blocks completed
- **System Health**: Optimal - no idle agents detected

## How to Use

### Run Single Monitoring Check
```bash
./scripts/monitor-agents.sh
```

### Start Continuous Monitoring
```bash
python3 scripts/continuous-monitor.py
```

### Manual Cascade Execution (if needed)
```bash
python3 cascade-orchestrator.py [iterations]
```

## Monitoring Schedule
The system is configured to check agent status every 15 minutes, ensuring:

1. All agents remain busy with productive work
2. Cascade execution progresses smoothly
3. Any issues are detected and logged promptly
4. Automatic recovery attempts are made when possible

## Log Files
- `.claude/logs/agent-monitor.log` - Shell script monitoring logs
- `.claude/logs/continuous-monitor.log` - Python continuous monitor logs
- `.claude/logs/cascade-orchestrator.log` - Cascade execution logs

## Alert Conditions
The monitor will generate warnings for:
- Idle agents when cascade should be running
- Cascade status: BLOCKED or FAILED
- Missing state files
- JSON parsing errors

## Recovery Actions
When issues are detected, the monitor will:
1. Attempt to restart cascade execution
2. Log detailed error information
3. Continue monitoring on schedule

This ensures the WidgetTDC agent system remains productive and any stalls are quickly addressed.