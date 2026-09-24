# ArtNovaX Website

This repository contains the public website and admin tools for **ArtNovaX Mental Health Foundation**.

ArtNovaX works at the intersection of art, mental wellbeing, community programmes, research and technology. The website supports that work through event registration, volunteer and partnership applications, donations, merchandise, newsletters, research content and internal admin workflows.

## What this repo contains

The application is a React frontend backed by Supabase.

```text
Browser
  |
  v
React + Tailwind CSS
  |
  +--> Supabase PostgreSQL
  +--> Supabase Auth
  +--> Supabase Storage
  +--> Supabase Edge Functions
  +--> Supabase Cron
  |
  +--> Paystack
  +--> Resend

Netlify
  └── frontend hosting

AWS Route 53
  └── artnovax.org DNS
```

There is no standalone application server. Backend workflows that need trusted credentials or privileged database access run through Supabase Edge Functions.

## Tech stack

### Frontend

- React 19
- React Router
- Tailwind CSS
- Lucide React
- Supabase JavaScript client

### Backend

- Supabase PostgreSQL
- Supabase Auth
- Row Level Security
- Database RPCs
- Edge Functions
- Supabase Cron
- Supabase Storage

### External services

- Paystack for card payments
- Resend for transactional email and newsletters
- Netlify for frontend deployment
- AWS Route 53 for DNS

The repository still contains older Stripe and Safaricom Daraja functions from previous payment work. They are not part of the current public checkout flow.

## Repository structure

```text
artnovax-web/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── config/
│   │   └── mock*.js
│   ├── package.json
│   └── .env.example
│
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   ├── create-order-checkout/
│   │   ├── create-donation-checkout/
│   │   ├── verify-order-checkout/
│   │   ├── verify-donation-checkout/
│   │   ├── paystack-webhook/
│   │   ├── submit-manual-payment-reference/
│   │   ├── confirm-manual-payment/
│   │   ├── public-submission/
│   │   ├── newsletter-subscribe/
│   │   ├── send-newsletter/
│   │   └── send-event-reminders/
│   ├── sql/
│   └── config.toml
│
├── package.json
└── README.md
```

## Local development

### Requirements

- Node.js 20+
- npm
- Yarn 1.x

The root package contains the Supabase CLI dependency. The frontend uses Yarn.

Install the root dependency:

```powershell
npm install
```

Install frontend dependencies:

```powershell
cd frontend
yarn install
```

Create a local frontend environment file:

```powershell
Copy-Item .env.example .env
```

Add the public Supabase values:

```env
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Start the frontend:

```powershell
yarn start
```

The local site runs at:

```text
http://localhost:3000
```

## Production build

From `frontend/`:

```powershell
yarn build
```

A successful production build should complete before frontend changes are merged or deployed.

## Supabase

Link your local repository to the Supabase project:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Database migrations and SQL helpers live in:

```text
supabase/sql/
```

Edge Functions live in:

```text
supabase/functions/
```

Deploy one function with:

```powershell
npx supabase functions deploy FUNCTION_NAME
```

If a shared file under `supabase/functions/_shared/` changes, redeploy every Edge Function that imports it.

## Environment and secrets

Frontend environment variables must only contain values that are safe to expose in the browser.

Sensitive values belong in Supabase-managed secrets.

### Paystack

```text
PAYSTACK_SECRET_KEY
```

Set it with:

```powershell
npx supabase secrets set PAYSTACK_SECRET_KEY="YOUR_SECRET_KEY"
```

Do not put the Paystack secret key in `REACT_APP_*` variables.

### Resend

```text
RESEND_API_KEY
FROM_EMAIL
REPLY_TO_EMAIL
TEAM_EMAIL
RESEND_NEWSLETTER_SEGMENT_ID
PUBLIC_SITE_URL
```

Example production configuration:

```text
FROM_EMAIL=ArtNovaX <notifications@mail.artnovax.org>
REPLY_TO_EMAIL=notifications@artnovax.org
TEAM_EMAIL=admin@artnovax.org
PUBLIC_SITE_URL=https://artnovax.org
```

### Scheduled jobs

```text
CRON_SECRET
```

Set any Supabase secret with:

```powershell
npx supabase secrets set KEY="VALUE"
```

Never commit real secrets to Git.

## Payments

The website currently supports two public payment paths.

### Card payments

Card payments for shop orders and donations are handled through **Paystack**.

The flow is:

```text
React
  |
  v
Supabase Edge Function
  |
  v
Paystack hosted checkout
  |
  +--> callback verification
  |
  └--> signed webhook
          |
          v
      Supabase
```

For shop orders:

- `create-order-checkout` creates the pending order.
- Product prices are re-read from the database instead of trusting browser-submitted prices.
- Paystack is initialized with the exact amount in KES.
- `verify-order-checkout` verifies the transaction after the customer returns.
- `paystack-webhook` independently handles successful `charge.success` events.
- The amount, currency, reference and metadata are checked before an order is marked paid.

For donations:

- `create-donation-checkout` creates the pending donation.
- `verify-donation-checkout` verifies the returned Paystack transaction.
- `paystack-webhook` can also settle the donation.

The Paystack webhook endpoint is:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
```

### M-Pesa

M-Pesa currently uses a **manual Paybill verification flow** rather than STK Push.

The public receiving details are intentionally shown at checkout:

```text
Paybill: 522533
Account number: 8109391
Business: ARTNOVAX FOUNDATION
```

The flow is:

```text
Customer places order
        |
        v
Pending M-Pesa order
        |
        v
Customer pays through M-Pesa Paybill
        |
        v
Customer submits transaction code
        |
        v
submit-manual-payment-reference
        |
        v
Still pending
        |
        v
Staff verifies payment independently
        |
        v
/admin/payments
        |
        v
confirm-manual-payment
        |
        v
Order marked paid
```

A customer-submitted transaction code is **not** treated as proof of payment.

Only an authenticated admin can confirm the payment after checking the receiving account.

ArtNovaX never asks customers to enter an M-Pesa PIN on the website.

### Bank transfer

Bank transfer support exists in the checkout code but is currently disabled until verified organisational receiving details are ready.

## Transactional email

Transactional email is sent through Resend from Supabase Edge Functions.

Typical flows include:

- order received emails
- payment confirmations
- donation acknowledgements
- contact form acknowledgements
- internal contact notifications
- partnership inquiry acknowledgements
- volunteer application acknowledgements
- event registration confirmations
- event waitlist confirmations
- event reminder emails

Confirmed event registrations can include:

- a Google Calendar link
- an `.ics` attachment for Apple Calendar or Outlook

Shared email rendering and delivery helpers live under:

```text
supabase/functions/_shared/
```

When shared email code changes, redeploy every function that imports the changed file.

## Newsletter

Newsletter signup is handled by:

```text
newsletter-subscribe
```

Subscribers are stored in Supabase and synchronized with a Resend Segment.

Published issues can be sent from the admin dashboard through:

```text
send-newsletter
```

The newsletter workflow:

1. claims the issue so it cannot be sent twice
2. synchronizes subscribers
3. creates a Resend Broadcast
4. includes Resend's managed unsubscribe link
5. queues the broadcast
6. stores delivery metadata on the newsletter issue

The required Resend segment ID is stored in:

```text
RESEND_NEWSLETTER_SEGMENT_ID
```

## Public forms

Public submissions go through the `public-submission` Edge Function instead of writing directly to privileged database tables from the browser.

It currently handles:

- contact messages
- partnership inquiries
- volunteer applications
- event registrations

The function stores the submission, sends the appropriate acknowledgement, and sends an internal notification when required.

Event registration also uses the `register_for_event` database RPC to handle confirmed and waitlisted registrations.

## Event reminders

Upcoming event reminders are handled by:

```text
send-event-reminders
```

Supabase Cron calls the function periodically.

The function checks upcoming events and confirmed registrations, determines whether a configured reminder window has been reached, sends the email, and records the reminder so it is not sent twice.

The scheduled endpoint is protected by `CRON_SECRET`.

## Content and research

Most public pages have bundled default content in the frontend, including:

```text
frontend/src/mock.js
frontend/src/mock_pages.js
frontend/src/mock_pages2.js
```

Research & Insights articles live in the Supabase `articles` table and are managed from the Articles tab in `/admin`. The public research library and article detail pages read published article rows directly from Supabase.

Article bodies are stored as structured JSON blocks, including headings, paragraphs, images, quotes and source lists. This keeps article content editable without requiring a frontend deployment.

Research articles should:

- use plain language
- distinguish creative wellbeing from clinical treatment
- avoid overstating evidence
- link to the primary or publisher source where possible
- make uncertainty and study limitations clear

## Admin dashboard

The `/admin` area uses Supabase Auth and database authorization.

Authorized staff can manage or review:

- website content
- events
- registrations
- volunteer roles
- volunteer applications
- founders and team content
- products
- shop orders
- payment verification
- donations
- contact messages
- partnership inquiries
- newsletter issues
- newsletter subscribers
- app waitlist entries

Authorization for privileged actions must be enforced on the backend, not only by hiding controls in React.

## Deployment

The frontend is deployed through Netlify.

Recommended configuration:

```text
Base directory: frontend
Build command: yarn build
Publish directory: build
```

The production frontend only needs public browser-safe values such as:

```text
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_PUBLISHABLE_KEY
```

Payment keys, email credentials, Supabase privileged credentials and cron secrets belong in Supabase, not Netlify frontend variables.

The app includes a Netlify SPA redirect so client-side React Router routes resolve correctly.

## Domain and email

The production website is:

```text
https://artnovax.org
```

DNS is managed in AWS Route 53.

Transactional email is sent from the dedicated Resend subdomain:

```text
mail.artnovax.org
```

Human-facing mailboxes remain on the root domain, including:

```text
notifications@artnovax.org
admin@artnovax.org
```

## Security

A few rules are non-negotiable:

- never commit `.env` files or secret API keys
- never expose Supabase privileged keys in the frontend
- never expose the Paystack secret key in the frontend
- never expose Resend credentials in the frontend
- never expose `CRON_SECRET` in the frontend
- validate payment amounts server-side
- retrieve canonical product prices from the database
- verify Paystack webhook signatures
- verify Paystack amount, currency, reference and metadata before settlement
- never mark a manual M-Pesa order paid from a customer-submitted reference alone
- never request or store a customer's M-Pesa PIN
- escape user-provided values before inserting them into HTML emails
- use Row Level Security for direct database access
- route privileged public workflows through Edge Functions
- keep test and production credentials separate
- rotate any credential that has ever been exposed publicly

## Development workflow

Keep changes focused and review the resulting diff before committing.

A typical branch workflow is:

```powershell
git switch main
git pull origin main
git switch -c feature-name
```

Before committing frontend changes:

```powershell
cd frontend
yarn build
```

When an Edge Function changes, deploy that function after the code change:

```powershell
npx supabase functions deploy FUNCTION_NAME
```

When a shared Edge Function dependency changes, redeploy all functions that use it.

After merging:

```powershell
git switch main
git pull origin main
```

Delete the local feature branch when it is no longer needed:

```powershell
git branch -d feature-name
```

## Before a production payment release

Check the full path rather than only the UI:

- frontend production build succeeds
- Supabase migrations are applied
- RLS policies are enabled and tested
- Paystack test checkout works for shop orders
- Paystack test checkout works for donations
- callback verification succeeds
- webhook verification succeeds
- manual M-Pesa orders remain pending until staff confirmation
- paid-order and donation emails are delivered
- public form emails are delivered
- the Resend sending domain is verified
- event registrations and calendar links work
- scheduled event reminders execute successfully
- a controlled low-value production payment is tested before wider release

## License

Copyright © ArtNovaX Mental Health Foundation.

All rights reserved unless otherwise stated.
