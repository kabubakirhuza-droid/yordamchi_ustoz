create table public.support_admin_accounts (
  district text primary key references public.support_settings(district),
  login text unique not null,
  password_hash text not null,
  role text not null
);
alter table public.support_admin_accounts enable row level security;
revoke all on public.support_admin_accounts from public,anon,authenticated;
grant all on public.support_admin_accounts to service_role;
-- Provision existing accounts privately; never commit credential values.
