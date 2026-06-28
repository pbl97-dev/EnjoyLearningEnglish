# Enjoy Learning English LMS

A full-stack MVP learning management system for Enjoy Learning English, built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- Supabase email/password authentication
- Student, teacher, and admin roles
- Role-based dashboards
- Student profile management
- Groups/classes
- Course > module > lesson > materials structure
- PDF, image, audio, video, external URL, embed, and text/HTML materials
- Supabase Storage uploads
- Course assignment to groups/classes
- Student lesson completion tracking
- Teacher/admin progress dashboard
- Responsive dashboard UI for desktop browsers, tablets, and iPhone

## Requirements

- Node.js 20 or newer
- pnpm
- A Supabase project

## Local Setup Commands

Install dependencies:

```bash
pnpm install
```

Create the local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Start the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Only commit `.env.example`. Put real secrets in `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Where to find them in Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`: Project Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings > API > anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Project Settings > API > service_role secret key

The service role key is used only by trusted server actions for admin-created users. Never expose it in client components.

## Supabase Setup Steps

1. Create a Supabase project.
2. In Supabase, open SQL Editor.
3. Run these files in this exact order:

```text
supabase/migrations/001_lms_schema.sql
supabase/migrations/002_storage_policies.sql
supabase/seed.sql
```

4. In Authentication > Providers, make sure Email is enabled.
5. For local MVP testing, either keep email confirmation enabled and confirm users from email, or disable email confirmation in Authentication settings.
6. Create `.env.local` with the values above.
7. Run `pnpm dev`.

## First Admin Setup

New sign-ups are students by default.

1. Start the app with `pnpm dev`.
2. Open `http://localhost:3000/auth/sign-up`.
3. Create your first account.
4. In Supabase SQL Editor, promote that user:

```sql
update public.profiles
set role = 'admin'
where id = '<your-auth-user-id>';
```

You can find the user id in Supabase Authentication > Users.

After promotion, sign in again and open `/admin`.

## MVP Workflow

The acceptance flow is supported like this:

1. Admin signs in.
2. Admin creates a student from `/admin`.
3. Admin creates a group/class from `/admin`.
4. Admin adds the student to the group.
5. Admin creates a course.
6. Admin creates a module for the course.
7. Admin creates a lesson for the module.
8. Admin attaches a PDF, image, audio, video, URL, embed, or HTML material to the lesson.
9. Admin assigns the course to the group.
10. Student signs in.
11. Student sees only assigned courses in `/dashboard` and `/courses`.
12. Student opens a lesson and marks it complete.
13. Teacher/admin views progress in `/teacher`.

## Project Checks

Run TypeScript:

```bash
pnpm typecheck
```

Run lint:

```bash
pnpm lint
```

Run production build:

```bash
pnpm build
```

If your shell cannot resolve package scripts, use the local binaries:

```powershell
.\node_modules\.bin\tsc.CMD --noEmit
.\node_modules\.bin\eslint.CMD . --ext .ts,.tsx
.\node_modules\.bin\next.CMD build
```

For build checks in a clean environment, make sure `.env.local` exists. You can also set temporary placeholder values for a smoke build:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY='placeholder'
$env:SUPABASE_SERVICE_ROLE_KEY='placeholder'
.\node_modules\.bin\next.CMD build
```

## Folder Structure

- `src/app` - Next.js App Router pages and server actions
- `src/app/actions` - Server actions for auth, profile, and LMS workflows
- `src/components` - Shared dashboard UI components
- `src/lib` - Supabase clients, auth helpers, validation, and shared types
- `src/lib/supabase` - Browser, server, admin, and middleware Supabase clients
- `supabase/migrations` - Database schema, RLS policies, storage buckets, and storage policies
- `supabase/seed.sql` - Demo learning content

## Supabase Data Model

Core tables:

- `profiles` - User profile, role, phone, and learning goal
- `groups` - Classes/groups
- `group_students` - Student membership in groups
- `courses` - Courses
- `modules` - Course modules
- `lessons` - Module lessons
- `lesson_materials` - Files, links, embeds, and lesson content blocks
- `group_course_assignments` - Assigned courses by group
- `lesson_progress` - Student completion records

Storage buckets:

- `course-assets` - Course images and public course assets
- `lesson-materials` - PDFs, images, audio, video, and downloadable files

## Security Notes

- Real Supabase keys belong only in `.env.local`.
- `.env.local` is ignored by git.
- `.env.example` contains placeholders only.
- `node_modules`, `.next`, local pnpm caches, and TypeScript build info are ignored.
- Row-level security is enabled in the schema.
- Students can read only courses assigned to their groups.
- Students can update only their own lesson progress.
- Teacher/admin users can manage LMS content.
- Embed URLs are validated against an allowlist before saving.
- HTML content is sanitized and arbitrary scripts are removed before rendering.
