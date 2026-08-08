// Types for the settings feature (account security — password management).
//
// TODO(codegen, ADR-0006): alias the generated response schemas; Zod owns inputs.

/** Backend envelope for the password mutations (kept via `{ raw: true }`). */
export interface AuthMessageResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}
