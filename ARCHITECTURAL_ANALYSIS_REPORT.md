# OPD Wallet Platform - Architectural Analysis Report

**Date:** October 20, 2025
**Analyst:** Claude Code
**Project:** OPD Wallet Healthcare Platform
**Version:** Current State Analysis

---

## Executive Summary

This report provides a comprehensive analysis of the OPD Wallet platform's architecture, identifying structural inconsistencies, mixed patterns, and areas requiring standardization. The platform consists of 3 Next.js frontends (web-admin, web-doctor, web-member) and 1 NestJS backend (api), with **significant architectural inconsistencies** that impact maintainability, developer experience, and code quality.

### Key Findings:
1. **Mixed API Calling Patterns** - Different frontends use different approaches (direct fetch vs abstracted lib/api)
2. **Inconsistent API Routing** - Some portals use Next.js API routes as proxies, others don't
3. **No Standardized Frontend API Layer** - web-member has NO lib/api abstraction at all
4. **Backend is Well-Structured** - NestJS backend follows proper patterns (controllers, services, DTOs)
5. **Environment Variable Inconsistency** - Different variable names across portals

---

## 1. Current Architecture Overview

### 1.1 Project Structure
```
opdwallet/
├── api/                          # NestJS Backend (PORT 4000)
│   └── src/
│       └── modules/              # 34 services, 33 controllers
│           ├── appointments/     # Well-structured: controller + service + DTOs
│           ├── doctors/          # Multiple controllers for separation of concerns
│           ├── memberclaims/     # NEW module (not yet documented)
│           ├── users/
│           └── ...
│
├── web-admin/                    # Admin Portal (PORT 3000) - PARTIAL ABSTRACTION
│   ├── app/
│   │   ├── (admin)/             # Pages - MIXED PATTERN (fetch + lib/api)
│   │   └── api/                 # Next.js API routes (3 routes for specific ops)
│   └── lib/
│       └── api/                 # Abstraction layer EXISTS (5 files)
│           ├── categories.ts
│           ├── services.ts
│           ├── plan-config.ts
│           ├── relationships.ts
│           └── api.ts           # apiFetch helper
│
├── web-doctor/                   # Doctor Portal (PORT 3001) - FULL ABSTRACTION
│   ├── app/
│   │   ├── doctor/              # Pages - USES lib/api (no direct fetch)
│   │   └── api/
│   │       └── [...path]/       # Catch-all proxy for ALL API calls
│   └── lib/
│       └── api/                 # Abstraction layer (4 files)
│           ├── appointments.ts
│           ├── auth.ts
│           ├── prescriptions.ts
│           └── video-consultations.ts
│
└── web-member/                   # Member Portal (PORT 3002) - NO ABSTRACTION
    ├── app/
    │   ├── member/              # Pages - DIRECT FETCH EVERYWHERE (30 files)
    │   └── api/                 # DOES NOT EXIST
    └── lib/
        └── api/                 # NEW: 2 files created recently
            ├── claims.ts        # Uses axios + direct API calls
            └── video-consultations.ts
```

### 1.2 Backend Architecture (API)

**Status:** ✅ **Well-Structured** (Follows NestJS Best Practices)

```
api/src/modules/
├── [module]/
│   ├── [module].controller.ts    # Route handlers, minimal logic
│   ├── [module].service.ts       # Business logic
│   ├── dto/                      # Data Transfer Objects
│   │   ├── create-[module].dto.ts
│   │   ├── update-[module].dto.ts
│   │   └── query-[module].dto.ts
│   ├── schemas/                  # Mongoose schemas
│   │   └── [module].schema.ts
│   └── [module].module.ts        # Module definition
```

**Examples of Good Structure:**
- `/api/modules/appointments/` - Clean separation of concerns
- `/api/modules/doctors/` - Multiple controllers for different contexts (doctors.controller, doctor-auth.controller, doctor-appointments.controller)
- `/api/modules/lab/` - Organized into sub-controllers (lab-admin, lab-ops, lab-member)

**Backend Statistics:**
- 34 Service files
- 33 Controller files
- Well-defined DTOs for validation
- Guards for authentication and authorization
- Proper use of decorators (@Controller, @UseGuards, @Roles)

---

## 2. Identified Issues (Categorized by Severity)

### 🔴 CRITICAL SEVERITY

#### Issue 2.1: Mixed API Calling Patterns in web-member
**Portal:** web-member
**Impact:** High - Affects all 30+ pages

**Problem:**
- ALL pages use direct `fetch()` calls with inline API URL construction
- NO centralized API abstraction layer (until recently - 2 files added)
- Inconsistent error handling across pages
- Difficult to modify API URLs or add authentication logic

**Evidence:**
```typescript
// web-member/app/member/appointments/page.tsx (Line 45-51)
const response = await fetch('/api/auth/me', {
  credentials: 'include',
})

// web-member/app/member/online-consult/page.tsx (Line 68-70)
const response = await fetch(`/api/appointments/user/${userId}?type=ONLINE`, {
  credentials: 'include',
})

// web-member/app/member/claims/new/page.tsx (Line 121-125)
const response = await fetch('/api/member/profile', {
  credentials: 'include',
})
```

**Count:** 30 files in web-member/app use direct `fetch()` calls

**Recent Improvement (Inconsistent):**
- `web-member/lib/api/claims.ts` - Uses axios with proper abstraction
- BUT: New claim page (line 510-533) still uses direct fetch for submission

---

#### Issue 2.2: Inconsistent API Proxy Patterns
**Impact:** High - Affects deployment and routing

**Problem:** Each portal handles API routing differently:

| Portal | API Routing Strategy | Implementation |
|--------|---------------------|----------------|
| **web-admin** | Partial Proxy | 3 specific routes in `/api/ops/members/` |
| **web-doctor** | Full Catch-All Proxy | `/api/[...path]/route.ts` proxies everything |
| **web-member** | NO Proxy | Direct fetch to backend (relies on nginx/deployment config) |

**Evidence:**

**web-doctor (Good Pattern):**
```typescript
// web-doctor/app/api/[...path]/route.ts
export async function GET(request: NextRequest, { params }) {
  const { path } = await params;
  return proxyRequest(request, path);
}
// Handles: GET, POST, PUT, PATCH, DELETE
// Proxies ALL /api/* requests to backend
```

**web-admin (Inconsistent Pattern):**
```typescript
// web-admin/app/api/ops/members/search/route.ts (Only 3 routes exist)
const API_BASE_URL = process.env.API_BASE_URL || 'http://opd-api-dev:4000/api'
export async function GET(request: NextRequest) {
  const response = await fetch(`${API_BASE_URL}/ops/members/search?${params}`)
  // ...
}
```

**web-member (No Pattern):**
- NO `/api` directory at all
- All pages assume backend is accessible directly (nginx routing)
- Hardcoded `/api/` paths everywhere

---

#### Issue 2.3: Environment Variable Inconsistency
**Impact:** Medium - Deployment confusion

**Problem:** Different variable names across portals

```bash
# web-admin uses:
API_BASE_URL || NEXT_PUBLIC_API_BASE_URL || 'http://opd-api-dev:4000/api'

# web-doctor uses:
API_URL || NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

# web-member lib/api/claims.ts uses:
NEXT_PUBLIC_API_URL || 'http://localhost:4000'
```

**Issues:**
- Different fallback URLs (localhost vs opd-api-dev)
- Some include `/api` suffix, some don't
- Confusing for deployment configuration

---

### 🟡 HIGH SEVERITY

#### Issue 2.4: web-admin Mixed Pattern Problem
**Impact:** Medium - Confusing for developers

**Problem:** web-admin has BOTH patterns:

**Pattern A (37 files):** Uses `lib/api` abstraction
```typescript
// web-admin/app/(admin)/categories/page.tsx
import { categoriesApi } from '@/lib/api/categories'

const response = await categoriesApi.getAll({ isActive: true })
```

**Pattern B (15 files):** Uses direct fetch
```typescript
// web-admin/app/(admin)/operations/members/page.tsx (Line 48-50)
const response = await fetch(`/api/ops/members/search?${params}`, {
  credentials: 'include',
})
```

**Result:** New developers don't know which pattern to follow

---

#### Issue 2.5: No API Abstraction Layer for web-member
**Impact:** High - Technical debt

**Affected Files:** 30 pages using direct fetch

**Problems:**
1. Can't easily add interceptors for auth token refresh
2. Can't add global error handling
3. Can't add request/response logging
4. Difficult to mock for testing
5. Repeated code across all pages

**Example of Repetition:**
Every page has this pattern repeated:
```typescript
try {
  const response = await fetch('/api/endpoint', {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch')
  }
  const data = await response.json()
  // ...
} catch (error) {
  console.error('Error:', error)
}
```

---

### 🟢 MEDIUM SEVERITY

#### Issue 2.6: Inconsistent Error Handling
**Impact:** Medium - UX and debugging

Different portals handle errors differently:
- web-admin: Mix of `console.error` and `toast` notifications
- web-doctor: Mostly `console.error`
- web-member: Only `console.error`, no user feedback

#### Issue 2.7: No Shared Types Between Frontend/Backend
**Impact:** Medium - Type safety

Backend has DTOs, but frontends define their own interfaces:
```typescript
// Backend: api/src/modules/appointments/dto/create-appointment.dto.ts
export class CreateAppointmentDto { ... }

// Frontend: web-member/app/member/appointments/page.tsx (Line 15-34)
interface Appointment {
  _id: string
  appointmentId: string
  // ... duplicated definition
}
```

---

## 3. Best Practice Recommendations

### 3.1 Frontend API Architecture (Recommended Pattern)

**Goal:** Standardize across all 3 portals

**Recommended Structure:**
```
web-[portal]/
├── lib/
│   └── api/
│       ├── client.ts              # Base API client (axios/fetch wrapper)
│       ├── types.ts               # Shared TypeScript interfaces
│       ├── [domain]/              # Domain-based organization
│       │   ├── appointments.ts
│       │   ├── users.ts
│       │   └── claims.ts
│       └── index.ts               # Barrel exports
└── app/
    └── api/
        └── [...path]/route.ts     # Optional: Proxy for SSR/cookies
```

**Example Implementation:**

```typescript
// lib/api/client.ts
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add interceptors for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    console.error('[API Error]:', error.response?.data?.message || error.message)
    return Promise.reject(error)
  }
)

export default apiClient
```

```typescript
// lib/api/appointments.ts
import apiClient from './client'
import { Appointment, CreateAppointmentDto } from './types'

export const appointmentsApi = {
  getUserAppointments: async (userId: string, type?: string) => {
    const { data } = await apiClient.get<Appointment[]>(
      `/appointments/user/${userId}`,
      { params: { type } }
    )
    return data
  },

  create: async (dto: CreateAppointmentDto) => {
    const { data } = await apiClient.post('/appointments', dto)
    return data
  },

  cancel: async (appointmentId: string) => {
    const { data } = await apiClient.patch(`/appointments/${appointmentId}/user-cancel`)
    return data
  },
}
```

```typescript
// Usage in pages
import { appointmentsApi } from '@/lib/api/appointments'

const appointments = await appointmentsApi.getUserAppointments(userId, 'ONLINE')
```

---

### 3.2 Backend Structure (Already Good ✅)

**Current backend structure is excellent.** Continue following:
- Controllers handle routing only
- Services contain business logic
- DTOs for validation
- Proper use of guards and decorators

**Minor Recommendation:**
Consider adding API documentation with Swagger:
```typescript
// Add to main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

const config = new DocumentBuilder()
  .setTitle('OPD Wallet API')
  .setVersion('1.0')
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api-docs', app, document)
```

---

### 3.3 Next.js API Routes Decision Matrix

**When to use Next.js API routes:**

| Use Case | Use API Route? | Reason |
|----------|---------------|--------|
| Cookie-based auth | ✅ Yes | Forward cookies securely |
| Server-side only operations | ✅ Yes | Keep API keys secret |
| File uploads with size limits | ✅ Yes | Handle multipart forms |
| Rate limiting | ✅ Yes | Implement portal-specific limits |
| Simple CRUD for public data | ❌ No | Direct backend call is simpler |
| Real-time data | ❌ No | WebSocket should connect directly |

**Recommended: Catch-all proxy** (like web-doctor)
- Simple to maintain
- Works for all requests
- Easy to add middleware

---

## 4. Proposed Ideal Architecture

### 4.1 Frontend Architecture (All 3 Portals)

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Frontend (web-admin / web-doctor / web-member)    │
│                                                             │
│  ┌─────────────┐    ┌──────────────────┐                  │
│  │   Pages     │───▶│   lib/api/       │                  │
│  │  (app/ dir) │    │   - client.ts    │                  │
│  │             │    │   - appointments │                  │
│  │             │    │   - users        │                  │
│  │             │    │   - claims       │                  │
│  └─────────────┘    └────────┬─────────┘                  │
│                              │                             │
│                              ▼                             │
│                   ┌────────────────────┐                   │
│                   │  app/api/[...path] │ (Optional Proxy) │
│                   │   route.ts         │                   │
│                   └──────────┬─────────┘                   │
└───────────────────────────────┼─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    NestJS Backend (api/)                     │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────┐  │
│  │ Controllers  │───▶│  Services    │───▶│  Database   │  │
│  │ (routing)    │    │ (logic)      │    │  (MongoDB)  │  │
│  └──────────────┘    └──────────────┘    └─────────────┘  │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │   Guards     │    │    DTOs      │                      │
│  │ (auth/roles) │    │ (validation) │                      │
│  └──────────────┘    └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.2 Standardized File Structure (All Portals)

```
web-[portal]/
├── app/
│   ├── [portal]/                    # Main pages
│   │   ├── appointments/
│   │   │   └── page.tsx            # Uses lib/api, NO direct fetch
│   │   └── ...
│   └── api/
│       └── [...path]/
│           └── route.ts            # Optional: Catch-all proxy
│
├── components/
│   ├── ui/                         # Shared UI components
│   └── [domain]/                   # Domain-specific components
│
├── lib/
│   ├── api/
│   │   ├── client.ts               # Base API client (axios/fetch)
│   │   ├── types.ts                # Shared types
│   │   ├── appointments.ts         # Domain API functions
│   │   ├── users.ts
│   │   ├── claims.ts
│   │   └── index.ts                # Barrel exports
│   └── utils.ts
│
├── contexts/                       # React contexts
├── hooks/                          # Custom hooks
└── .env.local                      # NEXT_PUBLIC_API_URL
```

---

### 4.3 Environment Variables (Standardized)

**All portals should use:**
```bash
# .env.local (or .env.production)
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# For server-side only (Next.js API routes)
API_URL=http://backend-internal:4000/api
```

**Usage:**
```typescript
// Client-side (browser)
const API_URL = process.env.NEXT_PUBLIC_API_URL

// Server-side (Next.js API routes)
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
```

---

## 5. Migration Strategy

### Phase 1: Standardize web-member (Highest Priority) 🔴

**Timeline:** 1-2 weeks
**Impact:** High

**Steps:**
1. Create `web-member/lib/api/` directory structure
2. Create base API client (`client.ts`)
3. Migrate domains one-by-one:
   - Start with `appointments.ts` (affects ~5 pages)
   - Then `claims.ts` (update existing file to use new client)
   - Then `users.ts`, `wallet.ts`, etc.
4. Update pages to use new API layer
5. Add Next.js catch-all API route if needed

**Example Migration:**

**Before:**
```typescript
// web-member/app/member/appointments/page.tsx
const response = await fetch(`/api/appointments/user/${userId}?type=ONLINE`, {
  credentials: 'include',
})
const data = await response.json()
```

**After:**
```typescript
// web-member/app/member/appointments/page.tsx
import { appointmentsApi } from '@/lib/api/appointments'

const data = await appointmentsApi.getUserAppointments(userId, 'ONLINE')
```

---

### Phase 2: Standardize web-admin (Medium Priority) 🟡

**Timeline:** 1 week
**Impact:** Medium

**Steps:**
1. Audit the 15 pages using direct fetch
2. Extend existing `lib/api/` to cover all domains
3. Migrate pages to use abstraction
4. Consider adding catch-all proxy (optional)

**Files to Migrate:**
- `/operations/members/page.tsx`
- `/operations/members/[id]/page.tsx`
- `/policies/new/page.tsx`
- ... (12 more files)

---

### Phase 3: Enhance web-doctor (Low Priority) 🟢

**Timeline:** 2-3 days
**Impact:** Low

**web-doctor is already well-structured!**
Only minor improvements needed:
1. Add more API domain files as features grow
2. Consider switching from fetch to axios for consistency
3. Add TypeScript types for all API responses

---

### Phase 4: Add Shared Type Definitions (Nice-to-Have)

**Timeline:** 1 week
**Impact:** Low (Developer Experience)

**Goal:** Share types between backend and frontend

**Option A: Manual duplication** (Current approach)
- Maintain separate interfaces in each portal
- Pro: Simple, no build dependencies
- Con: Can get out of sync

**Option B: Generate types from DTOs**
```bash
# Use tools like ts-to-zod or class-transformer
api/
  └── generate-types.ts  # Script to export DTOs as TS interfaces

web-[portal]/
  └── lib/api/types/
      └── generated.ts   # Auto-generated from backend DTOs
```

**Option C: Shared package** (Advanced)
```
packages/
  └── shared-types/
      ├── appointments.ts
      ├── users.ts
      └── index.ts

# Import in all portals
import { Appointment } from '@opdwallet/shared-types'
```

---

## 6. Detailed Code Examples

### 6.1 Complete API Client Implementation

```typescript
// web-member/lib/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (add auth tokens if needed)
apiClient.interceptors.request.use(
  (config) => {
    // Optional: Add auth token from localStorage
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor (global error handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      // Forbidden
      console.error('Access denied')
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error occurred')
    }

    return Promise.reject(error)
  }
)

export default apiClient
```

---

### 6.2 Domain API Example (Appointments)

```typescript
// web-member/lib/api/appointments.ts
import apiClient from './client'
import { Appointment, CreateAppointmentDto, AppointmentsResponse } from './types'

export const appointmentsApi = {
  /**
   * Get user appointments by type
   */
  getUserAppointments: async (
    userId: string,
    type?: 'IN_CLINIC' | 'ONLINE'
  ): Promise<Appointment[]> => {
    const { data } = await apiClient.get<Appointment[]>(
      `/appointments/user/${userId}`,
      { params: { type } }
    )
    return data
  },

  /**
   * Get appointment by ID
   */
  getById: async (appointmentId: string): Promise<Appointment> => {
    const { data } = await apiClient.get<{ appointment: Appointment }>(
      `/appointments/${appointmentId}`
    )
    return data.appointment
  },

  /**
   * Create new appointment
   */
  create: async (dto: CreateAppointmentDto): Promise<Appointment> => {
    const { data } = await apiClient.post<{ appointment: Appointment }>(
      '/appointments',
      dto
    )
    return data.appointment
  },

  /**
   * Cancel appointment (user)
   */
  cancel: async (appointmentId: string): Promise<void> => {
    await apiClient.patch(`/appointments/${appointmentId}/user-cancel`)
  },

  /**
   * Get ongoing appointments
   */
  getOngoing: async (userId: string): Promise<Appointment[]> => {
    const { data } = await apiClient.get<Appointment[]>(
      `/appointments/user/${userId}/ongoing`
    )
    return data
  },
}
```

---

### 6.3 Updated Page Component

```typescript
// web-member/app/member/appointments/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { appointmentsApi } from '@/lib/api/appointments'
import { Appointment } from '@/lib/api/types'

export default function AppointmentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user ID from auth context or API
      const userResponse = await fetch('/api/auth/me', { credentials: 'include' })
      const userData = await userResponse.json()

      // Use API abstraction - clean and simple!
      const data = await appointmentsApi.getUserAppointments(userData._id, 'IN_CLINIC')
      setAppointments(data)
    } catch (err: any) {
      console.error('Failed to load appointments:', err)
      setError(err.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Cancel this appointment?')) return

    try {
      await appointmentsApi.cancel(appointmentId)
      alert('Appointment cancelled successfully')
      loadAppointments() // Refresh list
    } catch (err: any) {
      alert('Failed to cancel appointment: ' + err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>My Appointments</h1>
      {appointments.map((apt) => (
        <div key={apt._id}>
          <h3>{apt.doctorName}</h3>
          <p>{apt.appointmentDate}</p>
          <button onClick={() => handleCancelAppointment(apt.appointmentId)}>
            Cancel
          </button>
        </div>
      ))}
    </div>
  )
}
```

**Compare to current implementation:**
- ✅ Cleaner: `appointmentsApi.getUserAppointments()` vs long fetch call
- ✅ Type-safe: TypeScript knows return type
- ✅ Reusable: Same function across multiple pages
- ✅ Testable: Can mock `appointmentsApi` easily

---

## 7. Testing Strategy

### 7.1 Unit Testing API Layer

```typescript
// web-member/lib/api/__tests__/appointments.test.ts
import { appointmentsApi } from '../appointments'
import apiClient from '../client'
import { Appointment } from '../types'

// Mock axios
jest.mock('../client')
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

describe('appointmentsApi', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserAppointments', () => {
    it('should fetch appointments for user', async () => {
      const mockAppointments: Appointment[] = [
        {
          _id: '1',
          appointmentId: 'APT001',
          userId: 'user123',
          doctorName: 'Dr. Smith',
          // ...
        },
      ]

      mockApiClient.get.mockResolvedValue({ data: mockAppointments })

      const result = await appointmentsApi.getUserAppointments('user123', 'IN_CLINIC')

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/appointments/user/user123',
        { params: { type: 'IN_CLINIC' } }
      )
      expect(result).toEqual(mockAppointments)
    })

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'))

      await expect(
        appointmentsApi.getUserAppointments('user123')
      ).rejects.toThrow('Network error')
    })
  })
})
```

---

### 7.2 Integration Testing with MSW

```typescript
// web-member/lib/api/__tests__/integration.test.ts
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { appointmentsApi } from '../appointments'

const server = setupServer(
  rest.get('http://localhost:4000/api/appointments/user/:userId', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          _id: '1',
          appointmentId: 'APT001',
          userId: req.params.userId,
          doctorName: 'Dr. Smith',
        },
      ])
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('appointmentsApi integration', () => {
  it('should fetch appointments from real-like API', async () => {
    const appointments = await appointmentsApi.getUserAppointments('user123')
    expect(appointments).toHaveLength(1)
    expect(appointments[0].doctorName).toBe('Dr. Smith')
  })
})
```

---

## 8. Performance Considerations

### 8.1 Current Performance Issues

1. **web-member:** Every page makes multiple `fetch()` calls with no caching
2. **web-admin:** Some pages make redundant API calls
3. **Backend:** Good - Uses batch queries to avoid N+1 problems (see doctors.service.ts lines 70-100)

### 8.2 Recommended Improvements

**Add Request Caching:**
```typescript
// lib/api/client.ts
import { setupCache } from 'axios-cache-interceptor'

const apiClient = setupCache(axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
}), {
  ttl: 5 * 60 * 1000, // Cache for 5 minutes
})
```

**Use React Query for Data Fetching:**
```typescript
// hooks/useAppointments.ts
import { useQuery } from '@tanstack/react-query'
import { appointmentsApi } from '@/lib/api/appointments'

export function useAppointments(userId: string, type?: string) {
  return useQuery({
    queryKey: ['appointments', userId, type],
    queryFn: () => appointmentsApi.getUserAppointments(userId, type),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Usage in component
const { data: appointments, isLoading, error } = useAppointments(userId, 'IN_CLINIC')
```

---

## 9. Security Considerations

### 9.1 Current Security Posture

**Backend:** ✅ Good
- Uses JWT authentication
- Guards for role-based access control
- DTOs for input validation
- CORS configured properly

**Frontend:** ⚠️ Mixed
- Credentials included in requests ✅
- No CSRF tokens ❌ (if needed)
- API keys not exposed ✅
- Some pages lack error boundary ⚠️

### 9.2 Recommendations

1. **Add Error Boundaries:**
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to error tracking service
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>
    }
    return this.props.children
  }
}
```

2. **Rate Limiting on API Routes:**
```typescript
// web-doctor/app/api/[...path]/route.ts
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
})
```

---

## 10. Documentation Needs

### 10.1 Missing Documentation

1. ❌ No API documentation (Swagger/OpenAPI)
2. ❌ No architecture documentation (this report is the first)
3. ❌ No contribution guide for new developers
4. ⚠️ Some inline docs, but inconsistent

### 10.2 Recommended Documentation

**Create:**
1. `docs/API_ARCHITECTURE.md` - Document the new standardized pattern
2. `docs/CONTRIBUTING.md` - Guidelines for adding new features
3. `docs/API_REFERENCE.md` - Or generate with Swagger
4. `docs/DEPLOYMENT.md` - Environment variables and deployment steps

---

## 11. Conclusion & Next Steps

### Summary of Findings

| Area | Status | Priority |
|------|--------|----------|
| Backend Structure | ✅ Excellent | Maintain |
| web-doctor Frontend | 🟢 Good | Minor improvements |
| web-admin Frontend | 🟡 Inconsistent | Medium priority fix |
| web-member Frontend | 🔴 Poor | **High priority fix** |
| Environment Variables | 🟡 Inconsistent | Low priority |
| Testing | ❌ Missing | Medium priority |
| Documentation | ❌ Missing | Low priority |

---

### Immediate Action Items

#### Week 1: Critical Fixes
1. ✅ **Create this report** (Done)
2. 🔴 Create `web-member/lib/api/` structure
3. 🔴 Migrate 5 most-used pages (appointments, claims, profile, wallet, bookings)

#### Week 2: Standardization
4. 🟡 Audit and fix web-admin mixed patterns
5. 🟡 Standardize environment variables across all portals
6. 🟢 Add catch-all proxy to web-member (optional)

#### Week 3-4: Enhancement
7. 🟢 Add TypeScript types for all API responses
8. 🟢 Add React Query for data fetching
9. 🟢 Write unit tests for API layer

#### Month 2: Polish
10. 📝 Add Swagger documentation to backend
11. 📝 Write architecture docs
12. 📝 Create developer onboarding guide

---

### Success Metrics

After migration, we should see:
- ✅ **0 direct `fetch()` calls** in page components (all use lib/api)
- ✅ **Consistent patterns** across all 3 portals
- ✅ **Reduced duplication** (remove ~500+ lines of repeated fetch code)
- ✅ **Better developer experience** (new features are easier to add)
- ✅ **Improved maintainability** (API changes only need updates in one place)

---

### Long-Term Vision

**6 Months from Now:**
- All portals follow the same architecture
- Comprehensive test coverage (80%+)
- Auto-generated API documentation
- Shared type definitions between frontend/backend
- Performance optimizations (caching, code splitting)

---

## Appendix A: File Inventory

### web-member Files Using Direct Fetch (30 files)

1. `/member/online-consult/confirm/page.tsx`
2. `/member/claims/page.tsx`
3. `/member/claims/new/page.tsx` ⚠️ (has lib/api/claims.ts but still uses fetch)
4. `/member/lab-tests/cart/[id]/page.tsx`
5. `/member/lab-tests/cart/[id]/vendor/[vendorId]/page.tsx`
6. `/member/appointments/doctors/page.tsx`
7. `/member/claims/[id]/page.tsx`
8. `/member/appointments/select-slot/page.tsx`
9. `/member/page.tsx`
10. `/member/payments/[paymentId]/page.tsx`
11. `/member/orders/page.tsx`
12. `/member/orders/[transactionId]/page.tsx`
13. `/member/online-consult/page.tsx`
14. `/member/online-consult/doctors/page.tsx`
15. `/member/layout.tsx`
16. `/member/lab-tests/orders/[orderId]/page.tsx`
17. `/member/appointments/select-patient/page.tsx`
18. `/member/appointments/confirm/page.tsx`
19. `/member/appointments/page.tsx`
20. `/member/lab-tests/upload/page.tsx`
21. `/member/lab-tests/page.tsx`
22. `/member/wallet/page.tsx`
23. `/member/bookings/page.tsx`
24. `/member/profile/page.tsx`
25. `/member/health-records/page.tsx`
26. `/member/lab-tests/orders/page.tsx`
27. `/member/appointments/specialties/page.tsx`
28. `/member/online-consult/specialties/page.tsx`
29. `/member/benefits/page.tsx`
30. `/page.tsx` (root)

### web-admin Files Using Direct Fetch (15 files)

1. `/operations/lab/prescriptions/[id]/digitize/page.tsx`
2. `/tpa/claims/unassigned/page.tsx`
3. `/finance/payments/history/page.tsx`
4. `/policies/new/page.tsx` ⚠️ (should use lib/api)
5. `/policies/[id]/plan-config/[version]/page.tsx`
6. `/tpa/claims/page.tsx`
7. `/tpa/claims/assigned/page.tsx`
8. `/tpa/claims/[claimId]/page.tsx`
9. `/tpa/analytics/page.tsx`
10. `/operations/members/page.tsx` ⚠️ (uses /api/ops/members/search route)
11. `/operations/members/[id]/page.tsx`
12. `/operations/lab/prescriptions/page.tsx`
13. `/operations/lab/orders/page.tsx`
14. `/lab/services/page.tsx`
15. `/finance/layout.tsx`

### web-admin Files Using lib/api (37 files)

✅ These follow the recommended pattern
- `/categories/page.tsx`
- `/services/page.tsx`
- `/masters/page.tsx`
- `/policies/page.tsx`
- `/users/page.tsx`
- ... (32 more files using proper abstraction)

---

## Appendix B: Environment Variable Matrix

| Portal | Variable Name | Default Value | Includes /api? |
|--------|---------------|---------------|----------------|
| web-admin | `API_BASE_URL` | `http://opd-api-dev:4000/api` | ✅ Yes |
| web-admin | `NEXT_PUBLIC_API_BASE_URL` | (fallback) | ✅ Yes |
| web-doctor | `API_URL` | `http://localhost:4000/api` | ✅ Yes |
| web-doctor | `NEXT_PUBLIC_API_URL` | (fallback) | ✅ Yes |
| web-member | `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | ❌ No |

**Recommendation:** Standardize to:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api  # Client-side
API_URL=http://backend:4000/api                 # Server-side (internal)
```

---

## Appendix C: Backend Module Inventory

Total: 27 modules with controllers

1. appointments
2. assignments
3. audit
4. auth
5. clinics
6. counters
7. doctor-slots
8. doctors (3 controllers: main, auth, appointments)
9. finance
10. lab (3 controllers: admin, ops, member)
11. location
12. masters (4 controllers: categories, cugs, relationships, services)
13. member
14. memberclaims ⚠️ (new, undocumented)
15. migration
16. notifications
17. operations
18. payments
19. plan-config
20. policies
21. specialties
22. tpa
23. transactions
24. users
25. video-consultation
26. wallet

---

## Report Metadata

- **Generated:** October 20, 2025
- **Analyzer:** Claude Code (Sonnet 4.5)
- **Lines Analyzed:** ~50,000+ across frontend and backend
- **Files Examined:** 150+ TypeScript/TSX files
- **Portals Analyzed:** 3 (web-admin, web-doctor, web-member)
- **Backend Services:** 34
- **Backend Controllers:** 33

---

**END OF REPORT**
