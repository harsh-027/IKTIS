---
name: Calm Precision
colors:
  surface: '#fcf8fb'
  surface-dim: '#dcd9dc'
  surface-bright: '#fcf8fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7ea'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#414753'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#727784'
  outline-variant: '#c1c6d5'
  surface-tint: '#005cba'
  primary: '#004e9f'
  on-primary: '#ffffff'
  primary-container: '#0066cc'
  on-primary-container: '#dfe8ff'
  inverse-primary: '#aac7ff'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#883700'
  on-tertiary: '#ffffff'
  tertiary-container: '#af4900'
  on-tertiary-container: '#ffe3d6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458e'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb692'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#793000'
  background: '#fcf8fb'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  primary-focus: '#0071e3'
  primary-on-dark: '#2997ff'
  ink: '#1d1d1f'
  muted: '#7a7a7a'
  canvas: '#ffffff'
  canvas-soft: '#f5f5f7'
  surface-pearl: '#fafafc'
  dark-tile: '#272729'
  border: '#e0e0e0'
  divider: '#f0f0f0'
  badge-paid-bg: '#ecfdf5'
  badge-paid-text: '#047857'
  badge-paid-border: '#a7f3d0'
  badge-partial-bg: '#fffbeb'
  badge-partial-text: '#b45309'
  badge-partial-border: '#fde68a'
  badge-overdue-bg: '#fff1f2'
  badge-overdue-text: '#be123c'
  badge-overdue-border: '#fecdd3'
  badge-unpaid-bg: '#f1f5f9'
  badge-unpaid-text: '#334155'
  badge-unpaid-border: '#cbd5e1'
  badge-void-bg: '#f3f4f6'
  badge-void-text: '#6b7280'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 25px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# IKTIS — UI Design System

## 1. Design Direction
Apple-inspired, calm, precise, spacious, and productivity-oriented for landlords. Mobile-first baseline (320px–430px) progressively scaling to tablet and desktop.

## 2. Color Tokens
- `--color-primary`: #0066cc (Interactive Action Blue)
- `--color-primary-focus`: #0071e3 (Keyboard focus ring)
- `--color-primary-on-dark`: #2997ff (Dark mode accent)
- `--color-ink`: #1d1d1f (Primary text)
- `--color-muted`: #7a7a7a (Secondary text)
- `--color-canvas`: #ffffff (Main background)
- `--color-canvas-soft`: #f5f5f7 (Card backgrounds & page sections)
- `--color-surface-pearl`: #fafafc (Elevated subtle surfaces)
- `--color-dark`: #000000 (Top header / high contrast accents)
- `--color-dark-tile`: #272729 (Dark mode tiles)
- `--color-border`: #e0e0e0 (Standard subtle borders)
- `--color-divider`: #f0f0f0 (Soft divider lines)

### Status Badges & Semantic Colors
- **Paid**: Background `#ecfdf5` (emerald-50), Text `#047857` (emerald-700), Border `#a7f3d0`
- **Partially Paid**: Background `#fffbeb` (amber-50), Text `#b45309` (amber-700), Border `#fde68a`
- **Overdue**: Background `#fff1f2` (rose-50), Text `#be123c` (rose-700), Border `#fecdd3`
- **Unpaid / Due**: Background `#f1f5f9` (slate-100), Text `#334155` (slate-700), Border `#cbd5e1`
- **Voided**: Background `#f3f4f6` (gray-100), Text `#6b7280` (gray-500), strikethrough styling
- **Occupied / Available**: Operational availability & derived occupancy indicators (Blue indicator for occupied, clean neutral/green for available)

## 3. Financial & Currency Formatting
- Currency: Indian Rupee (INR, symbol: `₹`).
- All currency formatted to 2 decimals with tabular numerals: `font-variant-numeric: tabular-nums`.

## 4. Typography
- Font Family: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, system-ui, sans-serif`
- Major Heading: 28–34px (Mobile hero / page title), weight 600, tight tracking.
- Section Titles: 20–24px, weight 600.
- Body: 16px min on mobile inputs to prevent iOS zoom, 17px body copy, line-height 1.47.
- Captions & Dense Metadata: 12px–14px with high contrast.

## 5. Spacing, Shapes & Motion
- 8px base rhythm (4px micro adjustments).
- Common card radius: 18px (`rounded-[18px]`).
- Interactive controls radius: 8px to pill shapes (`rounded-full` for chips/pills).
- Touch target minimum: 44x44px.
- Subtle immediate tap down: `active:scale-[0.98] transition-transform duration-100`.
- Zero gratuitous gradients or bulky drop shadows. Borders are clean 1px `#e0e0e0`.
