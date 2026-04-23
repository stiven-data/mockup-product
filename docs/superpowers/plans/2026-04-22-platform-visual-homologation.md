# Platform Visual Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the landing page plus Mortgage, Insurance, GP, and Taxes so they all use one literal shared shell and component system that matches the approved reference design.

**Architecture:** Create one shared stylesheet for tokens, shell, navigation, controls, cards, badges, and tables. Then migrate each HTML page to the same `sidebar + topbar + page header + controls row + content cards/tables` structure, keeping module data and page purpose intact while removing local visual systems.

**Tech Stack:** HTML5, shared CSS, existing vanilla JavaScript in `modules/mortgage/views/current-debt-data.js`, PowerShell smoke checks, browser visual review

---

## File Structure

- Create: `shared/styles/platform-design-system.css`
- Modify: `index.html`
- Modify: `modules/mortgage/views/index.html`
- Modify: `modules/insurance/views/insurance_command_center_oasis_trusted.html`
- Modify: `modules/Gp/views/gp mockups.html`
- Modify: `modules/taxes/views/index.html`
- Reference: `docs/superpowers/specs/2026-04-22-platform-visual-homologation-design.md`
- Existing data source: `modules/mortgage/views/current-debt-data.js`

### Responsibilities

- `shared/styles/platform-design-system.css`
  - Own all global design tokens
  - Own the shared app shell
  - Own shared button, input, select, badge, card, stats, and table styles
  - Own responsive behavior for sidebar/topbar/content

- `index.html`
  - Product landing page inside the shared shell
  - Module directory cards for Home context

- `modules/mortgage/views/index.html`
  - Debt view inside the shared shell
  - Continue using `current-debt-data.js` for content population

- `modules/insurance/views/insurance_command_center_oasis_trusted.html`
  - Insurance view inside the shared shell
  - Normalize KPIs, tables, and signals into shared component classes

- `modules/Gp/views/gp mockups.html`
  - GP overview inside the shared shell
  - Normalize KPI and table presentation into shared component classes

- `modules/taxes/views/index.html`
  - Taxes view inside the shared shell
  - Normalize dense analytical sections and tables into shared wrappers

## Shared Smoke Commands

Use these commands repeatedly during implementation.

### Shared stylesheet existence check

```powershell
if (Test-Path '.\shared\styles\platform-design-system.css') {
  'PASS'
} else {
  throw 'Missing shared design system stylesheet.'
}
```

### Shared shell audit across all five pages

```powershell
$pages = @(
  '.\index.html',
  '.\modules\mortgage\views\index.html',
  '.\modules\insurance\views\insurance_command_center_oasis_trusted.html',
  '.\modules\Gp\views\gp mockups.html',
  '.\modules\taxes\views\index.html'
)

$errors = @()

foreach ($page in $pages) {
  $content = Get-Content -Raw $page

  if ($content -notmatch 'platform-design-system\.css') {
    $errors += "$page missing shared stylesheet link"
  }

  if ($content -notmatch 'class="app-shell"') {
    $errors += "$page missing shared app shell"
  }

  if ($content -notmatch 'class="app-sidebar"') {
    $errors += "$page missing shared sidebar"
  }

  if ($content -notmatch 'class="app-topbar"') {
    $errors += "$page missing shared topbar"
  }
}

if ($errors.Count) {
  $errors | ForEach-Object { Write-Host $_ }
  throw 'Shared shell verification failed.'
}

'PASS'
```

### Visual token duplication scan

```powershell
rg -n --glob '*.html' ':root\s*\{|--bg:|--panel:|--brand:' '.'
```

Expected after migration: only shared token definitions in `shared/styles/platform-design-system.css`; no module-level token systems left in page HTML files.

## Task 1: Create the shared design system foundation

**Files:**
- Create: `shared/styles/platform-design-system.css`
- Test: `shared/styles/platform-design-system.css`

- [ ] **Step 1: Write the failing stylesheet existence check**

```powershell
if (Test-Path '.\shared\styles\platform-design-system.css') {
  'PASS'
} else {
  throw 'Missing shared design system stylesheet.'
}
```

- [ ] **Step 2: Run the check to verify it fails**

Run:

```powershell
if (Test-Path '.\shared\styles\platform-design-system.css') {
  'PASS'
} else {
  throw 'Missing shared design system stylesheet.'
}
```

Expected: FAIL with `Missing shared design system stylesheet.`

- [ ] **Step 3: Create the shared stylesheet with the approved tokens, shell, and component primitives**

```css
:root {
  --app-bg: #f6f6f4;
  --surface: #ffffff;
  --surface-subtle: #fafafa;
  --surface-muted: #f3f4f6;
  --border: #e5e7eb;
  --border-strong: #d6dae1;
  --text: #0f1728;
  --text-muted: #667085;
  --text-soft: #8a94a6;
  --brand-yellow: #f0c400;
  --brand-yellow-soft: #fff7d6;
  --brand-yellow-border: #f3d35c;
  --badge-blue-bg: #e8f0ff;
  --badge-blue-border: #bfd0ff;
  --badge-blue-text: #2a5bd7;
  --radius-shell: 22px;
  --radius-card: 18px;
  --radius-control: 14px;
  --radius-pill: 999px;
  --sidebar-width: 272px;
  --topbar-height: 56px;
  --page-pad: 40px;
  --card-pad: 24px;
  --control-height: 44px;
  --shadow-soft: 0 1px 2px rgba(15, 23, 40, 0.04);
  --shadow-card: 0 1px 3px rgba(15, 23, 40, 0.06);
  --font-sans: "Segoe UI", "Aptos", "Helvetica Neue", Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--app-bg);
  color: var(--text);
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  background: var(--app-bg);
}

.app-sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 22px 14px 24px;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 10px 24px;
}

.app-brand__mark {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #ffd54d 0%, #f0c400 100%);
  color: var(--text);
  font-weight: 800;
}

.app-brand__copy strong {
  display: block;
  font-size: 18px;
  letter-spacing: 0.04em;
}

.app-brand__copy span {
  display: block;
  color: var(--text-muted);
  font-size: 13px;
}

.sidebar-group {
  margin-top: 18px;
}

.sidebar-group__label {
  margin: 0 0 8px;
  padding: 0 14px;
  color: var(--text-muted);
  font-size: 13px;
}

.sidebar-nav {
  display: grid;
  gap: 4px;
}

.sidebar-link {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: #4b5565;
  font-size: 16px;
  font-weight: 500;
}

.sidebar-link.is-active {
  background: var(--brand-yellow-soft);
  border-color: var(--brand-yellow-border);
  color: var(--text);
}

.app-main {
  min-width: 0;
  display: grid;
  grid-template-rows: var(--topbar-height) minmax(0, 1fr);
}

.app-topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  padding: 0 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.topbar-pill {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  background: #f7f8fa;
  color: var(--text);
  font-weight: 600;
}

.topbar-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
}

.page {
  padding: var(--page-pad);
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  margin: 0;
  font-size: 44px;
  line-height: 1.05;
  font-weight: 700;
}

.page-subtitle {
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 16px;
}

.page-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.control-stack {
  display: grid;
  gap: 12px;
  min-width: min(540px, 100%);
}

.control-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.field,
.select,
.btn,
.toggle-group {
  min-height: var(--control-height);
  border-radius: var(--radius-control);
}

.field,
.select {
  width: 100%;
  padding: 0 16px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 18px;
  border: 1px solid transparent;
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
}

.btn--primary {
  background: var(--brand-yellow);
}

.btn--secondary {
  border-color: var(--border-strong);
}

.toggle-group {
  display: inline-flex;
  padding: 4px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
}

.toggle-group__item {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 10px;
  color: var(--text);
}

.toggle-group__item.is-active {
  background: #f3f4f6;
}

.stats-grid,
.card-grid {
  display: grid;
  gap: 24px;
}

.stats-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.card-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.card,
.panel,
.table-card,
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.card,
.panel,
.table-card {
  padding: var(--card-pad);
}

.stat-card {
  padding: 18px 20px;
}

.eyebrow,
.meta-label,
.table-card thead th {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border: 1px solid var(--badge-blue-border);
  border-radius: var(--radius-pill);
  background: var(--badge-blue-bg);
  color: var(--badge-blue-text);
  font-size: 14px;
  font-weight: 600;
}

.table-card {
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead th {
  padding: 14px 16px;
  background: #fafafa;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.data-table tbody td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

.data-table tbody tr:last-child td {
  border-bottom: 0;
}

.text-muted {
  color: var(--text-muted);
}

.text-right {
  text-align: right;
}

@media (max-width: 1200px) {
  .stats-grid,
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .page {
    padding: 24px;
  }
}

@media (max-width: 720px) {
  .stats-grid,
  .card-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 34px;
  }
}
```

- [ ] **Step 4: Run the stylesheet existence check and token scan**

Run:

```powershell
if (Test-Path '.\shared\styles\platform-design-system.css') {
  'PASS'
} else {
  throw 'Missing shared design system stylesheet.'
}

rg -n 'sidebar-link|app-topbar|btn--primary|badge|data-table' '.\shared\styles\platform-design-system.css'
```

Expected:

- `PASS`
- `rg` prints the matching shared class names from `shared/styles/platform-design-system.css`

- [ ] **Step 5: Commit the shared stylesheet**

```bash
git add shared/styles/platform-design-system.css
git commit -m "feat: add shared platform design system stylesheet"
```

## Task 2: Rebuild the landing page inside the shared shell

**Files:**
- Modify: `index.html`
- Test: `index.html`

- [ ] **Step 1: Write the failing landing shell check**

```powershell
$content = Get-Content -Raw '.\index.html'

if (
  $content -match 'shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="app-sidebar"' -and
  $content -match '>Home<' -and
  $content -match '>Mortgage<' -and
  $content -match '>Insurance<' -and
  $content -match '>GP<' -and
  $content -match '>Taxes<'
) {
  'PASS'
} else {
  throw 'Landing page is not mounted on the shared shell.'
}
```

- [ ] **Step 2: Run the landing check to verify it fails**

Run:

```powershell
$content = Get-Content -Raw '.\index.html'

if (
  $content -match 'shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="app-sidebar"' -and
  $content -match '>Home<' -and
  $content -match '>Mortgage<' -and
  $content -match '>Insurance<' -and
  $content -match '>GP<' -and
  $content -match '>Taxes<'
) {
  'PASS'
} else {
  throw 'Landing page is not mounted on the shared shell.'
}
```

Expected: FAIL with `Landing page is not mounted on the shared shell.`

- [ ] **Step 3: Replace the landing page markup so it uses the shared shell and module cards**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Valoris Capital Partners | Home</title>
    <link rel="stylesheet" href="./shared/styles/platform-design-system.css" />
  </head>
  <body>
    <div class="app-shell">
      <aside class="app-sidebar">
        <div class="app-brand">
          <div class="app-brand__mark">V</div>
          <div class="app-brand__copy">
            <strong>VALORIS</strong>
            <span>Capital Partners</span>
          </div>
        </div>

        <div class="sidebar-group">
          <p class="sidebar-group__label">Core</p>
          <nav class="sidebar-nav" aria-label="Primary navigation">
            <a class="sidebar-link is-active" href="./index.html">Home</a>
            <a class="sidebar-link" href="./modules/mortgage/views/index.html">Mortgage</a>
            <a class="sidebar-link" href="./modules/insurance/views/insurance_command_center_oasis_trusted.html">Insurance</a>
            <a class="sidebar-link" href="./modules/Gp/views/gp%20mockups.html">GP</a>
            <a class="sidebar-link" href="./modules/taxes/views/index.html">Taxes</a>
          </nav>
        </div>
      </aside>

      <div class="app-main">
        <header class="app-topbar">
          <div class="topbar-pill">Valoris Capital Partners</div>
          <div class="topbar-avatar" aria-hidden="true"></div>
        </header>

        <main class="page">
          <header class="page-header">
            <h1 class="page-title">Modules</h1>
            <p class="page-subtitle">Unified access to the operating views used across the platform.</p>
          </header>

          <section class="page-controls" aria-label="Landing controls">
            <div class="control-stack">
              <input class="field" type="search" placeholder="Search modules..." />
            </div>
            <div class="control-row">
              <button class="btn btn--secondary" type="button">Cards</button>
              <button class="btn btn--primary" type="button">Open Selected</button>
            </div>
          </section>

          <section class="card-grid" aria-label="Platform modules">
            <article class="card">
              <div class="control-row" style="justify-content: space-between;">
                <h2 style="margin: 0;">Mortgage</h2>
                <span class="badge">Live</span>
              </div>
              <p class="text-muted">Debt and financing decisions, current obligations, and statement snapshots.</p>
              <div class="control-row">
                <a class="btn btn--secondary" href="./modules/mortgage/views/index.html">Open</a>
              </div>
            </article>

            <article class="card">
              <div class="control-row" style="justify-content: space-between;">
                <h2 style="margin: 0;">Insurance</h2>
                <span class="badge">Live</span>
              </div>
              <p class="text-muted">Coverage, premium, contact, and policy roster workflows.</p>
              <div class="control-row">
                <a class="btn btn--secondary" href="./modules/insurance/views/insurance_command_center_oasis_trusted.html">Open</a>
              </div>
            </article>

            <article class="card">
              <div class="control-row" style="justify-content: space-between;">
                <h2 style="margin: 0;">GP</h2>
                <span class="badge">Live</span>
              </div>
              <p class="text-muted">Sponsor overview, GP participation, and partner mapping.</p>
              <div class="control-row">
                <a class="btn btn--secondary" href="./modules/Gp/views/gp%20mockups.html">Open</a>
              </div>
            </article>

            <article class="card">
              <div class="control-row" style="justify-content: space-between;">
                <h2 style="margin: 0;">Taxes</h2>
                <span class="badge">Live</span>
              </div>
              <p class="text-muted">Property tax analysis, appeal support, and historical bill review.</p>
              <div class="control-row">
                <a class="btn btn--secondary" href="./modules/taxes/views/index.html">Open</a>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  </body>
</html>
```

- [ ] **Step 4: Run the landing shell check**

Run:

```powershell
$content = Get-Content -Raw '.\index.html'

if (
  $content -match 'shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="app-sidebar"' -and
  $content -match '>Home<' -and
  $content -match '>Mortgage<' -and
  $content -match '>Insurance<' -and
  $content -match '>GP<' -and
  $content -match '>Taxes<'
) {
  'PASS'
} else {
  throw 'Landing page is not mounted on the shared shell.'
}
```

Expected: `PASS`

- [ ] **Step 5: Commit the landing migration**

```bash
git add index.html
git commit -m "feat: migrate landing page to shared platform shell"
```

## Task 3: Migrate Mortgage to the shared shell

**Files:**
- Modify: `modules/mortgage/views/index.html`
- Reference: `modules/mortgage/views/current-debt-data.js`
- Test: `modules/mortgage/views/index.html`

- [ ] **Step 1: Write the failing mortgage shell check**

```powershell
$content = Get-Content -Raw '.\modules\mortgage\views\index.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">Mortgage<' -and
  $content -match 'id="debt-table-body"' -and
  $content -notmatch 'class="hero-card"'
) {
  'PASS'
} else {
  throw 'Mortgage view is not yet normalized to the shared shell.'
}
```

- [ ] **Step 2: Run the mortgage check to verify it fails**

Run:

```powershell
$content = Get-Content -Raw '.\modules\mortgage\views\index.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">Mortgage<' -and
  $content -match 'id="debt-table-body"' -and
  $content -notmatch 'class="hero-card"'
) {
  'PASS'
} else {
  throw 'Mortgage view is not yet normalized to the shared shell.'
}
```

Expected: FAIL with `Mortgage view is not yet normalized to the shared shell.`

- [ ] **Step 3: Rebuild the mortgage HTML around the shared shell while preserving data hooks**

```html
<link rel="stylesheet" href="../../../shared/styles/platform-design-system.css" />
```

```html
<body>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="app-brand">
        <div class="app-brand__mark">V</div>
        <div class="app-brand__copy">
          <strong>VALORIS</strong>
          <span>Capital Partners</span>
        </div>
      </div>
      <div class="sidebar-group">
        <p class="sidebar-group__label">Core</p>
        <nav class="sidebar-nav" aria-label="Primary navigation">
          <a class="sidebar-link" href="../../../index.html">Home</a>
          <a class="sidebar-link is-active" href="./index.html">Mortgage</a>
          <a class="sidebar-link" href="../../insurance/views/insurance_command_center_oasis_trusted.html">Insurance</a>
          <a class="sidebar-link" href="../../Gp/views/gp%20mockups.html">GP</a>
          <a class="sidebar-link" href="../../taxes/views/index.html">Taxes</a>
        </nav>
      </div>
    </aside>

    <div class="app-main">
      <header class="app-topbar">
        <div class="topbar-pill">Valoris Capital Partners</div>
        <div class="topbar-avatar" aria-hidden="true"></div>
      </header>

      <main class="page">
        <header class="page-header">
          <h1 class="page-title">Mortgage</h1>
          <p class="page-subtitle" id="property-location">Debt and financing details for the selected property.</p>
        </header>

        <section class="stats-grid" id="top-stats"></section>

        <section class="page-controls">
          <div class="control-stack">
            <div class="control-row" id="hero-meta"></div>
          </div>
          <div class="control-row">
            <div class="badge" id="selection-chip">Selected loan</div>
          </div>
        </section>

        <section class="table-card">
          <div class="table-scroll">
            <table class="data-table" aria-label="Current debt summary">
              <thead>
                <tr>
                  <th>Loan</th>
                  <th>Property</th>
                  <th>Lender</th>
                  <th>Maturity</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Balance</th>
                  <th class="text-right">Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="debt-table-body"></tbody>
            </table>
          </div>
        </section>

        <section class="card-grid" style="margin-top: 24px;">
          <section class="panel">
            <h2 style="margin-top: 0;">Loan Details</h2>
            <div id="detail-list"></div>
          </section>

          <section class="panel">
            <h2 style="margin-top: 0;">Statement Snapshot</h2>
            <div id="snapshot-stack"></div>
          </section>
        </section>
      </main>
    </div>
  </div>

  <script src="./current-debt-data.js"></script>
  <script>
    // Keep the existing render logic, but update class names for injected fragments.
    const createMetaChip = (label, value) =>
      `<div class="stat-card"><div class="meta-label">${label}</div><strong>${value}</strong></div>`;
  </script>
</body>
```

- [ ] **Step 4: Run the mortgage shell check**

Run:

```powershell
$content = Get-Content -Raw '.\modules\mortgage\views\index.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">Mortgage<' -and
  $content -match 'id="debt-table-body"' -and
  $content -notmatch 'class="hero-card"'
) {
  'PASS'
} else {
  throw 'Mortgage view is not yet normalized to the shared shell.'
}
```

Expected: `PASS`

- [ ] **Step 5: Commit the mortgage migration**

```bash
git add modules/mortgage/views/index.html
git commit -m "feat: migrate mortgage view to shared platform shell"
```

## Task 4: Migrate Insurance to the shared shell and shared components

**Files:**
- Modify: `modules/insurance/views/insurance_command_center_oasis_trusted.html`
- Test: `modules/insurance/views/insurance_command_center_oasis_trusted.html`

- [ ] **Step 1: Write the failing insurance normalization check**

```powershell
$content = Get-Content -Raw '.\modules\insurance\views\insurance_command_center_oasis_trusted.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">Insurance<' -and
  $content -match 'class="stats-grid"' -and
  $content -notmatch '--blue:' -and
  $content -notmatch 'font-family:Inter'
) {
  'PASS'
} else {
  throw 'Insurance view still contains an independent visual system.'
}
```

- [ ] **Step 2: Run the insurance check to verify it fails**

Run:

```powershell
$content = Get-Content -Raw '.\modules\insurance\views\insurance_command_center_oasis_trusted.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">Insurance<' -and
  $content -match 'class="stats-grid"' -and
  $content -notmatch '--blue:' -and
  $content -notmatch 'font-family:Inter'
) {
  'PASS'
} else {
  throw 'Insurance view still contains an independent visual system.'
}
```

Expected: FAIL with `Insurance view still contains an independent visual system.`

- [ ] **Step 3: Rebuild insurance around the shared shell and shared components**

```html
<link rel="stylesheet" href="../../../shared/styles/platform-design-system.css" />
```

```html
<main class="page">
  <header class="page-header">
    <h1 class="page-title">Insurance</h1>
    <p class="page-subtitle">
      Coverage, premiums, and operating contacts for Oasis at San Marco.
    </p>
  </header>

  <section class="stats-grid">
    <article class="stat-card">
      <div class="meta-label">Premiums Due (2026)</div>
      <strong>$99,619 /yr</strong>
    </article>
    <article class="stat-card">
      <div class="meta-label">Escrow Balance</div>
      <strong>$209,799</strong>
    </article>
    <article class="stat-card">
      <div class="meta-label">Monthly Insurance Escrow</div>
      <strong>$10,486 /mo</strong>
    </article>
  </section>

  <section class="card-grid" style="margin-top: 24px;">
    <section class="panel">
      <div class="control-row" style="justify-content: space-between;">
        <h2 style="margin: 0;">Monthly Insurance Trend</h2>
        <span class="badge">Operational View</span>
      </div>
      <p class="text-muted">Property insurance expense trend based on the existing source extract.</p>
      <!-- Move the existing SVG chart here unchanged except for wrapper classes -->
    </section>

    <section class="panel">
      <h2 style="margin-top: 0;">Key Contacts</h2>
      <div class="table-scroll">
        <table class="data-table" aria-label="Insurance contacts">
          <!-- Preserve the existing contact rows -->
        </table>
      </div>
    </section>
  </section>

  <section class="table-card" style="margin-top: 24px;">
    <h2 style="margin: 0 0 16px;">Policy Roster</h2>
    <div class="table-scroll">
      <table class="data-table" aria-label="Policy roster">
        <!-- Preserve the existing policy roster rows -->
      </table>
    </div>
  </section>
</main>
```

- [ ] **Step 4: Run the insurance normalization check**

Run:

```powershell
$content = Get-Content -Raw '.\modules\insurance\views\insurance_command_center_oasis_trusted.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">Insurance<' -and
  $content -match 'class="stats-grid"' -and
  $content -notmatch '--blue:' -and
  $content -notmatch 'font-family:Inter'
) {
  'PASS'
} else {
  throw 'Insurance view still contains an independent visual system.'
}
```

Expected: `PASS`

- [ ] **Step 5: Commit the insurance migration**

```bash
git add modules/insurance/views/insurance_command_center_oasis_trusted.html
git commit -m "feat: migrate insurance view to shared platform shell"
```

## Task 5: Migrate GP to the shared shell and shared components

**Files:**
- Modify: `modules/Gp/views/gp mockups.html`
- Test: `modules/Gp/views/gp mockups.html`

- [ ] **Step 1: Write the failing GP normalization check**

```powershell
$content = Get-Content -Raw '.\modules\Gp\views\gp mockups.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">GP<' -and
  $content -match 'class="stats-grid"' -and
  $content -notmatch '--brand-soft:' -and
  $content -notmatch 'GP Sponsors Command Center'
) {
  'PASS'
} else {
  throw 'GP view still contains an independent visual system.'
}
```

- [ ] **Step 2: Run the GP check to verify it fails**

Run:

```powershell
$content = Get-Content -Raw '.\modules\Gp\views\gp mockups.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">GP<' -and
  $content -match 'class="stats-grid"' -and
  $content -notmatch '--brand-soft:' -and
  $content -notmatch 'GP Sponsors Command Center'
) {
  'PASS'
} else {
  throw 'GP view still contains an independent visual system.'
}
```

Expected: FAIL with `GP view still contains an independent visual system.`

- [ ] **Step 3: Rebuild GP around the shared shell and normalize the tables**

```html
<link rel="stylesheet" href="../../../shared/styles/platform-design-system.css" />
```

```html
<main class="page">
  <header class="page-header">
    <h1 class="page-title">GP</h1>
    <p class="page-subtitle">
      Sponsor participation, capital raised, and partner mapping for Oasis at San Marco.
    </p>
  </header>

  <section class="stats-grid">
    <article class="stat-card">
      <div class="meta-label">Total Capital Raise (LP)</div>
      <strong>$6,047,500</strong>
    </article>
    <article class="stat-card">
      <div class="meta-label">PPC Sponsor Groups</div>
      <strong>$2,530,000</strong>
    </article>
    <article class="stat-card">
      <div class="meta-label">GP / LP Share</div>
      <strong>35% GP</strong>
    </article>
  </section>

  <section class="table-card" style="margin-top: 24px;">
    <div class="control-row" style="justify-content: space-between; margin-bottom: 16px;">
      <h2 style="margin: 0;">GP Sponsors Summary</h2>
      <span class="badge">Live View</span>
    </div>
    <div class="table-scroll">
      <table class="data-table" aria-label="GP sponsors summary table">
        <!-- Preserve the existing table body rows -->
      </table>
    </div>
  </section>
```

- [ ] **Step 4: Run the GP normalization check**

Run:

```powershell
$content = Get-Content -Raw '.\modules\Gp\views\gp mockups.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">GP<' -and
  $content -match 'class="stats-grid"' -and
  $content -notmatch '--brand-soft:' -and
  $content -notmatch 'GP Sponsors Command Center'
) {
  'PASS'
} else {
  throw 'GP view still contains an independent visual system.'
}
```

Expected: `PASS`

- [ ] **Step 5: Commit the GP migration**

```bash
git add "modules/Gp/views/gp mockups.html"
git commit -m "feat: migrate gp view to shared platform shell"
```

## Task 6: Migrate Taxes to the shared shell and normalize dense data sections

**Files:**
- Modify: `modules/taxes/views/index.html`
- Test: `modules/taxes/views/index.html`

- [ ] **Step 1: Write the failing taxes normalization check**

```powershell
$content = Get-Content -Raw '.\modules\taxes\views\index.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">Taxes<' -and
  $content -match 'class="table-card"' -and
  $content -notmatch 'class="hero-card"'
) {
  'PASS'
} else {
  throw 'Taxes view is not yet normalized to the shared shell.'
}
```

- [ ] **Step 2: Run the taxes check to verify it fails**

Run:

```powershell
$content = Get-Content -Raw '.\modules\taxes\views\index.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">Taxes<' -and
  $content -match 'class="table-card"' -and
  $content -notmatch 'class="hero-card"'
) {
  'PASS'
} else {
  throw 'Taxes view is not yet normalized to the shared shell.'
}
```

Expected: FAIL with `Taxes view is not yet normalized to the shared shell.`

- [ ] **Step 3: Rebuild the taxes page shell and wrap dense analytical sections with shared cards and tables**

```html
<link rel="stylesheet" href="../../../shared/styles/platform-design-system.css" />
```

```html
<main class="page">
  <header class="page-header">
    <h1 class="page-title">Taxes</h1>
    <p class="page-subtitle">
      Property tax exposure, appeal context, and historical bill analysis for Oasis at San Marco.
    </p>
  </header>

  <section class="stats-grid">
    <article class="stat-card">
      <div class="meta-label">Appeal Status</div>
      <strong>2025 Tax Appeal</strong>
    </article>
    <article class="stat-card">
      <div class="meta-label">Reference Asset</div>
      <strong>Oasis at San Marco</strong>
    </article>
    <article class="stat-card">
      <div class="meta-label">Primary Focus</div>
      <strong>Historical Bills</strong>
    </article>
  </section>

  <section class="card-grid" style="margin-top: 24px;">
    <section class="panel">
      <h2 style="margin-top: 0;">Appeal Snapshot</h2>
      <p class="text-muted">Move the current summary copy and appeal context into this shared panel wrapper.</p>
    </section>

    <section class="panel">
      <h2 style="margin-top: 0;">Key Documents</h2>
      <p class="text-muted">Keep the current links and references, but restyle them with shared controls and list spacing.</p>
    </section>
  </section>

  <section class="table-card" style="margin-top: 24px;">
    <h2 style="margin: 0 0 16px;">Historical Tax Bills</h2>
    <div class="table-scroll">
      <table class="data-table" aria-label="Historical tax bills">
        <!-- Preserve the existing historical bill table rows -->
      </table>
    </div>
  </section>

  <section class="table-card" style="margin-top: 24px;">
    <h2 style="margin: 0 0 16px;">Non-Ad Valorem & Totals</h2>
    <div class="table-scroll">
      <table class="data-table" aria-label="Non ad valorem and totals">
        <!-- Preserve the existing totals rows -->
      </table>
    </div>
  </section>
</main>
```

- [ ] **Step 4: Run the taxes normalization check**

Run:

```powershell
$content = Get-Content -Raw '.\modules\taxes\views\index.html'

if (
  $content -match '../../../shared/styles/platform-design-system\.css' -and
  $content -match 'class="app-shell"' -and
  $content -match 'class="page-title">Taxes<' -and
  $content -match 'class="table-card"' -and
  $content -notmatch 'class="hero-card"'
) {
  'PASS'
} else {
  throw 'Taxes view is not yet normalized to the shared shell.'
}
```

Expected: `PASS`

- [ ] **Step 5: Commit the taxes migration**

```bash
git add modules/taxes/views/index.html
git commit -m "feat: migrate taxes view to shared platform shell"
```

## Task 7: Run the cross-page consistency pass and finish the homologation

**Files:**
- Modify if needed: `index.html`
- Modify if needed: `modules/mortgage/views/index.html`
- Modify if needed: `modules/insurance/views/insurance_command_center_oasis_trusted.html`
- Modify if needed: `modules/Gp/views/gp mockups.html`
- Modify if needed: `modules/taxes/views/index.html`
- Test: all five views

- [ ] **Step 1: Write the failing full-app shell audit**

```powershell
$pages = @(
  '.\index.html',
  '.\modules\mortgage\views\index.html',
  '.\modules\insurance\views\insurance_command_center_oasis_trusted.html',
  '.\modules\Gp\views\gp mockups.html',
  '.\modules\taxes\views\index.html'
)

$errors = @()

foreach ($page in $pages) {
  $content = Get-Content -Raw $page

  if ($content -notmatch 'platform-design-system\.css') { $errors += "$page missing shared stylesheet link" }
  if ($content -notmatch 'class=""app-shell""') { $errors += "$page missing shared app shell" }
  if ($content -notmatch 'class=""app-sidebar""') { $errors += "$page missing shared sidebar" }
  if ($content -notmatch 'class=""app-topbar""') { $errors += "$page missing shared topbar" }
}

if ($errors.Count) {
  $errors | ForEach-Object { Write-Host $_ }
  throw 'Shared shell verification failed.'
}

$tokenLeaks = rg -n --glob '*.html' ':root\s*\{|--bg:|--panel:|--brand:' '.'
if ($tokenLeaks) {
  throw 'Found duplicate page-level token systems in HTML files.'
}

'PASS'
```

- [ ] **Step 2: Run the audit to verify the first pass catches any remaining drift**

Run:

```powershell
$pages = @(
  '.\index.html',
  '.\modules\mortgage\views\index.html',
  '.\modules\insurance\views\insurance_command_center_oasis_trusted.html',
  '.\modules\Gp\views\gp mockups.html',
  '.\modules\taxes\views\index.html'
)

$errors = @()

foreach ($page in $pages) {
  $content = Get-Content -Raw $page

  if ($content -notmatch 'platform-design-system\.css') { $errors += "$page missing shared stylesheet link" }
  if ($content -notmatch 'class=""app-shell""') { $errors += "$page missing shared app shell" }
  if ($content -notmatch 'class=""app-sidebar""') { $errors += "$page missing shared sidebar" }
  if ($content -notmatch 'class=""app-topbar""') { $errors += "$page missing shared topbar" }
}

if ($errors.Count) {
  $errors | ForEach-Object { Write-Host $_ }
  throw 'Shared shell verification failed.'
}

$tokenLeaks = rg -n --glob '*.html' ':root\s*\{|--bg:|--panel:|--brand:' '.'
if ($tokenLeaks) {
  throw 'Found duplicate page-level token systems in HTML files.'
}

'PASS'
```

Expected before final polish: either FAIL with a page still drifting from the shared shell or FAIL with duplicate page token definitions still present.

- [ ] **Step 3: Fix any remaining drift and run a browser visual pass against the reference**

Use these exact checks while the pages are open side by side with the reference screenshot:

```text
- Sidebar width and item spacing match across all five pages
- Active nav state uses the same pale-yellow selected treatment
- Topbar height and right-side controls match across all five pages
- Page titles, subtitles, controls, badges, cards, and tables read as one family
- Insurance and GP no longer feel visually different from Mortgage
- Taxes uses the same shell and card/table language despite higher density
- Landing reads as part of the same product, not a separate homepage
```

- [ ] **Step 4: Run the final full-app audit**

Run:

```powershell
$pages = @(
  '.\index.html',
  '.\modules\mortgage\views\index.html',
  '.\modules\insurance\views\insurance_command_center_oasis_trusted.html',
  '.\modules\Gp\views\gp mockups.html',
  '.\modules\taxes\views\index.html'
)

$errors = @()

foreach ($page in $pages) {
  $content = Get-Content -Raw $page

  if ($content -notmatch 'platform-design-system\.css') { $errors += "$page missing shared stylesheet link" }
  if ($content -notmatch 'class=""app-shell""') { $errors += "$page missing shared app shell" }
  if ($content -notmatch 'class=""app-sidebar""') { $errors += "$page missing shared sidebar" }
  if ($content -notmatch 'class=""app-topbar""') { $errors += "$page missing shared topbar" }
}

if ($errors.Count) {
  $errors | ForEach-Object { Write-Host $_ }
  throw 'Shared shell verification failed.'
}

$tokenLeaks = rg -n --glob '*.html' ':root\s*\{|--bg:|--panel:|--brand:' '.'
if ($tokenLeaks) {
  throw 'Found duplicate page-level token systems in HTML files.'
}

'PASS'
```

Expected: `PASS`

- [ ] **Step 5: Commit the final homologation pass**

```bash
git add index.html modules/mortgage/views/index.html modules/insurance/views/insurance_command_center_oasis_trusted.html "modules/Gp/views/gp mockups.html" modules/taxes/views/index.html shared/styles/platform-design-system.css
git commit -m "feat: homologate platform ui to shared reference design system"
```

## Self-Review Notes

### Spec coverage

- shared shell: covered by Tasks 1-7
- colors, typography, buttons, inputs, badges, cards, tables: covered by Task 1 and enforced by Task 7
- landing page alignment: covered by Task 2
- mortgage alignment: covered by Task 3
- insurance alignment: covered by Task 4
- GP alignment: covered by Task 5
- taxes alignment: covered by Task 6
- no arbitrary differences remaining: covered by Task 7

### Placeholder scan

- no `TBD`
- no `TODO`
- no "similar to Task N"
- every task has explicit files, commands, and code fragments

### Type and naming consistency

- shared stylesheet path is always `shared/styles/platform-design-system.css`
- shared shell class names are consistent:
  - `app-shell`
  - `app-sidebar`
  - `app-topbar`
  - `page`
  - `page-header`
  - `stats-grid`
  - `table-card`
  - `data-table`

