create table public.support_rate_limits (
  key text primary key,
  window_started timestamptz not null default now(),
  requests integer not null default 1
);
alter table public.support_rate_limits enable row level security;
revoke all on public.support_rate_limits from public,anon,authenticated;
grant all on public.support_rate_limits to service_role;
create function public.support_check_rate(p_key text,p_limit integer)
returns boolean language plpgsql security invoker set search_path = public, pg_temp as $$
declare n integer;
begin
  insert into support_rate_limits(key) values(p_key)
  on conflict(key) do update set
    requests=case when support_rate_limits.window_started<now()-interval '1 minute' then 1 else support_rate_limits.requests+1 end,
    window_started=case when support_rate_limits.window_started<now()-interval '1 minute' then now() else support_rate_limits.window_started end
  returning requests into n;
  return n<=p_limit;
end $$;
revoke all on function public.support_check_rate(text,integer) from public,anon,authenticated;
grant execute on function public.support_check_rate(text,integer) to service_role;
create function public.support_save_settings(p_district text,p_config jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  update support_settings set config=p_config,updated_at=now() where district=p_district;
  if not found then raise exception 'unknown_district'; end if;
  insert into support_sheet_outbox(district,action,payload)
    values(p_district,'save_config',jsonb_build_object('action','save_config','config',p_config));
  return jsonb_build_object('success',true);
end $$;
revoke all on function public.support_save_settings(text,jsonb) from public,anon,authenticated;
grant execute on function public.support_save_settings(text,jsonb) to service_role;
