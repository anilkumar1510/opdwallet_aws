import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Ellipse, G, Defs, ClipPath } from 'react-native-svg';
import { useAuth } from '../../src/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Wallet Icon (18x18) - Using inline SVG from Next.js UserGreeting component
function WalletIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M15.75 4.5H13.5V3.375C13.5 2.475 12.7875 1.6875 11.8125 1.6875H6.1875C5.2125 1.6875 4.5 2.4 4.5 3.375V4.5H2.25C1.0125 4.5 0 5.5125 0 6.75V14.625C0 15.8625 1.0125 16.875 2.25 16.875H15.75C16.9875 16.875 18 15.8625 18 14.625V6.75C18 5.5125 16.9875 4.5 15.75 4.5ZM6.1875 3.375H11.8125V4.5H6.1875V3.375ZM15.75 14.625H2.25V6.75H15.75V14.625ZM13.5 10.6875C13.5 11.2125 13.0875 11.625 12.5625 11.625H5.4375C4.9125 11.625 4.5 11.2125 4.5 10.6875C4.5 10.1625 4.9125 9.75 5.4375 9.75H12.5625C13.0875 9.75 13.5 10.1625 13.5 10.6875Z"
        fill="#034DA2"
      />
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

// Arrow Forward Icon for quick links (10x10)
function ArrowForwardIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 16 16" fill="none">
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

// Quick Link Icons - EXACT from quicklink-*.svg files
function HealthRecordsIcon() {
  return (
    <Svg width={16} height={19} viewBox="0 0 15.8522 19" fill="none">
      <G>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.9416 18.0443V16.5722C13.8847 16.6102 13.8286 16.6473 13.7725 16.6844C13.587 16.8081 13.8661 16.8215 13.6896 16.9806V17.91L1.91241 18.0442C1.91241 19.0239 0.539556 18.8961 0.512344 18.0442V0.306449H13.6896V7.54065C13.9082 7.67177 13.6686 7.77156 13.9415 7.84824V0H0V18.0442C0 18.5704 0.431299 19 0.956583 19H14.8964C15.4225 19 15.8522 18.5703 15.8522 18.0442L13.9416 18.0443ZM8.27208 3.34147H7.36661V4.24694H6.57577V3.34147H5.67029V2.55063H6.57577V1.64515H7.36661V2.55063H8.27208V3.34147ZM3.9732 6.43542C3.75466 6.43542 3.53603 6.39437 3.53603 6.17583C3.53603 5.9573 3.72323 5.99456 3.94176 5.99456H11.9986C12.2171 5.99456 12.3845 5.9573 12.3845 6.17583C12.3845 6.39437 12.2485 6.43542 12.03 6.43542H3.9732ZM3.9767 9.29254C3.75816 9.29254 3.53603 9.30051 3.53603 9.08198C3.53603 8.86428 3.71333 8.88701 3.93186 8.88701H8.28348C8.10206 9.10884 8.0232 8.99401 7.98279 9.29254H3.9767ZM3.93186 12.2332C3.71332 12.2332 3.53603 12.2075 3.53603 11.9898C3.53603 11.7713 3.65901 11.645 3.87755 11.645H7.86711V12.2332H3.93186Z"
          fill="#034DA2"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.2702 8.84755C12.9152 9.14494 12.3749 9.29004 11.7034 9.37236C11.4004 9.4094 11.176 9.64453 11.176 9.92751V12.0592C11.176 13.241 12.7129 13.7169 13.2506 14.3024C13.2933 14.3492 13.3499 14.3729 13.4157 14.3729C13.4816 14.3729 13.5382 14.3492 13.5809 14.3024C14.119 13.7169 15.6554 13.241 15.6554 12.0592V9.92803C15.6554 9.64506 15.4321 9.40992 15.129 9.37288C14.4576 9.29005 13.9174 9.14547 13.5614 8.84808C13.4785 8.77862 13.3535 8.77861 13.2702 8.84755ZM12.1984 12.0087C12.1007 11.914 12.0971 11.7587 12.1912 11.6609C12.2859 11.5631 12.4418 11.5595 12.5401 11.6537L12.9887 12.0849L14.275 10.5655C14.363 10.4621 14.5189 10.4492 14.6223 10.5367C14.7267 10.6247 14.7391 10.7806 14.6511 10.884L13.196 12.603H13.1955C13.193 12.6071 13.1894 12.6107 13.1852 12.6148C13.0916 12.7126 12.9352 12.7157 12.8374 12.621L12.1984 12.0087Z"
          fill="#F5821E"
        />
      </G>
    </Svg>
  );
}

function BookingsIcon() {
  return (
    <Svg width={18} height={17} viewBox="0 0 18.041 16.7111" fill="none">
      <G>
        <Path
          d="M16.5033 2.12385H14.1949V0.989294C14.1949 0.444134 13.7508 0 13.2056 0C12.6605 0 12.2163 0.444134 12.2163 0.989294V2.12385H5.82394V0.989294C5.82394 0.444134 5.37981 0 4.83465 0C4.28949 0 3.84536 0.444134 3.84536 0.989294V2.12385H1.53695C0.688738 2.12385 0 2.81428 0 3.66081V15.1742C0 16.0224 0.690426 16.7111 1.53695 16.7111H16.5041C17.3523 16.7111 18.041 16.0207 18.041 15.1742L18.0402 3.66252C18.0402 2.8143 17.3499 2.12385 16.5033 2.12385Z"
          fill="#034DA2"
        />
        <Path
          d="M12.9276 7.79161L7.50617 13.2139L5.11014 10.8179C4.86218 10.5699 4.45812 10.5699 4.20849 10.8179C3.96053 11.0659 3.96053 11.4699 4.20849 11.7195L7.05526 14.5663C7.17464 14.6857 7.33743 14.7525 7.50608 14.7525C7.67473 14.7525 7.83752 14.6865 7.9569 14.5663L13.83 8.69325C14.0779 8.44529 14.0779 8.04123 13.83 7.79161C13.582 7.54198 13.1781 7.54198 12.9276 7.79161Z"
          fill="#F5821E"
        />
      </G>
    </Svg>
  );
}

function ClaimsIcon() {
  return (
    <Svg width={16} height={19} viewBox="0 0 15.5 19" fill="none">
      <G>
        <Path
          d="M10.0963 17.5903C10.5964 18.0904 11.2876 18.3998 12.0508 18.3998C12.8141 18.3998 13.5052 18.0904 14.0053 17.5903C14.5054 17.0902 14.8148 16.399 14.8148 15.6358C14.8148 14.8794 14.5113 14.1941 14.0202 13.6952C13.4533 13.1642 12.84 12.8718 12.0508 12.8718C11.2876 12.8718 10.5964 13.1812 10.0963 13.6813C9.59625 14.1807 9.2868 14.8721 9.2868 15.6358C9.2868 16.37 9.57806 17.072 10.0963 17.5903Z"
          fill="#034DA2"
        />
        <Ellipse cx="12" cy="15.5" rx="3.49998" ry="3.5" fill="#F5821E" />
        <Path
          d="M12.0501 17.0221C11.8845 17.0221 11.7501 17.1565 11.7501 17.3221C11.7501 17.4891 11.8824 17.6247 12.0501 17.6247C12.2157 17.6247 12.3501 17.4903 12.3501 17.3247C12.3501 17.1577 12.2178 17.0221 12.0501 17.0221Z"
          fill="white"
        />
        <Path
          d="M12.0501 13.5C11.8845 13.5 11.7501 13.6344 11.7501 13.8V16.2402C11.7501 16.4058 11.8845 16.5402 12.0501 16.5402C12.2157 16.5402 12.3501 16.4058 12.3501 16.2402V13.8C12.3501 13.6344 12.2157 13.5 12.0501 13.5Z"
          fill="white"
        />
      </G>
    </Svg>
  );
}

function DownloadIcon() {
  return (
    <Svg width={20} height={18} viewBox="0 0 23.3921 18" fill="none">
      <G>
        <Path
          d="M23.2091 14.2026C23.0678 14.0377 22.8597 13.9474 22.6437 13.9474H19.8753V3.69883C19.8753 3.6792 19.8753 3.66349 19.8714 3.64386C19.8439 1.80225 18.4617 0.239401 16.6318 0.00392667C16.6161 0.00392667 16.6004 0 16.5847 0H3.2576C3.24189 0 3.22619 0 3.21048 0.00392667C1.54165 0.227746 0.222189 1.5471 0.00631678 3.21211C-0.0211712 3.42415 0.0416555 3.63619 0.183016 3.79718C0.324376 3.9621 0.532483 4.05241 0.748456 4.05241H5.9867V8.15977L5.96706 8.17547C5.08357 8.91761 4.01159 9.39276 2.87297 9.55374C2.69627 9.5773 2.56668 9.72652 2.56668 9.90321V11.949C2.56668 13.6689 3.33631 15.271 4.67922 16.3469L6.07319 17.466C6.13994 17.517 6.21455 17.5445 6.29308 17.5445C6.37162 17.5445 6.45015 17.517 6.51298 17.466L7.12162 16.9751C7.6949 17.5327 8.42919 17.89 9.22631 17.9961C9.24202 17.9961 9.28521 18 9.30092 18H20.1345C20.1502 18 20.1659 18 20.1816 17.9961C21.8505 17.7723 23.1699 16.4529 23.3858 14.7879C23.4133 14.5758 23.3505 14.3636 23.2091 14.2026Z"
          fill="#034DA2"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.33628 7.90868C5.69908 8.44245 4.72941 8.70288 3.52417 8.85064C2.98024 8.91713 2.5776 9.33916 2.5776 9.84706V13.6731C2.5776 15.7944 5.33604 16.6486 6.30107 17.6994C6.37772 17.7835 6.4793 17.826 6.59751 17.826C6.71571 17.826 6.8173 17.7835 6.89394 17.6994C7.8599 16.6485 10.6174 15.7943 10.6174 13.6731V9.84801C10.6174 9.3401 10.2166 8.91806 9.67269 8.85158C8.46754 8.7029 7.4979 8.44339 6.85893 7.90963C6.71025 7.78496 6.48588 7.78494 6.33628 7.90868ZM4.41267 13.5825C4.23721 13.4126 4.23075 13.1337 4.39974 12.9583C4.56966 12.7828 4.84947 12.7763 5.02585 12.9453L5.83112 13.7192L8.13981 10.9922C8.29772 10.8066 8.57755 10.7835 8.76315 10.9405C8.95062 11.0984 8.97278 11.3782 8.81487 11.5638L6.20324 14.6492H6.20231C6.1977 14.6566 6.19123 14.6631 6.18385 14.6705C6.01577 14.8459 5.73504 14.8515 5.55958 14.6816L4.41267 13.5825Z"
          fill="#F5821E"
        />
      </G>
    </Svg>
  );
}

function TransactionsIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 19.9814" fill="none">
      <G>
        <Path
          d="M4.73926 1.64355C7.36488 -0.0134331 10.616 -0.339116 13.5186 0.764648C16.4202 1.86846 18.6334 4.27313 19.4941 7.25586C20.3538 10.2384 19.7611 13.4527 17.8926 15.9316C16.0238 18.4109 13.0965 19.8668 9.99219 19.8623C6.98549 19.8613 4.14312 18.4908 2.27051 16.1396C0.397244 13.7885 -0.302766 10.7115 0.369141 7.78125V7.78027Z"
          fill="#034DA2"
          stroke="#F6F6F7"
          strokeWidth="0.238523"
        />
        <Path
          d="M9.91064 5.41075C11.1239 5.41257 12.2887 5.89452 13.147 6.75352C14.006 7.61162 14.4879 8.77657 14.4897 9.99083C14.4896 11.2103 14.0854 12.3736 13.231 13.2291C12.3735 14.0856 11.1268 14.5698 9.91064 14.5699C8.69675 14.5699 7.53158 14.087 6.67236 13.2291C5.81428 12.3701 5.33068 11.2048 5.33057 9.99083C5.33057 8.77695 5.81353 7.61176 6.67139 6.75255C7.53035 5.89449 8.69572 5.41089 9.90967 5.41075Z"
          fill="#F5821E"
          stroke="#F6F6F7"
          strokeWidth="0.238523"
        />
      </G>
    </Svg>
  );
}

// More Services Icons - EXACT from actual SVG files
function HelplineIcon() {
  return (
    <Svg width={24} height={23} viewBox="0 0 24 22.8966" fill="none">
      <G>
        <Path
          d="M5.73073 7.28204C5.5465 7.96071 5.50009 8.6694 5.59423 9.36629C5.59876 9.39673 5.61088 9.42553 5.62948 9.45004C5.00967 9.61121 4.46983 9.99274 4.11102 10.5232C3.75221 11.0537 3.59902 11.6967 3.68011 12.332C3.76121 12.9673 4.07104 13.5512 4.55161 13.9745C5.03219 14.3978 5.65056 14.6315 6.29098 14.6318H6.86798C6.94811 14.6318 7.02745 14.616 7.10147 14.5853C7.1755 14.5547 7.24276 14.5097 7.2994 14.453C7.35605 14.3964 7.40098 14.3291 7.43162 14.2551C7.46226 14.181 7.47801 14.1017 7.47798 14.0215V9.97279C7.47801 9.89266 7.46226 9.81332 7.43162 9.73928C7.40098 9.66524 7.35605 9.59797 7.2994 9.5413C7.24276 9.48462 7.1755 9.43967 7.10147 9.409C7.02745 9.37833 6.94811 9.36254 6.86798 9.36254H6.29098C6.18078 9.36336 6.07073 9.37104 5.96148 9.38554C5.96697 9.36442 5.96858 9.34249 5.96623 9.32079C5.88203 8.68213 5.92218 8.0332 6.08448 7.40979C6.17835 7.42961 6.27404 7.43958 6.36998 7.43954C6.68985 7.43893 7.00004 7.32979 7.24982 7.12997C7.4996 6.93015 7.67417 6.65148 7.74498 6.33954Z"
          fill="#034DA2"
        />
        <Path
          d="M15.7286 5.46654H8.44107C8.38031 5.58858 8.32607 5.71376 8.27857 5.84154H15.8911C15.8436 5.71404 15.7886 5.58904 15.7286 5.46654Z"
          fill="#F5821E"
        />
        <Path
          d="M23.3 19.2265H22.5485V7.65654C22.5478 7.07592 22.3169 6.51927 21.9063 6.10871C21.4958 5.69815 20.9391 5.46721 20.3585 5.46654H19.5185L19.521 5.46904L19.5235 5.54404L19.541 5.61904C19.556 5.69404 19.5685 5.76654 19.576 5.84154H20.3585C20.8396 5.84234 21.3008 6.03381 21.641 6.37402C21.9812 6.71423 22.1727 7.17542 22.1735 7.65654V19.2265H15.045H15.0387C14.979 19.2267 14.9193 19.2306 14.86 19.2383C14.852 19.2383 14.8445 19.2418 14.8365 19.243C14.6087 19.2739 14.3927 19.3628 14.2093 19.5013C14.203 19.5058 14.196 19.5095 14.1895 19.5143C14.1762 19.5245 14.1645 19.5365 14.1517 19.5468Z"
          fill="#F5821E"
        />
      </G>
    </Svg>
  );
}

function ClaimsServiceIcon() {
  return (
    <Svg width={24} height={27} viewBox="0 0 24 27.3319" fill="none">
      <G>
        <Path
          d="M2.81859 6.8551C2.64863 6.85864 2.51053 6.99673 2.51408 7.16669L2.52116 7.71553C2.5247 7.88549 2.66279 8.02004 2.82921 8.02004H2.83275C3.00271 8.0165 3.14081 7.87841 3.13727 7.70845L3.13018 7.15961C3.13018 6.98965 2.98855 6.85156 2.81859 6.8551Z"
          fill="#034DA2"
        />
        <Path
          d="M12.68 12.8675C12.68 13.0375 12.5419 13.1756 12.3719 13.1756C12.202 13.1756 12.0639 13.0375 12.0639 12.864V6.54707C12.0639 6.37711 12.202 6.23901 12.3719 6.23901C12.5419 6.23901 12.68 6.37711 12.68 6.54707V12.8675Z"
          fill="#F5821E"
        />
        <Path
          d="M9.52862 20.1865C9.52862 20.7317 9.08247 21.1779 8.53718 21.1779C7.99189 21.1779 7.54574 20.7317 7.54574 20.1865C7.54574 19.6412 7.99189 19.195 8.53718 19.195C9.08247 19.195 9.52862 19.6412 9.52862 20.1865Z"
          fill="#F5821E"
        />
      </G>
    </Svg>
  );
}

function HealthRecordsServiceIcon() {
  return (
    <Svg width={24} height={23} viewBox="0 0 19.0718 22.7496" fill="none">
      <G>
        <Path
          d="M2.79065 8.62591H11.6478C11.8564 8.62591 12.027 8.45528 12.027 8.24675C12.027 8.03821 11.8564 7.86759 11.6478 7.86759H2.79065C2.58212 7.86759 2.41149 8.03821 2.41149 8.24675C2.41149 8.45528 2.58212 8.62591 2.79065 8.62591Z"
          fill="#F5821E"
        />
        <Path
          d="M14.4422 12.7133V5.37271C14.4422 5.27412 14.4043 5.17933 14.3323 5.10729L9.38422 0.113748C9.31218 0.0417076 9.2136 0 9.11502 0H0.379161C0.166831 0 0 0.170622 0 0.379161V17.7258C0 17.9343 0.166831 18.1049 0.379161 18.1049H9.06952C9.26289 20.6984 11.4317 22.7496 14.0631 22.7496C16.8271 22.7496 19.0718 20.4936 19.0718 17.7258C19.0718 15.083 17.0281 12.9066 14.4422 12.7133Z"
          fill="#034DA2"
        />
      </G>
    </Svg>
  );
}

function TransactionHistoryIcon() {
  return (
    <Svg width={24} height={18} viewBox="0 0 20 17.6153" fill="none">
      <G>
        <Path
          d="M18.4618 1.2568H15.6673V0.707523C15.6674 0.614661 15.6492 0.522682 15.6138 0.436848C15.5784 0.351013 15.5263 0.273008 15.4607 0.207294C15.3951 0.141581 15.3172 0.0894479 15.2314 0.0538783C15.1456 0.0183086 15.0537 0 14.9608 0C14.868 0 14.776 0.0183086 14.6902 0.0538783C14.6044 0.0894479 14.5265 0.141581 14.4609 0.207294C14.3953 0.273008 14.3433 0.351013 14.3078 0.436848C14.2724 0.522682 14.2542 0.614661 14.2544 0.707523V1.2568H6.54642V2.66971H14.2544V3.21932C14.2542 3.31218 14.2724 3.40416 14.3078 3.49C14.3433 3.57583 14.3953 3.65384 14.4609 3.71955C14.5265 3.78526 14.6044 3.8374 14.6902 3.87297C14.776 3.90854 14.868 3.92684 14.9608 3.92684C15.0537 3.92684 15.1456 3.90854 15.2314 3.87297C15.3172 3.8374 15.3951 3.78526 15.4607 3.71955C15.5263 3.65384 15.5784 3.57583 15.6138 3.49C15.6492 3.40416 15.6674 3.31218 15.6673 3.21932V2.66971H18.4618C18.4951 2.6698 18.527 2.68309 18.5505 2.70666C18.574 2.73024 18.5871 2.76217 18.5871 2.79545V5.00899H1.4129V2.79545C1.41286 2.76217 1.42603 2.73024 1.44952 2.70666C1.47301 2.68309 1.50489 2.6698 1.53817 2.66971H4.33271V3.21932Z"
          fill="#034DA2"
        />
        <Path
          d="M8.94131 13.1314C9.05575 13.2453 9.21056 13.3095 9.37205 13.3098C9.53354 13.3102 9.68865 13.2468 9.80362 13.1334L12.5423 10.4131C12.6569 10.2988 12.7215 10.1437 12.7219 9.9818C12.7224 9.81991 12.6586 9.66446 12.5446 9.5495L12.4901 9.49492C12.4337 9.43801 12.3666 9.39278 12.2926 9.36182C12.2187 9.33085 12.1394 9.31476 12.0592 9.31445C11.9791 9.31415 11.8996 9.32964 11.8255 9.36004C11.7513 9.39044 11.6838 9.43515 11.6269 9.49163L9.37505 11.7289L8.45954 10.8133C8.40284 10.7566 8.3355 10.7115 8.26138 10.6808C8.18725 10.6501 8.1078 10.6343 8.02756 10.6343C7.94732 10.6343 7.86787 10.6502 7.79376 10.6809C7.71965 10.7117 7.65233 10.7568 7.59567 10.8136L7.54183 10.868C7.42724 10.9825 7.3628 11.1378 7.36266 11.2997C7.36253 11.4617 7.42671 11.6171 7.54111 11.7318L8.94131 13.1314Z"
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

  const handleNavigation = (href: string) => {
    if (href && href !== '#') {
      router.push(href as any);
    }
  };

  // Handle policy scroll for pagination
  const handlePolicyScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const cardWidth = Math.min(SCREEN_WIDTH - 60, 280) + 16; // card width + margin
    const index = Math.round(scrollPosition / cardWidth);
    setActivePolicyIndex(index);
  };

  // Mock policy data - including dependents
  const policies = [
    {
      policyId: '1',
      policyNumber: 'POL-2024-001234',
      policyHolder: fullName,
      corporate: 'TCS Limited',
      expiryDate: '2025-03-31',
    },
    {
      policyId: '2',
      policyNumber: 'POL-2024-001235',
      policyHolder: 'Sarah ' + lastName,
      corporate: 'TCS Limited',
      expiryDate: '2025-03-31',
    },
    {
      policyId: '3',
      policyNumber: 'POL-2024-001236',
      policyHolder: 'Alex ' + lastName,
      corporate: 'TCS Limited',
      expiryDate: '2025-03-31',
    },
  ];

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
  const renderPolicyCard = (policy: any) => (
    <TouchableOpacity
      key={policy.policyId}
      activeOpacity={0.9}
      onPress={() => handleNavigation(`/member/policy-details/${policy.policyId}`)}
      style={{
        width: Math.min(SCREEN_WIDTH - 60, 280),
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
  const renderBenefitCard = (benefit: any) => (
    <TouchableOpacity
      key={benefit.id}
      onPress={() => handleNavigation(benefit.href)}
      activeOpacity={0.9}
      style={{
        width: (SCREEN_WIDTH - 56) / 2,
        minHeight: 78,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 9,
        paddingBottom: 10,
        marginBottom: 16,
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7fc' }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#034DA2" />
        }
        scrollEnabled={!showDropdown}
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
            snapToInterval={Math.min(SCREEN_WIDTH - 60, 280) + 16}
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
        <View style={{ paddingTop: 24, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '500', color: '#1c1c1c', marginBottom: 16 }}>
            Health Benefits
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {walletCategories.map((benefit: any) => renderBenefitCard({
              id: benefit.id || benefit.categoryCode,
              name: benefit.name,
              available: benefit.available ?? benefit.amount ?? 0,
              total: benefit.total ?? 0,
              href: benefit.href || '/member/benefits',
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
    </SafeAreaView>
  );
}
