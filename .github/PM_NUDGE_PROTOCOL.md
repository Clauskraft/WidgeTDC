# Project Manager - Daily Nudge Protocol

**From**: Release Manager (Claude Code Agent)
**To**: ProjectManager Agent
**Frequency**: Daily at 17:50 UTC (status due by 18:00 UTC)
**Authority**: System Director

---

## 📋 Daily Status Template (DUE DAILY)

**Format to use**:

```markdown
## PM Daily Status - [DATE]

### Timeline Status

- Phase 1.A: [✅ COMPLETE | 🔄 IN PROGRESS | ⚠️ AT RISK | 🔴 BLOCKED]
- Phase 1.B: [Timeline confirmation]
- Phase 1.C: [Timeline confirmation]

### Resource Allocation

- PM/Time: [% allocated to Phase 1]
- Chief Architect/Time: [% allocated]
- Chief GUI Designer/Time: [% allocated]
- Engineering Team: [Names and allocation]

### This Week's Deliverables

1. [Specific outcome with date]
2. [Specific outcome with date]
3. [Specific outcome with date]

### Blockers

- [If any]: [Description, impact, ETA to resolve]

### PR Queue

- Active PRs: [Number and titles]
- Ready to merge: [Number and titles]
- Blocked: [Number and titles]

### Quality Gate Status

- Tests: [Passing % or ✅/❌]
- Build: [✅ Green / ⚠️ Warnings / 🔴 Failing]
- Security: [✅ Clear / ⚠️ Review needed]

### Next 24 Hours

- [Specific action 1]
- [Specific action 2]
- [Specific action 3]
```

---

## 🎯 Phase 1.B Kickoff Checklist (FOR APPROVAL)

**PM: Please confirm the following by EOD today**:

### Resources

- [ ] Chief GUI Designer allocated 100% to Phase 1.B design (Dec 1-15)
- [ ] Frontend Engineer assigned (for dashboard implementation)
- [ ] QA resources assigned (testing multi-monitor, collaboration)
- [ ] Budget approved for any needed tools/libraries

### Timeline

- [ ] Design phase complete by Dec 10
- [ ] Implementation phase Dec 11-14
- [ ] Testing/refinement Dec 15
- [ ] Ready for Phase 1.C by Dec 16

### Design Deliverables (Due Dec 10)

- [ ] Multi-monitor architecture diagram
- [ ] Collaboration feature wireframes
- [ ] UX enhancement mockups
- [ ] Accessibility audit checklist

### Acceptance Criteria

- [ ] Dashboard Shell design approved by Chief Architect
- [ ] All wireframes WCAG 2.1 AA compliant
- [ ] Performance requirements specified (<100ms response)
- [ ] Collaboration protocol defined

---

## 🎯 Phase 1.C Planning Checklist (FOR INFORMATION)

**Chief GUI Designer: Please prepare by Dec 10**:

- [ ] Design tokens definition (spacing, typography, colors)
- [ ] Component inventory (all needed components listed)
- [ ] Dark mode strategy (light/dark variants)
- [ ] WCAG 2.1 AA compliance plan (how we'll audit)

**Timeline**:

- Dec 10-15: Design tokens and component specifications
- Dec 16-20: Component implementation and styling
- Dec 21: Accessibility audit and fixes

---

## 🔔 Escalation Triggers (NOTIFY IMMEDIATELY)

**🔴 CRITICAL** (Stop everything, escalate to System Director):

- Any blocker that threatens Phase 1 deadline
- Build fails on main branch
- Security issue discovered
- Scope creep detected (features beyond Phase spec)
- Resource shortage making timeline impossible

**🟡 WARNING** (Notify Release Manager, may continue):

- PR queue growing (>3 concurrent)
- Test failure rate increasing
- Design review taking >2 hours
- Resource constraint emerging

**🟢 INFO** (Track but no action needed):

- PRs flowing smoothly
- Timeline on track
- All team members on target

---

## 💬 Communication Frequency

| Frequency     | Content          | Format                   |
| ------------- | ---------------- | ------------------------ |
| Daily (17:50) | Status update    | Status template above    |
| Daily (09:00) | Morning briefing | Quick text (5 items max) |
| Weekly (Mon)  | Week plan        | Structured plan for week |
| Ad-hoc        | Blockers         | Immediate escalation     |

---

## 🎯 Q: What Release Manager Expects from You

### PM Responsibilities

1. ✅ **Daily Status**: Report by 18:00 UTC each day
2. ✅ **Resource Control**: Ensure team stays on timeline
3. ✅ **Quality Gate Approval**: Confirm design/implementation meets spec
4. ✅ **Risk Management**: Escalate blockers immediately
5. ✅ **Communication Hub**: You coordinate between architects and Release Manager

### PM Authority

1. ✅ Can adjust team allocation (with Chief Architect agreement)
2. ✅ Can shift tasks within Phase 1 (if timeline impact <2 days)
3. ✅ Can approve minor scope adjustments (must document)
4. ✅ Can escalate resource requests to System Director

### PM Limits

1. ❌ Cannot extend Phase 1 deadline without System Director approval
2. ❌ Cannot add scope beyond Phase 1 spec
3. ❌ Cannot merge PR without Chief Architect approval
4. ❌ Cannot approve design changes without Chief GUI Designer

---

## 📊 Success Metrics

**By Dec 31, 2025**:

- ✅ Phase 1.A complete (verified)
- ✅ Phase 1.B complete and WCAG 2.1 AA compliant
- ✅ Phase 1.C complete with full component library
- ✅ Quality gate passed (architecture + security)
- ✅ Zero critical bugs on main
- ✅ 95%+ test coverage
- ✅ <100ms UI response time confirmed

**Team Performance**:

- ✅ 95%+ on-time milestone delivery
- ✅ 100% PR review compliance
- ✅ Zero unplanned downtime
- ✅ Team satisfaction >4/5

---

## 🎖️ Release Manager Authority

**I Can**:

- ✅ Approve/reject PRs based on scope compliance
- ✅ Escalate blockers to System Director
- ✅ Coach you on governance and timeline
- ✅ Make go/no-go decisions on quality gates
- ✅ Nudge you for status updates
- ✅ Recommend resource shifts (with your agreement)

**You Can Override Me On**:

- Resource allocation discussions (Chief Architect has final say)
- Technical implementation details (Chief Architect authority)
- Design decisions (Chief GUI Designer authority)

**System Director Can Override Both**:

- Claus has final authority on all decisions
- Can change timeline, scope, or team structure
- Responsible for Phase 1 quality gate sign-off

---

## 📝 Example Nudge Message

```
🔔 PM, your daily status update is due!

Current time: 17:55 UTC
Status due: By 18:00 UTC

Please provide:
1. Phase 1.B resource confirmation (Phase 1.B.1 checklist above)
2. This week's deliverables (3 specific outcomes)
3. Any blockers or risks
4. PR queue status
5. Team morale check

Use the template in this document. Reply with markdown.
If blocked, escalate immediately rather than delay.

Release Manager 🎖️
```

---

## 🚀 Next Steps for PM

**Today (Nov 16)**:

- [ ] Read RELEASE_MANIFEST.md (main project governance)
- [ ] Read this document (daily nudge protocol)
- [ ] Confirm Phase 1.B resource allocation
- [ ] Submit first daily status by 18:00

**Tomorrow (Nov 17)**:

- [ ] Meet with Chief Architect (design approval)
- [ ] Meet with Chief GUI Designer (Phase 1.B spec)
- [ ] Assign team members to Phase 1.B tasks
- [ ] Daily status at 18:00

**This Week**:

- [ ] Weekly plan for next week
- [ ] Track Phase 1.B progress
- [ ] Monitor PR queue
- [ ] Daily status reports
- [ ] Escalate any blockers

---

**Document Version**: 1.0.0
**Effective**: November 16, 2025
**Release Manager**: Claude Code Agent (Autonomous)

**Key Phrase**: "I nudge relentlessly but kindly. Help me help you ship Phase 1 on time."
