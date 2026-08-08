"use client";

import { useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { useStaffSession } from "@/lib/auth/session-context";
import {
  useResetPassword,
  useRequestPasswordToken,
} from "../api/settings.queries";

/**
 * Password management. Reads the signed-in admin from the real session provider
 * (`useStaffSession`) — no more hardcoded mock session. The email drives the
 * "request reset token" flow.
 */
export function SecuritySettings() {
  const { staffSession } = useStaffSession();
  const email = staffSession?.email;

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetMutation = useResetPassword();
  const forgotMutation = useRequestPasswordToken();

  const handleRequestToken = () => {
    if (!email) return;
    forgotMutation.mutate(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    if (!token || !newPassword) return;

    resetMutation.mutate(
      { token, newPassword },
      {
        onSuccess: () => {
          setToken("");
          setNewPassword("");
          setConfirmPassword("");
        },
      },
    );
  };

  const isMismatch =
    newPassword !== confirmPassword && confirmPassword.length > 0;

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center">
              <AppIcon
                icon="solar:lock-keyhole-minimalistic-bold"
                className="size-4 text-primary"
              />
            </div>
            <CardTitle>Password Management</CardTitle>
          </div>
          <CardDescription>
            Change your account password. This action will revoke all other
            active sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-muted/50 border-muted-foreground/20">
            <AppIcon icon="solar:info-circle-linear" className="size-4" />
            <AlertTitle className="text-sm font-semibold">
              Authentication Token Required
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              To change your password, you must use the security token sent to
              your administrative email{" "}
              <strong>({email ?? "your account email"})</strong>.
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">
                    Need a new token?
                  </p>
                  <p className="text-[10px]">
                    Click the button to send a fresh security token to your
                    inbox.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestToken}
                  disabled={forgotMutation.isPending || !email}
                  className="h-8 text-xs gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  {forgotMutation.isPending ? (
                    <AppIcon
                      icon="solar:refresh-linear"
                      className="size-3 animate-spin"
                    />
                  ) : (
                    <AppIcon icon="solar:letter-linear" className="size-3" />
                  )}
                  {forgotMutation.isPending ? "Sending..." : "Request Token"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="token" className="flex items-center gap-2">
                  <AppIcon
                    icon="solar:key-linear"
                    className="size-3.5 text-muted-foreground"
                  />
                  Security Token
                </FieldLabel>
                <Input
                  id="token"
                  placeholder="Enter the token from your email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="h-11 focus-visible:ring-primary/30"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 focus-visible:ring-primary/30"
                  required
                  minLength={8}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm New Password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "h-11 focus-visible:ring-primary/30",
                    isMismatch &&
                      "border-destructive focus-visible:ring-destructive/30",
                  )}
                  required
                />
                {isMismatch && (
                  <p className="text-xs text-destructive mt-1 font-medium">
                    Passwords do not match
                  </p>
                )}
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              disabled={resetMutation.isPending || isMismatch || !token}
              className="w-full sm:w-auto h-11 px-8 font-semibold transition-all hover:translate-y-px active:translate-y-0"
            >
              {resetMutation.isPending ? (
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
          </form>
        </CardContent>
      </Card>

      <div className="bg-muted/30 rounded-xl p-6 border border-border">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
          <AppIcon
            icon="solar:shield-check-bold"
            className="size-4 text-primary"
          />
          Security Policy
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Passwords must be at least 8 characters long and should include a mix
          of uppercase letters, numbers, and symbols. Updating your password
          will automatically log you out of all other devices currently signed
          into your account.
        </p>
      </div>
    </div>
  );
}
