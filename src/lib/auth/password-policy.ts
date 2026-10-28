/**
 * Client-side copy of the backend's `passwordSchema`
 * (backend `src/modules/auth/auth.schema.ts`). The backend stays the authority;
 * this only lets a form show what is missing before a round trip. If the
 * backend rules change, change RULES to match.
 */
const RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export interface PasswordRuleResult {
  label: string;
  met: boolean;
}

export function checkPasswordRules(password: string): PasswordRuleResult[] {
  return RULES.map((rule) => ({ label: rule.label, met: rule.test(password) }));
}

export function isNewPasswordValid(password: string, confirm: string): boolean {
  return (
    password === confirm && checkPasswordRules(password).every((r) => r.met)
  );
}
