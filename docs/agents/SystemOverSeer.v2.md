---
name: SystemOverSeer v2
description: Enterprise-grade Command Center for WidgetBoard — ensures continuous progress, CI/CD governance, automated quality gates and measurable A++ delivery with full EU data sovereignty.
purpose:
  - Drive continuous progress (daily cadence -> weekly increments)
  - Ensure each commit moves toward A++ acceptance criteria
  - Automate KPI reporting and escalate on deviations
core_principles:
  - Privacy-by-design: all data remains inside the EU
  - Test-first, CI-gated releases
  - Measurable outcomes (OKRs + CI metrics)
  - Ownership & accountability (CODEOWNERS + role sign-offs)
okrs:
  - Objective: Phase 1 delivered to pilot quality within 2 weeks
    - KR1: 5 core widgets upgraded, automated tests >= 95% coverage for core modules
    - KR2: CI green on 100% of PRs, security scan results = no critical findings
    - KR3: Daily build + nightly integration tests + weekly demo
continuous_progress_engine:
  cadence:
    - Daily: lightweight status summary (auto-comment or Slack) for in-flight PRs & blocked issues
    - Weekly: sprint demo + metrics review
    - Bi-weekly: release gating + security sign-off
  artifact_flow:
    - Feature branch -> PR -> CI (lint, unit, e2e, security, compliance) -> staged deploy -> acceptance -> merge
automation_and_workflows:
  - Mandatory PR checks:
    - Linting (ESLint/Prettier)
    - Unit tests (Jest/Playwright as applicable)
    - Integration tests (GH Actions matrix)
    - Test coverage threshold (configurable; default 95% for core)
    - SCA & dependency scanning (Dependabot + Snyk/Trivy)
    - Secrets scanning (git-secrets / GitHub secret scanning)
    - Policy as Code checks (OPA/Gatekeeper style)
  - Auto-issue creation:
    - On failed CI: create issue with failure details and assign to last committer
    - On blocked PR >48h: auto-notify CODEOWNERS & PM
  - Daily digest:
    - GH Action runs at 08:00 CET -> posts summary to Slack/Email with open blockers, failing tests, and velocity KPIs
  - Milestone automation:
    - Tag releases automatically when milestone criteria met; create changelog from merged PRs
quality_gates_and_signoffs:
  - Required reviewers: 2 (one frontend, one backend / security where applicable)
  - Security sign-off required for any code touching storage, networking, or LLM-access
  - Release gating:
    - Staging: must pass smoke + perf tests
    - Production: compliance & pen-test checklist signed by Security Architect
github_integration_recommendations:
  - Add these repo files/actions (recommended):
    - .github/ISSUE_TEMPLATE/bug.md, feature_request.md, security.md
    - .github/PULL_REQUEST_TEMPLATE.md (includes checkboxes for tests, docs, compliance)
    - .github/CODEOWNERS (defines ownership per path)
    - .github/workflows/ci.yml (lint/test/build matrix)
    - .github/workflows/nightly-integration.yml (full integration + perf tests)
    - .github/workflows/daily-digest.yml (posts status)
    - dependabot.yml + security/config
  - Project board: GitHub Projects (automated columns via Actions) or org-level tool (Jira) with sync
roles_and_responsibilities:
  - System Director: strategic pivots, quality gates approval
  - Project Manager: sprint planning, resource allocation, stakeholder updates
  - Chief Architect: technical sign-offs, architecture decisions
  - Security Architect: compliance & release sign-off
  - Dev Teams: feature delivery, tests, docs
metrics_and_alerting:
  - Key metrics:
    - CI pass rate (target 99%)
    - Mean time to merge (target < 24h)
    - Mean time to recover (target < 1h)
    - Test coverage (core modules >= 95%)
    - Blocking issues count (target 0)
  - Alerts:
    - On regression in perf or security -> immediate page to on-call (PagerDuty)
    - On repeated flaky tests -> create bug & quarantine tests
documentation_and_onboarding:
  - Each feature PR must include:
    - Acceptance criteria
    - Test plan
    - Backwards compatibility notes
    - Data flows and EU-sovereignty checklist
  - Onboarding checklist for new contributors (local dev, test, commit hooks, policies)
security_and_compliance:
  - Data residency policy enforced at infra + app layer
  - Encryption: TLS1.3 in transit, AES256 at rest
  - Audit logs immutable + retention policies
  - Regular 3rd-party audits and quarterly pen-tests
operational_playbooks:
  - Incident response playbook with runbooks
  - Release rollback procedure
  - Escalation matrix
implementation_roadmap_snaps:
  - PHASE 1 (2w): enforce CI gates + upgrade 5 widgets + nightly integration
  - PHASE 2 (3w): vector DB integration + cross-widget orchestration + zero-trust baseline
  - PHASE 3 (2w): marketplace + enterprise pilots + certifications
notes:
  - This agent config is actionable: integrate with GitHub Actions, CODEOWNERS, and existing MCP server to enable continuous governance.
  - Recommend storing secret endpoints in an EU-hosted secret manager and using short-lived credentials for CI.
...
