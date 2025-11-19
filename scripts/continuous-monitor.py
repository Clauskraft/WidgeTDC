#!/usr/bin/env python3
"""
Continuous agent monitor - runs every 15 minutes to ensure all agents are busy
"""
import time
import subprocess
import json
from pathlib import Path
from datetime import datetime

class AgentMonitor:
    def __init__(self, interval_minutes=15):
        self.interval = interval_minutes * 60  # Convert to seconds
        self.monitor_script = Path("scripts/monitor-agents.sh")
        self.log_file = Path(".claude/logs/continuous-monitor.log")
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
    
    def log(self, message):
        """Log monitor activity"""
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] {message}\n"
        print(log_entry.strip())
        with open(self.log_file, 'a') as f:
            f.write(log_entry)
    
    def run_monitor(self):
        """Run the monitor script"""
        try:
            result = subprocess.run([str(self.monitor_script)], 
                                  capture_output=True, text=True, cwd=".")
            self.log(f"Monitor executed - Exit code: {result.returncode}")
            if result.stdout:
                self.log(f"Output: {result.stdout.strip()}")
            if result.stderr:
                self.log(f"Errors: {result.stderr.strip()}")
            return result.returncode == 0
        except Exception as e:
            self.log(f"ERROR running monitor: {e}")
            return False
    
    def check_agent_state_directly(self):
        """Directly check agent state files for more detailed monitoring"""
        try:
            agent_state = Path(".claude/agent-state.json")
            cascade_state = Path(".claude/agent-cascade-state.json")
            
            if not agent_state.exists() or not cascade_state.exists():
                self.log("WARNING: State files missing")
                return False
            
            # Load and check agent state
            with open(agent_state, 'r') as f:
                agent_data = json.load(f)
            
            runtime_agents = agent_data.get('runtime_agents', {})
            agents = runtime_agents.get('agents', {})
            summary = runtime_agents.get('summary', {})
            
            idle_count = summary.get('idle_agents', 0)
            loaded_count = summary.get('loaded_agents', 0)
            total_agents = summary.get('total_agents', 0)
            
            self.log(f"Direct check - Loaded: {loaded_count}, Idle: {idle_count}, Total: {total_agents}")
            
            # Load and check cascade state
            with open(cascade_state, 'r') as f:
                cascade_data = json.load(f)
            
            cascade_status = cascade_data.get('cascade_status', 'UNKNOWN')
            blocks_completed = len(cascade_data.get('blocks_completed', []))
            
            self.log(f"Cascade status: {cascade_status}, Blocks completed: {blocks_completed}")
            
            # Return True if all agents are busy
            return idle_count == 0 and loaded_count > 0
            
        except Exception as e:
            self.log(f"ERROR in direct state check: {e}")
            return False
    
    def run_continuous(self):
        """Run continuous monitoring loop"""
        self.log("=== CONTINUOUS AGENT MONITOR STARTED ===")
        self.log(f"Monitoring interval: {self.interval//60} minutes")
        
        iteration = 0
        while True:
            iteration += 1
            self.log(f"\n--- Monitoring iteration {iteration} ---")
            
            # Run both monitoring methods
            script_success = self.run_monitor()
            direct_check = self.check_agent_state_directly()
            
            if not script_success:
                self.log("WARNING: Monitor script failed - check logs and agent status")
            if not direct_check:
                self.log("WARNING: Some agents may be idle - consider manual intervention")
            
            self.log(f"Sleeping for {self.interval//60} minutes...")
            time.sleep(self.interval)

if __name__ == "__main__":
    monitor = AgentMonitor(interval_minutes=15)
    monitor.run_continuous()