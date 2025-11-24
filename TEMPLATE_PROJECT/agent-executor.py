#!/usr/bin/env python3
"""
Agent Executor for WidgetTDC Platform
Executes agent blocks by invoking LLM models with context and prompts
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
import anthropic
from datetime import datetime


class AgentExecutor:
    """Executes agent blocks by invoking LLM models"""

    def __init__(self, model: str = "claude-3-5-sonnet-20241022"):
        """
        Initialize agent executor

        Args:
            model: LLM model to use (default: Claude 3.5 Sonnet)
        """
        self.model = model
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.log_file = Path(".claude/logs/agent-execution.log")
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

    def _log(self, message: str, level: str = "INFO"):
        """Log execution activity"""
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] [{level}] {message}\n"
        print(log_entry.strip())
        with open(self.log_file, 'a') as f:
            f.write(log_entry)

    def load_agent_prompt(self, agent_id: str) -> Optional[str]:
        """Load agent prompt from markdown file"""
        prompt_file = Path(f"agents/{agent_id}.md")
        if not prompt_file.exists():
            self._log(f"Agent prompt not found: {prompt_file}", "WARN")
            return None

        with open(prompt_file, 'r') as f:
            return f.read()

    def load_cascade_context(self) -> Dict[str, Any]:
        """Load cascade context and state"""
        state_file = Path(".claude/agent-cascade-state.json")
        if state_file.exists():
            with open(state_file, 'r') as f:
                return json.load(f)
        return {}

    def execute_agent_block(self, agent_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute agent block with LLM invocation

        Args:
            agent_info: Agent configuration from registry

        Returns:
            Execution result with LLM response
        """
        agent_id = agent_info.get('id')
        agent_name = agent_info.get('name')
        block_num = agent_info.get('block_number')
        story_points = agent_info.get('story_points')

        self._log(f">> EXECUTING Block {block_num}: {agent_name} ({story_points} story points)")

        try:
            # Load agent prompt
            agent_prompt = self.load_agent_prompt(agent_id)
            if not agent_prompt:
                return {
                    "success": False,
                    "block": block_num,
                    "error": "Agent prompt not found",
                    "output": None
                }

            # Load cascade context for additional context
            cascade_context = self.load_cascade_context()

            # Build system message
            system_message = f"""You are {agent_name}, executing block {block_num} of the WidgetTDC platform.

Cascade Context:
- Blocks Completed: {cascade_context.get('blocks_completed', [])}
- Cascade Status: {cascade_context.get('cascade_status', 'UNKNOWN')}
- Iteration: {cascade_context.get('iteration', 0)}

Your task is to execute the following agent specification and provide a structured result."""

            self._log(f"   - Invoking {self.model}...")

            # Invoke Claude/LLM
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=system_message,
                messages=[
                    {
                        "role": "user",
                        "content": f"Execute this agent specification:\n\n{agent_prompt}"
                    }
                ]
            )

            # Extract response
            response_text = message.content[0].text
            self._log(f"   - Received {len(response_text)} characters response")

            # Parse result
            result = {
                "success": True,
                "block": block_num,
                "agent_id": agent_id,
                "agent_name": agent_name,
                "output": response_text,
                "tokens_used": message.usage.output_tokens + message.usage.input_tokens,
                "model": self.model,
                "timestamp": datetime.now().isoformat()
            }

            self._log(f"[COMPLETE] Block {block_num} executed successfully ({result['tokens_used']} tokens used)")
            return result

        except Exception as e:
            error_msg = str(e)
            self._log(f"[FAILED] Block {block_num} execution failed: {error_msg}", "ERROR")
            return {
                "success": False,
                "block": block_num,
                "agent_id": agent_id,
                "error": error_msg,
                "timestamp": datetime.now().isoformat()
            }

    def execute_cascade_iteration(self, agents: list) -> Dict[str, Any]:
        """
        Execute single cascade iteration with real LLM agents

        Args:
            agents: List of agent definitions

        Returns:
            Execution results for iteration
        """
        cascade_state = self.load_cascade_context()
        blocks_completed = cascade_state.get('blocks_completed', [])

        # Find next executable block
        next_agent = None
        for agent in agents:
            block_num = agent.get('block_number')
            if block_num not in blocks_completed:
                next_agent = agent
                break

        if not next_agent:
            self._log("No executable agents found", "WARN")
            return {
                "iteration": cascade_state.get('iteration', 0),
                "results": [],
                "all_complete": len(blocks_completed) == len(agents)
            }

        # Execute agent
        result = self.execute_agent_block(next_agent)

        # Update cascade state
        if result.get('success'):
            blocks_completed.append(next_agent.get('block_number'))
            cascade_state['blocks_completed'] = sorted(blocks_completed)
            cascade_state['last_block_output'] = result.get('output')[:500]  # Store first 500 chars

            # Save state
            state_file = Path(".claude/agent-cascade-state.json")
            with open(state_file, 'w') as f:
                json.dump(cascade_state, f, indent=2)

        return {
            "iteration": cascade_state.get('iteration', 0),
            "results": [result],
            "all_complete": len(blocks_completed) == len(agents)
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
    with open("agents/registry.yml", 'r') as f:
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
