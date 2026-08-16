# ArtNovaX Website

Official website for the ArtNovaX Mental Health Foundation.

ArtNovaX combines art, mental wellbeing, community programming, and technology to create accessible spaces for expression, connection, and support.

## Architecture

The website uses a serverless architecture.

```text
React + Tailwind CSS
        |
        v
Supabase
├── PostgreSQL
├── Auth
├── Row Level Security
├── Database RPCs
├── Cron
└── Edge Functions
    ├── Stripe payments
    ├── M-Pesa / Daraja
    ├── Resend transactional email
    └── public form workflows

Netlify
└── frontend hosting

AWS Route 53
└── artnovax.org DNS
```

There is no standalone application server or MongoDB dependency.

## Repository Layout

```text
artnovax-web/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── .env.example
│
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   ├── create-donation-checkout/
│   │   ├── create-order-checkout/
│   │   ├── mpesa-callback/
│   │   ├── mpesa-status/
│   │   ├── mpesa-stk/
│   │   ├── public-submission/
│   │   ├── send-event-reminders/
│   │   ├── stripe-webhook/
│   │   └── verify-order-checkout/
│   │
│   ├── sql/
│   └── config.toml
│
├── package.json
├── package-lock.json
└── README.md
```

## Tech Stack

### Frontend

- React
- React Router
- Tailwind CSS
- Lucide React
- Supabase JavaScript client

### Backend Services

- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security
- Supabase Database RPCs
- Supabase Edge Functions
- Supabase Cron

### External Integrations

- Stripe
- Safaricom Daraja / M-Pesa
- Resend
- Netlify
- AWS Route 53

## Local Development

### Requirements

- Node.js 20+
- Yarn 1.x
- npm

Install the Supabase CLI dependency from the repository root:

```powershell
npm install
```

Install frontend dependencies:

```powershell
cd frontend
yarn install
```

Create the frontend environment file:

```powershell
Copy-Item .env.example .env
```

Configure:

```env
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Start the frontend:

```powershell
yarn start
```

The local development site runs at:

```text
http://localhost:3000
```

## Production Build

```powershell
cd frontend
yarn build
```

## Supabase

Link the repository to the ArtNovaX Supabase project:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Database schema definitions are stored in:

```text
supabase/sql/
```

Edge Functions are stored in:

```text
supabase/functions/
```

Deploy an Edge Function with:

```powershell
npx supabase functions deploy FUNCTION_NAME --use-api
```

## Required Edge Function Secrets

Sensitive production configuration is stored using Supabase-managed secrets.

### Stripe

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

### M-Pesa / Daraja

```text
MPESA_ENV
MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
MPESA_SHORTCODE
MPESA_PASSKEY
```

### Resend

```text
RESEND_API_KEY
FROM_EMAIL
REPLY_TO_EMAIL
TEAM_EMAIL
```

Recommended email configuration:

```text
FROM_EMAIL=ArtNovaX <notifications@mail.artnovax.org>
REPLY_TO_EMAIL=notifications@artnovax.org
TEAM_EMAIL=admin@artnovax.org
```

`mail.artnovax.org` is used as the transactional sending subdomain.

`notifications@artnovax.org` is a real mailbox that can receive replies to transactional messages.

`admin@artnovax.org` receives internal website notifications.

### Scheduled Jobs

```text
CRON_SECRET
```

Set a secret with:

```powershell
npx supabase secrets set KEY="VALUE"
```

Never store secret API keys in frontend environment variables or commit them to Git.

## Payments

### Stripe

Stripe Checkout sessions are created server-side through Supabase Edge Functions.

The Stripe webhook is the source of truth for successful card payments.

Webhook endpoint:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Production and test Stripe credentials are separate.

Production deployments must use the live Stripe secret key and the signing secret associated with the live webhook endpoint.

### M-Pesa

M-Pesa STK Push is initiated server-side through the Safaricom Daraja API.

The user's M-Pesa PIN is entered only in the Safaricom prompt on their phone.

ArtNovaX never requests, receives, or stores a user's M-Pesa PIN.

Successful Daraja callbacks update the corresponding order in Supabase.

The environment is controlled through:

```text
MPESA_ENV=sandbox
```

or:

```text
MPESA_ENV=production
```

Production credentials must be obtained through Safaricom's Daraja go-live process.

## Transactional Email

Transactional email is delivered through Resend from Supabase Edge Functions.

The production email architecture is:

```text
ArtNovaX Edge Function
        |
        v
Resend
        |
        +--> From:
        |    notifications@mail.artnovax.org
        |
        +--> Reply-To:
        |    notifications@artnovax.org
        |
        +--> Customer / applicant / donor
        |
        └--> Internal notification
             admin@artnovax.org
```

Transactional email workflows include:

- order received confirmations
- payment confirmations
- donation acknowledgements
- contact form acknowledgements
- contact form team notifications
- partnership inquiry acknowledgements
- partnership team notifications
- volunteer application acknowledgements
- volunteer team notifications
- event registration confirmations
- event waitlist confirmations
- event registration team notifications
- scheduled event reminders

Email delivery timestamps and errors are persisted in PostgreSQL to make delivery observable and reduce duplicate sends.

## Public Form Workflows

Public forms are submitted through the `public-submission` Edge Function.

Supported workflows include:

```text
Contact Form
        |
        v
public-submission
        |
        +--> contact_messages
        +--> sender acknowledgement
        └--> team notification
```

```text
Partnership Inquiry
        |
        v
public-submission
        |
        +--> partner_inquiries
        +--> applicant acknowledgement
        └--> team notification
```

```text
Volunteer Application
        |
        v
public-submission
        |
        +--> volunteer_applications
        +--> applicant acknowledgement
        └--> team notification
```

```text
Event Registration
        |
        v
public-submission
        |
        v
register_for_event RPC
        |
        +--> confirmed / waitlist registration
        +--> participant email
        └--> team notification
```

The browser should not contain Resend credentials, Supabase secret keys, Stripe secret keys, or Daraja credentials.

## Event Reminders

Upcoming event reminders are processed through the `send-event-reminders` Edge Function.

Supabase Cron invokes the function periodically.

The reminder function:

1. Finds upcoming events.
2. Finds confirmed registrations.
3. Determines whether a configured reminder window has been reached.
4. Sends the reminder through Resend.
5. Records which reminder windows have already been sent.

The function is protected by:

```text
CRON_SECRET
```

## Admin Dashboard

The `/admin` interface uses Supabase Auth and Row Level Security.

Authorized ArtNovaX staff can manage website content and review operational data including:

- events
- event registrations
- volunteer roles
- volunteer applications
- articles
- founders
- products
- orders
- donations
- contact messages
- partnership inquiries
- newsletter subscribers
- app waitlist entries

Admin authorization must be enforced by Supabase Auth and database policies rather than client-side checks alone.

## Deployment

The React frontend is deployed through Netlify.

Recommended Netlify build configuration:

```text
Base directory: frontend
Build command: yarn build
Publish directory: build
```

The production frontend only requires:

```text
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_PUBLISHABLE_KEY
```

Sensitive Stripe, M-Pesa, Resend, Cron, and Supabase privileged credentials belong in Supabase, not Netlify.

The frontend includes a Netlify SPA redirect rule so React Router URLs resolve to the application entry point.

## Domain and DNS

The production domain is:

```text
artnovax.org
```

DNS is managed through AWS Route 53.

### Website

Route 53 directs the public website domain to Netlify.

### Email

Transactional email is sent through the dedicated Resend subdomain:

```text
mail.artnovax.org
```

Resend DNS records for SPF and DKIM are configured within the existing `artnovax.org` Route 53 hosted zone.

Human-facing mailboxes remain on the root domain, including:

```text
notifications@artnovax.org
admin@artnovax.org
```

## Security

- Never commit `.env` files.
- Never expose Supabase secret keys in the frontend.
- Never expose Stripe secret keys in the frontend.
- Never expose Daraja credentials in the frontend.
- Never expose Resend API keys in the frontend.
- Never expose `CRON_SECRET` in the frontend.
- Validate prices and payment amounts server-side.
- Retrieve canonical product prices from the database before creating payment sessions.
- Verify Stripe webhook signatures before changing payment state.
- Treat successful M-Pesa callbacks as the authoritative source for M-Pesa payment completion.
- Never request a user's M-Pesa PIN.
- Escape user-provided data before inserting it into HTML email templates.
- Use Row Level Security for database access.
- Route privileged public workflows through Edge Functions.
- Keep production secrets in managed secret stores.
- Rotate any credential that has ever been committed publicly.
- Keep production and sandbox payment credentials separate.

## Repository Visibility

The production application source repository should normally remain private unless ArtNovaX intentionally chooses to open-source the website.

Making the repository private does not replace proper application security.

The deployed website remains publicly accessible even when its GitHub repository is private.

Netlify must retain GitHub App access to the private repository for automatic deployments.

## Development Workflow

Use short-lived feature branches and merge changes through pull requests.

Example:

```powershell
git switch main
git pull origin main
git switch -c feature-name
```

Before merging frontend changes:

```powershell
cd frontend
yarn build
```

For Edge Function changes:

```powershell
npx supabase functions deploy FUNCTION_NAME --use-api
```

Test the complete affected workflow before merging.

After merging:

```powershell
git switch main
git pull origin main
```

Delete the local feature branch when it is no longer needed:

```powershell
git branch -d feature-name
```

## Production Readiness

Before enabling production payments:

- confirm the frontend production build succeeds
- confirm Supabase RLS policies are enabled and tested
- confirm public forms work through Edge Functions
- confirm transactional emails reach both users and the ArtNovaX team
- confirm the Resend sending domain is verified
- confirm event reminders execute successfully
- confirm Stripe test payments work end-to-end
- confirm M-Pesa sandbox payments work end-to-end
- configure a live Stripe webhook
- configure Stripe live credentials
- complete Safaricom Daraja go-live onboarding
- configure production Daraja credentials
- run production smoke tests with controlled low-value transactions

## License

Copyright © ArtNovaX Mental Health Foundation.

All rights reserved unless otherwise stated.