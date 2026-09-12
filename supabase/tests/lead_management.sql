begin;
do $$
declare t text; f record;
begin
 foreach t in array array['crm_members','crm_sessions','crm_leads','crm_submissions','crm_activities','crm_events','crm_settings','crm_rate_limits'] loop
 if not (select relrowsecurity from pg_class where oid=('public.'||t)::regclass) then raise exception 'RLS missing: %',t; end if;
 if has_table_privilege('anon','public.'||t,'SELECT') or has_table_privilege('authenticated','public.'||t,'SELECT') then raise exception 'Browser access: %',t; end if;
 end loop;
 for f in select oid from pg_proc where pronamespace='public'::regnamespace and proname like 'crm_%' loop
 if has_function_privilege('anon',f.oid,'EXECUTE') or has_function_privilege('authenticated',f.oid,'EXECUTE') then raise exception 'Public RPC access'; end if;
 end loop;
end; $$;
set local role service_role;
do $$
declare boss uuid; agent1 uuid; agent2 uuid; lead uuid; result jsonb; payload jsonb; request uuid:=gen_random_uuid(); action uuid:=gen_random_uuid(); v integer; purchase uuid; customer uuid;
begin
 insert into public.crm_members(email,name,role) values ('crm-owner@example.invalid','QA Owner','owner') returning id into boss;
 insert into public.crm_members(email,name,role) values ('crm-agent1@example.invalid','QA Agent 1','agent') returning id into agent1;
 insert into public.crm_members(email,name,role) values ('crm-agent2@example.invalid','QA Agent 2','agent') returning id into agent2;
 payload:=jsonb_build_object('request_id',request,'name','QA lead','phone','+919000000001','email','crm-lead@example.invalid','city','Test','inquiry','product','pack','10','source','enquiry','consent',true,'message','Test message');
 result:=public.crm_capture_lead(payload);lead:=(result->>'lead_id')::uuid;
 perform public.crm_capture_lead(payload);
 if (select submission_count from public.crm_leads where id=lead)<>1 then raise exception 'Retry duplicated submission'; end if;
 begin perform public.crm_capture_lead(payload||'{"name":"Changed"}'); raise exception 'Idempotency accepted different data'; exception when others then if sqlerrm<>'idempotency_conflict' then raise; end if; end;
 payload:=payload||jsonb_build_object('request_id',gen_random_uuid(),'message','Repeat enquiry');
 perform public.crm_capture_lead(payload);
 if (select submission_count from public.crm_leads where id=lead)<>2 or (select count(*) from public.crm_leads where id=lead)<>1 then raise exception 'Phone dedupe failed'; end if;
 result:=public.crm_update_lead(lead,boss,2,jsonb_build_object('assignee_id',agent1,'kind','assignment'),action);
 perform public.crm_update_lead(lead,boss,2,jsonb_build_object('assignee_id',agent1,'kind','assignment'),action);
 if (select version from public.crm_leads where id=lead)<>3 then raise exception 'Update retry duplicated'; end if;
 begin perform public.crm_update_lead(lead,agent2,3,'{"stage":"contacted"}',gen_random_uuid()); raise exception 'Agent scope failed'; exception when others then if sqlerrm<>'not_found' then raise; end if; end;
 begin perform public.crm_update_lead(lead,boss,2,'{"stage":"contacted"}',gen_random_uuid()); raise exception 'Stale edit accepted'; exception when others then if sqlerrm<>'version_conflict' then raise; end if; end;
 begin perform public.crm_update_lead(lead,agent1,3,jsonb_build_object('assignee_id',agent2),gen_random_uuid()); raise exception 'Agent reassigned'; exception when others then if sqlerrm<>'manager_required' then raise; end if; end;
 begin perform public.crm_update_lead(lead,boss,3,'{"stage":"dnd"}',gen_random_uuid()); raise exception 'DND no reason accepted'; exception when others then if sqlerrm<>'reason_required' then raise; end if; end;
 begin perform public.crm_update_lead(lead,boss,3,'{"stage":"won"}',gen_random_uuid()); raise exception 'Won without paid order'; exception when others then if sqlerrm<>'paid_order_required' then raise; end if; end;
 perform public.crm_update_lead(lead,agent1,3,jsonb_build_object('kind','follow_up','stage','follow_up','follow_up_at',now()+interval '1 day'),gen_random_uuid());
 perform public.crm_update_lead(lead,agent1,4,'{"kind":"call","note":"Customer asked for a callback","outcome":"callback_requested"}',gen_random_uuid());
 if (select follow_up_at from public.crm_leads where id=lead) is null then raise exception 'Call lost reminder'; end if;
 perform public.crm_update_lead(lead,boss,5,'{"stage":"dnd","lost_reason":"Customer withdrew consent"}',gen_random_uuid());
 if (select follow_up_at from public.crm_leads where id=lead) is not null then raise exception 'DND retained reminder'; end if;
 begin perform public.crm_update_lead(lead,agent1,6,'{"stage":"new"}',gen_random_uuid()); raise exception 'Agent reopened DND'; exception when others then if sqlerrm<>'manager_required' then raise; end if; end;
 payload:=payload||jsonb_build_object('request_id',gen_random_uuid());perform public.crm_capture_lead(payload);
 if (select stage from public.crm_leads where id=lead)<>'dnd' then raise exception 'Repeat enquiry changed DND'; end if;
 perform public.crm_update_lead(lead,boss,7,'{"kind":"archive","archived":true}',gen_random_uuid());
 if (select archived_at from public.crm_leads where id=lead) is null then raise exception 'Archive failed'; end if;
 perform public.crm_update_lead(lead,boss,8,'{"kind":"archive","archived":false}',gen_random_uuid());
 if (select archived_at from public.crm_leads where id=lead) is not null then raise exception 'Restore failed'; end if;
 insert into public.customers(email,full_name,phone) values ('crm-order@example.invalid','QA buyer','+12025550199') returning id into customer;
 insert into public.orders(customer_id,contact_email,shipping_address,subtotal_minor,idempotency_key,status,payment_status) values(customer,'crm-order@example.invalid','{}',1000,gen_random_uuid(),'confirmed','paid') returning id into purchase;
 begin perform public.crm_update_lead(lead,boss,9,jsonb_build_object('stage','won','order_id',purchase),gen_random_uuid()); raise exception 'Unrelated order linked'; exception when others then if sqlerrm<>'order_contact_mismatch' then raise; end if; end;
 update public.orders set contact_email='crm-lead@example.invalid' where id=purchase;
 perform public.crm_update_lead(lead,boss,9,jsonb_build_object('stage','won','order_id',purchase),gen_random_uuid());
 if (select customer_id from public.crm_leads where id=lead) is distinct from customer then raise exception 'Customer was not linked'; end if;
 if (public.crm_overview(agent2)->>'total')::int<>0 then raise exception 'Overview leaked other agent data'; end if;
 if not public.crm_rate_limit('qa-limit',2,3600) or not public.crm_rate_limit('qa-limit',2,3600) or public.crm_rate_limit('qa-limit',2,3600) then raise exception 'Rate limit failed'; end if;
end; $$;
rollback;
