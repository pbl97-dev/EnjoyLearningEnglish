"use client";

import { useRef, useState, useTransition } from "react";
import { createLessonMaterialRecord } from "@/app/actions/lms";
import { Button } from "@/components/button";
import { Field, inputClass } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

type LessonOption = {
  id: string;
  title: string;
};

function materialTypeFromFile(file: File) {
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

function fileExtension(fileName: string) {
  return fileName.split(".").pop() || "file";
}

export function LessonMaterialUploadForm({
  lessons,
}: {
  lessons: LessonOption[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const lessonId = String(formData.get("lesson_id") || "");
    const title = String(formData.get("title") || "");
    const selectedType = String(formData.get("material_type") || "");
    const file = formData.get("file");

    if (!lessonId || !title || !selectedType) {
      setError("Choose a lesson, title, and material type.");
      return;
    }

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(
          "This file is larger than 25 MB. Host larger videos externally and add them as an External URL or Embed.",
        );
        return;
      }

      const uploadType = materialTypeFromFile(file);

      if (!uploadType) {
        setError("Please upload a PDF, image, audio, or video file.");
        return;
      }

      const supabase = createClient();
      const storagePath = `${lessonId}/${crypto.randomUUID()}.${fileExtension(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("lesson-materials")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage
        .from("lesson-materials")
        .getPublicUrl(storagePath);

      formData.set("material_type", uploadType);
      formData.set("storage_path", storagePath);
      formData.set("url", data.publicUrl);
    } else {
      formData.delete("storage_path");
    }

    formData.delete("file");

    startTransition(async () => {
      await createLessonMaterialRecord(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Lesson">
          <select className={inputClass} name="lesson_id" required>
            <option value="">Select lesson</option>
            {lessons.map((lesson) => (
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
      <p className="rounded-md bg-blue-50 p-3 text-sm leading-6 text-blue-800">
        PDFs, images, audio, and small videos can be uploaded directly. Maximum
        upload size: 25 MB. Larger videos should be hosted externally and added
        as an External URL or Embed.
      </p>

      <Field label="External URL or safe embed source">
        <input className={inputClass} name="url" placeholder="https://..." />
      </Field>
      <p className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
        Paste a trusted embeddable URL or iframe code. The LMS will use only
        the secure src URL. Admins can manage trusted sites in Trusted Embed
        Sources. Some websites may still block iframe display; if an embed does
        not load, use External URL instead.
      </p>
      <Field label="Text/HTML block">
        <textarea className={inputClass} name="content_html" rows={4} />
      </Field>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {!lessons.length ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Create a lesson before attaching materials.
        </p>
      ) : null}

      <Button className="w-fit" type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Add material"}
      </Button>
    </form>
  );
}
