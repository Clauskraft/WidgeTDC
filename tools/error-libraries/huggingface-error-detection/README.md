# Hugging Face Error Detection

**Purpose**: ML-powered vulnerability scanning and error pattern recognition
**Status**: 🟡 Working (performance tuning recommended)
**Version**: 1.0.0+
**Maintainer**: Security Team (Block 6)

## What It Does

Hugging Face error detection uses ML models to:
- Identify security vulnerabilities (SQL injection, XSS, etc.)
- Find API misuse patterns
- Detect performance anti-patterns
- Recognize code smell and potential bugs
- Analyze error propagation paths

## Installation

```bash
# Already configured in project
# To verify:
python -c "from transformers import pipeline; print('HF installed')"

# To update:
pip install --upgrade transformers torch

# Verify models are cached
ls ~/.cache/huggingface/hub/
```

## Performance Workaround

### Problem
Scanning large codebases (>100K lines) takes too long or times out

### Solution
**Scan by module, not entire project**:

```bash
# DON'T do this (will timeout)
python tools/error-libraries/huggingface-error-detection/detector.py src/

# DO this instead - scan module by module
cd C:/Users/claus/Projects/WidgetTDC
python tools/error-libraries/huggingface-error-detection/detector.py src/agents/
python tools/error-libraries/huggingface-error-detection/detector.py src/services/
python tools/error-libraries/huggingface-error-detection/detector.py src/routers/

# Or use parallel processing
parallel -j 3 "timeout 30 python detector.py {}" ::: src/*/
```

## Quick Start

### 1. Scan Single Module
```bash
# Scan one service
cd C:/Users/claus/Projects/WidgetTDC
python tools/error-libraries/huggingface-error-detection/detector.py src/services/email_service.py

# Expected output:
# [CRITICAL] SQL injection vulnerability in query: "SELECT * FROM users WHERE id=" + user_input
# [HIGH] Missing error handler for network timeout
# [MEDIUM] Unvalidated user input in API response
```

### 2. Scan Entire Directory (with timeout)
```bash
# With enforced 30-second timeout
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py src/agents/

# Multiple directories in sequence
for dir in src/agents src/services src/routers; do
    echo "Scanning $dir..."
    timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py "$dir"
done
```

### 3. Generate Report
```bash
# Scan and save results
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py src/ > hf-scan-report.txt 2>&1

# Review report
cat hf-scan-report.txt

# Count vulnerabilities by severity
grep "\[CRITICAL\]" hf-scan-report.txt | wc -l
grep "\[HIGH\]" hf-scan-report.txt | wc -l
grep "\[MEDIUM\]" hf-scan-report.txt | wc -l
```

## Severity Levels

### 🔴 CRITICAL
- SQL injection vulnerabilities
- Authentication bypass
- Credential exposure
- Remote code execution risks
- Data exfiltration paths

**Action**: Fix immediately before any deployment

### 🟠 HIGH
- Missing input validation
- Improper error handling
- Weak cryptography usage
- Privilege escalation paths
- Performance DoS patterns

**Action**: Fix within current sprint

### 🟡 MEDIUM
- Code smell and anti-patterns
- Potential logic errors
- Non-optimal algorithms
- Deprecated API usage
- Type safety issues

**Action**: Schedule for next sprint

### 🟢 LOW
- Style improvements
- Documentation suggestions
- Refactoring recommendations
- Performance micro-optimizations
- Best practice violations

**Action**: Consider for future improvement

## Usage Patterns

### Pattern 1: Security-Focused Scan
```bash
# Scan for security issues only
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py \
    --security-only \
    src/

# Output will only show CRITICAL and HIGH severity
```

### Pattern 2: Performance Analysis
```bash
# Scan for performance anti-patterns
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py \
    --performance-check \
    src/services/

# Identifies O(n²) algorithms, memory leaks, etc.
```

### Pattern 3: API Misuse Detection
```bash
# Scan for common API misuse patterns
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py \
    --api-validation \
    src/integrations/

# Finds incorrect library usage, wrong parameters, etc.
```

### Pattern 4: Compare Before/After
```bash
# Baseline scan
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py src/ > baseline.txt

# Make changes...
# ... edit code ...

# Rescan
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py src/ > after.txt

# Compare
diff baseline.txt after.txt
```

## Configuration

**File**: `config/error-detection/huggingface-params.json`

```json
{
  "timeout_seconds": 30,
  "severity_threshold": "MEDIUM",
  "models": [
    "microsoft/codebert-base",
    "huggingface/CodeBERTa-small-v1"
  ],
  "parallel_workers": 3,
  "cache_results": true,
  "exclude_patterns": [
    "node_modules/",
    "dist/",
    "*.test.py"
  ]
}
```

### Custom Configuration
```bash
# Use custom params file
python tools/error-libraries/huggingface-error-detection/detector.py \
    --config custom-hf-params.json \
    src/
```

## Common Issues and Solutions

### Issue: "CUDA out of memory"
**Cause**: GPU memory exhausted by ML model
**Solution**:
```bash
# Run on CPU instead
CUDA_VISIBLE_DEVICES="" python detector.py src/

# Or limit batch size
python detector.py --batch-size 16 src/
```

### Issue: "Timeout after 30 seconds"
**Cause**: Large directory or slow model
**Solution**:
```bash
# Scan smaller subsets
timeout 30 python detector.py src/agents/ > agents.txt
timeout 30 python detector.py src/services/ > services.txt

# Or increase timeout
timeout 60 python detector.py src/
```

### Issue: "Model download failed"
**Cause**: First run needs to download model (slow)
**Solution**:
```bash
# Pre-download model
python -c "from transformers import AutoModel; AutoModel.from_pretrained('microsoft/codebert-base')"

# Then run detector (cached)
python detector.py src/
```

### Issue: "High false-positive rate"
**Cause**: ML model marking legitimate code as vulnerable
**Solution**:
```bash
# Review reported vulnerabilities manually
# Update config to set higher threshold
python detector.py --severity-threshold HIGH src/

# Or exclude specific patterns
python detector.py --exclude-pattern "test_*" src/
```

## Example Scenarios

### Scenario 1: Widget Discovery Security Review
**Block**: 5 (QASpecialist)
**Task**: Verify widget discovery from Git/Hugging Face is secure

```bash
# Scan widget discovery service
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py \
    --security-only \
    src/services/widget_discovery.py

# Expected findings:
# - Input validation for URLs
# - Git URL injection protection
# - Model download safety
# - Sandboxing of untrusted code
```

### Scenario 2: MCP Communication Validation
**Block**: 2 (CloudArch)
**Task**: Find vulnerabilities in MCP widget trigger mechanism

```bash
# Scan MCP integration code
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py \
    --security-only \
    src/integrations/mcp_framework.py

# Expected findings:
# - Message injection protection
# - Parameter validation
# - Cross-widget access control
# - State synchronization safety
```

### Scenario 3: Widget Registry Data Safety
**Block**: 4 (DatabaseMaster)
**Task**: Verify widget registry prevents data corruption

```bash
# Scan database operations
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py \
    --api-validation \
    src/models/widget_registry.py

# Expected findings:
# - SQL injection prevention
# - Transaction integrity
# - Concurrent access safety
# - Backup mechanism validation
```

## Integration with Cascade

Hugging Face detector runs:
- On code changes for security-critical paths
- Results logged to: `.claude/logs/security-scan.log`
- CRITICAL findings block deployment
- HIGH findings trigger review
- Results included in daily standup

## Performance Optimization Tips

### Tip 1: Use Caching
```bash
# Results are cached by default
# Second run on same code is instant

# Clear cache if needed
rm -rf .cache/huggingface-detector/
```

### Tip 2: Parallel Scanning
```bash
# Install GNU Parallel
pip install parallel

# Scan 3 directories in parallel
parallel -j 3 "timeout 30 python detector.py {}" ::: src/agents src/services src/routers
```

### Tip 3: Incremental Scanning
```bash
# Only scan files changed since last commit
git diff --name-only | xargs -I {} timeout 30 python detector.py {}

# Or use git hooks for automatic scanning
# (setup in pre-commit hooks)
```

## Success Metrics

**Good HF detection results**:
- ✅ All CRITICAL issues identified
- ✅ Security vulnerabilities clearly reported
- ✅ Actionable fix recommendations
- ✅ Reasonable false-positive rate (<20%)
- ✅ Scans complete within 30 seconds

**Poor results** (need investigation):
- ❌ Scan timeout every run
- ❌ Memory errors or crashes
- ❌ High false-positive rate (>50%)
- ❌ Missing obvious vulnerabilities
- ❌ Cannot download models

## Troubleshooting Checklist

- [ ] Have 30+ second timeout available?
- [ ] Scanning module, not entire project?
- [ ] Models cached? (first run is slow)
- [ ] Have GPU memory available? (or use CPU)
- [ ] Internet connection for first model download?
- [ ] Sufficient disk space for model cache?

## Next Steps

1. **Start small**: Scan one Python file first
2. **Review findings**: Read security warnings carefully
3. **Fix issues**: Address CRITICAL findings first
4. **Rescan**: Confirm fixes worked
5. **Automate**: Add to CI/CD pipeline

## Questions?

Escalation path:
1. Check this README
2. Try lower severity threshold to exclude false positives
3. File issue in daily standup with:
   - Command you ran
   - Error message (if any)
   - Your block number
   - Timeout issues or false positives encountered

---

**Ready to use?**

```bash
cd C:/Users/claus/Projects/WidgetTDC

# Start with one file
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py src/services/email_service.py

# Then expand to module
timeout 30 python tools/error-libraries/huggingface-error-detection/detector.py src/services/

# Review findings and fix
```

Security scanning enabled. 🔒
