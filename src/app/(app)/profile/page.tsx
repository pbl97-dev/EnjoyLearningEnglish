import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/button";
import { Card, Field, PageHeader, inputClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader
        title="Profile"
        description="Keep your contact information and learning goals up to date."
      />
      {params.message ? (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {params.message}
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}
      <Card>
        <form action={updateProfile} className="grid gap-4">
          <Field label="Full name">
            <input
              className={inputClass}
              defaultValue={profile.full_name || ""}
              name="full_name"
              required
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              defaultValue={profile.phone || ""}
              name="phone"
            />
          </Field>
          <Field label="Learning goal">
            <textarea
              className={inputClass}
              defaultValue={profile.learning_goal || ""}
              name="learning_goal"
              rows={5}
            />
          </Field>
          <Button className="w-fit" type="submit">
            Save profile
          </Button>
        </form>
      </Card>
    </div>
  );
}
