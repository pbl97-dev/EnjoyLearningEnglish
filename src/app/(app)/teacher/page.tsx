import Link from "next/link";
import { BrandBanner } from "@/components/brand";
import { Badge, Card, EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherProgressPage() {
  await requireRole(["teacher", "admin"]);
  const supabase = await createClient();

  const { data } = await supabase.rpc("teacher_progress_overview");

  return (
    <div className="grid gap-6">
      <BrandBanner
        eyebrow="Teacher progress"
        title="Guide every English learner forward"
        description="Review completion progress by group, student, and assigned course."
      />

      {data?.length ? (
        <div className="grid gap-4">
          {data.map((row: any) => (
            <Card key={`${row.group_id}-${row.student_id}-${row.course_id}`}>
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{row.group_name}</Badge>
                    <Badge>{row.course_title}</Badge>
                  </div>
                  <h2 className="mt-3 text-lg font-bold">{row.student_name}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {row.completed_lessons} of {row.total_lessons} lessons completed
                  </p>
                </div>
                <div className="min-w-44">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-mint"
                      style={{ width: `${row.completion_percent || 0}%` }}
                    />
                  </div>
                  <p className="mt-2 text-right text-sm font-semibold">
                    {row.completion_percent || 0}%
                  </p>
                </div>
              </div>
              <Link
                className="mt-4 inline-flex text-sm font-semibold text-ocean"
                href={`/courses/${row.course_id}`}
              >
                Open course
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No progress yet"
          description="Assign a course to a group and students will appear here after lessons exist."
        />
      )}
    </div>
  );
}
