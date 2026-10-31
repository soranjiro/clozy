# Clozy autonomous improvement plan

## Authorization and boundaries

The user explicitly requested autonomous **editing** and production publication, not only a watcher. Run at most five wall-clock hours, maximum 20 improvement cycles, through the already-authenticated Pi model. Do not switch providers, buy credits, bypass quotas, start nested agents, enable billing, create Firebase/cloud projects, or add third-party runtime services. Existing AI usage allowance is consumed; it is not unlimited/free compute. Stop on an agent error or usage limit; do not retry through alternate credentials.

`scripts/autopilot.mjs` creates an independent Git worktree and local branch, preserving the operator's checkout. Each cycle:

1. Pi reads this plan and implements one meaningful, testable improvement.
2. The controller rejects files outside the authorized source/docs paths, symlinks, history changes, and obvious secret patterns. These checks are **not** a full security audit or sandbox.
3. Independently run diff checks, typecheck, unit tests, build, browser smoke tests, and dependency audit.
4. Refuse publication if production `main` changed concurrently. Never force-push/rebase/reset.
5. Commit, push fast-forward to `main`, and wait for GitHub CI and Cloudflare deployment to succeed before the next cycle.
6. Preserve the worktree/logs and stop on any failure, deadline, signal, or no meaningful work remaining. A deployment already triggered can finish after stopping. There is no automated destructive rollback.

The worker is a local process with the current OS user's privileges, **not a sandbox**. Pi's disabled extensions/MCP and editing instructions are not an OS permission boundary. Logs/sessions are outside the public repository, under a private `clozy-autopilot-*` directory in the OS temporary directory. No wardrobe, photos, account secrets or production browser profiles are needed. Sleep or termination can interrupt automation. A stale `.git/clozy-autopilot.lock` must only be removed after checking its PID.

### Run / observe / stop

```bash
npm run improve:auto -- --publish --hours 5 --max-cycles 20 --provider PROVIDER --model MODEL
```

Use the same authenticated provider/model as the current session. The start message and `.git/clozy-autopilot.lock` give the PID, runtime directory and deadline. Runtime `status.json` records the current phase, published count and last result. `agent-N.log` and private sessions record editing; `verify-N.log` records checks; `deploy-SHA.log` records CI/deployment. Stop with `kill PID` or Ctrl+C. The worktree is kept for inspection; do not delete it while running.

The operator's original checkout is **not** updated by autonomous publication. After the loop stops, inspect its status and use `git fetch origin && git pull --ff-only` only with a clean checkout. Do not run multiple publishers concurrently.

## Baseline already implemented (2026-10-31)

- [x] Optional local ES256 passkey app lock, explicit/background/reload lock; cryptographic negative tests. This is **not** server authentication or storage encryption.
- [x] Multi-photo / multi-name registration with review, per-row success/error, retry without re-adding successful rows, duplicate-name warning, photo compression.
- [x] Season metadata and storage status, wardrobe filters; older backups remain readable with all-season defaults.
- [x] Local season-aware outfit candidates, optional outerwear, alternate combination, missing categories and atomic outfit wear recording.
- [x] Untouched/archived garments, purchase totals and cost-per-wear insights; unknown prices and zero wears are handled explicitly.
- [x] HTTPS product URLs and ZOZOTOWN search links, with external-navigation/privacy disclosure. No account connection, purchase-history synchronization, scraping or automatic product extraction.
- [x] Normalized multi-term search, sorting/reset, calendar search/today, unsaved-edit guards, multiline notes, recoverable load error, backup integrity/size validation.
- [x] Chromium smoke: bulk names/photos with corrupt-photo partial retry → edit metadata → record outfit → check costs → archive/filter → missing-category search → virtual WebAuthn register/lock/unlock/reload → 390px mobile layout, no page errors.
- [x] Initial verification: 32 unit tests, typecheck, build, browser smoke; dependency audit found zero vulnerabilities. OS/browser real passkey testing remains separate from Chromium's virtual authenticator.

## Prioritized next improvements

Choose one coherent unit per cycle, keep existing critical button labels/flows compatible with the immutable browser smoke gate, add regression tests, and record evidence below. Prefer useful behavior over cosmetic churn or unnecessary refactors. Tick only items actually implemented, with limitations.

- [ ] Bulk seasonal storage management: deliberate selection, clear current filter scope, single atomic update, no accidental deletion; make reversal easy.
- [ ] Faster individual registration: category/name templates, duplicate an existing garment, save-and-add-another; retain accurate photos/metadata and protect unsaved edits.
- [ ] Outfit control: let users keep/replace one candidate and see last-worn/wear counts, without silently changing already logged outfits. Do not claim AI color/TPO/weather understanding.
- [ ] User-defined wardrobe goals / checklist: compare desired counts to current seasonal garments, count stored alternatives, avoid claiming everyone needs a fixed wardrobe or encouraging unnecessary purchases.
- [ ] Shopping wishlist / compare-before-buying: user-entered HTTPS links and notes, detect possible duplicates by normalized names/brands/category; never fetch authenticated purchase history.
- [ ] Insights date-range filters, garment utilization and last-worn information; distinguish zero records, future planned dates, stored garments and genuinely missing data.
- [ ] Calendar ergonomics: large wardrobes, repeat an explicitly chosen previous outfit without duplicate records, distinguish future plans from past wear history.
- [ ] Navigation persistence and browser back/forward; preserve sensible filter/search state without putting private item names/notes into shareable URLs.
- [ ] Registration photo edges: unsupported/oversized/corrupt/transparent photos, processing cancellation and partial failures; useful Japanese guidance. Never upload images to an AI service.
- [ ] Usability/accessibility pass at 320px, 390px and desktop: focus, keyboard, long labels, reduced motion, screen reader statuses, contrast, touch targets.
- [ ] Backup/restore guidance and migration tests for every newly introduced optional field/entity. Never silently drop metadata during editing, export or import.
- [ ] Research and document credible next integration options with official references and current limitations, not fabricated capabilities; no project creation or billing activation.

## Research notes (2026-10-31)

### ZOZO

Official service overview checked: <https://corp.zozo.com/service/>. It links to ZOZOTOWN, WEAR and business services. In the material checked, no verified public individual purchase-history API specification or authorization path was established. This is **not proof that no partner API exists**. Implementation therefore deliberately uses user-saved product links and explicit external search. Full integration requires verifying official documentation, permissions, authentication, allowed data use and terms. Do not request a user's ZOZO password or session cookies. No scraping or private endpoints.

### Firebase / cloud authentication

Official references checked:

- <https://firebase.google.com/docs/auth/web/custom-auth>
- <https://firebase.google.com/pricing>

Firebase custom authentication can bridge a trusted identity system via server-issued custom tokens; merely adding the web SDK does not turn a client-only passkey check into authoritative authentication. Cross-device cloud sync would require server-side WebAuthn verification (challenge TTL/replay prevention, RP/origin binding, UV verification), account/key lifecycle/recovery, authorization rules, data migration and service-specific quota/cost checks. Pricing/free allowances can change. No Firebase project, storage bucket, billing account or new cloud service has been created. The existing local-first features avoid operational service charges; account sync remains a separate, reviewed design decision.

## Cycle evidence

Append concise entries: implemented behavior, files/compatibility considerations, tests actually run and remaining limitations. Do not include secrets, session IDs containing credentials, personal data or claims that a deployment happened before the controller confirms it.
