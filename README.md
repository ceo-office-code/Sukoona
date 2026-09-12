# Sukoona website

Next.js 16, React 19, TypeScript and Tailwind CSS 4. The existing project structure and dependencies are preserved.

## Run locally

`npm run dev` opens the development site at http://localhost:3000.
`npm run build` creates the production build; `npm start` serves it.
The existing Google Fonts integration needs network access during an uncached build.

## Experience

- A dark cinematic hero uses the forest Sukoona jar. Scrolling lifts the gold lid, reveals amber gummies and brings in the violet-and-gold backdrop. Scrolling back reverses it.
- The header switch changes the surrounding website between dark and light themes and stores the preference in this browser. The cinematic hero retains its dark art direction.
- There is one fixed forest label. The previous label picker and large style panel are removed.
- Existing pack preview, botanical cards and FAQ interactions remain. There is no checkout.
- Reduced-motion preferences show the opened composition without the extended scroll sequence.
- The journal has a homepage section, a /blog index, and three complete article routes.

## Editing

- `components/ScrollHero.tsx`: scroll progress and animation layers.
- `app/globals.css`: theme tokens, responsive layout and clipping coordinates.
- `components/SiteHeader.tsx`: navigation and persisted theme control.
- `components/ProductStage.tsx`: forest jar and pack preview.
- `lib/content.ts`: product and FAQ copy.
- `lib/articles.json`: article titles, slugs, excerpts, categories and body sections.
- `app/blog/[slug]/page.tsx`: server-rendered articles, metadata and BlogPosting structured data.

To add an article, append the same data shape to articles.json with a unique slug, then rebuild. The journal cards, generated routes and sitemap update from that list. Dates are in lib/blog.ts.

## Domain and search configuration

Production defaults to `https://sukoona.com`; local development defaults to `http://localhost:3000` and disallows indexing. Override either with `NEXT_PUBLIC_SITE_URL`. This controls canonical links, structured-data URLs and sitemap.xml. Search traffic also depends on public deployment and indexing.

Every article has a unique title, description, canonical URL, visible author/date, headings, readable body content and links to other articles. Unknown article slugs return 404.

## Hosting and customer database

The website targets Vercel, with a separate Supabase PostgreSQL database for customers, orders and order items. The database migration is in `supabase/migrations/20260912000000_customers_and_orders.sql`. All three tables enable row-level security and deny access to browser roles; only trusted server operations can access them.

See `docs/deployment.md` for deployment, domain and database setup. The website currently has no checkout or payment integration, so it does not yet write customer or order records. Blog content stays in the repository.

## Assets

public/product/forest.png is the supplied forest packaging image.
public/product/scroll-sprite.png is a 1024 × 1536 PNG with real transparency, containing separate lid, gummy and jar bands.
public/product/scroll-energy.png is a 1672 × 941 cinematic background.
The sprite and background were generated with the built-in imagegen tool. Prompts are recorded in docs/scroll-artwork-prompts.md. Original images remain unchanged.

The unused older coral, midnight and collection images remain available as source assets, but are not shown as customer choices.

## Content status

The site retains the original project's product-preview status and explicitly identified placeholder botanical entries. Blog articles offer general everyday ideas and label-reading guidance; they do not assert a Sukoona formulation, dosage or health benefit.

## Lead capture and admin

The /admin workspace manages website enquiries, assignments, follow-ups, activity notes, archives, reports and CSV exports. Public forms are at /contact, with consent and WhatsApp continuation. See docs/admin-workspace.md for access, workflow, reporting definitions, testing and email delivery setup.
