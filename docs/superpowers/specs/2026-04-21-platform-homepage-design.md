# Platform Homepage Design

Date: 2026-04-21
Target file: `mockup-product/index.html`
Scope: Replace the repository root homepage with a polished executive launcher for platform modules, visually aligned to the mortgage module without modifying any mortgage files.

## Goal

Design a single-file landing page that acts as the entry point to the Valoris platform. The page should feel like part of the same product family as the mortgage module and guide users to the currently available module while signaling the upcoming module areas.

## Confirmed Design Decisions

- Replace `mockup-product/index.html`.
- Keep the page focused on module launching rather than dashboard analytics.
- Follow the mortgage module as the visual design reference.
- Include exactly four module cards: Mortgage, Insurance, GP, and Taxes.
- Link Mortgage to `./modules/mortgage/views/index.html`.
- Keep Insurance, GP, and Taxes in a `Coming Soon` state with temporary `#` links.
- Keep implementation self-contained in pure HTML, CSS, and JS within one file.

## Product Principles

- Preserve the executive dashboard feel established by the mortgage module.
- Use a calm, premium visual hierarchy instead of marketing-style promotion.
- Make module availability immediately understandable.
- Keep spacing, border radius, shadows, and typography consistent with the reference page.
- Avoid introducing external dependencies or cross-file assets.

## Page Structure

### 1. App Shell

Use the same overall frame language as the mortgage module:

- Warm, light background with subtle radial gradients
- Large rounded outer application frame
- Soft glass-like white surfaces
- Navy and muted gold brand accents

This gives the homepage an immediate family resemblance to the mortgage experience.

### 2. Top Navigation Bar

The header should include:

- A Valoris brand mark or monogram treatment
- Primary title context for the platform
- A restrained utility pill or context label if it helps balance the layout

Required copy:

- Title: `Valoris Capital Platform`
- Subtitle: `Operational Intelligence Modules`

The navigation bar should feel more like an internal product shell than a public marketing navbar.

### 3. Hero Section

The main header area should be compact and executive:

- Clear title and subtitle
- Brief supporting sentence that frames the page as the platform entry point
- No dense metrics, charts, or secondary panels

The goal is to orient the user quickly, then hand attention off to the module grid.

### 4. Module Grid

Use a responsive 2x2 card grid at desktop and laptop widths.

Each module card should contain:

- Small icon
- Module name
- Short description
- Action-oriented footer or CTA styling

Required module descriptions:

- Mortgage: `Debt & Financing Decisions`
- Insurance: `Coverage & Risk Tracking`
- GP: `General Partner Insights`
- Taxes: `Tax Exposure & Planning`

## Module States and Interactions

### Mortgage

Mortgage is the active module and should feel clearly available.

Behavior:

- Card links to `./modules/mortgage/views/index.html`
- Stronger hover elevation and shadow
- Clear active CTA treatment
- Pointer cursor and visible focus state

### Insurance, GP, Taxes

These modules are placeholders and should remain visually polished while clearly unavailable.

Behavior:

- Link target is `#`
- Display a small `Coming Soon` badge
- Use a muted or reduced-emphasis action treatment
- Keep the cards readable and intentional rather than greyed out to the point of looking broken

## Visual Language

The homepage should borrow directly from the mortgage module in these areas:

- Background tone and gradient atmosphere
- Rounded corners and large card radii
- Soft borders with low-contrast lines
- Layered white surfaces
- Subtle, premium shadows
- Serif-led headings paired with clean sans-serif body text
- Navy primary color with muted gold accent

The page should feel like a product shell for senior operators or executives, not a generic app starter page.

## Responsive Behavior

Target support is desktop and laptop.

Rules:

- Preserve generous spacing at wide widths
- Collapse to fewer grid columns as space tightens
- Keep hero text readable without wrapping awkwardly
- Prevent cards from becoming cramped or visually uneven
- Maintain comfortable click targets and spacing in reduced-width layouts

## Footer

Include a small, understated footer at the bottom of the main content with the required copy:

`Internal Mockup • Valoris Capital`

The footer should read as subtle product metadata rather than a marketing footer.

## Implementation Rules

- Edit only `mockup-product/index.html`
- Do not modify any files under `modules/mortgage`
- Keep the homepage self-contained in one HTML file
- Use inline CSS
- Use inline JS only if needed for lightweight polish
- Avoid frameworks, build steps, or asset pipelines

## Accessibility and UX Notes

- Use semantic heading structure
- Ensure clear visual distinction between active and coming-soon modules
- Preserve keyboard-focus visibility on interactive cards
- Keep contrast strong enough for comfortable internal-tool usage
- Make hover states additive rather than distracting

## Verification

Implementation should be checked against these concrete outcomes:

- `mockup-product/index.html` renders as a standalone landing page
- The page visually aligns with `modules/mortgage/views/index.html`
- Mortgage links correctly from the repository root homepage
- Insurance, GP, and Taxes display `Coming Soon` and remain non-functional placeholders
- Layout holds together cleanly at desktop and laptop widths
- No mortgage files are changed

## Outcome

This design creates a clear front door for the platform:

- One elegant executive landing page
- Immediate visibility into the module landscape
- A strong path into the live Mortgage experience
- A polished framework for future module activation without redesigning the homepage
