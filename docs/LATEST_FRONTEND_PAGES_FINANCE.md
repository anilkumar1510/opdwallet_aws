# Finance Portal Frontend Pages

This document lists all frontend pages/routes in the Finance Portal (web-finance) for payment processing operations.

**Portal URL:** `/finance`
**Port (dev):** 3006
**Roles:** FINANCE_USER

**Redis Caching:** Payment completions that credit member wallets trigger automatic cache invalidation in the Member Portal. Cache invalidation occurs before member notification, ensuring correct balance display. See `REDIS_CACHING.md` and `LATEST_API_ENDPOINTS_FINANCE.md` for details.

---

## Authentication

| Path | Description |
|------|-------------|
| /login | Finance portal login page with role validation (FINANCE_USER only) |

---

## Dashboard

| Path | Description |
|------|-------------|
| /finance | Finance dashboard with payment analytics and pending payment summary |

---

## Payment Management

| Path | Description |
|------|-------------|
| /finance/payments/pending | List approved claims awaiting payment processing |
| /finance/payments/history | View completed payment history with filters |

**Redis Cache Invalidation:**
- **Payment Completion** (`/finance/payments/pending`): When finance completes payment for approved claim, member wallet is credited and `wallet:balance:{userId}` cache is invalidated. Cache invalidation happens before member notification is sent, ensuring member sees updated balance when they check portal after receiving notification. Floater wallets cascade to family members.

---

**Total Pages: 4**

**Key Features:**
- Independent authentication with `/finance` cookie path
- Streamlined payment workflow for approved claims
- Payment completion and confirmation
- Payment history tracking with search and filters
- Integration with member wallet for fund transfers
- Comprehensive payment audit trail
