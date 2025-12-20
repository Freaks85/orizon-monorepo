-- =====================================================
-- SCRIPT À EXÉCUTER DANS LE SQL EDITOR DE SUPABASE
-- Ordre d'exécution:
-- 1. D'abord ce script pour préparer la structure
-- 2. Puis lancer l'application pour que les triggers créent les restaurants
-- =====================================================

-- ÉTAPE 1: Créer la table restaurants
-- =====================================================
create table if not exists public.restaurants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  address text,
  phone text,
  email text,
  siret text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.restaurants enable row level security;

-- Policy pour restaurants
drop policy if exists "Owners can manage their restaurants" on public.restaurants;
create policy "Owners can manage their restaurants" on public.restaurants
  for all using (auth.uid() = owner_id);

-- ÉTAPE 2: Créer la table restaurant_members
-- =====================================================
create table if not exists public.restaurant_members (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'admin', 'manager', 'staff')),
  created_at timestamptz default now(),
  unique(restaurant_id, user_id),
  unique(restaurant_id, employee_id),
  check (user_id is not null or employee_id is not null)
);

alter table public.restaurant_members enable row level security;

drop policy if exists "Members can view their restaurant members" on public.restaurant_members;
create policy "Members can view their restaurant members" on public.restaurant_members
  for select using (
    restaurant_id in (
      select restaurant_id from public.restaurant_members where user_id = auth.uid()
    )
  );

drop policy if exists "Owners and admins can manage members" on public.restaurant_members;
create policy "Owners and admins can manage members" on public.restaurant_members
  for all using (
    restaurant_id in (
      select rm.restaurant_id from public.restaurant_members rm
      where rm.user_id = auth.uid() and rm.role in ('owner', 'admin')
    )
  );

-- ÉTAPE 3: Ajouter restaurant_id aux tables existantes
-- =====================================================
alter table public.employees
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;

alter table public.temperature_logs
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;

alter table public.temperature_logs
  add column if not exists employee_id uuid references public.employees(id) on delete set null;

alter table public.alerts
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;

alter table public.tasks
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;

alter table public.tasks
  add column if not exists completed_by uuid references public.employees(id) on delete set null;

-- ÉTAPE 4: Mettre à jour les politiques RLS
-- =====================================================

-- Employees
drop policy if exists "Users can manage their employees" on public.employees;
drop policy if exists "Restaurant admins can manage employees" on public.employees;
create policy "Restaurant admins can manage employees" on public.employees
  for all using (
    restaurant_id in (
      select rm.restaurant_id from public.restaurant_members rm
      where rm.user_id = auth.uid() and rm.role in ('owner', 'admin', 'manager')
    )
  );

-- Temperature logs
drop policy if exists "Users can manage their temp logs" on public.temperature_logs;
drop policy if exists "Restaurant members can manage temp logs" on public.temperature_logs;
create policy "Restaurant members can manage temp logs" on public.temperature_logs
  for all using (
    restaurant_id in (
      select rm.restaurant_id from public.restaurant_members rm
      where rm.user_id = auth.uid()
    )
  );

-- Alerts
drop policy if exists "Users can manage their alerts" on public.alerts;
drop policy if exists "Restaurant members can manage alerts" on public.alerts;
create policy "Restaurant members can manage alerts" on public.alerts
  for all using (
    restaurant_id in (
      select rm.restaurant_id from public.restaurant_members rm
      where rm.user_id = auth.uid()
    )
  );

-- Tasks
drop policy if exists "Users can manage their tasks" on public.tasks;
drop policy if exists "Restaurant members can manage tasks" on public.tasks;
create policy "Restaurant members can manage tasks" on public.tasks
  for all using (
    restaurant_id in (
      select rm.restaurant_id from public.restaurant_members rm
      where rm.user_id = auth.uid()
    )
  );

-- ÉTAPE 5: Créer les index pour les performances
-- =====================================================
create index if not exists idx_employees_restaurant on public.employees(restaurant_id);
create index if not exists idx_temperature_logs_restaurant on public.temperature_logs(restaurant_id);
create index if not exists idx_alerts_restaurant on public.alerts(restaurant_id);
create index if not exists idx_tasks_restaurant on public.tasks(restaurant_id);
create index if not exists idx_restaurant_members_restaurant on public.restaurant_members(restaurant_id);
create index if not exists idx_restaurant_members_user on public.restaurant_members(user_id);

-- ÉTAPE 6: Créer le trigger pour les nouveaux utilisateurs
-- =====================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_restaurant_id uuid;
begin
  -- Créer le restaurant avec le nom fourni lors de l'inscription
  insert into public.restaurants (name, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'restaurant_name', 'Mon Restaurant'),
    new.id
  )
  returning id into new_restaurant_id;

  -- Ajouter l'utilisateur comme owner du restaurant
  insert into public.restaurant_members (restaurant_id, user_id, role)
  values (new_restaurant_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ÉTAPE 7: Fonction utilitaire
-- =====================================================
create or replace function public.get_user_restaurant_id()
returns uuid as $$
  select restaurant_id
  from public.restaurant_members
  where user_id = auth.uid()
  limit 1;
$$ language sql stable security definer;

-- =====================================================
-- MIGRATION DES DONNÉES EXISTANTES
-- À exécuter après les étapes ci-dessus
-- =====================================================

-- Créer les restaurants pour les utilisateurs existants
insert into public.restaurants (name, owner_id)
select
  coalesce(u.raw_user_meta_data->>'restaurant_name', 'Restaurant de ' || coalesce(u.raw_user_meta_data->>'first_name', 'Utilisateur')),
  u.id
from auth.users u
where not exists (
  select 1 from public.restaurants r where r.owner_id = u.id
)
on conflict do nothing;

-- Ajouter les utilisateurs comme owners
insert into public.restaurant_members (restaurant_id, user_id, role)
select r.id, r.owner_id, 'owner'
from public.restaurants r
where not exists (
  select 1 from public.restaurant_members rm
  where rm.restaurant_id = r.id and rm.user_id = r.owner_id
)
on conflict do nothing;

-- Migrer les employés
update public.employees e
set restaurant_id = (
  select r.id
  from public.restaurants r
  where r.owner_id = e.manager_id
  limit 1
)
where e.restaurant_id is null;

-- Migrer les temperature_logs
update public.temperature_logs tl
set restaurant_id = (
  select r.id
  from public.restaurants r
  where r.owner_id = tl.user_id
  limit 1
)
where tl.restaurant_id is null;

-- Migrer les alerts
update public.alerts a
set restaurant_id = (
  select r.id
  from public.restaurants r
  where r.owner_id = a.user_id
  limit 1
)
where a.restaurant_id is null;

-- Migrer les tasks
update public.tasks t
set restaurant_id = (
  select r.id
  from public.restaurants r
  where r.owner_id = t.user_id
  limit 1
)
where t.restaurant_id is null;

-- =====================================================
-- VÉRIFICATION (à exécuter séparément)
-- =====================================================
-- select * from public.restaurants;
-- select * from public.restaurant_members;
-- select * from public.employees;
