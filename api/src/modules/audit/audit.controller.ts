import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
import { AuditBatchDto, AuditEventDto } from './dto/audit-batch.dto';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';

/**
 * Audit Controller
 *
 * Provides API endpoints for HIPAA-compliant audit logging.
 * Accepts audit event batches from the member portal and mobile apps.
 *
 * HIPAA Compliance: Implements audit controls per §164.312(b)
 */
@Controller('audit')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * POST /api/audit/log
   *
   * Receives a batch of audit events from the frontend.
   * Events are validated and stored for HIPAA compliance.
   */
  @Post('log')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async logBatch(
    @Body() auditBatch: AuditBatchDto,
    @Req() req: AuthRequest,
  ): Promise<{ message: string; eventsProcessed: number }> {
    const authenticatedUser = req.user;

    // Extract client IP from request
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';

    this.logger.debug(
      `Received audit batch ${auditBatch.batchId} with ${auditBatch.events.length} events`,
    );

    let processedCount = 0;

    for (const event of auditBatch.events) {
      try {
        await this.processAuditEvent(event, authenticatedUser, clientIp);
        processedCount++;
      } catch (error) {
        this.logger.error(
          `Failed to process audit event: ${error.message}`,
          error.stack,
        );
        // Continue processing other events - don't fail the entire batch
      }
    }

    this.logger.debug(
      `Processed ${processedCount}/${auditBatch.events.length} events from batch ${auditBatch.batchId}`,
    );

    return {
      message: 'Audit events processed',
      eventsProcessed: processedCount,
    };
  }

  /**
   * Processes a single audit event and stores it
   */
  private async processAuditEvent(
    event: AuditEventDto,
    authenticatedUser: any,
    clientIp: string,
  ): Promise<void> {
    // Map frontend event to backend audit log format
    await this.auditService.log({
      userId: event.userId || authenticatedUser?.userId || 'anonymous',
      userEmail: event.userEmail || authenticatedUser?.email || 'unknown',
      userRole: authenticatedUser?.role || 'MEMBER',
      action: this.mapAction(event.action),
      resource: event.resourceType,
      resourceId: event.resourceId,
      metadata: {
        ip: event.ipAddress || clientIp,
        userAgent: event.userAgent,
        sessionId: event.sessionId,
        patientId: event.patientId,
        accessGranted: event.accessGranted,
        denialReason: event.denialReason,
        frontendTimestamp: event.timestamp,
        ...event.metadata,
      },
      description: this.generateDescription(event),
      isSystemAction: false,
    });
  }

  /**
   * Maps frontend action types to backend action types
   */
  private mapAction(
    action: string,
  ):
    | 'CREATE'
    | 'READ'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'AUTH_FAILURE' {
    const actionMap: Record<string, any> = {
      VIEW_PHI: 'READ',
      DOWNLOAD: 'READ',
      PRINT: 'READ',
      EXPORT: 'READ',
      SHARE: 'READ',
      PROFILE_SWITCH: 'READ',
      SESSION_TIMEOUT: 'LOGOUT',
      LOGIN_FAILED: 'AUTH_FAILURE',
      CREATE: 'CREATE',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
      LOGIN: 'LOGIN',
      LOGOUT: 'LOGOUT',
    };

    return actionMap[action] || 'READ';
  }

  /**
   * Generates a human-readable description for the audit event
   */
  private generateDescription(event: AuditEventDto): string {
    const actionDescriptions: Record<string, string> = {
      VIEW_PHI: 'Viewed protected health information',
      DOWNLOAD: 'Downloaded document',
      PRINT: 'Printed document',
      EXPORT: 'Exported data',
      SHARE: 'Shared information',
      LOGIN: 'User logged in',
      LOGOUT: 'User logged out',
      LOGIN_FAILED: 'Login attempt failed',
      SESSION_TIMEOUT: 'Session expired due to inactivity',
      PROFILE_SWITCH: 'Switched to view different family member profile',
      CREATE: 'Created resource',
      UPDATE: 'Updated resource',
      DELETE: 'Deleted resource',
    };

    let description =
      actionDescriptions[event.action] || `Performed action: ${event.action}`;

    if (event.resourceType) {
      description += ` (${event.resourceType})`;
    }

    if (!event.accessGranted && event.denialReason) {
      description += ` - Access denied: ${event.denialReason}`;
    }

    return description;
  }
}
