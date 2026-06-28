import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { Button } from "@/components/button";
import { Card, Field, inputClass } from "@/components/ui";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <Card className="w-full max-w-md">
        <div>
          <p className="text-sm font-semibold text-ocean">Enjoy Learning English</p>
          <h1 className="mt-2 text-2xl font-bold text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use your student, teacher, or admin account.
          </p>
        </div>

        {params.error ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {params.error}
          </p>
        ) : null}
        {params.message ? (
          <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {params.message}
          </p>
        ) : null}

        <form action={signIn} className="mt-6 grid gap-4">
          <Field label="Email">
            <input className={inputClass} name="email" type="email" required />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              name="password"
              type="password"
              required
            />
          </Field>
          <Button type="submit">Sign in</Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Need an account?{" "}
          <Link className="font-semibold text-ocean" href="/auth/sign-up">
            Sign up
          </Link>
        </p>
      </Card>
    </main>
  );
}
