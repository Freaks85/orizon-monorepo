-- =====================================================
-- MIGRATION: Multi-tenant Architecture for SaaS
-- Cette migration restructure la base pour supporter
-- plusieurs clients (restaurants) de manière sécurisée
-- =====================================================

-- 1. Créer la table restaurants (entité centrale du multi-tenant)
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

-- Policy: Les propriétaires peuvent voir/gérer leurs restaurants
create policy "Owners can manage their restaurants" on public.restaurants
  for all using (auth.uid() = owner_id);

-- 2. Table de liaison users <-> restaurants (pour multi-restaurant et équipe)
-- =====================================================
create table if not exists public.restaurant_members (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'admin', 'manager', 'staff')),
  created_at timestamptz default now(),
  -- Un user ou employee ne peut être membre qu'une fois par restaurant
  unique(restaurant_id, user_id),
  unique(restaurant_id, employee_id),
  -- Au moins un des deux doit être renseigné
  check (user_id is not null or employee_id is not null)
);

alter table public.restaurant_members enable row level security;

-- Policy: Accès basé sur l'appartenance au restaurant
create policy "Members can view their restaurant members" on public.restaurant_members
  for select using (
    restaurant_id in (
      select restaurant_id from public.restaurant_members where user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage members" on public.restaurant_members
  for all using (
    restaurant_id in (
      select rm.restaurant_id from public.restaurant_members rm
      where rm.user_id = auth.uid() and rm.role in ('owner', 'admin')
    )
  );

-- 3. Ajouter restaurant_id à la table employees
-- =====================================================
alter table public.employees
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;

-- Supprimer l'ancienne policy
drop policy if exists "Users can manage their employees" on public.employees;

-- Nouvelle policy basée sur le restaurant
create policy "Restaurant admins can manage employees" on public.employees
  for all using (
    restaurant_id in (
      select rm.restaurant_id from public.restaurant_members rm
      where rm.user_id = auth.uid() and rm.role in ('owner', 'admin', 'manager')
    )
  );

-- 4. Ajouter restaurant_id à temperature_logs
-- =====================================================
alter table public.temperature_logs
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;

-- Supprimer l'ancienne policy
drop policy if exists "Users can manage their temp logs" on public.temperature_logs;

-- Nouvelle policy
create policy "Restaurant members can manage temp logs" on public.temperature_logs
  for all using (
    restaurant_id in (
      select rm.restaurant_id from public.restaurant_members rm
      where rm.user_id = auth.uid()
    )
  );

-- 5. Ajouter restaurant_id à alerts
-- =====================================================
alter table public.alerts
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;

-- Supprimer l'ancienne policy
drop policy if exists "Users can manage their alerts" on public.alerts;

-- Nouvelle policy
create policy "Restaurant members can manage alerts" on public.alerts
  for all using (
    restaurant_id in (
      select rm.restaurant_id from public.restaurant_members rm
      where rm.user_id = auth.uid()
    )
  );

-- 6. Ajouter restaurant_id à tasks
-- =====================================================
alter table public.tasks
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;

-- Supprimer l'ancienne policy
drop policy if exists "Users can manage their tasks" on public.tasks;

-- Nouvelle policy
create policy "Restaurant members can manage tasks" on public.tasks
  for all using (
    restaurant_id in (
      select rm.restaurant_id from public.restaurant_members rm
      where rm.user_id = auth.uid()
    )
  );

-- 7. Ajouter employee_id aux tables pour tracer qui a fait quoi
-- =====================================================
alter table public.temperature_logs
  add column if not exists employee_id uuid references public.employees(id) on delete set null;

alter table public.tasks
  add column if not exists completed_by uuid references public.employees(id) on delete set null;

-- 8. Index pour les performances
-- =====================================================
create index if not exists idx_employees_restaurant on public.employees(restaurant_id);
create index if not exists idx_temperature_logs_restaurant on public.temperature_logs(restaurant_id);
create index if not exists idx_alerts_restaurant on public.alerts(restaurant_id);
create index if not exists idx_tasks_restaurant on public.tasks(restaurant_id);
create index if not exists idx_restaurant_members_restaurant on public.restaurant_members(restaurant_id);
create index if not exists idx_restaurant_members_user on public.restaurant_members(user_id);

-- 9. Fonction pour créer automatiquement un restaurant à l'inscription
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

-- Trigger sur création d'utilisateur
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 10. Fonction utilitaire pour obtenir le restaurant actif de l'utilisateur
-- =====================================================
create or replace function public.get_user_restaurant_id()
returns uuid as $$
  select restaurant_id
  from public.restaurant_members
  where user_id = auth.uid()
  limit 1;
$$ language sql stable security definer;

-- 11. Vue pour faciliter l'accès aux employés avec infos restaurant
-- =====================================================
create or replace view public.employees_with_restaurant as
select
  e.*,
  r.name as restaurant_name
from public.employees e
join public.restaurants r on e.restaurant_id = r.id;
