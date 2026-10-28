/**
 * Full page load, not a client-side route change. Used after a password change
 * or reset, when every session is dead: a reload drops cached queries, Zustand
 * stores and open sockets in one go. Its own module so tests can mock it.
 */
export function hardNavigate(url: string): void {
  window.location.assign(url);
}
