#!/usr/bin/env python3
"""
Agent Executor - Real LLM-based agent execution for WidgetTDC Cascade
Integrates with Anthropic Claude API for real autonomous agent execution
ENHANCED: Comprehensive error handling for all error scenarios
FIXED: Encoding issues, model name, state parsing
"""
import os
import json
import time
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Fix Windows encoding issue
sys.stdout.reconfigure(encoding='utf-8')

try:
    from anthropic import Anthropic
except ImportError:
    print("Error: anthropic package not found")
    print("Install with: pip install anthropic")
    exit(1)


class AgentExecutor:
    """Executes agent blocks with real Claude API integration and error handling"""

    def __init__(self, model: str = "claude-3-5-sonnet-20241022"):
        """Initialize agent executor with LLM client"""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        self.client = Anthropic(api_key=api_key)
        self.model = model  # Fixed to valid model
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
            return prompt_file.read_text(encoding='utf-8')

        print(f"[WARN] Prompt file not found for agent {agent_id}: {prompt_file}")
        return None

    def execute_agent_block(self, agent_info: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single agent block with real LLM and comprehensive error handling"""
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

            try:
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
            except Exception as api_error:
                # Extract error details
                error_msg = str(api_error)
                error_code = getattr(api_error, 'status_code', 'unknown')

                # Handle specific API errors
                if error_code == 404 or "not_found" in error_msg.lower():
                    print(f"[ERROR] {agent_name} failed: Model not found ({self.model})")
                    return self._create_error_result(
                        agent_id, agent_name, block_num,
                        f"Model '{self.model}' not available. Verify ANTHROPIC_API_KEY and model name."
                    )
                elif error_code == 401 or "unauthorized" in error_msg.lower():
                    print(f"[ERROR] {agent_name} failed: Authentication error")
                    return self._create_error_result(
                        agent_id, agent_name, block_num,
                        "Authentication failed. Check ANTHROPIC_API_KEY environment variable."
                    )
                elif error_code == 429 or "rate" in error_msg.lower():
                    print(f"[ERROR] {agent_name} failed: Rate limited")
                    time.sleep(2)
                    return self._create_error_result(
                        agent_id, agent_name, block_num,
                        "Rate limited - will retry in next iteration"
                    )
                elif "connection" in error_msg.lower():
                    print(f"[ERROR] {agent_name} failed: Connection error")
                    return self._create_error_result(
                        agent_id, agent_name, block_num,
                        "Connection error to API - will retry"
                    )
                else:
                    print(f"[ERROR] {agent_name} failed: API error ({error_code}) - {error_msg[:100]}")
                    return self._create_error_result(
                        agent_id, agent_name, block_num,
                        f"API Error ({error_code}): {error_msg[:200]}"
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
            print(f"[ERROR] {agent_name} failed: Unexpected error - {str(e)[:100]}")
            return self._create_error_result(
                agent_id, agent_name, block_num,
                f"Unexpected error: {str(e)[:200]}"
            )

    def _create_error_result(self, agent_id: str, agent_name: str, block_num: int, error_msg: str) -> Dict[str, Any]:
        """Helper to create consistent error results"""
        return {
            "success": False,
            "agent_id": agent_id,
            "agent_name": agent_name,
            "block_number": block_num,
            "error": error_msg,
            "timestamp": datetime.now().isoformat(),
            "status": "failed"
        }

    def update_agent_state(self, agent_result: Dict[str, Any], workload: int = 0):
        """Update runtime agent state tracking with improved error handling"""
        try:
            # Load existing state
            state = {}
            if self.agent_state_file.exists():
                try:
                    state = json.loads(self.agent_state_file.read_text(encoding='utf-8'))
                except json.JSONDecodeError as e:
                    print(f"[WARN] Invalid JSON in agent state: {e}. Starting fresh.")
                    state = {}

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

            # Update agent entry
            agent_id = agent_result.get("agent_id")
            if agent_id:
                state["runtime_agents"]["agents"][agent_id] = {
                    "status": agent_result.get("status", "unknown"),
                    "timestamp": datetime.now().isoformat(),
                    "workload": workload,
                    "health": "healthy" if agent_result.get("success") else "unhealthy"
                }

            # Save state
            self.agent_state_file.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding='utf-8')

        except Exception as e:
            print(f"[WARN] Could not update agent state: {str(e)}")

    def execute_cascade_iteration(self, agents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute one cascade iteration with all agents"""
        results = []
        succeeded = 0
        failed = 0

        for agent_info in agents:
            result = self.execute_agent_block(agent_info)
            results.append(result)

            # Update state
            self.update_agent_state(result)

            # Track success/failure
            if result.get("success"):
                succeeded += 1
            else:
                failed += 1

        # Summary
        all_complete = failed == 0 and succeeded == len(agents)
        print(f"\n[SUMMARY] Iteration complete: {succeeded} succeeded, {failed} failed")
        print(f"[TOKENS] Total used this iteration: {self.total_tokens_used}")

        return {
            "results": results,
            "succeeded": succeeded,
            "failed": failed,
            "total": len(agents),
            "all_complete": all_complete,
            "timestamp": datetime.now().isoformat()
        }


def main():
    """Main entry point for testing"""
    import sys

    # Check API key
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        print("Please set: export ANTHROPIC_API_KEY='sk-...'")
        sys.exit(1)

    executor = AgentExecutor()

    # Load registry
    import yaml
    with open("agents/registry.yml", 'r', encoding='utf-8') as f:
        registry = yaml.safe_load(f)

    agents = sorted(registry.get('agents', []), key=lambda a: a.get('block_number', 999))

    print(f"Loaded {len(agents)} agents")
    print("Starting real agent execution...\n")

    # Execute iterations
    max_iterations = int(sys.argv[1]) if len(sys.argv) > 1 else 1

    for iteration in range(max_iterations):
        print(f"\n{'='*70}")
        print(f"ITERATION {iteration + 1}/{max_iterations}")
        print(f"{'='*70}\n")

        result = executor.execute_cascade_iteration(agents)

        if result.get('all_complete'):
            print(f"\nAll {len(agents)} agents completed successfully!")
            break

    print("\nAgent execution complete!")


if __name__ == "__main__":
    main()
