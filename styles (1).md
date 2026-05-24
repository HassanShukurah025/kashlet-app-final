# KASHLET — DESIGN SYSTEM & STYLES GUIDE

# 1. Product Visual Philosophy

Kashlet is a premium financial workspace built for clarity, trust, speed, and structured workflows.

The interface should feel:

* calm
* precise
* professional
* lightweight
* highly readable
* production-ready

The experience must avoid:

* visual clutter
* decorative UI
* flashy interactions
* excessive animations
* loud color usage

Kashlet should feel like a real SaaS financial product used daily by modern freelancers and small businesses.

---

# 2. Design Inspiration References

Primary inspiration sources:

* Linear → spacing discipline and layout structure
* Stripe Dashboard → financial clarity and table systems
* Notion → information organization
* Mercury → calm fintech experience
* Vercel Dashboard → clean density handling

The UI should not imitate these products directly, but should inherit their:

* restraint
* hierarchy
* interaction discipline
* layout confidence

---

# 3. Color System

## Core Rule

NO gradients anywhere in the interface.

NO glowing effects.

NO neon fintech aesthetics.

---

## Background System

### Primary Background

* #0B0F14

### Surface

* #111827

### Elevated Card Surface

* #161B22

### Hover Surface

* #1C2330

### Border Color

* #2A2F3A

---

## Typography Colors

### Primary Text

* #F9FAFB

### Secondary Text

* #9CA3AF

### Muted Text

* #6B7280

### Disabled Text

* #4B5563

---

## Accent System

Kashlet uses ONE restrained primary accent color.

### Primary Accent

* #4F46E5

Accent color usage should remain minimal and intentional.

Used for:

* primary actions
* focused states
* active navigation indicators
* important highlights

Never flood the interface with accent color.

---

## Status Colors

### Success

* #22C55E

### Warning

* #F59E0B

### Error

* #EF4444

### Info

* #38BDF8

Status colors should only appear:

* inside badges
* validation states
* notifications
* indicators

Never use status colors decoratively.

---

# 4. Typography System

## Font Family

### Headings

* Space Grotesk

### Body

* Plus Jakarta Sans

Typography should prioritize:

* readability
* hierarchy
* spacing consistency
* financial clarity

---

## Typography Scale

### Display

* 32px / 40px
* SemiBold

### H1

* 28px / 36px
* SemiBold

### H2

* 24px / 32px
* SemiBold

### H3

* 20px / 28px
* Medium

### Body Large

* 16px / 24px
* Regular

### Body Medium

* 14px / 20px
* Regular

### Caption

* 12px / 16px
* Regular

### Label

* 12px / 16px
* Medium

---

# 5. Layout System

## Grid Structure

### Desktop

* 12-column grid

### Max Width

* 1440px

### Primary Content Width

* 1200px

---

## Spacing Scale

Use a strict spacing system:

* 4px
* 8px
* 12px
* 16px
* 24px
* 32px
* 48px
* 64px

Spacing consistency is critical across:

* cards
* forms
* tables
* sidebars
* modals
* navigation systems

---

# 6. Navigation System

## Sidebar Navigation

Sidebar behavior:

* fixed on desktop
* collapsible on tablet
* hamburger-triggered on mobile

Sidebar should:

* feel structured
* maintain alignment discipline
* never overlap content areas

Active navigation item:

* subtle accent indicator
* slightly elevated surface
* accent-colored icon and label

---

## Top Navigation

Top navigation includes:

* global search
* quick create invoice CTA
* user avatar dropdown

Top navigation must:

* never overlap sidebar
* remain sticky during scroll
* preserve layout spacing at all breakpoints

---

# 7. Responsive Design Rules

Kashlet is fully responsive.

---

## Desktop

* multi-column layouts
* persistent sidebar
* side-by-side invoice creation layout

---

## Tablet

* collapsible sidebar
* tighter spacing
* adaptive table widths

---

## Mobile

* stacked layouts
* touch-friendly controls
* full-width forms
* hamburger navigation
* horizontally scrollable tables when necessary

---

# 8. Border Radius System

### Small

* 6px

### Medium

* 10px

### Large

* 14px

### Cards

* 12px

Avoid overly rounded “consumer app” styling.

The product should feel structured and professional.

---

# 9. Buttons

## Primary Button

* Height: 40px
* Padding: 12px 16px
* Background: Primary Accent
* Text: White
* Border Radius: 10px

Hover:

* slightly brighter surface only

---

## Secondary Button

* Transparent background
* 1px subtle border

Hover:

* subtle surface elevation

---

## Ghost Button

* No background
* Minimal hover surface

Used for:

* utility actions
* icon actions
* secondary interactions

---

# 10. Form System

## Input Fields

* Height: 40px
* Background: #0F141B
* Border: 1px solid #2A2F3A
* No shadows

Focus state:

* primary accent border
* subtle focus visibility only

---

## Validation Rules

Errors must:

* appear inline
* preserve layout structure
* use muted error styling

Forms should validate:

* on blur
* before submission
* without excessive interruption

---

# 11. Tables (Core Product System)

Tables are central to the Kashlet experience.

Tables should feel:

* dense but readable
* structured
* financially precise

Rules:

* strong alignment
* consistent spacing
* subtle row hover
* minimal separators
* status badge consistency

Avoid:

* oversized padding
* decorative rows
* heavy borders

---

# 12. Card System

Cards should:

* remain flat
* use subtle borders
* avoid shadows
* preserve spacing consistency

Hover behavior:

* slight surface lift only

No floating card aesthetics.

---

# 13. Iconography

Use:

* Lucide icons
* Feather-style icons
* outline icons only

Avoid:

* filled icon systems
* playful iconography
* decorative illustrations

---

# 14. Interaction System

Kashlet follows a strict interaction behavior model.

Every action must provide immediate feedback.

---

## Interaction Timing

* transitions under 200ms
* no slow animations
* no dramatic motion

---

## Loading Behavior

Use:

* skeleton loaders
* layout-preserving placeholders

Never:

* blank screens
* infinite spinners

---

## Success Feedback

Use:

* toast notifications only

Avoid:

* full success pages
* unnecessary celebration UI

---

## Error Handling

Errors should:

* remain contextual
* preserve page layout
* provide retry actions

Critical failures may use modals.

---

# 15. Unified State System

Every major page must support:

* loading state
* empty state
* error state
* success feedback state

These states must remain visually consistent across:

* dashboard
* invoices
* receipts
* clients
* settings

No feature should invent its own state design language.

---

# 16. Data Visualization

Kashlet avoids overly decorative analytics.

Use:

* lightweight charts
* simple bars
* restrained data indicators

Focus:

* readability
* quick scanning
* financial understanding

Avoid:

* dashboard clutter
* unnecessary graph complexity

---

# 17. UX Tone

Kashlet should always feel:

* calm
* fast
* trustworthy
* structured
* modern
* focused

Never:

* playful
* noisy
* corporate-heavy
* flashy
* experimental

The product should feel dependable enough for real financial workflows.
