# Teela Guest App — PWA + Vercel Deployment

Complete guest management PWA for Teela luxury glamping resort, with staff portal, real-time chat, activity booking, food ordering, and payment processing.

**Features:**
- ✅ Guest check-in flow (3-screen onboarding)
- ✅ Real-time chat with staff
- ✅ Activity booking system
- ✅ Food menu ordering with cart
- ✅ Itemized billing with Razorpay payments
- ✅ Staff dashboard (Arrivals, Orders, Chats, SOS, Activities, Preferences, Menu Management)
- ✅ Offline browsing (service worker caching)
- ✅ Installable PWA (standalone app)
- ✅ Real-time updates via Supabase Realtime

---

## Tech Stack

**Frontend:**
- React 18.3.1 + Vite 8.0.10
- React Router 6 (SPA routing)
- React Query 3.39.3 (data fetching)
- Supabase JS client (authentication, database, real-time)
- vite-plugin-pwa (service worker, manifest)

**Backend:**
- Supabase PostgreSQL (database)
- Supabase Auth (staff authentication)
- Supabase Edge Functions (Deno, serverless logic)
- Supabase Realtime (WebSocket pub/sub)

**External APIs:**
- Razorpay (payment processing)
- eZee (PMS/POS integration)
- Firebase Cloud Messaging (push notifications)

**Deployment:**
- Vercel (frontend hosting, SPA routing)
- Supabase (backend, Edge Functions)

---

## Project Structure

```text
teela-guest-app/
├── src/
│   ├── pages/
│   │   ├── Checkin/              # Guest check-in flow
│   │   ├── Home/                 # Home dashboard
│   │   ├── Activities/           # Activity listing & booking
│   │   ├── Menu/                 # Food menu & ordering
│   │   ├── Chat/                 # Real-time guest chat
│   │   ├── Bill/                 # Itemized bill & payments
│   │   └── Staff/                # Staff portal
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       └── tabs/
│   ├── components/
│   │   ├── ProtectedRoute.jsx    # Guest auth wrapper
│   │   └── StaffProtectedRoute.jsx # Staff auth wrapper
│   ├── lib/
│   │   ├── supabaseClient.js     # Supabase client init
│   │   ├── staffAuth.js          # Staff auth helpers
│   │   └── edgeFunction.js       # Edge Function caller
│   ├── App.jsx                   # Main router
│   ├── index.css                 # Global styles + Teela design system
│   └── main.jsx                  # React entry point
├── public/
│   ├── manifest.json             # PWA manifest (auto-generated)
│   ├── icon-192.png              # App icon 192x192
│   ├── icon-512.png              # App icon 512x512
│   └── icon-512-maskable.png     # Maskable icon for adaptive icons
├── supabase/
│   ├── functions/
│   │   ├── checkin/              # Check-in verification
│   │   ├── preferences/          # Save guest preferences
│   │   ├── activity/             # Book activity
│   │   ├── order/                # Create food order
│   │   ├── folio/                # Get itemized bill
│   │   ├── payment/              # Razorpay order creation
│   │   ├── payment/verify/       # Payment verification
│   │   └── sos/                  # SOS alert creation
│   └── migrations/               # Database schema migrations
├── .env.example                  # Environment variables template
├── .env.local                    # Local dev env (git-ignored)
├── vite.config.js                # Vite config with PWA plugin
├── vercel.json                   # Vercel SPA routing config
├── package.json
└── README.md                     # This file
```

---

## Local Development Setup

### 1. Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (free tier: https://supabase.com)
- Razorpay account (https://razorpay.com)

### 2. Clone Repository

```bash
git clone https://github.com/your-org/teela-guest-app.git
cd teela-guest-app
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Configuration

Copy the example file and fill in your actual credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```env
# From Supabase Dashboard > Settings > API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# From Razorpay Dashboard > Settings > API Keys
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

**Security note:** Never commit `.env.local` to git. The `.env.example` file lists all required variables without actual keys.

### 5. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 6. Test PWA Features

- Open DevTools > Application tab
- Verify Service Worker is registered
- Go offline and test menu/activities caching (should still work)
- Add app to home screen (mobile) or install as app (desktop)

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Select your region (e.g., Asia-Singapore for India)
4. Wait for database to initialize (~3 minutes)

### 2. Create Tables & Schema

In Supabase Dashboard, go to **SQL Editor** and run the migrations:

```sql
-- (Run all SQL from supabase/migrations/ in order)
-- Example: create reservations, menu_items, activities, etc.
```

Or use the CLI:

```bash
supabase db pull  # If you have existing schema
```

### 3. Set Up Realtime

1. Go to Supabase > Replication
2. Enable publications for: `chat_messages`, `food_orders`, `sos_alerts`

### 4. Configure Row Level Security (RLS)

Enable RLS on all tables:

```sql
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
-- ... (see supabase/migrations/ for all policies)
```

### 5. Deploy Edge Functions

```bash
supabase functions deploy checkin
supabase functions deploy preferences
supabase functions deploy activity
supabase functions deploy order
supabase functions deploy folio
supabase functions deploy payment
supabase functions deploy payment/verify
supabase functions deploy sos
```

### 6. Set Function Secrets

In Supabase Dashboard, go to **Edge Functions > Secrets** and add:

```
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
RAZORPAY_SECRET_KEY = your-razorpay-secret
EZEE_API_KEY = your-ezee-api-key
EZEE_API_SECRET = your-ezee-api-secret
FCM_SERVER_KEY = your-fcm-server-key
```

These secrets are **never exposed** to the frontend.

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "feat: add PWA support and Vercel config"
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New" > "Project"**
3. Import your GitHub repository
4. Select the `teela-guest-app` directory as the root
5. Click **"Deploy"**

### 3. Set Environment Variables

In **Vercel Dashboard > Settings > Environment Variables**, add:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key-here
VITE_RAZORPAY_KEY_ID = rzp_live_your_key_id
```

**⚠️ Important:** 
- Only public keys go in Vercel env
- Secret keys stay in Supabase Edge Function secrets
- Vercel will auto-apply these to all deployments

### 4. Verify Deployment

```bash
npm run build
```

Should see:
```
✓ 129 modules transformed
dist/index.html                   0.89 kB
dist/assets/index-*.css          54.91 kB
dist/assets/index-*.js          449.04 kB
✓ built successfully
```

---

## Configure Custom Domain

### 1. Add Domain to Vercel

1. Vercel Dashboard > Project Settings > Domains
2. Click **"Add Domain"**
3. Enter `app.teela.in`
4. Choose **"CNAME"** option

### 2. Update DNS Records

Go to your domain registrar (GoDaddy, Namecheap, Route53, etc.) and add CNAME record:

```
Host:  app
Type:  CNAME
Value: cname.vercel-dns.com
TTL:   3600
```

Wait 5-15 minutes for DNS propagation.

### 3. Verify SSL Certificate

- Vercel will auto-request Let's Encrypt SSL
- Check Vercel Dashboard for "Certificate Valid" status
- `https://app.teela.in` should now work

---

## PWA Configuration

### Service Worker & Caching Strategy

The app uses `vite-plugin-pwa` to auto-generate the service worker. Configuration in `vite.config.js`:

**Cached Endpoints (Safe for offline):**
- ✅ Menu items (static, rarely change)
- ✅ Activities list (static content)
- ✅ Reservations (changes infrequently, 1-hour cache)

**NOT Cached (Always fresh):**
- ❌ Chat messages (real-time)
- ❌ Food orders (real-time)
- ❌ SOS alerts (emergency)
- ❌ Bill/payment data (sensitive)

**Manifest Configuration:**
- **Name:** Teela Resort
- **Short name:** Teela
- **Theme color:** #3D1F08 (primary brown)
- **Background color:** #F9F6F1 (cream)
- **Display:** standalone (full-screen app)
- **Start URL:** / (home page)

### Install PWA on Mobile

1. **iOS:** Open app in Safari > Share > "Add to Home Screen"
2. **Android:** Open app in Chrome > Menu > "Install app"
3. **Desktop:** Click install prompt (if shown) or use browser menu

---

## Environment Variables Reference

### Frontend (.env.local or Vercel Dashboard)

| Variable | Source | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | Supabase > Settings > API | Database & auth endpoint |
| `VITE_SUPABASE_ANON_KEY` | Supabase > Settings > API | Public client key (safe to expose) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay > Settings > API Keys | Payment gateway key ID (public) |

### Backend (Supabase Edge Function Secrets Only)

⚠️ **NEVER** put these in frontend `.env`:

| Secret | Source | Purpose |
|--------|--------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API | Admin access to database (backend only) |
| `RAZORPAY_SECRET_KEY` | Razorpay > Settings > API Keys | Payment verification (backend only) |
| `EZEE_API_KEY` | eZee | PMS integration (backend only) |
| `EZEE_API_SECRET` | eZee | PMS auth (backend only) |
| `FCM_SERVER_KEY` | Firebase Console | Push notifications (backend only) |

---

## Testing

### Local Testing

```bash
# Development mode
npm run dev

# Build for production (test locally)
npm run build
npm run preview

# Lint code
npm lint
```

### Testing Payments

Use Razorpay test keys:
- **Card:** 4111111111111111 (any future expiry)
- **CVV:** 123
- **Amounts < ₹2:** Use test OTP 123456

### Testing Offline Mode

1. Build the app: `npm run build`
2. Open DevTools > Network > Set to "Offline"
3. Verify menu/activities pages still load from cache
4. Chat/orders should show offline banner

---

## Troubleshooting

### Build Fails with Vite Error

```bash
# Clear cache
rm -rf node_modules .npm-cache dist
npm install
npm run build
```

### Supabase Edge Function Times Out

- Increase timeout in `supabase/functions/*/deno.json`
- Check function logs: `supabase functions list --linked`
- Verify Edge Function secrets are set: `supabase secrets list`

### Service Worker Not Updating

- In DevTools > Application > Service Workers, click "Unregister"
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Or clear site data: DevTools > Storage > Clear site data

### Vercel Deployment Fails

- Check build logs: Vercel Dashboard > Deployments
- Verify `npm run build` works locally
- Ensure all env vars are set in Vercel Dashboard

### CORS Errors

- Verify Supabase CORS settings allow your domain
- Check browser console for full error message
- Supabase by default allows all origins (safe for anon key)

---

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m "feat: add feature"`
3. Push: `git push origin feature/my-feature`
4. Open Pull Request

## License

Proprietary — Teela Resort

## Support

For issues or questions:
- Email: dev@teela.in
- Slack: #engineering channel


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


