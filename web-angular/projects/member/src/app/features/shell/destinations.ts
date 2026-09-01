/**
 * One destination list drives both navigation surfaces — the desktop top bar
 * and the mobile pill — so parity between them is structural rather than a
 * synchronisation chore.
 *
 * Matches web-member's `bottomNavItems` in components/BottomNavigation.tsx.
 */
import { IconName } from '../../shared/ui/icon';

export interface Destination {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
  /** web-member's own SVG, used on the mobile pill where it is on white. */
  readonly iconSrc: string;
  /** Home sits in its own highlighted capsule in the mobile pill. */
  readonly exact: boolean;
}

export const DESTINATIONS: readonly Destination[] = [
  {
    path: '/member',
    label: 'Home',
    icon: 'home',
    iconSrc: 'images/icons/home-icon.png',
    exact: true,
  },
  {
    path: '/member/claims',
    label: 'Claims',
    icon: 'claims',
    iconSrc: 'images/icons/claim-icon.png',
    exact: false,
  },
  {
    path: '/member/bookings',
    label: 'Bookings',
    icon: 'bookings',
    iconSrc: 'images/icons/bookings-icon.png',
    exact: false,
  },
  {
    path: '/member/wallet',
    label: 'Wallet',
    icon: 'wallet',
    iconSrc: 'images/icons/wallet-icon.png',
    exact: false,
  },
];

export const SECONDARY_DESTINATIONS = DESTINATIONS.filter((d) => !d.exact);
