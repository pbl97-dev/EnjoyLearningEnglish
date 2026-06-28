create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'teacher', 'admin');
create type public.material_type as enum (
  'pdf',
  'image',
  'audio',
  'video',
  'external_url',
  'embed',
  'html'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'student',
  avatar_url text,
  phone text,
  learning_goal text,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_students (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, student_id)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  level text,
  cover_image_url text,
  published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  summary text,
  position integer not null default 1
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  objective text,
  content_html text,
  position integer not null default 1,
  published boolean not null default false
);

create table public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  material_type public.material_type not null,
  url text,
  storage_path text,
  content_html text,
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.group_course_assignments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (group_id, course_id)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create index group_students_student_idx on public.group_students(student_id);
create index assignments_group_idx on public.group_course_assignments(group_id);
create index modules_course_idx on public.modules(course_id);
create index lessons_module_idx on public.lessons(module_id);
create index materials_lesson_idx on public.lesson_materials(lesson_id);
create index progress_student_idx on public.lesson_progress(student_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role in ('teacher', 'admin')
  );
$$;

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

create or replace function public.student_has_course(course_id_input uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_students gs
    join public.group_course_assignments gca on gca.group_id = gs.group_id
    join public.courses c on c.id = gca.course_id
    where gs.student_id = auth.uid()
      and gca.course_id = course_id_input
      and c.published = true
  ) or public.is_staff(auth.uid());
$$;

create or replace function public.student_assigned_courses()
returns setof public.courses
language sql
stable
security definer
set search_path = public
as $$
  select distinct c.*
  from public.courses c
  join public.group_course_assignments gca on gca.course_id = c.id
  join public.group_students gs on gs.group_id = gca.group_id
  where gs.student_id = auth.uid()
    and c.published = true
  order by c.created_at desc;
$$;

create or replace function public.teacher_progress_overview()
returns table (
  group_id uuid,
  group_name text,
  student_id uuid,
  student_name text,
  course_id uuid,
  course_title text,
  total_lessons bigint,
  completed_lessons bigint,
  completion_percent integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id as group_id,
    g.name as group_name,
    p.id as student_id,
    coalesce(p.full_name, 'Student') as student_name,
    c.id as course_id,
    c.title as course_title,
    count(distinct l.id) as total_lessons,
    count(distinct lp.lesson_id) filter (where lp.completed = true) as completed_lessons,
    case
      when count(distinct l.id) = 0 then 0
      else round(
        count(distinct lp.lesson_id) filter (where lp.completed = true)::numeric
        / count(distinct l.id)::numeric
        * 100
      )::integer
    end as completion_percent
  from public.groups g
  join public.group_students gs on gs.group_id = g.id
  join public.profiles p on p.id = gs.student_id
  join public.group_course_assignments gca on gca.group_id = g.id
  join public.courses c on c.id = gca.course_id
  left join public.modules m on m.course_id = c.id
  left join public.lessons l on l.module_id = m.id and l.published = true
  left join public.lesson_progress lp on lp.lesson_id = l.id and lp.student_id = p.id
  where public.is_staff(auth.uid())
  group by g.id, g.name, p.id, p.full_name, c.id, c.title
  order by g.name, p.full_name, c.title;
$$;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_students enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_materials enable row level security;
alter table public.group_course_assignments enable row level security;
alter table public.lesson_progress enable row level security;

create policy "profiles read own or staff"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_staff(auth.uid()));

create policy "profiles update own basic"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

create policy "groups staff full access"
on public.groups for all
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

create policy "groups students read own groups"
on public.groups for select
to authenticated
using (
  exists (
    select 1 from public.group_students
    where group_students.group_id = groups.id
      and group_students.student_id = auth.uid()
  )
);

create policy "group students staff full access"
on public.group_students for all
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

create policy "group students read own"
on public.group_students for select
to authenticated
using (student_id = auth.uid());

create policy "courses staff full access"
on public.courses for all
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

create policy "courses students read assigned"
on public.courses for select
to authenticated
using (published = true and public.student_has_course(id));

create policy "modules staff full access"
on public.modules for all
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

create policy "modules students read assigned"
on public.modules for select
to authenticated
using (public.student_has_course(course_id));

create policy "lessons staff full access"
on public.lessons for all
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

create policy "lessons students read assigned"
on public.lessons for select
to authenticated
using (
  published = true and exists (
    select 1 from public.modules
    where modules.id = lessons.module_id
      and public.student_has_course(modules.course_id)
  )
);

create policy "materials staff full access"
on public.lesson_materials for all
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

create policy "materials students read assigned"
on public.lesson_materials for select
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    where l.id = lesson_materials.lesson_id
      and l.published = true
      and public.student_has_course(m.course_id)
  )
);

create policy "assignments staff full access"
on public.group_course_assignments for all
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

create policy "assignments students read own"
on public.group_course_assignments for select
to authenticated
using (
  exists (
    select 1 from public.group_students
    where group_students.group_id = group_course_assignments.group_id
      and group_students.student_id = auth.uid()
  )
);

create policy "progress staff read"
on public.lesson_progress for select
to authenticated
using (public.is_staff(auth.uid()) or student_id = auth.uid());

create policy "progress students insert own"
on public.lesson_progress for insert
to authenticated
with check (student_id = auth.uid());

create policy "progress students update own"
on public.lesson_progress for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());
