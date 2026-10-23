-- Apply after support_gateway_token and support_anon_key have been placed in Vault.
-- Credentials are read at runtime, never written into the scheduled job text.
select cron.schedule('support-sheets-retry','* * * * *',$job$
  select net.http_post(
    url:='https://vcbsyckaicdrzgzbzdni.supabase.co/functions/v1/support-api',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='support_anon_key'),
      'x-support-token',(select decrypted_secret from vault.decrypted_secrets where name='support_gateway_token')
    ),
    body:='{"action":"sync_sheets"}'::jsonb,
    timeout_milliseconds:=60000
  ) where exists(select 1 from public.support_sheet_outbox
    where processed_at is null and available_at<=now()
      and (locked_until is null or locked_until<now()));
$job$);

-- 19:05 UTC = 00:05 in Tashkent. Queue one settings refresh per district/month.
select cron.schedule('support-monthly-sheets','5 19 * * *',$job$
  insert into public.support_sheet_outbox(district,action,payload)
  select s.district,'save_config',jsonb_build_object('action','save_config','config',s.config,
    'monthlyKey',to_char(now() at time zone 'Asia/Tashkent','MM.YYYY'))
  from public.support_settings s where not exists(
    select 1 from public.support_sheet_outbox o where o.district=s.district
      and o.payload->>'monthlyKey'=to_char(now() at time zone 'Asia/Tashkent','MM.YYYY')
  );
$job$);
