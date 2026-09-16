// Public API of the settings feature (account security — password management).
//
// Account-scoped only. Store-level settings live in their own features and are
// composed alongside this one by the app-layer settings workspace, since only
// `app` may depend on more than one feature.
export { AccountSettingsView } from "./components/account-settings-view";
