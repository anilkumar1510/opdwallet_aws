export const environment = {
  production: true,
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
