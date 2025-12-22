-- Add shared person linking and encounters
-- Safe to run in Supabase SQL editor or via CLI

-- Ensure pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) user_people: link many users to a canonical person
create table if not exists public.user_people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  met_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now(),
  constraint user_people_user_person_unique unique (user_id, person_id)
);

-- Helpful indexes
create index if not exists idx_user_people_user on public.user_people(user_id);
create index if not exists idx_user_people_person on public.user_people(person_id);

-- Enable RLS
alter table public.user_people enable row level security;

-- Policies: a user may manage their own links (drop/create for idempotency)
drop policy if exists user_people_select_self on public.user_people;
create policy user_people_select_self
  on public.user_people for select
  using (user_id = auth.uid());

drop policy if exists user_people_insert_self on public.user_people;
create policy user_people_insert_self
  on public.user_people for insert
  with check (user_id = auth.uid());

drop policy if exists user_people_update_self on public.user_people;
create policy user_people_update_self
  on public.user_people for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_people_delete_self on public.user_people;
create policy user_people_delete_self
  on public.user_people for delete
  using (user_id = auth.uid());

-- 2) encounters: a shared meeting (time/place) around a person
create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  met_at timestamp with time zone,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create index if not exists idx_encounters_person on public.encounters(person_id);
create index if not exists idx_encounters_place on public.encounters(place_id);

-- 3) encounter_participants: join table of users in an encounter
create table if not exists public.encounter_participants (
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (encounter_id, user_id)
);

create index if not exists idx_encounter_participants_user on public.encounter_participants(user_id);

alter table public.encounters enable row level security;

-- Creator owns the encounter; participants can read (see ep policy below)
drop policy if exists encounters_select_creator_or_participant on public.encounters;
create policy encounters_select_creator_or_participant
  on public.encounters for select
  using (
    created_by_user_id = auth.uid()
    or exists (
      select 1 from public.encounter_participants ep
      where ep.encounter_id = encounters.id and ep.user_id = auth.uid()
    )
  );

drop policy if exists encounters_insert_creator on public.encounters;
create policy encounters_insert_creator
  on public.encounters for insert
  with check (created_by_user_id = auth.uid());

drop policy if exists encounters_update_creator on public.encounters;
create policy encounters_update_creator
  on public.encounters for update
  using (created_by_user_id = auth.uid())
  with check (created_by_user_id = auth.uid());

drop policy if exists encounters_delete_creator on public.encounters;
create policy encounters_delete_creator
  on public.encounters for delete
  using (created_by_user_id = auth.uid());

alter table public.encounter_participants enable row level security;

-- Participants can read; creators can manage participants (incl. adding friends)
drop policy if exists ep_select_self_or_creator on public.encounter_participants;
create policy ep_select_self_or_creator
  on public.encounter_participants for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.encounters e
      where e.id = encounter_id and e.created_by_user_id = auth.uid()
    )
  );

drop policy if exists ep_insert_creator on public.encounter_participants;
create policy ep_insert_creator
  on public.encounter_participants for insert
  with check (
    exists (
      select 1 from public.encounters e
      where e.id = encounter_id and e.created_by_user_id = auth.uid()
    )
  );

drop policy if exists ep_delete_self_or_creator on public.encounter_participants;
create policy ep_delete_self_or_creator
  on public.encounter_participants for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.encounters e
      where e.id = encounter_id and e.created_by_user_id = auth.uid()
    )
  );

-- 4) People visibility: allow reading a person if the user is linked via user_people
-- Note: keep your existing people RLS policies; add a select policy for link-based visibility.
alter table public.people enable row level security;

drop policy if exists people_select_if_linked on public.people;
create policy people_select_if_linked
  on public.people for select
  using (
    exists (
      select 1 from public.user_people up
      where up.person_id = people.id and up.user_id = auth.uid()
    )
  );

-- Optional: allow insert of people for any authenticated user
drop policy if exists people_insert_any_auth on public.people;
create policy people_insert_any_auth
  on public.people for insert
  with check (auth.uid() is not null);

-- Optional: restrict update/delete to the original creator if you have such a column.
-- If you keep people.user_id as creator, you can use policies like:
-- update: using (user_id = auth.uid()) with check (user_id = auth.uid());
-- delete: using (user_id = auth.uid());

-- 5) Backfill: seed user_people from existing people rows
insert into public.user_people (user_id, person_id, place_id, met_at, notes)
select p.user_id, p.id, p.place_id, null, null
from public.people p
where p.user_id is not null
on conflict (user_id, person_id) do nothing;
