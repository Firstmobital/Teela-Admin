# Teela App — Quick Reference Card

Keep this card handy for common commands and configuration values.

---

## Essential Commands

```bash
# Local Development
npm install              # Install dependencies
npm run dev             # Start dev server (http://localhost:5173)
npm run build           # Build for production
npm run preview         # Preview production build locally
npm run lint            # Run ESLint

# Supabase (Backend)
supabase login          # Login to Supabase CLI
supabase link --project-ref=YOUR-REF  # Link project
supabase functions list # List deployed functions
supabase functions deploy [NAME]      # Deploy function
supabase secrets list   # List edge function secrets
supabase secrets set KEY=VALUE        # Set secret

# Git
git add .
git commit -m "message"
git push origin main    # Trigger auto-deploy on Vercel
```

---

## Environment Variables

### Frontend (.env.local or Vercel Dashboard)

| Variable | Example |
|----------|---------|
| `VITE_SUPABASE_URL` | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_RAZORPAY_KEY_ID` | `rzp_live_123abc...` |

### Backend (Supabase Edge Function Secrets)

| Secret | Source |
|--------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API |
| `RAZORPAY_SECRET_KEY` | Razorpay > Settings > API Keys |
| `EZEE_API_KEY` | eZee account |
| `EZEE_API_SECRET` | eZee account |
| `FCM_SERVER_KEY` | Firebase Console |

---

## API Endpoints (Edge Functions)

All at: `https://YOUR-PROJECT.supabase.co/functions/v1/`

| Function | Method | Input | Output |
|----------|--------|-------|--------|
| `/checkin` | POST | `{ booking_ref, phone }` | `{ guest_token, guest_id }` |
| `/preferences` | POST | `{ guest_token, pillow, wakeup, dietary_tags, special_requests }` | `{ success }` |
| `/activity` | POST | `{ guest_token, activity_id, booking_date, time_slot, guest_count }` | `{ booking_id }` |
| `/order` | POST | `{ guest_token, items: [{item_id, qty}], notes }` | `{ order_id, total }` |
| `/folio` | GET | `{ guest_token }` | `{ items: [...], total, gst }` |
| `/payment` | POST | `{ order_id, amount }` | `{ razorpay_order_id }` |
| `/payment/verify` | POST | `{ razorpay_order_id, razorpay_payment_id, signature }` | `{ success, transaction_id }` |
| `/sos` | POST | `{ guest_token }` | `{ alert_id }` |

---

## Routes (Guest App)

| Route | Purpose |
|-------|---------|
| `/stay/verify` | Check-in entry point |
| `/stay/:token/preferences` | Set guest preferences |
| `/stay/:token/welcome` | Welcome screen |
| `/stay/:token/home` | Home dashboard |
| `/stay/:token/activities` | Activity list & booking |
| `/stay/:token/menu` | Food menu & ordering |
| `/stay/:token/chat` | Chat with staff |
| `/stay/:token/bill` | Bill & checkout |
| `/stay/:token/checkout-confirm` | Payment confirmation |

## Routes (Staff Portal)

| Route | Purpose |
|-------|---------|
| `/staff/login` | Staff authentication |
| `/staff/dashboard` | Main staff dashboard with tabs |

---

## Design System (Teela Brand)

### Colors
| Name | Value | Usage |
|------|-------|-------|
| Primary | `#3D1F08` | Buttons, headings, primary actions |
| Accent | `#C4A882` | Highlights, accents |
| Background | `#F9F6F1` | Page background |
| Surface | `#FFFFFF` | Cards, surfaces |
| Text | `#1A1A1A` | Primary text |
| Secondary Text | `#6B6B6B` | Helper text, muted |
| Border | `#E0D8CF` | Dividers, borders |
| Destructive | `#A32D2D` | Error, delete, danger |

### Typography

| Use | Font | Size |
|-----|------|------|
| Headings | Cormorant Garamond | 32px (h1), 28px (h2) |
| Body | DM Sans | 14px |
| Labels | DM Sans | 12px, bold |
| Buttons | DM Sans | 14px, 600 weight |

---

## Database Schema (Key Tables)

### Reservations
- `id` (UUID) — Primary key
- `booking_ref` (TEXT) — Unique booking reference
- `guest_token` (TEXT UNIQUE) — 36-char hex, 24h expiry
- `room_number` (TEXT)
- `checkin_date`, `checkout_date` (DATE)
- `guest_name`, `guest_email`, `guest_phone`
- `status` — PENDING, CHECKED_IN, CHECKED_OUT, NO_SHOW
- Preferences: `pillow_preference`, `wakeup_time`, `dietary_tags[]`, `special_requests`

### Menu Items
- `id`, `name`, `description`, `category`
- `price`, `is_veg`, `is_active`

### Activities
- `id`, `name`, `description`, `max_capacity`
- `price`, `duration_minutes`, `is_active`

### Chat Messages
- `id`, `reservation_id`, `sender_type` (GUEST/STAFF)
- `sender_name`, `message`, `read`, `created_at`

### Food Orders
- `id`, `reservation_id`, `status` (CONFIRMED/READY/COMPLETED)
- `total_amount`, `special_notes`, `created_at`

### SOS Alerts
- `id`, `reservation_id`, `created_at`
- `resolved_at`, `resolved_by`

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Cannot find module" | Check env vars set in Vercel, redeploy |
| Service Worker not updating | Clear site data, hard refresh |
| RLS policy rejects | Check guest_token passed correctly |
| Edge Function timeout | Check function logs, optimize DB query |
| Razorpay modal blank | Verify `VITE_RAZORPAY_KEY_ID` is set |
| Realtime not updating | Verify Realtime enabled in Supabase |
| CORS error | Check anon key permissions, verify API |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First page load | <2 seconds |
| Subsequent loads | <500ms (cached) |
| CSS gzip size | <10 KB |
| JS gzip size | <130 KB |
| Largest content paint (LCP) | <2.5 seconds |
| Cumulative layout shift (CLS) | <0.1 |

---

## PWA Configuration

| Feature | Value |
|---------|-------|
| Display | standalone (full-screen app) |
| Theme color | #3D1F08 |
| Background color | #F9F6F1 |
| Service Worker | Workbox (auto-generated) |
| Icon sizes | 192x192, 512x512 |
| Caching strategy | Menu: CacheFirst (24h), Activities: CacheFirst (24h), Reservations: NetworkFirst (1h) |

---

## File Locations

| File | Purpose |
|------|---------|
| `.env.example` | Template with all env variables |
| `.env.local` | Local development (git-ignored) |
| `vite.config.js` | Vite config with PWA plugin |
| `vercel.json` | Vercel SPA routing config |
| `src/lib/supabaseClient.js` | Supabase client init |
| `src/lib/staffAuth.js` | Staff auth helpers |
| `src/index.css` | Global styles + Teela design system |
| `public/manifest.webmanifest` | PWA manifest (auto-generated) |
| `dist/sw.js` | Service worker (auto-generated) |

---

## Documentation Files

| File | Content |
|------|---------|
| `README.md` | Complete project overview |
| `SUPABASE_SETUP.md` | Backend setup (500+ lines) |
| `VERCEL_DEPLOYMENT.md` | Deployment guide (400+ lines) |
| `PWA_ICONS_SETUP.md` | Icon generation guide |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment checklist |
| `PWA_AND_VERCEL_SETUP.md` | Complete setup summary |

---

## Useful Links

**Documentation:**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- React Router: https://reactrouter.com
- Vite: https://vitejs.dev

**Dashboards:**
- Vercel: https://vercel.com/dashboard
- Supabase: https://app.supabase.com
- Razorpay: https://dashboard.razorpay.com

**Tools:**
- Favicon Generator: https://realfavicongenerator.net
- Icon Creator: https://www.favicon-generator.org
- DNS Checker: https://mxtoolbox.com

---

## Support

**For issues:**
1. Check error logs: Vercel > Deployments > Logs or Supabase > Functions > Logs
2. Read relevant .md file (SUPABASE_SETUP.md, VERCEL_DEPLOYMENT.md, etc.)
3. Check Troubleshooting section in README.md
4. Email: dev@teela.in

**Community:**
- Vercel Community: https://vercel.com/community
- Supabase Discord: https://discord.supabase.io
- Stack Overflow: #supabase, #vercel, #react

---

**Last Updated:** April 28, 2026  
**App Version:** 1.0.0  
**Status:** Production Ready ✅

