# Vercel Deployment Guide

Complete step-by-step instructions for deploying Teela Guest App to Vercel with PWA support, environment variables, and custom domain.

---

## Prerequisites Checklist

Before deploying, ensure you have:

- ✅ GitHub account with repo pushed
- ✅ Vercel account (free: https://vercel.com)
- ✅ Supabase project created with Edge Functions deployed
- ✅ Razorpay API keys (test or live)
- ✅ (Optional) Custom domain registered

---

## Step 1: Push to GitHub

Ensure your code is pushed to GitHub main branch:

```bash
git add .
git commit -m "feat: add PWA support and Vercel config"
git push origin main
```

Verify on GitHub:
```
https://github.com/your-org/teela-guest-app
```

---

## Step 2: Connect Repository to Vercel

### 2a. Log in to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Log in" → Sign in with GitHub
3. Grant Vercel access to your GitHub account

### 2b. Import Project

1. Click **"Add New"** button (top-right)
2. Select **"Project"**
3. Search for `teela-guest-app` repository
4. Click **"Import"**

### 2c. Configure Project Settings

On the import screen:

1. **Project Name:** `teela-guest-app` (auto-filled)
2. **Framework Preset:** `Vite` (should auto-detect)
3. **Root Directory:** `./teela-guest-app` (if monorepo)
4. **Build Command:** `npm run build` (default)
5. **Output Directory:** `dist` (default)
6. **Install Command:** `npm install` (default)

Click **"Deploy"** — Vercel will start the build.

### 2d. Monitor Initial Deployment

- Watch the build log in Vercel Dashboard
- Build should complete in ~2-3 minutes
- You'll get a preview URL: `https://teela-guest-app-xyz.vercel.app`

---

## Step 3: Set Environment Variables

Environment variables **must** be set in Vercel for the app to work (frontend keys only).

### 3a. Add Variables in Vercel Dashboard

1. Go to Vercel Dashboard > **Project Settings** > **Environment Variables**
2. Click **"Add New"** and enter each variable:

**For all environments (Production, Preview, Development):**

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_RAZORPAY_KEY_ID = rzp_live_your_actual_key_id
```

Get these values from:
- **VITE_SUPABASE_URL** → Supabase Dashboard > Settings > API > Project URL
- **VITE_SUPABASE_ANON_KEY** → Supabase Dashboard > Settings > API > anon (public) key
- **VITE_RAZORPAY_KEY_ID** → Razorpay Dashboard > Settings > API Keys > Key ID

### 3b. Save and Redeploy

After adding environment variables:

1. Go to Vercel Dashboard > Deployments
2. Click the latest deployment
3. Click **"Redeploy"** button (to use new env vars)
4. Wait for build to complete (~2 minutes)

---

## Step 4: Verify Deployment

### 4a. Test the App

1. Visit your Vercel URL: `https://teela-guest-app-xyz.vercel.app`
2. Navigate through pages:
   - `/stay/verify` → Check-in form
   - `/staff/login` → Staff portal login
3. Try a test guest check-in (use test booking ref + phone)
4. Verify chat/orders load without errors

### 4b. Check PWA Installation

1. Open the app in Chrome (mobile or desktop)
2. Look for **"Install"** button in browser address bar
3. Click to install as app
4. Verify:
   - App name is "Teela Resort"
   - Icon appears on home screen
   - Can run offline (menu/activities cached)

### 4c. Verify Service Worker

1. Open DevTools > **Application** tab
2. Go to **Service Workers** section
3. Should see `https://teela-guest-app-xyz.vercel.app/sw.js` registered
4. Status: "activated and running"

---

## Step 5: Configure Custom Domain

### 5a. Add Domain in Vercel

1. Vercel Dashboard > **Project Settings** > **Domains**
2. Click **"Add"** and enter your domain: `app.teela.in`
3. Select **Type: "CNAME"** (recommended)
4. Vercel shows target: `cname.vercel-dns.com`

### 5b. Update DNS Records

Go to your domain registrar (GoDaddy, Namecheap, Route53, AWS, Netlify DNS, etc.):

**Add CNAME Record:**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | app | cname.vercel-dns.com | 3600 |

**Example DNS entries (varies by registrar):**

- **GoDaddy:** DNS Management > Add > CNAME, Host: `app`, Value: `cname.vercel-dns.com`
- **Namecheap:** Hosting > Manage Domain > Advanced DNS > New Record > CNAME
- **AWS Route53:** Create Record Set > Name: `app.teela.in` > Type: CNAME > Value: `cname.vercel-dns.com`

### 5c. Wait for DNS Propagation

DNS changes take 5-15 minutes. Check status:

```bash
# On Mac/Linux
nslookup app.teela.in
# Should resolve to Vercel's IP

# Or use online tool:
# https://mxtoolbox.com/cname.aspx
```

Once propagated:
- `https://app.teela.in` redirects to your Vercel app
- SSL certificate auto-issued by Let's Encrypt
- Check Vercel Dashboard for "Certificate Valid" status

---

## Step 6: Supabase Edge Functions Setup

Backend functions must be deployed separately to Supabase (not Vercel).

### 6a. Install Supabase CLI

```bash
npm install -g supabase
```

### 6b. Link Your Supabase Project

```bash
cd supabase
supabase login
supabase projects list
supabase link --project-ref your-project-ref
```

Replace `your-project-ref` with your Supabase project ID.

### 6c. Deploy Edge Functions

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

Verify:
```bash
supabase functions list
```

### 6d. Set Function Secrets

In Supabase Dashboard > **Edge Functions** > **Secrets**, add:

```
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
RAZORPAY_SECRET_KEY = your-razorpay-secret
EZEE_API_KEY = your-ezee-key
EZEE_API_SECRET = your-ezee-secret
FCM_SERVER_KEY = your-fcm-key
```

⚠️ **These secrets are NEVER exposed to the frontend.**

---

## Step 7: Production Testing

### 7a. Test Real Razorpay Payments

1. Update `VITE_RAZORPAY_KEY_ID` in Vercel to your **live key** (not test key)
2. Redeploy
3. Go to Bill > Checkout to test actual payment flow
4. Use real Razorpay credentials (not test sandbox)

### 7b. Test Email Notifications

1. Trigger check-in from `/stay/verify`
2. Trigger an SOS from staff dashboard
3. Place a food order
4. Verify email notifications are sent (check Supabase logs)

### 7c. Monitor Errors

- **Vercel:** Dashboard > Deployments > Logs
- **Supabase:** Dashboard > Edge Functions > Function Logs
- **Browser Console:** DevTools > Console for client-side errors

---

## Continuous Deployment (Auto-Deploy on Push)

Once configured, Vercel automatically:

- **Detects** changes pushed to `main` branch
- **Builds** using `npm run build`
- **Deploys** to production at `app.teela.in`
- **Previews** pull requests with unique URLs

No manual deployment steps needed after initial setup!

---

## Troubleshooting

### App Loads But Shows "Cannot find module"

**Cause:** Environment variables not set or app built without them.

**Fix:**
1. Verify env vars in Vercel Dashboard > Settings > Environment Variables
2. Trigger redeploy: Deployments > Latest > Redeploy
3. Clear browser cache: DevTools > Storage > Clear site data

### Service Worker Not Updating

**Cause:** Browser cached old service worker.

**Fix:**
1. DevTools > Application > Service Workers
2. Click "Unregister"
3. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
4. Reload page

### Custom Domain Shows "Vercel Serverless Error"

**Cause:** DNS not propagated yet or domain configuration incorrect.

**Fix:**
1. Wait 15 minutes for DNS to propagate
2. Verify CNAME record: `nslookup app.teela.in`
3. In Vercel: Settings > Domains > Check status
4. Ensure CNAME target is exactly `cname.vercel-dns.com`

### Supabase Edge Function Timeout

**Cause:** Function taking too long or dependency issue.

**Fix:**
1. Check function logs: Supabase > Edge Functions > Logs
2. Increase timeout in `supabase/functions/[name]/deno.json`
3. Verify secrets are set: `supabase secrets list`

### Razorpay Payments Fail

**Cause:** Wrong API key or missing secret in Edge Functions.

**Fix:**
1. Verify `VITE_RAZORPAY_KEY_ID` in Vercel matches Razorpay dashboard
2. Check `RAZORPAY_SECRET_KEY` set in Supabase Edge Function secrets
3. Test with Razorpay test key first (if using live key)

---

## Post-Deployment Checklist

- [ ] App loads at `https://app.teela.in`
- [ ] Guest check-in flow works end-to-end
- [ ] Staff login and dashboard accessible
- [ ] Chat messages send and receive in real-time
- [ ] Food orders appear in staff Orders tab
- [ ] Payments process with Razorpay
- [ ] PWA installable (Chrome mobile install prompt)
- [ ] Service Worker active (DevTools > Application > Service Workers)
- [ ] Menu/activities pages load offline after first visit
- [ ] SSL certificate valid (green lock in browser)

---

## Next Steps

1. **Monitor Analytics:**
   - Vercel Dashboard > Analytics (page loads, request times)
   - Supabase Dashboard > Reports (database queries, auth events)

2. **Set Up Monitoring Alerts:**
   - Vercel: Settings > Monitoring
   - Supabase: Settings > Alerts

3. **Backup Strategy:**
   - Enable Supabase daily backups (Settings > Backups)
   - Export database periodically

4. **Performance Optimization:**
   - Monitor build size: `npm run build` output
   - Check web vitals: Vercel Analytics dashboard
   - Optimize images: Ensure all PNG icons are optimized

---

## Support

For issues or questions:
- **Vercel Help:** https://vercel.com/help
- **Supabase Docs:** https://supabase.com/docs
- **Email:** dev@teela.in

