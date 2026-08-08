// Types specific to the auth feature.
// Promote a type to src/types/ only when a SECOND feature needs it.
//
// TODO(codegen, ADR-0006): once the OpenAPI spec is wired, alias the generated
// response schemas here; keep request/form inputs as Zod-derived types.

/** Backend envelope for the simple auth mutations (reset/forgot/login). */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}
