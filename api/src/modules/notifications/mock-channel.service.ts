import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';

export interface ChannelSendResult {
  readonly channel: 'whatsapp' | 'push';
  readonly sent: true;
  readonly messageId: string;
}

/**
 * Stand-in for WhatsApp and push delivery, which the platform has no real
 * provider for (Excel patient-flows sheet requires both on every "cart
 * ready"/booking-confirmed step; no Twilio/FCM integration exists). Every
 * call succeeds and returns a fake message id so callers and the in-app
 * notification record can behave as if delivery happened.
 *
 * Swap for a real provider by replacing the two bodies below — the call
 * sites in NotificationsService don't need to change.
 */
@Injectable()
export class MockChannelService {
  private readonly logger = new Logger(MockChannelService.name);

  sendWhatsApp(userId: string | Types.ObjectId, title: string, message: string): ChannelSendResult {
    const messageId = `WA-${String(userId)}-${Date.now()}`;
    this.logger.debug(`[mock whatsapp] ${messageId} -> user ${userId}: ${title} — ${message}`);
    return { channel: 'whatsapp', sent: true, messageId };
  }

  sendPush(userId: string | Types.ObjectId, title: string, message: string): ChannelSendResult {
    const messageId = `PUSH-${String(userId)}-${Date.now()}`;
    this.logger.debug(`[mock push] ${messageId} -> user ${userId}: ${title} — ${message}`);
    return { channel: 'push', sent: true, messageId };
  }
}
