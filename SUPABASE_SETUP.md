# Supabase Setup Guide

Complete instructions for configuring Supabase backend for Teela Guest App.

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name:** `teela-resort`
   - **Database Password:** (generate strong password, save it)
   - **Region:** Asia-Singapore (or closest to guests)
4. Click **"Create new project"**
5. Wait 3-5 minutes for database to initialize

### Get Project Credentials

Once project is ready, go to **Settings > API** and copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon (public) key** → `VITE_SUPABASE_ANON_KEY`
- **service_role key** → Keep secret (for Edge Functions only)

---

## Step 2: Create Database Tables

### Option A: SQL Migrations (Recommended)

Create file `supabase/migrations/001_init.sql`:

```sql
-- Reservations table
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  room_number TEXT NOT NULL,
  checkin_date DATE NOT NULL,
  checkout_date DATE NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW')),
  
  -- Guest preferences
  pillow_preference TEXT,
  wakeup_time TEXT,
  dietary_tags TEXT[],
  special_requests TEXT,
  
  -- Guest token (36-char hex)
  guest_token TEXT UNIQUE,
  token_created_at TIMESTAMP,
  token_expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Menu items table
CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Soups & Starters', 'Mains', 'Breads & Rice', 'Desserts', 'Beverages')),
  price DECIMAL(10, 2) NOT NULL,
  is_veg BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_capacity INT DEFAULT 20,
  price DECIMAL(10, 2),
  duration_minutes INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity bookings
CREATE TABLE activity_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id),
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  guest_count INT NOT NULL,
  status TEXT DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('GUEST', 'STAFF')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Food orders
CREATE TABLE food_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED')),
  special_notes TEXT,
  total_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Food order items (join table)
CREATE TABLE food_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES food_orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SOS alerts
CREATE TABLE sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by TEXT
);

-- Create indexes for performance
CREATE INDEX idx_reservations_checkin ON reservations(checkin_date);
CREATE INDEX idx_activity_bookings_reservation ON activity_bookings(reservation_id);
CREATE INDEX idx_chat_messages_reservation ON chat_messages(reservation_id);
CREATE INDEX idx_food_orders_reservation ON food_orders(reservation_id);
CREATE INDEX idx_sos_alerts_resolved ON sos_alerts(resolved_at);
```

Run migrations via Supabase Dashboard:
1. Go to **SQL Editor**
2. Click **"New Query"**
3. Paste the SQL above
4. Click **"Run"**

### Option B: Manual Table Creation

Use Supabase Dashboard > **Table Editor** > **Create Table** for each table above.

---

## Step 3: Enable Row Level Security (RLS)

RLS ensures guests can only access their own data and staff can manage only their operations.

### Enable RLS on All Tables

```sql
-- Enable RLS on all tables
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies

**Reservations (Guests can read/write only their own):**

```sql
-- Guests can read their own reservation
CREATE POLICY "Guests can read own reservation"
ON reservations FOR SELECT
USING (guest_token = current_setting('app.guest_token'));

-- Guests can update preferences only
CREATE POLICY "Guests can update own preferences"
ON reservations FOR UPDATE
USING (guest_token = current_setting('app.guest_token'))
WITH CHECK (guest_token = current_setting('app.guest_token'));
```

**Menu Items (Publicly readable, staff can write):**

```sql
-- Public read access (no authentication required)
CREATE POLICY "Menu items are public"
ON menu_items FOR SELECT
USING (TRUE);

-- Staff can update menu items
CREATE POLICY "Staff can update menu items"
ON menu_items FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
```

**Activities (Publicly readable):**

```sql
CREATE POLICY "Activities are public"
ON activities FOR SELECT
USING (TRUE);
```

**Chat Messages (Guests can read/write their own, staff can read/write all):**

```sql
-- Guests can read their own chat
CREATE POLICY "Guests can read own chat"
ON chat_messages FOR SELECT
USING (
  reservation_id IN (
    SELECT id FROM reservations 
    WHERE guest_token = current_setting('app.guest_token')
  )
);

-- Guests can insert their own messages
CREATE POLICY "Guests can insert own messages"
ON chat_messages FOR INSERT
WITH CHECK (
  reservation_id IN (
    SELECT id FROM reservations 
    WHERE guest_token = current_setting('app.guest_token')
  ) AND sender_type = 'GUEST'
);

-- Staff can read all chats
CREATE POLICY "Staff can read all chats"
ON chat_messages FOR SELECT
USING (auth.role() = 'authenticated');

-- Staff can insert messages
CREATE POLICY "Staff can insert messages"
ON chat_messages FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND sender_type = 'STAFF');
```

---

## Step 4: Enable Realtime

Realtime allows the app to receive live updates for chat, orders, and SOS alerts.

1. Go to Supabase Dashboard > **Database > Replication**
2. Toggle **"Enable Realtime"** for these tables:
   - `chat_messages`
   - `food_orders`
   - `sos_alerts`

These tables will now broadcast changes to all connected clients.

---

## Step 5: Set Up Auth

### Guest Authentication (Token-based)

The app uses token-based auth for guests (no Supabase Auth needed).

- Token: 36-character hex generated in check-in Edge Function
- Stored: `reservations.guest_token`
- Expires: 24 hours after checkout_date

### Staff Authentication (Supabase Auth)

Create staff users in Supabase Auth with role metadata.

1. Supabase Dashboard > **Authentication > Users**
2. Click **"Invite"**
3. Enter staff email
4. Copy reset link and send to staff

Staff can also sign up via `/staff/login` form if sign-ups are enabled (Settings > Auth > Providers > Email).

### Set Staff Role Metadata

```sql
-- Assign admin role to staff member
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'manager@teela.in';

-- Assign regular staff role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"staff"'::jsonb
)
WHERE email = 'staff@teela.in';
```

---

## Step 6: Deploy Edge Functions

### Install Supabase CLI

```bash
npm install -g supabase
```

Or use the npm version:

```bash
npm install -D supabase
npx supabase --version
```

### Create Edge Functions

Each function is in `supabase/functions/[name]/index.ts`

**Example structure:**

```
supabase/functions/
├── checkin/
│   └── index.ts
├── preferences/
│   └── index.ts
├── activity/
│   └── index.ts
├── order/
│   └── index.ts
├── folio/
│   └── index.ts
├── payment/
│   ├── index.ts
│   └── verify/
│       └── index.ts
└── sos/
    └── index.ts
```

### Deploy Functions

```bash
supabase login
supabase projects list
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy checkin
supabase functions deploy preferences
supabase functions deploy activity
supabase functions deploy order
supabase functions deploy folio
supabase functions deploy payment
supabase functions deploy payment/verify
supabase functions deploy sos
```

Verify deployment:

```bash
supabase functions list
```

---

## Step 7: Set Edge Function Secrets

### Add Secrets

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set RAZORPAY_SECRET_KEY=your-razorpay-secret
supabase secrets set EZEE_API_KEY=your-ezee-api-key
supabase secrets set EZEE_API_SECRET=your-ezee-api-secret
supabase secrets set FCM_SERVER_KEY=your-fcm-server-key
```

Or via Supabase Dashboard:

1. Go to **Edge Functions** (from left menu)
2. Click any function
3. Go to **Secrets** tab
4. Click **"Add Secret"** and enter each key-value pair

### Verify Secrets

```bash
supabase secrets list
```

---

## Step 8: Create Seed Data (Optional)

Add sample menu items and activities for testing:

```sql
-- Insert sample menu items
INSERT INTO menu_items (name, description, category, price, is_veg) VALUES
('Margherita Pizza', 'Classic cheese pizza', 'Mains', 250.00, true),
('Butter Chicken', 'Creamy chicken curry', 'Mains', 350.00, false),
('Garlic Naan', 'Soft bread with garlic', 'Breads & Rice', 80.00, true),
('Gulab Jamun', 'Sweet milk solids in syrup', 'Desserts', 100.00, true),
('Fresh Orange Juice', 'Freshly squeezed', 'Beverages', 120.00, true);

-- Insert sample activities
INSERT INTO activities (name, description, max_capacity, price, duration_minutes, is_active) VALUES
('Jungle Trek', 'Guided nature walk through forest', 15, 0.00, 120, true),
('Stargazing', 'Evening stargazing session with telescope', 20, 0.00, 90, true),
('Yoga Session', 'Morning yoga on the lawn', 10, 0.00, 60, true),
('Bird Watching', 'Spot endemic bird species', 8, 500.00, 180, true);
```

---

## Step 9: Test Connection from Frontend

Once everything is set up, test the connection:

1. Update `.env.local` with your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key
```

2. Start dev server: `npm run dev`
3. Test check-in page: `/stay/verify`
4. Verify data loads from Supabase
5. Check browser DevTools > Network for Supabase API calls

---

## Monitoring & Maintenance

### View Logs

- **Edge Functions:** Supabase Dashboard > Edge Functions > Function > Logs
- **Database:** SQL Editor > Run queries to inspect data
- **Auth Events:** Authentication > Users > View audit logs

### Backup Database

1. Supabase Dashboard > **Settings > Backups**
2. Enable **"Automatic backups"** (daily)
3. Manual export: **Settings > Backups > Download backup**

### Monitor Performance

1. Supabase Dashboard > **Reports**
2. Check:
   - Database connections
   - Query performance
   - Storage usage
   - API call count

---

## Troubleshooting

### "ANON key missing" Error

**Cause:** `VITE_SUPABASE_ANON_KEY` not set in frontend `.env`

**Fix:** Copy anon key from Supabase > Settings > API

### RLS Policy Rejects Requests

**Cause:** Policy logic incorrect or guest token not set properly

**Fix:**
1. Check policy logic in SQL Editor
2. Verify guest token is passed in request headers
3. Check function logs for exact error

### Edge Function Timeout

**Cause:** Function too slow or infinite loop

**Fix:**
1. Check function logs in Supabase Dashboard
2. Optimize database queries (add indexes)
3. Increase timeout in `deno.json`

---

## Next Steps

1. Once Supabase is set up, deploy app to Vercel (see VERCEL_DEPLOYMENT.md)
2. Test end-to-end flows (check-in → chat → order → payment)
3. Monitor production logs and performance

