"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isAllowedEmbedUrl,
  isValidHttpUrl,
  materialTypeFromMime,
  sanitizeHtml,
} from "@/lib/validation";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function createStudent(formData: FormData) {
  await requireRole(["admin"]);
  const email = value(formData, "email");
  const password = value(formData, "password");
  const fullName = value(formData, "full_name");
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    role: "student",
  });

  revalidatePath("/admin");
  redirect("/admin?message=Student created");
}

export async function updateUserRole(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const profileId = value(formData, "profile_id");
  const role = value(formData, "role");

  if (!["student", "teacher", "admin"].includes(role)) {
    redirect("/admin?error=Invalid role");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  redirect("/admin?message=Role updated");
}

export async function createGroup(formData: FormData) {
  const profile = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase.from("groups").insert({
    name: value(formData, "name"),
    description: value(formData, "description"),
    created_by: profile.id,
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  redirect("/admin?message=Group created");
}

export async function addStudentToGroup(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase.from("group_students").upsert({
    group_id: value(formData, "group_id"),
    student_id: value(formData, "student_id"),
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  redirect("/admin?message=Student added to group");
}

export async function createCourse(formData: FormData) {
  const profile = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase.from("courses").insert({
    title: value(formData, "title"),
    description: value(formData, "description"),
    level: value(formData, "level"),
    published: formData.get("published") === "on",
    created_by: profile.id,
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  revalidatePath("/courses");
  redirect("/admin?message=Course created");
}

export async function createModule(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase.from("modules").insert({
    course_id: value(formData, "course_id"),
    title: value(formData, "title"),
    summary: value(formData, "summary"),
    position: Number(value(formData, "position") || 1),
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  redirect("/admin?message=Module created");
}

export async function createLesson(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase.from("lessons").insert({
    module_id: value(formData, "module_id"),
    title: value(formData, "title"),
    objective: value(formData, "objective"),
    content_html: sanitizeHtml(value(formData, "content_html")),
    position: Number(value(formData, "position") || 1),
    published: formData.get("published") === "on",
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  redirect("/admin?message=Lesson created");
}

export async function createLessonMaterial(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  const lessonId = value(formData, "lesson_id");
  let materialType = value(formData, "material_type");
  let url = value(formData, "url") || null;
  let storagePath: string | null = null;
  let contentHtml: string | null = null;
  const file = formData.get("file");

  if (materialType === "html") {
    contentHtml = sanitizeHtml(value(formData, "content_html"));
    url = null;
  }

  if (materialType === "external_url" && url && !isValidHttpUrl(url)) {
    redirect("/admin?error=External URL must be a valid http or https URL");
  }

  if (materialType === "embed" && url && !isAllowedEmbedUrl(url)) {
    redirect("/admin?error=Embed URL is not on the allowed list");
  }

  if (file instanceof File && file.size > 0) {
    materialType = materialTypeFromMime(file.type);
    const extension = file.name.split(".").pop() || "file";
    storagePath = `${lessonId}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("lesson-materials")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      redirect(`/admin?error=${encodeURIComponent(uploadError.message)}`);
    }

    const { data } = supabase.storage
      .from("lesson-materials")
      .getPublicUrl(storagePath);
    url = data.publicUrl;
  }

  const { error } = await supabase.from("lesson_materials").insert({
    lesson_id: lessonId,
    title: value(formData, "title"),
    material_type: materialType,
    url,
    storage_path: storagePath,
    content_html: contentHtml,
    position: Number(value(formData, "position") || 1),
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  redirect("/admin?message=Material added");
}

export async function assignCourseToGroup(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const supabase = await createClient();

  const { error } = await supabase.from("group_course_assignments").upsert({
    group_id: value(formData, "group_id"),
    course_id: value(formData, "course_id"),
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin");
  revalidatePath("/courses");
  redirect("/admin?message=Course assigned");
}

export async function markLessonComplete(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const lessonId = value(formData, "lesson_id");

  const { error } = await supabase.from("lesson_progress").upsert({
    lesson_id: lessonId,
    student_id: profile.id,
    completed: true,
    completed_at: new Date().toISOString(),
  });

  if (error) redirect(`/learn/${lessonId}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/learn/${lessonId}`);
  redirect(`/learn/${lessonId}?message=Lesson marked complete`);
}
