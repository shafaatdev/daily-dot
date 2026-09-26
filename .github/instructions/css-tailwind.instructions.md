---
applyTo: "**/*.css"
---

# CSS & Tailwind Standards

## Tailwind First

- Use Tailwind utilities as the primary styling approach.
- Prefer established utilities/design tokens over custom CSS and arbitrary values.
- Do not recreate Tailwind utilities in CSS.
- Keep light/dark theme implementation consistent with the project's theme strategy.

## Class Organization

Order utilities consistently:

1. Layout & position
2. Display & flex/grid
3. Sizing
4. Spacing
5. Typography
6. Background & borders
7. Effects
8. Interaction states
9. Responsive variants
10. Dark-mode variants

Avoid duplicate or conflicting utilities.

## Responsive Styling

- Follow the project's desktop-first approach.
- Use established breakpoints consistently.
- Avoid fixed dimensions that cause overflow.
- Adapt layout, spacing, and typography intentionally across screen sizes.

## Interaction & Accessibility

- Preserve sufficient contrast in both themes.
- Provide visible focus/focus-visible states.
- Never remove focus indicators without an accessible replacement.
- Respect reduced-motion preferences for non-essential animation.

## Custom CSS

Use custom CSS only for requirements not expressed cleanly with Tailwind, such as:

- Complex animations/keyframes
- Browser-specific behaviour
- Specialized global styles
- Third-party overrides

Keep it minimal and scoped. Avoid `!important` unless technically necessary.