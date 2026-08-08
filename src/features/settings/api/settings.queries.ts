import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError } from "@/lib/api/error";
import { getErrorMessage } from "@/lib/api/error-message";
import { settingsService } from "./settings.service";
import type { ResetPasswordInput } from "../types/settings";

export function useRequestPasswordToken() {
  return useMutation({
    mutationFn: (email: string) => settingsService.requestPasswordToken(email),
    onSuccess: (res) =>
      toast.success(res.message || "Reset token sent to your email"),
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to send reset token")),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordInput) =>
      settingsService.resetPassword(data),
    onSuccess: (res) =>
      toast.success(res.message || "Password reset successfully"),
    onError: (error) => {
      // Surface per-field validation errors if the backend returned them.
      if (error instanceof ApiError) {
        const data = error.data as {
          errors?: Record<string, string[]>;
        } | null;
        const validation = data?.errors ? Object.values(data.errors).flat() : [];
        if (validation.length) {
          validation.forEach((msg) => toast.error(msg));
          return;
        }
      }
      toast.error(getErrorMessage(error, "Failed to reset password"));
    },
  });
}
