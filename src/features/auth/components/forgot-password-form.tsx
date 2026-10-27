"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/shared/app-icon";
import { Logo } from "@/components/shared/logo";
import { getErrorMessage } from "@/lib/api/error-message";
import { useForgotPassword } from "../api/auth.queries";

/**
 * Public page for staff who cannot sign in. Asks the backend to email a reset
 * link. The success copy never says whether the email exists, matching the
 * backend's anti-enumeration response.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const forgot = useForgotPassword();
  const sentTo = forgot.variables;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate(email.trim());
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <Logo href="/login" className="w-36 justify-center" />
      </div>

      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
            Reset your password
          </CardTitle>
          <CardDescription>
            Enter your staff email. We will send a link that works for 15
            minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@technocratng.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </Field>

              {forgot.isSuccess && sentTo && (
                <div
                  role="status"
                  className="flex gap-2 rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success-ink"
                >
                  <AppIcon icon="solar:letter-linear" className="mt-0.5 size-4 shrink-0" />
                  <p>
                    If {sentTo} belongs to a staff account, a reset link is on
                    its way. It expires in 15 minutes. Asking again cancels the
                    earlier link.
                  </p>
                </div>
              )}

              {forgot.isError && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive-ink"
                >
                  {getErrorMessage(forgot.error, "Could not send the reset email")}
                </p>
              )}

              <Button
                type="submit"
                className="h-11 w-full text-base font-semibold"
                disabled={forgot.isPending}
              >
                {forgot.isPending ? "Sending..." : "Send reset link"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2 text-sm">
        <Link
          href="/reset-password"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          I already have a reset link
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <AppIcon icon="solar:arrow-left-linear" className="size-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
