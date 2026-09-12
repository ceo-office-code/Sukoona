-- Run as postgres in a disposable test database after applying the migration.
-- Fail on errors (psql --set ON_ERROR_STOP=1). No test data is retained.
begin;

do $$
declare
  table_name text;
  role_name text;
  operation text;
begin
  foreach table_name in array array['customers', 'orders', 'order_items'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || table_name)::regclass) then
      raise exception 'RLS disabled on %', table_name;
    end if;
    foreach role_name in array array['anon', 'authenticated'] loop
      foreach operation in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
        if has_table_privilege(role_name, 'public.' || table_name, operation) then
          raise exception 'Unexpected % access to % for %', operation, table_name, role_name;
        end if;
      end loop;
    end loop;
    foreach operation in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
      if not has_table_privilege('service_role', 'public.' || table_name, operation) then
        raise exception 'Missing server % access to %', operation, table_name;
      end if;
    end loop;
  end loop;
end;
$$;

set local role service_role;
do $$
declare
  customer uuid;
  purchase uuid;
  request_key uuid := gen_random_uuid();
  amount bigint;
begin
  insert into public.customers (email, full_name) values ('database-test@example.invalid', 'Database test') returning id into customer;
  insert into public.orders (customer_id, subtotal_minor, discount_minor, shipping_minor, tax_minor, contact_email, shipping_address, idempotency_key)
    values (customer, 20000, 1000, 500, 1800, 'database-test@example.invalid', '{"city":"Test"}', request_key)
    returning id, total_minor into purchase, amount;
  if amount <> 21300 then raise exception 'Incorrect order total'; end if;

  insert into public.order_items (order_id, sku, product_name, pack_size, quantity, unit_price_minor)
    values (purchase, 'TEST-10', 'Test product', 10, 2, 10000) returning line_total_minor into amount;
  if amount <> 20000 then raise exception 'Incorrect item total'; end if;

  begin
    insert into public.orders (customer_id, subtotal_minor, contact_email, shipping_address, idempotency_key)
      values (customer, 20000, 'database-test@example.invalid', '{}', request_key);
    raise exception 'Duplicate checkout was accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.customers (email) values ('database-test@example.invalid');
    raise exception 'Duplicate customer was accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.customers (email) values (' INVALID EMAIL ');
    raise exception 'Invalid email was accepted';
  exception when check_violation then null;
  end;
  begin
    update public.order_items set quantity = 0 where order_id = purchase;
    raise exception 'Zero quantity was accepted';
  exception when check_violation then null;
  end;
  begin
    update public.orders set discount_minor = 20001 where id = purchase;
    raise exception 'Excessive discount was accepted';
  exception when check_violation then null;
  end;
  begin
    update public.orders set subtotal_minor = -1 where id = purchase;
    raise exception 'Negative price was accepted';
  exception when check_violation then null;
  end;
  begin
    delete from public.customers where id = customer;
    raise exception 'Customer with orders was deleted';
  exception when foreign_key_violation or restrict_violation then null;
  end;
  update public.orders set status = 'confirmed', updated_at = '2000-01-01' where id = purchase;
  if (select updated_at from public.orders where id = purchase) <> now() then
    raise exception 'Update timestamp trigger failed';
  end if;
end;
$$;
reset role;

-- Prove RLS still denies reads even if someone accidentally adds SELECT grants.
-- These temporary grants and test rows are rolled back below.
grant select on public.customers, public.orders, public.order_items to anon, authenticated;
set local role anon;
do $$
begin
  if exists (select 1 from public.customers) or exists (select 1 from public.orders) or exists (select 1 from public.order_items) then
    raise exception 'Anonymous role can read private records';
  end if;
end;
$$;
reset role;
set local role authenticated;
do $$
begin
  if exists (select 1 from public.customers) or exists (select 1 from public.orders) or exists (select 1 from public.order_items) then
    raise exception 'Customer session can read private records';
  end if;
end;
$$;
reset role;

rollback;
