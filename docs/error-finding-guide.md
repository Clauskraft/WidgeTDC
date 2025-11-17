# Error-Finding Libraries - Complete Team Guide

**Last Updated**: 2025-11-18
**For**: All 6 Agent Blocks (Phase 1.C)
**Status**: 🟢 Ready for Production Use

---

## 🎯 Quick Start (2 Minutes)

### For Your Block

1. **Navigate to project directory**:
```bash
cd C:/Users/claus/Projects/WidgetTDC
```

2. **Choose your library** based on your block:
   - **Block 1 (Frontend)**: Use Sentry + pytest-error-handler
   - **Block 2 (CloudArch)**: Use mypy-strict + Hugging Face detector
   - **Block 3 (Security)**: Use **ALL** libraries (core responsibility)
   - **Block 4 (Database)**: Use mypy-strict + Sentry
   - **Block 5 (QA)**: Use pytest-error-handler + Hugging Face
   - **Block 6 (Compliance)**: Use mypy-strict + Hugging Face

3. **Run first scan**:
```bash
# Windows-specific for pytest
pytest --encoding=utf-8 --error-handler-mode strict tests/

# Or for Hugging Face
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py src/

# Or for mypy
python -m mypy --strict src/
```

4. **Review findings** and fix top 3 critical issues

5. **Report in daily standup**: Document what you found and fixed

---

## 📊 Library Comparison Matrix

| Library | Purpose | Your Use | Status | Workaround |
|---------|---------|----------|--------|-----------|
| **pytest-error-handler** | Test edge cases | All blocks with tests | 🟡 Working | Windows: use `--encoding=utf-8` |
| **Hugging Face** | Security scanning | Security-critical paths | 🟡 Working | Large projects: scan by module |
| **mypy-strict** | Type validation | All Python code | 🟡 Working | Dynamic code: 30-40% false positives |
| **Sentry** | Real-time monitoring | All blocks (auto-active) | 🟢 **NO ISSUES** | None needed - works perfectly |

---

## 🔧 Installation Verification

**All libraries are already installed.** To verify:

```bash
# Pytest
pytest --version

# Hugging Face
python -c "from transformers import pipeline; print('HF OK')"

# mypy
python -m mypy --version

# Sentry
python -c "import sentry_sdk; print('Sentry OK')"
```

If any fail, run:
```bash
pip install -r requirements.txt
```

---

## 📚 Individual Library Guides

### 1. pytest-error-handler ⚡
**Location**: `tools/error-libraries/pytest-error-handler/README.md`
**Use When**: You have test files and need to find edge cases

**One-liner**:
```bash
# Windows
pytest --encoding=utf-8 --error-handler-mode strict tests/

# Linux/Mac
pytest --error-handler-mode strict tests/
```

**Key Point**: Windows users MUST add `--encoding=utf-8` flag

---

### 2. Hugging Face Error Detection 🔍
**Location**: `tools/error-libraries/huggingface-error-detection/README.md`
**Use When**: You need security vulnerability scanning

**One-liner**:
```bash
# Scan single module (recommended)
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py src/services/

# For large projects: scan by subdirectory
for dir in src/*/; do
    timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py "$dir"
done
```

**Key Point**: Always use `timeout 30` to avoid hanging on large codebases

---

### 3. mypy-Strict-Mode 📝
**Location**: `tools/error-libraries/mypy-strict-mode/README.md`
**Use When**: You need type safety validation

**One-liner**:
```bash
# Basic type checking
python -m mypy --strict src/

# With configuration
python -m mypy --config-file=config/error-detection/mypy-strict.cfg src/
```

**Key Point**: 30-40% false-positive rate on dynamic code is NORMAL

---

### 4. Sentry Integration ✅
**Location**: `tools/error-libraries/sentry-integration/README.md`
**Use When**: You want real-time error monitoring (ALWAYS ON)

**Status**: Already integrated and working. No action needed.

**Key Point**: The ONLY library with NO workarounds needed

---

## 🎯 Error Finding Workflow

### Step 1: Run Appropriate Library
Choose based on your task type:

```
Task Type                  → Use Library
─────────────────────────────────────────
Writing tests             → pytest-error-handler
Modifying APIs            → mypy-strict-mode
Importing new code        → Hugging Face detector
Deploying to production   → Sentry (auto-active)
Any critical code path    → All libraries
```

### Step 2: Interpret Results

#### Result Type 1: No Issues Found ✅
```
Success: no issues found in 5 source files
```
**Action**: Great! Code is clean. Proceed.

#### Result Type 2: Real Issues Found 🔴
```
src/services/auth.py:45: error: Argument 1 has incompatible type
src/services/auth.py:67: error: Returning Any from function declared to return User
```
**Action**: Fix immediately - these could cause runtime errors.

#### Result Type 3: False Positives ⚠️
```
src/utils/dynamic_handler.py:12: error: Any is incompatible with str
src/utils/json_processor.py:34: error: Unknown type
```
**Action**: Review carefully. If legitimate (dynamic code), use `# type: ignore` comment

### Step 3: Fix Issues

For each issue:
1. Read error message carefully
2. Understand the problem
3. Make minimal fix (don't refactor)
4. Re-run library to confirm fix
5. Move to next issue

### Step 4: Report Results

In your daily standup, include:

```markdown
## Error Library Findings (Block X)

**Library Used**: pytest-error-handler / Hugging Face / mypy-strict
**Scan Scope**: `src/services/widget_discovery.py`
**Issues Found**: 3 total (1 critical, 2 important)

**Critical Issues Fixed**:
- SQL injection in database query (line 45) ✅

**Important Issues Under Review**:
- Missing error handler for network timeout (line 67)
- Unvalidated user input in config parsing (line 89)

**Status**: Blocking deployment until critical issues fixed
```

---

## 🚨 Common Issues Reference

### Windows Encoding Error
```
UnicodeDecodeError: 'cp1252' codec can't decode byte 0x9a

FIX: Add --encoding=utf-8 to pytest command
pytest --encoding=utf-8 --error-handler-mode strict tests/
```

### Hugging Face Timeout
```
TimeoutError: Detector did not complete in 30 seconds

FIX: Scan smaller directory or module
timeout 30 python detector.py src/agents/  # instead of src/
```

### mypy False Positives
```
error: Returning Any from function declared to return Dict[str, str]
(but code is actually correct)

FIX: Add type hint or ignore comment
# type: ignore[return-value]
return dynamic_result
```

### Model Not Found
```
Error: Could not find model 'microsoft/codebert-base'

FIX: Pre-download models
python -c "from transformers import AutoModel; AutoModel.from_pretrained('microsoft/codebert-base')"
```

---

## 📋 Daily Checklist

Add this to your daily block work:

```markdown
## Error Library Validation

- [ ] 9:00 AM - Run error-finding library on today's code changes
- [ ] 9:30 AM - Review findings and prioritize by severity
- [ ] 10:00 AM - Fix all CRITICAL issues
- [ ] 10:30 AM - Review HIGH priority issues
- [ ] 11:00 AM - Re-run library to confirm fixes
- [ ] 11:30 AM - Commit fixes with detailed messages
- [ ] 12:00 PM - Update daily standup with findings and metrics
```

---

## 🎓 Block-Specific Guidance

### Block 1 - AlexaGPT-Frontend (UI/UX)
**Recommended Libraries**: Sentry (monitoring), pytest-error-handler (E2E tests)

**Focus Area**: User experience edge cases
```bash
# Ensure E2E tests pass
pytest tests/e2e/ --encoding=utf-8 --error-handler-mode strict

# Check Sentry for JavaScript errors
tail -f .claude/logs/sentry.log
```

---

### Block 2 - GoogleCloudArch (MCP Framework)
**Recommended Libraries**: mypy-strict-mode, Hugging Face (API security)

**Focus Area**: Type safety of MCP messaging
```bash
# Ensure all MCP types are validated
python -m mypy --strict src/integrations/mcp/

# Scan for security issues in message passing
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py src/integrations/mcp/
```

---

### Block 3 - CryptographyExpert (Security)
**Recommended Libraries**: ALL (your responsibility for error handling)

**Focus Area**: Complete error coverage
```bash
# Run all libraries on critical security paths
pytest --encoding=utf-8 tests/
python -m mypy --strict src/
timeout 30 python detector.py src/
tail .claude/logs/sentry.log
```

**Success Criteria**: Zero unhandled security exceptions

---

### Block 4 - DatabaseMaster (Registry & State)
**Recommended Libraries**: mypy-strict-mode, Sentry

**Focus Area**: Type safety of state operations
```bash
# Validate database operation types
python -m mypy --strict src/models/ src/services/database.py

# Monitor for runtime state errors
tail -f .claude/logs/sentry.log
```

---

### Block 5 - QASpecialist (Widget Discovery)
**Recommended Libraries**: pytest-error-handler, Hugging Face

**Focus Area**: Discovery pipeline robustness
```bash
# Test all discovery edge cases
pytest tests/discovery/ --encoding=utf-8 --error-handler-mode strict

# Scan for code quality in conversion pipeline
timeout 30 python detector.py src/services/widget_conversion.py
```

---

### Block 6 - SecurityCompliance (Privacy & Audit)
**Recommended Libraries**: mypy-strict-mode, Hugging Face

**Focus Area**: Security policy enforcement
```bash
# Ensure compliance code is type-safe
python -m mypy --strict src/compliance/

# Check for permission bypass vulnerabilities
timeout 30 python detector.py src/security/permissions.py
```

---

## 🔄 Integration with Cascade

Error libraries integrate automatically with cascade orchestrator:

**What Happens**:
1. Each agent block runs its assigned error libraries
2. Results are captured in real-time
3. Findings logged to `.claude/logs/`
4. Critical issues trigger re-execution of block
5. Metrics included in block status

**Log Files**:
```
.claude/logs/test-errors.log        # pytest findings
.claude/logs/security-scan.log      # Hugging Face findings
.claude/logs/type-check.log         # mypy findings
.claude/logs/sentry.log             # Sentry events
```

---

## 🎯 Success Metrics

### Week 1 Goals
- ✅ Each block runs error libraries daily
- ✅ 100% of CRITICAL issues fixed
- ✅ 80%+ of HIGH priority issues fixed
- ✅ False positives documented and handled

### Week 2 Goals
- ✅ Error detection rate: 95%+
- ✅ False positive rate: < 15%
- ✅ Time-to-fix for critical issues: < 1 hour
- ✅ Zero critical errors in deployment

### Phase 1.C Goals
- ✅ All blocks using libraries daily
- ✅ Error detection integrated in CI/CD
- ✅ Sentry tracking 100% of production errors
- ✅ Team velocity not impacted by error finding

---

## 🚨 Escalation Path

If you encounter issues:

**Timeline**:
- 0-15 min: Try workaround from README
- 15-30 min: Try alternative library or approach
- 30 min+: **Escalate to HansPedder**

**Escalation Info Needed**:
- Which library and what command you ran
- Exact error message
- What you've already tried
- Your block number
- Current task impact

**Response Target**: < 1 hour guaranteed

---

## 📞 Quick Reference Links

| Topic | Location |
|-------|----------|
| **Main Guide** | This file: `/docs/error-finding-guide.md` |
| **pytest Reference** | `/tools/error-libraries/pytest-error-handler/README.md` |
| **Hugging Face Reference** | `/tools/error-libraries/huggingface-error-detection/README.md` |
| **mypy Reference** | `/tools/error-libraries/mypy-strict-mode/README.md` |
| **Sentry Reference** | `/tools/error-libraries/sentry-integration/README.md` |
| **Config Templates** | `/config/error-detection/` |
| **Log Files** | `.claude/logs/` |

---

## ✅ Verification Checklist

Before starting your block work:

- [ ] Can run pytest: `pytest --version`
- [ ] Can run mypy: `python -m mypy --version`
- [ ] Can check Hugging Face: `python -c "from transformers import pipeline"`
- [ ] Can access Sentry logs: `tail .claude/logs/sentry.log`
- [ ] Know which libraries your block should use (see above)
- [ ] Have error-finding README files bookmarked

---

## 🎓 Learning Path

**Day 1**: Run each library once on your block's code
**Day 2**: Fix all CRITICAL issues from Day 1
**Day 3**: Integrate into daily workflow
**Day 4+**: Monitor metrics and optimize

---

## 💡 Pro Tips

1. **Start small**: Run on single file before entire module
2. **Read errors carefully**: Error messages are helpful
3. **Don't ignore warnings**: Early finding = early fix
4. **Use workarounds**: Documented solutions exist
5. **Report findings**: Share metrics in standup
6. **Celebrate wins**: Fixed issues = better code

---

## 🚀 Ready to Start?

1. Pick your primary library from your block's section above
2. Read its full README
3. Run one scan on your current code
4. Fix one issue
5. Report in daily standup
6. Repeat daily

**You've got this!** Error-finding libraries are your allies in building quality code.

---

**Questions?** → File in daily standup with your block number

**Issues?** → Escalate to HansPedder if stuck > 30 minutes

**Success!** → Document findings and metrics in standup

---

**System Status**:
- ✅ All libraries ready
- ✅ All documentation complete
- ✅ Workarounds documented
- ✅ Escalation path clear
- ✅ Team can proceed immediately

**Let's build something great.** 🚀
