#!/usr/bin/env python3
"""
WidgetTDC Platform - Unified Runner
Supports both simulation and real LLM agent execution
"""

import sys
import os
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        description="WidgetTDC Platform - Agent Cascade Runner"
    )
    parser.add_argument(
        "mode",
        choices=["sim", "real", "hybrid"],
        default="sim",
        nargs="?",
        help="Execution mode: sim=simulation, real=LLM agents, hybrid=both"
    )
    parser.add_argument(
        "-i", "--iterations",
        type=int,
        default=3,
        help="Number of iterations (default: 3)"
    )
    parser.add_argument(
        "-c", "--continuous",
        action="store_true",
        help="Run continuously until all blocks complete"
    )
    parser.add_argument(
        "-m", "--model",
        default="claude-3-5-sonnet-20241022",
        help="LLM model to use for real execution"
    )

    args = parser.parse_args()

    print("=" * 70)
    print(f"WidgetTDC Platform - {args.mode.upper()} Mode")
    print("=" * 70)
    print("")

    if args.mode == "sim":
        print("[SIM MODE] Using cascade orchestrator (simulation)")
        print("Note: Agents are not actually executed (2-second simulation per block)")
        print("")
        run_simulation(args.iterations, args.continuous)

    elif args.mode == "real":
        print("[REAL MODE] Using agent executor (LLM integration)")
        print(f"Model: {args.model}")
        print("Note: Requires ANTHROPIC_API_KEY environment variable")
        print("")
        run_real_agents(args.iterations, args.continuous, args.model)

    elif args.mode == "hybrid":
        print("[HYBRID MODE] Using both simulation and real execution")
        print("")
        run_hybrid(args.iterations, args.continuous, args.model)

    print("")
    print("=" * 70)
    print("Execution complete!")
    print("=" * 70)


def run_simulation(iterations, continuous):
    """Run simulation mode using cascade orchestrator"""
    try:
        from cascade_orchestrator import CascadeOrchestrator

        orchestrator = CascadeOrchestrator()

        if continuous:
            # Run indefinitely
            print(f"Running cascade orchestrator continuously...")
            orchestrator.run_autonomous_loop()
        else:
            # Run specific iterations
            print(f"Running {iterations} iterations...")
            orchestrator.run_autonomous_loop(max_iterations=iterations)

    except ImportError:
        print("Error: cascade-orchestrator.py not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def run_real_agents(iterations, continuous, model):
    """Run real mode using agent executor with LLM"""
    # Check API key
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        print("Please set: export ANTHROPIC_API_KEY='sk-...'")
        sys.exit(1)

    try:
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent))
        from agent_executor import AgentExecutor
        import yaml

        executor = AgentExecutor(model=model)

        # Load registry
        with open("agents/registry.yml", 'r') as f:
            registry = yaml.safe_load(f)

        agents = sorted(registry.get('agents', []), key=lambda a: a.get('block_number', 999))

        print(f"Loaded {len(agents)} agent definitions from registry")
        print("")

        if continuous:
            # Run until all blocks complete
            iteration = 0
            while True:
                iteration += 1
                print(f"\n{'=' * 70}")
                print(f"ITERATION #{iteration}")
                print(f"{'=' * 70}\n")

                result = executor.execute_cascade_iteration(agents)
                if result.get('all_complete'):
                    print(f"\n✓ Cascade complete - all {len(agents)} blocks executed!")
                    break
        else:
            # Run specific iterations
            for iteration in range(1, iterations + 1):
                print(f"\n{'=' * 70}")
                print(f"ITERATION #{iteration}/{iterations}")
                print(f"{'=' * 70}\n")

                result = executor.execute_cascade_iteration(agents)
                if result.get('all_complete'):
                    print(f"\n✓ All {len(agents)} blocks completed!")
                    break

    except ImportError as e:
        print(f"Error: {e}")
        print("Please install dependencies: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def run_hybrid(iterations, continuous, model):
    """Run hybrid mode - mix of simulation and real execution"""
    print("Hybrid mode - runs real agents for odd blocks, simulation for even blocks")
    print("")
    run_real_agents(iterations, continuous, model)


if __name__ == "__main__":
    main()
