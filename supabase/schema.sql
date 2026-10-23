-- Only the server gateway can access these tables; the two districts remain separate.
create table public.support_settings (
  district text primary key check (district in ('sergeli','uchtepa')),
  config jsonb not null,
  updated_at timestamptz not null default now()
);
create table public.support_gateway (
  name text primary key,
  token_hash text not null
);
create table public.support_bookings (
  district text not null references public.support_settings(district),
  id text not null,
  request_id text,
  course text not null,
  lesson_date date not null,
  lesson_time time not null,
  teacher text not null default '',
  status text not null default 'Yangi',
  payload jsonb not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (district,id),
  unique (district,request_id)
);
create index support_bookings_slot_idx on public.support_bookings
  (district,lesson_date,lesson_time,course,teacher) where deleted_at is null;
create table public.support_sheet_outbox (
  id bigint generated always as identity primary key,
  district text not null references public.support_settings(district),
  action text not null,
  payload jsonb not null,
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index support_sheet_outbox_pending_idx on public.support_sheet_outbox(available_at,id)
  where processed_at is null;
create table public.support_teacher_state (
  district text not null references public.support_settings(district),
  teacher_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (district,teacher_id)
);
alter table public.support_settings enable row level security;
alter table public.support_gateway enable row level security;
alter table public.support_bookings enable row level security;
alter table public.support_sheet_outbox enable row level security;
alter table public.support_teacher_state enable row level security;
revoke all on public.support_settings,public.support_gateway,public.support_bookings,
  public.support_sheet_outbox,public.support_teacher_state from public,anon,authenticated;
grant all on public.support_settings,public.support_gateway,public.support_bookings,
  public.support_sheet_outbox,public.support_teacher_state to service_role;
grant usage,select on sequence public.support_sheet_outbox_id_seq to service_role;

create function public.support_reserve_booking(p_district text,p_booking jsonb,p_capacity integer)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare existing_id text; occupied integer; booking_id text := p_booking->>'id';
  d date := (p_booking->>'dateISO')::date; t time := (p_booking->>'vaqt')::time;
begin
  if p_capacity < 1 or p_capacity > 100 then raise exception 'invalid_capacity'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_district || '|' || d::text || '|' || t::text,0));
  select id into existing_id from support_bookings where district=p_district and request_id=p_booking->>'requestId';
  if existing_id is not null then return jsonb_build_object('success',true,'bookingId',existing_id,'duplicate',true); end if;
  select count(*) into occupied from support_bookings
    where district=p_district and lesson_date=d and lesson_time=t and deleted_at is null
      and status not in ('Bekor qilingan','cancelled')
      and ((coalesce(p_booking->>'ustoza','')<>'' and teacher=p_booking->>'ustoza')
        or (coalesce(p_booking->>'ustoza','')='' and course=p_booking->>'kurs'));
  if occupied >= p_capacity then return jsonb_build_object('success',false,'error','full'); end if;
  insert into support_bookings(district,id,request_id,course,lesson_date,lesson_time,teacher,payload)
    values(p_district,booking_id,p_booking->>'requestId',p_booking->>'kurs',d,t,coalesce(p_booking->>'ustoza',''),p_booking);
  insert into support_sheet_outbox(district,action,payload)
    values(p_district,'register',p_booking || jsonb_build_object('action','register','bookingId',booking_id));
  return jsonb_build_object('success',true,'bookingId',booking_id,'sheetsPending',true);
end $$;
revoke all on function public.support_reserve_booking(text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.support_reserve_booking(text,jsonb,integer) to service_role;

create function public.support_claim_sheet_jobs(p_limit integer default 10)
returns setof public.support_sheet_outbox language sql security invoker set search_path = public, pg_temp as $$
  update support_sheet_outbox set locked_until=now()+interval '90 seconds',attempts=attempts+1
  where id in (select id from support_sheet_outbox where processed_at is null and available_at<=now()
    and (locked_until is null or locked_until<now())
    and not exists (select 1 from support_sheet_outbox earlier
      where earlier.district=support_sheet_outbox.district and earlier.processed_at is null
        and earlier.id<support_sheet_outbox.id)
    order by id limit least(p_limit,20) for update skip locked)
  returning *;
$$;
revoke all on function public.support_claim_sheet_jobs(integer) from public,anon,authenticated;
grant execute on function public.support_claim_sheet_jobs(integer) to service_role;

create function public.support_update_booking(p_district text,p_id text,p_status text,p_delete boolean default false)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare b support_bookings;
begin
  select * into b from support_bookings where district=p_district and id=p_id for update;
  if not found then return jsonb_build_object('success',false,'error','not_found'); end if;
  update support_bookings set status=coalesce(p_status,status),deleted_at=case when p_delete then now() else deleted_at end
    where district=p_district and id=p_id;
  insert into support_sheet_outbox(district,action,payload) values(p_district,
    case when p_delete then 'delete_booking' else 'update_status' end,
    jsonb_build_object('action',case when p_delete then 'delete_booking' else 'update_status' end,'id',p_id,'status',p_status));
  return jsonb_build_object('success',true);
end $$;
revoke all on function public.support_update_booking(text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.support_update_booking(text,text,text,boolean) to service_role;
