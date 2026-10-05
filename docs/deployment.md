# Production deployment runbook

Operator instructions, not a record of a completed deployment. Replace `<PLACEHOLDERS>`. PowerShell commands start at the repository root. Confirmed hosting: **Vercel Pro with Fluid Compute enabled**.

Vercel's **Production** tier can host an isolated synthetic judging deployment. Public demo accounts, especially the root account, must not be seeded into a real-user database. For Production and Preview, use separate Supabase projects, registries, relayers and peppers; configure the matching values in both Vercel scopes.

## 1. Prepare dependencies and secrets

Use Node.js 24 and npm:

```powershell
node --version
npm --prefix contracts ci
npm --prefix web ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
```

Generate two operator wallets and two peppers without printing secrets. The following refuses to overwrite `.env.generated`; institution/officer wallets are generated later **in the browser**.

```powershell
Push-Location web
node -e "const {Wallet}=require('ethers'); const {randomBytes}=require('node:crypto'); const {writeFileSync}=require('node:fs'); const r=Wallet.createRandom(),v=Wallet.createRandom(); writeFileSync('../.env.generated',['RELAYER_PRIVATE_KEY='+r.privateKey,'VERDICT_SIGNING_KEY='+v.privateKey,'NEXT_PUBLIC_VERDICT_SIGNER_ADDRESS='+v.address,'REGISTRY_PEPPER='+randomBytes(32).toString('hex'),'RATE_LIMIT_PEPPER='+randomBytes(32).toString('hex'),''].join('\n'),{flag:'wx',mode:0o600}); console.log('Wrote ignored .env.generated; no secrets printed.');"
Pop-Location
```

Copy entries from `.env.generated` into root `.env` using your editor and keep a protected backup. `.env*` is ignored by Git, but Windows file mode is not an ACL guarantee and this workspace may be cloud-synchronized. Keep real operator secrets outside shared/synchronized folders. The relayer must be **testnet-only, low balance**, and must own its registry. Peppers remain stable per DB/registry; changing them invalidates old report hashes.

## 2. Supabase migrations and your root account

Select/create the target Supabase project. In root `.env`, set its Project URL, legacy **anon** key and **service_role** key. Enable email/password authentication. The service-role key stays server/operator-only.

Preferred CLI path ([Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations)):

```powershell
npx supabase login
# Initialize once: this repository initially has no config.toml.
if (-not (Test-Path -LiteralPath supabase/config.toml)) { npx supabase init }
npx supabase link --project-ref <SUPABASE_PROJECT_REF>
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

Supply the DB password interactively. Preserve existing migrations/seed.sql during initialization. Apply all **15 migrations**, in filename order, through `20261004000500_security_audit.sql`. Schema push does not run the application demo seed. Never run `db reset` against the hosted database. If files were applied manually already, reconcile migration history before mixing workflows.

SQL-editor alternative: execute each file's complete contents **once**, in this order; record applied filenames:

```powershell
Get-ChildItem -LiteralPath supabase/migrations -Filter *.sql |
  Sort-Object Name | Select-Object -ExpandProperty Name
```

In the SQL editor, this RLS/policy check must return **zero rows**:

```sql
select c.relname
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
  and (not c.relrowsecurity or not exists (
    select 1 from pg_policies p
    where p.schemaname='public' and p.tablename=c.relname
  ));
```

Sign up your own account at `/login` and confirm email, or use Authentication → Users → Add user with email confirmation. For local signup, allow the localhost callback as described in step 5 and run `npm --prefix web run dev`. Copy your exact UUID from Authentication → Users. As the trusted SQL-editor operator, execute:

```sql
begin;
update public.profiles p set role='root_authority'
where p.id='<YOUR_CONFIRMED_USER_UUID>'::uuid
  and exists (select 1 from auth.users u
              where u.id=p.id and u.email_confirmed_at is not null)
returning p.id,p.role;
-- Verify the returned row has your UUID; zero rows means no role changed.
commit;
```

Zero rows means the UUID/confirmation needs correction. Log out/in; `/api/auth/me` must return your DB root role and `/root` must allow you. Never grant root through signup metadata. Repeat only if root access is needed in the separate Preview DB.

## 3. Contract deployment to Amoy

In root `.env`, set:

```dotenv
RPC_URL=https://polygon-amoy.drpc.org
CHAIN_ID=80002
REGISTRY_ADDRESS=
```

Prefer your provider's authenticated Amoy HTTPS RPC for reliability. Amoy uses **80002** and test POL for gas. Fund the relayer's **public** address using a supported faucet, then:

```powershell
npm --prefix contracts run typecheck
npm --prefix contracts test
Push-Location contracts
npx hardhat run scripts/deploy.ts --network amoy
Pop-Location
```

The script writes `web/lib/contract.json` with address, ABI, owner, deployment block and transaction. Set printed `REGISTRY_ADDRESS` in root `.env` and matching Vercel scope. Check successful contract creation at `https://amoy.polygonscan.com/address/<REGISTRY_ADDRESS>` and confirm owner equals the relayer address. Keep the generated public JSON with the deployed source. Add your actual Amoy address/explorer link to README after deployment; none has been confirmed here.

Deploy a separate Preview registry with its own relayer if using a separate Preview DB. Both deployments share the ABI, while Preview's explicit `REGISTRY_ADDRESS` can differ. Seed each DB against its matching contract/pepper. Network/faucet details: [Polygon docs](https://docs.polygon.technology/pos/reference/rpc-endpoints).

## 4. Vercel Production + Preview environment variables

Import your repository into Vercel: **Next.js**, **Root Directory `web`**, **Node 24.x**, install `npm ci`, build `npm run build`, default Next.js output. Deploy contracts from your machine. If this workspace still has no Git repository, publish source to your own repository or use a configured Vercel CLI deployment; exclude `.env` files.

Settings → Environment Variables: enter the following for **Production and Preview**, using the appropriate infrastructure. Mark server secrets Sensitive where offered. Public values appear in browser builds; never public-prefix a secret.

| Variable | Production | Preview | Exposure |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | target project URL | Preview project URL | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | target anon key | Preview anon key | public; RLS required |
| `SUPABASE_SERVICE_ROLE_KEY` | target service key | Preview service key | server secret |
| `RPC_URL` | reachable Amoy HTTPS RPC | Preview Amoy RPC | server; may contain credential |
| `CHAIN_ID` | `80002` | `80002` | server config |
| `REGISTRY_ADDRESS` | confirmed target contract | confirmed Preview contract | public address, server config |
| `RELAYER_PRIVATE_KEY` | target owner key, 0x + 64 hex digits | Preview owner key | server secret |
| `REGISTRY_PEPPER` | stable generated 64-hex pepper | distinct stable pepper | server secret |
| `RATE_LIMIT_PEPPER` | generated 64-hex pepper | distinct pepper | server secret |
| `VERDICT_SIGNING_KEY` | target receipt key | Preview receipt key | server secret |
| `NEXT_PUBLIC_VERDICT_SIGNER_ADDRESS` | address matching target receipt key | address matching Preview key | public pin |
| `NEXT_PUBLIC_EXPLORER_URL` | `https://amoy.polygonscan.com` | same | public |
| `LLM_PROVIDER` | `mock` or openai/anthropic/gemini | normally `mock` | server config |
| `LLM_MODEL` | supported model ID for real provider; otherwise omit | same rule | server config |
| `LLM_API_KEY` | provider key; omit for mock | separate key or omit for mock | server secret |
| `OFFICER_REPORT_THRESHOLD` | `3` | `3` | server config |
| `REGISTRY_MIN_ACCOUNT_AGE_SECONDS` | `86400` | `86400` | server config |
| `UPI_GUARD_THRESHOLD` | `10000.00` | `10000.00` | simulated UX threshold |
| `RATE_LIMIT_TRUST_PROXY` | `0` (Vercel detected automatically) | `0` | server config |
| `TELEGRAM_BOT_TOKEN` | optional bot token for Telegram contacts | test bot token or omit | server secret |
| `GUARDIAN_WEBHOOK_URL` | optional trusted HTTPS legacy UPI endpoint or omit | test endpoint or omit | server config |
| `GUARDIAN_WEBHOOK_SECRET` | optional endpoint bearer secret or omit | test secret or omit | server secret |

Per-user contacts are set on `/guardian`, not in environment variables. Without the legacy UPI endpoint, that flow records a simulated in-app alert. **Local CLI only:** `DEMO_SEED_ALLOWED`, `DEMO_PASSWORD`; do not configure either on Vercel. Upstash is not implemented and needs no variables. Vercel supplies `VERCEL`; do not override it. Login derives redirects from the browser's current origin; no site-URL env is required.

Functions settings: confirm **Fluid Compute enabled** and at least 60 seconds allowed. `/api/analyze`, the only LLM-calling route, exports `runtime='nodejs'`, `maxDuration=60`. The provider deadline is **8 seconds per attempt with one retry: 16 seconds total**, leaving headroom for auth, DB and bounded Guardian delivery. Invalid JSON falls back immediately. Optional LLM complaint polishing is not implemented. Chain-anchor routes also request 60 seconds. Do not add a lower duration override that prevents fallback.

Pro + Fluid supports this 60-second budget (normal maximum 800 seconds); the app deliberately caps below the plan maximum. See [Vercel duration docs](https://vercel.com/docs/functions/configuring-functions/duration). Save env values, then **redeploy Production and Preview**; public keys/URLs/signer pins require a new build.

## 5. Auth redirect URLs and isolated demo seed

For each Supabase project, Authentication → URL Configuration:

- **Site URL:** stable app origin using that DB, e.g. `https://<production-project>.vercel.app`; the Preview DB uses its stable staging origin.
- **Redirect URLs:** exact Production/custom-domain `/auth/callback`, and each approved Preview deployment/branch origin plus `/auth/callback`.
- Local only: `http://localhost:3000/auth/callback`; add `127.0.0.1` separately if used.
- Prefer exact Preview URLs. If necessary, restrict a wildcard to your project/team, e.g. `https://<project>-*-<team-slug>.vercel.app/auth/callback`, checked against an actual hostname. Do not allow every `*.vercel.app` site.

Keep templates using `{{ .ConfirmationURL }}` for this PKCE implementation and open links in the requesting browser. An alternate token-hash callback is not implemented. Check SMTP/send restrictions before inviting real users. See [Supabase redirect guidance](https://supabase.com/docs/guides/auth/redirect-urls).

Only for an **isolated synthetic demo DB**, point root `.env` at its DB/contract and exact hosted peppers/receipt key. Set `DEMO_SEED_ALLOWED=1` locally:

```powershell
npm --prefix web run seed:demo
```

This creates confirmed synthetic role accounts, HIGH analysis and a pending synthetic report; no issuer/officer private keys. Fresh passwords are public; existing passwords are preserved.

Open hosted `/demo` in the browser that will run connected mode. Expand **Prepare browser-held demo keys**, choose a new 12+ character passphrase, then **Generate keys and download PUBLIC seed fixture**. Download encrypted backups separately; neither backups nor passphrase go to the seed script/server. Import only the public fixture:

```powershell
npm --prefix web run seed:demo -- --fixture="C:\path\to\satyacall-demo-public.json"
```

The script registers the public issuer, stores its signed officer credential, creates an approved **non-payment information** action and anchors/reconciles the report. Action validity: 23h; rerun the same fixture before judging. Credential validity: 30 days; unlock the same keys and export a refreshed credential before expiry. Do not generate replacement keys for an existing seeded fixture. Set `DEMO_SEED_ALLOWED=0` afterward. Repeat only for a separate Preview demo DB if needed, with matching configuration.

Log in as the citizen in that browser, add a **consented test contact** at `/guardian`, and test **simulate alert**; it sends a real test message to a configured target. See [Guardian/n8n setup](guardian-setup.md). On `/demo`, unlock and select **Use connected demo**. Ordinary officer/issuer portals require importing the corresponding encrypted backup locally under that account. Public credentials alone cannot sign.

For real-user production, skip public demo seeding; test normal institution applications/root approval/officer applications/credential issuance with individually owned browser keys.

## 6. Health and demo smoke tests

Use the site origin without a trailing slash:

```powershell
$site='https://<your-production-project>.vercel.app'
Invoke-RestMethod -Uri "$site/api/health"
$env:AUDIT_BASE_URL=$site
npm --prefix web run audit:http
Remove-Item Env:AUDIT_BASE_URL
```

Expected mock health: `{"ok":true,"db":true,"chain":true,"llm":"mock"}`. Health labels a configured real provider but does not validate its key. `db` probes minimal SQL with the anon key; `chain` verifies RPC chain ID, not deployed code/owner/gas. Check those through connected verification and the explorer too.

For protected Preview, authenticate to the deployment in your browser. The anonymous HTTP scanner cannot bypass Vercel protection; its login response is not an application failure. Repeat app checks on the exact Preview URL/DB.

| Check | Expected |
| --- | --- |
| `/api/health` | DB/chain true; configured provider |
| `/login`, `/api/auth/me`, `/root` | your DB root role; other roles denied root |
| anonymous `/demo` | six-step rehearsal; simulated trust/delivery/chain labeled |
| connected `/demo` | HIGH → logged test Guardian delivery → fake NOT_VERIFIED → separate legitimate zero-payment VERIFIED_AUTHORIZED with pinned receipt → confirmed report/explorer link |
| two-window `/verify` + `/officer` | entity/intent reviewed; one use; replay rejected; off-allowlist payee never authorized |
| `/analyze` rules | no transcript network request; visible language/tactics/risk |
| consented real-provider analyzer | ambiguous/non-English input shows hybrid or honest fallback |
| `/registry`, `/dashboard`, `/guardian` | confirmed report; actual audit counts; honest delivery state |

Challenge limit is five/minute per bucket; wait for the next window on 429. Young demo accounts do not count toward HIGH registry risk until the configured age. Delivery acceptance does not prove the family member read it. The successful officer demo is a **new information request**, never authorization of the fake CBI payment.

Release checks: web lint/tests/build/bundle scan and contract typecheck/tests. CI also checks production HTTP protections. Record actual Vercel origin, Supabase project references, Amoy address/tx and smoke outcomes. Reconcile interrupted audit rows/pending transactions, monitor relayer gas, and establish DB/secret backups and retention before real-user use.

