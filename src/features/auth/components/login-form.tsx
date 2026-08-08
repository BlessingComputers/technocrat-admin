"use client";

import { cn } from "@/lib/utils/cn";
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
import { useActionState, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { loginAction, type LoginState } from "../api/login-action";
import { useSearchParams } from "next/navigation";

type LoginFormProps = React.ComponentProps<"div">;

export function LoginForm({ className, ...props }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const initialState: LoginState = {
    email: "",
    password: "",
    error: undefined,
    redirectTo,
  };

  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    // The login action runs server-side, so it can't dispatch the browser event
    // the fetch client uses for client-side blocks. Re-dispatch here so the
    // EmergencyUnblock UI surfaces when login itself is IP-blocked.
    if (state?.code === "IP_BLOCKED") {
      window.dispatchEvent(new CustomEvent("api:ip-blocked"));
    }
  }, [state?.error, state?.code]);

  function togglePasswordVisibility() {
    setShowPassword((prev) => !prev);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex justify-center">
        <Logo href="/login" className="w-36 justify-center" />
      </div>

      <Card>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
              <AppIcon
                icon="solar:shield-check-bold"
                className="size-6 text-primary"
              />
            </div>
          </div>
          <CardTitle className="font-heading text-2xl font-bold tracking-tight">
            Staff Portal
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@blessingcomputers.com"
                  className="h-11"
                  defaultValue={state?.email}
                  required
                />
              </Field>
              <Field className="w-full">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="h-11 pr-10"
                    defaultValue={state?.password}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={togglePasswordVisibility}
                  >
                    <AppIcon
                      icon={
                        showPassword ? "solar:eye-closed-bold" : "solar:eye-bold"
                      }
                      className="size-5"
                    />
                  </button>
                </div>
              </Field>
              <Field className="pt-2">
                <Button
                  className="h-11 w-full text-base font-semibold"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <AppIcon
                        icon="solar:lock-keyhole-minimalistic-bold"
                        className="size-4 animate-pulse"
                      />
                      Authenticating...
                    </span>
                  ) : (
                    "Sign In to Dashboard"
                  )}
                </Button>
              </Field>

              {state?.error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                  <AppIcon
                    icon="solar:lock-keyhole-minimalistic-bold"
                    className="size-4 shrink-0"
                  />
                  {state.error}
                </div>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-1 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <AppIcon
            icon="solar:lock-keyhole-minimalistic-linear"
            className="size-3"
          />
          Restricted access for authorized personnel only
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          All login attempts and session activities are monitored for security.
        </p>
      </div>
    </div>
  );
}
