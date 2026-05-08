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
  package_name text,
  play_console_url text,
  play_store_url text,
  play_download_size_mb numeric(6,2),
  play_install_size_mb numeric(6,2),
  play_startup_cold_ms integer,
  play_startup_warm_ms integer,
  play_startup_hot_ms integer,
  play_anr_rate numeric(6,3),
  play_crash_rate numeric(6,3),
  play_metrics_updated_at timestamptz,
  play_metrics_source text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_teams_project_id_chk check (project_id ~ '^pam\.26\.[0-9]{2}$'),
  constraint project_teams_title_chk check (char_length(title) between 3 and 120),
  constraint project_teams_members_array_chk check (jsonb_typeof(members) = 'array'),
  constraint project_teams_description_chk check (description is null or char_length(trim(description)) between 20 and 2000),
  constraint project_teams_icon_url_chk check (icon_url is null or icon_url ~ '^(https://|data:image/)'),
  constraint project_teams_project_url_chk check (project_url is null or project_url ~ '^https://'),
  constraint project_teams_repository_url_chk check (repository_url is null or repository_url ~ '^https://'),
  constraint project_teams_package_name_chk check (package_name is null or package_name ~ '^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+$'),
  constraint project_teams_play_console_url_chk check (play_console_url is null or play_console_url ~ '^https://play\.google\.com/console'),
  constraint project_teams_play_store_url_chk check (play_store_url is null or play_store_url ~ '^https://play\.google\.com/store/apps/details'),
  constraint project_teams_play_download_size_mb_chk check (play_download_size_mb is null or play_download_size_mb >= 0),
  constraint project_teams_play_install_size_mb_chk check (play_install_size_mb is null or play_install_size_mb >= 0),
  constraint project_teams_play_startup_cold_ms_chk check (play_startup_cold_ms is null or play_startup_cold_ms >= 0),
  constraint project_teams_play_startup_warm_ms_chk check (play_startup_warm_ms is null or play_startup_warm_ms >= 0),
  constraint project_teams_play_startup_hot_ms_chk check (play_startup_hot_ms is null or play_startup_hot_ms >= 0),
  constraint project_teams_play_anr_rate_chk check (play_anr_rate is null or play_anr_rate >= 0),
  constraint project_teams_play_crash_rate_chk check (play_crash_rate is null or play_crash_rate >= 0)
);

alter table public.project_teams
  add column if not exists description text;

alter table public.project_teams
  add column if not exists icon_url text;

alter table public.project_teams
  add column if not exists project_url text;

alter table public.project_teams
  add column if not exists repository_url text;

alter table public.project_teams
  add column if not exists package_name text;

alter table public.project_teams
  add column if not exists play_console_url text;

alter table public.project_teams
  add column if not exists play_store_url text;

alter table public.project_teams
  add column if not exists play_download_size_mb numeric(6,2);

alter table public.project_teams
  add column if not exists play_install_size_mb numeric(6,2);

alter table public.project_teams
  add column if not exists play_startup_cold_ms integer;

alter table public.project_teams
  add column if not exists play_startup_warm_ms integer;

alter table public.project_teams
  add column if not exists play_startup_hot_ms integer;

alter table public.project_teams
  add column if not exists play_anr_rate numeric(6,3);

alter table public.project_teams
  add column if not exists play_crash_rate numeric(6,3);

alter table public.project_teams
  add column if not exists play_metrics_updated_at timestamptz;

alter table public.project_teams
  add column if not exists play_metrics_source text;

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

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_package_name_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_package_name_chk
      check (package_name is null or package_name ~ '^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_play_console_url_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_console_url_chk
      check (play_console_url is null or play_console_url ~ '^https://play\.google\.com/console');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_play_store_url_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_store_url_chk
      check (play_store_url is null or play_store_url ~ '^https://play\.google\.com/store/apps/details');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_play_download_size_mb_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_download_size_mb_chk
      check (play_download_size_mb is null or play_download_size_mb >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_play_install_size_mb_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_install_size_mb_chk
      check (play_install_size_mb is null or play_install_size_mb >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_play_startup_cold_ms_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_startup_cold_ms_chk
      check (play_startup_cold_ms is null or play_startup_cold_ms >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_play_startup_warm_ms_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_startup_warm_ms_chk
      check (play_startup_warm_ms is null or play_startup_warm_ms >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_play_startup_hot_ms_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_startup_hot_ms_chk
      check (play_startup_hot_ms is null or play_startup_hot_ms >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_play_anr_rate_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_anr_rate_chk
      check (play_anr_rate is null or play_anr_rate >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_play_crash_rate_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_crash_rate_chk
      check (play_crash_rate is null or play_crash_rate >= 0);
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

update public.project_teams
set
  description = 'A simple flashcard app for Android. Create your decks, organize your knowledge, and study efficiently.',
  icon_url = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IkJlbi05IG93bCBpY29uIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYmciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzdiMmNmZiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM1YjE5ZGIiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9Im93bCIgeDE9IjAiIHgyPSIwIiB5MT0iMCIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjYWE4Y2YyIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzc4NTJjZSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0id2luZyIgeDE9IjAiIHgyPSIxIiB5MT0iMCIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjN2U1NWQ5Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzVkMzJiNiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxmaWx0ZXIgaWQ9InNoYWRvdyIgeD0iLTIwJSIgeT0iLTIwJSIgd2lkdGg9IjE0MCUiIGhlaWdodD0iMTQwJSI+CiAgICAgIDxmZURyb3BTaGFkb3cgZHg9IjAiIGR5PSIxMCIgc3RkRGV2aWF0aW9uPSIxMCIgZmxvb2Qtb3BhY2l0eT0iMC4xOCIvPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiByeD0iMzIiIGZpbGw9InVybCgjYmcpIi8+CiAgPGcgZmlsdGVyPSJ1cmwoI3NoYWRvdykiPgogICAgPHBhdGggZD0iTTUzIDM3NCAxODkgMzQ1YzMyLTcgNjQtNyA5NiAwbDE3NCAzNi0xNyAxNC0xNzgtMTUtMTg0IDExeiIgZmlsbD0iIzVjMmRiMiIvPgogICAgPHBhdGggZD0iTTQ2IDM2MSAxODUgMzM0YzMyLTYgNjMtNiA5NCAwbDE4MiAzMy0zOCAxOEg4OHoiIGZpbGw9IiNmZmZkZjgiLz4KICAgIDxwYXRoIGQ9Ik03NyAzNDVoMzM5bDIxIDEwSDU3eiIgZmlsbD0iI2ZmZmZmZiIvPgogICAgPHBhdGggZD0iTTEyMCAzNjRjMzUgMTAgNzYgMTQgMTE4IDE0IDU1IDAgMTA4LTcgMTU2LTIyIiBmaWxsPSJub25lIiBzdHJva2U9IiNkNWQwZDgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSI1IiBvcGFjaXR5PSIwLjg1Ii8+CiAgICA8cGF0aCBkPSJNODcgMzgxYzQ2IDQgOTkgNyAxNTIgNyA1NCAwIDEwOS0zIDE2MS0xMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTdlMGRkIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iNCIgb3BhY2l0eT0iMC45Ii8+CiAgPC9nPgogIDxnIGZpbHRlcj0idXJsKCNzaGFkb3cpIj4KICAgIDxlbGxpcHNlIGN4PSIyNTciIGN5PSIyMzciIHJ4PSIxMjQiIHJ5PSIxMzkiIGZpbGw9InVybCgjb3dsKSIvPgogICAgPHBhdGggZD0iTTE3MSAxMTZjMjIgNiA1MiAyMSA4NiA0MyAzMS0yMSA2MS0zNiA4NC00Mi0xMSAyOC0zMSA1Mi01NSA3MGgtNTljLTI2LTE4LTQ0LTQwLTU2LTcxeiIgZmlsbD0iIzlkN2VlNCIvPgogICAgPHBhdGggZD0iTTE3NyAxNTdjLTI5IDI0LTQ3IDYyLTQ3IDEwNXYxMGMwIDI5IDExIDU2IDMxIDc4bDE1LTEwNXoiIGZpbGw9InVybCgjd2luZykiLz4KICAgIDxwYXRoIGQ9Ik0zMzcgMTU4YzI5IDI0IDQ3IDYyIDQ3IDEwNXYxMGMwIDI5LTExIDU2LTMxIDc4bC0xNS0xMDV6IiBmaWxsPSJ1cmwoI3dpbmcpIi8+CiAgICA8ZWxsaXBzZSBjeD0iMjA0IiBjeT0iMTk3IiByeD0iNTAiIHJ5PSI0NSIgZmlsbD0iI2ZmZiIvPgogICAgPGVsbGlwc2UgY3g9IjMwOSIgY3k9IjE5NyIgcng9IjUwIiByeT0iNDUiIGZpbGw9IiNmZmYiLz4KICAgIDxjaXJjbGUgY3g9IjIwOSIgY3k9IjE5OCIgcj0iMTgiIGZpbGw9IiMyZDMyNTYiLz4KICAgIDxjaXJjbGUgY3g9IjMwNiIgY3k9IjE5OCIgcj0iMTgiIGZpbGw9IiMyZDMyNTYiLz4KICAgIDxjaXJjbGUgY3g9IjIwMiIgY3k9IjE5MSIgcj0iNiIgZmlsbD0iI2ZmZiIvPgogICAgPGNpcmNsZSBjeD0iMjk5IiBjeT0iMTkxIiByPSI2IiBmaWxsPSIjZmZmIi8+CiAgICA8cGF0aCBkPSJNMjU1IDIwN2MxMSAwIDIwIDkgMjAgMjBsLTIwIDI5LTIwLTI5YzAtMTEgOS0yMCAyMC0yMHoiIGZpbGw9IiNmZmFiMDAiLz4KICAgIDxnIGZpbGw9IiM3YjU5ZDUiPgogICAgICA8cGF0aCBkPSJNMjA1IDI4MGM4IDUgMTQgMTMgMTQgMjItMTIgMy0yNC01LTI1LTE2IDAtNCAzLTggMTEtNnoiLz4KICAgICAgPHBhdGggZD0iTTIzOSAyODVjOCA1IDE0IDEzIDE0IDIyLTEyIDMtMjQtNS0yNS0xNiAwLTQgMy04IDExLTZ6Ii8+CiAgICAgIDxwYXRoIGQ9Ik0yNzMgMjg2YzggNSAxNCAxMyAxNCAyMi0xMiAzLTI0LTUtMjUtMTYgMC00IDMtOCAxMS02eiIvPgogICAgICA8cGF0aCBkPSJNMzA3IDI4MWM4IDUgMTQgMTMgMTQgMjItMTIgMy0yNC01LTI1LTE2IDAtNCAzLTggMTEtNnoiLz4KICAgICAgPHBhdGggZD0iTTIxMyAzMjRjOCA1IDE0IDEzIDE0IDIyLTEyIDMtMjQtNS0yNS0xNiAwLTQgMy04IDExLTZ6Ii8+CiAgICAgIDxwYXRoIGQ9Ik0yNDcgMzMwYzggNSAxNCAxMyAxNCAyMi0xMiAzLTI0LTUtMjUtMTYgMC00IDMtOCAxMS02eiIvPgogICAgICA8cGF0aCBkPSJNMjgxIDMzMGM4IDUgMTQgMTMgMTQgMjItMTIgMy0yNC01LTI1LTE2IDAtNCAzLTggMTEtNnoiLz4KICAgIDwvZz4KICAgIDxwYXRoIGQ9Ik0yMDQgMzUwYzAgMTQtOSAyNC0yMSAzMSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZhYjAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMTAiLz4KICAgIDxwYXRoIGQ9Ik0zMDcgMzUwYzAgMTQgOSAyNCAyMSAzMSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZhYjAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMTAiLz4KICA8L2c+Cjwvc3ZnPgo=',
  project_url = 'https://ben9.ktty.is/',
  repository_url = 'https://gitea.7o7.cx/PamTeam/ben9',
  members = '[{"index":"177181","role":"Leader","profile_url":"https://gitea.7o7.cx/sherl"},{"index":"177045","role":"Frontend","profile_url":"https://gitea.7o7.cx/Nom4ne"},{"index":"177188","role":"Backend","profile_url":"https://gitea.7o7.cx/Evilbrine"}]'::jsonb,
  package_name = 'is.ktty.ben9',
  play_console_url = 'https://play.google.com/console/u/0/developers/5585680289117975139/app-list?hl=pl',
  play_metrics_source = 'pending_private_play_console_import',
  updated_at = now()
where project_id = 'pam.26.09';