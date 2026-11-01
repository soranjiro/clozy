# Clozy — Real-data wardrobe journeys, 2026-11-01

## Evidence and boundaries
- Inspected the production Cloudflare R2 **private backup** in aggregate only. Its v1 snapshot has **26 garments**, **99 wear entries**: outerwear 9, tops 9, bottoms 6, shoes 2. Those are backup counts, not proof that the current browser has synced them.
- The current UI obtains garments and images from local IndexedDB, not real-time D1 rows. D1 stores Firebase account/backup metadata. R2 holds snapshots and migrated assets. A backup cannot be treated as a live query endpoint.
- Verify the current logged-in user's browser has restored the intended private backup before comparing user-visible thumbnails. Do not copy real photos or account identifiers into public fixtures or GitHub issues.
- QA synthetic fixture: 26 garments matching the above category distribution and 99 wear entries across 30 days. Test snapshots for 0, 1, 26, 200 and 2000 items.

## Mental model: movement through a physical wardrobe
1. **Enter**: default home is the closet. No fixed tab bar or dashboard cards. A small brass knob opens an accessible wayfinder for non-spatial destinations.
2. **Find**: categories are real furniture compartments with photo previews and exact counts from the active device's items. Top/outer/bottom categories are on the rail; shoes/bags/accessories use a shelf treatment. Category buttons use real text and accessible names, not gesture-only controls.
3. **Take**: horizontal native scrolling shifts hangers. Tap the centered garment to inspect it. From that inspection, mark `今日着た` directly; a second tap undoes an accidental record. Preserves compare/edit/favorite.
4. **Add**: plus in the wardrobe and the wayfinder opens the same photo editor; multiple additions retain the existing bulk modal. Current URL field records provenance but **does not yet import product data**.
5. **Coordinate**: the passage from the closet opens the existing outfit planner. The planner currently uses deterministic rules; no AI/color/TPO inference should be claimed.
6. **Remember**: the passage opens the wear calendar, where multiple garments can be recorded and previous days edited. Analytics and settings live in the wayfinder.

## Interaction principles
- No mandatory introductory door animation, bottom app tabs, overlapping floating action button, or sticky top header.
- Native vertical page scroll and horizontal rail scroll; do not hijack touch direction. A downward gesture on the hanger area can reveal the existing folded drawer.
- Keep item names visible, unlike a decorative image-only browsing carousel.
- Avoid motion in `prefers-reduced-motion`; all actions require obvious buttons and keyboard focus. Menus have Escape dismissal and outside-click dismissal.
- On 320px viewport, ensure menu + cabinet controls do not overlap; on 390/768/1440, verify text and image display.

## Product/purchase import (planned, not implemented)
- From a supported ecommerce Share action or user-pasted product URL, create a **draft** with name/brand/color/category/price/product URL and source photo.
- Product metadata retrieval is backend-only, domain-allowlisted, URL-protocol validated, bounded, redirected-host revalidated and protected against SSRF. Respect publisher rights and terms; no credential scraping.
- Image preprocessing should strip EXIF, rotate correctly, segment the garment (when user opts in), crop/pad without stretching, use a uniform neutral background and front-facing product photo when available. Preserve original image only with user consent and private access; clearly label AI-edited images.
- Inspect and edit the draft, avoid duplicates using product URL/hash and user confirmation, only then publish as a garment. Purchase does not imply that a garment was delivered/worn.

## ChatGPT project integration (planned, not implemented)
**Desired supported user journey:**
1. Open a dedicated **Clozy project in ChatGPT**, attach an outfit/photo and write a prompt. While composing, it remains an unsent ChatGPT draft.
2. Send the message. A user-connected **Clozy plugin (MCP server)** reads authorized wardrobe data and produces a proposed outfit, garment draft, or image-edit proposal. Every write must remain in a Clozy draft record.
3. The ChatGPT response shows a preview and an explicit "Save to Clozy" / "Record worn" action. Confirmed saves have idempotency keys and scoped audit records. Image generations require explicit consent, review and provenance.
4. The phone can access that ChatGPT project in its own app. Projects allow connected apps in project conversations, but **Clozy cannot programmatically push a composed message + arbitrary image into a specific project** via a supported public project-targeting API. Do not promise that a web share sheet or deep link always targets the project.

**Prerequisite architecture:**
- Firebase Auth for account identity; separate OAuth consent for the ChatGPT plugin, user-scoped capabilities, short-lived tokens, no secrets in browser.
- Make D1 the per-item source of truth (`garments`, `wear_events`, `outfit_drafts`, `image_jobs`, `sync_ops`); use private R2 images with signed short-lived delivery. Migrate v1 snapshots without deleting a recoverable backup, with concurrency/duplicate protection and opt-in.
- Expose typed tools: `list_garments`, `get_garment`, `suggest_outfit`, `create_garment_draft`, `create_outfit_draft`, `update_draft`, `commit_draft`, `record_wear`. Keep image editing explicit and async-job-safe.
- Never give a generic ChatGPT session access to private wardrobes without an account-scoped OAuth grant.
- Initial fallback: user opens the Clozy ChatGPT project directly and selects image+prompt; after server sync, app integration becomes possible.

## Acceptance and test matrix
- Empty closet → a clear first-item action; filtered-empty state can reset filters.
- 26-item representative fixture → category counts 9/9/6/2 and correct selected category; shelf mode for shoes; images and placeholders fit without distortion.
- Inspect a real garment → record today and undo; repeat cannot create duplicate wear entries. Calendar still supports past dates.
- Register 20 mixed photos/names → preserve error retry and no duplicate writes.
- Every original destination reachable in <=2 taps from any view through the wayfinder; closet passages open planner/calendar/insights directly.
- No bottom `.mobile-nav`; no horizontal document overflow at 320/390px, keyboard Escape, accessible labels and reduced motion.
- Original data remains local until the user deliberately enables cloud features; never infer cloud sync from backups.
