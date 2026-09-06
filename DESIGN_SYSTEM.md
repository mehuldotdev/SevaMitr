# SevaMitr Complete Design System & UI Specification

A production-ready design specification and token dictionary for replicating the **Neo-Brutalist Organic Healthtech** interface in any web application.

---

## 1. Design Philosophy & Visual Language

The SevaMitr visual language blends **modern Neo-Brutalism** with **warm organic minimalism** to create an interface that is:
- **High-Contrast & Tactile**: Bold solid borders (`2px solid #1c1b1b`), hard un-blurred drop shadows (`3px 3px 0px #1c1b1b`), and realistic button push-down animations.
- **Accessible & Dementia-Safe**: High contrast ratios, oversized tap targets (minimum 48px–58px), clear visual hierarchies, and distinct color-coded semantic cues.
- **Culturally Rooted & Grounding**: Warm earthy tones inspired by the North Eastern Region (Kaziranga Forest Green, Majuli Terracotta, Muga Ochre, and Pale Sage).

---

## 2. Color Palette & Design Tokens

### Primary Palette
| Token Name | Hex Code | CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Kaziranga Forest Green** | `#214935` / `#1b4332` | `--color-primary` | Primary action buttons, brand accents, dark pills |
| **Tea Garden Leaf** | `#2d6a4f` | `--color-primary-light` | Button hover states, active indicators |
| **Pale Sage (Canvas)** | `#f4f7f4` | `--color-bg` | Main application background (low-glare) |
| **Pure Surface White** | `#ffffff` | `--color-surface` | Card bodies, containers, modals |
| **Muted Stone / Sand** | `#e5dfd5` | `--color-surface-subtle` | Secondary chips, subtle background panels |

### Text & Border Tokens
| Token Name | Hex Code | CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Deep Charcoal** | `#1c1b1b` | `--color-text-main`, `--color-border` | All component borders, drop shadows, main headings |
| **Warm Earth Slate** | `#57534e` | `--color-text-muted` | Subtitles, body descriptions, supporting labels |
| **Warm Stone** | `#78716c` | `--color-text-dim` | Captions, timestamps, disabled states |
| **Border Subtle** | `#dbe6dd` / `#c9dcd0` | `--color-border-subtle` | Dashed game boundaries, dividers, separators |

### Vibrant Accent & Badge Palette
| Accent Name | Pill Background | Text Color | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| **Terracotta** | `#fe8357` / `#c85a32` | `#1c1b1b` | Visual UFOV / High Alert / Action Required |
| **Muga Amber** | `#f0bc93` / `#fbefaf` | `#1c1b1b` / `#854d0e` | Auditory Processing / Tips / Active Reminders |
| **Herbal Mint** | `#c0edd1` / `#e8f5e9` | `#073220` / `#214935` | Attention / Success / Completed Sessions |
| **Sky / Glacier** | `#e0f2fe` / `#e3f2fd` | `#0369a1` / `#0f4c81` | Speed / Visual Search / Telemetry Metrics |
| **Gentle Lavender**| `#e9d5ff` | `#581c87` | Clinical Handover / Special Category |
| **Gentle Rose** | `#fee2e2` / `#faebe6` | `#991b1b` / `#c85a32` | Alerts / Sundowning Divergence / Urgent Call |

---

## 3. Typography & Font Hierarchy

### Font Families
- **Headings & Display**: `Clash Display` (Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
- **Body & Multilingual**: `Inter`, `Noto Sans Bengali`, `Noto Sans Devanagari`

### Google Fonts Preconnect (Add to `<head>`)
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap"
  rel="stylesheet"
/>
```

### Typographic Scales & Classes
| Class Name | Font Weight | Letter Spacing | Text Transform | Typical Usage |
| :--- | :--- | :--- | :--- | :--- |
| `.font-clash-bold` | `700` | `-0.015em` | `uppercase` | Page titles (`h1`), modal headings |
| `.font-clash-semibold` | `600` | `-0.005em` | Normal | Card titles (`h2`, `h3`), navigation links |
| `.font-clash-medium` | `500` | Normal | Normal | Subheadings, input labels |
| `.font-clash-regular` | `400` | Normal | Normal | Body text, clinical descriptions |
| `.font-clash-wide` | `700` / `800` | `0.06em` | `uppercase` | Category kickers, pill badges, micro-caps |
| `.font-clash-metric` | `700` / `800` | `-0.02em` | `tnum, lnum` | Large numbers (ms, %, scores, reaction times) |

---

## 4. Geometry, Shadows & Elevation Rules

The Neo-Brutalist look relies on **solid, zero-blur offsets** with deep black `#1c1b1b` borders:

### The 4 Border & Shadow Rules:
1. **Border Rule**: Every card, button, pill, input, and avatar uses `border: 2px solid #1c1b1b` (never 1px translucent borders).
2. **Shadow Rule**: Shadows are completely opaque:
   - **Small Components (Pills, Chips)**: `box-shadow: 2px 2px 0px #1c1b1b`
   - **Standard Cards & Buttons**: `box-shadow: 3px 3px 0px #1c1b1b` or `4px 4px 0px #1c1b1b`
   - **Hover Elevation**: `box-shadow: 6px 6px 0px #1c1b1b` with `transform: translateY(-2px)`
   - **Active / Pressed**: `box-shadow: 1px 1px 0px #1c1b1b` with `transform: translate(2px, 2px)`
3. **Corner Radiuses**:
   - Cards & Bento containers: `border-radius: 24px` or `26px`
   - Icon containers & Input fields: `border-radius: 12px` or `16px`
   - Pills, Buttons & Bottom Dock: `border-radius: 9999px` (full pill)
4. **Frosted Glass Header**:
   - `background: rgba(239, 235, 228, 0.94)`
   - `backdrop-filter: blur(12px)`
   - `border-bottom: 2px solid #1c1b1b`

---

## 5. Reusable Component HTML & CSS Blueprints

### A. The Master Neo-Card
```html
<div class="neo-card">
  <!-- Card Eyebrow & Pill Header -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
    <span class="neo-pill neo-pill-green">COGNITIVE SPEED</span>
    <span class="font-clash-wide" style="font-size: 0.75rem; color: #57534e;">TRIAL #1</span>
  </div>

  <!-- Card Title -->
  <h2 class="font-clash-bold" style="font-size: 1.4rem; color: #1c1b1b; margin-bottom: 0.4rem; text-transform: uppercase;">
    Sight Speed
  </h2>
  
  <p class="font-clash-regular" style="font-size: 0.9rem; color: #57534e; line-height: 1.5; margin-bottom: 1.5rem;">
    Rapid Useful Field of View (UFOV) visual discrimination exercise calibrated for geriatric processing speeds.
  </p>

  <!-- Metric Footer with FAB Button -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <div class="font-clash-wide" style="font-size: 0.72rem; color: #78716c;">PROCESSING THRESHOLD</div>
      <div class="font-clash-metric" style="font-size: 2.2rem; color: #214935; margin-top: 0.2rem;">
        120 <span style="font-size: 1rem;">ms</span>
      </div>
    </div>

    <a href="#" class="neo-fab-circle" aria-label="Start Exercise">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M7 17L17 7M17 7H7M17 7V17" />
      </svg>
    </a>
  </div>
</div>
```

### B. Neo Pill Badge System
```html
<!-- Green (Attention/Positive) -->
<span class="neo-pill neo-pill-green">ATTENTION</span>

<!-- Terracotta (UFOV/Action) -->
<span class="neo-pill neo-pill-terracotta">VISUAL UFOV</span>

<!-- Amber (Auditory/Warning) -->
<span class="neo-pill neo-pill-amber">AUDITORY</span>

<!-- Charcoal (Clinical/System) -->
<span class="neo-pill neo-pill-charcoal">CLINICAL SUITE</span>

<!-- Lavender (Handover/Category) -->
<span class="neo-pill neo-pill-purple">DOCTOR REPORT</span>
```

### C. Tactile Primary Action Button
```html
<button class="neo-btn-primary">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
  <span>Save Patient & Start Games</span>
</button>
```

```css
.neo-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  background: #214935;
  color: #ffffff;
  border: 2px solid #1c1b1b;
  border-radius: 9999px;
  box-shadow: 3px 3px 0px #1c1b1b;
  padding: 0.85rem 1.6rem;
  font-family: var(--font-clash);
  font-weight: 700;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}

.neo-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 5px 5px 0px #1c1b1b;
  background: #274e3a;
}

.neo-btn-primary:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0px #1c1b1b;
}
```

### D. Spaced-Out Header Icon & Badge Pair
```html
<div style="display: flex; align-items: center; justify-content: center; gap: 0.9rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
  <!-- Icon Box -->
  <div style="width: 52px; height: 52px; border-radius: 16px; background: #e8f5e9; border: 2px solid #1c1b1b; box-shadow: 3px 3px 0px #1c1b1b; display: flex; align-items: center; justify-content: center; color: #214935; flex-shrink: 0;">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  </div>

  <!-- Aligned Badge -->
  <span class="neo-pill" style="background: #214935; color: #ffffff; font-size: 0.78rem; font-weight: 700; padding: 0.45rem 1.15rem; letter-spacing: 0.05em;">
    PATIENT REGISTRATION REQUIRED
  </span>
</div>
```

### E. Neo-Form Inputs & Segmented Toggles
```html
<!-- Text Input with Hard Border -->
<div style="margin-bottom: 1.25rem;">
  <label class="font-clash-bold" style="display: block; font-size: 0.85rem; color: #1c1b1b; margin-bottom: 0.45rem; text-transform: uppercase;">
    Full Name *
  </label>
  <input type="text" class="neo-input" placeholder="e.g. Bhaben Baruah" />
</div>

<!-- Segmented 3-Way Pill Switcher -->
<div style="display: flex; gap: 0.4rem;">
  <button type="button" class="neo-toggle-btn active">Female</button>
  <button type="button" class="neo-toggle-btn">Male</button>
  <button type="button" class="neo-toggle-btn">Other</button>
</div>
```

```css
.neo-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 2px solid #1c1b1b;
  background: #fcfbf9;
  font-family: inherit;
  font-size: 0.95rem;
  color: #1c1b1b;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.neo-input:focus {
  background: #ffffff;
  box-shadow: 2px 2px 0px #1c1b1b;
}

.neo-toggle-btn {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border-radius: 12px;
  border: 2px solid #1c1b1b;
  background: #ffffff;
  color: #1c1b1b;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.neo-toggle-btn.active {
  background: #214935;
  color: #ffffff;
  box-shadow: 2px 2px 0px #1c1b1b;
}
```

### F. Floating Bottom Navigation Dock
```html
<nav class="neo-bottom-dock">
  <a href="/patient" class="neo-dock-btn active">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    <span>Games</span>
  </a>
  <a href="/caregiver" class="neo-dock-btn">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    <span>Dashboard</span>
  </a>
</nav>
```

---

## 6. Complete Drop-In Stylesheet (`styles.css`)

Copy and paste this single CSS block into your new site's stylesheet:

```css
/* ========================================================
   SEVAMITR NEO-BRUTALIST DESIGN SYSTEM MASTER CSS
   ======================================================== */

:root {
  --color-bg: #f4f7f4;
  --color-surface: #ffffff;
  --color-surface-subtle: #e5dfd5;
  --color-text-main: #1c1b1b;
  --color-text-muted: #57534e;
  --color-text-dim: #78716c;

  --color-primary: #214935;
  --color-primary-light: #2d6a4f;
  --color-primary-soft: #e8f5e9;

  --color-terracotta: #fe8357;
  --color-amber: #f0bc93;
  --color-green: #c0edd1;
  --color-purple: #e9d5ff;

  --color-border: #1c1b1b;
  --font-clash: 'Clash Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --transition-smooth: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-main);
  font-family: var(--font-clash);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Typography Helpers */
.font-clash-bold {
  font-family: var(--font-clash) !important;
  font-weight: 700 !important;
  letter-spacing: -0.015em;
}

.font-clash-semibold {
  font-family: var(--font-clash) !important;
  font-weight: 600 !important;
  letter-spacing: -0.005em;
}

.font-clash-medium {
  font-family: var(--font-clash) !important;
  font-weight: 500 !important;
}

.font-clash-regular {
  font-family: var(--font-clash) !important;
  font-weight: 400 !important;
}

.font-clash-wide {
  font-family: var(--font-clash) !important;
  font-weight: 700 !important;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.font-clash-metric {
  font-family: var(--font-clash) !important;
  font-weight: 700 !important;
  line-height: 1;
  letter-spacing: -0.02em;
  font-feature-settings: 'tnum' on, 'lnum' on;
}

/* Cards */
.neo-card {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 26px;
  box-shadow: 4px 4px 0px var(--color-border);
  transition: var(--transition-smooth);
}

.neo-card:hover {
  transform: translateY(-2px);
  box-shadow: 6px 6px 0px var(--color-border);
}

.neo-card-dark {
  background: var(--color-text-main);
  color: #ffffff;
  border: 2px solid var(--color-border);
  border-radius: 26px;
  box-shadow: 4px 4px 0px var(--color-primary);
  transition: var(--transition-smooth);
}

.neo-card-dark:hover {
  transform: translateY(-2px);
  box-shadow: 6px 6px 0px var(--color-primary);
}

/* Pills & Badges */
.neo-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.95rem;
  border-radius: 9999px;
  border: 2px solid var(--color-border);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 2px 2px 0px var(--color-border);
}

.neo-pill-terracotta { background: var(--color-terracotta); color: #1c1b1b; }
.neo-pill-amber { background: var(--color-amber); color: #1c1b1b; }
.neo-pill-green { background: var(--color-green); color: #073220; }
.neo-pill-purple { background: var(--color-purple); color: #581c87; }
.neo-pill-charcoal { background: var(--color-text-main); color: #ffffff; }

/* Buttons */
.neo-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  background: var(--color-primary);
  color: #ffffff;
  border: 2px solid var(--color-border);
  border-radius: 9999px;
  box-shadow: 3px 3px 0px var(--color-border);
  padding: 0.85rem 1.6rem;
  font-weight: 700;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.neo-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 5px 5px 0px var(--color-border);
  background: var(--color-primary-light);
}

.neo-btn-primary:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0px var(--color-border);
}

/* Floating Action Circle Button */
.neo-fab-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  box-shadow: 3px 3px 0px var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--color-primary);
  color: #ffffff;
  transition: all 0.15s ease;
  flex-shrink: 0;
  text-decoration: none;
}

.neo-fab-circle:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0px var(--color-border);
}

.neo-fab-circle:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0px var(--color-border);
}

/* Floating Bottom Dock */
.neo-bottom-dock {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  border: 2px solid var(--color-border);
  border-radius: 9999px;
  box-shadow: 4px 4px 0px var(--color-border);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  z-index: 90;
}

.neo-dock-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.15rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--color-text-main);
  transition: all 0.15s ease;
}

.neo-dock-btn.active {
  background: var(--color-primary);
  color: #ffffff;
  border: 2px solid var(--color-border);
  box-shadow: 2px 2px 0px var(--color-border);
}
```

---

## 7. Implementation Checklist for Your New Site

1. **Include Styles**: Link `styles.css` into your document or import into your project's root (`layout.tsx` or `index.html`).
2. **Setup Background**: Set `body { background-color: #f4f7f4; color: #1c1b1b; }`.
3. **Sticky Header**: Use `rgba(239, 235, 228, 0.94)` background with `backdrop-filter: blur(12px)` and a `2px solid #1c1b1b` bottom border.
4. **All Interactive Elements**: Add `:hover` (`translateY(-2px)`, `box-shadow: 5px 5px 0px #1c1b1b`) and `:active` (`translate(2px, 2px)`, `box-shadow: 1px 1px 0px #1c1b1b`).
5. **Layouts**: Group related modules into `.neo-card` containers with `padding: 1.5rem` to `2.25rem` and `border-radius: 26px`.
