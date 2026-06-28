import {
  addStudentToGroup,
  assignCourseToGroup,
  createCourse,
  createGroup,
  createLesson,
  createLessonMaterial,
  createModule,
  createStudent,
  updateUserRole,
} from "@/app/actions/lms";
import { Button } from "@/components/button";
import { Badge, Card, EmptyState, Field, PageHeader, inputClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requireRole(["teacher", "admin"]);
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { data: profiles },
    { data: groups },
    { data: courses },
    { data: modules },
    { data: lessons },
    { data: assignments },
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("groups").select("*").order("created_at", { ascending: false }),
    supabase.from("courses").select("*").order("created_at", { ascending: false }),
    supabase.from("modules").select("*").order("position"),
    supabase.from("lessons").select("*").order("position"),
    supabase
      .from("group_course_assignments")
      .select("*, groups(name), courses(title)")
      .order("assigned_at", { ascending: false }),
  ]);

  const students = (profiles || []).filter((profile: any) => profile.role === "student");

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Admin workspace"
        description="Create students, classes, courses, modules, lessons, materials, and group assignments."
      />

      {params.message ? (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {params.message}
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Create student</h2>
          <form action={createStudent} className="mt-4 grid gap-3">
            <Field label="Full name">
              <input className={inputClass} name="full_name" required />
            </Field>
            <Field label="Email">
              <input className={inputClass} name="email" type="email" required />
            </Field>
            <Field label="Temporary password">
              <input className={inputClass} minLength={6} name="password" type="password" required />
            </Field>
            <Button className="w-fit" type="submit">Create student</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Create group/class</h2>
          <form action={createGroup} className="mt-4 grid gap-3">
            <Field label="Name">
              <input className={inputClass} name="name" required />
            </Field>
            <Field label="Description">
              <textarea className={inputClass} name="description" rows={3} />
            </Field>
            <Button className="w-fit" type="submit">Create group</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Add student to group</h2>
          <form action={addStudentToGroup} className="mt-4 grid gap-3">
            <Field label="Student">
              <select className={inputClass} name="student_id" required>
                <option value="">Select student</option>
                {students.map((student: any) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name || student.id}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Group">
              <select className={inputClass} name="group_id" required>
                <option value="">Select group</option>
                {(groups || []).map((group: any) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </Field>
            <Button className="w-fit" type="submit">Add to group</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Create course</h2>
          <form action={createCourse} className="mt-4 grid gap-3">
            <Field label="Title">
              <input className={inputClass} name="title" required />
            </Field>
            <Field label="Level">
              <input className={inputClass} name="level" placeholder="A1, A2, B1..." />
            </Field>
            <Field label="Description">
              <textarea className={inputClass} name="description" rows={3} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input name="published" type="checkbox" defaultChecked />
              Published
            </label>
            <Button className="w-fit" type="submit">Create course</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Create module</h2>
          <form action={createModule} className="mt-4 grid gap-3">
            <Field label="Course">
              <select className={inputClass} name="course_id" required>
                <option value="">Select course</option>
                {(courses || []).map((course: any) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input className={inputClass} name="title" required />
            </Field>
            <Field label="Summary">
              <textarea className={inputClass} name="summary" rows={3} />
            </Field>
            <Field label="Position">
              <input className={inputClass} name="position" type="number" min={1} defaultValue={1} />
            </Field>
            <Button className="w-fit" type="submit">Create module</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Create lesson</h2>
          <form action={createLesson} className="mt-4 grid gap-3">
            <Field label="Module">
              <select className={inputClass} name="module_id" required>
                <option value="">Select module</option>
                {(modules || []).map((module: any) => (
                  <option key={module.id} value={module.id}>{module.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input className={inputClass} name="title" required />
            </Field>
            <Field label="Objective">
              <input className={inputClass} name="objective" />
            </Field>
            <Field label="Text/HTML content">
              <textarea className={inputClass} name="content_html" rows={5} />
            </Field>
            <Field label="Position">
              <input className={inputClass} name="position" type="number" min={1} defaultValue={1} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input name="published" type="checkbox" defaultChecked />
              Published
            </label>
            <Button className="w-fit" type="submit">Create lesson</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Attach lesson material</h2>
          <form action={createLessonMaterial} className="mt-4 grid gap-3">
            <Field label="Lesson">
              <select className={inputClass} name="lesson_id" required>
                <option value="">Select lesson</option>
                {(lessons || []).map((lesson: any) => (
                  <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input className={inputClass} name="title" required />
            </Field>
            <Field label="Material type">
              <select className={inputClass} name="material_type" required>
                <option value="external_url">External URL</option>
                <option value="embed">Embedded website/iframe</option>
                <option value="html">Text/HTML block</option>
                <option value="pdf">File upload: PDF/image/audio/video</option>
              </select>
            </Field>
            <Field label="Upload file">
              <input className={inputClass} name="file" type="file" accept=".pdf,image/*,audio/*,video/*" />
            </Field>
            <Field label="URL or embed source">
              <input className={inputClass} name="url" placeholder="https://..." />
            </Field>
            <Field label="Text/HTML block">
              <textarea className={inputClass} name="content_html" rows={4} />
            </Field>
            <Field label="Position">
              <input className={inputClass} name="position" type="number" min={1} defaultValue={1} />
            </Field>
            <Button className="w-fit" type="submit">Add material</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Assign course to group</h2>
          <form action={assignCourseToGroup} className="mt-4 grid gap-3">
            <Field label="Group">
              <select className={inputClass} name="group_id" required>
                <option value="">Select group</option>
                {(groups || []).map((group: any) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Course">
              <select className={inputClass} name="course_id" required>
                <option value="">Select course</option>
                {(courses || []).map((course: any) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </Field>
            <Button className="w-fit" type="submit">Assign course</Button>
          </form>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-bold">Users and roles</h2>
        <div className="mt-4 grid gap-3">
          {(profiles || []).length ? profiles?.map((profile: any) => (
            <form key={profile.id} action={updateUserRole} className="grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[1fr_180px_auto] sm:items-center">
              <input type="hidden" name="profile_id" value={profile.id} />
              <div>
                <p className="font-semibold">{profile.full_name || "Unnamed user"}</p>
                <p className="text-xs text-slate-500">{profile.id}</p>
              </div>
              <select className={inputClass} name="role" defaultValue={profile.role}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              <Button variant="secondary" type="submit">Update</Button>
            </form>
          )) : (
            <EmptyState title="No users yet" description="Create or sign up users to see them here." />
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Current assignments</h2>
        <div className="mt-4 grid gap-2">
          {(assignments || []).length ? assignments?.map((assignment: any) => (
            <div key={assignment.id} className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 p-3 text-sm">
              <Badge>{assignment.groups?.name || "Group"}</Badge>
              <span className="text-slate-500">has</span>
              <strong>{assignment.courses?.title || "Course"}</strong>
            </div>
          )) : (
            <EmptyState title="No assignments yet" description="Assign a course to a group to unlock it for students." />
          )}
        </div>
      </Card>
    </div>
  );
}
