import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { AgoraService } from '../../../services/agora.service';

@Component({
  selector: 'opd-agora-video',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="video-call-root">
      <main class="grid-container">
        <div class="video-tile local-tile">
          <div #localVideoPlayer class="stream-renderer"></div>
          <div class="tile-caption">You (Local)</div>
        </div>
        <div *ngFor="let user of remoteUsers" class="video-tile remote-tile">
          <div [id]="'remote-user-' + user.uid" class="stream-renderer"></div>
          <div class="tile-caption">User {{ user.uid }}</div>
        </div>
      </main>
      <footer class="call-controls">
        <button *ngIf="!isJoined" class="btn btn-primary" (click)="startCall()">Join Call</button>
        <ng-container *ngIf="isJoined">
          <div class="network-quality" [class.good]="(stats()?.quality === 'Good')" [class.bad]="(stats()?.quality === 'Bad')">
            <span class="quality-dot"></span>
            <span>{{ stats()?.quality || 'Unknown' }}</span>
            <span class="bandwidth">{{ stats()?.bandwidth || '' }}</span>
            <span class="duration">{{ stats()?.duration || '' }}</span>
          </div>
          <button class="btn btn-control" [class.active]="isAudioMuted" (click)="onToggleAudio()">
            {{ isAudioMuted ? 'Unmute Mic' : 'Mute Mic' }}
          </button>
          <button class="btn btn-control" [class.active]="isVideoMuted" (click)="onToggleVideo()">
            {{ isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off' }}
          </button>
          <button class="btn btn-danger" (click)="onEndCall()">Leave Call</button>
        </ng-container>
      </footer>
    </div>
  `,
  styles: [`
    .video-call-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 500px;
      background-color: #121212;
      color: #f1f1f1;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }
    .grid-container {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1rem;
      padding: 1rem;
      overflow-y: auto;
    }
    .video-tile {
      position: relative;
      background-color: #242424;
      border-radius: 8px;
      overflow: hidden;
      aspect-ratio: 16 / 9;
    }
    .stream-renderer {
      width: 100%;
      height: 100%;
    }
    .tile-caption {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.65);
      color: #fff;
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 4px;
      z-index: 10;
    }
    .call-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background-color: #1e1e1e;
      border-top: 1px solid #2e2e2e;
      flex-wrap: wrap;
    }
    .network-quality {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      background: rgba(255,255,255,0.1);
      font-size: 0.75rem;
      font-weight: 500;
    }
    .network-quality.good { background: rgba(76, 175, 80, 0.3); color: #4caf50; }
    .network-quality.bad { background: rgba(244, 67, 54, 0.3); color: #f44336; }
    .quality-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: currentColor;
    }
    .bandwidth, .duration { opacity: 0.8; }
    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 24px;
      border: none;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .btn-primary { background: #0070f3; color: #fff; }
    .btn-control {
      background: #333;
      color: #fff;
      &.active { background: #ff9800; color: #000; }
    }
    .btn-danger { background: #e53935; color: #fff; }
  `],
})
export class AgoraVideoComponent implements OnInit, OnDestroy {
  @ViewChild('localVideoPlayer') localVideoPlayer!: ElementRef<HTMLDivElement>;

  serviceRequestId = input<string | null>('');
  callEnded = output<void>();

  public appId: string = 'YOUR_AGORA_APP_ID';
  public channelName: string = 'teleconsult-session-1';
  public uid: number = Math.floor(Math.random() * 100000);

  protected isJoined: boolean = false;
  protected isAudioMuted: boolean = false;
  protected isVideoMuted: boolean = false;
  protected remoteUsers: IAgoraRTCRemoteUser[] = [];

  private readonly agoraService = inject(AgoraService);
  protected readonly stats = toSignal(this.agoraService.stats$, { initialValue: { bandwidth: '0 Kbps', duration: '0 sec', quality: 'Unknown' } });

  private subs: Subscription = new Subscription();

  constructor() {}

  ngOnInit(): void {
    this.subs.add(this.agoraService.isJoined$.subscribe(val => (this.isJoined = val)));
    this.subs.add(this.agoraService.remoteUsers$.subscribe(users => {
      this.remoteUsers = users;
      setTimeout(() => this.attachRemoteStreams(), 100);
    }));
    
    if (this.serviceRequestId()) {
      this.startCall();
    }
  }

  public async startCall(): Promise<void> {
    const { video } = await this.agoraService.createLocalTracks();
    video.play(this.localVideoPlayer.nativeElement, { fit: 'cover' });
    await this.agoraService.joinChannel(this.appId, this.channelName, null, this.uid);
  }

  private attachRemoteStreams(): void {
    this.remoteUsers.forEach(user => {
      const containerId = `remote-user-${user.uid}`;
      const elem = document.getElementById(containerId);
      if (elem && user.videoTrack) {
        user.videoTrack.play(elem, { fit: 'cover' });
      }
    });
  }

  public onToggleAudio(): void { this.agoraService.toggleMicrophone(); }
  public onToggleVideo(): void { this.agoraService.toggleCamera(); }
  public async onEndCall(): Promise<void> { 
    await this.agoraService.leaveChannel(); 
    this.callEnded.emit(); 
  }
  public async ngOnDestroy(): Promise<void> {
    this.subs.unsubscribe();
    await this.agoraService.leaveChannel();
  }
}