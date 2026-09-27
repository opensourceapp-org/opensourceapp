import { requireAuth } from "@/lib/auth/session";
import { SubmitForm } from "@/components/submit-form";

export default async function SubmitPage() {
  await requireAuth("/submit");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Submit an app</h1>
        <p className="text-muted-foreground">
          Share an open-source project with the community. Submissions are
          reviewed before publishing.
        </p>
      </div>
      <SubmitForm />
    </div>
  );
}
