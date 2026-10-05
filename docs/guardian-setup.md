# Guardian workflow setup

Import `guardian-n8n.json` into n8n. It is inactive and contains no credentials or real chat IDs. Configure the Webhook node with a Header Auth credential: header name `Authorization`, value `Bearer <your-own-random-secret>`. Put that same per-contact secret in SatyaCall's Guardian form. Configure Telegram credentials on the final node and replace `SET_FAMILY_CHAT_ID`; the recipient must start the bot. Activate the workflow and save its **production HTTPS webhook URL** as a Guardian contact. n8n's test URL works only while listening for test events.

The workflow accepts exactly `{riskScore,tactics,summary,time}`, validates score/tactic codes, acknowledges with 202, and passes only those fields to Telegram. A 202 records endpoint acceptance, not proof the family read or received the downstream message. Monitor failed n8n deliveries independently. Configure your n8n retention policy; this template disables saved execution data but cannot control reverse-proxy/provider logs.

Use **Simulate alert** in `/guardian` for a clearly marked test. It really sends to configured contacts; it is not a fake delivery success. No raw transcript or identifier is included. SatyaCall never auto-retries an ambiguous delivery; its Idempotency-Key header identifies an alert, while Telegram does not offer request-level exactly-once delivery.

Official references: [n8n Webhook credentials](https://docs.n8n.io/integrations/builtin/credentials/webhook/) and [Telegram Bot API sendMessage](https://core.telegram.org/bots/api#sendmessage).
