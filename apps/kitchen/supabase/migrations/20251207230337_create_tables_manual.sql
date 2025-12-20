-- Create Employees Table
create table if not exists public.employees (
  id uuid default gen_random_uuid() primary key,
  manager_id uuid references auth.users(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  role public.user_role default 'staff',
  pin_code text,
  created_at timestamptz default now()
);

alter table public.employees enable row level security;

do $$ begin
  create policy "Users can manage their employees" on public.employees
    for all using (auth.uid() = manager_id);
exception when duplicate_object then null; end $$;

-- Create Temperature Logs
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

-- Create Alerts
create table if not exists public.alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  severity text check (severity in ('low', 'medium', 'high', 'critical')),
  status text default 'active' check (status in ('active', 'resolved', 'ignored')),
  created_at timestamptz default now()
);

alter table public.alerts enable row level security;

do $$ begin
  create policy "Users can manage their alerts" on public.alerts
    for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Create Tasks (Checklist)
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  due_date date default current_date,
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;

do $$ begin
  create policy "Users can manage their tasks" on public.tasks
    for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
