---
name: Sonho de Mulher
description: Vitrine digital feminina — catálogo pessoal, pedido via WhatsApp
colors:
  pure-white: "oklch(1 0 0)"
  ink-black: "oklch(0.145 0 0)"
  charcoal: "oklch(0.205 0 0)"
  off-white: "oklch(0.985 0 0)"
  cloud-gray: "oklch(0.97 0 0)"
  quiet-gray: "oklch(0.556 0 0)"
  petal-border: "oklch(0.922 0 0)"
  focus-ring: "oklch(0.708 0 0)"
  deal-red: "oklch(0.577 0.245 27.325)"
typography:
  headline:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.off-white}"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
  button-primary-hover:
    backgroundColor: "oklch(0.205 0 0 / 80%)"
    textColor: "{colors.off-white}"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
  button-secondary:
    backgroundColor: "{colors.cloud-gray}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
  deal-badge:
    backgroundColor: "{colors.deal-red}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
---

# Design System: Sonho de Mulher

## Overview

**Creative North Star: "A Vitrine da Amiga"**

Sonho de Mulher is a personal storefront — not a marketplace, not an app. The design reflects the warmth of a friend showing you what she loves. The visual system keeps itself out of the way so product photography does the work: a clean white canvas, near-black type, and a single accent color that appears only when there is a deal to announce. Everything else is quiet, confident, and fast to scan on a phone.

Density is deliberately low. Generous touch targets (minimum 44px), a two-column grid on mobile, and short copy keep the experience light. The seller's personality comes through in the WhatsApp message, not in a noisy interface. On admin screens the same principles apply — calm, functional, no decoration that isn't earning its place.

The one exception to restraint is the deal signal: `deal-red` appears on promotional badges and prices, and nowhere else. Its rarity is the message.

**Key Characteristics:**
- Achromatic palette with one warm-red exception, used exclusively for deal signals
- System sans-serif at comfortable reading sizes; no display type
- Flat-by-default surfaces; shadow appears only on card hover
- Minimum 44px tap targets on all interactive elements
- Product image is always the first visual element in a card

## Colors

A single-accent palette: every color is achromatic except `deal-red`, which is reserved entirely for promotional context.

### Primary
- **Charcoal** (`oklch(0.205 0 0)`, ≈ #2e2e2e): Default button background, size-picker selected state, strong interactive affordance. Used where the UI must be decisive.

### Neutral
- **Pure White** (`oklch(1 0 0)`): Page background, card surface. The canvas that lets product photos lead.
- **Ink Black** (`oklch(0.145 0 0)`, ≈ #1c1c1c): Body text, headings, primary foreground. Maximum contrast.
- **Off-White** (`oklch(0.985 0 0)`, ≈ #fafafa): Text on `charcoal` backgrounds; admin sidebar background.
- **Cloud Gray** (`oklch(0.97 0 0)`, ≈ #f5f5f5): Secondary button background, muted surfaces, tab list background. The neutral hover destination.
- **Quiet Gray** (`oklch(0.556 0 0)`, ≈ #737373): Supporting text — descriptions, struck-through original prices, empty-state messages.
- **Petal Border** (`oklch(0.922 0 0)`, ≈ #e5e5e5): Input borders, horizontal rules, card ring at rest. The lightest structural line.
- **Focus Ring** (`oklch(0.708 0 0)`, ≈ #a3a3a3): Keyboard-focus ring (used at 50% opacity). Never used as a fill.

### Secondary
- **Deal Red** (`oklch(0.577 0.245 27.325)`, ≈ #e63946): Promotional badges, promotional price text, destructive actions. This is the only chromatic token in the system.

### Named Rules
**The Deal Signal Rule.** `deal-red` appears on two elements only: the discount percentage badge on a product image, and the promotional price text. If a design places this color anywhere else, it is wrong.

**The Rarity Rule.** Because `charcoal` is the primary interactive color and `deal-red` is the only accent, no third color may be introduced without a product decision. The palette's restraint is structural.

## Typography

**Body/UI Font:** System UI (`var(--font-sans), system-ui, sans-serif`)

No display font is defined; the system inherits the device's default sans-serif. On iOS this is SF Pro; on Android Roboto; on desktop typically Inter or Segoe UI. This is not a gap — it reinforces the "friend's phone" naturalness and eliminates a font-loading cost on the critical mobile path.

**Character:** Functional and warm without personality-weight. The type hierarchy does its job through size and weight contrast, not through expressive faces. The seller's voice lives in the copy, not the letterforms.

### Hierarchy
- **Headline** (700, 1.25rem/20px, line-height 1.3): Product name on detail pages (`<h1>`). Used sparingly — once per screen.
- **Title** (600, 1.125rem/18px, line-height 1.4): Section headers, cart totals, admin panel page titles.
- **Body** (400, 0.875rem/14px, line-height 1.5): Product names in grid cards (line-clamp-2), descriptions, form labels, admin table content. The workhorse size.
- **Label** (500, 0.75rem/12px, line-height 1.4): Discount percentage inside badges (`% OFF`), metadata, secondary annotations.

### Named Rules
**The Single Headline Rule.** Each screen has at most one Headline-weight element. Product list cards use Body weight for names; the product detail page uses Headline for the product name only.

## Layout

The store uses a mobile-first fluid grid:

- **Container**: `max-w-screen` with `mx-auto px-4` (16px side gutters). On detail and cart pages, max-width is constrained to `max-w-2xl` (42rem) to maintain readable line lengths.
- **Product grid**: 2 columns on mobile (`grid-cols-2 gap-3`), 3 columns at `sm` (640px), 4 columns at `lg` (1024px). Gap is 12px throughout.
- **Header**: 56px tall (`h-14`), sticky, `z-40`. Contains store name (left) and cart link (right). Minimal — no secondary navigation.
- **Tap targets**: 44px minimum height on all interactive elements (tabs, size buttons, cart link, action buttons). This is a product requirement, not just accessibility.
- **Spacing rhythm**: 8px base. Common values: 8px (gap within chips/badges), 12px (grid gap, inner card padding at sm), 16px (standard card spacing, container padding), 24px (section separation).

Admin pages use the same container and spacing rhythm. They do not introduce a sidebar layout.

## Elevation & Depth

The system is **flat by default**. Surfaces have no shadow at rest.

Cards signal interactivity with a subtle ring (`ring-1 ring-foreground/10` — a 1px outline at 10% opacity of ink-black) rather than a shadow. This keeps the grid quiet when browsing. On hover, a `shadow-md` (medium box-shadow) lifts the card to confirm it is tappable.

The sticky header does not use a shadow — the `border-b` hairline is the sole separator.

### Named Rules
**The Flat-by-Default Rule.** Shadows are a hover-state reward, not a resting decoration. A card at rest uses only its ring outline. Dialogs and modals are the sole exception — they use an overlay, not elevation.

## Shapes

Corners are gently rounded throughout, never sharp, never fully circular (except pills):

- **Rounded Large** (10px, `--radius-lg`): Buttons, inputs, tab triggers, size-picker buttons. The default interactive shape.
- **Rounded XL** (12px): Cards. Slightly larger than interactive elements to frame them within the card container without visual tension.
- **Pill** (`9999px`): Deal badges only. The pill shape is reserved for short label-type content — discount `% OFF` annotations on product images.
- **Rounded Medium** (8px, `--radius-md`): Small buttons (`sm` size), icon-buttons. Used in admin contexts.

### Named Rules
**The Pill Reserve.** Pill-shaped elements are deal badges and nothing else in the store UI. Admin chip-style elements may use pill shape, but they must never use `deal-red`.

## Components

### Buttons
Tactile and direct. No heavy gradients or shadows; the interaction feedback is the color shift.

- **Shape**: Gently curved (10px radius, `--radius-lg`). Height 32px default (`h-8`), padding 10px horizontal.
- **Primary**: Charcoal background (`oklch(0.205 0 0)`) + off-white text. Hover: 80% opacity charcoal. Used for all primary actions: "Adicionar ao Carrinho", "Fechar Pedido", admin form submits.
- **Secondary**: Cloud-gray background + charcoal text. Hover: slightly darkened via `color-mix`. Used for non-primary actions.
- **Ghost**: Transparent background + ink-black text. Hover: cloud-gray fill. Used for nav-level and supplementary actions.
- **Outline**: Transparent background with petal-border border. Used in data-table toolbars and secondary admin contexts.
- **Focus / Focus-visible**: 3px focus ring at 50% opacity of `focus-ring` token. Keyboard-accessible on all variants.
- **Destructive**: Soft red fill (10% `deal-red`) + `deal-red` text. Does not use a solid red background — only text and a light tint signal danger.

### Deal Badge
The only pill-shaped element in the store UI.

- **Shape**: Pill (border-radius 9999px)
- **Background**: `deal-red` (`oklch(0.577 0.245 27.325)`)
- **Text**: White, label size (0.75rem), bold (700)
- **Placement**: Absolute-positioned top-left (`top-2 left-2`) over the product image at `z-10`
- **Content**: `{N}% OFF` — always a percentage, always uppercase

### Cards / Containers
Product images carry the visual hierarchy; cards are intentionally quiet frames.

- **Corner Style**: Gently curved (12px, rounded-xl)
- **Background**: Pure white
- **Ring**: 1px outline at 10% opacity of ink-black — the resting border
- **Shadow**: None at rest; `shadow-md` on hover with 150ms transition
- **Internal Padding**: 16px standard (`--card-spacing`); card footer uses `bg-muted/50` (cloud-gray at 50% opacity)
- **Image treatment**: First child image fills the card header at `aspect-square` with `object-cover`; top corners clip to match card radius

### Inputs / Fields
Clean stroke style; no filled background.

- **Style**: Transparent background, 1px `petal-border` border, 10px radius
- **Height**: 32px (`h-8`); text 14px on mobile, 14px on desktop
- **Focus**: Border shifts to `focus-ring` token; 3px ring at 50% opacity appears around the element
- **Error state**: Border shifts to `deal-red`; 3px red ring at 20% opacity; `aria-invalid` triggers the treatment automatically
- **Disabled**: 50% opacity + `not-allowed` cursor + light gray fill

### Size Picker (Signature Component)
Custom button grid used on the product detail page to select garment size.

- **Shape**: Square-ish (min 44×44px, `rounded border`)
- **Unselected**: White background, `petal-border` border. Hover: border shifts to charcoal.
- **Selected**: `charcoal` background + off-white text + charcoal border — matches the primary button palette so the selection reads as committed.
- **Grid**: `flex flex-wrap gap-2` — sizes wrap naturally on narrow screens

### Category Filter (Tabs)
Persistent at the top of the product listing. Tabs are the primary navigation for category browsing.

- **Tab List**: `h-auto flex-wrap gap-1` — tabs wrap to a second line on very narrow viewports
- **Trigger**: Minimum 44px height. Default state: ghost-like (no background). Active state: cloud-gray background. The selected tab does not use `charcoal` — it stays in the neutral range.
- **Categories**: Todas, Roupas, Íntimas, Academia

### Navigation
Minimal sticky header: brand name left, cart link right.

- **Height**: 56px
- **Background**: Pure white, sticky, `border-b` hairline separator
- **Brand name**: `font-semibold text-lg` — the only place the store name appears
- **Cart link**: Icon + label, 44px minimum touch target, ghost styling

## Do's and Don'ts

### Do:
- **Do** use `deal-red` exclusively for promotional prices and discount badges. Its scarcity is the signal.
- **Do** keep all interactive elements at 44px minimum height — this is a product requirement, not an accessibility nice-to-have.
- **Do** let product images occupy the top of every card without padding or overlay (except the deal badge).
- **Do** use `quiet-gray` for supporting text that should recede: descriptions, struck-through prices, empty states.
- **Do** use the two-column mobile grid as the default; the jump to three columns at `sm` is meaningful.

### Don't:
- **Don't** use `deal-red` on buttons, links, tab highlights, or any element that isn't explicitly a price or discount marker.
- **Don't** add a third chromatic color without a product decision. The achromatic palette is intentional.
- **Don't** use shadows at rest. `ring-1 ring-foreground/10` is the resting card treatment; shadow is reserved for hover.
- **Don't** introduce display or decorative typography. The system inherits the device font; that informality is on-brand.
- **Don't** shrink tap targets below 44px on any interactive element that appears in the store UI.
