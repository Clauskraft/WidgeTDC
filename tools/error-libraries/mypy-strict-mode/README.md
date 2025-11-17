# mypy-Strict-Mode

**Purpose**: Type checking with aggressive error detection
**Status**: 🟡 Working (high false-positive rate on dynamic code)
**Version**: 1.5.0+
**Maintainer**: Backend Team (Block 2, 4)

## What It Does

mypy-strict-mode enforces rigorous type checking to:
- Catch type-related bugs early
- Prevent None-type errors
- Validate function signatures
- Ensure type consistency across modules
- Detect unsafe type conversions
- Find incorrect generic usage

## Installation

```bash
# Already installed in project
# To verify:
python -m mypy --version

# To update:
pip install --upgrade mypy

# Verify strict mode available
python -m mypy --help | grep strict
```

## Quick Start

### 1. Run Type Check on Your Code
```bash
# Check entire project
cd C:/Users/claus/Projects/WidgetTDC
python -m mypy --strict src/

# Check specific module
python -m mypy --strict src/services/email_service.py

# Check with config file
python -m mypy --config-file=config/error-detection/mypy-strict.cfg src/
```

### 2. Expected Output
```
src/services/auth.py:45: error: Argument 1 to "validate_token" has incompatible type "Optional[str]"; expected "str"
src/services/auth.py:67: error: Returning Any from function declared to return "User"
src/models/widget.py:12: error: Name "Widget" is not defined

Success: no issues found in 3 source files
```

### 3. Interpret Results

**Good results** ✅
- All type errors fixed
- "Success: no issues found"
- Can proceed with implementation

**False positives** ⚠️
- Error about correct code
- Typically with dynamic Python patterns
- Use `# type: ignore` sparingly to suppress

**Real issues** 🔴
- Type mismatches that could cause runtime errors
- None-type access (NoneType attribute access)
- Incorrect generic types
- These MUST be fixed

## False-Positive Workaround

### Problem
mypy-strict has 30-40% false-positive rate on dynamic code

### Solution
**Use pragmatic type annotations**:

```python
# AVOID this (too strict, causes false positives)
def process_widget(data: Any) -> Any:
    pass

# DO this (helps mypy understand your intent)
from typing import Dict, List, Optional, TypeVar, Protocol

T = TypeVar('T')

def process_widget(data: Dict[str, any]) -> Optional[Dict[str, str]]:
    """Process widget data with clear types"""
    if data is None:
        return None
    return {"status": "processed"}

# For truly dynamic code, use Protocol or explicit ignore
class WidgetLike(Protocol):
    """Protocol for widget-like objects"""
    name: str
    config: Dict[str, any]

def handle_widget(widget: WidgetLike) -> None:
    """Type-safe handling of widget-like objects"""
    print(widget.name)
```

## Configuration

**File**: `config/error-detection/mypy-strict.cfg`

```ini
[mypy]
strict = True
python_version = 3.9
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
disallow_incomplete_defs = True
check_untyped_defs = True
disallow_untyped_calls = True
disallow_untyped_decorators = True
no_implicit_optional = True
warn_redundant_casts = True
warn_unused_ignores = True
warn_no_return = True
warn_unreachable = True
strict_equality = True

[mypy-tests.*]
ignore_errors = True

[mypy-external_library.*]
ignore_missing_imports = True
```

## Usage Patterns

### Pattern 1: Gradual Type Adoption
```bash
# Start with just checking
python -m mypy --strict src/services/email_service.py

# Review issues found (don't fix yet)
# Then gradually add type hints to your code

# Re-check with stricter settings
python -m mypy --strict --show-error-codes src/services/email_service.py
```

### Pattern 2: Report Mode (Non-Blocking)
```bash
# Generate report without failing
python -m mypy --strict src/ > type-report.txt 2>&1
echo "Check type-report.txt for findings"

# Review and fix at leisure
cat type-report.txt | head -20
```

### Pattern 3: Focus on Critical Modules
```bash
# Check security-critical code first
python -m mypy --strict src/services/auth.py
python -m mypy --strict src/models/user.py

# Then check data handling
python -m mypy --strict src/services/widget_registry.py

# Then check less critical
python -m mypy --strict src/utils/helpers.py
```

### Pattern 4: Add Type Hints Incrementally
```python
# BEFORE (no types)
def calculate_widget_score(widget):
    return widget.value * 2

# AFTER (with types)
from typing import Optional

class Widget:
    value: float

def calculate_widget_score(widget: Widget) -> float:
    """Calculate score for widget with strict typing"""
    return widget.value * 2

# NOW mypy is happy
python -m mypy --strict src/
```

## Common Errors and Fixes

### Error: "Argument 1 has incompatible type"
**Cause**: Passing wrong type to function
**Fix**:
```python
# WRONG
def greet(name: str) -> None:
    print(f"Hello {name}")

greet(123)  # ERROR: int is not str

# RIGHT
greet("Alice")  # OK: str is correct type
```

### Error: "Name is not defined"
**Cause**: Missing import or typo
**Fix**:
```python
# WRONG
def create_widget() -> Widget:  # Widget not imported
    pass

# RIGHT
from models.widget import Widget

def create_widget() -> Widget:
    pass
```

### Error: "Returning Any from function declared to return X"
**Cause**: Returning value of uncertain type
**Fix**:
```python
# WRONG
def get_config() -> Dict[str, str]:
    config = load_config()  # Returns Any
    return config  # ERROR: Any is not Dict[str, str]

# RIGHT
from typing import Dict, Any

def get_config() -> Dict[str, Any]:
    config: Dict[str, Any] = load_config()
    return config  # OK
```

### Error: "Optional[X]" where "X" expected
**Cause**: Function might return None
**Fix**:
```python
# WRONG
def find_user(id: int) -> User:
    result = database.query(User).filter(id=id).first()
    return result  # ERROR: might be None

# RIGHT
from typing import Optional

def find_user(id: int) -> Optional[User]:
    result = database.query(User).filter(id=id).first()
    return result  # OK: returns User or None
```

### Error: "Line too high false-positive rate"
**Cause**: mypy confused by dynamic code
**Solution**: Use `# type: ignore` comment
```python
# For unavoidable dynamic code
result = json.loads(json_string)  # type: ignore[no-redef]

# Or use Protocol for better typing
from typing import Protocol

class DataLike(Protocol):
    def get(self, key: str) -> any: ...

def process(data: DataLike) -> None:
    pass
```

## Example Scenarios

### Scenario 1: Widget Registry Type Safety
**Block**: 4 (DatabaseMaster)
**Task**: Ensure widget registry has type-safe operations

```bash
# Check widget model types
python -m mypy --strict src/models/widget_registry.py

# Expected findings:
# - Ensure all database queries return proper types
# - Validate schema compliance
# - Check state synchronization types
```

### Scenario 2: MCP Action Framework
**Block**: 2 (CloudArch)
**Task**: Verify action framework has type-safe trigger mechanism

```bash
# Check MCP integration
python -m mypy --strict src/integrations/mcp_action_framework.py

# Expected findings:
# - Widget trigger parameters properly typed
# - State synchronization return types
# - Error handling with proper exceptions
```

### Scenario 3: Error Handling Validation
**Block**: 3 (CryptographyExpert)
**Task**: Ensure error handlers have correct exception types

```bash
# Check error handling
python -m mypy --strict src/services/error_handlers.py

# Expected findings:
# - Exception types clearly defined
# - Catch blocks have proper types
# - Error recovery types validated
```

## Performance Tips

### Tip 1: Incremental Checking
```bash
# Don't check everything at once
python -m mypy --incremental src/

# Subsequent runs are much faster (cached results)
python -m mypy --incremental src/
```

### Tip 2: Parallel Checking
```bash
# Check multiple modules in parallel
python -m mypy --parallel 4 src/
```

### Tip 3: Skip Tests (Usually)
```bash
# Tests often have dynamic code, skip them
python -m mypy --strict src/ --ignore-missing-imports

# Check only source, not tests
find src -name "*.py" -not -path "*/tests/*" | xargs python -m mypy --strict
```

## Integration with Cascade

mypy-strict checks run:
- On each agent block execution (if Python code present)
- Results logged to: `.claude/logs/type-check.log`
- Type errors block deployment
- Results included in daily standup

## Success Metrics

**Good type checking results**:
- ✅ All type errors identified and fixed
- ✅ Clear error messages with locations
- ✅ False-positive rate < 15%
- ✅ All public functions typed
- ✅ Critical paths 100% typed

**Poor results** (need investigation):
- ❌ Blocking on low-severity issues
- ❌ High false-positive rate (>30%)
- ❌ Unhelpful error messages
- ❌ Can't run due to configuration issues

## Troubleshooting Checklist

- [ ] mypy installed? (`python -m mypy --version`)
- [ ] Python files have proper extensions? (`.py`)
- [ ] Imports present for all types used?
- [ ] Using `Optional[X]` for nullable values?
- [ ] External libraries have type stubs?
- [ ] Config file correct path?

## Type Annotation Quick Reference

```python
from typing import (
    Dict, List, Optional, Union, Tuple,
    Callable, Any, Protocol, TypeVar, Generic
)

# Basic types
name: str
age: int
price: float
active: bool

# Collections
users: List[str]
config: Dict[str, any]
pair: Tuple[int, str]

# Optional (might be None)
result: Optional[str]

# Union (multiple types)
data: Union[str, int, float]

# Functions
def process(data: str) -> bool:
    """Process data and return boolean"""
    return True

# Callable
processor: Callable[[str], bool]

# Protocol (for duck typing)
class DataLike(Protocol):
    def get(self, key: str) -> any: ...

# TypeVar (for generics)
T = TypeVar('T')

def first(items: List[T]) -> Optional[T]:
    return items[0] if items else None
```

## Next Steps

1. **Install type hints**: Add types to your functions
2. **Run mypy**: `python -m mypy --strict src/`
3. **Fix errors**: Address real issues first, ignore false positives
4. **Iterate**: Re-run to confirm fixes
5. **Report**: Document type-safety in daily standup

## Questions?

Escalation path:
1. Check this README for common errors
2. Use `# type: ignore` for unavoidable dynamic code
3. Consider using Protocol for flexible typing
4. File issue in daily standup with:
   - Error message
   - Module or file being checked
   - Your block number
   - Whether it's a real error or false positive

---

**Ready to use?**

```bash
cd C:/Users/claus/Projects/WidgetTDC

# Start with one file
python -m mypy --strict src/services/email_service.py

# Add type hints until happy
# Then expand to more modules
python -m mypy --strict src/
```

Type safety enabled. 💪
