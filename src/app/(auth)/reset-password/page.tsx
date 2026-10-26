import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Reset Password",
  // The token sits in the URL. Never send it on as a Referer.
  referrer: "no-referrer",
};

/**
 * Public route (see `src/proxy.ts`). Suspense is required because the form
 * reads `useSearchParams` for `?token=`.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
