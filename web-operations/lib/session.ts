// Cookies ignore port numbers, so every portal on localhost shares the
// opd_session cookie name. A member signed in on :3002 has their session sent
// here too, and the browser sends every match — so anything reading the session
// must pick this portal's out of the pile rather than taking the first.

// Roles allowed to use this portal
export const portalRoles = ['OPS_ADMIN', 'OPS_USER']

// Reads the role claim without verifying the signature — the API still verifies
// every request. This only decides which session belongs to this portal.
export function getSessionRole(token: string | undefined): string | null {
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json).role ?? null
  } catch {
    return null
  }
}

export function isPortalToken(token: string | undefined): boolean {
  return portalRoles.includes(getSessionRole(token) ?? '')
}

// Picks this portal's session out of a raw Cookie header that may carry several
// opd_session values.
export function findPortalToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const tokens = cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(part => part.startsWith('opd_session='))
    .map(part => part.slice('opd_session='.length))

  return tokens.find(isPortalToken) ?? null
}
