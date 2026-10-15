# ArtNovaX Website

This repository contains the public website and internal CMS for **ArtNovaX Mental Health Foundation**.

ArtNovaX works at the intersection of art, mental wellbeing, community programmes, research and technology. The website supports that work through event registration and operations, volunteer and partnership applications, donations, merchandise, newsletters, research content, media management and permission-controlled staff workflows.

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

│   ├── public/

│   ├── src/

│   │   ├── components/

│   │   ├── pages/

│   │   ├── services/

│   │   ├── config/

│   │   └── mock*.js

│   ├── package.json

│   └── .env.example

│

├── supabase/

│   ├── functions/

│   │   ├── _shared/

│   │   ├── create-order-checkout/

│   │   ├── create-donation-checkout/

│   │   ├── verify-order-checkout/

│   │   ├── verify-donation-checkout/

│   │   ├── paystack-webhook/

│   │   ├── submit-manual-payment-reference/

│   │   ├── confirm-manual-payment/

│   │   ├── public-submission/

│   │   ├── newsletter-subscribe/

│   │   ├── send-newsletter/

│   │   └── send-event-reminders/

│   ├── sql/

│   └── config.toml

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

From \`frontend/\`:

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

If a shared file under \`supabase/functions/_shared/\` changes, redeploy every Edge Function that imports it.

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

Do not put the Paystack secret key in \`REACT_APP_*\` variables.

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

Card payments for shop orders and donations are handled through ****Paystack****.

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

- \`create-order-checkout\` creates the pending order.

- Product prices are re-read from the database instead of trusting browser-submitted prices.

- Paystack is initialized with the exact amount in KES.

- \`verify-order-checkout\` verifies the transaction after the customer returns.

- \`paystack-webhook\` independently handles successful \`charge.success\` events.

- The amount, currency, reference and metadata are checked before an order is marked paid.

For donations:

- \`create-donation-checkout\` creates the pending donation.

- \`verify-donation-checkout\` verifies the returned Paystack transaction.

- \`paystack-webhook\` can also settle the donation.

The Paystack webhook endpoint is:

```text

https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook

```

### M-Pesa

M-Pesa currently uses a ****manual Paybill verification flow**** rather than STK Push.

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

A customer-submitted transaction code is ****not**** treated as proof of payment.

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

- an \`.ics\` attachment for Apple Calendar or Outlook

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

Subscribers are stored in Supabase and synchronized with a Resend Segment. New signup forms collect an email address and may also collect an optional first name. The name is stored on the subscriber record and synchronized to Resend for personalization.

Existing subscribers who joined before first-name collection remain valid. Their name can stay null, and newsletter templates use a safe generic fallback rather than requiring a migration or forcing them to subscribe again. If an existing subscriber later submits the same email with a name, the existing record is updated rather than duplicated.

Published issues can be sent from the admin dashboard through:

```text
send-newsletter
```

The newsletter workflow:

1. claims the issue so it cannot be sent twice
2. synchronizes subscriber email and available first-name data
3. creates a Resend Broadcast
4. personalizes the greeting when a first name is available and uses a generic fallback otherwise
5. includes Resend's managed unsubscribe link
6. queues the broadcast
7. stores delivery metadata on the newsletter issue

Newsletter sending is an admin-only action enforced by the backend.

The required Resend segment ID is stored in:

```text
RESEND_NEWSLETTER_SEGMENT_ID
```
## Public forms

Public submissions go through the \`public-submission\` Edge Function instead of writing directly to privileged database tables from the browser.

It currently handles:

- contact messages

- partnership inquiries

- volunteer applications

- event registrations

The function stores the submission, sends the appropriate acknowledgement, and sends an internal notification when required.

Event registration also uses the \`register_for_event\` database RPC to handle confirmed and waitlisted registrations.

## Event operations and reminders

Operational event management lives under:

```text
/admin/events
```

The CMS event selector prioritizes upcoming events, then shows the most recent past events through the oldest. Past events remain available for attendance, reporting, feedback and registrant communication workflows.

Staff with the appropriate event permissions can:

- review confirmed, waitlisted and cancelled registrations
- manage attendance and add walk-ins
- configure registration and feedback questions
- finalize attendance
- review feedback and download event data
- configure scheduled reminder windows

Upcoming event reminders are handled by:

```text
send-event-reminders
```

Supabase Cron calls the function periodically. It checks upcoming events and confirmed registrations, determines whether a configured reminder window has been reached, sends the email and records the reminder so it is not sent twice. The scheduled endpoint is protected by `CRON_SECRET`.

Administrators can also send a one-time message to selected **currently confirmed** registrants for any event, including past events, through:

```text
send-event-registrant-email
```

The admin composes one message, can include or omit individual confirmed registrants, and the backend sends separate private emails to each selected recipient. Supported personalization fields include:

```text
{{first_name}}
{{full_name}}
{{event_title}}
{{event_date}}
{{event_location}}
```

The function revalidates event membership and confirmed registration status before delivery and records campaign/delivery history. This send capability is admin-only and enforced by the backend.
## Content and research

Most public pages have bundled default content in the frontend, including:

```text

frontend/src/mock.js

frontend/src/mock_pages.js

frontend/src/mock_pages2.js

```

Research & Insights articles live in the Supabase \`articles\` table and are managed from the Articles tab in \`/admin\`. The public research library and article detail pages read published article rows directly from Supabase.

Article bodies are stored as structured JSON blocks, including headings, paragraphs, images, quotes and source lists. This keeps article content editable without requiring a frontend deployment.

Research articles should:

- use plain language

- distinguish creative wellbeing from clinical treatment

- avoid overstating evidence

- link to the primary or publisher source where possible

- make uncertainty and study limitations clear

## Admin dashboard

The `/admin` area uses Supabase Auth with database-backed role and permission authorization.

The CMS includes areas for:

- media
- website page content
- events and Event Operations
- registrations and attendance
- volunteer roles and Volunteer Operations
- volunteer applications
- research articles
- founders and team content
- products
- shop orders and payment review
- donations
- contact messages
- partnership inquiries
- newsletter issues and subscribers
- app waitlist entries
- staff Access Control

### Staff access control

Roles act as permission templates, with per-user overrides available when a staff member needs narrower or temporary access. Administrators can review effective permissions, assign roles, temporarily grant or deny eligible permissions, set access expiry and block or restore CMS access.

Staff onboarding is handled through Supabase Auth invitations. Invited users set their own password through the `/admin/setup-password` flow; administrators do not need to know or create a staff member's password.

Publishing and other high-impact actions remain admin-only. This includes public content publication, newsletter sending, destructive content actions and payment confirmation. Non-admin staff can be given operational or draft-management permissions without gaining publication rights.

Authorization for privileged actions must be enforced in RLS, RPCs or Edge Functions. Hiding a control in React is never treated as the security boundary.
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

- never commit \`.env\` files or secret API keys

- never expose Supabase privileged keys in the frontend

- never expose the Paystack secret key in the frontend

- never expose Resend credentials in the frontend

- never expose \`CRON_SECRET\` in the frontend

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
