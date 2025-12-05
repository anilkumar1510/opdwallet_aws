import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark controller methods that require a specific benefit category
 * to be enabled in the user's policy configuration
 *
 * @param categoryCode - The category code (e.g., 'CAT001', 'CAT002', etc.)
 *
 * @example
 * @Get()
 * @RequiresBenefit('CAT001')
 * async getAppointments() { ... }
 */
export const RequiresBenefit = (categoryCode: string) =>
  SetMetadata('requiredCategory', categoryCode);
