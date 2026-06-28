import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const profile = await requireProfile();
  const { courseId } = await params;
  const supabase = await createClient();

  if (profile.role === "student") {
    const { data: assigned } = await supabase.rpc("student_has_course", {
      course_id_input: courseId,
    });

    if (!assigned) {
      redirect("/courses");
    }
  }

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) {
    redirect("/courses");
  }

  const { data: modules } = await supabase
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", courseId)
    .order("position");

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("student_id", profile.id)
    .eq("completed", true);

  const completed = new Set((progress || []).map((item: any) => item.lesson_id));

  return (
    <div className="grid gap-6">
      <PageHeader
        title={course.title}
        description={course.description || "Course modules and lessons."}
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{course.level || "English"}</Badge>
        <Badge>{course.published ? "Published" : "Draft"}</Badge>
      </div>

      {modules?.length ? (
        <div className="grid gap-4">
          {modules.map((module: any) => {
            const lessons = [...(module.lessons || [])].sort(
              (a: any, b: any) => a.position - b.position,
            );

            return (
              <Card key={module.id}>
                <h2 className="text-lg font-bold">{module.title}</h2>
                {module.summary ? (
                  <p className="mt-1 text-sm text-slate-600">{module.summary}</p>
                ) : null}
                <div className="mt-4 grid gap-2">
                  {lessons.length ? lessons.map((lesson: any) => (
                    <Link
                      className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 transition hover:border-ocean sm:flex-row sm:items-center sm:justify-between"
                      href={`/learn/${lesson.id}`}
                      key={lesson.id}
                    >
                      <div>
                        <p className="font-semibold">{lesson.title}</p>
                        <p className="text-sm text-slate-500">
                          {lesson.objective || "Lesson activity"}
                        </p>
                      </div>
                      <Badge>{completed.has(lesson.id) ? "Completed" : "Start"}</Badge>
                    </Link>
                  )) : (
                    <EmptyState title="No lessons yet" description="Lessons will appear here once created." />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No modules yet"
          description="This course does not have modules or lessons yet."
        />
      )}
    </div>
  );
}
