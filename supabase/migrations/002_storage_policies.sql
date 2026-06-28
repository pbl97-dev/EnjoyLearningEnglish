insert into storage.buckets (id, name, public)
values
  ('course-assets', 'course-assets', true),
  ('lesson-materials', 'lesson-materials', true)
on conflict (id) do update set public = excluded.public;

create policy "course assets staff upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'course-assets'
  and public.is_staff(auth.uid())
);

create policy "course assets public read"
on storage.objects for select
to public
using (bucket_id = 'course-assets');

create policy "course assets staff update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'course-assets'
  and public.is_staff(auth.uid())
)
with check (
  bucket_id = 'course-assets'
  and public.is_staff(auth.uid())
);

create policy "lesson materials staff upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'lesson-materials'
  and public.is_staff(auth.uid())
);

create policy "lesson materials authenticated read"
on storage.objects for select
to authenticated
using (bucket_id = 'lesson-materials');

create policy "lesson materials public read for embeds"
on storage.objects for select
to public
using (bucket_id = 'lesson-materials');

create policy "lesson materials staff update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'lesson-materials'
  and public.is_staff(auth.uid())
)
with check (
  bucket_id = 'lesson-materials'
  and public.is_staff(auth.uid())
);
