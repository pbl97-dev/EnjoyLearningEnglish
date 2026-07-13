import Link from "next/link";
import { BookOpen, CheckCircle2, GraduationCap, Users } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/button";
import { Card } from "@/components/ui";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <BrandLogo />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-6xl">
            Enjoy Learning English
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            A friendly LMS for English classes, lesson materials, student
            practice, and teacher progress tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={profile ? "/dashboard" : "/auth/sign-in"}>
              <Button>{profile ? "Open dashboard" : "Sign in"}</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant="secondary">Create student account</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            {
              icon: Users,
              title: "Groups and classes",
              text: "Organize students, assign courses, and keep cohorts tidy.",
            },
            {
              icon: BookOpen,
              title: "Courses and lessons",
              text: "Build modules with PDFs, audio, video, images, links, embeds, and HTML.",
            },
            {
              icon: CheckCircle2,
              title: "Completion tracking",
              text: "Students mark lessons complete while teachers see progress.",
            },
            {
              icon: GraduationCap,
              title: "Teacher dashboard",
              text: "Quickly spot who is moving, stuck, or ready for the next task.",
            },
          ].map((item) => (
            <Card key={item.title} className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-coral text-white">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-ink">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
