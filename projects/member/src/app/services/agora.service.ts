import { Injectable } from '@angular/core';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack, UID } from 'agora-rtc-sdk-ng';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NetworkStats {
  bandwidth: string;
  duration: string;
  quality: 'Good' | 'Bad' | 'Unknown';
}

@Injectable({
  providedIn: 'root'
})
export class AgoraService {
  private client: IAgoraRTCClient;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private statsTimer: any = null;
  private tokenRenewalFn: (() => Promise<string | null>) | null = null;

  public remoteUsers$ = new BehaviorSubject<IAgoraRTCRemoteUser[]>([]);
  public isJoined$ = new BehaviorSubject<boolean>(false);
  public isAudioMuted$ = new BehaviorSubject<boolean>(false);
  public isVideoMuted$ = new BehaviorSubject<boolean>(false);
  public stats$ = new BehaviorSubject<NetworkStats>({
    bandwidth: '0 Kbps',
    duration: '0 sec',
    quality: 'Unknown'
  });

  constructor() {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this.initEventHandlers();
  }

  private initEventHandlers(): void {
    this.client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await this.client.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
      this.syncRemoteUsers();
    });

    this.client.on('user-unpublished', (_user: IAgoraRTCRemoteUser, _mediaType: 'audio' | 'video') => {
      this.syncRemoteUsers();
    });

    this.client.on('user-left', (_user: IAgoraRTCRemoteUser) => {
      this.syncRemoteUsers();
    });

    this.client.on('network-quality', (stats) => {
      const isGood = [1, 2, 3].includes(stats.downlinkNetworkQuality);
      this.stats$.next({
        ...this.stats$.value,
        quality: isGood ? 'Good' : 'Bad'
      });
    });

    this.client.on('token-privilege-will-expire', async () => {
      console.warn('Agora token is about to expire, attempting renewal...');
      if (this.tokenRenewalFn) {
        try {
          const newToken = await this.tokenRenewalFn();
          if (newToken) {
            await this.client.renewToken(newToken);
            console.log('Agora token renewed successfully.');
          }
        } catch (e) {
          console.error('Failed to renew Agora token:', e);
        }
      }
    });

    this.client.on('token-privilege-did-expire', async () => {
      console.warn('Agora token expired, renewing immediately...');
      if (this.tokenRenewalFn) {
        try {
          const newToken = await this.tokenRenewalFn();
          if (newToken) {
            await this.client.renewToken(newToken);
          }
        } catch (e) {
          console.error('Failed to renew expired token:', e);
        }
      }
    });
  }

  private syncRemoteUsers(): void {
    this.remoteUsers$.next([...this.client.remoteUsers]);
  }

  public onTokenExpiring(fn: () => Promise<string | null>): void {
    this.tokenRenewalFn = fn;
  }

  public async createLocalTracks(mode: 'Audio' | 'Video' = 'Video'): Promise<{ audio: IMicrophoneAudioTrack | null; video: ICameraVideoTrack | null }> {
    if (mode === 'Audio') {
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      this.localVideoTrack = null;
      this.isVideoMuted$.next(true);
      return { audio: this.localAudioTrack, video: null };
    } else {
      [this.localAudioTrack, this.localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      this.isVideoMuted$.next(false);
      return { audio: this.localAudioTrack, video: this.localVideoTrack };
    }
  }

  public getLocalAudioTrack(): IMicrophoneAudioTrack | null {
    return this.localAudioTrack;
  }

  public getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  public async joinChannel(appId: string, channelName: string, token: string | null, uid?: UID | null): Promise<UID> {
    const assignedUid = await this.client.join(appId, channelName, token, uid || null);

    const tracksToPublish: any[] = [];
    if (this.localAudioTrack) tracksToPublish.push(this.localAudioTrack);
    if (this.localVideoTrack) tracksToPublish.push(this.localVideoTrack);

    if (tracksToPublish.length > 0) {
      await this.client.publish(tracksToPublish);
    }

    this.isJoined$.next(true);
    this.startStatsPoll();
    return assignedUid;
  }

  public async toggleMicrophone(): Promise<boolean> {
    if (!this.localAudioTrack) return false;
    const currentState = this.isAudioMuted$.value;
    await this.localAudioTrack.setEnabled(currentState);
    this.isAudioMuted$.next(!currentState);
    return !currentState;
  }

  public async toggleCamera(): Promise<boolean> {
    if (!this.localVideoTrack) return false;
    const currentState = this.isVideoMuted$.value;
    await this.localVideoTrack.setEnabled(currentState);
    this.isVideoMuted$.next(!currentState);
    return !currentState;
  }

  public async switchCameraDevice(deviceId: string): Promise<void> {
    if (this.localVideoTrack) {
      await this.localVideoTrack.setDevice(deviceId);
    }
  }

  public async renewToken(newToken: string): Promise<void> {
    await this.client.renewToken(newToken);
  }

  public async leaveChannel(): Promise<void> {
    this.stopStatsPoll();

    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }

    if (this.localVideoTrack) {
      this.localVideoTrack.stop();
      this.localVideoTrack.close();
      this.localVideoTrack = null;
    }

    await this.client.leave();

    this.tokenRenewalFn = null;
    this.remoteUsers$.next([]);
    this.isJoined$.next(false);
    this.isAudioMuted$.next(false);
    this.isVideoMuted$.next(false);
    this.stats$.next({ bandwidth: '0 Kbps', duration: '0 sec', quality: 'Unknown' });
  }

  private startStatsPoll(): void {
    this.statsTimer = setInterval(() => {
      const stats = this.client.getRTCStats();
      if (stats) {
        const bandwidth = stats.OutgoingAvailableBandwidth
          ? `${Math.round(stats.OutgoingAvailableBandwidth)} Kbps`
          : 'Calculating...';
        const durationSec = stats.Duration || 0;
        const duration =
          durationSec < 60
            ? `${durationSec}s`
            : `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`;

        this.stats$.next({
          ...this.stats$.value,
          bandwidth,
          duration
        });
      }
    }, 2000);
  }

  private stopStatsPoll(): void {
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
  }

  public getClient(): IAgoraRTCClient {
    return this.client;
  }
}