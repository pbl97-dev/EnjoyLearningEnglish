import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Users,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: Settings },
];

const staffItems = [
  { href: "/teacher", label: "Progress", icon: GraduationCap },
  { href: "/admin", label: "Admin", icon: Users },
];

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const canManage = profile.role === "teacher" || profile.role === "admin";

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-ocean text-sm font-bold text-white">
            ELE
          </div>
          <div>
            <p className="font-bold text-ink">Enjoy Learning</p>
            <p className="text-xs text-slate-500">English LMS</p>
          </div>
        </Link>

        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {canManage
            ? staffItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))
            : null}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <PanelLeft className="h-5 w-5 text-slate-500 lg:hidden" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {profile.full_name || "Enjoy Learning English"}
                </p>
                <p className="text-xs capitalize text-slate-500">
                  {profile.role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden gap-1 sm:flex lg:hidden">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <form action={signOut}>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
