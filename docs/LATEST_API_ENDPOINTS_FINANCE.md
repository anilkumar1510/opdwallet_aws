# Finance Portal API Endpoints

This document lists all API endpoints used by the Finance Portal (web-finance) for payment processing operations.

**Portal URL:** `/finance`
**Port (dev):** 3006
**Roles:** FINANCE_USER

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | User login with credentials (Finance role validation) |
| POST | /auth/logout | User logout |
| GET | /auth/me | Get current user information |

---

## Finance (Payment Processing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /finance/claims/pending | Get pending payments (approved claims) |
| GET | /finance/claims/:claimId | Get claim details for payment |
| POST | /finance/claims/:claimId/complete-payment | Complete payment for claim |
| GET | /finance/payments/history | Get payment history |
| GET | /finance/analytics/summary | Get finance analytics summary |

**Notes:**
- All endpoints require authentication (JWT token via cookie with path `/finance`)
- Access restricted to FINANCE_USER role only
- Finance portal handles the final step: processing approved claims as payments
- Payment workflow: Approved Claim → Pending Payment → Payment Completed
- Payment completion triggers notification to member
- All payment actions create audit records in transaction summary
- Integration with member wallet for fund transfers

---

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Check health status and database connectivity |

---

**Total Endpoints: 9**

**Access Control:**
- Login page validates FINANCE_USER role only
- Non-finance users are logged out immediately
- Independent session management via `/finance` cookie path
