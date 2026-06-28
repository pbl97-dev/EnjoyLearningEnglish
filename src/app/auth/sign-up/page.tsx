import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { Button } from "@/components/button";
import { Card, Field, inputClass } from "@/components/ui";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <Card className="w-full max-w-md">
        <div>
          <p className="text-sm font-semibold text-ocean">Enjoy Learning English</p>
          <h1 className="mt-2 text-2xl font-bold text-ink">Create account</h1>
          <p className="mt-2 text-sm text-slate-600">
            New accounts start as students. Admins can promote teachers later.
          </p>
        </div>

        {params.error ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {params.error}
          </p>
        ) : null}

        <form action={signUp} className="mt-6 grid gap-4">
          <Field label="Full name">
            <input className={inputClass} name="full_name" required />
          </Field>
          <Field label="Email">
            <input className={inputClass} name="email" type="email" required />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              minLength={6}
              name="password"
              type="password"
              required
            />
          </Field>
          <Button type="submit">Create account</Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already registered?{" "}
          <Link className="font-semibold text-ocean" href="/auth/sign-in">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
