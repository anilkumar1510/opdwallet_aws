# Testing the RN Member Portal Locally

## Quick Start

### 1. Start the Backend (if not running)

```bash
cd /Users/nitendraagarwal/opdwallet_aws
docker-compose up -d
```

Wait for the backend to be ready (~30 seconds).

### 2. Start the RN App

Open a new terminal:

```bash
cd /Users/nitendraagarwal/opdwallet_aws/web-member-rn
npm start
```

### 3. Access the App

Once Expo Dev Server starts, you'll see options:

```
› Press w │ open web
› Press a │ open Android
› Press i │ open iOS
```

**Press `w` to open in web browser** - This will test the responsive login!

---

## 🌐 Web Testing URLs

After pressing `w`, the app will automatically open at:

```
http://localhost:8081
```

Or manually visit:
- **Main URL:** http://localhost:8081
- **Alternative:** http://localhost:19006 (if 8081 is busy)

---

## 📱 Testing Responsive Design

### Test Desktop Layout (Side-by-Side)

1. Open in browser: http://localhost:8081
2. Resize browser window to **≥ 1024px wide**
3. You should see:
   - ✅ Login form on LEFT
   - ✅ Brand section on RIGHT
   - ✅ 3 feature cards
   - ✅ Large text (32px)
   - ✅ Large member illustration (256px)

### Test Tablet Layout

1. Open browser developer tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select iPad or set width to **768px**
4. You should see:
   - ✅ Vertical stack layout
   - ✅ 3 feature cards
   - ✅ Medium text (28px)
   - ✅ All elements visible

### Test Mobile Layout

1. In device toolbar, select iPhone or set width to **375px**
2. You should see:
   - ✅ Vertical stack layout
   - ✅ Only 1 feature card (OPD Coverage)
   - ✅ Small text (24px)
   - ✅ Hidden: subtitle, demo credentials, contact support
   - ✅ Small member illustration (128px)

---

## 🧪 Test Checklist

### Visual Tests

- [ ] **Desktop (≥1024px):** Side-by-side layout
- [ ] **Desktop:** 3 feature cards visible
- [ ] **Desktop:** Large text and images
- [ ] **Tablet (640-1024px):** Vertical layout, 3 cards
- [ ] **Mobile (<640px):** Vertical layout, 1 card
- [ ] **Mobile:** Demo credentials hidden
- [ ] **Mobile:** Subtitle hidden

### Functionality Tests

- [ ] **Login works** with demo credentials
  ```
  Email: john.doe@company.com
  Password: Member@123
  ```
- [ ] **Password toggle** shows/hides password
- [ ] **Input focus** shows blue border and ring
- [ ] **Button hover** (web) changes color on hover
- [ ] **Contact Support** link is clickable (desktop/tablet)
- [ ] **Error message** displays on invalid login
- [ ] **Loading state** shows spinner during login

### Responsive Tests

- [ ] **Resize window** from mobile → tablet → desktop
- [ ] **Layout changes** at 640px breakpoint
- [ ] **Layout changes** at 1024px breakpoint
- [ ] **Elements show/hide** correctly at breakpoints
- [ ] **Text sizes** scale smoothly
- [ ] **Images** scale smoothly
- [ ] **Spacing** scales smoothly

---

## 🔐 Login Credentials

Use these demo credentials to test login:

```
Email: john.doe@company.com
Password: Member@123
```

After successful login, you'll be redirected to the dashboard at:
```
http://localhost:8081/member
```

---

## 📊 Compare with Next.js Web Portal

To compare side-by-side:

### 1. Start Next.js Portal

```bash
# In a new terminal
cd /Users/nitendraagarwal/opdwallet_aws/web-member
npm run dev
```

Access at: http://localhost:3001

### 2. Start RN Portal (Web)

```bash
# In another terminal
cd /Users/nitendraagarwal/opdwallet_aws/web-member-rn
npm run web
```

Access at: http://localhost:8081

### 3. Compare Side-by-Side

Open both URLs in different browser tabs/windows:
- **Tab 1:** http://localhost:3001 (Next.js)
- **Tab 2:** http://localhost:8081 (RN Web)

**Desktop (≥1024px):** Should look nearly identical!
- Same side-by-side layout
- Same 3 feature cards
- Same colors and styling
- Same responsive behavior

---

## 📱 Test on Physical Device

### iOS/Android (Physical Device)

1. Install **Expo Go** app from App Store/Play Store
2. Start the dev server:
   ```bash
   cd web-member-rn
   npm start
   ```
3. Scan the QR code shown in terminal with:
   - **iOS:** Camera app
   - **Android:** Expo Go app

4. The app will load on your device
5. Test the login with mobile layout

---

## 🐛 Troubleshooting

### Backend Not Running

If you see connection errors:

```bash
cd /Users/nitendraagarwal/opdwallet_aws
docker-compose up -d
```

Wait ~30 seconds, then check:
```bash
curl http://localhost:4000/api/health
```

Should return: `{"status":"ok"}`

### Port Already in Use

If port 8081 is busy:

```bash
# Kill the process using port 8081
lsof -ti:8081 | xargs kill -9

# Or use alternative port
npm start -- --port 19006
```

### Expo Cache Issues

Clear Expo cache:

```bash
cd web-member-rn
npx expo start --clear
```

### Module Not Found

Reinstall dependencies:

```bash
cd web-member-rn
rm -rf node_modules
npm install
```

---

## 🎨 Visual Comparison Guide

### Expected Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────┐
│  [Habit Logo]                                       │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   LOGIN FORM         │   BRAND SECTION              │
│   (Left - 50%)       │   (Right - 50%)              │
│                      │                              │
│   Welcome Member     │   [Member Illustration]      │
│                      │   Member Portal              │
│   Email: [ ]         │                              │
│   Password: [ ]      │   ┌─────────────────────┐   │
│                      │   │ OPD Coverage        │   │
│   [Sign In]          │   └─────────────────────┘   │
│                      │   ┌─────────────────────┐   │
│   Contact Support    │   │ Easy Claims         │   │
│                      │   └─────────────────────┘   │
│   Demo Credentials   │   ┌─────────────────────┐   │
│                      │   │ Family Coverage     │   │
│                      │   └─────────────────────┘   │
└──────────────────────┴──────────────────────────────┘
```

### Expected Mobile Layout (<640px)

```
┌───────────────────────┐
│  [Habit Logo]         │
├───────────────────────┤
│ BRAND SECTION (Top)   │
│                       │
│ [Member Illustration] │
│ Member Portal         │
│                       │
│ ┌───────────────────┐ │
│ │ OPD Coverage      │ │
│ └───────────────────┘ │
├───────────────────────┤
│ LOGIN FORM (Bottom)   │
│                       │
│ Welcome Member        │
│                       │
│ Email: [ ]            │
│ Password: [ ]         │
│                       │
│ [Sign In]             │
└───────────────────────┘
```

---

## 📸 Screenshot Breakpoints

Test at these exact widths:

1. **375px** - iPhone SE (Mobile)
2. **640px** - Breakpoint transition
3. **768px** - iPad (Tablet)
4. **1024px** - Breakpoint transition
5. **1280px** - Desktop
6. **1920px** - Large Desktop

---

## ✅ Success Criteria

Your responsive login is working correctly if:

1. ✅ Desktop shows side-by-side layout
2. ✅ Mobile shows vertical stacked layout
3. ✅ Feature cards: 1 on mobile, 3 on desktop
4. ✅ Text sizes scale (24px → 32px)
5. ✅ Images scale (128px → 256px)
6. ✅ Demo credentials hidden on mobile
7. ✅ Contact support link works
8. ✅ Input focus shows blue ring
9. ✅ Button hover works on web
10. ✅ Login works with demo credentials

---

## 🎯 Quick Test Commands

```bash
# Full test sequence
cd /Users/nitendraagarwal/opdwallet_aws

# 1. Start backend
docker-compose up -d

# 2. Start RN web (in new terminal)
cd web-member-rn && npm run web

# 3. Open browser
open http://localhost:8081
```

---

## 📞 Need Help?

If something doesn't work:

1. Check backend is running: `docker-compose ps`
2. Check logs: `cd web-member-rn && npm start`
3. Clear cache: `npx expo start --clear`
4. Restart: Kill terminal and run again

---

*Happy Testing! 🚀*
