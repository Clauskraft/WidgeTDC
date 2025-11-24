.PHONY: help setup test run run-continuous clean logs watch

# WidgetTDC Platform Template - Makefile
# Provides convenient commands for template management

help:
	@echo "WidgetTDC Platform Template - Available Commands"
	@echo ""
	@echo "Setup & Initialization:"
	@echo "  make setup              - Initialize project from template"
	@echo "  make clean              - Clean state files and logs"
	@echo ""
	@echo "Execution:"
	@echo "  make test               - Run 3-iteration test"
	@echo "  make run                - Run until cascade completes"
	@echo "  make run-continuous     - Run continuously (restart on exit)"
	@echo ""
	@echo "Monitoring:"
	@echo "  make logs               - Tail execution logs"
	@echo "  make watch              - Watch state file changes"
	@echo "  make status             - Show current cascade status"
	@echo ""
	@echo "Development:"
	@echo "  make validate           - Validate project structure"
	@echo "  make help               - Show this help message"

setup:
	@echo "Setting up WidgetTDC Platform Template..."
	@bash SETUP.sh || powershell -ExecutionPolicy Bypass -File SETUP.ps1

test:
	@echo "Running 3-iteration test..."
	python cascade-orchestrator.py 3

run:
	@echo "Running cascade orchestrator..."
	python cascade-orchestrator.py

run-continuous:
	@echo "Running orchestrator continuously..."
	@while true; do \
		python cascade-orchestrator.py; \
		echo "Restarting in 5 seconds..."; \
		sleep 5; \
	done

logs:
	@if [ -f ".claude/logs/cascade-orchestrator.log" ]; then \
		tail -f .claude/logs/cascade-orchestrator.log; \
	else \
		echo "No log file found. Run 'make test' first."; \
	fi

watch:
	@if command -v watch >/dev/null 2>&1; then \
		watch -n 1 'cat .claude/agent-cascade-state.json | jq'; \
	else \
		echo "Watching state file (Ctrl+C to stop)..."; \
		while true; do \
			clear; \
			echo "=== Cascade State ==="; \
			cat .claude/agent-cascade-state.json | python -m json.tool; \
			sleep 1; \
		done; \
	fi

status:
	@echo "=== Cascade Status ==="
	@if [ -f ".claude/agent-cascade-state.json" ]; then \
		cat .claude/agent-cascade-state.json | python -m json.tool; \
	else \
		echo "No cascade state found. Run 'make test' first."; \
	fi

validate:
	@echo "Validating project structure..."
	@required_dirs=("agents" ".claude"); \
	required_files=("cascade-orchestrator.py" "agents/registry.yml"); \
	errors=0; \
	for dir in "$${required_dirs[@]}"; do \
		if [ ! -d "$$dir" ]; then \
			echo "✗ Missing directory: $$dir"; \
			errors=$$((errors+1)); \
		fi; \
	done; \
	for file in "$${required_files[@]}"; do \
		if [ ! -f "$$file" ]; then \
			echo "✗ Missing file: $$file"; \
			errors=$$((errors+1)); \
		fi; \
	done; \
	if [ $$errors -eq 0 ]; then \
		echo "✓ All required files present"; \
		echo "✓ Project structure valid"; \
	else \
		echo "✗ Found $$errors error(s)"; \
		exit 1; \
	fi

clean:
	@echo "Cleaning state files and logs..."
	@rm -f .claude/agent-cascade-state.json
	@rm -rf .claude/logs/*.log
	@echo "✓ Clean complete"
	@echo "Note: Run 'make test' to reinitialize"

.PHONY: help setup test run run-continuous logs watch status validate clean
