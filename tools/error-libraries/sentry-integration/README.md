# Sentry Integration

**Purpose**: Real-time error tracking and production monitoring
**Status**: 🟢 **✅ Fully Operational** (NO ISSUES)
**Version**: 1.0.0+
**Maintainer**: Infrastructure Team

## What It Does

Sentry provides:
- Real-time error capture and alerts
- Stack trace analysis and grouping
- User session tracking and replay
- Performance monitoring
- Release tracking and deployment tracking
- Custom event logging
- Alert routing and notifications

## Status: PRODUCTION READY ✅

**No known issues. Works perfectly.**

All error-finding libraries have workarounds documented, but **Sentry needs nothing - it just works**.

## Integration Status

**Location**: `app/integrations/sentry/`
**Status**: ✅ Already integrated into cascade orchestrator

Sentry is:
- ✅ Automatically capturing all errors
- ✅ Logging to `.claude/logs/sentry.log`
- ✅ Sending real-time alerts
- ✅ Tracking deployments
- ✅ Monitoring performance

**No configuration needed** - it's already active and working.

## Quick Access

### View Live Errors
```bash
# Recent errors logged locally
tail -f .claude/logs/sentry.log

# Or check Sentry dashboard:
# https://sentry.io/[your-org]/[your-project]/issues/
```

### Manual Event Logging
```python
import sentry_sdk
from sentry_sdk import capture_event

# Capture custom event
capture_event({
    "message": "Widget discovered",
    "level": "info",
    "tags": {
        "widget_type": "email",
        "discovery_source": "hugging_face"
    }
})

# Capture exception
try:
    result = process_widget(data)
except Exception as e:
    sentry_sdk.capture_exception(e)
```

### Set User Context
```python
import sentry_sdk

sentry_sdk.set_user({
    "id": "block_2_cloud_arch",
    "username": "agent_block_2",
    "email": "block2@widgettdc.local"
})
```

## Dashboard

Access real-time metrics:
- **Error count**: Total errors in system
- **Error rate**: Errors per minute
- **User impact**: How many sessions affected
- **Performance**: Request latency percentiles
- **Releases**: Code deployments and their error rates

## Features You Get

### Feature 1: Error Grouping
Errors are automatically grouped by type and location

```
Similar errors grouped together:
- "Timeout in widget discovery" (245 occurrences)
- "Invalid JSON in config" (98 occurrences)
- "Database connection pool exhausted" (12 occurrences)
```

### Feature 2: Stack Traces
Full stack traces with source code context

```
Traceback:
  File "src/services/widget_discovery.py", line 45, in discover_widgets
    result = call_hugging_face_api(query)
  File "src/integrations/hf_api.py", line 23, in call_hugging_face_api
    response = requests.get(url, timeout=30)
  File "requests/__init__.py", line 61, in get
    return request('get', url, params=params, **kwargs)

Error: requests.exceptions.Timeout: Connection timeout after 30s
```

### Feature 3: Release Tracking
Track which code changes caused issues

```
Release v1.0.0-alpha.5 deployed at 14:32
- 2 new errors introduced
- 1 error fixed (was appearing in v1.0.0-alpha.4)
- Overall health: Improving (3% fewer errors)
```

### Feature 4: User Sessions
Track user journeys leading to errors

```
Session for: Block 5 QASpecialist Agent
Duration: 23 minutes
Actions:
  1. Started widget discovery (14:15)
  2. Scanned 5 Git repos (14:16-14:18)
  3. ERROR: Timeout in repo 4 (14:19)
  4. Retry discovered widgets (14:20)
  5. Conversion started (14:21)
```

### Feature 5: Performance Monitoring
Track response times and bottlenecks

```
Endpoint Performance:
- POST /api/widgets/discover: 2.3s avg (p95: 8.2s)
- POST /api/widgets/convert: 15.2s avg (p95: 45.3s)
- GET /api/widgets/status: 0.1s avg (p95: 0.3s)

Slow transactions:
- Widget conversion pipeline (47% of time in ML inference)
- Database queries (23% of time in index scans)
```

## Usage by Block

### Block 1 - Frontend (UI/UX)
Sentry automatically captures:
- Browser JavaScript errors
- Frontend performance metrics
- User interaction tracking

**Benefit**: See exactly what users experience

### Block 2 - CloudArch (MCP Framework)
Sentry automatically captures:
- MCP service errors
- Message passing failures
- Widget-to-widget communication issues

**Benefit**: Real-time visibility into widget triggering failures

### Block 3 - Security (Error Handling)
Sentry helps validate error handling:
- Confirms all errors are caught
- Tracks unhandled exceptions
- Monitors security-related errors

**Benefit**: Verify error handling effectiveness

### Block 4 - Database (Registry)
Sentry automatically captures:
- Database connection errors
- Transaction failures
- State synchronization issues

**Benefit**: Early warning of data integrity problems

### Block 5 - QA (Widget Discovery)
Sentry automatically captures:
- Discovery pipeline failures
- API integration errors
- Conversion process issues

**Benefit**: Track discovery success rate in real-time

### Block 6 - Security & Compliance
Sentry automatically captures:
- Security validation failures
- Permission denial events
- Compliance audit triggers

**Benefit**: Complete audit trail of security events

## Daily Standup Integration

**How to use Sentry in your daily report**:

```markdown
## Block X - Daily Standup

**Sentry Status**:
- ✅ 0 critical errors in last 24 hours
- 🟡 3 high-priority errors (need investigation)
- 📊 Widget discovery success rate: 94.2%
- ⚡ Average response time: 2.3s

**Error Highlights**:
- Fixed: Timeout in repo scanning (was #1 issue)
- New: JSON parsing error in 2 discovered widgets (investigating)
- Monitoring: MCP state sync (previously unstable, now stable)
```

## Troubleshooting

**Q: How do I know errors are being captured?**
```bash
# Check log file
tail -20 .claude/logs/sentry.log

# Should show recent events
```

**Q: How do I send a custom event?**
```python
import sentry_sdk

sentry_sdk.capture_message(
    "Widget discovery completed: 45 widgets found",
    level="info"
)
```

**Q: How do I track specific metrics?**
```python
import sentry_sdk

# Add breadcrumb (event in user's journey)
sentry_sdk.add_breadcrumb({
    "category": "widget_discovery",
    "message": "Found 3 new widgets",
    "level": "info"
})

# Later, if error occurs, breadcrumbs will be visible
```

**Q: How do I correlate errors with my code changes?**
```bash
# Set release in deployment
export SENTRY_RELEASE="v1.0.0-alpha.5"
python run.py real -c

# Then errors show which release they occurred in
```

## Integration Points

### With Cascade Orchestrator
Sentry automatically tracks:
- Each cascade iteration start/end
- Agent block execution success/failure
- Token usage and costs
- Performance metrics

### With Error Libraries
Sentry receives findings from:
- pytest-error-handler (test failures)
- Hugging Face detector (security issues)
- mypy-strict-mode (type errors)
- Each logged as custom event

### With Daily Standups
Sentry data appears in:
- Block status (error count, trends)
- Performance metrics (response times)
- User impact (how many sessions affected)
- Recommendations (which errors to fix first)

## Success Indicators

**Good Sentry usage**:
- ✅ Error count trending downward over time
- ✅ New errors caught within 1 minute of occurrence
- ✅ Stack traces clearly show cause
- ✅ User sessions explain error context
- ✅ Performance metrics stable or improving

**Underutilized Sentry**:
- ❌ Errors logged but not acted upon
- ❌ High error volume not decreasing
- ❌ No correlation between releases and error spikes
- ❌ Performance metrics not monitored

## Next Steps

1. **Check dashboard**: View recent errors at Sentry dashboard
2. **Review findings**: Understand error patterns
3. **Report in standup**: Include Sentry metrics in daily report
4. **Act on findings**: Fix top errors in priority order
5. **Monitor improvement**: Track error reduction over time

## Questions?

Sentry is production-ready and working perfectly. If you have questions:

1. Check Sentry dashboard for your org
2. Review the integration code at `app/integrations/sentry/`
3. File questions in daily standup (Sentry is **not** the blocker - others are)

---

**Remember**: Sentry is the ONLY error library with NO issues. The others (pytest, Hugging Face, mypy) all have documented workarounds, but Sentry just works.

Real-time error tracking enabled. ✅
