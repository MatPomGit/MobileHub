create extension if not exists pgcrypto;

create table if not exists public.project_teams (
  id uuid primary key default gen_random_uuid(),
  project_id text not null unique,
  title varchar(120) not null,
  members jsonb not null default '[]'::jsonb,
  description text,
  icon_url text,
  project_url text,
  repository_url text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_teams_project_id_chk check (project_id ~ '^pam\.26\.[0-9]{2}$'),
  constraint project_teams_title_chk check (char_length(title) between 3 and 120),
  constraint project_teams_members_array_chk check (jsonb_typeof(members) = 'array'),
  constraint project_teams_description_chk check (description is null or char_length(trim(description)) between 20 and 2000),
  constraint project_teams_icon_url_chk check (icon_url is null or icon_url ~ '^(https://|data:image/)'),
  constraint project_teams_project_url_chk check (project_url is null or project_url ~ '^https://'),
  constraint project_teams_repository_url_chk check (repository_url is null or repository_url ~ '^https://')
);

alter table public.project_teams
  add column if not exists description text;

alter table public.project_teams
  add column if not exists icon_url text;

alter table public.project_teams
  add column if not exists project_url text;

alter table public.project_teams
  add column if not exists repository_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_description_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_description_chk
      check (description is null or char_length(trim(description)) between 20 and 2000);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_icon_url_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_icon_url_chk
      check (icon_url is null or icon_url ~ '^(https://|data:image/)');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_project_url_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_project_url_chk
      check (project_url is null or project_url ~ '^https://');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_repository_url_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_repository_url_chk
      check (repository_url is null or repository_url ~ '^https://');
  end if;
end
$$;

create index if not exists project_teams_project_id_idx on public.project_teams(project_id);

alter table public.project_teams enable row level security;

drop policy if exists "Anon can select project teams" on public.project_teams;
create policy "Anon can select project teams"
on public.project_teams
for select
to anon
using (true);

drop policy if exists "Anon can insert project teams" on public.project_teams;
create policy "Anon can insert project teams"
on public.project_teams
for insert
to anon
with check (true);

drop policy if exists "Anon can update project teams" on public.project_teams;
create policy "Anon can update project teams"
on public.project_teams
for update
to anon
using (true)
with check (true);

insert into public.project_teams (project_id, title, members, source)
values
  (
    'pam.26.01',
    'Aplikacja walutowa',
    '[{"index":"177087","role":"Leader"},{"index":"177119","role":"Frontend"},{"index":"177126","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.01'
  ),
  (
    'pam.26.02',
    'Sterowania robotem BLE',
    '[{"index":"177114","role":"Leader"},{"index":"177118","role":"Frontend"},{"index":"177191","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.02'
  ),
  (
    'pam.26.03',
    'Aplikacja do liczenia kalorii',
    '[{"index":"177111","role":"Leader"},{"index":"177110","role":"Frontend"},{"index":"177112","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.03'
  ),
  (
    'pam.26.04',
    'Lokalizator ekipy',
    '[{"index":"177162","role":"Leader"},{"index":"177176","role":"Frontend"},{"index":null,"role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.04'
  ),
  (
    'pam.26.05',
    'Dzielenie rachunków',
    '[{"index":"177104","role":"Leader"},{"index":"177164","role":"Frontend"},{"index":"177132","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.05'
  ),
  (
    'pam.26.06',
    'SudSolver',
    '[{"index":"177064","role":"Leader"},{"index":"177186","role":"Frontend"},{"index":"177063","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.06'
  ),
  (
    'pam.26.07',
    'Raportowanie problemów miejskich',
    '[{"index":"169646","role":"Leader"},{"index":"177043","role":"Frontend"},{"index":"177050","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.07'
  ),
  (
    'pam.26.08',
    'Gra trivia multiplayer',
    '[{"index":"177182","role":"Leader"},{"index":"177054","role":"Frontend"},{"index":"177055","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.08'
  ),
  (
    'pam.26.09',
    'Ben-9 do nauki fiszek',
    '[{"index":"177181","role":"Leader"},{"index":"177045","role":"Frontend"},{"index":"177188","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.09'
  ),
  (
    'pam.26.10',
    'Aplikacja przypominania o lekach',
    '[{"index":"177143","role":"Leader"},{"index":"177139","role":"Frontend"},{"index":"177147","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.10'
  ),
  (
    'pam.26.11',
    'Flip to Focus',
    '[{"index":"177135","role":"Leader"},{"index":"177149","role":"Frontend"},{"index":"177140","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.11'
  ),
  (
    'pam.26.12',
    'Zamki elektryczne NFC',
    '[{"index":"177102","role":"Leader"},{"index":"177091","role":"Frontend"},{"index":"177103","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.12'
  ),
  (
    'pam.26.13',
    'Przypomnienia kontekstowe',
    '[{"index":"177106","role":"Leader"},{"index":"177107","role":"Frontend"},{"index":"177108","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.13'
  ),
  (
    'pam.26.14',
    'Live GeoGuesser',
    '[{"index":"177174","role":"Leader"},{"index":"177192","role":"Frontend"},{"index":"177177","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.14'
  ),
  (
    'pam.26.15',
    'Katalogowania przedmiotów',
    '[{"index":"177190","role":"Leader"},{"index":"167821","role":"Frontend"},{"index":"177159","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.15'
  ),
  (
    'pam.26.16',
    'WaterMonitor (tem72)',
    '[{"index":"177160","role":"Leader"},{"index":"177156","role":"Frontend"},{"index":"177080","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.16'
  ),
  (
    'pam.26.17',
    'SleepyGuardian',
    '[{"index":"177151","role":"Leader"},{"index":"177158","role":"Frontend"},{"index":"177165","role":"Backend"}]'::jsonb,
    'https://github.com/MatPomGit/mobileHub/blob/main/students-data.json?project=pam.26.17'
  )
on conflict (project_id) do update set
  title = excluded.title,
  members = excluded.members,
  source = excluded.source,
  updated_at = now();