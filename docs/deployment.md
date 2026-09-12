# Sukoona deployment

## Services

- Source repository: https://github.com/ceo-office-code/Sukoona
- Website: Vercel, using the Next.js preset and the repository root.
- Primary domain: https://sukoona.com; redirect www.sukoona.com to the primary domain.
- DNS registrar: GoDaddy. Keep DNS there and use the exact records Vercel provides for this project.
- Customer and order database: a separate Supabase PostgreSQL project.

## Provisioned services

Provisioned on 12 September 2026:

- Vercel project: `sukoona` in `captaincool01s-projects`.
- Production deployment: https://sukoona.vercel.app.
- Supabase project: `xajceyonhqbiegixjgjy`, in the `Growwstack` organization (Singapore).
- Database dashboard: https://supabase.com/dashboard/project/xajceyonhqbiegixjgjy.
- Migration `20260912000000` has been applied. The SQL access/constraint checks pass against both temporary PostgreSQL and the hosted project; test records were rolled back.
- GoDaddy DNS: `A @ 76.76.21.21` and `CNAME www 86bdb028af2d879e.vercel-dns-016.com`, with a one-hour TTL. Vercel validates both records. The apex uses its supported single-address option; the dashboard may recommend its newer pair of addresses as an optional update.
- The Vercel project redirects `www.sukoona.com` to `sukoona.com` with HTTP 308.
- `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are configured for production in Vercel. The database key is stored as a Secret and is absent from this repository.
- HTTPS is active for both domains. The homepage, a journal article and the www redirect were verified publicly.
- The code is pushed to GitHub `main`. Vercel's Git integration still needs browser authorization for the `ceo-office-code` GitHub account; CLI production deployments work.

## Website

Run `npm ci`, `npm run lint` and `npm run build` before publishing. Import the GitHub repository into Vercel, or link this directory using `npx vercel`. Set the production branch to `main`. Deploy with `npx vercel --prod` when using the CLI.

Set `NEXT_PUBLIC_SITE_URL=https://sukoona.com` for production. The production code also uses this origin as its default. Preview builds should keep production canonical links and remain protected from indexing through Vercel's preview controls.

Git integration requires the Vercel GitHub app to have access to this repository. Once connected, pushes to `main` deploy automatically.

## Domain

Add `sukoona.com` and `www.sukoona.com` to the Vercel project. Configure the www entry to redirect to the apex. Inspect Vercel's domain status and copy its current required A/CNAME/TXT values into GoDaddy's DNS manager. Replace only conflicting web-hosting records. Preserve mail records and unrelated verification records.

Verify both HTTPS addresses, the www redirect, a blog article, `/sitemap.xml` and `/robots.txt` after DNS resolves. DNS records are project-specific; do not copy an old IP or CNAME from a tutorial.

## Database

1. Sign in with `npx supabase login` and select the user's organization.
2. Create a dedicated project named `sukoona` in a suitable nearby region. Use an available free project unless a paid plan is already authorized. Keep the generated database password in a password manager.
3. Link with `npx supabase link --project-ref <project-ref>`.
4. Review pending changes using `npx supabase db push --dry-run`, then apply with `npx supabase db push`.
5. Verify that all three tables exist, row-level security is enabled and `anon` and `authenticated` have no table privileges. Before using real data, run `supabase/tests/customers_orders.sql` against a disposable test database using `psql --set ON_ERROR_STOP=1 --file supabase/tests/customers_orders.sql`. All test inserts are rolled back.

The migration defines customers, orders and order items. Email addresses are normalized and unique. Money is stored in integer minor units, with generated order and line totals. Orders keep delivery and product snapshots. An idempotency key prevents the same checkout request from creating duplicate orders.

There are no public read or write policies. Browser and customer-session roles cannot read these tables. When checkout is implemented, use a server-only Supabase client with `SUPABASE_URL` and `SUPABASE_SECRET_KEY` stored in Vercel's encrypted environment settings. Never prefix the secret key with `NEXT_PUBLIC_` or commit it. These reserved settings are not read by the current website.

The checkout implementation must validate addresses and prices on the server, insert orders and their items atomically, verify subtotal against item totals, and verify payment-provider webhooks before marking an order paid. Payment credentials and card data do not belong in these tables. Customer account access would require separate ownership policies.

The database foundation does not enable checkout, payments or customer registration. The public website remains a product preview until those features are implemented.
