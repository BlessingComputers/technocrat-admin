"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { NewPasswordFields } from "@/components/shared/new-password-fields";
import { ApiError } from "@/lib/api/error";
import { getErrorMessage } from "@/lib/api/error-message";
import { isNewPasswordValid } from "@/lib/auth/password-policy";
import { useResetPassword } from "../api/auth.queries";

/**
 * Accept the bare code or the whole emailed link. The email shows only a link,
 * and staff opening it on another device may paste it as-is.
 */
function extractResetToken(input: string): string {
  const trimmed = input.trim();
  try {
    return new URL(trimmed).searchParams.get("token") ?? trimmed;
  } catch {
    return trimmed;
  }
}

function isExpiredToken(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.data as { code?: string } | null)?.code === "INVALID_RESET_TOKEN"
  );
}

/**
 * Public page the reset email links to (`{ADMIN_URL}/reset-password?token=…`).
 * Tokens last 15 minutes and work once.
 */
export function ResetPasswordForm() {
  const tokenFromLink = useSearchParams().get("token") ?? "";
  const [codeInput, setCodeInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const reset = useResetPassword();

  const token = tokenFromLink || extractResetToken(codeInput);
  const canSubmit =
    token.length > 0 &&
    isNewPasswordValid(newPassword, confirmPassword) &&
    !reset.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    reset.mutate({ token, newPassword });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <Logo href="/login" className="w-36 justify-center" />
      </div>

      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
            Choose a new password
          </CardTitle>
          <CardDescription>
            This signs you out everywhere. You will sign in again with the new
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              {!tokenFromLink && (
                <Field>
                  <FieldLabel htmlFor="resetCode" className="flex items-center gap-2">
                    <AppIcon icon="solar:key-linear" className="size-3.5 text-muted-foreground" />
                    Reset code or link
                  </FieldLabel>
                  <Input
                    id="resetCode"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Paste the link from your email"
                    className="h-11"
                    autoComplete="off"
                    required
                  />
                </Field>
              )}

              <NewPasswordFields
                password={newPassword}
                confirm={confirmPassword}
                onPasswordChange={setNewPassword}
                onConfirmChange={setConfirmPassword}
              />

              {reset.isError && (
                <div
                  role="alert"
                  className="flex flex-col gap-1 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive-ink"
                >
                  <span className="flex items-center gap-2">
                    <AppIcon icon="solar:danger-circle-linear" className="size-4 shrink-0" />
                    {getErrorMessage(reset.error, "Could not reset the password")}
                  </span>
                  {isExpiredToken(reset.error) && (
                    <Link href="/forgot-password" className="underline underline-offset-4">
                      Request a new link
                    </Link>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full text-base font-semibold"
                disabled={!canSubmit}
              >
                {reset.isPending ? "Saving..." : "Set new password"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <AppIcon icon="solar:arrow-left-linear" className="size-3.5" />
        Back to sign in
      </Link>
    </div>
  );
}
