-- Apply to the separate Supabase project. No customer records are seeded.
begin;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  full_name text check (full_name is null or length(btrim(full_name)) > 0),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_email_unique unique (email)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'partially_refunded', 'refunded', 'failed')),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  -- Integer minor units: paise for INR. The server calculates these amounts.
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0 and discount_minor <= subtotal_minor),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  total_minor bigint generated always as (subtotal_minor - discount_minor + shipping_minor + tax_minor) stored,
  contact_email text not null check (contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  -- Preserve the delivery details at the time of purchase.
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  payment_provider text,
  payment_reference text,
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_payment_reference_unique unique (payment_provider, payment_reference),
  constraint orders_payment_reference_pair check ((payment_provider is null) = (payment_reference is null))
);

create index orders_customer_created_idx on public.orders (customer_id, created_at desc);
create index orders_status_created_idx on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sku text not null check (length(btrim(sku)) > 0),
  product_name text not null check (length(btrim(product_name)) > 0),
  pack_size integer not null check (pack_size > 0),
  quantity integer not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint generated always as (quantity::bigint * unit_price_minor) stored,
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

create function public.sukoona_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.sukoona_set_updated_at() from public, anon, authenticated;

create trigger customers_set_updated_at before update on public.customers
for each row execute function public.sukoona_set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.sukoona_set_updated_at();

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- No browser policies: customer and order data is private by default.
revoke all on public.customers, public.orders, public.order_items from public, anon, authenticated;
grant select, insert, update, delete on public.customers, public.orders, public.order_items to service_role;

comment on table public.customers is 'Private customer records; server-only access.';
comment on table public.orders is 'Private order records. Checkout must create orders and items in one transaction and verify payment webhooks.';
comment on table public.order_items is 'Purchased product and price snapshots; server-only access.';

commit;
