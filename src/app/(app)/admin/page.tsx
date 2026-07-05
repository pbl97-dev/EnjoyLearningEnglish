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
import {
  Badge,
  Card,
  EmptyState,
  Field,
  PageHeader,
  inputClass,
} from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, ClipboardList, GraduationCap, Layers3, Users } from "lucide-react";

const sections = [
  { href: "#students-groups", label: "Students & Groups" },
  { href: "#curriculum", label: "Courses & Curriculum" },
  { href: "#materials", label: "Lesson Materials" },
  { href: "#assignments", label: "Assignments" },
  { href: "#users-roles", label: "Users & Roles" },
];

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function ToolCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <div>
        <h3 className="text-base font-bold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-ocean">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

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
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("modules").select("*").order("position"),
    supabase.from("lessons").select("*").order("position"),
    supabase
      .from("group_course_assignments")
      .select("*, groups(name), courses(title)")
      .order("assigned_at", { ascending: false }),
  ]);

  const allProfiles = profiles || [];
  const allGroups = groups || [];
  const allCourses = courses || [];
  const allModules = modules || [];
  const allLessons = lessons || [];
  const allAssignments = assignments || [];
  const students = allProfiles.filter(
    (profile: any) => profile.role === "student",
  );

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Admin workspace"
        description="Manage students, classes, curriculum, materials, assignments, and user roles from one organized workspace."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={GraduationCap} label="Students" value={students.length} />
        <SummaryCard icon={Users} label="Groups" value={allGroups.length} />
        <SummaryCard icon={BookOpen} label="Courses" value={allCourses.length} />
        <SummaryCard
          icon={ClipboardList}
          label="Assignments"
          value={allAssignments.length}
        />
      </div>

      <div className="sticky top-[65px] z-10 -mx-4 border-y border-slate-200 bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-[73px]">
        <nav className="flex gap-2 overflow-x-auto">
          {sections.map((section) => (
            <a
              className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-ocean hover:text-ocean"
              href={section.href}
              key={section.href}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </div>

      {params.message ? (
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
          {params.message}
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {params.error}
        </p>
      ) : null}

      <Section
        id="students-groups"
        title="Students & Groups"
        description="Create student accounts, organize classes, and place students into the right learning group."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <ToolCard
            title="Create student"
            description="Add a student login with a temporary password."
          >
            <form action={createStudent} className="grid gap-3">
              <Field label="Full name">
                <input className={inputClass} name="full_name" required />
              </Field>
              <Field label="Email">
                <input
                  className={inputClass}
                  name="email"
                  type="email"
                  required
                />
              </Field>
              <Field label="Temporary password">
                <input
                  className={inputClass}
                  minLength={6}
                  name="password"
                  type="password"
                  required
                />
              </Field>
              <Button className="w-fit" type="submit">
                Create student
              </Button>
            </form>
          </ToolCard>

          <ToolCard
            title="Create group/class"
            description="Set up a class cohort for course assignments."
          >
            <form action={createGroup} className="grid gap-3">
              <Field label="Group name">
                <input className={inputClass} name="name" required />
              </Field>
              <Field label="Description">
                <textarea className={inputClass} name="description" rows={4} />
              </Field>
              <Button className="w-fit" type="submit">
                Create group
              </Button>
            </form>
          </ToolCard>

          <ToolCard
            title="Add student to group"
            description="Connect an existing student with a class."
          >
            <form action={addStudentToGroup} className="grid gap-3">
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
                  {allGroups.map((group: any) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </Field>
              {!students.length || !allGroups.length ? (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  Create at least one student and one group before adding
                  memberships.
                </p>
              ) : null}
              <Button className="w-fit" type="submit">
                Add to group
              </Button>
            </form>
          </ToolCard>
        </div>
      </Section>

      <Section
        id="curriculum"
        title="Courses & Curriculum"
        description="Build the learning hierarchy in order: Course > Module > Lesson."
      >
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge>Course</Badge>
          <span className="text-slate-400">then</span>
          <Badge>Module</Badge>
          <span className="text-slate-400">then</span>
          <Badge>Lesson</Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <ToolCard
            title="Create course"
            description="Create the top-level learning path students will see."
          >
            <form action={createCourse} className="grid gap-3">
              <Field label="Course title">
                <input className={inputClass} name="title" required />
              </Field>
              <Field label="Level">
                <input
                  className={inputClass}
                  name="level"
                  placeholder="A1, A2, B1..."
                />
              </Field>
              <Field label="Description">
                <textarea className={inputClass} name="description" rows={4} />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input name="published" type="checkbox" defaultChecked />
                Published
              </label>
              <Button className="w-fit" type="submit">
                Create course
              </Button>
            </form>
          </ToolCard>

          <ToolCard
            title="Create module"
            description="Group related lessons inside a course."
          >
            <form action={createModule} className="grid gap-3">
              <Field label="Course">
                <select className={inputClass} name="course_id" required>
                  <option value="">Select course</option>
                  {allCourses.map((course: any) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Module title">
                <input className={inputClass} name="title" required />
              </Field>
              <Field label="Summary">
                <textarea className={inputClass} name="summary" rows={3} />
              </Field>
              <Field label="Position">
                <input
                  className={inputClass}
                  name="position"
                  type="number"
                  min={1}
                  defaultValue={1}
                />
              </Field>
              {!allCourses.length ? (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  Create a course before adding modules.
                </p>
              ) : null}
              <Button className="w-fit" type="submit">
                Create module
              </Button>
            </form>
          </ToolCard>

          <ToolCard
            title="Create lesson"
            description="Add lesson content and objectives to a module."
          >
            <form action={createLesson} className="grid gap-3">
              <Field label="Module">
                <select className={inputClass} name="module_id" required>
                  <option value="">Select module</option>
                  {allModules.map((module: any) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Lesson title">
                <input className={inputClass} name="title" required />
              </Field>
              <Field label="Objective">
                <input className={inputClass} name="objective" />
              </Field>
              <Field label="Text/HTML content">
                <textarea className={inputClass} name="content_html" rows={5} />
              </Field>
              <Field label="Position">
                <input
                  className={inputClass}
                  name="position"
                  type="number"
                  min={1}
                  defaultValue={1}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input name="published" type="checkbox" defaultChecked />
                Published
              </label>
              {!allModules.length ? (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  Create a module before adding lessons.
                </p>
              ) : null}
              <Button className="w-fit" type="submit">
                Create lesson
              </Button>
            </form>
          </ToolCard>
        </div>
      </Section>

      <Section
        id="materials"
        title="Lesson Materials"
        description="Attach focused resources to lessons without mixing them into curriculum setup."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(360px,1.15fr)]">
          <Card className="border-blue-100 bg-blue-50/60 shadow-none">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-ocean">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-ink">Material guide</h3>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-700">
                  <p>
                    Use <strong>External URL</strong> for normal links that open
                    in a new browser tab.
                  </p>
                  <p>
                    Use <strong>Embed/Iframe</strong> only for safe embeddable
                    URLs from approved providers.
                  </p>
                  <p>
                    Use <strong>Upload file</strong> for PDFs, images, audio, or
                    video resources.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <ToolCard
            title="Attach lesson material"
            description="Choose a lesson, then add one file, link, embed, or HTML block."
          >
            <form action={createLessonMaterial} className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Lesson">
                  <select className={inputClass} name="lesson_id" required>
                    <option value="">Select lesson</option>
                    {allLessons.map((lesson: any) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Material title">
                  <input className={inputClass} name="title" required />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Material type">
                  <select className={inputClass} name="material_type" required>
                    <option value="external_url">External URL</option>
                    <option value="embed">Embed/Iframe</option>
                    <option value="html">Text/HTML block</option>
                    <option value="pdf">Upload file</option>
                  </select>
                </Field>
                <Field label="Position">
                  <input
                    className={inputClass}
                    name="position"
                    type="number"
                    min={1}
                    defaultValue={1}
                  />
                </Field>
              </div>

              <Field label="Upload file for PDF, image, audio, or video">
                <input
                  className={inputClass}
                  name="file"
                  type="file"
                  accept=".pdf,image/*,audio/*,video/*"
                />
              </Field>
              <Field label="External URL or safe embed source">
                <input
                  className={inputClass}
                  name="url"
                  placeholder="https://..."
                />
              </Field>
              <Field label="Text/HTML block">
                <textarea className={inputClass} name="content_html" rows={4} />
              </Field>
              {!allLessons.length ? (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  Create a lesson before attaching materials.
                </p>
              ) : null}
              <Button className="w-fit" type="submit">
                Add material
              </Button>
            </form>
          </ToolCard>
        </div>
      </Section>

      <Section
        id="assignments"
        title="Assignments"
        description="Assign courses to groups and review the active learning paths."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.85fr)_1fr]">
          <ToolCard
            title="Assign course to group"
            description="Give every student in a group access to a course."
          >
            <form action={assignCourseToGroup} className="grid gap-3">
              <Field label="Group">
                <select className={inputClass} name="group_id" required>
                  <option value="">Select group</option>
                  {allGroups.map((group: any) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Course">
                <select className={inputClass} name="course_id" required>
                  <option value="">Select course</option>
                  {allCourses.map((course: any) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </Field>
              {!allGroups.length || !allCourses.length ? (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  Create at least one group and one course before assigning
                  content.
                </p>
              ) : null}
              <Button className="w-fit" type="submit">
                Assign course
              </Button>
            </form>
          </ToolCard>

          <Card>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Current assignments
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Courses currently connected to groups.
                </p>
              </div>
              <Badge>{allAssignments.length} total</Badge>
            </div>
            <div className="mt-4 grid gap-2">
              {allAssignments.length ? (
                allAssignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
                  >
                    <Badge>{assignment.groups?.name || "Group"}</Badge>
                    <span className="text-slate-500">has access to</span>
                    <strong>{assignment.courses?.title || "Course"}</strong>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No assignments yet"
                  description="Assign a course to a group to unlock it for students."
                />
              )}
            </div>
          </Card>
        </div>
      </Section>

      <Section
        id="users-roles"
        title="Users & Roles"
        description="Review accounts and update role access for students, teachers, and admins."
      >
        <Card>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-ink">Role manager</h3>
              <p className="mt-1 text-sm text-slate-600">
                Role changes take effect the next time the user opens protected
                dashboard pages.
              </p>
            </div>
            <Badge>{allProfiles.length} users</Badge>
          </div>

          <div className="mt-4 grid gap-3">
            {allProfiles.length ? (
              allProfiles.map((profile: any) => (
                <form
                  key={profile.id}
                  action={updateUserRole}
                  className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_180px_auto] sm:items-center"
                >
                  <input type="hidden" name="profile_id" value={profile.id} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {profile.full_name || "Unnamed user"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {profile.id}
                    </p>
                  </div>
                  <select
                    className={inputClass}
                    name="role"
                    defaultValue={profile.role}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button variant="secondary" type="submit">
                    Update
                  </Button>
                </form>
              ))
            ) : (
              <EmptyState
                title="No users yet"
                description="Create or sign up users to see them here."
              />
            )}
          </div>
        </Card>
      </Section>
    </div>
  );
}
