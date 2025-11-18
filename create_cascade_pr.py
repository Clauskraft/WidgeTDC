#!/usr/bin/env python3
"""
Create GitHub PR for Cascade Iteration Results
Called after successful cascade execution to unblock HansPedder
"""

import json
import subprocess
from pathlib import Path
from datetime import datetime


def create_pr_for_cascade():
    """Create a GitHub PR with the latest cascade results"""
    try:
        # Get latest cascade results
        cascade_log = Path("cascade.log")
        if not cascade_log.exists():
            print("[ERROR] cascade.log not found")
            return False

        # Create timestamp for unique PR
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        branch_name = f"cascade/agents-{timestamp}"

        print(f"[PR] Creating GitHub PR for cascade iteration...")

        # Ensure we're on main and up to date
        subprocess.run(["git", "checkout", "main"], check=False, capture_output=True)
        subprocess.run(["git", "pull"], check=False, capture_output=True)

        # Create feature branch
        subprocess.run(["git", "checkout", "-b", branch_name], check=True, capture_output=True)

        # Create cascade results directory and file
        results_dir = Path(".cascade")
        results_dir.mkdir(parents=True, exist_ok=True)
        results_file = results_dir / "latest_results.json"

        # Parse cascade log for summary
        log_content = cascade_log.read_text()

        # Extract summary info
        summary_info = {
            "timestamp": datetime.now().isoformat(),
            "cascade_log_exists": True,
            "log_path": "cascade.log"
        }

        # Look for the latest SUMMARY line
        for line in reversed(log_content.split("\n")):
            if "[SUMMARY]" in line:
                summary_info["summary_line"] = line
                break

        results_file.write_text(json.dumps(summary_info, indent=2))

        # Stage and commit
        subprocess.run(["git", "add", str(results_file)], check=True, capture_output=True)
        subprocess.run(["git", "add", "cascade.log"], check=False, capture_output=True)

        commit_msg = f"Cascade: Results from iteration {timestamp}"
        subprocess.run(["git", "commit", "-m", commit_msg], check=True, capture_output=True)

        # Push branch
        subprocess.run(["git", "push", "-u", "origin", branch_name], check=True, capture_output=True)

        # Create PR body
        pr_title = f"Cascade: Agent execution results ({timestamp})"
        pr_body = """## Agent Cascade Execution Complete

The agent cascade has completed successfully. All 6 blocks have executed and produced results.

See `cascade.log` for detailed execution trace and `cascade/latest_results.json` for structured results.

**Action Required**: HansPedder should review and merge this PR to process the agent outputs.

**Status**: Ready for review and merge."""

        # Create PR
        result = subprocess.run([
            "gh", "pr", "create",
            "--title", pr_title,
            "--body", pr_body,
            "--base", "main"
        ], capture_output=True, text=True)

        if result.returncode == 0:
            pr_url = result.stdout.strip()
            print(f"[PR] Successfully created: {pr_url}")
            print(f"[PR] HansPedder can now process the cascade results")
            return True
        else:
            print(f"[PR] Failed to create PR")
            print(f"[PR] Error: {result.stderr}")
            return False

    except Exception as e:
        print(f"[ERROR] PR creation failed: {str(e)}")
        return False


if __name__ == "__main__":
    success = create_pr_for_cascade()
    exit(0 if success else 1)
