# pytest-error-handler

**Purpose**: Detect test failures, edge cases, and error handling bugs
**Status**: 🟡 Working (Windows workaround required)
**Version**: 1.2.0+
**Maintainer**: QA Team (Block 5)

## What It Does

Pytest-error-handler extends pytest to:
- Capture unhandled exceptions in tests
- Detect async/await issues (race conditions, deadlocks)
- Find missing error handlers
- Track exception propagation through code
- Report edge cases not covered by tests

## Installation

```bash
# Already installed in project
# To update:
pip install pytest-error-handler --upgrade

# Verify installation
pytest --version
pytest --help | grep error-handler
```

## Windows-Only Workaround

### Problem
pytest-error-handler fails on Windows with cp1252 encoding conflicts

### Solution
**Always run with explicit UTF-8 encoding**:

```bash
# Windows - REQUIRED
pytest --encoding=utf-8 --error-handler-mode strict

# NOT this (will fail on Windows)
pytest --error-handler-mode strict

# Alternative: Set environment variable
set PYTEST_ENCODING=utf-8
pytest --error-handler-mode strict
```

### Why This Happens
- Windows default encoding: cp1252
- pytest-error-handler needs UTF-8 for unicode symbols
- Simple fix: Specify encoding explicitly

## Quick Start

### 1. Run on Your Code
```bash
# Run all tests with error detection
pytest tests/ --encoding=utf-8 --error-handler-mode strict

# Run specific test file
pytest tests/auth_test.py --encoding=utf-8 --error-handler-mode strict

# Run with verbose output
pytest tests/ --encoding=utf-8 --error-handler-mode strict -v
```

### 2. Expected Output
```
tests/auth_test.py::test_invalid_token PASSED
tests/auth_test.py::test_missing_auth FAILED [ERROR CAUGHT]
  Error: TypeError: 'NoneType' object is not subscriptable
  Location: auth.js:45 in validate_token()
  Status: UNHANDLED - needs try/except

tests/api_test.py::test_async_race FAILED [ERROR CAUGHT]
  Error: RuntimeError: Task already running
  Type: ASYNC_ISSUE - likely race condition
  Recommendation: Add mutex or async.Lock()
```

### 3. Interpret Results

**PASSED** ✅
- Test executed successfully
- All exceptions caught and handled
- Good error handling

**FAILED [ERROR CAUGHT]** ⚠️
- Exception found but not caught by test
- Need to add try/except or error handler
- Usually indicates missing edge case handling

**BLOCKED [TIMEOUT]** 🚨
- Test hung (likely deadlock or infinite loop)
- Check for circular async dependencies
- Add timeout decorators

## Configuration

**File**: `config/error-detection/pytest-handlers.ini`

```ini
[tool:pytest]
encoding = utf-8
error_handler_mode = strict
timeout = 30
markers =
    error_critical: Critical error that blocks release
    error_security: Security-related error
    error_performance: Performance issue found
    error_async: Async/await related issue
```

### Activation
Config is **automatic**. To use:

```bash
# Uses config automatically
pytest tests/

# Override config
pytest tests/ --config-file=my-pytest.ini --encoding=utf-8
```

## Usage Patterns

### Pattern 1: Find All Error Cases
```bash
# Comprehensive scan
pytest tests/ --encoding=utf-8 --error-handler-mode strict -v

# Save results to file
pytest tests/ --encoding=utf-8 --error-handler-mode strict > error-report.txt 2>&1
```

### Pattern 2: Focus on Specific Errors
```bash
# Only show critical errors
pytest tests/ --encoding=utf-8 --error-handler-mode strict -m error_critical

# Only show security errors
pytest tests/ --encoding=utf-8 --error-handler-mode strict -m error_security

# Only show async issues
pytest tests/ --encoding=utf-8 --error-handler-mode strict -m error_async
```

### Pattern 3: Fix and Re-verify
```bash
# 1. Run initial scan
pytest tests/ --encoding=utf-8 --error-handler-mode strict > errors.txt

# 2. Fix issues (add error handlers, fix async)
# ... edit your code ...

# 3. Re-run to confirm
pytest tests/ --encoding=utf-8 --error-handler-mode strict

# Should show PASSED for previous FAILED tests
```

## Common Errors and Fixes

### Error: "AttributeError: module 'pytest' has no attribute 'encoding'"
**Cause**: Old pytest version or incorrect installation
**Fix**:
```bash
pip uninstall pytest-error-handler
pip install pytest-error-handler --upgrade
pytest --encoding=utf-8 --error-handler-mode strict
```

### Error: "UnicodeDecodeError: 'cp1252' codec can't decode..."
**Cause**: Windows encoding issue (CLASSIC WINDOWS PROBLEM)
**Fix**:
```bash
# Add to command line
pytest tests/ --encoding=utf-8 --error-handler-mode strict

# OR set environment variable
set PYTEST_ENCODING=utf-8
pytest tests/
```

### Error: "No tests ran"
**Cause**: Tests not found or wrong directory
**Fix**:
```bash
# Verify test files exist
dir tests/
# or
find . -name "*test*.py" -path "*/tests/*"

# Run from project root
cd C:/Users/claus/Projects/WidgetTDC
pytest tests/ --encoding=utf-8 --error-handler-mode strict
```

### Error: "BLOCKED [TIMEOUT]"
**Cause**: Test hung (infinite loop or deadlock)
**Fix**:
```python
# Add timeout decorator to test
import pytest

@pytest.mark.timeout(10)  # 10 second timeout
async def test_async_operation():
    # Your async test code
    pass
```

## Example Scenarios

### Scenario 1: Widget Discovery Error Handling
**Block**: 5 (QASpecialist)
**Task**: Verify widget discovery pipeline handles all errors

```bash
# Run tests for discovery pipeline
pytest tests/discovery/ --encoding=utf-8 --error-handler-mode strict

# Expected findings:
# - Missing error handlers for network timeouts
# - Unhandled JSON parsing errors
# - Invalid widget structure handling
```

### Scenario 2: Authentication Edge Cases
**Block**: 1 (Frontend)
**Task**: Find all auth token validation edge cases

```bash
# Run auth tests
pytest tests/auth/ --encoding=utf-8 --error-handler-mode strict -m error_critical

# Expected findings:
# - Null token handling
# - Expired token edge cases
# - Malformed token parsing
```

### Scenario 3: Async Race Conditions
**Block**: 2 (CloudArch)
**Task**: Find MCP communication race conditions

```bash
# Run MCP integration tests
pytest tests/mcp/ --encoding=utf-8 --error-handler-mode strict -m error_async

# Expected findings:
# - Parallel message handling issues
# - Widget trigger ordering problems
# - State synchronization race conditions
```

## Integration with Cascade

pytest-error-handler runs automatically:
- On each agent block execution (if tests available)
- Results logged to: `.claude/logs/test-errors.log`
- Critical failures trigger re-execution of block
- Findings included in daily standup metrics

## Performance Tips

### Tip 1: Run Specific Tests First
```bash
# Don't run everything at first
pytest tests/auth/ --encoding=utf-8 --error-handler-mode strict

# Then expand scope
pytest tests/ --encoding=utf-8 --error-handler-mode strict
```

### Tip 2: Use Parallel Execution
```bash
# Run tests in parallel (faster)
pip install pytest-xdist
pytest tests/ --encoding=utf-8 --error-handler-mode strict -n auto

# Specify number of workers
pytest tests/ --encoding=utf-8 --error-handler-mode strict -n 4
```

### Tip 3: Cache Results
```bash
# Only re-run failed tests
pytest tests/ --encoding=utf-8 --error-handler-mode strict --lf

# Re-run failed + last tested
pytest tests/ --encoding=utf-8 --error-handler-mode strict --ff
```

## Troubleshooting Checklist

- [ ] Using `--encoding=utf-8` flag? (Windows required)
- [ ] Are test files in `tests/` directory?
- [ ] Does your code have error handlers?
- [ ] Are async tests using proper decorators?
- [ ] Is pytest-error-handler installed? (`pip list | grep pytest`)
- [ ] Running from project root directory?

## Success Metrics

**Good error-handler results**:
- ✅ All tests PASSED or marked FAILED [ERROR CAUGHT]
- ✅ Error types clearly identified
- ✅ Actionable fixes suggested
- ✅ No BLOCKED [TIMEOUT] results
- ✅ Async issues identified and documented

**Poor results** (need investigation):
- ❌ Many BLOCKED [TIMEOUT] tests
- ❌ Vague error messages
- ❌ Encoding errors on Windows
- ❌ "No tests ran" with tests present

## Next Steps

1. **Verify**: Run on your block's test suite
2. **Review**: Read error report carefully
3. **Fix**: Address critical errors first
4. **Re-run**: Confirm fixes with pytest again
5. **Report**: Document findings in daily standup

## Questions?

Escalation path:
1. Check this README (solutions for common issues)
2. Check mypy-strict-mode as alternative for type checking
3. File issue in daily standup with:
   - Error message
   - Command you ran
   - Expected vs actual behavior
   - Your block number

---

**Ready to use?**

```bash
cd C:/Users/claus/Projects/WidgetTDC
pytest tests/ --encoding=utf-8 --error-handler-mode strict -v
```

Start with one test directory, then expand scope. 🚀
