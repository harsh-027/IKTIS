# IKTIS — UI Design System

## 1. Design direction

Use the two user-provided Apple design references as the visual and interaction foundation:

1. `DESIGN-apple.md` defines colors, typography, spacing, surfaces, components, and responsive layout.
2. `SORRY-STEVE-apple-design-skill.pdf` describes interaction feedback, interruptible motion, direct manipulation, reduced motion, and accessibility.

Apply the principles to a practical landlord dashboard. Do **not** copy Apple's product marketing pages literally, use Apple logos, or imply Apple affiliation.

## 2. Visual principles

- Calm, precise, spacious, photography-free by default for data-heavy screens.
- White and soft off-white surfaces with occasional near-black sections where they improve hierarchy.
- Action Blue as the main interactive accent.
- Strong typography and clear spacing instead of decorative effects.
- No decorative gradients.
- No shadows on ordinary cards, buttons, or text. Use subtle borders and surface contrast.
- Avoid excessive glass effects; use at most one translucent layer where it serves a clear navigation purpose.
- Use full-width layouts where helpful, but keep data tables and forms readable.
- The dashboard is a productivity interface, not a marketing landing page.

## 3. Core color tokens

Use CSS custom properties rather than repeating raw values throughout the application.

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#0066cc` | Main interactive accent |
| `--color-primary-focus` | `#0071e3` | Keyboard focus |
| `--color-primary-on-dark` | `#2997ff` | Links on dark surfaces |
| `--color-ink` | `#1d1d1f` | Main text |
| `--color-muted` | `#7a7a7a` | Secondary text |
| `--color-canvas` | `#ffffff` | Main surface |
| `--color-canvas-soft` | `#f5f5f7` | Alternate page sections |
| `--color-surface-pearl` | `#fafafc` | Subtle surface |
| `--color-dark` | `#000000` | Use sparingly, such as a top navigation strip |
| `--color-dark-tile` | `#272729` | Dark section |
| `--color-border` | `#e0e0e0` | Standard subtle border |
| `--color-divider` | `#f0f0f0` | Very soft separators |

### Currency and financial formatting
- **Currency:** Indian Rupee (INR, symbol: `₹`).
- All monetary amounts must be rendered with the `₹` prefix and formatted with 2 decimal places (e.g. `₹15,000.00` or Indian numbering formatting `₹1,25,000.00`).
- Consistent tabular number alignment (`font-variant-numeric: tabular-nums`) for currency columns.

### Financial and operational status badges
The reference design specifies a single blue interactive accent, but rent management requires distinct semantic states. Use restrained, accessible semantic tint backgrounds with high-contrast text:
- **Paid:** Light emerald surface, dark emerald text.
- **Partially Paid:** Light amber surface, dark amber text.
- **Overdue:** Light rose surface, dark red text.
- **Unpaid / Due:** Light neutral surface, dark slate text.
- **Voided:** Soft grey surface, muted text with strikethrough on original amount.
- **Room Statuses:** Represented with two distinct indicators:
  1. *Operational Availability:* "Available" (clean neutral/green) vs. "Under Maintenance" (neutral amber).
  2. *Derived Occupancy:* "Occupied" (blue indicator) vs. "Vacant" (subtle neutral).
- Status must not be communicated by color alone; pair each color with clear text labels and accessible ARIA attributes.

## 4. Typography

Preferred stack:

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
  "SF Pro Display", Inter, system-ui, sans-serif;
```

SF Pro may not be available on non-Apple devices. Do not bundle or redistribute proprietary fonts without appropriate rights; use system fonts and a permitted fallback such as Inter.

Reference scale:
- Page hero/major heading: 40–56px, weight 600, tight tracking.
- Section heading: 28–34px, weight 600.
- Body: 17px, weight 400, line-height around 1.47.
- Labels and captions: 14px.
- Dense metadata: 12px, while maintaining readability.

For dense tables, compact text may be necessary, but never make essential financial data difficult to read. Use tight tracking primarily for large headings, not every text element.

## 5. Spacing and shapes

- Use an 8px-based spacing rhythm, with 4px adjustments where needed.
- Main section spacing: about 48–80px on spacious screens; reduce responsively.
- Utility card padding: about 24px.
- Common card radius: 18px.
- Compact utility controls: 8px radius.
- Primary actions and search fields may use pill shapes.
- Full-width dashboard sections should generally have square edges; use rounded corners for contained utility cards, not every surface.

## 6. Layout and navigation

### App shell
- A compact top navigation and a clear primary navigation structure.
- On desktop, a persistent sidebar may be used for dashboard, properties, rooms, tenants, rent, payments, and settings.
- On mobile, collapse navigation into an accessible menu or compact navigation pattern.
- Keep page title, current context, and primary action easy to find.
- Avoid stacking multiple translucent/glass layers.

### Dashboard
- A small set of summary metrics at the top.
- A clear period selector for financial totals.
- Recent payments and outstanding rent as readable lists/tables.
- Use charts only when they answer a real question; don't add decorative graphs.
- Empty states should explain the next useful action.

### Forms, tables, and workflow patterns
- Labels remain visible; don't rely only on placeholders.
- Inputs must have clear focus, error, disabled, and loading states.
- Tables must handle long names, narrow viewports, tabular financial figures, and empty results.
- **Bulk Rent Generation:** Modal or toolbar control allowing the landlord to pick a canonical month (`YYYY-MM`). Explains idempotency ("Charges will only be generated for active tenancies that do not already have a charge for this month"). Shows completion feedback with count of created vs. skipped charges.
- **Mid-Month / Custom Charge Input:** When generating or viewing an initial/final partial-month rent charge, provide a clean numerical input for landlord-specified `amountDue` without forcing automated proration.
- **Payment Entry & Allocation:**
  - Amount input labeled in `₹` with immediate client-side validation rejecting amounts > outstanding balance (with copy: *"Overpayments are not accepted in version 1. Maximum payable: ₹X"*).
  - Allocation selector: defaults to "Automatic (FIFO: oldest due first)", with an option to "Select specific charges" revealing a checklist of outstanding charges with individual allocation inputs.
- **Payment Voiding Confirmation:** Destructive action modal requiring a non-empty "Reason for voiding". Clearly informs the user that voiding reverses allocations and restores rent charge balances.
- **Archiving vs. Permanent Deletion:** Records with financial or tenancy history (tenants, rooms, properties) display an "Archive" action instead of "Delete", with a confirmation modal explaining that historical records remain safe.

## 7. Interaction and motion rules

From the supplied `SORRY-STEVE-apple-design-skill.pdf`:

- Give immediate press feedback on pointer/touch down, not only on release. A subtle `scale(0.97)` over roughly 100ms is a reference behavior, not a requirement for every control.
- Keep motion interruptible; a reversal should continue from the current visual state instead of jumping to the beginning.
- Animate inexpensive properties such as `transform` and `opacity` where possible.
- Use spring-like motion selectively for drawers or draggable elements. Do not add bounce to ordinary business UI.
- Dragging should track the pointer closely and preserve the grab point when direct manipulation is implemented.
- Use only one translucent layer over readable content; avoid glass-on-glass.
- Respect `prefers-reduced-motion`; replace large slides and spring effects with simpler fades or no motion.
- Ensure touch targets are approximately 44×44px or larger where practical.
- Keyboard focus must be visible.

## 8. Mobile-First UI & Responsive Architecture

### Primary Principle: Mobile-First
Primary users access IKTIS on mobile devices. Mobile usability is the highest UI priority across the entire application, including all existing and future pages.

1. **Mobile-First Baseline (320px–375px–430px):**
   - Start layouts from 320px–375px widths without horizontal scrolling, progressively enhancing for tablet (641px–833px) and desktop (834px+).
   - Use flexible container widths, fluid flex/grid layouts, and `max-w` constraints. Every page must fit small viewports without unintended horizontal scrolling.
2. **Touch-Target Comfort:**
   - Interactive controls (buttons, links, form inputs, toggle switches, menu items) must have comfortable touch targets of approximately 44 × 44 CSS pixels where practical, with adequate spacing to prevent accidental taps.
3. **Mobile Form Usability & iOS Zoom Prevention:**
   - Text inputs, selects, and textareas must use a minimum font size of `16px` on mobile (`text-base sm:text-sm`) to prevent automatic iOS Safari viewport zooming on focus.
   - Associated labels must remain visible, and inputs should have clean active/focus ring states.
4. **Mobile Navigation & Header:**
   - Navigable headers must not wrap or overflow horizontally on small screens (down to 320px).
   - Touch-friendly tap zones for navigation items and account actions.
5. **Mobile-Friendly Modals & Viewport Handling:**
   - Dialogs/modals must fit within mobile viewports (`max-h-[90vh] overflow-y-auto`, responsive padding `p-4 sm:p-6`) and remain fully functional when the mobile virtual keyboard is open.
   - Primary confirm/submit buttons must span full width or stack cleanly on mobile.
6. **List vs. Table Presentation:**
   - On small screens, prioritize readable card/list layouts over wide fixed tables.
   - Tables, if used for dense data, must either adapt to mobile card views or allow contained horizontal scrolling without page-level scrollbars.
7. **Safe-Area Insets & Spacing:**
   - Account for mobile device safe areas (`env(safe-area-inset-bottom)`, etc.) and avoid rigid fixed-height or fixed-width containers.
8. **Restrained Apple Aesthetics:**
   - Maintain the Apple-inspired palette, typography, subtle borders, and accessible high-contrast badges without decorative gradients, bulky shadows, or superfluous animations. Avoid oversized desktop layouts and excessive nested cards.


## 9. Accessibility and design QA

- Semantic HTML and properly associated form labels.
- Keyboard-operable menus, dialogs, and actions.
- Visible focus and sufficient text/background contrast.
- Status must not be communicated by color alone; include text or an icon with an accessible label.
- Reduced-motion support.
- Loading, empty, error, success, and disabled states for relevant components.
- Test interactions on a real touch device when possible.

## 10. Design implementation rule

Before implementing a UI task, read both supplied design references and this document. Reuse design tokens and components. Do not introduce a new color, radius, shadow, animation, or font rule without a clear functional reason and an update to this document.
