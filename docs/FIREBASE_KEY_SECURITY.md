# Firebase web API key: security response

## Scope

The Firebase Web SDK key for project `clozy-6166b` was embedded twice in the tracked `wrangler.jsonc` and detected by GitHub secret scanning. It is a **public client-side Firebase project identifier**, not a Firebase Admin service-account credential. The application intentionally serves the same public configuration through `/api/firebase-config`. Moving this value out of Git is hygiene and reduces incidental disclosure in the source history, **not** a way to make a Firebase Web SDK key secret.

## Remediation implemented

- Production and preview Cloudflare Pages binding `FIREBASE_WEB_CONFIG` migrated to encrypted `secret_text` without changing its value; `FIREBASE_PROJECT_ID` remains plain text.
- Removed literal keys from the tracked Wrangler file and added regression coverage.
- Development-only `.dev.vars*` files are excluded from Git.
- Private alert metadata collector in `soranjiro/clozy-security-alert` writes a scrubbed snapshot (no secret values), and ChatGPT with GitHub repository access can use it to prepare code fixes.

## Provider-side verification still required

1. In [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials?project=clozy-6166b), locate the Firebase Browser key (use the incident's value only in the provider console, not in chat).
2. Restrict that key to **only the Firebase-related APIs needed by this application**. In particular, remove Generative Language API, Maps/Places, and unrelated paid services. Do not assume a restriction exists without checking. Investigate quota/billing anomalies and API usage.
3. Do **not** blindly apply HTTP referrer restrictions: Cloudflare Pages Functions use the key for server-side Identity Toolkit `accounts:lookup` and `accounts:delete` requests. Browser-only restrictions may interrupt those flows. Prefer API restrictions and, if stricter application restrictions are needed, design separate browser and server credentials and test both.
4. For suspected abuse, create a replacement **Firebase-compatible** Web API key and update production, preview and the Firebase app/Hosting email action configuration together. Verify login, account deletion, password reset and email verification before disabling the previous key.
5. Run application CI and verify `/api/firebase-config`, sign-in, cloud backup and previews after deployment; confirm Pages still has `FIREBASE_WEB_CONFIG` bound as a secret.
6. Only after reviewing the real Google Cloud restrictions, resolve the GitHub alert with an accurate explanation. **Do not mark it revoked until the key is actually disabled**, and do not label it a false positive if the key enables additional paid APIs.

The previous key remains in public Git history and has always been accessible to Web SDK users. Rotating/removing repository content alone does not invalidate it.

Firebase documentation: https://firebase.google.com/docs/projects/api-keys
