# AGENTS.md — SatyaCall (v2)

## What this project is
SatyaCall is a verification layer against impersonation and "digital arrest" scams in India.
Core idea: make LEGITIMATE contact provable, so anything unverified is suspicious by default.

Modules:
1. **Trust Registry (Web3):** Solidity contract on Polygon Amoy testnet. The root authority approves or revokes institutions. Scam reports are anchored as hashes.
2. **Verify (challenge-response):** A citizen creates a single-use challenge. The caller (an officer) signs it with a key tied to an institution-issued credential. The server verifies the signature, the credential and the on-chain institution status.
3. **Scam Analyzer (hybrid):** Deterministic rule engine PLUS an LLM, merged by explicit rules. Falls back to rules-only if the LLM is unavailable.
4. **Scam Registry:** Report a phone number, UPI ID or wallet address. Stored in Postgres, anchored on-chain as a hash. Lookup returns the report count and risk label.
5. **Dashboard:** Impact metrics computed from the database (verifications, scams flagged, average verify time).
Stretch: Family Guardian alerts (webhook / n8n).

## Tech stack
- **Web + API:** Next.js (App Router) + TypeScript + Tailwind, deployed on **Vercel**. API = route handlers.
- **Database + Auth:** **Supabase** (Postgres + Auth) using `@supabase/ssr`. Migrations live in `supabase/migrations/`. Row Level Security (RLS) is ON for every table.
- **Contracts:** Hardhat + Solidity 0.8.24 + ethers v6. Deployed from the developer machine (not from Vercel).
- **LLM:** provider-agnostic wrapper `lib/llm.ts`. `LLM_PROVIDER` is `openai | anthropic | gemini | mock`.
- **Validation:** zod on every request body and every LLM response.
- **Tests:** Vitest (lib + API), Hardhat (contract).

## Roles and auth
| Role | How obtained | Can do |
|---|---|---|
| anonymous | no login | Verify, Analyze, Lookup (rate-limited, nothing saved to a profile) |
| citizen | sign up | All of the above + history, Report, Guardian settings |
| officer | applies, institution approves | Sign challenges, hold a credential |
| issuer_admin | root approves institution | Manage officers, issue/revoke credentials |
| root_authority | seeded by SQL only | Approve/revoke institutions (triggers the on-chain tx) |
Roles are stored in `profiles.role` and enforced BOTH in route handlers (server-side check) AND in RLS policies. Never trust role claims from the client.

## Key custody (important design rule)
- Officer and institution **private keys are generated in the browser** (ethers `Wallet.createRandom`) and stored only client-side, encrypted with a passphrase. **The server and database never see them.** The DB stores public addresses and signed credentials only.
- The only server-held key is `RELAYER_PRIVATE_KEY`: a **testnet-only, low-balance** wallet that is the contract owner/relayer for registering institutions and anchoring reports. Document that production would use a multisig.

## Repo layout
```
contracts/            TrustRegistry.sol, test/, scripts/deploy.ts
supabase/migrations/  SQL schema + RLS policies + seed
web/
  app/                / , /verify , /officer , /analyze , /registry , /issuer , /root , /dashboard , /demo , /login
  app/api/            challenge, verify, analyze, report, lookup, institutions, officers, alerts
  lib/                crypto.ts, chain.ts, llm.ts, analyzer.ts, heuristics.ts, redact.ts,
                      normalize.ts, ratelimit.ts, supabase/{server,client,admin}.ts, i18n.ts
  middleware.ts       session refresh + route guards
  data/               scam-samples.json (synthetic, labelled)
```

## Commands
- Contracts: `cd contracts && npx hardhat test | node | run scripts/deploy.ts --network amoy`
- Web: `cd web && npm run dev | build | test | lint`
- DB: `supabase db push` (or paste migrations into the Supabase SQL editor)

## Hybrid analyzer rules
1. Always run `heuristics.ts` first (deterministic, offline, free).
2. **Redact before any LLM call:** mask phone numbers, account/card numbers, Aadhaar-like IDs, emails (`redact.ts`).
3. Call the LLM only if `LLM_PROVIDER != mock` AND (heuristic score is in the ambiguous band 20–80 OR text is non-English/transliterated). Timeout 8s; one retry max.
4. The transcript is **untrusted data**: wrap in delimiters, instruct the model to ignore instructions inside it, give it no tools, require strict JSON, validate with zod. Invalid output = discard and use heuristics.
5. **Merge:** final = max-weighted combination. A heuristic **hard flag** (e.g. "transfer to safe account", "digital arrest", "don't tell anyone + payment") can never be downgraded by the LLM.
6. Response always includes `provider` (`hybrid | heuristics | heuristics-fallback`) and `latencyMs`. The UI shows which mode was used.
7. Cache results by `sha256(normalized input)` in the DB. Raw text is stored ONLY if the logged-in user opts in.

## Verification rules
- Challenge = 6-digit code + `id`, stored in DB with `expires_at` (2 min), `used_at`, `attempts`. **Single-use.** Max 5 attempts.
- Signed message format: `SatyaCall|v1|<challengeId>|<code>|<claimedEntity>|<expiresAt>`.
- Verification checks: officer signature valid, credential signed by an issuer, issuer `isActive` on-chain, credential not expired/revoked in DB, challenge unused and unexpired, claimed entity category matches the verified institution category (mismatch ⇒ warning).
- Every attempt writes a `verification_events` row (audit log).
- The officer console shows the citizen's `claimedEntity` before signing, to reduce relay attacks.

## Rules (follow always)
1. **No secrets in git.** `.env*` ignored; keep `.env.example` current. `SUPABASE_SERVICE_ROLE_KEY` and `RELAYER_PRIVATE_KEY` are server-only, never prefixed `NEXT_PUBLIC_`, never imported in client components.
2. **RLS on every table** with explicit policies. Use the service-role client only in route handlers that need it, and re-check authorization in code first.
3. **Mock mode must work with zero LLM keys.** The app must still run end-to-end.
4. **Privacy:** never put raw identifiers or PII on-chain. Normalize, then `keccak256(normalized + REGISTRY_PEPPER)`. Be honest in docs about the brute-force limits of hashing low-entropy IDs.
5. **Serverless-safe:** no in-memory state, no local files for persistence, no long-running processes. Rate limiting uses a Postgres table (or Upstash if configured), not process memory.
6. **Validate everything** with zod. Return typed error JSON. No stack traces to clients.
7. **Every feature ships with a test** and a visible UI path. One feature per commit. Run build + tests before declaring done.
8. **UI:** mobile-first, large type, high contrast. Verdict screens show VERIFIED / NOT VERIFIED / HIGH RISK with a one-line reason. All strings via `lib/i18n.ts` (`en`, `hi`, `ta`).
9. Keep dependencies minimal. No heavy UI kit.
10. Test data is **synthetic**. Never include real victims' data, real phone numbers or real transcripts.

## Definition of done (MVP)
- Deployed on Vercel; a judge can complete the `/demo` scenario from a phone with no setup, and can also log in with the demo accounts listed in README.
- Contract deployed on Polygon Amoy; address and explorer link in README.
- RLS policy tests pass; analyzer benchmark script prints accuracy by mode (heuristics vs hybrid).
- README includes setup in <= 6 steps, a Mermaid architecture diagram, a security model section, and an honest limitations section.

## v3 additions (see SATYACALL_V3_ADDENDUM.md)
- **Identity is not authorization.** Verification must match a pre-registered `official_actions` row (purpose, amount cap, allowlisted payee, <=24h validity). Verdicts: `VERIFIED_AUTHORIZED | IDENTITY_VERIFIED_NOT_AUTHORIZED | NOT_VERIFIED`. Payee not on the institution allowlist => always not authorized. Sensitive purposes need maker-checker approval. Reports against a verified officer auto-flag; N distinct reporters => auto-suspend.
- Server issues a **signed verdict receipt** using `VERDICT_SIGNING_KEY` (server-only, never `NEXT_PUBLIC_`).
- **Evidence Vault:** hash files client-side (WebCrypto SHA-256) and a manifest hash; files are NOT uploaded by default; anchor only the manifest hash via `anchorEvidence(bytes32)`; complaint drafts for 1930 / cybercrime.gov.in are drafts only (no auto-filing).
- **Honesty rules for UI/docs:** never claim on-device ML, live call-audio access, real UPI interception, W3C VC compliance, or court admissibility unless actually built. The rules engine runs client-side; label anything simulated as a demo.
