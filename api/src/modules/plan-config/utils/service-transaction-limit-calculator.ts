import { BenefitResolver } from './benefit-resolver';

export interface ServiceTransactionLimitCalculation {
  billAmount: number;
  copayAmount: number;
  insuranceEligibleAmount: number; // billAmount - copayAmount
  serviceTransactionLimit: number | null;
  insurancePayment: number; // min(insuranceEligibleAmount, serviceTransactionLimit)
  excessAmount: number; // insuranceEligibleAmount - insurancePayment
  totalMemberPayment: number; // copayAmount + excessAmount
  wasLimitApplied: boolean;
}

export class ServiceTransactionLimitCalculator {
  /**
   * Calculate payment breakdown with service transaction limit
   *
   * Order of operations:
   * 1. Bill Amount
   * 2. Apply Copay (member pays copayAmount, insurance eligible = billAmount - copayAmount)
   * 3. Apply Service Transaction Limit to insurance eligible amount
   * 4. If limit exceeded: insurance pays limit, member pays excess
   *
   * @param billAmount - Total bill amount
   * @param copayAmount - Member's copay (already calculated)
   * @param serviceTransactionLimit - Per-service transaction limit or null if not configured
   * @returns Breakdown of insurance payment vs member out-of-pocket
   */
  static calculate(
    billAmount: number,
    copayAmount: number,
    serviceTransactionLimit: number | null
  ): ServiceTransactionLimitCalculation {
    console.log('🔒 [SERVICE LIMIT CALC] ========== CALCULATION START ==========');
    console.log('🔒 [SERVICE LIMIT CALC] Bill amount:', billAmount);
    console.log('🔒 [SERVICE LIMIT CALC] Copay amount:', copayAmount);
    console.log('🔒 [SERVICE LIMIT CALC] Service transaction limit:', serviceTransactionLimit);

    const insuranceEligibleAmount = billAmount - copayAmount;
    console.log('🔒 [SERVICE LIMIT CALC] Insurance eligible amount (after copay):', insuranceEligibleAmount);

    // No limit configured - insurance pays full eligible amount
    if (!serviceTransactionLimit || serviceTransactionLimit <= 0) {
      console.log('✅ [SERVICE LIMIT CALC] No service limit configured or limit is 0');
      console.log('✅ [SERVICE LIMIT CALC] Insurance pays full eligible amount:', insuranceEligibleAmount);
      console.log('🔒 [SERVICE LIMIT CALC] ========== CALCULATION END ==========');
      return {
        billAmount,
        copayAmount,
        insuranceEligibleAmount,
        serviceTransactionLimit: null,
        insurancePayment: insuranceEligibleAmount,
        excessAmount: 0,
        totalMemberPayment: copayAmount,
        wasLimitApplied: false
      };
    }

    // Apply limit to insurance eligible amount
    const insurancePayment = Math.min(insuranceEligibleAmount, serviceTransactionLimit);
    const excessAmount = insuranceEligibleAmount - insurancePayment;
    const wasLimitApplied = excessAmount > 0;

    console.log('🔒 [SERVICE LIMIT CALC] Insurance payment (capped):', insurancePayment);
    console.log('🔒 [SERVICE LIMIT CALC] Excess amount (member pays beyond copay):', excessAmount);
    console.log('🔒 [SERVICE LIMIT CALC] Total member payment:', copayAmount + excessAmount);
    console.log('🔒 [SERVICE LIMIT CALC] Was limit applied:', wasLimitApplied);
    console.log('🔒 [SERVICE LIMIT CALC] ========== CALCULATION END ==========');

    return {
      billAmount,
      copayAmount,
      insuranceEligibleAmount,
      serviceTransactionLimit,
      insurancePayment,
      excessAmount,
      totalMemberPayment: copayAmount + excessAmount,
      wasLimitApplied
    };
  }

  /**
   * Get service transaction limit from plan config for a specific service
   *
   * @param planConfig - The plan configuration object
   * @param categoryCode - Category code (CAT001, CAT002, etc.)
   * @param serviceId - ID of the specific service (specialty ID, lab service ID, etc.)
   * @param userRelationship - User's relationship code or null
   * @returns Service transaction limit amount or null if not configured
   */
  static getServiceLimit(
    planConfig: any,
    categoryCode: string,
    serviceId: string,
    userRelationship?: string | null
  ): number | null {
    console.log('🔍 [SERVICE LIMIT] Fetching service limit for:', {
      categoryCode,
      serviceId,
      userRelationship: userRelationship || 'NOT PROVIDED'
    });

    // Use BenefitResolver to get the right benefit config (member-specific or global)
    const benefit = BenefitResolver.resolve(planConfig, categoryCode, userRelationship);

    if (!benefit) {
      console.log('⚠️ [SERVICE LIMIT] No benefit config found');
      return null;
    }

    if (!benefit.serviceTransactionLimits) {
      console.log('⚠️ [SERVICE LIMIT] No serviceTransactionLimits configured in benefit');
      return null;
    }

    const limit = benefit.serviceTransactionLimits[serviceId];

    if (limit === undefined || limit === null) {
      console.log('⚠️ [SERVICE LIMIT] No limit configured for service:', serviceId);
      return null;
    }

    console.log('✅ [SERVICE LIMIT] Found service limit:', limit);
    return limit;
  }

  /**
   * Format service limit information for display
   *
   * @param calculation - Service limit calculation result
   * @returns Human-readable string
   */
  static format(calculation: ServiceTransactionLimitCalculation): string {
    if (!calculation.serviceTransactionLimit || !calculation.wasLimitApplied) {
      return 'No service limit applied';
    }

    return `Service limit ₹${calculation.serviceTransactionLimit} applied (excess: ₹${calculation.excessAmount})`;
  }

  /**
   * Get description for transaction records
   *
   * @param calculation - Service limit calculation result
   * @returns Description string
   */
  static getDescription(calculation: ServiceTransactionLimitCalculation): string {
    if (!calculation.serviceTransactionLimit) {
      return 'No service transaction limit configured';
    }

    if (!calculation.wasLimitApplied) {
      return `Service limit ₹${calculation.serviceTransactionLimit} (not exceeded)`;
    }

    return `Service limit ₹${calculation.serviceTransactionLimit} applied - member pays ₹${calculation.excessAmount} excess`;
  }
}
