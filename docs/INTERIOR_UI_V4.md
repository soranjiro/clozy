# Clozy / Interior UI — implementation contract

Updated: 2026-10-31

## Visual foundation
Source: the four boards provided in the conversation (closed/open walnut wardrobe; clothing gallery and outfit; monthly/weekly calendar and category analysis; registration, storage and settings).

- **Concept:** a private, lived-in dressing room. The wardrobe and garment photos are the main visual vocabulary, rather than colorful dashboards or prose-heavy cards.
- **Palette:** walnut #503521, oak #93633e, brass #c69e6a, linen #faf7f1, near-black #32271f. No purple gradients or decorative AI motifs.
- **Typography:** native Japanese system sans; single size hierarchy. Restrict the Latin display style to the Clozy wordmark; avoid a mixture of Japanese Mincho headings and decorative English microcopy.
- **Navigation:** five bottom destinations on mobile — Home, Closet, Outfit, Calendar, Settings. Analysis remains accessible from Home and desktop navigation. At least 44px action targets.
- **Garments:** photo-first browsing. When no photo exists, use recognizable SVG silhouette per category (not a generic hanger), with gently shaded fabric and quiet thumbnails.
- **Density:** use a visual item gallery, clean text labels and icon-led controls. Descriptive copy only when it prevents data loss or misunderstanding (backup, authentication, destructive operations).

## Key screens
1. **Home:** closed oak doors and handles in the first viewport. Scroll/tap opens the wardrobe; beneath it, see today's outfit entry, wear count, clothes gallery and recent wear history.
2. **Closet:** an illuminated hanging rail; selectable 8 category icons; searchable, favorite-filterable photo grid; user-controlled seasons, archived filters and sort.
3. **Outfit:** a tangible hanging rail showing the selected garments' *actual uploaded images* or silhouettes, and actions to rotate/record a combination. Not a weather or fashion AI claim.
4. **Calendar:** month/week/list modes, compact worn-item image previews and selected date toggles. No weather data until a verified weather provider is integrated.
5. **Analysis:** proportion ring and swatch legend, factual wear rankings and pricing analysis based only on stored records.
6. **Add/Edit:** cabinet-style photo alcove, large category pictograms, clear four-season icons, essential named inputs and persistent save. Keep image privacy, optional fields, all validation and destructive confirmations.
7. **Settings:** icon-led navigation to account, manual Cloudflare backup, passkey lock, export/import and local data. Never display fictional sync capacity, weather or unimplemented controls.

## Interaction and accessibility
- The two wardrobe doors continue to respond to manual button activation and natural scrolling. Do not trap scroll. Respect reduced-motion preferences.
- Category selection uses actual buttons with `aria-pressed`, season picker uses multi-select buttons, and native select remains available to assistive technology.
- Fixed navigation respects safe areas. Phone layouts are tested at 320px/390px; small phone garment grid uses 2–3 columns according to width. No horizontal document overflow.
- Backups still require explicit confirmation and remain manual; photos stay on the originating browser until the user chooses to upload a backup.
- Native browser focus, keyboard shortcuts, `dialog` focus handling and test-accessible labels remain important even if most help copy is shortened.

## QA/PDCA
- Plan: compare UI hierarchy to the reference boards and list retained flows.
- Do: implement consistent surfaces, visuals, pictograms and working calendar modes.
- Check: GitHub Actions TypeScript, unit tests, browser smoke (including photo-less items, calendar display modes, passkey, archive and image corruption retries), preview API lifecycle and CodeQL.
- Act: fix failures, rerun, merge into main and verify Cloudflare production deployment. Real iOS/Android visual testing remains separate from automated Chromium checks.
