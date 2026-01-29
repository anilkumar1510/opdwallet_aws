import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Ellipse, G, Defs, ClipPath } from 'react-native-svg';
import { useAuth } from '../../src/contexts/AuthContext';
import { useFamily } from '../../src/contexts/FamilyContext';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatShortCurrency = (amount: number) => {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(0)}L`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k`;
  }
  return amount.toString();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ============================================================================
// SVG ICONS - Extracted from Next.js exactly
// ============================================================================

// Notification Bell Icon - EXACT from notification-bell.svg
function NotificationBellIcon() {
  return (
    <Svg width={14} height={18} viewBox="0 0 14.4515 17.7047" fill="none">
      <G>
        <Path
          d="M2.34126 14.5494V7.2226C2.34126 5.92714 2.85587 4.68475 3.7719 3.76873C4.68792 2.8527 5.93032 2.33808 7.22577 2.33808C8.52122 2.33808 9.76362 2.8527 10.6796 3.76873C11.5957 4.68475 12.1103 5.92714 12.1103 7.2226V14.5494M2.34126 14.5494H12.1103M2.34126 14.5494H0.713084M12.1103 14.5494H13.7385M6.41168 16.9916H8.03985"
          stroke="#034DA2"
          strokeWidth="1.42617"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M7.22541 2.34126C7.67502 2.34126 8.0395 1.97678 8.0395 1.52717C8.0395 1.07756 7.67502 0.713084 7.22541 0.713084C6.77581 0.713084 6.41133 1.07756 6.41133 1.52717C6.41133 1.97678 6.77581 2.34126 7.22541 2.34126Z"
          stroke="#034DA2"
          strokeWidth="1.42617"
        />
      </G>
    </Svg>
  );
}

// Wallet Icon (18x18) - EXACT inline SVG from Next.js UserGreeting.tsx
function WalletIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 7H3C2.45 7 2 7.45 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 7.45 21.55 7 21 7ZM20 18H4V9H20V18ZM17 14C17 13.45 17.45 13 18 13C18.55 13 19 13.45 19 14C19 14.55 18.55 15 18 15C17.45 15 17 14.55 17 14Z"
        fill="#034DA2"
      />
      <Path d="M20 4H4C2.9 4 2 4.9 2 6V7H22V6C22 4.9 21.1 4 20 4Z" fill="#034DA2" />
    </Svg>
  );
}

// Cart Icon - EXACT from cart-icon.svg
function CartIcon() {
  return (
    <Svg width={14} height={15} viewBox="0 0 14.3621 14.6535" fill="none">
      <Path
        d="M0.610564 0C0.448633 0 0.293333 0.0643272 0.17883 0.17883C0.0643272 0.293333 0 0.448632 0 0.610564C0 0.772496 0.0643272 0.927795 0.17883 1.0423C0.293333 1.1568 0.448633 1.22113 0.610564 1.22113H0.910962C1.04354 1.22136 1.17244 1.26474 1.27819 1.34471C1.38393 1.42468 1.46078 1.53689 1.4971 1.6644L3.43381 8.44166C3.54335 8.82412 3.77444 9.16053 4.09213 9.40001C4.40982 9.63949 4.79684 9.76902 5.19468 9.76903H10.774C11.1402 9.76909 11.4979 9.65941 11.8011 9.45415C12.1044 9.24889 12.3391 8.95747 12.475 8.6175L14.275 4.11642C14.349 3.93121 14.3765 3.73069 14.3551 3.53239C14.3337 3.3341 14.2641 3.14406 14.1523 2.97889C14.0405 2.81372 13.8899 2.67845 13.7138 2.58491C13.5376 2.49136 13.3412 2.44238 13.1418 2.44226H2.98932L2.67061 1.32859C2.56135 0.946097 2.33054 0.60957 2.01308 0.369876C1.69562 0.130181 1.30875 0.00034725 0.910962 0H0.610564ZM4.60854 8.10463L3.33857 3.66339H13.1418L11.3406 8.16446C11.2953 8.27765 11.2171 8.37466 11.1161 8.44299C11.0151 8.51133 10.896 8.54787 10.774 8.5479H5.19468C5.0621 8.54767 4.9332 8.50429 4.82745 8.42432C4.72171 8.34435 4.64487 8.23213 4.60854 8.10463ZM5.49508 14.6535C5.73562 14.6535 5.97381 14.6062 6.19604 14.5141C6.41827 14.4221 6.62019 14.2871 6.79028 14.1171C6.96037 13.947 7.09529 13.745 7.18734 13.5228C7.27939 13.3006 7.32677 13.0624 7.32677 12.8218C7.32677 12.5813 7.27939 12.3431 7.18734 12.1209C7.09529 11.8987 6.96037 11.6967 6.79028 11.5266C6.62019 11.3566 6.41827 11.2216 6.19604 11.1296C5.97381 11.0375 5.73562 10.9902 5.49508 10.9902C5.00928 10.9902 4.54338 11.1831 4.19988 11.5266C3.85637 11.8702 3.66339 12.3361 3.66339 12.8218C3.66339 13.3076 3.85637 13.7735 4.19988 14.1171C4.54338 14.4606 5.00928 14.6535 5.49508 14.6535ZM5.49508 13.4324C5.33315 13.4324 5.17785 13.3681 5.06334 13.2536C4.94884 13.1391 4.88451 12.9838 4.88451 12.8218C4.88451 12.6599 4.94884 12.5046 5.06334 12.3901C5.17785 12.2756 5.33315 12.2113 5.49508 12.2113C5.65701 12.2113 5.81231 12.2756 5.92681 12.3901C6.04132 12.5046 6.10564 12.6599 6.10564 12.8218C6.10564 12.9838 6.04132 13.1391 5.92681 13.2536C5.81231 13.3681 5.65701 13.4324 5.49508 13.4324ZM10.3796 14.6535C10.6201 14.6535 10.8583 14.6062 11.0806 14.5141C11.3028 14.4221 11.5047 14.2871 11.6748 14.1171C11.8449 13.947 11.9798 13.745 12.0719 13.5228C12.1639 13.3006 12.2113 13.0624 12.2113 12.8218C12.2113 12.5813 12.1639 12.3431 12.0719 12.1209C11.9798 11.8987 11.8449 11.6967 11.6748 11.5266C11.5047 11.3566 11.3028 11.2216 11.0806 11.1296C10.8583 11.0375 10.6201 10.9902 10.3796 10.9902C9.8938 10.9902 9.4279 11.1831 9.08439 11.5266C8.74088 11.8702 8.5479 12.3361 8.5479 12.8218C8.5479 13.3076 8.74088 13.7735 9.08439 14.1171C9.4279 14.4606 9.8938 14.6535 10.3796 14.6535ZM10.3796 13.4324C10.2177 13.4324 10.0624 13.3681 9.94786 13.2536C9.83335 13.1391 9.76903 12.9838 9.76903 12.8218C9.76903 12.6599 9.83335 12.5046 9.94786 12.3901C10.0624 12.2756 10.2177 12.2113 10.3796 12.2113C10.5415 12.2113 10.6968 12.2756 10.8113 12.3901C10.9258 12.5046 10.9902 12.6599 10.9902 12.8218C10.9902 12.9838 10.9258 13.1391 10.8113 13.2536C10.6968 13.3681 10.5415 13.4324 10.3796 13.4324Z"
        fill="#034DA2"
      />
    </Svg>
  );
}

// Chevron/Arrow Icon for dropdown (14x14)
function ChevronDownIcon({ rotated = false }: { rotated?: boolean }) {
  return (
    <Svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="none"
      style={{ transform: [{ rotate: rotated ? '180deg' : '90deg' }] }}
    >
      <Path
        d="M6 3L10.5 8L6 13"
        stroke="#000000"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Arrow Forward Icon for quick links - EXACT from arrow-forward-vector.svg
function ArrowForwardIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 4.47552 7.81875" fill="none">
      <Path
        d="M0.15365 7.66563C0.357817 7.86979 0.686983 7.86979 0.89115 7.66563L4.35365 4.20313C4.51615 4.04063 4.51615 3.77813 4.35365 3.61563L0.89115 0.153125C0.686983 -0.0510417 0.357817 -0.0510417 0.15365 0.153125C-0.0505168 0.357292 -0.0505168 0.686458 0.15365 0.890625L3.17032 3.91146L0.149483 6.93229C-0.0505168 7.13229 -0.0505168 7.46563 0.15365 7.66563V7.66563Z"
        fill="#303030"
      />
    </Svg>
  );
}

// Chevron Right Icon for benefit cards (12x12)
function ChevronRightSmallIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 14 14" fill="none">
      <Path
        d="M5 2.5L9.5 7L5 11.5"
        stroke="#545454"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// User Icon for Policy Card (16x16)
function UserIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
        fill="#000000"
      />
    </Svg>
  );
}

// Wallet Illustration - EXACT from wallet-illustration.svg (simplified key paths)
function WalletIllustration() {
  return (
    <Svg width={80} height={60} viewBox="0 0 96.5121 55.3963" fill="none">
      <G clipPath="url(#clip0_0_103)">
        {/* Base shadow */}
        <Path d="M40.3594 55.3929C62.6493 55.3929 80.7188 54.2439 80.7188 52.8265C80.7188 51.4092 62.6493 50.2602 40.3594 50.2602C18.0695 50.2602 0 51.4092 0 52.8265C0 54.2439 18.0695 55.3929 40.3594 55.3929Z" fill="#2D5B93" />
        {/* Main wallet body */}
        <Path d="M59.8735 52.3605H7.98915V9.74543H58.9314C60.7414 9.74543 62.2103 11.2143 62.2103 13.0243V50.0238C62.2103 51.3137 61.1635 52.3605 59.8735 52.3605Z" fill="#D77637" />
        <Path d="M58.2766 9.74543H6.50697C5.15288 9.74543 4.05542 10.8429 4.05542 12.197C4.05542 13.5511 5.15288 14.6485 6.50697 14.6485H58.2732V9.74205L58.2766 9.74543Z" fill="#FF945F" />
        {/* Gold coins */}
        <Path d="M19.6698 20.0784C24.349 20.0784 28.1422 16.2852 28.1422 11.6061C28.1422 6.9269 24.349 3.13369 19.6698 3.13369C14.9907 3.13369 11.1975 6.9269 11.1975 11.6061C11.1975 16.2852 14.9907 20.0784 19.6698 20.0784Z" fill="#F7CE00" />
        <Path d="M35.9257 16.9447C40.6049 16.9447 44.3981 13.1515 44.3981 8.47238C44.3981 3.79322 40.6049 6.2701e-06 35.9257 6.2701e-06C31.2466 6.2701e-06 27.4534 3.79322 27.4534 8.47238C27.4534 13.1515 31.2466 16.9447 35.9257 16.9447Z" fill="#F7CE00" />
        {/* Document layers */}
        <Path d="M84.1903 5.99045H23.6039V37.6749H84.1903V5.99045Z" fill="#B5D6FF" />
        <Path d="M96.5118 14.8883H35.9254V46.5727H96.5118V14.8883Z" fill="#F4F9FF" />
      </G>
      <Defs>
        <ClipPath id="clip0_0_103">
          <Rect width="96.5121" height="55.3963" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

// Quick Link Icons - Blue outlines + Orange filled badges
function HealthRecordsIcon() {
  return (
    <Svg width={16} height={19} viewBox="0 0 16 19" fill="none">
      {/* Document outline - blue stroke */}
      <Path
        d="M1.5 2C1.5 1.44772 1.94772 1 2.5 1H10L14.5 5.5V17C14.5 17.5523 14.0523 18 13.5 18H2.5C1.94772 18 1.5 17.5523 1.5 17V2Z"
        stroke="#034DA2"
        strokeWidth="1.5"
      />
      {/* Document lines - blue stroke */}
      <Path
        d="M4 6H8M4 9H12M4 12H12M4 15H9"
        stroke="#034DA2"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Orange shield badge - filled */}
      <Circle cx="12" cy="13" r="3" fill="#F5821E" />
      <Path
        d="M10.5 13L11.5 14L13.5 12"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BookingsIcon() {
  return (
    <Svg width={18} height={17} viewBox="0 0 18 17" fill="none">
      {/* Calendar outline - blue stroke */}
      <Rect
        x="1.5"
        y="3.5"
        width="15"
        height="12"
        rx="1.5"
        stroke="#034DA2"
        strokeWidth="1.5"
      />
      <Path
        d="M5.5 1.5V5.5M12.5 1.5V5.5M1.5 7.5H16.5"
        stroke="#034DA2"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Orange checkmark - filled */}
      <Path
        d="M5 10.5L7.5 13L13 9.5"
        stroke="#F5821E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClaimsIcon() {
  return (
    <Svg width={16} height={19} viewBox="0 0 16 19" fill="none">
      {/* Clipboard outline - blue stroke */}
      <Path
        d="M3.5 3.5H2.5C1.67157 3.5 1 4.17157 1 5V16.5C1 17.3284 1.67157 18 2.5 18H13.5C14.3284 18 15 17.3284 15 16.5V5C15 4.17157 14.3284 3.5 13.5 3.5H12.5"
        stroke="#034DA2"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Rect
        x="4.5"
        y="1.5"
        width="7"
        height="3"
        rx="1"
        stroke="#034DA2"
        strokeWidth="1.5"
      />
      {/* Document lines - blue stroke */}
      <Path
        d="M4 8H12M4 11H12M4 14H9"
        stroke="#034DA2"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Orange alert badge - filled */}
      <Circle cx="12" cy="14" r="2.5" fill="#F5821E" />
      <Path
        d="M12 12.5V14M12 15.5V15.5"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function DownloadIcon() {
  return (
    <Svg width={23} height={18} viewBox="0 0 23 18" fill="none">
      {/* Document outline - blue stroke */}
      <Path
        d="M2.5 3.5C2.5 2.39543 3.39543 1.5 4.5 1.5H14L18.5 6V15.5C18.5 16.6046 17.6046 17.5 16.5 17.5H4.5C3.39543 17.5 2.5 16.6046 2.5 15.5V3.5Z"
        stroke="#034DA2"
        strokeWidth="1.5"
      />
      {/* Document lines - blue stroke */}
      <Path
        d="M6 6H10M6 9H14M6 12H14"
        stroke="#034DA2"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Orange shield badge - filled */}
      <Circle cx="17" cy="14" r="4" fill="#F5821E" />
      <Path
        d="M15 14L16.5 15.5L19 13"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TransactionsIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      {/* Clock circle - blue stroke */}
      <Circle
        cx="10"
        cy="10"
        r="8.5"
        stroke="#034DA2"
        strokeWidth="1.5"
      />
      {/* Clock hands - blue stroke */}
      <Path
        d="M10 5V10L13 13"
        stroke="#034DA2"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow indicator - blue stroke */}
      <Path
        d="M2 7L4 5L6 7"
        stroke="#034DA2"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Orange center dot - filled */}
      <Circle cx="10" cy="10" r="2" fill="#F5821E" />
    </Svg>
  );
}
// More Services Icons - EXACT from actual SVG files (simplified to key paths only)
function HelplineIcon() {
  return (
    <Svg width={24} height={23} viewBox="0 0 24 22.8966" fill="none">
      <G>
        <Path
          d="M5.73073 7.28204C5.5465 7.96071 5.50009 8.6694 5.59423 9.36629C5.59876 9.39673 5.61088 9.42553 5.62948 9.45004C5.00967 9.61121 4.46983 9.99274 4.11102 10.5232C3.75221 11.0537 3.59902 11.6967 3.68011 12.332C3.76121 12.9673 4.07104 13.5512 4.55161 13.9745C5.03219 14.3978 5.65056 14.6315 6.29098 14.6318H6.86798C6.94811 14.6318 7.02745 14.616 7.10147 14.5853C7.1755 14.5547 7.24276 14.5097 7.2994 14.453C7.35605 14.3964 7.40098 14.3291 7.43162 14.2551C7.46226 14.181 7.47801 14.1017 7.47798 14.0215V9.97279C7.47801 9.89266 7.46226 9.81332 7.43162 9.73928C7.40098 9.66524 7.35605 9.59797 7.2994 9.5413C7.24276 9.48462 7.1755 9.43967 7.10147 9.409C7.02745 9.37833 6.94811 9.36254 6.86798 9.36254H6.29098C6.18078 9.36336 6.07073 9.37104 5.96148 9.38554C5.96697 9.36442 5.96858 9.34249 5.96623 9.32079C5.88203 8.68213 5.92218 8.0332 6.08448 7.40979C6.17835 7.42961 6.27404 7.43958 6.36998 7.43954C6.68985 7.43893 7.00004 7.32979 7.24982 7.12997C7.4996 6.93015 7.67417 6.65148 7.74498 6.33954C7.78928 6.12864 7.84945 5.92138 7.92498 5.71954C8.23832 4.86794 8.80543 4.13299 9.54973 3.61393C10.294 3.09487 11.1797 2.8167 12.0871 2.81697C12.9945 2.81724 13.88 3.09595 14.624 3.61546C15.368 4.13496 15.9347 4.87025 16.2475 5.72204C16.3234 5.92291 16.3835 6.12936 16.4275 6.33954C16.4969 6.65221 16.6711 6.93176 16.9211 7.13183C17.1712 7.33191 17.4822 7.44048 17.8025 7.43954C17.8977 7.43921 17.9926 7.42908 18.0857 7.40929C18.2483 8.03283 18.2885 8.68195 18.2042 9.32079C18.2009 9.35239 18.206 9.38429 18.219 9.41329C18.0512 9.38 17.8805 9.36325 17.7095 9.36329H17.0772C17.0044 9.36326 16.9322 9.37759 16.8649 9.40545C16.7976 9.43332 16.7364 9.47418 16.6849 9.5257C16.6334 9.57722 16.5925 9.63839 16.5646 9.70571C16.5368 9.77303 16.5224 9.84518 16.5225 9.91804V14.077C16.5225 14.2242 16.5809 14.3653 16.685 14.4693C16.789 14.5733 16.9301 14.6318 17.0772 14.6318H17.7095C17.8894 14.6317 18.0688 14.6133 18.245 14.5768V15.5888C18.2448 15.7969 18.162 15.9965 18.0148 16.1437C17.8677 16.2908 17.6681 16.3736 17.46 16.3738H13.1462C13.1099 16.1431 12.9924 15.933 12.815 15.7812C12.6375 15.6293 12.4118 15.5458 12.1782 15.5455H11.017C10.7561 15.5455 10.5059 15.6492 10.3214 15.8337C10.1369 16.0182 10.0332 16.2684 10.0332 16.5293C10.0332 16.7902 10.1369 17.0404 10.3214 17.2249C10.5059 17.4094 10.7561 17.513 11.017 17.513H12.1782C12.4009 17.5131 12.617 17.4373 12.791 17.2982C12.965 17.1592 13.0865 16.965 13.1355 16.7478H17.4605C17.768 16.7475 18.0629 16.6251 18.2804 16.4077C18.4978 16.1902 18.6201 15.8953 18.6205 15.5878V14.5298C18.6197 14.5096 18.6157 14.4897 18.6085 14.4708C19.1244 14.2825 19.5687 13.9377 19.879 13.4845C20.1893 13.0313 20.3502 12.4924 20.3392 11.9433C20.3281 11.3942 20.1458 10.8622 19.8175 10.4218C19.4893 9.98148 19.0316 9.65473 18.5085 9.48729C18.5459 9.45723 18.5701 9.41387 18.5762 9.36629C18.6703 8.66956 18.6239 7.96105 18.4397 7.28254C18.6125 7.19364 18.765 7.06987 18.8875 6.91904C19.0235 6.74984 19.1199 6.55233 19.1697 6.34101C19.2194 6.12969 19.2212 5.90991 19.175 5.69779L19.1675 5.66279C19.1625 5.64279 19.1575 5.62529 19.1525 5.60529C19.1523 5.59721 19.1497 5.58937 19.145 5.58279C18.768 3.99144 17.8644 2.57414 16.5808 1.56076C15.2973 0.547393 13.709 -0.00259583 12.0736 9.21171e-06C10.4382 0.00261426 8.85164 0.557661 7.57129 1.57512C6.29094 2.59257 5.39189 4.01275 5.01998 5.60529C5.01498 5.62529 5.00998 5.64279 5.00498 5.66279L4.99498 5.70779C4.97442 5.80987 4.96354 5.91367 4.96248 6.01779C4.96255 6.27865 5.03423 6.53449 5.16969 6.75742C5.30516 6.98035 5.49922 7.16182 5.73073 7.28204Z"
          fill="#034DA2"
        />
        <Path
          d="M15.7286 5.46654H8.44107C8.38031 5.58858 8.32607 5.71376 8.27857 5.84154H15.8911C15.8436 5.71404 15.7886 5.58904 15.7286 5.46654Z"
          fill="#F5821E"
        />
        <Path
          d="M23.3 19.2265H22.5485V7.65654C22.5478 7.07592 22.3169 6.51927 21.9063 6.10871C21.4958 5.69815 20.9391 5.46721 20.3585 5.46654H19.5185L19.521 5.46904L19.5235 5.54404L19.541 5.61904C19.556 5.69404 19.5685 5.76654 19.576 5.84154H20.3585C20.8396 5.84234 21.3008 6.03381 21.641 6.37402C21.9812 6.71423 22.1727 7.17542 22.1735 7.65654V19.2265H15.045H15.0387C14.979 19.2267 14.9193 19.2306 14.86 19.2383C14.852 19.2383 14.8445 19.2418 14.8365 19.243C14.6087 19.2739 14.3927 19.3628 14.2093 19.5013C14.203 19.5058 14.196 19.5095 14.1895 19.5143C14.1762 19.5245 14.1645 19.5365 14.1517 19.5468C14.0213 19.6521 13.9106 19.7799 13.825 19.924C13.7796 20.002 13.724 20.0736 13.6597 20.137C13.502 20.292 13.299 20.3928 13.0802 20.425C13.0765 20.425 13.0728 20.4268 13.069 20.4273C13.0241 20.4334 12.9788 20.4365 12.9335 20.4365H10.556C10.511 20.4365 10.4661 20.4336 10.4215 20.4278H10.42C10.3978 20.425 10.3762 20.4193 10.3542 20.415C10.2566 20.3958 10.1623 20.3627 10.074 20.3168C10.0625 20.3105 10.049 20.3058 10.0385 20.2993C9.9994 20.2768 9.96182 20.2517 9.926 20.2243C9.92375 20.2228 9.922 20.2205 9.91975 20.219C9.81531 20.1383 9.72745 20.0381 9.661 19.924C9.61463 19.8467 9.5607 19.774 9.5 19.7073C9.31244 19.4938 9.06481 19.3418 8.7895 19.2713C8.6765 19.2419 8.56025 19.2269 8.4435 19.2265H1.831V7.65154C1.83133 7.1716 2.02213 6.71142 2.3615 6.37205C2.70087 6.03268 3.16106 5.84188 3.641 5.84154H4.5985C4.6035 5.77654 4.6135 5.70904 4.626 5.63654L4.6385 5.58154L4.651 5.53654C4.65565 5.51293 4.66149 5.48957 4.6685 5.46654H3.641C3.06168 5.46714 2.50627 5.69754 2.09663 6.10717C1.68699 6.51681 1.4566 7.07223 1.456 7.65154V19.2265H0.7025C0.610365 19.2262 0.519071 19.2441 0.433854 19.2791C0.348637 19.3141 0.271174 19.3656 0.205908 19.4307C0.140642 19.4957 0.088857 19.573 0.0535225 19.6581C0.0181879 19.7432 -5.8759e-07 19.8344 0 19.9265C0 21.7865 1.3925 22.8965 3.7225 22.8965H20.28C22.61 22.8965 24 21.7865 24 19.9265C24 19.8346 23.9819 19.7436 23.9467 19.6587C23.9115 19.5737 23.86 19.4966 23.795 19.4316C23.73 19.3666 23.6528 19.315 23.5679 19.2798C23.483 19.2447 23.3919 19.2265 23.3 19.2265ZM3.0875 21.5165C2.97451 21.5168 2.86398 21.4835 2.7699 21.4209C2.67581 21.3584 2.6024 21.2693 2.55894 21.165C2.51548 21.0607 2.50393 20.9458 2.52575 20.835C2.54757 20.7241 2.60178 20.6222 2.68152 20.5422C2.76126 20.4621 2.86295 20.4075 2.97373 20.3852C3.08451 20.363 3.1994 20.3741 3.30388 20.4171C3.40835 20.4602 3.49771 20.5332 3.56065 20.6271C3.6236 20.7209 3.6573 20.8313 3.6575 20.9443C3.65763 21.0957 3.59769 21.241 3.49083 21.3483C3.38397 21.4556 3.23892 21.5161 3.0875 21.5165ZM5.4505 21.5165C5.33751 21.5168 5.22698 21.4835 5.13289 21.4209C5.03881 21.3584 4.9654 21.2693 4.92194 21.165C4.87848 21.0607 4.86693 20.9458 4.88875 20.835C4.91057 20.7241 4.96478 20.6222 5.04452 20.5422C5.12426 20.4621 5.22595 20.4075 5.33673 20.3852C5.44751 20.363 5.5624 20.3741 5.66688 20.4171C5.77135 20.4602 5.86071 20.5332 5.92365 20.6271C5.9866 20.7209 6.0203 20.8313 6.0205 20.9443C6.02063 21.0958 5.96063 21.2412 5.85366 21.3485C5.74669 21.4558 5.60151 21.5162 5.45 21.5165H5.4505Z"
          fill="#F5821E"
        />
      </G>
    </Svg>
  );
}

function ClaimsServiceIcon() {
  return (
    <Svg width={19} height={23} viewBox="0 0 19.0718 22.7496" fill="none">
      <G>
        <Path
          d="M2.79065 8.62591H11.6478C11.8564 8.62591 12.027 8.45528 12.027 8.24675C12.027 8.03821 11.8564 7.86759 11.6478 7.86759H2.79065C2.58212 7.86759 2.41149 8.03821 2.41149 8.24675C2.41149 8.45528 2.58212 8.62591 2.79065 8.62591Z"
          fill="#F5821E"
        />
        <Path
          d="M2.79065 10.9691H11.6478C11.8564 10.9691 12.027 10.7985 12.027 10.59C12.027 10.3814 11.8564 10.2108 11.6478 10.2108H2.79065C2.58212 10.2108 2.41149 10.3814 2.41149 10.59C2.41149 10.7985 2.58212 10.9691 2.79065 10.9691Z"
          fill="#F5821E"
        />
        <Path
          d="M9.26293 12.9332C9.26293 12.7246 9.0923 12.554 8.88376 12.554H2.79065C2.58212 12.554 2.41149 12.7246 2.41149 12.9332C2.41149 13.1417 2.58212 13.3123 2.79065 13.3123H8.88376C9.0923 13.3123 9.26293 13.1417 9.26293 12.9332Z"
          fill="#F5821E"
        />
        <Path
          d="M6.88559 14.8972H2.79065C2.58212 14.8972 2.41149 15.0678 2.41149 15.2764C2.41149 15.4849 2.58212 15.6555 2.79065 15.6555H6.88559C7.09413 15.6555 7.26475 15.4849 7.26475 15.2764C7.26475 15.0678 7.09413 14.8972 6.88559 14.8972Z"
          fill="#F5821E"
        />
        <Path
          d="M6.88559 6.06654H2.79065C2.58212 6.06654 2.41149 6.23716 2.41149 6.4457C2.41149 6.65424 2.58212 6.82486 2.79065 6.82486H6.88559C7.09413 6.82486 7.26475 6.65424 7.26475 6.4457C7.26475 6.23716 7.09413 6.06654 6.88559 6.06654Z"
          fill="#F5821E"
        />
        <Path
          d="M6.88559 4.17076H2.79065C2.58212 4.17076 2.41149 4.34138 2.41149 4.54992C2.41149 4.75846 2.58212 4.92908 2.79065 4.92908H6.88559C7.09413 4.92908 7.26475 4.75846 7.26475 4.54992C7.26475 4.34138 7.09413 4.17076 6.88559 4.17076Z"
          fill="#F5821E"
        />
        <Path
          d="M14.4422 12.7133V5.37271C14.4422 5.27412 14.4043 5.17933 14.3323 5.10729L9.38422 0.113748C9.31218 0.0417076 9.2136 0 9.11502 0H0.379161C0.166831 0 0 0.170622 0 0.379161V17.7258C0 17.9343 0.166831 18.1049 0.379161 18.1049H9.06952C9.26289 20.6984 11.4317 22.7496 14.0631 22.7496C16.8271 22.7496 19.0718 20.4936 19.0718 17.7258C19.0718 15.083 17.0281 12.9066 14.4422 12.7133ZM15.9665 16.975L13.9228 19.0111C13.8469 19.0832 13.7522 19.1211 13.6536 19.1211C13.5588 19.1211 13.4602 19.0832 13.3882 19.0111L12.1597 17.7902C12.0118 17.6423 12.0118 17.4035 12.1597 17.2518C12.3076 17.1039 12.5464 17.1039 12.6943 17.2518L13.6536 18.2073L15.4318 16.4366C15.5797 16.2887 15.8186 16.2887 15.9665 16.4366C16.1143 16.5883 16.1143 16.8271 15.9665 16.975ZM0.758321 0.758321H8.73586V5.37271C8.73586 5.58124 8.90269 5.75187 9.11502 5.75187H13.6839V12.7133C11.2232 12.899 9.25531 14.8745 9.06952 17.3466H0.758321V0.758321Z"
          fill="#034DA2"
        />
      </G>
    </Svg>
  );
}

function HealthRecordsServiceIcon() {
  return (
    <Svg width={24} height={27} viewBox="0 0 24 27.3319" fill="none">
      <G>
        <Path
          d="M2.81859 6.8551C2.64863 6.85864 2.51053 6.99673 2.51408 7.16669L2.52116 7.71553C2.5247 7.88549 2.66279 8.02004 2.82921 8.02004H2.83275C3.00271 8.0165 3.14081 7.87841 3.13727 7.70845L3.13018 7.15961C3.13018 6.98965 2.98855 6.85156 2.81859 6.8551ZM0.30458 15.1761C0.134619 15.1797 -0.00347425 15.3177 6.66072e-05 15.4877L0.00714821 16.0365C0.0106891 16.2065 0.148782 16.3411 0.315203 16.3411H0.318744C0.488705 16.3375 0.626798 16.1994 0.623257 16.0295L0.616176 15.4806C0.616176 15.3107 0.474541 15.1726 0.30458 15.1761ZM2.81859 21.5532C2.64863 21.5567 2.51053 21.6948 2.51408 21.8648L2.52116 22.4136C2.5247 22.5836 2.66279 22.7181 2.82921 22.7181H2.83275C3.00271 22.7146 3.14081 22.5765 3.13727 22.4065L3.13018 21.8577C3.13018 21.6878 2.98855 21.5497 2.81859 21.5532ZM3.13373 19.2835C3.13373 19.1136 2.99563 18.9755 2.82567 18.9755H2.42909V18.5789C2.42909 18.4089 2.291 18.2708 2.12104 18.2708C1.95108 18.2708 1.81299 18.4089 1.81299 18.5789V18.9755H1.41641C1.24645 18.9755 1.10835 19.1136 1.10835 19.2835C1.10835 19.4535 1.24645 19.5916 1.41641 19.5916H1.81299V19.9881C1.81299 20.1581 1.95108 20.2962 2.12104 20.2962C2.291 20.2962 2.42909 20.1581 2.42909 19.9881V19.5916H2.82567C2.99563 19.5916 3.13373 19.4535 3.13373 19.2835ZM20.707 2.43611C20.5335 2.43965 20.3954 2.57774 20.3989 2.74771L20.406 3.29654C20.4096 3.4665 20.5477 3.60105 20.7141 3.60105H20.7176C20.8876 3.59751 21.0257 3.45942 21.0221 3.28946L21.0151 2.74062C21.0151 2.57066 20.877 2.43611 20.707 2.43611ZM20.707 19.4004C20.5335 19.4039 20.3954 19.542 20.3989 19.712L20.406 20.2608C20.4096 20.4307 20.5477 20.5653 20.7141 20.5653H20.7176C20.8876 20.5618 21.0257 20.4237 21.0221 20.2537L21.0151 19.7049C21.0151 19.5385 20.877 19.4004 20.707 19.4004ZM21.8861 8.38475C21.7126 8.38829 21.5745 8.52638 21.5781 8.69635L21.5851 9.24518C21.5887 9.41514 21.7268 9.54969 21.8932 9.54969H21.8967C22.0667 9.54615 22.2048 9.40806 22.2012 9.2381L22.1942 8.68926C22.1906 8.52284 22.0525 8.38475 21.8861 8.38475ZM23.6919 4.95366H23.1431V4.40483C23.1431 4.23487 23.005 4.09677 22.8351 4.09677C22.6651 4.09677 22.527 4.23487 22.527 4.40483V4.95366H21.9782C21.8082 4.95366 21.6701 5.09175 21.6701 5.26171C21.6701 5.43168 21.8082 5.56977 21.9782 5.56977H22.527V6.12214C22.527 6.2921 22.6651 6.4302 22.8351 6.4302C23.005 6.4302 23.1431 6.2921 23.1431 6.12214V5.57331H23.6919C23.8619 5.57331 24 5.43522 24 5.26525C24 5.09175 23.8619 4.95366 23.6919 4.95366ZM17.1626 0H6.37361C5.25116 0 4.34116 0.913541 4.34116 2.03245V25.2994C4.34116 26.4219 5.2547 27.3319 6.37361 27.3319H17.1626C18.2851 27.3319 19.1951 26.4183 19.1951 25.2994V2.03245C19.1951 0.91 18.2851 0 17.1626 0ZM10.4279 1.92623H13.1083C13.2783 1.92623 13.4164 2.06432 13.4164 2.23428C13.4164 2.40424 13.2783 2.54234 13.1083 2.54234H10.4279C10.2579 2.54234 10.1198 2.4007 10.1198 2.23428C10.1198 2.06432 10.2579 1.92623 10.4279 1.92623ZM12.0425 25.3915H11.4937C11.3237 25.3915 11.1856 25.2534 11.1856 25.0834C11.1856 24.9135 11.3237 24.7754 11.4937 24.7754H12.0425C12.216 24.7754 12.3541 24.9135 12.3506 25.0834C12.3506 25.2534 12.2125 25.3915 12.0425 25.3915ZM18.5754 22.8916H4.96081V4.41899H18.5754V22.8916Z"
          fill="#034DA2"
        />
        <G>
          <Path
            d="M12.68 12.8675C12.68 13.0375 12.5419 13.1756 12.3719 13.1756C12.202 13.1756 12.0639 13.0375 12.0639 12.864V6.54707C12.0639 6.37711 12.202 6.23901 12.3719 6.23901C12.5419 6.23901 12.68 6.37711 12.68 6.54707V12.8675Z"
            fill="#F5821E"
          />
          <Path
            d="M9.52862 20.1865C9.52862 20.7317 9.08247 21.1779 8.53718 21.1779C7.99189 21.1779 7.54574 20.7317 7.54574 20.1865C7.54574 19.6412 7.99189 19.195 8.53718 19.195C9.08247 19.195 9.52862 19.6412 9.52862 20.1865Z"
            fill="#F5821E"
          />
        </G>
      </G>
    </Svg>
  );
}

function TransactionHistoryIcon() {
  return (
    <Svg width={29} height={20} viewBox="0 0 29.5 19.5396" fill="none">
      <G>
        <Path
          d="M14.9583 7.44105C16.266 7.44105 17.3251 8.50138 17.3251 9.80786C17.3251 11.1155 16.266 12.1747 14.9583 12.1747C13.6506 12.1747 12.5915 11.1155 12.5915 9.80786C12.5915 8.50138 13.6506 7.44105 14.9583 7.44105Z"
          fill="#034DA2"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M21.7473 6.02115C22.0325 6.82825 22.6716 7.46726 23.4786 7.75246V11.8635C22.6715 12.1487 22.0325 12.7878 21.7473 13.5948H8.16905C7.88385 12.7877 7.24481 12.1487 6.43775 11.8635V7.75246C7.24484 7.46726 7.88385 6.82822 8.16905 6.02115H21.7473ZM14.9582 6.49452C13.1286 6.49452 11.6445 7.97849 11.6445 9.8082C11.6445 11.6379 13.1285 13.1219 14.9582 13.1219C16.7879 13.1219 18.2719 11.6379 18.2719 9.8082C18.2719 7.97849 16.7879 6.49452 14.9582 6.49452ZM8.33113 9.33468C8.0696 9.33468 7.85777 9.54651 7.85777 9.80804C7.85777 10.0696 8.0696 10.2814 8.33113 10.2814H10.2246C10.4861 10.2814 10.6979 10.0696 10.6979 9.80804C10.6979 9.54651 10.4861 9.33468 10.2246 9.33468H8.33113ZM19.6918 9.33468C19.4303 9.33468 19.2184 9.54651 19.2184 9.80804C19.2184 10.0696 19.4303 10.2814 19.6918 10.2814H21.5852C21.8468 10.2814 22.0586 10.0696 22.0586 9.80804C22.0586 9.54651 21.8468 9.33468 21.5852 9.33468H19.6918Z"
          fill="#F5821E"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M25.3722 3.18098C25.8953 3.18098 26.3189 3.60462 26.3189 4.1277V15.4884C26.3189 16.0114 25.8953 16.4351 25.3722 16.4351H4.54429C4.02122 16.4351 3.59757 16.0114 3.59757 15.4884V4.1277C3.59757 3.878 3.69461 3.65079 3.85319 3.48157C3.85555 3.4792 3.85674 3.47683 3.8591 3.47565C3.9088 3.42358 3.96443 3.37624 4.02478 3.33719C4.02715 3.33601 4.02951 3.33364 4.0307 3.33246C4.05792 3.31589 4.08513 3.29932 4.11354 3.28512C4.12182 3.28157 4.12892 3.27802 4.13602 3.27447C4.16087 3.26264 4.18572 3.25199 4.21176 3.24252C4.22004 3.23897 4.22833 3.2366 4.23543 3.23305C4.26146 3.22477 4.2875 3.21767 4.31353 3.21057C4.323 3.2082 4.33247 3.20465 4.34193 3.20228C4.40702 3.18927 4.47447 3.18098 4.5443 3.18098L25.3722 3.18098ZM7.38446 5.07442C7.38446 6.12054 6.53714 6.96787 5.49102 6.96787V12.6482C6.53714 12.6482 7.38446 13.4955 7.38446 14.5416H22.532C22.532 13.4955 23.3793 12.6482 24.4255 12.6482V6.96787C23.3793 6.96787 22.532 6.12054 22.532 5.07442H7.38446Z"
          fill="#034DA2"
        />
      </G>
    </Svg>
  );
}

// ============================================================================
// DATA CONSTANTS
// ============================================================================

const QUICK_LINKS = [
  { id: 'health-records', label: 'Health Records', icon: HealthRecordsIcon, href: '/member/health-records' },
  { id: 'bookings', label: 'My Bookings', icon: BookingsIcon, href: '/member/bookings' },
  { id: 'claims', label: 'Claims', icon: ClaimsIcon, href: '/member/claims' },
  { id: 'download-policy', label: 'Download Policy', icon: DownloadIcon, href: '#' },
  { id: 'transactions', label: 'Transaction History', icon: TransactionsIcon, href: '/member/transactions' },
];

const MORE_SERVICES = [
  { id: 'helpline', label: '24/7 Helpline', labelHighlight: '24/7', icon: HelplineIcon, href: '/member/helpline' },
  { id: 'claims', label: 'Claims', icon: ClaimsServiceIcon, href: '/member/claims' },
  { id: 'health-records', label: 'Health Records', labelHighlight: 'Health', icon: HealthRecordsServiceIcon, href: '/member/health-records' },
  { id: 'transactions', label: 'Transaction History', labelHighlight: 'Transaction', icon: TransactionHistoryIcon, href: '/member/transactions' },
];

// Mock health benefits (from API in production)
const HEALTH_BENEFITS = [
  { id: 'CAT001', name: 'Doctor Consult', available: 15000, total: 20000, href: '/member/appointments' },
  { id: 'CAT005', name: 'Online Consult', available: 5000, total: 8000, href: '/member/online-consult' },
  { id: 'CAT004', name: 'Lab Tests', available: 8000, total: 10000, href: '/member/lab-tests' },
  { id: 'CAT003', name: 'Diagnostics', available: 12000, total: 15000, href: '/member/diagnostics' },
  { id: 'CAT006', name: 'Dental', available: 7000, total: 10000, href: '/member/dental' },
  { id: 'CAT007', name: 'Vision', available: 4000, total: 5000, href: '/member/vision' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile, logout, refreshProfile } = useAuth();
  const { familyMembers, activeMember, viewingUserId, loggedInUser, profileData } = useFamily();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activePolicyIndex, setActivePolicyIndex] = useState(0);
  const policyScrollRef = useRef<ScrollView>(null);

  // Fetch profile on mount
  useEffect(() => {
    if (!profile) {
      refreshProfile();
    }
  }, []);

  // User data
  const firstName = profile?.name?.firstName || user?.name?.firstName || user?.fullName?.split(' ')[0] || 'Member';
  const lastName = profile?.name?.lastName || user?.name?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || ''}${lastName[0] || 'M'}`.toUpperCase();

  // Wallet data
  const totalBalance = profile?.wallet?.totalBalance?.current || 50000;
  const allocatedBalance = profile?.wallet?.totalBalance?.allocated || 100000;

  // Categories from profile or mock data
  const walletCategories = profile?.walletCategories || HEALTH_BENEFITS;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    router.replace('/login');
  };

  // Helper function to convert category name to route path
  const getCategoryRoute = (categoryName: string) => {
    if (!categoryName) return '/member/benefits';

    // Map specific category names to their routes
    const routeMapping: { [key: string]: string } = {
      'dental services': '/member/dental',
      'dental': '/member/dental',
      'vision care': '/member/vision',
      'laboratory services': '/member/lab-tests',
      'diagnostic services': '/member/diagnostics',
    };

    const lowerName = categoryName.toLowerCase();
    if (routeMapping[lowerName]) {
      return routeMapping[lowerName];
    }

    // Default: Convert category name to kebab-case route
    const route = lowerName
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    return `/member/${route}`;
  };

  const handleNavigation = (href: string) => {
    if (href && href !== '#') {
      router.push(href as any);
    }
  };

  // Handle policy scroll for pagination
  const handlePolicyScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const cardWidth = Math.min(width - 60, 280) + 16; // card width + margin
    const index = Math.round(scrollPosition / cardWidth);
    setActivePolicyIndex(index);
  };

  // Prepare policies from real data (similar to Next.js implementation)
  const preparePolicies = () => {
    // Use profileData from FamilyContext if available, fallback to profile from AuthContext
    const userData = profileData || profile;

    if (!userData || !userData.assignments) {
      // Return empty array if no data available
      return [];
    }

    // Get all members (user + dependents)
    const members = [userData.user || userData, ...(userData.dependents || [])];

    const allPolicies = members.map((member: any) => {
      const memberId = member?._id || member?.id;

      // Find policy assignment for this member
      const userIdStr = memberId?.toString();
      const assignment = userData.assignments.find((a: any) => {
        const assignmentUserIdStr = a.userId?.toString();
        return assignmentUserIdStr === userIdStr;
      });
      const policy = assignment?.assignment || null;

      return {
        policyId: policy?.policyId?._id || policy?.policyId?.id || memberId,
        policyNumber: policy?.policyId?.policyNumber || 'N/A',
        policyHolder: `${member?.name?.firstName || ''} ${member?.name?.lastName || ''}`.trim(),
        policyHolderId: memberId,
        corporate: policy?.policyId?.companyName || policy?.policyId?.company || 'Individual',
        expiryDate: policy?.effectiveTo || policy?.policyId?.effectiveTo || new Date().toISOString(),
      };
    });

    // Filter policies based on active member
    // Primary member sees all policies, dependents only see their own
    const isPrimaryMember = viewingUserId === (userData.user?._id || userData._id);

    if (isPrimaryMember) {
      // Primary member sees all policies
      return allPolicies;
    } else {
      // Dependent sees only their own policy
      return allPolicies.filter(policy => policy.policyHolderId === viewingUserId);
    }
  };

  const policies = preparePolicies();

  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================

  // User Greeting Section
  const renderUserGreeting = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#f7f7fc' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: Avatar + Greeting */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          {/* Avatar Circle with Gradient */}
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0E51A2', '#1F77E0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>{initials}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Greeting Text */}
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.7}
            style={{ gap: 2 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#000000' }}>
                Hi {firstName}!
              </Text>
              <ChevronDownIcon rotated={showDropdown} />
            </View>
            <Text style={{ fontSize: 12, color: '#656565' }}>
              welcome to OPD Wallet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right: Icons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <TouchableOpacity
            style={{
              width: 35,
              height: 35,
              borderRadius: 17.5,
              backgroundColor: '#fbfdfe',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <NotificationBellIcon />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleNavigation('/member/wallet')}
            style={{
              width: 35,
              height: 35,
              borderRadius: 17.5,
              backgroundColor: '#fbfdfe',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <WalletIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: 35,
              height: 35,
              borderRadius: 17.5,
              backgroundColor: '#fbfdfe',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <CartIcon />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Policy Card - Figma exact design
  // Calculate policy card width dynamically
  const policyCardWidth = Math.min(width - 60, 280);

  const renderPolicyCard = (policy: any) => (
    <TouchableOpacity
      key={policy.policyId}
      activeOpacity={0.9}
      onPress={() => handleNavigation(`/member/policy-details/${policy.policyId}`)}
      style={{
        width: policyCardWidth,
        minWidth: 220,
        minHeight: 137,
        borderRadius: 16,
        padding: 13,
        marginRight: 16,
      }}
    >
      <LinearGradient
        colors={['#CDDDFE', '#E4EBFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(164, 191, 254, 0.48)',
        }}
      />

      {/* User Info at Top */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, zIndex: 1 }}>
        <UserIcon />
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#000000' }}>
          {policy.policyHolder}
        </Text>
      </View>

      {/* Divider Line */}
      <View style={{ height: 1, backgroundColor: 'rgba(164, 191, 254, 0.6)', marginBottom: 12 }} />

      {/* Policy Details */}
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: '#3b3b3b' }}>Policy Number</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b3b3b' }}>{policy.policyNumber}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: '#3b3b3b' }}>Valid Till</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b3b3b' }}>{formatDate(policy.expiryDate)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: '#3b3b3b' }}>Corporate</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b3b3b' }}>{policy.corporate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Quick Link Item - Figma exact design
  const renderQuickLink = (link: any) => {
    const IconComponent = link.icon;
    return (
      <TouchableOpacity
        key={link.id}
        onPress={() => handleNavigation(link.href)}
        activeOpacity={0.8}
        style={{ marginRight: 8 }}
      >
        <LinearGradient
          colors={['#ffffff', '#f3f4f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 36,
            paddingHorizontal: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(3, 77, 162, 0.11)',
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 11 },
            shadowOpacity: 0.05,
            shadowRadius: 23,
            elevation: 2,
          }}
        >
          <IconComponent />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 16, color: '#383838' }}>{link.label}</Text>
            <ArrowForwardIcon />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Wallet Balance Card - Figma exact design
  const renderWalletBalance = () => (
    <View style={{ paddingHorizontal: 20 }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleNavigation('/member/transactions')}
      >
        <LinearGradient
          colors={['#5CA3FA', '#2266B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            minHeight: 95,
            borderRadius: 16,
            padding: 12,
            paddingRight: 100,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Title */}
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#FFFFFF' }}>
            Total Available Balance
          </Text>

          {/* Balance Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
              {formatCurrency(totalBalance)}
            </Text>
            <Text style={{ fontSize: 11, color: '#B1D2FC', marginLeft: 2 }}>Left</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.63)' }}>/</Text>
            <Text style={{ fontSize: 12, color: '#FFFFFF' }}>{formatCurrency(allocatedBalance)}</Text>
          </View>

          {/* Subtitle */}
          <Text style={{ fontSize: 10, color: '#B1D2FC', marginTop: 6 }}>
            Your total usage cannot exceed this amount
          </Text>

          {/* Wallet Illustration */}
          <View style={{ position: 'absolute', right: 10, top: '50%', transform: [{ translateY: -32.5 }] }}>
            <WalletIllustration />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Benefit Card - Figma exact design
  // Calculate card width dynamically based on screen width
  // Using reactive width from useWindowDimensions for all screen sizes
  const benefitCardWidth = (width - 48) / 2; // 16px padding on each side + 16px gap = 48

  const renderBenefitCard = (benefit: any) => (
    <TouchableOpacity
      key={benefit.id}
      onPress={() => handleNavigation(benefit.href)}
      activeOpacity={0.9}
      style={{
        width: benefitCardWidth,
        minHeight: 78,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 9,
        paddingBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(217, 217, 217, 0.48)',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 11 },
        shadowOpacity: 0.08,
        shadowRadius: 23,
        elevation: 3,
        justifyContent: 'space-between',
      }}
    >
      {/* Benefit Name */}
      <Text style={{ fontSize: 14, color: '#034da2' }}>{benefit.name}</Text>

      {/* Balance Info Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#0a3f93' }}>
            ₹{formatCurrency(benefit.available)}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.4)', marginLeft: 4 }}>Left</Text>
          <Text style={{ fontSize: 14, color: '#444444' }}>/</Text>
          <Text style={{ fontSize: 11, color: '#444444' }}>{formatShortCurrency(benefit.total)}</Text>
        </View>

        {/* Arrow Button */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#f6f6f6',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRightSmallIcon />
        </View>
      </View>
    </TouchableOpacity>
  );

  // More Service Item - Figma exact design
  const renderMoreServiceItem = (service: any) => {
    const IconComponent = service.icon;
    return (
      <TouchableOpacity
        key={service.id}
        onPress={() => handleNavigation(service.href)}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          height: 50,
          paddingHorizontal: 16,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(217, 217, 217, 0.48)',
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
          marginRight: 10,
        }}
      >
        <IconComponent />
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#000000' }}>{service.label}</Text>
      </TouchableOpacity>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // Web-specific wrapper to avoid SafeAreaView issues
  const ContainerComponent = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle = Platform.OS === 'web'
    ? { flex: 1, backgroundColor: '#f7f7fc', paddingTop: 0 }
    : { flex: 1, backgroundColor: '#f7f7fc' };

  return (
    <ContainerComponent style={containerStyle}>
      <ScrollView
        key={`dashboard-${viewingUserId || user?.id || 'default'}`}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#034DA2" />
        }
        scrollEnabled={!showDropdown}
        nestedScrollEnabled={true}
      >
        {/* User Greeting */}
        {renderUserGreeting()}

        {/* Policy Carousel */}
        <View style={{ paddingTop: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '500', color: '#1c1c1c', marginBottom: 12, paddingHorizontal: 20 }}>
            Your Policies
          </Text>
          <ScrollView
            ref={policyScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            onScroll={handlePolicyScroll}
            scrollEventThrottle={16}
            pagingEnabled={false}
            snapToInterval={policyCardWidth + 16}
            decelerationRate="fast"
          >
            {policies.map(renderPolicyCard)}
          </ScrollView>

          {/* Pagination Dots */}
          {policies.length > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              {policies.map((_, index) => (
                <View
                  key={index}
                  style={{
                    height: 4,
                    width: index === activePolicyIndex ? 14 : 4,
                    borderRadius: 2,
                    backgroundColor: index === activePolicyIndex ? '#1E3A8C' : '#cbd5e1',
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Quick Links */}
        <View style={{ paddingTop: 8, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '500', color: '#1c1c1c', marginBottom: 8 }}>
            Quick Links
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {QUICK_LINKS.map(renderQuickLink)}
          </ScrollView>
        </View>

        {/* Wallet Balance Card */}
        <View style={{ paddingTop: 16 }}>
          {renderWalletBalance()}
        </View>

        {/* Health Benefits */}
        <View style={{ paddingTop: 24, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '500', color: '#1c1c1c', marginBottom: 16 }}>
            Health Benefits
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {walletCategories.map((benefit: any) => renderBenefitCard({
              id: benefit.id || benefit.categoryCode,
              name: benefit.name,
              available: benefit.available ?? benefit.amount ?? 0,
              total: benefit.total ?? 0,
              href: benefit.href || getCategoryRoute(benefit.name),
            }))}
          </View>
        </View>

        {/* More Services */}
        <View style={{ paddingTop: 16, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '500', color: '#1c1c1c', marginBottom: 12 }}>
            More Services
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {MORE_SERVICES.map(renderMoreServiceItem)}
          </ScrollView>
        </View>

        {/* Bottom padding for navigation */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Dropdown overlay and menu - Rendered at root level for proper z-index */}
      {showDropdown && (
        <>
          {/* Backdrop overlay */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'transparent',
              zIndex: 998,
            }}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          />
          {/* Dropdown menu */}
          <View
            style={{
              position: 'absolute',
              top: 110,
              left: 20,
              width: 180,
              backgroundColor: 'white',
              borderRadius: 12,
              paddingVertical: 8,
              zIndex: 999,
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
            }}
          >
            <TouchableOpacity
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}
              onPress={() => setShowDropdown(false)}
            >
              <Text style={{ fontSize: 14, color: '#383838' }}>Switch Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}
              onPress={() => setShowDropdown(false)}
            >
              <Text style={{ fontSize: 14, color: '#383838' }}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}
              onPress={() => setShowDropdown(false)}
            >
              <Text style={{ fontSize: 14, color: '#383838' }}>All Services</Text>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 4 }} />
            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 12 }} onPress={handleLogout}>
              <Text style={{ fontSize: 14, color: '#EF4444' }}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ContainerComponent>
  );
}
