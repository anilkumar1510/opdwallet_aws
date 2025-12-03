import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    console.log('✅✅✅ [DEPLOY_V4] AppointmentsController initialized successfully');
    console.log('✅✅✅ [DEPLOY_V4] AssignmentsService injection:', this.appointmentsService ? 'SUCCESS' : 'FAILED');
  }

  // Verify family access for profile switching privacy controls
  private async verifyFamilyAccess(requestingUserId: string, targetUserId: string): Promise<void> {
    // If requesting own data, no verification needed
    if (requestingUserId === targetUserId) {
      return;
    }

    // Get requesting user
    const requestingUser = await this.userModel.findById(requestingUserId).select('relationship memberId');
    if (!requestingUser) {
      throw new ForbiddenException('User not found');
    }

    // Build list of allowed user IDs (self + dependents if primary member)
    const allowedUserIds: string[] = [requestingUserId];

    // If primary member (REL001 or legacy 'SELF'), they can access their dependents
    const isPrimaryMember = (requestingUser.relationship as string) === 'REL001' ||
                            (requestingUser.relationship as string) === 'SELF';

    if (isPrimaryMember) {
      const dependents = await this.userModel
        .find({
          primaryMemberId: requestingUser.memberId,
          relationship: { $nin: ['REL001', 'SELF'] }
        })
        .select('_id');

      allowedUserIds.push(...dependents.map(dep => (dep._id as any).toString()));
    }

    // Check if target user is in allowed list
    if (!allowedUserIds.includes(targetUserId)) {
      throw new ForbiddenException('You do not have access to this user\'s appointments');
    }
  }

  @Post()
  async create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req: any) {
    try {
      const userId = req.user.userId;
      console.log('🚨🚨🚨 [DEPLOY_V4] APPOINTMENT CONTROLLER HIT - VERSION 2025-10-25-V4-CIRCULAR-FIX 🚨🚨🚨');
      console.log('🔵 [AppointmentsController] ========== CREATE APPOINTMENT START ==========');
      console.log('👤 [AppointmentsController] User ID from JWT:', userId);
      console.log('📥 [AppointmentsController] Request body:', JSON.stringify(createAppointmentDto, null, 2));
      console.log('👤 [AppointmentsController] User object:', JSON.stringify(req.user, null, 2));

      const result = await this.appointmentsService.create({ ...createAppointmentDto, userId });

      console.log('✅ [AppointmentsController] Appointment created successfully');
      console.log('📤 [AppointmentsController] Response:', JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      console.error('❌ [AppointmentsController] ========== ERROR IN CREATE APPOINTMENT ==========');
      console.error('❌ [AppointmentsController] Error name:', error.constructor.name);
      console.error('❌ [AppointmentsController] Error message:', error.message);
      console.error('❌ [AppointmentsController] Error stack:', error.stack);
      console.error('❌ [AppointmentsController] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('❌ [AppointmentsController] Request body:', JSON.stringify(createAppointmentDto, null, 2));

      // Re-throw with more context
      throw error;
    }
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll(@Query() query: any) {
    return this.appointmentsService.findAll(query);
  }

  @Get('user/:userId')
  async getUserAppointments(
    @Param('userId') userId: string,
    @Request() req: any,
    @Query('type') appointmentType?: string,
  ) {
    const requestingUserId = req.user.userId;

    // Verify family access before fetching data
    await this.verifyFamilyAccess(requestingUserId, userId);

    console.log('[AppointmentsController] Fetching appointments:', { requestingUserId, targetUserId: userId, appointmentType });
    return this.appointmentsService.getUserAppointments(userId, appointmentType);
  }

  @Get('user/:userId/ongoing')
  async getOngoingAppointments(@Param('userId') userId: string) {
    return this.appointmentsService.getOngoingAppointments(userId);
  }

  @Get(':appointmentId')
  async findOne(@Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.findOne(appointmentId);
  }

  @Patch(':appointmentId/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async confirm(@Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.confirmAppointment(appointmentId);
  }

  @Patch(':appointmentId/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancel(@Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.cancelAppointment(appointmentId);
  }

  @Patch(':appointmentId/user-cancel')
  async userCancel(@Param('appointmentId') appointmentId: string, @Request() req: any) {
    const userId = req.user.userId;
    console.log('[AppointmentsController] User cancelling appointment:', { appointmentId, userId });
    return this.appointmentsService.userCancelAppointment(appointmentId, userId);
  }
}