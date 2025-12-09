/**
 * Resolves the appropriate benefit configuration for a user based on their relationship
 * Priority: Member-specific config > Global benefit config > null
 */
export class BenefitResolver {
  /**
   * Resolve benefit configuration for a specific category and user
   * @param planConfig - The plan configuration object
   * @param categoryCode - Category code (CAT001, CAT002, etc.)
   * @param userRelationship - User's relationship code (REL001, REL002, etc.) or null
   * @returns Benefit configuration or null if not configured
   */
  static resolve(
    planConfig: any,
    categoryCode: string,
    userRelationship?: string | null,
  ): any | null {
    console.log('🔍 [BENEFIT RESOLVER] ========== BENEFIT RESOLUTION START ==========');
    console.log('🔍 [BENEFIT RESOLVER] Category:', categoryCode);
    console.log('🔍 [BENEFIT RESOLVER] User relationship:', userRelationship || 'NOT PROVIDED');
    console.log('🔍 [BENEFIT RESOLVER] Plan config available:', !!planConfig);

    if (!planConfig) {
      console.log('⚠️ [BENEFIT RESOLVER] No plan config provided, returning null');
      return null;
    }

    // Step 1: Try to get member-specific benefit config if relationship is provided
    if (userRelationship && planConfig.memberConfigs) {
      console.log('🔍 [BENEFIT RESOLVER] Checking member-specific config for relationship:', userRelationship);
      console.log('🔍 [BENEFIT RESOLVER] Available memberConfigs:', Object.keys(planConfig.memberConfigs || {}));

      const memberConfig = planConfig.memberConfigs[userRelationship];

      if (memberConfig) {
        console.log('✅ [BENEFIT RESOLVER] Found memberConfig for', userRelationship);

        if (memberConfig.benefits && memberConfig.benefits[categoryCode]) {
          const benefitConfig = memberConfig.benefits[categoryCode];
          console.log('✅✅ [BENEFIT RESOLVER] Found MEMBER-SPECIFIC benefit config for', categoryCode);
          console.log('✅✅ [BENEFIT RESOLVER] Benefit config:', JSON.stringify(benefitConfig, null, 2));
          console.log('✅✅ [BENEFIT RESOLVER] Using member-specific benefit');
          return benefitConfig;
        } else {
          console.log('⚠️ [BENEFIT RESOLVER] MemberConfig found but no benefit for category', categoryCode);
        }
      } else {
        console.log('⚠️ [BENEFIT RESOLVER] No memberConfig found for', userRelationship);
      }
    } else {
      if (!userRelationship) {
        console.log('⚠️ [BENEFIT RESOLVER] No user relationship provided');
      }
      if (!planConfig.memberConfigs) {
        console.log('⚠️ [BENEFIT RESOLVER] No memberConfigs in plan config');
      }
    }

    // Step 2: Fallback to global benefit config
    console.log('🔍 [BENEFIT RESOLVER] Checking global benefit config...');
    if (planConfig.benefits && planConfig.benefits[categoryCode]) {
      const benefitConfig = planConfig.benefits[categoryCode];
      console.log('✅ [BENEFIT RESOLVER] Found GLOBAL benefit config for', categoryCode);
      console.log('✅ [BENEFIT RESOLVER] Benefit config:', JSON.stringify(benefitConfig, null, 2));
      console.log('✅ [BENEFIT RESOLVER] Using global benefit');
      return benefitConfig;
    } else {
      console.log('⚠️ [BENEFIT RESOLVER] No benefit in global config for category', categoryCode);
      if (!planConfig.benefits) {
        console.log('⚠️ [BENEFIT RESOLVER] No benefits config found');
      }
    }

    // Step 3: No benefit configured at any level
    console.log('❌ [BENEFIT RESOLVER] No benefit configuration found at any level');
    console.log('❌ [BENEFIT RESOLVER] Returning null');
    console.log('🔍 [BENEFIT RESOLVER] ========== BENEFIT RESOLUTION END ==========');
    return null;
  }

  /**
   * Get a human-readable description of where the benefit config came from
   * @param planConfig - The plan configuration object
   * @param categoryCode - Category code
   * @param userRelationship - User's relationship code
   * @returns Description string
   */
  static getSource(
    planConfig: any,
    categoryCode: string,
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
      planConfig.memberConfigs[userRelationship].benefits &&
      planConfig.memberConfigs[userRelationship].benefits[categoryCode]
    ) {
      return `Member-specific (${userRelationship})`;
    }

    // Check global benefits
    if (planConfig.benefits && planConfig.benefits[categoryCode]) {
      return 'Global benefit config';
    }

    return 'No benefit configured';
  }
}
