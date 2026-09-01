/**
 * Video consultation transport, and the gap between what the API returns and
 * what Agora needs.
 *
 * **The API provisions Daily.co rooms, not Agora channels.**
 * `POST video-consultations/join` answers with
 * `{ consultationId, roomName, roomUrl, doctorName, patientName, status }`
 * (`api/src/modules/video-consultation/video-consultation.service.ts:244`), and
 * both reference clients — `web-member` and `web-doctor` — open that `roomUrl`
 * with `@daily-co/daily-js`.
 *
 * Agora needs three things the response does not carry:
 *   - an **app id** (configuration, `environment.agoraAppId`)
 *   - a **channel** name
 *   - a **token** signed with the project's App Certificate, which can only be
 *     minted server-side
 *
 * `AgoraJoinFields` below describes the shape this client will read once the
 * API can supply it. It is written down rather than guessed at call time so the
 * missing half is legible: `agoraReadiness()` names exactly which piece is
 * absent, and the room screen says so instead of failing to connect.
 */
export const VIDEO_API = {
  /** POST. Body: `{ appointmentId }`. Member role. */
  join: 'video-consultations/join',
  status: (consultationId: string) => `video-consultations/${consultationId}/status`,
  /** GET. A fresh RTC token for a call already in progress. Both roles. */
  token: (consultationId: string) => `video-consultations/${consultationId}/token`,
  history: 'video-consultations/patient/history',
} as const;

/** What the API returns today. */
export interface JoinConsultationDto {
  consultationId?: string;
  roomName?: string;
  roomUrl?: string;
  doctorName?: string;
  patientName?: string;
  status?: string;
  /** Not sent today — see AgoraJoinFields. */
  agora?: AgoraJoinFields;
}

/**
 * What the API would need to add for Agora. Optional throughout: this client
 * must keep working, and keep telling the truth, while none of it exists.
 */
export interface AgoraJoinFields {
  /** Overrides `environment.agoraAppId` when the server is authoritative. */
  appId?: string;
  channel?: string;
  /** Signed with the App Certificate. Without it, joining is refused. */
  token?: string;
  /** Agora numeric uid; a string uid also works if the token was signed for one. */
  uid?: number | string;
  /** Seconds until the token expires, so the client can renew before it does. */
  expiresIn?: number;
}

export interface Consultation {
  readonly id: string;
  readonly doctorName: string;
  readonly patientName: string;
  readonly status: string;
  /** The Daily room the rest of the estate uses. Kept so nothing is lost. */
  readonly roomUrl: string | null;
  readonly agora: AgoraJoinFields | null;
}

export function toConsultation(dto: JoinConsultationDto): Consultation {
  return {
    id: dto.consultationId?.trim() ?? '',
    doctorName: dto.doctorName?.trim() || 'Your doctor',
    patientName: dto.patientName?.trim() || '',
    status: dto.status?.trim().toUpperCase() || 'UNKNOWN',
    roomUrl: dto.roomUrl?.trim() || null,
    agora: dto.agora ?? null,
  };
}

export const AgoraReadiness = {
  Ready: 'READY',
  NoAppId: 'NO_APP_ID',
  NoChannel: 'NO_CHANNEL',
  NoToken: 'NO_TOKEN',
} as const;
export type AgoraReadiness = (typeof AgoraReadiness)[keyof typeof AgoraReadiness];

/**
 * Which single thing is missing, in the order the member would hit them.
 *
 * Deliberately not a boolean: "video is unavailable" sends someone to read
 * source. "No token — the API does not mint Agora tokens yet" does not.
 */
export function agoraReadiness(
  consultation: Consultation | null,
  configuredAppId: string,
): AgoraReadiness {
  const appId = consultation?.agora?.appId?.trim() || configuredAppId.trim();
  if (!appId) return AgoraReadiness.NoAppId;
  if (!consultation?.agora?.channel?.trim()) return AgoraReadiness.NoChannel;
  if (!consultation?.agora?.token?.trim()) return AgoraReadiness.NoToken;
  return AgoraReadiness.Ready;
}

export const READINESS_MESSAGE: Readonly<Record<AgoraReadiness, string>> = {
  [AgoraReadiness.Ready]: '',
  [AgoraReadiness.NoAppId]:
    'Video calling is not configured in this build — no Agora app id is set.',
  [AgoraReadiness.NoChannel]:
    'This consultation has no Agora channel. The API still provisions Daily.co rooms.',
  [AgoraReadiness.NoToken]:
    'This consultation has no Agora token. Tokens must be signed with the App Certificate on the server, and no endpoint does that yet.',
};
