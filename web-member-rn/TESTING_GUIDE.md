# Testing the RN Member Portal Locally

**Last verified:** July 28, 2026

All paths below are relative to the repository root. Run the commands from wherever you cloned
the repo — do not copy absolute paths out of this file.

---

## 1. Start the Backend

The RN app talks to the NestJS API on port **4000**. Either method works.

### Option A — Without Docker (Windows-friendly)

Requires MongoDB running locally on `localhost:27017`.

```bash
cd api
npm run start:dev
```

The API reads `api/.env`. For a local no-Docker setup that means:

```bash
MONGODB_URI=mongodb://localhost:27017/opd_wallet
USE_SECRETS_MANAGER=false
PORT=4000
```

Redis is optional — the API starts and serves requests without it, cache reads simply miss.

### Option B — With Docker

```bash
docker-compose up -d
```

Wait ~30 seconds for the containers to become healthy.

### Verify the backend is up

```bash
curl http://localhost:4000/api/health
```

Returns `status`, `uptime`, `environment`, a `database` field (`healthy` / `unhealthy`), and
memory usage. If `database` says `unhealthy`, Mongo is not reachable — fix that before
testing the app, since every screen will fail on data load.

---

## 2. Configure the API URL

The RN app reads `EXPO_PUBLIC_API_URL` from `web-member-rn/.env`:

```bash
EXPO_PUBLIC_API_URL=http://localhost:4000/api
EXPO_PUBLIC_SESSION_TIMEOUT_MINUTES=15
```

Use `localhost` for browser/web testing. For a **physical device** over Expo Go, `localhost`
points at the phone, so set this to your machine's LAN IP instead (for example
`http://192.168.1.20:4000/api`) and make sure the phone is on the same network.

`EXPO_PUBLIC_SESSION_TIMEOUT_MINUTES` controls the HIPAA automatic-logoff timer — lower it if
you want to test idle logout without waiting 15 minutes.

---

## 3. Start the RN App

```bash
cd web-member-rn
npx expo start --web --port 8081
```

Or run `npm start` and press `w` for web, `a` for Android, `i` for iOS.

The app serves at **http://localhost:8081**. The API already allows this origin — its
development CORS list covers ports 8081, 8082, 8083 and 19006 in addition to all six web
portals, so no backend change is needed to run Expo on an alternate port.

### Physical device

1. Install **Expo Go** from the App Store / Play Store.
2. Run `npm start` in `web-member-rn`.
3. Scan the QR code (iOS: Camera app, Android: Expo Go).
4. Confirm `EXPO_PUBLIC_API_URL` uses your LAN IP, not `localhost`.

---

## 4. Login Credentials

Login is by **email**. The API returns an httpOnly `opd_session` cookie.

| Account | Password | Notes |
|---------|----------|-------|
| `standard@gmail.com` | `User@123` | Preferred demo member — fullest seeded data |
| `john.doe@company.com` | `Member@123` | Alternate member account |

Member password hashes live in the `users` collection under `passwordHash`. Other seeded
member emails use custom passwords that are not documented — stick to the two above.

After login you land on the dashboard at `http://localhost:8081/member`.

---

## 5. Test Checklist

### Session & Auth

- [ ] Login succeeds with valid credentials
- [ ] Invalid password shows a readable error (not a crash or raw object)
- [ ] Session survives a page refresh on web
- [ ] Idle logout fires after `EXPO_PUBLIC_SESSION_TIMEOUT_MINUTES`
- [ ] Logout clears the session and returns to login

### Core Screens

- [ ] Dashboard loads wallet balance and policy cards from the API (not mock data)
- [ ] Pull-to-refresh re-fetches dashboard data
- [ ] Wallet and Transactions show real balances and history
- [ ] Profile and Health Records load
- [ ] Bookings and Carts list existing records

### Service Flows

- [ ] In-clinic consultation: specialties → doctors → patient → slot → confirm
- [ ] Online consultation: specialties → doctors → confirm
- [ ] Dental and Vision: clinics → patient → slot → confirm
- [ ] Vaccination: home → patient → vendor → slot → confirm (RN-only flow)
- [ ] Pathology Lab and Radiology/Cardiology: upload prescription, then booking
- [ ] Claims: list, detail, and new-claim submission

### Responsive (web target)

| Width | Expected |
|-------|----------|
| 375px | Vertical stack, single feature card, compact type |
| 768px | Vertical stack, three feature cards |
| ≥1024px | Side-by-side login form and brand panel |

- [ ] Layout switches cleanly at the 640px and 1024px breakpoints
- [ ] No horizontal scrollbar at any width
- [ ] Images and spacing scale rather than clip

### Error Handling

- [ ] Screens show a loading state, not a blank screen, while fetching
- [ ] API failure shows an error state with a retry affordance
- [ ] Stopping the API mid-session surfaces an error rather than hanging

---

## 6. Comparing Against the Next.js Portal

```bash
cd web-member
npm run dev
```

The web member portal runs on **port 3002** and has **no basePath**, so it is reachable at
`http://localhost:3002` directly. Open it beside `http://localhost:8081` to compare.

Note that parity is not total and is not expected to be: vaccination, notifications, the
unified cart screen and the AHC home screen exist only on RN, while settings, benefits,
family management, orders and wellness exist only on web. See
[docs/member_portal_rn/SCREENS_CHECKLIST.md](../docs/member_portal_rn/SCREENS_CHECKLIST.md)
for the current mapping.

---

## 7. Troubleshooting

**Connection errors on every screen** — the API is down or `EXPO_PUBLIC_API_URL` is wrong.
Check `curl http://localhost:4000/api/health` first.

**Works in browser, fails on phone** — `EXPO_PUBLIC_API_URL` is set to `localhost`. Change it
to your machine's LAN IP and restart Expo (env changes are read at bundle time).

**Port 8081 already in use** — start on another allowed port:

```bash
npx expo start --web --port 8082
```

**Stale bundle after changing `.env` or config** — clear the cache:

```bash
npx expo start --clear
```

**Module not found after a dependency change**

```bash
rm -rf node_modules
npm install
```

---

## Related Documentation

- [STRATEGY.md](../docs/member_portal_rn/STRATEGY.md) — why the RN portal exists and its constraints
- [COMPONENT_PATTERNS.md](../docs/member_portal_rn/COMPONENT_PATTERNS.md) — UI building blocks
- [SCREENS_CHECKLIST.md](../docs/member_portal_rn/SCREENS_CHECKLIST.md) — web/RN screen parity
- [docs/TECH_DEBT.md](../docs/TECH_DEBT.md) — known outstanding work
