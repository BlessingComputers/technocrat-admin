// Public API of the auth feature.
// Export ONLY what routes or other layers need. Everything else stays internal.

// Login UI consumed by the (auth)/login route:
export { LoginForm } from "./components/login-form";

// Session provider consumed by the (staff) layout. The matching reader hook
// `useStaffSession` lives in `@/lib/auth/session-context` (shared, so gating
// helpers in lib/auth can use it without crossing a feature boundary).
export { SessionProvider } from "./components/session-provider";
