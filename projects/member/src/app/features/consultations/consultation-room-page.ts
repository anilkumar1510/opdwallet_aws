import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { BackLink } from '../../shared/ui/back-link';
import { AgoraVideoComponent } from '../online-consult/components/agora-video.component';

/**
 * The video consultation room — `/member/consultations/:appointmentId`.
 *
 * Embeds the production AgoraVideoComponent using the appointment ID as the serviceRequestId.
 * Handles live video checkin, credentials, dynamic token generation, and real-time audio/video streaming.
 */
@Component({
  selector: 'opd-consultation-room-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BackLink, AgoraVideoComponent],
  template: `
    <div class="mx-auto w-full max-w-4xl px-4 py-5">
      <opd-back-link to="/member/bookings" />
      <h1 class="mb-4 text-xl font-bold text-ink-900">Video consultation</h1>

      @if (appointmentId()) {
        <opd-agora-video
          [serviceRequestId]="appointmentId()"
          (callEnded)="onCallEnded()"
        />
      } @else {
        <div class="rounded-2xl border border-surface-border bg-white p-6 text-center">
          <p class="text-sm text-ink-500">No appointment reference provided.</p>
        </div>
      }
    </div>
  `,
})
export class ConsultationRoomPage {
  /** Bound from the route by withComponentInputBinding(). */
  readonly appointmentId = input<string>('');
  private readonly router = inject(Router);

  protected onCallEnded(): void {
    void this.router.navigate(['/member/bookings']);
  }
}
