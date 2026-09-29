import { requireAuth } from "@/lib/auth/session";
import { SubmitForm } from "@/components/submit-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function SubmitPage() {
  await requireAuth("/submit");

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Submit" },
        ]}
      />
      <div className="max-w-2xl space-y-2">
        <h1 className="font-display text-3xl font-normal tracking-tight">
          Submit an app
        </h1>
        <p className="text-muted-foreground">
          Share an open-source project with the community. Submissions are
          reviewed before publishing.
        </p>
      </div>
      <SubmitForm />
    </div>
  );
}
