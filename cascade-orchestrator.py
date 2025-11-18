#!/usr/bin/env python3
"""
Autonomous Cascade Orchestrator for WidgetTDC Agent Registry
Runs agent blocks sequentially with state management and autonomous looping
"""
import json
import time
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
import subprocess

class CascadeOrchestrator:
    def __init__(self, registry_path: str = "agents/registry.yml", state_file: str = ".claude/agent-cascade-state.json"):
        self.registry_path = registry_path
        self.state_file = state_file
        self.state = self._load_state()
        self.log_file = Path(".claude/logs/cascade-orchestrator.log")
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

    def _load_state(self) -> Dict[str, Any]:
        """Load cascade state or initialize new"""
        if Path(self.state_file).exists():
            with open(self.state_file, 'r') as f:
                return json.load(f)
        return {
            "cascade_id": "phase-1b",
            "started_at": datetime.now().isoformat(),
            "current_block": 0,
            "blocks_completed": [],
            "blocks_in_progress": [],
            "blocks_failed": [],
            "cascade_status": "INITIALIZED",
            "last_block_output": None,
            "iteration": 0
        }

    def _save_state(self):
        """Persist cascade state"""
        self.state["last_updated"] = datetime.now().isoformat()
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)

    def _update_runtime_agent_state(self, block_num: int, agent_info: Dict[str, Any], status: str, **kwargs):
        """Update runtime agent tracking in agent-state.json"""
        try:
            agent_state_file = Path(".claude/agent-state.json")
            agent_state = {}

            if agent_state_file.exists():
                with open(agent_state_file, 'r') as f:
                    agent_state = json.load(f)

            # Initialize runtime_agents section if missing
            if "runtime_agents" not in agent_state:
                agent_state["runtime_agents"] = {
                    "timestamp": datetime.now().isoformat(),
                    "cascade_active": True,
                    "agents": {},
                    "summary": {
                        "total_agents": 6,
                        "idle_agents": 6,
                        "loaded_agents": 0,
                        "overloaded_agents": 0,
                        "unhealthy_agents": 0,
                        "total_workload": 0,
                        "avg_workload": 0,
                        "max_workload": 0
                    },
                    "thresholds": {
                        "idle": 0,
                        "loaded": 30,
                        "overloaded": 70,
                        "unhealthy": 90
                    }
                }

            # Update agent status
            block_key = str(block_num)
            if block_key not in agent_state["runtime_agents"]["agents"]:
                agent_state["runtime_agents"]["agents"][block_key] = {
                    "agent_id": agent_info.get('id', f'agent-{block_num}'),
                    "name": agent_info.get('name', f'Agent-{block_num}'),
                    "block": block_num,
                    "status": "idle",
                    "workload": 0,
                    "last_activity": datetime.now().isoformat(),
                    "assigned_tasks": 0,
                    "completed_tasks": 0,
                    "failed_tasks": 0,
                    "current_task": None,
                    "health": "healthy",
                    "token_usage": 0
                }

            agent = agent_state["runtime_agents"]["agents"][block_key]

            # Update status
            agent["status"] = status
            agent["last_activity"] = datetime.now().isoformat()

            if status == "loaded":
                agent["workload"] = kwargs.get("workload", 50)
                agent["current_task"] = kwargs.get("task", f"block-{block_num}")
                agent["assigned_tasks"] = agent.get("assigned_tasks", 0) + 1
            elif status == "idle":
                agent["workload"] = 0
                agent["current_task"] = None
            elif status == "complete":
                agent["status"] = "idle"
                agent["workload"] = 0
                agent["current_task"] = None
                agent["completed_tasks"] = agent.get("completed_tasks", 0) + 1
            elif status == "failed":
                agent["status"] = "idle"
                agent["workload"] = 0
                agent["current_task"] = None
                agent["failed_tasks"] = agent.get("failed_tasks", 0) + 1
                agent["health"] = "unhealthy"

            agent["token_usage"] = kwargs.get("tokens", agent.get("token_usage", 0))

            # Update summary statistics
            agents = agent_state["runtime_agents"]["agents"]
            idle = sum(1 for a in agents.values() if a["status"] == "idle")
            loaded = sum(1 for a in agents.values() if a["status"] == "loaded" and a["workload"] < 70)
            overloaded = sum(1 for a in agents.values() if a["workload"] >= 70)
            unhealthy = sum(1 for a in agents.values() if a["health"] != "healthy")

            workloads = [a["workload"] for a in agents.values()]
            total_workload = sum(workloads)

            agent_state["runtime_agents"]["timestamp"] = datetime.now().isoformat()
            agent_state["runtime_agents"]["cascade_active"] = self.state['cascade_status'] in ["RUNNING", "INITIALIZED"]
            agent_state["runtime_agents"]["summary"] = {
                "total_agents": len(agents),
                "idle_agents": idle,
                "loaded_agents": loaded,
                "overloaded_agents": overloaded,
                "unhealthy_agents": unhealthy,
                "total_workload": total_workload,
                "avg_workload": total_workload / len(agents) if agents else 0,
                "max_workload": max(workloads) if workloads else 0
            }

            # Persist
            with open(agent_state_file, 'w') as f:
                json.dump(agent_state, f, indent=2)

        except Exception as e:
            self._log(f"[WARN] Failed to update runtime agent state: {e}", "WARN")

    def _log(self, message: str, level: str = "INFO"):
        """Log orchestrator activity"""
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] [{level}] {message}\n"
        print(log_entry.strip())
        with open(self.log_file, 'a') as f:
            f.write(log_entry)

    def get_agents_from_registry(self) -> list:
        """Parse registry.yml and return agent list"""
        try:
            import yaml
            with open(self.registry_path, 'r') as f:
                registry = yaml.safe_load(f)
            return sorted(registry.get('agents', []), key=lambda a: a.get('block_number', 999))
        except:
            # Fallback if yaml not available
            self._log("ERROR: Could not parse registry.yml. Ensure PyYAML is installed.", "ERROR")
            return []

    def check_agent_dependencies_met(self, agent: Dict[str, Any], completed_blocks: list) -> bool:
        """Check if agent's dependencies are satisfied"""
        required_blocks = agent.get('dependencies', {}).get('blocks', [])
        return all(block in completed_blocks for block in required_blocks)

    def execute_agent_block(self, agent: Dict[str, Any], context: Optional[str] = None) -> bool:
        """
        Execute single agent block
        In real implementation, this would invoke Claude with agent prompt + context
        """
        block_num = agent.get('block_number')
        agent_name = agent.get('name', f"Agent-{block_num}")
        story_points = agent.get('story_points', 0)

        self._log(f">> EXECUTING Block {block_num}: {agent_name} ({story_points} story points)")
        self.state['blocks_in_progress'].append(block_num)
        self._save_state()

        # Update agent state to loaded (executing)
        self._update_runtime_agent_state(block_num, agent, "loaded", workload=60, task=f"block-{block_num}")

        try:
            # In real implementation: invoke Claude with agent registry + context
            # For now, simulate execution
            self._log(f"   - Loading agent prompt from agents/{agent.get('id')}.md")
            self._log(f"   - Sending to Claude with context...")
            self._log(f"   - Waiting for completion...")

            # Simulate execution time
            time.sleep(2)

            # Mark as complete
            self.state['blocks_completed'].append(block_num)
            self.state['blocks_in_progress'].remove(block_num)
            self.state['current_block'] = block_num

            self._log(f"[COMPLETE] Block {block_num} COMPLETE: {agent_name}")

            # Update agent state to complete (idle)
            self._update_runtime_agent_state(block_num, agent, "complete", tokens=1000)

            self._save_state()
            return True

        except Exception as e:
            self._log(f"[FAILED] Block {block_num} FAILED: {str(e)}", "ERROR")
            self.state['blocks_failed'].append(block_num)
            self.state['blocks_in_progress'].remove(block_num)

            # Update agent state to failed
            self._update_runtime_agent_state(block_num, agent, "failed")

            self._save_state()
            return False

    def run_cascade_iteration(self) -> bool:
        """
        Run single cascade iteration:
        1. Get agent registry
        2. Find next executable block (dependencies met)
        3. Execute it
        4. Continue if success, loop for next block
        """
        self._log("-" * 70)
        self._log(f"CASCADE ITERATION #{self.state['iteration'] + 1}")
        self._log("-" * 70)

        agents = self.get_agents_from_registry()
        if not agents:
            self._log("ERROR: No agents found in registry", "ERROR")
            return False

        # Find next executable agent
        next_agent = None
        for agent in agents:
            block_num = agent.get('block_number')
            if block_num not in self.state['blocks_completed'] and \
               block_num not in self.state['blocks_failed'] and \
               self.check_agent_dependencies_met(agent, self.state['blocks_completed']):
                next_agent = agent
                break

        if not next_agent:
            # Check if all blocks completed
            if len(self.state['blocks_completed']) == len(agents):
                self._log("[SUCCESS] CASCADE COMPLETE - All blocks executed successfully!")
                self.state['cascade_status'] = "COMPLETE"
                self._save_state()
                return False  # Stop cascading
            else:
                # Check for blocked agents
                blocked_count = len([a for a in agents if a.get('block_number') in self.state['blocks_failed']])
                if blocked_count > 0:
                    self._log(f"[WARN] CASCADE BLOCKED - {blocked_count} agents failed, dependencies prevent progress", "WARN")
                    self.state['cascade_status'] = "BLOCKED"
                else:
                    self._log("[WARN] CASCADE WAITING - No executable agents, dependencies not met", "WARN")
                    self.state['cascade_status'] = "WAITING"
                self._save_state()
                return False

        # Execute the next agent
        success = self.execute_agent_block(next_agent)
        self.state['iteration'] += 1
        self._save_state()

        return success  # Continue cascading if successful

    def run_autonomous_loop(self, max_iterations: Optional[int] = None):
        """
        Run autonomous orchestration loop
        Continuously executes blocks until cascade completes or blocks
        """
        self._log("[START] AUTONOMOUS CASCADE ORCHESTRATOR STARTED")
        self._log(f"   Registry: {self.registry_path}")
        self._log(f"   State file: {self.state_file}")
        self._log(f"   Max iterations: {max_iterations or 'unlimited'}")

        self.state['cascade_status'] = "RUNNING"
        iteration_count = 0

        while True:
            iteration_count += 1

            if max_iterations and iteration_count > max_iterations:
                self._log(f"Stopped: Max iterations ({max_iterations}) reached")
                break

            # Run single cascade iteration
            should_continue = self.run_cascade_iteration()

            if not should_continue:
                self._log("")
                self._log("[STOP] CASCADE ORCHESTRATOR STOPPING")
                self._log(f"   Final status: {self.state['cascade_status']}")
                self._log(f"   Blocks completed: {len(self.state['blocks_completed'])}")
                self._log(f"   Blocks failed: {len(self.state['blocks_failed'])}")
                break

            # Brief pause before next iteration
            time.sleep(1)

        self._log("=" * 70)
        self._save_state()

if __name__ == "__main__":
    orchestrator = CascadeOrchestrator()

    # Run autonomous cascade loop
    # In production: would run indefinitely or until cascade completes
    # For testing: run limited iterations
    max_iterations = int(sys.argv[1]) if len(sys.argv) > 1 else 10

    orchestrator.run_autonomous_loop(max_iterations=max_iterations)
