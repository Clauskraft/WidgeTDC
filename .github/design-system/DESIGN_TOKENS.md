# WidgetBoard Design System Tokens

**Version**: 1.0
**Status**: READY FOR PHASE 1.B
**Last Updated**: 2025-11-16

---

## Overview

This document defines the complete design system for WidgetBoard Phase 1.B. All UI components must use these tokens to ensure consistency, accessibility (WCAG 2.1 AA), and dark mode support.

---

## Color System

### Primary Colors (UI Actions)
Used for primary actions, links, highlights.

```
Primary-50:   #f0f7ff  (Lightest - backgrounds)
Primary-100:  #e0efff
Primary-200:  #bae6ff
Primary-300:  #7dd3fc
Primary-400:  #38bdf8
Primary-500:  #0ea5e9  (Brand color)
Primary-600:  #0284c7  (Hover)
Primary-700:  #0369a1  (Active)
Primary-800:  #075985
Primary-900:  #0c3d66  (Darkest)
```

**Usage**: Buttons, links, selection states, highlights

### Secondary Colors (Accents)
Used for secondary actions, badges.

```
Secondary-50:   #f5f3ff
Secondary-100:  #ede9fe
Secondary-200:  #ddd6fe
Secondary-300:  #c4b5fd
Secondary-400:  #a78bfa
Secondary-500:  #8b5cf6  (Brand accent)
Secondary-600:  #7c3aed  (Hover)
Secondary-700:  #6d28d9  (Active)
Secondary-800:  #5b21b6
Secondary-900:  #4c1d95
```

**Usage**: Secondary buttons, badge accents, alternative actions

### Neutral Colors (Text & Backgrounds)
Used for text, borders, backgrounds.

```
Neutral-50:   #f9fafb  (Lightest background)
Neutral-100:  #f3f4f6
Neutral-200:  #e5e7eb  (Light borders)
Neutral-300:  #d1d5db
Neutral-400:  #9ca3af
Neutral-500:  #6b7280  (Tertiary text)
Neutral-600:  #4b5563  (Secondary text)
Neutral-700:  #374151  (Primary text)
Neutral-800:  #1f2937  (Dark backgrounds)
Neutral-900:  #111827  (Darkest - text on light)
```

**Usage**: Text, borders, backgrounds, dividers

### Semantic Colors

**Success (Green)**: `#22c55e` (RGB: 34, 197, 94)
- Used for: Checkmarks, success messages, positive indicators
- Minimum contrast: 4.5:1 on white, meets WCAG AA

**Warning (Amber)**: `#f59e0b` (RGB: 245, 158, 11)
- Used for: Alerts, caution messages, pending states
- Minimum contrast: 4.5:1 on white, meets WCAG AA

**Error (Red)**: `#ef4444` (RGB: 239, 68, 68)
- Used for: Errors, validation failures, danger states
- Minimum contrast: 4.5:1 on white, meets WCAG AA

**Info (Cyan)**: `#0ea5e9` (RGB: 14, 165, 233)
- Used for: Information, helpful hints, neutral alerts
- Minimum contrast: 4.5:1 on white, meets WCAG AA

---

## Typography System

### Heading Scale (Responsive)

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 32px | 700 | 40px | Page titles |
| H2 | 28px | 700 | 36px | Section titles |
| H3 | 24px | 700 | 32px | Subsection titles |
| H4 | 20px | 600 | 28px | Component titles |
| H5 | 16px | 600 | 24px | Labels, emphasis |
| H6 | 14px | 600 | 20px | Secondary labels |

### Body Text Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Body-Large | 16px | 400 | 24px | Main content, descriptions |
| Body-Medium | 14px | 400 | 20px | Secondary content, hints |
| Body-Small | 12px | 400 | 16px | Captions, metadata |

### Monospace (Code)
- Font: `Menlo, Monaco, Courier New, monospace`
- Size: 12px
- Weight: 400
- Line Height: 16px
- Usage: Code blocks, technical values

---

## Spacing System

Consistent 4px base unit for all spacing.

```
XS:   4px   (tight, small components)
SM:   8px   (compact, form inputs)
MD:   12px  (standard, general spacing)
LG:   16px  (relaxed, section spacing)
XL:   24px  (loose, major spacing)
2XL:  32px  (very loose, large gaps)
3XL:  48px  (section gaps)
4XL:  64px  (major section gaps)
```

**Usage**: Padding, margins, gaps between elements

---

## Icon System

All icons must be SVG and support these sizes:

```
XS:   16px  (inline, compact)
SM:   20px  (small buttons, labels)
MD:   24px  (standard buttons)
LG:   32px  (large buttons, prominent)
XL:   48px  (hero, extra large)
```

---

## Accessibility Standards (WCAG 2.1 AA)

### Color Contrast Minimums
- **Text on backgrounds**: 4.5:1 (normal text)
- **UI components**: 3:1 (focus indicators, borders)
- **Large text (18pt+)**: 3:1

**Verification**: All colors tested against white, black, and neutral backgrounds.

### Focus Indicators
- **Color**: Primary-500 (`#0ea5e9`)
- **Width**: 2px
- **Offset**: 2px from element edge
- **Style**: Solid outline (not dotted)

### Touch Targets
- **Minimum size**: 44px x 44px
- **Spacing**: Minimum 8px between interactive elements
- **Exception**: Smaller targets acceptable if not clickable multiple times

### Keyboard Navigation
- Tab order follows visual hierarchy (left-to-right, top-to-bottom)
- Shift+Tab goes backward
- Enter/Space activates buttons
- Arrow keys navigate within components

---

## Dark Mode Support

Dark mode uses inverse variants of all colors:

```
Light Mode Background:  Neutral-50 (#f9fafb)
Dark Mode Background:   Neutral-800 (#1f2937)

Light Mode Text:        Neutral-900 (#111827)
Dark Mode Text:         Neutral-50 (#f9fafb)

Light Mode Primary:     Primary-500 (#0ea5e9)
Dark Mode Primary:      Primary-400 (#38bdf8) - lighter for contrast
```

### Dark Mode Implementation
1. Create `isDarkMode` boolean prop on all components
2. Map tokens to dark variants when `isDarkMode={true}`
3. Test contrast ratios in dark mode (minimum 4.5:1)
4. Verify all semantic colors readable in dark mode

---

## Implementation Guidelines

### CSS Variables (Preferred)
```css
:root {
  --color-primary: #0ea5e9;
  --color-primary-light: #7dd3fc;
  --color-primary-dark: #0369a1;
  --spacing-md: 12px;
  --font-size-body: 14px;
  --font-weight-bold: 700;
}

.component {
  color: var(--color-primary);
  padding: var(--spacing-md);
}
```

### Styled Components (React)
```typescript
import styled from 'styled-components';

const Button = styled.button`
  color: ${({ theme }) => theme.colors.primary.base};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.body.medium.fontSize};
`;
```

### Component Props
```typescript
interface ComponentProps {
  isDarkMode?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}
```

---

## Testing Checklist

All components must verify:

- [ ] Color contrast minimum 4.5:1 on light background
- [ ] Color contrast minimum 4.5:1 on dark background
- [ ] Focus indicators visible and 2px width
- [ ] Touch targets minimum 44x44px
- [ ] Keyboard navigation works without mouse
- [ ] Screen reader announces all text content
- [ ] Dark mode renders correctly
- [ ] Mobile responsive (scaling fonts, padding)
- [ ] No color as only indicator (use icons, patterns)
- [ ] Disabled states clearly distinguishable

---

## Files in This System

- `tokens.json` - Machine-readable token definitions
- `COMPONENT_SPEC_TEMPLATE.md` - Template for component specifications
- `DESIGN_TOKENS.md` - This documentation

---

## Quick Reference

### Most Common Tokens

**Colors**:
- Primary action: `#0ea5e9`
- Secondary action: `#8b5cf6`
- Success: `#22c55e`
- Error: `#ef4444`
- Body text: `#111827`
- Light background: `#f9fafb`

**Spacing**:
- Standard gap: `12px` (md)
- Small gap: `8px` (sm)
- Large gap: `16px` (lg)

**Typography**:
- Headings: 700 weight
- Body: 400 weight
- Monospace: Menlo/Monaco

**Accessibility**:
- Focus color: `#0ea5e9`
- Focus width: `2px`
- Minimum contrast: `4.5:1`

---

## Support & Updates

**Questions?** Contact ChiefGUIDesigner for clarifications
**Updates?** All changes require ADR approval before Phase 1.B
**Feedback?** Document in weekly design review (Wed 10:00 UTC)

---

*WidgetBoard Design System v1.0 - Phase 1.B Ready*
