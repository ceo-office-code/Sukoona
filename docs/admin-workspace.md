# Sukoona lead workspace

## Daily use
Open https://sukoona.com/admin. The first owner is ceo-office@growwstack.in.
Request a sign-in link and open it in the SAME browser where you requested it.
Links are single use. The workspace session expires after 12 hours.
Unknown and disabled emails cannot access any customer information.

1. Overview shows active lead counts and follow-up reminders.
2. All leads supports name/phone/email search, stage, priority, assignee, source, archive and date filters.
3. Open a lead to assign it, schedule an IST follow-up, log a note or call outcome, archive or restore it.
4. Lost and Do Not Contact require a reason. Terminal stages clear reminders. Agents cannot reopen terminal leads.
5. Won requires an existing confirmed paid order, matched by contact email or customer phone.
6. Export downloads the filtered lead list with CSV formula injection protection. Narrow filters beyond 50,000 rows.
7. Team lets the owner create manager/agent access and disable it immediately.
8. Settings controls the customer WhatsApp destination. Blank disables the link.
9. Customers and Orders display database records. Checkout and payments are not active on this product preview.

## Capture
/contact accepts product, bulk, partnership, callback and privacy enquiries.
Product links carry the selected pack. Journal links preserve their source.
Visitors explicitly consent before submission. WhatsApp opens only after the enquiry has been saved.
The configured WhatsApp destination is +91 70171 38349.
Normalised phone numbers deduplicate leads; each genuine repeat submission is retained.
Retries with the same request ID do not create another submission.
Repeat enquiries preserve agent-edited fields, DND and archive status.

## Access and storage
Supabase stores customers, orders, CRM records and activity. Vercel hosts the Next.js server.
All customer/CRM tables enable RLS and revoke browser-role access.
Only server-side code uses SUPABASE_SECRET_KEY. It must never be prefixed NEXT_PUBLIC.
Admin sessions are random, HttpOnly, Secure in production, SameSite Strict, with SHA-256 hashes in the database.
Email sign-in uses Supabase PKCE with a short-lived HttpOnly SameSite Lax verifier cookie.
Approved callback: https://sukoona.com/api/admin/auth/callback** (suffix permits Supabase flow-id query).
Admin API mutations require a matching Origin and bounded JSON payload.
Database-backed rate limits protect public capture, events and sign-in.
Agents can only read or change assigned leads; managers/owners can see all leads.
Optimistic lead versions reject conflicting edits, and an activity record accompanies each update.

## Email delivery limitation
The current Supabase Free built-in mail service can send only to authorised organisation email addresses and has a low sending limit. The first owner email is the account email.
To enable reliable login for additional team members, configure a custom SMTP provider in Supabase Authentication > Emails > SMTP Settings. Creating CRM membership does not configure email delivery or send an invitation.
No paid email service has been purchased or connected.

## Reporting definitions
- Total / pipeline / sources: non-archived leads, all time.
- New: active leads whose stage is new.
- Today: active leads created since midnight Asia/Kolkata.
- Overdue: active nonterminal leads with follow_up_at before now.
- Upcoming today: scheduled from now to the next IST midnight.
- Daily chart: lead creation over 14 days, including archived records.
- Website sessions: distinct random session IDs on page_view events in the past 30 days.
- WhatsApp clicks: clicks on the customer continuation link, not identified leads.
- Source is the capture entry point; UTM source/medium/campaign/referrer and landing page are stored on each submission.
- Browser storage blocking, ad blockers and request failures can undercount website activity. No third-party ad tracker is installed.

## Validation
- npm run lint
- npm run build
- supabase db query --linked --file supabase/tests/lead_management.sql --output-format json
- node --env-file=.env.local scripts/check-crm.mjs

The SQL suite rolls back all test records. The integration script creates tagged disposable members, sessions and a reserved example phone lead, asserts API behaviour and removes only its own IDs. Run against localhost by default. Live use requires CRM_TEST_URL plus CRM_TEST_ALLOW_LIVE=true.
The owner provisioning script is idempotent and does not send mail:
node --env-file=.env.local scripts/provision-admin.mjs <authorised-email>

## Privacy and operations
The public /privacy page describes capture, activity tracking, service providers and contact choices.
Privacy requests are captured as an enquiry for a verified human response; deletion is not automated.
Activity and submission panels display the latest 200 and 100 entries respectively, explicitly labelled when capped.
The database keeps complete history. Review retention, backups and custom email delivery before expanding operations.

