import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { PharmacyOrderService } from '../services/pharmacy-order.service';

/**
 * Stands in for the pharmacy partner, who does not exist as a real
 * integration. Steps 10-11 (confirmed -> processed) collapse into whatever
 * pay() already set; this is only step 12, marking delivery and raising the
 * real invoice.
 */
@Controller('ops/pharmacy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.SUPER_ADMIN)
export class PharmacyOpsController {
  constructor(private readonly orderService: PharmacyOrderService) {}

  @Patch('orders/:orderId/deliver')
  async markDelivered(@Param('orderId') orderId: string) {
    return this.orderService.markDelivered(orderId);
  }
}
