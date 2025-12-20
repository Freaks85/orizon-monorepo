-- =====================================================
-- MIGRATION: Migrer les données existantes
-- À exécuter APRÈS 20251208_multi_tenant_architecture.sql
-- =====================================================

-- 1. Créer les restaurants pour les utilisateurs existants qui n'en ont pas
-- =====================================================
insert into public.restaurants (name, owner_id)
select
  coalesce(u.raw_user_meta_data->>'restaurant_name', 'Restaurant de ' || coalesce(u.raw_user_meta_data->>'first_name', 'Utilisateur')),
  u.id
from auth.users u
where not exists (
  select 1 from public.restaurants r where r.owner_id = u.id
);

-- 2. Ajouter les utilisateurs existants comme owners de leurs restaurants
-- =====================================================
insert into public.restaurant_members (restaurant_id, user_id, role)
select r.id, r.owner_id, 'owner'
from public.restaurants r
where not exists (
  select 1 from public.restaurant_members rm
  where rm.restaurant_id = r.id and rm.user_id = r.owner_id
);

-- 3. Migrer les employés existants vers leurs restaurants
-- =====================================================
update public.employees e
set restaurant_id = (
  select r.id
  from public.restaurants r
  where r.owner_id = e.manager_id
  limit 1
)
where e.restaurant_id is null;

-- 4. Migrer temperature_logs existants
-- =====================================================
update public.temperature_logs tl
set restaurant_id = (
  select r.id
  from public.restaurants r
  where r.owner_id = tl.user_id
  limit 1
)
where tl.restaurant_id is null;

-- 5. Migrer alerts existants
-- =====================================================
update public.alerts a
set restaurant_id = (
  select r.id
  from public.restaurants r
  where r.owner_id = a.user_id
  limit 1
)
where a.restaurant_id is null;

-- 6. Migrer tasks existants
-- =====================================================
update public.tasks t
set restaurant_id = (
  select r.id
  from public.restaurants r
  where r.owner_id = t.user_id
  limit 1
)
where t.restaurant_id is null;

-- 7. Rendre restaurant_id obligatoire (après migration)
-- =====================================================
-- Note: À exécuter seulement après vérification que toutes les données sont migrées
-- alter table public.employees alter column restaurant_id set not null;
-- alter table public.temperature_logs alter column restaurant_id set not null;
-- alter table public.alerts alter column restaurant_id set not null;
-- alter table public.tasks alter column restaurant_id set not null;
