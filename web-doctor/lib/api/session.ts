/**
 * The doctor's own session token, and a fetch that sends it.
 *
 * **Why this exists.** Every call in `lib/api/*` authenticated with
 * `credentials: 'include'` alone — the `opd_session` cookie. That cookie has the
 * same name as the member portal's, and cookies are scoped to HOST, not port. On
 * localhost the member app (:4200) and this app (:3000) therefore share one
 * session and overwrite each other: sign into the member portal and every
 * doctor request starts arriving at the API as a MEMBER, so every
 * `@Roles(DOCTOR)` route answers 403. The dashboard's "Failed to fetch
 * appointments" was exactly that.
 *
 * Renaming the cookie would not fix it — both cookies would still be sent to
 * both apps on a shared host. The API's JWT strategy checks the
 * `Authorization` header BEFORE any cookie, so sending the header is what
 * actually settles which session is in play.
 *
 * The cookie is still set and still sent; this only takes precedence over it.
 */
const TOKEN_KEY = 'opd_doctor_token';

export function storeDoctorToken(token: string | undefined | null): void {
  if (typeof window === 'undefined' || !token) return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function readDoctorToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearDoctorToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * `fetch` with the doctor's bearer token attached.
 *
 * Drop-in for `fetch` — same signature, and it keeps `credentials: 'include'`
 * so nothing that still depends on the cookie breaks while callers migrate.
 */
export async function doctorFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = readDoctorToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, credentials: 'include', headers });
}
