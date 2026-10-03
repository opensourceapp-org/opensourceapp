import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { EditSubmissionForm } from "@/components/edit-submission-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SubmissionStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSubmissionPage({ params }: PageProps) {
  const session = await requireAuth("/dashboard");
  const { id } = await params;

  const submission = await prisma.submission.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!submission) notFound();

  if (
    submission.status !== SubmissionStatus.DRAFT &&
    submission.status !== SubmissionStatus.CHANGES_REQUESTED
  ) {
    return (
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Edit" },
          ]}
        />
        <p className="text-muted-foreground">
          This submission cannot be edited in its current status.
        </p>
        <Link href="/dashboard" className="text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const title =
    submission.status === SubmissionStatus.CHANGES_REQUESTED
      ? "Update submission"
      : "Continue draft";

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: title },
        ]}
      />
      <div className="max-w-2xl space-y-2">
        <h1 className="font-display text-3xl font-normal tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground">
          {submission.status === SubmissionStatus.CHANGES_REQUESTED
            ? "Address the moderator feedback below, then resubmit for review."
            : "Finish your listing and submit when ready."}
        </p>
      </div>
      <EditSubmissionForm submission={submission} />
    </div>
  );
}
