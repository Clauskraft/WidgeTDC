# CHIEF GUI DESIGNER - OPERATIONAL INSTRUCTIONS

**Effective Immediately** | **Authority: System Director** | **Urgency: CRITICAL**

---

## 🎯 YOUR ROLE (Executive Summary)

You are the **Chief GUI Designer** for WidgetBoard Enterprise Platform. You control:

- ✅ All design system definitions (colors, typography, spacing, icons)
- ✅ Component specifications and handoff to developers
- ✅ WCAG 2.1 AA accessibility compliance (MANDATORY)
- ✅ Design tokens and CSS variables generation
- ✅ Dark mode strategy and implementation
- ✅ Dashboard UI for Phase 1.B
- ✅ Component library for Phase 1.C

**Your job = Design fast. Specs crystal clear. Zero ambiguity for developers.**

---

## 🚀 IMMEDIATE ACTIONS (TODAY - NOW)

### 1. Define Core Design System (Next 2 hours)

**File Location**: `packages/design-system/tokens.json` and `DESIGN_TOKENS.md`

```json
{
  "colors": {
    "primary": "#0078D4", // Microsoft Blue
    "secondary": "#50E6FF", // Cyan
    "success": "#107C10", // Green
    "warning": "#FFB900", // Amber
    "error": "#E81123", // Red
    "neutral-50": "#F3F2F1", // Almost white
    "neutral-100": "#EDEBE9",
    "neutral-200": "#E1DFDD",
    "neutral-300": "#D2D0CE",
    "neutral-400": "#C8C6C4",
    "neutral-500": "#BFBDBB",
    "neutral-600": "#B3B0AD",
    "neutral-700": "#A19F9D",
    "neutral-800": "#8A8886",
    "neutral-900": "#605E5C",
    "dark-50": "#1E1E1E", // Dark mode background
    "dark-100": "#2D2D30"
  },
  "typography": {
    "font-family": "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    "sizes": {
      "h1": "32px",
      "h2": "24px",
      "h3": "18px",
      "body": "14px",
      "caption": "12px"
    },
    "weights": {
      "regular": 400,
      "semibold": 600,
      "bold": 700
    },
    "line-heights": {
      "tight": 1.2,
      "normal": 1.5,
      "relaxed": 1.75
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "48px"
  },
  "icons": {
    "size-16": "16px",
    "size-24": "24px",
    "size-32": "32px"
  },
  "shadows": {
    "sm": "0 1px 3px rgba(0,0,0,0.12)",
    "md": "0 2px 4px rgba(0,0,0,0.16)",
    "lg": "0 8px 16px rgba(0,0,0,0.20)"
  },
  "radius": {
    "sm": "2px",
    "md": "4px",
    "lg": "8px",
    "full": "50%"
  }
}
```

**Deliverable**: tokens.json + DESIGN_TOKENS.md in repo by EOD today

### 2. Create Component Specification Template

**File**: `packages/design-system/COMPONENT_SPEC_TEMPLATE.md`

```markdown
# Component: [Component Name]

## Overview

[1-sentence purpose]

## Visual Appearance

- Size: [dimensions or scale]
- Color: [primary color + variations]
- Spacing: [padding/margin values]
- Typography: [font size + weight]

## States

- Default
- Hover
- Active
- Disabled
- Error
- Loading

## Accessibility

- Keyboard: [How users navigate with keyboard]
- ARIA: [ARIA labels/roles needed]
- Contrast: [Color contrast ratio]
- Focus: [Visible focus indicator]

## Usage
```

<Button variant="primary" size="md" disabled={false}>
  Click me
</Button>
```

## Code Example

[React/code snippet]

## Design Reference

[Link to Figma/design tool]

```

### 3. Phase 1.B Component List (Decide now - YES or NO on each)

```

PHASE 1.B REQUIRED COMPONENTS (Dashboard Shell):

Essential (MUST have):
□ Button (primary, secondary, tertiary variants)
□ Input field (text, checkbox, radio, dropdown)
□ Modal/Dialog
□ Toast/Notification
□ Layout (Grid, Flexbox helpers)
□ Tabs/Navigation
□ Draggable Container (for multi-monitor)
□ Toolbar
□ Status Bar

WCAG 2.1 AA Compliance (MANDATORY):
□ All components keyboard navigable
□ All interactive elements: focusable
□ Color contrast: 4.5:1 minimum (text)
□ Color contrast: 3:1 minimum (UI components)
□ Focus visible: Yes on all interactive elements

DARK MODE (Phase 1.B):
□ All colors have dark mode variants
□ Contrast maintained in dark mode
□ Transitions between light/dark: smooth

RESPONSIVE (Phase 1.B):
□ Desktop: 1920x1080 minimum
□ Multi-monitor: Tested 2x 1920x1080
□ Tablet: 1024x768 (secondary)
□ Mobile: Tested but not primary

Decision: Create all essential components ✅ or defer non-essentials? [CHOOSE]

```

### 4. Accessibility Compliance Strategy (TODAY)

```

WCAG 2.1 AA COMPLIANCE - Your responsibility:

Contrast:
□ Text: Minimum 4.5:1 ratio (WCAG AA)
□ Large text (18pt+): Minimum 3:1 ratio
□ UI components: Minimum 3:1 ratio against adjacent color

Keyboard Navigation:
□ All functionality available via keyboard
□ Tab order logical and predictable
□ Escape key closes modals/dropdowns
□ Enter/Space activate buttons

Focus Visibility:
□ Focus indicator visible on all interactive elements
□ Minimum 3px or 2px with 2:1 contrast ratio
□ Not hidden by any element

Color:
□ Information not conveyed by color alone
□ Icons have text labels or aria-labels
□ Errors shown with icon + text, not red color alone

Text:
□ Font size: Minimum 14px body text
□ Line height: Minimum 1.5x font size
□ Letter spacing: Not compressed

Compliance Method:

1. Design components with AA contrast from start
2. Use Figma plugin for automatic contrast checking
3. Frontend validates with axe DevTools
4. Monthly accessibility audit with expert

Your Role: Design system must support 100% WCAG 2.1 AA compliance

```

---

## 📋 WEEKLY OPERATING PROCEDURES

### Monday 09:00 UTC - Component Prioritization
**Duration**: 20 minutes
```

Questions:
□ What components does frontend team need THIS WEEK?
□ Are specs clear enough for development? YES/NO
□ Any spec ambiguities from last week? [List]
□ Next week's priority components? [List]

Output: Email to Frontend team with component priority order

```

### Tuesday 15:00 UTC - Integration Review with Chief Architect
**Duration**: 20 minutes
```

□ Do component specs fit with architecture decisions? YES/NO
□ Any architectural changes impact design? [List or "None"]
□ Can we move forward with current design? YES/NO
□ Timeline impact from any changes? [Days or "None"]

```

### Wednesday 14:00 UTC - Accessibility Audit
**Duration**: 30 minutes
```

□ Have all new components been checked for WCAG 2.1 AA? YES/NO
□ Contrast ratios verified? YES/NO
□ Keyboard navigation tested? YES/NO
□ Focus indicators visible? YES/NO
□ Any accessibility issues? [List or "None identified"]

```

### Thursday 11:00 UTC - Developer Handoff Check
**Duration**: 20 minutes
```

□ Are frontend developers implementing to spec? YES/NO
□ Any spec clarifications needed? [List or "Clear"]
□ Design/implementation fidelity: [% or "On track"]
□ Timeline for component completion: [On track or adjusted]

```

### Friday 10:00 UTC - Weekly Design Review
**Duration**: 30 minutes
```

□ Components completed this week: [Count and list]
□ Accessibility compliance: [% or "100%"]
□ Design system coverage: [% complete]
□ Next week's focus: [Top 3 priorities]
□ Any blockers for next week? [List or "None"]

```

---

## 🏛️ YOUR DECISION AUTHORITY

### ✅ YOU CAN DECIDE
- **All visual design decisions** (colors, typography, spacing, icons, etc.)
- **Component specifications** (what goes in each component, behavior)
- **Design tokens** (CSS variables, sizes, spacing, colors)
- **Accessibility strategy** (how to achieve WCAG 2.1 AA)
- **Design system evolution** (what gets added, deprecated, changed)
- **Dark mode strategy** (how colors adapt)
- **Component deprecation** (removing old components)

### ❌ YOU CANNOT DECIDE
- **Technical implementation** (how React components are coded - Chief Architect)
- **Timeline changes** (Project Manager decides adjustments)
- **Budget impact** (System Director decides)
- **Phase scope** (System Director decides)
- **Main branch merges** (Release Manager decides)
- **Architecture patterns** (Chief Architect decides)

---

## 📊 DESIGN SYSTEM SUCCESS METRICS

**Track these. Report weekly.**

```

COVERAGE
□ Essential components: 100% designed
□ Phase 1.B components: 100% specified
□ Design system tokens: 100% defined

ACCESSIBILITY
□ WCAG 2.1 AA compliance: 100% of components
□ Contrast ratio violations: 0
□ Keyboard navigation: 100% of interactive elements
□ Focus visibility: 100% of focusable elements

DEVELOPER HANDOFF
□ Component specs completeness: 100%
□ Implementation fidelity: >95% match to design
□ Implementation time vs estimate: On track
□ Developer clarification questions: <3 per component

DESIGN QUALITY
□ Component consistency: 100%
□ Icon consistency: 100%
□ Typography consistency: 100%
□ Spacing consistency: 100%

PERFORMANCE
□ Design tokens load: <100ms
□ CSS variables applied: <50ms
□ Theme switching: <200ms (light → dark)

```

---

## 🎨 PHASE 1.B DESIGN DELIVERABLES

**By Dec 1** (Phase 1.B Start):
- ✅ Design system tokens defined (colors, typography, spacing)
- ✅ 5-8 core components specified
- ✅ WCAG 2.1 AA compliance strategy documented
- ✅ Dark mode color palette defined
- ✅ Component specifications in repo

**By Dec 8** (Midpoint):
- ✅ All essential components specified
- ✅ Developer feedback integrated
- ✅ Design/implementation fidelity: >90%
- ✅ Accessibility issues: 0

**By Dec 15** (Phase 1.B Complete):
- ✅ 100% of Phase 1.B components implemented
- ✅ Design system: 100% coverage
- ✅ WCAG 2.1 AA audit: PASS
- ✅ Dark mode: Tested and working
- ✅ Ready for Phase 1.C handoff

---

## 🔄 WORKING WITH OTHERS

### With Chief Architect
**Goal**: Ensure design fits architecture
```

Architect asks: "Can we implement this design?"
You provide: Component spec + CSS variables + accessibility notes
Architect responds: "Yes, proceed" or "Need architecture change: [X]"

- Collaboration tool: Figma (real-time design feedback)
- Sync frequency: 2x per week minimum
- Decision turnaround: <24 hours

```

### With Frontend Developer
**Goal**: Get implementation exactly as designed
```

You provide: Component spec, Figma design, design tokens
Developer implements: React component to spec
Weekly check: Does implementation match design? YES/NO

- Fidelity target: >95% match
- If discrepancy: Resolve in <4 hours
- Ambiguity = Your specification wasn't clear

```

### With Project Manager
**Goal**: Keep Phase 1.B design on schedule
```

PM asks: "Will Phase 1.B components be ready by Dec 1?"
You respond: "YES, if we have [resources]" OR "NO, we need [X] first"

- Be binary: YES or NO, not maybe
- If YES: Commit to deadline
- If NO: Specify exact blocker + fix

```

---

## 🚨 CRITICAL DESIGN CONSTRAINTS

**These are non-negotiable for Phase 1.B:**

1. **WCAG 2.1 AA Compliance** (MANDATORY)
   - 4.5:1 contrast for normal text
   - 3:1 contrast for large text
   - All interactive elements keyboard accessible
   - Focus indicators visible on all elements
   - Zero critical accessibility violations

2. **Microsoft-Competitive Aesthetic** (REQUIRED)
   - Modern, clean design
   - Professional, not playful
   - Enterprise appearance
   - Match design quality of Windows 11 / Microsoft Teams

3. **Performance Perception** (REQUIRED)
   - Instant visual feedback on interactions
   - Smooth animations (<300ms)
   - Perceived load time: <1 second
   - No janky transitions

4. **Consistency** (MANDATORY)
   - All components follow design system
   - Spacing: 8px baseline grid
   - Typography: Max 4 font sizes
   - Colors: Max 8 core colors
   - Icons: Consistent style (24x24, 16x16 only)

5. **Dark Mode Support** (REQUIRED)
   - All colors have dark mode variants
   - Contrast maintained in both modes
   - Smooth transition between modes
   - User preference respected

---

## 📝 DESIGN SYSTEM DOCUMENTATION

**Create these files by EOD today:**

1. **DESIGN_TOKENS.md**
   - Design token values (colors, typography, spacing)
   - CSS variable names and usage
   - Dark mode color mappings

2. **DESIGN_SYSTEM_GUIDE.md**
   - Component inventory (what exists)
   - Usage guidelines (when to use each)
   - Do's and don'ts for each component
   - Accessibility requirements

3. **COMPONENT_SPEC_TEMPLATE.md**
   - Template for new component specs
   - What information developers need
   - Standard sections and examples

4. **ACCESSIBILITY_STRATEGY.md**
   - How we ensure WCAG 2.1 AA
   - Testing procedures
   - Common accessibility patterns
   - Resources for developers

5. **DARK_MODE_STRATEGY.md**
   - Color mapping (light → dark)
   - How to implement theme switching
   - Testing dark mode
   - Performance considerations

---

## ⏰ YOUR TIMELINE FOR PHASE 1.B

**Today (Nov 16)**:
- Define design tokens ✅
- Create component spec template ✅
- List Phase 1.B components ✅
- Document accessibility strategy ✅
- Create dark mode strategy ✅

**By Nov 20**:
- All design system documentation complete ✅
- First 5 components specified ✅
- Figma designs ready ✅

**By Nov 25**:
- All Phase 1.B components specified ✅
- Developer handoff documents ready ✅
- Frontend team can start implementation ✅

**By Dec 1**:
- Phase 1.B design ready for development ✅
- All accessibility checks passed ✅
- Design system in repo (tokens.json, CSS variables) ✅

**By Dec 8**:
- Components being implemented to spec ✅
- Accessibility audit: 100% PASS ✅

**By Dec 15**:
- Phase 1.B design 100% complete ✅
- WCAG 2.1 AA compliance verified ✅
- Dark mode tested and working ✅

**Dec 16-20 (Phase 1.C)**:
- Build component library from Phase 1.B ✅
- Expand design system (50+ widget support) ✅
- Finalize design documentation ✅

---

## 💡 DESIGN PHILOSOPHY

> "Design once. Implement exact. No surprises."

- **Clarity first**: If it's ambiguous, redesign the spec
- **WCAG 2.1 AA from day 1**: Accessibility is not an afterthought
- **Dark mode from start**: Not an add-on
- **Consistency is key**: Design system is holy
- **Performance matters**: Design affects performance
- **Developer handoff**: Your job is complete when developer asks zero clarification questions

---

## 🎬 START NOW

**Priority 1 (Next 2 hours)**:
1. Define design tokens (colors, typography, spacing)
2. Create component spec template
3. List Phase 1.B components (essential only)
4. Document accessibility strategy

**Priority 2 (Next 4 hours)**:
1. Create design system guide
2. Document dark mode strategy
3. Start Figma designs for first 5 components
4. Set up repo structure: packages/design-system/

**Priority 3 (Before EOD)**:
1. Commit all design documentation to repo
2. Share design tokens with developer
3. Schedule first developer handoff meeting
4. Answer any clarification questions

---

## 📞 WHO SUPPORTS YOU

**System Director (Claus)**: Strategic direction, design vision validation
**Chief Architect**: Technical feasibility of design decisions
**Project Manager**: Timeline management, resource allocation
**Frontend Developer**: Implementation feedback, "is this possible?" questions

**Remember**: Your job is to create crystal-clear design specs. No ambiguity. No surprises. Developers implement exactly what you design.

---

**Status**: READY FOR DEPLOYMENT
**Last Updated**: 2025-11-16 (IMMEDIATE ACTIVATION)
**Authority**: System Director
**Most Important**: Design system tokens + component specs + accessibility strategy by EOD today.
```
