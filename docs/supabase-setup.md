# Konfiguracja Supabase dla danych zespołów

## Zalecany model: `project_teams`

Od teraz aplikacja preferuje tabelę `public.project_teams` jako główne źródło prawdy dla oficjalnych składów zespołów. To eliminuje upychanie `project_id` w polach odziedziczonych po starym formularzu.

Gotowy skrypt tworzący i zasilający tabelę znajduje się w [supabase-project-teams.sql](../database/supabase-project-teams.sql).

Model tabeli:

- `project_id` - identyfikator projektu, np. `pam.26.01`
- `title` - tytuł projektu
- `members` - tablica JSON z obiektami `{ index, role }`; opcjonalnie członek może mieć też `profile_url`
- `description` - opis projektu aktualizowany przez studentów
- `icon_url` - opcjonalna ikona projektu jako adres HTTPS lub zapisany obraz `data:image/...`
- `project_url` - opcjonalny link HTTPS do strony projektu
- `repository_url` - opcjonalny link HTTPS do repozytorium projektu, aktualizowany przez studentów
- `package_name` - identyfikator aplikacji w Google Play, np. `is.ktty.ben9`
- `play_console_url` - adres widoku aplikacji lub listy aplikacji w Play Console
- `play_store_url` - publiczny adres sklepu Play, jeśli aplikacja jest opublikowana
- `play_download_size_mb`, `play_install_size_mb` - rozmiar pobierania i instalacji z Play Console
- `play_startup_cold_ms`, `play_startup_warm_ms`, `play_startup_hot_ms` - metryki uruchamiania aplikacji
- `play_anr_rate`, `play_crash_rate` - wskaźniki jakości aplikacji z Play Console
- `play_metrics_updated_at`, `play_metrics_source` - kiedy i skąd zsynchronizowano metryki Play
- `source` - URL źródła danych
- `created_at`, `updated_at` - znaczniki czasu

Frontend w [studenci.html](../pages/community/studenci.html) czyta `project_teams` jako główne źródło i przy problemie (np. brak migracji) przełącza się na lokalne [`data/students-data.json`](../data/students-data.json).

### Migracja istniejącej tabeli

Jeśli tabela `project_teams` już istnieje, uruchom poniższy SQL, aby dodać pola opisu, linków projektu i metryk Google Play:

```sql
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
    select 1 from pg_constraint where conname = 'project_teams_description_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_description_chk
      check (description is null or char_length(trim(description)) between 20 and 2000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_icon_url_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_icon_url_chk
      check (icon_url is null or icon_url ~ '^(https://|data:image/)');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_project_url_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_project_url_chk
      check (project_url is null or project_url ~ '^https://');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_repository_url_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_repository_url_chk
      check (repository_url is null or repository_url ~ '^https://');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_package_name_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_package_name_chk
      check (package_name is null or package_name ~ '^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_play_console_url_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_console_url_chk
      check (play_console_url is null or play_console_url ~ '^https://play\.google\.com/console');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_play_store_url_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_store_url_chk
      check (play_store_url is null or play_store_url ~ '^https://play\.google\.com/store/apps/details');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_play_download_size_mb_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_download_size_mb_chk
      check (play_download_size_mb is null or play_download_size_mb >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_play_install_size_mb_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_install_size_mb_chk
      check (play_install_size_mb is null or play_install_size_mb >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_play_startup_cold_ms_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_startup_cold_ms_chk
      check (play_startup_cold_ms is null or play_startup_cold_ms >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_play_startup_warm_ms_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_startup_warm_ms_chk
      check (play_startup_warm_ms is null or play_startup_warm_ms >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_play_startup_hot_ms_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_startup_hot_ms_chk
      check (play_startup_hot_ms is null or play_startup_hot_ms >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_play_anr_rate_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_anr_rate_chk
      check (play_anr_rate is null or play_anr_rate >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'project_teams_play_crash_rate_chk'
  ) then
    alter table public.project_teams
      add constraint project_teams_play_crash_rate_chk
      check (play_crash_rate is null or play_crash_rate >= 0);
  end if;
end
$$;
```

## Stary model: `project_submissions`

Poniższa tabela zostaje tylko jako legacy fallback dla wcześniejszych wpisów.

```sql
create table if not exists public.project_submissions (
  id bigint generated by default as identity primary key,
  student_index varchar(10) not null,
  role text not null,
  project_name varchar(120) not null,
  repository_url text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.project_submissions
  add constraint project_submissions_student_index_chk check (student_index ~ '^[0-9]{4,10}$'),
  add constraint project_submissions_role_chk check (role in ('Leader', 'Frontend', 'Backend')),
  add constraint project_submissions_project_name_chk check (char_length(project_name) between 3 and 120),
  add constraint project_submissions_repository_url_chk check (repository_url ~ '^https://'),
  add constraint project_submissions_description_chk check (char_length(description) between 20 and 1000);

alter table public.project_submissions enable row level security;

create policy "Anon can select submissions"
on public.project_submissions
for select
to anon
using (true);

create policy "Anon can insert submissions"
on public.project_submissions
for insert
to anon
with check (true);

create policy "Anon can update submissions"
on public.project_submissions
for update
to anon
using (true)
with check (true);

create policy "Anon can delete submissions"
on public.project_submissions
for delete
to anon
using (true);
```

## Konfiguracja frontendu

1. Uruchom skrypt z [supabase-project-teams.sql](../database/supabase-project-teams.sql) w SQL Editorze Supabase.
2. W [studenci.html](../pages/community/studenci.html) ustaw `SUPABASE_URL` na publiczny URL projektu, np. `https://ndebunrsdtulflzpemwd.supabase.co`.
3. Ustaw w [studenci.html](../pages/community/studenci.html) `SUPABASE_ANON_KEY` na publiczny klucz publishable/anon.
4. Nie używaj `service_role key` po stronie frontendu.
5. Prywatne metryki z Google Play Console nie powinny być pobierane bezpośrednio z [studenci.html](../pages/community/studenci.html). Importuj je przez bezpieczny backend albo ręczny, autoryzowany eksport do `project_teams`.
