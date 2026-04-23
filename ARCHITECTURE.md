# BookingPlatform — Multi-Tenant AI-Powered Booking System Architecture

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS (BROWSERS)                                  │
│                                                                                  │
│   Super Admin Panel    Client Admin Dashboard    Customer Storefront/Marketplace  │
└──────────┬──────────────────────┬──────────────────────────┬─────────────────────┘
           │                      │                          │
           ▼                      ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          CDN / EDGE NETWORK (Vercel / Cloudflare)                │
│                     Custom Domain Routing + SSL Termination                       │
└──────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS FRONTEND (App Router)                            │
│                                                                                  │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Super Admin  │  │ Client Admin  │  │  Marketplace │  │  Tenant Storefront  │  │
│  │   /admin/*   │  │  /dashboard/* │  │     /m/*     │  │  [subdomain]/*      │  │
│  └─────────────┘  └───────────────┘  └──────────────┘  └─────────────────────┘  │
│                                                                                  │
│  Middleware: Tenant Resolution (subdomain / custom domain / path)                │
└──────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼  (REST + WebSocket)
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (NestJS)                                   │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │   Auth Guard  │  │ Tenant Guard │  │  Rate Limiter │  │  Request Logger   │   │
│  └──────────────┘  └──────────────┘  └───────────────┘  └───────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        NESTJS BACKEND (Modular Monolith)                         │
│                                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ ┌───────────────┐  │
│  │    Auth     │ │  Tenants   │ │  Booking   │ │  Services │ │   Marketplace │  │
│  │   Module    │ │   Module   │ │   Engine   │ │   Module  │ │     Module    │  │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘ └───────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ ┌───────────────┐  │
│  │   Staff    │ │  Payments  │ │ AI Website │ │  Notifi-  │ │    Analytics  │  │
│  │   Module   │ │   Module   │ │  Builder   │ │  cations  │ │     Module    │  │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘ └───────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────────────────────────────┐ │
│  │  Domains   │ │  Reviews   │ │             Super Admin Module               │ │
│  │   Module   │ │   Module   │ │                                              │ │
│  └────────────┘ └────────────┘ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                          │
│                                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │    MongoDB       │  │     Redis         │  │         S3 / Cloudflare R2     │ │
│  │  (Primary DB)    │  │  (Cache + Queue)  │  │     (Media / AI Assets)        │ │
│  │                  │  │                   │  │                                │ │
│  │  - Tenant data   │  │  - Session cache  │  │  - Website templates           │ │
│  │  - Bookings      │  │  - Slot locks     │  │  - Uploaded images             │ │
│  │  - Users         │  │  - Rate limiting  │  │  - Generated site assets       │ │
│  │  - Services      │  │  - Pub/Sub events │  │                                │ │
│  │  - Reviews       │  │  - Leaderboard    │  │                                │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                       │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  OpenAI API  │  │   Stripe /   │  │   SendGrid / │  │   Cloudflare DNS   │  │
│  │  (AI Builder)│  │   Razorpay   │  │   Twilio     │  │   (Custom Domains) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenancy Strategy

### Approach: **Shared Database, Tenant-Isolated by `tenantId`**

Every document in MongoDB carries a `tenantId` field. All queries are scoped automatically via NestJS interceptors/guards.

```
┌─────────────────────────────────────────────┐
│              MongoDB (Single Cluster)        │
│                                              │
│  Every collection has compound indexes on:   │
│    { tenantId: 1, ...other_fields }          │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Tenant A │ │ Tenant B │ │ Tenant C │     │
│  │ data     │ │ data     │ │ data     │     │
│  │ (filtered│ │ (filtered│ │ (filtered│     │
│  │  by ID)  │ │  by ID)  │ │  by ID)  │     │
│  └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────┘
```

**Tenant Resolution Flow:**
```
Request → Middleware
  ├── Check custom domain header → lookup domains collection → get tenantId
  ├── Check subdomain (shop.bookingplatform.com) → extract slug → get tenantId
  ├── Check x-tenant-id header (API calls) → validate → get tenantId
  └── Fallback → 404 / redirect to marketplace
```

**Isolation enforcement:**
- `TenantGuard` — NestJS guard injects `tenantId` into every request context
- `TenantInterceptor` — automatically appends `tenantId` to all DB queries
- MongoDB indexes: every collection has `{ tenantId: 1, ... }` compound index
- Redis key prefix: `tenant:{tenantId}:*`

---

## 3. Role-Based Access Control (RBAC)

```
┌──────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                      │
│                                                        │
│  SUPER_ADMIN ──────────────────────────────────────── │
│    │  Full platform access, manage tenants,            │
│    │  billing, platform config, analytics              │
│    │                                                   │
│  CLIENT_ADMIN (per tenant) ────────────────────────── │
│    │  Manage own tenant: services, staff,              │
│    │  bookings, website, payments, settings             │
│    │                                                   │
│  STAFF (per tenant) ──────────────────────────────── │
│    │  View assigned bookings, manage own schedule,     │
│    │  mark attendance                                  │
│    │                                                   │
│  CUSTOMER ──────────────────────────────────────────  │
│       Browse marketplace, book services,               │
│       manage own bookings, leave reviews               │
└──────────────────────────────────────────────────────┘
```

---

## 4. Booking Engine (GameSpot-Style Logic)

### Core Concepts

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BOOKING ENGINE FLOW                              │
│                                                                     │
│  1. Service Config          2. Slot Generation        3. Booking    │
│  ┌─────────────────┐       ┌──────────────────┐      ┌──────────┐  │
│  │ Service:         │       │ Generate slots   │      │ Customer │  │
│  │  - duration: 30m │──────▶│ for selected day │─────▶│ picks a  │  │
│  │  - capacity: 3   │       │ based on:        │      │ slot     │  │
│  │  - buffer: 10m   │       │  - business hrs  │      └────┬─────┘  │
│  │  - price: $50    │       │  - staff avail   │           │        │
│  └─────────────────┘       │  - existing books │           ▼        │
│                             │  - buffer time   │      ┌──────────┐  │
│                             └──────────────────┘      │ Lock slot│  │
│                                                       │ (Redis   │  │
│  4. Slot Status Colors                                │  5 min)  │  │
│  ┌──────────────────────────────────────────┐        └────┬─────┘  │
│  │  🟢 GREEN  = Available (capacity > 0)    │             │        │
│  │  🟡 YELLOW = Filling up (capacity < 50%) │             ▼        │
│  │  🔴 RED    = Fully booked (capacity = 0) │        ┌──────────┐  │
│  │  ⚫ GREY   = Past / Blocked              │        │ Payment  │  │
│  └──────────────────────────────────────────┘        │ Process  │  │
│                                                       └────┬─────┘  │
│  5. Duration-Based Blocking                                │        │
│  ┌──────────────────────────────────────────┐             ▼        │
│  │ If service = 60 min & slot = 30 min:      │        ┌──────────┐  │
│  │   → Block 2 consecutive slots             │        │ Confirm  │  │
│  │   → Adjacent slots become unavailable     │        │ Booking  │  │
│  │ Buffer: 10 min gap between bookings       │        └──────────┘  │
│  └──────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Slot Generation Algorithm (Pseudocode)

```
function generateSlots(serviceId, staffId, date):
    service = getService(serviceId)
    staff = getStaff(staffId)
    businessHours = getBusinessHours(tenantId, date)
    existingBookings = getBookings(staffId, date)

    slots = []
    currentTime = businessHours.open

    while currentTime + service.duration <= businessHours.close:
        slot = {
            startTime: currentTime,
            endTime: currentTime + service.duration,
            capacity: service.maxCapacity,
            booked: countOverlapping(existingBookings, currentTime, service.duration),
        }

        slot.available = slot.capacity - slot.booked
        slot.status =
            slot.available == 0        → "full"
            slot.available < capacity/2 → "filling"
            else                        → "available"

        // Check duration-based blocking
        if isBlockedByAdjacentBooking(existingBookings, currentTime, service.duration, service.buffer):
            slot.status = "blocked"

        slots.push(slot)
        currentTime += slotInterval (e.g., 15 min or 30 min)

    return slots
```

### Redis Slot Locking (Prevents Double Booking)

```
LOCK:   SET tenant:{tenantId}:lock:{slotKey} {bookingId} EX 300 NX
          → Returns OK if lock acquired, NULL if already locked
UNLOCK: DEL tenant:{tenantId}:lock:{slotKey}
CHECK:  GET tenant:{tenantId}:lock:{slotKey}
```

---

## 5. Folder Structure

### Frontend (Next.js + App Router)

```
frontend/
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── app/
│   │   ├── (auth)/                        # Auth layout group
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (super-admin)/                 # Super admin panel
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── tenants/
│   │   │   │   │   ├── page.tsx           # List all tenants
│   │   │   │   │   └── [tenantId]/page.tsx
│   │   │   │   ├── billing/page.tsx
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (client-admin)/                # Client admin dashboard
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx               # Overview
│   │   │   │   ├── bookings/
│   │   │   │   │   ├── page.tsx           # All bookings
│   │   │   │   │   └── [bookingId]/page.tsx
│   │   │   │   ├── services/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [serviceId]/page.tsx
│   │   │   │   ├── staff/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [staffId]/page.tsx
│   │   │   │   ├── customers/page.tsx
│   │   │   │   ├── website-builder/page.tsx  # AI website builder
│   │   │   │   ├── reviews/page.tsx
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   ├── payments/page.tsx
│   │   │   │   └── settings/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── business-hours/page.tsx
│   │   │   │       ├── domain/page.tsx
│   │   │   │       └── branding/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (marketplace)/                 # Public marketplace
│   │   │   ├── m/
│   │   │   │   ├── page.tsx               # Browse/search
│   │   │   │   ├── category/[slug]/page.tsx
│   │   │   │   └── shop/[slug]/page.tsx   # Public shop profile
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (storefront)/                  # Tenant storefront (customer-facing)
│   │   │   ├── [tenantSlug]/
│   │   │   │   ├── page.tsx               # Landing page
│   │   │   │   ├── services/page.tsx
│   │   │   │   ├── book/
│   │   │   │   │   ├── page.tsx           # Select service
│   │   │   │   │   ├── [serviceId]/page.tsx  # Select slot
│   │   │   │   │   └── confirm/page.tsx
│   │   │   │   ├── my-bookings/page.tsx
│   │   │   │   └── reviews/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── api/                           # Next.js API routes (BFF)
│   │   │   └── [...proxy]/route.ts        # Proxy to NestJS backend
│   │   │
│   │   ├── layout.tsx                     # Root layout
│   │   ├── page.tsx                       # Landing page
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                            # ShadCN UI components
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── booking/
│   │   │   ├── slot-grid.tsx              # GameSpot-style slot display
│   │   │   ├── slot-card.tsx              # Individual slot with color
│   │   │   ├── booking-form.tsx
│   │   │   ├── booking-summary.tsx
│   │   │   ├── calendar-picker.tsx
│   │   │   └── time-slot-selector.tsx
│   │   ├── marketplace/
│   │   │   ├── shop-card.tsx
│   │   │   ├── search-filters.tsx
│   │   │   ├── location-picker.tsx
│   │   │   └── category-grid.tsx
│   │   ├── dashboard/
│   │   │   ├── stats-card.tsx
│   │   │   ├── booking-table.tsx
│   │   │   ├── revenue-chart.tsx
│   │   │   └── sidebar-nav.tsx
│   │   ├── website-builder/
│   │   │   ├── prompt-input.tsx
│   │   │   ├── template-preview.tsx
│   │   │   ├── theme-editor.tsx
│   │   │   └── section-editor.tsx
│   │   └── shared/
│   │       ├── header.tsx
│   │       ├── footer.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       └── tenant-provider.tsx
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-tenant.ts
│   │   ├── use-booking.ts
│   │   ├── use-slots.ts
│   │   └── use-debounce.ts
│   │
│   ├── lib/
│   │   ├── api-client.ts                  # Axios/fetch wrapper with tenant headers
│   │   ├── auth.ts                        # Auth helpers
│   │   ├── tenant-resolver.ts             # Resolve tenant from domain/subdomain
│   │   ├── slot-utils.ts                  # Slot color logic, formatting
│   │   ├── validators.ts                  # Zod schemas
│   │   └── utils.ts                       # cn() and misc utilities
│   │
│   ├── stores/                            # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── tenant-store.ts
│   │   ├── booking-store.ts
│   │   └── cart-store.ts
│   │
│   ├── types/
│   │   ├── booking.ts
│   │   ├── tenant.ts
│   │   ├── user.ts
│   │   ├── service.ts
│   │   ├── slot.ts
│   │   └── api.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   └── middleware.ts                       # Tenant resolution middleware
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

### Backend (NestJS)

```
backend/
├── src/
│   ├── main.ts                             # Bootstrap + global pipes/filters
│   ├── app.module.ts                       # Root module
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── tenant.decorator.ts         # @CurrentTenant()
│   │   │   ├── roles.decorator.ts          # @Roles(Role.CLIENT_ADMIN)
│   │   │   └── public.decorator.ts         # @Public() skip auth
│   │   ├── guards/
│   │   │   ├── auth.guard.ts               # JWT validation
│   │   │   ├── roles.guard.ts              # RBAC enforcement
│   │   │   └── tenant.guard.ts             # Tenant resolution + injection
│   │   ├── interceptors/
│   │   │   ├── tenant.interceptor.ts       # Auto-append tenantId to queries
│   │   │   ├── transform.interceptor.ts    # Response transformation
│   │   │   └── logging.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── middleware/
│   │   │   ├── tenant-resolver.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── interfaces/
│   │   │   ├── tenant-context.interface.ts
│   │   │   └── paginated.interface.ts
│   │   └── utils/
│   │       ├── slot-generator.util.ts      # Core slot generation logic
│   │       ├── date.util.ts
│   │       └── crypto.util.ts
│   │
│   ├── config/
│   │   ├── configuration.ts                # Env config loader
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── jwt.config.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── local.strategy.ts
│   │   │   │   └── google.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   │
│   │   ├── tenants/
│   │   │   ├── tenants.module.ts
│   │   │   ├── tenants.controller.ts
│   │   │   ├── tenants.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── tenant.schema.ts
│   │   │   └── dto/
│   │   │       ├── create-tenant.dto.ts
│   │   │       └── update-tenant.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── user.schema.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── services/
│   │   │   ├── services.module.ts
│   │   │   ├── services.controller.ts
│   │   │   ├── services.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── service.schema.ts
│   │   │   └── dto/
│   │   │       ├── create-service.dto.ts
│   │   │       └── update-service.dto.ts
│   │   │
│   │   ├── bookings/
│   │   │   ├── bookings.module.ts
│   │   │   ├── bookings.controller.ts
│   │   │   ├── bookings.service.ts
│   │   │   ├── slot-engine.service.ts      # Core: slot generation + locking
│   │   │   ├── schemas/
│   │   │   │   └── booking.schema.ts
│   │   │   └── dto/
│   │   │       ├── create-booking.dto.ts
│   │   │       ├── cancel-booking.dto.ts
│   │   │       └── slot-query.dto.ts
│   │   │
│   │   ├── staff/
│   │   │   ├── staff.module.ts
│   │   │   ├── staff.controller.ts
│   │   │   ├── staff.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── staff.schema.ts
│   │   │   └── dto/
│   │   │       ├── create-staff.dto.ts
│   │   │       └── update-staff.dto.ts
│   │   │
│   │   ├── marketplace/
│   │   │   ├── marketplace.module.ts
│   │   │   ├── marketplace.controller.ts
│   │   │   ├── marketplace.service.ts
│   │   │   └── dto/
│   │   │       └── search-query.dto.ts
│   │   │
│   │   ├── ai-website-builder/
│   │   │   ├── ai-builder.module.ts
│   │   │   ├── ai-builder.controller.ts
│   │   │   ├── ai-builder.service.ts
│   │   │   ├── prompt-engine.service.ts    # Prompt templates + LLM calls
│   │   │   ├── schemas/
│   │   │   │   └── website-config.schema.ts
│   │   │   └── dto/
│   │   │       ├── generate-site.dto.ts
│   │   │       └── update-site.dto.ts
│   │   │
│   │   ├── domains/
│   │   │   ├── domains.module.ts
│   │   │   ├── domains.controller.ts
│   │   │   ├── domains.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── domain.schema.ts
│   │   │   └── dto/
│   │   │       └── add-domain.dto.ts
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── payment.schema.ts
│   │   │   └── dto/
│   │   │       └── create-payment.dto.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── channels/
│   │   │   │   ├── email.channel.ts
│   │   │   │   ├── sms.channel.ts
│   │   │   │   └── push.channel.ts
│   │   │   └── templates/
│   │   │       ├── booking-confirmed.ts
│   │   │       ├── booking-cancelled.ts
│   │   │       └── booking-reminder.ts
│   │   │
│   │   ├── reviews/
│   │   │   ├── reviews.module.ts
│   │   │   ├── reviews.controller.ts
│   │   │   ├── reviews.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── review.schema.ts
│   │   │   └── dto/
│   │   │       └── create-review.dto.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   └── super-admin/
│   │       ├── super-admin.module.ts
│   │       ├── super-admin.controller.ts
│   │       └── super-admin.service.ts
│   │
│   └── database/
│       ├── database.module.ts
│       ├── redis.module.ts
│       └── seeders/
│           ├── seed.ts
│           └── tenant-seeder.ts
│
├── test/
│   ├── e2e/
│   │   ├── auth.e2e-spec.ts
│   │   ├── bookings.e2e-spec.ts
│   │   └── tenants.e2e-spec.ts
│   └── unit/
│       ├── slot-engine.spec.ts
│       └── tenant-guard.spec.ts
│
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── .env
└── docker-compose.yml                      # MongoDB + Redis
```

---

## 6. Data Flow Diagrams

### 6.1 Customer Booking Flow

```
Customer                   Next.js Frontend              NestJS Backend                  MongoDB            Redis
   │                            │                              │                           │                 │
   │  1. Select service         │                              │                           │                 │
   │ ─────────────────────────▶ │                              │                           │                 │
   │                            │  2. GET /slots?              │                           │                 │
   │                            │     serviceId&date&staffId   │                           │                 │
   │                            │ ────────────────────────────▶│                           │                 │
   │                            │                              │  3. Fetch service config   │                 │
   │                            │                              │ ─────────────────────────▶ │                 │
   │                            │                              │  4. Fetch staff schedule   │                 │
   │                            │                              │ ─────────────────────────▶ │                 │
   │                            │                              │  5. Fetch existing bookings│                 │
   │                            │                              │ ─────────────────────────▶ │                 │
   │                            │                              │                           │                 │
   │                            │                              │  6. Check slot locks       │                 │
   │                            │                              │ ────────────────────────────────────────────▶│
   │                            │                              │                           │                 │
   │                            │                              │  7. Generate slots with    │                 │
   │                            │                              │     capacity + colors      │                 │
   │                            │  8. Return slot grid         │                           │                 │
   │                            │ ◀────────────────────────────│                           │                 │
   │  9. Display color-coded    │                              │                           │                 │
   │     slot grid              │                              │                           │                 │
   │ ◀─────────────────────────│                              │                           │                 │
   │                            │                              │                           │                 │
   │  10. Pick a GREEN slot     │                              │                           │                 │
   │ ─────────────────────────▶ │                              │                           │                 │
   │                            │  11. POST /bookings/lock     │                           │                 │
   │                            │ ────────────────────────────▶│                           │                 │
   │                            │                              │  12. SET lock (5min TTL)   │                 │
   │                            │                              │ ────────────────────────────────────────────▶│
   │                            │                              │  13. Lock acquired ✓       │                 │
   │                            │  14. Slot locked for you     │ ◀───────────────────────────────────────────│
   │ ◀─────────────────────────│ ◀────────────────────────────│                           │                 │
   │                            │                              │                           │                 │
   │  15. Confirm + Pay         │                              │                           │                 │
   │ ─────────────────────────▶ │                              │                           │                 │
   │                            │  16. POST /bookings/confirm  │                           │                 │
   │                            │ ────────────────────────────▶│                           │                 │
   │                            │                              │  17. Verify lock exists    │                 │
   │                            │                              │ ────────────────────────────────────────────▶│
   │                            │                              │  18. Process payment       │                 │
   │                            │                              │  19. Create booking doc    │                 │
   │                            │                              │ ─────────────────────────▶ │                 │
   │                            │                              │  20. Release lock          │                 │
   │                            │                              │ ────────────────────────────────────────────▶│
   │                            │                              │  21. Send notifications    │                 │
   │                            │  22. Booking confirmed!      │                           │                 │
   │ ◀─────────────────────────│ ◀────────────────────────────│                           │                 │
   │                            │                              │                           │                 │
```

### 6.2 Tenant Onboarding Flow

```
Business Owner         Next.js              NestJS Backend          MongoDB          AI Service
     │                    │                       │                    │                  │
     │  1. Register       │                       │                    │                  │
     │ ──────────────────▶│                       │                    │                  │
     │                    │  2. POST /auth/register│                   │                  │
     │                    │  (role: CLIENT_ADMIN)  │                   │                  │
     │                    │ ──────────────────────▶│                   │                  │
     │                    │                       │  3. Create user    │                  │
     │                    │                       │ ──────────────────▶│                  │
     │                    │                       │  4. Create tenant  │                  │
     │                    │                       │  (slug, defaults)  │                  │
     │                    │                       │ ──────────────────▶│                  │
     │                    │  5. Tenant created     │                   │                  │
     │ ◀─────────────────│ ◀──────────────────────│                   │                  │
     │                    │                       │                    │                  │
     │  6. Setup wizard:  │                       │                    │                  │
     │  - Business info   │                       │                    │                  │
     │  - Category        │                       │                    │                  │
     │  - Location        │                       │                    │                  │
     │  - Business hours  │                       │                    │                  │
     │ ──────────────────▶│                       │                    │                  │
     │                    │  7. PUT /tenants/setup │                   │                  │
     │                    │ ──────────────────────▶│                   │                  │
     │                    │                       │  8. Update tenant  │                  │
     │                    │                       │ ──────────────────▶│                  │
     │                    │                       │                    │                  │
     │  9. "Build my site"│                       │                    │                  │
     │  prompt: "Modern   │                       │                    │                  │
     │  barber shop"      │                       │                    │                  │
     │ ──────────────────▶│                       │                    │                  │
     │                    │ 10. POST /ai-builder   │                   │                  │
     │                    │     /generate          │                   │                  │
     │                    │ ──────────────────────▶│                   │                  │
     │                    │                       │ 11. Call LLM ──────────────────────▶ │
     │                    │                       │                    │  12. Generate    │
     │                    │                       │                    │  theme + layout  │
     │                    │                       │ 13. Save config ◀──────────────────── │
     │                    │                       │ ──────────────────▶│                  │
     │                    │ 14. Preview site       │                   │                  │
     │ ◀─────────────────│ ◀──────────────────────│                   │                  │
     │                    │                       │                    │                  │
     │  15. Publish!      │                       │                    │                  │
     │ ──────────────────▶│ → Site live at         │                   │                  │
     │                    │   shop.bookingplatform.com                 │                  │
```

### 6.3 Marketplace Discovery Flow

```
Customer                Next.js Frontend              NestJS Backend              MongoDB
   │                         │                              │                        │
   │  1. Open marketplace    │                              │                        │
   │ ──────────────────────▶ │                              │                        │
   │                         │  2. GET /marketplace/search  │                        │
   │                         │     ?lat=X&lng=Y&radius=10km│                        │
   │                         │     &category=salon          │                        │
   │                         │ ────────────────────────────▶│                        │
   │                         │                              │  3. Geo query:         │
   │                         │                              │  tenants.find({        │
   │                         │                              │    location: {         │
   │                         │                              │      $near: {          │
   │                         │                              │        $geometry: {    │
   │                         │                              │          type: "Point",│
   │                         │                              │          coordinates:  │
   │                         │                              │          [lng, lat]    │
   │                         │                              │        },              │
   │                         │                              │        $maxDistance:   │
   │                         │                              │          10000         │
   │                         │                              │      }                 │
   │                         │                              │    },                  │
   │                         │                              │    category: "salon",  │
   │                         │                              │    isPublished: true   │
   │                         │                              │  })                    │
   │                         │                              │ ──────────────────────▶│
   │                         │                              │  4. Return matched     │
   │                         │  5. Shop cards with          │     tenants + ratings  │
   │  6. Browse results      │     distance, rating, etc.   │ ◀──────────────────────│
   │ ◀──────────────────────│ ◀────────────────────────────│                        │
   │                         │                              │                        │
   │  7. Click shop          │                              │                        │
   │ ──────────────────────▶ │  8. Redirect to tenant       │                        │
   │                         │     storefront               │                        │
   │ ◀──────────────────────│     shop.bookingplatform.com  │                        │
```

### 6.4 Custom Domain Resolution Flow

```
Browser                CDN/Edge              Next.js Middleware         NestJS           MongoDB
   │                     │                        │                      │                 │
   │ GET mybarbershop.com│                        │                      │                 │
   │ ───────────────────▶│                        │                      │                 │
   │                     │  SSL terminated         │                      │                 │
   │                     │  Forward to Next.js     │                      │                 │
   │                     │ ──────────────────────▶ │                      │                 │
   │                     │                        │  Extract hostname     │                 │
   │                     │                        │  "mybarbershop.com"   │                 │
   │                     │                        │                      │                 │
   │                     │                        │  Lookup domain ──────▶│                 │
   │                     │                        │  GET /domains/resolve │                 │
   │                     │                        │  ?domain=mybarbershop │                 │
   │                     │                        │  .com                 │                 │
   │                     │                        │                      │ Query domains    │
   │                     │                        │                      │ collection       │
   │                     │                        │                      │ ───────────────▶ │
   │                     │                        │                      │ Return tenantId  │
   │                     │                        │                      │ ◀─────────────── │
   │                     │                        │  Set tenantId in     │                 │
   │                     │                        │  request context     │                 │
   │                     │                        │  Rewrite to          │                 │
   │                     │                        │  /[tenantSlug]/*     │                 │
   │                     │                        │                      │                 │
   │  Render storefront  │                        │                      │                 │
   │ ◀──────────────────│ ◀──────────────────────│                      │                 │
```

---

## 7. Module Breakdown

### 7.1 Auth Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Authentication & authorization for all user types |
| **Endpoints** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/google`, `POST /auth/logout` |
| **Auth** | JWT access + refresh tokens, Google OAuth |
| **Key Logic** | Registration creates user + tenant (for CLIENT_ADMIN), password hashing with bcrypt, refresh token rotation |
| **Guards** | `JwtAuthGuard`, `RolesGuard` |

### 7.2 Tenants Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Tenant CRUD, onboarding, configuration |
| **Schema Fields** | `tenantId`, `name`, `slug`, `category`, `location` (GeoJSON), `businessHours`, `branding`, `plan`, `isPublished` |
| **Endpoints** | `POST /tenants`, `GET /tenants/:id`, `PUT /tenants/:id`, `PUT /tenants/:id/setup`, `DELETE /tenants/:id` |
| **Key Logic** | Slug uniqueness, geo-indexing for marketplace, plan management |
| **Indexes** | `{ slug: 1 }` unique, `{ location: "2dsphere" }`, `{ category: 1, isPublished: 1 }` |

### 7.3 Services Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Manage bookable services per tenant |
| **Schema Fields** | `tenantId`, `name`, `description`, `duration` (minutes), `bufferTime`, `maxCapacity`, `price`, `currency`, `staffIds`, `isActive` |
| **Endpoints** | `POST /services`, `GET /services`, `GET /services/:id`, `PUT /services/:id`, `DELETE /services/:id` |
| **Key Logic** | Duration determines slot blocking, capacity determines how many concurrent bookings per slot |

### 7.4 Bookings Module (Core — Booking Engine)
| Aspect | Detail |
|--------|--------|
| **Purpose** | Slot generation, slot locking, booking creation, cancellation |
| **Schema Fields** | `tenantId`, `serviceId`, `staffId`, `customerId`, `date`, `startTime`, `endTime`, `status` (pending/confirmed/cancelled/completed/no-show), `paymentId`, `notes` |
| **Endpoints** | `GET /bookings/slots` (generate & return slots), `POST /bookings/lock` (Redis lock), `POST /bookings` (create), `PUT /bookings/:id/cancel`, `GET /bookings` (list), `GET /bookings/:id` |
| **Sub-Service** | `SlotEngineService` — core GameSpot logic |
| **Key Logic** | Duration-based blocking, capacity tracking, buffer enforcement, Redis-based optimistic locking with 5-min TTL, color-coded slot status |
| **Indexes** | `{ tenantId: 1, staffId: 1, date: 1, startTime: 1 }` compound |

### 7.5 Staff Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Manage staff members per tenant |
| **Schema Fields** | `tenantId`, `userId`, `name`, `email`, `serviceIds`, `workingHours` (per day), `breaks`, `isActive` |
| **Endpoints** | `POST /staff`, `GET /staff`, `PUT /staff/:id`, `DELETE /staff/:id`, `GET /staff/:id/schedule` |
| **Key Logic** | Staff availability affects slot generation, staff can be assigned to multiple services |

### 7.6 Marketplace Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Public discovery of tenants by location and category |
| **Endpoints** | `GET /marketplace/search` (geo + category + text), `GET /marketplace/categories`, `GET /marketplace/featured`, `GET /marketplace/shop/:slug` |
| **Key Logic** | MongoDB `$near` geo queries, text search, pagination, sorting (distance/rating/popularity) |
| **Public** | No auth required |

### 7.7 AI Website Builder Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Generate and customize tenant storefronts using AI |
| **Schema Fields** | `tenantId`, `prompt`, `theme` (colors, fonts, layout), `sections` (hero, services, testimonials, contact, etc.), `customCSS`, `status` (draft/published) |
| **Endpoints** | `POST /website-config` (create via template or AI), `POST /website-config/regenerate` (AI regen), `GET /website-config` (admin), `GET /website-config/public`, `PUT /website-config/theme`, `PUT /website-config/layout`, `PUT /website-config/sections`, `PUT /website-config/seo`, `PUT /website-config/custom-code` |
| **AI Service** | `AiWebsiteService` — calls Claude Haiku with structured JSON prompt, validates response, falls back to template-based `generateWebsiteConfig()` on any failure |
| **Template System** | `ai-website-generator.ts` — 8 business profiles (gaming, salon, fitness, restaurant, medical, education, photography, default) × 8 design presets (modern, elegant, bold, minimal, playful, dark, warm, corporate) |
| **Key Logic** | Input (business type + design style + description) → Claude Haiku → structured JSON config → rendered by Next.js dynamic template engine. Clients can regenerate or manually tweak individual sections. Fallback ensures generation always succeeds even without API key. |

### 7.8 Domains Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Custom domain management per tenant |
| **Schema Fields** | `tenantId`, `domain`, `isVerified`, `verificationToken`, `sslStatus` |
| **Endpoints** | `POST /domains`, `GET /domains/verify/:id`, `DELETE /domains/:id`, `GET /domains/resolve` (internal) |
| **Key Logic** | DNS verification via TXT record, Cloudflare API for SSL provisioning, domain → tenantId lookup cached in Redis |

### 7.9 Payments Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Payment processing for bookings |
| **Schema Fields** | `tenantId`, `bookingId`, `customerId`, `amount`, `currency`, `provider` (stripe/razorpay), `status`, `providerPaymentId`, `refundId` |
| **Endpoints** | `POST /payments/intent`, `POST /payments/webhook`, `POST /payments/:id/refund` |
| **Key Logic** | Each tenant connects their own Stripe/Razorpay account (platform takes commission), webhook verification, idempotent processing |

### 7.10 Notifications Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Multi-channel notifications |
| **Channels** | Email (SendGrid), SMS (Twilio), Push (Web Push) |
| **Triggers** | Booking confirmed, cancelled, reminder (1hr before), no-show, review request |
| **Key Logic** | Template-based, tenant-branded, queued via Redis Bull for async processing |

### 7.11 Reviews Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Customer reviews per tenant/service |
| **Schema Fields** | `tenantId`, `bookingId`, `customerId`, `serviceId`, `rating` (1-5), `comment`, `reply` (by business), `isVisible` |
| **Endpoints** | `POST /reviews` (customer), `GET /reviews/tenant/:id` (public), `GET /reviews/dashboard` (admin), `POST /reviews/:id/reply` (admin), `PATCH /reviews/:id/visibility` (admin), `DELETE /reviews/:id` (super admin) |
| **Key Logic** | Only completed bookings can be reviewed (one per booking), aggregate rating recalculated on tenant doc, business owners can reply and toggle visibility |

### 7.12 Analytics Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Dashboard stats for client admins + super admin |
| **Endpoints** | `GET /analytics/dashboard` (summary), `GET /analytics/bookings` (trends), `GET /analytics/revenue`, `GET /analytics/popular-services` |
| **Key Logic** | MongoDB aggregation pipelines, date range filtering, cached in Redis (TTL 5 min) |

### 7.13 Super Admin Module
| Aspect | Detail |
|--------|--------|
| **Purpose** | Platform-wide management |
| **Endpoints** | `GET /super-admin/tenants`, `PUT /super-admin/tenants/:id/suspend`, `GET /super-admin/stats`, `PUT /super-admin/config` |
| **Key Logic** | Platform revenue, tenant management, feature flags, system health |

---

## 8. MongoDB Schema Overview

### Key Collections & Indexes

```
┌─────────────────────────────────────────────────┐
│  tenants                                         │
│  ├── _id: ObjectId                               │
│  ├── name: String                                │
│  ├── slug: String (unique)                       │
│  ├── ownerId: ObjectId → users                   │
│  ├── category: String                            │
│  ├── description: String                         │
│  ├── location: {                                 │
│  │     type: "Point",                            │
│  │     coordinates: [lng, lat]                   │
│  │   }                                           │
│  ├── address: { street, city, state, zip, country}│
│  ├── businessHours: [{                           │
│  │     day: Number (0-6),                        │
│  │     open: String "09:00",                     │
│  │     close: String "18:00",                    │
│  │     isClosed: Boolean                         │
│  │   }]                                          │
│  ├── branding: { logo, primaryColor, ... }       │
│  ├── plan: "free" | "pro" | "enterprise"         │
│  ├── isPublished: Boolean                        │
│  ├── rating: { average: Number, count: Number }  │
│  ├── createdAt, updatedAt                        │
│  │                                               │
│  INDEXES:                                        │
│    { slug: 1 } unique                            │
│    { location: "2dsphere" }                      │
│    { category: 1, isPublished: 1 }               │
│    { ownerId: 1 }                                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  users                                           │
│  ├── _id: ObjectId                               │
│  ├── email: String (unique)                      │
│  ├── passwordHash: String                        │
│  ├── name: String                                │
│  ├── phone: String                               │
│  ├── role: "super_admin"|"client_admin"|"staff"  │
│  │         |"customer"                           │
│  ├── tenantId: ObjectId (null for super_admin    │
│  │   and customers)                              │
│  ├── googleId: String                            │
│  ├── avatar: String                              │
│  ├── isActive: Boolean                           │
│  ├── createdAt, updatedAt                        │
│  │                                               │
│  INDEXES:                                        │
│    { email: 1 } unique                           │
│    { tenantId: 1, role: 1 }                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  services                                        │
│  ├── _id: ObjectId                               │
│  ├── tenantId: ObjectId → tenants                │
│  ├── name: String                                │
│  ├── description: String                         │
│  ├── duration: Number (minutes)                  │
│  ├── bufferTime: Number (minutes)                │
│  ├── maxCapacity: Number                         │
│  ├── price: Number                               │
│  ├── currency: String                            │
│  ├── staffIds: [ObjectId] → staff                │
│  ├── category: String                            │
│  ├── images: [String]                            │
│  ├── isActive: Boolean                           │
│  ├── createdAt, updatedAt                        │
│  │                                               │
│  INDEXES:                                        │
│    { tenantId: 1, isActive: 1 }                  │
│    { tenantId: 1, category: 1 }                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  bookings                                        │
│  ├── _id: ObjectId                               │
│  ├── tenantId: ObjectId → tenants                │
│  ├── serviceId: ObjectId → services              │
│  ├── staffId: ObjectId → staff                   │
│  ├── customerId: ObjectId → users                │
│  ├── date: Date (day only)                       │
│  ├── startTime: String "10:30"                   │
│  ├── endTime: String "11:00"                     │
│  ├── status: "pending"|"confirmed"|"cancelled"   │
│  │           |"completed"|"no_show"              │
│  ├── paymentId: ObjectId → payments              │
│  ├── notes: String                               │
│  ├── cancellationReason: String                  │
│  ├── createdAt, updatedAt                        │
│  │                                               │
│  INDEXES:                                        │
│    { tenantId: 1, date: 1, staffId: 1 }          │
│    { tenantId: 1, customerId: 1 }                │
│    { tenantId: 1, status: 1 }                    │
│    { tenantId: 1, date: 1, startTime: 1,         │
│      staffId: 1 } unique (prevents duplicates)   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  staff                                           │
│  ├── _id: ObjectId                               │
│  ├── tenantId: ObjectId → tenants                │
│  ├── userId: ObjectId → users                    │
│  ├── name: String                                │
│  ├── email: String                               │
│  ├── phone: String                               │
│  ├── serviceIds: [ObjectId] → services           │
│  ├── workingHours: [{                            │
│  │     day: Number,                              │
│  │     start: String, end: String,               │
│  │     breaks: [{ start, end }]                  │
│  │   }]                                          │
│  ├── isActive: Boolean                           │
│  ├── createdAt, updatedAt                        │
│  │                                               │
│  INDEXES:                                        │
│    { tenantId: 1, isActive: 1 }                  │
│    { tenantId: 1, serviceIds: 1 }                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  domains                                         │
│  ├── _id: ObjectId                               │
│  ├── tenantId: ObjectId → tenants                │
│  ├── domain: String (unique)                     │
│  ├── isVerified: Boolean                         │
│  ├── verificationToken: String                   │
│  ├── sslStatus: "pending"|"active"|"failed"      │
│  ├── createdAt, updatedAt                        │
│  │                                               │
│  INDEXES:                                        │
│    { domain: 1 } unique                          │
│    { tenantId: 1 }                               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  website_configs                                 │
│  ├── _id: ObjectId                               │
│  ├── tenantId: ObjectId → tenants (unique)       │
│  ├── prompt: String (original user prompt)       │
│  ├── theme: {                                    │
│  │     primaryColor, secondaryColor,             │
│  │     fontFamily, borderRadius, mode            │
│  │   }                                           │
│  ├── sections: [{                                │
│  │     type: "hero"|"services"|"testimonials"    │
│  │           |"about"|"contact"|"gallery",       │
│  │     order: Number,                            │
│  │     config: Object (section-specific)         │
│  │   }]                                          │
│  ├── seo: { title, description, ogImage }        │
│  ├── status: "draft"|"published"                 │
│  ├── createdAt, updatedAt                        │
│  │                                               │
│  INDEXES:                                        │
│    { tenantId: 1 } unique                        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  payments                                        │
│  ├── _id: ObjectId                               │
│  ├── tenantId: ObjectId                          │
│  ├── bookingId: ObjectId → bookings              │
│  ├── customerId: ObjectId → users                │
│  ├── amount: Number                              │
│  ├── currency: String                            │
│  ├── provider: "stripe"|"razorpay"               │
│  ├── providerPaymentId: String                   │
│  ├── status: "pending"|"succeeded"|"failed"      │
│  │           |"refunded"                         │
│  ├── refundId: String                            │
│  ├── createdAt, updatedAt                        │
│  │                                               │
│  INDEXES:                                        │
│    { tenantId: 1, status: 1 }                    │
│    { providerPaymentId: 1 } unique               │
│    { bookingId: 1 }                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  reviews                                         │
│  ├── _id: ObjectId                               │
│  ├── tenantId: ObjectId                          │
│  ├── bookingId: ObjectId → bookings (unique)     │
│  ├── customerId: ObjectId → users                │
│  ├── serviceId: ObjectId → services              │
│  ├── rating: Number (1-5)                        │
│  ├── comment: String                             │
│  ├── reply: { text: String, repliedAt: Date }    │
│  ├── createdAt, updatedAt                        │
│  │                                               │
│  INDEXES:                                        │
│    { tenantId: 1, serviceId: 1 }                 │
│    { bookingId: 1 } unique                       │
│    { customerId: 1 }                             │
└─────────────────────────────────────────────────┘
```

---

## 9. Redis Key Structure

```
# Slot Locking (prevents double booking)
tenant:{tenantId}:lock:{staffId}:{date}:{startTime}  → bookingId (TTL: 300s)

# Domain Resolution Cache
domain:{domainName}  → tenantId (TTL: 3600s)

# Session Cache
session:{userId}  → JSON user + tenant context (TTL: 86400s)

# Rate Limiting
ratelimit:{ip}:{endpoint}  → count (TTL: 60s)

# Slot Cache (short-lived)
tenant:{tenantId}:slots:{serviceId}:{staffId}:{date}  → JSON slots (TTL: 30s)

# Analytics Cache
tenant:{tenantId}:analytics:{type}  → JSON data (TTL: 300s)

# Notification Queue (Bull/BullMQ)
bull:notifications:{jobId}  → managed by Bull
```

---

## 10. AI Website Builder — Design

```
┌──────────────────────────────────────────────────────────────┐
│                     AI WEBSITE BUILDER FLOW                    │
│                                                                │
│  Client Admin Input                                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  "I want a modern dark-themed barber shop website with    │ │
│  │   a hero section, service list, and booking button"       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                         │                                      │
│                         ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  PromptEngineService                                      │ │
│  │  1. Enrich prompt with tenant context (category, name)    │ │
│  │  2. System prompt: "You are a website design AI.           │ │
│  │     Output JSON matching WebsiteConfig schema..."          │ │
│  │  3. Call OpenAI API (GPT-4) with structured output         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                         │                                      │
│                         ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  AI Output (structured JSON):                             │ │
│  │  {                                                        │ │
│  │    theme: { primary: "#1a1a2e", font: "Inter", ... },     │ │
│  │    sections: [                                            │ │
│  │      { type: "hero", config: { headline: "...", ... }},   │ │
│  │      { type: "services", config: { layout: "grid" }},     │ │
│  │      { type: "testimonials", config: { ... }},            │ │
│  │      { type: "contact", config: { showMap: true }}        │ │
│  │    ],                                                     │ │
│  │    seo: { title: "...", description: "..." }              │ │
│  │  }                                                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                         │                                      │
│                         ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Next.js Dynamic Renderer                                 │ │
│  │  - Maps section types → React components                  │ │
│  │  - Applies theme via CSS variables / Tailwind config      │ │
│  │  - Client can drag-reorder, edit text, swap images        │ │
│  │  - Publish → marks config as "published"                  │ │
│  │  - Stores in website_configs collection                   │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Custom Domain Support — Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    CUSTOM DOMAIN SETUP                          │
│                                                                 │
│  Step 1: Client adds domain "mybarbershop.com"                  │
│    → Backend generates verification TXT record                  │
│    → Client adds TXT record to their DNS                        │
│                                                                 │
│  Step 2: Client clicks "Verify"                                 │
│    → Backend queries DNS for TXT record                         │
│    → If match → mark as verified                                │
│                                                                 │
│  Step 3: Client adds CNAME record                               │
│    → mybarbershop.com CNAME → proxy.bookingplatform.com         │
│                                                                 │
│  Step 4: SSL provisioning                                       │
│    → Cloudflare/Let's Encrypt issues certificate                │
│    → Backend updates sslStatus → "active"                       │
│                                                                 │
│  Runtime Resolution:                                            │
│    → Request hits edge → hostname extracted                     │
│    → Redis cache check → domain:mybarbershop.com → tenantId     │
│    → If miss → MongoDB lookup → cache result                    │
│    → Next.js middleware rewrites to tenant storefront            │
└───────────────────────────────────────────────────────────────┘
```

---

## 12. Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     PRODUCTION DEPLOYMENT                       │
│                                                                  │
│  ┌──────────────┐     ┌──────────────────────────────────────┐  │
│  │   Vercel      │     │          Railway / AWS ECS           │  │
│  │   (Frontend)  │     │          (Backend)                   │  │
│  │               │     │                                      │  │
│  │  Next.js App  │────▶│  NestJS API (2+ replicas)            │  │
│  │  Edge Funcs   │     │  Bull Workers (notifications)        │  │
│  │  Middleware    │     │                                      │  │
│  └──────────────┘     └──────────────┬───────────────────────┘  │
│                                       │                          │
│                          ┌────────────┴────────────┐             │
│                          │                         │             │
│                   ┌──────▼──────┐          ┌───────▼──────┐      │
│                   │  MongoDB     │          │    Redis      │      │
│                   │  Atlas       │          │  (Upstash /   │      │
│                   │  (M10+)      │          │   Railway)    │      │
│                   └─────────────┘          └──────────────┘      │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   Cloudflare                               │    │
│  │  - DNS management for custom domains                       │    │
│  │  - SSL certificate provisioning                            │    │
│  │  - Edge caching for static assets                          │    │
│  │  - DDoS protection                                         │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

---

## 13. Key Environment Variables

```env
# Backend (.env)
NODE_ENV=production
PORT=3001

# MongoDB
MONGODB_URI=mongodb+srv://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=<random-256-bit>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OpenAI (AI Builder)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Notifications
SENDGRID_API_KEY=SG....
TWILIO_SID=...
TWILIO_AUTH_TOKEN=...

# Cloudflare (Domains)
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...

# Platform
PLATFORM_DOMAIN=bookingplatform.com
SUPER_ADMIN_EMAIL=admin@bookingplatform.com
```

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.bookingplatform.com
NEXT_PUBLIC_PLATFORM_DOMAIN=bookingplatform.com
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_...
```

---

## 14. Implementation Priority (Recommended Order)

| Phase | Modules | Goal |
|-------|---------|------|
| **Phase 1** | Auth, Tenants, Users, Services, Staff | Core multi-tenant foundation |
| **Phase 2** | Booking Engine (slots, locking, booking CRUD) | Core product — GameSpot-style logic |
| **Phase 3** | Payments, Notifications | Monetization + user engagement |
| **Phase 4** | Marketplace (geo search, categories) | Growth engine — user discovery |
| **Phase 5** | AI Website Builder | Differentiation — prompt-based site gen |
| **Phase 6** | Custom Domains, Reviews, Analytics | Polish + enterprise features |
| **Phase 7** | Super Admin Panel | Platform operations |
