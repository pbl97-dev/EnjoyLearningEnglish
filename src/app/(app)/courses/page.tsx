import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: courses } =
    profile.role === "student"
      ? await supabase.rpc("student_assigned_courses")
      : await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Courses"
        description={
          profile.role === "student"
            ? "Courses assigned to your groups/classes."
            : "All courses available in the LMS."
        }
      />

      {courses?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course: any) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-ocean">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-ink">{course.title}</h2>
                  <Badge>{course.level || "Course"}</Badge>
                </div>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                  {course.description || "No description yet."}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No courses available"
          description="Assigned course content will appear here."
        />
      )}
    </div>
  );
}
