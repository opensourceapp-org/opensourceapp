"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletterAction } from "@/server/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewsletterSubscribeForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await subscribeNewsletterAction({ email, name });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.alreadySubscribed) {
        setMessage("You're already on the list — thanks for reading.");
      } else {
        setMessage("You're subscribed. We'll share updates when we have news.");
      }
      setEmail("");
      setName("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="newsletter-email" className="text-foreground">
          Email
        </Label>
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={pending}
          className="min-h-11 bg-background"
          aria-invalid={Boolean(error)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="newsletter-name" className="text-foreground">
          Name{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="newsletter-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="How we should greet you"
          disabled={pending}
          className="min-h-11 bg-background"
        />
      </div>
      <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={pending}>
        {pending ? "Subscribing…" : "Subscribe"}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-primary" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
