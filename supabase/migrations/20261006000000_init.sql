-- Vamo · esquema de la base de datos (Supabase → SQL Editor → pegar y "Run")
-- Una sola tabla con todos los registros del usuario. Cada usuario solo ve los suyos (RLS).

create table if not exists public.records (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  id         text        not null,
  kind       text        not null,               -- meal | water | weight | body | run | set | settings
  date       text        not null default '',    -- YYYY-MM-DD
  data       jsonb       not null default '{}'::jsonb,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(), -- hora del cambio en el teléfono
  server_at  timestamptz not null default now(), -- hora en que llegó al servidor (para sincronizar)
  primary key (user_id, id)
);

create index if not exists records_user_server_at on public.records (user_id, server_at);
create index if not exists records_user_kind_date on public.records (user_id, kind, date);

-- server_at siempre lo pone el servidor
create or replace function public.records_touch() returns trigger
language plpgsql as $$
begin
  new.server_at := clock_timestamp();
  return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
for each row execute function public.records_touch();

alter table public.records enable row level security;

drop policy if exists "records: solo el dueño" on public.records;
create policy "records: solo el dueño" on public.records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Suscripción (para cuando Vamo pase a pago: $10/mes). Por ahora todos son "beta".
create table if not exists public.subscriptions (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  plan       text not null default 'beta',   -- beta | pro | free
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions: leer la propia" on public.subscriptions;
create policy "subscriptions: leer la propia" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ============ SOCIAL: perfiles, seguir amigos, salidas compartidas y "kudos" ============

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text unique not null check (username ~ '^[a-z0-9_.]{3,20}$'),
  name       text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles: ver todos" on public.profiles;
create policy "profiles: ver todos" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles: editar el propio" on public.profiles;
create policy "profiles: editar el propio" on public.profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.follows (
  follower   uuid not null references public.profiles (id) on delete cascade,
  following  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, following),
  check (follower <> following)
);
alter table public.follows enable row level security;
drop policy if exists "follows: ver" on public.follows;
create policy "follows: ver" on public.follows for select to authenticated using (true);
drop policy if exists "follows: los míos" on public.follows;
create policy "follows: los míos" on public.follows for all to authenticated
  using (auth.uid() = follower) with check (auth.uid() = follower);

-- Salidas que el usuario comparte (resumen + recorrido simplificado)
create table if not exists public.activities (
  id         text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  date       text not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists activities_user_created on public.activities (user_id, created_at desc);
alter table public.activities enable row level security;
drop policy if exists "activities: mías y de los que sigo" on public.activities;
create policy "activities: mías y de los que sigo" on public.activities for select to authenticated using (
  user_id = auth.uid()
  or exists (select 1 from public.follows f where f.follower = auth.uid() and f.following = activities.user_id)
);
drop policy if exists "activities: publicar las mías" on public.activities;
create policy "activities: publicar las mías" on public.activities for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.kudos (
  activity_id text not null references public.activities (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (activity_id, user_id)
);
alter table public.kudos enable row level security;
drop policy if exists "kudos: ver" on public.kudos;
create policy "kudos: ver" on public.kudos for select to authenticated using (true);
drop policy if exists "kudos: los míos" on public.kudos;
create policy "kudos: los míos" on public.kudos for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
