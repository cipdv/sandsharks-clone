# Sandsharks

Next.js app for the Toronto Sandsharks Beach Volleyball League.

## Local Development

Run the app locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Email Environment

The current email implementation uses Resend for delivery. These variables are expected locally:

```env
RESEND_API_KEY=re_xxxxxxxxx
SENDER_EMAIL_ADDRESS=sandsharks@sandsharks.ca
REPLY_TO_EMAIL=sandsharks.org@gmail.com
REPLY_TO_EMAIL_ADDRESSES=sandsharks.org@gmail.com
EMAIL_SIGNATURE_SECRET=your-signing-secret
NEXT_PUBLIC_BASE_URL=https://www.sandsharks.ca
```

`SENDER_EMAIL_ADDRESS` and `REPLY_TO_EMAIL_ADDRESSES` were added to align with Resend's MCP server defaults.

## Resend MCP For Codex

Resend's MCP server is an AI-agent integration, not part of the app runtime. For Codex, Resend documents this stdio setup:

```bash
codex mcp add resend \
  --env RESEND_API_KEY=re_xxxxxxxxx \
  -- npx -y resend-mcp
```

For this project, use the verified sender and reply-to defaults already configured in `.env.local`:

```bash
codex mcp add resend \
  --env RESEND_API_KEY=$env:RESEND_API_KEY \
  --env SENDER_EMAIL_ADDRESS=$env:SENDER_EMAIL_ADDRESS \
  --env REPLY_TO_EMAIL_ADDRESSES=$env:REPLY_TO_EMAIL_ADDRESSES \
  -- npx -y resend-mcp --sender $env:SENDER_EMAIL_ADDRESS --reply-to $env:REPLY_TO_EMAIL_ADDRESSES
```

If you prefer HTTP transport, Resend documents starting the server like this:

```bash
npx -y resend-mcp --http --port 3000
```

Relevant docs:

- Docs index: https://resend.com/docs/llms.txt
- MCP server: https://resend.com/docs/mcp-server
- AI onboarding: https://resend.com/docs/ai-onboarding

Agent note from the docs: if you find a specific problem in a Resend docs page, feedback can be submitted to `POST https://resend.com/docs/_mintlify/feedback/resend/agent-feedback` with JSON like `{ "path": "/current-page-path", "feedback": "Description of the issue" }`. That should only be used for concrete, actionable documentation issues.
