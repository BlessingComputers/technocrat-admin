"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { checkPasswordRules } from "@/lib/auth/password-policy";

interface NewPasswordFieldsProps {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
}

/**
 * New + confirm password inputs with the backend's rules as a live checklist.
 * Shared by Settings (change password) and the public /reset-password page,
 * which sit in different feature slices.
 */
export function NewPasswordFields({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
}: NewPasswordFieldsProps) {
  const rules = checkPasswordRules(password);
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <>
      <Field>
        <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="h-11"
          required
        />
        <ul
          aria-label="Password requirements"
          className="mt-2 grid gap-1 text-xs sm:grid-cols-2"
        >
          {rules.map((rule) => (
            <li
              key={rule.label}
              className={cn(
                "flex items-center gap-1.5",
                rule.met ? "text-success-ink" : "text-muted-foreground",
              )}
            >
              <AppIcon
                icon={
                  rule.met
                    ? "solar:check-circle-linear"
                    : "solar:close-circle-linear"
                }
                className="size-3.5 shrink-0"
              />
              <span>
                {rule.label}
                <span className="sr-only">
                  {rule.met ? " (met)" : " (not met)"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Field>

      <Field>
        <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => onConfirmChange(e.target.value)}
          aria-invalid={mismatch}
          className={cn("h-11", mismatch && "border-destructive")}
          required
        />
        {mismatch && (
          <p className="mt-1 text-xs font-medium text-destructive-ink">
            Passwords do not match
          </p>
        )}
      </Field>
    </>
  );
}
