export const environment = {
  production: false,
  // Relative, same as production. The dev server proxies /api to the API on
  // :4000 (see proxy.conf.json), so the browser only ever talks to one origin.
  // That avoids CORS entirely — the API's dev allowlist in api/src/main.ts
  // does not include this app's port, and api/ is not ours to change — and it
  // keeps the session cookie same-origin.
  apiBaseUrl: '/api',

  /**
   * Agora Web SDK app id. EMPTY BY DEFAULT AND DELIBERATELY SO.
   *
   * An app id alone is not enough to join a channel: Agora also requires a
   * token signed with the project's App Certificate, and that signing can only
   * happen server-side. There is no endpoint that mints one yet — the API's
   * video module provisions Daily.co rooms and returns a `roomUrl`
   * (`video-consultation.service.ts:244`), which Agora cannot use.
   *
   * While this is empty the consultation room says so plainly instead of
   * spinning on a connection that cannot succeed.
   */
  agoraAppId: '',
} as const;
