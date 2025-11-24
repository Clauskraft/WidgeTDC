#!/bin/bash
# Setup cron job for 15-minute agent monitoring

CRON_JOB="*/15 * * * * cd /workspace && ./scripts/monitor-agents.sh >> .claude/logs/cron-monitor.log 2>&1"
CRON_FILE="/tmp/widgettdc-cron"

# Create the cron job entry
echo "$CRON_JOB" > "$CRON_FILE"

# Add to crontab if not already present
if ! crontab -l | grep -q "monitor-agents.sh"; then
    crontab -l 2>/dev/null | cat - "$CRON_FILE" | crontab -
    echo "Cron job added for 15-minute agent monitoring"
else
    echo "Cron job already exists for agent monitoring"
fi

# Show current crontab
echo "Current crontab:"
crontab -l

# Test the monitor script
echo "Testing monitor script..."
./scripts/monitor-agents.sh

echo "15-minute monitoring setup complete"