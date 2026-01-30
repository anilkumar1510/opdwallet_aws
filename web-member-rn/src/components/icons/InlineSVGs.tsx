/**
 * Inline SVG Icons
 * Exact SVG implementations from Next.js dashboard
 */

import React from 'react';
import Svg, { Path, G, Circle, Rect, Defs, ClipPath } from 'react-native-svg';

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

/**
 * User Icon - Used in Policy Cards
 * 16x16px
 */
export const UserIcon: React.FC<IconProps> = ({ width = 16, height = 16, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
    <Path
      d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
      fill={color}
    />
  </Svg>
);

/**
 * Arrow Right Icon - Used in Benefit Cards
 * 12x12px (viewBox 0 0 14 14)
 */
export const ArrowRightIcon: React.FC<IconProps> = ({ width = 12, height = 12, color = '#545454' }) => (
  <Svg width={width} height={height} viewBox="0 0 14 14" fill="none">
    <Path
      d="M5 2.5L9.5 7L5 11.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Arrow Forward Vector - Used in Quick Links
 * 10x10px
 */
export const ArrowForwardIcon: React.FC<IconProps> = ({ width = 10, height = 10, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 10 10" fill="none">
    <Path
      d="M1 5H9M9 5L5 1M9 5L5 9"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Chevron Down Icon - Used in User Greeting Dropdown
 * 16x16px
 */
export const ChevronDownIcon: React.FC<IconProps> = ({ width = 16, height = 16, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
    <Path
      d="M4 6L8 10L12 6"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Chevron Left Icon - Used in Carousel Navigation
 * 24x24px
 */
export const ChevronLeftIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#374151' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Chevron Right Icon - Used in Carousel Navigation
 * 24x24px
 */
export const ChevronRightIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#374151' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Notification Bell Icon - Used in Header
 * 20x20px
 */
export const NotificationBellIcon: React.FC<IconProps> = ({ width = 20, height = 20, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 20 20" fill="none">
    <Path
      d="M15 6.66669C15 5.34062 14.4732 4.06883 13.5355 3.13115C12.5979 2.19347 11.3261 1.66669 10 1.66669C8.67392 1.66669 7.40215 2.19347 6.46447 3.13115C5.52678 4.06883 5 5.34062 5 6.66669C5 12.5 2.5 14.1667 2.5 14.1667H17.5C17.5 14.1667 15 12.5 15 6.66669Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.4417 17.5C11.2952 17.7526 11.0849 17.9622 10.8319 18.1079C10.5789 18.2537 10.292 18.3304 10 18.3304C9.70803 18.3304 9.42117 18.2537 9.16816 18.1079C8.91515 17.9622 8.70486 17.7526 8.55835 17.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Cart Icon - Used in Header
 * 20x20px
 */
export const CartIcon: React.FC<IconProps> = ({ width = 20, height = 20, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 20 20" fill="none">
    <Path
      d="M7.5 16.6667C8.42047 16.6667 9.16667 15.9205 9.16667 15C9.16667 14.0795 8.42047 13.3333 7.5 13.3333C6.57953 13.3333 5.83333 14.0795 5.83333 15C5.83333 15.9205 6.57953 16.6667 7.5 16.6667Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.8333 16.6667C16.7538 16.6667 17.5 15.9205 17.5 15C17.5 14.0795 16.7538 13.3333 15.8333 13.3333C14.9129 13.3333 14.1667 14.0795 14.1667 15C14.1667 15.9205 14.9129 16.6667 15.8333 16.6667Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M0.833374 0.833313H4.16671L6.40004 11.9916C6.47622 12.3753 6.68492 12.72 6.98967 12.9652C7.29443 13.2105 7.67559 13.3408 8.06671 13.3333H15.3334C15.7245 13.3408 16.1056 13.2105 16.4104 12.9652C16.7151 12.72 16.9238 12.3753 17 11.9916L18.3334 5H5.00004"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Wallet Nav Icon - Used in Header Navigation
 * 18x18px
 */
export const WalletNavIcon: React.FC<IconProps> = ({ width = 18, height = 18, color = '#034DA2' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 7H3C2.45 7 2 7.45 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 7.45 21.55 7 21 7ZM20 18H4V9H20V18ZM17 14C17 13.45 17.45 13 18 13C18.55 13 19 13.45 19 14C19 14.55 18.55 15 18 15C17.45 15 17 14.55 17 14Z"
      fill={color}
    />
    <Path
      d="M20 4H4C2.9 4 2 4.9 2 6V7H22V6C22 4.9 21.1 4 20 4Z"
      fill={color}
    />
  </Svg>
);

/**
 * Shield Check Icon - Used in Policy Details
 * 24x24px
 */
export const ShieldCheckIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0E51A2' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Document Text Icon - Used in Policy Details
 * 20x20px
 */
export const DocumentTextIcon: React.FC<IconProps> = ({ width = 20, height = 20, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Building Office Icon - Used in Policy Details
 * 20x20px
 */
export const BuildingOfficeIcon: React.FC<IconProps> = ({ width = 20, height = 20, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Calendar Icon - Used in Policy Details
 * 20x20px
 */
export const CalendarIcon: React.FC<IconProps> = ({ width = 20, height = 20, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Clock Icon - Used in Dental Slot Selection
 * 24x24px Heroicons outline
 */
export const ClockIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Banknotes Icon - Used in Dental Confirmation
 * 24x24px Heroicons outline
 */
export const BanknotesIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Wallet Icon - Used in Payment Breakdown
 * 24x24px Heroicons outline
 */
export const WalletIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Check Circle Icon - Used in Policy Details (Inclusions)
 * 24x24px
 */
export const CheckCircleIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#16a34a' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * X Circle Icon - Used in Policy Details (Exclusions/Error)
 * 24x24px
 */
export const XCircleIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#ef4444' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Arrow Left Icon - Used in Policy Details (Back button)
 * 24x24px
 */
export const ArrowLeftIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0E51A2' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Wallet Illustration - Used in WalletBalanceCard
 * 75x65px (default size from design system)
 */
export const WalletIllustration: React.FC<IconProps> = ({ width = 75, height = 65 }) => (
  <Svg width={width} height={height} viewBox="0 0 96.5121 55.3963" fill="none">
    <G clipPath="url(#clip0_0_103)">
      <Path d="M40.3594 55.3929C62.6493 55.3929 80.7188 54.2439 80.7188 52.8265C80.7188 51.4092 62.6493 50.2602 40.3594 50.2602C18.0695 50.2602 0 51.4092 0 52.8265C0 54.2439 18.0695 55.3929 40.3594 55.3929Z" fill="#2D5B93"/>
      <Path d="M39.8698 38.4245C47.8332 38.4245 54.2887 37.7639 54.2887 36.9489C54.2887 36.1339 47.8332 35.4732 39.8698 35.4732C31.9065 35.4732 25.4509 36.1339 25.4509 36.9489C25.4509 37.7639 31.9065 38.4245 39.8698 38.4245Z" fill="#DCE6F9"/>
      <Path d="M59.8735 52.3605H7.98915V9.74543H58.9314C60.7414 9.74543 62.2103 11.2143 62.2103 13.0243V50.0238C62.2103 51.3137 61.1635 52.3605 59.8735 52.3605Z" fill="#D77637"/>
      <Path d="M19.6698 20.0784C24.349 20.0784 28.1422 16.2852 28.1422 11.6061C28.1422 6.9269 24.349 3.13369 19.6698 3.13369C14.9907 3.13369 11.1975 6.9269 11.1975 11.6061C11.1975 16.2852 14.9907 20.0784 19.6698 20.0784Z" fill="#F7CE00"/>
      <Path d="M19.6697 18.2921C23.3623 18.2921 26.3558 15.2987 26.3558 11.6061C26.3558 7.91347 23.3623 4.92002 19.6697 4.92002C15.9771 4.92002 12.9837 7.91347 12.9837 11.6061C12.9837 15.2987 15.9771 18.2921 19.6697 18.2921Z" fill="#F7BF00"/>
      <Path d="M35.9257 16.9447C40.6049 16.9447 44.3981 13.1515 44.3981 8.47238C44.3981 3.79322 40.6049 6.2701e-06 35.9257 6.2701e-06C31.2466 6.2701e-06 27.4534 3.79322 27.4534 8.47238C27.4534 13.1515 31.2466 16.9447 35.9257 16.9447Z" fill="#F7CE00"/>
      <Path d="M35.9254 15.1584C39.618 15.1584 42.6115 12.165 42.6115 8.47238C42.6115 4.77978 39.618 1.78633 35.9254 1.78633C32.2328 1.78633 29.2394 4.77978 29.2394 8.47238C29.2394 12.165 32.2328 15.1584 35.9254 15.1584Z" fill="#F7BF00"/>
      <Path d="M84.1903 5.99045H23.6039V37.6749H84.1903V5.99045Z" fill="#B5D6FF"/>
      <Path d="M77.2137 31.8026H66.2188V33.7713H77.2137V31.8026Z" fill="#89B9F5"/>
      <Path d="M75.4881 20.0784H69.5754C68.6205 20.0784 67.8464 20.8525 67.8464 21.8073V21.858C67.8464 22.8128 68.6205 23.5869 69.5754 23.5869H75.4881C76.443 23.5869 77.217 22.8128 77.217 21.858V21.8073C77.217 20.8525 76.443 20.0784 75.4881 20.0784Z" fill="#89B9F5"/>
      <Path d="M96.5118 14.8883H35.9254V46.5727H96.5118V14.8883Z" fill="#F4F9FF"/>
      <Path d="M89.5356 40.7005H78.5408V42.6692H89.5356V40.7005Z" fill="#89B9F5"/>
      <Path d="M87.8099 28.9762H81.8971C80.9422 28.9762 80.1682 29.7503 80.1682 30.7052V30.7558C80.1682 31.7107 80.9422 32.4847 81.8971 32.4847H87.8099C88.7647 32.4847 89.5388 31.7107 89.5388 30.7558V30.7052C89.5388 29.7503 88.7647 28.9762 87.8099 28.9762Z" fill="#89B9F5"/>
      <Path d="M57.537 14.6519H6.50697C5.15288 14.6519 4.05542 13.5544 4.05542 12.2003V50.0238C4.05542 51.3137 5.10223 52.3605 6.39216 52.3605H55.9364C56.5578 52.3605 57.1183 52.1174 57.537 51.7257V14.6519Z" fill="#CE6429"/>
      <Path d="M6.50697 14.6519C5.15288 14.6519 4.05542 13.5544 4.05542 12.2003V50.0238C4.05542 51.3137 5.10223 52.3605 6.39216 52.3605H30.7118V14.6519H6.50697Z" fill="#D77637"/>
      <Path d="M4.05542 42.0749H25.6399C26.7812 42.0749 27.7065 43.0001 27.7065 44.1415V44.1989C27.7065 45.3402 26.7812 46.2655 25.6399 46.2655H4.05542V42.0749Z" fill="#F7BF00"/>
      <Path d="M53.1778 16.3369H8.24617C6.95562 16.3369 5.90943 17.3831 5.90943 18.6737V48.4806C5.90943 49.7712 6.95562 50.8173 8.24617 50.8173H53.1778C54.4683 50.8173 55.5145 49.7712 55.5145 48.4806V18.6737C55.5145 17.3831 54.4683 16.3369 53.1778 16.3369Z" stroke="#FFBA00" strokeWidth="0.675358" strokeMiterlimit="10" strokeDasharray="1.01 1.01"/>
    </G>
    <Defs>
      <ClipPath id="clip0_0_103">
        <Rect width="96.5121" height="55.3963" fill="white"/>
      </ClipPath>
    </Defs>
  </Svg>
);

/**
 * Phone Icon - Used in Helpline Page
 * 24x24px Heroicons outline
 */
export const PhoneIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.25 6.75C2.25 15.034 8.966 21.75 17.25 21.75H19.5C20.0967 21.75 20.669 21.5129 21.091 21.091C21.5129 20.669 21.75 20.0967 21.75 19.5V18.128C21.75 17.612 21.399 17.162 20.898 17.037L16.475 15.931C16.035 15.821 15.573 15.986 15.302 16.348L14.332 17.641C14.05 18.017 13.563 18.183 13.122 18.021C11.4849 17.4191 9.99815 16.4686 8.76478 15.2352C7.53141 14.0018 6.58087 12.5151 5.979 10.878C5.817 10.437 5.983 9.95 6.359 9.668L7.652 8.698C8.015 8.427 8.179 7.964 8.069 7.525L6.963 3.102C6.90214 2.85869 6.76172 2.6427 6.56405 2.48834C6.36638 2.33397 6.1228 2.25008 5.872 2.25H4.5C3.90326 2.25 3.33097 2.48705 2.90901 2.90901C2.48705 3.33097 2.25 3.90326 2.25 4.5V6.75Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Beaker Icon - Used in Pharmacy Page
 * 24x24px Heroicons outline
 */
export const BeakerIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.75 3.104V5.25M14.25 3.104V5.25M9.75 21C9.35218 21 8.97064 20.842 8.68934 20.5607C8.40804 20.2794 8.25 19.8978 8.25 19.5V10.5L3.48001 5.73C3.18783 5.4378 3.01959 5.0351 3.01417 4.61255C3.00875 4.18999 3.16657 3.78294 3.45089 3.48353C3.73522 3.18412 4.12471 3.01471 4.53399 3.00518C4.94328 2.99565 5.34003 3.14688 5.63751 3.432L9.75 7.5L13.875 3.375C14.0175 3.22822 14.1878 3.11157 14.3761 3.03177C14.5644 2.95198 14.7671 2.91065 14.972 2.91065C15.1769 2.91065 15.3796 2.95198 15.5679 3.03177C15.7562 3.11157 15.9265 3.22822 16.069 3.375C16.2158 3.51746 16.3324 3.68778 16.4122 3.87609C16.492 4.06439 16.5334 4.26714 16.5334 4.472C16.5334 4.67686 16.492 4.87961 16.4122 5.06791C16.3324 5.25622 16.2158 5.42654 16.069 5.569L11.25 10.5V19.5C11.25 19.8978 11.092 20.2794 10.8107 20.5607C10.5294 20.842 10.1478 21 9.75 21Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Sparkles Icon - Used in Empty States
 * 24x24px Heroicons outline
 */
export const SparklesIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * MagnifyingGlass Icon - Used in Search Bar
 * 24x24px Heroicons outline
 */
export const MagnifyingGlassIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21L15.5 15.5M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * MapPin Icon - Used in Location/Clinic Pages
 * 24x24px Heroicons outline
 */
export const MapPinIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 10.5C15 12.1569 13.6569 13.5 12 13.5C10.3431 13.5 9 12.1569 9 10.5C9 8.84315 10.3431 7.5 12 7.5C13.6569 7.5 15 8.84315 15 10.5Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.5 10.5C19.5 17.642 12 21.75 12 21.75C12 21.75 4.5 17.642 4.5 10.5C4.5 8.51088 5.29018 6.60322 6.6967 5.1967C8.10322 3.79018 10.0109 3 12 3C13.9891 3 15.8968 3.79018 17.3033 5.1967C18.7098 6.60322 19.5 8.51088 19.5 10.5Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const EyeIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.45801 12C3.73201 7.943 7.52301 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.52301 19 3.73201 16.057 2.45801 12Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HeartIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61C20.3292 4.099 19.7228 3.69365 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69365 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.12087 20.84 4.61Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BuildingStorefrontIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13.5 21V13.5H10.5V21"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.25 10.5L3 3.75H21L21.75 10.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.375 10.5C3.375 11.2462 3.67113 11.9614 4.19686 12.4871C4.72258 13.0129 5.43777 13.309 6.18398 13.309C6.9302 13.309 7.64539 13.0129 8.17111 12.4871C8.69684 11.9614 8.99297 11.2462 8.99297 10.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.99297 10.5C8.99297 11.2462 9.2891 11.9614 9.81483 12.4871C10.3406 13.0129 11.0557 13.309 11.802 13.309C12.5482 13.309 13.2634 13.0129 13.7891 12.4871C14.3148 11.9614 14.611 11.2462 14.611 10.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.611 10.5C14.611 11.2462 14.9071 11.9614 15.4328 12.4871C15.9586 13.0129 16.6737 13.309 17.42 13.309C18.1662 13.309 18.8814 13.0129 19.4071 12.4871C19.9328 11.9614 20.229 11.2462 20.229 10.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.25 10.5V19.5C2.25 19.8978 2.40804 20.2794 2.68934 20.5607C2.97064 20.842 3.35218 21 3.75 21H20.25C20.6478 21 21.0294 20.842 21.3107 20.5607C21.592 20.2794 21.75 19.8978 21.75 19.5V10.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Document Arrow Down Icon - Used for invoice downloads
 * 24x24px
 */
export const DocumentArrowDownIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ width = 20, height = 20, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.5 12.75l6 6 9-13.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FunnelIcon: React.FC<IconProps> = ({ width = 20, height = 20, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TagIcon: React.FC<IconProps> = ({ width = 20, height = 20, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 6h.008v.008H6V6z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ width = 20, height = 20, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 19.5V4.5m0 0l-7.5 7.5M12 4.5l7.5 7.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ width = 20, height = 20, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4.5v15m0 0l7.5-7.5M12 19.5l-7.5-7.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Plus Icon - Used in Add/Create buttons
 * 24x24px Heroicons outline
 */
export const PlusIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4.5v15m7.5-7.5h-15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Star Icon - Used in Ratings
 * 24x24px Heroicons outline
 */
export const StarIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#F59E0B' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </Svg>
);

/**
 * Home Icon - Used for Home Collection
 * 24x24px Heroicons outline
 */
export const HomeIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Exclamation Triangle Icon - Used for warnings
 * 24x24px Heroicons outline
 */
export const ExclamationTriangleIcon: React.FC<IconProps> = ({ width = 24, height = 24, color = '#F59E0B' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
