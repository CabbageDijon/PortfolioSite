# CabsCode API

Express API behind nginx at `/api/*`: the contact / quote form (`/api/contact`), the SEO audit tool (`/api/seo-audit/*`) and `/api/health`.

All mail is sent through **Gmail SMTP** (`smtp.gmail.com:587`, STARTTLS) from one Gmail account.

## Gmail app password

1. Sign in to the sending account (`cabscodepro@gmail.com`).
2. Turn on **2-Step Verification**: <https://myaccount.google.com/security>.
3. Create an app password: <https://myaccount.google.com/apppasswords> (name it e.g. "CabsCode API").
4. Copy the 16-character password into `GMAIL_APP_PASSWORD`. Spaces are stripped, so pasting `abcd efgh ijkl mnop` is fine.

Never commit `backend/.env`. In production the values live in Dokploy → Environment.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `GMAIL_USER` | yes | Sending account, also used as the From address |
| `GMAIL_APP_PASSWORD` | yes | 16-char Google app password |
| `NOTIFY_EMAIL` | no | Where notifications go. Defaults to `GMAIL_USER` |
| `SERPER_API_KEY` | for SEO audit | Serper search API key |
| `GEMINI_API_KEY` | for SEO audit | Falls back to placeholder terms if unset |
| `GEMINI_MODEL` | no | e.g. `gemini-3.5-flash-lite` |
| `PAID_AUDIT_SECRET` | for paid audits | HMAC secret for unlock tokens |
| `ADMIN_TOKEN` | no | For `/api/seo-audit/mint-token`; falls back to `PAID_AUDIT_SECRET` |
| `AUDIT_USAGE_PATH` | no | JSON file for audit usage, e.g. `/app/audit-usage.json` |
| `PORT` | no | Defaults to 3000 |

If `GMAIL_USER` or `GMAIL_APP_PASSWORD` is missing the server still boots, logs which one is missing, and `/api/contact` returns **503**.

## What a submission sends

| Submission | Owner notification (`NOTIFY_EMAIL`) | Client auto-reply |
|---|---|---|
| Inquiry with email | "NEW INQUIRY" with details, Reply-To = client | Branded "Thanks — your request has been sent" |
| Inquiry with WhatsApp only | "NEW INQUIRY" with a Reply on WhatsApp button | none (no email) |
| Quote with email | "NEW QUOTE REQUEST", priced breakdown, `.md` attachment | Quote summary without per-option prices |
| Quote with WhatsApp only | Same as above, with WhatsApp button | none |

The owner notification must succeed (otherwise the API returns 500). The client auto-reply is best effort; the response includes `confirmationSent` so the site can tell the visitor whether to expect it.

Spam protection: honeypot field `website`, a 3s–30min `_timestamp` window and 20 requests / 15 min per IP.

## Scripts

```bash
npm ci
npm run preview:emails   # writes emails/preview/*.html (+ .txt) with sample data
npm run test:mail        # sends 4 sample emails to NOTIFY_EMAIL using backend/.env
npm run dev              # node --watch server.js
```
