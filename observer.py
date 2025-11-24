#!/usr/bin/env python3
"""
HansPedder Observer - Agent Activity Monitor
Tracks agent execution and alerts on inactivity
"""

import json
import time
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, List


class AgentObserver:
    """Observes agent execution and reports status"""

    def __init__(self, check_interval: int = 5):
        """
        Initialize observer

        Args:
            check_interval: How often to check status (seconds)
        """
        self.check_interval = check_interval
        self.last_cascade_state = None
        self.last_check = None
        self.inactivity_threshold = 60  # Alert if no change for 60 seconds
        self.report_file = Path(".claude/logs/agent-observer.log")
        self.report_file.parent.mkdir(parents=True, exist_ok=True)

    def _log(self, message: str, level: str = "INFO"):
        """Log observer activity"""
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] [{level}] {message}\n"
        print(log_entry.strip())
        with open(self.report_file, 'a') as f:
            f.write(log_entry)

    def load_cascade_state(self) -> Dict[str, Any]:
        """Load current cascade state"""
        state_file = Path(".claude/agent-cascade-state.json")
        if not state_file.exists():
            return None

        try:
            with open(state_file, 'r') as f:
                return json.load(f)
        except:
            return None

    def load_agent_state(self) -> Dict[str, Any]:
        """Load agent status"""
        state_file = Path(".claude/agent-state.json")
        if not state_file.exists():
            return None

        try:
            with open(state_file, 'r') as f:
                return json.load(f)
        except:
            return None

    def check_agent_status(self) -> Dict[str, Any]:
        """Check current status of all agents"""
        cascade_state = self.load_cascade_state()
        agent_state = self.load_agent_state()

        status = {
            "timestamp": datetime.now().isoformat(),
            "cascade": cascade_state,
            "agents": agent_state,
            "summary": {}
        }

        if cascade_state:
            blocks_completed = cascade_state.get("blocks_completed", [])
            blocks_failed = cascade_state.get("blocks_failed", [])
            blocks_in_progress = cascade_state.get("blocks_in_progress", [])
            cascade_status = cascade_state.get("cascade_status", "UNKNOWN")
            iteration = cascade_state.get("iteration", 0)

            status["summary"] = {
                "cascade_status": cascade_status,
                "iteration": iteration,
                "blocks_completed": len(blocks_completed),
                "blocks_failed": len(blocks_failed),
                "blocks_in_progress": len(blocks_in_progress),
                "blocks_completed_list": blocks_completed,
                "blocks_failed_list": blocks_failed,
            }

        return status

    def format_status_report(self, status: Dict[str, Any]) -> str:
        """Format status as readable report"""
        summary = status.get("summary", {})
        cascade_status = summary.get("cascade_status", "UNKNOWN")
        iteration = summary.get("iteration", 0)
        completed = summary.get("blocks_completed", 0)
        failed = summary.get("blocks_failed", 0)
        in_progress = summary.get("blocks_in_progress", 0)

        report = f"""
╔════════════════════════════════════════════════════════════╗
║           HansPedder Agent Observer Report                  ║
╠════════════════════════════════════════════════════════════╣
║ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
║ Cascade Status: {cascade_status:<38}║
║ Iteration: {iteration:<43}║
├────────────────────────────────────────────────────────────┤
║ Agent Execution Status:
║   ✓ Completed: {completed} blocks
║   ✗ Failed: {failed} blocks
║   ⟳ In Progress: {in_progress} blocks
├────────────────────────────────────────────────────────────┤
"""
        if summary.get("blocks_completed_list"):
            report += f"║ Completed Blocks: {summary['blocks_completed_list']}\n"
        if summary.get("blocks_failed_list"):
            report += f"║ Failed Blocks: {summary['blocks_failed_list']}\n"

        report += """╚════════════════════════════════════════════════════════════╝"""
        return report

    def check_inactivity(self, previous_state: Dict[str, Any], current_state: Dict[str, Any]) -> bool:
        """Check if agents are inactive"""
        if not previous_state or not current_state:
            return False

        prev_iteration = previous_state.get("summary", {}).get("iteration", 0)
        curr_iteration = current_state.get("summary", {}).get("iteration", 0)

        # No progress in iterations
        if prev_iteration == curr_iteration:
            return True

        return False

    def run_continuous(self):
        """Run observer continuously"""
        self._log("HansPedder Observer Started - Monitoring agent activity")
        self._log("=" * 70)

        inactive_count = 0
        max_inactive_warnings = 5

        while True:
            try:
                current_status = self.check_agent_status()

                if current_status.get("cascade"):
                    # Print status report
                    report = self.format_status_report(current_status)
                    print(report)

                    # Check for inactivity
                    if self.last_cascade_state:
                        if self.check_inactivity(self.last_cascade_state, current_status):
                            inactive_count += 1
                            if inactive_count % 3 == 0:  # Alert every 3 checks (~15 sec)
                                self._log(
                                    f"ALERT: No agent progress for {inactive_count * self.check_interval}s",
                                    "WARN"
                                )
                        else:
                            inactive_count = 0  # Reset if there's activity
                    else:
                        inactive_count = 0

                    self.last_cascade_state = current_status

                    # Critical alert if too many inactive warnings
                    if inactive_count > max_inactive_warnings:
                        self._log(
                            "CRITICAL: Agents appear BLOCKED - no execution progress!",
                            "ERROR"
                        )
                        self._log("Check cascade state for blockers:", "ERROR")
                        blockers = current_status.get("summary", {}).get("blocks_failed_list", [])
                        if blockers:
                            self._log(f"  Failed blocks: {blockers}", "ERROR")

                else:
                    self._log("No cascade state found - waiting for orchestrator to start...", "INFO")

                # Wait before next check
                time.sleep(self.check_interval)

            except KeyboardInterrupt:
                self._log("Observer stopped by user", "INFO")
                break
            except Exception as e:
                self._log(f"Observer error: {e}", "ERROR")
                time.sleep(self.check_interval)

    def generate_report(self) -> str:
        """Generate status report"""
        status = self.check_agent_status()
        return self.format_status_report(status)


def main():
    """Main entry point"""
    import sys

    observer = AgentObserver(check_interval=int(sys.argv[1]) if len(sys.argv) > 1 else 5)
    observer.run_continuous()


if __name__ == "__main__":
    main()
