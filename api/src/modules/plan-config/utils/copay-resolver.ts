import { CopayConfig } from './copay-calculator';

/**
 * Resolves the appropriate copay configuration for a user based on their relationship
 * Priority: Member-specific config > Global wallet config > null (no copay)
 */
export class CopayResolver {
  /**
   * Resolve copay configuration for a specific user
   * @param planConfig - The plan configuration object
   * @param userRelationship - User's relationship code (REL001, REL002, etc.) or null
   * @returns Copay configuration or null if not configured
   */
  static resolve(
    planConfig: any,
    userRelationship?: string | null,
  ): CopayConfig | null {
    console.log('🔍 [COPAY RESOLVER] ========== COPAY RESOLUTION START ==========');
    console.log('🔍 [COPAY RESOLVER] User relationship:', userRelationship || 'NOT PROVIDED');
    console.log('🔍 [COPAY RESOLVER] Plan config available:', !!planConfig);

    if (!planConfig) {
      console.log('⚠️ [COPAY RESOLVER] No plan config provided, returning null');
      return null;
    }

    // Step 1: Try to get member-specific copay config if relationship is provided
    if (userRelationship && planConfig.memberConfigs) {
      console.log('🔍 [COPAY RESOLVER] Checking member-specific config for relationship:', userRelationship);
      console.log('🔍 [COPAY RESOLVER] Available memberConfigs:', Object.keys(planConfig.memberConfigs || {}));

      const memberConfig = planConfig.memberConfigs[userRelationship];

      if (memberConfig) {
        console.log('✅ [COPAY RESOLVER] Found memberConfig for', userRelationship);
        console.log('🔍 [COPAY RESOLVER] MemberConfig details:', JSON.stringify(memberConfig, null, 2));

        if (memberConfig.wallet && memberConfig.wallet.copay) {
          const copayConfig = memberConfig.wallet.copay;
          console.log('✅✅ [COPAY RESOLVER] Found MEMBER-SPECIFIC copay config!');
          console.log('✅✅ [COPAY RESOLVER] Mode:', copayConfig.mode);
          console.log('✅✅ [COPAY RESOLVER] Value:', copayConfig.value);
          console.log('✅✅ [COPAY RESOLVER] Using member-specific copay');
          return copayConfig;
        } else {
          console.log('⚠️ [COPAY RESOLVER] MemberConfig found but no copay in wallet');
        }
      } else {
        console.log('⚠️ [COPAY RESOLVER] No memberConfig found for', userRelationship);
      }
    } else {
      if (!userRelationship) {
        console.log('⚠️ [COPAY RESOLVER] No user relationship provided');
      }
      if (!planConfig.memberConfigs) {
        console.log('⚠️ [COPAY RESOLVER] No memberConfigs in plan config');
      }
    }

    // Step 2: Fallback to global wallet copay config
    console.log('🔍 [COPAY RESOLVER] Checking global wallet copay config...');
    if (planConfig.wallet && planConfig.wallet.copay) {
      const copayConfig = planConfig.wallet.copay;
      console.log('✅ [COPAY RESOLVER] Found GLOBAL wallet copay config!');
      console.log('✅ [COPAY RESOLVER] Mode:', copayConfig.mode);
      console.log('✅ [COPAY RESOLVER] Value:', copayConfig.value);
      console.log('✅ [COPAY RESOLVER] Using global wallet copay');
      return copayConfig;
    } else {
      console.log('⚠️ [COPAY RESOLVER] No copay in global wallet config');
      if (!planConfig.wallet) {
        console.log('⚠️ [COPAY RESOLVER] No wallet config found');
      } else {
        console.log('⚠️ [COPAY RESOLVER] Wallet exists but no copay field');
      }
    }

    // Step 3: No copay configured at any level
    console.log('❌ [COPAY RESOLVER] No copay configuration found at any level');
    console.log('❌ [COPAY RESOLVER] Returning null (no copay will be applied)');
    console.log('🔍 [COPAY RESOLVER] ========== COPAY RESOLUTION END ==========');
    return null;
  }

  /**
   * Get a human-readable description of where the copay config came from
   * @param planConfig - The plan configuration object
   * @param userRelationship - User's relationship code
   * @returns Description string
   */
  static getSource(
    planConfig: any,
    userRelationship?: string | null,
  ): string {
    if (!planConfig) {
      return 'No plan config';
    }

    // Check member-specific first
    if (
      userRelationship &&
      planConfig.memberConfigs &&
      planConfig.memberConfigs[userRelationship] &&
      planConfig.memberConfigs[userRelationship].wallet &&
      planConfig.memberConfigs[userRelationship].wallet.copay
    ) {
      return `Member-specific (${userRelationship})`;
    }

    // Check global wallet
    if (planConfig.wallet && planConfig.wallet.copay) {
      return 'Global wallet config';
    }

    return 'No copay configured';
  }
}
