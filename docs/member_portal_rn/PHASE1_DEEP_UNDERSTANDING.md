# Phase 1: Deep Understanding - Complete Checkpoint

## Overview
Comprehensive analysis of Next.js mobile dashboard for pixel-perfect React Native implementation.

---

## 1. Component Architecture

### Layout Structure (Mobile View)
```
SafeAreaView
└── ScrollView (vertical, backgroundColor: #f7f7fc)
    ├── UserGreeting (fixed header)
    ├── PolicyCarousel (horizontal scroll)
    ├── QuickLinks (horizontal scroll)
    ├── WalletBalanceCard (gradient card)
    ├── HealthBenefits (2-column grid)
    └── MoreServices (horizontal scroll)
```

---

## 2. UserGreeting Component (Mobile View - lg:hidden)

### Exact Dimensions
- **Avatar Circle**: 38px diameter
- **Greeting Text**: 16px font size
- **Subtitle**: 12px font size
- **Notification/Cart Icons**: 35px circles
- **Background**: #fbfdfe

### Styling Details
```javascript
// Avatar Container
{
  width: 38px,
  height: 38px,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}

// Greeting Text
{
  fontSize: '16px',
  color: '#000000',
  fontFamily: 'SF Pro Display, system-ui, sans-serif'
}

// Subtitle
{
  fontSize: '12px',
  color: '#666666',
  fontFamily: 'SF Pro Display, system-ui, sans-serif'
}

// Icon Buttons (Notification, Cart)
{
  width: 35px,
  height: 35px,
  borderRadius: '50%',
  backgroundColor: '#fbfdfe'
}
```

### Dropdown Menu Items
1. Switch Profile (if multiple family members)
2. Profile
3. All Services
4. Log Out

---

## 3. PolicyCarousel Component

### Card Dimensions (Mobile)
```javascript
{
  width: 'calc(100vw - 60px)',
  maxWidth: '280px',
  minWidth: '220px',
  minHeight: '137px',
  borderRadius: '16px',
  padding: '13px'
}
```

### Background Gradient
```javascript
background: 'linear-gradient(-3.81deg, rgba(228, 235, 254, 1) 0.81%, rgba(205, 220, 254, 1) 94.71%)'
border: '1px solid rgba(164, 191, 254, 0.48)'
boxShadow: '0px 4px 23.5px rgba(0, 0, 0, 0.05)'
```

### User Icon SVG
```svg
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="#000000"/>
</svg>
```

### Divider Line
```javascript
{
  height: '1px',
  background: 'rgba(164, 191, 254, 0.6)'
}
```

### Policy Info Rows
- **Font Size**: 12px
- **Label Color**: #3b3b3b (normal weight)
- **Value Color**: #3b3b3b (semibold weight)
- **Gap**: 8px between rows

### Pagination Dots
```javascript
// Active Dot
{
  height: '4px',
  width: '14px',
  borderRadius: '9999px',
  backgroundColor: '#1E3A8C'
}

// Inactive Dot
{
  height: '4px',
  width: '4px',
  borderRadius: '9999px',
  backgroundColor: '#cbd5e1'
}
```

---

## 4. QuickLinks Component (Mobile - 5 Items)

### Container
```javascript
{
  display: 'flex',
  gap: '8px',
  overflowX: 'auto',
  paddingBottom: '8px'
}
```

### Individual Quick Link Button
```javascript
{
  height: '36px',
  paddingLeft: '14px',
  paddingRight: '14px',
  borderRadius: '16px',
  background: 'linear-gradient(180deg, #ffffff 0%, #f3f4f5 100%)',
  border: '1px solid rgba(3, 77, 162, 0.11)',
  boxShadow: '-2px 11px 46.1px 0px rgba(0, 0, 0, 0.05)'
}
```

### Text Styling
```javascript
{
  fontSize: '16px',
  color: '#383838',
  fontFamily: 'SF Pro Display, system-ui, sans-serif'
}
```

### Arrow Icon
```javascript
// SVG: /images/icons/arrow-forward-vector.svg
{
  width: 10px,
  height: 10px
}
```

### 5 Quick Links (in order)
1. **Health Records** - `/images/icons/quicklink-health-records.svg` (16x19px)
2. **My Bookings** - `/images/icons/quicklink-my-bookings.svg` (18x17px)
3. **Claims** - `/images/icons/quicklink-claims.svg` (16x19px)
4. **Download Policy** - `/images/icons/quicklink-download-policy.svg` (23x18px)
5. **Transaction History** - `/images/icons/quicklink-transaction-history.svg` (20x20px)

---

## 5. WalletBalanceCard Component (Mobile)

### Dimensions
```javascript
{
  minHeight: '95px',
  borderRadius: '16px'
}
```

### Background Gradient
```javascript
background: 'linear-gradient(180deg, #5CA3FA 0%, #2266B6 100%)'
```

### Content Padding
```javascript
{
  padding: '12px',
  paddingRight: '100px' // Space for wallet illustration
}
```

### Title Text
```javascript
{
  fontSize: '13px',
  fontWeight: 'medium',
  color: '#FFFFFF',
  fontFamily: 'SF Pro Display, system-ui, sans-serif',
  lineHeight: '120%'
}
```

### Balance Amount
```javascript
{
  fontSize: '16px',
  fontWeight: 'semibold',
  color: '#FFFFFF',
  fontFamily: 'SF Pro Display, system-ui, sans-serif'
}
```

### "Left" Label
```javascript
{
  fontSize: '11px',
  color: '#B1D2FC',
  fontFamily: 'SF Pro Display, system-ui, sans-serif',
  marginLeft: '2px'
}
```

### Slash Separator
```javascript
{
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.63)',
  fontFamily: 'SF Pro Display, system-ui, sans-serif'
}
```

### Total Limit
```javascript
{
  fontSize: '12px',
  color: '#FFFFFF',
  fontFamily: 'SF Pro Display, system-ui, sans-serif',
  lineHeight: '120%'
}
```

### Subtitle
```javascript
{
  fontSize: '10px',
  color: '#B1D2FC',
  fontFamily: 'SF Pro Display, system-ui, sans-serif',
  lineHeight: '120%',
  marginTop: '6px'
}
```

### Wallet Illustration
```javascript
// SVG: /images/icons/wallet-illustration.svg
{
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '75px',
  height: '65px',
  zIndex: 1,
  opacity: 0.9
}
```

---

## 6. Health Benefits Section

### Header
```javascript
{
  fontSize: '18px', // lg:text-xl for desktop
  fontWeight: 'medium',
  color: '#1c1c1c',
  fontFamily: 'SF Pro Display, system-ui, sans-serif',
  lineHeight: '1.2',
  marginBottom: '16px' // lg:mb-6 for desktop
}
```

### Grid Layout
```javascript
// Mobile
{
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '16px'
}

// Desktop
{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)', // lg:grid-cols-3
  gap: '16px'
}

// Extra Large
{
  gridTemplateColumns: 'repeat(4, 1fr)' // 2xl:grid-cols-4
}
```

---

## 7. BenefitCardEnhanced Component (Mobile)

### Card Dimensions
```javascript
{
  minHeight: '78px',
  borderRadius: '16px',
  padding: '9px',
  paddingBottom: '10px',
  border: '1px solid rgba(217, 217, 217, 0.48)',
  boxShadow: '-2px 11px 46.1px 0px rgba(0, 0, 0, 0.08)',
  backgroundColor: '#ffffff'
}
```

### Active State
```javascript
{
  borderColor: '#0366de' // On press/active
}
```

### Title Text
```javascript
{
  fontSize: '14px', // sm:text-[16px] for larger mobile
  fontWeight: 'normal',
  color: '#034da2',
  fontFamily: 'SF Pro Display, system-ui, sans-serif',
  lineHeight: 'tight'
}
```

### Balance Amount
```javascript
{
  fontSize: '14px', // sm:text-[16px]
  fontWeight: 'medium',
  color: '#0a3f93',
  fontFamily: 'SF Pro Display, system-ui, sans-serif'
}
```

### "Left" Label
```javascript
{
  fontSize: '12px', // sm:text-[14px]
  fontWeight: 'normal',
  color: 'rgba(0, 0, 0, 0.4)',
  fontFamily: 'SF Pro Display, system-ui, sans-serif',
  marginLeft: '4px'
}
```

### Slash Separator
```javascript
{
  fontSize: '14px', // sm:text-[16px]
  fontWeight: 'normal',
  color: '#444444',
  fontFamily: 'SF Pro Display, system-ui, sans-serif'
}
```

### Total Amount (Short Form)
```javascript
{
  fontSize: '11px', // sm:text-[12px]
  fontWeight: 'normal',
  color: '#444444',
  fontFamily: 'SF Pro Display, system-ui, sans-serif'
}

// Format: 20000 -> 20k, 100000 -> 1L
```

### Arrow Button
```javascript
{
  width: '24px', // sm:w-[27px]
  height: '24px', // sm:h-[27px]
  borderRadius: '50%',
  background: '#f6f6f6'
}

// Arrow SVG
<svg width="12" height="12" viewBox="0 0 14 14">
  <path d="M5 2.5L9.5 7L5 11.5" stroke="#545454" strokeWidth="1.5"/>
</svg>
```

---

## 8. MoreServices Component (Mobile)

### Header
```javascript
{
  fontSize: '18px', // lg:text-xl
  fontWeight: 'medium',
  color: '#1c1c1c',
  fontFamily: 'SF Pro Display, system-ui, sans-serif',
  lineHeight: '1.2',
  marginBottom: '12px' // lg:mb-6
}
```

### Container
```javascript
{
  display: 'flex',
  gap: '10px',
  overflowX: 'auto',
  paddingBottom: '8px'
}
```

### Service Button
```javascript
{
  height: '50px',
  paddingLeft: '16px',
  paddingRight: '16px',
  borderRadius: '16px',
  border: '1px solid rgba(217, 217, 217, 0.48)',
  boxShadow: '-2px 11px 46.1px 0px rgba(0, 0, 0, 0.08)',
  backgroundColor: '#ffffff',
  gap: '12px'
}
```

### Icon Container
```javascript
{
  height: '24px', // Icon container
  // Icons are 24x24px images
}
```

### Label Text
```javascript
{
  fontSize: '14px',
  fontWeight: 'medium',
  color: '#000000', // Default
  fontFamily: 'SF Pro Display, system-ui, sans-serif'
}

// Highlight words in blue
{
  color: '#034DA2' // For highlighted portions
}
```

### 4 Services (in order)
1. **24/7 Helpline** - `/images/icons/helpline-icon.svg` (highlight "24/7")
2. **Claims** - `/images/icons/claims-service.svg`
3. **Health Records** - `/images/icons/health-records-service.svg` (highlight "Health")
4. **Transaction History** - `/images/icons/transaction-history.svg` (highlight "Transaction")

---

## 9. Typography System

### Font Family
```javascript
fontFamily: 'SF Pro Display, system-ui, sans-serif'
```

### Font Sizes (Mobile)
- **Section Headers**: 18px (medium weight)
- **User Greeting**: 16px
- **Subtitle**: 12px, 13px
- **Quick Links**: 16px
- **Benefit Title**: 14px (16px on sm+)
- **Benefit Balance**: 14px (16px on sm+)
- **Small Text**: 10px, 11px, 12px

---

## 10. Color Palette

### Primary Blues
- `#034da2` - Benefit title
- `#0a3f93` - Benefit balance
- `#0366de` - Active border
- `#1E3A8C` - Active pagination dot
- `#5CA3FA` - Wallet gradient start
- `#2266B6` - Wallet gradient end

### Grays
- `#1c1c1c` - Section headers
- `#383838` - Quick link text
- `#3b3b3b` - Policy card text
- `#444444` - Secondary text
- `#666666` - Subtitle
- `#f6f6f6` - Arrow button background
- `#f7f7fc` - Page background
- `#fbfdfe` - Icon button background

### Transparent Colors
- `rgba(3, 77, 162, 0.11)` - Quick link border
- `rgba(217, 217, 217, 0.48)` - Card border
- `rgba(164, 191, 254, 0.48)` - Policy card border
- `rgba(164, 191, 254, 0.6)` - Policy divider
- `rgba(0, 0, 0, 0.05)` - Policy card shadow
- `rgba(0, 0, 0, 0.08)` - Benefit card shadow
- `rgba(0, 0, 0, 0.4)` - "Left" label
- `rgba(255, 255, 255, 0.63)` - Wallet slash

### Light Colors
- `#B1D2FC` - Wallet subtitle and "Left" label
- `#cbd5e1` - Inactive pagination dot
- `#FFFFFF` - White

---

## 11. Shadow System

### Card Shadows
```javascript
// Quick Links
boxShadow: '-2px 11px 46.1px 0px rgba(0, 0, 0, 0.05)'

// Benefit Cards
boxShadow: '-2px 11px 46.1px 0px rgba(0, 0, 0, 0.08)'

// Policy Cards
boxShadow: '0px 4px 23.5px rgba(0, 0, 0, 0.05)'
```

---

## 12. Border Radius System

- **Large Cards**: 16px (Policy, Wallet, Benefits, Services)
- **Small Buttons**: 16px (Quick Links, More Services)
- **Circles**: 50% or 9999px (Avatar, Icons, Pagination)

---

## 13. Spacing System

### Section Padding
```javascript
{
  paddingTop: '12px', // pt-3
  paddingBottom: '0px',
  paddingLeft: '20px', // px-5
  paddingRight: '20px'
}
```

### Grid Gaps
- **Benefit Grid**: 16px
- **Quick Links**: 8px
- **More Services**: 10px
- **Policy Carousel**: 16px (gap-4)

### Internal Padding
- **Policy Card**: 13px
- **Benefit Card**: 9px (pb-10px)
- **Wallet Card**: 12px (pr-100px for illustration)
- **Quick Link**: 14px horizontal
- **Service Button**: 16px horizontal

---

## 14. Data Flow & API Integration

### Wallet Data
```javascript
// API: /api/wallet/balance
const { data: walletData } = await fetch('/api/wallet/balance');

// Structure
{
  categories: [
    {
      categoryCode: 'CAT001',
      name: 'OPD Coverage',
      available: 15000,
      total: 20000
    }
  ],
  totalBalance: {
    allocated: 50000,
    available: 35000
  }
}
```

### Category Icon Mapping
```javascript
{
  'CAT001': UserIcon,      // Consultation
  'CAT002': CubeIcon,      // Pharmacy
  'CAT003': BeakerIcon,    // Diagnostics
  'CAT004': EyeIcon,       // Dental
  'CAT005': EyeIcon,       // Vision
  'CAT006': EyeIcon,       // Dental & Vision
  'CAT007': ClipboardDocumentCheckIcon // Wellness
}
```

### Navigation Mapping
```javascript
{
  'CAT001': '/member/appointments',
  'CAT002': '/member/pharmacy',
  'CAT003': '/member/diagnostics',
  'CAT004': '/member/dental',
  'CAT005': '/member/online-consult',
  'CAT006': '/member/dental',
  'CAT007': '/member/wellness'
}
```

---

## 15. Scrolling Behavior

### Horizontal Scrollbars Hidden
```css
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### Components with Horizontal Scroll
1. **PolicyCarousel** - Snap scroll to each card
2. **QuickLinks** - Free scroll
3. **MoreServices** - Free scroll

### Snap Scroll Logic (Policy Carousel)
```javascript
const cardWidth = firstCard.offsetWidth + 16; // Card + gap
const newIndex = Math.round(scrollLeft / cardWidth);
container.scrollTo({
  left: index * cardWidth,
  behavior: 'smooth'
});
```

---

## 16. Responsive Breakpoints

### Mobile-Specific Classes
- `lg:hidden` - Hide on desktop (≥1024px)
- Mobile max-width: `480px` centered

### Responsive Font Sizes
- Mobile: `text-[14px] sm:text-[16px]`
- Headers: `text-[18px] lg:text-xl`

---

## 17. Interactive States

### Touchable Feedback
```javascript
// Cards
activeOpacity={0.7}
onPress={() => router.push(href)}

// Active border change
{
  borderColor: '#0366de' // On press
}

// Scale animation
{
  transform: 'scale(0.98)' // On press
}
```

### Hover States (Web Only)
```javascript
transition: 'all 0.2s'
hover: {
  transform: 'translateY(-2px)'
}
```

---

## 18. Currency Formatting

### Full Format
```javascript
new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0
}).format(amount)

// Example: 15000 -> "15,000"
```

### Short Format
```javascript
// >= 100000: divide by 100000, suffix "L"
// >= 1000: divide by 1000, suffix "k"
// < 1000: show as is

// Examples:
// 150000 -> "1.5L" or "2L"
// 20000 -> "20k"
// 500 -> "500"
```

---

## 19. SVG Icons Inventory

### Required Icons (from Next.js)
1. `quicklink-health-records.svg` (16x19px)
2. `quicklink-my-bookings.svg` (18x17px)
3. `quicklink-claims.svg` (16x19px)
4. `quicklink-download-policy.svg` (23x18px)
5. `quicklink-transaction-history.svg` (20x20px)
6. `arrow-forward-vector.svg` (10x10px)
7. `wallet-illustration.svg` (75x65px)
8. `helpline-icon.svg` (24x24px)
9. `claims-service.svg` (24x24px)
10. `health-records-service.svg` (24x24px)
11. `transaction-history.svg` (24x24px)
12. `notification-bell.svg` (for header)
13. `cart-icon.svg` (for header)

### Inline SVGs
1. **User Icon** (16x16px) - Policy card
2. **Arrow Right** (12x12px) - Benefit card
3. **Chevron Down** - User greeting dropdown

---

## 20. Layout Constraints

### Mobile View
```javascript
{
  maxWidth: '480px',
  marginLeft: 'auto',
  marginRight: 'auto'
}
```

### Desktop View
```javascript
{
  maxWidth: '100%' // lg:max-w-full
}
```

---

## 21. Component Order (Vertical)

1. **UserGreeting** - Fixed header with avatar, notifications, cart
2. **PolicyCarousel** - Horizontal scroll, pagination dots
3. **QuickLinks** - 5 items, horizontal scroll
4. **WalletBalanceCard** - Gradient card with illustration
5. **Health Benefits** - 2-column grid on mobile
6. **More Services** - 4 items, horizontal scroll
7. **Bottom Padding** - 8px to prevent bottom nav overlap

---

## 22. Error States & Loading

### Loading State
```javascript
// Centered spinner
<ActivityIndicator size="large" color="#034da2" />
```

### Empty States
- No policies: Show empty carousel message
- No benefits: Show empty grid message
- No data: Show retry button

---

## 23. Accessibility

### Role Attributes
```javascript
role="button"
tabIndex={0}
aria-label="Go to policy 1"
```

### Semantic HTML (for web)
- `<section>` for major sections
- `<h2>` for section headers
- `<nav>` for navigation elements

---

## 24. Animation Timing

### Transitions
```javascript
transition: 'all 0.2s' // Standard
transition: 'all 0.3s' // Slower transitions
```

### Scroll Behavior
```javascript
behavior: 'smooth'
```

---

## 25. Z-Index Layering

```javascript
{
  walletIllustration: 1,
  carouselNavigation: 10,
  dropdown: 50,
  modal: 100
}
```

---

## Phase 1 Completion Checklist

✅ **Component Structure** - Fully mapped
✅ **Exact Dimensions** - All values extracted
✅ **Color Palette** - Complete RGB/RGBA values
✅ **Typography** - Font families, sizes, weights
✅ **Shadows & Borders** - Exact values
✅ **Spacing System** - Gaps, padding, margins
✅ **SVG Icons** - Complete inventory
✅ **Gradients** - All gradient definitions
✅ **Data Flow** - API structure understood
✅ **Navigation** - Routing patterns mapped
✅ **Responsive Logic** - Breakpoints documented
✅ **Interactive States** - Touch/hover behavior
✅ **Scroll Behavior** - Horizontal scroll, snap
✅ **Currency Formatting** - Format rules
✅ **Accessibility** - ARIA labels, roles

---

## Next Phase: Phase 2 - UI-First Implementation

### Approach
1. Create exact SVG icon components
2. Build atomic components (buttons, cards)
3. Build composite components (sections)
4. Implement scrolling behavior
5. Add responsive breakpoints
6. Test pixel-perfect alignment
7. ZERO COMPROMISE on UI accuracy

### Success Criteria
- Visual match: 100%
- All dimensions exact
- All colors exact
- All typography exact
- All shadows exact
- All spacing exact
- All SVGs exact
- All gradients exact

**Ready to proceed to Phase 2: UI-First Implementation**
