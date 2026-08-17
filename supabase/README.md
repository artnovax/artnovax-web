# Website Supabase setup

Run the SQL scripts in **Supabase Dashboard → SQL Editor** in this order. Each feature is intentionally one self-contained SQL script containing its table changes and RLS policies.

1. `sql/00_admin_auth.sql`
2. `sql/01_events.sql`
3. `sql/02_volunteer.sql`
4. `sql/03_articles.sql`
5. `sql/04_founders.sql`
6. `sql/05_newsletter.sql`
7. `sql/06_app_waitlist.sql`
8. `sql/07_contact.sql`
9. `sql/08_partners.sql`
10. `sql/09_products.sql`
11. `sql/10_payments.sql`
12. `sql/11_mpesa.sql`
13. `sql/12_email_delivery.sql`
14. `sql/13_email_workflows.sql`
15. `sql/14_lockdown_public_submissions.sql`
16. `sql/15_media_library.sql`
17. `sql/16_event_media.sql`
18. `sql/17_team_media.sql`
19. `sql/18_article_hero_media.sql`
20. `sql/19_article_inline_media.sql`
21. `sql/20_product_gallery.sql`
22. `sql/21_newsletter_issues.sql`
23. `sql/22_page_sections.sql`

The Media Library is introduced in `15_media_library.sql`. Run
`16_event_media.sql` afterward to let events reference library posters and to
prevent deletion of poster images that are still attached to an event.
Run `17_team_media.sql` to provide the same library selection and deletion
protection for team photographs.
Run `18_article_hero_media.sql` to connect article hero images to the library
and protect heroes that are still attached to an article.
Run `19_article_inline_media.sql` to protect library images inserted into an
article body while retaining legacy URL-based image blocks.
Run `20_product_gallery.sql` to add ordered product galleries with one primary
image and deletion protection for every attached media asset.
Run `21_newsletter_issues.sql` to add draft/published newsletter archive issues,
protected library hero images, and staff-only draft preview access. This script
does not send email to subscribers.
Run `22_page_sections.sql` to add reusable public page-content rows. The
homepage, About page, Our Work page, Events landing page, Research landing
page, ArtNovaX App landing page, Get Involved overview, Contact page, and Shop
landing page use this foundation.
The Support and donation page also uses this foundation; Stripe checkout
configuration remains separate and system-controlled.
The Volunteer landing and shared application-screen copy use this foundation;
role records, custom questions, and applications remain in their existing tables.
Library hero and programme-card images are protected
from deletion while attached.

## First admin

Create the user in **Authentication → Users**. Then run this once, replacing the email:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id) do update set role = excluded.role;
```

Admin/editor accounts authenticate at `/admin` with their Supabase Auth email/password. The old shared `ADMIN_TOKEN` is no longer used by the React CMS.

## Migrate existing local Mongo content

Keep the local Mongo container running and put `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`. Then, from `backend/` with the venv active:

```powershell
python scripts/migrate_website_to_supabase.py
```

The script migrates/upserts events, registrations, volunteer roles/applications, articles, founders, newsletter subscribers, legacy app-waitlist signups, contact messages, partner inquiries and products.

## Runtime boundary after this migration

Supabase now handles: events/registrations, volunteer roles/applications, articles, founders, newsletter, app waitlist, contact, partner inquiries, product catalog and `/admin`.

FastAPI is temporarily still required for checkout/payment flows (Stripe/M-Pesa), donations and transactional/reminder email behavior. Those should move to server-side Supabase Edge Functions before removing the Python backend completely.
