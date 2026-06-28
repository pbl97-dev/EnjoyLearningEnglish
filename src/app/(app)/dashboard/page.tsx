import Link from "next/link";
import { BookOpen, CheckCircle2, Users } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (profile.role === "student") {
    const { data: courses } = await supabase.rpc("student_assigned_courses");
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("student_id", profile.id)
      .eq("completed", true);

    return (
      <div className="grid gap-6">
        <PageHeader
          title="Student dashboard"
          description="Your assigned English courses and recent completion progress."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <BookOpen className="h-5 w-5 text-ocean" />
            <p className="mt-3 text-2xl font-bold">{courses?.length || 0}</p>
            <p className="text-sm text-slate-600">Assigned courses</p>
          </Card>
          <Card>
            <CheckCircle2 className="h-5 w-5 text-mint" />
            <p className="mt-3 text-2xl font-bold">{progress?.length || 0}</p>
            <p className="text-sm text-slate-600">Lessons completed</p>
          </Card>
          <Card>
            <Users className="h-5 w-5 text-coral" />
            <p className="mt-3 text-2xl font-bold">Active</p>
            <p className="text-sm text-slate-600">Learning status</p>
          </Card>
        </div>

        {courses?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course: any) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className="h-full transition hover:-translate-y-0.5 hover:border-ocean">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-ink">
                      {course.title}
                    </h2>
                    <Badge>{course.level || "English"}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {course.description || "Course content assigned by your teacher."}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No assigned courses yet"
            description="Your teacher will assign course content to your group."
          />
        )}
      </div>
    );
  }

  const [{ count: students }, { count: groups }, { count: courses }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("groups").select("*", { count: "exact", head: true }),
      supabase.from("courses").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`${profile.role === "admin" ? "Admin" : "Teacher"} dashboard`}
        description="Manage classes, build courses, assign learning paths, and monitor student progress."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Users className="h-5 w-5 text-ocean" />
          <p className="mt-3 text-2xl font-bold">{students || 0}</p>
          <p className="text-sm text-slate-600">Students</p>
        </Card>
        <Card>
          <Users className="h-5 w-5 text-mint" />
          <p className="mt-3 text-2xl font-bold">{groups || 0}</p>
          <p className="text-sm text-slate-600">Groups</p>
        </Card>
        <Card>
          <BookOpen className="h-5 w-5 text-coral" />
          <p className="mt-3 text-2xl font-bold">{courses || 0}</p>
          <p className="text-sm text-slate-600">Courses</p>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin">
          <Card className="transition hover:-translate-y-0.5 hover:border-ocean">
            <h2 className="text-lg font-bold">Build LMS content</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create groups, assign students, add courses, modules, lessons, and materials.
            </p>
          </Card>
        </Link>
        <Link href="/teacher">
          <Card className="transition hover:-translate-y-0.5 hover:border-ocean">
            <h2 className="text-lg font-bold">View progress</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              See completion status across assigned classes and courses.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
