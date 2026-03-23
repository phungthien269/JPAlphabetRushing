create table if not exists public.learning_items (
  id text primary key,
  script_type text not null,
  character text not null,
  romaji text not null,
  meaning_en text not null,
  meaning_vi text not null,
  note_en text not null,
  note_vi text not null,
  lesson_group text not null,
  subgroup text not null,
  vowel_group text not null,
  sort_order integer not null,
  is_enabled boolean not null default true
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'vi',
  theme text not null default 'system',
  keyboard_shortcuts jsonb not null,
  review_defaults jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_item_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.learning_items(id) on delete cascade,
  memory_level integer not null default 0,
  status text not null default 'not_started',
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  current_streak integer not null default 0,
  completed_review_sessions integer not null default 0,
  last_studied_at timestamptz,
  last_reviewed_at timestamptz,
  last_status_change_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table if not exists public.learning_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  script_type text not null,
  selection_scope text[] not null,
  question_types text[] not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  items_total integer not null,
  items_completed integer not null,
  correct_count integer not null,
  incorrect_count integer not null
);

create table if not exists public.learning_attempts (
  id text primary key,
  session_id text not null references public.learning_sessions(id) on delete cascade,
  item_id text not null references public.learning_items(id) on delete cascade,
  prompt_type text not null,
  selected_answer text not null,
  correct_answer text not null,
  is_correct boolean not null,
  remaining_before integer,
  remaining_after integer,
  answered_at timestamptz not null
);

create or replace view public.progress_by_script as
select
  user_item_progress.user_id,
  learning_items.script_type,
  count(*) as total_items,
  count(*) filter (where user_item_progress.status <> 'not_started') as studied_items,
  count(*) filter (where user_item_progress.status = 'learned') as learned_items,
  count(*) filter (where user_item_progress.status = 'mastered') as mastered_items,
  count(*) filter (where user_item_progress.status = 'review_needed') as review_needed_items
from public.user_item_progress
join public.learning_items on learning_items.id = user_item_progress.item_id
group by user_item_progress.user_id, learning_items.script_type;

create or replace view public.progress_by_group as
select
  user_item_progress.user_id,
  learning_items.script_type,
  learning_items.lesson_group,
  learning_items.subgroup,
  count(*) as total_items,
  count(*) filter (where user_item_progress.status <> 'not_started') as studied_items,
  count(*) filter (where user_item_progress.status = 'mastered') as mastered_items
from public.user_item_progress
join public.learning_items on learning_items.id = user_item_progress.item_id
group by user_item_progress.user_id, learning_items.script_type, learning_items.lesson_group, learning_items.subgroup;

create or replace view public.review_needed_items as
select
  user_item_progress.user_id,
  user_item_progress.item_id,
  user_item_progress.memory_level,
  user_item_progress.status,
  user_item_progress.last_reviewed_at,
  user_item_progress.updated_at,
  learning_items.script_type,
  learning_items.lesson_group,
  learning_items.subgroup
from public.user_item_progress
join public.learning_items on learning_items.id = user_item_progress.item_id
where user_item_progress.status = 'review_needed';

create index if not exists idx_progress_user_status_reviewed on public.user_item_progress(user_id, status, last_reviewed_at);
create index if not exists idx_sessions_user_ended on public.learning_sessions(user_id, ended_at desc);
create index if not exists idx_attempts_session_answered on public.learning_attempts(session_id, answered_at);
create index if not exists idx_learning_items_script_group on public.learning_items(script_type, lesson_group, subgroup, sort_order);

alter table public.learning_items enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_item_progress enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.learning_attempts enable row level security;

create policy if not exists "learning_items_readable" on public.learning_items
for select to anon, authenticated using (true);

create policy if not exists "preferences_owner" on public.user_preferences
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "progress_owner" on public.user_item_progress
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "sessions_owner" on public.learning_sessions
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "attempts_owner" on public.learning_attempts
for all to authenticated
using (
  exists (
    select 1
    from public.learning_sessions
    where learning_sessions.id = learning_attempts.session_id
      and learning_sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.learning_sessions
    where learning_sessions.id = learning_attempts.session_id
      and learning_sessions.user_id = auth.uid()
  )
);
