insert into public.courses (id, title, description, level, published)
values (
  '11111111-1111-4111-8111-111111111111',
  'Everyday English Foundations',
  'A starter course for greetings, introductions, classroom language, and short conversations.',
  'A1',
  true
)
on conflict (id) do nothing;

insert into public.modules (id, course_id, title, summary, position)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Introductions',
  'Practice saying hello, sharing names, and asking simple questions.',
  1
)
on conflict (id) do nothing;

insert into public.lessons (id, module_id, title, objective, content_html, position, published)
values (
  '33333333-3333-4333-8333-333333333333',
  '22222222-2222-4222-8222-222222222222',
  'Meeting Someone New',
  'Introduce yourself and ask one follow-up question.',
  '<p>Read the dialogue, listen to your teacher, and practice with a partner.</p><ul><li>Hello, my name is Ana.</li><li>Nice to meet you.</li><li>Where are you from?</li></ul>',
  1,
  true
)
on conflict (id) do nothing;

insert into public.lesson_materials (lesson_id, title, material_type, url, content_html, position)
values
  (
    '33333333-3333-4333-8333-333333333333',
    'Practice prompt',
    'html',
    null,
    '<p>Write three sentences introducing yourself. Then read them aloud.</p>',
    1
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Cambridge dictionary',
    'external_url',
    'https://dictionary.cambridge.org/',
    null,
    2
  );
