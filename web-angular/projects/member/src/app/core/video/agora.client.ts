import { Injectable, signal } from '@angular/core';

import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';

export interface AgoraJoinRequest {
  readonly appId: string;
  readonly channel: string;
  readonly token: string;
  readonly uid?: number | string;
}

/**
 * A thin wrapper over the Agora Web SDK (`agora-rtc-sdk-ng` 4.24).
 *
 * **The SDK is loaded with a dynamic import, never at module scope.** It is a
 * large dependency and only one screen in the portal needs it; importing it
 * eagerly would put it in the initial bundle for every member, including the
 * ones who never take a video call.
 *
 * The wrapper owns the parts that are easy to get wrong and tedious to repeat:
 * publishing local tracks, subscribing to remote ones, and — the part usually
 * skipped — **releasing the camera and microphone on the way out**. A missed
 * `track.close()` leaves the camera light on after the member has left the
 * call, which is the kind of defect people notice and do not forgive.
 *
 * It deliberately knows nothing about consultations, appointments or the API.
 * Those belong to `ConsultationStore`; this joins a channel.
 */
@Injectable({ providedIn: 'root' })
export class AgoraClient {
  private client: IAgoraRTCClient | null = null;
  private micTrack: IMicrophoneAudioTrack | null = null;
  private camTrack: ICameraVideoTrack | null = null;

  private readonly _joined = signal(false);
  private readonly _remoteUsers = signal<readonly IAgoraRTCRemoteUser[]>([]);
  private readonly _micOn = signal(true);
  private readonly _camOn = signal(true);
  private readonly _error = signal<string | null>(null);

  readonly joined = this._joined.asReadonly();
  readonly remoteUsers = this._remoteUsers.asReadonly();
  readonly micOn = this._micOn.asReadonly();
  readonly camOn = this._camOn.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Join a channel and publish camera and microphone.
   *
   * `localVideo` and `remoteVideo` are the elements the SDK renders into. They
   * are passed in rather than queried here so this stays free of the DOM
   * assumptions that make a service untestable.
   */
  /**
   * Supplies a fresh token when the current one is about to expire. Set by the
   * screen before joining; without it a call simply ends at the TTL.
   */
  private renew: (() => Promise<string | null>) | null = null;

  onTokenExpiring(supplier: () => Promise<string | null>): void {
    this.renew = supplier;
  }

  async join(request: AgoraJoinRequest, localVideo: HTMLElement): Promise<boolean> {
    if (this._joined()) return true;
    this._error.set(null);
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      this.client = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') user.audioTrack?.play();
        this._remoteUsers.set([...client.remoteUsers]);
      });
      // Agora fires this ~30s before expiry. Renewing here keeps the call up;
      // ignoring it drops the member mid-consultation.
      client.on('token-privilege-will-expire', async () => {
        const token = await this.renew?.();
        if (token) await client.renewToken(token);
      });
      // If renewal failed or was never wired, say so rather than vanish.
      client.on('token-privilege-did-expire', async () => {
        const token = await this.renew?.();
        if (token) {
          await client.renewToken(token);
          return;
        }
        this._error.set('The call timed out. Rejoin to continue.');
        await this.leave();
      });

      client.on('user-unpublished', () => this._remoteUsers.set([...client.remoteUsers]));
      client.on('user-left', () => this._remoteUsers.set([...client.remoteUsers]));

      await client.join(request.appId, request.channel, request.token, request.uid ?? null);

      // Created after joining, so a failed join never turns the camera on.
      const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks();
      this.micTrack = mic;
      this.camTrack = cam;
      cam.play(localVideo);
      await client.publish([mic, cam]);

      this._joined.set(true);
      return true;
    } catch (error: unknown) {
      // Leave nothing half-open if publishing failed after joining.
      await this.leave();
      this._error.set(
        error instanceof Error ? error.message : 'The call could not be connected.',
      );
      return false;
    }
  }

  /** Renders a remote participant into an element. */
  playRemote(user: IAgoraRTCRemoteUser, into: HTMLElement): void {
    user.videoTrack?.play(into);
  }

  toggleMic(): void {
    const track = this.micTrack;
    if (!track) return;
    const next = !this._micOn();
    void track.setEnabled(next);
    this._micOn.set(next);
  }

  toggleCam(): void {
    const track = this.camTrack;
    if (!track) return;
    const next = !this._camOn();
    void track.setEnabled(next);
    this._camOn.set(next);
  }

  /**
   * Leave and release the devices.
   *
   * Safe to call when never joined, and safe to call twice — the room screen
   * calls it on destroy, and the member may also have pressed Leave.
   */
  async leave(): Promise<void> {
    this.micTrack?.stop();
    this.micTrack?.close();
    this.camTrack?.stop();
    this.camTrack?.close();
    this.micTrack = null;
    this.camTrack = null;
    try {
      await this.client?.leave();
    } catch {
      // Already gone; the devices above are what actually matter.
    }
    this.client = null;
    this._remoteUsers.set([]);
    this._joined.set(false);
    this._micOn.set(true);
    this._camOn.set(true);
  }
}
