# Teela Guest App Monorepo

Monorepo scaffold for a guest-facing React PWA and Supabase backend logic using Edge Functions.

## Structure

```text
teela-guest-app/
	src/
		components/
		pages/
		hooks/
		lib/
			supabaseClient.js
		styles/
			theme.js
	supabase/
		functions/
			checkin/
			order/
			activity/
			payment/
			checkout/
			folio/
			sos/
		migrations/
		seed.sql
	.env.local
	.env.example
	vercel.json
	README.md
```

## Tech Stack

- React 18 + Vite
- @supabase/supabase-js
- react-router-dom
- react-query
- Supabase Edge Functions (Deno)

No Express or any server framework is used. Backend logic is intended to live in `supabase/functions` only.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment file from example:

```bash
cp .env.example .env.local
```

3. Fill required keys in `.env.local`.

4. Start frontend:

```bash
npm run dev
```

## Environment Variables

Minimum required for frontend runtime:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Recommended for Supabase CLI and edge functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `STRIPE_SECRET_KEY` (if payment integration is used)
- `STRIPE_WEBHOOK_SECRET` (if webhook handling is used)

## Supabase Workflow

1. Add SQL schema updates under `supabase/migrations`.
2. Seed baseline data with `supabase/seed.sql`.
3. Implement business logic in each function under `supabase/functions/<name>/index.ts`.

## Deployment

### Frontend (Vercel)

- `vercel.json` is configured for a static Vite build.
- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrites route all paths to `index.html`

### Backend (Supabase)

- Deploy edge functions through Supabase CLI:

```bash
supabase functions deploy checkin
supabase functions deploy order
supabase functions deploy activity
supabase functions deploy payment
supabase functions deploy checkout
supabase functions deploy folio
supabase functions deploy sos
```
