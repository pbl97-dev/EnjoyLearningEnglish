create table if not exists public.trusted_embed_sources (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.trusted_embed_sources enable row level security;

create policy "trusted embed sources read for staff"
on public.trusted_embed_sources for select
to authenticated
using (public.is_staff(auth.uid()));

create policy "trusted embed sources admin full access"
on public.trusted_embed_sources for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

insert into public.trusted_embed_sources (domain, label, is_active)
values
  ('youtube.com', 'YouTube', true),
  ('www.youtube.com', 'YouTube', true),
  ('youtube-nocookie.com', 'YouTube No Cookie', true),
  ('www.youtube-nocookie.com', 'YouTube No Cookie', true),
  ('docs.google.com', 'Google Docs and Slides', true),
  ('drive.google.com', 'Google Drive', true),
  ('canva.com', 'Canva', true),
  ('www.canva.com', 'Canva', true),
  ('genially.com', 'Genially', true),
  ('view.genially.com', 'Genially', true),
  ('quizlet.com', 'Quizlet', true),
  ('www.quizlet.com', 'Quizlet', true),
  ('wordwall.net', 'Wordwall', true),
  ('www.wordwall.net', 'Wordwall', true),
  ('liveworksheets.com', 'Liveworksheets', true),
  ('www.liveworksheets.com', 'Liveworksheets', true),
  ('learnenglish.britishcouncil.org', 'British Council LearnEnglish', true),
  ('learnenglishteens.britishcouncil.org', 'British Council LearnEnglish Teens', true),
  ('britishcouncil.org', 'British Council', true),
  ('www.britishcouncil.org', 'British Council', true),
  ('englishonline.britishcouncil.org', 'British Council English Online', true)
on conflict (domain) do update
set label = excluded.label,
    is_active = excluded.is_active;
