# Lost2Med

Canadian premed tracker: GPA on your university's grading scale, MCAT practice-test log, requirements and deadlines for all 18 Canadian med schools, an experience journal, and daily wellness check-ins.

- **Free:** everything above, with an account that syncs across devices.
- **Pro ($4.99/mo or $39.99/yr CAD):** AI interview summaries for journal entries and AI wellness reflections.

**Stack:** React + Vite (static site) · Supabase (login, database, Edge Functions) · Stripe (subscriptions) · Claude API (AI features, called from the server only).

```
src/                    the app
  App.jsx               login → onboarding → tabs, account & upgrade sheets
  Auth.jsx, Account.jsx sign in / sign up / reset, account + Pro upgrade
  tabs/                 GPA, MCAT, Schools, Journal, Wellness
  core.jsx              colours, grading scales, school + timeline data, UI pieces
  lib/                  Supabase client, cloud sync, subscription, dates
supabase/
  migrations/           database tables + security rules
  functions/            create-checkout, customer-portal, stripe-webhook, ai, delete-account
```

## Run it on your computer

```bash
npm install
npm run dev          # http://localhost:5173
```

With no `.env.local` the app runs in **local mode**: no login, data stays in that browser, AI is off. That's fine for trying it out.

---

## Launch checklist

You'll create three free accounts: **Supabase**, **Stripe**, **Vercel** (or Netlify), plus an **Anthropic** API key for the AI features. Budget about an hour.

### 1. Supabase (login + database)

1. Create a project at [supabase.com](https://supabase.com) (pick the Canada region if offered).
2. Install the CLI: `npm i -g supabase`, then in this folder:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>   # Project Settings → General
   supabase db push                                  # creates the tables
   ```
3. **Authentication → URL Configuration:** set *Site URL* to your live site (e.g. `https://lost2med.vercel.app`) and add it, plus `http://localhost:5173`, to *Redirect URLs*.
4. **Authentication → Emails → SMTP:** Supabase's built-in email is limited to a few emails an hour, which isn't enough for real users. Connect an email provider (Resend, Postmark, etc.) before launch.
5. *(Optional)* **Authentication → Providers → Google:** turn it on, then set `VITE_GOOGLE_AUTH=true`.

### 2. Stripe (payments)

1. Create an account at [stripe.com](https://stripe.com). Stay in **Test mode** until everything works.
2. **Product catalog → Add product** "Lost2Med Pro" with two recurring prices in CAD: **$4.99 monthly** and **$39.99 yearly**. Copy both price IDs (`price_...`).
3. **Settings → Billing → Customer portal:** turn on *cancel subscription*, *update payment method* and *switch plans* (add both prices).
4. **Developers → Webhooks → Add endpoint**
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`
   - Copy the **Signing secret** (`whsec_...`).
5. *(Recommended)* Set up **Stripe Tax** for GST/HST, then set `STRIPE_AUTOMATIC_TAX=true`.

### 3. Server secrets + functions

```bash
cp supabase/functions/.env.example supabase/functions/.env   # fill it in (never commit it)
supabase secrets set --env-file supabase/functions/.env
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy ai
supabase functions deploy delete-account
```

Get the Anthropic key at [console.anthropic.com](https://console.anthropic.com) and set a monthly spend limit there. `AI_DAILY_LIMIT` caps requests per user per day (default 40).

### 4. Host the site (Vercel)

1. Import this GitHub repo at [vercel.com/new](https://vercel.com/new). It detects Vite automatically.
2. Add environment variables (from Supabase → Project Settings → API):
   - `VITE_SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = the **anon / publishable** key (never the service-role key)
3. Deploy, then put the final URL in `SITE_URL` (step 3) and Supabase's Site URL (step 1.3), and run `supabase secrets set SITE_URL=https://...` again.

### 5. Test, then go live

1. Sign up on the live site, confirm your email, add a course, open the app on your phone and check it synced.
2. Upgrade with Stripe's test card `4242 4242 4242 4242` (any future date, any CVC). Pro should switch on within a few seconds, and the AI buttons should work.
3. Account → Manage subscription → cancel, and check Pro ends at the period end.
4. In Stripe, switch to **Live mode**: create the same product/prices and webhook there, then update `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and both price IDs with the live values.

### Before you charge real customers

- **Privacy policy and terms of service** pages, linked from the sign-up screen. You're storing students' grades and wellness notes, and Canadian privacy law (PIPEDA) applies. Stripe also requires these.
- **Re-check the med-school data.** Deadlines and requirements in `src/core.jsx` (`MED_SCHOOLS`, `TIMELINE`) are for the 2026–27 cycle. Most have now passed, so update them for the next cycle from each school's site.
- A **support email** shown in the app (people will need help with billing).

## Phone apps

The site can be installed from the browser ("Add to Home Screen"). Putting it in the App Store or Google Play is a later step: wrap it with Capacitor, and note that Apple and Google require their own in-app purchase systems for digital subscriptions sold inside a store app.
