import { redirect } from "next/navigation";
import { markLessonComplete } from "@/app/actions/lms";
import { Button } from "@/components/button";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/validation";

function MaterialView({ material }: { material: any }) {
  if (material.material_type === "html") {
    return (
      <div
        className="prose-safe rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(material.content_html || ""),
        }}
      />
    );
  }

  if (material.material_type === "embed" && material.url) {
    return (
      <iframe
        className="aspect-video w-full rounded-md border border-slate-200 bg-white"
        src={material.url}
        title={material.title}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        referrerPolicy="no-referrer"
      />
    );
  }

  if (material.material_type === "image" && material.url) {
    return (
      <img
        alt={material.title}
        className="max-h-[520px] w-full rounded-md border border-slate-200 object-contain"
        src={material.url}
      />
    );
  }

  if (material.material_type === "audio" && material.url) {
    return <audio className="w-full" controls src={material.url} />;
  }

  if (material.material_type === "video" && material.url) {
    return (
      <video
        className="aspect-video w-full rounded-md bg-black"
        controls
        src={material.url}
      />
    );
  }

  if (material.material_type === "pdf" && material.url) {
    return (
      <iframe
        className="h-[640px] w-full rounded-md border border-slate-200 bg-white"
        src={material.url}
        title={material.title}
      />
    );
  }

  if (material.url) {
    return (
      <a
        className="inline-flex min-h-10 items-center rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white"
        href={material.url}
        rel="noreferrer"
        target="_blank"
      >
        Open resource
      </a>
    );
  }

  return null;
}

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const profile = await requireProfile();
  const { lessonId } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, modules(*, courses(*))")
    .eq("id", lessonId)
    .single();

  if (!lesson) {
    redirect("/courses");
  }

  if (profile.role === "student") {
    const { data: assigned } = await supabase.rpc("student_has_course", {
      course_id_input: lesson.modules.course_id,
    });

    if (!assigned) {
      redirect("/courses");
    }
  }

  const [{ data: materials }, { data: progress }] = await Promise.all([
    supabase
      .from("lesson_materials")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("position"),
    supabase
      .from("lesson_progress")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("student_id", profile.id)
      .maybeSingle(),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={lesson.title}
        description={lesson.objective || lesson.modules?.courses?.title || "Lesson"}
      />

      {query.message ? (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {query.message}
        </p>
      ) : null}
      {query.error ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {query.error}
        </p>
      ) : null}

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge>{progress?.completed ? "Completed" : "In progress"}</Badge>
            <p className="mt-3 text-sm text-slate-600">
              Course: {lesson.modules?.courses?.title}
            </p>
          </div>
          {profile.role === "student" ? (
            <form action={markLessonComplete}>
              <input type="hidden" name="lesson_id" value={lesson.id} />
              <Button type="submit" disabled={Boolean(progress?.completed)}>
                {progress?.completed ? "Completed" : "Mark complete"}
              </Button>
            </form>
          ) : null}
        </div>

        {lesson.content_html ? (
          <div
            className="prose-safe mt-5 rounded-md bg-slate-50 p-4 text-sm leading-7 text-slate-700"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(lesson.content_html),
            }}
          />
        ) : null}
      </Card>

      <section className="grid gap-4">
        <h2 className="text-xl font-bold">Materials</h2>
        {materials?.length ? (
          materials.map((material: any) => (
            <Card key={material.id}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">{material.title}</h3>
                <Badge>{material.material_type.replace("_", " ")}</Badge>
              </div>
              <MaterialView material={material} />
            </Card>
          ))
        ) : (
          <EmptyState
            title="No materials yet"
            description="Your teacher can attach files, links, embeds, and text blocks."
          />
        )}
      </section>
    </div>
  );
}
