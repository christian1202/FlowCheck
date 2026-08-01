---
name: FlowCheck
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-xs:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 24px
  gutter: 16px
  section-padding: 64px
  touch-target: 44px
---

## Brand & Style
The design system is anchored in a high-end, monochromatic aesthetic that prioritizes clarity, speed, and premium utility. The brand personality is authoritative yet quiet, moving away from decorative elements to focus on content and action.

The chosen style is **Minimalist / Modern**, utilizing a stark contrast between pure white surfaces and deep black accents. This creates a "gallery" effect where event data and media become the focal point. The interface feels "snappy" through the use of sharp transitions and a lack of unnecessary ornamentation, evoking the precision of a high-end editorial publication or a professional developer tool.

## Colors
This design system employs a strict monochromatic palette to maintain a premium, focused atmosphere.

- **Primary (#000000):** Used for primary call-to-actions, hero headings, and high-emphasis icons.
- **Secondary (#111827):** Used for secondary interactions and structural text elements.
- **Neutral (#6B7280):** Reserved for supporting metadata, placeholders, and deactivated states.
- **Borders (#E5E7EB):** A light, consistent stroke used to define structure without adding visual noise.

The "Off-white" (#FAFAFA) is used for container backgrounds or section flooding to create subtle depth against the "Pure White" (#FFFFFF) base canvas.

## Typography
The typography utilizes **Geist**, a typeface designed for precision and readability. 

Headings are set with tight letter-spacing (tracking) to create a dense, impactful visual block. For body text, the line height is increased to ensure effortless scanning of event logs and management data. Mobile headlines scale down to maintain readability and prevent awkward line breaks while retaining the signature tight tracking. Labels and small UI elements often use a slightly heavier weight to maintain legibility against the monochromatic background.

## Layout & Spacing
The layout follows a strict 8px/4px rhythm, ensuring mathematical harmony across all components.

- **Grid Model:** A 12-column fluid grid for desktop with 16px gutters. On mobile, this collapses to a single-column layout with 24px side margins.
- **Mobile-First Targets:** All interactive elements (buttons, inputs, checkboxes) must maintain a minimum touch target of 44px to accommodate high-speed event management environments.
- **Generous Padding:** Components utilize internal padding (typically 16px or 24px) to create a breathable, high-end feel.
- **Responsive Reflow:** Content shifts from a vertical stack on mobile to multi-column dashboards on desktop, prioritizing the "scanner" view for live event metrics.

## Elevation & Depth
Depth is created through tonal layering and subtle shadows rather than heavy gradients.

- **Tonal Layers:** The base background is #FFFFFF. Secondary containers use #FAFAFA to sit slightly "behind" or "within" the main layout.
- **Shadows:** A very soft, diffused shadow (`shadow-sm`) is applied to cards and floating elements. Upon hover, this elevates to a slightly more pronounced `shadow-md` to signal interactivity. 
- **Backdrop Blurs:** For modals and overlays, a smooth Gaussian blur is applied to the background with a 10% opacity black tint, maintaining the focus on the foreground without losing the sense of context.

## Shapes
The design system adopts a **Rounded** shape language to soften the starkness of the monochromatic palette.

- **Primary Elements:** Buttons and input fields use a standard `0.5rem` (rounded) radius.
- **Large Containers:** Cards, modals, and major layout blocks use `1.5rem` (rounded-xl) to create a friendly, modern frame for event content.
- **Selection Indicators:** Chips and small badges may utilize a pill-shape (full radius) to distinguish them from actionable buttons.

## Components
- **Buttons:** High-contrast blocks. Primary buttons are solid #000000 with white text. Secondary buttons use a #E5E7EB border with black text. No gradients.
- **Cards:** Rounded-xl containers with #FAFAFA backgrounds or subtle borders. Elevation increases on hover.
- **Input Fields:** Minimalist design with a #E5E7EB bottom border or full outline. Focus states are indicated by a 1px solid black stroke.
- **Chips:** Small, rounded-md elements used for tagging event status (e.g., "Confirmed", "Pending"). Backgrounds are light gray with dark text.
- **Iconography:** Lucide-react icons set to 20px (w-5 h-5). Stroke weights should be consistent (2px) to match the Geist font's medium weight.
- **Interactions:** Use staggered CSS transitions (150ms-300ms) for list items. Overlays should fade in with a 0.95 scale-up effect for a "snappy" feel.