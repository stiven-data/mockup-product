# Platform Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the empty repository-root homepage with a polished executive landing page that matches the mortgage module's UI language and routes users into the available Mortgage module.

**Architecture:** Build a single self-contained `index.html` file with inline CSS and optional inline JS, using the mortgage module as the visual reference for tokens, layout rhythm, and surface styling. Keep the page intentionally simple: one application shell, one compact hero, one responsive 2x2 module grid, and one understated footer.

**Tech Stack:** HTML5, inline CSS, optional vanilla JavaScript, PowerShell for smoke-check verification

---

## File Structure

- Modify: `index.html`
- Reference: `modules/mortgage/views/index.html`
- Plan only: `docs/specs/2026-04-21-platform-homepage-design.md`

`index.html` will own the full experience:

- CSS custom properties for the mortgage-aligned palette, radii, and shadow system
- Semantic header, hero, module grid, and footer markup
- Responsive rules for desktop and laptop widths
- Hover and focus-visible states for active and placeholder module cards

No mortgage files, shared assets, or build tooling should be added.

### Task 1: Build the page shell and executive hero

**Files:**
- Modify: `index.html`
- Reference: `modules/mortgage/views/index.html`
- Verify: `index.html`

- [ ] **Step 1: Define a failing shell smoke check**

```powershell
$content = Get-Content -Raw '.\index.html'
if (
  $content -match 'Valoris Capital Platform' -and
  $content -match 'Operational Intelligence Modules' -and
  $content -match 'class="app-frame"' -and
  $content -match 'Internal Mockup'
) {
  'PASS'
} else {
  throw 'Homepage shell copy or structure is missing.'
}
```

- [ ] **Step 2: Run the shell smoke check to confirm the current root page fails**

Run:

```powershell
$content = Get-Content -Raw '.\index.html'
if (
  $content -match 'Valoris Capital Platform' -and
  $content -match 'Operational Intelligence Modules' -and
  $content -match 'class="app-frame"' -and
  $content -match 'Internal Mockup'
) {
  'PASS'
} else {
  throw 'Homepage shell copy or structure is missing.'
}
```

Expected: FAIL with `Homepage shell copy or structure is missing.`

- [ ] **Step 3: Replace the empty `index.html` with the full shell, header, hero, and footer**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Valoris Capital Platform</title>
    <style>
      :root {
        --bg: #f6f2e8;
        --surface: rgba(255, 255, 255, 0.84);
        --surface-strong: #ffffff;
        --surface-muted: #f5f7fa;
        --line: rgba(15, 37, 64, 0.1);
        --line-strong: rgba(15, 37, 64, 0.18);
        --ink: #10253e;
        --ink-soft: #5e6f82;
        --brand: #0f2747;
        --brand-2: #173963;
        --accent: #b49149;
        --accent-soft: rgba(180, 145, 73, 0.14);
        --shadow: 0 24px 60px rgba(16, 37, 62, 0.12);
        --radius-lg: 28px;
        --radius-md: 18px;
        --radius-sm: 12px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(204, 225, 239, 0.75), transparent 28%),
          radial-gradient(circle at top right, rgba(222, 210, 173, 0.46), transparent 24%),
          linear-gradient(180deg, #fcfaf5 0%, #f3efe6 100%);
      }

      .page-shell {
        width: min(1320px, calc(100% - 48px));
        margin: 32px auto;
      }

      .app-frame {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.72));
        border: 1px solid rgba(255, 255, 255, 0.74);
        border-radius: 36px;
        box-shadow: var(--shadow);
        overflow: hidden;
        backdrop-filter: blur(18px);
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 20px 30px;
        border-bottom: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.72);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 16px;
      }

      .brand-mark {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #ffcd52 0%, #e2b740 45%, #8c6d24 100%);
        color: var(--brand);
        font-size: 24px;
        font-weight: 800;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
      }

      .brand-copy strong {
        display: block;
        font-family: "Aptos Display", "Segoe UI Semibold", "Segoe UI", sans-serif;
        font-size: 1.1rem;
        letter-spacing: 0.06em;
      }

      .brand-copy span,
      .hero-copy p,
      .footer-note {
        color: var(--ink-soft);
      }

      .context-pill {
        padding: 10px 16px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(245, 247, 250, 0.85);
        font-size: 0.92rem;
      }

      .content {
        padding: 32px;
        display: grid;
        gap: 24px;
      }

      .hero-panel {
        position: relative;
        overflow: hidden;
        padding: 34px;
        border-radius: var(--radius-lg);
        border: 1px solid rgba(15, 39, 71, 0.08);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 249, 252, 0.88));
        box-shadow: 0 18px 40px rgba(16, 37, 62, 0.06);
      }

      .hero-panel::after {
        content: "";
        position: absolute;
        inset: auto -18% -46% auto;
        width: 280px;
        height: 280px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(180, 145, 73, 0.14), transparent 70%);
        pointer-events: none;
      }

      .eyebrow {
        margin: 0 0 14px;
        color: var(--accent);
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.26em;
        text-transform: uppercase;
      }

      .hero-copy h1 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        font-size: clamp(2.2rem, 4vw, 3.4rem);
        line-height: 1.04;
        letter-spacing: -0.03em;
      }

      .hero-copy p {
        margin: 14px 0 0;
        max-width: 60ch;
        line-height: 1.65;
        font-size: 1rem;
      }

      .footer-note {
        padding: 4px 6px 0;
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <div class="page-shell">
      <div class="app-frame">
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark">V</div>
            <div class="brand-copy">
              <strong>VALORIS</strong>
              <span>Capital Platform &middot; Executive Launchpad</span>
            </div>
          </div>
          <div class="context-pill">Internal access &middot; Module directory</div>
        </header>

        <main class="content">
          <section class="hero-panel">
            <p class="eyebrow">Platform Home</p>
            <div class="hero-copy">
              <h1>Valoris Capital Platform</h1>
              <p>
                Operational Intelligence Modules
              </p>
              <p>
                Access the current operating modules from a single executive entry point designed
                to mirror the mortgage experience and establish a consistent platform shell.
              </p>
            </div>
          </section>

          <footer class="footer-note">Internal Mockup &#8226; Valoris Capital</footer>
        </main>
      </div>
    </div>
  </body>
</html>
```

- [ ] **Step 4: Re-run the shell smoke check and confirm it passes**

Run:

```powershell
$content = Get-Content -Raw '.\index.html'
if (
  $content -match 'Valoris Capital Platform' -and
  $content -match 'Operational Intelligence Modules' -and
  $content -match 'class="app-frame"' -and
  $content -match 'Internal Mockup'
) {
  'PASS'
} else {
  throw 'Homepage shell copy or structure is missing.'
}
```

Expected: `PASS`

- [ ] **Step 5: Commit the shell and hero foundation**

```bash
git add index.html
git commit -m "feat: add platform homepage shell"
```

### Task 2: Add the module grid, card icons, and state-specific CTAs

**Files:**
- Modify: `index.html`
- Reference: `modules/mortgage/views/index.html`
- Verify: `index.html`

- [ ] **Step 1: Define a failing module-grid smoke check**

```powershell
$content = Get-Content -Raw '.\index.html'
if (
  $content -match 'Mortgage' -and
  $content -match 'Insurance' -and
  $content -match 'GP' -and
  $content -match 'Taxes' -and
  $content -match '\./modules/mortgage/views/index.html' -and
  ([regex]::Matches($content, 'Coming Soon').Count -ge 3)
) {
  'PASS'
} else {
  throw 'Module cards, mortgage link, or coming-soon states are missing.'
}
```

- [ ] **Step 2: Run the module-grid smoke check to confirm the current page fails**

Run:

```powershell
$content = Get-Content -Raw '.\index.html'
if (
  $content -match 'Mortgage' -and
  $content -match 'Insurance' -and
  $content -match 'GP' -and
  $content -match 'Taxes' -and
  $content -match '\./modules/mortgage/views/index.html' -and
  ([regex]::Matches($content, 'Coming Soon').Count -ge 3)
) {
  'PASS'
} else {
  throw 'Module cards, mortgage link, or coming-soon states are missing.'
}
```

Expected: FAIL with `Module cards, mortgage link, or coming-soon states are missing.`

- [ ] **Step 3: Extend the existing `<style>` block with the card rules, then insert the `<section class="module-grid">` directly below the hero panel**

```html
<style>
  .module-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }

  .module-card {
    position: relative;
    display: grid;
    gap: 18px;
    min-height: 250px;
    padding: 26px;
    border-radius: var(--radius-lg);
    border: 1px solid rgba(15, 39, 71, 0.08);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 248, 251, 0.92));
    box-shadow: 0 18px 40px rgba(16, 37, 62, 0.06);
    color: inherit;
    text-decoration: none;
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  }

  .module-card.is-live:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 48px rgba(16, 37, 62, 0.12);
    border-color: rgba(15, 39, 71, 0.14);
  }

  .module-card.is-soon {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(245, 247, 250, 0.92));
  }

  .module-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .module-icon {
    width: 54px;
    height: 54px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    background: var(--accent-soft);
    color: var(--brand);
    font-size: 1.35rem;
    font-weight: 800;
  }

  .status-badge {
    padding: 7px 11px;
    border-radius: 999px;
    border: 1px solid rgba(180, 145, 73, 0.24);
    background: rgba(180, 145, 73, 0.12);
    color: var(--brand);
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .module-body h2 {
    margin: 0;
    font-size: 1.4rem;
    line-height: 1.12;
  }

  .module-body p {
    margin: 10px 0 0;
    color: var(--ink-soft);
    line-height: 1.6;
  }

  .module-cta {
    margin-top: auto;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    color: var(--brand);
  }

  .module-card.is-soon .module-cta {
    color: var(--ink-soft);
  }
</style>

<section class="module-grid" aria-label="Platform modules">
  <a class="module-card is-live" href="./modules/mortgage/views/index.html">
    <div class="module-top">
      <div class="module-icon" aria-hidden="true">M</div>
    </div>
    <div class="module-body">
      <h2>Mortgage</h2>
      <p>Debt &amp; Financing Decisions</p>
    </div>
    <div class="module-cta">
      <span>Open module</span>
      <span aria-hidden="true">&rarr;</span>
    </div>
  </a>

  <a class="module-card is-soon" href="#" aria-disabled="true">
    <div class="module-top">
      <div class="module-icon" aria-hidden="true">I</div>
      <span class="status-badge">Coming Soon</span>
    </div>
    <div class="module-body">
      <h2>Insurance</h2>
      <p>Coverage &amp; Risk Tracking</p>
    </div>
    <div class="module-cta">Module in preparation</div>
  </a>

  <a class="module-card is-soon" href="#" aria-disabled="true">
    <div class="module-top">
      <div class="module-icon" aria-hidden="true">GP</div>
      <span class="status-badge">Coming Soon</span>
    </div>
    <div class="module-body">
      <h2>GP</h2>
      <p>General Partner Insights</p>
    </div>
    <div class="module-cta">Module in preparation</div>
  </a>

  <a class="module-card is-soon" href="#" aria-disabled="true">
    <div class="module-top">
      <div class="module-icon" aria-hidden="true">T</div>
      <span class="status-badge">Coming Soon</span>
    </div>
    <div class="module-body">
      <h2>Taxes</h2>
      <p>Tax Exposure &amp; Planning</p>
    </div>
    <div class="module-cta">Module in preparation</div>
  </a>
</section>
```

- [ ] **Step 4: Re-run the module-grid smoke check and confirm it passes**

Run:

```powershell
$content = Get-Content -Raw '.\index.html'
if (
  $content -match 'Mortgage' -and
  $content -match 'Insurance' -and
  $content -match 'GP' -and
  $content -match 'Taxes' -and
  $content -match '\./modules/mortgage/views/index.html' -and
  ([regex]::Matches($content, 'Coming Soon').Count -ge 3)
) {
  'PASS'
} else {
  throw 'Module cards, mortgage link, or coming-soon states are missing.'
}
```

Expected: `PASS`

- [ ] **Step 5: Commit the module grid and launch states**

```bash
git add index.html
git commit -m "feat: add platform module launcher cards"
```

### Task 3: Add responsive polish, focus states, and final verification

**Files:**
- Modify: `index.html`
- Reference: `modules/mortgage/views/index.html`
- Verify: `index.html`

- [ ] **Step 1: Define a failing polish smoke check**

```powershell
$content = Get-Content -Raw '.\index.html'
if (
  $content -match ':focus-visible' -and
  $content -match '@media \(max-width: 980px\)' -and
  $content -match '@media \(max-width: 720px\)' -and
  $content -match 'pointer-events: none'
) {
  'PASS'
} else {
  throw 'Responsive rules or interaction polish is missing.'
}
```

- [ ] **Step 2: Run the polish smoke check to confirm the current page fails**

Run:

```powershell
$content = Get-Content -Raw '.\index.html'
if (
  $content -match ':focus-visible' -and
  $content -match '@media \(max-width: 980px\)' -and
  $content -match '@media \(max-width: 720px\)' -and
  $content -match 'pointer-events: none'
) {
  'PASS'
} else {
  throw 'Responsive rules or interaction polish is missing.'
}
```

Expected: FAIL with `Responsive rules or interaction polish is missing.`

- [ ] **Step 3: Append the focus, disabled-state, and breakpoint rules to the existing `<style>` block**

```html
<style>
  .module-card:focus-visible {
    outline: 3px solid rgba(180, 145, 73, 0.36);
    outline-offset: 3px;
  }

  .module-card.is-soon {
    pointer-events: none;
  }

  .module-card.is-soon .status-badge {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 980px) {
    .module-grid {
      grid-template-columns: 1fr;
    }

    .hero-panel {
      padding: 28px;
    }
  }

  @media (max-width: 720px) {
    .page-shell {
      width: min(100%, calc(100% - 24px));
      margin: 12px auto;
    }

    .topbar,
    .content {
      padding-left: 18px;
      padding-right: 18px;
    }

    .topbar {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-panel,
    .module-card {
      padding: 20px;
    }
  }
</style>
```

- [ ] **Step 4: Re-run the polish smoke check and confirm it passes**

Run:

```powershell
$content = Get-Content -Raw '.\index.html'
if (
  $content -match ':focus-visible' -and
  $content -match '@media \(max-width: 980px\)' -and
  $content -match '@media \(max-width: 720px\)' -and
  $content -match 'pointer-events: none'
) {
  'PASS'
} else {
  throw 'Responsive rules or interaction polish is missing.'
}
```

Expected: `PASS`

- [ ] **Step 5: Perform final smoke checks and open a manual preview**

Run:

```powershell
$content = Get-Content -Raw '.\index.html'
$checks = @(
  $content -match 'Valoris Capital Platform',
  $content -match 'Operational Intelligence Modules',
  $content -match '\./modules/mortgage/views/index.html',
  ([regex]::Matches($content, 'Coming Soon').Count -ge 3),
  $content -match 'Debt &amp; Financing Decisions',
  $content -match 'Coverage &amp; Risk Tracking',
  $content -match 'General Partner Insights',
  $content -match 'Tax Exposure &amp; Planning',
  $content -match 'Internal Mockup' -and
  $content -match 'Valoris Capital'
)
if ($checks -contains $false) {
  throw 'Final homepage smoke check failed.'
}
'PASS'
Start-Process '.\index.html'
```

Expected: `PASS`, then the browser opens the landing page for desktop and laptop-width review.

- [ ] **Step 6: Commit the responsive and final polish pass**

```bash
git add index.html
git commit -m "feat: polish platform homepage"
```

## Self-Review

### Spec coverage

- Header and platform identity: covered in Task 1
- Executive hero without extra dashboard panels: covered in Task 1
- Four module cards with required descriptions: covered in Task 2
- Mortgage link and placeholder states: covered in Task 2
- Matching polish, hover behavior, and responsive layout: covered in Task 3
- Footer requirement and final verification: covered in Tasks 1 and 3

### Placeholder scan

- No `TBD`, `TODO`, or deferred implementation language remains.
- Each verification step includes an exact PowerShell command and an expected result.
- Each code-writing step includes concrete HTML and CSS to apply.

### Type consistency

- The same class names are used consistently across tasks: `app-frame`, `hero-panel`, `module-grid`, `module-card`, `status-badge`, and `footer-note`.
- The active module path remains `./modules/mortgage/views/index.html` in both task and verification steps.
