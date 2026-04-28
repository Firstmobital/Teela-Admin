# Quick Start Deployment Checklist

Use this checklist to deploy Teela Guest App from development to production.

---

## Pre-Deployment (5-10 minutes)

- [ ] **Commit & Push Code to GitHub**
  ```bash
  git add .
  git commit -m "feat: add PWA and Vercel deployment"
  git push origin main
  ```

- [ ] **Verify Build Works Locally**
  ```bash
  npm run build
  npm run preview
  ```
  Should show: `✓ built in ...ms` + PWA v1.2.0

- [ ] **Review .env.example**
  - Ensure all required variables documented
  - No secret keys in file

---

## Supabase Setup (30-45 minutes)

Complete SUPABASE_SETUP.md guide:

- [ ] **1. Create Supabase Project**
  - Go to https://supabase.com
  - Region: Asia-Singapore (for India guests)
  - Copy Project URL and anon key

- [ ] **2. Create Database Tables**
  - Run SQL migrations from SUPABASE_SETUP.md
  - Tables: reservations, menu_items, activities, activity_bookings, chat_messages, food_orders, food_order_items, sos_alerts

- [ ] **3. Enable RLS & Realtime**
  - Enable RLS on all tables
  - Enable Realtime publications for: chat_messages, food_orders, sos_alerts

- [ ] **4. Deploy Edge Functions**
  ```bash
  supabase login
  supabase link --project-ref YOUR-PROJECT-REF
  supabase functions deploy checkin
  supabase functions deploy preferences
  supabase functions deploy activity
  supabase functions deploy order
  supabase functions deploy folio
  supabase functions deploy payment
  supabase functions deploy payment/verify
  supabase functions deploy sos
  ```

- [ ] **5. Set Edge Function Secrets**
  - In Supabase Dashboard > Edge Functions > Secrets, add:
    - `SUPABASE_SERVICE_ROLE_KEY` (from Settings > API)
    - `RAZORPAY_SECRET_KEY` (from Razorpay dashboard)
    - `EZEE_API_KEY` and `EZEE_API_SECRET` (from eZee)
    - `FCM_SERVER_KEY` (from Firebase Console)

---

## Vercel Deployment (10-15 minutes)

Complete VERCEL_DEPLOYMENT.md guide:

- [ ] **1. Import GitHub Repo to Vercel**
  - Go to https://vercel.com/dashboard
  - Click "Add New" > "Project"
  - Import `teela-guest-app` repository
  - Framework: Vite (auto-detected)
  - Click "Deploy"
  - Wait for initial build (2-3 minutes)

- [ ] **2. Set Environment Variables**
  - Vercel Dashboard > Project Settings > Environment Variables
  - Add for all environments:
    ```
    VITE_SUPABASE_URL = https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    VITE_RAZORPAY_KEY_ID = rzp_live_your_key_id
    ```

- [ ] **3. Redeploy with Environment Variables**
  - Vercel Dashboard > Deployments
  - Click latest deployment > "Redeploy"
  - Wait for build to complete

- [ ] **4. Verify Deployment**
  - Visit your Vercel URL: `https://teela-guest-app-xyz.vercel.app`
  - Test check-in flow: `/stay/verify`
  - Test staff login: `/staff/login`
  - Check DevTools > Application > Service Workers (should be registered)

---

## Optional: Custom Domain Setup (5-10 minutes)

- [ ] **1. Add Domain in Vercel**
  - Vercel Dashboard > Project Settings > Domains
  - Click "Add" and enter: `app.teela.in`
  - Type: CNAME

- [ ] **2. Update DNS Record**
  - Go to domain registrar (GoDaddy, Namecheap, Route53, etc.)
  - Add CNAME record:
    - Host: `app`
    - Value: `cname.vercel-dns.com`
    - TTL: 3600

- [ ] **3. Verify DNS Propagation**
  - Wait 5-15 minutes
  - Test: `nslookup app.teela.in` (should resolve)
  - Check browser: `https://app.teela.in` should load app
  - SSL certificate should be auto-issued (green lock)

---

## Post-Deployment Testing (10-15 minutes)

### Functionality Tests

- [ ] **Check-in Flow**
  - Visit `/stay/verify`
  - Enter test booking ref + phone
  - Complete check-in → verify token generated
  - Navigate to home dashboard

- [ ] **Staff Portal**
  - Visit `/staff/login`
  - Login with staff credentials (created in Supabase)
  - Verify all tabs load (Arrivals, Orders, Chats, Activities, Preferences, SOS, Menu Mgmt)

- [ ] **Real-time Features**
  - Open staff Orders tab in one window
  - Place food order from guest app in another window
  - Verify order appears instantly in staff Orders tab

- [ ] **Payments**
  - Complete check-in as guest
  - Go to Bill tab
  - Click "Checkout & Pay"
  - Verify Razorpay modal opens
  - Use test card: 4111111111111111 (if test key)

### PWA Tests

- [ ] **Service Worker Registration**
  - DevTools > Application > Service Workers
  - Should show status: "activated and running"

- [ ] **PWA Installation**
  - Chrome: Click install icon in address bar
  - or Menu > "Install app"
  - Verify app name is "Teela Resort"
  - Verify icon appears on home screen

- [ ] **Offline Mode**
  - DevTools > Network > Set to "Offline"
  - Refresh page
  - Menu and Activities pages should still load (from cache)
  - Chat/Orders should show "offline" banner

- [ ] **Caching Behavior**
  - Check cached responses: DevTools > Network > Disable cache OFF
  - Menu items should show from Service Worker (if subsequent page load)

### Performance Tests

- [ ] **Build Size**
  - Verify from build output:
    - CSS: ~54.91 KB (gzipped ~7.95 KB) ✓
    - JS: ~449.04 KB (gzipped ~122.53 KB) ✓

- [ ] **Load Time**
  - DevTools > Network > Measure
  - First page load: <2 seconds (with service worker)
  - Subsequent loads: <500ms (cached)

---

## Production Monitoring (Ongoing)

- [ ] **Set Up Vercel Alerts**
  - Vercel Dashboard > Project Settings > Monitoring
  - Enable notifications for deployments

- [ ] **Monitor Error Logs**
  - Vercel: Dashboard > Deployments > Logs
  - Supabase: Dashboard > Edge Functions > Logs
  - Browser DevTools > Console

- [ ] **Monitor Database Performance**
  - Supabase: Dashboard > Reports
  - Check query performance, connection count

- [ ] **Enable Automated Backups**
  - Supabase: Settings > Backups
  - Enable automatic daily backups

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| App loads but shows errors | Check Vercel Dashboard Logs and env vars |
| Service Worker not active | Clear site data, hard refresh (Cmd+Shift+R) |
| Custom domain not working | Wait 15 min for DNS, verify CNAME record |
| Razorpay payments fail | Verify RAZORPAY_SECRET_KEY in Supabase secrets |
| Real-time updates not working | Verify Realtime enabled in Supabase > Database > Replication |
| Edge Functions timeout | Check Supabase function logs, optimize queries |

See README.md and VERCEL_DEPLOYMENT.md for detailed troubleshooting.

---

## Rollback Procedure

If something breaks in production:

1. **Vercel Rollback**
   ```bash
   # Vercel Dashboard > Deployments > Select previous successful deployment > Redeploy
   ```

2. **Database Rollback**
   ```bash
   # Supabase > Settings > Backups > Download previous backup
   # OR restore from backup (automatic daily backups enabled)
   ```

3. **Notify Team**
   - Update status page
   - Notify support team via Slack

---

## Success Criteria ✅

Your deployment is successful when:

- [x] App accessible at `https://app.teela.in` (or Vercel URL)
- [x] Service Worker registered and active
- [x] PWA installable on mobile/desktop
- [x] Guest check-in to payment flow works end-to-end
- [x] Staff portal fully functional
- [x] Real-time chat/orders/SOS working
- [x] Offline mode works (menu/activities cached)
- [x] Build size optimized (CSS <10KB gzip, JS <130KB gzip)
- [x] No console errors in production
- [x] SSL certificate valid (green lock)

---

## Next Steps

1. **Monitor for 24 hours** — Watch error logs, performance metrics
2. **Set up alerts** — Vercel + Supabase notifications
3. **Plan enhancements** — Based on usage data
4. **Optimize** — Improve performance based on real-world usage

🎉 **Congratulations! Your PWA is live!**



