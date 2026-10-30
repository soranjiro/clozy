# Clozy v1 — Requirements (2026-10-31)

## Product
A Japanese-first, responsive personal wardrobe. Users manage clothing, record what they wore on a date, and understand usage without an account. Legacy feature mapping: clothes CRUD/search, wear calendar, statistics. The retired auth/server/R2 implementation is **not** imported.

## Personas / jobs
- A person registering clothing with a photo and optional metadata.
- A person finding an item quickly on mobile, including with one hand.
- A person recording outfits by date and viewing past use.
- A privacy-conscious user who needs to export and restore all data.

## v1 In scope
1. Create, list, search, category-filter, favorite, edit and delete clothing; metadata: name (required), category, color, brand, size, notes, optional processed photo.
2. Record/unrecord a piece worn on a local calendar date; show daily history and wear count.
3. Dashboard: number of clothes, favorites, wear logs, most worn.
4. Persistent local IndexedDB. Export JSON backup including photos; validate and restore a backup with a destructive confirmation.
5. Responsive mobile/desktop UI; keyboard operable, visible focus, labels, status/error states, no hover-only primary actions.
6. Dark/light-independent high contrast and reduced-motion support.

## v1 out of scope / explicit tradeoffs
- Accounts, remote database, cross-device sync, sharing, AI recognition, shopping links.
- Server-side encryption and auth are **not claimed**. IndexedDB and exported JSON are **not encrypted**; anyone with access to this browser profile or backup file may access the data.
- The product operates offline **after assets are cached by the browser**; no installable PWA or guaranteed offline first visit.
- Local storage may be removed by the browser, private browsing, or site data clearing. Encourage regular exports.

## Acceptance criteria
- With no backend or credentials, `npm install && npm run dev` launches the web app.
- Newly created items persist after reload; edits, delete, favorite, search/filter work.
- Recorded date appears in calendar and stats; removing a garment also removes related wear entries.
- JPEG/PNG/WebP photos are decoded, re-encoded to strip metadata and capped to a safe resolution; SVG rejected, input size capped.
- Malformed backup cannot delete existing data. Valid backup can be restored only after explicit user confirmation.
- All user-entered text is escaped by React; no raw HTML, untrusted URL navigation or third-party scripts.
- `npm run typecheck && npm test && npm run build` succeed in CI.
- A backend failure cannot occur in v1 because the app makes no backend requests.

## Quality targets
- WCAG 2.2 AA-oriented semantics, responsive to 320px, 44px primary touch targets.
- No external web-fonts or analytics; static deployment with security headers.
- Domain invariants and backup validation unit tests.
- Persist only after successful validation. Clearly display storage/quota failures.
