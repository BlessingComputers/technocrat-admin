import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Forgot Password",
};

/** Public route (see `src/proxy.ts`). Thin shell over the auth feature. */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
