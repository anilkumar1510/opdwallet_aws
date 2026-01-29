/**
 * Design System Constants
 * Pixel-perfect values extracted from Next.js mobile dashboard
 */

export const COLORS = {
  // Primary Blues
  brandPrimary: '#034da2',
  brandDark: '#0a3f93',
  brandAccent: '#0366de',
  brandActive: '#1E3A8C',

  // Wallet Gradient
  walletStart: '#5CA3FA',
  walletEnd: '#2266B6',
  walletSubtitle: '#B1D2FC',
  walletSlash: 'rgba(255, 255, 255, 0.63)',

  // Grays
  headerText: '#1c1c1c',
  primaryText: '#000000',
  secondaryText: '#383838',
  tertiaryText: '#3b3b3b',
  quaternaryText: '#444444',
  subtitleText: '#666666',

  // Backgrounds
  pageBackground: '#f7f7fc',
  cardBackground: '#ffffff',
  iconButtonBg: '#fbfdfe',
  arrowButtonBg: '#f6f6f6',

  // Borders & Lines
  cardBorder: 'rgba(217, 217, 217, 0.48)',
  quickLinkBorder: 'rgba(3, 77, 162, 0.11)',
  policyBorder: 'rgba(164, 191, 254, 0.48)',
  policyDivider: 'rgba(164, 191, 254, 0.6)',

  // Shadows
  shadow1: 'rgba(0, 0, 0, 0.05)',
  shadow2: 'rgba(0, 0, 0, 0.08)',

  // State Colors
  leftLabel: 'rgba(0, 0, 0, 0.4)',

  // Pagination
  paginationActive: '#1E3A8C',
  paginationInactive: '#cbd5e1',
} as const;

export const GRADIENTS = {
  quickLink: 'linear-gradient(180deg, #ffffff 0%, #f3f4f5 100%)',
  wallet: 'linear-gradient(180deg, #5CA3FA 0%, #2266B6 100%)',
  policyCard: 'linear-gradient(-3.81deg, rgba(228, 235, 254, 1) 0.81%, rgba(205, 220, 254, 1) 94.71%)',
  desktopQuickLink: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
} as const;

export const SHADOWS = {
  quickLink: {
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 11 },
    shadowOpacity: 0.05,
    shadowRadius: 23.05,
    elevation: 5,
  },
  benefitCard: {
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 11 },
    shadowOpacity: 0.08,
    shadowRadius: 23.05,
    elevation: 6,
  },
  policyCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 11.75,
    elevation: 4,
  },
} as const;

export const TYPOGRAPHY = {
  fontFamily: 'SF Pro Display, system-ui, sans-serif',

  // Font Sizes (Mobile)
  sectionHeader: 18,
  userGreeting: 16,
  quickLinkText: 16,
  benefitTitle: 14,
  benefitBalance: 14,
  walletTitle: 13,
  walletBalance: 16,
  subtitle: 12,
  smallText: 11,
  tinyText: 10,
  policyText: 12,
} as const;

export const DIMENSIONS = {
  // Avatar & Icons
  avatar: 38,
  iconButton: 35,
  userIconSize: 16,
  arrowIconSize: 10,
  serviceIconSize: 24,
  benefitArrowButton: 24,

  // Card Heights
  quickLinkHeight: 36,
  walletCardMinHeight: 95,
  benefitCardMinHeight: 78,
  serviceButtonHeight: 50,
  policyCardMinHeight: 137,

  // Wallet Illustration
  walletIllustrationWidth: 75,
  walletIllustrationHeight: 65,

  // Pagination Dots
  activeDotWidth: 14,
  activeDotHeight: 4,
  inactiveDotSize: 4,

  // Border Radius
  cardRadius: 16,
  circleRadius: 9999,

  // Spacing
  sectionPaddingHorizontal: 20,
  gridGap: 16,
  quickLinkGap: 8,
  serviceGap: 10,
  policyGap: 16,
} as const;

export const SPACING = {
  // Section Padding
  section: {
    px: 20, // px-5
    pt: 12, // pt-3
    pb: 0,
  },

  // Quick Link
  quickLink: {
    px: 14,
    gap: 8,
  },

  // Wallet Card
  wallet: {
    p: 12,
    pr: 100, // Space for illustration
  },

  // Benefit Card
  benefit: {
    p: 9,
    pb: 10,
  },

  // Service Button
  service: {
    px: 16,
    gap: 12,
  },

  // Policy Card
  policy: {
    p: 13,
  },
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Helper function to check if mobile view
export const isMobileView = (width: number) => width < BREAKPOINTS.lg;

// Helper function to get grid columns
export const getGridColumns = (width: number) => {
  if (width >= BREAKPOINTS['2xl']) return 4;
  if (width >= BREAKPOINTS.lg) return 3;
  return 2;
};
