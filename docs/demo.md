# Guided demo and connected test run

`/demo` has six Next-step cards: synthetic fake CBI call → local HIGH risk → Guardian alert → fake caller fails → separate legitimate information request passes → synthetic number reported and anchored. Allow about 15 seconds per card (90 seconds total); there is no forced waiting. Rehearsal needs no accounts, network services or LLM keys. It runs the real browser rules and signature/credential algorithms, but **simulates database trust, Guardian delivery and anchoring**. It is not a live verification result and does not add dashboard activity.

Connected mode uses the existing challenge/verify, Guardian and report APIs. Failed, unconfigured, expired or pending services stop progression; no successful delivery, authorized verdict or chain confirmation is fabricated. The HIGH-risk scam payment is never authorized: the successful officer response is a new zero-payment `information` action from **SatyaCall Synthetic Public Service (not CBI)**. All persons and identifiers are fictional. The phone `+91 0000000000` is an intentionally unallocated synthetic fixture, not a victim or suspect number.

## Prepare the connected mode (six steps)

1. Use an **isolated synthetic demo Supabase project**, apply all migrations in order, and configure the root `.env` with Supabase, rate/report peppers, localhost/Amoy registry/relayer, `VERDICT_SIGNING_KEY`, and its public `NEXT_PUBLIC_VERDICT_SIGNER_ADDRESS`. Deploy the testnet contract as described in README. Never seed demo credentials in production.
2. Set `DEMO_SEED_ALLOWED=1` locally. In `web/`, run `npm run seed:demo`. This creates confirmed demo accounts, assigns roles through a service-only SQL seed function, seeds one metadata-only HIGH analysis and a pending peppered synthetic report. It does not create an institution/officer private key. No password, service credential or key is printed.
3. Start the app. Open `/demo`, expand **Prepare browser-held demo keys**, enter a new passphrase of at least 12 characters, and click **Generate keys and download PUBLIC seed fixture**. Keep this browser. Institution/officer keys are generated and encrypted locally; the downloaded `satyacall-demo-public.json` contains public addresses and a signed credential only. Also download the two encrypted key backups for safekeeping. Do not send those backups to the seed script or server.
4. In `web/`, run `npm run seed:demo -- --fixture="C:\path\to\satyacall-demo-public.json"`. The script strictly rejects private keys/backups, validates credential signature/expiry, registers the public issuer using the testnet relayer, installs the officer credential and approved non-payment action, and attempts to anchor the synthetic report. Reruns preserve accounts/passwords and reconcile reports; retain the same public addresses. Actions last 23 hours: rerun with the public fixture to refresh. Credentials last 30 days: export a newly signed public fixture from the same browser keys and reseed before expiry.
5. In that browser, log in as the demo citizen and configure a consented Guardian webhook/Telegram contact on `/guardian`. Test **simulate alert**. Configure Telegram/n8n using `docs/guardian-setup.md`; an accepted POST does not prove the family member read it. Connected demo messages are explicitly labeled SIMULATION and actually sent to the configured contact.
6. Return to `/demo`, enter the key passphrase, choose **Use connected demo**, and step through. Officer signing happens in this browser; private keys are never in an API request. Fake/real challenges write actual audit rows, and the real verdict receipt is checked against the pinned signer. The last card reuses the seeded report and retries its anchor if pending. Confirmed Amoy transactions link to the explorer; localhost shows the real transaction hash. Review `/dashboard` and `/guardian` afterward.

## Demo logins

| Account | Role |
| --- | --- |
| `citizen@demo.satyacall.invalid` | citizen |
| `officer@demo.satyacall.invalid` | officer |
| `issuer@demo.satyacall.invalid` | issuer_admin |
| `root@demo.satyacall.invalid` | root_authority |

Fresh accounts use the deliberately public password **`SatyaCall-Demo-Only-2026!`** unless `DEMO_PASSWORD` is set locally. Existing passwords are never reset by reruns. Emails are marked confirmed by the local seed; no mailbox is required. If public login is desired for judging, keep the entire deployment/project test-only and remove/disable these accounts after judging. The root account is privileged. The seed refuses production chain IDs; it accepts only localhost 31337 and Amoy 80002. Project isolation still needs to be chosen correctly by the developer.

The browser used for the connected demo deliberately holds both synthetic institution and officer demo vaults. Ordinary user vaults remain scoped to each account. To use `/officer` or `/issuer` independently, import the matching **encrypted** backup into that account's key panel and unlock locally; the server receives only signatures/public credentials. Public fixture exports and credentials are not W3C verifiable credentials.

No connected Supabase accounts or external Guardian messages are created by the automated test suite. API, SQL/RLS, signature and chain helpers are tested locally/mocked; seeding your hosted project requires the configured service role and testnet relayer.
