# Clozy — Mobile Wardrobe Experience / Requirements v3

Date: 2026-10-31
Reference: the eight wardrobe mockups in the product-design conversation.
Scope: front-end experience and interaction only. No destructive data migrations or changes to the account/backup API.

## Product promise
**「クローゼットを開けると、今日の服が見つかる」**.
The application should resemble a cared-for wooden wardrobe, not a marketing dashboard made from unrelated cards. Visual motifs: vertical fluted oak doors, brass handles, a lit rail, drawers, linen backgrounds, thin dividers and well-spaced text. Treat the closet as a useful navigation system, not a decorative splash screen.

## Mobile first viewport (320–430px)
- A compact fixed-height, sticky 64px header with Clozy identity and a clearly labeled settings action.
- Below the header, an almost screen-height wardrobe (`100svh - header - bottom navigation`). Fluted left/right doors meet in the middle; the user sees the brand promise and the `扉を開く` and `下にスクロールして服を見る` controls without horizontal scrolling.
- Five persistent bottom tabs: Home, Closet, Outfit, Calendar, Insights. Settings is reachable from the header; add is reachable as a floating action.
- Correct top/bottom safe areas on phones with notches and home indicators; touch targets ≥44px. For users who have already recorded clothes, do not obscure or replace their stored data.
- Default first-time state shows doors closed. Neither signup nor onboarding gates local usage. Any hero animation may be skipped.

## Natural vertical scrolling
1. While the user scrolls down from the first viewport, the two wooden doors slide outwards proportionally to scroll position, revealing hanging clothes and drawers. **Normal page scrolling never becomes trapped**.
2. Scroll reveals a linen section with a greeting, user's item/wear counts and two clear actions. This section is anchored by `#home-contents`.
3. Below that, a list of recently added clothes and recent wear history. Thumbnail rows and dividing lines replace cards. No artificial loading or AI-flavored animation.
4. Tapping `扉を開く/閉じる` is a separate accessible way to control the door, independent of scroll. Tapping the scroll cue opens the doors and moves to clothing content.
5. With `prefers-reduced-motion: reduce`, scrolling does not animate the doors; the toggle still works instantly. Browser back/forward/navigation and dialog focus must remain normal.

## Screens
- **Home:** tactile first view, a genuinely opening closet, list-centric follow-up content.
- **Closet:** a four-compartment interactive shelf chooses All/Tops/Bottoms/Outerwear, while text search, favorites, seasonal and stored/active filters continue to operate. Search/filter controls remain discoverable when scrolling the list.
- **Outfits:** a wooden hanging rail visualizes the suggested combination with clickable garments; rules-based suggestions and recording controls remain authoritative, and original feature limitations are stated.
- **Calendar:** wood cabinet header and clear selected-day wear count; month navigation and individual wear toggles remain keyboard accessible.
- **Insights:** the same cabinet heading, quiet typography and divider-led rankings and charts.
- **Settings/account:** consistent wood cabinet header. Existing local-only passkey, account, manually triggered Cloudflare backup, restore, export, deletion and privacy statements remain intact.
- **Add/edit:** full-height mobile modal with warm cabinet header, garment/photo rail and a persistent, safe-area-aware save section; input validation and dirty-change confirmation remain intact.
- **Bulk add:** reuse the accessible modal and existing partial-retry behavior; do not erase failed rows.

## A11y and security invariants
- All closet-door illustrations are CSS-only `aria-hidden`; the action controls are actual accessible buttons with dynamic labels and `aria-pressed`.
- Never send users' photos or wardrobe details to an image CDN. No remote fonts or tracking. Keep content-security policy as existing.
- Local storage remains IndexedDB; Cloudflare upload continues to require explicit account authentication and user confirmation.
- No scrolljacking, non-dismissable overlay, misleading sync status, or mandatory personal-data disclosure.
- Supported minimum viewport: 320px width; test at 320, 390, 768 and 1440px.

## PDCA / acceptance checklist
**Plan:** identify the user flows and scroll states above, preserve all existing automated e2e flows.
**Do:** implement the CSS cabinet/doors, tactile shelf filter, page hierarchy and register/edit layout.
**Check:** CI typecheck, unit tests, build, browser e2e, mobile width and scroll-state assertions, Cloudflare preview API lifecycle and CodeQL.
**Act:** inspect failing checks, correct real issues, rerun all checks, merge only if clean. Verify production deployment SHA, Cloudflare Pages status and site response.
Further work after this iteration: actual iOS/Android device QA for visual keyboard, real photo quality, WCAG contrast and motion. Avoid claiming tests not actually run.
