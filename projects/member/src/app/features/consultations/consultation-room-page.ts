import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, effect, inject, input, viewChild } from '@angular/core';

import { LowerCasePipe } from '@angular/common';

import { environment } from '../../../environments/environment';
import { AgoraClient } from '../../core/video/agora.client';
import { ConsultationStore } from '../../core/video/consultation.store';
import { BackLink } from '../../shared/ui/back-link';
import { ErrorView, LoadingView } from '../../shared/ui/state-views';

/**
 * The video consultation room — `/member/consultations/:appointmentId`, the same
 * route the reference uses.
 *
 * **SCAFFOLD. It cannot connect a call yet, and it says so.**
 * Agora needs an app id, a channel and a token signed with the project's App
 * Certificate. The API provisions Daily.co rooms and returns a `roomUrl`; no
 * endpoint mints Agora tokens. Rather than spin on a connection that cannot
 * succeed, the screen names the missing piece and offers the Daily room the
 * rest of the estate already uses, so the member is not stranded.
 *
 * The join path is real: give it an app id and a `join` response carrying
 * `agora: { channel, token }` and it connects, publishes and renders without
 * another change here.
 */
@Component({
  selector: 'opd-consultation-room-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BackLink, LoadingView, ErrorView, LowerCasePipe],
  template: `
    <div class="mx-auto w-full max-w-3xl px-4 py-5">
      <opd-back-link to="/member/bookings" />
      <h1 class="text-lg font-semibold text-ink-900">Video consultation</h1>

      @if (store.loading()) {
        <opd-loading label="Opening your consultation" />
      } @else if (store.notStarted()) {
        <!-- A 404 from the join call means the doctor has not opened the room.
             The member is early; nothing has gone wrong. -->
        <div class="mt-4 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
          <p class="text-sm font-semibold text-[#034DA2]">
            Your doctor has not started this consultation yet
          </p>
          <p class="mt-1 text-sm text-ink-700">
            The room opens when they join. Try again in a moment.
          </p>
          <button
            type="button"
            class="mt-3 min-h-touch rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white"
            (click)="store.reset(); open()"
          >
            Check again
          </button>
        </div>
      } @else if (store.error(); as error) {
        <opd-error [error]="error" (retry)="store.reset(); open()" />
      } @else if (store.consultation(); as consultation) {
        <p class="mt-0.5 text-sm text-ink-500">
          {{ consultation.doctorName }} · {{ consultation.status | lowercase }}
        </p>

        <!-- The video surfaces. Present whether or not a call is connected, so
             the SDK always has somewhere to render into and there is no
             race between the element appearing and the track playing. -->
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="relative aspect-video overflow-hidden rounded-2xl bg-ink-900">
            <div #localVideo class="h-full w-full"></div>
            <span class="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
              You
            </span>
          </div>
          <div class="relative aspect-video overflow-hidden rounded-2xl bg-ink-900">
            <div #remoteVideo class="h-full w-full"></div>
            <span class="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
              {{ consultation.doctorName }}
            </span>
            @if (agora.joined() && !agora.remoteUsers().length) {
              <p class="absolute inset-0 flex items-center justify-center text-sm text-white/70">
                Waiting for the doctor to join&hellip;
              </p>
            }
          </div>
        </div>

        @if (store.canJoin()) {
          <div class="mt-4 flex flex-wrap gap-3">
            @if (!agora.joined()) {
              <button
                type="button"
                class="min-h-touch rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white"
                (click)="join()"
              >
                Join call
              </button>
            } @else {
              <button
                type="button"
                class="min-h-touch rounded-xl border border-surface-border px-5 text-sm font-semibold text-ink-900"
                (click)="agora.toggleMic()"
              >
                {{ agora.micOn() ? 'Mute' : 'Unmute' }}
              </button>
              <button
                type="button"
                class="min-h-touch rounded-xl border border-surface-border px-5 text-sm font-semibold text-ink-900"
                (click)="agora.toggleCam()"
              >
                {{ agora.camOn() ? 'Turn camera off' : 'Turn camera on' }}
              </button>
              <button
                type="button"
                class="min-h-touch rounded-xl bg-danger-600 px-5 text-sm font-semibold text-white"
                (click)="leave()"
              >
                Leave
              </button>
            }
          </div>
          @if (agora.error(); as callError) {
            <p class="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">
              {{ callError }}
            </p>
          }
        } @else {
          <!-- Naming the missing piece, not "video unavailable". See
               READINESS_MESSAGE in core/video/video.ts. -->
          <div class="mt-4 rounded-2xl border border-warning-200 bg-warning-50 p-4">
            <p class="text-sm font-semibold text-warning-800">Video calling is not ready yet</p>
            <p class="mt-1 text-sm text-warning-700">{{ store.readinessMessage() }}</p>
            @if (store.fallbackRoomUrl(); as room) {
              <a
                class="mt-3 inline-block rounded-xl bg-[#0F5FDC] px-4 py-2 text-sm font-semibold text-white"
                [href]="room"
                target="_blank"
                rel="noopener"
                >Open the consultation room</a
              >
              <p class="mt-2 text-xs text-warning-700">
                This opens the room the doctor's app uses. It is not affected by the Agora work.
              </p>
            }
          </div>
        }
      }
    </div>
  `,
})
export class ConsultationRoomPage implements OnDestroy {
  /** Bound from the route by withComponentInputBinding(). */
  readonly appointmentId = input<string>('');

  protected readonly store = inject(ConsultationStore);
  protected readonly agora = inject(AgoraClient);

  private readonly localVideo = viewChild<ElementRef<HTMLElement>>('localVideo');
  private readonly remoteVideo = viewChild<ElementRef<HTMLElement>>('remoteVideo');

  constructor() {
    effect(() => {
      const id = this.appointmentId();
      if (id) void this.store.open(id);
    });

    // Render the first remote participant as soon as one publishes.
    effect(() => {
      const [user] = this.agora.remoteUsers();
      const host = this.remoteVideo()?.nativeElement;
      if (user && host) this.agora.playRemote(user, host);
    });
  }

  protected open(): void {
    const id = this.appointmentId();
    if (id) void this.store.open(id);
  }

  protected async join(): Promise<void> {
    const consultation = this.store.consultation();
    const host = this.localVideo()?.nativeElement;
    if (!consultation?.agora || !host) return;
    // Wired before joining, so the first expiry warning already has an answer.
    this.agora.onTokenExpiring(() => this.store.freshToken());
    await this.agora.join(
      {
        appId: consultation.agora.appId?.trim() || environment.agoraAppId,
        channel: consultation.agora.channel ?? '',
        token: consultation.agora.token ?? '',
        uid: consultation.agora.uid,
      },
      host,
    );
  }

  protected async leave(): Promise<void> {
    await this.agora.leave();
  }

  /** The camera and microphone must not outlive the screen. */
  ngOnDestroy(): void {
    void this.agora.leave();
  }
}
