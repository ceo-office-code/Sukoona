begin;
create table public.crm_members (
 id uuid primary key default gen_random_uuid(), email text not null unique check(email=lower(btrim(email))),
 name text not null, role text not null check(role in ('owner','manager','agent')),
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.crm_sessions (
 token_hash text primary key, member_id uuid not null references public.crm_members(id) on delete cascade,
 expires_at timestamptz not null, created_at timestamptz not null default now()
);
create index crm_sessions_expiry on public.crm_sessions(expires_at);
create table public.crm_leads (
 id uuid primary key default gen_random_uuid(), name text not null, phone text not null unique,
 email text, city text, inquiry text not null default 'product',
 product text not null default 'Gummy Vati', pack text not null default 'not_sure',
 stage text not null default 'new' check(stage in ('new','contacted','interested','follow_up','won','lost','dnd')),
 priority text not null default 'warm' check(priority in ('hot','warm','cold')),
 source text not null, attribution jsonb not null default '{}',
 consent boolean not null default false, assignee_id uuid references public.crm_members(id),
 follow_up_at timestamptz, last_outcome text, lost_reason text,
 customer_id uuid references public.customers(id), order_id uuid references public.orders(id),
 submission_count integer not null default 1, version integer not null default 1,
 archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now()
);
create index crm_leads_queue on public.crm_leads(assignee_id,follow_up_at) where archived_at is null;
create index crm_leads_recent on public.crm_leads(last_seen_at desc);
create index crm_leads_stage on public.crm_leads(stage,priority);
create table public.crm_submissions (
 id uuid primary key, lead_id uuid not null references public.crm_leads(id) on delete cascade,
 payload jsonb not null, created_at timestamptz not null default now()
);
create index crm_submissions_lead on public.crm_submissions(lead_id,created_at desc);
create table public.crm_activities (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.crm_leads(id) on delete cascade,
 actor_id uuid references public.crm_members(id), kind text not null, note text not null default '',
 metadata jsonb not null default '{}', request_id uuid unique, created_at timestamptz not null default now()
);
create index crm_activities_lead on public.crm_activities(lead_id,created_at desc);
create table public.crm_events (
 id uuid primary key, session_id uuid not null, event text not null check(event in ('page_view','product_view','form_open','whatsapp_click','lead_submitted')),
 page text not null, source text not null default 'direct', medium text, campaign text, referrer text, device text,
 created_at timestamptz not null default now()
);
create index crm_events_date on public.crm_events(created_at desc);
create table public.crm_settings (
 id boolean primary key default true check(id), whatsapp_number text not null default '',
 updated_at timestamptz not null default now()
);
insert into public.crm_settings(id,whatsapp_number) values(true,'917017138349');
create table public.crm_rate_limits (key text primary key, window_start timestamptz not null, hits integer not null);
create function public.crm_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean
language plpgsql set search_path='' as $$
declare v_hits integer; v_start timestamptz;
begin
 v_start:=to_timestamp(floor(extract(epoch from now())/p_seconds)*p_seconds);
 insert into public.crm_rate_limits as r values(p_key,v_start,1)
 on conflict(key) do update set window_start=v_start,hits=case when r.window_start=v_start then r.hits+1 else 1 end
 returning hits into v_hits;
 delete from public.crm_rate_limits where window_start<now()-interval '1 day';
 delete from public.crm_sessions where expires_at<now()-interval '1 day';
 return v_hits<=p_limit;
end; $$;
create function public.crm_capture_lead(p_payload jsonb,p_actor uuid default null) returns jsonb
language plpgsql set search_path='' as $$
declare v_lead public.crm_leads; v_existing public.crm_submissions; v_id uuid; v_new boolean:=false;
begin
 v_id:=(p_payload->>'request_id')::uuid;
 perform pg_advisory_xact_lock(hashtextextended(v_id::text,1));
 select * into v_existing from public.crm_submissions where id=v_id;
 if found then
  if v_existing.payload<>p_payload then raise exception 'idempotency_conflict'; end if;
  return jsonb_build_object('ok',true,'lead_id',v_existing.lead_id,'duplicate',true);
 end if;
 if p_payload->>'phone' !~ '^\+[1-9][0-9]{7,14}$' or (p_payload->>'consent')::boolean is not true then raise exception 'invalid_contact'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_payload->>'phone',0));
 select * into v_lead from public.crm_leads where phone=p_payload->>'phone' for update;
 if not found then
  v_new:=true;
  insert into public.crm_leads(name,phone,email,city,inquiry,pack,source,attribution,consent,assignee_id)
  values(p_payload->>'name',p_payload->>'phone',nullif(p_payload->>'email',''),nullif(p_payload->>'city',''),
   p_payload->>'inquiry',p_payload->>'pack',p_payload->>'source',coalesce(p_payload->'attribution','{}'),true,p_actor)
  returning * into v_lead;
 else
  update public.crm_leads set submission_count=submission_count+1,last_seen_at=now(),updated_at=now(),version=version+1
   where id=v_lead.id returning * into v_lead;
 end if;
 insert into public.crm_submissions(id,lead_id,payload) values(v_id,v_lead.id,p_payload);
 insert into public.crm_activities(lead_id,actor_id,kind,note,metadata)
 values(v_lead.id,p_actor,'enquiry',coalesce(p_payload->>'message',''),jsonb_build_object('source',p_payload->>'source','repeat',not v_new));
 return jsonb_build_object('ok',true,'lead_id',v_lead.id,'duplicate',not v_new);
end; $$;
create function public.crm_update_lead(p_id uuid,p_actor uuid,p_version integer,p_patch jsonb,p_request uuid) returns jsonb
language plpgsql set search_path='' as $$
declare v_lead public.crm_leads; v_actor public.crm_members; v_previous public.crm_activities;
 v_stage text; v_kind text; v_note text; v_order uuid; v_customer uuid;
begin
 select * into v_actor from public.crm_members where id=p_actor and active;
 if not found then raise exception 'forbidden'; end if;
 select * into v_lead from public.crm_leads where id=p_id for update;
 if not found or (v_actor.role='agent' and v_lead.assignee_id is distinct from p_actor) then raise exception 'not_found'; end if;
 select * into v_previous from public.crm_activities where request_id=p_request;
 if found then
  if v_previous.lead_id<>p_id or v_previous.actor_id<>p_actor or v_previous.metadata->'patch'<>p_patch then raise exception 'idempotency_conflict'; end if;
  return to_jsonb(v_lead);
 end if;
 if v_lead.version<>p_version then raise exception 'version_conflict'; end if;
 v_kind:=coalesce(p_patch->>'kind','update'); v_note:=coalesce(p_patch->>'note','');
 v_stage:=coalesce(p_patch->>'stage',v_lead.stage);
 if v_lead.stage in ('won','dnd','lost') and v_stage<>v_lead.stage and v_actor.role='agent' then raise exception 'manager_required'; end if;
 if p_patch?'assignee_id' and v_actor.role='agent' then raise exception 'manager_required'; end if;
 if p_patch?'assignee_id' and nullif(p_patch->>'assignee_id','') is not null and not exists(select 1 from public.crm_members where id=(p_patch->>'assignee_id')::uuid and active) then raise exception 'invalid_assignee'; end if;
 if v_stage in ('lost','dnd') and nullif(btrim(coalesce(p_patch->>'lost_reason',v_lead.lost_reason)),'') is null then raise exception 'reason_required'; end if;
 v_order:=case when p_patch?'order_id' then nullif(p_patch->>'order_id','')::uuid else v_lead.order_id end;
 if v_order is not null then
  select o.customer_id into v_customer from public.orders o join public.customers c on c.id=o.customer_id
   where o.id=v_order and ((v_lead.email is not null and lower(o.contact_email)=lower(v_lead.email)) or regexp_replace(coalesce(c.phone,''),'[^0-9]','','g')=regexp_replace(v_lead.phone,'[^0-9]','','g'));
  if not found then raise exception 'order_contact_mismatch'; end if;
 end if;
 if v_stage='won' and not exists(select 1 from public.orders where id=v_order and status in ('confirmed','processing','shipped','delivered') and payment_status in ('paid','partially_refunded')) then raise exception 'paid_order_required'; end if;
 if v_kind in ('note','call') and length(btrim(v_note))=0 then raise exception 'note_required'; end if;
 update public.crm_leads set
  stage=v_stage,priority=coalesce(p_patch->>'priority',priority),
  assignee_id=case when p_patch?'assignee_id' then nullif(p_patch->>'assignee_id','')::uuid else assignee_id end,
  follow_up_at=case when v_stage in ('won','lost','dnd') then null when p_patch?'follow_up_at' then nullif(p_patch->>'follow_up_at','')::timestamptz else follow_up_at end,
  last_outcome=coalesce(p_patch->>'outcome',last_outcome),
  lost_reason=case when v_stage in ('lost','dnd') then coalesce(p_patch->>'lost_reason',lost_reason) else null end,
  order_id=v_order,customer_id=v_customer,
  archived_at=case when p_patch?'archived' then case when (p_patch->>'archived')::boolean then now() else null end else archived_at end,
  updated_at=now(),version=version+1 where id=p_id returning * into v_lead;
 insert into public.crm_activities(lead_id,actor_id,kind,note,metadata,request_id)
 values(p_id,p_actor,v_kind,v_note,jsonb_build_object('patch',p_patch),p_request);
 return to_jsonb(v_lead);
end; $$;
create function public.crm_overview(p_actor uuid) returns jsonb
language plpgsql set search_path='' as $$
declare v_role text; v_result jsonb; v_start timestamptz:=date_trunc('day',now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
begin
 select role into v_role from public.crm_members where id=p_actor and active;
 if v_role is null then raise exception 'forbidden'; end if;
 select jsonb_build_object(
 'total',count(*),'new',count(*) filter(where stage='new'),
 'interested',count(*) filter(where stage='interested'),'won',count(*) filter(where stage='won'),
 'today',count(*) filter(where created_at>=v_start),
 'overdue',count(*) filter(where follow_up_at<now() and stage not in ('won','lost','dnd')),
 'due_today',count(*) filter(where follow_up_at>=now() and follow_up_at<v_start+interval '1 day'),
 'unassigned',count(*) filter(where assignee_id is null),
 'stages',(select coalesce(jsonb_agg(x),'[]') from (select stage,count(*) as count from public.crm_leads where archived_at is null and (v_role<>'agent' or assignee_id=p_actor) group by stage) x),
 'sources',(select coalesce(jsonb_agg(x),'[]') from (select source,count(*) as count from public.crm_leads where archived_at is null and (v_role<>'agent' or assignee_id=p_actor) group by source order by count(*) desc) x),
 'daily',(select coalesce(jsonb_agg(x),'[]') from (select to_char(created_at at time zone 'Asia/Kolkata','YYYY-MM-DD') as day,count(*) as count from public.crm_leads where created_at>=now()-interval '14 days' and (v_role<>'agent' or assignee_id=p_actor) group by day order by day) x)
 ) into v_result from public.crm_leads where archived_at is null and (v_role<>'agent' or assignee_id=p_actor);
 if v_role<>'agent' then
  v_result:=v_result||jsonb_build_object('visits',(select count(distinct session_id) from public.crm_events where event='page_view' and created_at>=now()-interval '30 days'),
   'views',(select count(*) from public.crm_events where event='page_view' and created_at>=now()-interval '30 days'),
   'whatsapp_clicks',(select count(*) from public.crm_events where event='whatsapp_click' and created_at>=now()-interval '30 days'),
   'customers',(select count(*) from public.customers),'orders',(select count(*) from public.orders));
 end if;
 return v_result;
end; $$;
do $$
declare t text; f record;
begin
 foreach t in array array['crm_members','crm_sessions','crm_leads','crm_submissions','crm_activities','crm_events','crm_settings','crm_rate_limits'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to service_role',t);
 end loop;
 for f in select oid::regprocedure as name from pg_proc where pronamespace='public'::regnamespace and proname in ('crm_rate_limit','crm_capture_lead','crm_update_lead','crm_overview') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.name);
 execute format('grant execute on function %s to service_role',f.name);
 end loop;
end; $$;
commit;
