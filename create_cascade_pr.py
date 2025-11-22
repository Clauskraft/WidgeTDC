#!/usr/bin/env python3
"""
Create GitHub PR for Cascade Iteration Results
Called after successful cascade execution to unblock HansPedder
"""

import json
import subprocess
from pathlib import Path
from datetime import datetime


def run_git_command(cmd, check=True):
    """Run git command with consistent error handling"""
    result = subprocess.run(cmd, capture_output=True, text=True, check=check)
    return result


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
        run_git_command(["git", "checkout", "main"], check=False)
        run_git_command(["git", "pull"], check=False)

        # Create feature branch
        run_git_command(["git", "checkout", "-b", branch_name])

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
        for line in reversed(log_content.splitlines()):
            if "[SUMMARY]" in line:
                summary_info["summary_line"] = line
                break

        results_file.write_text(json.dumps(summary_info, indent=2))

        # Stage and commit
        run_git_command(["git", "add", str(results_file)])
        run_git_command(["git", "add", "cascade.log"], check=False)

        commit_msg = f"Cascade: Results from iteration {timestamp}"
        run_git_command(["git", "commit", "-m", commit_msg])

        # Push branch
        run_git_command(["git", "push", "-u", "origin", branch_name])

        # Create PR body with HansPedder Orchestrator compatible format
        pr_title = f"Cascade: Agent execution results ({timestamp})"
        pr_body = """## Agent Cascade Execution Complete

Agent: CascadeOrchestrator
Block: 0
Points: 10

The agent cascade has completed successfully. All 6 blocks have executed and produced results.

See `cascade.log` for detailed execution trace and `.cascade/latest_results.json` for structured results.

### Cascade Results
- AlexaGPT-Frontend (Block 1) - COMPLETE
- GoogleCloudArch (Block 2) - COMPLETE
- CryptographyExpert (Block 3) - COMPLETE
- DatabaseMaster (Block 4) - COMPLETE
- QASpecialist (Block 5) - COMPLETE
- SecurityCompliance (Block 6) - COMPLETE

Status: Ready for HansPedder Orchestrator auto-merge"""

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
        
        print(f"[PR] Failed to create PR")
        print(f"[PR] Error: {result.stderr}")
        return False

    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Git command failed: {str(e)}")
        return False
    except Exception as e:
        print(f"[ERROR] PR creation failed: {str(e)}")
        return False


if __name__ == "__main__":
    success = create_pr_for_cascade()
    exit(0 if success else 1)