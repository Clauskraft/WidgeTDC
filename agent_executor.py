#!/usr/bin/env python3
"""
Agent Executor - Real LLM-based agent execution for WidgetTDC Cascade
Integrates with Anthropic Claude API for real autonomous agent execution
"""

import os
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

try:
    from anthropic import Anthropic
except ImportError:
    print("Error: anthropic package not found")
    print("Install with: pip install -r requirements.txt")
    exit(1)


class AgentExecutor:
    """Executes agent blocks with real Claude API integration"""

    def __init__(self, model: str = "claude-opus-4-1"):
        """Initialize agent executor with LLM client"""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        self.client = Anthropic(api_key=api_key)
        self.model = model
        self.state_file = Path(".claude/agent-cascade-state.json")
        self.agent_state_file = Path(".claude/agent-state.json")
        self.agents_dir = Path("agents")

        # Ensure directories exist
        self.state_file.parent.mkdir(parents=True, exist_ok=True)

        self.execution_log = []
        self.total_tokens_used = 0

    def load_agent_prompt(self, agent_id: str) -> Optional[str]:
        """Load agent prompt from agents/{agent_id}.md"""
        prompt_file = self.agents_dir / f"{agent_id}.md"

        if prompt_file.exists():
            return prompt_file.read_text()

        print(f"[WARN] Prompt file not found for agent {agent_id}: {prompt_file}")
        return None

    def execute_agent_block(self, agent_info: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single agent block with real LLM"""
        agent_id = agent_info.get("id", "unknown")
        agent_name = agent_info.get("name", agent_id)
        block_num = agent_info.get("block_number", 0)

        print(f"[EXEC] Block {block_num}: {agent_name} ({agent_id})")

        # Load prompt
        prompt = self.load_agent_prompt(agent_id)
        if not prompt:
            print(f"[WARN] No prompt for {agent_id}, using default")
            prompt = f"Execute block {block_num}: {agent_name}\nImplement the required functionality."

        try:
            # Call Claude API
            start_time = time.time()
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=f"You are {agent_name}, block {block_num} in the WidgetTDC cascade.\n\nYour role: Autonomous agent responsible for implementation.\n\nBe concise and focus on delivering the specified functionality.",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            execution_time = time.time() - start_time

            # Extract response
            response_text = message.content[0].text if message.content else ""
            input_tokens = message.usage.input_tokens
            output_tokens = message.usage.output_tokens
            total_tokens = input_tokens + output_tokens

            self.total_tokens_used += total_tokens

            print(f"[DONE] {agent_name}: {total_tokens} tokens ({output_tokens} output) in {execution_time:.1f}s")

            return {
                "success": True,
                "agent_id": agent_id,
                "agent_name": agent_name,
                "block_number": block_num,
                "output": response_text[:500],  # Store first 500 chars
                "tokens_used": total_tokens,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "execution_time": execution_time,
                "timestamp": datetime.now().isoformat(),
                "status": "completed"
            }

        except Exception as e:
            print(f"[ERROR] {agent_name} failed: {str(e)}")
            return {
                "success": False,
                "agent_id": agent_id,
                "agent_name": agent_name,
                "block_number": block_num,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "status": "failed"
            }

    def update_agent_state(self, agent_result: Dict[str, Any], workload: int = 0):
        """Update runtime agent state tracking"""
        try:
            # Load existing state
            state = {}
            if self.agent_state_file.exists():
                state = json.loads(self.agent_state_file.read_text())

            # Initialize runtime_agents if needed
            if "runtime_agents" not in state:
                state["runtime_agents"] = {
                    "timestamp": datetime.now().isoformat(),
                    "cascade_active": True,
                    "agents": {},
                    "summary": {
                        "total_agents": 0,
                        "idle_agents": 0,
                        "loaded_agents": 0,
                        "overloaded_agents": 0,
                        "unhealthy_agents": 0,
                        "total_workload": 0,
                        "avg_workload": 0,
                        "max_workload": 0
                    },
                    "thresholds": {
                        "idle": 10,
                        "loaded": 30,
                        "overloaded": 70,
                        "unhealthy": 1
                    }
                }

            # Update agent
            block_num = agent_result.get("block_number", 0)
            status = "healthy" if agent_result.get("success") else "unhealthy"

            state["runtime_agents"]["agents"][str(block_num)] = {
                "agent_id": agent_result.get("agent_id"),
                "name": agent_result.get("agent_name"),
                "block": block_num,
                "status": "idle" if workload == 0 else ("loaded" if workload < 70 else "overloaded"),
                "workload": workload,
                "health": status,
                "completed_tasks": 1 if agent_result.get("success") else 0,
                "failed_tasks": 0 if agent_result.get("success") else 1,
                "token_usage": agent_result.get("tokens_used", 0)
            }

            # Update timestamp
            state["runtime_agents"]["timestamp"] = datetime.now().isoformat()

            # Save state
            self.agent_state_file.write_text(json.dumps(state, indent=2))

        except Exception as e:
            print(f"[WARN] Could not update agent state: {e}")

    def update_cascade_state(self, iteration: int, results: List[Dict[str, Any]]):
        """Update cascade-level state tracking"""
        try:
            state = {}
            if self.state_file.exists():
                state = json.loads(self.state_file.read_text())

            state["last_iteration"] = iteration
            state["timestamp"] = datetime.now().isoformat()
            state["last_iteration_results"] = results
            state["total_tokens_used"] = self.total_tokens_used
            state["cascade_complete"] = all(r.get("success") for r in results)

            self.state_file.write_text(json.dumps(state, indent=2))

        except Exception as e:
            print(f"[WARN] Could not update cascade state: {e}")

    def execute_cascade_iteration(self, agents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute one complete cascade iteration"""
        results = []
        completed_count = 0
        failed_count = 0

        print("")
        for agent in agents:
            result = self.execute_agent_block(agent)
            results.append(result)

            # Update agent runtime state (with simulated workload)
            workload = 0 if result.get("success") else 5  # Show as lighter workload if completed
            self.update_agent_state(result, workload)

            if result.get("success"):
                completed_count += 1
            else:
                failed_count += 1

        print("")
        print(f"[SUMMARY] Iteration complete: {completed_count} succeeded, {failed_count} failed")
        print(f"[TOKENS] Total used this iteration: {sum(r.get('tokens_used', 0) for r in results)}")

        # Update cascade state
        self.update_cascade_state(1, results)

        all_complete = failed_count == 0 and completed_count == len(agents)

        return {
            "iteration": 1,
            "agents_executed": len(agents),
            "agents_succeeded": completed_count,
            "agents_failed": failed_count,
            "all_complete": all_complete,
            "total_tokens": sum(r.get("tokens_used", 0) for r in results),
            "results": results
        }


if __name__ == "__main__":
    # Test executor
    print("Agent Executor Module")
    print("Use: from agent_executor import AgentExecutor")
