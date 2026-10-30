# ADR-002: local-first v1 over cloud auth (accepted)

**Context:** Archived Clozy versions combined login, a custom API, database, and object storage. The new repository is empty. No users or production data require migration.

**Decision:** Ship a complete no-login wardrobe manager with durable IndexedDB and portable backup before introducing remote identity/storage. Prioritize privacy and quick first-use UX. The code is split into DDD-aligned packages to enable an eventual sync adapter.

**Benefits:** No auth/session implementation to harden, no operational secret management, instant onboarding, works with unstable networks, data minimization.

**Costs:** Single-browser data, no cross-device sync, local data not encrypted, browser eviction risk. Make those limitations prominent in Settings. A cloud version needs a new security review, not a transparent change to this model.

**Revisit when:** Real users require shared wardrobes or cross-device synchronization and the product can fund an audited authorization and storage design.
