import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
  computed
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subscription, firstValueFrom } from 'rxjs';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { AgoraService } from '../../../services/agora.service';
import { OpdConsultationService } from '../../../services/opd-consultation.service';

type ConnectionStatus = 'idle' | 'checking-in' | 'fetching-credentials' | 'joining' | 'connected' | 'error';

@Component({
  selector: 'opd-agora-video',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="video-call-root">
      <!-- Loading & Connecting Overlay -->
      <div *ngIf="status() === 'checking-in' || status() === 'fetching-credentials' || status() === 'joining'" class="status-overlay">
        <div class="spinner"></div>
        <p class="status-title">{{ statusMessage() }}</p>
        <p class="status-sub">Please ensure your camera and microphone are allowed</p>
      </div>

      <!-- Error Overlay -->
      <div *ngIf="status() === 'error'" class="status-overlay error-overlay">
        <div class="error-icon">⚠️</div>
        <p class="status-title text-danger">Connection Failed</p>
        <p class="status-sub">{{ errorMessage() || 'Failed to connect to consultation session' }}</p>
        <button type="button" class="btn btn-primary mt-4" (click)="startCall()">Retry Connection</button>
      </div>

      <!-- Main Stream Grid -->
      <main *ngIf="status() === 'connected' || status() === 'idle'" class="grid-container" [class.audio-only]="isAudioOnly()">
        <!-- Audio Mode Interface -->
        <div *ngIf="isAudioOnly()" class="audio-session-container">
          <div class="audio-avatar">
            <span class="avatar-icon">🩺</span>
            <div class="pulse-ring"></div>
          </div>
          <h2 class="doctor-title">{{ doctorName() || 'Doctor' }}</h2>
          <p class="session-mode-badge">📞 Audio Consultation</p>
          <div class="doctor-status-text">
            <span *ngIf="remoteUsers().length > 0" class="text-green-400 font-medium">● Doctor connected</span>
            <span *ngIf="remoteUsers().length === 0" class="text-yellow-400">Waiting for doctor to join...</span>
          </div>
        </div>

        <!-- Video Mode: Local Tile -->
        <div *ngIf="!isAudioOnly()" class="video-tile local-tile">
          <div #localVideoPlayer class="stream-renderer"></div>
          <div class="tile-caption">You (Local)</div>
        </div>

        <!-- Video Mode: Remote Doctor Tile -->
        <div *ngIf="!isAudioOnly()" class="video-tile remote-tile">
          <div *ngFor="let user of remoteUsers()" [id]="'remote-user-' + user.uid" class="stream-renderer"></div>
          
          <div *ngIf="remoteUsers().length === 0" class="waiting-placeholder">
            <div class="placeholder-avatar">👨‍⚕️</div>
            <p class="font-medium text-white/90">Waiting for {{ doctorName() || 'Doctor' }} to join...</p>
            <p class="text-xs text-white/60">The doctor will connect shortly</p>
          </div>

          <div class="tile-caption" *ngIf="remoteUsers().length > 0">
            {{ doctorName() || 'Doctor' }}
          </div>
        </div>
      </main>

      <!-- Bottom Control Bar -->
      <footer class="call-controls">
        <button *ngIf="status() === 'idle'" class="btn btn-primary" (click)="startCall()">
          Join Call
        </button>

        <ng-container *ngIf="status() === 'connected'">
          <!-- Live Network Quality Stats -->
          <div class="network-quality" [class.good]="(stats()?.quality === 'Good')" [class.bad]="(stats()?.quality === 'Bad')">
            <span class="quality-dot"></span>
            <span>{{ stats()?.quality || 'Connected' }}</span>
            <span *ngIf="stats()?.bandwidth" class="bandwidth">{{ stats()?.bandwidth }}</span>
            <span *ngIf="stats()?.duration" class="duration">{{ stats()?.duration }}</span>
          </div>

          <!-- Mic Toggle -->
          <button
            type="button"
            class="btn btn-control"
            [class.active]="isAudioMuted()"
            (click)="onToggleAudio()"
            [title]="isAudioMuted() ? 'Unmute microphone' : 'Mute microphone'"
          >
            {{ isAudioMuted() ? '🔇 Unmute' : '🎤 Mute' }}
          </button>

          <!-- Camera Toggle (Only for Video Call) -->
          <button
            *ngIf="!isAudioOnly()"
            type="button"
            class="btn btn-control"
            [class.active]="isVideoMuted()"
            (click)="onToggleVideo()"
            [title]="isVideoMuted() ? 'Turn camera on' : 'Turn camera off'"
          >
            {{ isVideoMuted() ? '📷 Turn Camera On' : '📹 Camera Off' }}
          </button>

          <!-- Leave Call Button -->
          <button type="button" class="btn btn-danger" (click)="onEndCall()">
            End Call
          </button>
        </ng-container>
      </footer>
    </div>
  `,
  styles: [`
    .video-call-root {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 520px;
      background-color: #121212;
      color: #f1f1f1;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      border-radius: 1rem;
    }
    .status-overlay {
      position: absolute;
      inset: 0;
      z-index: 30;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(18, 18, 18, 0.95);
      padding: 2rem;
      text-align: center;
    }
    .status-title {
      font-size: 1.15rem;
      font-weight: 600;
      margin-top: 1rem;
      color: #ffffff;
    }
    .status-sub {
      font-size: 0.85rem;
      color: #9ca3af;
      margin-top: 0.35rem;
    }
    .text-danger {
      color: #ef4444;
    }
    .error-icon {
      font-size: 2.5rem;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.15);
      border-top-color: #0070f3;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .grid-container {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      padding: 1rem;
      overflow-y: auto;
      align-items: center;
    }
    .grid-container.audio-only {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .audio-session-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      max-width: 420px;
      width: 100%;
    }
    .audio-avatar {
      position: relative;
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a8a, #034da2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 24px rgba(3, 77, 162, 0.35);
    }
    .avatar-icon {
      font-size: 3.5rem;
    }
    .pulse-ring {
      position: absolute;
      inset: -10px;
      border-radius: 50%;
      border: 2px solid rgba(15, 95, 220, 0.5);
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.15); opacity: 0.2; }
    }
    .doctor-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
    .session-mode-badge {
      font-size: 0.8rem;
      font-weight: 500;
      color: #93c5fd;
      background: rgba(30, 58, 138, 0.4);
      padding: 4px 12px;
      border-radius: 12px;
      margin-top: 0.5rem;
    }
    .doctor-status-text {
      margin-top: 1rem;
      font-size: 0.85rem;
    }
    .video-tile {
      position: relative;
      background-color: #242424;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 16 / 9;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    .stream-renderer {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .tile-caption {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 6px;
      z-index: 10;
      backdrop-filter: blur(4px);
    }
    .waiting-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: #1c1c1c;
      gap: 0.5rem;
      padding: 1.5rem;
    }
    .placeholder-avatar {
      font-size: 3rem;
      margin-bottom: 0.25rem;
    }
    .call-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background-color: #1a1a1a;
      border-top: 1px solid #2e2e2e;
      flex-wrap: wrap;
    }
    .network-quality {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.85rem;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.08);
      font-size: 0.75rem;
      font-weight: 500;
    }
    .network-quality.good { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
    .network-quality.bad { background: rgba(244, 67, 54, 0.2); color: #f44336; }
    .quality-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    .bandwidth, .duration { opacity: 0.85; }
    .btn {
      padding: 0.6rem 1.25rem;
      border-radius: 24px;
      border: none;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .btn-primary {
      background: #0070f3;
      color: #fff;
    }
    .btn-primary:hover {
      background: #0056b3;
    }
    .btn-control {
      background: #2e2e2e;
      color: #fff;
      border: 1px solid #444;
    }
    .btn-control:hover {
      background: #3e3e3e;
    }
    .btn-control.active {
      background: #ef4444;
      color: #fff;
      border-color: #ef4444;
    }
    .btn-danger {
      background: #dc2626;
      color: #fff;
    }
    .btn-danger:hover {
      background: #b91c1c;
    }
  `],
})
export class AgoraVideoComponent implements OnInit, OnDestroy {
  @ViewChild('localVideoPlayer') localVideoPlayer!: ElementRef<HTMLDivElement>;

  readonly serviceRequestId = input<string | null>('');
  readonly mode = input<'Video' | 'Audio'>('Video');
  readonly doctorName = input<string>('Doctor');
  readonly callEnded = output<void>();

  protected readonly status = signal<ConnectionStatus>('idle');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isAudioOnly = computed(() => this.mode() === 'Audio');

  protected readonly isAudioMuted = signal(false);
  protected readonly isVideoMuted = signal(false);
  protected readonly remoteUsers = signal<IAgoraRTCRemoteUser[]>([]);

  private readonly agoraService = inject(AgoraService);
  private readonly consultationService = inject(OpdConsultationService);

  protected readonly stats = toSignal(this.agoraService.stats$, {
    initialValue: { bandwidth: '0 Kbps', duration: '0 sec', quality: 'Unknown' }
  });

  private subs = new Subscription();

  protected statusMessage(): string {
    switch (this.status()) {
      case 'checking-in':
        return 'Checking in to consultation room...';
      case 'fetching-credentials':
        return 'Authenticating video session...';
      case 'joining':
        return 'Connecting to doctor...';
      default:
        return 'Connecting...';
    }
  }

  ngOnInit(): void {
    this.subs.add(
      this.agoraService.isAudioMuted$.subscribe((val) => this.isAudioMuted.set(val))
    );
    this.subs.add(
      this.agoraService.isVideoMuted$.subscribe((val) => this.isVideoMuted.set(val))
    );
    this.subs.add(
      this.agoraService.remoteUsers$.subscribe((users) => {
        this.remoteUsers.set(users);
        if (!this.isAudioOnly()) {
          setTimeout(() => this.attachRemoteStreams(), 100);
        }
      })
    );

    if (this.serviceRequestId()) {
      void this.startCall();
    }
  }

  public async startCall(): Promise<void> {
    const sReqId = this.serviceRequestId()?.trim();
    if (!sReqId) {
      this.status.set('error');
      this.errorMessage.set('Service Request ID is required to initiate consultation.');
      return;
    }

    this.status.set('checking-in');
    this.errorMessage.set(null);

    try {
      // Step 1: Video Checkin
      try {
        await firstValueFrom(this.consultationService.videoCheckin(sReqId));
      } catch (checkinError) {
        console.warn('Video checkin notice:', checkinError);
        // Continue even if already checked in
      }

      // Step 2: Fetch Credentials & Agora Token
      this.status.set('fetching-credentials');
      const [appId, tokenRes] = await Promise.all([
        firstValueFrom(this.consultationService.getAgoraCredentials()),
        firstValueFrom(this.consultationService.getAgoraToken(sReqId))
      ]);

      if (!tokenRes?.tokenId) {
        throw new Error('Received empty Agora token from backend.');
      }

      // Step 3: Register Token Renewal Listener
      this.agoraService.onTokenExpiring(async () => {
        try {
          const fresh = await firstValueFrom(this.consultationService.getAgoraToken(sReqId));
          return fresh?.tokenId || null;
        } catch {
          return null;
        }
      });

      // Step 4: Create local tracks
      this.status.set('joining');
      const { video } = await this.agoraService.createLocalTracks(this.mode());

      // Play local video if video mode is enabled
      if (!this.isAudioOnly() && video && this.localVideoPlayer?.nativeElement) {
        video.play(this.localVideoPlayer.nativeElement, { fit: 'cover' });
      }

      // Step 5: Join Channel with dynamic App ID, Channel ID, and Token
      const channelToJoin = tokenRes.channelId || sReqId;
      await this.agoraService.joinChannel(appId, channelToJoin, tokenRes.tokenId, null);

      this.status.set('connected');
    } catch (err: any) {
      console.error('Call connection error:', err);
      this.status.set('error');
      this.errorMessage.set(err?.message || 'Could not connect to video channel. Please check your network and permissions.');
    }
  }

  private attachRemoteStreams(): void {
    this.remoteUsers().forEach((user) => {
      const containerId = `remote-user-${user.uid}`;
      const elem = document.getElementById(containerId);
      if (elem && user.videoTrack) {
        user.videoTrack.play(elem, { fit: 'cover' });
      }
    });
  }

  public async onToggleAudio(): Promise<void> {
    await this.agoraService.toggleMicrophone();
  }

  public async onToggleVideo(): Promise<void> {
    if (this.isAudioOnly()) return;
    await this.agoraService.toggleCamera();
  }

  public async onEndCall(): Promise<void> {
    await this.agoraService.leaveChannel();
    this.status.set('idle');
    this.callEnded.emit();
  }

  public async ngOnDestroy(): Promise<void> {
    this.subs.unsubscribe();
    await this.agoraService.leaveChannel();
  }
}
