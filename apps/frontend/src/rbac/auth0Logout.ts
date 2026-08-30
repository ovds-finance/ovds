/**
 * auth0Logout — tiny event bus that lets AuthContext trigger Auth0 logout
 * without importing the React SDK hook (which can't be called outside a component).
 *
 * Usage:
 *   // In a component that has access to useAuth0:
 *   useAuth0LogoutListener();
 *
 *   // From AuthContext (non-component):
 *   triggerAuth0Logout();
 */

type LogoutListener = () => void;
let _listener: LogoutListener | null = null;

export function registerAuth0LogoutListener(fn: LogoutListener) {
  _listener = fn;
  return () => {
    if (_listener === fn) _listener = null;
  };
}

export function triggerAuth0Logout() {
  if (_listener) {
    _listener();
  } else {
    // Fallback: hard redirect to login (listener not mounted yet)
    window.location.href = '/login';
  }
}
