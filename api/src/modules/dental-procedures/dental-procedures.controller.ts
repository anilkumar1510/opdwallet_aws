import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DentalProceduresService } from './dental-procedures.service';

/**
 * The member's half of the procedure route — patient-flows flow 4, steps 18-27.
 *
 * Adjudication, confirmation and completion are not here: they are decisions
 * made about the member, not by them. Those live on the ops controller.
 */
@Controller('member/dental/procedures')
@UseGuards(JwtAuthGuard)
export class DentalProceduresController {
  constructor(
    private readonly service: DentalProceduresService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Steps 20-21 and 29 performed by the member, for demonstrations only.
   *
   * The same reasoning as the consultation's `demo-confirm`: adjudicating a
   * cart and confirming a slot with a clinic are decisions made ABOUT the
   * member, and there is no member-facing route to either. On a demo database
   * nobody is doing them, so the procedure route stops at step 20 and the last
   * third of the flow is unreachable.
   *
   * Refused outside development, scoped to the caller's own procedure, and it
   * calls the very same service methods operations call — so a demo cannot
   * reach a state real operations could not. The stand-in approves the estimate
   * in full; a real adjudicator decides the number.
   */
  @Post(':procedureId/demo-advance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Development only: stand in for operations to move a procedure on' })
  async demoAdvance(@Param('procedureId') procedureId: string, @Request() req: any) {
    if (this.configService.get<string>('nodeEnv') !== 'development') {
      throw new ForbiddenException('Our team decides this');
    }
    const procedure = await this.service.findOwned(procedureId, req.user.userId);
    return { success: true, data: await this.service.demoAdvance(procedure.procedureId) };
  }

  @Get()
  @ApiOperation({ summary: "The member's dental procedures, newest first" })
  async list(@Request() req: any) {
    return { success: true, data: await this.service.listForUser(req.user.userId) };
  }

  @Get(':procedureId')
  @ApiOperation({ summary: 'One procedure: its estimate, what was approved, and the split' })
  async detail(@Param('procedureId') procedureId: string, @Request() req: any) {
    return {
      success: true,
      data: await this.service.findOwned(procedureId, req.user.userId),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Step 18: add the estimate the dentist gave. Nothing is charged' })
  async addEstimate(
    @Body() body: { bookingId: string; estimateAmount: number; procedureNotes?: string },
    @Request() req: any,
  ) {
    return {
      success: true,
      data: await this.service.addEstimate(req.user.userId, body),
    };
  }

  @Post(':procedureId/schedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Steps 24-26: pick a slot with the same dentist and pay. Confirmation follows',
  })
  async schedule(
    @Param('procedureId') procedureId: string,
    @Body() body: { appointmentDate: string; appointmentTime: string },
    @Request() req: any,
  ) {
    return {
      success: true,
      data: await this.service.schedule(procedureId, req.user.userId, body),
    };
  }
}
