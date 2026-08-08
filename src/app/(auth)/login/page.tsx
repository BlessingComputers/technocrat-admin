import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign In",
};

/**
 * Login route — thin shell over the auth feature's `LoginForm`. The Suspense
 * boundary is required because `LoginForm` reads `useSearchParams` (the
 * `?redirect=` param); without it Next opts the whole route into client
 * rendering and errors during static generation.
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
