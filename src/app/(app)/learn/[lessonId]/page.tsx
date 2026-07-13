import { redirect } from "next/navigation";
import { ExternalLink, FileText, Headphones, ImageIcon, PlayCircle } from "lucide-react";
import { markLessonComplete } from "@/app/actions/lms";
import { Button } from "@/components/button";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { extractEmbedSrc, sanitizeHtml } from "@/lib/validation";

function MaterialView({ material }: { material: any }) {
  if (material.material_type === "html") {
    return (
      <div
        className="prose-safe rounded-lg border border-blue-100 bg-blue-50/40 p-5 text-sm leading-7"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(material.content_html || ""),
        }}
      />
    );
  }

  if (material.material_type === "embed" && material.url) {
    const embedSrc = extractEmbedSrc(material.url);

    if (!embedSrc) {
      return null;
    }

    return (
      <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
        <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-ink">
          Embedded activity
        </div>
        <iframe
          className="aspect-video w-full bg-white"
          src={embedSrc}
          title={material.title}
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      </div>
    );
  }

  if (material.material_type === "image" && material.url) {
    return (
      <div className="rounded-xl border border-blue-100 bg-slate-50 p-3">
        <img
          alt={material.title}
          className="max-h-[520px] w-full rounded-lg object-contain"
          src={material.url}
        />
      </div>
    );
  }

  if (material.material_type === "audio" && material.url) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Headphones className="h-4 w-4 text-ocean" />
          Audio practice
        </div>
        <audio className="w-full" controls src={material.url} />
      </div>
    );
  }

  if (material.material_type === "video" && material.url) {
    return (
      <div className="overflow-hidden rounded-xl border border-blue-100 bg-black">
        <video className="aspect-video w-full" controls src={material.url} />
      </div>
    );
  }

  if (material.material_type === "pdf" && material.url) {
    return (
      <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
        <div className="flex items-center gap-2 border-b border-blue-100 bg-amber-50 px-4 py-2 text-sm font-semibold text-ink">
          <FileText className="h-4 w-4 text-coral" />
          PDF material
        </div>
        <iframe
          className="h-[640px] w-full bg-white"
          src={material.url}
          title={material.title}
        />
      </div>
    );
  }

  if (material.url) {
    return (
      <a
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ocean px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        href={material.url}
        rel="noreferrer"
        target="_blank"
      >
        <ExternalLink className="h-4 w-4" />
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
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-coral">
                    {material.material_type === "image" ? (
                      <ImageIcon className="h-5 w-5" />
                    ) : material.material_type === "video" ? (
                      <PlayCircle className="h-5 w-5" />
                    ) : material.material_type === "audio" ? (
                      <Headphones className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className="font-bold">{material.title}</h3>
                </div>
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
