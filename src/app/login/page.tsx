import Link from "next/link";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitHubIcon, GoogleIcon } from "@/components/auth-provider-icons";

type SearchParams = Promise<{ callbackUrl?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? "/dashboard";

  const githubEnabled =
    Boolean(process.env.AUTH_GITHUB_ID) &&
    Boolean(process.env.AUTH_GITHUB_SECRET);
  const googleEnabled =
    Boolean(process.env.AUTH_GOOGLE_ID) &&
    Boolean(process.env.AUTH_GOOGLE_SECRET);
  const emailEnabled =
    Boolean(process.env.EMAIL_SERVER) && Boolean(process.env.EMAIL_FROM);

  return (
    <div className="mx-auto w-full max-w-md px-0 sm:px-2">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Browse without an account. Sign in to submit apps and manage your
            listings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {githubEnabled ? (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo });
              }}
            >
              <Button type="submit" className="min-h-11 w-full gap-2">
                <GitHubIcon />
                Continue with GitHub
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              GitHub sign-in: set <code>AUTH_GITHUB_ID</code> and{" "}
              <code>AUTH_GITHUB_SECRET</code>.
            </p>
          )}

          {googleEnabled && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                className="min-h-11 w-full gap-2"
              >
                <GoogleIcon />
                Continue with Google
              </Button>
            </form>
          )}

          {emailEnabled && (
            <p className="text-xs text-muted-foreground">
              Email magic link is configured via Auth.js Nodemailer provider.
            </p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="inline-flex min-h-10 items-center">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
