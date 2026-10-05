# SatyaCall v3 Addendum: Rogue Officer Defense + Prove / Protect / Preserve

> **Timeline correction:** today is **Sat 3 Oct**, so you have about **2 days** (3, 4, 5 Oct), not the 4-day schedule in the playbook. Use the schedule in section 5 below.

## 1. Pitch frame
**Prove** (is this caller real and authorized?) → **Protect** (detect pressure, alert family, add friction) → **Preserve** (tamper-evident evidence + ready-to-file complaint).
One product, three moments: before, during, after the scam.

---

## 2. The rogue-officer problem (design)

**Principle: verified identity is not the same as authorized action.** A real officer's credential proves *who* they are, never that *this request* is legitimate.

### Intent-bound verification
1. **Before contacting a citizen**, the officer creates an **Official Action** on the portal:
   `actionId, purpose (enum), caseRef, validUntil (<= 24h), paymentAllowed (default false), payee + amountCap (only from the institution's registered payee allowlist)`.
2. **Sensitive purposes need maker-checker:** a second officer or the issuer admin must approve (demonstrates insider control).
3. **Citizen verify screen** collects what the caller is asking: purpose, amount, payee (UPI/account).
4. The officer's signature covers `challengeId|code|actionId`. The server compares the citizen's reported request with the registered Action.
5. Outcomes:
   - **VERIFIED + AUTHORIZED**: identity valid and request matches an approved action.
   - **IDENTITY VERIFIED, REQUEST NOT AUTHORIZED**: this is your "cryptographic NO". Treat as a scam.
   - **NOT VERIFIED**.
6. The server returns a **signed verdict receipt** (hash of facts + verdict + time, signed with `VERDICT_SIGNING_KEY`). The receipt goes into the citizen's Evidence Vault.

**Hard rule:** payments to any payee not on the institution's registered allowlist are always NO. Individual/personal accounts are never allowlisted.

### Accountability layer (deters insiders)
- **Non-repudiation:** every signature ties to a named officer; the receipt is evidence against them.
- A citizen report against a *verified* officer **auto-flags** the credential; N distinct reports ⇒ auto-suspend pending issuer/root review.
- Short credential expiry, per-officer challenge rate limits, anomaly flag (many challenges for unrelated citizens).
- Action log hash anchored on-chain (optional, if time).

### About your "proof upload" idea
Keep it, but reframe it honestly:
- **Institutional attestation is the real trust source:** root verifies the *institution* offline; the issuer admin vouches for the officer.
- Officer ID upload = **manual review by the issuer admin** (private storage, minimal data, deletable). Don't claim automated document verification; forged documents are the obvious attack.
- The portal **cannot hear the call**, so "match what he told the customer" works only through **pre-declared Actions + the citizen entering the caller's claims**, as above.

### Residual risk (say this out loud to judges)
A determined insider can still pick a registered purpose that fits their lie and apply pressure without payment. We reduce it with maker-checker, payee allowlists, non-repudiation and auto-suspension, but we do not claim to eliminate insider abuse.

---

## 3. Layer 2 (on-device detection, Guardian, Evidence Vault): verdict

**Good idea. Keep it, but scope it.** Honest feasibility:

| Component | Feasible by 5 Oct? | What to build / claim |
|---|---|---|
| Client-side detection | Partly | Run the **rules engine in the browser** (no upload). LLM path optional with redaction. Say "on-device-first"; **don't** claim an on-device multilingual ML model unless built. |
| Live call monitoring | **No** | Stock iOS/Android don't let apps read call audio. Browser speech recognition may use cloud processing, so don't call it "on-device". Honest answer: user-initiated paste/dictate now; Android app or telecom/dialer integration is the roadmap. |
| Family Guardian | Yes | Webhook/Telegram alert + `alerts` log + simulate button. |
| 60-second cooling-off before UPI | Demo only | `/upi-guard` simulation (amount/payee check → countdown + guardian ping + prompts). Real interception needs UPI-app/bank integration. |
| Evidence Vault | **Yes, high value** | See below. |
| Auto-complaint | Yes (draft only) | Generate a structured draft for **1930 / cybercrime.gov.in**. No auto-filing (no public API). |

### Evidence Vault spec
- Items: screenshots, transcript, call metadata (entered/shared), analyzer result, **verdict receipts**.
- **Client-side SHA-256** (WebCrypto) per item + a manifest hash. Files are **not uploaded by default**; optional upload to a private Supabase bucket with RLS.
- Anchor the **manifest hash** on Polygon via the relayer (`anchorEvidence(bytes32)`; the block timestamp is the independent timestamp). Store the tx in `evidence_cases`.
- `/evidence/verify`: drop a file → recompute hash → "unchanged since <timestamp>".
- Complaint draft: timeline, suspect identifiers, amount, transaction refs, evidence hashes, anchor tx, filing instructions. Template-based with optional LLM polish; works with no LLM.
- **Honest limits:** anchoring proves a file existed unchanged at a time, **not** that its content is true; legal admissibility of electronic records needs proper certification (check the Bharatiya Sakshya Adhiniyam, 2023 provisions with a legal advisor).

---

## 4. New Codex prompts (add after Prompt 5)

### Prompt A: Intent-bound verification
```
Extend the verification flow per SATYACALL_V3_ADDENDUM.md section 2. Add tables `official_actions` (id, officer_id, institution_id, purpose, case_ref, payment_allowed, payee, amount_cap, valid_until, status, approved_by) and `institution_payees` (allowlist) with RLS. Build /officer "Create Official Action" (maker-checker approval for sensitive purposes by issuer_admin). Update the challenge flow: the citizen enters purpose/amount/payee; the officer signs `challengeId|code|actionId`; /api/verify returns one of VERIFIED_AUTHORIZED, IDENTITY_VERIFIED_NOT_AUTHORIZED, NOT_VERIFIED with a reason, and a signed verdict receipt (VERDICT_SIGNING_KEY, server-only). Payee not in allowlist => always NOT_AUTHORIZED. Add: report-against-verified-officer auto-flag and auto-suspend after N distinct reporters. Tests: mismatched amount, payee off-allowlist, expired action, unapproved sensitive action, suspended officer, receipt signature verifies.
```

### Prompt B: Evidence Vault + complaint draft
```
Build the Evidence Vault per the addendum section 3. Add `evidence_cases` and `evidence_items` tables (hashes + metadata only, RLS own-rows). Client-side WebCrypto SHA-256 per item and a manifest hash. Add `anchorEvidence(bytes32)` to TrustRegistry.sol (event with block timestamp) + tests; relayer anchors; store tx. Pages: /vault (create case, add screenshots/transcript/call metadata/verdict receipts/analyzer results, anchor), /evidence/verify (drop a file, recompute hash, compare to the anchored manifest), and "Generate complaint draft" producing a printable/PDF-able draft for 1930 and cybercrime.gov.in with filing instructions; template-based, optional LLM polish, no auto-filing. Raw files never leave the browser unless the user opts in. Tests: manifest determinism, tamper detection.
```

### Prompt C: Client-side detection + UPI guard demo
```
Make lib/heuristics.ts importable in the browser and run /analyze's rules path fully client-side (no network). The LLM path stays optional and server-side with redaction. Add a "Live Assist" page: paste or dictate text; label clearly if browser speech recognition may use cloud processing. Add /upi-guard: a SIMULATED UPI payment screen (payee + amount). If amount >= threshold, payee is in the scam registry, or the latest analyzer risk is HIGH, show a 60-second cooling-off countdown with prompts ("Is someone on a call telling you to do this?"), trigger a Guardian alert, and let the user cancel or continue (log the choice). Label it a demo of the UX; real interception requires UPI-app/bank integration.
```

---

## 5. Revised 2-day plan (3, 4, 5 Oct)

| When | Work |
|---|---|
| **Sat 3 Oct (today)** | Prompts 1–5: scaffold + **Vercel deploy now**, Supabase schema/RLS/auth, contract on Amoy, challenge-response working. **One teammate starts the PPT in parallel.** |
| **Sun 4 Oct** | Prompt A (intent-bound), analyzer (rules + optional LLM), registry, Prompt B (vault + complaint), Guardian simulate, demo page. Record backup demo video. |
| **Mon 5 Oct** | Hardening, README, final PPT, smoke test the deployed URL, submit **early**. No new features. |

### Cut order (be ruthless)
Prompt C (UPI guard, live assist) → n8n → Tamil/Hindi beyond key screens → dashboard → Google login → LLM merge polish (keep rules + simple LLM call).
**Never cut:** auth + RLS, contract, challenge-response with intent check, analyzer with fallback, Evidence Vault anchoring + complaint draft, `/demo`.
If you're only 1–2 people, drop Prompt C and the dashboard from the start and present them as roadmap.

---

## 6. Add to your judge Q&A

**"What if a verified officer is the scammer?"**
Identity isn't authorization. Every request must match a pre-registered Official Action; payments only go to institution-allowlisted payees; sensitive actions need a second approver; signatures are non-repudiable and anchored; reports auto-flag or suspend the officer. Residual insider risk remains, and we say so.

**"How does your app hear a phone call?"**
It doesn't, by design. Mobile OSes restrict call-audio access. Today the user pastes or dictates; the rules engine runs in the browser. Real-time protection needs an Android app or a telecom/dialer partnership, which is the roadmap.

**"Is your detection really on-device?"**
The rules path runs client-side with no upload. An on-device multilingual ML model is the next step, and we haven't built it. (Don't claim otherwise.)

**"Does anchoring evidence make it admissible in court?"**
No. It proves integrity and time, not truth or admissibility. Formal certification of electronic records is still required, and we'd validate this with legal experts.

**"Can you really stop a UPI transfer?"**
Not from outside the payment app. The cooling-off is a UX demo. Production needs UPI-app or bank SDK integration.

**"Why not auto-file the complaint?"**
There's no public filing API we can rely on; we produce a complete draft and instructions, which removes the main friction (a victim under stress, losing details and time).
