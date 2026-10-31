# Clozy wardrobe UI — design specification

## Intent

Reinterpret the archived `soranjiro/clozy-old` wood-textured closet visual language as a calm, contemporary Japanese wardrobe. This is a **design and usability** refresh; it does not migrate legacy backend data or weaken existing local-only privacy guarantees.

## Visual system

- **Metaphor:** open closet with wood frame, clothes rail, hangers, drawer and shelves; expressed as CSS, not fetched images or external fonts.
- **Colors:** linen canvas `#f8f6f1`, walnut navigation `#352b25`, oak `#725338`, brass highlights, warm white panels `#fffefa`; sage for local-only privacy indicators. Avoid low-contrast pale gray body copy.
- **Hierarchy:** Japanese headings lead. English eyebrow labels provide quiet editorial context; CTAs use clear Japanese verbs.
- **Components:** consistent ≥44px touch targets on key actions, visible keyboard focus, soft 12–16px radii, low-elevation cards, subtle closet rail illustration behind photo placeholders.
- **Asset policy:** no remote fonts, no analytics, no stock photos, no CDN. User-supplied clothing photos continue to be stored only in the browser.

## Responsive navigation

- **Desktop >850px:** left walnut sidebar with six destinations; settings remains in sidebar.
- **Tablet/mobile ≤850px:** five primary tabs at the bottom (home, closet, outfit planning, calendar, insights); settings moves to a labeled icon button in the header; a floating `服を追加` affordance opens the existing editor. Respect device bottom safe areas.
- **Small phone ≤600px:** hero stacks content and closet illustration vertically, garments use two columns, calendar and insights become single-column, dialogs fit the viewport.
- **Narrow phone 320px:** hide only nonessential header badge and preserve access to settings and all workflows.

## Acceptance criteria

1. First visit displays a closet illustration and retains the empty-state call to add clothing.
2. Adding/editing/filtering favorites, outfits, wear history, backups and passkey protection behave as before; no new network requests.
3. All 5 primary mobile destinations and header settings remain reachable; user can add an item from any view.
4. Browser test checks horizontal overflow at 390px and 320px; manual checks should additionally cover 375px, 768px, 1024px, reduced motion and 200% zoom.
5. Contrast, accessible names, focus rings and scrollable filters remain usable in both light and low-brightness conditions.

## Deployment

The repo's workflow currently builds and deploys verified artifacts to **Cloudflare Pages** on merge to `main`. A `vercel.json` configuration exists separately; it does not prove that `clozy.vercel.app` is currently linked to this repo. Verify any Vercel project integration independently before claiming that domain will update.

## Further product design questions

- Do real-device QA on iOS Safari / Android Chrome for keyboard, notch/safe area and native file picker.
- Capture a real clothing photo set for visual regression snapshots without publishing users' private images.
- If a multi-device wardrobe is required, design encrypted sync and server authentication separately from the CSS/UI work.
