"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { AppIcon } from "@/components/shared/app-icon";
import { NewPasswordFields } from "@/components/shared/new-password-fields";
import { getErrorMessage } from "@/lib/api/error-message";
import { isNewPasswordValid } from "@/lib/auth/password-policy";
import { useChangePassword } from "../api/settings.queries";

/**
 * Change password for the signed-in admin: current + new password against
 * POST /auth/staff/change-password. The backend revokes every session on
 * success, so the hook signs this browser out too. Staff who no longer know
 * their current password use the emailed link via /forgot-password.
 */
export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const changeMutation = useChangePassword();

  const canSubmit =
    currentPassword.length > 0 &&
    isNewPasswordValid(newPassword, confirmPassword) &&
    !changeMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    changeMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <Card className="border-t-4 border-t-primary">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <AppIcon
              icon="solar:lock-keyhole-minimalistic-bold"
              className="size-4 text-primary-ink"
            />
          </div>
          <CardTitle>Password Management</CardTitle>
        </div>
        <CardDescription>
          Changing your password signs you out on every device, this one
          included. Sign back in with the new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-md space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11"
                required
              />
            </Field>
            <NewPasswordFields
              password={newPassword}
              confirm={confirmPassword}
              onPasswordChange={setNewPassword}
              onConfirmChange={setConfirmPassword}
            />
          </FieldGroup>

          {changeMutation.isError && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive-ink"
            >
              {getErrorMessage(changeMutation.error, "Failed to change password")}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-11 px-8 font-semibold"
            >
              {changeMutation.isPending ? (
                <>
                  <AppIcon
                    icon="solar:refresh-linear"
                    className="mr-2 size-4 animate-spin"
                  />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot your current password?
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
