import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { DentalProceduresService } from './dental-procedures.service';

/**
 * Operations' half of the procedure route — flow 4 steps 20-21 and 29-33.
 *
 * Adjudication decides what the plan will fund, so it cannot sit on the member
 * surface: a member approving their own estimate is the whole control gone.
 * Confirmation and completion are the clinic's word relayed by operations, and
 * the same reasoning applies.
 */
@Controller('ops/dental/procedures')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class DentalProceduresOpsController {
  constructor(private readonly service: DentalProceduresService) {}

  @Get('awaiting-adjudication')
  @ApiOperation({ summary: 'Step 20: estimates waiting on a decision' })
  async queue() {
    return { success: true, data: await this.service.awaitingAdjudication() };
  }

  @Post(':procedureId/adjudicate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Steps 20-21: approve a value and build the cart, or approve 0 to reject',
  })
  async adjudicate(
    @Param('procedureId') procedureId: string,
    @Body() body: { approvedAmount: number; notes?: string; serviceCode?: string },
  ) {
    return { success: true, data: await this.service.adjudicate(procedureId, body) };
  }

  @Post(':procedureId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 29: operations confirmed the slot with the clinic' })
  async confirm(@Param('procedureId') procedureId: string) {
    return { success: true, data: await this.service.confirm(procedureId) };
  }

  @Post(':procedureId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Steps 31-32: the procedure happened and the invoice is raised' })
  async complete(@Param('procedureId') procedureId: string) {
    return { success: true, data: await this.service.complete(procedureId) };
  }

  @Post(':procedureId/no-show')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 33: the vendor reports the patient did not attend' })
  async noShow(@Param('procedureId') procedureId: string) {
    return { success: true, data: await this.service.noShow(procedureId) };
  }
}
