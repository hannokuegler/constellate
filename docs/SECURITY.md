# Security

Review of 04.10.2026 (branch `security`, based on `integrate`) before the repository goes public. Scope: full git history of all remote branches, the Next.js app in `app/`, the pipeline in `pipeline/`, `tools/board.py`, repo hygiene.

## Threat model

1. The app is a static site plus one serverless route, `POST /api/explain`, which spends our OpenAI key. Main risk: cost abuse, or using the route as a free LLM proxy.
2. From Sun 04.10 11:00 the repository and its full history are public. Anything ever committed is public for good.
3. Data from public sources and curated patient-organisation rows is rendered in the browser. Risk: script injection through URLs or text in the data.
4. Client-sent edges reach the Explain prompt (prompt injection). The answer goes back only to the requester, is rendered as plain text, and every sentence must cite a known edge id. No tools, nothing stored.
5. No login, no user accounts, no database, no personal data in the app. The teamboard is a separate, temporary service.

## What was checked and what was found

| Area | Check | Result |
|---|---|---|
| Secrets in history | All 50 commits on all remote branches, scripted pattern scan of every diff line (OpenAI, ElevenLabs, GitHub, AWS keys, Bearer tokens, key/password assignments, private keys, credentials in URLs, phone numbers, IPs, server paths, tunnel ids, `.env` files) | No key, token, password or private key found. Only `.env.example` templates were ever committed, with empty values. Matches were placeholders, env-variable names, `127.0.0.1` in a comment and the Playwright browser path |
| Personal data in history | e-mail addresses in content and in commit metadata | Content: only public organisation addresses in `data/curated/orgs_draft.csv` and `example.org` test fixtures. Commit metadata: two personal e-mail addresses as author addresses (besides `noreply@anthropic.com`), see open points |
| Internal links | teamboard | The teamboard URL is in several docs and `tools/board.py`. **Correction (second review, 04.10. 09:30):** commit `9a7df9f` put the shared teamboard login in plain text into a `curl` example in the orchestrator prompt; it is removed from `main` and the shared password is changed before the repository goes public, so the old value in the history is void |
| Pipeline keys | `pipeline/openai_config.py`, `pipeline/enrich/` | Keys only from the environment (`.env.local` via dotenv). NCBI key never enters cache keys, stored URLs or error messages. Committed `data/` holds only `MANIFEST.md` and `data/curated/`; caches are gitignored |
| `tools/board.py` | credentials | Only from `TEAMBOARD_USER` / `TEAMBOARD_PASS`; no defaults; exits with a hint when missing |
| `/api/explain` | input validation, size, cost, leaks | Before: no body size limit, client edges passed to the prompt with unbounded fields, `disease` used unchecked in a fetch path, no rate limit, no output token cap. **Fixed**, see below |
| Key leaks | responses, logs, client bundle | The key is only used server-side in the `Authorization` header. Built `.next/static` contains no `OPENAI_*` or other secret env names; the fixture JSON is not bundled when `NEXT_PUBLIC_USE_FIXTURES` is unset |
| XSS | `dangerouslySetInnerHTML`, Markdown, links | One `dangerouslySetInnerHTML`: a static theme script without data. No HTML or Markdown rendering of data (Markdown is only a download). Explain text is rendered as text nodes. All data URLs are `https:` (React 19 also blocks `javascript:` URLs). External links use `rel="noreferrer"` (implies `noopener`) |
| Security headers | CSP, framing, sniffing, referrer | Before: none apart from `poweredByHeader: false`. **Fixed**, see below |
| Dependencies | `npm audit --omit=dev` | 1 high, 1 moderate: `postcss` < 8.5.23 bundled inside `next` 15 (build-time CSS processing; we only process our own CSS, so not reachable by visitors). The fix needs Next 16 |
| Repo hygiene | LICENSE, `.gitignore`, size | MIT `LICENSE` present. `.gitignore` covered `.env.local` variants but not `.env.production` and similar. Largest blob 1.7 MB (`core.json`), packed history 16 MB |

## Measures taken

- `app/next.config.ts`: Content-Security-Policy (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src 'self'` plus the optional `NEXT_PUBLIC_DATA_BASE` origin), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`. `script-src` keeps `'unsafe-inline'` because Next.js injects inline bootstrap scripts; dev mode additionally allows eval and the HMR websocket.
- `app/app/api/explain/route.ts` and `app/lib/ratelimit.ts`: body limit 600 kB (413), at most 60 edges, edge ids must match `e_<hex>`, `disease` must be a MONDO id, client edges are rebuilt with only the fields the prompt uses and every string is length-capped, labels only for ids in the edges, audience at most 80 characters. Rate limit per client IP (default 10 per minute, 429) and an hourly LLM budget per server instance (default 200, then template text). `max_output_tokens` (default 4000) and a 90 s upstream timeout. Upstream error messages are scrubbed of anything key-shaped. All limits can be changed by environment variable (see `app/README.md`).
- `.gitignore`: every `.env.*` except `.env.example`, `*.pem`, `*.key`, logs, `.pytest_cache/`.
- Docs: `docs/ARCHITECTURE.md` brought to the real state (step 08, `validate.py`, shards instead of `graph.json`, no `/api/resolve`, model ids only via env, Playwright E2E, security); `app/README.md` documents the limits and new variables.
- Verified: `npx tsc --noEmit`, `npm run lint` and `npm run e2e` (hero path at 1280 and 375 px, dark mode, no console errors, so no CSP violations) are green; the Explain button was exercised against a local mock of the OpenAI streaming API.

## Second review (04.10.2026, 09:30)

Full history of all 51 remote branches (211 commits) with gitleaks 8.30.1 (`--log-opts=--all`) plus a pattern scan of every blob. One real finding: the teamboard Basic-Auth login in `docs/hackathon-log/prompts/ORCHESTRATOR-STANDING.md` (since `9a7df9f`), now replaced by `$TEAMBOARD_USER:$TEAMBOARD_PASS`; the shared password is changed before the repository goes public. Everything else were false positives (JSON fields named `key`, cache hashes, version numbers that look like IPs, phone numbers in test fixtures). Two local absolute paths in an agent prompt were neutralised. No `.env` file with values was ever committed. Commit author e-mails: see open point 1.

## Open points for Hanno

1. **Commit author e-mails.** Two personal addresses are in the commit metadata and become public with the repo. Changing them needs a history rewrite (not done, not recommended now). Options: accept, or use the GitHub noreply address for future commits (`git config user.email`).
2. **Teamboard.** Its URL is public in docs and history; it is protected only by the shared login. Recommendation: keep the planned shutdown on 11.10., change the shared password once the repo is public.
3. **OpenAI key.** Set a hard monthly budget for the project in the OpenAI dashboard, use a separate key for Vercel, rotate all keys after the hackathon. The in-memory rate limit is per instance and best effort; for a real quota use Vercel Firewall rate limiting or a shared store.
4. **License decision.** `LICENSE` (MIT) covers the code. The exported data in `app/public/data/` is derived from HPO, MONDO, Orphanet and other sources and stays under their licences (README, "Data sources and licenses"; `docs/DATA-SOURCES.md`). Recommendation: one sentence in README or LICENSE saying that MIT applies to the code only and the data keeps the source licences with attribution. Alternative for the code: Apache-2.0 (explicit patent grant). Hanno decides.
5. **postcss advisory** in Next 15: accept until after the hackathon, then upgrade to Next 16.
6. **CSP hardening** (nonce-based `script-src` without `'unsafe-inline'`) needs middleware and dynamic rendering; not worth the risk before the freeze.
7. `docs/RESOURCES.md` still mentions Resolve (`/api/resolve`) and a `pipeline/config.py`; both do not exist. Not changed here.
