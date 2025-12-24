# Finance Portal Frontend Pages

This document lists all frontend pages/routes in the Finance Portal (web-finance) for payment processing operations.

**Portal URL:** `/finance`
**Port (dev):** 3006
**Roles:** FINANCE_USER

---

## Authentication

| Path | Description |
|------|-------------|
| /finance/login | Finance portal login page with role validation (FINANCE_USER only) |

---

## Dashboard

| Path | Description |
|------|-------------|
| /finance | Finance dashboard with payment analytics and pending payment summary |

---

## Payment Management

| Path | Description |
|------|-------------|
| /finance/pending-payments | List approved claims awaiting payment processing |
| /finance/payment-history | View completed payment history with filters |

---

**Total Pages: 4**

**Key Features:**
- Independent authentication with `/finance` cookie path
- Streamlined payment workflow for approved claims
- Payment completion and confirmation
- Payment history tracking with search and filters
- Integration with member wallet for fund transfers
- Comprehensive payment audit trail
