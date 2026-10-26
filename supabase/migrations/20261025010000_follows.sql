-- Officials a user follows (mirrors FollowProvider). Private to the owner.
-- official_id is the app's text id from src/data/officials.ts (e.g. 'de-senate-16'),
-- since officials are bundled with the app for now.

create table public.follows (
  user_id     uuid not null references auth.users(id) on delete cascade,
  official_id text not null,
  followed_at timestamptz not null default now(),
  primary key (user_id, official_id)
);

alter table public.follows enable row level security;

create policy "own follows" on public.follows for all using (user_id = auth.uid()) with check (user_id = auth.uid());
