-- =================================================================
-- INSTRUCTIONS :
-- 1. Copiez tout le contenu de ce fichier
-- 2. Allez sur votre Dashboard Supabase > SQL Editor
-- 3. Collez et cliquez sur "RUN"
-- =================================================================

-- 1. Table Employés
create table if not exists public.employees (
  id uuid default gen_random_uuid() primary key,
  manager_id uuid references auth.users(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  role text default 'staff', -- Utilisation de text pour éviter les erreurs de type
  pin_code text,
  created_at timestamptz default now()
);

-- Activation de la sécurité (RLS)
alter table public.employees enable row level security;

-- Politique de sécurité (si elle n'existe pas déjà)
do $$ begin
  create policy "Users can manage their employees" on public.employees
    for all using (auth.uid() = manager_id);
exception when duplicate_object then null; end $$;


-- 2. Table Relevés de Température
create table if not exists public.temperature_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  equipment_name text not null,
  temperature numeric,
  status text check (status in ('correct', 'warning', 'critical')),
  notes text,
  created_at timestamptz default now()
);

alter table public.temperature_logs enable row level security;

do $$ begin
  create policy "Users can manage their temp logs" on public.temperature_logs
    for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
