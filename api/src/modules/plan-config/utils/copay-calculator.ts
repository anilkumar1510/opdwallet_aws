export interface CopayConfig {
  mode: 'PERCENT' | 'AMOUNT';
  value: number;
}

export interface CopayCalculation {
  billAmount: number;
  copayAmount: number; // Member pays this
  walletDebitAmount: number; // Wallet pays this
  copayConfig: CopayConfig | null;
}

export class CopayCalculator {
  /**
   * Calculate copay breakdown for a transaction
   * @param billAmount - Total bill amount
   * @param copayConfig - Copay configuration from plan config
   * @returns Breakdown of copay vs wallet debit
   */
  static calculate(
    billAmount: number,
    copayConfig?: CopayConfig,
  ): CopayCalculation {
    // No copay configured - wallet pays full amount
    if (!copayConfig) {
      return {
        billAmount,
        copayAmount: 0,
        walletDebitAmount: billAmount,
        copayConfig: null,
      };
    }

    let copayAmount = 0;

    if (copayConfig.mode === 'PERCENT') {
      // Calculate percentage copay
      copayAmount = Math.round((billAmount * copayConfig.value) / 100);
    } else if (copayConfig.mode === 'AMOUNT') {
      // Flat amount copay, but cannot exceed bill amount
      copayAmount = Math.min(copayConfig.value, billAmount);
    }

    const walletDebitAmount = billAmount - copayAmount;

    return {
      billAmount,
      copayAmount,
      walletDebitAmount,
      copayConfig,
    };
  }

  /**
   * Format copay for display
   * @param calculation - Copay calculation result
   * @returns Human-readable string
   */
  static format(calculation: CopayCalculation): string {
    if (!calculation.copayConfig) {
      return 'No copay';
    }

    if (calculation.copayConfig.mode === 'PERCENT') {
      return `${calculation.copayConfig.value}% (₹${calculation.copayAmount})`;
    }

    return `₹${calculation.copayAmount}`;
  }

  /**
   * Get copay description for transaction records
   * @param calculation - Copay calculation result
   * @returns Description string
   */
  static getDescription(calculation: CopayCalculation): string {
    if (!calculation.copayConfig || calculation.copayAmount === 0) {
      return 'No copay applied';
    }

    if (calculation.copayConfig.mode === 'PERCENT') {
      return `${calculation.copayConfig.value}% copay applied`;
    }

    return `₹${calculation.copayConfig.value} copay applied`;
  }
}
