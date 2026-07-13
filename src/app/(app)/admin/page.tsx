import {
  addStudentToGroup,
  addTrustedEmbedSource,
  assignCourseToGroup,
  createCourse,
  createGroup,
  createLesson,
  createModule,
  createStudent,
  deactivateStudent,
  deactivateTrustedEmbedSource,
  deleteCourse,
  deleteGroup,
  deleteLesson,
  deleteLessonMaterial,
  deleteModule,
  deleteStudent,
  deleteTrustedEmbedSource,
  reactivateStudent,
  reactivateTrustedEmbedSource,
  removeCourseAssignment,
  updateCourse,
  updateGroup,
  updateLesson,
  updateLessonMaterial,
  updateModule,
  updateStudent,
  updateUserRole,
} from "@/app/actions/lms";
import { Button } from "@/components/button";
import { LessonMaterialUploadForm } from "@/components/admin/lesson-material-upload-form";
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
  { href: "#trusted-embed-sources", label: "Trusted Embed Sources" },
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

function ManagementList({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <Badge>{count} total</Badge>
      </div>
      <div className="mt-4 grid gap-3">{children}</div>
    </Card>
  );
}

function EditPanel({
  label = "Edit",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-md border border-slate-200 bg-white">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-ocean">
        {label}
      </summary>
      <div className="border-t border-slate-200 p-3">{children}</div>
    </details>
  );
}

function ConfirmDelete({
  action,
  hidden,
  label,
  confirmWord = "DELETE",
  warning,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  label: string;
  confirmWord?: "DELETE" | "DEACTIVATE" | "REMOVE";
  warning: string;
}) {
  return (
    <details className="rounded-md border border-red-200 bg-red-50/40">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-red-700">
        {label}
      </summary>
      <form action={action} className="grid gap-3 border-t border-red-100 p-3">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <p className="text-sm leading-6 text-red-800">{warning}</p>
        <Field label={`Type ${confirmWord} to confirm`}>
          <input className={inputClass} name="confirm" />
        </Field>
        <Button className="w-fit" type="submit" variant="danger">
          {label}
        </Button>
      </form>
    </details>
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
  const currentProfile = await requireRole(["teacher", "admin"]);
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { data: profiles },
    { data: groups },
    { data: courses },
    { data: modules },
    { data: lessons },
    { data: materials },
    { data: memberships },
    { data: assignments },
    { data: trustedEmbedSources },
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
    supabase.from("lesson_materials").select("*").order("position"),
    supabase.from("group_students").select("*"),
    supabase
      .from("group_course_assignments")
      .select("*, groups(name), courses(title)")
      .order("assigned_at", { ascending: false }),
    supabase
      .from("trusted_embed_sources")
      .select("*")
      .order("domain")
      .then((result) => (result.error ? { data: [] } : result)),
  ]);

  const allProfiles = profiles || [];
  const allGroups = groups || [];
  const allCourses = courses || [];
  const allModules = modules || [];
  const allLessons = lessons || [];
  const allMaterials = materials || [];
  const allMemberships = memberships || [];
  const allAssignments = assignments || [];
  const allTrustedEmbedSources = trustedEmbedSources || [];
  const students = allProfiles.filter(
    (profile: any) => profile.role === "student",
  );
  const lessonOptions = allLessons.map((lesson: any) => ({
    id: lesson.id,
    title: lesson.title,
  }));
  const modulesByCourse = allModules.reduce((acc: any, module: any) => {
    acc[module.course_id] = [...(acc[module.course_id] || []), module];
    return acc;
  }, {});
  const lessonsByModule = allLessons.reduce((acc: any, lesson: any) => {
    acc[lesson.module_id] = [...(acc[lesson.module_id] || []), lesson];
    return acc;
  }, {});
  const materialsByLesson = allMaterials.reduce((acc: any, material: any) => {
    acc[material.lesson_id] = [...(acc[material.lesson_id] || []), material];
    return acc;
  }, {});

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
        description="Invite students, organize classes, and place learners into the right group."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <ToolCard
            title="Invite student"
            description="Create a student login and optionally assign the student to a group."
          >
            {currentProfile.role === "admin" ? (
              <form action={createStudent} className="grid gap-3">
                <Field label="Student full name">
                  <input
                    className={inputClass}
                    name="full_name"
                    placeholder="Ana Garcia"
                    required
                  />
                </Field>
                <Field label="Student email">
                  <input
                    className={inputClass}
                    name="email"
                    type="email"
                    placeholder="ana@example.com"
                    required
                  />
                </Field>
                <Field label="Group/class assignment">
                  <select className={inputClass} name="group_id">
                    <option value="">Assign later</option>
                    {allGroups.map((group: any) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Temporary password">
                  <input
                    className={inputClass}
                    minLength={6}
                    name="password"
                    type="text"
                    placeholder="At least 6 characters"
                    required
                  />
                </Field>
                <p className="rounded-md bg-blue-50 p-3 text-sm leading-6 text-blue-800">
                  This creates a Supabase Auth account and a student profile.
                  Real email invitations are not configured, so no email is
                  sent. Share the student email and temporary password manually,
                  then ask the student to sign in.
                </p>
                <Button className="w-fit" type="submit">
                  Add student
                </Button>
              </form>
            ) : (
              <p className="rounded-md bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                Only admins can create student login accounts. Teachers can add
                existing students to groups with the form below.
              </p>
            )}
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

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <ManagementList
            title="Students"
            description="Edit student names, optionally update email, deactivate access, or permanently delete after confirmation."
            count={students.length}
          >
            {students.length ? (
              students.map((student: any) => (
                <div
                  key={student.id}
                  className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {student.full_name || "Unnamed student"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {student.id}
                    </p>
                  </div>

                  <EditPanel>
                    <form action={updateStudent} className="grid gap-3">
                      <input
                        type="hidden"
                        name="profile_id"
                        value={student.id}
                      />
                      <Field label="Full name">
                        <input
                          className={inputClass}
                          name="full_name"
                          defaultValue={student.full_name || ""}
                          required
                        />
                      </Field>
                      <Field label="New email">
                        <input
                          className={inputClass}
                          name="email"
                          type="email"
                          placeholder="Leave blank to keep current auth email"
                        />
                      </Field>
                      <p className="text-xs leading-5 text-slate-500">
                        Level, notes, and active status are not database fields
                        in the current schema, so they are not shown here.
                      </p>
                      <Button className="w-fit" type="submit">
                        Save student
                      </Button>
                    </form>
                  </EditPanel>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <ConfirmDelete
                      action={deactivateStudent}
                      confirmWord="DEACTIVATE"
                      hidden={{ profile_id: student.id }}
                      label="Deactivate"
                      warning="This blocks the student's Supabase Auth login without deleting their profile, group memberships, or progress."
                    />
                    <form action={reactivateStudent}>
                      <input
                        type="hidden"
                        name="profile_id"
                        value={student.id}
                      />
                      <Button className="w-fit" type="submit" variant="secondary">
                        Reactivate
                      </Button>
                    </form>
                  </div>

                  <ConfirmDelete
                    action={deleteStudent}
                    hidden={{ profile_id: student.id }}
                    label="Delete student"
                    warning="Permanent delete removes the auth user. Related profile data is deleted by database cascade. Prefer Deactivate unless you are sure."
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title="No students yet"
                description="Create a student account to manage student access here."
              />
            )}
          </ManagementList>

          <ManagementList
            title="Groups/classes"
            description="Edit class details or delete a group after reviewing affected students and course assignments."
            count={allGroups.length}
          >
            {allGroups.length ? (
              allGroups.map((group: any) => {
                const studentCount = allMemberships.filter(
                  (membership: any) => membership.group_id === group.id,
                ).length;
                const assignmentCount = allAssignments.filter(
                  (assignment: any) => assignment.group_id === group.id,
                ).length;

                return (
                  <div
                    key={group.id}
                    className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink">{group.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {group.description || "No description"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{studentCount} students</Badge>
                        <Badge>{assignmentCount} courses</Badge>
                      </div>
                    </div>

                    <EditPanel>
                      <form action={updateGroup} className="grid gap-3">
                        <input type="hidden" name="group_id" value={group.id} />
                        <Field label="Name">
                          <input
                            className={inputClass}
                            name="name"
                            defaultValue={group.name}
                            required
                          />
                        </Field>
                        <Field label="Description">
                          <textarea
                            className={inputClass}
                            name="description"
                            defaultValue={group.description || ""}
                            rows={3}
                          />
                        </Field>
                        <p className="text-xs leading-5 text-slate-500">
                          Level and schedule are not database fields in the
                          current schema.
                        </p>
                        <Button className="w-fit" type="submit">
                          Save group
                        </Button>
                      </form>
                    </EditPanel>

                    <ConfirmDelete
                      action={deleteGroup}
                      hidden={{ group_id: group.id }}
                      label="Delete group"
                      warning={`Deleting this group also removes ${studentCount} student memberships and ${assignmentCount} course assignments through existing database cascades.`}
                    />
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No groups yet"
                description="Create a group to organize students and course access."
              />
            )}
          </ManagementList>
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

        <div className="mt-4 grid gap-4">
          <ManagementList
            title="Courses"
            description="Edit course details, publication status, or delete a course after reviewing downstream content."
            count={allCourses.length}
          >
            {allCourses.length ? (
              allCourses.map((course: any) => {
                const courseModules = modulesByCourse[course.id] || [];
                const courseLessons = courseModules.flatMap(
                  (module: any) => lessonsByModule[module.id] || [],
                );
                const assignmentCount = allAssignments.filter(
                  (assignment: any) => assignment.course_id === course.id,
                ).length;

                return (
                  <div
                    key={course.id}
                    className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{course.title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {course.description || "No description"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{course.level || "No level"}</Badge>
                        <Badge>{course.published ? "Published" : "Draft"}</Badge>
                        <Badge>{courseModules.length} modules</Badge>
                        <Badge>{courseLessons.length} lessons</Badge>
                      </div>
                    </div>

                    <EditPanel>
                      <form action={updateCourse} className="grid gap-3">
                        <input
                          type="hidden"
                          name="course_id"
                          value={course.id}
                        />
                        <div className="grid gap-3 md:grid-cols-2">
                          <Field label="Title">
                            <input
                              className={inputClass}
                              name="title"
                              defaultValue={course.title}
                              required
                            />
                          </Field>
                          <Field label="Level">
                            <input
                              className={inputClass}
                              name="level"
                              defaultValue={course.level || ""}
                            />
                          </Field>
                        </div>
                        <Field label="Description">
                          <textarea
                            className={inputClass}
                            name="description"
                            defaultValue={course.description || ""}
                            rows={3}
                          />
                        </Field>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input
                            name="published"
                            type="checkbox"
                            defaultChecked={course.published}
                          />
                          Published
                        </label>
                        <Button className="w-fit" type="submit">
                          Save course
                        </Button>
                      </form>
                    </EditPanel>

                    <ConfirmDelete
                      action={deleteCourse}
                      hidden={{ course_id: course.id }}
                      label="Delete course"
                      warning={`Deleting this course also removes ${courseModules.length} modules, ${courseLessons.length} lessons, their materials, progress rows, and ${assignmentCount} assignments through existing database cascades.`}
                    />
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No courses yet"
                description="Create a course before managing curriculum content."
              />
            )}
          </ManagementList>

          <ManagementList
            title="Modules by course"
            description="Modules are grouped under their parent course for easier curriculum maintenance."
            count={allModules.length}
          >
            {allCourses.length ? (
              allCourses.map((course: any) => {
                const courseModules = modulesByCourse[course.id] || [];

                return (
                  <div key={course.id} className="grid gap-2">
                    <h4 className="text-sm font-bold text-ink">
                      {course.title}
                    </h4>
                    {courseModules.length ? (
                      courseModules.map((module: any) => {
                        const moduleLessons = lessonsByModule[module.id] || [];

                        return (
                          <div
                            key={module.id}
                            className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-ink">
                                  {module.position}. {module.title}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {module.summary || "No summary"}
                                </p>
                              </div>
                              <Badge>{moduleLessons.length} lessons</Badge>
                            </div>

                            <EditPanel>
                              <form action={updateModule} className="grid gap-3">
                                <input
                                  type="hidden"
                                  name="module_id"
                                  value={module.id}
                                />
                                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                                  <Field label="Title">
                                    <input
                                      className={inputClass}
                                      name="title"
                                      defaultValue={module.title}
                                      required
                                    />
                                  </Field>
                                  <Field label="Position">
                                    <input
                                      className={inputClass}
                                      name="position"
                                      type="number"
                                      min={1}
                                      defaultValue={module.position}
                                    />
                                  </Field>
                                </div>
                                <Field label="Summary">
                                  <textarea
                                    className={inputClass}
                                    name="summary"
                                    defaultValue={module.summary || ""}
                                    rows={3}
                                  />
                                </Field>
                                <Button className="w-fit" type="submit">
                                  Save module
                                </Button>
                              </form>
                            </EditPanel>

                            <ConfirmDelete
                              action={deleteModule}
                              hidden={{ module_id: module.id }}
                              label="Delete module"
                              warning={`Deleting this module also removes ${moduleLessons.length} lessons, their materials, and related progress through existing database cascades.`}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <EmptyState
                        title="No modules for this course"
                        description="Create a module to start adding lessons."
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No courses yet"
                description="Courses will appear here after they are created."
              />
            )}
          </ManagementList>

          <ManagementList
            title="Lessons by module"
            description="Edit lesson text, objectives, position, and published status."
            count={allLessons.length}
          >
            {allModules.length ? (
              allModules.map((module: any) => {
                const moduleLessons = lessonsByModule[module.id] || [];
                const parentCourse = allCourses.find(
                  (course: any) => course.id === module.course_id,
                );

                return (
                  <div key={module.id} className="grid gap-2">
                    <h4 className="text-sm font-bold text-ink">
                      {parentCourse?.title || "Course"} / {module.title}
                    </h4>
                    {moduleLessons.length ? (
                      moduleLessons.map((lesson: any) => {
                        const lessonMaterials = materialsByLesson[lesson.id] || [];

                        return (
                          <div
                            key={lesson.id}
                            className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-ink">
                                  {lesson.position}. {lesson.title}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {lesson.objective || "No objective"}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge>
                                  {lesson.published ? "Published" : "Draft"}
                                </Badge>
                                <Badge>{lessonMaterials.length} materials</Badge>
                              </div>
                            </div>

                            <EditPanel>
                              <form action={updateLesson} className="grid gap-3">
                                <input
                                  type="hidden"
                                  name="lesson_id"
                                  value={lesson.id}
                                />
                                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                                  <Field label="Title">
                                    <input
                                      className={inputClass}
                                      name="title"
                                      defaultValue={lesson.title}
                                      required
                                    />
                                  </Field>
                                  <Field label="Position">
                                    <input
                                      className={inputClass}
                                      name="position"
                                      type="number"
                                      min={1}
                                      defaultValue={lesson.position}
                                    />
                                  </Field>
                                </div>
                                <Field label="Objective">
                                  <input
                                    className={inputClass}
                                    name="objective"
                                    defaultValue={lesson.objective || ""}
                                  />
                                </Field>
                                <Field label="Text/HTML content">
                                  <textarea
                                    className={inputClass}
                                    name="content_html"
                                    defaultValue={lesson.content_html || ""}
                                    rows={5}
                                  />
                                </Field>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                  <input
                                    name="published"
                                    type="checkbox"
                                    defaultChecked={lesson.published}
                                  />
                                  Published
                                </label>
                                <Button className="w-fit" type="submit">
                                  Save lesson
                                </Button>
                              </form>
                            </EditPanel>

                            <ConfirmDelete
                              action={deleteLesson}
                              hidden={{ lesson_id: lesson.id }}
                              label="Delete lesson"
                              warning={`Deleting this lesson also removes ${lessonMaterials.length} materials and related progress through existing database cascades.`}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <EmptyState
                        title="No lessons for this module"
                        description="Create a lesson to add learning activities."
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No modules yet"
                description="Modules will appear here after they are created."
              />
            )}
          </ManagementList>
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
                    URLs from trusted providers. Admins can manage trusted
                    providers in Trusted Embed Sources.
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
            <LessonMaterialUploadForm lessons={lessonOptions} />
          </ToolCard>
        </div>

        <div className="mt-4">
          <ManagementList
            title="Materials by lesson"
            description="Edit material metadata, links, embeds, HTML blocks, and positions. Uploaded files are removed from storage when their material row is deleted."
            count={allMaterials.length}
          >
            {allLessons.length ? (
              allLessons.map((lesson: any) => {
                const lessonMaterials = materialsByLesson[lesson.id] || [];
                const parentModule = allModules.find(
                  (module: any) => module.id === lesson.module_id,
                );
                const parentCourse = allCourses.find(
                  (course: any) => course.id === parentModule?.course_id,
                );

                return (
                  <div key={lesson.id} className="grid gap-2">
                    <h4 className="text-sm font-bold text-ink">
                      {parentCourse?.title || "Course"} /{" "}
                      {parentModule?.title || "Module"} / {lesson.title}
                    </h4>
                    {lessonMaterials.length ? (
                      lessonMaterials.map((material: any) => (
                        <div
                          key={material.id}
                          className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink">
                                {material.position}. {material.title}
                              </p>
                              <p className="truncate text-sm text-slate-600">
                                {material.url ||
                                  material.storage_path ||
                                  "Text/HTML block"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge>
                                {String(material.material_type).replace(
                                  "_",
                                  " ",
                                )}
                              </Badge>
                              {material.storage_path ? (
                                <Badge>Storage file</Badge>
                              ) : null}
                            </div>
                          </div>

                          <EditPanel>
                            <form
                              action={updateLessonMaterial}
                              className="grid gap-3"
                            >
                              <input
                                type="hidden"
                                name="material_id"
                                value={material.id}
                              />
                              <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
                                <Field label="Title">
                                  <input
                                    className={inputClass}
                                    name="title"
                                    defaultValue={material.title}
                                    required
                                  />
                                </Field>
                                <Field label="Material type">
                                  <select
                                    className={inputClass}
                                    name="material_type"
                                    defaultValue={material.material_type}
                                    required
                                  >
                                    <option value="external_url">
                                      External URL
                                    </option>
                                    <option value="embed">Embed/Iframe</option>
                                    <option value="html">Text/HTML block</option>
                                    <option value="pdf">PDF</option>
                                    <option value="image">Image</option>
                                    <option value="audio">Audio</option>
                                    <option value="video">Video</option>
                                  </select>
                                </Field>
                                <Field label="Position">
                                  <input
                                    className={inputClass}
                                    name="position"
                                    type="number"
                                    min={1}
                                    defaultValue={material.position}
                                  />
                                </Field>
                              </div>
                              <Field label="URL or embed source">
                                <input
                                  className={inputClass}
                                  name="url"
                                  defaultValue={material.url || ""}
                                  placeholder="https://..."
                                />
                              </Field>
                              <p className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                                Paste a trusted embeddable URL or iframe code.
                                The LMS will use only the secure src URL. Some
                                websites may still block iframe display; if an
                                embed does not load, use External URL instead.
                              </p>
                              <Field label="Text/HTML block">
                                <textarea
                                  className={inputClass}
                                  name="content_html"
                                  defaultValue={material.content_html || ""}
                                  rows={4}
                                />
                              </Field>
                              <p className="text-xs leading-5 text-slate-500">
                                Visibility/published status is not a field in
                                the current lesson_materials schema. To replace
                                an uploaded file, delete this material and add a
                                new upload.
                              </p>
                              <Button className="w-fit" type="submit">
                                Save material
                              </Button>
                            </form>
                          </EditPanel>

                          <ConfirmDelete
                            action={deleteLessonMaterial}
                            hidden={{ material_id: material.id }}
                            label="Delete material"
                            warning={
                              material.storage_path
                                ? "Deleting this material removes its database row and attempts to remove the uploaded storage object."
                                : "Deleting this material removes the database row for this link, embed, or text block."
                            }
                          />
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="No materials for this lesson"
                        description="Attach a material to make lesson resources visible."
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No lessons yet"
                description="Create lessons before managing lesson materials."
              />
            )}
          </ManagementList>
        </div>
      </Section>

      <Section
        id="trusted-embed-sources"
        title="Trusted Embed Sources"
        description="Manage which domains are allowed for controlled lesson-material iframes."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_1fr]">
          <ToolCard
            title="Add trusted site"
            description="Add only domains you trust for educational embeds. Do not paste full iframe code here."
          >
            {currentProfile.role === "admin" ? (
              <form action={addTrustedEmbedSource} className="grid gap-3">
                <Field label="Label">
                  <input
                    className={inputClass}
                    name="label"
                    placeholder="British Council"
                  />
                </Field>
                <Field label="Domain">
                  <input
                    className={inputClass}
                    name="domain"
                    placeholder="learnenglish.britishcouncil.org"
                    required
                  />
                </Field>
                <p className="rounded-md bg-blue-50 p-3 text-sm leading-6 text-blue-800">
                  The LMS validates only HTTPS iframe src URLs against trusted
                  domains. Some websites may still block iframe display with
                  their own security settings; if an embed does not load, use
                  External URL instead.
                </p>
                <Button className="w-fit" type="submit">
                  Add trusted site
                </Button>
              </form>
            ) : (
              <p className="rounded-md bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                Only admins can manage trusted embed sources.
              </p>
            )}
          </ToolCard>

          <ManagementList
            title="Trusted domains"
            description="Active domains can be used for Embed/Iframe lesson materials. Deactivate first when you want to pause a source."
            count={allTrustedEmbedSources.length}
          >
            {allTrustedEmbedSources.length ? (
              allTrustedEmbedSources.map((source: any) => (
                <div
                  key={source.id}
                  className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">
                        {source.label || source.domain}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {source.domain}
                      </p>
                    </div>
                    <Badge>{source.is_active ? "Active" : "Inactive"}</Badge>
                  </div>

                  {currentProfile.role === "admin" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <form
                        action={
                          source.is_active
                            ? deactivateTrustedEmbedSource
                            : reactivateTrustedEmbedSource
                        }
                      >
                        <input
                          type="hidden"
                          name="source_id"
                          value={source.id}
                        />
                        <Button
                          className="w-fit"
                          type="submit"
                          variant="secondary"
                        >
                          {source.is_active ? "Deactivate" : "Reactivate"}
                        </Button>
                      </form>

                      <ConfirmDelete
                        action={deleteTrustedEmbedSource}
                        hidden={{ source_id: source.id }}
                        label="Delete trusted site"
                        warning="Deleting this trusted source prevents future embeds from this domain from passing validation. Existing saved material URLs are not rewritten."
                      />
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState
                title="No trusted sources found"
                description="Run the trusted embed sources migration, then active domains will appear here."
              />
            )}
          </ManagementList>
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
                    className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{assignment.groups?.name || "Group"}</Badge>
                      <span className="text-slate-500">has access to</span>
                      <strong>{assignment.courses?.title || "Course"}</strong>
                    </div>
                    <ConfirmDelete
                      action={removeCourseAssignment}
                      confirmWord="REMOVE"
                      hidden={{ assignment_id: assignment.id }}
                      label="Remove assignment"
                      warning="Removing this assignment immediately hides the course from students who only receive access through this group."
                    />
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
