# Sukoona — concept prototype

A mobile-first concept website for the fictional brand **Sukoona** and its
placeholder product, **Sukoona Gummy**.

This is a design prototype for review. It has no checkout, no payments, no lead
capture and no purchasing links. Every product detail is fictional.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4. No runtime dependencies
beyond React and Next.

## How the theming works

Three visual styles — Soft, Balanced, Bold — swap CSS custom properties. A
`data-style` attribute on the page wrapper selects the token set defined in
`app/globals.css`.

Two separate accent scales exist on purpose:

- `--accent` / `--accent-ink` / `--accent-soft` for the cream page background
- `--stage-accent` / `--stage-accent-ink` / `--stage-accent-soft` inside the
  product section

They are separate because the Bold style puts the product section on a dark
green ground. A single accent cannot stay legible on both a cream page and a
dark card, so components inside the product section use the stage scale.

The style bar changes colour and the illustration only. It never changes a
product detail, a quantity or anything a reader could mistake for a dose.

## Files

| Path | What it does |
| --- | --- |
| `app/globals.css` | Design tokens, the three style blocks, focus and motion rules |
| `app/page.tsx` | Page composition and the shared style state |
| `lib/content.ts` | All copy and placeholder product data |
| `components/ProductStage.tsx` | Flavour switch, pack toggle, live summary |
| `components/StyleBar.tsx` | Draggable style bar plus button alternatives |
| `components/GummyIllustration.tsx` | SVG pack illustration |
| `components/Ingredients.tsx` | Clickable ingredient cards |
| `components/Faq.tsx` | Expandable questions |
| `components/Icons.tsx` | Inline SVG icons |

## Accessibility notes

- Every control is a native button or input with a real ARIA role and state.
- The style bar is a native range input, so it drags with a pointer and moves
  with arrow keys. Three buttons do the same job for anyone who cannot drag.
- Text contrast was measured across all three styles at 375, 768, 1024 and
  1440 px. All text meets WCAG AA.
- Focus rings are visible and take their colour from the active style.
- `prefers-reduced-motion` disables transitions and smooth scrolling.
- Icons are inline SVG. No emoji is used as an icon.
