# Platform Visual Homologation Design

Date: 2026-04-22
Project: `platform-homepage`
Scope: Landing page, Mortgage, Insurance, GP, Taxes
Reference source of truth: attached UI screenshot provided in chat

## Objective

Homologate the entire app to a single visual system that matches the reference design as closely as possible.

This work is intentionally not a light refresh or inspiration exercise. The goal is for every view to feel like the same product, using the same shell, component language, spacing, and visual hierarchy.

## Non-Negotiable Principles

- Prioritize "equal" over "similar" whenever there is a design decision.
- Treat the reference screenshot as the primary source of truth for UI decisions.
- Remove arbitrary visual differences between modules.
- Preserve functional content where possible, but reorganize layout when needed to achieve visual consistency.
- Do not introduce new sections or decorative treatments that are not justified by the reference.

## Design Direction

Adopt a literal shared application shell based on the reference:

- fixed left sidebar
- restrained topbar
- light neutral application background
- white content surfaces
- compact executive controls
- clean bordered cards
- subtle badges
- single sans-serif typography system

The app should no longer present five separate visual identities. It should present one product with five views.

## Shared App Shell

### Sidebar

All pages will use the same left sidebar structure and dimensions.

- fixed visual width across Landing, Mortgage, Insurance, GP, Taxes
- white background with very light border separation from the content area
- Valoris logo block at the top
- vertical navigation for:
  - Home
  - Mortgage
  - Insurance
  - GP
  - Taxes
- active navigation item styled as a soft yellow capsule with a thin yellow border, matching the reference
- consistent icon treatment for all items
- consistent label sizing, weight, line-height, and spacing

The sidebar is not module-specific. It is a product-level frame.

### Topbar

All pages will use the same topbar pattern.

- shallow white bar spanning the top of the content frame
- left side remains visually quiet
- right side contains:
  - tenant/entity selector pill
  - avatar
  - minimal utility action
- same height, padding, and alignment across all views

No module should invent its own header composition once inside the shared shell.

### Main Content Canvas

All views will follow the same page rhythm:

1. Page title
2. Short subtitle or context line
3. Controls row
4. Main cards, lists, or tables

The content area should preserve the spacious but controlled density of the reference.

## Shared Design Tokens

The implementation should centralize tokens in a reusable shared stylesheet so all pages inherit the same system.

### Color Tokens

- app background: warm light gray close to the reference
- shell surfaces: white
- card surfaces: white
- primary text: deep blue-black
- secondary text: muted gray-blue
- borders: light neutral gray
- primary action: strong warm yellow
- selected state background: pale yellow
- selected state border: richer yellow
- badges: pale blue background with medium blue text

No module may retain its own palette.

### Typography Tokens

Use one sans-serif family across the application.

- page titles: bold, large, clean, high-contrast
- subtitles: smaller, muted, calm
- body text: neutral, legible, compact
- labels and table headers: small, restrained, uppercase or semi-muted according to the reference pattern
- button text: consistent size and medium-bold weight

No serif hero typography should remain.

### Radius, Border, Shadow Tokens

- cards: medium-large rounded corners matching the reference
- inputs/buttons: medium rounded corners
- pills/badges: full capsule or soft pill
- borders: thin and light
- shadows: extremely subtle or absent except where needed to maintain depth

Existing gradients, glassmorphism, and oversized shadows should be removed.

### Spacing Tokens

- consistent page padding
- consistent distance between title and subtitle
- consistent distance between subtitle and controls
- consistent grid gaps between cards
- consistent internal card padding
- consistent control height and horizontal rhythm

The app should feel balanced and evenly packed, not decorative or irregular.

## Shared Components

### Buttons

All buttons across all views should be rebuilt into one family.

#### Primary button

- yellow background
- dark text
- compact executive height
- medium rounded corners
- generous horizontal padding
- no module-specific reinterpretation

#### Secondary button

- white background
- subtle border
- dark text
- same height and radius as primary buttons

#### Toggle buttons

For segmented controls such as cards/list or similar actions:

- white outer group
- subtle border
- selected segment filled softly
- same component structure across modules

### Inputs, Search, and Filters

All search bars, selects, and filters should use one visual pattern.

- white background
- subtle border
- matching height
- matching radius
- muted placeholder
- minimal icon treatment
- consistent internal padding

### Cards and Panels

All module surfaces should belong to one family.

- white background
- thin border
- shared radius
- consistent interior padding
- restrained headers
- clean separation of metadata and content

Mortgage, Insurance, GP, and Taxes must not retain visibly different card silhouettes.

### Badges

All badges must use one shared style.

- compact pill
- pale blue background
- blue text
- subtle border if needed
- identical height and padding

### Tables and Lists

All tabular and list-heavy surfaces should be normalized.

- same header row treatment
- same border logic
- same density
- same text sizing
- same alignment rules for numeric cells
- same card wrapper treatment around tables

Taxes will require the most normalization here because of its document-like density.

## Page-by-Page Application

### Landing Page

The landing page will stop behaving like a standalone hero page.

It will become the product index view inside the shared shell:

- same sidebar and topbar as modules
- same page title/subtitle structure
- module entry cards redrawn in the shared card language
- same buttons, borders, and spacing used elsewhere

Its purpose can remain directory-style, but its appearance must feel native to the same product.

### Mortgage

Mortgage will be re-mounted inside the shared shell.

- remove the current custom hero treatment
- retain debt tables and summary data
- map summary data into shared cards
- use the same controls row structure as the design system
- normalize table wrappers, badges, chips, and detail panels

### Insurance

Insurance currently has the most divergent styling and must be fully normalized.

- replace its current independent palette and typography
- keep KPI, trend, roster, and contacts content
- redraw all panels, tables, and status signals in the shared system
- integrate into the same shell and hierarchy as Mortgage

### GP

GP currently uses its own system and must also be fully normalized.

- replace its current typography, tokens, and spacing
- preserve overview, KPI, and table content
- redraw everything into the shared shell and component system
- align table density and labels with Mortgage and Insurance

### Taxes

Taxes will remain the most data-dense view, but must still feel visually identical in system terms.

- preserve analytical content and long-form tables
- normalize headings, sections, wrappers, tables, badges, and filters
- fit the same shell, topbar, sidebar, control row, and card family
- reduce document-style variance so the module feels productized, not detached

## Layout Behavior

### Desktop

- fixed sidebar
- topbar spanning the content area
- content region using a single max width and shared gutters
- responsive card grids where appropriate

### Mobile and Narrow Widths

- sidebar collapses or stacks in a consistent manner
- topbar remains usable
- controls wrap gracefully
- cards and tables keep the same system proportions

Responsive behavior must still feel like the same product, not a fallback redesign.

## Reusability and Refactor Strategy

Implementation should favor a shared base instead of repeated page-level CSS.

The recommended structure is:

- one shared stylesheet for tokens, shell, and base components
- one shared navigation/topbar pattern reused by all views
- page-specific CSS only for content arrangement that cannot be expressed with shared primitives

Any duplicated or inconsistent local styling should be removed where it conflicts with the shared system.

## Content and Functional Constraints

- do not change the core functional meaning of existing content
- do not remove important data blocks just to simplify styling
- do not invent new dashboard sections unless required to preserve layout integrity
- do not add decorative effects not present in the reference

Layout reorganization is allowed when necessary to achieve consistent visual structure.

## Error Handling and Edge Cases

The visual homologation should account for:

- empty states still using the same shell and card family
- long table content remaining legible inside normalized wrappers
- missing data not collapsing page rhythm
- hover, active, and focus states matching the shared system
- navigation active state remaining obvious across all modules

If a control or content block does not exist on a given page, the page should simply omit it without inventing a unique substitute style.

## Testing and Validation

Implementation validation should include:

1. Visual consistency check across all five pages
2. Shared shell verification:
   - sidebar width and styling
   - topbar height and composition
   - active navigation state
3. Component consistency verification:
   - buttons
   - inputs
   - selects
   - cards
   - badges
   - table wrappers
4. Responsive smoke test across desktop and mobile widths
5. Reference fidelity review against the attached screenshot

## Acceptance Checklist

The work is only complete when all of the following are true:

- Landing, Mortgage, Insurance, GP, and Taxes look like the same product
- all pages use the same shared shell
- colors align with the reference
- buttons align with the reference
- silhouettes align with the reference
- sidebar, topbar, cards, inputs, badges, and filters are homologated
- there are no arbitrary module-level visual deviations
- the result reads as an exact visual homologation, not a loose approximation

## Out of Scope

- functional feature additions unrelated to visual alignment
- data model changes
- workflow redesign beyond what is required by the shared layout

## Recommended Next Step

Create an implementation plan that:

1. establishes the shared stylesheet and shell
2. migrates Landing first to set the frame
3. migrates Mortgage, Insurance, GP, and Taxes onto the same system
4. runs a final consistency pass across all pages
