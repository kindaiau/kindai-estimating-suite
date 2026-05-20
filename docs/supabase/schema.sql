-- PostgreSQL/Supabase target schema for the vertical SaaS layer.
-- The current app still runs on the existing Drizzle/MySQL-compatible schema.
-- Use this as the migration blueprint when moving persistence fully to Supabase Postgres.

create type industry_key as enum ('cabinet-makers', 'electricians');
create type pipeline_stage as enum ('new_lead', 'qualified', 'quote_sent', 'follow_up', 'won', 'lost');
create type automation_agent as enum ('acquisition', 'conversion', 'delivery', 'system');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  industry_key industry_key not null,
  trade_id text not null,
  plan text not null default 'starter',
  status text not null default 'onboarding',
  website text,
  phone text,
  abn text,
  state text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  industry_key industry_key not null,
  name text not null,
  email text,
  phone text,
  company text,
  job_type text,
  source text default 'manual',
  utm_source text,
  utm_campaign text,
  score int not null default 50 check (score >= 0 and score <= 100),
  pipeline_stage pipeline_stage not null default 'new_lead',
  status text not null default 'open',
  tags text[] not null default '{}',
  notes text,
  next_action text,
  next_action_at timestamptz,
  last_contacted_at timestamptz,
  qualification jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.business_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.crm_leads(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'normal',
  due_at timestamptz,
  automation_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.crm_leads(id) on delete set null,
  industry_key industry_key not null,
  title text not null,
  client_name text,
  status text not null default 'onboarding',
  current_step text,
  start_date date,
  target_completion_date date,
  budget numeric(14,2),
  notes text,
  workflow_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  agent automation_agent not null default 'system',
  event_type text not null,
  status text not null default 'queued',
  target_type text,
  target_id uuid,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  industry_key industry_key,
  event_name text not null,
  source text,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  industry_key industry_key not null,
  agent text not null,
  name text not null,
  system_prompt text not null,
  version int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_activities enable row level security;
alter table public.business_tasks enable row level security;
alter table public.delivery_projects enable row level security;
alter table public.automation_logs enable row level security;
alter table public.analytics_events enable row level security;
alter table public.prompt_templates enable row level security;

create policy "Users can manage their organizations" on public.organizations
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "Users can manage their leads" on public.crm_leads
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "Users can manage their activities" on public.crm_activities
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "Users can manage their tasks" on public.business_tasks
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "Users can manage delivery projects" on public.delivery_projects
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "Users can read their automation logs" on public.automation_logs
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "Users can manage their analytics events" on public.analytics_events
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "Users can manage prompt templates" on public.prompt_templates
  for all using (
    organization_id in (select id from public.organizations where owner_user_id = auth.uid())
  )
  with check (
    organization_id in (select id from public.organizations where owner_user_id = auth.uid())
  );
