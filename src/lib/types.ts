export type UserRole = "student" | "teacher" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  learning_goal: string | null;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  cover_image_url: string | null;
  published: boolean;
  created_by: string | null;
  created_at: string;
};

export type Module = {
  id: string;
  course_id: string;
  title: string;
  summary: string | null;
  position: number;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  objective: string | null;
  content_html: string | null;
  position: number;
  published: boolean;
};

export type LessonMaterial = {
  id: string;
  lesson_id: string;
  title: string;
  material_type:
    | "pdf"
    | "image"
    | "audio"
    | "video"
    | "external_url"
    | "embed"
    | "html";
  url: string | null;
  storage_path: string | null;
  content_html: string | null;
  position: number;
};
